import "./Dashboard.css";

function Dashboard() {
    const skills = [
        {
            name: "Dinking",
            lessons: 35,
            progress: 75,
            color: "#3B9BF3",
            icon: "🏓",
        },
        {
            name: "Driving",
            lessons: 30,
            progress: 50,
            color: "#FF9638",
            icon: "⚡",
        },
        {
            name: "Third Shot Drop",
            lessons: 20,
            progress: 25,
            color: "#8BC63E",
            icon: "🎯",
        },
        {
            name: "Resets",
            lessons: 40,
            progress: 75,
            color: "#FFD044",
            icon: "🔄",
        },
    ];

    const activities = [
        {
            icon: "📖",
            title: "Dinking Fundamentals",
            time: "08:00 AM - 08:30 AM",
        },
        {
            icon: "🎯",
            title: "Third Shot Drop Drill",
            time: "10:00 AM - 10:30 AM",
        },
        {
            icon: "🏓",
            title: "Dinking Control",
            time: "03:00 PM - 03:30 PM",
        },
        {
            icon: "⚡",
            title: "Driving Basics",
            time: "05:00 PM - 05:30 PM",
        },
        {
            icon: "🦶",
            title: "Footwork Fundamentals",
            time: "08:00 AM - 08:30 AM",
        },
        {
            icon: "🔄",
            title: "Reset Practice",
            time: "04:00 PM - 04:30 PM",
        },
        {
            icon: "🎯",
            title: "Target Practice",
            time: "09:00 AM - 09:30 AM",
        },
        {
            icon: "🏓",
            title: "Kitchen Line Practice",
            time: "06:00 PM - 06:30 PM",
        },
    ];

    return (
        <div className="dashboard">

            {/* SIDEBAR */}
            <aside className="sidebar">

                <div className="logo">
                    <span className="logo-icon">◉</span>
                    <span>DINK<span className="logo-accent">IQ</span></span>
                </div>

                <nav className="navigation">

                    <div className="nav-item active">
                        <span className="nav-icon">⌂</span>
                        <span>Overview</span>
                        <span className="active-dot"></span>
                    </div>

                    <div className="nav-item">
                        <span className="nav-icon">◈</span>
                        <span>Skills</span>
                    </div>

                    <div className="nav-item">
                        <span className="nav-icon">▣</span>
                        <span>Lessons</span>
                    </div>

                    <div className="nav-item">
                        <span className="nav-icon">◎</span>
                        <span>Drills</span>
                    </div>

                    <div className="nav-item">
                        <span className="nav-icon">◌</span>
                        <span>Assessment</span>
                    </div>

                    <div className="nav-item">
                        <span className="nav-icon">⌁</span>
                        <span>Progress</span>
                    </div>

                    <div className="nav-item">
                        <span className="nav-icon">⚙</span>
                        <span>Settings</span>
                    </div>

                </nav>

                <div className="sidebar-bottom">
                    <div className="player-illustration">
                        🏓
                    </div>

                    <div className="tip-card">
                        <strong>Keep improving!</strong>
                        <p>Practice consistently to improve your game.</p>
                    </div>
                </div>

            </aside>


            {/* MAIN CONTENT */}
            <main className="main-content">

                {/* TOP HEADER */}
                <header className="top-header">

                    <div>
                        <p className="welcome">
                            Hello Job, welcome back!
                        </p>

                        <h1>Training</h1>
                    </div>

                    <div className="search-container">
                        <span>⌕</span>
                        <input
                            type="text"
                            placeholder="Search..."
                        />
                    </div>

                </header>


                {/* TRAINING SECTION */}
                <section className="training-section">

                    <div className="section-header">
                        <h2>Skills</h2>
                        <button>View All</button>
                    </div>

                    <div className="skill-grid">

                        {skills.map((skill) => (
                            <div
                                className="skill-card"
                                key={skill.name}
                                style={{
                                    backgroundColor: skill.color,
                                }}
                            >

                                <div className="skill-info">
                                    <h3>{skill.name}</h3>
                                    <p>{skill.lessons} lessons</p>
                                </div>

                                <div className="skill-bottom">

                                    <div
                                        className="progress-circle"
                                        style={{
                                            background: `conic-gradient(
                                                white ${skill.progress * 3.6}deg,
                                                rgba(255,255,255,0.25) 0deg
                                            )`,
                                        }}
                                    >
                                        <div className="progress-inner">
                                            {skill.progress}%
                                        </div>
                                    </div>

                                    <div className="skill-icon">
                                        {skill.icon}
                                    </div>

                                </div>

                            </div>
                        ))}

                    </div>

                </section>


                {/* PLANNING */}
                <section className="planning-section">

                    <div className="section-header">
                        <h2>Planning</h2>
                        <button>View All</button>
                    </div>

                    <div className="planning-date">
                        📅 Today
                    </div>

                    <div className="activity-grid">

                        {activities.map((activity, index) => (
                            <div
                                className="activity-card"
                                key={index}
                            >

                                <div className="activity-icon">
                                    {activity.icon}
                                </div>

                                <div className="activity-info">
                                    <h4>{activity.title}</h4>
                                    <p>{activity.time}</p>
                                </div>

                                <div className="activity-menu">
                                    ⋮
                                </div>

                            </div>
                        ))}

                    </div>

                </section>

            </main>


            {/* RIGHT PANEL */}
            <aside className="right-panel">

                {/* PROFILE */}
                <div className="profile">

                    <div className="notification">
                        ♧
                        <span></span>
                    </div>

                    <div className="profile-card">

                        <div className="avatar">
                            J
                        </div>

                        <div>
                            <strong>Job Aaron</strong>
                            <p>Player</p>
                        </div>

                        <span className="dropdown">
                            ⌄
                        </span>

                    </div>

                </div>


                {/* STATISTICS */}
                <section className="statistics">

                    <h2>Statistics</h2>

                    <div className="statistics-grid">

                        <div className="stat-card">
                            <p>Skills Mastered</p>
                            <strong>02</strong>
                        </div>

                        <div className="stat-card">
                            <p>Lessons Completed</p>
                            <strong>12</strong>
                        </div>

                        <div className="stat-card">
                            <p>Skills In Progress</p>
                            <strong>03</strong>
                        </div>

                        <div className="stat-card">
                            <p>Drills Finished</p>
                            <strong>27</strong>
                        </div>

                    </div>

                </section>


                {/* ACTIVITY CHART */}
                <section className="weekly-activity">

                    <div className="activity-header">
                        <h2>Activity</h2>

                        <div>
                            <span>Day</span>
                            <strong>Week</strong>
                            <span>Month</span>
                        </div>
                    </div>

                    <div className="chart">

                        <div className="bar" style={{ height: "45%" }}>
                            <span>Mon</span>
                        </div>

                        <div className="bar" style={{ height: "58%" }}>
                            <span>Tue</span>
                        </div>

                        <div className="bar" style={{ height: "30%" }}>
                            <span>Wed</span>
                        </div>

                        <div className="bar active-bar" style={{ height: "82%" }}>
                            <span>Thu</span>
                        </div>

                        <div className="bar" style={{ height: "50%" }}>
                            <span>Fri</span>
                        </div>

                        <div className="bar" style={{ height: "70%" }}>
                            <span>Sat</span>
                        </div>

                        <div className="bar" style={{ height: "42%" }}>
                            <span>Sun</span>
                        </div>

                    </div>

                </section>

            </aside>

        </div>
    );
}

export default Dashboard;