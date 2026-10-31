"""
Scoring and history for skill assessments (no HTTP in here).

How scores are calculated
-------------------------
* Challenge percentage = score / max_score * 100.
* Focus-area score     = (sum of scores) / (sum of max scores) * 100 over the challenges
                         of that focus area, so a 10-attempt challenge counts more than a
                         5-attempt one.
* Overall score        = the same weighted formula over all challenges.
* Suggested difficulty = the overall score is split into equal bands, one band for every
                         difficulty that the skill's lessons really use
                         (6 levels -> 0-16.6% Beginner, 16.7-33.3% Novice, ...).
Assessment scores come only from assessments. Finishing lessons or drills never changes them.
"""
from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.db.models import Q

from ..models import (
    AssessmentAttempt,
    AssessmentChallengeResult,
    Difficulty,
    Lesson,
    UserSkillProgress,
)

# Used when a Difficulty has no explicit `level`. Anything else sorts after these, by id.
KNOWN_DIFFICULTY_ORDER = {
    "beginner": 1,
    "novice": 2,
    "high novice": 3,
    "intermediate": 4,
    "high intermediate": 5,
    "advanced": 6,
}


def difficulty_sort_key(difficulty):
    level = difficulty.level or KNOWN_DIFFICULTY_ORDER.get(difficulty.name.strip().lower(), 1000)
    return (level, difficulty.id)


def ordered_difficulties(skill):
    """The difficulties used by this skill's lessons, easiest first (all of them if none)."""
    used = Lesson.objects.filter(skill=skill).values_list("difficulty_id", flat=True).distinct()
    found = list(Difficulty.objects.filter(id__in=list(used)))
    if not found:
        found = list(Difficulty.objects.all())
    return sorted(found, key=difficulty_sort_key)


def suggest_difficulty(skill, overall_score):
    """Map an overall score (0-100) to one of the skill's difficulties."""
    levels = ordered_difficulties(skill)
    if not levels:
        return None
    index = min(len(levels) - 1, int(float(overall_score) / 100 * len(levels)))
    return levels[index]


def _percent(earned, possible):
    if not possible:
        return Decimal("0.0")
    return (Decimal(earned) * 100 / Decimal(possible)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)


@transaction.atomic
def submit_assessment(user, assessment, answers):
    """
    Save one attempt and all its results in a single transaction.

    `answers` is {challenge_id: score}. The serializer already checked it; the checks
    here are a second line of defence, so bad data can never be written.
    """
    challenges = {c.id: c for c in assessment.challenges.all()}

    if not challenges or set(answers) != set(challenges):
        raise ValueError("Every challenge of the assessment must be answered exactly once.")

    earned_total = possible_total = 0
    rows = []
    for challenge_id, score in answers.items():
        challenge = challenges[challenge_id]
        if not 0 <= score <= challenge.max_score:
            raise ValueError(f"Score for '{challenge.title}' must be between 0 and {challenge.max_score}.")
        earned_total += score
        possible_total += challenge.max_score
        rows.append((challenge, score))

    overall = _percent(earned_total, possible_total)
    suggested = suggest_difficulty(assessment.skill, overall)

    attempt = AssessmentAttempt.objects.create(
        user=user,
        assessment=assessment,
        overall_score=overall,
        suggested_difficulty=suggested,
    )
    AssessmentChallengeResult.objects.bulk_create(
        [
            AssessmentChallengeResult(
                attempt=attempt,
                challenge=challenge,
                score=score,
                percentage=_percent(score, challenge.max_score),
            )
            for challenge, score in rows
        ]
    )

    # The skill level shown on the dashboard now reflects the player's measured level.
    if suggested:
        progress, _ = UserSkillProgress.objects.get_or_create(user=user, skill=assessment.skill)
        progress.level = suggested.name
        progress.save(update_fields=["level"])

    return attempt


def focus_scores(attempt):
    """Score per focus area for one attempt, weakest first."""
    buckets = {}
    for result in attempt.results.select_related("challenge__focus"):
        focus = result.challenge.focus
        bucket = buckets.setdefault(focus.id, {"focus": focus, "earned": 0, "possible": 0})
        bucket["earned"] += result.score
        bucket["possible"] += result.challenge.max_score

    scores = [
        {
            "id": b["focus"].id,
            "name": b["focus"].name,
            "description": b["focus"].description,
            "score": float(_percent(b["earned"], b["possible"])),
            "earned": b["earned"],
            "possible": b["possible"],
        }
        for b in buckets.values()
    ]
    scores.sort(key=lambda s: (s["score"], s["id"]))
    return scores


def previous_attempt(attempt):
    """The attempt of the same user and assessment just before this one, if any."""
    return (
        AssessmentAttempt.objects.filter(user=attempt.user, assessment=attempt.assessment)
        .filter(
            Q(completed_at__lt=attempt.completed_at)
            | Q(completed_at=attempt.completed_at, id__lt=attempt.id)
        )
        .order_by("-completed_at", "-id")
        .first()
    )


def compare_attempts(previous, latest_scores, latest_overall):
    """Change since the previous attempt, in percentage points."""
    if previous is None:
        return None

    before = {s["id"]: s["score"] for s in focus_scores(previous)}
    focus_changes = [
        {
            "id": s["id"],
            "name": s["name"],
            "previous": before[s["id"]],
            "latest": s["score"],
            "change": round(s["score"] - before[s["id"]], 1),
        }
        for s in latest_scores
        if s["id"] in before
    ]
    previous_overall = float(previous.overall_score)
    return {
        "previous_attempt_id": previous.id,
        "previous_completed_at": previous.completed_at,
        "overall": {
            "previous": previous_overall,
            "latest": float(latest_overall),
            "change": round(float(latest_overall) - previous_overall, 1),
        },
        "focus_areas": focus_changes,
    }


def build_attempt_payload(attempt):
    """Everything the results page needs for one attempt (without the recommendations)."""
    attempt = (
        AssessmentAttempt.objects.select_related(
            "assessment__skill", "suggested_difficulty"
        ).get(pk=attempt.pk)
    )
    scores = focus_scores(attempt)
    results = [
        {
            "challenge_id": r.challenge_id,
            "title": r.challenge.title,
            "focus": r.challenge.focus.name,
            "score": r.score,
            "max_score": r.challenge.max_score,
            "percentage": float(r.percentage),
        }
        for r in attempt.results.select_related("challenge__focus").order_by(
            "challenge__order", "challenge_id"
        )
    ]
    suggested = attempt.suggested_difficulty

    return {
        "id": attempt.id,
        "completed_at": attempt.completed_at,
        "overall_score": float(attempt.overall_score),
        "assessment": {"id": attempt.assessment_id, "title": attempt.assessment.title},
        "skill": {"id": attempt.assessment.skill_id, "name": attempt.assessment.skill.name},
        "suggested_difficulty": {"id": suggested.id, "name": suggested.name} if suggested else None,
        "focus_areas": scores,
        "weakest": scores[0] if scores else None,
        "strongest": scores[-1] if scores else None,
        "challenges": results,
        "comparison": compare_attempts(previous_attempt(attempt), scores, attempt.overall_score),
    }


def build_history(user, skill_id=None, assessment_id=None, limit=100):
    """The user's attempts, newest first, each with its change since the attempt before it."""
    attempts = (
        AssessmentAttempt.objects.filter(user=user)
        .select_related("assessment__skill", "suggested_difficulty")
        .prefetch_related("results__challenge__focus")
    )
    if skill_id:
        attempts = attempts.filter(assessment__skill_id=skill_id)
    if assessment_id:
        attempts = attempts.filter(assessment_id=assessment_id)
    attempts = list(attempts)

    def scores_of(attempt):
        buckets = {}
        for r in attempt.results.all():
            b = buckets.setdefault(
                r.challenge.focus_id,
                {"id": r.challenge.focus_id, "name": r.challenge.focus.name, "earned": 0, "possible": 0},
            )
            b["earned"] += r.score
            b["possible"] += r.challenge.max_score
        out = [
            {"id": b["id"], "name": b["name"], "score": float(_percent(b["earned"], b["possible"]))}
            for b in buckets.values()
        ]
        out.sort(key=lambda s: (s["score"], s["id"]))
        return out

    # oldest first, so every attempt can be compared with the one before it
    earlier = {}
    changes = {}
    for attempt in sorted(attempts, key=lambda a: (a.completed_at, a.id)):
        scores = scores_of(attempt)
        before = earlier.get(attempt.assessment_id)
        changes[attempt.id] = (
            round(float(attempt.overall_score) - before, 1) if before is not None else None
        )
        earlier[attempt.assessment_id] = float(attempt.overall_score)
        attempt._scores = scores

    history = []
    for attempt in attempts[:limit]:
        suggested = attempt.suggested_difficulty
        history.append(
            {
                "id": attempt.id,
                "completed_at": attempt.completed_at,
                "overall_score": float(attempt.overall_score),
                "change_since_previous": changes[attempt.id],
                "assessment": {"id": attempt.assessment_id, "title": attempt.assessment.title},
                "skill": {"id": attempt.assessment.skill_id, "name": attempt.assessment.skill.name},
                "suggested_difficulty": {"id": suggested.id, "name": suggested.name} if suggested else None,
                "focus_areas": attempt._scores,
            }
        )
    return history