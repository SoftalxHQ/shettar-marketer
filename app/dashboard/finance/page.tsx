"use client";

import { useState, useEffect, useCallback } from "react";
import { BrandShell } from "@/components/brand-shell";
import { apiBase, apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useIsClient } from "@/lib/useIsClient";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Loader2,
  Banknote,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Download,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type CommissionTier = { min_rooms: number; max_rooms: number | null; amount: number };

type FinanceSummary = {
  marketer?: {
    balance?: number;
    commission_balance?: number;
    full_name?: string;
  };
  referral_commission_earned?: number;
  commission_tiers?: CommissionTier[];
};

type Transaction = {
  id: number;
  reference_code?: string;
  amount: number;
  transaction_type: string;
  display_type?: string;
  status: string;
  description?: string;
  metadata?: { type?: string };
  payment_method?: string;
  created_at: string;
};

type Pagination = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

type TxFilters = {
  transaction_type: string;
  status: string;
  start_date: string;
  end_date: string;
};

const DEFAULT_FILTERS: TxFilters = {
  transaction_type: "all",
  status: "all",
  start_date: "",
  end_date: "",
};

function appendFilterParams(params: URLSearchParams, filters: TxFilters) {
  if (filters.transaction_type !== "all") params.set("transaction_type", filters.transaction_type);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.start_date) params.set("start_date", filters.start_date);
  if (filters.end_date) params.set("end_date", filters.end_date);
}

function buildQuery(filters: TxFilters, page: number, limit = 20) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  appendFilterParams(params, filters);
  return params.toString();
}

function buildExportQuery(filters: TxFilters) {
  const params = new URLSearchParams();
  appendFilterParams(params, filters);
  return params.toString();
}

export default function FinancePage() {
  const isClient = useIsClient();
  const router = useRouter();
  const token = isClient ? localStorage.getItem("marketer_token") : null;

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [txLoading, setTxLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState<TxFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<TxFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isClient || !token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/v1/marketers/me/finance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!cancelled && res.ok) setSummary(json);
      } catch (err) {
        if (!cancelled) console.error("Failed to fetch finance summary", err);
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isClient, token]);

  const fetchTransactions = useCallback(
    async (pageNum: number, activeFilters: TxFilters) => {
      if (!token) return;
      setTxLoading(true);
      try {
        const res = await apiFetch(
          `/api/v1/marketers/me/transactions?${buildQuery(activeFilters, pageNum)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (res.ok) {
          setTransactions(json.transactions || []);
          setPagination(json.pagination || null);
        }
      } catch (err) {
        console.error("Failed to fetch transactions", err);
        toast.error("Failed to load transactions");
      } finally {
        setTxLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!isClient || !token) return;
    fetchTransactions(page, filters);
  }, [isClient, token, page, filters, fetchTransactions]);

  const applyFilters = () => {
    setFilters(draftFilters);
    setPage(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setShowFilters(false);
  };

  const hasActiveFilters =
    filters.transaction_type !== "all" ||
    filters.status !== "all" ||
    filters.start_date !== "" ||
    filters.end_date !== "";

  const handleExport = async () => {
    if (!token) return;
    setIsExporting(true);
    const toastId = toast.loading("Exporting transactions...");
    try {
      const query = buildExportQuery(filters);
      const res = await fetch(`${apiBase()}/api/v1/marketers/me/export_transactions?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const name = summary?.marketer?.full_name?.split(" ")[0]?.toLowerCase() || "marketer";
      const dateStr = new Date().toISOString().replace(/T/, "-").replace(/:/g, "").split(".")[0];
      const a = document.createElement("a");
      a.href = url;
      a.download = `transaction-${name}-${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success("Export completed!", { id: toastId });
    } catch {
      toast.error("Failed to export transactions.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  if (!isClient || summaryLoading) {
    return (
      <BrandShell>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-slate-500 font-medium animate-pulse">Loading financial records...</p>
        </div>
      </BrandShell>
    );
  }

  const marketerData = summary?.marketer || {};
  const availableMainBalance = Number(marketerData.balance || 0);
  const availableCommission = Number(marketerData.commission_balance || 0);
  const referralEarned = summary?.referral_commission_earned ?? 0;
  const tiers = summary?.commission_tiers ?? [];

  const tierLabel = (tier: CommissionTier) => {
    if (tier.max_rooms == null) return `${tier.min_rooms}+ rooms`;
    return `${tier.min_rooms}–${tier.max_rooms} rooms`;
  };

  return (
    <BrandShell>
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Finance & Payouts</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your earnings (Salary & Commission) and withdrawals.</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/finance/withdraw")}
            className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-[0.98]"
          >
            <Wallet size={18} />
            <span>Withdraw Funds</span>
          </button>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/20 bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-2xl shadow-indigo-500/20">
            <div className="relative z-10 flex items-start justify-between mb-8">
              <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                <Banknote size={28} className="text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">Salary</span>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-indigo-100 uppercase tracking-widest mb-1">Available Main Balance</p>
              <h2 className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter">
                ₦{availableMainBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          </div>

          <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/20 bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white shadow-2xl shadow-emerald-500/20">
            <div className="relative z-10 flex items-start justify-between mb-8">
              <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                <TrendingUp size={28} className="text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">Commission</span>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-emerald-100 uppercase tracking-widest mb-1">Available Commission</p>
              <h2 className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter">
                ₦{availableCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
              <p className="mt-2 text-[10px] font-bold text-emerald-100 uppercase tracking-widest">
                Referral commission earned: ₦{Number(referralEarned).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </section>

        {tiers.length > 0 && (
          <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Referral commission tiers</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You earn a <strong>one-time</strong> payout when each referred business is fully verified. The amount depends on how many rooms the property has at verification.
            </p>
            <div className="flex flex-wrap gap-2">
              {tiers.map((tier, i) => (
                <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 font-semibold">
                  {tierLabel(tier)} → ₦{Number(tier.amount).toLocaleString()}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-2">
              <History size={20} className="text-slate-400" />
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Payments & Withdrawals</h3>
              {hasActiveFilters && (
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-full">Filtered</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraftFilters(filters);
                  setShowFilters(true);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors",
                  hasActiveFilters
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
                )}
              >
                <Filter size={16} />
                Filter
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting || transactions.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Export
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Filter Transactions</h4>
                <button type="button" onClick={() => setShowFilters(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Type</label>
                  <select
                    value={draftFilters.transaction_type}
                    onChange={(e) => setDraftFilters((f) => ({ ...f, transaction_type: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="all">All types</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="salary">Salary</option>
                    <option value="commission">Commission</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Status</label>
                  <select
                    value={draftFilters.status}
                    onChange={(e) => setDraftFilters((f) => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="all">All statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">From</label>
                  <input
                    type="date"
                    value={draftFilters.start_date}
                    onChange={(e) => setDraftFilters((f) => ({ ...f, start_date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">To</label>
                  <input
                    type="date"
                    value={draftFilters.end_date}
                    onChange={(e) => setDraftFilters((f) => ({ ...f, end_date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={applyFilters} className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-colors">
                  Apply Filters
                </button>
                <button type="button" onClick={clearFilters} className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Clear
                </button>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction ID</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type & Description</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {txLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-6 py-5">
                          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                        No transactions found{hasActiveFilters ? " for these filters." : "."}
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isWithdrawal = tx.transaction_type === "withdrawal";
                      const displayType = tx.display_type || (isWithdrawal ? "Withdrawal" : "Commission");
                      const amountValue = Number(tx.amount);

                      return (
                        <tr key={tx.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-6 py-5 font-mono text-xs font-bold text-slate-400">
                            {tx.reference_code || `STRTX${String(tx.id).padStart(8, "0")}`}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "h-10 w-10 flex items-center justify-center rounded-xl",
                                  isWithdrawal
                                    ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500"
                                    : displayType === "Salary"
                                      ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500"
                                      : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500",
                                )}
                              >
                                {isWithdrawal ? <ArrowUpRight size={18} /> : displayType === "Salary" ? <Banknote size={18} /> : <ArrowDownLeft size={18} />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{displayType}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{tx.description || displayType}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                              {new Date(tx.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </td>
                          <td className="px-6 py-5">
                            <p
                              className={cn(
                                "text-sm font-black tabular-nums",
                                isWithdrawal ? "text-slate-900 dark:text-white" : displayType === "Salary" ? "text-indigo-600 dark:text-indigo-400" : "text-emerald-600 dark:text-emerald-400",
                              )}
                            >
                              {isWithdrawal ? "-" : "+"}₦{Math.abs(amountValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border",
                                tx.status === "completed"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                  : tx.status === "failed"
                                    ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                                    : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
                              )}
                            >
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between px-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Page {pagination.current_page} of {pagination.total_pages} ({pagination.total_count} total)
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || txLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.total_pages || txLoading}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </BrandShell>
  );
}
