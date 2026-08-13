# WaslaLearn — Security Analysis

**Threat model:** The client is fully compromised. A student can open DevTools, modify
JS, replay requests, forge payloads, manipulate the system clock, and automate requests
with curl/scripts. The server (Postgres + RLS + security-definer RPCs) is the only
trusted component.

**What we protect:** the *integrity of watch progress*. We do NOT attempt to prevent
video downloading or screen recording — that is DRM, out of scope, and impossible to do
well in a browser.

---

## 1. Attack catalog

| # | Attack | How it's attempted | How it's stopped |
|---|--------|--------------------|------------------|
| 1 | **Fabricated heartbeats** | Script POSTs heartbeats while the video is closed | Server clock: `Δreal = now() - last_beat_at`. Credit per beat ≤ `Δreal × rate + 1.5s`. Fake beats arriving faster than real time earn ~0 credit. |
| 2 | **Speed hack** | `player.setPlaybackRate(16)` or forged `rate` param | Rate clamped server-side to `max_playback_rate` (default 2.0). Claimed excess → `rate_exceeded` tamper event; credit computed at clamped rate only. |
| 3 | **Seek/skip ahead** | Drag the seek bar, or forge `position = 300` | Per-beat check: `advance ≤ Δreal × rate + tolerance`. Excess is **clamped**, a `skip_attempt` tamper event is logged, and the response carries `credited_position` + `corrected: true` so the client seeks back. |
| 4 | **Slow-drip drift** | Claim slightly-more-than-possible advance on every beat, staying under per-beat tolerance | Fixed tolerance is 1.5s **per beat**, not proportional — max drift is ~1.5s per 5s beat, and the **cumulative invariant** (`session_credited ≤ elapsed_server × max_rate + 10s`) caps total fabrication regardless of per-beat cleverness. |
| 5 | **Replay old heartbeats** | Record legit beats, replay them later | `heartbeat_seq` must be strictly monotonic per session. Old seq → `replay_detected` tamper event. Equal seq → idempotent `duplicate` response, no double credit. |
| 6 | **Session hijacking / sharing** | A "watched" student shares their `session_id` with a friend | Session ownership is bound to `auth.uid()` from the JWT, verified on every beat. Mismatch → `session_hijack` tamper event. |
| 7 | **Parallel sessions** | Open the video in 5 tabs / 2 devices to earn 5× credit | One `active` session per (assignment, student) — enforced by a partial unique index. Starting a new session supersedes the old one (`concurrent_session` logged). Old session's beats are rejected as `session_not_active`. |
| 8 | **Direct database writes** | Call PostgREST `PATCH /progress` with a forged percent | `INSERT/UPDATE/DELETE` revoked on all progress tables; RLS has no write policies (default-deny). The only write path is the security-definer RPC, which recomputes everything. |
| 9 | **Forged completion** | Send `percent: 100` in any payload | The schema has no client-writable percent field. `progress.percent` is *derived* from merged `numrange` coverage — the client only ever sends positions. |
| 10| **Client clock manipulation** | Set system clock forward, forge `client_timestamp` | Client timestamps are decorative. `Δreal` uses Postgres `now()` exclusively. Client ts is used only to *apportion* burst-flushed beats, and that path is still bounded by the server-clock cumulative cap. |
| 11| **Kill network at the end** | Watch to 95%, go offline, claim 100% on reconnect | Final credit can never exceed the last server-witnessed position + `Δreal_server × rate + tolerance`. The server only believes time it measured itself. |
| 12| **Rewatch farming** | Replay the same 10s segment 60× to inflate "watch time" | Credit lives in merged `numrange` intervals. Rewatching overlaps existing ranges — union adds zero. `credited_seconds` is coverage, not play time. |
| 13| **Tamper-log wiping** | Delete rows from `tamper_events` | No DELETE policy/grant for clients. `heartbeat_log` has *no client access at all* — forensic evidence survives even if tamper events were somehow removed. |
| 14| **Privilege escalation** | Student flips `profiles.role` to `teacher` | `prevent_role_escalation` trigger blocks any role change on self-service UPDATE. |
| 15| **Cross-class snooping** | Student queries other classes' data / teacher queries other teachers' classes | RLS: students `student_id = auth.uid()`; teachers via `is_teacher_of_*` security-definer helpers (no recursive-policy bypass). Dashboard view uses `security_invoker`. |
| 16| **Drive URL sharing** | Extract the video URL, share with non-enrolled students | Drive proxy authenticates every request and verifies assignment via RLS before streaming. No persistent URLs leak — the proxy is the only endpoint. |
| 17| **SQL injection via RPC params** | Malicious strings in `client_session_id`, etc. | All RPC access is parameterized plpgsql; no dynamic SQL anywhere. |
| 18| **search_path hijack** | Create malicious objects shadowing built-ins for definer functions | Every security-definer function sets `search_path = ''` and fully qualifies all references. |

## 2. Why clamp, not reject

Rejecting an invalid heartbeat feels stricter but is worse on both axes:

- **Security:** rejection creates a *desync* — the client believes position X, the server
  believes Y, and every subsequent beat fails validation. Attackers respond by probing
  for the exact rejection threshold; clamping gives them nothing to probe against,
  because the response always contains the server's authoritative position.
- **Fairness:** a legit student on a flaky connection (beat delayed 8s, then two beats
  land together) looks exactly like a mild skip attempt. Rejection punishes them;
  clamping silently credits what was physically possible and moves on.
- **Evidence:** every clamp writes a `tamper_events` row with full context (claimed vs
  allowed, server Δ, rate). Teachers get a signal; students get no error to iterate
  against.

## 3. Why the cumulative invariant is the ultimate backstop

Every per-beat check is heuristic: tolerances, burst apportioning, clock jitter. Any
single-beat rule can be gamed at the margins. The cumulative invariant is different:

```
session_credited_seconds ≤ (now() − session.started_at) × max_playback_rate + 10s
```

Both terms on the right come **only from the server clock and server config**. No
client input appears in the inequality. Therefore, no sequence of forged beats — however
clever, however distributed — can credit a 10-minute video in under 5 minutes (at 2×).
Combined with interval coverage (which caps total credit at the video's duration), the
system is *bounded correct* even if a per-beat bug is discovered later: worst case, a
student watches at max speed, which is explicitly allowed.

## 4. What we deliberately do NOT defend against

| Non-attack | Why it's out of scope |
|---|---|
| Student plays the video muted in a background tab | Indistinguishable from legitimate listening, server-side. `visibilitychange` beats are logged so teachers see focus patterns; policy decision, not a code problem. |
| Student watches but doesn't pay attention | Pedagogy, not security. (Embedded quiz questions — the Edpuzzle model — are the product-level answer.) |
| Downloading / screen-recording the video | DRM. Impossible to prevent in a browser; not part of the progress-integrity threat model. |
| A second person physically watching for the student | No software can fix this. |
