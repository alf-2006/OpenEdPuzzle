"use client";

import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Type-safe wrappers around the security-definer RPCs (migrations 0002/0004).
// These signatures mirror the DEPLOYED backend exactly — including the v2
// challenge-response and honeytoken fields. Identity is always auth.uid()
// server-side; p_student_id exists only so the RPC can reject mismatches.
// ---------------------------------------------------------------------------

export interface StartSessionResponse {
  status: "ok" | "error";
  error?: string;
  session_id?: string;
  challenge_nonce?: string;
  beat_interval_ms?: number;
  resume_position?: number;
  percent?: number;
  credited_seconds?: number;
  already_completed?: boolean;
  duration?: number;
  max_playback_rate?: number;
  source?: "youtube" | "drive";
  external_id?: string;
  title?: string;
  due_at?: string | null;
  server_time?: string;
}

export interface HeartbeatResponse {
  status: "ok" | "duplicate" | "error";
  error?: string;
  credited_position?: number;
  corrected?: boolean;
  percent?: number;
  credited_seconds?: number;
  completed?: boolean;
  flags?: string[];
  checkpoint_pending?: number | null;
  challenge_nonce?: string;   // bind into the NEXT beat
  next_beat_in_ms?: number;   // honeytoken: wait ~this long before the next beat
  server_time?: string;
  session_status?: string;
}

export type BeatKind = "periodic" | "event";
export type BeatEvent =
  | "play"
  | "pause"
  | "seeked"
  | "ratechange"
  | "visibilitychange";
export type Visibility = "visible" | "hidden" | "pip";

export async function startWatchSession(params: {
  studentId: string;
  assignmentId: string;
  clientSessionId: string;
  fingerprint: string | null;
}): Promise<StartSessionResponse> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("start_watch_session", {
    p_student_id: params.studentId,
    p_assignment_id: params.assignmentId,
    p_client_session_id: params.clientSessionId,
    p_user_agent: navigator.userAgent,
    p_fingerprint: params.fingerprint,
  });
  if (error) throw error;
  return data as StartSessionResponse;
}

export async function submitHeartbeat(params: {
  sessionId: string;
  seq: number;
  position: number;
  rate: number;
  clientTimestamp: string;          // ISO string
  kind: BeatKind;
  event: BeatEvent | null;
  visibility: Visibility;
  fingerprint: string | null;
  challengeResponse: string;        // sha256(nonce:seq:position_ms)
}): Promise<HeartbeatResponse> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("submit_heartbeat", {
    p_session_id: params.sessionId,
    p_seq: params.seq,
    p_position: params.position,
    p_rate: params.rate,
    p_client_timestamp: params.clientTimestamp,
    p_kind: params.kind,
    p_event: params.event,
    p_visibility: params.visibility,
    p_fingerprint: params.fingerprint,
    p_challenge_response: params.challengeResponse,
  });
  if (error) throw error;
  return data as HeartbeatResponse;
}

export async function joinClassByCode(joinCode: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("join_class_by_code", {
    p_code: joinCode,
  });
  if (error) throw error;
  return data;
}

export async function getStudentProgress(
  studentId: string,
  assignmentId: string,
) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_student_progress", {
    p_student_id: studentId,
    p_assignment_id: assignmentId,
  });
  if (error) throw error;
  return data;
}

export async function submitQuizAnswer(quizId: string, answer: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("submit_quiz_answer", {
    p_quiz_id: quizId,
    p_answer: answer,
  });
  if (error) throw error;
  return data;
}

/**
 * Compute the challenge response for a beat:
 * sha256_hex(`${nonce}:${seq}:${floor(position * 1000)}`)
 * Must match the server-side formula in submit_heartbeat exactly.
 */
export async function computeChallengeResponse(
  nonce: string,
  seq: number,
  position: number,
): Promise<string> {
  const positionMs = Math.floor(position * 1000);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${nonce}:${seq}:${positionMs}`),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
