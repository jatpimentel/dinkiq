from django.db import models
from django.contrib.auth.models import User
from PIL import Image, ImageOps

# Create your models here.
class Skill(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="skills/", blank=True)
    
    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.image:
            img = Image.open(self.image.path)
            img = ImageOps.exif_transpose(img)  # fix phone photos that load sideways
            if max(img.size) > 1200:
                img.thumbnail((1200, 1200))
                img.save(self.image.path, quality=85, optimize=True)

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
        return f"{self.user.username} completed {self.lesson.title}"

# models.py
class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.email}"