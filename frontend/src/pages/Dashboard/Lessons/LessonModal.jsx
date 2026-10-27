import { useEffect, useRef, useState } from "react";
import Icon from "../Icon";
import DrillTimer from "../Drills/DrillTimer";
import { formatDate, formatLongDate } from "../helpers";
import "./LessonModal.css";

/* Popup with the full details of one lesson.
   Render it inside the .dash wrapper (it uses its colors). */

function LessonModal({ lesson, onClose, onToggleComplete }) {
    const closeRef = useRef(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [timerDrill, setTimerDrill] = useState(null); // drill shown in the timer popup

    const handleToggle = async () => {
        setSaving(true);
        setError("");
        const ok = await onToggleComplete(lesson);
        if (!ok) setError("Could not update this lesson. Please try again.");
        setSaving(false);
    };

    useEffect(() => {
        closeRef.current?.focus();
    }, []);

    return (
        <>
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="lesson-modal-title"
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

                <p className="modal-skill">{lesson.skillName}</p>
                <h2 id="lesson-modal-title">{lesson.name}</h2>

                <div className="tags">
                    <span className={`tag tag-${lesson.difficulty.id % 3}`}>
                        {lesson.difficulty.name}
                    </span>
                    <span
                        className={`tag ${lesson.completed ? "tag-done" : "tag-todo"}`}
                    >
                        {lesson.completed ? "Done" : "To Do"}
                    </span>
                </div>

                <p className="modal-desc">
                    {lesson.description || "No description has been added yet."}
                </p>

                <div className="modal-stats">
                    <div>
                        <strong>{lesson.drill_count}</strong>
                        <span>{lesson.drill_count === 1 ? "Drill" : "Drills"}</span>
                    </div>
                    <div>
                        <strong>{lesson.total_minutes}</strong>
                        <span>Minutes</span>
                    </div>
                    <div>
                        <strong>
                            {lesson.completed ? formatDate(lesson.completed_at) : "-"}
                        </strong>
                        <span>Completed</span>
                    </div>
                </div>

                <h3 className="modal-subtitle">Drills in this lesson</h3>
                {lesson.drills.length === 0 ? (
                    <p className="empty">No drills have been added yet.</p>
                ) : (
                    <ol className="drill-list">
                        {lesson.drills.map((d, i) => (
                            <li key={d.id}>
                                <span className="drill-num">{i + 1}</span>
                                <div>
                                    <strong>{d.name}</strong>
                                    {d.description && <p>{d.description}</p>}
                                </div>
                                <span className="drill-time">
                                    <Icon name="clock" size={13} />
                                    {d.duration_minutes} min
                                </span>
                                <button
                                    className="drill-start"
                                    onClick={() => setTimerDrill(d)}
                                    aria-label={`Start the timer for ${d.name}`}
                                >
                                    <Icon name="play" size={12} />
                                    Start
                                </button>
                            </li>
                        ))}
                    </ol>
                )}

                {lesson.completed && (
                    <p className="modal-footnote">
                        You completed this lesson on{" "}
                        {formatLongDate(lesson.completed_at)}.
                    </p>
                )}

                <div className="modal-actions">
                    <button
                        className={`modal-complete ${lesson.completed ? "is-done" : ""}`}
                        onClick={handleToggle}
                        disabled={saving}
                    >
                        {saving ? (
                            "Saving..."
                        ) : lesson.completed ? (
                            "Mark as not completed"
                        ) : (
                            <>
                                <Icon name="check" size={16} /> Mark as completed
                            </>
                        )}
                    </button>
                    {error && (
                        <p className="modal-error" role="alert">
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </div>

        {timerDrill && (
            <DrillTimer
                drill={timerDrill}
                lessonName={lesson.name}
                skillName={lesson.skillName}
                onClose={() => setTimerDrill(null)}
            />
        )}
        </>
    );
}

export default LessonModal;