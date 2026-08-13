# WaslaLearn — Edge Cases & Resilience v2

Extends EDGE_CASES.md (v1). Cases 1–12 from v1 still apply unchanged. This document
covers the new surface area introduced by the v2 features plus the newly requested
scenarios.

---

## 13. Challenge-response failure on a slow device

**Reality:** The client must compute `sha256(nonce:seq:position_ms)` per beat. On a
2013 Chromebook this is still <10ms, but a beat could theoretically arrive after the
nonce rotated (e.g., two beats in flight simultaneously).

**Handling:** Beats are strictly sequential by design — the client must wait for
response N (which carries nonce N+1) before sending beat N+1. If a beat fails with
`challenge_failed`, the correct client behavior is: **re-read the latest
`challenge_nonce` from the last successful response and resync** — never retry with a
stale nonce. If the client has lost track (page restored from bfcache), it starts a
fresh session. A `pow_failed` tamper event is recorded per failure; honest resyncs
produce at most one or two of these per session, which the teacher sees in context.

## 14. Honeytoken interval vs. legitimate jitter

**Reality:** Server says `next_beat_in_ms: 6200`. The client's `setTimeout` fires at
6200ms, but the request lands at 6450ms (network) or 5900ms (fast local network +
timer slop).

**Handling:** The check is `abs(actual − expected) > 1500ms AND actual ≈ 5000ms` —
it only fires when the client *ignored the instruction and reverted to the default*.
A client that attempts to follow the interval and misses by jitter never matches the
second clause. Two consecutive misses are required before the flag raises. Event beats
(pause/seek/visibility) are fully exempt.

## 15. Daylight saving time / timezone changes

**Handling:** Non-issue by construction. All validation uses `TIMESTAMPTZ` (UTC
internally) and `EXTRACT(EPOCH FROM …)` — epoch math has no DST. `typical_hours` in
the behavioral profile is stored in server-local hours; a student who travels gets an
`unusual_hours` soft flag at worst, which is advisory. Streaks use `current_date`
(server timezone); document the server's timezone choice to teachers ("a streak day
rolls over at midnight UTC" or configure per-instance).

## 16. Browser crash / OS kill

**Handling:** No final beat arrives. Credit stops at the last server-witnessed
position — correct and safe. On relaunch, `start_watch_session` supersedes the
orphaned session (logged as `concurrent_session`, informational) and returns the
server-authoritative `resume_position`. The `sendBeacon` on `pagehide` is
best-effort; the system is designed to be correct even when it never fires.

## 17. Mobile backgrounding (iOS Safari / Android Chrome)

**Reality:** Mobile browsers suspend background tabs aggressively — timers die,
media may keep playing (audio) or pause (OS-dependent), and the page can be
*discarded* entirely (not just hidden).

**Handling:**
- `visibilitychange → hidden` beat via `sendBeacon` before suspension (usually
  delivered; if not, see case 16 — still safe).
- If the OS keeps audio playing, no beats arrive → no credit accrues. This is
  *intentionally strict*: we cannot prove watching without beats. The student loses
  at most the backgrounded minutes and resumes from server position.
- Page discard → same as crash (case 16).
- **Frontend rule (Phase 3):** on `visibilitychange → visible` after >30s hidden,
  call `start_watch_session` fresh rather than trusting in-memory state.

## 18. Picture-in-Picture mode

**Reality:** PiP keeps the video visible while the tab reports `hidden`.

**Handling:** This is exactly why `dead_mans_switch` is a *flag* and not a block.
PiP watching accumulates `hidden_beats` but typically also accumulates interactions
(pauses, seeks via the PiP controls) and shows normal entropy — the combined signal
stays human. A pure-PiP session with zero interactions may cross the review
threshold; the teacher sees "100% hidden, 14 interactions" vs "100% hidden, 0
interactions" and judges accordingly. **Frontend rule:** use
`document.pictureInPictureEnabled` / `enterpictureinpicture` events to report
`visibility: 'pip'` as a distinct state — the server treats it as visible for
scoring purposes (add to the payload; no schema change needed, it's a string).

## 19. AirPlay / Chromecast casting

**Reality:** The video renders on another device; the browser tab may be hidden or
even closed (Chromecast takes over the stream entirely).

**Handling:**
- **YouTube casting:** the cast session is controlled by the YouTube app, not our
  player — heartbeats stop, credit stops. Correct: we cannot verify cast playback.
  Document as a known limitation ("casting does not earn progress").
- **Tab casting (Chromecast tab mirror):** the player keeps running in the tab →
  beats continue → credit accrues normally. The tab reports visible; no anomaly.
- **AirPlay from Safari:** the video element keeps playing in-page → beats continue.
  If the user backgrounds the tab, see case 17.
- No special server handling required; the heartbeat-is-proof principle degrades
  gracefully.

## 20. Checkpoint reached mid-skip-clamp

**Reality:** A student attempts a skip; the clamped credit lands exactly on an
unanswered mandatory checkpoint.

**Handling:** Both clamps compose correctly — credit is first clamped to the
physically-possible position, then clamped again to the checkpoint. The response
contains `corrected: true` AND `checkpoint_pending: <time>`; the player seeks to
`credited_position` and presents the quiz. Order of operations in the RPC guarantees
the checkpoint clamp is always the final word.

## 21. Quiz answered correctly, then teacher edits the answer

**Reality:** Teacher fixes a typo in `correct_answer` after students have answered.

**Handling:** `quiz_responses.is_correct` is historical truth ("was correct when
answered") and is never recomputed — a student who passed the gate stays passed.
The once-correct-never-downgrade rule in `submit_quiz_answer`
(`is_correct = existing OR new`) protects this on re-answer too. Teachers editing
quizzes should be told (Phase 3 UI copy) that past responses are unaffected.

## 22. Heatmap refresh on a huge event stream

**Reality:** `refresh_engagement_heatmap` scans all events for a video. A popular
video with 30 students × 10-min sessions ≈ 4k events — trivial. At 100× that scale
it becomes a batch job.

**Handling:** Fine as-is for launch (BRIN index keeps scans cheap). When it hurts:
schedule it via pg_cron nightly instead of teacher-triggered, or incrementally
aggregate (events carry everything needed). The RPC is idempotent — safe to run
anytime, concurrently-safe via DELETE+INSERT in one transaction.

## 23. Events partition exhaustion

**Reality:** A beat arrives in a month with no partition → insert fails → heartbeat
fails. This is the one v2 operational landmine.

**Handling:** The `events_default` partition catches any out-of-range insert, so
heartbeats never hard-fail. **Operational rule:** create next month's partition
ahead of time (pg_cron on the 25th: `CREATE TABLE events_YYYY_MM PARTITION OF
events FOR VALUES FROM ...`). Monitor the default partition's size; if non-empty,
create the missing partition and `DETACH`/`ATTACH` the rows.

## 24. Student spams quiz answers (brute force)

**Reality:** Multiple-choice with 4 options → 4 attempts guarantees a pass.

**Handling:** Every attempt is recorded (`attempts` counter, full history in
`quiz_responses` upsert). Teachers see attempt counts in the dashboard — a 4-attempt
pass is visible evidence of guessing. Optional hardening (Phase 3): server-side
attempt cap (e.g., 3 attempts, then teacher unlock) — one line in
`submit_quiz_answer`; deliberately not enabled by default because locked-out
students generate support load.

## 25. Session restored from bfcache (back/forward cache)

**Reality:** User hits "back" then "forward"; the page resumes with stale in-memory
state (old nonce, old seq) but the session may have been superseded or expired.

**Handling:** The first beat after restore fails (`challenge_failed` or
`session_not_active`) → client starts a fresh session and resumes from server
position. **Frontend rule:** listen for `pageshow` with `event.persisted === true`
and proactively re-handshake instead of waiting for a failed beat.
