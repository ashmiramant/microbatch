"use client";

import { PublicOrderForm } from "@/app/order-form/page";

export default function RootedCommunityOrderFormPage() {
  return (
    <PublicOrderForm
      channel="rooted_community"
      title="Rooted Community Order Form"
      headerLines={[
        "Fig Mint Farms, 1501 Two Pond Lane, Apex 4:30-5:30pm",
        "Pre-orders close 9pm the Sunday before pickups",
        "Payment due upon pickup",
      ]}
    />
  );
}
