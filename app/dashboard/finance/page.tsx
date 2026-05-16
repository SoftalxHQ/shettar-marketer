"use client";

import { useState, useEffect } from "react";
import { BrandShell } from "@/components/brand-shell";
import { UiCard } from "@/components/ui-card";
import { apiBase, apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useIsClient } from "@/lib/useIsClient";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Plus, 
  Loader2,
  Banknote,
  TrendingUp,
  ChevronRight,
  ArrowRight,
  Download,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Using real data from the backend

export default function FinancePage() {
  const isClient = useIsClient();
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<any>(null);
  
  const token = isClient ? localStorage.getItem("marketer_token") : null;

  useEffect(() => {
    if (!isClient || !token) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch(`/api/v1/marketers/me/finance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (cancelled) return;
        if (res.ok) setPerformance(json);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch finance data", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isClient, token]);

  const router = useRouter();

  const handleWithdrawal = () => {
    router.push("/dashboard/finance/withdraw");
  };

  if (!isClient || loading) {
    return (
      <BrandShell>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-slate-500 font-medium animate-pulse">Loading financial records...</p>
        </div>
      </BrandShell>
    );
  }

  const marketerData = performance?.marketer || {};
  const commissionEarned = performance?.commission_earned || 0;
  
  // Real Balances from Backend
  const availableMainBalance = Number(marketerData.balance || 0); 
  const availableCommission = Number(marketerData.commission_balance || 0); 
  const lifetimeCommission = commissionEarned; 

  const transactions = performance?.transactions || [];

  return (
    <BrandShell>
      <div className="space-y-8">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Finance & Payouts</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your earnings (Salary & Commission) and withdrawals.</p>
          </div>
          <button 
            onClick={handleWithdrawal}
            className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-[0.98]"
          >
            <Wallet size={18} />
            <span>Withdraw Funds</span>
          </button>
        </header>

        {/* Balance Cards */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Main Balance Card */}
          <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/20 bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-2xl shadow-indigo-500/20">
            <div className="relative z-10 flex items-start justify-between mb-8">
              <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                <Banknote size={28} className="text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                Salary
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-indigo-100 uppercase tracking-widest mb-1">Available Main Balance</p>
              <h2 className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter">
                ₦{availableMainBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl" />
          </div>

          {/* Commission Balance Card */}
          <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/20 bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white shadow-2xl shadow-emerald-500/20">
            <div className="relative z-10 flex items-start justify-between mb-8">
              <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                <TrendingUp size={28} className="text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                Commission
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-emerald-100 uppercase tracking-widest mb-1">Available Commission</p>
              <h2 className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter">
                ₦{availableCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
              <div className="mt-2 text-[10px] font-bold text-emerald-100 uppercase tracking-widest">
                All-time earned: ₦{Number(lifetimeCommission).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl" />
          </div>
        </section>

        {/* Transactions Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <History size={20} className="text-slate-400" />
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Recent Payments & Withdrawals</h3>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Filter size={18} />
              </button>
              <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Download size={18} />
              </button>
            </div>
          </div>

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
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                  {transactions.map((tx: any) => {
                    const isWithdrawal = tx.transaction_type === "withdrawal";
                    const isSalary = tx.description?.toLowerCase().includes("salary") || tx.metadata?.type === "salary";
                    const displayType = isWithdrawal ? "Withdrawal" : isSalary ? "Salary" : "Commission";
                    const amountValue = Number(tx.amount);
                    
                    return (
                      <tr key={tx.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-5 font-mono text-xs font-bold text-slate-400">
                          {tx.reference_code || `STRTX${String(tx.id).padStart(8, "0")}`}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-10 w-10 flex items-center justify-center rounded-xl",
                              isWithdrawal 
                                ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500" 
                                : isSalary
                                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500"
                                  : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"
                            )}>
                              {isWithdrawal ? <ArrowUpRight size={18} /> : isSalary ? <Banknote size={18} /> : <ArrowDownLeft size={18} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{displayType}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{tx.description || displayType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <p className={cn(
                            "text-sm font-black tabular-nums",
                            isWithdrawal ? "text-slate-900 dark:text-white" : isSalary ? "text-indigo-600 dark:text-indigo-400" : "text-emerald-600 dark:text-emerald-400"
                          )}>
                            {isWithdrawal ? "-" : "+"}₦{Math.abs(amountValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border",
                            tx.status === "completed" || tx.status === "Success"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                              : tx.status === "failed"
                                ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                                : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                          )}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Mobile View: Cards instead of table row (optional, but table is scrollable already) */}
          </div>
          
          <div className="flex justify-center pt-4">
            <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
              View All History <ChevronRight size={16} />
            </button>
          </div>
        </section>
      </div>
    </BrandShell>
  );
}
