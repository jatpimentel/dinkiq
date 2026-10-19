import { useMemo, useState } from "react";
import Icon from "./Icon";
import { plural } from "./helpers";
import "./Drills.css";

/* The "Drills" page: shown in the middle of the dashboard.
   Rendered inside the .dash wrapper (it uses its colors). */

function Drills({ skills, search, onOpenLesson }) {
    const [skillFilter, setSkillFilter] = useState(null); // null = all skills
    const [sort, setSort] = useState("default"); // default | shortest | longest | name

    // every drill, with the lesson and skill it belongs to
    const allDrills = useMemo(
        () =>
            skills.flatMap((skill) =>
                skill.lessons.flatMap((lesson) =>
                    lesson.drills.map((drill) => ({
                        ...drill,
                        skill: { id: skill.id, name: skill.name },
                        lesson: { ...lesson, skillName: skill.name },
                    }))
                )
            ),
        [skills]
    );

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();

        const list = allDrills.filter((d) => {
            if (skillFilter !== null && d.skill.id !== skillFilter) return false;
            if (!q) return true;
            return (
                d.name.toLowerCase().includes(q) ||
                (d.description || "").toLowerCase().includes(q) ||
                d.lesson.name.toLowerCase().includes(q) ||
                d.skill.name.toLowerCase().includes(q)
            );
        });

        if (sort === "shortest") {
            list.sort((a, b) => a.duration_minutes - b.duration_minutes);
        } else if (sort === "longest") {
            list.sort((a, b) => b.duration_minutes - a.duration_minutes);
        } else if (sort === "name") {
            list.sort((a, b) => a.name.localeCompare(b.name));
        }
        return list;
    }, [allDrills, search, skillFilter, sort]);

    const totalMinutes = visible.reduce((sum, d) => sum + d.duration_minutes, 0);

    const countFor = (skillId) =>
        allDrills.filter((d) => d.skill.id === skillId).length;

    return (
        <section className="drills-page">
            <div className="drills-head">
                <div>
                    <p className="welcome">Practice makes perfect</p>
                    <h1>Drills</h1>
                </div>

                <div className="drills-summary">
                    <span>
                        <strong>{visible.length}</strong> {visible.length === 1 ? "drill" : "drills"}
                    </span>
                    <span>
                        <strong>{totalMinutes}</strong> min total
                    </span>
                </div>
            </div>

            <div className="drills-toolbar">
                <div className="chips" role="group" aria-label="Filter by skill">
                    <button
                        className={`chip ${skillFilter === null ? "active" : ""}`}
                        onClick={() => setSkillFilter(null)}
                    >
                        All <span>{allDrills.length}</span>
                    </button>
                    {skills.map((s) => (
                        <button
                            key={s.id}
                            className={`chip ${skillFilter === s.id ? "active" : ""}`}
                            onClick={() => setSkillFilter(s.id)}
                        >
                            {s.name} <span>{countFor(s.id)}</span>
                        </button>
                    ))}
                </div>

                <label className="drills-sort">
                    Sort by
                    <select value={sort} onChange={(e) => setSort(e.target.value)}>
                        <option value="default">Skill order</option>
                        <option value="shortest">Shortest first</option>
                        <option value="longest">Longest first</option>
                        <option value="name">Name (A-Z)</option>
                    </select>
                </label>
            </div>

            {allDrills.length === 0 ? (
                <p className="dash-message">No drills have been added yet.</p>
            ) : visible.length === 0 ? (
                <p className="dash-message">No drills match your search.</p>
            ) : (
                <div className="drills-grid">
                    {visible.map((d) => (
                        <article
                            className="drill-card"
                            key={d.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onOpenLesson(d.lesson)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onOpenLesson(d.lesson);
                                }
                            }}
                        >
                            <div className="drill-top">
                                <span className="drill-duration">
                                    <Icon name="clock" size={14} />
                                    {d.duration_minutes} min
                                </span>
                                {d.lesson.completed && (
                                    <span className="drill-done" title="Lesson completed">
                                        <Icon name="check" size={13} />
                                    </span>
                                )}
                            </div>

                            <h3>{d.name}</h3>
                            <p className="drill-desc">
                                {d.description || "No description has been added yet."}
                            </p>

                            <div className="drill-foot">
                                <span className="drill-skill">{d.skill.name}</span>
                                <span className={`tag tag-${d.lesson.difficulty.id % 3}`}>
                                    {d.lesson.difficulty.name}
                                </span>
                            </div>

                            <p className="drill-lesson">
                                <Icon name="lessons" size={14} />
                                {d.lesson.name}
                            </p>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default Drills;