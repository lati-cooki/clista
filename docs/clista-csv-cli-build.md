# Running Example: ClisTa-Governed CSV CLI Build (Octopus + ThreadHub + ClisTa)

This is the canonical live example of the full stack in operation:

- **Octopus** (Hermes Agent execution/orchestration) runs active arms for a CSV reporting CLI (pandas-first parsing + stdlib fallback, summary stats, fire-based CLI integration + error handling).
- **ThreadHub** stores the raw execution signals as signed, hash-chained `clista.event` records (non-custodial: Octopus holds its own key).
- **ClisTa Protocol** projects the signals into governance: DecisionRequests, Claims, Evidence (including live blocks), Positions, Review, and a clean `clista.threadState.v0`.
- Cross-linking via content hashes: ClisTa evidences cite exact ThreadHub record hashes from the execution signals.

## The Two Threads

1. **octo-build** (slug: `octo-build`, id: `thd_99d9259d7b90`)
   - Raw Octopus build log.
   - 8 records (as of 2026-06-12).
   - Contains the 3 live cascade-blocks from the active CSV arms (seq 5, 6, 7).
   - Each cascade-block mapped by `adapters/octopus.js` to `ObjectionRaised`.
   - Verify: `node bin/cli.js verify --thread octo-build`
   - Head (after CLI arm): `sha256:460f601d1af6306a4c1898198d8ade9f394933bbae9781f82c05121fa4e559ef`

2. **clista-csv-cli-build** (slug: `clista-csv-cli-build`, id: `thd_99f812b60f7c`)
   - Dedicated governance thread for the ClisTa CSV CLI Build Consensus.
   - 20 records.
   - Ingested from the clean combined event log (`examples/clista-csv-cli-build.ndjson` in the clista-protocol repo).
   - Contains: participants (`id_troy`, `par_octopus`), DecisionRequest + DecisionMerged, 4 Claims, 3 `ExecutionStarted`, Positions, Review, and 3 `EvidenceCommitted` that reference the live Octopus blocks by ThreadHub record hash.
   - Created via: `node bin/cli.js ingest --events ... --author id_troy --title "ClisTa CSV CLI Build Consensus" --slug clista-csv-cli-build`
   - Verify: `node bin/cli.js verify --thread clista-csv-cli-build`
   - Head: `sha256:1a376724be4d5e633ec2875d8630c4e605a81c996d87a16e503bd9ef229b438c`

The threads are linked by **content hashes** (not shared state):
- In `clista-csv-cli-build` the live evidences (evd_live_*) carry `artifactIds` with the exact octo-build record hashes (e.g. `sha256:27226cae...` for parsing arm, `6c39ae70...` for stats, `460f601d...` for CLI integration).
- Provenance traces in ClisTa point directly to "ThreadHub octo-build seq N (live arm-...)" + the hash.
- Attribution distinguishes layers: `par_octopus` for execution dissent (Objections), `id_troy` for governance actions (claims, evidence commits, review).

## How the Live Signals Were Added (one-at-a-time)

1. Active arms listed via `octopus_status`.
2. For each primary arm (parsing, stats, CLI integration):
   - `node adapters/octopus-cli.js emit --hub ... --slug octo-build --event '{ "type": "cascade-block", "build_id": "...", "task": "..." }'`
   - Reconstructed the resulting `ObjectionRaised` via `mapBuildEvent`.
   - Committed as `EvidenceCommitted` in the ClisTa CSV thread (with source, finding, and the record hash).
3. Clean combined log built (participants first, correct `ExecutionStarted` shapes with `executionRecord`, DecisionMerged, 3 live evidences).
4. The clean log was ingested into this dedicated `clista-csv-cli-build` thread.

Future arms (tests, docs, error handling) or new blocks can be emitted the same way. To keep governance clean, continue referencing by hash or ingest additional events into `clista-csv-cli-build`.

## Explore the Example

```sh
# In ThreadHub
node bin/cli.js thread list
node bin/cli.js verify --thread clista-csv-cli-build
node bin/cli.js verify --thread octo-build
node bin/cli.js export --thread clista-csv-cli-build | head -c 2000

# Cross-link example (from clista-csv-cli-build evidence)
# The artifact hash points to a record in octo-build:
# sha256:27226cae760ff273a45976659e82f179dd7b96c7db2f2ebea96c042b18ca8ac9

# In clista-protocol (with the saved clean log)
node src/cli.js validate --events examples/clista-csv-cli-build.ndjson
node src/cli.js state show --thread thd_csv_cli_build_consensus_mqa0yqno_95493e23 --events examples/clista-csv-cli-build.ndjson
node src/cli.js attribution by-participant --participant par_octopus --events examples/clista-csv-cli-build.ndjson
node src/cli.js provenance trace --contribution evd_live_p2 --events examples/clista-csv-cli-build.ndjson
```

## Operational Notes

- **Dedicated slug**: `clista-csv-cli-build` is the home for the ClisTa consensus view of this CSV CLI build.
- **Raw signals**: Stay in `octo-build` (general Octopus log) but are first-class citizens in ClisTa via hash references.
- **Future work on this project**: When emitting cascade-blocks or recoveries for remaining CSV arms, use `--slug octo-build` (or a project-specific one) and commit the resulting events as evidence (or ingest) into the `clista-csv-cli-build` thread.
- **Non-custodial + verifiable**: All records self-verify. `trusted: false` by design.
- **Clean-room artifact**: `examples/clista-csv-cli-build.ndjson` (in clista-protocol) is the portable, replayable combined log.
- **Server**: `node bin/cli.js serve --port 7777` exposes `/t/clista-csv-cli-build` and `/t/octo-build`.

This demonstrates the full integration without polluting either repo's primary history. The clean log + dedicated thread make it the reference for "how ClisTa + ThreadHub + Octopus work together in practice."

See also:
- clista-protocol `examples/clista-csv-cli-build.ndjson` and its README for the ClisTa side.
- `docs/octopus-writer.md` for the mapping rules.
- `adapters/octopus.js` and `adapters/octopus-cli.js`.
