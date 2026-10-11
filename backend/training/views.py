from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Skill,Difficulty, Lesson, Drill, UserSkillProgress, UserLessonCompletion
from .serializers import SkillSerializer, DifficultySerializer, LessonSerializer, UserSkillProgressSerializer, UserLessonCompletionSerializer
from rest_framework.permissions import IsAuthenticated
# Create your views here.

@api_view(['POST'])
def register(request):
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "Username and passowrd are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    return Response(
        {
            "message": "User created successfully.",
            "username": user.username,
        },
        status=status.HTTP_201_CREATED
    )



@api_view(['GET'])
def skills(request):
    skills = Skill.objects.all()
    serializer = SkillSerializer(skills, many=True)

    return Response(serializer.data)

@api_view(['GET'])
def difficulties(request):
    difficulties = Difficulty.objects.all()
    serializer = DifficultySerializer(difficulties, many=True)

    return Response(serializer.data)

@api_view(['GET'])
def lessons(request):
    lessons = Lesson.objects.all()
    serializer = LessonSerializer(lessons, many=True)

    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_progress(request):
    progress = UserSkillProgress.objects.filter(
        user = request.user
    )

    serializer = UserSkillProgressSerializer(
        progress,
        many=True
    )

    return Response(serializer.data)


def update_skill_progress(user, skill):
    total_lessons = Lesson.objects.filter(skill=skill).count()

    progress_record, _ = UserSkillProgress.objects.get_or_create(
        user=user,
        skill=skill,
        defaults={'level': 'Beginner', 'progress': 0}
    )

    if total_lessons == 0:
        progress_record.progress = 0
    else:
        completed_lessons = UserLessonCompletion.objects.filter(
            user=user,
            lesson__skill=skill
        ).count()

        progress_record.progress = round(
            completed_lessons / total_lessons * 100
        )

    progress_record.save()
    
@api_view(['GET','POST'])
@permission_classes([IsAuthenticated])
def lesson_completions(request):
    if request.method == "GET":
        completions = UserLessonCompletion.object.filter(
            user=request.user
        )
        serializer = UserLessonCompletionSerializer(
            completions,
            many=True
        )
        serializer = UserLessonCompletionSerializer(
            completions,
            many=True
        )
        return Response(serializer.data)

    lesson_id = request.data.get('lesson_id')

    if not lesson_id:
        return Response(
            {'error': 'lesson_id is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    lesson = get_object_or_404(Lesson, id=lesson_id)

    
    completion, created = UserLessonCompletion.objects.get_or_create(
        user=request.user,
        lesson=lesson
    )

    update_skill_progress(request.user, lesson.skill)

    serializer = UserLessonCompletionSerializer(completion)

    return Response(
        {
            'message': (
                'Lesson marked as completed.'
                if created
                else 'Lesson was already completed.'
            ),
            'completion': serializer.data
        },
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
    )
