"use client";

import { useEffect, useState } from "react";
import { PersonDigestResponse } from "@/lib/types";
import { getPersonDigest } from "@/lib/api";
import {
  Calendar,
  CheckSquare,
  Loader2,
  Clock,
  Bell,
  Sparkles,
} from "lucide-react";

interface MemberProfile {
  name: string;
  role: string;
}

const TEAM_MEMBERS: MemberProfile[] = [
  { name: "Arjun", role: "Backend Architecture" },
  { name: "Priya", role: "Frontend & UI" },
  { name: "Rahul", role: "Product Strategy" },
  { name: "Neha", role: "QA & Reliability" },
];

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
    } catch {
      setError(`Failed to load digest for ${person}.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDigest(selectedPerson);
  }, [selectedPerson]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-2 pb-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Team Digest
        </h1>
        <p className="text-sm text-[#9FA4B2]">
          Personalized briefings, open deliverables, and active decisions per person.
        </p>
      </div>

      {/* Member Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TEAM_MEMBERS.map((member) => {
          const isSelected = selectedPerson === member.name;
          return (
            <button
              key={member.name}
              type="button"
              onClick={() => setSelectedPerson(member.name)}
              className={`p-4 rounded-2xl text-left transition-all cursor-pointer border-none shadow-sm ${
                isSelected
                  ? "bg-[#D47255] text-[#2A140E] shadow-md"
                  : "bg-[#15161C] text-[#858997] hover:text-white hover:bg-[#1A1C24]"
              }`}
            >
              <span className={`block font-extrabold text-base ${isSelected ? "text-[#2A140E]" : "text-white"}`}>
                {member.name}
              </span>
              <span className={`text-xs block mt-0.5 ${isSelected ? "text-[#361A12] font-semibold" : "text-[#858997]"}`}>
                {member.role}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D47255]" />
          <p className="text-xs text-[#858997] font-mono">Compiling digest for {selectedPerson}...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-[#D47255] text-[#2A140E] text-xs font-bold border-none">
          {error}
        </div>
      ) : digest ? (
        <div className="space-y-6">
          {/* AI Executive Briefing in Filled #D47255 Box with Dark Chocolate Brown Text */}
          {digest.summary && (
            <div className="p-6 sm:p-7 rounded-3xl bg-[#D47255] text-[#2A140E] space-y-2 shadow-xl border-none">
              <div className="flex items-center gap-1.5 text-xs font-mono font-extrabold uppercase tracking-wider text-[#2A140E]">
                <Sparkles className="w-4 h-4 text-[#2A140E]" />
                <span>AI Briefing • {selectedPerson}</span>
              </div>
              <p className="text-base sm:text-lg font-bold text-[#2A140E] leading-relaxed">
                "{digest.summary}"
              </p>
              <div className="text-xs font-bold text-[#361A12] pt-1">
                {digest.open_action_items.length} open deliverables • {digest.decisions_affecting_person.length} decisions owned
              </div>
            </div>
          )}

          {/* Open Action Items */}
          <div className="bg-[#15161C] rounded-3xl p-6 sm:p-7 space-y-4 border-none shadow-xl">
            <div className="flex items-baseline justify-between pb-1">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Open Action Items ({digest.open_action_items.length})
                </h2>
                <p className="text-xs text-[#858997] mt-0.5">
                  Synchronized with Trello. Automated Slack reminders armed for 24h before deadline.
                </p>
              </div>
            </div>

            {digest.open_action_items.length === 0 ? (
              <p className="text-xs text-[#858997] italic py-4 text-center">
                No active tasks assigned to {selectedPerson}.
              </p>
            ) : (
              <div className="space-y-3">
                {digest.open_action_items.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-2xl bg-[#1C1E26] flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-none"
                  >
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-semibold text-white">
                        {act.text}
                      </p>
                      <div className="flex items-center gap-3 text-xs font-mono text-[#858997]">
                        {act.tracker_task_id && (
                          <span className="text-[#D47255] font-semibold">
                            Trello Card: #{act.tracker_task_id}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[#858997]">
                          <Bell className="w-3 h-3 text-[#D47255]" />
                          24h alert scheduled
                        </span>
                      </div>
                    </div>

                    {act.deadline && (
                      <div className="shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#242632] text-xs font-mono font-medium text-white border-none">
                          <Clock className="w-3.5 h-3.5 text-[#D47255]" />
                          Due {act.deadline}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Decisions Owned */}
          <div className="bg-[#15161C] rounded-3xl p-6 sm:p-7 space-y-4 border-none shadow-xl">
            <div className="pb-1">
              <h2 className="text-lg font-bold text-white">
                Active Decisions Owned by {selectedPerson} ({digest.decisions_affecting_person.length})
              </h2>
              <p className="text-xs text-[#858997] mt-0.5">
                Consensus recorded in permanent memory where {selectedPerson} is the designated owner.
              </p>
            </div>

            {digest.decisions_affecting_person.length === 0 ? (
              <p className="text-xs text-[#858997] italic py-4 text-center">
                No active decisions currently attributed to {selectedPerson}.
              </p>
            ) : (
              <div className="space-y-3">
                {digest.decisions_affecting_person.map((dec) => (
                  <div
                    key={dec.id}
                    className="p-4 rounded-2xl bg-[#1C1E26] flex items-center justify-between gap-4 border-none"
                  >
                    <p className="text-sm font-semibold text-white">
                      {dec.text}
                    </p>
                    <span className="text-xs font-mono text-[#858997] shrink-0 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#D47255]" />
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
