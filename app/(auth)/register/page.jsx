"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, MailCheck } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";
import Field from "@/components/ui/Field";
import { signUp } from "@/lib/data";

export default function RegisterPage() {
  const router = useRouter();
  const [f, setF] = useState({ first_name: "", last_name: "", email: "", password: "", role: "freelancer" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (f.password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(f);
      if (needsConfirmation) {
        setConfirm(true);
        setBusy(false);
        return;
      }
      router.replace("/dashboard/freelancer");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (confirm) {
    return (
      <AuthCard title="Check your email" subtitle="One more step.">
        <div className="flex flex-col items-center gap-3 text-center">
          <MailCheck size={40} className="text-emerald-300" />
          <p className="text-sm text-white/70">
            We sent a confirmation link to <b>{f.email}</b>. Click it, then sign in.
          </p>
          <Link href="/login" className="btn-primary mt-2 w-full">Go to login</Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Free professional tools for student freelancers."
      footer={<>Already registered? <Link href="/login" className="font-semibold text-white hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <input required className="glass-input" value={f.first_name} onChange={set("first_name")} />
          </Field>
          <Field label="Last name">
            <input required className="glass-input" value={f.last_name} onChange={set("last_name")} />
          </Field>
        </div>
        <Field label="Email address">
          <input type="email" required autoComplete="email" className="glass-input" value={f.email} onChange={set("email")} />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <input type="password" required autoComplete="new-password" className="glass-input" value={f.password} onChange={set("password")} />
        </Field>
        <Field label="Role" hint="Administrator accounts are created by the system administrator.">
          <select className="glass-input" value={f.role} onChange={set("role")}>
            <option value="freelancer">Freelancer</option>
          </select>
        </Field>
        {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Create Account
        </button>
      </form>
    </AuthCard>
  );
}
