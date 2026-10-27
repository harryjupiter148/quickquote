import DashboardShell from "@/components/dashboard/DashboardShell";

export default function AdminLayout({ children }) {
  return <DashboardShell role="admin">{children}</DashboardShell>;
}
