import type { ReactNode } from "react";

/** Soft header band + centered content — matches Shettar mailer / business purple accent */
export function BrandShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-violet-100/80 via-slate-50 to-slate-50">
      <header className="border-b border-violet-200/60 bg-gradient-to-r from-violet-100/90 via-indigo-50/80 to-slate-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md">
              S
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">Shettar</p>
              <p className="text-xs text-muted-foreground">Marketer portal</p>
            </div>
          </div>
          {footer}
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
