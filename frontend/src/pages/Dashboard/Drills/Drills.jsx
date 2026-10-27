import { useMemo, useState } from "react";
import Icon from "../Icon";
import DrillTimer from "./DrillTimer";
import { plural } from "../helpers";
import "./Drills.css";

/* The "Drills" page, organized as: Skill -> Lesson -> numbered drills.
   Rendered inside the .dash wrapper (it uses its colors). */

function Drills({ skills, search, onOpenLesson }) {
    const [skillFilter, setSkillFilter] = useState(null); // null = all skills
    const [collapsed, setCollapsed] = useState(() => new Set());
    const [timer, setTimer] = useState(null); // drill shown in the timer popup

    const q = search.trim().toLowerCase();

    const totalDrills = useMemo(
        () =>
            skills.reduce(
                (sum, s) => sum + s.lessons.reduce((n, l) => n + l.drills.length, 0),
                0
            ),
        [skills]
    );

    // skills -> lessons -> drills, after the skill filter and the search
    const groups = useMemo(() => {
        const has = (...parts) =>
            parts.some((p) => (p || "").toLowerCase().includes(q));

        return skills
            .filter((s) => skillFilter === null || s.id === skillFilter)
            .map((skill) => {
                const lessons = skill.lessons
                    .map((lesson) => {
                        // a search that matches the lesson or skill name keeps all its drills
                        const lessonMatch =
                            !q || has(lesson.name, skill.name, lesson.difficulty.name);

                        const shown = lesson.drills
                            .map((d, i) => ({ ...d, n: i + 1 }))
                            .filter((d) => lessonMatch || has(d.name, d.description));

                        return {
                            ...lesson,
                            skillName: skill.name,
                            shown,
                            minutes: shown.reduce((sum, d) => sum + d.duration_minutes, 0),
                        };
                    })
                    .filter((l) => !q || l.shown.length > 0);

                return {
                    ...skill,
                    lessons,
                    drillCount: lessons.reduce((n, l) => n + l.shown.length, 0),
                    minutes: lessons.reduce((n, l) => n + l.minutes, 0),
                };
            })
            .filter((g) => !q || g.lessons.length > 0);
    }, [skills, skillFilter, q]);

    const visibleDrills = groups.reduce((n, g) => n + g.drillCount, 0);
    const visibleMinutes = groups.reduce((n, g) => n + g.minutes, 0);

    const allCollapsed = groups.length > 0 && groups.every((g) => collapsed.has(g.id));

    const toggleGroup = (id) =>
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const toggleAll = () =>
        setCollapsed(allCollapsed ? new Set() : new Set(groups.map((g) => g.id)));

    const drillsIn = (skill) =>
        skill.lessons.reduce((n, l) => n + l.drills.length, 0);

    return (
        <section className="drills-page">
            <div className="drills-head">
                <div>
                    <p className="welcome">Practice makes perfect</p>
                    <h1>Drills</h1>
                </div>

                <div className="drills-summary">
                    <span>
                        <strong>{visibleDrills}</strong> {visibleDrills === 1 ? "drill" : "drills"}
                    </span>
                    <span>
                        <strong>{visibleMinutes}</strong> min total
                    </span>
                </div>
            </div>

            <div className="drills-toolbar">
                <div className="chips" role="group" aria-label="Filter by skill">
                    <button
                        className={`chip ${skillFilter === null ? "active" : ""}`}
                        onClick={() => setSkillFilter(null)}
                    >
                        All <span>{totalDrills}</span>
                    </button>
                    {skills.map((s) => (
                        <button
                            key={s.id}
                            className={`chip ${skillFilter === s.id ? "active" : ""}`}
                            onClick={() => setSkillFilter(s.id)}
                        >
                            {s.name} <span>{drillsIn(s)}</span>
                        </button>
                    ))}
                </div>

                {groups.length > 1 && (
                    <button className="dr-toggle-all" onClick={toggleAll}>
                        {allCollapsed ? "Expand all" : "Collapse all"}
                    </button>
                )}
            </div>

            {totalDrills === 0 ? (
                <p className="dash-message">No drills have been added yet.</p>
            ) : groups.length === 0 ? (
                <p className="dash-message">No drills match your search.</p>
            ) : (
                <div className="dr-list">
                    {groups.map((g) => {
                        const isCollapsed = collapsed.has(g.id);

                        return (
                            <section className="dr-skill" key={g.id}>
                                <button
                                    className="dr-skill-head"
                                    onClick={() => toggleGroup(g.id)}
                                    aria-expanded={!isCollapsed}
                                >
                                    <span className={`dr-chevron ${isCollapsed ? "closed" : ""}`}>
                                        <Icon name="chevron" size={16} />
                                    </span>
                                    <h2>{g.name}</h2>
                                    <span className="dr-skill-meta">
                                        {plural(g.lessons.length, "lesson")} ·{" "}
                                        {plural(g.drillCount, "drill")} · {g.minutes} min
                                    </span>
                                </button>

                                {!isCollapsed && (
                                    <div className="dr-skill-body">
                                        {g.lessons.length === 0 ? (
                                            <p className="dr-none">
                                                No lessons in this skill yet.
                                            </p>
                                        ) : (
                                            g.lessons.map((l) => (
                                                <article className="dr-lesson" key={l.id}>
                                                    <header className="dr-lesson-head">
                                                        <div className="dr-lesson-title">
                                                            <button
                                                                className="dr-lesson-link"
                                                                onClick={() => onOpenLesson(l)}
                                                                title="Open this lesson"
                                                            >
                                                                {l.name}
                                                                <Icon name="arrow" size={14} />
                                                            </button>
                                                            <i className={`tag tag-${l.difficulty.id % 3}`}>
                                                                {l.difficulty.name}
                                                            </i>
                                                            <i
                                                                className={`tag ${l.completed ? "tag-done" : "tag-todo"}`}
                                                            >
                                                                {l.completed ? "Done" : "To Do"}
                                                            </i>
                                                        </div>

                                                        <span className="dr-lesson-time">
                                                            <Icon name="clock" size={14} />
                                                            {l.minutes} min
                                                        </span>
                                                    </header>

                                                    {l.shown.length === 0 ? (
                                                        <p className="dr-none">
                                                            No drills in this lesson yet.
                                                        </p>
                                                    ) : (
                                                        <ol className="dr-drills">
                                                            {l.shown.map((d) => (
                                                                <li key={d.id}>
                                                                    <span className="dr-num">{d.n}</span>
                                                                    <div>
                                                                        <strong>{d.name}</strong>
                                                                        {d.description && <p>{d.description}</p>}
                                                                    </div>
                                                                    <div className="dr-actions">
                                                                        <span className="dr-time">
                                                                            {d.duration_minutes} min
                                                                        </span>
                                                                        <button
                                                                            className="dr-start"
                                                                            onClick={() =>
                                                                                setTimer({
                                                                                    drill: d,
                                                                                    lessonName: l.name,
                                                                                    skillName: g.name,
                                                                                })
                                                                            }
                                                                            aria-label={`Start the timer for ${d.name}`}
                                                                        >
                                                                            <Icon name="play" size={12} />
                                                                            Start
                                                                        </button>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ol>
                                                    )}
                                                </article>
                                            ))
                                        )}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}

            {timer && (
                <DrillTimer
                    drill={timer.drill}
                    lessonName={timer.lessonName}
                    skillName={timer.skillName}
                    onClose={() => setTimer(null)}
                />
            )}
        </section>
    );
}

export default Drills;