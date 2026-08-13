// Shared app types. Database-generated types land in database.ts
// (`supabase gen types typescript --linked > types/database.ts`).

export type VideoSource = "youtube" | "drive";

export interface WatchedInterval {
  start: number;
  end: number;
}

export interface ClassSummary {
  id: string;
  name: string;
  joinCode: string;
  memberCount?: number;
}

export interface AssignmentSummary {
  id: string;
  title: string;
  source: VideoSource;
  externalId: string;
  durationSeconds: number;
  dueAt: string | null;
  percent: number;
  completedAt: string | null;
}
