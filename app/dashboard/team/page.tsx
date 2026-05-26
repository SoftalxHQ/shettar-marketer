"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BrandShell } from "@/components/brand-shell";
import { UiCard } from "@/components/ui-card";
import { useIsClient } from "@/lib/useIsClient";
import { useMarketerProfile } from "@/lib/marketer-profile-context";
import {
  fetchAgencySummary,
  fetchAgencyMembers,
  createAgencyMember,
  type AgencyMember,
  type AgencySummary,
} from "@/lib/agency-api";
import { AlertCircle, ChevronRight, Loader2, Plus, Users, X } from "lucide-react";

function fmt(n: number) {
  return `₦${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AgencyTeamPage() {
  const router = useRouter();
  const isClient = useIsClient();
  const { profile, loading: profileLoading } = useMarketerProfile();
  const [summary, setSummary] = useState<AgencySummary | null>(null);
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone_number: "" });

  const token = isClient ? localStorage.getItem("marketer_token") : null;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [agency, team] = await Promise.all([
        fetchAgencySummary(token),
        fetchAgencyMembers(token),
      ]);
      setSummary(agency);
      setMembers(team);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load team");
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await createAgencyMember(token, form);
      toast.success("Team member invited. Login credentials sent via email.");
      setShowAdd(false);
      setForm({ full_name: "", email: "", phone_number: "" });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add member");
    } finally {
      setSaving(false);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Team</h1>
            <p className="text-slate-500 mt-1">
              Manage sub-marketers under {summary?.agency_name || profile?.agency_name || "your agency"}.
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Add Member
          </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Pool Balance", value: fmt(summary?.commission_balance ?? 0) },
                { label: "Team Members", value: String(summary?.team_members_count ?? members.length) },
                { label: "Team Referrals", value: String(summary?.total_referrals ?? 0) },
                { label: "Verified", value: String(summary?.verified_businesses ?? 0) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-black mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            <UiCard title="Team Members" description="Referrals from your team pay into your agency commission pool." icon={Users}>
              {members.length === 0 ? (
                <p className="text-center text-slate-500 py-12">No team members yet. Add your first sub-marketer to get started.</p>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <Link
                      key={member.id}
                      href={`/dashboard/team/${member.id}`}
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-colors group"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900 dark:text-white">{member.full_name}</p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                              member.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {member.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">{member.email}</p>
                        <p className="text-xs font-mono text-indigo-600 mt-1">{member.referrer_code}</p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right hidden sm:block">
                          <p className="text-slate-400 text-xs">Referrals</p>
                          <p className="font-bold">{member.total_referrals ?? 0}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-slate-400 text-xs">Verified</p>
                          <p className="font-bold">{member.verified_businesses ?? 0}</p>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-indigo-500" size={20} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </UiCard>
          </>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold">Add Team Member</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                <input className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email</label>
                <input className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone (optional)</label>
                <input className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
              </div>
              <p className="text-xs text-slate-500">A secure password will be generated and emailed to the new member.</p>
              <button type="submit" disabled={saving} className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold disabled:opacity-50">
                {saving ? "Sending invitation…" : "Send Invitation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </BrandShell>
  );
}
