"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { BrandShell } from "@/components/brand-shell";
import { UiCard } from "@/components/ui-card";
import { useIsClient } from "@/lib/useIsClient";
import { useMarketerProfile } from "@/lib/marketer-profile-context";
import {
  fetchMemberPerformance,
  updateAgencyMemberStatus,
  type AgencyMember,
} from "@/lib/agency-api";
import { AlertCircle, ArrowLeft, BarChart3, Loader2, X } from "lucide-react";

function fmt(n: number) {
  return `₦${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AgencyMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const isClient = useIsClient();
  const { profile, loading: profileLoading } = useMarketerProfile();
  const memberId = Number(params.id);

  const [member, setMember] = useState<AgencyMember | null>(null);
  const [performance, setPerformance] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState<"active" | "inactive">("inactive");
  const [statusReason, setStatusReason] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);

  const token = isClient ? localStorage.getItem("marketer_token") : null;

  const load = useCallback(async () => {
    if (!token || Number.isNaN(memberId)) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMemberPerformance(token, memberId);
      setMember(data.member);
      setPerformance(data.performance);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load member");
    } finally {
      setLoading(false);
    }
  }, [token, memberId]);

  useEffect(() => {
    if (!isClient || profileLoading) return;
    if (profile && profile.account_type !== "agency") {
      router.replace("/dashboard");
      return;
    }
    load();
  }, [isClient, profileLoading, profile, load, router]);

  const openStatusModal = (action: "active" | "inactive") => {
    setStatusAction(action);
    setStatusReason("");
    setShowStatusModal(true);
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !member) return;
    setStatusSaving(true);
    try {
      const updated = await updateAgencyMemberStatus(token, member.id, {
        status: statusAction,
        reason: statusReason.trim() || undefined,
      });
      setMember(updated);
      setShowStatusModal(false);
      toast.success(
        statusAction === "inactive"
          ? "Team member deactivated. They have been notified by email."
          : "Team member reactivated. They have been notified by email.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update member status");
    } finally {
      setStatusSaving(false);
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
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/team" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft size={22} />
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black tracking-tight">{member?.full_name ?? "Team Member"}</h1>
                {member && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${
                      member.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {member.status}
                  </span>
                )}
              </div>
              <p className="text-slate-500 mt-1">{member?.email}</p>
            </div>
          </div>

          {member && (
            <div className="flex gap-2">
              {member.status === "active" ? (
                <button
                  type="button"
                  onClick={() => openStatusModal("inactive")}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700"
                >
                  Deactivate Member
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openStatusModal("active")}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
                >
                  Reactivate Member
                </button>
              )}
            </div>
          )}
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
        ) : member ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Referrals", value: String(member.total_referrals ?? performance?.total_referrals ?? 0) },
                { label: "Verified", value: String(member.verified_businesses ?? performance?.verified_businesses ?? 0) },
                {
                  label: "Commission Earned",
                  value: fmt(Number(member.referral_commission_earned ?? performance?.referral_commission_earned ?? 0)),
                },
                { label: "Ref Code", value: member.referrer_code },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                  <p className="text-xl font-black mt-1 break-all">{stat.value}</p>
                </div>
              ))}
            </div>

            <UiCard
              title="Wallet Balances"
              description="Amounts released from the agency pool appear here. Members withdraw on their own."
              icon={BarChart3}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-400 uppercase font-bold">Salary Wallet</p>
                  <p className="text-2xl font-black mt-1">{fmt(member.balance ?? 0)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-400 uppercase font-bold">Commission Wallet</p>
                  <p className="text-2xl font-black mt-1">{fmt(member.commission_balance ?? 0)}</p>
                </div>
              </div>
            </UiCard>
          </>
        ) : null}
      </div>

      {showStatusModal && member && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold">
                  {statusAction === "inactive" ? "Deactivate Team Member" : "Reactivate Team Member"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{member.full_name} will be notified by email.</p>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleStatusChange} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Message for email (optional)
                </label>
                <textarea
                  className="w-full min-h-[100px] rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3 text-sm"
                  placeholder={
                    statusAction === "inactive"
                      ? "Optional note explaining why access was suspended…"
                      : "Optional welcome-back note…"
                  }
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-2">
                  The email will note this action was taken by your agency
                  {profile?.agency_name ? ` (${profile.agency_name})` : ""}.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusSaving}
                  className={`flex-1 py-3 rounded-2xl text-white font-bold disabled:opacity-50 ${
                    statusAction === "inactive" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {statusSaving
                    ? "Saving…"
                    : statusAction === "inactive"
                      ? "Deactivate & Notify"
                      : "Reactivate & Notify"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </BrandShell>
  );
}
