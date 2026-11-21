"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_MEETINGS } from "@/lib/mockData";
import { ingestMeeting } from "@/lib/api";
import { Sparkles, FileText, Calendar, ArrowRight, Play, Loader2 } from "lucide-react";

export default function IngestPage() {
  const router = useRouter();
  const [title, setTitle] = useState("Kickoff Meeting");
  const [date, setDate] = useState("2026-10-03");
  const [format, setFormat] = useState<"txt" | "vtt">("txt");
  const [transcript, setTranscript] = useState(DEMO_MEETINGS.meeting1.transcript);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreset = (key: keyof typeof DEMO_MEETINGS) => {
    const preset = DEMO_MEETINGS[key];
    setTitle(preset.title);
    setDate(preset.date);
    setFormat(preset.format);
    setTranscript(preset.transcript);
    setError(null);
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) {
      setError("Please provide a transcript to analyze.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await ingestMeeting({
        title,
        date,
        transcript,
        format,
      });

      // Save staged response to sessionStorage for review screen
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`meeting_proposal_${response.meeting_id}`, JSON.stringify(response));
        sessionStorage.setItem(`meeting_meta_${response.meeting_id}`, JSON.stringify({ title, date }));
      }

      router.push(`/meetings/${response.meeting_id}/review`);
    } catch (err: any) {
      setError(err.message || "Failed to analyze transcript. Ensure the backend API is running.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          Cross-Meeting Decision Engine
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Meetings that remember what they decided.
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Extract decisions & tasks, track owners and deadlines, and automatically detect when a new decision contradicts past commitments.
        </p>
      </div>

      {/* Demo preset loaders */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Quick Demo Scenarios (1-Click Load)
          </span>
          <span className="text-xs text-zinc-600 dark:text-zinc-400">Try Meeting 1 then Meeting 3 for conflict detection</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(DEMO_MEETINGS).map(([key, item], idx) => (
            <button
              key={key}
              type="button"
              onClick={() => loadPreset(key as any)}
              className="flex flex-col text-left p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group"
            >
              <div className="flex items-center justify-between font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                <span>{item.title}</span>
                <Play className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                {item.description}
              </p>
              <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-400 mt-2">
                {item.date}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ingestion form */}
      <form onSubmit={handleIngest} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Meeting Title
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-zinc-600 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q4 Roadmap Kickoff"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Meeting Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-zinc-600 absolute left-3 top-3" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Meeting Transcript
            </label>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">Format:</span>
              <button
                type="button"
                onClick={() => setFormat("txt")}
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  format === "txt"
                    ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                Plain Text
              </button>
              <button
                type="button"
                onClick={() => setFormat("vtt")}
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  format === "vtt"
                    ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                Zoom/Meet VTT
              </button>
            </div>
          </div>
          <textarea
            rows={9}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste transcript with speaker attribution e.g.&#10;Arjun: We decided launch is April 2.&#10;Neha: I'll complete the spec by Friday."
            className="w-full p-3 font-mono text-xs sm:text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing & Checking Conflicts...
              </>
            ) : (
              <>
                Analyze & Extract
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
