import type { Metadata } from "next";
import { Suspense } from "react";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Actioned — Autonomous Meeting Agent",
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
      className={`${outfit.variable} ${spaceGrotesk.variable} dark`}
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
          className="flex-1 min-w-0 pl-24 lg:pl-72 pr-4 sm:pr-8 py-8 transition-all duration-300"
        >
          <main suppressHydrationWarning className="max-w-4xl w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
