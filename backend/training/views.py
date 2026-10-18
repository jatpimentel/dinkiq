from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Skill,Difficulty, Lesson, Drill, UserSkillProgress, UserLessonCompletion, ContactMessage
from .serializers import SkillSerializer, DifficultySerializer, LessonSerializer, UserSkillProgressSerializer, UserLessonCompletionSerializer,ContactMessageSerializer
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from rest_framework import generics
from rest_framework.permissions import AllowAny
from django.db.models import Prefetch
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Lesson, Skill, UserLessonCompletion, UserSkillProgress
from django.utils import timezone
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

def skill_list(request):
    skills = Skill.objects.order_by("id")
    return JsonResponse({
        "skills": [
            {
                "id": s.id,
                "name": s.name,
                "description": s.description,
                "image": request.build_absolute_uri(s.image.url) if s.image else None,
            }
            for s in skills
        ]
    })

class ContactCreateView(generics.CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        completions = {
            c.lesson_id: c.completed_at
            for c in UserLessonCompletion.objects.filter(user=user)
        }
        skill_progress = {
            p.skill_id: p for p in UserSkillProgress.objects.filter(user=user)
        }

        skills_qs = Skill.objects.order_by("id").prefetch_related(
            Prefetch(
                "lesson_set",
                queryset=Lesson.objects.select_related("difficulty")
                .prefetch_related("drills")
                .order_by("id"),
            )
        )

        skills = []
        total_lessons = completed_total = drills_total = 0
        mastered = in_progress = 0

        for skill in skills_qs:
            lessons = []
            for lesson in skill.lesson_set.all():
                drills = list(lesson.drills.all())
                done_at = completions.get(lesson.id)
                lessons.append({
                    "id": lesson.id,
                    "name": lesson.name,
                    "description": lesson.description,
                    "difficulty": {
                        "id": lesson.difficulty.id,
                        "name": lesson.difficulty.name,
                    },
                    "completed": done_at is not None,
                    "completed_at": done_at.isoformat() if done_at else None,
                    "drill_count": len(drills),
                    "total_minutes": sum(d.duration_minutes for d in drills),
                    "drills": [
                        {
                            "id": d.id,
                            "name": d.name,
                            "description": d.description,
                            "duration_minutes": d.duration_minutes,
                        }
                        for d in sorted(drills, key=lambda d: d.id)
                    ],
                })
                drills_total += len(drills)

            total = len(lessons)
            done = sum(1 for l in lessons if l["completed"])
            progress = round(done / total * 100) if total else 0

            if total and done == total:
                mastered += 1
            elif done > 0:
                in_progress += 1

            total_lessons += total
            completed_total += done

            sp = skill_progress.get(skill.id)
            skills.append({
                "id": skill.id,
                "name": skill.name,
                "description": skill.description,
                "image": (
                    request.build_absolute_uri(skill.image.url)
                    if skill.image else None
                ),
                "level": sp.level if sp else "Beginner",
                "last_practiced": (
                    sp.last_practiced.isoformat()
                    if sp and sp.last_practiced else None
                ),
                "lessons_total": total,
                "lessons_completed": done,
                "progress": progress,
                "lessons": lessons,
            })

        recent = [
            {
                "lesson_id": c.lesson_id,
                "lesson": c.lesson.name,
                "skill": c.lesson.skill.name,
                "completed_at": c.completed_at.isoformat(),
            }
            for c in UserLessonCompletion.objects.filter(user=user)
            .select_related("lesson__skill")[:5]
        ]

        return Response({
            "user": {"name": user.get_full_name() or user.username},
            "stats": {
                "skills_mastered": mastered,
                "skills_in_progress": in_progress,
                "lessons_completed": completed_total,
                "total_lessons": total_lessons,
                "drills_available": drills_total,
            },
            "skills": skills,
            "recent": recent,
        })

def sync_skill_progress(user, skill, practiced=False):
    total = Lesson.objects.filter(skill=skill).count()
    done = UserLessonCompletion.objects.filter(
        user=user, lesson__skill=skill
    ).count()

    sp, _ = UserSkillProgress.objects.get_or_create(user=user, skill=skill)
    sp.progress = round(done / total * 100) if total else 0
    if practiced:
        sp.last_practiced = timezone.now()
    sp.save()


class LessonCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_id):
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        completion, _ = UserLessonCompletion.objects.get_or_create(
            user=request.user, lesson=lesson
        )
        sync_skill_progress(request.user, lesson.skill, practiced=True)
        return Response({
            "lesson_id": lesson.id,
            "completed": True,
            "completed_at": completion.completed_at.isoformat(),
        })

    def delete(self, request, lesson_id):
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        UserLessonCompletion.objects.filter(
            user=request.user, lesson=lesson
        ).delete()
        sync_skill_progress(request.user, lesson.skill)
        return Response(status=status.HTTP_204_NO_CONTENT)