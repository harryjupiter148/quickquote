"use client";
import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";
import ProjectHealthLight from "./ProjectHealthLight";

export default function ProjectHealthTile({ projects = [], className = "" }) {
  const active = projects.filter((p) => p.status === "active");
  return (
    <div className={`glass flex flex-col gap-3 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="tile-title">
          <Activity size={18} className="text-amber-300" />
          <span>Project Health Light</span>
        </div>
        <Link href="/dashboard/freelancer/projects" className="text-xs text-white/60 hover:text-white">
          All projects <ArrowRight size={12} className="inline" />
        </Link>
      </div>
      {active.length === 0 ? (
        <p className="py-4 text-sm text-white/50">No active projects yet.</p>
      ) : (
        <div>
          {active.map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b border-white/10 py-2.5 last:border-0">
              <span className="max-w-[60%] truncate text-sm text-white/90">{p.project_name}</span>
              <ProjectHealthLight project={p} />
            </div>
          ))}
        </div>
      )}
      <div className="mt-auto flex gap-3 pt-1 text-[11px] text-white/50">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" />Blocked</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-yellow-400" />At risk</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-green-500" />On track</span>
      </div>
    </div>
  );
}
