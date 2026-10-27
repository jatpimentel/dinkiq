import { useNavigate } from "react-router-dom";
import coachImage from "../../../assets/coach.jpg";
import "./About.css";

/* About us section. It is rendered inside the .landing page,
   so the navbar link "About us" (#about) scrolls straight to it. */

const values = [
    {
        icon: "repeat",
        title: "Learn by doing",
        text: "Every lesson comes with short, high-repetition drills, so each shot becomes second nature on the court.",
    },
    {
        icon: "start",
        title: "Start where you are",
        text: "Lessons are made for beginners and novice players alike, with clear steps and no experience required.",
    },
    {
        icon: "chart",
        title: "See your growth",
        text: "Your dashboard tracks every lesson and drill, so you always know how far you've come and what's next.",
    },
];

const steps = [
    {
        title: "Pick a skill",
        text: "Choose what you want to work on, from dinking to the third shot drop.",
    },
    {
        title: "Practice lessons and drills",
        text: "Follow the lessons in order and repeat the drills until the shot feels natural.",
    },
    {
        title: "Track your progress",
        text: "Mark lessons complete and watch your skills, streak, and court IQ grow.",
    },
];

function ValueIcon({ name }) {
    const props = {
        width: 24,
        height: 24,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };

    if (name === "repeat") {
        return (
            <svg {...props}>
                <path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" />
            </svg>
        );
    }
    if (name === "start") {
        return (
            <svg {...props}>
                <path d="M4 22V3M4 4h13l-2.5 4L17 12H4" />
            </svg>
        );
    }
    return (
        <svg {...props}>
            <path d="M3 3v18h18M7 15l4-4 3 3 5-6" />
        </svg>
    );
}

function About({ skillCount = 0 }) {
    const navigate = useNavigate();

    return (
        <section className="about" id="about">
            <div className="about-top">
                <div className="about-visual">
                    <div className="about-photo">
                        <img
                            src={coachImage}
                            alt="Our pickleball coach on the court"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>

                    {skillCount > 0 && (
                        <div className="about-badge">
                            <strong>{skillCount}</strong>
                            <span>core skills to master</span>
                        </div>
                    )}
                </div>

                <div className="about-copy">
                    <p className="about-kicker">About us</p>
                    <h2>We help players master the game, one drill at a time.</h2>

                    <p>
                        DinkIQ is a pickleball training platform built around
                        personalized lessons and high-repetition drill sessions.
                        Every skill is broken into clear lessons and short drills
                        you can repeat until the shot becomes second nature.
                    </p>
                    <p>
                        Whether you just picked up a paddle or you're sharpening
                        your third shot drop, DinkIQ gives you a simple path to
                        follow and a dashboard that shows how far you've come.
                    </p>

                    <div className="about-actions">
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate("/register")}
                        >
                            Get Started
                        </button>
                        <button
                            className="btn btn-outline"
                            onClick={() =>
                                document
                                    .getElementById("services")
                                    ?.scrollIntoView({ behavior: "smooth" })
                            }
                        >
                            See the Lessons
                        </button>
                    </div>
                </div>
            </div>

            {/* WHAT WE BELIEVE */}
            <div className="about-block">
                <div className="about-block-head">
                    <p className="about-kicker">Our approach</p>
                    <h3>What we believe</h3>
                </div>

                <div className="about-values">
                    {values.map((v) => (
                        <article className="about-value" key={v.title}>
                            <span className="about-value-icon">
                                <ValueIcon name={v.icon} />
                            </span>
                            <h4>{v.title}</h4>
                            <p>{v.text}</p>
                        </article>
                    ))}
                </div>
            </div>

            {/* HOW IT WORKS */}
            <div className="about-block">
                <div className="about-block-head">
                    <p className="about-kicker">Simple to follow</p>
                    <h3>How it works</h3>
                </div>

                <ol className="about-steps">
                    {steps.map((s, i) => (
                        <li key={s.title}>
                            <span className="about-step-num">{i + 1}</span>
                            <h4>{s.title}</h4>
                            <p>{s.text}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}

export default About;