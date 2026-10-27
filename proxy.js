// middleware.js (project root) — JWT role-based route protection + request metrics
// (API routes record their own latency via trackRequest in lib/upstash.js)
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { trackRequest } from "@/lib/upstash";

const ROLE_ROUTES = {
  freelancer: "/dashboard/freelancer",
  admin: "/dashboard/admin",
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export async function proxy(req, event) {
  const start = Date.now();
  const { pathname } = req.nextUrl;

  let res = NextResponse.next({ request: req });
  let role = null;
  let authenticated = false;
  let active = true;

  if (supabaseConfigured) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    // getUser() verifies the JWT with Supabase Auth — a forged token is rejected.
    const { data: { user } } = await supabase.auth.getUser();
    authenticated = Boolean(user);
    // role lives in app_metadata, which only the server/database can change
    role = user?.app_metadata?.role || null;
    active = user?.app_metadata?.is_active !== false;
  } else {
    // DEMO MODE: role cookie set by lib/data.js at login
    role = req.cookies.get("qq_demo_role")?.value || null;
    authenticated = Boolean(role);
  }

  const isDashboard = pathname.startsWith("/dashboard");
  const home = ROLE_ROUTES[role];
  let redirect = null;

  // Unauthenticated (or deactivated) access to any dashboard route -> login
  if (isDashboard && (!authenticated || !active)) {
    redirect = "/login";
  } else if (authenticated && active) {
    // Wrong role accessing another role's dashboard -> own home
    if (isDashboard && home && !pathname.startsWith(home)) redirect = home;
    // Authenticated user on /login or /register -> dashboard
    if ((pathname === "/login" || pathname === "/register") && home) redirect = home;
  }

  event.waitUntil(trackRequest(Date.now() - start));

  if (redirect) {
    const r = NextResponse.redirect(new URL(redirect, req.url));
    res.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  }
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
