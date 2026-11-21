"use client";

import { useEffect, useState } from "react";
import { Decision } from "@/lib/types";
import { getDecisions } from "@/lib/api";
import { BookOpen, Search, Filter, Calendar, User, CheckCircle2, AlertOctagon, Loader2 } from "lucide-react";

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDecisions = async (query?: string, status?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const filter = status === "all" ? undefined : status;
      const data = await getDecisions(filter, query || undefined);
      setDecisions(data);
    } catch (err: any) {
      setError("Failed to fetch decisions log. Ensure the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions(searchQuery, statusFilter);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDecisions(searchQuery, statusFilter);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Decision Memory Log
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Persistent, searchable log of every decision agreed upon across all meetings.
          </p>
        </div>
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          {decisions.length} decisions recorded
        </span>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-zinc-600 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decisions semantically (e.g. 'launch date', 'tailwind', 'pricing')..."
            className="w-full pl-9 pr-24 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
          {["all", "active", "superseded"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-16 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Querying ChromaDB vector memory...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      ) : decisions.length === 0 ? (
        <div className="py-16 text-center border rounded-xl border-dashed border-zinc-300 dark:border-zinc-800 p-8 space-y-3">
          <BookOpen className="w-8 h-8 mx-auto text-zinc-600" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">No decisions found</h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
            Ingest and approve a meeting transcript from the home screen to start populating Actioned's cross-meeting memory.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map((dec) => {
            const isActive = dec.status === "active";
            return (
              <div
                key={dec.id}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <p className={`text-base font-semibold ${isActive ? "text-zinc-900 dark:text-zinc-100" : "line-through text-zinc-600 dark:text-zinc-400"}`}>
                      {dec.text}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {dec.owner || "Unassigned"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {dec.date || "Unknown date"}
                      </span>
                      {dec.meeting_title && (
                        <span>From: <strong>{dec.meeting_title}</strong></span>
                      )}
                      {dec.source_line && (
                        <span>Line #{dec.source_line}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        Superseded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
