// lib/demo-store.js — in-browser data store used when Supabase keys are not set.
// Mirrors the Supabase tables (users, projects, quotations, invoices,
// invoice_line_items, system_metrics) so the UI behaves the same in both modes.

const KEY = "quickquote_demo_v1";
let memory = null;

const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36));

const isoDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
const dateDaysAgo = (n) => isoDaysAgo(n).slice(0, 10);

function seed() {
  const ada = "u-ada";
  const users = [
    { id: "u-admin", first_name: "System", last_name: "Admin", email: "admin@quickquote.app", password: "admin123", role: "admin", business_name: null, tax_rate: null, is_active: true, created_at: isoDaysAgo(200) },
    { id: ada, first_name: "Ada", last_name: "Okafor", email: "ada@quickquote.app", password: "demo1234", role: "freelancer", business_name: "Ada Creative Studio", tax_rate: 7.5, is_active: true, created_at: isoDaysAgo(180) },
    { id: "u-chi", first_name: "Chinedu", last_name: "Eze", email: "chinedu@unn.edu.ng", password: "x", role: "freelancer", business_name: "CE Web Labs", tax_rate: 7.5, is_active: true, created_at: isoDaysAgo(120) },
    { id: "u-zai", first_name: "Zainab", last_name: "Bello", email: "zainab@unn.edu.ng", password: "x", role: "freelancer", business_name: "Zee Writes", tax_rate: 5, is_active: true, created_at: isoDaysAgo(75) },
    { id: "u-tun", first_name: "Tunde", last_name: "Adeyemi", email: "tunde@unn.edu.ng", password: "x", role: "freelancer", business_name: null, tax_rate: 7.5, is_active: false, created_at: isoDaysAgo(60) },
    { id: "u-ngo", first_name: "Ngozi", last_name: "Nwosu", email: "ngozi@unn.edu.ng", password: "x", role: "freelancer", business_name: "Ngozi Designs", tax_rate: 7.5, is_active: true, created_at: isoDaysAgo(20) },
  ];

  const projects = [
    { id: "p1", freelancer_id: ada, project_name: "Campus Bookshop Website", description: "Next.js storefront with Paystack checkout.", start_date: dateDaysAgo(40), deadline: dateDaysAgo(-10), health_status: "green", status: "active", created_at: isoDaysAgo(40) },
    { id: "p2", freelancer_id: ada, project_name: "SPE Logo Refresh", description: "Brand refresh and social templates.", start_date: dateDaysAgo(20), deadline: dateDaysAgo(-3), health_status: "yellow", status: "active", created_at: isoDaysAgo(20) },
    { id: "p3", freelancer_id: ada, project_name: "Hostel Booking App UI", description: "Figma screens for a hostel booking app.", start_date: dateDaysAgo(15), deadline: dateDaysAgo(2), health_status: "red", status: "active", created_at: isoDaysAgo(15) },
    { id: "p4", freelancer_id: ada, project_name: "Church Event Flyers", description: "Monthly flyer pack.", start_date: dateDaysAgo(120), deadline: dateDaysAgo(95), health_status: "green", status: "completed", created_at: isoDaysAgo(120) },
    { id: "p5", freelancer_id: ada, project_name: "Data Entry Gig", description: "Cancelled by client.", start_date: dateDaysAgo(70), deadline: dateDaysAgo(60), health_status: "red", status: "cancelled", created_at: isoDaysAgo(70) },
  ];

  const mkInvoice = (n, daysAgo, client, email, title, project_id, status, items) => {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const tax_amount = subtotal * 0.075;
    const id = "inv" + n;
    return {
      invoice: { id, freelancer_id: ada, project_id, invoice_number: `QQ-2026-10${n}`, client_name: client, client_email: email, project_title: title, subtotal, tax_rate: 7.5, tax_amount, total_amount: subtotal + tax_amount, status, issue_date: dateDaysAgo(daysAgo), due_date: dateDaysAgo(daysAgo - 14), pdf_url: null, notes: "", created_at: isoDaysAgo(daysAgo) },
      items: items.map((i) => ({ id: uid(), invoice_id: id, ...i, total_price: i.quantity * i.unit_price })),
    };
  };

  const inv = [
    mkInvoice(1, 165, "Grace Church Nsukka", "media@gracechurch.ng", "Church Event Flyers", "p4", "paid", [{ description: "Flyer design (A4)", quantity: 4, unit_price: 12000 }]),
    mkInvoice(2, 140, "Grace Church Nsukka", "media@gracechurch.ng", "Church Event Flyers", "p4", "paid", [{ description: "Flyer design (A4)", quantity: 5, unit_price: 12000 }, { description: "Instagram resizes", quantity: 5, unit_price: 3000 }]),
    mkInvoice(3, 110, "Okeke Ventures", "hello@okekeventures.com", "Product catalogue", null, "paid", [{ description: "Catalogue layout", quantity: 1, unit_price: 85000 }]),
    mkInvoice(4, 80, "Data Hub NG", "ops@datahub.ng", "Data Entry Gig", "p5", "paid", [{ description: "Data entry (hours)", quantity: 20, unit_price: 2500 }]),
    mkInvoice(5, 50, "UNN Bookshop", "bookshop@unn.edu.ng", "Campus Bookshop Website", "p1", "paid", [{ description: "Design & prototype", quantity: 1, unit_price: 120000 }]),
    mkInvoice(6, 25, "SPE UNN Section", "spe@unn.edu.ng", "SPE Logo Refresh", "p2", "approved", [{ description: "Logo concepts", quantity: 3, unit_price: 25000 }]),
    mkInvoice(7, 12, "UNN Bookshop", "bookshop@unn.edu.ng", "Campus Bookshop Website", "p1", "sent", [{ description: "Frontend build", quantity: 1, unit_price: 150000 }, { description: "Paystack integration", quantity: 1, unit_price: 45000 }]),
    mkInvoice(8, 3, "Lodge Finder", "team@lodgefinder.ng", "Hostel Booking App UI", "p3", "draft", [{ description: "UI screens", quantity: 12, unit_price: 6000 }]),
  ];

  const quotations = [
    { id: "q1", freelancer_id: ada, project_id: "p1", service_description: "Campus bookshop website — design, build and deploy", gross_amount: 300000, tax_rate: 7.5, net_amount: 277500, expiry_date: dateDaysAgo(-20), created_at: isoDaysAgo(45) },
    { id: "q2", freelancer_id: ada, project_id: null, service_description: "Wedding invitation suite (print + digital)", gross_amount: 60000, tax_rate: 7.5, net_amount: 55500, expiry_date: dateDaysAgo(-7), created_at: isoDaysAgo(5) },
  ];

  return {
    session: null,
    users,
    projects,
    quotations,
    invoices: inv.map((x) => x.invoice),
    invoice_line_items: inv.flatMap((x) => x.items),
    system_metrics: [],
  };
}

export function load() {
  if (memory) return memory;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      memory = JSON.parse(raw);
      return memory;
    }
  } catch {
    /* storage unavailable — fall back to memory only */
  }
  memory = seed();
  save();
  return memory;
}

export function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* ignore */
  }
}

export function reset() {
  memory = seed();
  save();
}

export { uid };
