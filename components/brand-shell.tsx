"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Settings,
  Wallet,
  Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const logout = () => {
    localStorage.removeItem("marketer_token");
    window.location.href = "/login";
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Performance", href: "/dashboard/performance", icon: TrendingUp },
    { name: "Finance", href: "/dashboard/finance", icon: Wallet },
    { name: "Bank Accounts", href: "/dashboard/bank-accounts", icon: Landmark },
    { name: "Security", href: "/dashboard/security", icon: ShieldCheck },
  ];


  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-black text-xl">
              S
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">Shettar</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Marketer</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href.includes("#") && pathname + item.href.substring(item.href.indexOf("#")) === item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
                    isActive
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold"
                      : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="flex-1">{item.name}</span>
                  {isActive && <ChevronRight size={16} />}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors font-semibold"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">S</div>
            <span className="font-bold">Shettar</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
