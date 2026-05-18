"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { apiBase } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  formButtonPrimaryClass,
  formIconClass,
  formInputWithIconClass,
  formLabelClass,
} from "@/lib/form-styles";
import {
  Mail,
  Lock,
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

type Step = "email" | "reset" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/api/v1/marketers/reset_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketer: { email } }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.errors?.[0] || data.error || "Could not send reset instructions.");
        return;
      }
      toast.success(data.message || "Check your email for a 6-digit reset code.");
      setStep("reset");
    } catch {
      toast.error("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (resetToken.trim().length !== 6) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/api/v1/marketers/update_password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketer: {
            reset_password_token: resetToken.trim(),
            password,
            password_confirmation: passwordConfirmation,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.errors?.[0] || data.error || "Invalid or expired reset code.");
        return;
      }
      toast.success(data.message || "Password updated successfully.");
      setStep("success");
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      toast.error("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] flex items-center justify-center p-6">
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-black text-xl mb-4">
            S
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white text-center">
            {step === "email" && "Forgot password?"}
            {step === "reset" && "Set a new password"}
            {step === "success" && "Password updated"}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium text-center max-w-sm">
            {step === "email" &&
              "Enter your marketer account email and we will send a 6-digit reset code."}
            {step === "reset" &&
              `Enter the code sent to ${email} and choose a new password.`}
            {step === "success" &&
              "You can now sign in with your new password. Redirecting to login…"}
          </p>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-white/10 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            {step === "success" ? (
              <div className="flex flex-col items-center text-center space-y-4 py-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={24} />
                </div>
                <Link href="/login" className={formButtonPrimaryClass}>
                  Continue to sign in
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : step === "email" ? (
              <form onSubmit={requestReset} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className={formLabelClass}>
                    Email address
                  </label>
                  <div className="relative group">
                    <Mail className={formIconClass} size={18} />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className={formInputWithIconClass()}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className={formButtonPrimaryClass}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Sending…</span>
                    </>
                  ) : (
                    <>
                      <span>Send reset code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={submitNewPassword} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="resetToken" className={formLabelClass}>
                    6-digit code
                  </label>
                  <div className="relative group">
                    <KeyRound className={formIconClass} size={18} />
                    <input
                      id="resetToken"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      className={formInputWithIconClass(
                        "tracking-[0.35em] font-bold text-center",
                      )}
                      value={resetToken}
                      onChange={(e) =>
                        setResetToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="000000"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className={formLabelClass}>
                    New password
                  </label>
                  <div className="relative group">
                    <Lock className={formIconClass} size={18} />
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      className={formInputWithIconClass()}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="passwordConfirmation" className={formLabelClass}>
                    Confirm password
                  </label>
                  <div className="relative group">
                    <Lock className={formIconClass} size={18} />
                    <input
                      id="passwordConfirmation"
                      type="password"
                      autoComplete="new-password"
                      className={formInputWithIconClass()}
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      placeholder="Repeat new password"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className={formButtonPrimaryClass}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Updating…</span>
                    </>
                  ) : (
                    <>
                      <span>Update password</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  Use a different email
                </button>
              </form>
            )}
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-800/30 px-6 py-4 text-center border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:underline"
            >
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
