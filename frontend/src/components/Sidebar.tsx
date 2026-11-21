"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { checkBackendHealth, seedDemoData } from "@/lib/api";
import {
  Sparkles,
  BookOpen,
  Users,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
  Search,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    checkBackendHealth().then(setIsBackendHealthy);
    const interval = setInterval(() => {
      checkBackendHealth().then(setIsBackendHealthy);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleResetWorkspace = async () => {
    setIsResetting(true);
    try {
      await seedDemoData();
      setResetDone(true);
      setTimeout(() => setResetDone(false), 2000);
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.reload();
      }
    } catch {
      alert("Failed to reload workspace data.");
    } finally {
      setIsResetting(false);
    }
  };

  const navItems = [
    {
      href: "/",
      label: "Ingest Meeting",
      icon: Sparkles,
      badge: "Whisper",
    },
    {
      href: "/decisions",
      label: "Decision Memory",
      icon: BookOpen,
      badge: "Vector",
    },
    {
      href: "/digest",
      label: "Team Digest",
      icon: Users,
      badge: "Weekly",
    },
  ];

  return (
    <aside
      className={`fixed top-4 left-4 bottom-4 z-40 bg-[#15161C] rounded-3xl flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-2xl border-none ${
        isCollapsed ? "w-20 p-3" : "w-64 p-5"
      }`}
    >
      {/* Top Bar: Mac Dots + Collapse Button */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          {/* Mac Window Dots */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block" />
          </div>

          {/* Collapse / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="w-7 h-7 rounded-full bg-[#1E2028] hover:bg-[#282A36] text-[#9FA4B2] hover:text-white flex items-center justify-center transition-colors cursor-pointer border-none"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Brand Wordmark */}
        <Link
          href="/"
          className={`flex items-center gap-3 transition-opacity ${
            isCollapsed ? "justify-center" : "px-1"
          }`}
        >
          <div className="w-9 h-9 rounded-2xl bg-[#D47255] text-[#2A140E] flex items-center justify-center font-extrabold text-base shrink-0 shadow-md">
            A
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <span className="font-bold text-lg text-white tracking-tight block">
                Actioned
              </span>
              <span className="text-[11px] text-[#858997] font-sans block truncate">
                Meeting Agent
              </span>
            </div>
          )}
        </Link>

        {/* Search Mockup (Workly style) */}
        {!isCollapsed && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6B707F] absolute left-3 top-2.5" />
            <input
              type="text"
              readOnly
              placeholder="Search..."
              className="w-full pl-8 pr-12 py-1.5 text-xs rounded-xl bg-[#1A1C24] text-[#9FA4B2] placeholder-[#6B707F] border-none focus:outline-none"
            />
            <span className="absolute right-2.5 top-2 text-[10px] font-mono text-[#6B707F] bg-[#15161C] px-1 rounded">
              ⌘K
            </span>
          </div>
        )}

        {/* Navigation Section */}
        <div className="space-y-1.5 pt-1">
          {!isCollapsed && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B707F] font-semibold px-2 block mb-2">
              Menu
            </span>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl transition-all cursor-pointer ${
                    isCollapsed ? "justify-center p-3" : "px-3.5 py-3"
                  } ${
                    isActive
                      ? "bg-[#D47255] text-[#2A140E] font-bold shadow-md"
                      : "text-[#9FA4B2] hover:text-white hover:bg-[#1A1C24]"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? "text-[#2A140E]" : "text-[#9FA4B2] group-hover:text-white"
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="text-sm tracking-tight truncate flex-1">
                      {item.label}
                    </span>
                  )}
                </Link>

                {/* Floating Tooltip when Collapsed (Aceagency style) */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#D47255] text-[#2A140E] font-bold text-xs whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile / Workspace Pill (Workly style) */}
      <div className="pt-2 space-y-2">
        <div
          className={`flex items-center gap-3 p-2 rounded-2xl bg-[#1A1C24] transition-all ${
            isCollapsed ? "justify-center" : "px-3 py-2.5"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-[#D47255] text-[#2A140E] flex items-center justify-center font-bold text-xs shrink-0">
            AC
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-white block truncate">
                Acme Corp
              </span>
              <span className="text-[11px] text-[#858997] block truncate">
                {isBackendHealthy ? "Memory Connected" : "Connecting..."}
              </span>
            </div>
          )}

          {!isCollapsed && (
            <button
              type="button"
              onClick={handleResetWorkspace}
              disabled={isResetting}
              title="Reload sample data"
              className="p-1 rounded-lg text-[#858997] hover:text-[#D47255] transition-colors cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin text-[#D47255]" : ""}`} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
