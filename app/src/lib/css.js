// Parse a CSS declaration string ("display:flex; gap:10px") into a React style
// object ({ display: 'flex', gap: '10px' }). Lets us carry the design's exact
// inline-style strings into JSX with no lossy hand-conversion.
export function css(str) {
  const out = {};
  if (!str) return out;
  for (const decl of str.split(';')) {
    const i = decl.indexOf(':');
    if (i === -1) continue;
    const prop = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (!prop || !val) continue;
    const jsProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[jsProp] = val;
  }
  return out;
}

// Merge any number of style strings/objects into one React style object.
export function sx(...parts) {
  return Object.assign({}, ...parts.map((p) => (typeof p === 'string' ? css(p) : p || {})));
}
