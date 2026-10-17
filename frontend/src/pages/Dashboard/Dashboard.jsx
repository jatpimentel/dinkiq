import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api"; // adjust the path to where your api.js is
import "./Dashboard.css";

/* ---------- small helpers ---------- */

function Icon({ name, size = 18 }) {
    const props = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };

    switch (name) {
        case "overview":
            return (
                <svg {...props}>
                    <path d="M3 11l9-8 9 8M5 10v10h14V10" />
                </svg>
            );
        case "skills":
            return (
                <svg {...props}>
                    <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" />
                </svg>
            );
        case "lessons":
            return (
                <svg {...props}>
                    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13" />
                </svg>
            );
        case "drills":
            return (
                <svg {...props}>
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4" />
                </svg>
            );
        case "progress":
            return (
                <svg {...props}>
                    <path d="M3 3v18h18M7 15l4-4 3 3 5-6" />
                </svg>
            );
        case "settings":
            return (
                <svg {...props}>
                    <path d="M4 6h8m4 0h4M4 12h2m4 0h10M4 18h10m4 0h2" />
                    <circle cx="14" cy="6" r="2" />
                    <circle cx="8" cy="12" r="2" />
                    <circle cx="16" cy="18" r="2" />
                </svg>
            );
        case "search":
            return (
                <svg {...props}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-4-4" />
                </svg>
            );
        case "board":
            return (
                <svg {...props}>
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            );
        case "list":
            return (
                <svg {...props}>
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
            );
        case "clock":
            return (
                <svg {...props}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                </svg>
            );
        case "check":
            return (
                <svg {...props}>
                    <path d="M5 12l5 5 9-10" />
                </svg>
            );
        case "hash":
            return (
                <svg {...props}>
                    <path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16" />
                </svg>
            );
        default:
            return null;
    }
}

const formatDate = (iso) =>
    iso
        ? new Date(iso).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
          })
        : null;

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/* ---------- lesson card (board view) ---------- */

function LessonCard({ lesson }) {
    return (
        <article className={`lesson-card ${lesson.completed ? "is-done" : ""}`}>
            <div className="lesson-card-top">
                <h4>{lesson.name}</h4>
                {lesson.completed && (
                    <span className="done-check" title="Completed">
                        <Icon name="check" size={13} />
                    </span>
                )}
            </div>

            {lesson.description && (
                <p className="lesson-desc">{lesson.description}</p>
            )}

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

            <div className="lesson-meta">
                <span>
                    <Icon name="drills" size={14} />
                    {plural(lesson.drill_count, "drill")}
                </span>
                <span>
                    <Icon name="clock" size={14} />
                    {lesson.total_minutes} min
                </span>
                {lesson.completed_at && (
                    <span className="meta-date">
                        {formatDate(lesson.completed_at)}
                    </span>
                )}
            </div>
        </article>
    );
}

/* ---------- main component ---------- */

function Dashboard() {
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [status, setStatus] = useState("loading"); // loading | ready | error | unauth
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState("all"); // all | todo | done
    const [view, setView] = useState("board"); // board | list
    const [activeSkill, setActiveSkill] = useState(null); // null = all skills

    useEffect(() => {
        api.get("dashboard/")
            .then((res) => {
                setData(res.data);
                setStatus("ready");
            })
            .catch((err) => {
                setStatus(err.response?.status === 401 ? "unauth" : "error");
            });
    }, []);

    const skills = data?.skills ?? [];

    const counts = useMemo(() => {
        const all = skills.flatMap((s) => s.lessons);
        const done = all.filter((l) => l.completed).length;
        return { all: all.length, done, todo: all.length - done };
    }, [skills]);

    const columns = useMemo(() => {
        const q = search.trim().toLowerCase();

        const matches = (lesson, skill) => {
            if (tab === "todo" && lesson.completed) return false;
            if (tab === "done" && !lesson.completed) return false;
            if (!q) return true;
            return (
                lesson.name.toLowerCase().includes(q) ||
                skill.name.toLowerCase().includes(q) ||
                lesson.difficulty.name.toLowerCase().includes(q)
            );
        };

        return skills
            .filter((s) => activeSkill === null || s.id === activeSkill)
            .map((s) => ({
                ...s,
                visible: s.lessons.filter((l) => matches(l, s)),
            }));
    }, [skills, search, tab, activeSkill]);

    const flatLessons = useMemo(
        () =>
            columns.flatMap((c) =>
                c.visible.map((l) => ({ ...l, skillName: c.name }))
            ),
        [columns]
    );

    /* ---------- states ---------- */

    if (status === "loading") {
        return (
            <div className="dash dash-center">
                <p className="dash-message">Loading your dashboard...</p>
            </div>
        );
    }

    if (status === "unauth") {
        return (
            <div className="dash dash-center">
                <p className="dash-message">
                    Please log in to see your dashboard.
                </p>
                <button className="btn-green" onClick={() => navigate("/login")}>
                    Go to Login
                </button>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="dash dash-center">
                <p className="dash-message">
                    Your dashboard could not be loaded. Please try again.
                </p>
                <button
                    className="btn-green"
                    onClick={() => window.location.reload()}
                >
                    Retry
                </button>
            </div>
        );
    }

    const { user, stats, recent } = data;

    const navItems = [
        { key: "overview", label: "Overview", icon: "overview", active: true },
        { key: "skills", label: "Skills", icon: "skills", count: skills.length },
        { key: "lessons", label: "Lessons", icon: "lessons", count: stats.total_lessons },
        { key: "drills", label: "Drills", icon: "drills", count: stats.drills_available },
        { key: "progress", label: "Progress", icon: "progress" },
        { key: "settings", label: "Settings", icon: "settings" },
    ];

    /* ---------- render ---------- */

    return (
        <div className="dash">
            {/* SIDEBAR */}
            <aside className="dash-sidebar">
                <div className="dash-brand">
                    <span className="brand-dot" />
                    <h2>
                        Dink<span>IQ</span>
                    </h2>
                </div>

                <div className="profile-box">
                    <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
                    <div>
                        <strong>{user.name}</strong>
                        <p>Player</p>
                    </div>
                </div>

                <p className="side-label">Dashboard</p>
                <nav className="side-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.key}
                            className={`side-item ${item.active ? "active" : ""}`}
                        >
                            <Icon name={item.icon} />
                            <span>{item.label}</span>
                            {item.count !== undefined && (
                                <span className="count-pill">{item.count}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="side-divider" />

                <p className="side-label">Skills</p>
                <nav className="side-nav">
                    <button
                        className={`side-item ${activeSkill === null ? "active" : ""}`}
                        onClick={() => setActiveSkill(null)}
                    >
                        <Icon name="hash" />
                        <span>All skills</span>
                    </button>
                    {skills.map((s) => (
                        <button
                            key={s.id}
                            className={`side-item ${activeSkill === s.id ? "active" : ""}`}
                            onClick={() => setActiveSkill(s.id)}
                        >
                            <Icon name="hash" />
                            <span>{s.name}</span>
                            <span className="count-pill">{s.lessons_total}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* MAIN */}
            <main className="dash-main">
                <header className="dash-topbar">
                    <label className="search-box">
                        <Icon name="search" size={17} />
                        <input
                            type="text"
                            placeholder="Search lessons..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Search lessons"
                        />
                    </label>

                    <div className="topbar-user">
                        <span className="avatar small">
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                        <span>{user.name}</span>
                    </div>
                </header>

                <section className="dash-heading">
                    <div>
                        <p className="welcome">Hello {user.name}, welcome back!</p>
                        <h1>Lessons</h1>
                    </div>

                    <div className="heading-tabs" role="tablist">
                        {[
                            { key: "all", label: "All", count: counts.all },
                            { key: "todo", label: "To Do", count: counts.todo },
                            { key: "done", label: "Completed", count: counts.done },
                        ].map((t) => (
                            <button
                                key={t.key}
                                role="tab"
                                aria-selected={tab === t.key}
                                className={`tab ${tab === t.key ? "active" : ""}`}
                                onClick={() => setTab(t.key)}
                            >
                                {t.label}
                                <span>{t.count}</span>
                            </button>
                        ))}
                    </div>
                </section>

                <div className="dash-toolbar">
                    <div className="view-toggle">
                        <button
                            className={view === "board" ? "active" : ""}
                            onClick={() => setView("board")}
                        >
                            <Icon name="board" size={16} /> Board View
                        </button>
                        <button
                            className={view === "list" ? "active" : ""}
                            onClick={() => setView("list")}
                        >
                            <Icon name="list" size={16} /> List View
                        </button>
                    </div>
                </div>

                {skills.length === 0 ? (
                    <p className="dash-message">
                        No skills have been added yet.
                    </p>
                ) : view === "board" ? (
                    <div className="board">
                        {columns.map((col) => (
                            <section className="column" key={col.id}>
                                <header className="column-head">
                                    <h3>{col.name}</h3>
                                    <span className="column-count">
                                        {col.visible.length}
                                    </span>
                                </header>

                                <div className="column-progress">
                                    <div className="bar">
                                        <span style={{ width: `${col.progress}%` }} />
                                    </div>
                                    <p>
                                        {col.progress}% · {col.lessons_completed}/
                                        {col.lessons_total} lessons · {col.level}
                                    </p>
                                    <p className="muted">
                                        {col.last_practiced
                                            ? `Last practiced ${formatDate(col.last_practiced)}`
                                            : "Not practiced yet"}
                                    </p>
                                </div>

                                <div className="column-cards">
                                    {col.visible.length === 0 ? (
                                        <p className="empty">No lessons here</p>
                                    ) : (
                                        col.visible.map((lesson) => (
                                            <LessonCard
                                                key={lesson.id}
                                                lesson={lesson}
                                            />
                                        ))
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <div className="list-view">
                        <div className="list-row list-head">
                            <span>Lesson</span>
                            <span>Skill</span>
                            <span>Difficulty</span>
                            <span>Status</span>
                            <span>Drills</span>
                            <span>Time</span>
                        </div>

                        {flatLessons.length === 0 ? (
                            <p className="empty">No lessons here</p>
                        ) : (
                            flatLessons.map((l) => (
                                <div className="list-row" key={l.id}>
                                    <span className="list-name">{l.name}</span>
                                    <span>{l.skillName}</span>
                                    <span>
                                        <i className={`tag tag-${l.difficulty.id % 3}`}>
                                            {l.difficulty.name}
                                        </i>
                                    </span>
                                    <span>
                                        <i
                                            className={`tag ${l.completed ? "tag-done" : "tag-todo"}`}
                                        >
                                            {l.completed ? "Done" : "To Do"}
                                        </i>
                                    </span>
                                    <span>{l.drill_count}</span>
                                    <span>{l.total_minutes} min</span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* RIGHT PANEL */}
            <aside className="dash-right">
                <section>
                    <h3 className="panel-title">Statistics</h3>
                    <div className="stat-grid">
                        <div className="stat-card">
                            <p>Skills Mastered</p>
                            <strong>{stats.skills_mastered}</strong>
                        </div>
                        <div className="stat-card">
                            <p>Skills In Progress</p>
                            <strong>{stats.skills_in_progress}</strong>
                        </div>
                        <div className="stat-card">
                            <p>Lessons Completed</p>
                            <strong>
                                {stats.lessons_completed}
                                <small>/{stats.total_lessons}</small>
                            </strong>
                        </div>
                        <div className="stat-card">
                            <p>Drills Available</p>
                            <strong>{stats.drills_available}</strong>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="panel-title">Recent Activity</h3>
                    {recent.length === 0 ? (
                        <p className="empty">No lessons completed yet.</p>
                    ) : (
                        <ul className="recent-list">
                            {recent.map((r) => (
                                <li key={r.lesson_id}>
                                    <span className="recent-check">
                                        <Icon name="check" size={14} />
                                    </span>
                                    <div>
                                        <strong>{r.lesson}</strong>
                                        <p>
                                            {r.skill} · {formatDate(r.completed_at)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </aside>
        </div>
    );
}

export default Dashboard;