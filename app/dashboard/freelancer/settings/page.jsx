"use client";
import PageHeader from "@/components/dashboard/PageHeader";
import ProfileForm from "@/components/dashboard/ProfileForm";

export default function FreelancerSettings() {
  return (
    <>
      <PageHeader title="Profile & Settings" subtitle="Your details and the defaults used by your tools." />
      <ProfileForm />
    </>
  );
}
