# WaslaLearn — Security Analysis v2

Extends v1 (18 attacks) with the Tier 1/5 innovations. Read v1 first — everything in it
still applies. This document adds attacks 19–30 and explains the engineering judgment
behind what we built, modified, and refused to build.

---

## New attack vectors & mitigations

| # | Attack | Mechanism | Mitigation |
|---|--------|-----------|------------|
| 19 | **Pre-computed beat fabrication** | Attacker generates a full session's worth of "valid" beats offline, then replays them during class | **Challenge-response binding.** Each beat must include `sha256(nonce : seq : position_ms)` where the nonce was issued by the *previous* server response. Beats cannot be pre-computed because nonce N+1 doesn't exist until beat N is accepted. A fabricated backlog collapses: the attacker can only ever forge the *next* beat, one at a time, in real time — at which point the cumulative invariant caps them anyway. |
| 20 | **Naive replay scripts** | Record heartbeats with curl/Postman, replay on a loop | Three independent layers: (a) monotonic `seq` rejects old beats, (b) challenge nonces are single-use and rotate every beat, (c) honeytoken intervals (below). A curl script fails all three simultaneously. |
| 21 | **Hardcoded-interval bots** | Bot sends beats every exactly 5000ms regardless of server responses | **Honeytoken intervals.** Every response carries `next_beat_in_ms` ∈ [4000, 8000), derived from the fresh nonce (unpredictable, no extra state). A real client follows it; a hardcoded loop keeps firing at 5000ms. Two consecutive misses → `honeytoken_failed`. Event beats are exempt (user actions are legitimately off-schedule), and the tolerance is ±1500ms to absorb network jitter — this is why it stays under the FP budget. |
| 22 | **Browser automation (Selenium/Playwright)** | Real browser, real player, driven by script | The hardest attack class — automation defeats most client-side signals by definition. Our answer is *interaction entropy*: automated sessions play start-to-finish with zero pauses, zero seeks, zero rate changes, and machine-regular inter-arrival times. Shannon entropy of the inter-arrival ring buffer < 1.0 bits **combined with** zero interactions over 15+ beats → `entropy_low` → human score drops → teacher review. We deliberately do NOT auto-block: a student who genuinely watches passively is unusual but legitimate. |
| 23 | **Shared accounts** | Student A "watches" for student B on A's laptop | **Fingerprint consistency.** Session binds a browser fingerprint hash at start; mid-session change → `fingerprint_change`. Combined with IP tracking and the behavioral profile (B's watch habits differ from A's baseline), shared usage surfaces as a pattern, not a single event. |
| 24 | **VPN hopping / session resale** | Session credentials handed off mid-stream | **Server-side IP extraction** (`x-forwarded-for` parsed in Postgres — the client never sends an IP parameter it could forge). Mid-session IP change → `ip_changed`. Full geolocation requires an external GeoIP DB (noted as an optional Edge Function enhancement); IP-change detection catches the handoff itself. |
| 25 | **"Set it and forget it" background play** | Video plays in a hidden tab for hours while student games | **Dead man's switch.** Client reports visibility per beat. >100 beats hidden + zero interactions → `dead_mans_switch` flag. Deliberately a *flag*, not a block: listening to a lecture audio-only while reading notes in another tab is legitimate pedagogy. The teacher decides. |
| 26 | **Checkpoint skipping** | Skip past mandatory quiz timestamps | **Comprehension-gated progress** — the strongest anti-skip mechanism in the system. Credit is *clamped at the first unanswered mandatory checkpoint* inside the same transaction as the heartbeat. The interval merge never sees positions past the gate, so coverage mathematically cannot include un-quizzed regions. This is enforced in the credit path itself, not as a UI rule. |
| 27 | **Quiz answer exfiltration** | Student reads `correct_answer` from the API response | **Column-level security.** Clients hold `SELECT` on every `auto_quizzes` column *except* `correct_answer`. RLS alone can't do this; grants can. Answers are checked only inside `submit_quiz_answer` (security definer); teachers read answers via `get_quiz_answers`. |
| 28 | **Audit log tampering** | Attacker (or rogue admin) modifies/deletes historical heartbeat evidence | **Hash-chained event log.** Each event commits to `sha256(prev_hash \| payload \| server_ts)`. Editing any historical event breaks every subsequent hash; deleting one breaks the linkage. `verify_event_chain(session_id)` replays and recomputes the chain, pinpointing the first broken event. Tamper-evidence holds even against someone with direct DB write access — the property that matters for grade disputes. |
| 29 | **Heartbeat flooding / DoS** | Script fires thousands of beats to exhaust the DB or drown signals | **Rate limit from the event stream**: >30 beats/min/student → `rate_limited` error + tamper flag. The check runs *before* any state mutation. (Supabase's platform-level rate limiting is the second layer.) |
| 30 | **Off-hours account use** | Stolen credentials used at 3 AM | **Time-of-day baseline.** After 5 sessions, `behavioral_profiles.typical_hours` captures the student's normal watch hours. Off-pattern session starts → `unusual_hours` soft flag. Never blocks — time zones, insomnia, and deadlines exist. |

## The three judgment calls (what we refused to build, and why)

### Frame-boundary verification (1.6) — REJECTED
The claim: "if the reported position doesn't align with frame boundaries, it's tampered."
The reality: YouTube's `getCurrentTime()` jitters ±100ms or more; frames at 30fps are
33ms apart. **Honest clients fail this check constantly.** A security control with a
50% false-positive rate isn't a control — it's noise that trains teachers to ignore
*all* flags, including real ones. The <1% FP requirement exists precisely to prevent
this. Cut.

### Cumulative MINIMUM bound (1.7) — REJECTED
Auto-expiring sessions where `credited < elapsed × min_rate` nukes every student who
pauses to take notes. The maximum bound (shipped in v1) is the sound half: it uses only
server-measured quantities. Staleness is already handled by the 30-minute session
expiry, which doesn't punish pausing.

### Merkle trees (2.2) — REPLACED with chain verification
Merkle inclusion proofs matter when *untrusted clients hold the data* and must prove
membership to a verifier. Here the server holds everything; the per-session hash chain
already provides tamper evidence over the full history. `verify_event_chain` delivers
the same audit guarantee at a tenth of the complexity — and complexity is the enemy
of security.

## Signal architecture: why everything soft is advisory

Every behavioral signal (entropy, honeytoken, hidden beats, unusual hours, fingerprint)
feeds a single `human_score` (0–100) and the `tamper_events` feed. **Nothing
behavioral ever blocks or auto-fails a student.** The hard guarantees (server clock,
cumulative invariant, interval coverage, checkpoint gating, challenge binding) are
mathematical and carry zero false positives. The soft signals exist so a teacher can
review `needs_review` sessions with full evidence — the score is always returned
*with its components*, because an unexplained score is not actionable and an
unexplained accusation is not defensible.

## Defense-in-depth summary

```
Layer 0  RLS + grants            → client has no write path at all
Layer 1  Challenge-response      → beats can't be replayed or pre-computed
Layer 2  Server clock + clamps   → credit ≤ physically possible, always
Layer 3  Cumulative invariant    → credit ≤ elapsed × max_rate, no exceptions
Layer 4  Interval coverage       → rewatching earns nothing; total ≤ duration
Layer 5  Checkpoint gating       → credit stops at unanswered quizzes
Layer 6  Hash-chained events     → history is tamper-evident
Layer 7  Behavioral signals      → teacher review with evidence (advisory)
```

An attacker must defeat layers 1–5 *simultaneously* to fabricate progress, and even
total success is bounded by layer 3: they can earn at most `max_rate × real time`,
which is the explicitly allowed behavior of watching at 2×.
