"use client";

import { MarketerProfileProvider } from "@/lib/marketer-profile-context";

export default function WithdrawLayout({ children }: { children: React.ReactNode }) {
  return <MarketerProfileProvider>{children}</MarketerProfileProvider>;
}
