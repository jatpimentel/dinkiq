from django.db import models
from django.contrib.auth.models import User
from PIL import Image, ImageOps
from io import BytesIO
from django.core.files.base import ContentFile

# Create your models here.
class Skill(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="skills/", blank=True)
    
    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Only resize when a new file was just uploaded
        if self.image and not self.image._committed:
            img = Image.open(self.image)
            img_format = img.format or "JPEG"
            if img.height > 800 or img.width > 800:
                img.thumbnail((800, 800))
            buffer = BytesIO()
            if img_format.upper() in ("JPEG", "JPG") and img.mode != "RGB":
                img = img.convert("RGB")
            img.save(buffer, format=img_format)
            self.image = ContentFile(buffer.getvalue(), name=self.image.name)
        super().save(*args, **kwargs)

class Difficulty(models.Model):
    name = models.CharField(max_length=50)
    level = models.PositiveSmallIntegerField(
        default=0,
        help_text="Optional order from easiest (1) to hardest. 0 = use the name (Beginner, Novice...).",
    )

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
    description = models.TextField(blank=True)
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="drills"
    )
    duration_minutes = models.PositiveIntegerField(default=10)
    focus_areas = models.ManyToManyField(
        "training.TrainingFocus",
        blank=True,
        related_name="drills",
    )
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

class UserLessonCompletion(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='lesson_completions'
    )

    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='user_completions'
    )
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user','lesson'],
                name='unique_user_lesson_completion'
            )
        ]
        ordering = ['-completed_at']

    def __str__(self):
        return f"{self.user.username} completed {self.lesson.name}"

# models.py
class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.email}"



# Skill assessment tables (keep this at the very bottom of the file)
from .assessment_models import (  # noqa: E402,F401
    Assessment,
    AssessmentAttempt,
    AssessmentChallenge,
    AssessmentChallengeResult,
    TrainingFocus,
)