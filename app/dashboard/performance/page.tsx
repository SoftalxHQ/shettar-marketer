"use client";

import { useCallback, useEffect, useState } from "react";
import type { ElementType } from "react";
import { apiFetch } from "@/lib/api";
import { useIsClient } from "@/lib/useIsClient";
import { BrandShell } from "@/components/brand-shell";
import { ReferralGrowthChart } from "@/components/referral-growth-chart";
import { UiCard } from "@/components/ui-card";
import {
  TrendingUp,
  BarChart3,
  Loader2,
  AlertCircle,
  Users,
  Home,
  Banknote,
  Calendar,
} from "lucide-react";

type GrowthDay = { date: string; referrals: number };

type PeriodPreset = "today" | "7d" | "this_month" | "last_month" | "all_time" | "custom";

type PerformancePayload = {
  total_referrals?: number;
  active_businesses?: number;
  verified_businesses?: number;
  referral_commission_earned?: number;
  growth_analysis?: GrowthDay[];
  period_referrals?: number;
  period_start?: string;
  period_end?: string;
  period_granularity?: "daily" | "weekly" | "monthly";
  error?: string;
};

const PERIOD_OPTIONS: { id: PeriodPreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "all_time", label: "All time" },
  { id: "custom", label: "Custom" },
];

function formatDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function resolveRange(
  preset: PeriodPreset,
  customStart: string,
  customEnd: string,
): { start: string; end: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return { start: formatDateInput(today), end: formatDateInput(today) };
    case "7d": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start: formatDateInput(start), end: formatDateInput(today) };
    }
    case "this_month":
      return {
        start: formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
        end: formatDateInput(today),
      };
    case "last_month": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: formatDateInput(start), end: formatDateInput(end) };
    }
    case "all_time":
      return { start: "", end: formatDateInput(today) };
    case "custom":
      return {
        start: customStart || formatDateInput(today),
        end: customEnd || formatDateInput(today),
      };
  }
}

function periodLabel(preset: PeriodPreset): string {
  return PERIOD_OPTIONS.find((o) => o.id === preset)?.label ?? "Period";
}

function formatChartDate(dateStr: string, granularity?: string) {
  const d = new Date(dateStr);
  if (granularity === "weekly") {
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    const startLabel = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${startLabel} – ${endLabel}`;
  }
  if (granularity === "monthly") {
    return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: ElementType;
  color: "indigo" | "blue" | "violet" | "emerald" | "amber" | "sky";
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
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 duration-300 ${colors[color]}`}
        >
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black tabular-nums text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const isClient = useIsClient();
  const [data, setData] = useState<PerformancePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  const [period, setPeriod] = useState<PeriodPreset>("7d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const token = isClient ? localStorage.getItem("marketer_token") : null;

  useEffect(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    start.setDate(start.getDate() - 6);
    setCustomEnd(formatDateInput(today));
    setCustomStart(formatDateInput(start));
  }, []);

  const fetchPerformance = useCallback(
    async (preset: PeriodPreset, start: string, end: string, initial = false) => {
      if (!token) return;

      if (initial) setLoading(true);
      else setChartLoading(true);

      try {
        const params = new URLSearchParams();
        if (start) params.set("start_date", start);
        if (end) params.set("end_date", end);

        const qs = params.toString();
        const res = await apiFetch(
          `/api/v1/marketers/me/performance${qs ? `?${qs}` : ""}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = (await res.json()) as PerformancePayload;
        if (!res.ok) {
          setError(json.error || "Failed to load performance data");
          return;
        }
        setError(null);
        setData(json);
      } catch {
        setError("Network error");
      } finally {
        if (initial) setLoading(false);
        else setChartLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!isClient || !token) {
      if (isClient) setLoading(false);
      return;
    }
    const range = resolveRange(period, customStart, customEnd);
    fetchPerformance(period, range.start, range.end, true);
  }, [isClient, token]); // eslint-disable-line react-hooks/exhaustive-deps -- initial load only

  const applyPeriod = (preset: PeriodPreset) => {
    setPeriod(preset);
    if (preset === "custom") return;
    const range = resolveRange(preset, customStart, customEnd);
    fetchPerformance(preset, range.start, range.end, false);
  };

  const applyCustomRange = () => {
    if (!customStart || !customEnd) return;
    setPeriod("custom");
    fetchPerformance("custom", customStart, customEnd, false);
  };

  const growth = data?.growth_analysis ?? [];
  const periodTotal = data?.period_referrals ?? growth.reduce((sum, d) => sum + d.referrals, 0);
  const granularity = data?.period_granularity ?? "daily";

  return (
    <BrandShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Performance Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Referrals, verified businesses, and commission from your network.
          </p>
        </div>

        {error ? (
          <UiCard title="Error" icon={AlertCircle} className="border-rose-100 bg-rose-50/50">
            <p className="text-rose-600 font-bold">{error}</p>
          </UiCard>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-slate-500 font-medium animate-pulse">Loading analytics...</p>
          </div>
        ) : data ? (
          <>
            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Referrals"
                value={String(data.total_referrals ?? 0)}
                icon={Users}
                color="indigo"
              />
              <StatCard
                label="Verified Businesses"
                value={String(data.verified_businesses ?? data.active_businesses ?? 0)}
                icon={Home}
                color="blue"
              />
              <StatCard
                label="Referral Commission"
                value={`₦${Number(data.referral_commission_earned ?? 0).toLocaleString()}`}
                icon={Banknote}
                color="emerald"
              />
              <StatCard
                label={`Referrals — ${periodLabel(period)}`}
                value={String(periodTotal)}
                icon={Calendar}
                color="sky"
              />
            </section>

            <UiCard
              title="Referral Growth"
              description={
                data.period_start && data.period_end
                  ? `${periodTotal} new referral${periodTotal === 1 ? "" : "s"} from ${formatChartDate(data.period_start, granularity)} to ${formatChartDate(data.period_end, granularity)}.`
                  : `${periodTotal} new referral${periodTotal === 1 ? "" : "s"} in selected period.`
              }
              icon={TrendingUp}
            >
              <div className="space-y-4 mb-6">
                <div className="flex flex-wrap gap-2">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => applyPeriod(opt.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        period === opt.id
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {period === "custom" && (
                  <div className="flex flex-wrap items-end gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
                      From
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-900 dark:text-white"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
                      To
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-900 dark:text-white"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={applyCustomRange}
                      disabled={!customStart || !customEnd}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="animate-spin text-indigo-600" size={28} />
                </div>
              ) : growth.length === 0 ? (
                <div className="h-64 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <BarChart3 size={40} className="opacity-20" />
                  <p className="font-medium">No growth data available yet.</p>
                </div>
              ) : periodTotal === 0 ? (
                <div className="space-y-4 -mx-6 sm:-mx-8">
                  <ReferralGrowthChart
                    data={growth}
                    granularity={granularity}
                    formatDate={formatChartDate}
                  />
                  <p className="text-center text-sm text-slate-400 px-6 sm:px-8">
                    No new referrals in this period. Try another date range or share your referral code.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 -mx-6 sm:-mx-8">
                  <ReferralGrowthChart
                    data={growth}
                    granularity={granularity}
                    formatDate={formatChartDate}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 sm:px-8 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <span>{formatChartDate(growth[0].date, granularity)}</span>
                    <span>{granularity === "weekly" ? "Weekly trend" : granularity === "monthly" ? "Monthly trend" : "Daily trend"}</span>
                    <span>{formatChartDate(growth[growth.length - 1].date, granularity)}</span>
                  </div>
                </div>
              )}
            </UiCard>

            <UiCard
              title="Referral Activity Log"
              description={`Sign-ups in selected period (${periodLabel(period)}).`}
              icon={BarChart3}
            >
              {chartLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="animate-spin text-indigo-600" size={24} />
                </div>
              ) : periodTotal === 0 ? (
                <p className="text-slate-500 font-medium py-8 text-center">
                  No referral sign-ups in this period.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                        <th className="pb-3 font-bold text-slate-400 uppercase tracking-wider text-xs">Date</th>
                        <th className="pb-3 font-bold text-slate-400 uppercase tracking-wider text-xs">New Referrals</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {growth
                        .filter((d) => d.referrals > 0)
                        .slice()
                        .reverse()
                        .map((day) => (
                          <tr key={day.date} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-3 font-medium text-slate-700 dark:text-slate-300">
                              {granularity === "weekly"
                                ? formatChartDate(day.date, granularity)
                                : new Date(day.date).toLocaleDateString(undefined, {
                                    weekday: granularity === "daily" ? "short" : undefined,
                                    month: "short",
                                    day: granularity === "daily" ? "numeric" : undefined,
                                    year: "numeric",
                                  })}
                            </td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-2 font-bold text-indigo-600">
                                {day.referrals}
                                <span
                                  className="h-2 rounded-full bg-indigo-500/80"
                                  style={{ width: `${Math.min(day.referrals * 24, 120)}px` }}
                                />
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </UiCard>
          </>
        ) : null}
      </div>
    </BrandShell>
  );
}
