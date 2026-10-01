import { 
    useState, 
    useEffect
} from "react";
import api from "../../services/api";

function Register(){
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleRegister = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        try {
            const response = await api.post("register/", {
                username,
                password,
                email,
            });

            console.log("Registration successful:", response.data);
            
            setSuccess("Account created successfully");

            setUsername("");
            setEmail("");
            setPassword("");
        } catch (error) {
            console.log("Registration failed: ", error)

            if (error.response?.data?.error){
                setError(error.response.data.error);
            } else {
                setError("Registration failed. Please try again.");
            }
        }
    };

    return (
        <div>
            <h1>DinkIQ</h1>
            <h2>Create an Account</h2>
        
            <form onSubmit={handleRegister}>
                <div>
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                    />

                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </div>

                <button type="submit">
                    Register
                </button>
            </form>

            {error && <p>{error}</p>}
            {success && <p>{success}</p>}
        </div>
    )
}

export default Register;