from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Skill(models.Model):
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Difficulty(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class Lesson(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE
    )

    difficulty = models.ForeignKey(
        Difficulty,
        on_delete=models.PROTECT
    )

    def __str__(self):
        return self.name

class Drill(models.Model):
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=100)
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="drills"
    )
    duration_minutes = models.PositiveIntegerField(default=10)

    def __str__(self):
        return self.name

class UserSkillProgress(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE
    )

    level = models.CharField(
        max_length=50,
        default='Beginner'
    )

    progress = models.PositiveIntegerField(
        default=0
    )

    last_practiced = models.DateTimeField(
        null=True,
        blank=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'skill'],
                name='unique_user_skill_progress'
            )
        ]
        
    def __str__(self):
        return f"{self.user.username} - {self.skill.name}"
