"use client";

import { useState, useEffect } from "react";
import { BrandShell } from "@/components/brand-shell";
import { UiCard } from "@/components/ui-card";
import { apiBase } from "@/lib/api";
import { useIsClient } from "@/lib/useIsClient";
import { 
  Landmark, 
  Plus, 
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Bank = { id: number; name: string; code: string };

type BankAccount = {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  bank_code: string;
  currency: string;
  created_at: string;
};

// No mock list needed anymore

export default function BankAccountsPage() {
  const isClient = useIsClient();
  const token = isClient ? localStorage.getItem("marketer_token") : null;

  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [form, setForm] = useState({
    account_number: "",
    bank_code: "",
    account_name: "",
    bank_name: "",
  });
  
  const [resolveStatus, setResolveStatus] = useState<"idle" | "resolving" | "resolved" | "manual">("idle");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isClient || !token) return;

    const fetchInitialData = async () => {
      setBanksLoading(true);
      try {
        // Fetch banks
        const banksRes = await fetch(`${apiBase()}/api/v1/banks`);
        if (banksRes.ok) {
          const data = await banksRes.json();
          setBanks(data.data || data || []);
        }

        // Fetch current marketer bank details
        const perfRes = await fetch(`${apiBase()}/api/v1/marketers/me/performance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (perfRes.ok) {
          const perfData = await perfRes.json();
          const m = perfData.marketer;
          if (m?.bank_name && m?.account_number) {
            setAccounts([{
              id: "current_account",
              bank_name: m.bank_name,
              account_number: m.account_number,
              account_name: m.account_name,
              bank_code: m.bank_code,
              currency: "NGN",
              created_at: new Date().toISOString() // We don't have the exact updated_at, but it's fine for display
            }]);
          }
        }
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setBanksLoading(false);
        setInitialLoading(false);
      }
    };
    
    fetchInitialData();
  }, [isClient, token]);

  // Auto-resolve account
  useEffect(() => {
    if (form.account_number.length === 10 && form.bank_code) {
      setResolveStatus("resolving");
      setForm((prev) => ({ ...prev, account_name: "" }));
      
      fetch(`${apiBase()}/api/v1/banks/resolve_account?account_number=${form.account_number}&bank_code=${form.bank_code}`)
        .then((res) => res.json())
        .then((data) => {
          const name = data?.data?.account_name || data?.account_name;
          if (name) {
            setForm((prev) => ({ ...prev, account_name: name }));
            setResolveStatus("resolved");
          } else {
            setResolveStatus("manual");
          }
        })
        .catch(() => {
          setResolveStatus("manual");
        });
    } else {
      setResolveStatus("idle");
      setForm((prev) => ({ ...prev, account_name: "" }));
    }
  }, [form.account_number, form.bank_code]);

  const handleBankChange = (code: string) => {
    const bank = banks.find((b) => b.code === code);
    setForm((prev) => ({ ...prev, bank_code: code, bank_name: bank?.name ?? "" }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.account_name.trim()) {
      toast.error("Account name is required.");
      return;
    }
    
    if (accounts.length > 0 && !window.confirm("This will replace your current bank account. Continue?")) {
      return;
    }

    setCreating(true);
    
    try {
      const res = await fetch(`${apiBase()}/api/v1/marketers/me/bank_details`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          bank_details: {
            bank_name: form.bank_name || "Unknown Bank",
            account_number: form.account_number,
            account_name: form.account_name,
            bank_code: form.bank_code,
          }
        })
      });

      if (!res.ok) throw new Error("Failed to save bank details");

      const newAccount: BankAccount = {
        id: "current_account",
        bank_name: form.bank_name || "Unknown Bank",
        account_number: form.account_number,
        account_name: form.account_name,
        bank_code: form.bank_code,
        currency: "NGN",
        created_at: new Date().toISOString()
      };
      
      setAccounts([newAccount]);
      toast.success("Bank account saved successfully!");
      setForm({ account_number: "", bank_code: "", account_name: "", bank_name: "" });
      setResolveStatus("idle");
    } catch (err) {
      toast.error("An error occurred while saving your bank account.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this bank account?")) {
      try {
        const res = await fetch(`${apiBase()}/api/v1/marketers/me/bank_details`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to delete bank details");

        setAccounts([]);
        toast.success("Bank account removed.");
      } catch (err) {
        toast.error("Failed to remove bank account.");
      }
    }
  };

  if (!isClient || initialLoading) {
    return (
      <BrandShell>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      </BrandShell>
    );
  }

  return (
    <BrandShell>
      <div className="space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Bank Accounts</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your withdrawal accounts securely.</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add Account Form */}
          <div className="lg:col-span-1">
            <UiCard title="Add New Account" icon={Landmark} description="Link a new bank account to receive your payouts.">
              <form onSubmit={handleAdd} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Bank</label>
                  {banksLoading ? (
                    <div className="h-[52px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl w-full" />
                  ) : (
                    <select
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-4 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium appearance-none"
                      value={form.bank_code}
                      onChange={(e) => handleBankChange(e.target.value)}
                      required
                    >
                      <option value="">Select a bank...</option>
                      {banks.map((b) => (
                        <option key={`${b.id}-${b.code}`} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Account Number</label>
                  <input
                    type="text"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-4 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono text-lg"
                    placeholder="0123456789"
                    maxLength={10}
                    value={form.account_number}
                    onChange={(e) => setForm((prev) => ({ ...prev, account_number: e.target.value.replace(/\\D/g, "") }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    Account Name
                    {resolveStatus === "manual" && (
                      <span className="text-[10px] text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">Manual Entry</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className={cn(
                        "w-full rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-4 text-slate-900 dark:text-white outline-none transition-all font-medium",
                        resolveStatus === "resolved" ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800" : "bg-slate-50 dark:bg-slate-900/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                      )}
                      placeholder={
                        resolveStatus === "resolving" ? "Verifying account..." :
                        resolveStatus === "manual" ? "Enter your account name" :
                        "Auto-filled by system"
                      }
                      value={form.account_name}
                      readOnly={resolveStatus === "resolved"}
                      onChange={(e) => {
                        if (resolveStatus === "manual") {
                          setForm((prev) => ({ ...prev, account_name: e.target.value }));
                        }
                      }}
                      required
                    />
                    {resolveStatus === "resolving" && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="animate-spin text-indigo-500" size={18} />
                      </div>
                    )}
                    {resolveStatus === "resolved" && form.account_name && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="text-emerald-500" size={20} />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creating || resolveStatus === "resolving" || !form.account_name.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  <span>{creating ? "Adding Account..." : "Save Bank Account"}</span>
                </button>
              </form>
            </UiCard>
          </div>

          {/* Accounts List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white px-2">Saved Accounts</h3>
            
            {accounts.length === 0 ? (
              <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  <Landmark size={28} />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Accounts Yet</h4>
                <p className="text-sm text-slate-500 font-medium">Add a bank account to receive your payouts seamlessly.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {accounts.map(acc => (
                  <div key={acc.id} className="group relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-xl dark:border-white/10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Landmark size={24} />
                      </div>
                      <button 
                        onClick={() => handleDelete(acc.id)}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Remove Account"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg truncate" title={acc.account_name}>{acc.account_name}</h4>
                      <p className="font-mono text-indigo-600 dark:text-indigo-400 font-bold tracking-widest mt-1 text-lg">
                        {acc.account_number}
                      </p>
                      <div className="flex items-center gap-2 mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                        <span className="truncate">{acc.bank_name}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                        <span className="shrink-0">{acc.currency}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </BrandShell>
  );
}
