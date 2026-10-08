from rest_framework import serializers
from .models import Skill,Difficulty,Lesson,Drill,UserSkillProgress

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'description']

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