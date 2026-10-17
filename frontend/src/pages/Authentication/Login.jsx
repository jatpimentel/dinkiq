import { useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";


function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const handleLogin = async (event) => {
        event.preventDefault();
        setError("");

        try {
            const response = await api.post("login/", {
                username,
                password,
            });

            console.log("Login successful:", response.data);

            localStorage.setItem("access", response.data.access);
            localStorage.setItem("refresh", response.data.refresh);

            navigate("/dashboard");

        } catch (error) {
            console.log("Login failed:", error);

            setError("Invalid username or password.");
        }
    };

    return (
        <div>
            <h1>DinkIQ</h1>
            <h2>Login</h2>

            <form onSubmit={handleLogin}>
                <div>
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                    />
                </div>

                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </div>

                <button type="submit">
                    Login
                </button>
            </form>

            {error && <p>{error}</p>}
        </div>
    );
}

export default Login;