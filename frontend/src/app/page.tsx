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
} from "lucide-react";
import {
  IngestApertureIcon,
  AcousticWaveIcon,
  ConflictPrismIcon,
  ChronoGaugeIcon,
} from "@/components/Icons";

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
    const blob = new Blob(["audio stream"], { type: "audio/mp3" });
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
    <div className="space-y-8">
      {/* Page Header (Claude Editorial Style) */}
      <div className="space-y-2">
        <h1 className="font-claude-heading text-3xl sm:text-4xl text-white font-medium tracking-tight">
          Ingest Meeting
        </h1>
        <p className="text-sm text-[#9FA4B2] leading-relaxed max-w-xl">
          Extract decisions & action items, maintain cross-meeting memory, and reconcile schedule shifts.
        </p>
      </div>

      {/* 3 Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1 */}
        <button
          type="button"
          onClick={() => loadPreset("meeting1")}
          className="p-5 rounded-2xl text-left bg-[#15161C] hover:bg-[#1A1C24] transition-all cursor-pointer group flex flex-col justify-between border-none"
        >
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-[#858997] block">
              01 / BASELINE
            </span>
            <h3 className="text-base font-bold text-white group-hover:text-[#D47255] transition-colors">
              Roadmap Kickoff
            </h3>
            <p className="text-xs text-[#858997] leading-relaxed">
              Sets initial deliverables and targets April 15 release.
            </p>
          </div>
          <div className="pt-3 mt-3 flex items-center justify-between text-xs text-[#858997]">
            <span className="font-mono">2026-10-03</span>
            <span className="font-semibold text-white group-hover:translate-x-0.5 transition-transform">
              Load →
            </span>
          </div>
        </button>

        {/* Card 2 */}
        <button
          type="button"
          onClick={() => loadPreset("meeting2")}
          className="p-5 rounded-2xl text-left bg-[#15161C] hover:bg-[#1A1C24] transition-all cursor-pointer group flex flex-col justify-between border-none"
        >
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-[#858997] block">
              02 / SPRINT SYNC
            </span>
            <h3 className="text-base font-bold text-white group-hover:text-[#D47255] transition-colors">
              Sprint 14 Planning
            </h3>
            <p className="text-xs text-[#858997] leading-relaxed">
              Relative deadlines ("next Friday") assigned to Priya & Arjun.
            </p>
          </div>
          <div className="pt-3 mt-3 flex items-center justify-between text-xs text-[#858997]">
            <span className="font-mono">2026-11-14</span>
            <span className="font-semibold text-white group-hover:translate-x-0.5 transition-transform">
              Load →
            </span>
          </div>
        </button>

        {/* Card 3: Filled with #D47255, no border, dark chocolate text */}
        <button
          type="button"
          onClick={() => loadPreset("meeting3")}
          className="p-5 rounded-2xl text-left bg-[#D47255] text-[#2A140E] hover:opacity-95 transition-all cursor-pointer group flex flex-col justify-between border-none shadow-lg"
        >
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider block opacity-80">
              03 / CONFLICT DEMO
            </span>
            <h3 className="text-base font-extrabold text-[#2A140E]">
              Executive Review
            </h3>
            <p className="text-xs text-[#3A1B12] leading-relaxed font-medium">
              Pivots launch to April 2, testing contradiction detection against Kickoff.
            </p>
          </div>
          <div className="pt-3 mt-3 flex items-center justify-between text-xs font-bold text-[#2A140E]">
            <span className="font-mono">2026-11-21</span>
            <span className="group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Trigger Conflict →
            </span>
          </div>
        </button>
      </div>

      {/* Main Ingestion Form (Matte Card, Borderless) */}
      <form onSubmit={handleIngest} className="bg-[#15161C] rounded-3xl p-6 sm:p-8 space-y-6 border-none shadow-xl">
        {error && (
          <div className="p-4 rounded-2xl bg-[#D47255] text-[#2A140E] text-xs font-bold flex items-center gap-2 border-none">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#2A140E]" />
            <span>{error}</span>
          </div>
        )}

        {/* Title and Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#858997] font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#858997]" />
              Meeting Subject
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Executive Strategy"
              className="w-full px-4 py-3 text-sm bg-[#1C1E26] rounded-2xl text-white placeholder-[#6B707F] border-none focus:outline-none focus:ring-2 focus:ring-[#D47255]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#858997] font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#858997]" />
              Meeting Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-[#1C1E26] rounded-2xl text-white border-none focus:outline-none focus:ring-2 focus:ring-[#D47255] font-mono"
            />
          </div>
        </div>

        {/* Source Selector & Input Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase tracking-wider text-[#858997] font-semibold">
              Input Mode
            </label>

            {/* Seamless Segmented Control */}
            <div className="flex items-center p-1 bg-[#1C1E26] rounded-2xl text-xs font-sans">
              <button
                type="button"
                onClick={() => setFormat("txt")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer border-none ${
                  format === "txt"
                    ? "bg-[#D47255] text-[#2A140E] font-bold shadow-md"
                    : "text-[#858997] hover:text-white"
                }`}
              >
                Plain text
              </button>
              <button
                type="button"
                onClick={() => setFormat("vtt")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer border-none ${
                  format === "vtt"
                    ? "bg-[#D47255] text-[#2A140E] font-bold shadow-md"
                    : "text-[#858997] hover:text-white"
                }`}
              >
                Zoom/Meet VTT
              </button>
              <button
                type="button"
                onClick={() => setFormat("audio")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border-none ${
                  format === "audio"
                    ? "bg-[#D47255] text-[#2A140E] font-bold shadow-md"
                    : "text-[#858997] hover:text-white"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                Audio (Whisper)
              </button>
            </div>
          </div>

          {/* Conditional Audio vs Text Area */}
          {format === "audio" ? (
            <div className="space-y-4">
              <div className="rounded-3xl p-8 text-center space-y-4 bg-[#1C1E26] border-none">
                <div className="w-12 h-12 rounded-2xl bg-[#D47255] text-[#2A140E] flex items-center justify-center mx-auto shadow-md">
                  <Upload className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-base text-white">
                    {audioFile ? audioFile.name : "Select or drop audio recording"}
                  </p>
                  <p className="text-xs text-[#858997]">
                    Speech-to-text with automatic speaker turns via Whisper (.mp3, .wav, .m4a, .webm)
                  </p>
                </div>

                <div>
                  <label className="px-5 py-2.5 text-xs font-bold rounded-2xl bg-[#D47255] text-[#2A140E] hover:opacity-90 inline-block cursor-pointer transition-all border-none">
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
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#858997]">
                <span className="font-mono text-[11px]">Sample audio files:</span>
                <button
                  type="button"
                  onClick={() => handleSelectSampleAudio("Kickoff_Recording", "Product Kickoff Recording")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-sans transition-colors cursor-pointer border-none ${
                    selectedSampleAudio === "Kickoff_Recording"
                      ? "bg-[#D47255] text-[#2A140E] font-bold"
                      : "bg-[#1C1E26] text-[#9FA4B2] hover:text-white"
                  }`}
                >
                  Kickoff_Recording.mp3
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSampleAudio("Sprint_Review", "Sprint Review Recording")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-sans transition-colors cursor-pointer border-none ${
                    selectedSampleAudio === "Sprint_Review"
                      ? "bg-[#D47255] text-[#2A140E] font-bold"
                      : "bg-[#1C1E26] text-[#9FA4B2] hover:text-white"
                  }`}
                >
                  Sprint_Review.wav
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <textarea
                rows={9}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste transcript with speaker attribution e.g.&#10;Arjun: We agreed to schedule launch for April 15.&#10;Priya: I will wrap up frontend components by next Friday."
                className="w-full p-4 font-mono text-xs sm:text-sm bg-[#1C1E26] rounded-2xl text-white placeholder-[#6B707F] border-none focus:outline-none focus:ring-2 focus:ring-[#D47255] leading-relaxed"
              />
              <div className="absolute bottom-3 right-3 text-[11px] font-mono text-[#6B707F]">
                {transcript.split("\n").length} lines
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-[#858997] font-sans">
            Human verification gate enforced before committing to memory.
          </span>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl font-bold text-sm bg-[#D47255] text-[#2A140E] hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all border-none shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#2A140E]" />
                <span>{analysisStep || "Analyzing..."}</span>
              </>
            ) : (
              <>
                <span>Analyze Transcript</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
