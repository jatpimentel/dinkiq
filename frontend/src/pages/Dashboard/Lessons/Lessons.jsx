import { useMemo, useState } from "react";
import Icon from "../Icon";
import { formatDate, plural } from "../helpers";
import "./Lessons.css";

/* The "Lessons" page: every lesson, organized by skill, in clean rows.
   Rendered inside the .dash wrapper (it uses its colors). */

function Lessons({ skills, search, onOpenLesson }) {
    const [status, setStatus] = useState("all"); // all | todo | done
    const [skillFilter, setSkillFilter] = useState(null); // null = all skills
    const [difficultyFilter, setDifficultyFilter] = useState("all");
    const [sort, setSort] = useState("default"); // default | name | shortest | longest
    const [collapsed, setCollapsed] = useState(() => new Set());

    const allLessons = useMemo(() => skills.flatMap((s) => s.lessons), [skills]);

    const difficulties = useMemo(() => {
        const map = new Map();
        allLessons.forEach((l) => map.set(l.difficulty.id, l.difficulty));
        return [...map.values()];
    }, [allLessons]);

    const counts = useMemo(() => {
        const done = allLessons.filter((l) => l.completed).length;
        return {
            all: allLessons.length,
            done,
            todo: allLessons.length - done,
            minutes: allLessons.reduce((sum, l) => sum + l.total_minutes, 0),
        };
    }, [allLessons]);

    // lessons grouped by skill, after applying the filters, search and sort
    const groups = useMemo(() => {
        const q = search.trim().toLowerCase();

        const sorters = {
            name: (a, b) => a.name.localeCompare(b.name),
            shortest: (a, b) => a.total_minutes - b.total_minutes,
            longest: (a, b) => b.total_minutes - a.total_minutes,
        };

        return skills
            .filter((s) => skillFilter === null || s.id === skillFilter)
            .map((s) => {
                const visible = s.lessons.filter((l) => {
                    if (status === "todo" && l.completed) return false;
                    if (status === "done" && !l.completed) return false;
                    if (
                        difficultyFilter !== "all" &&
                        String(l.difficulty.id) !== difficultyFilter
                    )
                        return false;
                    if (!q) return true;
                    return (
                        l.name.toLowerCase().includes(q) ||
                        (l.description || "").toLowerCase().includes(q) ||
                        s.name.toLowerCase().includes(q) ||
                        l.difficulty.name.toLowerCase().includes(q)
                    );
                });
                if (sorters[sort]) visible.sort(sorters[sort]);
                return { ...s, visible };
            })
            .filter((g) => g.visible.length > 0);
    }, [skills, search, status, skillFilter, difficultyFilter, sort]);

    const visibleCount = groups.reduce((sum, g) => sum + g.visible.length, 0);

    const toggleGroup = (id) =>
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    return (
        <section className="lessons-page">
            <div className="lessons-head">
                <div>
                    <p className="welcome">Your full learning path</p>
                    <h1>Lessons</h1>
                </div>

                <div className="lessons-summary">
                    <span>
                        <strong>{counts.done}</strong> of <strong>{counts.all}</strong> completed
                    </span>
                    <span>
                        <strong>{counts.minutes}</strong> min of drills
                    </span>
                </div>
            </div>

            <div className="lessons-toolbar">
                <div className="status-tabs" role="tablist">
                    {[
                        { key: "all", label: "All", count: counts.all },
                        { key: "todo", label: "To Do", count: counts.todo },
                        { key: "done", label: "Completed", count: counts.done },
                    ].map((t) => (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={status === t.key}
                            className={`status-tab ${status === t.key ? "active" : ""}`}
                            onClick={() => setStatus(t.key)}
                        >
                            {t.label}
                            <span>{t.count}</span>
                        </button>
                    ))}
                </div>

                <div className="lessons-selects">
                    <label>
                        Skill
                        <select
                            value={skillFilter ?? "all"}
                            onChange={(e) =>
                                setSkillFilter(
                                    e.target.value === "all" ? null : Number(e.target.value)
                                )
                            }
                        >
                            <option value="all">All skills</option>
                            {skills.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Difficulty
                        <select
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                        >
                            <option value="all">All levels</option>
                            {difficulties.map((d) => (
                                <option key={d.id} value={String(d.id)}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Sort
                        <select value={sort} onChange={(e) => setSort(e.target.value)}>
                            <option value="default">Course order</option>
                            <option value="name">Name (A-Z)</option>
                            <option value="shortest">Shortest first</option>
                            <option value="longest">Longest first</option>
                        </select>
                    </label>
                </div>
            </div>

            {allLessons.length === 0 ? (
                <p className="dash-message">No lessons have been added yet.</p>
            ) : visibleCount === 0 ? (
                <p className="dash-message">No lessons match your filters.</p>
            ) : (
                <>
                    <p className="lessons-result">
                        Showing {plural(visibleCount, "lesson")}
                    </p>

                    <div className="lessons-table">
                        <div className="lrow lrow-head" aria-hidden="true">
                            <span />
                            <span>Lesson</span>
                            <span>Difficulty</span>
                            <span className="col-drills">Drills</span>
                            <span className="col-time">Time</span>
                            <span>Status</span>
                            <span />
                        </div>

                        {groups.map((g) => {
                            const isCollapsed = collapsed.has(g.id);
                            return (
                                <section className="lesson-group" key={g.id}>
                                    <button
                                        className="group-head"
                                        onClick={() => toggleGroup(g.id)}
                                        aria-expanded={!isCollapsed}
                                    >
                                        <span className={`group-chevron ${isCollapsed ? "closed" : ""}`}>
                                            <Icon name="chevron" size={16} />
                                        </span>
                                        <h2>{g.name}</h2>
                                        <span className="group-count">{g.visible.length}</span>

                                        <span className="group-progress">
                                            <span className="bar">
                                                <span style={{ width: `${g.progress}%` }} />
                                            </span>
                                            <small>
                                                {g.lessons_completed}/{g.lessons_total} done · {g.progress}%
                                            </small>
                                        </span>
                                    </button>

                                    {!isCollapsed &&
                                        g.visible.map((l) => (
                                            <div
                                                className={`lrow lrow-item ${l.completed ? "is-done" : ""}`}
                                                key={l.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() =>
                                                    onOpenLesson({ ...l, skillName: g.name })
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        onOpenLesson({ ...l, skillName: g.name });
                                                    }
                                                }}
                                            >
                                                <span className="lrow-state">
                                                    {l.completed && <Icon name="check" size={13} />}
                                                </span>

                                                <div className="lrow-main">
                                                    <strong>{l.name}</strong>
                                                    {l.description && <p>{l.description}</p>}
                                                </div>

                                                <span>
                                                    <i className={`tag tag-${l.difficulty.id % 3}`}>
                                                        {l.difficulty.name}
                                                    </i>
                                                </span>

                                                <span className="lrow-cell col-drills">
                                                    <Icon name="drills" size={14} />
                                                    {l.drill_count}
                                                </span>

                                                <span className="lrow-cell col-time">
                                                    <Icon name="clock" size={14} />
                                                    {l.total_minutes} min
                                                </span>

                                                <span className="lrow-status">
                                                    {l.completed ? (
                                                        <>
                                                            <i className="tag tag-done">Done</i>
                                                            <small>{formatDate(l.completed_at)}</small>
                                                        </>
                                                    ) : (
                                                        <i className="tag tag-todo">To Do</i>
                                                    )}
                                                </span>

                                                <span className="lrow-go">
                                                    <Icon name="arrow" size={15} />
                                                </span>
                                            </div>
                                        ))}
                                </section>
                            );
                        })}
                    </div>
                </>
            )}
        </section>
    );
}

export default Lessons;