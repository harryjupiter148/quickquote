"use client";
import { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { useDashboard } from "./UserContext";
import Field from "@/components/ui/Field";
import { isDemo, resetDemoData, updateProfile } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export default function ProfileForm() {
  const { user, setUser, notify } = useDashboard();
  const isFreelancer = user.role === "freelancer";
  const [f, setF] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    business_name: user.business_name || "",
    tax_rate: user.tax_rate ?? 7.5,
  });
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const patch = { first_name: f.first_name, last_name: f.last_name };
      if (isFreelancer) {
        patch.business_name = f.business_name || null;
        patch.tax_rate = parseFloat(f.tax_rate) || 0;
      }
      const updated = await updateProfile(user.id, patch);
      setUser({ ...user, ...updated });
      notify("Profile saved");
    } catch (err) {
      notify(err.message, "error");
    }
    setBusy(false);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <form onSubmit={save} className="glass grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:col-span-2">
        <Field label="First name">
          <input required className="glass-input" value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} />
        </Field>
        <Field label="Last name">
          <input required className="glass-input" value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} />
        </Field>
        {isFreelancer && (
          <>
            <Field label="Business / trading name" hint="Printed on your invoices.">
              <input className="glass-input" value={f.business_name} onChange={(e) => setF({ ...f, business_name: e.target.value })} />
            </Field>
            <Field label="Default tax rate (%)" hint="Pre-fills the Tax Estimator and invoices.">
              <input type="number" min="0" max="100" step="0.01" className="glass-input" value={f.tax_rate} onChange={(e) => setF({ ...f, tax_rate: e.target.value })} />
            </Field>
          </>
        )}
        <button disabled={busy} className="btn-primary sm:col-span-2">
          <Save size={16} /> Save changes
        </button>
      </form>

      <div className="glass space-y-3 p-5 text-sm sm:p-6">
        <p className="tile-title">Account</p>
        <div><p className="text-xs text-white/45">Email</p><p>{user.email}</p></div>
        <div><p className="text-xs text-white/45">Role</p><p className="capitalize">{user.role}</p></div>
        <div><p className="text-xs text-white/45">Member since</p><p>{fmtDate(user.created_at)}</p></div>
        {isDemo && (
          <button
            onClick={() => {
              if (!window.confirm("Reset all demo data?")) return;
              resetDemoData();
              window.location.reload();
            }}
            className="btn-ghost mt-2 w-full !py-2 text-xs"
          >
            <RotateCcw size={14} /> Reset demo data
          </button>
        )}
      </div>
    </div>
  );
}
