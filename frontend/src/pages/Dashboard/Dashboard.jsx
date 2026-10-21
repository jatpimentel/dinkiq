import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api"; // adjust the path to where your api.js is
import Icon from "./Icon";
import LessonModal from "./LessonModal";
import Skills from "./Skills";
import Drills from "./Drills";
import Lessons from "./Lessons";
import Progress from "./Progress";
import Settings from "./Settings";
import { formatDate, plural } from "./helpers";
import "./Dashboard.css";

/* ---------- lesson card (board view) ---------- */

function LessonCard({ lesson, onOpen }) {
    return (
        <article
            className={`lesson-card ${lesson.completed ? "is-done" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(lesson)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(lesson);
                }
            }}
        >
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

    // which page is shown in the middle: ?page=skills, or the overview board
    const [searchParams, setSearchParams] = useSearchParams();
    const pageParam = searchParams.get("page");
    const page = ["skills", "drills", "lessons", "progress", "settings"].includes(pageParam) ? pageParam : "overview";
    const searchWord = ["skills", "drills", "progress"].includes(page) ? page : "lessons";
    const goTo = (p) => setSearchParams(p === "overview" ? {} : { page: p });

    const [data, setData] = useState(null);
    const [status, setStatus] = useState("loading"); // loading | ready | error | unauth
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState("all"); // all | todo | done
    const [view, setView] = useState("board"); // board | list
    const [activeSkill, setActiveSkill] = useState(null); // null = all skills
    const [selected, setSelected] = useState(null); // lesson shown in the popup

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

    // close the popup with Escape and stop the page behind from scrolling
    useEffect(() => {
        if (!selected) return;
        const onKey = (e) => {
            if (e.key === "Escape") setSelected(null);
        };
        document.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [selected]);

    // reload the dashboard data (for example after the profile name changes)
    const reloadDashboard = async () => {
        try {
            const res = await api.get("dashboard/");
            setData(res.data);
        } catch {
            /* keep showing the old data */
        }
    };

    // mark a lesson completed (or undo it), then reload fresh data from Django
    const toggleComplete = async (lesson) => {
        try {
            if (lesson.completed) {
                await api.delete(`lessons/${lesson.id}/complete/`);
            } else {
                await api.post(`lessons/${lesson.id}/complete/`);
            }

            const res = await api.get("dashboard/");
            setData(res.data);

            // keep the popup open, showing the updated lesson
            const fresh = res.data.skills
                .flatMap((s) =>
                    s.lessons.map((l) => ({ ...l, skillName: s.name }))
                )
                .find((l) => l.id === lesson.id);
            setSelected(fresh ?? null);
            return true;
        } catch {
            return false;
        }
    };

    const skills = data?.skills ?? [];

    // "View lessons" on a skill card: show the board filtered to that skill
    const openSkill = (id) => {
        setActiveSkill(id);
        goTo("overview");
    };

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
        { key: "overview", label: "Overview", icon: "overview", active: page === "overview" },
        { key: "skills", label: "Skills", icon: "skills", count: skills.length, active: page === "skills" },
        { key: "lessons", label: "Lessons", icon: "lessons", count: stats.total_lessons, active: page === "lessons" },
        { key: "drills", label: "Drills", icon: "drills", count: stats.drills_available, active: page === "drills" },
        { key: "progress", label: "Progress", icon: "progress", active: page === "progress" },
        { key: "settings", label: "Settings", icon: "settings", active: page === "settings" },
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
                            onClick={() => {
                                if (item.key === "overview") {
                                    setActiveSkill(null);
                                    goTo("overview");
                                } else if (item.key === "skills") {
                                    goTo("skills");
                                } else if (item.key === "drills") {
                                    goTo("drills");
                                } else if (item.key === "lessons") {
                                    goTo("lessons");
                                } else if (item.key === "progress") {
                                    goTo("progress");
                                } else if (item.key === "settings") {
                                    goTo("settings");
                                }
                            }}
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
                        className={`side-item ${page === "overview" && activeSkill === null ? "active" : ""}`}
                        onClick={() => openSkill(null)}
                    >
                        <Icon name="hash" />
                        <span>All skills</span>
                    </button>
                    {skills.map((s) => (
                        <button
                            key={s.id}
                            className={`side-item ${page === "overview" && activeSkill === s.id ? "active" : ""}`}
                            onClick={() => openSkill(s.id)}
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
{page === "settings" ? (
                        <div />
                    ) : (
                                        <label className="search-box">
                        <Icon name="search" size={17} />
                        <input
                            type="text"
                            placeholder={`Search ${searchWord}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label={`Search ${searchWord}`}
                        />
                    </label>
                    )}

                    <div className="topbar-user">
                        <span className="avatar small">
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                        <span>{user.name}</span>
                    </div>
                </header>

                {page === "skills" ? (
                    <Skills
                        skills={skills}
                        search={search}
                        onOpenSkill={openSkill}
                    />
                ) : page === "drills" ? (
                    <Drills
                        skills={skills}
                        search={search}
                        onOpenLesson={(lesson) => setSelected(lesson)}
                    />
                ) : page === "settings" ? (
                    <Settings onProfileSaved={reloadDashboard} />
                ) : page === "progress" ? (
                    <Progress
                        skills={skills}
                        search={search}
                        onOpenLesson={(lesson) => setSelected(lesson)}
                        onOpenSkill={openSkill}
                    />
                ) : page === "lessons" ? (
                    <Lessons
                        skills={skills}
                        search={search}
                        onOpenLesson={(lesson) => setSelected(lesson)}
                    />
                ) : (
                <>
                <section className="dash-heading">
                    <div>
                        <p className="welcome">Hello {user.name}, welcome back!</p>
                        <h1>Overview</h1>
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
                                                onOpen={(l) =>
                                                    setSelected({
                                                        ...l,
                                                        skillName: col.name,
                                                    })
                                                }
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
                                <div
                                    className="list-row clickable"
                                    key={l.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelected(l)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setSelected(l);
                                        }
                                    }}
                                >
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
                </>
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

            {selected && (
                <LessonModal
                    lesson={selected}
                    onClose={() => setSelected(null)}
                    onToggleComplete={toggleComplete}
                />
            )}
        </div>
    );
}

export default Dashboard;