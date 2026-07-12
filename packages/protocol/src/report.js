// Report-layer verification (DR-2026-07-12 claim-citation events, Mutual
// Reliance Slice 4). Chain verification proves the log is true; it says
// nothing about whether prose ABOUT the log is true. verifyReport extends
// verification to the report layer with exactly three mechanical checks, no
// judgment:
//   1. chain      — the event chain verifies (verifyEventIntegrity, unchanged)
//   2. existence  — every cited hash is the content_hash of an EARLIER event
//                   in the SAME thread as the report
//   3. coverage   — no claim lacks a citation
// Pure function: reads its input, mutates nothing, returns a result object.
// Failure output is examiner-facing and specific: which claim (index and
// text), which hash, which gap. These checks are necessary, not sufficient —
// they prove every claim points at a witness, not that the prose faithfully
// renders it (that residue is what the T2 ventriloquism diff surfaces).
const { verifyEventIntegrity } = require("./integrity");

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
      }
    }

    if (event && event.thread_id && event.content_hash) {
      let set = seenByThread.get(event.thread_id);
      if (!set) {
        set = new Set();
        seenByThread.set(event.thread_id, set);
      }
      set.add(event.content_hash);
    }
  });

  return {
    valid: errors.length === 0,
    reportCount,
    errors
  };
}

module.exports = { verifyReport };
