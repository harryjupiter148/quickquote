"use client";

export default function Field({ label, error, hint, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-300">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-white/45">{hint}</span>
      ) : null}
    </label>
  );
}
