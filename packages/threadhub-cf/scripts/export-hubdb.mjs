#!/usr/bin/env node
// export-hubdb.mjs — laptop-side hub.db → /admin/import payload.
//
//   node scripts/export-hubdb.mjs <path/to/hub.db> [flags]
//
//   --strip-private-keys   null out identities.private_key. REQUIRED for any
//                          payload that lands in git (committed fixtures):
//                          custodial PEMs must never be committed. Stripping
//                          is safe for verification — every record embeds
//                          author_key, so signatures verify without any
//                          private key. It is NOT the cutover mode: the real
//                          cutover import keeps keys so custodial writing
//                          continues on the Worker.
//   --heads                emit the golden head list instead of the payload:
//                          [{ thread_id, slug, records, head }] — the byte
//                          anchor a post-import verify run is held to.
//   --out <file>           write to a file instead of stdout.
//   --post <url> --token <t>
//                          POST the payload to <url> (the deployed
//                          /admin/import endpoint) with Authorization:
//                          Bearer <t>. Prints the response.
//
// Rows are exported VERBATIM (SELECT *): body, record_hash, signature,
// timestamps untouched. Ordering is pinned to match DOStore.exportRows()
// (identities/threads by id, records by thread_id, seq) so a laptop export
// and a DO /admin/export of the same data byte-diff clean at cutover.
// The database is opened READ-ONLY.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

function usage(msg) {
  if (msg) console.error(`error: ${msg}\n`);
  console.error('usage: node scripts/export-hubdb.mjs <hub.db> [--strip-private-keys] [--heads] [--out <file>] [--post <url> --token <t>]');
  process.exit(msg ? 1 : 0);
}

const args = process.argv.slice(2);
const dbPath = args[0] && !args[0].startsWith('--') ? args[0] : usage('missing hub.db path');
const flag = (name) => args.includes(name);
const value = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : (args[i + 1] ?? usage(`${name} needs a value`));
};

const strip = flag('--strip-private-keys');
const headsMode = flag('--heads');
const outPath = value('--out');
const postUrl = value('--post');
const token = value('--token');
if (postUrl && !token) usage('--post requires --token');

const db = new DatabaseSync(dbPath, { readOnly: true });

let output;
if (headsMode) {
  output = db.prepare(`
    SELECT t.id AS thread_id, t.slug AS slug,
           (SELECT COUNT(*) FROM records r WHERE r.thread_id = t.id) AS records,
           (SELECT r.record_hash FROM records r WHERE r.thread_id = t.id
            ORDER BY r.seq DESC LIMIT 1) AS head
    FROM threads t ORDER BY t.id
  `).all();
} else {
  const identities = db.prepare('SELECT * FROM identities ORDER BY id').all()
    .map((row) => (strip ? { ...row, private_key: null } : row));
  const threads = db.prepare('SELECT * FROM threads ORDER BY id').all();
  const records = db.prepare('SELECT * FROM records ORDER BY thread_id, seq').all();
  output = { identities, threads, records };
}
db.close();

const json = JSON.stringify(output, null, 2) + '\n';
if (outPath) {
  fs.writeFileSync(outPath, json);
  console.error(`wrote ${outPath}`);
} else if (!postUrl) {
  process.stdout.write(json);
}

if (postUrl) {
  if (headsMode) usage('--post posts the import payload, not --heads output');
  const res = await fetch(postUrl, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: json,
  });
  console.log(`${res.status} ${res.statusText}`);
  console.log(await res.text());
  if (!res.ok) process.exit(1);
}
