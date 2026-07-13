// Report-layer verification (DR-2026-07-12 claim-citation events, Mutual
// Reliance Slice 4; curation check added by DR-2026-07-12-curation-check,
// Phase 5 Wave 2). Chain verification proves the log is true; it says
// nothing about whether prose ABOUT the log is true. verifyReport extends
// verification to the report layer with exactly four mechanical checks, no
// judgment:
//   1. chain      — the event chain verifies (verifyEventIntegrity, unchanged)
//   2. existence  — every cited hash is the content_hash of an EARLIER event
//                   in the SAME thread as the report
//   3. coverage   — no claim lacks a citation
//   4. curation   — every dissent-bearing event (DISSENT_BEARING_TYPES)
//                   EARLIER in the report's thread is either cited by some
//                   claim or disclosed in the report's omitted_dissent[]
//                   with a non-empty reason; silent omission fails
// Pure function: reads its input, mutates nothing, returns a result object.
// Failure output is examiner-facing and specific: which claim (index and
// text), which hash, which gap, which silenced dissent (index, type, hash).
// These checks are necessary, not sufficient — they prove every claim points
// at a witness and no dissent vanished silently, not that the prose
// faithfully renders either (that residue is what the T2 ventriloquism diff
// surfaces).
const { verifyEventIntegrity } = require("./integrity");
const { DISSENT_BEARING_TYPE_SET } = require("./event-types");

function describeClaim(index, text) {
  const label = typeof text === "string" && text.length > 0 ? ` ("${text}")` : "";
  return `claim ${index + 1}${label}`;
}

function verifyReport(events) {
  const list = Array.isArray(events) ? events : [];
  const errors = [];
  let reportCount = 0;

  // Check 1 — chain. Run once over the whole log; report-layer checks below
  // still run so an examiner sees every failure at once, not one at a time.
  const integrity = verifyEventIntegrity(list);
  if (!integrity.valid) {
    for (const reason of integrity.reasons || []) {
      errors.push({
        check: "chain",
        eventId: reason.event_id ?? null,
        index: reason.index,
        reason: reason.reason
      });
    }
  }

  // Hashes seen so far, per thread — a report may cite only its own thread's
  // strict past, so membership is tested against the prefix at the report's
  // position, never the whole log.
  const seenByThread = new Map();

  // Dissent-bearing events seen so far, per thread (check 4). Same
  // strict-past rule: a report answers only for dissent that precedes it.
  const dissentByThread = new Map();

  list.forEach((event, index) => {
    if (event && event.event_type === "SealedReport") {
      reportCount += 1;
      const report = event.payload?.sealedReport;
      const reportEventId = event.event_id ?? null;
      if (!report || typeof report !== "object") {
        errors.push({
          check: "structure",
          reportEventId,
          index,
          reason: `SealedReport event at index ${index} has no sealedReport payload`
        });
      } else {
        const reportId = report.id ?? null;
        const earlier = seenByThread.get(event.thread_id) || new Set();
        if (!Array.isArray(report.claims)) {
          errors.push({
            check: "structure",
            reportEventId,
            reportId,
            index,
            reason: `SealedReport ${reportId ?? `at index ${index}`} claims is not an array`
          });
        } else {
          report.claims.forEach((claim, claimIndex) => {
            const claimText = claim && typeof claim.text === "string" ? claim.text : null;
            const cited = claim && Array.isArray(claim.citedEventHashes) ? claim.citedEventHashes : [];
            // Check 3 — coverage.
            if (cited.length === 0) {
              errors.push({
                check: "coverage",
                reportEventId,
                reportId,
                claimIndex,
                claimText,
                reason: `${describeClaim(claimIndex, claimText)} has no citations`
              });
              return;
            }
            // Check 2 — existence.
            for (const hash of cited) {
              if (!earlier.has(hash)) {
                errors.push({
                  check: "existence",
                  reportEventId,
                  reportId,
                  claimIndex,
                  claimText,
                  citedHash: hash,
                  reason: `${describeClaim(claimIndex, claimText)} cites ${hash}, which resolves to no earlier event in thread ${event.thread_id}`
                });
              }
            }
          });
        }

        // Check 4 — curation (DR-2026-07-12-curation-check). Mechanical
        // set-comparison, no prose judgment: a dissent-bearing event in the
        // report's strict past is satisfied by a citation from ANY claim, or
        // by an omitted_dissent[] entry carrying a non-empty reason. A
        // missing omitted_dissent field is simply an empty disclosure set —
        // pre-curation reports with fully cited dissent still pass.
        const citedUnion = new Set();
        if (Array.isArray(report.claims)) {
          for (const claim of report.claims) {
            if (claim && Array.isArray(claim.citedEventHashes)) {
              for (const hash of claim.citedEventHashes) {
                citedUnion.add(hash);
              }
            }
          }
        }
        const disclosed = new Set();
        if (Array.isArray(report.omitted_dissent)) {
          for (const entry of report.omitted_dissent) {
            if (
              entry &&
              typeof entry.eventHash === "string" &&
              typeof entry.reason === "string" &&
              entry.reason.trim().length > 0
            ) {
              disclosed.add(entry.eventHash);
            }
          }
        }
        for (const dissent of dissentByThread.get(event.thread_id) || []) {
          if (!citedUnion.has(dissent.eventHash) && !disclosed.has(dissent.eventHash)) {
            errors.push({
              check: "curation",
              reportEventId,
              reportId,
              eventIndex: dissent.eventIndex,
              eventId: dissent.eventId,
              eventType: dissent.eventType,
              eventHash: dissent.eventHash,
              reason:
                `dissent-bearing event ${dissent.eventId ?? "(no event_id)"} at index ${dissent.eventIndex} ` +
                `(${dissent.eventType}, ${dissent.eventHash}) is neither cited by any claim nor disclosed in ` +
                `omitted_dissent by report ${reportId ?? `at index ${index}`}`
            });
          }
        }
      }
    }

    if (event && event.thread_id && event.content_hash) {
      let set = seenByThread.get(event.thread_id);
      if (!set) {
        set = new Set();
        seenByThread.set(event.thread_id, set);
      }
      set.add(event.content_hash);

      // Recorded AFTER report handling, like seenByThread: an event at the
      // report's own index is not in the report's past.
      if (DISSENT_BEARING_TYPE_SET.has(event.event_type)) {
        let list = dissentByThread.get(event.thread_id);
        if (!list) {
          list = [];
          dissentByThread.set(event.thread_id, list);
        }
        list.push({
          eventIndex: index,
          eventId: event.event_id ?? null,
          eventType: event.event_type,
          eventHash: event.content_hash
        });
      }
    }
  });

  return {
    valid: errors.length === 0,
    reportCount,
    errors
  };
}

module.exports = { verifyReport };
