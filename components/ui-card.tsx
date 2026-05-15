import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function UiCard({
  title,
  description,
  children,
  className = "",
  id,
  icon: Icon,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  id?: string;
  icon?: React.ElementType;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/20 bg-white/70 backdrop-blur-xl shadow-xl transition-all hover:shadow-2xl dark:border-white/10 dark:bg-slate-900/50",
        className
      )}
    >
      <div className="p-6 sm:p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                  <Icon size={20} strokeWidth={2.5} />
                </div>
              )}
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h2>
            </div>
            {description && (
              <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="relative z-10">{children}</div>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-500/5 blur-3xl" />
    </section>
  );
}
