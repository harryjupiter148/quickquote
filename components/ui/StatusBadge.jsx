const STYLES = {
  draft: "bg-white/15 text-white/80",
  sent: "bg-sky-400/20 text-sky-200",
  approved: "bg-violet-400/25 text-violet-200",
  paid: "bg-emerald-400/20 text-emerald-200",
  active: "bg-sky-400/20 text-sky-200",
  completed: "bg-emerald-400/20 text-emerald-200",
  cancelled: "bg-red-400/20 text-red-200",
  freelancer: "bg-cyan-400/20 text-cyan-200",
  admin: "bg-violet-400/25 text-violet-200",
  inactive: "bg-red-400/20 text-red-200",
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${STYLES[status] || STYLES.draft}`}>{status}</span>;
}
