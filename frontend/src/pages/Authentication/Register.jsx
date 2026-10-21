import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import heroImage from "../../assets/hero-player.jpg";
import "./Login.css"; // shares the login page styles (adjust the path if needed)
import "./Register.css";

/* password field with a show/hide button */
function PasswordInput({ id, value, onChange, placeholder, autoComplete }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="auth-password">
            <input
                id={id}
                type={visible ? "text" : "password"}
                autoComplete={autoComplete}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required
            />
            <button
                type="button"
                className="auth-eye"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
            >
                {visible ? (
                    <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.7 9.7 0 0 1 12 5c5 0 8.5 4 9.5 7a12 12 0 0 1-2.6 4M6.2 6.2A12 12 0 0 0 2.5 12c1 3 4.5 7 9.5 7a9.6 9.6 0 0 0 4-.9" />
                    </svg>
                ) : (
                    <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M2.5 12C3.5 9 7 5 12 5s8.5 4 9.5 7c-1 3-4.5 7-9.5 7s-8.5-4-9.5-7z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
            </button>
        </div>
    );
}

function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (password.length < 8) {
            setError("Your password must be at least 8 characters.");
            return;
        }
        if (password !== confirm) {
            setError("The passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await api.post("register/", {
                username,
                password,
                email,
            });

            setSuccess("Account created successfully!");

            setUsername("");
            setEmail("");
            setPassword("");
            setConfirm("");
        } catch (error) {
            console.log("Registration failed: ", error);

            if (error.response?.data?.error) {
                setError(error.response.data.error);
            } else {
                setError("Registration failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* LEFT: brand panel */}
            <aside
                className="auth-side"
                style={{ backgroundImage: `url(${heroImage})` }}
            >
                <Link to="/" className="auth-logo">
                    <span className="auth-logo-dot" />
                    <span className="auth-logo-text">
                        Dink<span>IQ</span>
                    </span>
                </Link>

                <div className="auth-side-text">
                    <h2>Start your pickleball journey today.</h2>
                    <p>
                        Create an account to follow your lessons, practice
                        drills, and watch your court IQ grow.
                    </p>
                </div>
            </aside>

            {/* RIGHT: form */}
            <main className="auth-main">
                <Link to="/" className="auth-back">
                    <svg
                        width="16"
                        height="16"
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
                    Back to home
                </Link>

                <div className="auth-card">
                    <Link to="/" className="auth-logo auth-logo-mobile">
                        <span className="auth-logo-dot" />
                        <span className="auth-logo-text">
                            Dink<span>IQ</span>
                        </span>
                    </Link>

                    <h1>Create an account</h1>
                    <p className="auth-sub">It only takes a minute to get started.</p>

                    <form onSubmit={handleRegister} className="auth-form">
                        <div className="auth-field">
                            <label htmlFor="register-username">Username</label>
                            <input
                                id="register-username"
                                type="text"
                                autoComplete="username"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="register-email">Email</label>
                            <input
                                id="register-email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="register-password">Password</label>
                            <PasswordInput
                                id="register-password"
                                autoComplete="new-password"
                                placeholder="At least 8 characters"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="register-confirm">Confirm password</label>
                            <PasswordInput
                                id="register-confirm"
                                autoComplete="new-password"
                                placeholder="Type your password again"
                                value={confirm}
                                onChange={(event) => setConfirm(event.target.value)}
                            />
                        </div>

                        {error && (
                            <p className="auth-error" role="alert">
                                {error}
                            </p>
                        )}

                        {success && (
                            <p className="auth-success" role="status">
                                {success} <Link to="/login">Log in now</Link>
                            </p>
                        )}

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Already have an account? <Link to="/login">Log in</Link>
                    </p>
                </div>
            </main>
        </div>
    );
}

export default Register;