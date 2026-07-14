// turnstile.js — the PLUGGABLE bot-protection seam for POST /try.
//
// This is a clean seam, NOT a shipped bypass. Its posture is a pure function
// of whether a secret is configured:
//
//   • secret UNSET (env.TURNSTILE_SECRET absent/empty) → ALLOW (no-op). This
//     is the pre-widget / test posture: the sandbox is buildable and testable
//     before Troy creates the Turnstile widget (owner-gated, Phase 3). It does
//     NOT ship open by accident — production sets the secret, which flips the
//     posture to fail-closed below.
//
//   • secret SET but token missing/blank → FAIL CLOSED (refuse). A configured
//     sandbox never accepts an un-vouched write.
//
//   • secret SET and token present → call Cloudflare's siteverify server-side
//     and honor its verdict. Never call siteverify from the browser.
//
// Phase 3 wires the real widget by (a) `wrangler secret put TURNSTILE_SECRET`
// and (b) adding the widget + cf-turnstile-response token to the Genesis
// screen — no change to this file's logic.

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Returns { ok: boolean, reason: string }. `reason` is for server-side
// logging/telemetry only — POST /try maps !ok to a uniform 403 so the client
// learns nothing beyond "not allowed".
//
// `siteverify` is injectable purely so tests can assert the secret-set +
// token-present branch without a network call; production uses the default
// (a real fetch to Cloudflare).
export async function verifyTurnstile({ secret, token, remoteip } = {}, siteverify = realSiteverify) {
  if (typeof secret !== 'string' || secret === '') {
    return { ok: true, reason: 'turnstile-disabled' }; // no widget yet → allow
  }
  if (typeof token !== 'string' || token === '') {
    return { ok: false, reason: 'missing-token' }; // configured → fail closed
  }
  try {
    const result = await siteverify({ secret, token, remoteip });
    return result?.success
      ? { ok: true, reason: 'siteverify-pass' }
      : { ok: false, reason: 'siteverify-fail' };
  } catch {
    // A siteverify transport failure on a configured sandbox fails closed —
    // an outage must not become an open door.
    return { ok: false, reason: 'siteverify-error' };
  }
}

async function realSiteverify({ secret, token, remoteip }) {
  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);
  if (remoteip && remoteip !== '?') form.set('remoteip', remoteip);
  const res = await fetch(SITEVERIFY_URL, { method: 'POST', body: form });
  return res.json();
}
