"""
API views for skill assessments and drill recommendations.

A view receives a request from React, uses a serializer to check or shape the data,
calls the scoring/recommendation services, and returns JSON.
Every view here requires a logged-in user (the same JWT login as the rest of DinkIQ).
"""
from django.db.models import Count, Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .assessment_serializers import (
    AssessmentDetailSerializer,
    AssessmentListSerializer,
    AssessmentSubmitSerializer,
)
from .models import Assessment, AssessmentAttempt, AssessmentChallenge, Skill
from .services import assessments as assessment_service
from .services import recommendations as recommendation_service


def active_assessments():
    """Active assessments with their challenges loaded in as few queries as possible."""
    return Assessment.objects.filter(is_active=True).select_related("skill").prefetch_related(
        Prefetch("challenges", queryset=AssessmentChallenge.objects.select_related("focus"))
    )


def whole_number_param(request, name):
    value = request.query_params.get(name)
    if value in (None, ""):
        return None
    try:
        return int(value)
    except ValueError:
        raise ValidationError({name: "Must be a whole number."})


class AuthenticatedAPIView(APIView):
    permission_classes = [IsAuthenticated]


class AssessmentListView(AuthenticatedAPIView):
    """GET /api/assessments/  - the available assessments and the user's progress on each."""

    def get(self, request):
        assessments = (
            Assessment.objects.filter(is_active=True)
            .select_related("skill")
            .annotate(challenge_count=Count("challenges"))
            .filter(challenge_count__gt=0)  # an assessment without challenges can't be taken
            .order_by("skill__name", "title")
        )

        progress = {}
        attempts = AssessmentAttempt.objects.filter(
            user=request.user, assessment__in=assessments
        ).order_by("-completed_at", "-id")
        for attempt in attempts:  # newest first, so the first one seen is the latest
            info = progress.setdefault(
                attempt.assessment_id,
                {
                    "attempts": 0,
                    "latest_attempt_id": attempt.id,
                    "latest_score": float(attempt.overall_score),
                    "latest_completed_at": attempt.completed_at,
                },
            )
            info["attempts"] += 1

        serializer = AssessmentListSerializer(
            assessments, many=True, context={"progress": progress}
        )
        return Response(serializer.data)


class AssessmentDetailView(generics.RetrieveAPIView):
    """GET /api/assessments/<id>/  - one assessment with all its challenges."""

    permission_classes = [IsAuthenticated]
    serializer_class = AssessmentDetailSerializer

    def get_queryset(self):
        return active_assessments()


class AssessmentSubmitView(AuthenticatedAPIView):
    """POST /api/assessments/<id>/submit/  - save a finished assessment and return the results."""

    def post(self, request, pk):
        assessment = get_object_or_404(active_assessments(), pk=pk)

        serializer = AssessmentSubmitSerializer(
            data=request.data, context={"assessment": assessment}
        )
        serializer.is_valid(raise_exception=True)

        try:
            attempt = assessment_service.submit_assessment(
                request.user, assessment, serializer.answers()
            )
        except ValueError as error:  # the serializer should have caught it already
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        payload = assessment_service.build_attempt_payload(attempt)
        payload["recommendations"] = recommendation_service.get_recommendations(attempt)
        return Response(payload, status=status.HTTP_201_CREATED)


class AssessmentHistoryView(AuthenticatedAPIView):
    """GET /api/assessments/history/?skill=<id>&assessment=<id>  - the user's past attempts."""

    def get(self, request):
        history = assessment_service.build_history(
            request.user,
            skill_id=whole_number_param(request, "skill"),
            assessment_id=whole_number_param(request, "assessment"),
        )
        return Response(history)


class AssessmentAttemptDetailView(AuthenticatedAPIView):
    """GET /api/assessments/attempts/<id>/  - the results of one attempt (own attempts only)."""

    def get(self, request, pk):
        # filtering by user means someone else's attempt simply "does not exist" (404)
        attempt = get_object_or_404(
            AssessmentAttempt.objects.filter(user=request.user).select_related(
                "assessment__skill", "suggested_difficulty", "user"
            ),
            pk=pk,
        )
        payload = assessment_service.build_attempt_payload(attempt)
        payload["recommendations"] = recommendation_service.get_recommendations(attempt)
        return Response(payload)


class SkillRecommendationsView(AuthenticatedAPIView):
    """GET /api/skills/<id>/recommendations/  - drills for the latest assessment of this skill."""

    def get(self, request, pk):
        skill = get_object_or_404(Skill, pk=pk)
        attempt = recommendation_service.get_latest_attempt(request.user, skill)
        if attempt is None:
            return Response(recommendation_service.empty_result("no_assessment", skill))
        return Response(recommendation_service.get_recommendations(attempt))


class RecommendationsView(AuthenticatedAPIView):
    """GET /api/recommendations/  - drills for the user's most recent assessment (dashboard)."""

    def get(self, request):
        attempt = recommendation_service.get_latest_attempt(request.user)
        if attempt is None:
            return Response(recommendation_service.empty_result("no_assessment"))
        return Response(recommendation_service.get_recommendations(attempt))