import { cn } from "@/lib/utils";

export const formLabelClass =
  "text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1";

export const formInputClass =
  "w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all";

export function formInputWithIconClass(extra?: string) {
  return cn(
    "w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all",
    extra,
  );
}

export const formInputMonoClass = cn(formInputClass, "font-mono");

export const formSelectClass = cn(formInputClass, "font-medium appearance-none");

export const formButtonPrimaryClass =
  "w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]";

export const formButtonPrimaryInlineClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]";

export const formIconClass =
  "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors";
