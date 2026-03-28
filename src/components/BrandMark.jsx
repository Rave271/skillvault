import { useId } from "react";

export default function BrandMark({ className = "" }) {
  const baseId = useId().replace(/:/g, "");
  const outerGradientId = `${baseId}-outer`;
  const innerGradientId = `${baseId}-inner`;
  const lineGradientId = `${baseId}-line`;

  return (
    <span className={`brand-mark ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 72 72" role="presentation">
        <defs>
          <linearGradient id={outerGradientId} x1="14" y1="10" x2="58" y2="62" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f7d3ad" />
            <stop offset="0.55" stopColor="#cf9359" />
            <stop offset="1" stopColor="#73d6ff" />
          </linearGradient>
          <linearGradient id={innerGradientId} x1="26" y1="21" x2="46" y2="47" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id={lineGradientId} x1="22" y1="18" x2="50" y2="47" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffe9cf" />
            <stop offset="1" stopColor="#77d8ff" />
          </linearGradient>
        </defs>

        <rect x="8" y="8" width="56" height="56" rx="20" fill="rgba(10, 13, 18, 0.84)" />
        <rect
          x="8.75"
          y="8.75"
          width="54.5"
          height="54.5"
          rx="19.25"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />

        <path
          d="M36 15L52.5 24.5V43.5L36 53L19.5 43.5V24.5L36 15Z"
          fill="rgba(11, 16, 23, 0.88)"
          stroke={`url(#${outerGradientId})`}
          strokeWidth="2"
        />
        <path
          d="M36 22L45.25 27.5V38.5L36 44L26.75 38.5V27.5L36 22Z"
          fill="rgba(255,255,255,0.04)"
          stroke={`url(#${innerGradientId})`}
          strokeWidth="1.5"
        />
        <path
          d="M36 22V44"
          stroke={`url(#${lineGradientId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M26.75 33H45.25"
          stroke={`url(#${lineGradientId})`}
          strokeOpacity="0.88"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="36" cy="33" r="3.2" fill="#fff5e7" />
      </svg>
    </span>
  );
}
