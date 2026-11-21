import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, Newsreader, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Actioned — Meetings That Remember What They Decided",
  description:
    "An autonomous meeting-to-execution agent with cross-meeting memory and conflict detection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-[#F5F0E6] text-[#1F1E1B] flex flex-col font-sans antialiased selection:bg-[#D97757]/20 selection:text-[#9A3816]"
        suppressHydrationWarning
      >
        <div className="flex flex-col min-h-screen">
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
          <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
