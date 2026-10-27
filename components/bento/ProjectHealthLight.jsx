// components/bento/ProjectHealthLight.jsx
"use client";
import { useState } from "react";
import { updateProject } from "@/lib/data";

export const STATUSES = [
  { value: "red", label: "Blocked", bg: "bg-red-500" },
  { value: "yellow", label: "At Risk", bg: "bg-yellow-400" },
  { value: "green", label: "On Track", bg: "bg-green-500" },
];

export default function ProjectHealthLight({ project, onChange, showLabel = false }) {
  const [status, setStatus] = useState(project.health_status);

  const updateStatus = async (val) => {
    const prev = status;
    setStatus(val); // optimistic UI update
    try {
      await updateProject(project.id, { health_status: val });
      onChange?.(val);
    } catch {
      setStatus(prev); // roll back on failure
    }
  };

  const current = STATUSES.find((s) => s.value === status);

  return (
    <div className="flex items-center gap-3">
      {showLabel && <span className="w-16 text-right text-xs text-white/60">{current?.label}</span>}
      <div className="flex gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            title={s.label}
            aria-label={`Set ${project.project_name} to ${s.label}`}
            onClick={() => updateStatus(s.value)}
            className={`h-5 w-5 rounded-full transition-all ${s.bg} ${
              status === s.value ? "scale-110 ring-2 ring-white" : "opacity-30 hover:opacity-70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
