# Run anchors — clista-protocol

DR-phase5-topology 4.1–4.3. A row here claims a weak external timestamp:
the anchored head hash existed no later than the push of the commit that
added the row, witnessed by the hosting provider's git history. It claims
nothing stronger — this is not notarization, no trusted timestamp authority
stands behind these rows, a host or a force-push can rewrite history, and
rows are appended, never edited.

| anchored_at (ISO, UTC) | run | head hash | reportHash | hub thread (slug or —) | note |
| --- | --- | --- | --- | --- | --- |
| 2026-07-13T01:01:49.905Z | t1-claude-code-sealed-run-2026-07-12T01-42-20Z | 660953ee1ac2dc5c0be34d54cbb591be28e7c85943bbe268d82ca18c73b276d2 | 2510a23b7710e761ae3ad526cb5c5ac7e1fb1d88b93bb6f51e3f6e288df0c9b5 | — | retroactive backfill; string-writer era run (knownGaps stand as recorded); anchored_at is backfill time, not run time |
