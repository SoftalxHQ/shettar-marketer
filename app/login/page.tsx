"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { apiBase } from "@/lib/api";
import { 
  LogIn, 
  Mail, 
  Lock, 
  Loader2, 
  AlertCircle,
  ChevronRight,
  ArrowRight
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionReason = searchParams.get("reason");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/api/v1/marketers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Invalid credentials. Please try again.");
        return;
      }
      localStorage.setItem("marketer_token", data.token);
      toast.success("Welcome back! Redirecting to dashboard...");
      router.push("/dashboard");
    } catch {
      toast.error("Unable to connect to the server. Please check your internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] flex items-center justify-center p-6">
      {/* Decorative background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 font-black text-3xl mb-6 transform transition-transform hover:rotate-12 cursor-default">
            S
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            Marketer Portal
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium text-center">
            Sign in to track your referrals and commissions.
          </p>
        </div>

        {sessionReason && (
          <div className={`mb-6 flex items-start gap-3 rounded-2xl border px-5 py-4 ${
            sessionReason === "account_inactive"
              ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400"
              : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400"
          }`}>
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm font-semibold">
              {sessionReason === "account_inactive"
                ? "Your account has been deactivated. Please contact support if you believe this is an error."
                : "Your session has expired. Please sign in again to continue."}
            </p>
          </div>
        )}

        <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
          <div className="p-8 sm:p-12">
            <form onSubmit={submit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 pl-14 pr-5 py-5 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="password" className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    Password
                  </label>
                  <Link href="https://shettar.com/support" className="text-xs font-bold text-indigo-600 hover:underline underline-offset-4">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 pl-14 pr-5 py-5 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-8 py-5 text-lg font-black text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98] group"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="bg-slate-50/80 dark:bg-slate-800/30 p-6 text-center border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Your account is managed by Shettar admin.{" "}
              <Link href="https://shettar.com/support" className="text-indigo-600 font-bold hover:underline">
                Need Help?
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center flex items-center justify-center gap-6">
          <Link href="/" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
            Terms of Use
          </Link>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <Link href="/" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MarketerLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
