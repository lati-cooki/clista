// helpers.js — shared sandbox test plumbing.
import { SELF, env, runInDurableObject } from 'cloudflare:test';

export const BASE = 'https://sandbox.example';

// Pool 0.18 shares DO storage across `it` blocks in a file. Wipe the sandbox
// DO's tables between tests that assert on counts/capacity. (The trigger-free
// store makes record DELETE possible — impossible on the prod store.)
export async function resetSandbox() {
  const stub = env.SANDBOX.get(env.SANDBOX.idFromName('sandbox-prod'));
  await runInDurableObject(stub, (i) => {
    i.store.sql.exec('DELETE FROM records');
    i.store.sql.exec('DELETE FROM threads');
    i.store.sql.exec('DELETE FROM identities');
  });
}

let ipCounter = 0;
// A distinct per-IP window per call keeps one test's writes from spending
// another's rate budget (the limiter is per-IP, in-DO memory).
export const freshIp = () => `10.0.${(ipCounter >> 8) & 255}.${ipCounter++ & 255}`;

// POST /try. ip defaults to a fresh, isolated address.
export async function tryPost(body, { ip = freshIp(), headers = {} } = {}) {
  return SELF.fetch(BASE + '/try', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

export const get = (path) => SELF.fetch(BASE + path);

// Create one sandbox thread and return its parsed { slug, headHash, viewUrl }.
export async function seedTry(decision = 'We will ship on Friday.', opts = {}) {
  const res = await tryPost({ decision }, opts);
  if (res.status !== 200) throw new Error(`seedTry failed: ${res.status} ${await res.text()}`);
  return res.json();
}
