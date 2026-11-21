import type { Metadata } from "next";
import { Suspense } from "react";
import { Newsreader, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const geistSans = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Actioned — Autonomous Meeting Agent",
  description:
    "An autonomous meeting-to-execution agent with cross-meeting memory and conflict detection.",
  icons: {
    icon: "/logo.webp",
    shortcut: "/logo.webp",
    apple: "/logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${newsreader.variable} ${geistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-[#090A0E] text-[#FFFFFF] flex font-sans antialiased selection:bg-[#D47255] selection:text-[#2A140E]"
        suppressHydrationWarning
      >
        {/* Collapsible Left Sidebar */}
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>

        {/* Main Content Area */}
        <div
          suppressHydrationWarning
          className="flex-1 min-w-0 px-4 pt-20 pb-16 sm:px-8 sm:py-8 sm:pl-28 lg:pl-72 transition-all duration-300"
        >
          <main suppressHydrationWarning className="max-w-4xl w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
