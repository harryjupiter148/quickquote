"use client";
import PageHeader from "@/components/dashboard/PageHeader";
import ProfileForm from "@/components/dashboard/ProfileForm";

export default function AdminSettings() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Administrator profile." />
      <ProfileForm />
    </>
  );
}
