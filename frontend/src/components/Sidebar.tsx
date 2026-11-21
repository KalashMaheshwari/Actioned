"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, MouseEvent } from "react";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import { checkBackendHealth, seedDemoData } from "@/lib/api";
import {
  RotateCcw,
  ChevronLeft,
} from "lucide-react";
import {
  IngestApertureIcon,
  VectorNexusIcon,
  SynergyClusterIcon,
  SearchReticleIcon,
} from "@/components/Icons";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // High-performance 360-degree physics springs for cursor tracking
  const springX = useSpring(0, { stiffness: 500, damping: 28, mass: 0.4 });
  const springY = useSpring(0, { stiffness: 500, damping: 28, mass: 0.4 });

  useEffect(() => {
    setMounted(true);
    checkBackendHealth().then(setIsBackendHealthy);
    const interval = setInterval(() => {
      checkBackendHealth().then(setIsBackendHealthy);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMoveItem = (e: MouseEvent<HTMLDivElement>, index: number) => {
    // 360-degree cursor following: offset smoothly from mouse coordinates
    springX.set(e.clientX + 18);
    springY.set(e.clientY - 14);
    setHoveredIndex(index);
  };

  const handleResetWorkspace = async () => {
    setIsResetting(true);
    try {
      await seedDemoData();
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.reload();
      }
    } catch {
      alert("Failed to reload workspace data.");
    } finally {
      setIsResetting(false);
    }
  };

  const navItems: NavItem[] = [
    {
      href: "/",
      label: "Ingest Meeting",
      icon: IngestApertureIcon,
      badge: "Whisper",
    },
    {
      href: "/decisions",
      label: "Decision Memory",
      icon: VectorNexusIcon,
      badge: "Vector",
    },
    {
      href: "/digest",
      label: "Team Digest",
      icon: SynergyClusterIcon,
      badge: "Weekly",
    },
  ];

  const collapsed = mounted ? isCollapsed : false;

  return (
    <>
      {/* 360-Degree Cursor Following Floating Hover Tag */}
      <AnimatePresence>
        {hoveredIndex !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              x: springX,
              y: springY,
              pointerEvents: "none",
              zIndex: 9999,
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#D47255] text-[#2A140E] font-bold text-xs whitespace-nowrap shadow-2xl flex items-center gap-1.5 border-none select-none backdrop-blur-md"
          >
            <span>{navItems[hoveredIndex].label}</span>
            <span className="text-[10px] font-mono opacity-80 uppercase tracking-wider">
              • {navItems[hoveredIndex].badge}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Floating Glass Top Header */}
      <header className="sm:hidden fixed top-3 left-3 right-3 z-30 liquid-glass-panel rounded-2xl p-2.5 flex items-center justify-between border-none shadow-xl">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-md flex items-center justify-center bg-[#181A24]">
            <Image
              src="/logo.webp"
              alt="Actioned"
              width={32}
              height={32}
              className="w-full h-full object-cover select-none"
            />
          </div>
          <span className="font-bold text-sm text-white tracking-tight">Actioned</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-3 py-1.5 rounded-xl bg-[#1C1F2B] text-[#D47255] font-bold text-xs flex items-center gap-1.5 cursor-pointer border-none"
        >
          <IngestApertureIcon className="w-3.5 h-3.5 text-[#D47255]" />
          <span>{collapsed ? "Menu" : "Close"}</span>
        </button>
      </header>

      {/* Mobile Backdrop Overlay when Drawer is Open */}
      {!collapsed && (
        <div
          onClick={() => setIsCollapsed(true)}
          className="sm:hidden fixed inset-0 bg-black/75 backdrop-blur-md z-40 transition-opacity"
        />
      )}

      <motion.aside
        suppressHydrationWarning
        initial={false}
        onClick={() => {
          // Tapping anywhere in empty space of collapsed menu opens it
          if (collapsed) {
            setIsCollapsed(false);
          }
        }}
        animate={{
          width: collapsed ? 80 : 260,
        }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 32,
          mass: 0.8,
        }}
        className={`z-50 liquid-glass-sidebar rounded-[1.75rem] flex flex-col justify-between p-4 sm:p-5 select-none transition-transform duration-300 ${
          collapsed
            ? "max-sm:hidden sm:fixed sm:top-4 sm:left-4 sm:bottom-4 cursor-pointer"
            : "max-sm:fixed max-sm:top-0 max-sm:bottom-0 max-sm:left-0 max-sm:h-full max-sm:w-[280px] max-sm:rounded-r-3xl max-sm:rounded-l-none sm:fixed sm:top-4 sm:left-4 sm:bottom-4 shadow-2xl"
        }`}
      >
        {/* Top Header & Navigation */}
        <div className="space-y-6" suppressHydrationWarning>
          {/* Header Row: Dedicated button JUST for closing when open */}
          <div
            className={`flex items-center transition-all ${
              collapsed ? "justify-center" : "justify-between px-1"
            }`}
            suppressHydrationWarning
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl overflow-hidden shrink-0 shadow-lg shadow-[#D47255]/20 flex items-center justify-center bg-[#181A24]">
                <Image
                  src="/logo.webp"
                  alt="Actioned Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover select-none"
                  priority
                />
              </div>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <span className="font-bold text-base text-white tracking-tight block leading-tight">
                      Actioned
                    </span>
                    <span className="text-[10px] text-[#858997] font-mono tracking-wider uppercase block">
                      Meeting Agent
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Just for closing: subtle button when expanded */}
            {!collapsed && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(true);
                }}
                title="Close menu"
                className="w-7 h-7 rounded-xl bg-[#1C1F2B]/80 hover:bg-[#252837] text-[#9FA4B2] hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Mockup (No cmd+k) */}
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <SearchReticleIcon className="w-3.5 h-3.5 text-[#6B707F] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    readOnly
                    placeholder="Search memory..."
                    className="w-full pl-8 pr-4 py-2 text-xs rounded-xl bg-[#161822]/80 text-[#9FA4B2] placeholder-[#6B707F] border-none focus:outline-none shadow-inner"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Items */}
          <div className="space-y-1.5" suppressHydrationWarning>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-mono uppercase tracking-wider text-[#6B707F] font-semibold px-2 block mb-2"
                >
                  Workspace
                </motion.span>
              )}
            </AnimatePresence>

            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <div
                  key={item.href}
                  onMouseEnter={(e) => handleMouseMoveItem(e, index)}
                  onMouseMove={(e) => handleMouseMoveItem(e, index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="relative"
                  suppressHydrationWarning
                >
                  <Link
                    href={item.href}
                    className={`relative flex items-center gap-3 rounded-2xl transition-all duration-200 ${
                      collapsed ? "justify-center p-3" : "px-3.5 py-3"
                    } ${
                      isActive
                        ? "bg-[#D47255] text-[#2A140E] font-bold shadow-lg shadow-[#D47255]/25"
                        : "text-[#9FA4B2] hover:text-white hover:bg-[#1A1D28]/70"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                        isActive
                          ? "text-[#2A140E] scale-105"
                          : "text-[#9FA4B2] group-hover:scale-105"
                      }`}
                    />

                    {!collapsed && (
                      <span className="text-sm font-medium tracking-tight truncate flex-1">
                        {item.label}
                      </span>
                    )}

                    {!collapsed && !isActive && (
                      <span className="text-[10px] font-mono text-[#6B707F] px-1.5 py-0.5 rounded-md bg-[#161822]/60">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Profile / Workspace Pill (Liquid Glass style) */}
        <div className="pt-2 space-y-2" suppressHydrationWarning>
          <div
            suppressHydrationWarning
            className={`flex items-center gap-3 p-2 rounded-2xl bg-[#171924]/75 backdrop-blur-md transition-all ${
              collapsed ? "justify-center" : "px-3 py-2.5"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#D47255] text-[#2A140E] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              AC
            </div>

            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex-1 min-w-0 overflow-hidden"
                  suppressHydrationWarning
                >
                  <span className="text-xs font-semibold text-white block truncate leading-tight">
                    Acme Corp (Demo)
                  </span>
                  <span className="text-[10px] font-mono text-[#858997] block truncate">
                    {isBackendHealthy ? "Vector Memory Active" : "Connecting..."}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {!collapsed && (
              <button
                type="button"
                onClick={handleResetWorkspace}
                disabled={isResetting}
                title="Reset demo data in ChromaDB & SQLite"
                className="p-1 rounded-lg text-[#858997] hover:text-[#D47255] transition-colors cursor-pointer"
              >
                <RotateCcw
                  className={`w-3.5 h-3.5 ${
                    isResetting ? "animate-spin text-[#D47255]" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
