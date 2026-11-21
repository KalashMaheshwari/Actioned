"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { checkBackendHealth, seedDemoData } from "@/lib/api";
import { ChevronDown, RotateCcw, Database, Check } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkBackendHealth().then(setIsBackendHealthy);
    const interval = setInterval(() => {
      checkBackendHealth().then(setIsBackendHealthy);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResetWorkspace = async () => {
    setIsResetting(true);
    try {
      await seedDemoData();
      setResetDone(true);
      setTimeout(() => {
        setResetDone(false);
        setIsMenuOpen(false);
      }, 1500);
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.reload();
      }
    } catch {
      alert("Failed to reset workspace. Ensure backend is running at http://localhost:8000");
    } finally {
      setIsResetting(false);
    }
  };

  const navLinks = [
    { href: "/", label: "Ingest Meeting" },
    { href: "/decisions", label: "Decision Memory" },
    { href: "/digest", label: "Team Digest" },
  ];

  return (
    <header className="border-b border-[#E6DFD1] bg-[#F5F0E6]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-serif text-2xl font-normal tracking-tight text-[#1F1E1B] group-hover:text-[#D97757] transition-colors">
              Actioned
            </span>
            <span className="text-xs text-[#D97757] font-mono tracking-widest font-semibold">
              ●
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-[#EAE2D2] text-[#1F1E1B] font-semibold"
                      : "text-[#6B6354] hover:text-[#1F1E1B] hover:bg-[#EFE9DC]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Workspace Selector */}
        <div className="flex items-center gap-3" ref={menuRef}>
          {/* Status Indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#736B5E] font-sans">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBackendHealthy ? "bg-[#3F7552]" : "bg-[#B87A28]"
              }`}
            />
            <span>{isBackendHealthy ? "Active" : "Connecting"}</span>
          </div>

          <div className="h-4 w-px bg-[#DDD4C3] hidden md:block" />

          {/* Workspace Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#EAE2D2] border border-[#DDD3BF] text-[#1F1E1B] hover:bg-[#E4D9C7] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Acme Workspace</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#736B5E]" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-[#E5DDD0] shadow-lg py-2 z-50 text-xs">
                <div className="px-3 py-1.5 border-b border-[#F0EEE7]">
                  <p className="font-semibold text-[#1F1E1B]">Acme Corp</p>
                  <p className="text-[11px] text-[#736B5E] font-mono">4 active team members</p>
                </div>

                <div className="px-3 py-2 text-[11px] text-[#736B5E] border-b border-[#F0EEE7] space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Memory Engine:</span>
                    <span className="font-mono text-[#2D5A43] font-medium">ChromaDB Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Task Integration:</span>
                    <span className="font-mono text-[#1F1E1B]">Trello Connected</span>
                  </div>
                </div>

                <div className="p-1">
                  <button
                    type="button"
                    onClick={handleResetWorkspace}
                    disabled={isResetting}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#FAF6EE] text-[#736B5E] hover:text-[#1F1E1B] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <RotateCcw className={`w-3 h-3 ${isResetting ? "animate-spin text-[#D97757]" : ""}`} />
                      <span>Reload Workspace Data</span>
                    </span>
                    {resetDone && <Check className="w-3.5 h-3.5 text-[#2D5A43]" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
