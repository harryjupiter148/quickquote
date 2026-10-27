"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, Briefcase, ShieldCheck } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";
import Field from "@/components/ui/Field";
import { isDemo, requestPasswordReset, signIn } from "@/lib/data";

const HOME = { freelancer: "/dashboard/freelancer", admin: "/dashboard/admin" };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const doLogin = async (e, creds) => {
    e?.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const user = await signIn(creds?.email ?? email, creds?.password ?? password);
      router.replace(HOME[user.role] || "/");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError("");
    if (!email) return setError("Enter your email address first.");
    try {
      await requestPasswordReset(email);
      setInfo(isDemo ? "Password reset emails are sent in live mode (Supabase)." : "Check your inbox for a reset link.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your QuickQuote dashboard."
      footer={<>New here? <Link href="/register" className="font-semibold text-white hover:underline">Create an account</Link></>}
    >
      <form onSubmit={doLogin} className="space-y-4">
        <Field label="Email address">
          <input type="email" required autoComplete="email" className="glass-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </Field>
        <Field label="Password">
          <input type="password" required autoComplete="current-password" className="glass-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <div className="flex justify-end">
          <button type="button" onClick={forgot} className="text-xs text-white/60 hover:text-white">Forgot password?</button>
        </div>
        {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}
        {info && <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">{info}</p>}
        <button disabled={busy} className="btn-primary w-full">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />} Sign In
        </button>
      </form>

      {isDemo && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="mb-3 text-center text-xs uppercase tracking-wide text-white/45">Demo mode — try a role</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => doLogin(null, { email: "ada@quickquote.app", password: "demo1234" })} className="btn-ghost !py-3 text-xs">
              <Briefcase size={15} /> Freelancer
            </button>
            <button onClick={() => doLogin(null, { email: "admin@quickquote.app", password: "admin123" })} className="btn-ghost !py-3 text-xs">
              <ShieldCheck size={15} /> Administrator
            </button>
          </div>
        </div>
      )}
    </AuthCard>
  );
}
