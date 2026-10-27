import { useMemo, useState } from "react";
import Icon from "../Icon";
import { formatDate, plural } from "../helpers";
import "./Progress.css";

/* The "Progress" page: how far the player has come.
   Everything here is calculated from the dashboard data (your database).
   Rendered inside the .dash wrapper (it uses its colors). */

const dayKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;

function skillStatus(s) {
    if (s.lessons_total === 0) return { label: "No lessons", cls: "empty" };
    if (s.lessons_completed === s.lessons_total)
        return { label: "Mastered", cls: "mastered" };
    if (s.lessons_completed === 0) return { label: "Not started", cls: "todo" };
    return { label: "In progress", cls: "progress" };
}

const RING_RADIUS = 52;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function Progress({ skills, search, onOpenLesson, onOpenSkill }) {
    const [showAll, setShowAll] = useState(false);

    const q = search.trim().toLowerCase();
    const has = (...parts) =>
        !q || parts.some((p) => (p || "").toLowerCase().includes(q));

    const allLessons = useMemo(
        () =>
            skills.flatMap((s) =>
                s.lessons.map((l) => ({ ...l, skillName: s.name }))
            ),
        [skills]
    );

    const completed = useMemo(
        () =>
            allLessons
                .filter((l) => l.completed)
                .sort(
                    (a, b) => new Date(b.completed_at) - new Date(a.completed_at)
                ),
        [allLessons]
    );

    const totals = useMemo(() => {
        const total = allLessons.length;
        const done = completed.length;
        return {
            total,
            done,
            pct: total ? Math.round((done / total) * 100) : 0,
            mastered: skills.filter((s) => skillStatus(s).cls === "mastered").length,
            inProgress: skills.filter((s) => skillStatus(s).cls === "progress").length,
            notStarted: skills.filter((s) => skillStatus(s).cls === "todo").length,
            minutes: completed.reduce((sum, l) => sum + l.total_minutes, 0),
            drills: completed.reduce((sum, l) => sum + l.drill_count, 0),
        };
    }, [allLessons, completed, skills]);

    // lessons completed per calendar day (in the player's own time zone)
    const dayCounts = useMemo(() => {
        const map = new Map();
        completed.forEach((l) => {
            const k = dayKey(new Date(l.completed_at));
            map.set(k, (map.get(k) || 0) + 1);
        });
        return map;
    }, [completed]);

    const week = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            days.push({
                key: dayKey(d),
                label: d.toLocaleDateString(undefined, { weekday: "short" }),
                count: dayCounts.get(dayKey(d)) || 0,
                isToday: i === 0,
            });
        }
        return {
            days,
            total: days.reduce((sum, d) => sum + d.count, 0),
            max: Math.max(1, ...days.map((d) => d.count)),
        };
    }, [dayCounts]);

    // consecutive days with at least one completed lesson (today may still be empty)
    const streak = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        if (!dayCounts.has(dayKey(d))) d.setDate(d.getDate() - 1);

        let n = 0;
        while (dayCounts.has(dayKey(d))) {
            n += 1;
            d.setDate(d.getDate() - 1);
        }
        return n;
    }, [dayCounts]);

    // the first unfinished lesson of every skill
    const upNext = useMemo(
        () =>
            skills
                .map((s) => {
                    const next = s.lessons.find((l) => !l.completed);
                    return next ? { skill: s, lesson: { ...next, skillName: s.name } } : null;
                })
                .filter(Boolean)
                .filter((x) => has(x.lesson.name, x.skill.name)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [skills, q]
    );

    const visibleSkills = skills.filter((s) => has(s.name));
    const history = completed.filter((l) => has(l.name, l.skillName));
    const shownHistory = showAll ? history : history.slice(0, 6);

    if (skills.length === 0) {
        return (
            <section className="progress-page">
                <div className="progress-head">
                    <div>
                        <p className="welcome">Track how far you've come</p>
                        <h1>Progress</h1>
                    </div>
                </div>
                <p className="dash-message">No skills have been added yet.</p>
            </section>
        );
    }

    return (
        <section className="progress-page">
            <div className="progress-head">
                <div>
                    <p className="welcome">Track how far you've come</p>
                    <h1>Progress</h1>
                </div>
            </div>

            {/* ---------- overview ---------- */}
            <div className="progress-top">
                <div className="panel overall">
                    <div className="ring" role="img" aria-label={`${totals.pct}% of lessons completed`}>
                        <svg viewBox="0 0 120 120" width="132" height="132">
                            <circle
                                cx="60"
                                cy="60"
                                r={RING_RADIUS}
                                fill="none"
                                strokeWidth="11"
                                className="ring-track"
                            />
                            <circle
                                cx="60"
                                cy="60"
                                r={RING_RADIUS}
                                fill="none"
                                strokeWidth="11"
                                strokeLinecap="round"
                                className="ring-value"
                                strokeDasharray={`${(totals.pct / 100) * RING_LENGTH} ${RING_LENGTH}`}
                                transform="rotate(-90 60 60)"
                            />
                        </svg>
                        <div className="ring-text">
                            <strong>{totals.pct}%</strong>
                            <span>complete</span>
                        </div>
                    </div>

                    <div className="overall-info">
                        <h3>Overall progress</h3>
                        <p>
                            {totals.done} of {plural(totals.total, "lesson")} completed
                        </p>
                        <div className="streak">
                            <Icon name="bolt" size={15} />
                            {streak > 0
                                ? `${plural(streak, "day")} in a row`
                                : "No streak yet. Complete a lesson today!"}
                        </div>
                    </div>
                </div>

                <div className="tiles">
                    <div className="ptile">
                        <p>Skills mastered</p>
                        <strong>{totals.mastered}</strong>
                        <small>of {skills.length}</small>
                    </div>
                    <div className="ptile">
                        <p>In progress</p>
                        <strong>{totals.inProgress}</strong>
                        <small>{totals.notStarted} not started</small>
                    </div>
                    <div className="ptile">
                        <p>Practice time</p>
                        <strong>
                            {totals.minutes}
                            <em>min</em>
                        </strong>
                        <small>in completed lessons</small>
                    </div>
                    <div className="ptile">
                        <p>Drills practiced</p>
                        <strong>{totals.drills}</strong>
                        <small>in completed lessons</small>
                    </div>
                </div>
            </div>

            {/* ---------- skills + week ---------- */}
            <div className="progress-mid">
                <div className="panel">
                    <h3 className="panel-heading">Skill progress</h3>

                    {visibleSkills.length === 0 ? (
                        <p className="empty">No skills match your search.</p>
                    ) : (
                        <ul className="skill-rows">
                            {visibleSkills.map((s) => {
                                const st = skillStatus(s);
                                return (
                                    <li key={s.id}>
                                        <button
                                            className="skill-row"
                                            onClick={() => onOpenSkill(s.id)}
                                            title="See the lessons of this skill"
                                        >
                                            <div className="skill-row-top">
                                                <strong>{s.name}</strong>
                                                <span className={`status status-${st.cls}`}>
                                                    {st.label}
                                                </span>
                                            </div>

                                            <div className="pbar">
                                                <span style={{ width: `${s.progress}%` }} />
                                            </div>

                                            <div className="skill-row-bottom">
                                                <span>
                                                    {s.lessons_completed}/{s.lessons_total} lessons · {s.level}
                                                </span>
                                                <span>
                                                    {s.last_practiced
                                                        ? `Last practiced ${formatDate(s.last_practiced)}`
                                                        : "Not practiced yet"}
                                                </span>
                                                <b>{s.progress}%</b>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="panel">
                    <div className="panel-heading-row">
                        <h3 className="panel-heading">Last 7 days</h3>
                        <span className="week-total">
                            {plural(week.total, "lesson")}
                        </span>
                    </div>

                    <div className="week-chart">
                        {week.days.map((d) => (
                            <div
                                className={`week-col ${d.isToday ? "today" : ""}`}
                                key={d.key}
                                title={`${d.label}: ${plural(d.count, "lesson")}`}
                            >
                                <span className="week-count">{d.count || ""}</span>
                                <div className="week-track">
                                    <span
                                        className={`week-bar ${d.count === 0 ? "none" : ""}`}
                                        style={{
                                            height:
                                                d.count === 0
                                                    ? "4px"
                                                    : `${(d.count / week.max) * 100}%`,
                                        }}
                                    />
                                </div>
                                <span className="week-label">{d.label}</span>
                            </div>
                        ))}
                    </div>

                    {week.total === 0 && (
                        <p className="empty">No lessons completed this week yet.</p>
                    )}
                </div>
            </div>

            {/* ---------- up next + history ---------- */}
            <div className="progress-bottom">
                <div className="panel">
                    <h3 className="panel-heading">Up next</h3>

                    {upNext.length === 0 ? (
                        <p className="empty">
                            {q
                                ? "Nothing matches your search."
                                : "You've completed every lesson. Great work!"}
                        </p>
                    ) : (
                        <ul className="next-list">
                            {upNext.map(({ skill, lesson }) => (
                                <li key={lesson.id}>
                                    <button
                                        className="next-item"
                                        onClick={() => onOpenLesson(lesson)}
                                    >
                                        <div>
                                            <small>{skill.name}</small>
                                            <strong>{lesson.name}</strong>
                                            <span>
                                                {plural(lesson.drill_count, "drill")} ·{" "}
                                                {lesson.total_minutes} min
                                            </span>
                                        </div>
                                        <i className={`tag tag-${lesson.difficulty.id % 3}`}>
                                            {lesson.difficulty.name}
                                        </i>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="panel">
                    <h3 className="panel-heading">Completed lessons</h3>

                    {history.length === 0 ? (
                        <p className="empty">
                            {q
                                ? "Nothing matches your search."
                                : "No lessons completed yet."}
                        </p>
                    ) : (
                        <>
                            <ul className="history-list">
                                {shownHistory.map((l) => (
                                    <li key={l.id}>
                                        <button
                                            className="history-item"
                                            onClick={() => onOpenLesson(l)}
                                        >
                                            <span className="history-check">
                                                <Icon name="check" size={13} />
                                            </span>
                                            <div>
                                                <strong>{l.name}</strong>
                                                <p>{l.skillName}</p>
                                            </div>
                                            <time>{formatDate(l.completed_at)}</time>
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            {history.length > 6 && (
                                <button
                                    className="show-more"
                                    onClick={() => setShowAll((v) => !v)}
                                >
                                    {showAll ? "Show less" : `Show all ${history.length}`}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}

export default Progress;