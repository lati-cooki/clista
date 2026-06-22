import { useState } from 'react';
import { css } from '../lib/css.js';
import { Svg } from '../lib/Svg.jsx';
import { Hoverable } from '../lib/Hoverable.jsx';
import { ico } from '../icons.js';
import { filterStyle } from '../styles.js';
import { composeTargets } from '../data.js';

const MONO = "font-family:'JetBrains Mono',monospace;";
const SEVERITIES = ['minor', 'major', 'blocking'];
const fieldLabel = "display:block; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#6a6a6a; margin-bottom:8px;";
const inputBase = "width:100%; padding:11px 13px; font-family:'JetBrains Mono',monospace; font-size:12.5px; color:#1a1a1a; background:#fcfcfb; border:1px solid #d8d8d6; border-radius:5px; outline:none;";

// rid() — short random id, mirrors the design's event-id generator.
function rid(prefix, n) {
  const h = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < n; i++) s += h[Math.floor(Math.random() * 16)];
  return prefix + s;
}

export function Compose({ go }) {
  const [target, setTarget] = useState('');
  const [statement, setStatement] = useState('');
  const [basis, setBasis] = useState('');
  const [severity, setSeverity] = useState('major');
  const [result, setResult] = useState(null);

  const clearResult = (setter) => (e) => {
    setter(e && e.target ? e.target.value : e);
    setResult(null);
  };

  const submit = () => {
    if (!target) {
      setResult({ ok: false, id: rid('evt_', 4), reason: 'objection.target is required — every objection must attach to a claim or the decision. Append rejected; reasoning state unchanged.' });
      return;
    }
    if (statement.trim().length < 12) {
      setResult({ ok: false, id: rid('evt_', 4), reason: 'objection.statement must state precisely what is challenged (min 12 chars). Append rejected; reasoning state unchanged.' });
      return;
    }
    setResult({ ok: true, evt: rid('evt_', 4), obj: rid('obj_', 4), target });
  };

  const reset = () => {
    setTarget('');
    setStatement('');
    setBasis('');
    setSeverity('major');
    setResult(null);
  };

  return (
    <div className="clista-screen" style={css('max-width:760px; margin:0 auto; padding:28px 40px 64px;')}>
      <div style={css('display:flex; align-items:center; gap:10px; margin-bottom:22px;')}>
        <Hoverable onClick={go('cockpit')} base={css(MONO + ' font-size:11px; color:#8a8a8a; background:none; border:none; cursor:pointer; letter-spacing:0.04em; padding:0;')} hover={css('color:#0a0a0a;')}>th_8f3ac1</Hoverable>
        <span style={css('color:#c4c4c2; ' + MONO + ' font-size:11px;')}>/</span>
        <span style={css(MONO + ' font-size:11px; color:#4a4a4a; letter-spacing:0.04em;')}>append</span>
      </div>

      <div style={css('margin-bottom:22px;')}>
        <div style={css('display:inline-flex; align-items:center; gap:8px; ' + MONO + ' font-size:11px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:#9a6b07; margin-bottom:11px;')}>
          <Svg html={ico('shield', { size: 14 })} />Append event · objection
        </div>
        <h1 style={css("margin:0 0 8px; font-family:'Inter Tight',sans-serif; font-size:28px; font-weight:600; letter-spacing:-0.015em; color:#0a0a0a;")}>Raise an objection</h1>
        <p style={css('margin:0; font-size:14px; color:#6a6a6a; line-height:1.55;')}>An objection is a recorded challenge. It does not block the decision — it becomes part of the thread's shape, and may survive the yes.</p>
      </div>

      <div style={css('background:#fff; border:1px solid #dcdcda; border-radius:7px; padding:24px;')}>
        {/* target */}
        <div style={css('margin-bottom:20px;')}>
          <label style={css(fieldLabel)}>objection.target <span style={css('color:#b3343c;')}>*</span></label>
          <div style={css('position:relative;')}>
            <select value={target} onChange={clearResult(setTarget)} style={css('appearance:none; ' + inputBase + ' padding:11px 38px 11px 13px; cursor:pointer;')}>
              {composeTargets.map((tg) => (
                <option key={tg.v} value={tg.v}>{tg.label}</option>
              ))}
            </select>
            <span style={css('position:absolute; right:13px; top:50%; transform:translateY(-50%); pointer-events:none; color:#8a8a8a; ' + MONO + ' font-size:11px;')}>▾</span>
          </div>
        </div>
        {/* statement */}
        <div style={css('margin-bottom:20px;')}>
          <label style={css(fieldLabel)}>objection.statement <span style={css('color:#b3343c;')}>*</span></label>
          <textarea
            value={statement}
            onChange={clearResult(setStatement)}
            placeholder="State precisely what this objection challenges, and what would retire it."
            rows={4}
            style={css("width:100%; resize:vertical; padding:12px 13px; font-family:'Inter Tight',sans-serif; font-size:14px; line-height:1.55; color:#1a1a1a; background:#fcfcfb; border:1px solid #d8d8d6; border-radius:5px; outline:none;")}
          />
        </div>
        {/* basis */}
        <div style={css('margin-bottom:20px;')}>
          <label style={css(fieldLabel)}>objection.basis <span style={css('color:#a5a5a5; font-weight:500;')}>optional</span></label>
          <input value={basis} onChange={clearResult(setBasis)} placeholder="evd_… reference, if grounded in evidence" style={css(inputBase)} />
        </div>
        {/* severity */}
        <div style={css('margin-bottom:24px;')}>
          <label style={css(fieldLabel)}>objection.severity</label>
          <div style={css('display:flex; gap:8px;')}>
            {SEVERITIES.map((sv) => (
              <button key={sv} onClick={() => { setSeverity(sv); setResult(null); }} style={filterStyle(severity === sv)}>{sv}</button>
            ))}
          </div>
        </div>

        <div style={css('display:flex; align-items:center; gap:12px; padding-top:20px; border-top:1px solid #ededeb;')}>
          <Hoverable onClick={submit} base={css('display:inline-flex; align-items:center; gap:8px; padding:11px 18px; background:#0a0a0a; color:#fff; border:none; border-radius:5px; ' + MONO + ' font-size:12px; font-weight:500; letter-spacing:0.04em; cursor:pointer;')} hover={css('background:#2a2a2a;')}>
            <Svg html={ico('checkArrow', { size: 14, sw: 1.9 })} />Append objection
          </Hoverable>
          <Hoverable onClick={reset} base={css('padding:11px 16px; background:none; color:#6a6a6a; border:1px solid #d8d8d6; border-radius:5px; ' + MONO + ' font-size:12px; cursor:pointer;')} hover={css('border-color:#0a0a0a; color:#0a0a0a;')}>Reset</Hoverable>
          <div style={css('flex:1;')} />
          <span style={css(MONO + ' font-size:10.5px; color:#a5a5a5;')}>fail-closed · validated before append</span>
        </div>
      </div>

      {/* result */}
      {result && !result.ok && (
        <div style={css('display:flex; gap:13px; margin-top:18px; padding:16px 18px; background:#f8eeee; border:1px solid rgba(179,52,60,0.3); border-left:3px solid #b3343c; border-radius:6px; animation:clistaFade 0.2s ease-out;')}>
          <Svg html={ico('circleX', { size: 18, sw: 1.9 })} style={css('flex:none; color:#b3343c; margin-top:1px;')} />
          <div>
            <div style={css('display:flex; align-items:center; gap:10px; margin-bottom:6px;')}>
              <span style={css(MONO + ' font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#b3343c;')}>Event rejected</span>
              <span style={css(MONO + ' font-size:11px; color:#9a6b6b;')}>{result.id}</span>
            </div>
            <p style={css('margin:0; font-size:13px; line-height:1.55; color:#7a3a3d; text-wrap:pretty;')}>{result.reason}</p>
          </div>
        </div>
      )}
      {result && result.ok && (
        <div style={css('display:flex; gap:13px; margin-top:18px; padding:16px 18px; background:#eef5f0; border:1px solid rgba(28,122,79,0.3); border-left:3px solid #1c7a4f; border-radius:6px; animation:clistaFade 0.2s ease-out;')}>
          <Svg html={ico('circleCheckBig', { size: 18, sw: 1.9 })} style={css('flex:none; color:#1c7a4f; margin-top:1px;')} />
          <div>
            <div style={css('display:flex; align-items:center; gap:10px; margin-bottom:8px;')}>
              <span style={css(MONO + ' font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#1c7a4f;')}>Event appended</span>
              <span style={css(MONO + ' display:inline-flex; align-items:center; gap:5px; font-size:10px; color:#1c7a4f;')}>validate <Svg html={ico('check', { size: 11, sw: 2.4 })} /></span>
            </div>
            <div style={css(MONO + ' display:grid; grid-template-columns:auto 1fr; gap:5px 14px; font-size:12px; color:#2a5a44;')}>
              <span style={css('color:#6a9a82;')}>objection.id</span><span>{result.obj}</span>
              <span style={css('color:#6a9a82;')}>event.id</span><span>{result.evt}</span>
              <span style={css('color:#6a9a82;')}>attached.to</span><span>{result.target}</span>
            </div>
            <p style={css('margin:8px 0 0; font-size:12.5px; color:#3a6a52;')}>Reasoning state updated. The objection is now part of the thread's shape and will be re-evaluated at decision time.</p>
          </div>
        </div>
      )}
    </div>
  );
}
