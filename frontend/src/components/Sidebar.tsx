"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { checkBackendHealth, seedDemoData } from "@/lib/api";
import {
  Menu,
  X,
  Sparkles,
  BookOpen,
  Users,
  RotateCcw,
  Check,
  ChevronRight,
  ShieldCheck,
  Database,
  Layers,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
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

  // Keyboard shortcut listener (ESC or '[' to toggle)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      } else if (e.key === "[" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        setIsOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleResetWorkspace = async () => {
    setIsResetting(true);
    try {
      await seedDemoData();
      setResetDone(true);
      setTimeout(() => {
        setResetDone(false);
      }, 1800);
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.reload();
      }
    } catch {
      alert("Failed to reset workspace. Ensure backend is running at http://localhost:8000");
    } finally {
      setIsResetting(false);
    }
  };

  const navItems = [
    {
      href: "/",
      label: "Ingest Meeting",
      description: "Transcripts, audio, and VTT",
      icon: Sparkles,
    },
    {
      href: "/decisions",
      label: "Decision Memory",
      description: "Permanent vector archive",
      icon: BookOpen,
    },
    {
      href: "/digest",
      label: "Team Digest",
      description: "Personalized deliverables",
      icon: Users,
    },
  ];

  return (
    <>
      {/* Floating Dynamic Trigger Button (Top Left) */}
      <div className="fixed top-6 left-6 z-40 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open Navigation Menu"
          className="group flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#FFFDF9]/90 backdrop-blur-md border border-[#E0D7C6] hover:border-[#D5CBB9] text-[#1F1E1B] shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer"
        >
          <Menu className="w-4 h-4 text-[#736B5E] group-hover:text-[#1F1E1B] transition-colors" />
          <span className="font-serif text-sm font-medium tracking-tight">Actioned</span>
          <span className="text-[10px] text-[#D97757] font-mono">●</span>
        </button>

        {/* Quiet Live Status Dot next to floating trigger */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFE9DC]/70 border border-[#E2D9C8] text-[11px] font-mono text-[#736B5E]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isBackendHealthy ? "bg-[#3F7552]" : "bg-[#B87A28]"
            }`}
          />
          <span>{isBackendHealthy ? "Core active" : "Connecting"}</span>
        </div>
      </div>

      {/* Backdrop Overlay with Smooth Fade */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-[#1F1E1B]/20 backdrop-blur-xs z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Fluid Animated Slide-Out Side Nav Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#FFFDF9] border-r border-[#E5DDD0] shadow-2xl z-50 flex flex-col justify-between transform transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header & Branding */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EFE9DC]">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 group"
            >
              <span className="font-serif text-2xl font-normal tracking-tight text-[#1F1E1B] group-hover:text-[#D97757] transition-colors">
                Actioned
              </span>
              <span className="text-xs text-[#D97757] font-mono tracking-widest font-semibold">
                ●
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Navigation Menu"
              className="p-1.5 rounded-lg text-[#736B5E] hover:text-[#1F1E1B] hover:bg-[#F5EFE4] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Workspace Card */}
          <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E5DDD0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#736B5E] font-semibold">
                Current Workspace
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EAE2D2] text-[#2D5A43] font-medium">
                Connected
              </span>
            </div>
            <div className="font-serif text-sm font-medium text-[#1F1E1B]">
              Acme Corp
            </div>
            <div className="pt-2 border-t border-[#EDE5D6] flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetWorkspace}
                disabled={isResetting}
                className="text-[11px] font-mono text-[#736B5E] hover:text-[#D97757] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3 h-3 ${isResetting ? "animate-spin text-[#D97757]" : ""}`} />
                <span>{resetDone ? "Data reloaded!" : "Reload sample data"}</span>
              </button>
              {resetDone && <Check className="w-3.5 h-3.5 text-[#2D5A43]" />}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9E9585] block px-3 mb-2 font-semibold">
              Navigation
            </span>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#FDF1EB] border border-[#F4D5C7] text-[#1F1E1B]"
                      : "hover:bg-[#FAF6EE] text-[#544D41] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-[#FBE2D8] text-[#B93828]"
                          : "bg-[#F5EFE4] text-[#736B5E] group-hover:text-[#1F1E1B]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`block text-sm font-sans ${isActive ? "font-semibold text-[#B93828]" : "font-medium"}`}>
                        {item.label}
                      </span>
                      <span className="block text-[11px] text-[#8C8474]">
                        {item.description}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                      isActive ? "text-[#B93828]" : "text-[#B0A798]"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Drawer Footer */}
        <div className="p-6 border-t border-[#EFE9DC] bg-[#FAF7F0] space-y-3">
          <div className="flex items-center justify-between text-xs text-[#736B5E] font-mono">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#88A691]" />
              <span>ChromaDB Memory</span>
            </span>
            <span className="text-[#2D5A43] font-medium">1,536-dim</span>
          </div>

          <div className="text-[11px] text-[#8C8474] font-sans flex items-center justify-between pt-1">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#DDD4C3] font-mono text-[10px] text-[#544D41]">[</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#DDD4C3] font-mono text-[10px] text-[#544D41]">ESC</kbd></span>
            <span>v0.1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
