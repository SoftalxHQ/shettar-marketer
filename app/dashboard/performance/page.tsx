"use client";

import { useEffect, useState } from "react";
import { apiBase, apiFetch } from "@/lib/api";
import { useIsClient } from "@/lib/useIsClient";
import { BrandShell } from "@/components/brand-shell";
import { UiCard } from "@/components/ui-card";
import { 
  TrendingUp, 
  BarChart3,
  Loader2,
  AlertCircle
} from "lucide-react";

type PerformancePayload = {
  growth_analysis?: Array<{ date: string; referrals: number }>;
};

export default function PerformancePage() {
  const isClient = useIsClient();
  const [data, setData] = useState<PerformancePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const token = isClient ? localStorage.getItem("marketer_token") : null;

  useEffect(() => {
    if (!isClient || !token) return;

    (async () => {
      try {
        const res = await apiFetch(`/api/v1/marketers/me/performance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to load performance data");
          return;
        }
        setData(json);
      } catch {
        setError("Network error");
      }
    })();
  }, [isClient, token]);

  return (
    <BrandShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Performance Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Detailed breakdown of your referral growth.</p>
        </div>

        {error ? (
          <UiCard title="Error" icon={AlertCircle} className="border-rose-100 bg-rose-50/50">
            <p className="text-rose-600 font-bold">{error}</p>
          </UiCard>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-slate-500 font-medium animate-pulse">Loading analytics...</p>
          </div>
        ) : (
          <UiCard
            title="Marketer Growth Analysis"
            description="Tracking your referral acquisition over the last 30 days."
            icon={TrendingUp}
          >
            <div className="mt-6">
              {!data.growth_analysis || data.growth_analysis.length === 0 ? (
                <div className="h-64 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <BarChart3 size={40} className="opacity-20" />
                  <p className="font-medium">No recent growth data recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-end justify-between gap-1 h-48 px-2">
                    {data.growth_analysis.map((day, i) => {
                      const max = Math.max(...data.growth_analysis!.map(d => d.referrals), 1);
                      const height = (day.referrals / max) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                          <div 
                            className="w-full bg-indigo-500/20 group-hover:bg-indigo-500/40 transition-all rounded-t-lg"
                            style={{ height: `${Math.max(height, 5)}%` }}
                          />
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                            {day.referrals} referrals
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <span>{new Date(data.growth_analysis[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    <span>Recent 30 Days Growth</span>
                    <span>{new Date(data.growth_analysis[data.growth_analysis.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              )}
            </div>
          </UiCard>
        )}
      </div>
    </BrandShell>
  );
}
