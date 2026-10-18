import { useState } from "react";
import Icon from "./Icon";
import SkillModal from "./SkillModal";
import { formatDate, plural } from "./helpers";
import "./Skills.css";

/* The "Skills" page: shown in the middle of the dashboard.
   Rendered inside the .dash wrapper (it uses its colors). */

function Skills({ skills, search, onOpenSkill }) {
    const [selected, setSelected] = useState(null); // skill shown in the popup
    const q = search.trim().toLowerCase();

    const visible = skills.filter(
        (s) =>
            !q ||
            s.name.toLowerCase().includes(q) ||
            (s.description || "").toLowerCase().includes(q)
    );

    return (
        <section className="skills-page">
            <div className="skills-head">
                <div>
                    <p className="welcome">Everything you can learn</p>
                    <h1>Skills</h1>
                </div>
                <p className="skills-count">{plural(visible.length, "skill")}</p>
            </div>

            {skills.length === 0 ? (
                <p className="dash-message">No skills have been added yet.</p>
            ) : visible.length === 0 ? (
                <p className="dash-message">No skills match your search.</p>
            ) : (
                <div className="skills-grid">
                    {visible.map((skill) => {
                        const mastered =
                            skill.lessons_total > 0 &&
                            skill.lessons_completed === skill.lessons_total;

                        return (
                            <article className="skill-card" key={skill.id}>
                                <div className="skill-image">
                                    {skill.image ? (
                                        <img
                                            src={skill.image}
                                            alt={skill.name}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <div className="skill-image-fallback" />
                                    )}
                                    <span className="skill-level">{skill.level}</span>
                                    {mastered && (
                                        <span className="skill-mastered">
                                            <Icon name="check" size={13} /> Mastered
                                        </span>
                                    )}
                                </div>

                                <div className="skill-body">
                                    <h3>{skill.name}</h3>
                                    <p className="skill-desc">
                                        {skill.description ||
                                            "No description has been added yet."}
                                    </p>

                                    <div className="skill-progress">
                                        <div className="bar">
                                            <span style={{ width: `${skill.progress}%` }} />
                                        </div>
                                        <div className="skill-stats">
                                            <span>
                                                {skill.lessons_completed}/{skill.lessons_total}{" "}
                                                lessons
                                            </span>
                                            <strong>{skill.progress}%</strong>
                                        </div>
                                    </div>

                                    <p className="skill-practiced">
                                        {skill.last_practiced
                                            ? `Last practiced ${formatDate(skill.last_practiced)}`
                                            : "Not practiced yet"}
                                    </p>

                                    <button
                                        className="skill-btn"
                                        onClick={() => setSelected(skill)}
                                    >
                                        Learn more
                                        <Icon name="arrow" size={16} />
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {selected && (
                <SkillModal
                    skill={selected}
                    onClose={() => setSelected(null)}
                    onViewLessons={() => {
                        const id = selected.id;
                        setSelected(null);
                        onOpenSkill(id);
                    }}
                />
            )}
        </section>
    );
}

export default Skills;