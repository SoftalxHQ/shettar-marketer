"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BrandShell } from "@/components/brand-shell";
import { UiCard } from "@/components/ui-card";
import { useIsClient } from "@/lib/useIsClient";
import { useMarketerProfile } from "@/lib/marketer-profile-context";
import {
  allocateAgencyFunds,
  fetchAgencyAllocations,
  fetchAgencyMembers,
  fetchAgencySummary,
  type AgencyAllocation,
  type AgencyMember,
  type AgencySummary,
} from "@/lib/agency-api";
import { AlertCircle, HandCoins, History, Loader2 } from "lucide-react";

function fmt(n: number) {
  return `₦${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function walletLabel(type: string) {
  return type === "balance" ? "Salary wallet" : "Commission wallet";
}

export default function AgencyAllocatePage() {
  const router = useRouter();
  const isClient = useIsClient();
  const { profile, loading: profileLoading } = useMarketerProfile();

  const [summary, setSummary] = useState<AgencySummary | null>(null);
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [allocations, setAllocations] = useState<AgencyAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    member_id: "",
    amount: "",
    wallet_type: "commission_balance",
    notes: "",
  });

  const token = isClient ? localStorage.getItem("marketer_token") : null;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [agency, team, history] = await Promise.all([
        fetchAgencySummary(token),
        fetchAgencyMembers(token),
        fetchAgencyAllocations(token),
      ]);
      setSummary(agency);
      setMembers(team);
      setAllocations(history.allocations ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load allocation data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isClient || profileLoading) return;
    if (profile && profile.account_type !== "agency") {
      router.replace("/dashboard");
      return;
    }
    if (token) load();
  }, [isClient, profileLoading, profile, token, load, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const amount = parseFloat(form.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!form.member_id) {
      toast.error("Select a team member");
      return;
    }

    setSubmitting(true);
    try {
      await allocateAgencyFunds(token, {
        member_id: Number(form.member_id),
        amount,
        wallet_type: form.wallet_type,
        notes: form.notes || undefined,
      });
      toast.success("Funds released to team member");
      setForm({ member_id: "", amount: "", wallet_type: "commission_balance", notes: "" });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to release funds");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isClient || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <BrandShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Allocate Funds</h1>
          <p className="text-slate-500 mt-1">
            Release commission from your agency pool to a team member&apos;s salary or commission wallet.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={36} />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 text-rose-700">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Available Pool Balance</p>
              <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                {fmt(summary?.commission_balance ?? 0)}
              </p>
              <p className="text-sm text-indigo-600/80 mt-2">
                Total released to team: {fmt(summary?.total_allocated ?? 0)}
              </p>
            </div>

            <UiCard title="Release Funds" description="Members withdraw to their bank after funds are allocated." icon={HandCoins}>
              <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Team Member</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3"
                    value={form.member_id}
                    onChange={(e) => setForm({ ...form, member_id: e.target.value })}
                    required
                  >
                    <option value="">Select member…</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Amount (₦)</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Destination Wallet</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3"
                    value={form.wallet_type}
                    onChange={(e) => setForm({ ...form, wallet_type: e.target.value })}
                  >
                    <option value="commission_balance">Commission wallet</option>
                    <option value="balance">Salary wallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Notes (optional)</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || members.length === 0}
                  className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? "Processing…" : "Release Funds"}
                </button>
              </form>
            </UiCard>

            <UiCard title="Recent Allocations" icon={History}>
              {allocations.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No allocations yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Member</th>
                        <th className="pb-3 font-medium">Wallet</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {allocations.map((a) => (
                        <tr key={a.id}>
                          <td className="py-3">{new Date(a.created_at).toLocaleDateString()}</td>
                          <td className="py-3 font-medium">{a.member_name}</td>
                          <td className="py-3">{walletLabel(a.wallet_type)}</td>
                          <td className="py-3 font-bold text-emerald-600">{fmt(a.amount)}</td>
                          <td className="py-3 text-slate-500">{a.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </UiCard>
          </>
        )}
      </div>
    </BrandShell>
  );
}
