import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api"; // adjust the path to where your api.js is
import heroImage from "../../assets/hero-player.jpg";
import Contact from "./Contact";
import About from "./About";
import "./Landing.css";


function Landing() {
    const navigate = useNavigate();
    const carouselRef = useRef(null);
    const [skills, setSkills] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | ready | error

    useEffect(() => {
        api.get("skills/")
            .then((res) => {
                const data = res.data;
                // works with a plain list (DRF) or { skills: [...] }
                setSkills(Array.isArray(data) ? data : data.skills ?? []);
                setStatus("ready");
            })
            .catch(() => setStatus("error"));
    }, []);

    const scrollNext = () => {
        const el = carouselRef.current;
        if (!el) return;
        const card = el.querySelector(".lesson-card");
        const step = card ? card.offsetWidth + 30 : 400;
        el.scrollBy({ left: step, behavior: "smooth" });
    };

    const scrollToServices = () => {
        document
            .getElementById("services")
            ?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="landing">
            {/* NAVBAR */}
            <header className="navbar">
                <div className="navbar-inner">
                    <a href="#home" className="brand">
                        <span className="brand-name">DinkIQ</span>
                        <span className="brand-sub">Pickleball Lessons</span>
                    </a>

                    <nav className="nav-links">
                        <a href="#home" className="active">Home</a>
                        <a href="#about">About us</a>
                        <a href="#services">Service</a>
                        <a href="#contact">Contact</a>
                    </nav>

                    <button
                        className="btn btn-primary btn-login"
                        onClick={() => navigate("/login")}
                    >
                        Login
                    </button>
                </div>
            </header>

            {/* HERO */}
            <section className="hero" id="home">
                <div className="hero-text">
                    <p className="hero-kicker">Quality Lesson for Everyone.</p>
                    <h1>
                        Master the kitchen, elevate your game, and outsmart the
                        competition.
                    </h1>
                    <p className="hero-desc">
                        Master the game with personalized pickleball lessons and
                        high-repetition drill sessions designed to elevate your
                        court IQ.
                    </p>

                    <div className="hero-actions">
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate("/register")}
                        >
                            Get Start Now
                        </button>
                        <button
                            className="btn btn-outline"
                            onClick={scrollToServices}
                        >
                            View all Services
                        </button>
                    </div>
                </div>

                <div className="hero-image">
                    <img
                        src={heroImage}
                        alt="Pickleball player holding a paddle on the court"
                    />
                </div>
            </section>

            {/* LESSONS */}
            <section className="lessons" id="services">
                <div className="lessons-header">
                    <h2>We Always Provide The Best Lessons</h2>

                    <div className="lessons-intro">
                        <h3>Lessons</h3>
                        <p>
                            The best of the best. The easiest lessons for
                            beginners and novice alike.
                        </p>
                    </div>
                </div>

                <div className="lessons-divider" />

                <div className="carousel-wrapper">
                    <div className="lessons-grid" ref={carouselRef}>
                        {status === "loading" && (
                            <p className="lessons-message">Loading lessons...</p>
                        )}
                        {status === "error" && (
                            <p className="lessons-message">
                                Lessons could not be loaded. Please try again
                                later.
                            </p>
                        )}
                        {status === "ready" && skills.length === 0 && (
                            <p className="lessons-message">
                                No lessons available yet.
                            </p>
                        )}

                        {skills.map((skill) => (
                            <article className="lesson-card" key={skill.id}>
                                <div className="lesson-image">
                                    {skill.image ? (
                                        <img src={skill.image} alt={skill.name} />
                                    ) : (
                                        <div className="lesson-image-fallback" />
                                    )}
                                </div>

                                <h3>{skill.name}</h3>
                                <p>{skill.description}</p>

                                <button
                                    className="btn btn-book"
                                    onClick={() => navigate("/login")}
                                >
                                    Book Now
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.4"
                                        aria-hidden="true"
                                    >
                                        <path d="M4 12L12 4M5 4h7v7" />
                                    </svg>
                                </button>
                            </article>
                        ))}
                    </div>

                    <button
                        className="carousel-next"
                        onClick={scrollNext}
                        aria-label="Show next lessons"
                    >
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M4 12h16M14 6l6 6-6 6" />
                        </svg>
                    </button>
                </div>
            </section>
            <About />
            {/* BLOG + CONTACT */}
            <Contact />
        </div>
    );
}

export default Landing;