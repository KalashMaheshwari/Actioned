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
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit2,
  Calendar,
  User,
  ArrowLeft,
  Check,
  Send,
  Loader2,
  ExternalLink,
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
        // By default, pre-select all extracted decisions and actions for approval
        setApprovedDecisions(new Set(parsed.decisions.map((d) => d.id)));
        setApprovedActions(new Set(parsed.action_items.map((a) => a.id)));

        // Pre-fill conflict resolution to supersede
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
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <p className="text-zinc-600 dark:text-zinc-400">Loading meeting review payload...</p>
        <button
          onClick={() => router.push("/")}
          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← Return to Ingestion Screen
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Ingestion
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Meeting Review: {meetingMeta?.title || `Meeting #${meetingId}`}
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Date: {meetingMeta?.date || "Current"} • Human Confirmation Step (Scope #5)
          </p>
        </div>

        {!commitResult && (
          <button
            onClick={handleCommit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Committing to Memory...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Approve & Commit ({approvedDecisions.size} Decisions, {approvedActions.size} Tasks)
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Success Commit Banner */}
      {commitResult && (
        <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-lg">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Meeting Approved & Committed to Memory
          </div>
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            Decisions have been indexed in SQLite and ChromaDB vector store. Tasks have been created in Trello and Slack notifications staged.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/decisions")}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm"
            >
              View Decision Memory Log →
            </button>
            <button
              onClick={() => router.push("/digest")}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50 transition-colors"
            >
              View Team Digest →
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: DETECTED CONFLICTS */}
      {data.conflicts.length > 0 && (
        <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-300 dark:border-amber-800 p-5 space-y-4">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-base">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>Cross-Meeting Conflict Detected ({data.conflicts.length})</span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-400">
            Actioned scanned persistent memory and flagged that a new decision contradicts a past commitment.
          </p>

          <div className="space-y-3">
            {data.conflicts.map((conf, idx) => {
              const oldId = String(conf.old_decision.id);
              const currentRes = conflictResolutions[oldId] || "supersede";
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-amber-200 dark:border-amber-800 shadow-sm space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                        Earlier Recorded Decision
                      </span>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                        "{conf.old_decision.text}"
                      </p>
                      <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                        <span>Owner: {conf.old_decision.owner || "Unassigned"}</span>
                        <span>•</span>
                        <span>{conf.old_decision.meeting_title} ({conf.old_decision.date})</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                        New Proposed Decision
                      </span>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                        "{data.decisions.find((d) => d.id === conf.new_decision_id)?.text || "New Decision"}"
                      </p>
                      <div className="text-xs text-indigo-700 dark:text-indigo-400 mt-2">
                        Ref: {conf.new_decision_id}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    <span className="font-bold">Reason:</span> {conf.reason}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Resolution upon approval:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setConflictResolutions((prev) => ({ ...prev, [oldId]: "supersede" }))
                        }
                        className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors ${
                          currentRes === "supersede"
                            ? "bg-amber-600 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                        }`}
                      >
                        Supersede Old Decision
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConflictResolutions((prev) => ({ ...prev, [oldId]: "dismiss" }))
                        }
                        className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors ${
                          currentRes === "dismiss"
                            ? "bg-zinc-700 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                        }`}
                      >
                        Dismiss Conflict
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
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Decisions to Commit ({data.decisions.length})
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Approved decisions become part of Actioned's cross-meeting memory log.
            </p>
          </div>
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
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
                className={`p-4 rounded-lg border transition-all ${
                  isApproved
                    ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/20 dark:bg-indigo-950/10"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isApproved}
                    onChange={() => toggleDecision(dec.id)}
                    className="mt-1 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={currentText}
                      onChange={(e) => handleEditChange(dec.id, "text", e.target.value)}
                      className="w-full font-medium text-sm text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-indigo-500 focus:outline-none"
                    />
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <input
                          type="text"
                          placeholder="Owner (optional)"
                          value={currentOwner}
                          onChange={(e) => handleEditChange(dec.id, "owner", e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-indigo-500 focus:outline-none text-xs w-28"
                        />
                      </div>
                      <span>Source: Line #{dec.source_line}</span>
                      <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
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
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Action Items & Tracker Tasks ({data.action_items.length})
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Approved tasks are pushed to Trello and monitored for upcoming deadline reminders.
            </p>
          </div>
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
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
                className={`p-4 rounded-lg border transition-all ${
                  isApproved
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isApproved}
                    onChange={() => toggleAction(act.id)}
                    className="mt-1 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={currentText}
                      onChange={(e) => handleEditChange(act.id, "text", e.target.value)}
                      className="w-full font-medium text-sm text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-emerald-500 focus:outline-none"
                    />

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <input
                          type="text"
                          placeholder="Assignee (e.g. Rahul)"
                          value={currentOwner}
                          onChange={(e) => handleEditChange(act.id, "owner", e.target.value)}
                          className={`bg-transparent border-b hover:border-zinc-300 focus:border-emerald-500 focus:outline-none text-xs w-32 ${
                            !currentOwner ? "border-amber-400 text-amber-700 dark:text-amber-400 placeholder:text-amber-500" : "border-transparent"
                          }`}
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <input
                          type="date"
                          value={currentDeadline}
                          onChange={(e) => handleEditChange(act.id, "deadline", e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-emerald-500 focus:outline-none text-xs"
                        />
                      </div>

                      <span>Source: Line #{act.source_line}</span>
                      <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
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
    </div>
  );
}

export default function ReviewPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-sm text-zinc-600">
          Loading meeting review...
        </div>
      }
    >
      <ReviewContent {...props} />
    </Suspense>
  );
}
