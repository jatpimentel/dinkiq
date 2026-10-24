import "./Pickleballs.css";

/* Faded pickleballs for the landing page background.
   Purely decorative: they sit behind the content and can't be clicked. */

// hole pattern of one ball (viewBox 0 0 100 100)
const HOLES = [{ x: 50, y: 50 }];
const addRing = (count, radius, offset = 0) => {
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + offset;
        HOLES.push({
            x: 50 + radius * Math.cos(angle),
            y: 50 + radius * Math.sin(angle),
        });
    }
};
addRing(6, 15);
addRing(12, 29, Math.PI / 12);
addRing(18, 41);

/* top = how far down the page, left/right = distance from that edge,
   size in px, rot = rotation, o = opacity. Change these to move the balls. */
const BALLS = [
    { top: "3%", left: "-60px", size: 170, rot: 20, o: 0.11 },
    { top: "9%", right: "-70px", size: 210, rot: -15, o: 0.1 },
    { top: "19%", left: "5%", size: 56, rot: 40, o: 0.12 },
    { top: "27%", right: "-40px", size: 150, rot: 10, o: 0.1 },
    { top: "36%", left: "-80px", size: 200, rot: -30, o: 0.1 },
    { top: "45%", right: "4%", size: 64, rot: 25, o: 0.12 },
    { top: "54%", left: "-50px", size: 140, rot: 35, o: 0.11 },
    { top: "62%", right: "-90px", size: 230, rot: -20, o: 0.09 },
    { top: "72%", left: "3%", size: 70, rot: 0, o: 0.12 },
    { top: "80%", right: "-50px", size: 160, rot: 30, o: 0.1 },
    { top: "89%", left: "-70px", size: 190, rot: -10, o: 0.1 },
    { top: "96%", right: "8%", size: 80, rot: 15, o: 0.11 },
];

function Pickleballs() {
    return (
        <div className="pb-layer" aria-hidden="true">
            {/* the holes are cut out of every ball with this shared mask */}
            <svg width="0" height="0" style={{ position: "absolute" }}>
                <defs>
                    <mask
                        id="pb-holes"
                        maskUnits="userSpaceOnUse"
                        x="0"
                        y="0"
                        width="100"
                        height="100"
                    >
                        <rect width="100" height="100" fill="white" />
                        {HOLES.map((h, i) => (
                            <circle key={i} cx={h.x} cy={h.y} r="3.4" fill="black" />
                        ))}
                    </mask>
                </defs>
            </svg>

            {BALLS.map((b, i) => (
                <svg
                    key={i}
                    className="pb"
                    viewBox="0 0 100 100"
                    style={{
                        top: b.top,
                        left: b.left,
                        right: b.right,
                        opacity: b.o,
                        "--size": `${b.size}px`,
                        "--rot": `${b.rot}deg`,
                    }}
                >
                    <circle cx="50" cy="50" r="48" fill="currentColor" mask="url(#pb-holes)" />
                </svg>
            ))}
        </div>
    );
}

export default Pickleballs;