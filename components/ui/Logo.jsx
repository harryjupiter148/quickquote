"use client";
import { useId } from "react";

// QuickQuote "QQ" mark — two interlocking Q rings on a violet→cyan tile.
export function LogoMark({ size = 36, className = "" }) {
  const gid = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-label="QuickQuote logo" role="img">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill={`url(#${gid})`} />
      <circle cx="18.5" cy="21.5" r="8" fill="none" stroke="#fff" strokeWidth="3.6" />
      <path d="M23 26.5l5 5" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
      <circle cx="29.5" cy="26.5" r="8" fill="none" stroke="#fff" strokeOpacity=".78" strokeWidth="3.6" />
      <path d="M34 31.5l5 5" stroke="#fff" strokeOpacity=".78" strokeWidth="3.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ size = 36, showText = true, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showText && (
        <span className="text-lg font-extrabold tracking-tight">
          Quick<span className="bg-qq-gradient bg-clip-text text-transparent">Quote</span>
        </span>
      )}
    </span>
  );
}
