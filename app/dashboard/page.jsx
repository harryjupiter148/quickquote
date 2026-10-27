"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/data";

// /dashboard → the signed-in user's role dashboard (middleware usually does this first)
export default function DashboardIndex() {
  const router = useRouter();
  useEffect(() => {
    getCurrentUser().then((u) =>
      router.replace(u ? (u.role === "admin" ? "/dashboard/admin" : "/dashboard/freelancer") : "/login")
    );
  }, [router]);
  return null;
}
