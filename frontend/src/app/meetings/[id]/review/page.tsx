"use client";

import { useEffect, useState, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  MeetingIngestionResponse,
  ExtractedDecision,
  ExtractedActionItem,
  DetectedConflict,
} from "@/lib/types";
import { approveMeeting } from "@/lib/api";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Calendar,
  User,
  ArrowLeft,
  Loader2,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
} from "lucide-react";

function ReviewContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const meetingId = parseInt(resolvedParams.id, 10);

  const [data, setData] = useState<MeetingIngestionResponse | null>(null);
  const [meetingMeta, setMeetingMeta] = useState<{ title: string; date: string } | null>(null);

  // Selection states
  const [approvedDecisions, setApprovedDecisions] = useState<Set<string>>(new Set());
  const [approvedActions, setApprovedActions] = useState<Set<string>>(new Set());
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, "supersede" | "dismiss">>({});

  // Inline edits state
  const [edits, setEdits] = useState<Record<string, any>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commitResult, setCommitResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(`meeting_proposal_${meetingId}`);
      const meta = sessionStorage.getItem(`meeting_meta_${meetingId}`);
      if (stored) {
        const parsed: MeetingIngestionResponse = JSON.parse(stored);
        setData(parsed);
        // Pre-select all extracted decisions and action items by default
        setApprovedDecisions(new Set(parsed.decisions.map((d) => d.id)));
        setApprovedActions(new Set(parsed.action_items.map((a) => a.id)));

        // Default all detected conflicts to supersede
        const initialResolutions: Record<string, "supersede" | "dismiss"> = {};
        parsed.conflicts.forEach((c) => {
          initialResolutions[String(c.old_decision.id)] = "supersede";
        });
        setConflictResolutions(initialResolutions);
      }
      if (meta) {
        setMeetingMeta(JSON.parse(meta));
      }
    }
  }, [meetingId]);

  if (!data) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D97757]" />
        <p className="text-xs text-[#736B5E] font-sans">Retrieving meeting proposal...</p>
        <button
          onClick={() => router.push("/")}
          className="text-xs font-medium text-[#D97757] hover:underline cursor-pointer"
        >
          ← Return to Ingest Console
        </button>
      </div>
    );
  }

  const toggleDecision = (id: string) => {
    setApprovedDecisions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAction = (id: string) => {
    setApprovedActions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEditChange = (id: string, field: string, val: any) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: val,
      },
    }));
  };

  const handleCommit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        approved_decision_ids: Array.from(approvedDecisions),
        approved_action_item_ids: Array.from(approvedActions),
        edits,
        conflict_resolutions: conflictResolutions,
      };

      const res = await approveMeeting(meetingId, payload);
      setCommitResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to commit approved items.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 pb-28">
      {/* Editorial Header */}
      <div className="space-y-2 border-b border-[#E4DCCF] pb-5">
        <button
          onClick={() => router.push("/")}
          className="text-xs font-mono text-[#736B5E] hover:text-[#1F1E1B] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Ingestion</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1F1E1B] font-normal tracking-tight">
            Meeting Docket: {meetingMeta?.title || `Meeting #${meetingId}`}
          </h1>
          <div className="text-xs font-mono text-[#827869]">
            Recorded {meetingMeta?.date || "Current"} • Executive Authorization Gate
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#FDF1EC] border border-[#F5D2C4] text-xs text-[#B93828] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Commit Banner in Soft Sage Pastel */}
      {commitResult && (
        <div className="p-6 rounded-2xl bg-[#EEF5F0] border border-[#D3E5D7] space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-[#2D5A43] font-serif text-lg font-medium">
            <CheckCircle2 className="w-5 h-5 text-[#2D5A43]" />
            <span>Authorized & Committed to Permanent Memory</span>
          </div>
          <p className="text-xs text-[#43634F] leading-relaxed max-w-2xl">
            Decisions have been indexed into the vector memory archive. Tasks have been created in Trello, and pre-deadline Slack notifications have been scheduled.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => router.push("/decisions")}
              className="btn-terracotta px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>View Decision Memory Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => router.push("/digest")}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-white border border-[#D5E6D8] text-[#2D5A43] hover:bg-[#E6F0E8] cursor-pointer transition-colors shadow-xs"
            >
              View Team Digest
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: CONFLICT MEMORANDUM IN RICH PASTEL TERRACOTTA */}
      {data.conflicts.length > 0 && (
        <div className="rounded-2xl p-6 space-y-4 bg-[#FDF1EB] border border-[#F4D5C7] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#B93828] font-serif text-lg">
              <AlertCircle className="w-5 h-5 text-[#B93828]" />
              <span>Contradiction with Historical Consensus ({data.conflicts.length})</span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#B93828] bg-[#FBE2D8] px-2.5 py-0.5 rounded-full font-bold">
              Consensus Contradiction
            </span>
          </div>

          <p className="text-xs text-[#7A4B3C] leading-relaxed">
            Persistent memory detected that a new agreement contradicts a decision previously approved by the team. Please determine how memory should resolve this conflict.
          </p>

          <div className="space-y-4 pt-1">
            {data.conflicts.map((conf, idx) => {
              const oldId = String(conf.old_decision.id);
              const currentRes = conflictResolutions[oldId] || "supersede";
              const newDecisionObj = data.decisions.find((d) => d.id === conf.new_decision_id);

              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-[#F2C9B7] p-5 space-y-4 shadow-xs"
                >
                  {/* Side-by-Side Contradiction Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Earlier Consensus - Pastel Sage Container */}
                    <div className="p-4 rounded-xl bg-[#F0F5F1] border border-[#D8E8DC] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#637E6B]">
                        <span className="font-semibold">RECORDED IN MEMORY</span>
                        <span className="text-[#2D5A43] font-bold">Active Consensus</span>
                      </div>
                      <p className="font-serif text-base text-[#1F1E1B]">
                        "{conf.old_decision.text}"
                      </p>
                      <div className="text-[11px] font-mono text-[#708877] pt-1">
                        Origin: {conf.old_decision.meeting_title} ({conf.old_decision.date})
                        {conf.old_decision.owner && ` • Owner: ${conf.old_decision.owner}`}
                      </div>
                    </div>

                    {/* Newly Proposed - Pastel Peach Container */}
                    <div className="p-4 rounded-xl bg-[#FFF6F2] border border-[#F6D7CB] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#B93828]">
                        <span className="font-semibold">INCOMING PROPOSAL</span>
                        <span className="font-bold">Pending Ratification</span>
                      </div>
                      <p className="font-serif text-base text-[#1F1E1B]">
                        "{newDecisionObj?.text || "New Decision"}"
                      </p>
                      <div className="text-[11px] font-mono text-[#9E6050] pt-1">
                        From current meeting transcript
                      </div>
                    </div>
                  </div>

                  {/* Contradiction Analysis */}
                  <div className="text-xs text-[#6B4B42] bg-[#FAF3EE] p-3.5 rounded-lg border border-[#F4DDD2] leading-relaxed">
                    <span className="font-semibold text-[#B93828]">Contradiction reason: </span>
                    {conf.reason}
                  </div>

                  {/* Resolution Choice */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#F7E5DE]">
                    <span className="text-xs text-[#736B5E] font-medium">Memory resolution upon confirmation:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setConflictResolutions((prev) => ({ ...prev, [oldId]: "supersede" }))
                        }
                        className={`px-3.5 py-1.5 text-xs rounded-lg font-sans transition-all cursor-pointer ${
                          currentRes === "supersede"
                            ? "bg-[#D97757] text-white font-medium shadow-xs"
                            : "bg-[#FAF7F0] border border-[#DDD4C3] text-[#544D41] hover:bg-[#F2ECE0]"
                        }`}
                      >
                        Supersede previous decision
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setConflictResolutions((prev) => ({ ...prev, [oldId]: "dismiss" }))
                        }
                        className={`px-3.5 py-1.5 text-xs rounded-lg font-sans transition-all cursor-pointer ${
                          currentRes === "dismiss"
                            ? "bg-[#1F1E1B] text-white font-medium shadow-xs"
                            : "bg-[#FAF7F0] border border-[#DDD4C3] text-[#544D41] hover:bg-[#F2ECE0]"
                        }`}
                      >
                        Keep both decisions
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: EXTRACTED DECISIONS IN PASTEL SAGE PANEL */}
      <div className="rounded-2xl p-6 space-y-4 bg-[#F2F7F4] border border-[#D7E8DC] shadow-xs">
        <div className="flex items-baseline justify-between border-b border-[#D8EADE] pb-3">
          <div>
            <h2 className="font-serif text-xl text-[#1F1E1B]">
              Decisions for Ratification ({data.decisions.length})
            </h2>
            <p className="text-xs text-[#526D59] mt-0.5">
              Approved items are written to the permanent cross-meeting memory vector log.
            </p>
          </div>
          <span className="text-xs font-mono text-[#526D59] font-medium">
            {approvedDecisions.size} of {data.decisions.length} selected
          </span>
        </div>

        <div className="space-y-3">
          {data.decisions.map((dec) => {
            const isApproved = approvedDecisions.has(dec.id);
            const currentText = edits[dec.id]?.text ?? dec.text;
            const currentOwner = edits[dec.id]?.owner ?? (dec.owner || "");

            return (
              <div
                key={dec.id}
                className={`p-4 rounded-xl border transition-all ${
                  isApproved
                    ? "bg-white border-[#C9DFD0] shadow-xs"
                    : "bg-[#F7FAF8] border-[#DFEBE2] opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isApproved}
                    onChange={() => toggleDecision(dec.id)}
                    className="mt-1 h-4 w-4 rounded border-[#BBD5C4] text-[#D97757] focus:ring-[#D97757]/30 cursor-pointer"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={currentText}
                      onChange={(e) => handleEditChange(dec.id, "text", e.target.value)}
                      className="w-full font-serif text-base text-[#1F1E1B] bg-transparent border-b border-transparent hover:border-[#D5E6D8] focus:border-[#D97757] focus:outline-none py-0.5"
                    />

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#637E6B]">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#88A691]" />
                        <input
                          type="text"
                          placeholder="Owner (optional)"
                          value={currentOwner}
                          onChange={(e) => handleEditChange(dec.id, "owner", e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-[#D5E6D8] focus:border-[#D97757] focus:outline-none text-xs w-28 text-[#1F1E1B]"
                        />
                      </div>
                      <span>Line #{dec.source_line}</span>
                      <span className="text-[#2D5A43] font-semibold">
                        {(dec.confidence * 100).toFixed(0)}% extraction confidence
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: EXTRACTED ACTION ITEMS IN PASTEL BLUE/IRIS PANEL */}
      <div className="rounded-2xl p-6 space-y-4 bg-[#F1F5FB] border border-[#D5E3F5] shadow-xs">
        <div className="flex items-baseline justify-between border-b border-[#D8E6F7] pb-3">
          <div>
            <h2 className="font-serif text-xl text-[#1F1E1B]">
              Action Items & Tracker Dispatch ({data.action_items.length})
            </h2>
            <p className="text-xs text-[#526B85] mt-0.5">
              Authorized items are created in Trello and scheduled for 24h deadline reminders.
            </p>
          </div>
          <span className="text-xs font-mono text-[#526B85] font-medium">
            {approvedActions.size} of {data.action_items.length} selected
          </span>
        </div>

        <div className="space-y-3">
          {data.action_items.map((act) => {
            const isApproved = approvedActions.has(act.id);
            const currentText = edits[act.id]?.text ?? act.text;
            const currentOwner = edits[act.id]?.owner ?? (act.owner || "");
            const currentDeadline = edits[act.id]?.deadline ?? (act.deadline || "");

            return (
              <div
                key={act.id}
                className={`p-4 rounded-xl border transition-all ${
                  isApproved
                    ? "bg-white border-[#C9DBEE] shadow-xs"
                    : "bg-[#F7FAFD] border-[#DEEAF7] opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isApproved}
                    onChange={() => toggleAction(act.id)}
                    className="mt-1 h-4 w-4 rounded border-[#BACFE6] text-[#D97757] focus:ring-[#D97757]/30 cursor-pointer"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={currentText}
                      onChange={(e) => handleEditChange(act.id, "text", e.target.value)}
                      className="w-full font-serif text-base text-[#1F1E1B] bg-transparent border-b border-transparent hover:border-[#D5E2F0] focus:border-[#D97757] focus:outline-none py-0.5"
                    />

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#526B85]">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#88A2BC]" />
                        <input
                          type="text"
                          placeholder="Assignee (e.g. Rahul)"
                          value={currentOwner}
                          onChange={(e) => handleEditChange(act.id, "owner", e.target.value)}
                          className={`bg-transparent border-b hover:border-[#D5E2F0] focus:border-[#D97757] focus:outline-none text-xs w-32 ${
                            !currentOwner ? "border-[#D97757] text-[#B93828]" : "border-transparent text-[#1F1E1B]"
                          }`}
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#88A2BC]" />
                        <input
                          type="date"
                          value={currentDeadline}
                          onChange={(e) => handleEditChange(act.id, "deadline", e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-[#D5E2F0] focus:border-[#D97757] focus:outline-none text-xs text-[#1F1E1B]"
                        />
                      </div>

                      <span>Line #{act.source_line}</span>
                      <span className="text-[#2C5278] font-semibold">
                        {(act.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Docket Bar in Pastel Cream Butter */}
      {!commitResult && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-40">
          <div className="p-3.5 rounded-2xl bg-[#FFFDF8]/95 backdrop-blur-md shadow-lg border border-[#D5CBB9] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[#615A4C] font-sans">
              Authorizing <strong>{approvedDecisions.size}</strong> decisions and <strong>{approvedActions.size}</strong> tracker tasks
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#FAF6EE] border border-[#DDD4C3] text-[#736B5E] hover:text-[#1F1E1B] cursor-pointer"
              >
                Discard
              </button>

              <button
                type="button"
                onClick={handleCommit}
                disabled={isSubmitting}
                className="btn-terracotta px-5 py-2 text-xs flex items-center gap-2 flex-1 sm:flex-initial justify-center cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Committing to memory...</span>
                  </>
                ) : (
                  <>
                    <span>Authorize & Commit to Memory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs text-[#736B5E] font-mono">
          Loading meeting docket...
        </div>
      }
    >
      <ReviewContent {...props} />
    </Suspense>
  );
}
