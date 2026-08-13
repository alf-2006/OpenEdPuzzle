-- ============================================================================
-- WaslaLearn — Migration 0001: Initial Schema
-- ============================================================================
-- Security model:
--   * RLS enabled on EVERY table. Default-deny: no policy == no access.
--   * Progress-domain tables (watch_sessions, watched_intervals, progress,
--     tamper_events, heartbeat_log) have SELECT-only grants for clients.
--     ALL writes to them happen inside SECURITY DEFINER RPCs (migration 0002).
--   * RLS helper functions are SECURITY DEFINER + STABLE with an empty
--     search_path to prevent recursive policies and search_path hijacking.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- Enums
-- --------------------------------------------------------------------------
CREATE TYPE public.user_role      AS ENUM ('teacher', 'student');
CREATE TYPE public.video_source   AS ENUM ('youtube', 'drive');
CREATE TYPE public.session_status AS ENUM ('active', 'expired', 'superseded', 'completed');
CREATE TYPE public.tamper_kind    AS ENUM (
  'skip_attempt',        -- claimed advance exceeded physically possible
  'rate_exceeded',       -- playback rate above video max
  'replay_detected',     -- heartbeat sequence number not monotonic
  'concurrent_session',  -- new session superseded an existing active one
  'cumulative_cap_hit',  -- cumulative credit ceiling reached
  'session_hijack',      -- heartbeat submitted against another user's session
  'position_anomaly'     -- position beyond duration or otherwise impossible
);

-- --------------------------------------------------------------------------
-- profiles — 1:1 with auth.users, created by trigger
-- --------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role       public.user_role NOT NULL DEFAULT 'student',
  full_name  TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create a profile whenever a user signs up.
-- SECURITY DEFINER because it writes into public.profiles on behalf of the
-- auth system; the calling user has no INSERT grant on profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''            -- hardened: fully qualify everything
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    -- role comes from signup metadata; anything unexpected falls back to student
    COALESCE(
      CASE NEW.raw_user_meta_data ->> 'role'
        WHEN 'teacher' THEN 'teacher'::public.user_role
        WHEN 'student' THEN 'student'::public.user_role
        ELSE NULL
      END,
      'student'::public.user_role
    ),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Role is set at signup / by service role only. A user must never be able to
-- promote themselves to teacher via a profile UPDATE.
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- auth.uid() is NULL for service-role calls, so only a user's own
  -- self-service UPDATE can satisfy this condition.
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() = NEW.id THEN
    RAISE EXCEPTION 'role changes are not permitted';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_no_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- --------------------------------------------------------------------------
-- classes / class_members
-- --------------------------------------------------------------------------
CREATE TABLE public.classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  join_code   TEXT NOT NULL UNIQUE
              DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX classes_teacher_idx ON public.classes (teacher_id);

CREATE TABLE public.class_members (
  class_id   UUID NOT NULL REFERENCES public.classes (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id)
);
CREATE INDEX class_members_student_idx ON public.class_members (student_id);

-- --------------------------------------------------------------------------
-- videos / assignments
-- --------------------------------------------------------------------------
CREATE TABLE public.videos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id        UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  source            public.video_source NOT NULL,
  external_id       TEXT NOT NULL,             -- YouTube video id or Drive file id
  title             TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  duration_seconds  NUMERIC(10,3) NOT NULL CHECK (duration_seconds > 0),
  max_playback_rate NUMERIC(3,2)  NOT NULL DEFAULT 2.0
                    CHECK (max_playback_rate BETWEEN 1.0 AND 4.0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, source, external_id)
);

CREATE TABLE public.assignments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID NOT NULL REFERENCES public.classes (id) ON DELETE CASCADE,
  video_id   UUID NOT NULL REFERENCES public.videos (id) ON DELETE CASCADE,
  due_at     TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, video_id)
);
CREATE INDEX assignments_video_idx ON public.assignments (video_id);

-- --------------------------------------------------------------------------
-- watch_sessions — one ACTIVE session per (assignment, student)
-- --------------------------------------------------------------------------
CREATE TABLE public.watch_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id     UUID NOT NULL REFERENCES public.assignments (id) ON DELETE CASCADE,
  student_id        UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  client_session_id TEXT NOT NULL,             -- client-generated tab/device id
  status            public.session_status NOT NULL DEFAULT 'active',
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_beat_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_position     NUMERIC(10,3) NOT NULL DEFAULT 0 CHECK (last_position >= 0),
  last_rate         NUMERIC(4,2)  NOT NULL DEFAULT 1.0,
  last_client_ts    TIMESTAMPTZ,               -- decorative: burst apportioning only
  heartbeat_seq     INT NOT NULL DEFAULT 0,    -- replay protection (monotonic)
  beat_count        INT NOT NULL DEFAULT 0,
  session_credited  NUMERIC(12,3) NOT NULL DEFAULT 0, -- credited seconds THIS session (cumulative cap)
  user_agent        TEXT,
  ip                INET,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX watch_sessions_one_active
  ON public.watch_sessions (assignment_id, student_id) WHERE status = 'active';
CREATE INDEX watch_sessions_student_idx ON public.watch_sessions (student_id);
CREATE INDEX watch_sessions_expiry_idx  ON public.watch_sessions (status, last_beat_at);

-- --------------------------------------------------------------------------
-- watched_intervals — merged numrange coverage, written only by RPC
-- --------------------------------------------------------------------------
CREATE TABLE public.watched_intervals (
  assignment_id UUID NOT NULL REFERENCES public.assignments (id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  interval      NUMRANGE NOT NULL CHECK (NOT isempty(interval)),
  PRIMARY KEY (assignment_id, student_id, interval)
);
CREATE INDEX watched_intervals_gist ON public.watched_intervals USING GIST (interval);

-- --------------------------------------------------------------------------
-- progress — DERIVED state. Never trust client-reported percentages.
-- --------------------------------------------------------------------------
CREATE TABLE public.progress (
  assignment_id    UUID NOT NULL REFERENCES public.assignments (id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  credited_seconds NUMERIC(12,3) NOT NULL DEFAULT 0,
  percent          NUMERIC(5,2)  NOT NULL DEFAULT 0 CHECK (percent BETWEEN 0 AND 100),
  max_position     NUMERIC(10,3) NOT NULL DEFAULT 0,
  completed_at     TIMESTAMPTZ,
  flag_count       INT NOT NULL DEFAULT 0,
  first_watched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_watched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (assignment_id, student_id)
);
CREATE INDEX progress_student_idx ON public.progress (student_id);

-- --------------------------------------------------------------------------
-- tamper_events — teacher-visible integrity feed
-- --------------------------------------------------------------------------
CREATE TABLE public.tamper_events (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id    UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.assignments (id) ON DELETE CASCADE,
  session_id    UUID REFERENCES public.watch_sessions (id) ON DELETE SET NULL,
  kind          public.tamper_kind NOT NULL,
  detail        JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tamper_events_assignment_idx ON public.tamper_events (assignment_id, created_at DESC);
CREATE INDEX tamper_events_student_idx    ON public.tamper_events (student_id, created_at DESC);

-- --------------------------------------------------------------------------
-- heartbeat_log — append-only forensic audit. No client access at all.
-- Partition by range on server_received_at once volume justifies it.
-- --------------------------------------------------------------------------
CREATE TABLE public.heartbeat_log (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id         UUID NOT NULL REFERENCES public.watch_sessions (id) ON DELETE CASCADE,
  student_id         UUID NOT NULL,
  assignment_id      UUID NOT NULL,
  seq                INT NOT NULL,
  position           NUMERIC(10,3) NOT NULL,
  rate               NUMERIC(4,2)  NOT NULL,
  client_ts          TIMESTAMPTZ,
  server_received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delta_real_ms      INT,
  advance            NUMERIC(10,3),
  credited_end       NUMERIC(10,3),
  flags              TEXT[] NOT NULL DEFAULT '{}'
);
CREATE INDEX heartbeat_log_session_idx ON public.heartbeat_log (session_id, server_received_at);
CREATE INDEX heartbeat_log_student_idx ON public.heartbeat_log (student_id, server_received_at);

-- ============================================================================
-- RLS helper functions (SECURITY DEFINER => no recursive-policy traps)
-- ============================================================================

-- Is the current user the teacher who owns this class?
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = p_class_id AND c.teacher_id = auth.uid()
  );
$$;

-- Is the current user an enrolled student of this class?
CREATE OR REPLACE FUNCTION public.is_class_member(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members cm
    WHERE cm.class_id = p_class_id AND cm.student_id = auth.uid()
  );
$$;

-- Is the current user the teacher of the class that owns this assignment?
CREATE OR REPLACE FUNCTION public.is_teacher_of_assignment(p_assignment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.classes c ON c.id = a.class_id
    WHERE a.id = p_assignment_id AND c.teacher_id = auth.uid()
  );
$$;

-- Is the current user a student enrolled in the class of this assignment?
CREATE OR REPLACE FUNCTION public.is_student_assigned(p_assignment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.class_members cm ON cm.class_id = a.class_id
    WHERE a.id = p_assignment_id AND cm.student_id = auth.uid()
  );
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watched_intervals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tamper_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heartbeat_log     ENABLE ROW LEVEL SECURITY;

-- profiles: see yourself; teachers see students enrolled in their classes
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.class_members cm
      JOIN public.classes c ON c.id = cm.class_id
      WHERE cm.student_id = profiles.id AND c.teacher_id = auth.uid()
    )
  );
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
-- (role changes blocked by trigger regardless of this policy)

-- classes: teacher owns; students see classes they belong to
CREATE POLICY classes_teacher_all ON public.classes FOR ALL TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE POLICY classes_student_select ON public.classes FOR SELECT TO authenticated
  USING (public.is_class_member(id));

-- class_members: teacher manages roster; student sees own memberships
CREATE POLICY class_members_teacher_all ON public.class_members FOR ALL TO authenticated
  USING (public.is_teacher_of_class(class_id))
  WITH CHECK (public.is_teacher_of_class(class_id));
CREATE POLICY class_members_student_select ON public.class_members FOR SELECT TO authenticated
  USING (student_id = auth.uid());
-- (students join via join_class_by_code RPC — no direct INSERT)

-- videos: teacher owns; students see videos assigned to their classes
CREATE POLICY videos_teacher_all ON public.videos FOR ALL TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE POLICY videos_student_select ON public.videos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.class_members cm ON cm.class_id = a.class_id
      WHERE a.video_id = videos.id AND cm.student_id = auth.uid()
    )
  );

-- assignments: teacher manages own classes; students see their class's assignments
CREATE POLICY assignments_teacher_all ON public.assignments FOR ALL TO authenticated
  USING (public.is_teacher_of_class(class_id))
  WITH CHECK (public.is_teacher_of_class(class_id));
CREATE POLICY assignments_student_select ON public.assignments FOR SELECT TO authenticated
  USING (public.is_class_member(class_id));

-- progress domain: SELECT own (student) or own class (teacher). NO write policies.
CREATE POLICY sessions_select ON public.watch_sessions FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_teacher_of_assignment(assignment_id));

CREATE POLICY intervals_select ON public.watched_intervals FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_teacher_of_assignment(assignment_id));

CREATE POLICY progress_select ON public.progress FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_teacher_of_assignment(assignment_id));

CREATE POLICY tamper_select ON public.tamper_events FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_teacher_of_assignment(assignment_id));

-- heartbeat_log: intentionally NO policies => invisible to all clients.

-- ============================================================================
-- Grants — the RPC is the ONLY write path into progress data
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes, public.videos, public.assignments
  TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.class_members TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Read-only for clients; writes happen exclusively inside SECURITY DEFINER RPCs
GRANT SELECT ON public.watch_sessions, public.watched_intervals, public.progress,
                public.tamper_events
  TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.watch_sessions, public.watched_intervals,
                                 public.progress, public.tamper_events
  FROM authenticated, anon;
REVOKE ALL ON public.heartbeat_log FROM authenticated, anon;

-- ============================================================================
-- Teacher dashboard view.
-- security_invoker: the querying teacher's RLS applies to every base table,
-- so a teacher can only ever see rows for classes they own.
-- ============================================================================
CREATE VIEW public.teacher_assignment_progress
  WITH (security_invoker = true) AS
SELECT
  a.id            AS assignment_id,
  a.class_id,
  c.name          AS class_name,
  v.title         AS video_title,
  v.duration_seconds,
  cm.student_id,
  p.full_name     AS student_name,
  COALESCE(pr.percent, 0)        AS percent,
  COALESCE(pr.credited_seconds, 0) AS credited_seconds,
  COALESCE(pr.flag_count, 0)     AS flag_count,
  pr.completed_at,
  pr.last_watched_at
FROM public.assignments a
JOIN public.classes c       ON c.id = a.class_id
JOIN public.videos v        ON v.id = a.video_id
JOIN public.class_members cm ON cm.class_id = a.class_id
JOIN public.profiles p      ON p.id = cm.student_id
LEFT JOIN public.progress pr
  ON pr.assignment_id = a.id AND pr.student_id = cm.student_id;

COMMIT;
