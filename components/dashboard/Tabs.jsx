"use client";

// Section-header submenu (tab bar) used on each primary page.
export default function Tabs({ tabs, value, onChange }) {
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`tab ${value === t.value ? "tab-active" : ""}`}
        >
          {t.label}
          {typeof t.count === "number" && (
            <span className="ml-1.5 rounded-md bg-white/10 px-1.5 text-[11px] text-white/70">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
