"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { MarketerProfileProvider } from "@/lib/marketer-profile-context";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MarketerProfileProvider>
        {children}
      </MarketerProfileProvider>
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
}
