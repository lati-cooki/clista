# Task #8: Raw Ordered DO Rows - Independent Replay Evidence

**Status:** Independent replay evidence via raw ordered Durable Object (DO) rows is **unavailable**.

**Date of record:** 2026-07-07

**Context from prior incident containment (2026-07-04 clista-incident-20260704/):**
- Raw ordered DO rows exports were produced for specific tasks using a temporary read-only forensic endpoint (`GET /api/threads/:name/raw`, worker version 60e9bc2a, deployed 2026-07-04).
- Examples:
  - `clista-incident-RAW_task3_thread-0001_2026-07-04.json`: 69 rows (seq 1..69), DO instance "thread-0001", inner thread_id "thd_thread_0001", head `sha256:ad7a7f4867...`. Note: initial projection mismatch (DO name vs stored thread_id); raw dump required to recover ordered storage.
  - `clista-incident-RAW_task5_crypto-witness_2026-07-04.json`: 24 rows, DO instance matching stored thread_id, head `sha256:c61c6981b...` (final containment after owner confirmation of additional event).
- Format of raw exports: JSON with `exportKind: "clista-incident-raw-rows"`, `do_instance_name`, `stored_inner_thread_id`, `event_count`, `head_hash`, and `rows` array ordered by `seq` (each row includes `seq`, `event_id`, `content_hash`, and the full `event` object as stored).

**Why unavailable for task #8:**
- No corresponding `clista-incident-RAW_task8_*` or equivalent raw-rows export exists in the incident artifacts, freeze docs, or recovered state.
- The forensic raw-dump endpoint was temporary ("REVERT PENDING owner approval" per MANIFEST). No evidence it remains deployed or was used for additional tasks.
- `par_agent_clistahermes` Cloudflare Access service token was revoked as part of the freeze (2026-07-04) and fully decommissioned with cron retirement (2026-07-07). No agent writes or privileged reads via that identity.
- Normal read surfaces (audit/state/validate/summary via cockpit or agent-post.mjs) provide *projected* views only. These can be affected by identity mismatches or filters (as documented for task3). They do not expose the raw sequential DO storage rows.
- No direct DO storage dump (e.g., via wrangler, Cloudflare dashboard export, or admin binding read) was performed or is recoverable in local artifacts for any additional task #8.
- Session searches, file searches across clista-incident-20260704/, clista-ai-app incident docs, clista-protocol, and related archives yielded no identification of a specific thread/DO instance labeled "task #8" with associated raw rows.
- Protocol design: The append-only event log (`.ndjson` / hash-chained events) is the source of truth for replay, provenance, and validation. DO storage is a runtime projection. Independent raw DO row dumps were only a forensic supplement for containment verification during the incident window.

**Related retained artifacts (for reference):**
- Full incident MANIFEST: `clista-incident-20260704/MANIFEST.json` (details raw_rows_export notes, containment heads for task3/task5, anomaly resolution for task#5).
- RAW examples and larger evidence exports in same directory.
- Freeze docs: `Documents/clista-ai-app/docs/incidents/2026-07-04-clistahermes-freeze/README.md` (timeline of freeze → breach → retirement 2026-07-07; stranded drafts for `thd_mrm_task_transfer`).
- No raw ordered DO rows for task #8 were present or re-exportable as of this record.

**Conclusion / final record:**
Independent replay evidence from raw ordered DO rows for task #8 is unavailable. Containment and replay verification for any associated thread relies on:
- Projected/validated views from normal endpoints (where accessible via human owner session).
- The append-only ClisTa event log itself (hash-chained, integrity + validation provable via `clista validate` / projector).
- Existing RAW exports for task3 and task5 as precedents (where they were produced).

This record is created explicitly to close the open item. If owner later provides a specific thread_id/DO instance name for task #8 or re-deploys forensic access, a raw export can be attempted then.

**Preserved here alongside other incident evidence.**
