"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiBase } from "@/lib/api";
import { useIsClient } from "@/lib/useIsClient";
import { BrandShell } from "@/components/brand-shell";
import { UiCard } from "@/components/ui-card";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40";

type PerformancePayload = Record<string, unknown> & {
  marketer?: { full_name?: string; referrer_code?: string; email?: string };
};

export default function MarketerDashboardPage() {
  const isClient = useIsClient();
  const [data, setData] = useState<PerformancePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const token = isClient ? localStorage.getItem("marketer_token") : null;

  useEffect(() => {
    if (!isClient || !token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/api/v1/marketers/me/performance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json()) as PerformancePayload;
        if (cancelled) return;
        if (!res.ok) {
          setError((json.error as string) || "Failed to load");
          return;
        }
        setData(json);
      } catch {
        if (!cancelled) setError("Network error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isClient, token]);

  const logout = () => {
    localStorage.removeItem("marketer_token");
    window.location.href = "/login";
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    setPwErr(null);
    if (!token) return;
    setPwLoading(true);
    try {
      const res = await fetch(`${apiBase()}/api/v1/marketers/me/password`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marketer: {
            current_password: currPass,
            password: newPass,
            password_confirmation: newPass2,
          },
        }),
      });
      const json = (await res.json()) as { message?: string; errors?: string[] };
      if (!res.ok) {
        setPwErr(json.errors?.join(", ") || "Could not update password");
        return;
      }
      setPwMsg(json.message || "Password updated");
      setCurrPass("");
      setNewPass("");
      setNewPass2("");
    } catch {
      setPwErr("Network error");
    } finally {
      setPwLoading(false);
    }
  };

  if (!isClient) {
    return (
      <BrandShell>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </BrandShell>
    );
  }

  if (!token) {
    return (
      <BrandShell>
        <UiCard title="Session expired" description="Sign in again to continue.">
          <p className="text-sm text-red-600">You are not signed in.</p>
          <Link href="/login" className="mt-4 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline">
            Go to login
          </Link>
        </UiCard>
      </BrandShell>
    );
  }

  if (error && !data) {
    return (
      <BrandShell>
        <UiCard title="Could not load dashboard" description={error}>
          <Link href="/login" className="text-sm font-medium text-primary underline-offset-2 hover:underline">
            Go to login
          </Link>
        </UiCard>
      </BrandShell>
    );
  }

  if (!data) {
    return (
      <BrandShell>
        <p className="text-sm text-muted-foreground">Loading your stats…</p>
      </BrandShell>
    );
  }

  return (
    <BrandShell
      footer={
        <button
          type="button"
          onClick={logout}
          className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Log out
        </button>
      }
    >
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Referrals, revenue, and account security.</p>
        </div>

        <UiCard title="Performance" description="Totals across businesses you referred.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="Referrals" value={String(data.total_referrals ?? "—")} />
            <Stat label="Active businesses" value={String(data.active_businesses ?? "—")} />
            <Stat label="Bookings" value={String(data.total_bookings ?? "—")} />
            <Stat label="Revenue" value={`₦${Number(data.revenue || 0).toLocaleString()}`} />
            <Stat label="Commission" value={`₦${Number(data.commission_earned || 0).toLocaleString()}`} />
            <Stat label="Conversion %" value={String(data.conversion_rate ?? "—")} />
          </div>
          {(() => {
            const m = data.marketer;
            if (!m || typeof m !== "object") return null;
            return (
              <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{m.full_name}</span> · Referrer code{" "}
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                  {m.referrer_code}
                </span>
              </p>
            );
          })()}
        </UiCard>

        <UiCard
          id="security"
          title="Account security"
          description="Change the password you received by email. Use at least 8 characters."
        >
          <form onSubmit={changePassword} className="max-w-md space-y-4">
            {pwErr ? <p className="text-sm text-red-600">{pwErr}</p> : null}
            {pwMsg ? <p className="text-sm text-green-700">{pwMsg}</p> : null}
            <div>
              <label htmlFor="current_password" className="mb-1.5 block text-sm font-medium">
                Current password
              </label>
              <input
                id="current_password"
                type="password"
                autoComplete="current-password"
                className={inputClass}
                value={currPass}
                onChange={(e) => setCurrPass(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="new_password" className="mb-1.5 block text-sm font-medium">
                New password
              </label>
              <input
                id="new_password"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div>
              <label htmlFor="new_password_confirmation" className="mb-1.5 block text-sm font-medium">
                Confirm new password
              </label>
              <input
                id="new_password_confirmation"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                value={newPass2}
                onChange={(e) => setNewPass2(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={pwLoading}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-95 disabled:opacity-50"
            >
              {pwLoading ? "Saving…" : "Update password"}
            </button>
          </form>
        </UiCard>
      </div>
    </BrandShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
