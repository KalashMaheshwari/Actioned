"use client";

import { useEffect, useState } from "react";
import { PersonDigestResponse } from "@/lib/types";
import { getPersonDigest } from "@/lib/api";
import { Users, Calendar, CheckSquare, Sparkles, Loader2, User } from "lucide-react";

const TEAM_MEMBERS = ["Arjun", "Priya", "Rahul", "Neha"];

export default function DigestPage() {
  const [selectedPerson, setSelectedPerson] = useState("Arjun");
  const [digest, setDigest] = useState<PersonDigestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDigest = async (person: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPersonDigest(person);
      setDigest(data);
    } catch (err: any) {
      setError(`Failed to load digest for ${person}.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDigest(selectedPerson);
  }, [selectedPerson]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Weekly Person Digest
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Open items, upcoming deadlines, and decisions affecting each team member.
          </p>
        </div>
      </div>

      {/* Team Member Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        {TEAM_MEMBERS.map((member) => (
          <button
            key={member}
            onClick={() => setSelectedPerson(member)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              selectedPerson === member
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            {member}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-16 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Compiling digest for {selectedPerson}...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      ) : digest ? (
        <div className="space-y-6">
          {/* AI Executive Summary */}
          {digest.summary && (
            <div className="p-5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                AI Executive Digest
              </div>
              <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                {digest.summary}
              </p>
            </div>
          )}

          {/* Open Action Items */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                Open Action Items ({digest.open_action_items.length})
              </h2>
            </div>

            {digest.open_action_items.length === 0 ? (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
                No active tasks assigned to {selectedPerson}.
              </p>
            ) : (
              <div className="space-y-2.5">
                {digest.open_action_items.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {act.text}
                      </p>
                      {act.tracker_task_id && (
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                          Trello: {act.tracker_task_id}
                        </span>
                      )}
                    </div>
                    {act.deadline && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        <Calendar className="w-3 h-3 text-zinc-600" />
                        Due {act.deadline}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Decisions Affecting Person */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Active Decisions Owned by {selectedPerson} ({digest.decisions_affecting_person.length})
            </h2>

            {digest.decisions_affecting_person.length === 0 ? (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
                No active decisions currently owned by {selectedPerson}.
              </p>
            ) : (
              <div className="space-y-2.5">
                {digest.decisions_affecting_person.map((dec) => (
                  <div
                    key={dec.id}
                    className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4"
                  >
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {dec.text}
                    </p>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      {dec.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
