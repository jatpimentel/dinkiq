"""
Personalized drill recommendations (no HTTP in here).

The ranking is deterministic and explainable:

    priority = 0.60 * weakness + 0.25 * difficulty_fit + 0.15 * novelty      (each 0-100)

* weakness       = 100 - the player's score in the focus area the drill trains
                   (the weakest one, if the drill trains several assessed areas).
* difficulty_fit = how well the drill's difficulty matches the difficulty suggested by
                   the assessment. Same level = 100, one easier = 75, two easier = 50,
                   further easier = 25, one harder = 60. Two or more levels harder are
                   NOT recommended at all.
* novelty        = a neutral 50 for every drill. DinkIQ does not record which drills a
                   player has practiced yet, so nothing is invented. When drill practice
                   history exists, only novelty_scores() has to change.

Only drills of the assessed skill that are linked to one of the player's weak focus areas
(score of 90% or less) are considered. Ties are broken by drill id, so the same data always
gives the same list.
"""
from ..models import AssessmentAttempt, Drill
from .assessments import focus_scores, ordered_difficulties

WEIGHT_WEAKNESS = 0.60
WEIGHT_DIFFICULTY = 0.25
WEIGHT_NOVELTY = 0.15

MIN_WEAKNESS = 10        # focus areas scoring above 90% count as strengths
NOVELTY_NEUTRAL = 50.0   # used until drill practice history is recorded
DEFAULT_LIMIT = 5
MAX_LEVELS_ABOVE = 1     # never recommend drills 2+ levels above the player

EMPTY_MESSAGES = {
    "no_assessment": "Take a skill assessment to get drills picked for you.",
    "no_weaknesses": "Great job! Every area scored above 90%, so there is nothing urgent to work on. Retake the assessment later to check your progress.",
    "no_matching_drills": "No drills are linked to your weak areas yet. They will show up here once drills are linked to these focus areas.",
}


def difficulty_fit(levels_above_player):
    """0-100 score for a drill that is `levels_above_player` levels above the player's level."""
    if levels_above_player > MAX_LEVELS_ABOVE:
        return None  # too hard: excluded
    table = {1: 60.0, 0: 100.0, -1: 75.0, -2: 50.0}
    return table.get(levels_above_player, 25.0)


def novelty_scores(user, drills):
    """Hook for practice history. Every drill gets the same neutral score for now."""
    return {drill.id: NOVELTY_NEUTRAL for drill in drills}


def _fit_sentence(levels_above, player_level_name):
    if levels_above == 0:
        return f"It matches your {player_level_name} level."
    if levels_above > 0:
        return f"It is one step above your {player_level_name} level, a good challenge."
    return f"It is below your {player_level_name} level, which is good for building solid basics."


def explain(skill_name, focus, focus_score, is_weakest, fit_sentence):
    lowest = ", your lowest area" if is_weakest else ""
    focus_text = f" ({focus['description']})" if focus.get("description") else ""
    return (
        f"Your {focus['name']} score was {focus_score:g}% in the {skill_name} assessment{lowest}. "
        f"This drill trains {focus['name'].lower()}{focus_text}. {fit_sentence}"
    )


def get_latest_attempt(user, skill=None):
    attempts = AssessmentAttempt.objects.filter(user=user).select_related(
        "assessment__skill", "suggested_difficulty"
    )
    if skill is not None:
        attempts = attempts.filter(assessment__skill=skill)
    return attempts.order_by("-completed_at", "-id").first()


def empty_result(reason, skill=None):
    return {
        "has_assessment": reason != "no_assessment",
        "skill": {"id": skill.id, "name": skill.name} if skill else None,
        "attempt": None,
        "suggested_difficulty": None,
        "weak_areas": [],
        "recommendations": [],
        "empty_reason": reason,
        "message": EMPTY_MESSAGES[reason],
    }


def get_recommendations(attempt, limit=DEFAULT_LIMIT):
    """Top drills for the weaknesses found in `attempt`."""
    skill = attempt.assessment.skill
    scores = focus_scores(attempt)
    weak = {s["id"]: s for s in scores if 100 - s["score"] >= MIN_WEAKNESS}

    result = {
        "has_assessment": True,
        "skill": {"id": skill.id, "name": skill.name},
        "attempt": {
            "id": attempt.id,
            "completed_at": attempt.completed_at,
            "overall_score": float(attempt.overall_score),
            "assessment": attempt.assessment.title,
        },
        "suggested_difficulty": (
            {"id": attempt.suggested_difficulty.id, "name": attempt.suggested_difficulty.name}
            if attempt.suggested_difficulty
            else None
        ),
        "weak_areas": [
            {"id": s["id"], "name": s["name"], "score": s["score"]} for s in weak.values()
        ],
        "recommendations": [],
        "empty_reason": None,
        "message": "",
    }

    if not weak:
        result.update(empty_reason="no_weaknesses", message=EMPTY_MESSAGES["no_weaknesses"])
        return result

    levels = ordered_difficulties(skill)
    rank = {d.id: i for i, d in enumerate(levels)}
    player = attempt.suggested_difficulty
    player_rank = rank.get(player.id, 0) if player else 0
    player_name = player.name if player else "current"
    weakest_id = scores[0]["id"]

    drills = list(
        Drill.objects.filter(lesson__skill=skill, focus_areas__in=list(weak))
        .select_related("lesson__skill", "lesson__difficulty")
        .prefetch_related("focus_areas")
        .distinct()
    )
    novelty = novelty_scores(attempt.user, drills)

    ranked = []
    for drill in drills:
        fit = difficulty_fit(rank.get(drill.lesson.difficulty_id, player_rank) - player_rank)
        if fit is None:
            continue

        # the weakest assessed area this drill trains
        targets = [f for f in drill.focus_areas.all() if f.id in weak]
        target = min(targets, key=lambda f: (weak[f.id]["score"], f.id))
        focus_score = weak[target.id]["score"]
        weakness = 100 - focus_score

        priority = (
            WEIGHT_WEAKNESS * weakness
            + WEIGHT_DIFFICULTY * fit
            + WEIGHT_NOVELTY * novelty[drill.id]
        )
        levels_above = rank.get(drill.lesson.difficulty_id, player_rank) - player_rank
        ranked.append(
            {
                "drill_id": drill.id,
                "name": drill.name,
                "description": drill.description,
                "duration_minutes": drill.duration_minutes,
                "skill": {"id": skill.id, "name": skill.name},
                "lesson": {"id": drill.lesson_id, "name": drill.lesson.name},
                "difficulty": {
                    "id": drill.lesson.difficulty_id,
                    "name": drill.lesson.difficulty.name,
                },
                "focus": {"id": target.id, "name": target.name},
                "focus_score": focus_score,
                "priority": round(priority, 1),
                "breakdown": {
                    "weakness": round(weakness, 1),
                    "difficulty_fit": fit,
                    "novelty": novelty[drill.id],
                },
                "explanation": explain(
                    skill.name,
                    {"name": target.name, "description": target.description},
                    focus_score,
                    target.id == weakest_id,
                    _fit_sentence(levels_above, player_name),
                ),
            }
        )

    if not ranked:
        result.update(empty_reason="no_matching_drills", message=EMPTY_MESSAGES["no_matching_drills"])
        return result

    ranked.sort(key=lambda r: (-r["priority"], r["drill_id"]))
    result["recommendations"] = ranked[:limit]
    return result