import { useState } from "react";
import api from "../../services/api"; // adjust the path to where your api.js is
import "./Contact.css";

// Placeholder articles. Put your photos in /public/images (or change the paths)
const posts = [
    {
        id: 1,
        author: "Coach Mark",
        date: "Oct 10, 2026",
        title: "3 Dinking Drills to Level Up Your Kitchen Game",
        excerpt:
            "Soft hands win rallies. Try these simple drills to build touch, patience, and consistency at the kitchen line...",
        image: "/images/blog-1.jpg",
    },
    {
        id: 2,
        author: "Coach Mark",
        date: "Oct 12, 2026",
        title: "How to Stay Sharp Between Lessons",
        excerpt:
            "Practice smarter between sessions. These easy-to-follow routines keep your skills improving all week long...",
        image: "/images/blog-2.jpg",
    },
    {
        id: 3,
        author: "Coach Mark",
        date: "Oct 15, 2026",
        title: "Why Footwork Matters More Than Power",
        excerpt:
            "Understand how positioning and movement shape every shot, from the third shot drop to your first volley...",
        image: "/images/blog-3.jpg",
    },
];

const emptyForm = { name: "", email: "", message: "" };

function Contact() {
    const [form, setForm] = useState(emptyForm);
    const [status, setStatus] = useState("idle"); // idle | sending | success | error

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("sending");
        try {
            await api.post("contact/", form);
            setForm(emptyForm);
            setStatus("success");
        } catch {
            setStatus("error");
        }
    };

    return (
        <div className="contact-page">
            {/* BLOG */}
            <section className="blog" id="blog">
                <div className="blog-header">
                    <h2>Stay Updated with Our Tips &amp; Court News!</h2>

                    <div className="blog-intro">
                        <h3>Our Blog</h3>
                        <p>
                            Stay informed with our latest pickleball tips,
                            lesson updates, and expert advice on improving your
                            game.
                        </p>
                    </div>
                </div>

                <div className="section-divider" />

                <div className="blog-grid">
                    {posts.map((post) => (
                        <article className="blog-card" key={post.id}>
                            <div className="blog-image">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    onError={(e) =>
                                        (e.currentTarget.style.display = "none")
                                    }
                                />
                            </div>

                            <div className="blog-body">
                                <p className="blog-meta">
                                    <span>{post.author}</span>
                                    <span>{post.date}</span>
                                </p>
                                <h3>{post.title}</h3>
                                <p className="blog-excerpt">{post.excerpt}</p>

                                <div className="blog-footer">
                                    <button className="read-more">
                                        Read More
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {/* CONTACT */}
            <section className="contact" id="contact">
                <div className="find-us">
                    <h2>Find us</h2>

                    <div className="info-card">
                        <span className="info-icon">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
                            </svg>
                        </span>
                        <div>
                            <h4>Call Us</h4>
                            <p>+63 912 345 6789</p>
                        </div>
                    </div>

                    <div className="info-card">
                        <span className="info-icon">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <rect x="3" y="5" width="18" height="14" rx="2" />
                                <path d="M3 7l9 6 9-6" />
                            </svg>
                        </span>
                        <div>
                            <h4>Email Now</h4>
                            <p>hello@dinkiq.com</p>
                        </div>
                    </div>

                    <div className="info-card">
                        <span className="info-icon">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
                                <circle cx="12" cy="9.5" r="2.5" />
                            </svg>
                        </span>
                        <div>
                            <h4>Address</h4>
                            <p>Your court address, City, Philippines</p>
                        </div>
                    </div>
                </div>

                <div className="contact-form-wrap">
                    <p className="contact-label">Contact info</p>
                    <h2>Keep In Touch</h2>
                    <p className="contact-desc">
                        We reply to every inquiry promptly so you can get on the
                        court and start improving your game.
                    </p>

                    <form className="contact-form" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="name"
                            placeholder="Name"
                            aria-label="Name"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            aria-label="Email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                        <textarea
                            name="message"
                            placeholder="Message"
                            aria-label="Message"
                            rows="3"
                            value={form.message}
                            onChange={handleChange}
                            required
                        />

                        <button
                            type="submit"
                            className="send-btn"
                            disabled={status === "sending"}
                        >
                            {status === "sending" ? "Sending..." : "Send Message"}
                        </button>

                        {status === "success" && (
                            <p className="form-status success" role="status">
                                Thanks! Your message has been sent.
                            </p>
                        )}
                        {status === "error" && (
                            <p className="form-status error" role="alert">
                                Something went wrong. Please try again.
                            </p>
                        )}
                    </form>
                </div>
            </section>
        </div>
    );
}

export default Contact;