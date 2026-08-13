# WaslaLearn — Edge Case Matrix

How the backend behaves in every non-happy-path scenario, and what the frontend
must do to cooperate. "Server" = `submit_heartbeat` / `start_watch_session` RPC.

---

## 1. Tab switching / background tab (browser throttling)

**Reality:** Browsers throttle `setInterval` in background tabs to ≥1/min, and
`sleep`-based timers are unreliable. The video element itself usually keeps playing
(audio) unless the page is frozen.

**Handling:**
- Heartbeats are driven by the *player's* timeupdate event where possible, not a bare
  `setInterval`; plus an immediate `visibilitychange` event beat.
- Server side, a delayed beat simply has a larger `Δreal_server` — credit is computed
  from the server clock, so throttled-but-playing students lose nothing (up to the
  30s per-beat cap `c_max_beat_gap`).
- If the browser fully freezes the tab, beats stop → no credit accrues → correct
  behavior (we can't prove watching happened).
- **Frontend rule:** on `visibilitychange → hidden`, send an immediate beat via
  `sendBeacon`. Optionally pause the video (policy decision).

## 2. Network failure / offline (batch recovery)

**Reality:** Student watches 2 minutes with no connectivity; beats queue locally.

**Handling:**
- Client queues beats **with their client timestamps** and flushes in order on reconnect.
- Server sees a burst: `Δreal_server ≈ 0` between flushed beats, so per-beat server
  deltas can't apportion credit. For beats arriving < 2s apart, the server falls back
  to *client timestamp deltas* — but each beat is still capped at 30s × rate + 1.5s,
  and the **cumulative invariant** (server clock × max_rate) bounds the whole burst.
- Result: honest offline watching is credited correctly; fabricated backlog cannot
  exceed server-measured elapsed time × max_rate.
- **Frontend rule:** cap the offline queue (e.g., 500 beats); if the session expired
  server-side while offline (`session_not_active` on flush), start a new session and
  resume from the server-returned `resume_position`.

## 3. Page refresh

**Handling:**
- New page load → new `client_session_id` → `start_watch_session`.
- The RPC supersedes the old active session (logs `concurrent_session`,
  informational) and returns `resume_position` = server-side `max_position`.
- Player seeks to `resume_position`. The student never loses credited progress
  because progress lives in `watched_intervals`, not in the session.
- **Frontend rule:** NEVER resume from `localStorage`. The server's
  `resume_position` is the only valid seek target.

## 4. Re-watching

**Handling:**
- Rewind is always legal: negative advance → no credit, no penalty (a `large_rewind`
  flag is written to the audit log only when > 60s, for teacher visibility).
- Re-watched ranges overlap existing `numrange` intervals; the union adds nothing.
  `percent` never decreases and never double-counts.

## 5. Multi-device

**Handling:**
- Partial unique index guarantees **one active session** per (student, assignment).
- Device B starts → device A's session becomes `superseded`; A's next beat gets
  `session_not_active` and its UI should stop and offer to reload.
- Progress is per (assignment, student), not per session — intervals merge across
  devices seamlessly. The `progress`-row lock inside `merge_intervals` serializes
  any genuinely concurrent merges.
- **Frontend rule:** on `session_not_active`, stop the heartbeat loop immediately.

## 6. Large rewind (> 60s)

**Handling:** legal, uncredited, flagged `large_rewind` in `heartbeat_log` (not a
tamper event — rewinding to re-study is legitimate pedagogy; the flag exists so
teachers can distinguish "re-studied" from "never watched").

## 7. Playback rate changes mid-video

**Handling:**
- Client sends an immediate `ratechange` event beat, then continues periodic beats
  carrying the new rate.
- Each beat is validated at *its own* clamped rate, so credit math stays exact across
  changes. Rates above the video's `max_playback_rate` are clamped + flagged
  (`rate_exceeded`).
- **Frontend rule:** clamp the rate UI to `max_playback_rate` (returned by
  `start_watch_session`) — the server clamp is the enforcement, the UI clamp is UX.

## 8. Pause / resume

**Handling:**
- `pause` event beat, then **no periodic beats while paused** (position isn't
  advancing; a beat with advance 0 earns nothing anyway).
- On `play`, resume the 5–8s periodic loop.
- Long pause: `Δreal_server` grows, but `c_max_beat_gap = 30s` caps creditable time
  per beat, so a 20-minute pause followed by a single beat credits ≤ 30s × rate —
  and since position didn't advance during the pause, `advance` is small anyway.
  The two-sided check (advance vs allowed) makes pause handling fall out naturally.

## 9. Session timeout (30 min idle)

**Handling:**
- `expire_old_sessions()` (service_role only; schedule via pg_cron every 5 min:
  `SELECT cron.schedule('expire-sessions', '*/5 * * * *', 'SELECT public.expire_old_sessions()');`)
  marks idle sessions `expired`.
- Next beat → `session_not_active` → client starts a fresh session and resumes from
  server position. No progress lost; stale tabs can't silently accumulate.

## 10. Completion boundary

**Handling:**
- `percent ≥ 95` → `completed_at` set (once, never unset), session → `completed`.
- 95% (not 100%) absorbs outro skipping, buffering gaps at segment boundaries, and
  float rounding at `duration`. Tunable via `c_complete_pct`.
- After completion, further beats get `session_not_active`; the client should stop
  beating when it receives `completed: true`.

## 11. Duplicate / retried beats

**Handling:** `seq == heartbeat_seq` → `duplicate` response with current state, no
double credit, no tamper flag. `seq < heartbeat_seq` → `replay_detected` tamper
event. Clients must increment seq by 1 per beat and persist it for the session's
lifetime (in-memory is fine — a refresh starts a new session anyway).

## 12. Clock skew between client and server

**Handling:** irrelevant by design. Validation uses only Postgres `now()`. Client
timestamps are used solely for intra-burst apportioning (case 2), where skew cancels
out because only *deltas* of client timestamps are read, never absolute values.
