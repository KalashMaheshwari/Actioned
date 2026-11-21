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
  Briefcase,
  Users,
  Sparkles,
} from "lucide-react";

interface MemberProfile {
  name: string;
  role: string;
  pastelBg: string;
  pastelBorder: string;
  textColor: string;
}

const TEAM_MEMBERS: MemberProfile[] = [
  {
    name: "Arjun",
    role: "Backend Architecture",
    pastelBg: "bg-[#EFF5F0]",
    pastelBorder: "border-[#D5E6D8]",
    textColor: "text-[#2D5A43]",
  },
  {
    name: "Priya",
    role: "Frontend & Design",
    pastelBg: "bg-[#F2EFF8]",
    pastelBorder: "border-[#DCD3EB]",
    textColor: "text-[#543E78]",
  },
  {
    name: "Rahul",
    role: "Product Strategy",
    pastelBg: "bg-[#FDF3EA]",
    pastelBorder: "border-[#F4DFC8]",
    textColor: "text-[#854E18]",
  },
  {
    name: "Neha",
    role: "QA & Reliability",
    pastelBg: "bg-[#EEF4F7]",
    pastelBorder: "border-[#D3E3EC]",
    textColor: "text-[#2D5B73]",
  },
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

  const currentProfile = TEAM_MEMBERS.find((m) => m.name === selectedPerson) || TEAM_MEMBERS[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Editorial Header */}
      <div className="space-y-3 border-b border-[#E4DCCF] pb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE2D2] border border-[#DDD3BF] text-[11px] font-mono uppercase tracking-wider text-[#735A43] font-semibold">
          <Users className="w-3.5 h-3.5 text-[#D97757]" />
          <span>Team Synchronization & Weekly Digest</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1F1E1B] font-normal tracking-tight">
            Weekly Executive Digest
          </h1>
          <span className="text-xs font-mono text-[#736B5E] bg-[#EAE2D2] px-3 py-1 rounded-lg border border-[#DDD3BF]">
            Personal Dossier
          </span>
        </div>
        <p className="text-sm text-[#615C52] max-w-xl">
          An automated synthesis of open deliverables, upcoming deadlines, and active cross-meeting consensus affecting each team member.
        </p>
      </div>

      {/* Member Selector Cards with Distinct Pastel Colors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TEAM_MEMBERS.map((member) => {
          const isSelected = selectedPerson === member.name;
          return (
            <button
              key={member.name}
              type="button"
              onClick={() => setSelectedPerson(member.name)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
                member.pastelBg
              } ${member.pastelBorder} ${
                isSelected
                  ? "ring-2 ring-[#D97757] shadow-sm"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-serif text-base font-medium ${member.textColor}`}>
                  {member.name}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-[#D97757]" />
                )}
              </div>
              <span className="text-[11px] font-mono text-[#6B6354] block mt-0.5">
                {member.role}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20 text-center space-y-2">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#D97757]" />
          <p className="text-xs text-[#736B5E] font-mono">Compiling digest for {selectedPerson}...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-[#FDF1EC] border border-[#F5D2C4] text-xs text-[#B93828]">
          {error}
        </div>
      ) : digest ? (
        <div className="space-y-6">
          {/* AI Executive Summary Card in Warm Butter Pastel */}
          {digest.summary && (
            <div className="p-6 rounded-2xl bg-[#FCF9EE] border-l-4 border-l-[#D97757] border border-[#EFE5CB] space-y-2 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#D97757] font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Executive Synthesis • {selectedPerson}'s Scope</span>
              </div>
              <p className="font-serif text-base sm:text-lg text-[#1F1E1B] leading-relaxed italic">
                "{digest.summary}"
              </p>
              <div className="text-xs text-[#736B5E] font-mono pt-1">
                {digest.open_action_items.length} open deliverables • {digest.decisions_affecting_person.length} decisions owned
              </div>
            </div>
          )}

          {/* Open Action Items in Pastel Blue Panel */}
          <div className="p-6 rounded-2xl bg-[#F1F5FB] border border-[#D5E3F5] space-y-4 shadow-xs">
            <div className="flex items-baseline justify-between border-b border-[#D8E6F7] pb-3">
              <div>
                <h2 className="font-serif text-xl text-[#1F1E1B]">
                  Open Action Items ({digest.open_action_items.length})
                </h2>
                <p className="text-xs text-[#526B85] mt-0.5">
                  Synchronized with Trello. Automated Slack reminders armed for 24h before deadline.
                </p>
              </div>
            </div>

            {digest.open_action_items.length === 0 ? (
              <p className="text-xs text-[#6B7D94] italic py-4 text-center">
                No active tasks assigned to {selectedPerson}.
              </p>
            ) : (
              <div className="space-y-3">
                {digest.open_action_items.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-xl bg-white border border-[#D5E2F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1 flex-1">
                      <p className="font-serif text-base text-[#1F1E1B]">
                        {act.text}
                      </p>
                      <div className="flex items-center gap-3 text-xs font-mono text-[#526B85]">
                        {act.tracker_task_id && (
                          <span>
                            Trello Card: #{act.tracker_task_id}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[#6B84A0]">
                          <Bell className="w-3 h-3 text-[#526B85]" />
                          24h pre-deadline alert scheduled
                        </span>
                      </div>
                    </div>

                    {act.deadline && (
                      <div className="shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF6EE] border border-[#D5E2F0] text-xs font-mono text-[#2C5278] font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#526B85]" />
                          Due {act.deadline}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Decisions Owned in Pastel Sage Panel */}
          <div className="p-6 rounded-2xl bg-[#F2F7F4] border border-[#D7E8DC] space-y-4 shadow-xs">
            <div className="border-b border-[#D8EADE] pb-3">
              <h2 className="font-serif text-xl text-[#1F1E1B]">
                Active Decisions Owned by {selectedPerson} ({digest.decisions_affecting_person.length})
              </h2>
              <p className="text-xs text-[#526D59] mt-0.5">
                Consensus recorded in permanent memory where {selectedPerson} is the designated owner.
              </p>
            </div>

            {digest.decisions_affecting_person.length === 0 ? (
              <p className="text-xs text-[#63806B] italic py-4 text-center">
                No active decisions currently attributed to {selectedPerson}.
              </p>
            ) : (
              <div className="space-y-3">
                {digest.decisions_affecting_person.map((dec) => (
                  <div
                    key={dec.id}
                    className="p-4 rounded-xl bg-white border border-[#D2E4D7] flex items-center justify-between gap-4 shadow-xs"
                  >
                    <p className="font-serif text-base text-[#1F1E1B]">
                      {dec.text}
                    </p>
                    <span className="text-xs font-mono text-[#526D59] shrink-0 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#88A691]" />
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
