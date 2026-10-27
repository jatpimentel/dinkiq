import { useEffect, useRef, useState } from "react";
import Icon from "../Icon";
import "../Lessons/LessonModal"; // shared popup base styles (overlay, card, close button)
import "./DrillTimer.css";

/* Countdown timer for one drill, so players don't need a stopwatch.
   - a 3 second "Get ready" lead-in, then the drill time counts down
   - Start / Pause / Resume / Reset, and +/- 1 minute before starting
   - beeps (can be muted) and a vibration when the time is up
   - keeps the phone screen awake while it runs and shows the time in the tab title
   The time is measured with the clock, so it stays accurate even if the tab is in the background.
   Render it inside the .dash wrapper (it uses its colors). */

const READY_SECONDS = 3;
const MIN_MINUTES = 1;
const MAX_MINUTES = 60;
const RING_RADIUS = 108;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const pad = (n) => String(n).padStart(2, "0");

const formatTime = (ms) => {
    const total = Math.max(0, Math.ceil(ms / 1000));
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

function DrillTimer({ drill, lessonName, skillName, onClose }) {
    const startMinutes = Math.min(
        MAX_MINUTES,
        Math.max(MIN_MINUTES, drill.duration_minutes || MIN_MINUTES)
    );

    const [minutes, setMinutes] = useState(startMinutes);
    const [phase, setPhase] = useState("idle"); // idle | ready | running | paused | done
    const [left, setLeft] = useState(startMinutes * 60000); // ms left while running or paused
    const [readySec, setReadySec] = useState(READY_SECONDS);
    const [sound, setSound] = useState(true);

    const totalMs = minutes * 60000;

    const primaryRef = useRef(null);
    const audioRef = useRef(null);
    const soundRef = useRef(true);
    const wakeLockRef = useRef(null);
    const readyEndsRef = useRef(0);
    const endsAtRef = useRef(0);
    const lastBeepRef = useRef(null);
    const titleRef = useRef(document.title);
    const timeoutsRef = useRef([]);

    soundRef.current = sound;

    /* ---------- sound, vibration, screen wake lock ---------- */

    const beep = (freq = 880, seconds = 0.15) => {
        const ctx = audioRef.current;
        if (!soundRef.current || !ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;

        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + seconds + 0.03);
    };

    const lockScreen = async () => {
        try {
            if ("wakeLock" in navigator && !wakeLockRef.current) {
                wakeLockRef.current = await navigator.wakeLock.request("screen");
            }
        } catch {
            /* not supported or denied: the timer still works */
        }
    };

    const unlockScreen = async () => {
        try {
            await wakeLockRef.current?.release();
        } catch {
            /* ignore */
        }
        wakeLockRef.current = null;
    };

    /* ---------- timer actions ---------- */

    const beginRunning = () => {
        endsAtRef.current = Date.now() + totalMs;
        setLeft(totalMs);
        setPhase("running");
        beep(1047, 0.35);
    };

    const finish = () => {
        setLeft(0);
        setPhase("done");
        unlockScreen();

        beep(880, 0.2);
        timeoutsRef.current.push(setTimeout(() => beep(880, 0.2), 300));
        timeoutsRef.current.push(setTimeout(() => beep(1175, 0.5), 600));
        navigator.vibrate?.([200, 100, 200, 100, 400]);
    };

    const start = () => {
        // the audio engine may only start from a click, so it is created here
        if (!audioRef.current) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) audioRef.current = new AudioCtx();
        }
        audioRef.current?.resume?.();

        if (phase === "paused") {
            endsAtRef.current = Date.now() + left;
            setPhase("running");
        } else {
            lastBeepRef.current = null;
            readyEndsRef.current = Date.now() + READY_SECONDS * 1000;
            setReadySec(READY_SECONDS);
            setPhase("ready");
        }
        lockScreen();
    };

    const pause = () => {
        setLeft(Math.max(0, endsAtRef.current - Date.now()));
        setPhase("paused");
        unlockScreen();
    };

    const reset = () => {
        setPhase("idle");
        setLeft(totalMs);
        unlockScreen();
    };

    const adjust = (delta) => {
        const next = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, minutes + delta));
        setMinutes(next);
        setLeft(next * 60000);
        setPhase("idle");
    };

    /* ---------- the ticking ---------- */

    useEffect(() => {
        if (phase !== "ready" && phase !== "running") return;

        const id = setInterval(() => {
            const now = Date.now();

            if (phase === "ready") {
                const remaining = readyEndsRef.current - now;
                if (remaining <= 0) {
                    beginRunning();
                    return;
                }
                const sec = Math.ceil(remaining / 1000);
                setReadySec(sec);
                if (sec !== lastBeepRef.current) {
                    lastBeepRef.current = sec;
                    beep(660, 0.12);
                }
            } else {
                const remaining = endsAtRef.current - now;
                if (remaining <= 0) {
                    finish();
                    return;
                }
                setLeft(remaining);
            }
        }, 200);

        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    /* ---------- tab title, focus, Escape, cleanup ---------- */

    useEffect(() => {
        if (phase === "running" || phase === "paused") {
            document.title = `${formatTime(left)} · ${drill.name}`;
        } else {
            document.title = titleRef.current;
        }
    }, [phase, left, drill.name]);

    useEffect(() => {
        primaryRef.current?.focus();

        // Escape closes only the timer, not the lesson popup under it
        const onKey = (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                onClose();
            }
        };
        window.addEventListener("keydown", onKey, true);

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", onKey, true);
            document.body.style.overflow = prevOverflow;
            document.title = titleRef.current;
            timeoutsRef.current.forEach(clearTimeout);
            unlockScreen();
            audioRef.current?.close?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---------- what to show ---------- */

    const running = phase === "running";
    const idle = phase === "idle";

    const shownMs = idle ? totalMs : phase === "done" ? 0 : left;
    const fraction =
        phase === "done" ? 0 : idle || phase === "ready" ? 1 : left / totalMs;

    const label =
        phase === "paused"
            ? "Paused"
            : phase === "done"
              ? "Time's up!"
              : phase === "running"
                ? "Keep going"
                : `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;

    const primary =
        phase === "idle"
            ? { text: "Start", action: start }
            : phase === "ready"
              ? { text: "Cancel", action: reset }
              : phase === "running"
                ? { text: "Pause", action: pause }
                : phase === "paused"
                  ? { text: "Resume", action: start }
                  : { text: "Start again", action: start };

    return (
        <div className="modal-overlay timer-overlay" onClick={onClose}>
            <div
                className="modal timer-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="timer-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button className="modal-close" onClick={onClose} aria-label="Close timer">
                    <Icon name="close" size={18} />
                </button>

                <p className="modal-skill">Drill timer</p>
                <h2 id="timer-title">{drill.name}</h2>
                <p className="timer-context">
                    {skillName} · {lessonName}
                </p>
                {drill.description && <p className="timer-desc">{drill.description}</p>}

                <div className={`timer-ring ${phase}`}>
                    <svg viewBox="0 0 240 240" width="260" height="260" aria-hidden="true">
                        <circle
                            cx="120"
                            cy="120"
                            r={RING_RADIUS}
                            fill="none"
                            strokeWidth="12"
                            className="timer-track"
                        />
                        <circle
                            cx="120"
                            cy="120"
                            r={RING_RADIUS}
                            fill="none"
                            strokeWidth="12"
                            strokeLinecap="round"
                            className="timer-value"
                            strokeDasharray={`${fraction * RING_LENGTH} ${RING_LENGTH}`}
                            transform="rotate(-90 120 120)"
                        />
                    </svg>

                    <div className="timer-text" role="timer" aria-live="off">
                        {phase === "ready" ? (
                            <>
                                <strong className="timer-ready-number">{readySec}</strong>
                                <span>Get ready</span>
                            </>
                        ) : (
                            <>
                                <strong>{formatTime(shownMs)}</strong>
                                <span>{label}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* announces the important changes to screen readers */}
                <p className="timer-sr" role="status">
                    {phase === "running" && "Timer started"}
                    {phase === "paused" && "Timer paused"}
                    {phase === "done" && "Time is up"}
                </p>

                <div className="timer-adjust" aria-label="Change the drill time">
                    <button
                        onClick={() => adjust(-1)}
                        disabled={!idle || minutes <= MIN_MINUTES}
                        aria-label="One minute less"
                    >
                        − 1 min
                    </button>
                    <button
                        onClick={() => adjust(1)}
                        disabled={!idle || minutes >= MAX_MINUTES}
                        aria-label="One minute more"
                    >
                        + 1 min
                    </button>
                </div>

                <div className="timer-actions">
                    <button
                        ref={primaryRef}
                        className={`timer-primary ${running ? "is-running" : ""}`}
                        onClick={primary.action}
                    >
                        {phase === "idle" || phase === "paused" || phase === "done" ? (
                            <Icon name="play" size={15} />
                        ) : null}
                        {primary.text}
                    </button>

                    {(phase === "running" || phase === "paused" || phase === "done") && (
                        <button className="timer-secondary" onClick={reset}>
                            Reset
                        </button>
                    )}

                    <button
                        className="timer-sound"
                        onClick={() => setSound((s) => !s)}
                        aria-pressed={sound}
                        aria-label={sound ? "Mute sounds" : "Turn sounds on"}
                        title={sound ? "Sounds on" : "Sounds off"}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M11 5L6 9H3v6h3l5 4V5z" />
                            {sound ? (
                                <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
                            ) : (
                                <path d="M16 9l5 6M21 9l-5 6" />
                            )}
                        </svg>
                    </button>
                </div>

                {phase === "done" && (
                    <p className="timer-done">
                        Nice work! Drill complete. Mark the lesson as done when you finish all its drills.
                    </p>
                )}
            </div>
        </div>
    );
}

export default DrillTimer;