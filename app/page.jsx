import Link from "next/link";
import {
  Calculator, Receipt, TrendingUp, Activity, BarChart3, ShieldCheck, ArrowRight,
} from "lucide-react";
import Logo from "@/components/ui/Logo";

const FEATURES = [
  { icon: Calculator, title: "Tax Estimator", text: "Enter a fee and your local tax rate — see your take-home pay instantly.", tone: "text-cyan-300", span: "md:col-span-2" },
  { icon: Receipt, title: "Instant Invoice Generator", text: "Fill a form, watch a professional PDF render live, download in one click.", tone: "text-violet-300", span: "md:row-span-2" },
  { icon: TrendingUp, title: "Time-to-Value Calculator", text: "Turn a monthly income goal and your hours into a minimum hourly rate.", tone: "text-emerald-300", span: "" },
  { icon: Activity, title: "Project Health Light", text: "Red, Yellow or Green — know which project needs you first.", tone: "text-amber-300", span: "" },
  { icon: BarChart3, title: "Earnings dashboard", text: "Charts of invoiced vs paid income and revenue per project.", tone: "text-sky-300", span: "md:col-span-2" },
  { icon: ShieldCheck, title: "Admin monitoring", text: "Live API request counts and latency for the people who run the platform.", tone: "text-rose-300", span: "" },
];

export default function Landing() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-20">
      <header className="flex items-center justify-between py-6">
        <Logo size={38} />
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost !py-2">Login</Link>
          <Link href="/register" className="btn-primary !py-2">Sign Up</Link>
        </nav>
      </header>

      <section className="pb-14 pt-10 text-center sm:pt-16">
        <span className="badge mb-5 border border-white/20 bg-white/10 !px-3 !py-1 text-white/80">
          Free for student freelancers · ₦0 subscription
        </span>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
          Quote, invoice and price your work —{" "}
          <span className="bg-qq-gradient bg-clip-text text-transparent">in one quick place.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-white/65 sm:text-lg">
          QuickQuote gives student freelancers professional tools for taxes, invoices, rates and
          project tracking — without the expensive monthly plans.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="btn-primary !px-6 !py-3 text-base">
            Create free account <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="btn-ghost !px-6 !py-3 text-base">I have an account</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text, tone, span }) => (
          <div key={title} className={`glass p-6 ${span}`}>
            <Icon className={tone} size={26} />
            <h3 className="mt-4 text-lg font-bold">{title}</h3>
            <p className="mt-1.5 text-sm text-white/60">{text}</p>
          </div>
        ))}
      </section>

      <footer className="mt-16 text-center text-xs text-white/40">
        QuickQuote
      </footer>
    </div>
  );
}
