-- ============================================================================
-- WaslaLearn — Migration 0004: Innovation RPCs (Tiers 1–5)
-- ============================================================================
-- Replaces v1 session/heartbeat functions with v2 signatures (DROP + CREATE;
-- grants re-issued at the bottom). New capabilities:
--   * challenge-response binding per beat (rotating nonce, anti-replay)
--   * honeytoken beat intervals (server-dictated timing, bot detection)
--   * inter-arrival entropy + interaction counting -> human_likelihood score
--   * per-student rate limiting from the event stream
--   * server-side IP extraction + mid-session change detection
--   * fingerprint consistency, dead-man's-switch, unusual-hours signals
--   * comprehension-gated progress (mandatory quiz checkpoints clamp credit)
--   * hash-chained append-only event log (tamper-evident audit)
--   * streaks, engagement heatmap, behavioral report, chain verification
-- All functions: SECURITY DEFINER, search_path = '', identity from auth.uid().
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- raise_flag_once(session, kind, detail) — internal helper
-- --------------------------------------------------------------------------
-- Security role: dedupes soft tamper signals so a persistent condition (e.g.
-- hidden tab) produces ONE tamper_events row per session, not hundreds.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.raise_flag_once(
  p_session_id UUID,
  p_kind       public.tamper_kind,
  p_detail     JSONB DEFAULT '{}'
)
RETURNS BOOLEAN   -- TRUE if the flag was newly raised
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_session public.watch_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.watch_sessions WHERE id = p_session_id;
  IF NOT FOUND OR v_session.raised_flags @> ARRAY[p_kind::text] THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.tamper_events (student_id, assignment_id, session_id, kind, detail)
  VALUES (v_session.student_id, v_session.assignment_id, p_session_id, p_kind, p_detail);

  UPDATE public.watch_sessions
     SET raised_flags = raised_flags || p_kind::text
   WHERE id = p_session_id;
  RETURN TRUE;
END;
$$;

-- --------------------------------------------------------------------------
-- request_ip() — internal helper
-- --------------------------------------------------------------------------
-- Security role: extracts the client IP from the PostgREST-forwarded header
-- SERVER-SIDE. The client never sends its IP as a parameter (it would lie).
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_ip()
RETURNS INET
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_headers JSONB;
  v_fwd     TEXT;
BEGIN
  v_headers := current_setting('request.headers', true)::jsonb;
  v_fwd := v_headers ->> 'x-forwarded-for';
  IF v_fwd IS NULL THEN RETURN NULL; END IF;
  RETURN split_part(v_fwd, ',', 1)::inet;  -- first hop = original client
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- --------------------------------------------------------------------------
-- start_watch_session v2
-- --------------------------------------------------------------------------
-- Security role: as v1 (enrollment check, supersede, server-authoritative
-- resume) PLUS: issues the first challenge nonce, captures browser
-- fingerprint + server-side IP, and applies the unusual-hours soft signal
-- from the student's behavioral profile.
-- --------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.start_watch_session(UUID, UUID, TEXT, TEXT, INET);

CREATE FUNCTION public.start_watch_session(
  p_student_id        UUID,
  p_assignment_id     UUID,
  p_client_session_id TEXT,
  p_user_agent        TEXT DEFAULT NULL,
  p_fingerprint       TEXT DEFAULT NULL
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
  v_profile    RECORD;
  v_session_id UUID;
  v_nonce      TEXT;
  v_ip         INET;
  v_hour       INT;
  v_superseded INT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'unauthenticated');
  END IF;
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

  v_nonce := encode(extensions.gen_random_bytes(16), 'hex');
  v_ip    := public.request_ip();

  INSERT INTO public.watch_sessions
    (assignment_id, student_id, client_session_id, user_agent, ip, last_ip,
     challenge_nonce, fingerprint_hash)
  VALUES
    (p_assignment_id, v_uid, p_client_session_id, p_user_agent, v_ip, v_ip,
     v_nonce, p_fingerprint)
  RETURNING id INTO v_session_id;

  -- Unusual-hours soft signal (only once the student has a baseline)
  SELECT * INTO v_profile FROM public.behavioral_profiles WHERE student_id = v_uid;
  IF FOUND AND v_profile.sessions_analyzed >= 5 THEN
    v_hour := EXTRACT(HOUR FROM now())::int;
    IF NOT (v_profile.typical_hours @> ARRAY[v_hour]) THEN
      PERFORM public.raise_flag_once(v_session_id, 'unusual_hours',
              jsonb_build_object('hour', v_hour, 'typical', v_profile.typical_hours));
    END IF;
  END IF;

  SELECT pr.percent, pr.max_position, pr.credited_seconds, pr.completed_at
    INTO v_progress
    FROM public.progress pr
   WHERE pr.assignment_id = p_assignment_id AND pr.student_id = v_uid;

  RETURN jsonb_build_object(
    'status',            'ok',
    'session_id',        v_session_id,
    'challenge_nonce',   v_nonce,          -- client must bind this into beat #1
    'beat_interval_ms',  5000,
    'resume_position',   COALESCE(v_progress.max_position, 0),
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
-- submit_heartbeat v2 — the core validator
-- --------------------------------------------------------------------------
-- Security role: everything v1 did (ownership, seq monotonicity, server-clock
-- Δreal, rate clamp, per-beat clamp, cumulative invariant, interval merge,
-- derived progress) PLUS, in order:
--   0. Rate limit: max 30 beats/min/student (from the event stream).
--   1. Challenge-response: p_challenge_response must equal
--      sha256_hex(nonce || ':' || seq || ':' || floor(position*1000)).
--      Binds every beat to fresh server state => replay & precompute die here.
--   2. Honeytoken: periodic beats must roughly follow the server-dictated
--      interval from the previous response. 2+ misses => honeytoken_failed.
--   3. IP / fingerprint consistency (soft, raise-once).
--   4. Dead man's switch: position advancing while tab hidden, zero
--      interactions, long session => bot signal.
--   5. Checkpoint gating: credit is clamped at the first unanswered
--      mandatory quiz timestamp. Progress literally cannot advance past a
--      checkpoint the student hasn't answered correctly.
--   6. Hash-chained event append (tamper-evident audit).
--   7. Human-likelihood score update (advisory; teacher-facing).
-- --------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.submit_heartbeat(UUID, INT, NUMERIC, NUMERIC, TIMESTAMPTZ);

CREATE FUNCTION public.submit_heartbeat(
  p_session_id         UUID,
  p_seq                INT,
  p_position           NUMERIC,
  p_rate               NUMERIC,
  p_client_timestamp   TIMESTAMPTZ DEFAULT NULL,
  p_kind               TEXT DEFAULT 'periodic',   -- 'periodic' | 'event'
  p_event              TEXT DEFAULT NULL,          -- 'play'|'pause'|'seeked'|'ratechange'|'visibilitychange'
  p_visibility         TEXT DEFAULT 'visible',     -- 'visible' | 'hidden'
  p_fingerprint        TEXT DEFAULT NULL,
  p_challenge_response TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  c_tolerance    CONSTANT NUMERIC := 1.5;
  c_max_beat_gap CONSTANT NUMERIC := 30;
  c_cum_slack    CONSTANT NUMERIC := 10;
  c_complete_pct CONSTANT NUMERIC := 95;
  c_min_rate     CONSTANT NUMERIC := 0.25;
  c_rate_limit   CONSTANT INT     := 30;     -- beats/min/student
  c_entropy_min  CONSTANT NUMERIC := 1.0;    -- bits, over 500ms buckets

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
  v_flags        TEXT[] := '{}';
  -- v2
  v_recent       INT;
  v_expected_resp TEXT;
  v_new_nonce    TEXT;
  v_next_interval INT;
  v_inter_ms     INT;
  v_arr          INT[];
  v_entropy      NUMERIC;
  v_ip           INET;
  v_checkpoint   NUMERIC;
  v_score        NUMERIC;
  v_payload      JSONB;
  v_hash         TEXT;
  v_prev_hash    TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'unauthenticated');
  END IF;

  -- (0) Rate limit — before any state mutation.
  SELECT count(*) INTO v_recent
    FROM public.events
   WHERE student_id = v_uid AND server_ts > v_now - INTERVAL '1 minute';
  IF v_recent >= c_rate_limit THEN
    SELECT * INTO v_session FROM public.watch_sessions WHERE id = p_session_id;
    IF FOUND THEN
      PERFORM public.raise_flag_once(p_session_id, 'rate_limited',
              jsonb_build_object('beats_last_min', v_recent));
    END IF;
    RETURN jsonb_build_object('status', 'error', 'error', 'rate_limited',
                              'retry_after_s', 60);
  END IF;

  SELECT * INTO v_session
    FROM public.watch_sessions
   WHERE id = p_session_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'session_not_found');
  END IF;

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

  -- Replay protection (idempotent retry tolerated, older seq flagged)
  IF p_seq = v_session.heartbeat_seq THEN
    RETURN jsonb_build_object('status', 'duplicate',
                              'credited_position', v_session.last_position,
                              'server_time', v_now);
  ELSIF p_seq < v_session.heartbeat_seq THEN
    INSERT INTO public.tamper_events (student_id, assignment_id, session_id, kind, detail)
    VALUES (v_uid, v_session.assignment_id, p_session_id, 'replay_detected',
            jsonb_build_object('seq', p_seq, 'expected_gt', v_session.heartbeat_seq));
    RETURN jsonb_build_object('status', 'error', 'error', 'seq_violation');
  END IF;

  -- (1) Challenge-response verification
  v_position := GREATEST(p_position, 0);
  v_expected_resp := encode(extensions.digest(
    v_session.challenge_nonce || ':' || p_seq || ':' || floor(v_position * 1000)::bigint,
    'sha256'), 'hex');
  IF p_challenge_response IS DISTINCT FROM v_expected_resp THEN
    INSERT INTO public.tamper_events (student_id, assignment_id, session_id, kind, detail)
    VALUES (v_uid, v_session.assignment_id, p_session_id, 'pow_failed',
            jsonb_build_object('seq', p_seq));
    RETURN jsonb_build_object('status', 'error', 'error', 'challenge_failed');
  END IF;

  v_delta_server := EXTRACT(EPOCH FROM (v_now - v_session.last_beat_at));

  -- (2) Honeytoken: did a PERIODIC beat follow the server-dictated interval?
  -- Event beats are exempt (user actions arrive off-schedule by definition).
  IF p_kind = 'periodic' AND v_session.beat_count > 0 THEN
    v_inter_ms := (v_delta_server * 1000)::int;
    IF abs(v_inter_ms - v_session.expected_interval_ms) > 1500
       AND abs(v_inter_ms - 5000) < 500
       AND v_session.expected_interval_ms <> 5000 THEN
      -- Client ignored our interval and kept its hardcoded 5s loop.
      UPDATE public.watch_sessions
         SET honeytoken_failures = honeytoken_failures + 1
       WHERE id = p_session_id;
      IF v_session.honeytoken_failures + 1 >= 2 THEN
        PERFORM public.raise_flag_once(p_session_id, 'honeytoken_failed',
                jsonb_build_object('expected_ms', v_session.expected_interval_ms,
                                   'actual_ms', v_inter_ms));
        v_flags := v_flags || 'honeytoken_failed';
      END IF;
    END IF;
    -- Maintain the inter-arrival ring buffer (cap 20) for entropy analysis.
    v_arr := v_session.inter_arrivals || v_inter_ms;
    IF array_length(v_arr, 1) > 20 THEN
      v_arr := v_arr[2:array_length(v_arr, 1)];
    END IF;
  ELSE
    v_arr := v_session.inter_arrivals;
  END IF;

  -- (3) IP / fingerprint consistency (soft, raise-once)
  v_ip := public.request_ip();
  IF v_ip IS NOT NULL AND v_session.last_ip IS NOT NULL AND v_ip <> v_session.last_ip THEN
    PERFORM public.raise_flag_once(p_session_id, 'ip_changed',
            jsonb_build_object('from', v_session.last_ip, 'to', v_ip));
    v_flags := v_flags || 'ip_changed';
  END IF;
  IF p_fingerprint IS NOT NULL AND v_session.fingerprint_hash IS NOT NULL
     AND p_fingerprint <> v_session.fingerprint_hash THEN
    PERFORM public.raise_flag_once(p_session_id, 'fingerprint_change', '{}'::jsonb);
    v_flags := v_flags || 'fingerprint_change';
  END IF;

  -- Video constraints
  SELECT v.duration_seconds, v.max_playback_rate
    INTO v_duration, v_max_rate
    FROM public.assignments a
    JOIN public.videos v ON v.id = a.video_id
   WHERE a.id = v_session.assignment_id;

  -- Rate clamp
  v_rate := GREATEST(c_min_rate, LEAST(p_rate, v_max_rate));
  IF p_rate > v_max_rate + 0.01 OR p_rate < c_min_rate THEN
    v_flags := v_flags || 'rate_exceeded';
    INSERT INTO public.tamper_events (student_id, assignment_id, session_id, kind, detail)
    VALUES (v_uid, v_session.assignment_id, p_session_id, 'rate_exceeded',
            jsonb_build_object('claimed_rate', p_rate, 'clamped_to', v_rate));
  END IF;

  -- Δreal: server clock; client deltas only apportion burst flushes
  IF p_client_timestamp IS NOT NULL AND v_session.last_client_ts IS NOT NULL THEN
    v_delta_client := EXTRACT(EPOCH FROM (p_client_timestamp - v_session.last_client_ts));
  END IF;
  IF v_delta_client IS NOT NULL AND v_delta_server < 2 THEN
    v_delta_eff := LEAST(GREATEST(v_delta_client, 0), c_max_beat_gap);
  ELSE
    v_delta_eff := LEAST(v_delta_server, c_max_beat_gap);
  END IF;

  -- Per-beat physical-possibility check (clamp, don't reject)
  v_allowed      := v_delta_eff * v_rate + c_tolerance;
  v_advance      := v_position - v_session.last_position;
  v_credit_start := v_session.last_position;
  v_credit_end   := v_credit_start;

  IF v_advance < 0 THEN
    IF v_advance < -60 THEN v_flags := v_flags || 'large_rewind'; END IF;
  ELSIF v_advance <= v_allowed THEN
    v_credit_end := LEAST(v_position, v_duration);
  ELSE
    v_credit_end := LEAST(v_credit_start + v_allowed, v_duration);
    v_corrected  := TRUE;
    v_flags      := v_flags || 'skip_attempt';
    INSERT INTO public.tamper_events (student_id, assignment_id, session_id, kind, detail)
    VALUES (v_uid, v_session.assignment_id, p_session_id, 'skip_attempt',
            jsonb_build_object('last_position', v_session.last_position,
                               'claimed_position', v_position,
                               'advance', v_advance, 'allowed', v_allowed,
                               'delta_server_s', v_delta_server, 'claimed_rate', p_rate));
  END IF;

  IF v_position > v_duration + c_tolerance THEN
    v_flags := v_flags || 'position_beyond_duration';
    PERFORM public.raise_flag_once(p_session_id, 'position_anomaly',
            jsonb_build_object('claimed_position', v_position, 'duration', v_duration));
  END IF;

  -- Cumulative invariant (server clock × max_rate ceiling)
  v_cap := EXTRACT(EPOCH FROM (v_now - v_session.started_at)) * v_max_rate + c_cum_slack;
  IF v_credit_end > v_credit_start
     AND v_session.session_credited + (v_credit_end - v_credit_start) > v_cap THEN
    v_credit_end := v_credit_start + GREATEST(0, v_cap - v_session.session_credited);
    v_corrected  := TRUE;
    v_flags      := v_flags || 'cumulative_cap_hit';
    PERFORM public.raise_flag_once(p_session_id, 'cumulative_cap_hit',
            jsonb_build_object('session_credited', v_session.session_credited, 'cap', v_cap));
  END IF;

  -- (5) CHECKPOINT GATING: credit stops at the first unanswered mandatory quiz.
  SELECT min(q.video_time) INTO v_checkpoint
    FROM public.auto_quizzes q
   WHERE q.assignment_id = v_session.assignment_id
     AND q.is_mandatory
     AND q.video_time > v_credit_start
     AND q.video_time <= v_credit_end
     AND NOT EXISTS (
       SELECT 1 FROM public.quiz_responses qr
       WHERE qr.quiz_id = q.id AND qr.student_id = v_uid AND qr.is_correct
     );
  IF v_checkpoint IS NOT NULL THEN
    v_credit_end := v_checkpoint;
    v_flags := v_flags || 'checkpoint_pending';
  END IF;

  -- Merge credit + derive progress from coverage
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

  IF v_completed AND v_session.status = 'active' THEN
    PERFORM public.calculate_streak(v_uid);
  END IF;

  -- (4) Dead man's switch: advancing position while hidden, zero interactions
  IF p_visibility = 'hidden' THEN
    UPDATE public.watch_sessions SET hidden_beats = hidden_beats + 1 WHERE id = p_session_id;
  ELSE
    UPDATE public.watch_sessions SET visibility_seen = TRUE WHERE id = p_session_id;
  END IF;
  IF p_kind = 'event' THEN
    UPDATE public.watch_sessions
       SET interaction_count = interaction_count + 1 WHERE id = p_session_id;
  END IF;

  -- Entropy over the inter-arrival ring (periodic beats only)
  IF array_length(v_arr, 1) IS NOT NULL AND array_length(v_arr, 1) >= 15 THEN
    SELECT COALESCE(-SUM(p * ln(p) / ln(2)), 0) INTO v_entropy
      FROM (SELECT count(*)::numeric / array_length(v_arr, 1) AS p
              FROM unnest(v_arr) AS x
             GROUP BY floor(x / 500.0)) t;
    -- Perfectly regular intervals AND zero interactions over 15+ beats = script
    IF v_entropy < c_entropy_min AND v_session.interaction_count = 0 THEN
      PERFORM public.raise_flag_once(p_session_id, 'entropy_low',
              jsonb_build_object('entropy_bits', round(v_entropy, 3),
                                 'interactions', v_session.interaction_count));
      v_flags := v_flags || 'entropy_low';
    END IF;
  END IF;

  IF v_session.hidden_beats > 100 AND v_session.interaction_count = 0 THEN
    PERFORM public.raise_flag_once(p_session_id, 'dead_mans_switch',
            jsonb_build_object('hidden_beats', v_session.hidden_beats));
    v_flags := v_flags || 'dead_mans_switch';
  END IF;

  -- (7) Human-likelihood score (advisory heuristic, 0-100)
  v_score := 50
    + LEAST(v_session.interaction_count, 5) * 6
    + CASE WHEN v_entropy IS NULL THEN 0
           WHEN v_entropy >= 1.5 THEN 10
           WHEN v_entropy >= c_entropy_min THEN 5
           ELSE -10 END
    - v_session.honeytoken_failures * 10
    + CASE WHEN v_session.visibility_seen OR p_visibility = 'visible' THEN 5 ELSE 0 END
    - cardinality(v_flags) * 5;
  v_score := GREATEST(0, LEAST(100, v_score));

  -- Rotate challenge + derive the next honeytoken interval in [4000, 8000).
  -- Derived from the fresh nonce: unpredictable to the client, deterministic
  -- for us (no extra state needed beyond what we already store).
  v_new_nonce     := encode(extensions.gen_random_bytes(16), 'hex');
  v_next_interval := 4000 + (('x' || substr(v_new_nonce, 1, 8))::bit(32)::bigint % 4000);

  -- (6) Hash-chained event append — the immutable audit record for this beat.
  v_prev_hash := COALESCE(v_session.last_event_hash, 'GENESIS');
  v_payload := jsonb_build_object(
    'seq', p_seq, 'position', v_position, 'rate', v_rate,
    'client_ts', p_client_timestamp, 'kind', p_kind, 'event', p_event,
    'visibility', p_visibility, 'advance', v_advance,
    'prev_rate', v_session.last_rate,
    'credited_end', v_credit_end, 'flags', v_flags);
  v_hash := encode(extensions.digest(
    v_prev_hash || '|' || v_payload::text || '|' || v_now::text, 'sha256'), 'hex');

  INSERT INTO public.events
    (session_id, student_id, assignment_id, seq, kind, payload, server_ts, prev_hash, event_hash)
  VALUES
    (p_session_id, v_uid, v_session.assignment_id, p_seq, p_kind, v_payload, v_now, v_prev_hash, v_hash);

  -- Session bookkeeping (single update; last_position tracks the player's
  -- ACTUAL position so the next beat measures from reality).
  UPDATE public.watch_sessions
     SET last_beat_at         = v_now,
         last_position        = LEAST(v_position, v_duration),
         last_rate            = v_rate,
         last_client_ts       = COALESCE(p_client_timestamp, v_session.last_client_ts),
         heartbeat_seq        = p_seq,
         beat_count           = beat_count + 1,
         session_credited     = session_credited + GREATEST(0, v_credit_end - v_credit_start),
         status               = CASE WHEN v_completed THEN 'completed'::public.session_status
                                     ELSE status END,
         challenge_nonce      = v_new_nonce,
         expected_interval_ms = v_next_interval,
         inter_arrivals       = v_arr,
         human_score          = v_score,
         last_ip              = COALESCE(v_ip, last_ip),
         last_event_hash      = v_hash
   WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'status',             'ok',
    'credited_position',  v_credit_end,
    'corrected',          v_corrected,
    'percent',            v_percent,
    'credited_seconds',   v_credited,
    'completed',          v_completed,
    'flags',              v_flags,
    'checkpoint_pending', v_checkpoint,   -- non-null: player must pause + quiz here
    'challenge_nonce',    v_new_nonce,    -- bind into the NEXT beat
    'next_beat_in_ms',    v_next_interval, -- honeytoken: client MUST wait ~this long
    'server_time',        v_now
  );
END;
$$;

-- --------------------------------------------------------------------------
-- calculate_streak(student) -> jsonb
-- --------------------------------------------------------------------------
-- Security role: called by submit_heartbeat on completion (and safe to call
-- directly). Streak logic: same day => no-op; yesterday => increment;
-- otherwise reset to 1. Also refreshes the behavioral baseline.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_streak(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today DATE := current_date;
  v_row   public.streaks%ROWTYPE;
BEGIN
  -- Callable internally (any student) or by the user themselves; never for others.
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_student_id THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'forbidden');
  END IF;
  INSERT INTO public.streaks (student_id, current_streak, longest_streak, last_active_date)
  VALUES (p_student_id, 1, 1, v_today)
  ON CONFLICT (student_id) DO NOTHING;

  SELECT * INTO v_row FROM public.streaks WHERE student_id = p_student_id FOR UPDATE;

  IF v_row.last_active_date < v_today THEN
    UPDATE public.streaks
       SET current_streak   = CASE WHEN v_row.last_active_date = v_today - 1
                                   THEN v_row.current_streak + 1 ELSE 1 END,
           longest_streak   = GREATEST(v_row.longest_streak,
                                       CASE WHEN v_row.last_active_date = v_today - 1
                                            THEN v_row.current_streak + 1 ELSE 1 END),
           last_active_date = v_today,
           updated_at       = now()
     WHERE student_id = p_student_id
    RETURNING * INTO v_row;
  END IF;

  PERFORM public.update_behavioral_profile(p_student_id);

  RETURN jsonb_build_object('status', 'ok',
                            'current_streak', v_row.current_streak,
                            'longest_streak', v_row.longest_streak);
END;
$$;

-- --------------------------------------------------------------------------
-- update_behavioral_profile(student) — internal
-- --------------------------------------------------------------------------
-- Security role: rebuilds a student's cross-session baseline from finished
-- sessions. Powers the unusual-hours signal and the teacher's learning
-- profile view. Runs on completion; never client-callable.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_behavioral_profile(p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.behavioral_profiles AS bp
    (student_id, sessions_analyzed, avg_consumption_rate, typical_hours,
     avg_human_score, updated_at)
  SELECT
    p_student_id,
    count(*),
    COALESCE(avg(s.last_rate), 1.0),
    COALESCE((SELECT array_agg(h) FROM (
               SELECT EXTRACT(HOUR FROM s2.started_at)::int AS h
                 FROM public.watch_sessions s2
                WHERE s2.student_id = p_student_id AND s2.status <> 'active'
                GROUP BY 1 HAVING count(*) >= 2) t), '{}'::int[]),
    avg(s.human_score),
    now()
  FROM public.watch_sessions s
  WHERE s.student_id = p_student_id AND s.status <> 'active'
  ON CONFLICT (student_id) DO UPDATE SET
    sessions_analyzed    = EXCLUDED.sessions_analyzed,
    avg_consumption_rate = EXCLUDED.avg_consumption_rate,
    typical_hours        = EXCLUDED.typical_hours,
    avg_human_score      = EXCLUDED.avg_human_score,
    updated_at           = now();
END;
$$;

-- --------------------------------------------------------------------------
-- submit_quiz_answer(quiz, answer) -> jsonb
-- --------------------------------------------------------------------------
-- Security role: the ONLY way answers are checked. correct_answer is
-- column-revoked from all clients; comparison happens here, server-side.
-- A previously-correct response can never be downgraded by a later wrong one.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_quiz_answer(p_quiz_id UUID, p_answer TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid     UUID := auth.uid();
  v_quiz    RECORD;
  v_correct BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'unauthenticated');
  END IF;

  SELECT q.id, q.assignment_id, q.correct_answer
    INTO v_quiz
    FROM public.auto_quizzes q
   WHERE q.id = p_quiz_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'quiz_not_found');
  END IF;
  IF NOT public.is_student_assigned(v_quiz.assignment_id) THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'not_assigned');
  END IF;

  v_correct := lower(trim(p_answer)) = lower(trim(v_quiz.correct_answer));

  INSERT INTO public.quiz_responses (quiz_id, student_id, answer, is_correct)
  VALUES (p_quiz_id, v_uid, p_answer, v_correct)
  ON CONFLICT (quiz_id, student_id) DO UPDATE SET
    answer      = EXCLUDED.answer,
    is_correct  = public.quiz_responses.is_correct OR EXCLUDED.is_correct,
    attempts    = public.quiz_responses.attempts + 1,
    answered_at = now();

  RETURN jsonb_build_object('status', 'ok', 'is_correct', v_correct);
END;
$$;

-- --------------------------------------------------------------------------
-- get_quiz_answers(quiz) -> jsonb — teacher-only read of correct_answer
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_quiz_answers(p_quiz_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_quiz RECORD;
BEGIN
  SELECT q.* INTO v_quiz FROM public.auto_quizzes q WHERE q.id = p_quiz_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'quiz_not_found');
  END IF;
  IF NOT public.is_teacher_of_assignment(v_quiz.assignment_id) THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'forbidden');
  END IF;
  RETURN jsonb_build_object('status', 'ok', 'quiz_id', v_quiz.id,
                            'correct_answer', v_quiz.correct_answer,
                            'question', v_quiz.question);
END;
$$;

-- --------------------------------------------------------------------------
-- generate_auto_quizzes(assignment) -> jsonb
-- --------------------------------------------------------------------------
-- Security role: teacher-only. Picks the top-3 "weak moments" (rewatch +
-- pause counts) from the engagement heatmap and creates checkpoint SKELETONS.
-- Skeletons are is_mandatory = FALSE with status 'pending_generation' — the
-- LLM Edge Function (Phase 3) fills in question/answer, and the teacher
-- flips is_mandatory to TRUE after review. Students can never be gated by an
-- unreviewed question.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_auto_quizzes(p_assignment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_video_id UUID;
  v_created  INT := 0;
BEGIN
  IF NOT public.is_teacher_of_assignment(p_assignment_id) THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'forbidden');
  END IF;

  SELECT a.video_id INTO v_video_id FROM public.assignments a WHERE a.id = p_assignment_id;

  INSERT INTO public.auto_quizzes (assignment_id, video_time, question, correct_answer, is_mandatory)
  SELECT p_assignment_id, h.second,
         jsonb_build_object('status', 'pending_generation',
                            'reason', 'high rewatch/pause density',
                            'rewatch_count', h.rewatch_count,
                            'pause_count', h.pause_count),
         'PENDING', FALSE
    FROM public.engagement_heatmaps h
   WHERE h.video_id = v_video_id
     AND (h.rewatch_count + h.pause_count) > 0
     AND NOT EXISTS (SELECT 1 FROM public.auto_quizzes q
                     WHERE q.assignment_id = p_assignment_id
                       AND abs(q.video_time - h.second) < 10)
   ORDER BY (h.rewatch_count + h.pause_count) DESC
   LIMIT 3;

  GET DIAGNOSTICS v_created = ROW_COUNT;
  RETURN jsonb_build_object('status', 'ok', 'created', v_created);
END;
$$;

-- --------------------------------------------------------------------------
-- refresh_engagement_heatmap(video) -> jsonb
-- --------------------------------------------------------------------------
-- Security role: rebuilds the per-second read model from the event stream.
-- Teacher (video owner) or service role. Heuristic definitions:
--   rewatch  = seek landing in this second (advance < -2)
--   pause    = event beat 'pause' at this second
--   speed_drop = 'ratechange' where new rate < previous rate
--   dropoff  = the final event of a non-active session at this second
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_engagement_heatmap(p_video_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rows INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.videos v
                 WHERE v.id = p_video_id AND v.teacher_id = auth.uid())
     AND auth.uid() IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'forbidden');
  END IF;

  DELETE FROM public.engagement_heatmaps WHERE video_id = p_video_id;

  WITH ev AS (
    SELECT e.student_id,
           e.session_id,
           floor((e.payload ->> 'position')::numeric)::int AS sec,
           e.payload ->> 'event'                            AS event,
           (e.payload ->> 'advance')::numeric               AS advance,
           (e.payload ->> 'rate')::numeric                  AS rate,
           (e.payload ->> 'prev_rate')::numeric             AS prev_rate
      FROM public.events e
      JOIN public.assignments a ON a.id = e.assignment_id
     WHERE a.video_id = p_video_id
  ),
  last_events AS (
    SELECT DISTINCT ON (e.session_id)
           floor((e.payload ->> 'position')::numeric)::int AS sec
      FROM public.events e
      JOIN public.assignments a ON a.id = e.assignment_id
      JOIN public.watch_sessions s ON s.id = e.session_id
     WHERE a.video_id = p_video_id AND s.status <> 'active'
     ORDER BY e.session_id, e.id DESC
  )
  INSERT INTO public.engagement_heatmaps
    (video_id, second, viewers_count, rewatch_count, pause_count, speed_drop_count, dropoff_count, updated_at)
  SELECT p_video_id, ev.sec,
         count(DISTINCT ev.student_id),
         count(*) FILTER (WHERE ev.advance < -2),
         count(*) FILTER (WHERE ev.event = 'pause'),
         count(*) FILTER (WHERE ev.event = 'ratechange' AND ev.rate < ev.prev_rate),
         COALESCE(d.dropoffs, 0),
         now()
    FROM ev
    LEFT JOIN (SELECT sec, count(*) AS dropoffs FROM last_events GROUP BY sec) d
      ON d.sec = ev.sec
   GROUP BY ev.sec, d.dropoffs;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN jsonb_build_object('status', 'ok', 'seconds_computed', v_rows);
END;
$$;

-- --------------------------------------------------------------------------
-- get_engagement_heatmap(video) -> jsonb — teacher dashboard data
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_engagement_heatmap(p_video_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rows JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.videos v
                 WHERE v.id = p_video_id AND v.teacher_id = auth.uid()) THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'forbidden');
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'second', h.second, 'viewers', h.viewers_count,
           'rewatches', h.rewatch_count, 'pauses', h.pause_count,
           'speed_drops', h.speed_drop_count, 'dropoffs', h.dropoff_count)
           ORDER BY h.second), '[]'::jsonb)
    INTO v_rows
    FROM public.engagement_heatmaps h
   WHERE h.video_id = p_video_id;

  RETURN jsonb_build_object('status', 'ok', 'video_id', p_video_id, 'heatmap', v_rows);
END;
$$;

-- --------------------------------------------------------------------------
-- get_behavioral_report(session) -> jsonb
-- --------------------------------------------------------------------------
-- Security role: teacher-facing deep dive (or the owning student). Returns
-- the human-likelihood score WITH its components — a score without evidence
-- is not actionable, and we never auto-block on it.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_behavioral_report(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid     UUID := auth.uid();
  v_session public.watch_sessions%ROWTYPE;
  v_tampers JSONB;
BEGIN
  SELECT * INTO v_session FROM public.watch_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'session_not_found');
  END IF;
  IF v_uid <> v_session.student_id
     AND NOT public.is_teacher_of_assignment(v_session.assignment_id) THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'forbidden');
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'kind', te.kind, 'detail', te.detail, 'at', te.created_at)
           ORDER BY te.created_at), '[]'::jsonb)
    INTO v_tampers
    FROM public.tamper_events te
   WHERE te.session_id = p_session_id;

  RETURN jsonb_build_object(
    'status',              'ok',
    'session_id',          p_session_id,
    'human_score',         v_session.human_score,
    'needs_review',        v_session.human_score < 60,   -- advisory threshold
    'components', jsonb_build_object(
      'beats',               v_session.beat_count,
      'interactions',        v_session.interaction_count,
      'hidden_beats',        v_session.hidden_beats,
      'honeytoken_failures', v_session.honeytoken_failures,
      'inter_arrivals_ms',   v_session.inter_arrivals,
      'flags_raised',        v_session.raised_flags),
    'tamper_events',       v_tampers
  );
END;
$$;

-- --------------------------------------------------------------------------
-- verify_event_chain(session) -> jsonb
-- --------------------------------------------------------------------------
-- Security role: cryptographic audit. Replays the per-session hash chain and
-- recomputes every event hash. Any modification, deletion, or reordering of
-- events breaks the chain at the exact event where it happened. This is the
-- guarantee a Merkle tree would give you, without the complexity.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_event_chain(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid     UUID := auth.uid();
  v_session public.watch_sessions%ROWTYPE;
  r         RECORD;
  v_prev    TEXT := 'GENESIS';
  v_count   INT  := 0;
  v_expected TEXT;
BEGIN
  SELECT * INTO v_session FROM public.watch_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'session_not_found');
  END IF;
  IF v_uid <> v_session.student_id
     AND NOT public.is_teacher_of_assignment(v_session.assignment_id) THEN
    RETURN jsonb_build_object('status', 'error', 'error', 'forbidden');
  END IF;

  FOR r IN SELECT e.* FROM public.events e
            WHERE e.session_id = p_session_id ORDER BY e.id LOOP
    v_count := v_count + 1;
    IF r.prev_hash <> v_prev THEN
      RETURN jsonb_build_object('status', 'ok', 'valid', FALSE,
                                'broken_at_event', r.id, 'reason', 'prev_hash_mismatch',
                                'events_checked', v_count);
    END IF;
    v_expected := encode(extensions.digest(
      r.prev_hash || '|' || r.payload::text || '|' || r.server_ts::text, 'sha256'), 'hex');
    IF r.event_hash <> v_expected THEN
      RETURN jsonb_build_object('status', 'ok', 'valid', FALSE,
                                'broken_at_event', r.id, 'reason', 'payload_modified',
                                'events_checked', v_count);
    END IF;
    v_prev := r.event_hash;
  END LOOP;

  RETURN jsonb_build_object('status', 'ok', 'valid', TRUE, 'events_checked', v_count,
                            'chain_head', v_prev);
END;
$$;

-- --------------------------------------------------------------------------
-- get_student_progress v2 — adds learning velocity + privacy-preserving
-- class median + streak + latest human score.
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
  v_uid        UUID := auth.uid();
  v_is_teacher BOOLEAN;
  v_progress   RECORD;
  v_intervals  JSONB;
  v_tampers    JSONB := '[]'::jsonb;
  v_median     NUMERIC;
  v_streak     RECORD;
  v_profile    RECORD;
  v_session    RECORD;
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

  IF v_is_teacher THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'kind', te.kind, 'detail', te.detail, 'at', te.created_at)
             ORDER BY te.created_at DESC), '[]'::jsonb)
      INTO v_tampers
      FROM public.tamper_events te
     WHERE te.assignment_id = p_assignment_id AND te.student_id = p_student_id;
  END IF;

  -- Privacy-preserving peer comparison: median only, never individuals.
  SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY pr.percent)
    INTO v_median
    FROM public.progress pr
    JOIN public.assignments a ON a.id = pr.assignment_id
   WHERE pr.assignment_id = p_assignment_id;

  SELECT s.current_streak, s.longest_streak INTO v_streak
    FROM public.streaks s WHERE s.student_id = p_student_id;

  SELECT bp.avg_consumption_rate, bp.avg_human_score, bp.sessions_analyzed
    INTO v_profile
    FROM public.behavioral_profiles bp WHERE bp.student_id = p_student_id;

  SELECT ws.human_score INTO v_session
    FROM public.watch_sessions ws
   WHERE ws.assignment_id = p_assignment_id AND ws.student_id = p_student_id
   ORDER BY ws.started_at DESC LIMIT 1;

  RETURN jsonb_build_object(
    'status',           'ok',
    'percent',          COALESCE(v_progress.percent, 0),
    'credited_seconds', COALESCE(v_progress.credited_seconds, 0),
    'max_position',     COALESCE(v_progress.max_position, 0),
    'completed_at',     v_progress.completed_at,
    'flag_count',       COALESCE(v_progress.flag_count, 0),
    'last_watched_at',  v_progress.last_watched_at,
    'intervals',        v_intervals,
    'tamper_events',    v_tampers,
    'class_median_percent', round(COALESCE(v_median, 0), 2),
    'streak',           COALESCE(v_streak.current_streak, 0),
    'learning_profile', jsonb_build_object(
                          'avg_consumption_rate', v_profile.avg_consumption_rate,
                          'avg_human_score',      v_profile.avg_human_score,
                          'sessions_analyzed',    COALESCE(v_profile.sessions_analyzed, 0)),
    'latest_human_score', v_session.human_score
  );
END;
$$;

-- ============================================================================
-- EXECUTE grants
-- ============================================================================
-- Internal helpers: no client access at all.
REVOKE EXECUTE ON FUNCTION public.raise_flag_once(UUID, public.tamper_kind, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.request_ip()                                     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_behavioral_profile(UUID)                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_streak(UUID)                           FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.calculate_streak(UUID) TO authenticated;  -- self-call is harmless

-- Client-facing RPCs
GRANT EXECUTE ON FUNCTION public.start_watch_session(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_heartbeat(UUID, INT, NUMERIC, NUMERIC, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_progress(UUID, UUID)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_quiz_answer(UUID, TEXT)                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_quiz_answers(UUID)                            TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_auto_quizzes(UUID)                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_engagement_heatmap(UUID)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_engagement_heatmap(UUID)                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_behavioral_report(UUID)                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_event_chain(UUID)                          TO authenticated;

COMMIT;
