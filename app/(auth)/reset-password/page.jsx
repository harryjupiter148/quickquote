"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2, KeyRound } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";
import Field from "@/components/ui/Field";
import { updatePassword } from "@/lib/data";

// Landing page for Supabase password-reset emails.
export default function ResetPasswordPage() {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return setMsg({ ok: false, text: "Password must be at least 8 characters." });
    setBusy(true);
    try {
      await updatePassword(pw);
      setMsg({ ok: true, text: "Password updated. You can now sign in." });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
    setBusy(false);
  };

  return (
    <AuthCard title="Set a new password" footer={<Link href="/login" className="hover:underline">Back to login</Link>}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password">
          <input type="password" className="glass-input" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        {msg && (
          <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-500/15 text-emerald-200" : "bg-red-500/15 text-red-200"}`}>
            {msg.text}
          </p>
        )}
        <button disabled={busy} className="btn-primary w-full">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} Update password
        </button>
      </form>
    </AuthCard>
  );
}
