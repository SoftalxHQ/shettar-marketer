"use client";

import { useState, useEffect } from "react";
import { BrandShell } from "@/components/brand-shell";
import { UiCard } from "@/components/ui-card";
import { apiBase, apiFetch } from "@/lib/api";
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
import {
  formButtonPrimaryClass,
  formInputClass,
  formInputMonoClass,
  formLabelClass,
  formSelectClass,
} from "@/lib/form-styles";
import { toast } from "sonner";

type Bank = { id: number; name: string; code: string };

type BankAccount = {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  bank_code: string;
  bank_verified?: boolean;
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
  
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    if (!isClient || !token) return;

    let cancelled = false;

    const loadBankDetails = async () => {
      try {
        const bankRes = await apiFetch(`/api/v1/marketers/me/bank_details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (bankRes.ok) {
          const { bank_details: m } = await bankRes.json();
          if (m?.bank_name && m?.account_number) {
            setAccounts([{
              id: "current_account",
              bank_name: m.bank_name,
              account_number: m.account_number,
              account_name: m.account_name,
              bank_code: m.bank_code,
              bank_verified: m.bank_verified,
              currency: "NGN",
              created_at: new Date().toISOString(),
            }]);
          }
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to load bank details", err);
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    const loadBanksList = async () => {
      setBanksLoading(true);
      try {
        const banksRes = await fetch(`${apiBase()}/api/v1/banks`);
        if (cancelled) return;
        if (banksRes.ok) {
          const data = await banksRes.json();
          setBanks(data.data || data || []);
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to load banks list", err);
      } finally {
        if (!cancelled) setBanksLoading(false);
      }
    };

    loadBankDetails();
    loadBanksList();

    return () => {
      cancelled = true;
    };
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

  const submitAccount = async () => {
    setCreating(true);
    
    try {
      const res = await apiFetch(`/api/v1/marketers/me/bank_details`, {
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
        bank_verified: false,
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

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.account_name.trim()) {
      toast.error("Account name is required.");
      return;
    }
    
    if (accounts.length > 0) {
      setShowReplaceModal(true);
      return;
    }

    submitAccount();
  };

  const confirmDelete = async (id: string) => {
    try {
      const res = await apiFetch(`/api/v1/marketers/me/bank_details`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to delete bank details");

      setAccounts([]);
      toast.success("Bank account removed.");
    } catch (err) {
      toast.error("Failed to remove bank account.");
    } finally {
      setShowDeleteModal(null);
    }
  };

  const handleDelete = (id: string) => {
    setShowDeleteModal(id);
  };

  if (!isClient || initialLoading) {
    return (
      <BrandShell>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-slate-500 font-medium animate-pulse">Loading bank accounts...</p>
        </div>
      </BrandShell>
    );
  }

  return (
    <BrandShell>
      {showReplaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-16 w-16 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-center text-slate-900 dark:text-white mb-2">Replace Account?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm font-medium mb-8">
              This will replace your current bank account. Are you sure you want to continue?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowReplaceModal(false)}
                className="py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowReplaceModal(false);
                  submitAccount();
                }}
                className="py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-16 w-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-center text-slate-900 dark:text-white mb-2">Remove Account?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm font-medium mb-8">
              Are you sure you want to remove this bank account? You will need to add a new one to withdraw funds.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowDeleteModal(null)}
                className="py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => confirmDelete(showDeleteModal)}
                className="py-3 px-4 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Bank Accounts</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your withdrawal accounts securely.</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add Account Form */}
          <div className="lg:col-span-1">
            <UiCard title="Add New Account" icon={Landmark} description="Link a new bank account to receive your payouts.">
              <form onSubmit={handleAdd} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className={formLabelClass}>Bank</label>
                  {banksLoading ? (
                    <div className="h-11 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl w-full" />
                  ) : (
                    <select
                      className={formSelectClass}
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
                  <label className={formLabelClass}>Account Number</label>
                  <input
                    type="text"
                    className={formInputMonoClass}
                    placeholder="0123456789"
                    maxLength={10}
                    value={form.account_number}
                    onChange={(e) => setForm((prev) => ({ ...prev, account_number: e.target.value.replace(/\\D/g, "") }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className={cn(formLabelClass, "flex items-center gap-2")}>
                    Account Name
                    {resolveStatus === "manual" && (
                      <span className="text-[10px] text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">Manual Entry</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className={cn(
                        formInputClass,
                        resolveStatus === "resolved"
                          ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                          : "",
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
                  className={formButtonPrimaryClass}
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
                      {acc.bank_verified ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center gap-1 border border-emerald-200 dark:border-emerald-500/20">
                          <CheckCircle2 size={12} /> Verified
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 flex items-center gap-1 border border-amber-200 dark:border-amber-500/20">
                            <AlertCircle size={12} /> Pending Verification
                          </span>
                          <button 
                            onClick={() => handleDelete(acc.id)}
                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            title="Remove Account"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
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
