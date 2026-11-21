"use client";

import { useEffect, useState } from "react";
import { Decision } from "@/lib/types";
import { getDecisions } from "@/lib/api";
import {
  Search,
  Calendar,
  User,
  Loader2,
  BookOpen,
  Database,
  CheckCircle2,
  AlertOctagon,
} from "lucide-react";

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
    } catch {
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
    <div className="space-y-8 pb-12">
      {/* Editorial Header */}
      <div className="space-y-3 border-b border-[#E4DCCF] pb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE2D2] border border-[#DDD3BF] text-[11px] font-mono uppercase tracking-wider text-[#735A43] font-semibold">
          <Database className="w-3.5 h-3.5 text-[#D97757]" />
          <span>Persistent Memory Ledger</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1F1E1B] font-normal tracking-tight">
            Decision Memory Log
          </h1>
          <span className="text-xs font-mono text-[#736B5E] bg-[#EAE2D2] px-3 py-1 rounded-lg border border-[#DDD3BF]">
            {decisions.length} recorded agreements
          </span>
        </div>
        <p className="text-sm text-[#615C52] max-w-xl">
          A persistent chronological archive of team consensus, active commitments, and superseded decisions across all meetings.
        </p>
      </div>

      {/* Search and Filters Pastel Panel */}
      <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E5DDD0] flex flex-col sm:flex-row gap-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-[#9E9585] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decisions semantically (e.g. 'launch date', 'pricing', 'Arjun')..."
            className="w-full pl-10 pr-20 py-2 text-sm bg-[#FAF7F0] border border-[#DDD4C3] rounded-xl text-[#1F1E1B] placeholder-[#A39B8B] focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]/30 transition-colors font-sans"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1 px-3 py-1 text-xs rounded-lg bg-white border border-[#DDD4C3] font-medium text-[#1F1E1B] hover:bg-[#FAF6EE] cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center p-1 bg-[#EBE4D5] rounded-xl text-xs font-sans">
          {["all", "active", "superseded"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-[#FFFDF9] text-[#1F1E1B] font-semibold shadow-xs"
                  : "text-[#6B6354] hover:text-[#1F1E1B]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Content Feed */}
      {isLoading ? (
        <div className="py-20 text-center space-y-2">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#D97757]" />
          <p className="text-xs text-[#736B5E] font-mono">Querying vector memory...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-[#FDF1EC] border border-[#F5D2C4] text-xs text-[#B93828]">
          {error}
        </div>
      ) : decisions.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#F9F5EC] border border-[#E8DFC9] p-8 space-y-2">
          <BookOpen className="w-6 h-6 mx-auto text-[#9E9585]" />
          <h3 className="font-serif text-base text-[#1F1E1B]">No decisions recorded yet</h3>
          <p className="text-xs text-[#736B5E] max-w-sm mx-auto">
            Ingest and approve a meeting transcript from the home screen to populate cross-meeting memory.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map((dec) => {
            const isActive = dec.status === "active";
            return (
              <div
                key={dec.id}
                className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isActive
                    ? "bg-[#FFFDF9] border-[#E5DDD0] hover:border-[#D5CBB9]"
                    : "bg-[#F7F2E8] border-[#E8DFC9] opacity-75"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <p
                      className={`font-serif text-base ${
                        isActive ? "text-[#1F1E1B]" : "line-through text-[#7A7162]"
                      }`}
                    >
                      {dec.text}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#736B5E]">
                      <span className="flex items-center gap-1.5 text-[#4F473B]">
                        <User className="w-3.5 h-3.5 text-[#9E9585]" />
                        {dec.owner || "Unassigned"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#9E9585]" />
                        {dec.date || "Unknown date"}
                      </span>
                      {dec.meeting_title && (
                        <span>
                          Origin: <strong className="text-[#4F473B]">{dec.meeting_title}</strong>
                        </span>
                      )}
                      {dec.source_line && (
                        <span>Line #{dec.source_line}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-sans font-semibold bg-[#EFF5F0] text-[#2D5A43] border border-[#D5E6D8]">
                        <CheckCircle2 className="w-3 h-3" />
                        Active consensus
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-sans font-semibold bg-[#FDF1EB] text-[#B93828] border border-[#F4D5C7]">
                        <AlertOctagon className="w-3 h-3" />
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
