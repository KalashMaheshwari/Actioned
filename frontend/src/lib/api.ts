import {
  MeetingCreateRequest,
  MeetingIngestionResponse,
  MeetingApprovalRequest,
  MeetingApprovalResponse,
  Decision,
  PersonDigestResponse,
} from "./types";

const isBrowser = typeof window !== "undefined";

// In the browser when on Vercel or production, route through /api/proxy (Next.js same-origin rewrite)
// to prevent CORS mismatches and browser ad-blockers (ERR_BLOCKED_BY_CLIENT) from blocking *.onrender.com
const API_BASE_URL = isBrowser
  ? (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
      ? "/api/proxy"
      : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"))
  : (process.env.NEXT_PUBLIC_API_URL || "https://actioned.onrender.com");

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: "GET", cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}

export async function ingestMeeting(
  payload: MeetingCreateRequest
): Promise<MeetingIngestionResponse> {
  const res = await fetch(`${API_BASE_URL}/meetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to ingest meeting: ${errText}`);
  }
  return res.json();
}

export async function approveMeeting(
  meetingId: number,
  payload: MeetingApprovalRequest
): Promise<MeetingApprovalResponse> {
  const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to approve meeting: ${errText}`);
  }
  return res.json();
}

export async function getDecisions(
  status?: string,
  query?: string
): Promise<Decision[]> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (query) params.append("q", query);

  const res = await fetch(`${API_BASE_URL}/decisions?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch decisions log");
  }
  return res.json();
}

export async function getPersonDigest(
  person: string
): Promise<PersonDigestResponse> {
  const res = await fetch(`${API_BASE_URL}/digest/${encodeURIComponent(person)}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch digest for ${person}`);
  }
  return res.json();
}

export async function ingestAudioMeeting(
  file: File,
  title: string,
  date: string
): Promise<MeetingIngestionResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  formData.append("date", date);

  const res = await fetch(`${API_BASE_URL}/meetings/audio`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to ingest audio meeting: ${errText}`);
  }
  return res.json();
}

export async function seedDemoData(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/dev/seed`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Failed to re-seed demo data");
  }
  return res.json();
}
