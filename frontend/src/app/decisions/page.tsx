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
      {/* Header */}
      <div className="space-y-2 pb-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Decision Memory
        </h1>
        <p className="text-sm text-[#9FA4B2]">
          Persistent archive of all verified team consensus across meetings.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-[#6B707F] absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decisions semantically (e.g. 'launch date', 'pricing', 'Arjun')..."
            className="w-full pl-11 pr-24 py-3 text-sm bg-[#15161C] rounded-2xl text-white placeholder-[#6B707F] border-none focus:outline-none focus:ring-2 focus:ring-[#D47255]"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 px-4 py-1.5 text-xs font-bold rounded-xl bg-[#D47255] text-[#2A140E] hover:opacity-90 cursor-pointer border-none"
          >
            Search
          </button>
        </form>

        <div className="flex items-center p-1 bg-[#15161C] rounded-2xl text-xs font-sans">
          {["all", "active", "superseded"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl capitalize transition-colors cursor-pointer border-none ${
                statusFilter === st
                  ? "bg-[#D47255] text-[#2A140E] font-bold shadow-md"
                  : "text-[#858997] hover:text-white"
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
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D47255]" />
          <p className="text-xs text-[#858997] font-mono">Querying ChromaDB vector memory...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-[#D47255] text-[#2A140E] text-xs font-bold border-none">
          {error}
        </div>
      ) : decisions.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-[#15161C] p-8 space-y-2 border-none">
          <BookOpen className="w-8 h-8 mx-auto text-[#6B707F]" />
          <h3 className="font-bold text-base text-white">No decisions recorded yet</h3>
          <p className="text-xs text-[#858997] max-w-sm mx-auto">
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
                className={`p-5 rounded-2xl transition-all border-none shadow-sm ${
                  isActive ? "bg-[#15161C]" : "bg-[#121318] opacity-60"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <p
                      className={`text-base font-semibold ${
                        isActive ? "text-white" : "line-through text-[#858997]"
                      }`}
                    >
                      {dec.text}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#858997]">
                      <span className="flex items-center gap-1.5 text-white">
                        <User className="w-3.5 h-3.5 text-[#D47255]" />
                        {dec.owner || "Unassigned"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#6B707F]" />
                        {dec.date || "Unknown date"}
                      </span>
                      {dec.meeting_title && (
                        <span>
                          Origin: <strong className="text-white">{dec.meeting_title}</strong>
                        </span>
                      )}
                      {dec.source_line && (
                        <span>Line #{dec.source_line}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    {isActive ? (
                      <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-[#D47255] text-[#2A140E] border-none shadow-sm">
                        ACTIVE CONSENSUS
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-xl text-xs font-semibold bg-[#242632] text-[#858997] border-none">
                        SUPERSEDED
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
