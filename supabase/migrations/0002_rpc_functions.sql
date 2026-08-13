-- ============================================================================
-- WaslaLearn — Migration 0002: RPC Functions (the ONLY write path)
-- ============================================================================
-- Every function that touches progress data is SECURITY DEFINER with an
-- empty search_path (all references fully qualified) so that:
--   * clients cannot write base tables directly (grants revoked in 0001)
--   * search_path hijacking against definer functions is impossible
-- Identity is ALWAYS derived from auth.uid() — never from a client argument.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- merge_intervals(assignment, student, start, end) -> numrange
-- --------------------------------------------------------------------------
-- Security role: INTERNAL helper (no client EXECUTE grant). Merges a newly
-- credited [start, end) range into the student's watched_intervals, absorbing
-- overlapping AND adjacent (-|-) ranges so coverage stays normalized.
-- Concurrency: the progress row acts as a per-(assignment, student) mutex,
-- serializing merges from concurrent sessions (multi-device).
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.merge_intervals(
  p_assignment_id UUID,
  p_student_id    UUID,
  p_new_start     NUMERIC,
  p_new_end       NUMERIC
)
RETURNS NUMRANGE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new    NUMRANGE := numrange(p_new_start, p_new_end, '[)');
  v_merged NUMRANGE := v_new;
  r        RECORD;
BEGIN
  IF p_new_end <= p_new_start THEN
    RETURN NULL;  -- nothing to credit (rewind, pause beat, fully-clamped skip)
  END IF;

  -- Ensure the mutex row exists, then lock it for the rest of the transaction.
  INSERT INTO public.progress (assignment_id, student_id)
  VALUES (p_assignment_id, p_student_id)
  ON CONFLICT (assignment_id, student_id) DO NOTHING;

  PERFORM 1 FROM public.progress
   WHERE assignment_id = p_assignment_id AND student_id = p_student_id
   FOR UPDATE;

  -- Absorb every range that overlaps or is adjacent to the new one.
  FOR r IN
    SELECT wi.interval
      FROM public.watched_intervals wi
     WHERE wi.assignment_id = p_assignment_id
       AND wi.student_id    = p_student_id
       AND (wi.interval && v_new OR wi.interval -|- v_new)
  LOOP
    v_merged := v_merged + r.interval;   -- range union
  END LOOP;

  DELETE FROM public.watched_intervals wi
   WHERE wi.assignment_id = p_assignment_id
     AND wi.student_id    = p_student_id
     AND (wi.interval && v_new OR wi.interval -|- v_new);

  INSERT INTO public.watched_intervals (assignment_id, student_id, interval)
  VALUES (p_assignment_id, p_student_id, v_merged);

  RETURN v_merged;
END;
$$;

-- --------------------------------------------------------------------------
-- calculate_coverage(assignment, student, duration) -> numeric seconds
-- --------------------------------------------------------------------------
-- Security role: INTERNAL helper. Total unique watched seconds = sum of range
-- lengths (ranges are pre-merged, so no double counting). Clamped to duration
-- when provided. Rewatching earns nothing: already-covered ranges don't grow.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_coverage(
  p_assignment_id UUID,
  p_student_id    UUID,
  p_duration      NUMERIC DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT LEAST(
           COALESCE(SUM(upper(wi.interval) - lower(wi.interval)), 0),
           COALESCE(p_duration, 'Infinity'::numeric)
         )
    FROM public.watched_intervals wi
   WHERE wi.assignment_id = p_assignment_id
     AND wi.student_id    = p_student_id;
$$;

-- --------------------------------------------------------------------------
-- start_watch_session(student, assignment, client_session, ua, ip) -> jsonb
-- --------------------------------------------------------------------------
-- Security role: validates enrollment, supersedes any other active session
-- for the same (assignment, student) — this is the multi-device/refresh
-- story — and returns everything the player needs, including the
-- SERVER-AUTHORITATIVE resume position (never trust a client-sent resume point).
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_watch_session(
  p_student_id        UUID,
  p_assignment_id     UUID,
  p_client_session_id TEXT,
  p_user_agent        TEXT DEFAULT NULL,
  p_ip                INET DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid        UUID := auth.uid();
  v_assignment RECORD;
  v_progress   RECORD;
  v_session_id UUID;
  v_superseded INT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'unauthenticated');
  END IF;
  -- The client may pass a student id, but it must match the JWT identity.
  IF p_student_id IS DISTINCT FROM v_uid THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'identity_mismatch');
  END IF;

  SELECT a.id, a.class_id, a.due_at,
         v.duration_seconds, v.max_playback_rate, v.source, v.external_id, v.title
    INTO v_assignment
    FROM public.assignments a
    JOIN public.videos v ON v.id = a.video_id
   WHERE a.id = p_assignment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'assignment_not_found');
  END IF;

  IF NOT public.is_class_member(v_assignment.class_id) THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'not_enrolled');
  END IF;

  -- One active session per student+assignment. A new session (refresh, second
  -- device) supersedes the old one; the event is logged for teacher visibility.
  UPDATE public.watch_sessions
     SET status = 'superseded'
   WHERE assignment_id = p_assignment_id
     AND student_id    = v_uid
     AND status        = 'active';
  GET DIAGNOSTICS v_superseded = ROW_COUNT;

  IF v_superseded > 0 THEN
    INSERT INTO public.tamper_events (student_id, assignment_id, kind, detail)
    VALUES (v_uid, p_assignment_id, 'concurrent_session',
            jsonb_build_object('superseded_count', v_superseded,
                               'new_client_session', p_client_session_id));
  END IF;

  INSERT INTO public.watch_sessions
    (assignment_id, student_id, client_session_id, user_agent, ip)
  VALUES
    (p_assignment_id, v_uid, p_client_session_id, p_user_agent, p_ip)
  RETURNING id INTO v_session_id;

  SELECT pr.percent, pr.max_position, pr.credited_seconds, pr.completed_at
    INTO v_progress
    FROM public.progress pr
   WHERE pr.assignment_id = p_assignment_id AND pr.student_id = v_uid;

  RETURN jsonb_build_object(
    'status',            'ok',
    'session_id',        v_session_id,
    'resume_position',   COALESCE(v_progress.max_position, 0),  -- server truth
    'percent',           COALESCE(v_progress.percent, 0),
    'credited_seconds',  COALESCE(v_progress.credited_seconds, 0),
    'already_completed', (v_progress.completed_at IS NOT NULL),
    'duration',          v_assignment.duration_seconds,
    'max_playback_rate', v_assignment.max_playback_rate,
    'source',            v_assignment.source,
    'external_id',       v_assignment.external_id,
    'title',             v_assignment.title,
    'due_at',            v_assignment.due_at,
    'server_time',       now()
  );
END;
$$;

-- --------------------------------------------------------------------------
-- submit_heartbeat(session, seq, position, rate, client_ts) -> jsonb
-- --------------------------------------------------------------------------
-- Security role: THE anti-skip validator. For every beat:
--   1. Lock the session row (serializes beats within a session).
--   2. Verify ownership (JWT identity == session owner) and active status.
--   3. Enforce monotonic seq (replay protection; equal seq = idempotent retry).
--   4. Compute Δreal from the SERVER clock only. Client timestamps are used
--      solely to apportion credit among burst-flushed beats after a network
--      outage — and even then the cumulative cap (server clock) bounds them.
--   5. Clamp rate to [0.25, max_playback_rate].
--   6. allowed_advance = Δreal × rate + FIXED_TOLERANCE.
--      Claimed more? CLAMP (don't reject), log tamper, return corrected pos.
--   7. Cumulative invariant: session_credited ≤ elapsed_server × max_rate + slack.
--   8. Merge credited range into watched_intervals; derive progress from
--      coverage — the client never reports a percentage.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_heartbeat(
  p_session_id       UUID,
  p_seq              INT,
  p_position         NUMERIC,
  p_rate             NUMERIC,
  p_client_timestamp TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  -- Tunables (server-side only; clients cannot influence them)
  c_tolerance    CONSTANT NUMERIC := 1.5;   -- fixed jitter/buffer slack per beat (s)
  c_max_beat_gap CONSTANT NUMERIC := 30;    -- max Δreal creditable in one beat (s)
  c_cum_slack    CONSTANT NUMERIC := 10;    -- cumulative-invariant slack (s)
  c_complete_pct CONSTANT NUMERIC := 95;    -- completion threshold (%)
  c_min_rate     CONSTANT NUMERIC := 0.25;

  v_uid          UUID := auth.uid();
  v_now          TIMESTAMPTZ := now();
  v_session      public.watch_sessions%ROWTYPE;
  v_duration     NUMERIC;
  v_max_rate     NUMERIC;
  v_rate         NUMERIC;
  v_position     NUMERIC;
  v_delta_server NUMERIC;
  v_delta_client NUMERIC;
  v_delta_eff    NUMERIC;
  v_allowed      NUMERIC;
  v_advance      NUMERIC;
  v_credit_start NUMERIC;
  v_credit_end   NUMERIC;
  v_cap          NUMERIC;
  v_credited     NUMERIC;
  v_percent      NUMERIC;
  v_completed    BOOLEAN;
  v_corrected    BOOLEAN := FALSE;
  v_flags        TEXT[]  := '{}';
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'unauthenticated');
  END IF;

  -- (1) Lock session row: serializes concurrent beats for this session.
  SELECT * INTO v_session
    FROM public.watch_sessions
   WHERE id = p_session_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'session_not_found');
  END IF;

  -- (2) Ownership: a session belongs to exactly one student.
  IF v_session.student_id <> v_uid THEN
    INSERT INTO public.tamper_events (student_id, assignment_id, session_id, kind, detail)
    VALUES (v_uid, v_session.assignment_id, p_session_id, 'session_hijack',
            jsonb_build_object('session_owner', v_session.student_id));
    RETURN jsonb_build_object('status', 'error', 'error', 'forbidden');
  END IF;

  IF v_session.status <> 'active' THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'session_not_active',
                              'session_status', v_session.status);
  END IF;

  -- (3) Replay protection.
  IF p_seq = v_session.heartbeat_seq THEN
    -- Idempotent retry of an already-processed beat (lost response): safe no-op.
    RETURN jsonb_build_object('status', 'duplicate',
                              'credited_position', v_session.last_position,
                              'server_time', v_now);
  ELSIF p_seq < v_session.heartbeat_seq THEN
    INSERT INTO public.tamper_events (student_id, assignment_id, session_id, kind, detail)
    VALUES (v_uid, v_session.assignment_id, p_session_id, 'replay_detected',
            jsonb_build_object('seq', p_seq, 'expected_gt', v_session.heartbeat_seq));
    RETURN jsonb_build_object('status', 'error', 'error', 'seq_violation');
  END IF;

  -- Video constraints
  SELECT v.duration_seconds, v.max_playback_rate
    INTO v_duration, v_max_rate
    FROM public.assignments a
    JOIN public.videos v ON v.id = a.video_id
   WHERE a.id = v_session.assignment_id;

  -- (5) Clamp rate; flag if the client claimed more than allowed.
  v_rate := GREATEST(c_min_rate, LEAST(p_rate, v_max_rate));
  IF p_rate > v_max_rate + 0.01 OR p_rate < c_min_rate THEN
    v_flags := v_flags || 'rate_exceeded';
    INSERT INTO public.tamper_events (student_id, assignment_id, session_id, kind, detail)
    VALUES (v_uid, v_session.assignment_id, p_session_id, 'rate_exceeded',
            jsonb_build_object('claimed_rate', p_rate, 'clamped_to', v_rate));
  END IF;

  v_position := GREATEST(p_position, 0);

  -- (4) Δreal from the server clock. Client deltas only apportion burst flushes.
  v_delta_server := EXTRACT(EPOCH FROM (v_now - v_session.last_beat_at));
  IF p_client_timestamp IS NOT NULL AND v_session.last_client_ts IS NOT NULL THEN
    v_delta_client := EXTRACT(EPOCH FROM (p_client_timestamp - v_session.last_client_ts));
  END IF;

  IF v_delta_client IS NOT NULL AND v_delta_server < 2 THEN
    -- Burst flush after network loss: server can't see intra-burst elapsed
    -- time, so apportion by client deltas — bounded per-beat by c_max_beat_gap
    -- and globally by the cumulative invariant below.
    v_delta_eff := LEAST(GREATEST(v_delta_client, 0), c_max_beat_gap);
  ELSE
    v_delta_eff := LEAST(v_delta_server, c_max_beat_gap);
  END IF;

  -- (6) Per-beat physical-possibility check.
  v_allowed      := v_delta_eff * v_rate + c_tolerance;
  v_advance      := v_position - v_session.last_position;
  v_credit_start := v_session.last_position;
  v_credit_end   := v_credit_start;   -- default: no new credit

  IF v_advance < 0 THEN
    -- Rewind: always legal, earns nothing. Large rewinds noted in the audit log.
    IF v_advance < -60 THEN
      v_flags := v_flags || 'large_rewind';
    END IF;
  ELSIF v_advance <= v_allowed THEN
    v_credit_end := LEAST(v_position, v_duration);
  ELSE
    -- SKIP ATTEMPT: clamp to what was physically possible, log, correct client.
    v_credit_end := LEAST(v_credit_start + v_allowed, v_duration);
    v_corrected  := TRUE;
    v_flags      := v_flags || 'skip_attempt';
    INSERT INTO public.tamper_events (student_id, assignment_id, session_id, kind, detail)
    VALUES (v_uid, v_session.assignment_id, p_session_id, 'skip_attempt',
            jsonb_build_object('last_position', v_session.last_position,
                               'claimed_position', v_position,
                               'advance', v_advance,
                               'allowed', v_allowed,
                               'delta_server_s', v_delta_server,
                               'claimed_rate', p_rate));
  END IF;

  IF v_position > v_duration + c_tolerance THEN
    v_flags := v_flags || 'position_beyond_duration';
    INSERT INTO public.tamper_events (student_id, assignment_id, session_id, kind, detail)
    VALUES (v_uid, v_session.assignment_id, p_session_id, 'position_anomaly',
            jsonb_build_object('claimed_position', v_position, 'duration', v_duration));
  END IF;

  -- (7) Cumulative invariant: this session can never credit faster than
  -- max_rate × server-measured elapsed time, no matter what any beat claims.
  v_cap := EXTRACT(EPOCH FROM (v_now - v_session.started_at)) * v_max_rate + c_cum_slack;
  IF v_credit_end > v_credit_start
     AND v_session.session_credited + (v_credit_end - v_credit_start) > v_cap THEN
    v_credit_end := v_credit_start
                    + GREATEST(0, v_cap - v_session.session_credited);
    v_corrected  := TRUE;
    v_flags      := v_flags || 'cumulative_cap_hit';
    INSERT INTO public.tamper_events (student_id, assignment_id, session_id, kind, detail)
    VALUES (v_uid, v_session.assignment_id, p_session_id, 'cumulative_cap_hit',
            jsonb_build_object('session_credited', v_session.session_credited,
                               'cap', v_cap));
  END IF;

  -- (8) Merge credit and derive progress from actual coverage.
  IF v_credit_end > v_credit_start THEN
    PERFORM public.merge_intervals(v_session.assignment_id, v_uid,
                                   v_credit_start, v_credit_end);
  END IF;

  v_credited  := public.calculate_coverage(v_session.assignment_id, v_uid, v_duration);
  v_percent   := LEAST(100, ROUND(v_credited / v_duration * 100, 2));
  v_completed := v_percent >= c_complete_pct;

  UPDATE public.progress pr
     SET credited_seconds = v_credited,
         percent          = v_percent,
         max_position     = GREATEST(pr.max_position, v_credit_end),
         completed_at     = CASE WHEN v_completed THEN COALESCE(pr.completed_at, v_now)
                                 ELSE pr.completed_at END,
         flag_count       = pr.flag_count + cardinality(v_flags),
         last_watched_at  = v_now
   WHERE pr.assignment_id = v_session.assignment_id
     AND pr.student_id    = v_uid;

  -- Session bookkeeping. last_position tracks the player's ACTUAL position
  -- (clamped to duration) so the next beat measures from reality.
  UPDATE public.watch_sessions
     SET last_beat_at     = v_now,
         last_position    = LEAST(v_position, v_duration),
         last_rate        = v_rate,
         last_client_ts   = COALESCE(p_client_timestamp, v_session.last_client_ts),
         heartbeat_seq    = p_seq,
         beat_count       = beat_count + 1,
         session_credited = session_credited + GREATEST(0, v_credit_end - v_credit_start),
         status           = CASE WHEN v_completed THEN 'completed'::public.session_status
                                 ELSE status END
   WHERE id = p_session_id;

  -- Append-only forensic audit.
  INSERT INTO public.heartbeat_log
    (session_id, student_id, assignment_id, seq, position, rate, client_ts,
     delta_real_ms, advance, credited_end, flags)
  VALUES
    (p_session_id, v_uid, v_session.assignment_id, p_seq, v_position, v_rate,
     p_client_timestamp, (v_delta_server * 1000)::INT, v_advance, v_credit_end, v_flags);

  RETURN jsonb_build_object(
    'status',            'ok',
    'credited_position', v_credit_end,
    'corrected',         v_corrected,
    'percent',           v_percent,
    'credited_seconds',  v_credited,
    'completed',         v_completed,
    'flags',             v_flags,
    'server_time',       v_now
  );
END;
$$;

-- --------------------------------------------------------------------------
-- get_student_progress(student, assignment) -> jsonb
-- --------------------------------------------------------------------------
-- Security role: read path for the student (own data) or the owning teacher.
-- Returns derived progress + merged intervals + tamper summary.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_student_progress(
  p_student_id    UUID,
  p_assignment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid      UUID := auth.uid();
  v_is_teacher BOOLEAN;
  v_progress RECORD;
  v_intervals JSONB;
  v_tampers  JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'unauthenticated');
  END IF;

  v_is_teacher := public.is_teacher_of_assignment(p_assignment_id);
  IF v_uid <> p_student_id AND NOT v_is_teacher THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'forbidden');
  END IF;

  SELECT pr.* INTO v_progress
    FROM public.progress pr
   WHERE pr.assignment_id = p_assignment_id AND pr.student_id = p_student_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'start', lower(wi.interval), 'end', upper(wi.interval))
           ORDER BY lower(wi.interval)), '[]'::jsonb)
    INTO v_intervals
    FROM public.watched_intervals wi
   WHERE wi.assignment_id = p_assignment_id AND wi.student_id = p_student_id;

  -- Tamper detail is teacher-facing; students only see their own flag count.
  v_tampers := '[]'::jsonb;
  IF v_is_teacher THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'kind', te.kind, 'detail', te.detail, 'at', te.created_at)
             ORDER BY te.created_at DESC), '[]'::jsonb)
      INTO v_tampers
      FROM public.tamper_events te
     WHERE te.assignment_id = p_assignment_id AND te.student_id = p_student_id;
  END IF;

  RETURN jsonb_build_object(
    'status',           'ok',
    'percent',          COALESCE(v_progress.percent, 0),
    'credited_seconds', COALESCE(v_progress.credited_seconds, 0),
    'max_position',     COALESCE(v_progress.max_position, 0),
    'completed_at',     v_progress.completed_at,
    'flag_count',       COALESCE(v_progress.flag_count, 0),
    'last_watched_at',  v_progress.last_watched_at,
    'intervals',        v_intervals,
    'tamper_events',    v_tampers
  );
END;
$$;

-- --------------------------------------------------------------------------
-- expire_old_sessions() -> int
-- --------------------------------------------------------------------------
-- Security role: maintenance job (pg_cron / scheduled Edge Function, called
-- as service_role — NOT granted to authenticated). Sessions idle > 30 min are
-- expired so a stale tab can't resume crediting hours later.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_old_sessions()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE public.watch_sessions
     SET status = 'expired'
   WHERE status = 'active'
     AND last_beat_at < now() - INTERVAL '30 minutes';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- --------------------------------------------------------------------------
-- join_class_by_code(code) -> jsonb
-- --------------------------------------------------------------------------
-- Security role: the ONLY way a student enrolls (no direct INSERT grant on
-- class_members). Validates the code, rejects archived classes and
-- teachers joining their own class as a student.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_class_by_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid   UUID := auth.uid();
  v_class RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'unauthenticated');
  END IF;

  SELECT c.id, c.name, c.teacher_id, c.archived_at
    INTO v_class
    FROM public.classes c
   WHERE c.join_code = upper(trim(p_code));

  IF NOT FOUND OR v_class.archived_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'invalid_code');
  END IF;

  IF v_class.teacher_id = v_uid THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'teacher_cannot_join_own_class');
  END IF;

  INSERT INTO public.class_members (class_id, student_id)
  VALUES (v_class.id, v_uid)
  ON CONFLICT (class_id, student_id) DO NOTHING;

  RETURN jsonb_build_object('status', 'ok', 'class_id', v_class.id, 'class_name', v_class.name);
END;
$$;

-- ============================================================================
-- EXECUTE grants: default PUBLIC execute is revoked; only the intended roles
-- keep access. Helper functions get NO client grant (RPC-internal only).
-- ============================================================================
REVOKE EXECUTE ON FUNCTION public.merge_intervals(UUID, UUID, NUMERIC, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_coverage(UUID, UUID, NUMERIC)      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_old_sessions()                        FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.expire_old_sessions() TO service_role;

REVOKE EXECUTE ON FUNCTION public.start_watch_session(UUID, UUID, TEXT, TEXT, INET)        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_heartbeat(UUID, INT, NUMERIC, NUMERIC, TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_student_progress(UUID, UUID)                           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_class_by_code(TEXT)                                   FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.start_watch_session(UUID, UUID, TEXT, TEXT, INET)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_heartbeat(UUID, INT, NUMERIC, NUMERIC, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_progress(UUID, UUID)                           TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(TEXT)                                   TO authenticated;

COMMIT;
