function Icon({ name, size = 18 }) {
    const props = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };

    switch (name) {
        case "overview":
            return (
                <svg {...props}>
                    <path d="M3 11l9-8 9 8M5 10v10h14V10" />
                </svg>
            );
        case "skills":
            return (
                <svg {...props}>
                    <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" />
                </svg>
            );
        case "lessons":
            return (
                <svg {...props}>
                    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13" />
                </svg>
            );
        case "drills":
            return (
                <svg {...props}>
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4" />
                </svg>
            );
        case "progress":
            return (
                <svg {...props}>
                    <path d="M3 3v18h18M7 15l4-4 3 3 5-6" />
                </svg>
            );
        case "settings":
            return (
                <svg {...props}>
                    <path d="M4 6h8m4 0h4M4 12h2m4 0h10M4 18h10m4 0h2" />
                    <circle cx="14" cy="6" r="2" />
                    <circle cx="8" cy="12" r="2" />
                    <circle cx="16" cy="18" r="2" />
                </svg>
            );
        case "search":
            return (
                <svg {...props}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-4-4" />
                </svg>
            );
        case "board":
            return (
                <svg {...props}>
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            );
        case "list":
            return (
                <svg {...props}>
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
            );
        case "clock":
            return (
                <svg {...props}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                </svg>
            );
        case "check":
            return (
                <svg {...props}>
                    <path d="M5 12l5 5 9-10" />
                </svg>
            );
        case "bolt":
            return (
                <svg {...props}>
                    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
                </svg>
            );
        case "play":
            return (
                <svg {...props} fill="currentColor" stroke="none">
                    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
                </svg>
            );
        case "chevron":
            return (
                <svg {...props}>
                    <path d="M6 9l6 6 6-6" />
                </svg>
            );
        case "arrow":
            return (
                <svg {...props}>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
            );
        case "close":
            return (
                <svg {...props}>
                    <path d="M6 6l12 12M18 6L6 18" />
                </svg>
            );
        case "hash":
            return (
                <svg {...props}>
                    <path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16" />
                </svg>
            );
        default:
            return null;
    }
}

export default Icon;