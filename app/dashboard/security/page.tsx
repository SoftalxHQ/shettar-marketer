"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiBase, apiFetch } from "@/lib/api";
import { useIsClient } from "@/lib/useIsClient";
import { BrandShell } from "@/components/brand-shell";
import { UiCard } from "@/components/ui-card";
import { ShieldCheck, Loader2 } from "lucide-react";
import {
  formButtonPrimaryInlineClass,
  formInputClass,
  formLabelClass,
} from "@/lib/form-styles";

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
      const res = await apiFetch(`/api/v1/marketers/me/password`, {
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
          <form onSubmit={changePassword} className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <label htmlFor="current_password" className={formLabelClass}>
                  Current Password
                </label>
                <input
                  id="current_password"
                  type="password"
                  className={formInputClass}
                  value={currPass}
                  onChange={(e) => setCurrPass(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="new_password" className={formLabelClass}>
                    New Password
                  </label>
                  <input
                    id="new_password"
                    type="password"
                    className={formInputClass}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new_password_confirmation" className={formLabelClass}>
                    Confirm New Password
                  </label>
                  <input
                    id="new_password_confirmation"
                    type="password"
                    className={formInputClass}
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
              className={formButtonPrimaryInlineClass}
            >
              {pwLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
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
