#!/usr/bin/env node
// threadhub CLI — zero dependencies, Node >= 22.
'use strict';
const fs = require('node:fs');
const { Hub } = require('../src/hub');
const { createServer } = require('../src/server');

const args = process.argv.slice(2);
const cmd = args[0];
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const DB = flag('db', process.env.THREADHUB_DB ?? './data/hub.db');

function out(x) { console.log(typeof x === 'string' ? x : JSON.stringify(x, null, 2)); }

try {
  switch (cmd) {
    case 'identity': {
      const hub = new Hub(DB);
      if (args[1] === 'create') {
        out(hub.createIdentity({ displayName: flag('name'), kind: flag('kind', 'human') }));
      } else out(hub.store.listIdentities());
      break;
    }
    case 'thread': {
      const hub = new Hub(DB);
      if (args[1] === 'create') {
        out(hub.createThread({ title: flag('title'), question: flag('question'), authorId: flag('author') }));
      } else out(hub.store.listThreads());
      break;
    }
    case 'append': {
      const hub = new Hub(DB);
      const payload = JSON.parse(flag('payload', '{}'));
      const r = hub.append({ threadId: flag('thread'), authorId: flag('author'), kind: flag('kind', 'note'), payload });
      out({ record_hash: r.record_hash, seq: r.seq });
      break;
    }
    case 'ingest': {
      const hub = new Hub(DB);
      const events = fs.readFileSync(flag('events'), 'utf8')
        .split('\n').filter(Boolean).map((l) => JSON.parse(l));
      const { thread, records } = hub.ingestClistaEvents({
        events, authorId: flag('author'), title: flag('title'), slug: flag('slug'),
      });
      out({ thread: thread.id, slug: thread.slug, records: records.length, head: records.at(-1).record_hash });
      break;
    }
    case 'attest': {
      const hub = new Hub(DB);
      const r = hub.attest({ threadId: flag('thread'), authorId: flag('author'),
                             payloadHash: flag('hash'), claim: flag('claim') });
      out({ record_hash: r.record_hash, seq: r.seq });
      break;
    }
    case 'verify': {
      const hub = new Hub(DB);
      const report = hub.verifyThread(flag('thread'));
      out(report);
      process.exitCode = report.valid ? 0 : 1;
      break;
    }
    case 'export': {
      const hub = new Hub(DB);
      out(new Hub(DB).exportThread(flag('thread')));
      break;
    }
    case 'serve': {
      const port = Number(flag('port', 7777));
      const { server } = createServer(DB);
      server.listen(port, () => console.log(`threadhub listening on http://localhost:${port}  (db: ${DB})`));
      break;
    }
    default:
      out(`threadhub — signed, hash-chained decision record store

usage:
  threadhub identity create --name <n> --kind human|agent|org [--db path]
  threadhub identity list
  threadhub thread create --title <t> [--question <q>] --author <id>
  threadhub thread list
  threadhub append --thread <id|slug> --author <id> --kind note|clista.event --payload '<json>'
  threadhub ingest --events <clista.ndjson> --author <id> [--title t] [--slug s]
  threadhub attest --thread <id|slug> --author <id> --hash sha256:<hex> [--claim text]
  threadhub verify --thread <id|slug>
  threadhub export --thread <id|slug>
  threadhub serve [--port 7777]`);
  }
} catch (e) {
  console.error('error:', e.message);
  process.exitCode = 1;
}
