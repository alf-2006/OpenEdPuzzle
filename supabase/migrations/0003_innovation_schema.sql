-- ============================================================================
-- WaslaLearn — Migration 0003: Innovation Schema (Tiers 1–5)
-- ============================================================================
-- Adds:
--   * events            — append-only, hash-chained, monthly-partitioned log
--                         (REPLACES heartbeat_log; that table is dropped here.
--                          It was introduced in 0001 and never deployed.)
--   * watch_sessions v2 — challenge nonce, honeytoken interval, entropy ring,
--                         fingerprint, human score, chain head
--   * behavioral_profiles, engagement_heatmaps, streaks,
--     timestamp_comments, auto_quizzes, quiz_responses
-- Security model unchanged: clients get NO write path to progress-domain
-- tables; everything flows through security-definer RPCs (migration 0004).
-- ============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;  -- digest(), gen_random_bytes()

-- --------------------------------------------------------------------------
-- tamper_kind: v2 categories.
-- NOTE: new enum values are created here but first USED in migration 0004
-- (Postgres forbids using a new enum value inside its own transaction).
-- --------------------------------------------------------------------------
ALTER TYPE public.tamper_kind ADD VALUE IF NOT EXISTS 'pow_failed';
ALTER TYPE public.tamper_kind ADD VALUE IF NOT EXISTS 'honeytoken_failed';
ALTER TYPE public.tamper_kind ADD VALUE IF NOT EXISTS 'entropy_low';
ALTER TYPE public.tamper_kind ADD VALUE IF NOT EXISTS 'bot_suspected';
ALTER TYPE public.tamper_kind ADD VALUE IF NOT EXISTS 'ip_changed';
ALTER TYPE public.tamper_kind ADD VALUE IF NOT EXISTS 'fingerprint_change';
ALTER TYPE public.tamper_kind ADD VALUE IF NOT EXISTS 'rate_limited';
ALTER TYPE public.tamper_kind ADD VALUE IF NOT EXISTS 'dead_mans_switch';
ALTER TYPE public.tamper_kind ADD VALUE IF NOT EXISTS 'unusual_hours';

-- --------------------------------------------------------------------------
-- watch_sessions v2 columns
-- --------------------------------------------------------------------------
ALTER TABLE public.watch_sessions
  ADD COLUMN challenge_nonce     TEXT,                    -- rotating challenge (anti-replay/anti-precompute)
  ADD COLUMN expected_interval_ms INT NOT NULL DEFAULT 5000, -- honeytoken: server-dictated next-beat delay
  ADD COLUMN inter_arrivals      INT[] NOT NULL DEFAULT '{}',  -- ring buffer, last 20 periodic inter-arrival ms
  ADD COLUMN interaction_count   INT NOT NULL DEFAULT 0,       -- event beats (pause/seek/rate/visibility)
  ADD COLUMN honeytoken_failures INT NOT NULL DEFAULT 0,
  ADD COLUMN fingerprint_hash    TEXT,
  ADD COLUMN human_score         NUMERIC(5,2) NOT NULL DEFAULT 50,
  ADD COLUMN last_event_hash     TEXT,                    -- hash-chain head for this session
  ADD COLUMN raised_flags        TEXT[] NOT NULL DEFAULT '{}', -- raise-once dedup for soft flags
  ADD COLUMN hidden_beats        INT NOT NULL DEFAULT 0,       -- beats while tab hidden (dead man's switch)
  ADD COLUMN visibility_seen     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN last_ip             INET;

-- --------------------------------------------------------------------------
-- events — the append-only, hash-chained source of truth (write model)
-- --------------------------------------------------------------------------
-- Each event's hash = sha256(prev_event_hash | payload | server_ts).
-- Per-session chain, serialized by the session row lock held during
-- submit_heartbeat. Modifying or deleting ANY historical event breaks every
-- subsequent hash — tamper-evident even against someone with DB write access.
-- Partitioned by month (time-series); BRIN index suits append-only workloads.
-- --------------------------------------------------------------------------
CREATE TABLE public.events (
  id          BIGINT GENERATED ALWAYS AS IDENTITY,
  session_id  UUID NOT NULL REFERENCES public.watch_sessions (id) ON DELETE CASCADE,
  student_id  UUID NOT NULL,
  assignment_id UUID NOT NULL,
  seq         INT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'periodic',   -- 'periodic' | 'event'
  payload     JSONB NOT NULL,                     -- position, rate, advance, credited, flags, visibility...
  server_ts   TIMESTAMPTZ NOT NULL DEFAULT now(),
  prev_hash   TEXT NOT NULL,
  event_hash  TEXT NOT NULL,
  PRIMARY KEY (id, server_ts)
) PARTITION BY RANGE (server_ts);

-- Monthly partitions (create ahead via pg_cron; default catches stragglers)
CREATE TABLE public.events_2026_08 PARTITION OF public.events
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE public.events_2026_09 PARTITION OF public.events
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE public.events_2026_10 PARTITION OF public.events
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE public.events_2026_11 PARTITION OF public.events
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE public.events_2026_12 PARTITION OF public.events
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE public.events_default PARTITION OF public.events DEFAULT;

CREATE INDEX events_brin_ts      ON public.events USING BRIN (server_ts);
CREATE INDEX events_session_idx  ON public.events (session_id, id);
CREATE INDEX events_student_idx  ON public.events (student_id, server_ts);
CREATE INDEX events_assign_idx   ON public.events (assignment_id, server_ts);

DROP TABLE public.heartbeat_log;   -- superseded by events (never deployed)

-- --------------------------------------------------------------------------
-- behavioral_profiles — per-student cross-session baseline (Tier 3.3)
-- --------------------------------------------------------------------------
CREATE TABLE public.behavioral_profiles (
  student_id               UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  sessions_analyzed        INT NOT NULL DEFAULT 0,
  avg_consumption_rate     NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  attention_consistency    NUMERIC(5,2),              -- 0-100, steadiness of watch pattern
  typical_hours            INT[] NOT NULL DEFAULT '{}', -- histogram of usual start hours (0-23)
  avg_human_score          NUMERIC(5,2),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- engagement_heatmaps — per-video, per-second aggregates (Tier 3.1)
-- Read model; rebuilt from events by refresh_engagement_heatmap().
-- --------------------------------------------------------------------------
CREATE TABLE public.engagement_heatmaps (
  video_id         UUID NOT NULL REFERENCES public.videos (id) ON DELETE CASCADE,
  second           INT  NOT NULL CHECK (second >= 0),
  viewers_count    INT  NOT NULL DEFAULT 0,
  rewatch_count    INT  NOT NULL DEFAULT 0,   -- seeks landing here
  pause_count      INT  NOT NULL DEFAULT 0,
  speed_drop_count INT  NOT NULL DEFAULT 0,   -- rate decreases here
  dropoff_count    INT  NOT NULL DEFAULT 0,   -- sessions that ended here
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (video_id, second)
);

-- --------------------------------------------------------------------------
-- streaks (Tier 4.1)
-- --------------------------------------------------------------------------
CREATE TABLE public.streaks (
  student_id       UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  current_streak   INT  NOT NULL DEFAULT 0,
  longest_streak   INT  NOT NULL DEFAULT 0,
  last_active_date DATE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- timestamp_comments (Tier 4.2)
-- --------------------------------------------------------------------------
CREATE TABLE public.timestamp_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments (id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  video_time    NUMERIC(10,3) NOT NULL CHECK (video_time >= 0),
  content       TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_pinned     BOOLEAN NOT NULL DEFAULT FALSE,   -- teacher-only pin (enforced by trigger below)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX timestamp_comments_assign_idx ON public.timestamp_comments (assignment_id, video_time);

-- Only the owning teacher may pin.
CREATE OR REPLACE FUNCTION public.enforce_comment_pin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.is_pinned AND NOT public.is_teacher_of_assignment(NEW.assignment_id) THEN
    RAISE EXCEPTION 'only the teacher can pin comments';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER comments_pin_guard
  BEFORE INSERT OR UPDATE ON public.timestamp_comments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_comment_pin();

-- --------------------------------------------------------------------------
-- auto_quizzes + quiz_responses (Tier 3.4 — comprehension-gated progress)
-- --------------------------------------------------------------------------
-- correct_answer is COLUMN-SECURED: clients get SELECT on every column EXCEPT
-- correct_answer. Answer checking happens only inside submit_quiz_answer().
-- Teachers read answers via get_quiz_answers() (security definer).
-- --------------------------------------------------------------------------
CREATE TABLE public.auto_quizzes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id  UUID NOT NULL REFERENCES public.assignments (id) ON DELETE CASCADE,
  video_time     NUMERIC(10,3) NOT NULL CHECK (video_time >= 0),
  question       JSONB NOT NULL,          -- {text, choices[], generated_by, status}
  correct_answer TEXT NOT NULL,
  is_mandatory   BOOLEAN NOT NULL DEFAULT TRUE,  -- gates progress past video_time
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX auto_quizzes_assign_idx ON public.auto_quizzes (assignment_id, video_time);

CREATE TABLE public.quiz_responses (
  quiz_id     UUID NOT NULL REFERENCES public.auto_quizzes (id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  answer      TEXT NOT NULL,
  is_correct  BOOLEAN NOT NULL,
  attempts    INT NOT NULL DEFAULT 1,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (quiz_id, student_id)
);

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE public.events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_heatmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timestamp_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_quizzes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses      ENABLE ROW LEVEL SECURITY;

-- events: NO client policies — forensic table, RPC/service access only.

CREATE POLICY behavioral_select ON public.behavioral_profiles FOR SELECT TO authenticated
  USING (student_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.class_members cm
                    JOIN public.classes c ON c.id = cm.class_id
                    WHERE cm.student_id = behavioral_profiles.student_id
                      AND c.teacher_id = auth.uid()));

-- heatmaps: teacher who owns the video; students of assigned classes (aggregate only)
CREATE POLICY heatmaps_select ON public.engagement_heatmaps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.videos v
                 WHERE v.id = engagement_heatmaps.video_id AND v.teacher_id = auth.uid())
         OR EXISTS (SELECT 1 FROM public.assignments a
                    JOIN public.class_members cm ON cm.class_id = a.class_id
                    WHERE a.video_id = engagement_heatmaps.video_id
                      AND cm.student_id = auth.uid()));

CREATE POLICY streaks_select ON public.streaks FOR SELECT TO authenticated
  USING (student_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.class_members cm
                    JOIN public.classes c ON c.id = cm.class_id
                    WHERE cm.student_id = streaks.student_id
                      AND c.teacher_id = auth.uid()));

-- comments: class participants read; students write own; teacher moderates
CREATE POLICY comments_select ON public.timestamp_comments FOR SELECT TO authenticated
  USING (public.is_student_assigned(assignment_id) OR public.is_teacher_of_assignment(assignment_id));
CREATE POLICY comments_insert ON public.timestamp_comments FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.is_student_assigned(assignment_id));
CREATE POLICY comments_update ON public.timestamp_comments FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR public.is_teacher_of_assignment(assignment_id))
  WITH CHECK (student_id = auth.uid() OR public.is_teacher_of_assignment(assignment_id));
CREATE POLICY comments_delete ON public.timestamp_comments FOR DELETE TO authenticated
  USING (student_id = auth.uid() OR public.is_teacher_of_assignment(assignment_id));

-- quizzes: participants read questions (NOT answers — column grant below);
-- teachers write via their class ownership.
CREATE POLICY quizzes_select ON public.auto_quizzes FOR SELECT TO authenticated
  USING (public.is_student_assigned(assignment_id) OR public.is_teacher_of_assignment(assignment_id));
CREATE POLICY quizzes_teacher_write ON public.auto_quizzes FOR ALL TO authenticated
  USING (public.is_teacher_of_assignment(assignment_id))
  WITH CHECK (public.is_teacher_of_assignment(assignment_id));

CREATE POLICY quiz_responses_select ON public.quiz_responses FOR SELECT TO authenticated
  USING (student_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.auto_quizzes q
                    WHERE q.id = quiz_responses.quiz_id
                      AND public.is_teacher_of_assignment(q.assignment_id)));
-- (students INSERT only via submit_quiz_answer RPC — answer correctness is server-computed)

-- ============================================================================
-- Grants
-- ============================================================================
REVOKE ALL ON public.events FROM authenticated, anon;

GRANT SELECT ON public.behavioral_profiles, public.engagement_heatmaps, public.streaks
  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timestamp_comments TO authenticated;
GRANT SELECT ON public.quiz_responses TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.quiz_responses FROM authenticated, anon;

-- Column-level security: students must never read correct_answer.
GRANT SELECT (id, assignment_id, video_time, question, is_mandatory, created_at)
  ON public.auto_quizzes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.auto_quizzes TO authenticated;  -- gated by RLS to teachers

COMMIT;
