// harness.js — spawn `threadhub serve` as a real child process against a
// throwaway SQLite db in a tmpdir. Hermetic: stop() removes everything, even
// after a SIGKILL; a process-exit reaper catches orphans if the runner dies.
'use strict';
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');

const CLI = path.join(__dirname, '..', '..', 'bin', 'cli.js');

const LIVE = new Set(); // orphan safety net
process.on('exit', () => { for (const c of LIVE) c.kill('SIGKILL'); });

const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.listen(0, () => { const { port } = s.address(); s.close(() => resolve(port)); });
  s.on('error', reject);
});

// Readiness = the API answering, never the stdout log line (its format is not
// a contract). Rejects with captured stderr if the child dies first (EADDRINUSE).
async function waitReady(url, child, stderrBuf, deadlineMs = 10_000) {
  const deadline = Date.now() + deadlineMs;
  let exited = false;
  child.once('exit', () => { exited = true; });
  while (Date.now() < deadline) {
    if (exited) throw new Error(`hub exited before ready: ${stderrBuf.text}`);
    try {
      const res = await fetch(`${url}/`);
      if (res.ok && (await res.json()).instance === 'threadhub.v0') return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`hub not ready after ${deadlineMs}ms: ${stderrBuf.text}`);
}

async function spawnHub(port, dbPath, rateLimit) {
  const child = spawn(process.execPath,
    [CLI, 'serve', '--port', String(port), '--db', dbPath, '--rate-limit', String(rateLimit)],
    { cwd: path.join(__dirname, '..', '..'), stdio: ['ignore', 'pipe', 'pipe'] });
  const stderrBuf = { text: '' };
  child.stderr.on('data', (d) => { stderrBuf.text += d; });
  child.stdout.resume(); // drain; readiness comes from polling, not parsing
  LIVE.add(child);
  child.once('exit', () => LIVE.delete(child));
  try {
    await waitReady(`http://localhost:${port}`, child, stderrBuf);
  } catch (e) {
    child.kill('SIGKILL');
    throw e;
  }
  return child;
}

// Start a hub. Returns { url, port, dbPath, dir, child, kill, restart, stop }.
// rateLimit defaults sky-high — scenario tests opt IN to a real budget.
async function startHub({ rateLimit = 1_000_000, dir, dbPath } = {}) {
  dir ??= fs.mkdtempSync(path.join(os.tmpdir(), 'threadhub-loop-'));
  dbPath ??= path.join(dir, 'hub.db');

  const h = { dbPath, dir, rateLimit, stopped: false };

  const boot = async () => {
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) { // absorb freePort TOCTOU races
      const port = await freePort();
      try {
        h.child = await spawnHub(port, dbPath, rateLimit);
        h.port = port;
        h.url = `http://localhost:${port}`;
        return;
      } catch (e) { lastErr = e; }
    }
    throw lastErr;
  };

  // NB: a signal-terminated child has exitCode null and signalCode set — check
  // both, or a second kill() awaits an 'exit' that already fired (forever).
  h.kill = async (signal = 'SIGKILL') => {
    if (h.child.exitCode !== null || h.child.signalCode !== null) return;
    const exited = once(h.child, 'exit');
    h.child.kill(signal);
    await exited;
  };
  // Same dbPath (WAL recovery runs on reopen), fresh port (no undici corpses).
  h.restart = async () => { await h.kill(); await boot(); return h; };
  h.stop = async () => {
    if (h.stopped) return;
    h.stopped = true;
    await h.kill();
    fs.rmSync(dir, { recursive: true, force: true }); // db + -wal + -shm
  };

  await boot();
  return h;
}

module.exports = { startHub };
