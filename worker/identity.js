// Phase 4 — participant identity. In production, identity comes from Cloudflare
// Access: the edge injects a signed `Cf-Access-Jwt-Assertion` we verify against
// the team's JWKS. For local dev (DEV_IDENTITY=true, set only in .dev.vars) we
// accept an `X-Clista-Email` header so the app is drivable without Access.
// The resolved actor_id is server-authoritative — clients never set their own.

const jwksCache = { url: null, keys: null, at: 0 };
const JWKS_TTL_MS = 60 * 60 * 1000;

function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const b64urlToString = (s) => new TextDecoder().decode(b64urlToBytes(s));

async function getJwks(team) {
  const url = `https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`;
  if (jwksCache.url === url && jwksCache.keys && Date.now() - jwksCache.at < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`JWKS fetch failed (${res.status})`);
  const body = await res.json();
  jwksCache.url = url;
  jwksCache.keys = body.keys || [];
  jwksCache.at = Date.now();
  return jwksCache.keys;
}

async function verifyAccessJwt(token, team, aud) {
  const [h, p, sig] = token.split('.');
  if (!h || !p || !sig) throw new Error('malformed token');
  const header = JSON.parse(b64urlToString(h));
  const payload = JSON.parse(b64urlToString(p));

  const keys = await getJwks(team);
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('unknown signing key');

  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    b64urlToBytes(sig),
    new TextEncoder().encode(`${h}.${p}`)
  );
  if (!ok) throw new Error('bad signature');

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) throw new Error('token expired');
  if (payload.iss !== `https://${team}.cloudflareaccess.com`) throw new Error('bad issuer');
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (aud && !auds.includes(aud)) throw new Error('audience mismatch');
  return payload;
}

function slug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

function identityFor(email, source) {
  const local = String(email).split('@')[0] || 'participant';
  const name = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
  return { authenticated: true, email, name: name || local, actorId: `par_${slug(local) || 'participant'}`, source };
}

// Resolve the caller's identity → { authenticated, email, name, actorId, source }.
export async function resolveIdentity(request, env) {
  const team = env.ACCESS_TEAM_DOMAIN;
  const aud = env.ACCESS_AUD;
  const jwt = request.headers.get('cf-access-jwt-assertion');

  if (team && aud && jwt) {
    try {
      const payload = await verifyAccessJwt(jwt, team, aud);
      return identityFor(payload.email || payload.sub || 'unknown', 'access');
    } catch (err) {
      return { authenticated: false, reason: String(err.message || err) };
    }
  }

  if (env.DEV_IDENTITY === 'true') {
    const email = request.headers.get('x-clista-email') || env.DEV_EMAIL || 'demo@clista.local';
    return identityFor(email, 'dev');
  }

  return { authenticated: false, reason: 'no Cloudflare Access assertion' };
}
