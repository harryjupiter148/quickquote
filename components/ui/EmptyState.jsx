export default function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="glass-soft flex flex-col items-center px-6 py-10 text-center">
      {Icon && <Icon size={28} className="mb-3 text-white/40" />}
      <p className="font-semibold text-white/85">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-white/50">{children}</p>}
    </div>
  );
}
