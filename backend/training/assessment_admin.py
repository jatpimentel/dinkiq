"""
Django admin screens for the skill assessment tables.

This file registers itself with the admin when it is imported (admin.py imports it).
It also replaces the plain Drill admin with one that can link focus areas to a drill
and refuses focus areas that belong to a different skill.
"""
from django import forms
from django.contrib import admin
from django.contrib.admin.sites import NotRegistered
from django.db.models import Count
from django.forms.models import BaseInlineFormSet

from .models import (
    Assessment,
    AssessmentAttempt,
    AssessmentChallenge,
    AssessmentChallengeResult,
    Drill,
    TrainingFocus,
)


# ---------------------------------------------------------------- focus areas
@admin.register(TrainingFocus)
class TrainingFocusAdmin(admin.ModelAdmin):
    list_display = ("name", "skill")
    list_filter = ("skill",)
    search_fields = ("name", "skill__name")
    list_select_related = ("skill",)


# ---------------------------------------------------------------- assessments
class ChallengeInlineFormSet(BaseInlineFormSet):
    """Every challenge must measure a focus area of the assessment's own skill."""

    def clean(self):
        super().clean()
        skill_id = getattr(self.instance, "skill_id", None)
        if not skill_id:
            return
        for form in self.forms:
            data = getattr(form, "cleaned_data", None)
            if not data or data.get("DELETE"):
                continue
            focus = data.get("focus")
            if focus and focus.skill_id != skill_id:
                form.add_error(
                    "focus", "This focus area belongs to a different skill than the assessment."
                )


class AssessmentChallengeInline(admin.StackedInline):
    model = AssessmentChallenge
    formset = ChallengeInlineFormSet
    extra = 1
    fields = (("order", "title"), ("focus", "max_score"), "instructions")


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("title", "skill", "is_active", "challenge_count")
    list_filter = ("skill", "is_active")
    search_fields = ("title", "skill__name")
    list_select_related = ("skill",)
    inlines = [AssessmentChallengeInline]

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_challenges=Count("challenges"))

    @admin.display(description="Challenges", ordering="_challenges")
    def challenge_count(self, obj):
        return obj._challenges


# ---------------------------------------------------------------- drills
class DrillAdminForm(forms.ModelForm):
    class Meta:
        model = Drill
        fields = "__all__"

    def clean(self):
        cleaned = super().clean()
        lesson = cleaned.get("lesson")
        focus_areas = cleaned.get("focus_areas")
        if lesson and focus_areas:
            wrong = [f.name for f in focus_areas if f.skill_id != lesson.skill_id]
            if wrong:
                self.add_error(
                    "focus_areas",
                    "These focus areas belong to a different skill than the lesson: "
                    + ", ".join(wrong),
                )
        return cleaned


class HasFocusFilter(admin.SimpleListFilter):
    """Handy for finding the drills that still need a focus area."""

    title = "focus area"
    parameter_name = "has_focus"

    def lookups(self, request, model_admin):
        return (("yes", "Has a focus area"), ("no", "No focus area yet"))

    def queryset(self, request, queryset):
        if self.value() == "yes":
            return queryset.filter(focus_areas__isnull=False).distinct()
        if self.value() == "no":
            return queryset.filter(focus_areas__isnull=True)
        return queryset


try:  # admin.py registered a plain Drill admin before importing this file
    admin.site.unregister(Drill)
except NotRegistered:
    pass


@admin.register(Drill)
class DrillAdmin(admin.ModelAdmin):
    form = DrillAdminForm
    list_display = ("name", "lesson", "duration_minutes", "focus_list")
    list_filter = (HasFocusFilter, "lesson__skill")
    search_fields = ("name", "lesson__name", "lesson__skill__name")
    list_select_related = ("lesson__skill",)
    filter_horizontal = ("focus_areas",)

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("focus_areas")

    @admin.display(description="Focus areas")
    def focus_list(self, obj):
        return ", ".join(f.name for f in obj.focus_areas.all()) or "-"


# ---------------------------------------------------------------- history (read only)
class ResultInline(admin.TabularInline):
    model = AssessmentChallengeResult
    extra = 0
    can_delete = False
    readonly_fields = ("challenge", "score", "percentage")

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(AssessmentAttempt)
class AssessmentAttemptAdmin(admin.ModelAdmin):
    """Players' assessment history. View only, so history can't be changed by accident."""

    list_display = ("user", "assessment", "overall_score", "suggested_difficulty", "completed_at")
    list_filter = ("assessment__skill", "assessment")
    list_select_related = ("user", "assessment", "suggested_difficulty")
    readonly_fields = ("user", "assessment", "overall_score", "suggested_difficulty", "completed_at")
    inlines = [ResultInline]

    def has_add_permission(self, request):
        return False

