import { useState } from "react";
import api from "../../services/api";
import { Link, useNavigate } from "react-router-dom";
import heroImage from "../../assets/hero-player.jpg";
import "./Login.css";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("login/", {
                username,
                password,
            });

            localStorage.setItem("access", response.data.access);
            localStorage.setItem("refresh", response.data.refresh);

            navigate("/dashboard");
        } catch (error) {
            console.log("Login failed:", error);

            setError("Invalid username or password.");
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
                    <h2>Master the kitchen, elevate your game.</h2>
                    <p>
                        Personalized pickleball lessons and high-repetition drills
                        designed to build your court IQ.
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

                    <h1>Welcome back</h1>
                    <p className="auth-sub">Log in to continue your training.</p>

                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="auth-field">
                            <label htmlFor="login-username">Username</label>
                            <input
                                id="login-username"
                                type="text"
                                autoComplete="username"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="login-password">Password</label>
                            <div className="auth-password">
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="auth-eye"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? (
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
                        </div>

                        {error && (
                            <p className="auth-error" role="alert">
                                {error}
                            </p>
                        )}

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    <p className="auth-switch">
                        New to DinkIQ? <Link to="/register">Create an account</Link>
                    </p>
                </div>
            </main>
        </div>
    );
}

export default Login;