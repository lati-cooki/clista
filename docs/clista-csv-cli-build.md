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

2. **clista-csv-cli-build-v2** (slug: `clista-csv-cli-build-v2`, id: `thd_f35bd1d6ffdc`) — **current**
   - Dedicated governance thread for the ClisTa CSV CLI Build Consensus.
   - 25 records (genesis + 24 events).
   - Ingested from the corrected, **validating** combined event log (`examples/clista-csv-cli-build.ndjson` in the clista-protocol repo). `node src/cli.js validate` passes (exit 0) and the log projects a full `clista.threadState.v0`.
   - Contains: participants (`id_troy`, `par_octopus`), a `ParticipantAuthorityGranted` (id_troy → decision_owner), DecisionRequest, 3 `DelegationGranted` (one per build arm), foundation `EvidenceCommitted`, 4 Claims, an `AssumptionDeclared`, 3 `ExecutionStarted` (each authorized by its delegation), Positions, Review, 3 live `EvidenceCommitted` (referencing the octo-build blocks by record hash), and a final `DecisionMerged` (`decisionRecord`, approved) — in that causal order.
   - Created via: `node bin/cli.js ingest --events examples/clista-csv-cli-build.ndjson --author id_troy --title "ClisTa CSV CLI Build Consensus (validated)" --slug clista-csv-cli-build-v2`
   - Verify: `node bin/cli.js verify --thread clista-csv-cli-build-v2`
   - Head: `sha256:73c6b909aaff53a2746cf4c3ec8459884954c5925d39c271e3be4e27fdcfd1f2`

   > **Historical:** the original `clista-csv-cli-build` (id `thd_99f812b60f7c`, 20 records) was ingested from an earlier draft of the log that did **not** validate cleanly (the `DecisionMerged` used `payload.decision` instead of `payload.decisionRecord`, and the executions referenced a decision that didn't exist yet). ThreadHub is append-only, so that thread stays as immutable history; `-v2` is the corrected, validating record.

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
3. Clean combined log built and **validated** against the ClisTa protocol (`node src/cli.js validate`): participants and authority first, the build arms modeled as `DelegationGranted` (Octopus is a delegated executor), delegation-authorized `ExecutionStarted`, a supporting `AssumptionDeclared`, then the live evidences, with the `DecisionMerged` last (governance gates/ratifies after review).
4. The validating log was ingested into the dedicated `clista-csv-cli-build-v2` thread.

Future arms (tests, docs, error handling) or new blocks can be emitted the same way. To keep governance clean, continue referencing by hash, extend `examples/clista-csv-cli-build.ndjson` (re-validate, then re-ingest into a fresh `-vN` thread).

## Explore the Example

```sh
# In ThreadHub
node bin/cli.js thread list
node bin/cli.js verify --thread clista-csv-cli-build-v2
node bin/cli.js verify --thread octo-build
node bin/cli.js export --thread clista-csv-cli-build-v2 | head -c 2000

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

- **Dedicated slug**: `clista-csv-cli-build-v2` is the home for the (validated) ClisTa consensus view of this CSV CLI build. `clista-csv-cli-build` is its pre-fix predecessor, kept as immutable history.
- **Raw signals**: Stay in `octo-build` (general Octopus log) but are first-class citizens in ClisTa via hash references.
- **Future work on this project**: When emitting cascade-blocks or recoveries for remaining CSV arms, use `--slug octo-build` (or a project-specific one), add the resulting events to `examples/clista-csv-cli-build.ndjson`, re-validate, and re-ingest into a fresh `-vN` thread.
- **Non-custodial + verifiable**: All records self-verify. `trusted: false` by design.
- **Clean-room artifact**: `examples/clista-csv-cli-build.ndjson` (in clista-protocol) is the portable, replayable combined log.
- **Server**: `node bin/cli.js serve --port 7777` exposes `/t/clista-csv-cli-build` and `/t/octo-build`.

This demonstrates the full integration without polluting either repo's primary history. The clean log + dedicated thread make it the reference for "how ClisTa + ThreadHub + Octopus work together in practice."

See also:
- clista-protocol `examples/clista-csv-cli-build.ndjson` and its README for the ClisTa side.
- `docs/octopus-writer.md` for the mapping rules.
- `adapters/octopus.js` and `adapters/octopus-cli.js`.
