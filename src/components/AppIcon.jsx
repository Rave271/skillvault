function iconPaths(name) {
  switch (name) {
    case "overview":
      return (
        <>
          <rect x="4.5" y="4.5" width="6" height="6" rx="1.5" />
          <rect x="13.5" y="4.5" width="6" height="6" rx="1.5" />
          <rect x="4.5" y="13.5" width="6" height="6" rx="1.5" />
          <rect x="13.5" y="13.5" width="6" height="6" rx="1.5" />
        </>
      );
    case "browse":
    case "search":
      return (
        <>
          <circle cx="10.5" cy="10.5" r="5.5" />
          <path d="M15 15l4 4" />
          <path d="M10.5 8.2v4.6" />
          <path d="M8.2 10.5h4.6" />
        </>
      );
    case "commit":
    case "profile":
      return (
        <>
          <path d="M12 3.5 18.5 6v5c0 4.1-2.4 7-6.5 9.5C7.9 18 5.5 15.1 5.5 11V6L12 3.5Z" />
          <rect x="9.1" y="10.4" width="5.8" height="4.8" rx="1.2" />
          <path d="M10.3 10.4V9.2a1.7 1.7 0 1 1 3.4 0v1.2" />
        </>
      );
    case "work":
      return (
        <>
          <path d="M8.2 6.2V5.1c0-.7.5-1.1 1.1-1.1h5.4c.6 0 1.1.4 1.1 1.1v1.1" />
          <rect x="3.5" y="6.5" width="17" height="11.5" rx="2.2" />
          <path d="M3.8 11.5h16.4" />
          <path d="M10 11.5v1.2h4v-1.2" />
        </>
      );
    case "reveal":
      return (
        <>
          <path d="M3.5 12s3.2-5 8.5-5 8.5 5 8.5 5-3.2 5-8.5 5-8.5-5-8.5-5Z" />
          <circle cx="12" cy="12" r="2.2" />
          <path d="m15.4 8.2 1.5 1.5 2.6-2.6" />
        </>
      );
    case "endorse":
      return (
        <path d="m12 3.7 2.3 4.7 5.2.8-3.8 3.7.9 5.3-4.6-2.5-4.6 2.5.9-5.3-3.8-3.7 5.2-.8L12 3.7Z" />
      );
    case "history":
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.8v4.7l3.1 1.9" />
        </>
      );
    case "help":
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9.7 9.2a2.6 2.6 0 1 1 4.6 1.7c-.7.7-1.6 1.1-1.8 2.4" />
          <circle cx="12" cy="16.8" r=".8" fill="currentColor" stroke="none" />
        </>
      );
    case "bid":
      return (
        <>
          <circle cx="11" cy="13" r="5.8" />
          <circle cx="11" cy="13" r="2.2" />
          <path d="m14.9 9.1 4.6-4.6" />
          <path d="M16.1 4.5h3.4v3.4" />
        </>
      );
    case "match":
    case "success":
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m8.5 12.1 2.3 2.4 4.9-5.1" />
        </>
      );
    case "payment":
      return (
        <>
          <path d="M4.5 8.5h13.7a1.8 1.8 0 0 1 1.8 1.8v5.2a1.8 1.8 0 0 1-1.8 1.8H6.3a1.8 1.8 0 0 1-1.8-1.8v-5.2a1.8 1.8 0 0 1 1.8-1.8Z" />
          <path d="M6.2 8.5V7.4c0-.8.6-1.4 1.4-1.4h9.2" />
          <circle cx="15.8" cy="12.5" r="1.2" />
        </>
      );
    case "stake":
      return (
        <>
          <rect x="6.4" y="10.6" width="11.2" height="8" rx="2" />
          <path d="M8.4 10.6V8.8a3.6 3.6 0 1 1 7.2 0v1.8" />
          <path d="M12 13.5v2.2" />
        </>
      );
    case "alert":
      return (
        <>
          <path d="M12 4.7 19.6 18H4.4L12 4.7Z" />
          <path d="M12 9.5v4.1" />
          <circle cx="12" cy="16.2" r=".9" fill="currentColor" stroke="none" />
        </>
      );
    case "resolve":
      return (
        <>
          <path d="M12 3.5 18.5 6v5c0 4.1-2.4 7-6.5 9.5C7.9 18 5.5 15.1 5.5 11V6L12 3.5Z" />
          <path d="m9.1 12.1 2 2.1 3.8-4" />
        </>
      );
    case "refresh":
      return (
        <>
          <path d="M18.4 8.2A6.8 6.8 0 0 0 6.9 6.1" />
          <path d="M6.9 6.1H10" />
          <path d="M6.9 6.1v3.1" />
          <path d="M5.6 15.8a6.8 6.8 0 0 0 11.5 2.1" />
          <path d="M17.1 17.9H14" />
          <path d="M17.1 17.9v-3.1" />
        </>
      );
    case "external":
      return (
        <>
          <path d="M10 6.5h7.5V14" />
          <path d="m17.5 6.5-9 9" />
          <path d="M7.5 10v8h8" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="8.5" />;
  }
}

export default function AppIcon({ name, className = "", label }) {
  return (
    <span
      className={`app-icon ${className}`.trim()}
      aria-hidden={label ? undefined : "true"}
    >
      <svg
        viewBox="0 0 24 24"
        role={label ? "img" : "presentation"}
        aria-label={label}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {iconPaths(name)}
      </svg>
    </span>
  );
}
