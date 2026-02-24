"use client";

import { PublicOrderForm } from "@/app/order-form/page";

export default function RootedCommunityOrderFormPage() {
  return (
    <PublicOrderForm
      channel="rooted_community"
      title="Rooted Community Order Form"
      headerLines={[
        "Pickup at Fig Mint Farms, 1501 Two Pond Lane, Apex, from 4:30-5:30pm.",
        "Pre-Orders close 9pm, the Sunday before.",
      ]}
    />
  );
}
