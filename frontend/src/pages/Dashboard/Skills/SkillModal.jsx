import { useEffect, useRef } from "react";
import Icon from "../Icon";
import { formatDate, plural } from "../helpers";
import "../Lessons/LessonModal";
import "../Skills/SkillModal.css";

/* Popup with the full details of one skill.
   Render it inside the .dash wrapper (it uses its colors). */

function SkillModal({ skill, onClose, onViewLessons }) {
    const closeRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    // focus the close button, close on Escape, lock the page scroll behind
    useEffect(() => {
        closeRef.current?.focus();

        const onKey = (e) => {
            if (e.key === "Escape") onCloseRef.current();
        };
        document.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, []);

    const totalMinutes = skill.lessons.reduce((sum, l) => sum + l.total_minutes, 0);
    const totalDrills = skill.lessons.reduce((sum, l) => sum + l.drill_count, 0);
    const mastered =
        skill.lessons_total > 0 && skill.lessons_completed === skill.lessons_total;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="skill-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    ref={closeRef}
                    className="modal-close"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <Icon name="close" size={18} />
                </button>

                {skill.image && (
                    <div className="skill-modal-banner">
                        <img src={skill.image} alt={skill.name} decoding="async" />
                    </div>
                )}

                <p className="modal-skill">Skill</p>
                <h2 id="skill-modal-title">{skill.name}</h2>

                <div className="tags">
                    <span className="tag tag-0">{skill.level}</span>
                    {mastered && <span className="tag tag-done">Mastered</span>}
                </div>

                <p className="modal-desc">
                    {skill.description || "No description has been added yet."}
                </p>

                <div className="modal-stats">
                    <div>
                        <strong>{skill.progress}%</strong>
                        <span>Progress</span>
                    </div>
                    <div>
                        <strong>
                            {skill.lessons_completed}/{skill.lessons_total}
                        </strong>
                        <span>Lessons done</span>
                    </div>
                    <div>
                        <strong>{totalMinutes}</strong>
                        <span>Minutes of drills</span>
                    </div>
                </div>

                <h3 className="modal-subtitle">
                    What you'll learn
                    <small>
                        {plural(skill.lessons_total, "lesson")} ·{" "}
                        {plural(totalDrills, "drill")}
                    </small>
                </h3>

                {skill.lessons.length === 0 ? (
                    <p className="empty">
                        No lessons have been added to this skill yet.
                    </p>
                ) : (
                    <ul className="skill-lessons">
                        {skill.lessons.map((l) => (
                            <li key={l.id} className={l.completed ? "is-done" : ""}>
                                <span className="skill-lesson-state">
                                    {l.completed && <Icon name="check" size={13} />}
                                </span>
                                <div>
                                    <strong>{l.name}</strong>
                                    <p>
                                        {plural(l.drill_count, "drill")} ·{" "}
                                        {l.total_minutes} min
                                    </p>
                                </div>
                                <span className={`tag tag-${l.difficulty.id % 3}`}>
                                    {l.difficulty.name}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                <p className="modal-footnote muted-note">
                    {skill.last_practiced
                        ? `Last practiced ${formatDate(skill.last_practiced)}`
                        : "You haven't practiced this skill yet."}
                </p>

                {skill.lessons.length > 0 && (
                    <div className="modal-actions">
                        <button className="modal-complete" onClick={onViewLessons}>
                            Go to lessons
                            <Icon name="arrow" size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SkillModal;