import { useEffect, useRef, useState } from "react";
import "./SkillsCarousel.css";

/* The skills carousel of the landing page.
   - arrows (they loop around), dots, swipe on phones
   - slides on its own every few seconds; it pauses while you hover it
     or use the pause button, and it never auto-plays for people who
     asked their device to reduce motion
   Rendered inside the .landing page (it uses its colors and card styles). */

const AUTOPLAY_MS = 5000;

const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// how far one slide moves, and how many positions the carousel has
function measure(el) {
    const card = el.querySelector(".lesson-card");
    if (!card) return { step: 0, total: 1 };

    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = card.offsetWidth + gap;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const total = maxScroll > 1 ? Math.round(maxScroll / step) + 1 : 1;
    return { step, total };
}

function SkillsCarousel({ skills, status, onBook }) {
    const trackRef = useRef(null);
    const [index, setIndex] = useState(0);
    const [total, setTotal] = useState(1);
    const [hovering, setHovering] = useState(false);
    const [userPaused, setUserPaused] = useState(false);
    const reduced = prefersReducedMotion();

    // keep the dots in sync with the scroll position and the window size
    const update = () => {
        const el = trackRef.current;
        if (!el) return;
        const m = measure(el);
        setTotal(m.total);
        setIndex(m.step ? Math.min(m.total - 1, Math.round(el.scrollLeft / m.step)) : 0);
    };

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;

        update();

        const observer = new ResizeObserver(update);
        observer.observe(el);

        let frame = 0;
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(update);
        };
        el.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            observer.disconnect();
            el.removeEventListener("scroll", onScroll);
            cancelAnimationFrame(frame);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skills.length]);

    const goTo = (i) => {
        const el = trackRef.current;
        if (!el) return;
        const { step, total: count } = measure(el);
        const target = Math.max(0, Math.min(i, count - 1));
        el.scrollTo({
            left: Math.min(target * step, el.scrollWidth - el.clientWidth),
            behavior: reduced ? "auto" : "smooth",
        });
    };

    // dir = 1 for next, -1 for previous; wraps around at both ends
    const move = (dir) => {
        const el = trackRef.current;
        if (!el) return;
        const { step, total: count } = measure(el);
        if (!step) return;

        let next = Math.round(el.scrollLeft / step) + dir;
        if (next > count - 1) next = 0;
        if (next < 0) next = count - 1;
        goTo(next);
    };

    // auto-play: one slide every few seconds, restarted after every move
    const playing = total > 1 && !reduced && !userPaused && !hovering;

    useEffect(() => {
        if (!playing) return;
        const id = setTimeout(() => move(1), AUTOPLAY_MS);
        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playing, index]);

    const onKeyDown = (e) => {
        if (e.key === "ArrowRight") {
            e.preventDefault();
            move(1);
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            move(-1);
        }
    };

    return (
        <div
            className="skills-carousel"
            role="region"
            aria-roledescription="carousel"
            aria-label="Pickleball skills"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onFocus={() => setHovering(true)}
            onBlur={() => setHovering(false)}
            onKeyDown={onKeyDown}
        >
            <div className="lessons-grid" ref={trackRef}>
                {status === "loading" && (
                    <p className="lessons-message">Loading lessons...</p>
                )}
                {status === "error" && (
                    <p className="lessons-message">
                        Lessons could not be loaded. Please try again later.
                    </p>
                )}
                {status === "ready" && skills.length === 0 && (
                    <p className="lessons-message">No lessons available yet.</p>
                )}

                {skills.map((skill, i) => (
                    <article
                        className="lesson-card"
                        key={skill.id}
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${i + 1} of ${skills.length}`}
                    >
                        <div className="lesson-image">
                            {skill.image ? (
                                <img src={skill.image} alt={skill.name} loading="lazy" />
                            ) : (
                                <div className="lesson-image-fallback" />
                            )}
                        </div>

                        <h3>{skill.name}</h3>
                        <p>{skill.description}</p>

                        <button className="btn btn-book" onClick={() => onBook(skill)}>
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

            {total > 1 && (
                <>
                    <button
                        className="sc-arrow sc-prev"
                        onClick={() => move(-1)}
                        aria-label="Previous skill"
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
                            <path d="M20 12H4M10 6l-6 6 6 6" />
                        </svg>
                    </button>

                    <button
                        className="sc-arrow sc-next"
                        onClick={() => move(1)}
                        aria-label="Next skill"
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

                    <div className="sc-controls">
                        <div className="sc-dots">
                            {Array.from({ length: total }, (_, i) => (
                                <button
                                    key={i}
                                    className={`sc-dot ${i === index ? "active" : ""}`}
                                    onClick={() => goTo(i)}
                                    aria-label={`Go to position ${i + 1} of ${total}`}
                                    aria-current={i === index ? "true" : undefined}
                                >
                                    <span />
                                </button>
                            ))}
                        </div>

                        {!reduced && (
                            <button
                                className="sc-pause"
                                onClick={() => setUserPaused((v) => !v)}
                                aria-label={
                                    userPaused ? "Start auto-play" : "Pause auto-play"
                                }
                            >
                                {userPaused ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M7 4l13 8-13 8z" />
                                    </svg>
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                                    </svg>
                                )}
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default SkillsCarousel;