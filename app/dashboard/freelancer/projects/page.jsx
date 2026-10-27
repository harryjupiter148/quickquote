"use client";
import { useEffect, useState } from "react";
import { Plus, FolderKanban, CalendarDays, Trash2, X } from "lucide-react";
import { useDashboard } from "@/components/dashboard/UserContext";
import PageHeader from "@/components/dashboard/PageHeader";
import Tabs from "@/components/dashboard/Tabs";
import Field from "@/components/ui/Field";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import ProjectHealthLight from "@/components/bento/ProjectHealthLight";
import { createProject, deleteProject, listProjects, updateProject } from "@/lib/data";
import { fmtDate, todayISO } from "@/lib/format";

const blank = { project_name: "", description: "", start_date: todayISO(), deadline: "" };

export default function ProjectsPage() {
  const { user, notify } = useDashboard();
  const [projects, setProjects] = useState([]);
  const [tab, setTab] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);

  const load = () => listProjects(user.id).then(setProjects).catch((e) => notify(e.message, "error"));
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createProject(user.id, form);
      setForm(blank);
      setShowForm(false);
      setTab("active");
      notify("Project created");
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const changeStatus = async (p, status) => {
    await updateProject(p.id, { status });
    notify(`Moved to ${status}`);
    load();
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.project_name}"?`)) return;
    await deleteProject(p.id);
    notify("Project deleted");
    load();
  };

  const count = (s) => projects.filter((p) => p.status === s).length;
  const shown = projects.filter((p) => p.status === tab);
  const overdue = (p) => p.deadline && p.status === "active" && p.deadline < todayISO();

  return (
    <>
      <PageHeader
        title="My Projects"
        subtitle="Track progress with the Red / Yellow / Green Project Health Light."
        action={
          <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
            {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Close" : "New project"}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={submit} className="glass mb-6 grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <Field label="Project name" className="sm:col-span-2">
            <input required className="glass-input" value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} />
          </Field>
          <Field label="Description (scope & deliverables)" className="sm:col-span-2">
            <textarea rows={2} className="glass-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Start date">
            <input type="date" className="glass-input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </Field>
          <Field label="Deadline">
            <input type="date" className="glass-input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </Field>
          <button className="btn-primary sm:col-span-2">Save project</button>
        </form>
      )}

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "active", label: "Active Projects", count: count("active") },
          { value: "completed", label: "Completed Projects", count: count("completed") },
          { value: "cancelled", label: "Cancelled Projects", count: count("cancelled") },
        ]}
      />

      {shown.length === 0 ? (
        <EmptyState icon={FolderKanban} title={`No ${tab} projects`}>
          {tab === "active" ? "Create a project to start tracking its health." : "Projects you move here will show up in this list."}
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => (
            <div key={p.id} className="glass flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold leading-snug">{p.project_name}</h3>
                <StatusBadge status={p.status} />
              </div>
              {p.description && <p className="text-sm text-white/60">{p.description}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
                <span><CalendarDays size={12} className="mr-1 inline" />Start {fmtDate(p.start_date)}</span>
                <span className={overdue(p) ? "font-semibold text-red-300" : ""}>
                  Due {fmtDate(p.deadline)}{overdue(p) && " · overdue"}
                </span>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
                {p.status === "active" ? (
                  <ProjectHealthLight key={p.id + p.health_status} project={p} showLabel onChange={() => notify("Health status saved")} />
                ) : (
                  <span className="text-xs text-white/45">Health: {p.health_status}</span>
                )}
                <div className="flex items-center gap-1.5">
                  <select
                    value={p.status}
                    onChange={(e) => changeStatus(p, e.target.value)}
                    className="rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-xs outline-none"
                    aria-label="Project status"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button onClick={() => remove(p)} className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/15 hover:text-red-200" aria-label="Delete project">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
