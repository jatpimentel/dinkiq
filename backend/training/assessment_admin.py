"""
Django admin screens for the skill assessment tables.

This file registers itself with the admin when it is imported (admin.py imports it).
It also replaces the plain Drill admin with one that can link focus areas to a drill
and refuses focus areas that belong to a different skill.
"""
from django import forms
from django.contrib import admin, messages
from django.contrib.admin.sites import NotRegistered
from django.db.models import Count
from django.forms.models import BaseInlineFormSet
from django.template import engines
from django.template.response import TemplateResponse

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


class FocusActionForm(forms.Form):
    """The small form shown after you pick 'Add a focus area' in the Drills list."""

    _selected_action = forms.CharField(widget=forms.MultipleHiddenInput)
    focus = forms.ModelChoiceField(
        queryset=TrainingFocus.objects.select_related("skill"),
        label="Focus area",
    )


# the confirmation page (uses the normal admin look)
FOCUS_ACTION_PAGE = engines["django"].from_string(
    """
{% extends "admin/base_site.html" %}
{% block content %}
<form method="post">
  {% csrf_token %}
  <p>{{ question }}</p>
  <ul>
    {% for drill in drills %}
    <li>{{ drill.name }} <small>({{ drill.lesson.skill.name }}: {{ drill.lesson.name }})</small></li>
    {% endfor %}
  </ul>
  {{ form.as_p }}
  <input type="hidden" name="action" value="{{ action_name }}">
  <input type="hidden" name="apply" value="1">
  <input type="submit" value="{{ button }}">
  <a href="{{ back_url }}" class="button cancel-link">Cancel</a>
</form>
{% endblock %}
"""
)


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
    actions = ["add_focus_area", "remove_focus_area"]

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("focus_areas")

    def _focus_action(self, request, queryset, mode):
        """Shared by the add and remove actions."""
        drills = list(queryset.select_related("lesson__skill"))
        skill_ids = {d.lesson.skill_id for d in drills}
        adding = mode == "add"

        if "apply" in request.POST:
            form = FocusActionForm(request.POST)
        else:
            form = FocusActionForm(initial={"_selected_action": [d.pk for d in drills]})
        form.fields["focus"].queryset = TrainingFocus.objects.filter(
            skill_id__in=skill_ids
        ).select_related("skill")

        if "apply" in request.POST and form.is_valid():
            focus = form.cleaned_data["focus"]
            wrong = [d.name for d in drills if d.lesson.skill_id != focus.skill_id]
            if wrong:
                self.message_user(
                    request,
                    f"'{focus.name}' belongs to the skill {focus.skill.name}, but these drills "
                    f"belong to another skill: {', '.join(wrong)}. Nothing was changed.",
                    messages.ERROR,
                )
                return None
            for drill in drills:
                if adding:
                    drill.focus_areas.add(focus)
                else:
                    drill.focus_areas.remove(focus)
            self.message_user(
                request,
                f"{'Added' if adding else 'Removed'} the focus area '{focus.name}' "
                f"{'to' if adding else 'from'} {len(drills)} drill(s).",
                messages.SUCCESS,
            )
            return None

        context = {
            **self.admin_site.each_context(request),
            "title": "Add a focus area" if adding else "Remove a focus area",
            "question": (
                "Add a focus area to these drills:"
                if adding
                else "Remove a focus area from these drills:"
            ),
            "drills": drills,
            "form": form,
            "action_name": f"{mode}_focus_area",
            "button": "Add focus area" if adding else "Remove focus area",
            "back_url": request.get_full_path(),
            "opts": self.model._meta,
        }
        return TemplateResponse(request, FOCUS_ACTION_PAGE, context)

    @admin.action(description="Add a focus area to the selected drills")
    def add_focus_area(self, request, queryset):
        return self._focus_action(request, queryset, "add")

    @admin.action(description="Remove a focus area from the selected drills")
    def remove_focus_area(self, request, queryset):
        return self._focus_action(request, queryset, "remove")

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