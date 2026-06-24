import { useState } from 'react';
import { css } from './css.js';
import { Svg } from './Svg.jsx';
import { ico } from '../icons.js';
import { Hoverable } from './Hoverable.jsx';
import { api } from '../api.js';

const MONO = "font-family:'JetBrains Mono',monospace;";

// A compact, reusable append form. Owns the draft → validate → append → reload
// lifecycle (mirroring the cockpit's "Record the decision" panel) so each cockpit
// affordance supplies only its fields via the `children` render-prop and its event
// shape via `build`. Surfaces the engine's fail-closed reason(s) inline.
//
//   build:    (draft) => ({ event_type, payload })   — from src/events.js
//   validate: (draft) => string | null               — client guard, optional
//   children: (draft, set) => ReactNode               — set(key, value) updates draft
export function InlineComposer({
  threadId, accent = '#0a0a0a', initial = {}, build, validate,
  submitLabel = 'append', onDone, onCancel, children,
}) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const set = (key, value) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setResult(null);
  };

  const submit = async () => {
    const reason = validate ? validate(draft) : null;
    if (reason) {
      setResult({ ok: false, reason });
      return;
    }
    setBusy(true);
    const res = await api.append(threadId, build(draft));
    setBusy(false);
    if (res.ok && res.data && res.data.ok) {
      setResult({ ok: true, evt: res.data.event.event_id });
      setDraft(initial);
      if (onDone) onDone();
    } else {
      const reasons = (res.data && res.data.reasons) || [];
      setResult({
        ok: false,
        reason: reasons.length
          ? reasons.map((r) => r.reason).join(' · ')
          : (res.data && res.data.error) || 'append rejected, fail-closed.',
      });
    }
  };

  return (
    <div style={css('margin-top:11px; padding:13px 15px; background:#f7f7f6; border:1px solid #e8e8e6; border-left:3px solid ' + accent + '; border-radius:5px; animation:clistaFade 0.2s ease-out;')}>
      {children(draft, set)}
      <div style={css('display:flex; align-items:center; gap:13px; margin-top:11px; flex-wrap:wrap;')}>
        <Hoverable
          onClick={busy ? undefined : submit}
          base={css('display:inline-flex; align-items:center; gap:7px; padding:8px 14px; background:' + accent + '; color:#fff; border:none; border-radius:5px; ' + MONO + ' font-size:11px; font-weight:500; letter-spacing:0.04em; cursor:' + (busy ? 'default' : 'pointer') + '; opacity:' + (busy ? '0.6' : '1') + ';')}
          hover={css('filter:brightness(0.92);')}
        >
          {busy ? 'recording…' : submitLabel}
        </Hoverable>
        {onCancel && (
          <Hoverable onClick={onCancel} base={css('background:none; border:none; cursor:pointer; ' + MONO + ' font-size:11px; color:#9a9a9a; padding:0;')} hover={css('color:#5a5a5a;')}>cancel</Hoverable>
        )}
        {result && !result.ok && (
          <span style={css(MONO + ' font-size:11px; color:#b3343c; line-height:1.5; text-wrap:pretty;')}>{result.reason}</span>
        )}
        {result && result.ok && (
          <span style={css(MONO + ' display:inline-flex; align-items:center; gap:5px; font-size:11px; color:#1c7a4f;')}>
            <Svg html={ico('check', { size: 12, sw: 2.2 })} />appended · {result.evt}
          </span>
        )}
      </div>
    </div>
  );
}
