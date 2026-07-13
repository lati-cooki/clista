# Decision Record: FCP Waive-Ratio Metrics (`fcp_waive_ratio` + `externally_contested_ratio`)

> **Provenance:** clista@77fec86b91d507b5d64e10f7b58ee17140ca5a09 · prompt-studio@78afd03ed7efdf7ac83b0f141d9db65cc110dfcd

The prompt-studio pin references the `phase5-writers` branch commit that
implements these metrics — a pre-merge branch state, pinned deliberately so
the definitions below are checkable against the exact code they were copied
from, not against whatever the branch later merges into.

**Status:** ADOPTED by owner direction — the owner confirmed on 2026-07-12,
on record, that BOTH metrics seal in one DR. Agent-authored draft without a
separate challenge pass — disclosed here, per the 2026-07-10 monorepo
precedent.
**Decision owner:** troy_builds
**Date raised:** 2026-07-12
**Applies to:** `lati-cooki/prompt-studio` (`promotion_store.py`,
`server.py`, the Decisions view), `docs/` (this atlas)
**Evidence base:** the live promotions table's 0/5 baseline (five `closed`
outcomes, all resolved 2026-07-12, each with `window_hours = 0.01` — a
36-second window — and zero objections on record);
`DR-phase5-topology.md` (FCP terminal-outcome mapping rows added under
`obj_mapping-completeness`); Phase 5 plan, Slice 5

---

## Decision Question

Phase 5's falsifiability slice: governance gets a number. The FCP (final
comment period) flow lets a promotion close by waiting out its window, be
waived past the window, or be aborted. What metric definition — sealed
immutable, so the curve stays comparable across its own history — makes the
health of that ceremony measurable rather than asserted?

The trap in the question is the baseline. The honest current number is 0/5
waived — and it was produced by five short solo windows (36 seconds each)
with no possible objectors. A waive ratio of 0.0 on that substrate is
arithmetically true and rhetorically misleading: the waive curve alone can
look virtuous while ceremony is absent. So the question is not "what is the
waive ratio" but "what pair of numbers makes absent ceremony visible."

## Options Considered

**Option A — Single metric: `fcp_waive_ratio` only.**
*Rejected.* The honest baseline is 0/5 waived **via short solo windows with
no possible objectors** — so the waive curve alone can look virtuous while
ceremony is absent. A dashboard showing "0% waived" over windows nobody
could have objected in measures nothing but the operator's patience with a
36-second timer. The falling-ceremony failure mode this slice exists to
falsify is exactly the one Option A cannot see.

**Option B — Per-promotion boolean (`was_waived`, `was_contested`) instead
of windowed ratios.**
*Rejected.* The booleans already exist in substance (`state == 'waived'`;
sealed FCP metadata per `promotion_seal.py`). The measurement this slice
adds is the falling-ceremony **curve** — the trend of the ratios over
comparable windows. A per-promotion flag has no denominator and therefore no
trend; it cannot fall, so it cannot falsify.

**Option C — Both windowed ratios, sealed in one DR.**
*Accepted*, per the owner decision of 2026-07-12: `fcp_waive_ratio` and
`externally_contested_ratio` are defined together, sealed together, and
displayed together — the second exists to keep the first honest.

## Decision

Adopt Option C. Binding rules — the formulas below are copied verbatim from
the implementation (`promotion_store.metrics`, prompt-studio pin above), and
the two must never diverge:

1. **Terminal FCP outcomes.** A promotion is a terminal outcome iff
   `promotions.state` is one of `('closed', 'waived', 'aborted')` —
   `TERMINAL_STATES` in `promotion_store.py`, enumerated from the real state
   machine (`open -> closed | waived | aborted`; `open` is the only
   non-terminal state; there is no other). `resolved_at` is the outcome
   timestamp.

2. **`fcp_waive_ratio(window_days)` = count(terminal outcomes in window
   where state == 'waived') / count(terminal outcomes in window).**

3. **`externally_contested_ratio(window_days)` = count(terminal outcomes in
   window whose FCP window had >= 1 token invitation) / count(terminal
   outcomes in window).** Token invitations live in the `fcp_tokens` table
   (Slice 6). Query contract, pinned by test ahead of the table's existence:
   `fcp_tokens` carries one row per token invitation with at least
   `promotion_id` (INTEGER, references `promotions.id`) and `minted_at`
   (TEXT, UTC `%Y-%m-%dT%H:%M:%SZ`); a terminal outcome counts as externally
   contested when >= 1 `fcp_tokens` row has `promotion_id = promotions.id`
   AND `minted_at < resolved_at` (invitation minted strictly before the
   outcome).

4. **Window.** `resolved_at >= now - window_days`; `window_days` absent
   (`None`) = all-time. Served as
   `GET /api/promotions/metrics?window=<days>` (whole positive days;
   anything else is a 422, not a guess).

5. **Null denominator discloses.** When the denominator is 0, both ratios
   are JSON `null`, returned alongside the counts
   (`terminal_total`, `waived`, `invited`) — never a fabricated `0.0`. A
   measured zero over a real denominator (e.g. 0 waived of 5 terminal) IS
   `0.0`: measured absence and absent measurement are different values.

6. **Table absence discloses.** Until Slice 6 lands `fcp_tokens`, the
   contested count is 0 by absence of measurement, and the response says so:
   `contested_data` = `"no token table yet (pre-Slice-6); 0 invitations
   recorded"`. Once the table exists the same query starts counting rows and
   `contested_data` = `"fcp_tokens table present; invitations measured"`.
   The table check uses the same guarded `PRAGMA table_info` pattern as the
   studio's migrations. The endpoint never pretends measurement it did not
   perform.

7. **Visible from day one.** The Decisions view header displays the current
   all-time counts compactly (`waive 0/5 · contested 0/5`) — counts, not
   bare ratios, because `0/5` carries the denominator a percentage would
   hide. When the endpoint errors, the header discloses unavailability; it
   never renders a stale or invented number.

## Evidence Basis

- The live baseline, read from the promotions table on 2026-07-12: five
  terminal outcomes, all `closed`, zero waived, zero objections, every
  window `0.01` hours (36 seconds), no token invitations possible
  (`fcp_tokens` does not exist yet). `fcp_waive_ratio` = 0/5 = 0.0;
  `externally_contested_ratio` = 0/5 = 0.0 with the table-absence
  disclosure. This is the short-window, no-possible-objectors character
  that makes the single-metric option dishonest and both curves necessary.
- The implementation and its tests (prompt-studio pin above):
  `tests/test_promotion_metrics.py` covers the empty DB (null ratios with
  counts), the 5-closed-clean shape (0.0, not null), waived rows, window
  filtering, table-absence disclosure, and the Slice 6 invited-counting
  contract via a synthetic `fcp_tokens` table.
- `DR-phase5-topology.md`, `obj_mapping-completeness`: the FCP terminal
  closes (promoted / aborted / waived) are already mapped as sealed
  vocabulary — these metrics count what that mapping witnesses.

## Consequences Accepted

- **Definitions are immutable once sealed.** Changing what either name
  means requires a NEW metric name introduced by amendment to this DR —
  never a redefinition. A curve is only falsifying while its points are
  comparable; a redefined metric silently resets the curve while keeping
  its reputation.
- The pre-Slice-6 `externally_contested_ratio` is a disclosed zero, not a
  measurement; consumers reading the ratio without `contested_data` can
  still over-read it. The disclosure field is the mitigation, not a cure.
- Rule 3 constrains Slice 6's schema (two named columns and their
  semantics). If Slice 6 needs a different shape, that is an amendment
  here before the migration lands, not a drift.
- `window` is calendar days over `resolved_at` only; there is no
  per-promotion window-length weighting. A flood of 36-second windows
  moves neither ratio by itself — it moves `externally_contested_ratio`
  only once invitations exist to be counted, which is the point.

## Amendments

None yet.

## Seal

Sealed 2026-07-12 through the studio seal flow: ThreadHub thread
`dr-2026-07-12-fcp-metrics` (`thd_032624ba7f19`), 8 records, chain
`valid: true`, head
`sha256:ff7aef2f69da0091df84f6c5b9e78f2665eef083c978e49c80416cf094493bc3`.
The sealed evidence pins this document at commit `cbfc008` and the live
0/5 baseline measurement (fcp_waive_ratio 0.0 measured, contested 0/5
with the table-absence disclosure). Definitions are immutable from this
seal forward — changes take a NEW metric name by amendment, never a
redefinition. Sealed under the legacy single custodial studio author
(pre-Slice-2 live server) — custody regime disclosed per
DR-phase5-topology rule 5.3; the anchor row lands via the retroactive
backfill at merge time.
