from rest_framework import serializers
from .models import Skill,Difficulty,Lesson,Drill,UserSkillProgress,UserLessonCompletion,ContactMessage

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'description', 'image']

class DifficultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Difficulty
        fields = ['id', 'name']

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'name', 'skill', 'difficulty']

class DrillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Drill
        fields = ['id', 'name', 'lesson', 'duration_minutes']

class UserSkillProgressSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(
        source='skill.name',
        read_only=True
    )
    class Meta:
        model = UserSkillProgress
        fields = ['id', 'skill', 'skill_name', 'level', 'progress', 'last_practiced']

class UserLessonCompletionSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(
        source='lesson.name',
        read_only=True
    )
    skill_name = serializers.CharField(
        source='lesson.skill.name',
        read_only=True
    )

    class Meta:
        model = UserLessonCompletion
        fields = [
            'id',
            'lesson',
            'lesson_title',
            'skill_name',
            'completed_at'
        ]
        read_only_fields = [
            'id',
            'lesson_title',
            'skill_name',
            'completed_at'
        ]

# serializers.py
class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["name", "email", "message"]