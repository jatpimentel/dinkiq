from django.db import models

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