"""
Serializers for the skill assessment API.

A serializer does two jobs:
  * turns database rows into JSON for React (Assessment...Serializer), and
  * checks the data React sends back (AssessmentSubmitSerializer).
"""
from rest_framework import serializers

from .models import Assessment, AssessmentChallenge


class AssessmentChallengeSerializer(serializers.ModelSerializer):
    focus = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentChallenge
        fields = ["id", "order", "title", "instructions", "max_score", "focus"]

    def get_focus(self, obj):
        return {"id": obj.focus_id, "name": obj.focus.name, "description": obj.focus.description}


class AssessmentListSerializer(serializers.ModelSerializer):
    """One card on the assessment selection page. The view adds `my_progress` info."""

    skill = serializers.SerializerMethodField()
    challenge_count = serializers.IntegerField(read_only=True)
    my_progress = serializers.SerializerMethodField()

    class Meta:
        model = Assessment
        fields = ["id", "title", "description", "skill", "challenge_count", "my_progress"]

    def get_skill(self, obj):
        return {"id": obj.skill_id, "name": obj.skill.name}

    def get_my_progress(self, obj):
        # the view passes {assessment_id: {...}} for the logged-in user
        return self.context.get("progress", {}).get(
            obj.id,
            {
                "attempts": 0,
                "latest_attempt_id": None,
                "latest_score": None,
                "latest_completed_at": None,
            },
        )


class AssessmentDetailSerializer(serializers.ModelSerializer):
    skill = serializers.SerializerMethodField()
    challenges = AssessmentChallengeSerializer(many=True, read_only=True)

    class Meta:
        model = Assessment
        fields = ["id", "title", "description", "skill", "challenges"]

    def get_skill(self, obj):
        return {"id": obj.skill_id, "name": obj.skill.name}


class ChallengeAnswerSerializer(serializers.Serializer):
    challenge = serializers.IntegerField()
    score = serializers.IntegerField(min_value=0)


class AssessmentSubmitSerializer(serializers.Serializer):
    """
    What React sends:  {"results": [{"challenge": 3, "score": 7}, ...]}

    Rules: every challenge of the assessment answered exactly once, no unknown or duplicate
    challenges, and every score between 0 and that challenge's maximum.
    The view passes the assessment in the context.
    """

    results = ChallengeAnswerSerializer(many=True, allow_empty=False)

    def validate_results(self, results):
        challenges = {c.id: c for c in self.context["assessment"].challenges.all()}
        seen = set()

        for item in results:
            challenge_id = item["challenge"]
            if challenge_id in seen:
                raise serializers.ValidationError(
                    f"Challenge {challenge_id} was sent more than once."
                )
            seen.add(challenge_id)

            challenge = challenges.get(challenge_id)
            if challenge is None:
                raise serializers.ValidationError(
                    f"Challenge {challenge_id} does not belong to this assessment."
                )
            if item["score"] > challenge.max_score:
                raise serializers.ValidationError(
                    f"The score for '{challenge.title}' cannot be higher than {challenge.max_score}."
                )

        missing = [c.title for cid, c in challenges.items() if cid not in seen]
        if missing:
            raise serializers.ValidationError(
                "Please answer every challenge. Missing: " + ", ".join(missing) + "."
            )
        return results

    def answers(self):
        """{challenge_id: score}, the form the scoring service expects."""
        return {item["challenge"]: item["score"] for item in self.validated_data["results"]}