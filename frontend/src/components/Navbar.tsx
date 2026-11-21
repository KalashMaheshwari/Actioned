"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { checkBackendHealth } from "@/lib/api";
import { ShieldCheck, ShieldAlert, Sparkles, BookOpen, Clock, Users } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    checkBackendHealth().then(setIsBackendHealthy);
    const interval = setInterval(() => {
      checkBackendHealth().then(setIsBackendHealthy);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { href: "/", label: "Ingest Meeting", icon: Sparkles },
    { href: "/decisions", label: "Decision Memory", icon: BookOpen },
    { href: "/digest", label: "Team Digest", icon: Users },
  ];

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              A
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
                Actioned
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 border-l border-zinc-300 dark:border-zinc-700 pl-2">
                Cross-Meeting Memory
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Health status pill */}
        <div className="flex items-center gap-2">
          {isBackendHealthy === null ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-zinc-300 animate-pulse" />
              Connecting...
            </span>
          ) : isBackendHealthy ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              API Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Offline
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
