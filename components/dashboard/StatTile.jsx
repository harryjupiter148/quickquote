export default function StatTile({ icon: Icon, label, value, hint, tone = "text-white" }) {
  return (
    <div className="glass p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/55">
        {Icon && <Icon size={14} />} {label}
      </div>
      <p className={`mt-2 text-xl font-extrabold sm:text-2xl ${tone}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-white/45">{hint}</p>}
    </div>
  );
}
