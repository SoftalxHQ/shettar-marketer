"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import { useIsClient } from "@/lib/useIsClient";

export type MarketerProfile = {
  id: number;
  full_name: string;
  email: string;
  referrer_code: string;
  status: string;
  bank_name?: string | null;
  account_number?: string | null;
  account_name?: string | null;
  bank_code?: string | null;
  bank_verified?: boolean;
  balance?: number;
  commission_balance?: number;
};

type MarketerProfileContextValue = {
  profile: MarketerProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const MarketerProfileContext = createContext<MarketerProfileContextValue | null>(null);

export function MarketerProfileProvider({ children }: { children: ReactNode }) {
  const isClient = useIsClient();
  const [profile, setProfile] = useState<MarketerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("marketer_token");
    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/v1/marketers/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load profile");
        setProfile(null);
        return;
      }
      setProfile(json.marketer);
    } catch {
      setError("Failed to load profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    refresh();
  }, [isClient, refresh]);

  const value = useMemo(
    () => ({ profile, loading, error, refresh }),
    [profile, loading, error, refresh],
  );

  return (
    <MarketerProfileContext.Provider value={value}>
      {children}
    </MarketerProfileContext.Provider>
  );
}

export function useMarketerProfile() {
  const ctx = useContext(MarketerProfileContext);
  if (!ctx) {
    throw new Error("useMarketerProfile must be used within MarketerProfileProvider");
  }
  return ctx;
}
