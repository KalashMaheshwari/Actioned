"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_MEETINGS } from "@/lib/mockData";
import { ingestMeeting, ingestAudioMeeting } from "@/lib/api";
import {
  ArrowRight,
  Loader2,
  Upload,
  AlertCircle,
  FileText,
  Calendar,
  Volume2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function IngestPage() {
  const router = useRouter();
  const [title, setTitle] = useState("Q4 Roadmap Kickoff");
  const [date, setDate] = useState("2026-10-03");
  const [format, setFormat] = useState<"txt" | "vtt" | "audio">("txt");
  const [transcript, setTranscript] = useState(DEMO_MEETINGS.meeting1.transcript);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [selectedSampleAudio, setSelectedSampleAudio] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const loadPreset = (key: keyof typeof DEMO_MEETINGS) => {
    const preset = DEMO_MEETINGS[key];
    setTitle(preset.title);
    setDate(preset.date);
    setFormat(preset.format);
    setTranscript(preset.transcript);
    setAudioFile(null);
    setSelectedSampleAudio(null);
    setError(null);
  };

  const handleSelectSampleAudio = (sampleName: string, sampleTitle: string) => {
    setSelectedSampleAudio(sampleName);
    setTitle(sampleTitle);
    setDate("2026-10-04");
    setFormat("audio");
    const blob = new Blob(["audio file stream"], { type: "audio/mp3" });
    const file = new File([blob], `${sampleName}.mp3`, { type: "audio/mp3" });
    setAudioFile(file);
    setError(null);
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (format === "audio" && !audioFile) {
      setError("Please select or drop an audio file to transcribe.");
      return;
    }
    if (format !== "audio" && !transcript.trim()) {
      setError("Please provide a transcript with speaker attribution to analyze.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisStep("Reading speaker attribution...");

    try {
      setTimeout(() => {
        setAnalysisStep("Extracting decisions, owners, and deadlines...");
      }, 700);

      setTimeout(() => {
        setAnalysisStep("Scanning persistent memory for conflicts...");
      }, 1500);

      const response =
        format === "audio" && audioFile
          ? await ingestAudioMeeting(audioFile, title, date)
          : await ingestMeeting({
              title,
              date,
              transcript,
              format: format as "txt" | "vtt",
            });

      if (typeof window !== "undefined") {
        sessionStorage.setItem(`meeting_proposal_${response.meeting_id}`, JSON.stringify(response));
        sessionStorage.setItem(`meeting_meta_${response.meeting_id}`, JSON.stringify({ title, date }));
      }

      router.push(`/meetings/${response.meeting_id}/review`);
    } catch (err: any) {
      setError(err.message || "Failed to analyze meeting. Ensure backend API is running.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Editorial Header */}
      <div className="space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE2D2] border border-[#DDD3BF] text-[11px] font-mono uppercase tracking-wider text-[#735A43] font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#D97757]" />
          <span>Autonomous Meeting-to-Execution System</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl font-normal tracking-tight text-[#1F1E1B] leading-[1.15]">
          Meetings make decisions. <br />
          <span className="italic text-[#706B62]">Actioned keeps them.</span>
        </h1>

        <p className="text-sm sm:text-base text-[#615C52] leading-relaxed">
          An autonomous system that parses spoken discussions, builds a permanent cross-meeting memory, flags contradictions before they become mistakes, and synchronizes confirmed tasks to Trello.
        </p>
      </div>

      {/* 3 Pastel Workspace Meeting Cards */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between text-xs text-[#7A7468]">
          <span className="font-mono uppercase tracking-wider text-[11px] font-semibold">
            Sample Workspace Transcripts
          </span>
          <span className="text-[#878073]">
            Select Meeting 1 (Initial Consensus) → Meeting 3 (Schedule Revision)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Pastel Sage */}
          <button
            type="button"
            onClick={() => loadPreset("meeting1")}
            className="p-4.5 rounded-xl text-left bg-[#EFF5F0] border border-[#D5E6D8] hover:border-[#BFD8C3] transition-all cursor-pointer group flex flex-col justify-between shadow-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#637E6B]">
                <span className="font-mono font-semibold">01 / ROADMAP KICKOFF</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E2EFE4] text-[#2D5A43] font-semibold">
                  TRANSCRIPT
                </span>
              </div>
              <h3 className="font-serif text-lg text-[#1F1E1B] group-hover:text-[#2D5A43] transition-colors">
                Roadmap Kickoff
              </h3>
              <p className="text-xs text-[#526658] leading-relaxed">
                Initial planning session establishing deliverables and the April 15 launch target.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#D9EAD9] flex items-center justify-between text-[11px] text-[#637E6B]">
              <span className="font-mono">2026-10-03</span>
              <span className="font-medium text-[#2D5A43] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Load transcript →
              </span>
            </div>
          </button>

          {/* Card 2: Pastel Sky / Periwinkle */}
          <button
            type="button"
            onClick={() => loadPreset("meeting2")}
            className="p-4.5 rounded-xl text-left bg-[#EEF4F9] border border-[#D4E2F1] hover:border-[#BCD2EA] transition-all cursor-pointer group flex flex-col justify-between shadow-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#57728E]">
                <span className="font-mono font-semibold">02 / SPRINT SYNC</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#DEEAF6] text-[#2C5278] font-semibold">
                  TRANSCRIPT
                </span>
              </div>
              <h3 className="font-serif text-lg text-[#1F1E1B] group-hover:text-[#2C5278] transition-colors">
                Sprint 14 Planning
              </h3>
              <p className="text-xs text-[#4F657D] leading-relaxed">
                Relative deadline resolution ("next Friday") and assignments for Priya & Arjun.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#D7E4F2] flex items-center justify-between text-[11px] text-[#57728E]">
              <span className="font-mono">2026-11-14</span>
              <span className="font-medium text-[#2C5278] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Load transcript →
              </span>
            </div>
          </button>

          {/* Card 3: Pastel Terracotta / Apricot */}
          <button
            type="button"
            onClick={() => loadPreset("meeting3")}
            className="p-4.5 rounded-xl text-left bg-[#FDF1EB] border border-[#F4D5C7] hover:border-[#E8BCA9] transition-all cursor-pointer group flex flex-col justify-between shadow-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#9E5A44]">
                <span className="font-mono font-semibold">03 / SCHEDULE SHIFT</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FBE2D8] text-[#B93828] font-bold">
                  SCHEDULE REVISION
                </span>
              </div>
              <h3 className="font-serif text-lg text-[#1F1E1B] group-hover:text-[#B93828] transition-colors">
                Executive Review
              </h3>
              <p className="text-xs text-[#7A4B3C] leading-relaxed">
                Proposes advancing launch to April 2, testing autonomous contradiction detection against the Q4 Roadmap.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#F5DAD0] flex items-center justify-between text-[11px] text-[#9E5A44]">
              <span className="font-mono">2026-11-21</span>
              <span className="font-bold text-[#B93828] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Load transcript →
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Ingestion Desk */}
      <form onSubmit={handleIngest} className="bg-[#FFFDF9] rounded-2xl border border-[#E5DDD0] p-6 sm:p-8 space-y-7 shadow-xs">
        {error && (
          <div className="p-3.5 rounded-xl bg-[#FDF1EC] border border-[#F5D2C4] text-xs text-[#B93828] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Title and Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#736B5E] font-medium flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#9E9585]" />
              Meeting Subject
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Executive Strategy"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F0] border border-[#DDD4C3] rounded-xl text-[#1F1E1B] placeholder-[#A39B8B] focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]/30 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#736B5E] font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#9E9585]" />
              Meeting Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F0] border border-[#DDD4C3] rounded-xl text-[#1F1E1B] focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]/30 transition-colors font-mono"
            />
          </div>
        </div>

        {/* Source Selector & Input Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase tracking-wider text-[#736B5E] font-medium">
              Transcript / Audio Input
            </label>

            {/* Segmented Control */}
            <div className="flex items-center p-1 bg-[#EBE4D5] rounded-xl text-xs font-sans">
              <button
                type="button"
                onClick={() => setFormat("txt")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  format === "txt"
                    ? "bg-[#FFFDF9] text-[#1F1E1B] font-semibold shadow-xs"
                    : "text-[#6B6354] hover:text-[#1F1E1B]"
                }`}
              >
                Plain text
              </button>
              <button
                type="button"
                onClick={() => setFormat("vtt")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  format === "vtt"
                    ? "bg-[#FFFDF9] text-[#1F1E1B] font-semibold shadow-xs"
                    : "text-[#6B6354] hover:text-[#1F1E1B]"
                }`}
              >
                Zoom/Meet VTT
              </button>
              <button
                type="button"
                onClick={() => setFormat("audio")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  format === "audio"
                    ? "bg-[#D97757] text-white font-medium shadow-xs"
                    : "text-[#6B6354] hover:text-[#1F1E1B]"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                Audio recording
              </button>
            </div>
          </div>

          {/* Conditional Audio vs Text Desk */}
          {format === "audio" ? (
            <div className="space-y-4">
              <div className="border border-[#E0D7C6] rounded-2xl p-8 text-center space-y-4 bg-[#FAF6EE]">
                <div className="w-12 h-12 rounded-full bg-[#EAE2D2] flex items-center justify-center mx-auto text-[#6B6354]">
                  <Upload className="w-5 h-5 text-[#8A7B69]" />
                </div>

                <div className="space-y-1">
                  <p className="font-serif text-lg text-[#1F1E1B]">
                    {audioFile ? audioFile.name : "Select or drop meeting audio recording"}
                  </p>
                  <p className="text-xs text-[#827869] font-sans">
                    Speech-to-text with automatic speaker turns via Whisper (.mp3, .wav, .m4a, .webm)
                  </p>
                </div>

                {/* Subtle Acoustic Visualizer */}
                <div className="flex items-center justify-center gap-1.5 py-1 h-8 opacity-80">
                  <span className="w-1 h-3 bg-[#D97757] rounded-full" />
                  <span className="w-1 h-5 bg-[#D97757] rounded-full" />
                  <span className="w-1 h-2 bg-[#8C8474] rounded-full" />
                  <span className="w-1 h-7 bg-[#D97757] rounded-full" />
                  <span className="w-1 h-4 bg-[#1F1E1B] rounded-full" />
                  <span className="w-1 h-6 bg-[#D97757] rounded-full" />
                  <span className="w-1 h-3 bg-[#8C8474] rounded-full" />
                  <span className="w-1 h-5 bg-[#D97757] rounded-full" />
                </div>

                <div>
                  <label className="px-4 py-2 text-xs font-medium rounded-xl bg-white border border-[#D5CCBA] text-[#1F1E1B] hover:bg-[#F5EFE4] inline-block cursor-pointer transition-colors shadow-xs">
                    Browse audio file
                    <input
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a,.webm"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAudioFile(e.target.files[0]);
                          setSelectedSampleAudio(null);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Sample recordings */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#736B5E]">
                <span className="font-mono text-[11px]">Sample team recordings:</span>
                <button
                  type="button"
                  onClick={() => handleSelectSampleAudio("Kickoff_Recording", "Product Kickoff Recording")}
                  className={`px-3 py-1 rounded-lg border text-xs font-sans transition-colors cursor-pointer ${
                    selectedSampleAudio === "Kickoff_Recording"
                      ? "border-[#D97757] bg-[#FDF1EB] text-[#B9472A] font-semibold"
                      : "border-[#DDD4C3] bg-white hover:bg-[#FAF6EE] text-[#544D41]"
                  }`}
                >
                  Kickoff_Recording.mp3
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSampleAudio("Sprint_Review", "Sprint Review Recording")}
                  className={`px-3 py-1 rounded-lg border text-xs font-sans transition-colors cursor-pointer ${
                    selectedSampleAudio === "Sprint_Review"
                      ? "border-[#D97757] bg-[#FDF1EB] text-[#B9472A] font-semibold"
                      : "border-[#DDD4C3] bg-white hover:bg-[#FAF6EE] text-[#544D41]"
                  }`}
                >
                  Sprint_Review.wav
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <textarea
                rows={10}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste transcript with speaker attribution e.g.&#10;Arjun: We agreed to schedule launch for April 15.&#10;Priya: I will wrap up frontend components by next Friday."
                className="w-full p-4 font-mono text-xs sm:text-sm bg-[#FAF7F0] border border-[#DDD4C3] rounded-2xl text-[#1F1E1B] placeholder-[#A39B8B] focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]/30 transition-colors leading-relaxed"
              />
              <div className="absolute bottom-3 right-3 text-[11px] font-mono text-[#8C8474]">
                {transcript.split("\n").length} lines
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="pt-4 border-t border-[#EDE5D6] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-[#82796B] font-sans">
            A human confirmation step is required before anything gets posted or committed.
          </span>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-terracotta px-6 py-2.5 text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{analysisStep || "Analyzing..."}</span>
              </>
            ) : (
              <>
                <span>Analyze transcript & check memory</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
