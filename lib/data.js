// lib/data.js — single data-access layer for the whole UI.
// LIVE MODE  : Supabase (auth + Postgres + RLS + Storage) and /api routes.
// DEMO MODE  : lib/demo-store.js (browser storage), used when keys are not set.
import { createClient, isSupabaseConfigured } from "./supabase";
import * as demo from "./demo-store";
import { invoiceTotals } from "./format";

export const isDemo = !isSupabaseConfigured;
const sb = () => createClient();

const DEMO_COOKIE = "qq_demo_role";
const setDemoCookie = (role) => {
  try {
    document.cookie = role
      ? `${DEMO_COOKIE}=${role}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
      : `${DEMO_COOKIE}=; path=/; max-age=0`;
  } catch {
    /* no document (e.g. preview) */
  }
};

const fail = (error) => {
  if (error) throw new Error(error.message || String(error));
};

const strip = (u) => {
  if (!u) return null;
  const { password, ...rest } = u; // eslint-disable-line no-unused-vars
  return rest;
};

/* ------------------------------------------------------------------ AUTH */

export async function getCurrentUser() {
  if (isDemo) {
    const s = demo.load();
    return strip(s.users.find((u) => u.id === s.session));
  }
  const { data } = await sb().auth.getUser();
  if (!data?.user) return null;
  const { data: profile } = await sb().from("users").select("*").eq("id", data.user.id).single();
  return profile;
}

export async function signIn(email, password) {
  email = email.trim().toLowerCase();
  if (isDemo) {
    const s = demo.load();
    const u = s.users.find((x) => x.email === email && x.password === password);
    if (!u) throw new Error("Invalid email or password");
    if (!u.is_active) throw new Error("This account has been deactivated by an administrator.");
    s.session = u.id;
    demo.save();
    setDemoCookie(u.role);
    return strip(u);
  }
  const { error } = await sb().auth.signInWithPassword({ email, password });
  if (error) throw new Error("Invalid email or password");
  const profile = await getCurrentUser();
  if (!profile) throw new Error("Profile not found. Did you run the SQL migration?");
  if (!profile.is_active) {
    await sb().auth.signOut();
    throw new Error("This account has been deactivated by an administrator.");
  }
  return profile;
}

export async function signUp({ first_name, last_name, email, password }) {
  email = email.trim().toLowerCase();
  if (isDemo) {
    const s = demo.load();
    if (s.users.some((u) => u.email === email)) throw new Error("This email is already registered.");
    const u = {
      id: demo.uid(), first_name, last_name, email, password, role: "freelancer",
      business_name: null, tax_rate: 7.5, is_active: true, created_at: new Date().toISOString(),
    };
    s.users.push(u);
    s.session = u.id;
    demo.save();
    setDemoCookie("freelancer");
    return { user: strip(u), needsConfirmation: false };
  }
  const { data, error } = await sb().auth.signUp({
    email,
    password,
    options: { data: { first_name, last_name } },
  });
  fail(error);
  if (!data.session) return { user: null, needsConfirmation: true };
  return { user: await getCurrentUser(), needsConfirmation: false };
}

export async function signOut() {
  if (isDemo) {
    const s = demo.load();
    s.session = null;
    demo.save();
    setDemoCookie(null);
    return;
  }
  await sb().auth.signOut();
}

export async function requestPasswordReset(email) {
  if (isDemo) return;
  const { error } = await sb().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  fail(error);
}

export async function updatePassword(password) {
  if (isDemo) return;
  const { error } = await sb().auth.updateUser({ password });
  fail(error);
}

export async function updateProfile(id, patch) {
  if (isDemo) {
    const s = demo.load();
    const u = s.users.find((x) => x.id === id);
    Object.assign(u, patch);
    demo.save();
    return strip(u);
  }
  const { data, error } = await sb().from("users").update(patch).eq("id", id).select().single();
  fail(error);
  return data;
}

/* -------------------------------------------------------------- PROJECTS */

export async function listProjects(userId) {
  if (isDemo) {
    return demo.load().projects
      .filter((p) => p.freelancer_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const { data, error } = await sb().from("projects").select("*").order("created_at", { ascending: false });
  fail(error);
  return data;
}

export async function createProject(userId, p) {
  const row = {
    freelancer_id: userId,
    project_name: p.project_name,
    description: p.description || null,
    start_date: p.start_date || null,
    deadline: p.deadline || null,
    health_status: "green",
    status: "active",
  };
  if (isDemo) {
    const s = demo.load();
    const full = { id: demo.uid(), created_at: new Date().toISOString(), ...row };
    s.projects.push(full);
    demo.save();
    return full;
  }
  const { data, error } = await sb().from("projects").insert(row).select().single();
  fail(error);
  return data;
}

export async function updateProject(id, patch) {
  if (isDemo) {
    const s = demo.load();
    Object.assign(s.projects.find((p) => p.id === id), patch);
    demo.save();
    return;
  }
  const { error } = await sb().from("projects").update(patch).eq("id", id);
  fail(error);
}

export async function deleteProject(id) {
  if (isDemo) {
    const s = demo.load();
    s.projects = s.projects.filter((p) => p.id !== id);
    demo.save();
    return;
  }
  const { error } = await sb().from("projects").delete().eq("id", id);
  fail(error);
}

/* ------------------------------------------------------------ QUOTATIONS */

export async function listQuotations(userId) {
  if (isDemo) {
    return demo.load().quotations
      .filter((q) => q.freelancer_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const { data, error } = await sb().from("quotations").select("*").order("created_at", { ascending: false });
  fail(error);
  return data;
}

export async function createQuotation(userId, q) {
  const gross = parseFloat(q.gross_amount);
  const rate = parseFloat(q.tax_rate);
  const row = {
    freelancer_id: userId,
    project_id: q.project_id || null,
    service_description: q.service_description,
    gross_amount: gross,
    tax_rate: rate,
    net_amount: +(gross * (1 - rate / 100)).toFixed(2),
    expiry_date: q.expiry_date || null,
  };
  if (isDemo) {
    const s = demo.load();
    const full = { id: demo.uid(), created_at: new Date().toISOString(), ...row };
    s.quotations.push(full);
    demo.save();
    return full;
  }
  const { data, error } = await sb().from("quotations").insert(row).select().single();
  fail(error);
  return data;
}

export async function deleteQuotation(id) {
  if (isDemo) {
    const s = demo.load();
    s.quotations = s.quotations.filter((q) => q.id !== id);
    demo.save();
    return;
  }
  const { error } = await sb().from("quotations").delete().eq("id", id);
  fail(error);
}

/* -------------------------------------------------------------- INVOICES */
// Live mode goes through app/api/invoices/route.js (server-side validation,
// total computation and Upstash latency tracking).

async function api(path, init) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export async function listInvoices(userId) {
  if (isDemo) {
    const s = demo.load();
    return s.invoices
      .filter((i) => i.freelancer_id === userId)
      .map((i) => ({ ...i, invoice_line_items: s.invoice_line_items.filter((li) => li.invoice_id === i.id) }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const { invoices } = await api("/api/invoices");
  return invoices;
}

export async function createInvoice(userId, inv) {
  if (isDemo) {
    const s = demo.load();
    const totals = invoiceTotals(inv.items, inv.tax_rate);
    const id = demo.uid();
    const row = {
      id, freelancer_id: userId, project_id: inv.project_id || null,
      invoice_number: inv.invoice_number, client_name: inv.client_name, client_email: inv.client_email,
      project_title: inv.project_title, tax_rate: parseFloat(inv.tax_rate) || 0, ...totals,
      status: inv.status || "sent", issue_date: inv.issue_date, due_date: inv.due_date || null,
      notes: inv.notes || "", pdf_url: null, created_at: new Date().toISOString(),
    };
    s.invoices.push(row);
    inv.items.forEach((it) =>
      s.invoice_line_items.push({
        id: demo.uid(), invoice_id: id, description: it.description,
        quantity: parseFloat(it.quantity) || 0, unit_price: parseFloat(it.unit_price) || 0,
        total_price: (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0),
      })
    );
    demo.save();
    return row;
  }
  const { invoice } = await api("/api/invoices", { method: "POST", body: JSON.stringify(inv) });
  return invoice;
}

export async function updateInvoiceStatus(id, status) {
  if (isDemo) {
    const s = demo.load();
    s.invoices.find((i) => i.id === id).status = status;
    demo.save();
    return;
  }
  await api("/api/invoices", { method: "PATCH", body: JSON.stringify({ id, status }) });
}

// Saves the generated PDF to Supabase Storage (bucket "invoices") — live mode only.
export async function uploadInvoicePdf(userId, invoiceId, blob) {
  if (isDemo) return null;
  const path = `${userId}/${invoiceId}.pdf`;
  const { error } = await sb().storage.from("invoices").upload(path, blob, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) {
    console.warn("PDF upload skipped:", error.message);
    return null;
  }
  await api("/api/invoices", { method: "PATCH", body: JSON.stringify({ id: invoiceId, pdf_url: path }) });
  return path;
}

/* ----------------------------------------------------------------- ADMIN */

export async function listUsers() {
  if (isDemo) {
    return demo.load().users.map(strip).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const { data, error } = await sb().from("users").select("*").order("created_at", { ascending: false });
  fail(error);
  return data;
}

export async function setUserActive(id, is_active) {
  if (isDemo) {
    const s = demo.load();
    s.users.find((u) => u.id === id).is_active = is_active;
    demo.save();
    return;
  }
  const { error } = await sb().from("users").update({ is_active }).eq("id", id);
  fail(error);
}

// Simulated metrics: used when the API route is unreachable (static preview).
let sim = { count: 18, avg: 140 };
function simulateMetrics() {
  sim.count = Math.max(1, Math.round(sim.count + (Math.random() - 0.45) * 8));
  sim.avg = Math.max(40, sim.avg + (Math.random() - 0.5) * 60);
  const peak = sim.avg * (1.6 + Math.random() * 3.2);
  return {
    requestCount: sim.count,
    avgLatency: +sim.avg.toFixed(2),
    peakLatency: +peak.toFixed(2),
    timestamp: new Date().toISOString(),
    source: "simulated",
  };
}

export async function fetchMetrics() {
  try {
    const res = await fetch("/api/metrics", { cache: "no-store" });
    if (!res.ok) throw new Error("metrics route unavailable");
    const json = await res.json();
    if (typeof json.requestCount !== "number") throw new Error("bad payload");
    return json;
  } catch {
    return simulateMetrics();
  }
}

export async function saveMetricsSnapshot(adminId, m) {
  const row = {
    api_request_count: m.requestCount,
    avg_latency_ms: m.avgLatency,
    recorded_by: adminId,
  };
  if (isDemo) {
    const s = demo.load();
    s.system_metrics.unshift({ id: demo.uid(), recorded_at: new Date().toISOString(), ...row });
    s.system_metrics = s.system_metrics.slice(0, 50);
    demo.save();
    return;
  }
  const { error } = await sb().from("system_metrics").insert(row);
  if (error) console.warn("Snapshot not saved:", error.message);
}

export async function listMetricsSnapshots() {
  if (isDemo) return demo.load().system_metrics;
  const { data } = await sb()
    .from("system_metrics")
    .select("*")
    .order("recorded_at", { ascending: false })
    .limit(50);
  return data || [];
}

export function resetDemoData() {
  if (isDemo) demo.reset();
}
