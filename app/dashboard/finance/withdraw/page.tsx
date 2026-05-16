"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BrandShell } from "@/components/brand-shell";
import { UiCard } from "@/components/ui-card";
import { apiBase, apiFetch } from "@/lib/api";
import { useMarketerProfile } from "@/lib/marketer-profile-context";
import { useIsClient } from "@/lib/useIsClient";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Wallet, 
  Banknote, 
  TrendingUp,
  AlertCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommissionPreview {
  amount: number;
  commission_rate: number;
  flat_fee: number;
  commission_amount: number;
  net_amount: number;
}

export default function WithdrawalPage() {
  const router = useRouter();
  const isClient = useIsClient();
  const { profile, loading: profileLoading, refresh: refreshProfile } = useMarketerProfile();
  
  const [walletType, setWalletType] = useState<"balance" | "commission_balance">("balance");
  const [amount, setAmount] = useState<string>("");
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  
  const [preview, setPreview] = useState<CommissionPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = isClient ? localStorage.getItem("marketer_token") : null;

  const getHeaders = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token]);

  useEffect(() => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) { setPreview(null); return; }

    const timer = setTimeout(async () => {
      try {
        setPreviewLoading(true);
        const res = await fetch(
          `${apiBase()}/api/v1/marketers/me/commission_preview?amount=${num}`,
          { headers: getHeaders() }
        );
        if (res.ok) setPreview(await res.json());
      } catch { /* silent */ } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [amount, getHeaders]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) { toast.error("Please enter an amount"); return; }
    
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) { toast.error("Please enter a valid amount"); return; }
    
    const availableBalance = walletType === "balance" ? Number(profile?.balance || 0) : Number(profile?.commission_balance || 0);
    if (withdrawAmount > availableBalance) { toast.error("Insufficient funds"); return; }

    if (!profile?.bank_code || !profile?.account_number) {
      toast.error("Please set up your bank details first.");
      router.push("/dashboard/bank-accounts");
      return;
    }

    if (!profile?.bank_verified) {
      toast.error("Your bank account is pending admin verification. You will be able to withdraw once it is approved.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/v1/marketers/me/withdraw`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ amount: withdrawAmount, wallet_type: walletType, otp: isOtpStep ? otp : undefined })
      });
      
      const data = await response.json();
      if (response.ok) {
        if (data.status === "otp_required") { 
          setIsOtpStep(true); 
          toast.success(data.message); 
        } else { 
          toast.success(data.message || "Withdrawal successful");
          await refreshProfile();
          router.push("/dashboard/finance"); 
        }
      } else {
        toast.error(data.error || "Withdrawal failed");
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("An error occurred during withdrawal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmt = (n: number) => `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (!isClient || profileLoading) {
    return (
      <BrandShell>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-slate-500 font-medium animate-pulse">Loading withdrawal details...</p>
        </div>
      </BrandShell>
    );
  }

  const marketerData = profile || {};
  const availableMainBalance = Number(marketerData.balance || 0); 
  const availableCommission = Number(marketerData.commission_balance || 0);
  
  const currentBalance = walletType === "balance" ? availableMainBalance : availableCommission;

  return (
    <BrandShell>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <button 
            className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors mb-6"
            onClick={() => router.back()}
          >
            <ArrowLeft size={16} />
            Back to Finance
          </button>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Withdraw Funds</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Transfer earnings directly to your verified bank account.</p>
        </div>

        <UiCard title="Withdrawal Form" description="Choose a wallet and amount to withdraw.">
          <div className="space-y-8 mt-2">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Available For Withdrawal</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{fmt(currentBalance)}</p>
              </div>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-6">
              {!isOtpStep ? (
                <>
                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Select Source Wallet</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setWalletType("balance")}
                        className={cn(
                          "relative flex flex-col p-4 rounded-2xl border-2 text-left transition-all",
                          walletType === "balance" 
                            ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10" 
                            : "border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Banknote size={20} className={walletType === "balance" ? "text-indigo-600" : "text-slate-400"} />
                        </div>
                        <span className={cn(
                          "text-sm font-bold",
                          walletType === "balance" ? "text-indigo-900 dark:text-indigo-100" : "text-slate-900 dark:text-white"
                        )}>Salary Balance</span>
                        <span className={cn(
                          "text-xs font-medium mt-1",
                          walletType === "balance" ? "text-indigo-600" : "text-slate-500"
                        )}>{fmt(availableMainBalance)}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWalletType("commission_balance")}
                        className={cn(
                          "relative flex flex-col p-4 rounded-2xl border-2 text-left transition-all",
                          walletType === "commission_balance" 
                            ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-500/10" 
                            : "border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800/50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <TrendingUp size={20} className={walletType === "commission_balance" ? "text-emerald-600" : "text-slate-400"} />
                        </div>
                        <span className={cn(
                          "text-sm font-bold",
                          walletType === "commission_balance" ? "text-emerald-900 dark:text-emerald-100" : "text-slate-900 dark:text-white"
                        )}>Commission</span>
                        <span className={cn(
                          "text-xs font-medium mt-1",
                          walletType === "commission_balance" ? "text-emerald-600" : "text-slate-500"
                        )}>{fmt(availableCommission)}</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Destination Account</p>
                    {marketerData.bank_name ? (
                      <>
                      {!marketerData.bank_verified && (
                        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20 p-3">
                          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                            Bank details are saved but awaiting admin verification. Withdrawals unlock after approval.
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Bank Name</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{marketerData.bank_name}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Account Number</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 font-mono">{marketerData.account_number}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Account Name</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{marketerData.account_name}</p>
                        </div>
                      </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4">
                        <AlertCircle className="text-amber-500 mb-2" size={24} />
                        <p className="text-sm font-bold text-slate-900 dark:text-white">No bank details found</p>
                        <button 
                          type="button" 
                          onClick={() => router.push("/dashboard/bank-accounts")}
                          className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          Setup Bank Account &rarr;
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="amount" className="text-xs font-bold uppercase tracking-widest text-slate-400">Amount (₦)</label>
                    <input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      className="w-full h-14 px-4 text-xl font-bold bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all outline-none"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    {amount && !isNaN(Number(amount)) && Number(amount) > currentBalance && (
                      <p className="text-xs font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={14} /> Amount exceeds available balance
                      </p>
                    )}
                  </div>

                  {(preview || previewLoading) && parseFloat(amount) > 0 && (
                    <div className="bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-500/20">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4">Transaction Breakdown</p>
                      {previewLoading ? (
                        <div className="flex items-center gap-2 text-sm font-bold text-indigo-600">
                          <Loader2 size={16} className="animate-spin" /> Calculating...
                        </div>
                      ) : preview && (
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="font-bold text-slate-600 dark:text-slate-400">Withdrawal amount</span>
                            <span className="font-black text-slate-900 dark:text-white">{fmt(preview.amount)}</span>
                          </div>
                          {(preview.flat_fee ?? 0) > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="font-bold text-slate-600 dark:text-slate-400">Transfer fee</span>
                              <span className="font-black text-rose-500">− {fmt(preview.flat_fee)}</span>
                            </div>
                          )}
                          <div className="border-t border-indigo-200 dark:border-indigo-500/20 pt-3 flex justify-between text-sm">
                            <span className="font-black text-indigo-900 dark:text-indigo-300">You will receive</span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">{fmt(preview.net_amount)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <label htmlFor="otp" className="text-sm font-bold text-slate-900 dark:text-white text-center block">Verification Code</label>
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Enter the 6-digit code sent to your email to confirm this transaction.
                    </p>
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      className="w-full h-16 text-3xl text-center font-black tracking-[0.5em] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all outline-none caret-indigo-600"
                      value={otp}
                      maxLength={6}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      autoFocus
                    />
                  </div>
                  
                  {preview && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-500">Amount</span>
                        <span className="font-black text-slate-900 dark:text-white">{fmt(preview.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-500">Fee</span>
                        <span className="font-black text-rose-500">− {fmt(preview.flat_fee)}</span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between">
                        <span className="font-black text-slate-900 dark:text-white">You receive</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">{fmt(preview.net_amount)}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center pt-3 mt-3 border-t border-slate-200 dark:border-slate-800">
                        Sending to {marketerData.bank_name} — {marketerData.account_number}
                      </p>
                    </div>
                  )}

                  <button 
                    type="button" 
                    className="w-full text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                    onClick={() => { setIsOtpStep(false); setOtp(""); }}
                  >
                    Wait, go back and edit details
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
                disabled={isSubmitting || !amount || Number(amount) > currentBalance || (isOtpStep && otp.length < 6) || !marketerData.bank_code || !marketerData.bank_verified}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> Processing...
                  </div>
                ) : isOtpStep ? "Verify & Confirm Withdrawal" : "Initiate Withdrawal"}
              </button>
            </form>
          </div>
        </UiCard>
      </div>
    </BrandShell>
  );
}
