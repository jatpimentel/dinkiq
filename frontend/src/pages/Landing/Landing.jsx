import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api"; // adjust the path to where your api.js is
import heroImage from "../../assets/hero-player.jpg";
import Contact from "./Contact/Contact";
import About from "./About/About";
import Pickleballs from "./Pickleballs";
import SkillsCarousel from "./Services/SkillsCarousel";
import "./Landing.css";

// navbar links: the id must match the id of the section it scrolls to
const NAV_LINKS = [
    { id: "home", label: "Home" },
    { id: "services", label: "Service" },
    { id: "about", label: "About us" },
    { id: "contact", label: "Contact" },
];

function Landing() {
    const navigate = useNavigate();
    const [skills, setSkills] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | ready | error
    const [scrolled, setScrolled] = useState(false); // adds a shadow to the navbar
    const [activeSection, setActiveSection] = useState("home"); // highlighted link

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

    // navbar shadow once the page has scrolled
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // highlight the navbar link of the section that is on screen
    useEffect(() => {
        const sections = NAV_LINKS.map((l) => document.getElementById(l.id)).filter(Boolean);

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActiveSection(entry.target.id);
                });
            },
            // only the band around the middle of the screen counts
            { rootMargin: "-40% 0px -55% 0px" }
        );

        sections.forEach((s) => observer.observe(s));
        return () => observer.disconnect();
    }, []);

    const scrollToServices = () => {
        document
            .getElementById("services")
            ?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="landing">
            {/* faded pickleballs in the background */}
            <Pickleballs />

            {/* NAVBAR (stays visible while scrolling) */}
            <header className={`navbar ${scrolled ? "is-scrolled" : ""}`}>
                <div className="navbar-inner">
                    <a href="#home" className="brand">
                        <span className="brand-name">DinkIQ</span>
                        <span className="brand-sub">Pickleball Lessons</span>
                    </a>

                    <nav className="nav-links">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.id}
                                href={`#${link.id}`}
                                className={activeSection === link.id ? "active" : ""}
                                aria-current={activeSection === link.id ? "true" : undefined}
                            >
                                {link.label}
                            </a>
                        ))}
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

                <SkillsCarousel
                    skills={skills}
                    status={status}
                    onBook={() => navigate("/login")}
                />
            </section>

            {/* ABOUT */}
            <About skillCount={skills.length} />

            {/* BLOG + CONTACT */}
            <Contact />
        </div>
    );
}

export default Landing;