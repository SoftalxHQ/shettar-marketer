import type { ReactNode } from "react";

export function UiCard({
  title,
  description,
  children,
  className = "",
  id,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8 ${className}`}
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
