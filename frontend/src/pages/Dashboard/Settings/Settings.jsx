import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api"; // adjust the path to where your api.js is
import "./Settings.css";

/* The "Settings" page: profile, password and log out.
   Rendered inside the .dash wrapper (it uses its colors). */

// turns a Django REST error response into one readable sentence
const errorText = (err) => {
    const data = err.response?.data;
    if (!data) return "Something went wrong. Please try again.";
    if (typeof data === "string") return "Something went wrong. Please try again.";
    if (data.error) return data.error;
    if (data.detail) return data.detail;
    return Object.values(data).flat().join(" ");
};

const emptyPasswords = { current: "", next: "", confirm: "" };

function Settings({ onProfileSaved }) {
    const navigate = useNavigate();

    // ----- profile -----
    const [initial, setInitial] = useState(null);
    const [form, setForm] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [profileStatus, setProfileStatus] = useState({ type: "", text: "" });
    const [savingProfile, setSavingProfile] = useState(false);

    // ----- password -----
    const [passwords, setPasswords] = useState(emptyPasswords);
    const [passwordStatus, setPasswordStatus] = useState({ type: "", text: "" });
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        api.get("profile/")
            .then((res) => {
                setInitial(res.data);
                setForm(res.data);
            })
            .catch(() => setLoadError(true));
    }, []);

    const dirty =
        form &&
        initial &&
        (form.first_name !== initial.first_name ||
            form.last_name !== initial.last_name ||
            form.email !== initial.email);

    const saveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileStatus({ type: "", text: "" });

        try {
            const res = await api.patch("profile/", {
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                email: form.email.trim(),
            });
            setInitial(res.data);
            setForm(res.data);
            setProfileStatus({ type: "success", text: "Your profile has been updated." });
            onProfileSaved?.(); // refresh the name shown in the sidebar
        } catch (err) {
            setProfileStatus({ type: "error", text: errorText(err) });
        } finally {
            setSavingProfile(false);
        }
    };

    const savePassword = async (e) => {
        e.preventDefault();
        setPasswordStatus({ type: "", text: "" });

        if (passwords.next.length < 8) {
            setPasswordStatus({
                type: "error",
                text: "Your new password must be at least 8 characters.",
            });
            return;
        }
        if (passwords.next !== passwords.confirm) {
            setPasswordStatus({
                type: "error",
                text: "The new passwords do not match.",
            });
            return;
        }

        setSavingPassword(true);
        try {
            await api.post("change-password/", {
                current_password: passwords.current,
                new_password: passwords.next,
            });
            setPasswords(emptyPasswords);
            setPasswordStatus({ type: "success", text: "Your password has been changed." });
        } catch (err) {
            setPasswordStatus({ type: "error", text: errorText(err) });
        } finally {
            setSavingPassword(false);
        }
    };

    const logout = () => {
        // use the same key names your Login page saves the tokens under
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
    };

    const initialLetter = (
        form?.first_name?.charAt(0) ||
        form?.username?.charAt(0) ||
        "?"
    ).toUpperCase();

    return (
        <section className="settings-page">
            <div className="settings-head">
                <p className="welcome">Manage your account</p>
                <h1>Settings</h1>
            </div>

            <div className="settings-grid">
                {/* PROFILE */}
                <div className="settings-card">
                    <h2>Profile</h2>
                    <p className="card-sub">This is how your name appears around the dashboard.</p>

                    {loadError ? (
                        <p className="settings-msg error" role="alert">
                            Your profile could not be loaded. Please refresh the page.
                        </p>
                    ) : !form ? (
                        <p className="card-sub">Loading...</p>
                    ) : (
                        <form onSubmit={saveProfile}>
                            <div className="profile-top">
                                <span className="settings-avatar">{initialLetter}</span>
                                <div>
                                    <strong>@{form.username}</strong>
                                    <p>Your username can't be changed.</p>
                                </div>
                            </div>

                            <div className="field-row">
                                <label className="field">
                                    First name
                                    <input
                                        type="text"
                                        value={form.first_name}
                                        maxLength={150}
                                        onChange={(e) =>
                                            setForm({ ...form, first_name: e.target.value })
                                        }
                                    />
                                </label>
                                <label className="field">
                                    Last name
                                    <input
                                        type="text"
                                        value={form.last_name}
                                        maxLength={150}
                                        onChange={(e) =>
                                            setForm({ ...form, last_name: e.target.value })
                                        }
                                    />
                                </label>
                            </div>

                            <label className="field">
                                Email
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({ ...form, email: e.target.value })
                                    }
                                />
                            </label>

                            <div className="card-actions">
                                <button
                                    type="submit"
                                    className="btn-green"
                                    disabled={!dirty || savingProfile}
                                >
                                    {savingProfile ? "Saving..." : "Save changes"}
                                </button>
                                {profileStatus.text && (
                                    <p
                                        className={`settings-msg ${profileStatus.type}`}
                                        role={profileStatus.type === "error" ? "alert" : "status"}
                                    >
                                        {profileStatus.text}
                                    </p>
                                )}
                            </div>
                        </form>
                    )}
                </div>

                {/* PASSWORD */}
                <div className="settings-card">
                    <h2>Password</h2>
                    <p className="card-sub">Use at least 8 characters that are hard to guess.</p>

                    <form onSubmit={savePassword}>
                        <label className="field">
                            Current password
                            <input
                                type="password"
                                autoComplete="current-password"
                                value={passwords.current}
                                onChange={(e) =>
                                    setPasswords({ ...passwords, current: e.target.value })
                                }
                                required
                            />
                        </label>

                        <label className="field">
                            New password
                            <input
                                type="password"
                                autoComplete="new-password"
                                value={passwords.next}
                                onChange={(e) =>
                                    setPasswords({ ...passwords, next: e.target.value })
                                }
                                required
                            />
                        </label>

                        <label className="field">
                            Confirm new password
                            <input
                                type="password"
                                autoComplete="new-password"
                                value={passwords.confirm}
                                onChange={(e) =>
                                    setPasswords({ ...passwords, confirm: e.target.value })
                                }
                                required
                            />
                        </label>

                        <div className="card-actions">
                            <button
                                type="submit"
                                className="btn-green"
                                disabled={savingPassword}
                            >
                                {savingPassword ? "Updating..." : "Update password"}
                            </button>
                            {passwordStatus.text && (
                                <p
                                    className={`settings-msg ${passwordStatus.type}`}
                                    role={passwordStatus.type === "error" ? "alert" : "status"}
                                >
                                    {passwordStatus.text}
                                </p>
                            )}
                        </div>
                    </form>
                </div>

                {/* SESSION */}
                <div className="settings-card wide">
                    <div className="session-row">
                        <div>
                            <h2>Log out</h2>
                            <p className="card-sub">
                                Sign out of DinkIQ on this device. You can log back in at any time.
                            </p>
                        </div>
                        <button className="btn-logout" onClick={logout}>
                            Log out
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Settings;