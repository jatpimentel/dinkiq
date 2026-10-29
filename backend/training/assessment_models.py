"""
Skill assessment models for DinkIQ.

New tables:  TrainingFocus, Assessment, AssessmentChallenge,
             AssessmentAttempt, AssessmentChallengeResult
Changed:     Difficulty gets an optional `level`, Drill gets `focus_areas`
             (those two lines live in models.py, see the instructions).

Nothing here deletes or rewrites existing data. Attempts are never overwritten:
every retake is a new AssessmentAttempt.
"""
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models.signals import m2m_changed
from django.dispatch import receiver

from .models import Difficulty, Drill, Skill


def _check(condition, name):
    """CheckConstraint that works on Django 5.1+ (condition=) and older (check=)."""
    try:
        return models.CheckConstraint(condition=condition, name=name)
    except TypeError:  # Django < 5.1
        return models.CheckConstraint(check=condition, name=name)


PERCENT_VALIDATORS = [MinValueValidator(Decimal("0")), MaxValueValidator(Decimal("100"))]


class TrainingFocus(models.Model):
    """A thing a player can be good or bad at inside one skill (Accuracy, Footwork...)."""

    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name="focus_areas")
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["skill_id", "name"]
        verbose_name = "training focus area"
        verbose_name_plural = "training focus areas"
        constraints = [
            models.UniqueConstraint(fields=["skill", "name"], name="assess_unique_focus_per_skill"),
        ]

    def __str__(self):
        return f"{self.skill.name}: {self.name}"


class Assessment(models.Model):
    """A set of challenges that measures one skill."""

    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name="assessments")
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(
        default=True,
        help_text="Untick to hide the assessment. Do not delete it: that would remove players' history.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["skill_id", "title"]

    def __str__(self):
        return self.title


class AssessmentChallenge(models.Model):
    """One thing the player does on court and reports (e.g. 7 of 10 dinks in the target)."""

    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name="challenges")
    focus = models.ForeignKey(
        TrainingFocus,
        on_delete=models.PROTECT,
        related_name="challenges",
        help_text="Which area this challenge measures. It must belong to the same skill as the assessment.",
    )
    title = models.CharField(max_length=150)
    instructions = models.TextField()
    max_score = models.PositiveSmallIntegerField(
        default=10,
        validators=[MinValueValidator(1), MaxValueValidator(1000)],
        help_text="Number of attempts (or the highest possible score).",
    )
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["assessment_id", "order", "id"]
        constraints = [
            _check(models.Q(max_score__gte=1), "assess_challenge_max_score_positive"),
        ]

    def clean(self):
        super().clean()
        if self.focus_id and self.assessment_id and self.focus.skill_id != self.assessment.skill_id:
            raise ValidationError(
                {"focus": "This focus area belongs to a different skill than the assessment."}
            )

    def save(self, *args, **kwargs):
        self.clean()  # keeps the skill rule true even outside the admin
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class AssessmentAttempt(models.Model):
    """One time a user took an assessment. A retake is a new row, never an update."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="assessment_attempts")
    assessment = models.ForeignKey(Assessment, on_delete=models.PROTECT, related_name="attempts")
    completed_at = models.DateTimeField(auto_now_add=True)
    overall_score = models.DecimalField(max_digits=4 + 1, decimal_places=1, validators=PERCENT_VALIDATORS)
    suggested_difficulty = models.ForeignKey(
        Difficulty, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    class Meta:
        ordering = ["-completed_at", "-id"]
        indexes = [models.Index(fields=["user", "assessment", "-completed_at"], name="assess_attempt_lookup")]
        constraints = [
            _check(
                models.Q(overall_score__gte=0) & models.Q(overall_score__lte=100),
                "assess_attempt_score_range",
            ),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.assessment.title} ({self.overall_score}%)"


class AssessmentChallengeResult(models.Model):
    attempt = models.ForeignKey(AssessmentAttempt, on_delete=models.CASCADE, related_name="results")
    challenge = models.ForeignKey(AssessmentChallenge, on_delete=models.PROTECT, related_name="results")
    score = models.PositiveSmallIntegerField(help_text="Successful attempts / points earned.")
    percentage = models.DecimalField(max_digits=4 + 1, decimal_places=1, validators=PERCENT_VALIDATORS)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["attempt", "challenge"], name="assess_one_result_per_challenge"),
            _check(
                models.Q(percentage__gte=0) & models.Q(percentage__lte=100),
                "assess_result_percentage_range",
            ),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.challenge_id and self.score is not None and self.score > self.challenge.max_score:
            errors["score"] = f"The score cannot be higher than {self.challenge.max_score}."
        if (
            self.attempt_id
            and self.challenge_id
            and self.challenge.assessment_id != self.attempt.assessment_id
        ):
            errors["challenge"] = "This challenge belongs to a different assessment."
        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"{self.challenge.title}: {self.score}/{self.challenge.max_score}"


@receiver(m2m_changed, sender=Drill.focus_areas.through)
def drill_focus_must_match_skill(sender, instance, action, reverse, pk_set, **kwargs):
    """A drill may only target focus areas of its own skill."""
    if action != "pre_add" or not pk_set:
        return

    if reverse:  # focus.drills.add(...): instance is a TrainingFocus
        wrong = Drill.objects.filter(pk__in=pk_set).exclude(lesson__skill_id=instance.skill_id)
    else:  # drill.focus_areas.add(...): instance is a Drill
        wrong = TrainingFocus.objects.filter(pk__in=pk_set).exclude(skill_id=instance.lesson.skill_id)

    if wrong.exists():
        raise ValidationError("A drill can only target focus areas of its own skill.")