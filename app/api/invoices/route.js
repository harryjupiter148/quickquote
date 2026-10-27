// app/api/invoices/route.js — Invoice CRUD API (Supabase + RLS, latency tracked in Upstash)
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { trackRequest } from "@/lib/upstash";

export const dynamic = "force-dynamic";

const STATUSES = ["draft", "sent", "approved", "paid"];

async function withTiming(handler) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Supabase is not configured — the app is in demo mode (invoices are stored in the browser)." },
      { status: 503 }
    );
  }
  const start = Date.now();
  try {
    return await handler();
  } catch (err) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  } finally {
    await trackRequest(Date.now() - start);
  }
}

async function requireUser(supabase) {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

// GET /api/invoices — the signed-in freelancer's invoices with line items
export async function GET() {
  return withTiming(async () => {
    const supabase = createServerSupabase();
    const user = await requireUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("invoices")
      .select("*, invoice_line_items(*)")
      .eq("freelancer_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ invoices: data });
  });
}

// POST /api/invoices — create invoice + line items (totals computed server-side)
export async function POST(req) {
  return withTiming(async () => {
    const supabase = createServerSupabase();
    const user = await requireUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const items = (body.items || [])
      .map((it) => ({
        description: String(it.description || "").slice(0, 300).trim(),
        quantity: Number(it.quantity) || 0,
        unit_price: Number(it.unit_price) || 0,
      }))
      .filter((it) => it.description && it.quantity > 0 && it.unit_price > 0);

    if (!body.client_name || !body.client_email || !body.project_title || items.length === 0) {
      return NextResponse.json({ error: "Client, project title and at least one line item are required." }, { status: 400 });
    }

    const subtotal = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
    const taxRate = Math.min(100, Math.max(0, Number(body.tax_rate) || 0));
    const tax_amount = +(subtotal * (taxRate / 100)).toFixed(2);
    const status = STATUSES.includes(body.status) ? body.status : "sent";

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        freelancer_id: user.id,
        project_id: body.project_id || null,
        invoice_number: body.invoice_number,
        client_name: body.client_name,
        client_email: body.client_email,
        project_title: body.project_title,
        notes: body.notes || null,
        subtotal: +subtotal.toFixed(2),
        tax_rate: taxRate,
        tax_amount,
        total_amount: +(subtotal + tax_amount).toFixed(2),
        status,
        issue_date: body.issue_date,
        due_date: body.due_date || null,
      })
      .select()
      .single();
    if (error) throw error;

    const { error: liError } = await supabase.from("invoice_line_items").insert(
      items.map((it) => ({ ...it, invoice_id: invoice.id, total_price: +(it.quantity * it.unit_price).toFixed(2) }))
    );
    if (liError) throw liError;

    return NextResponse.json({ invoice }, { status: 201 });
  });
}

// PATCH /api/invoices — update status and/or stored PDF path
export async function PATCH(req) {
  return withTiming(async () => {
    const supabase = createServerSupabase();
    const user = await requireUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status, pdf_url } = await req.json();
    const patch = {};
    if (status) {
      if (!STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      patch.status = status;
    }
    if (pdf_url) patch.pdf_url = pdf_url;

    const { error } = await supabase.from("invoices").update(patch).eq("id", id).eq("freelancer_id", user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  });
}
