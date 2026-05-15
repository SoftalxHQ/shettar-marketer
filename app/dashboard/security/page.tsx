"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiBase } from "@/lib/api";
import { useIsClient } from "@/lib/useIsClient";
import { BrandShell } from "@/components/brand-shell";
import { UiCard } from "@/components/ui-card";
import { 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";

export default function SecurityPage() {
  const isClient = useIsClient();
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const token = isClient ? localStorage.getItem("marketer_token") : null;

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (newPass !== newPass2) {
      toast.error("New passwords do not match");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch(`${apiBase()}/api/v1/marketers/me/password`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marketer: {
            current_password: currPass,
            password: newPass,
            password_confirmation: newPass2,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.errors?.join(", ") || "Could not update password");
        return;
      }
      toast.success(json.message || "Password successfully updated");
      setCurrPass("");
      setNewPass("");
      setNewPass2("");
    } catch {
      toast.error("Network error during password update");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <BrandShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Account Security</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your access and update your credentials.</p>
        </div>

        <UiCard
          title="Password Update"
          description="Protect your account by regularly updating your password. We recommend a mix of symbols, numbers, and uppercase letters."
          icon={ShieldCheck}
          className="max-w-2xl"
        >
          <form onSubmit={changePassword} className="space-y-6 mt-4">
            <div className="grid gap-6">
              <div className="space-y-2">
                <label htmlFor="current_password" className="text-sm font-bold uppercase tracking-widest ml-1 text-slate-500">
                  Current Password
                </label>
                <input
                  id="current_password"
                  type="password"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-5 py-4 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  value={currPass}
                  onChange={(e) => setCurrPass(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="new_password" className="text-sm font-bold uppercase tracking-widest ml-1 text-slate-500">
                    New Password
                  </label>
                  <input
                    id="new_password"
                    type="password"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-5 py-4 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new_password_confirmation" className="text-sm font-bold uppercase tracking-widest ml-1 text-slate-500">
                    Confirm New Password
                  </label>
                  <input
                    id="new_password_confirmation"
                    type="password"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-5 py-4 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    value={newPass2}
                    onChange={(e) => setNewPass2(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    minLength={8}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={pwLoading}
              className="inline-flex items-center gap-3 rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {pwLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password Now</span>
              )}
            </button>
          </form>
        </UiCard>
      </div>
    </BrandShell>
  );
}
