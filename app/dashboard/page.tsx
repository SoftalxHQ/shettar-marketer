"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiBase, apiFetch } from "@/lib/api";
import { useIsClient } from "@/lib/useIsClient";
import { useMarketerProfile } from "@/lib/marketer-profile-context";
import { BrandShell } from "@/components/brand-shell";
import { UiCard } from "@/components/ui-card";
import { 
  TrendingUp, 
  Users, 
  Home, 
  Banknote, 
  User,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

type DashboardPayload = {
  marketer?: {
    full_name?: string;
    referrer_code?: string;
    email?: string;
    account_type?: string;
    agency_name?: string | null;
    commission_balance?: number;
  };
  total_referrals?: number;
  active_businesses?: number;
  verified_businesses?: number;
  referral_commission_earned?: number;
  commission_balance?: number;
  team_members_count?: number;
  total_allocated?: number;
  agency_name?: string;
  error?: string;
};

export default function MarketerDashboardPage() {
  const isClient = useIsClient();
  const { profile } = useMarketerProfile();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = isClient ? localStorage.getItem("marketer_token") : null;

  useEffect(() => {
    if (!isClient || !token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/v1/marketers/me/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json()) as DashboardPayload;
        if (cancelled) return;
        if (!res.ok) {
          setError((json.error as string) || "Failed to load dashboard data");
          return;
        }
        setData(json);
      } catch {
        if (!cancelled) setError("Connection lost. Please check your network.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isClient, token]);

  const copyReferrerCode = () => {
    const code = data?.marketer?.referrer_code;
    if (code) {
      navigator.clipboard.writeText(code);
      toast.success("Referral code copied to clipboard!");
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <UiCard 
          title="Session Expired" 
          description="Your session has ended. Please sign in again to access your dashboard."
          icon={AlertCircle}
          className="max-w-md w-full"
        >
          <Link 
            href="/login" 
            className="w-full inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all"
          >
            Go to Login
          </Link>
        </UiCard>
      </div>
    );
  }

  if (error && !data) {
    return (
      <BrandShell>
        <UiCard 
          title="Dashboard Error" 
          description={error}
          icon={AlertCircle}
          className="border-rose-200 bg-rose-50/50"
        >
          <button 
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-all"
          >
            Retry Connection
          </button>
        </UiCard>
      </BrandShell>
    );
  }

  if (!data) {
    return (
      <BrandShell>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-slate-500 font-medium animate-pulse">Loading dashboard...</p>
        </div>
      </BrandShell>
    );
  }

  const m = data.marketer || {};
  const isAgency = (m as DashboardPayload["marketer"])?.account_type === "agency" || profile?.account_type === "agency";
  const agencyName = data.agency_name || (m as DashboardPayload["marketer"])?.agency_name || profile?.agency_name;

  return (
    <BrandShell>
      <div className="space-y-10">
        {isAgency && (
          <section className="rounded-3xl border border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-violet-600">Agency Account</p>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{agencyName || "Your Agency"}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Team referrals pay into your commission pool. Release funds to members from Allocate.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/team" className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800 text-sm font-bold text-violet-700 dark:text-violet-300">
                  Manage Team
                </Link>
                <Link href="/dashboard/allocate" className="px-4 py-2.5 rounded-2xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700">
                  Release Funds
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Welcome Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">
                <User size={16} strokeWidth={3} />
              </span>
              <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Marketer Profile</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{(m as any).full_name}</span>
            </h1>
            <p className="mt-2 text-lg text-slate-500 dark:text-slate-400 font-medium italic">
              Commissions apply only after referred businesses are fully verified.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 pl-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Your Referral Code</span>
              <span className="font-mono font-bold text-indigo-600">{(m as any).referrer_code}</span>
            </div>
            <button 
              onClick={copyReferrerCode}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-all"
            >
              <Copy size={20} />
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className={`grid gap-6 sm:grid-cols-2 ${isAgency ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {isAgency && (
            <>
              <StatCard
                label="Pool Balance"
                value={`₦${Number(data.commission_balance ?? (m as DashboardPayload["marketer"])?.commission_balance ?? 0).toLocaleString()}`}
                icon={Banknote}
                color="violet"
              />
              <StatCard
                label="Team Members"
                value={String(data.team_members_count ?? 0)}
                icon={Users}
                color="sky"
              />
            </>
          )}
          <StatCard 
            label={isAgency ? "Team Referrals" : "Total Referrals"} 
            value={String(data.total_referrals ?? "0")} 
            icon={Users} 
            color="indigo"
          />
          <StatCard 
            label="Verified Businesses" 
            value={String(data.verified_businesses ?? data.active_businesses ?? "0")} 
            icon={Home} 
            color="blue"
          />
          <StatCard 
            label={isAgency ? "Team Commission" : "Referral Commission"} 
            value={`₦${Number(data.referral_commission_earned || 0).toLocaleString()}`} 
            icon={Banknote} 
            color="emerald"
          />
        </section>

        <div className={`grid md:grid-cols-2 gap-6 ${isAgency ? "lg:grid-cols-3" : ""}`}>
          {isAgency && (
            <Link href="/dashboard/allocate" className="group">
              <UiCard title="Release Funds" description="Move commission from your pool to a team member's wallet." icon={Banknote} className="hover:border-violet-500/50 transition-colors">
                <div className="mt-4 flex items-center text-violet-600 font-bold gap-2">
                  Allocate Now <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </UiCard>
            </Link>
          )}
          <Link href="/dashboard/performance" className="group">
            <UiCard title="View Performance" description="Analyze your growth and referral trends." icon={TrendingUp} className="hover:border-indigo-500/50 transition-colors">
              <div className="mt-4 flex items-center text-indigo-600 font-bold gap-2">
                Explore Analytics <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </UiCard>
          </Link>
          <Link href="/dashboard/security" className="group">
            <UiCard title="Account Security" description="Update your password and manage access." icon={ShieldCheck} className="hover:border-indigo-500/50 transition-colors">
              <div className="mt-4 flex items-center text-indigo-600 font-bold gap-2">
                Manage Password <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </UiCard>
          </Link>
        </div>
      </div>
    </BrandShell>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  value: string; 
  icon: any;
  color: "indigo" | "blue" | "violet" | "emerald" | "amber" | "sky"
}) {
  const colors = {
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400",
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400",
    violet: "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400",
    sky: "text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400",
  };

  return (
    <div className="relative group overflow-hidden rounded-3xl border border-white/20 bg-white/70 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/50">
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 duration-300", colors[color])}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black tabular-nums text-slate-900 dark:text-white">{value}</p>
      </div>
      <div className={cn("absolute -right-4 -bottom-4 h-24 w-24 rounded-full blur-3xl opacity-20", colors[color].split(" ")[0].replace("text", "bg"))} />
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
