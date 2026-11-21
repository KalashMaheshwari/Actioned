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
  ShieldAlert,
} from "lucide-react";
import {
  ConflictPrismIcon,
  ChronoGaugeIcon,
} from "@/components/Icons";

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
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D47255]" />
        <p className="text-xs text-[#858997] font-mono">Retrieving meeting proposal...</p>
        <button
          onClick={() => router.push("/")}
          className="text-xs font-bold text-[#D47255] hover:underline cursor-pointer"
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
    <div className="space-y-8 pb-28">
      {/* Header */}
      <div className="space-y-2 pb-2">
        <button
          onClick={() => router.push("/")}
          className="text-xs font-mono text-[#858997] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Ingestion</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1">
          <h1 className="font-claude-heading text-3xl sm:text-4xl font-medium text-white tracking-tight">
            Review: {meetingMeta?.title || `Meeting #${meetingId}`}
          </h1>
          <div className="text-xs font-mono text-[#858997]">
            Date: {meetingMeta?.date || "Current"} • Executive Authorization Gate
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#D47255] text-[#2A140E] text-xs font-bold flex items-center gap-2 border-none">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#2A140E]" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Commit Banner */}
      {commitResult && (
        <div className="p-6 rounded-3xl bg-[#1C1E26] space-y-3 border-none shadow-xl">
          <div className="flex items-center gap-2 text-[#D47255] font-bold text-lg">
            <CheckCircle2 className="w-5 h-5 text-[#D47255]" />
            <span>Authorized & Committed to Permanent Memory</span>
          </div>
          <p className="text-xs text-[#9FA4B2] leading-relaxed max-w-2xl">
            Decisions indexed in ChromaDB vector memory. Deliverables dispatched to Trello (Demo integration), and 24h pre-deadline notifications registered in APScheduler.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => router.push("/decisions")}
              className="px-5 py-2.5 rounded-2xl font-bold text-xs bg-[#D47255] text-[#2A140E] flex items-center gap-2 cursor-pointer border-none shadow-md"
            >
              <span>View Decision Memory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => router.push("/digest")}
              className="px-5 py-2.5 rounded-2xl font-semibold text-xs bg-[#242632] text-white hover:bg-[#2C2E3C] cursor-pointer transition-colors border-none"
            >
              View Team Digest
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: CONFLICT MEMORANDUM BOX (Filled with #D47255, NO BORDER, Dark Chocolate Brown Text) */}
      {data.conflicts.length > 0 && (
        <div className="rounded-3xl p-6 sm:p-7 space-y-5 bg-[#D47255] text-[#2A140E] shadow-2xl border-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-extrabold text-xl">
              <ConflictPrismIcon className="w-6 h-6 text-[#2A140E]" />
              <span>Consensus Contradiction Detected ({data.conflicts.length})</span>
            </div>
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-[#2A140E]">
              Conflict Alert
            </span>
          </div>

          <p className="text-xs text-[#361A12] leading-relaxed font-medium">
            Actioned identified that a newly proposed agreement contradicts an earlier decision stored in persistent memory.
          </p>

          <div className="space-y-4 pt-1">
            {data.conflicts.map((conf, idx) => {
              const oldId = String(conf.old_decision.id);
              const currentRes = conflictResolutions[oldId] || "supersede";
              const newDecisionObj = data.decisions.find((d) => d.id === conf.new_decision_id);

              return (
                <div
                  key={idx}
                  className="bg-[#2A140E] text-white rounded-2xl p-5 space-y-4 border-none shadow-md"
                >
                  {/* Side-by-Side Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Earlier Decision */}
                    <div className="p-4 rounded-xl bg-[#1C1E26] space-y-1.5 border-none">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#858997]">
                        <span>HISTORICAL MEMORY</span>
                        <span className="text-[#D47255] font-bold">Active Consensus</span>
                      </div>
                      <p className="text-sm font-bold text-white">
                        "{conf.old_decision.text}"
                      </p>
                      <div className="text-[11px] font-mono text-[#858997] pt-1">
                        Origin: {conf.old_decision.meeting_title} ({conf.old_decision.date})
                      </div>
                    </div>

                    {/* Proposed Revision */}
                    <div className="p-4 rounded-xl bg-[#1C1E26] space-y-1.5 border-none">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#D47255]">
                        <span className="font-bold">INCOMING PROPOSAL</span>
                        <span>Pending Approval</span>
                      </div>
                      <p className="text-sm font-bold text-white">
                        "{newDecisionObj?.text || "New Decision"}"
                      </p>
                      <div className="text-[11px] font-mono text-[#858997] pt-1">
                        From current meeting transcript
                      </div>
                    </div>
                  </div>

                  {/* Contradiction Analysis */}
                  <div className="text-xs text-[#D0D3DC] bg-[#16171D] p-3.5 rounded-xl border-none leading-relaxed">
                    <span className="font-bold text-[#D47255]">Contradiction Reason: </span>
                    {conf.reason}
                  </div>

                  {/* Resolution Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#383A48]">
                    <span className="text-xs text-[#858997]">Resolution:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setConflictResolutions((prev) => ({ ...prev, [oldId]: "supersede" }))
                        }
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none ${
                          currentRes === "supersede"
                            ? "bg-[#D47255] text-[#2A140E] shadow-md"
                            : "bg-[#1C1E26] text-[#858997] hover:text-white"
                        }`}
                      >
                        Supersede previous decision
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setConflictResolutions((prev) => ({ ...prev, [oldId]: "dismiss" }))
                        }
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none ${
                          currentRes === "dismiss"
                            ? "bg-[#D47255] text-[#2A140E] shadow-md"
                            : "bg-[#1C1E26] text-[#858997] hover:text-white"
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

      {/* SECTION 2: EXTRACTED DECISIONS */}
      <div className="bg-[#15161C] rounded-3xl p-6 sm:p-7 space-y-4 border-none shadow-xl">
        <div className="flex items-baseline justify-between border-b border-[#1E2028] pb-3">
          <div>
            <h2 className="text-lg font-bold text-white">
              Decisions for Ratification ({data.decisions.length})
            </h2>
            <p className="text-xs text-[#858997] mt-0.5">
              Approved items are written to the permanent cross-meeting memory log.
            </p>
          </div>
          <span className="text-xs font-mono text-[#D47255] font-semibold">
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
                className={`p-4 rounded-2xl transition-all border-none ${
                  isApproved
                    ? "bg-[#1C1E26]"
                    : "bg-[#1A1C24] opacity-50"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <input
                    type="checkbox"
                    checked={isApproved}
                    onChange={() => toggleDecision(dec.id)}
                    className="mt-1 h-4 w-4 rounded-lg bg-[#15161C] text-[#D47255] focus:ring-0 cursor-pointer border-none"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={currentText}
                      onChange={(e) => handleEditChange(dec.id, "text", e.target.value)}
                      className="w-full text-sm font-semibold text-white bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#D47255] rounded px-1 py-0.5"
                    />

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#858997]">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#858997]" />
                        <input
                          type="text"
                          placeholder="Owner (optional)"
                          value={currentOwner}
                          onChange={(e) => handleEditChange(dec.id, "owner", e.target.value)}
                          className="bg-transparent border-none focus:outline-none text-xs w-28 text-white focus:ring-1 focus:ring-[#D47255] rounded px-1"
                        />
                      </div>
                      <span>Line #{dec.source_line}</span>
                      <span className="text-[#D47255] font-semibold">
                        {(dec.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: EXTRACTED ACTION ITEMS */}
      <div className="bg-[#15161C] rounded-3xl p-6 sm:p-7 space-y-4 border-none shadow-xl">
        <div className="flex items-baseline justify-between border-b border-[#1E2028] pb-3">
          <div>
            <h2 className="text-lg font-bold text-white">
              Action Items & Tracker Dispatch ({data.action_items.length})
            </h2>
            <p className="text-xs text-[#858997] mt-0.5">
              Authorized items are created in Trello and scheduled for 24h deadline alerts.
            </p>
          </div>
          <span className="text-xs font-mono text-[#D47255] font-semibold">
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
                className={`p-4 rounded-2xl transition-all border-none ${
                  isApproved
                    ? "bg-[#1C1E26]"
                    : "bg-[#1A1C24] opacity-50"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <input
                    type="checkbox"
                    checked={isApproved}
                    onChange={() => toggleAction(act.id)}
                    className="mt-1 h-4 w-4 rounded-lg bg-[#15161C] text-[#D47255] focus:ring-0 cursor-pointer border-none"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={currentText}
                      onChange={(e) => handleEditChange(act.id, "text", e.target.value)}
                      className="w-full text-sm font-semibold text-white bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#D47255] rounded px-1 py-0.5"
                    />

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#858997]">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#858997]" />
                        <input
                          type="text"
                          placeholder="Assignee (e.g. Rahul)"
                          value={currentOwner}
                          onChange={(e) => handleEditChange(act.id, "owner", e.target.value)}
                          className="bg-transparent border-none focus:outline-none text-xs w-32 text-white focus:ring-1 focus:ring-[#D47255] rounded px-1"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#858997]" />
                        <input
                          type="date"
                          value={currentDeadline}
                          onChange={(e) => handleEditChange(act.id, "deadline", e.target.value)}
                          className="bg-transparent border-none focus:outline-none text-xs text-white focus:ring-1 focus:ring-[#D47255] rounded px-1"
                        />
                      </div>

                      <span>Line #{act.source_line}</span>
                      <span className="text-[#D47255] font-semibold">
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

      {/* Floating Bottom Docket Bar */}
      {!commitResult && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-30">
          <div className="p-4 rounded-3xl bg-[#15161C]/95 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border-none">
            <div className="text-xs text-[#9FA4B2] font-sans">
              Authorizing <strong>{approvedDecisions.size}</strong> decisions and <strong>{approvedActions.size}</strong> tasks
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-4 py-2 text-xs rounded-xl bg-[#1C1E26] text-[#858997] hover:text-white cursor-pointer border-none"
              >
                Discard
              </button>

              <button
                type="button"
                onClick={handleCommit}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs font-bold rounded-2xl bg-[#D47255] text-[#2A140E] flex items-center gap-2 flex-1 sm:flex-initial justify-center cursor-pointer disabled:opacity-50 border-none shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2A140E]" />
                    <span>Committing...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Commit to Memory</span>
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
        <div className="py-24 text-center text-xs text-[#858997] font-mono">
          Loading meeting review...
        </div>
      }
    >
      <ReviewContent {...props} />
    </Suspense>
  );
}
