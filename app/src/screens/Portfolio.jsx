import { useEffect, useState } from 'react';
import { css } from '../lib/css.js';
import { Svg } from '../lib/Svg.jsx';
import { Hoverable } from '../lib/Hoverable.jsx';
import { ico } from '../icons.js';
import { api } from '../api.js';
import { relativeTime } from '../adapt.js';

const MONO = "font-family:'JetBrains Mono',monospace;";
const label = MONO + ' font-size:9.5px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#a5a5a5;';

// Pipeline columns (decided_with_conditions folds into DECIDED, badged on the card).
const COLUMNS = [
  { key: 'active', label: 'Active', stages: ['active'] },
  { key: 'in_review', label: 'In Review', stages: ['in_review'] },
  { key: 'decided', label: 'Decided', stages: ['decided', 'decided_with_conditions'] },
  { key: 're_review', label: 'Re-review', stages: ['re_review'] },
];
const ATTENTION = [
  { key: 're_review', label: 'RE-REVIEW' },
  { key: 'contested', label: 'CONTESTED' },
  { key: 'overdue', label: 'OVERDUE' },
  { key: 'unevidenced', label: 'UNEVIDENCED' },
  { key: 'with_conditions', label: 'W/COND' },
];

export function Portfolio({ openThread }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    api.portfolio().then((res) => {
      if (!live) return;
      if (res.ok) setData(res.data);
      else setError(res.data.error || 'failed to load portfolio');
    });
    return () => { live = false; };
  }, []);

  const threads = (data && data.threads) || [];
  const summary = (data && data.summary) || { total: 0, byStage: {}, attention: {}, allChainValid: true };
  const attentionThreads = (key) => threads.filter((t) => (t.attention || []).includes(key));

  return (
    <div className="clista-screen" style={css('max-width:1180px; margin:0 auto; padding:28px 40px 64px;')}>
      {/* header */}
      <div style={css('display:flex; align-items:flex-end; gap:16px; margin-bottom:22px;')}>
        <div>
          <div style={css(MONO + ' font-size:11px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:#9a9a9a; margin-bottom:9px;')}>Portfolio</div>
          <h1 style={css("margin:0; font-family:'Inter Tight',sans-serif; font-size:28px; font-weight:600; letter-spacing:-0.015em; color:#0a0a0a;")}>Decision portfolio</h1>
        </div>
        <div style={css('flex:1;')} />
        <span style={css(MONO + ' font-size:12px; color:#9a9a9a; padding-bottom:5px;')}>
          {data ? `${summary.total} threads · chain ${summary.allChainValid ? '✓ all valid' : '✗ INVALID'}` : 'loading…'}
        </span>
      </div>

      {/* integrity alarm — should never fire */}
      {data && !summary.allChainValid && (
        <div style={css('margin-bottom:18px; padding:13px 16px; background:#f8eeee; border:1px solid rgba(179,52,60,0.35); border-left:3px solid #b3343c; border-radius:6px; ' + MONO + ' font-size:12.5px; color:#7a3a3d;')}>
          INTEGRITY ALARM — one or more threads failed chain validation. This is the most important thing on this page.
        </div>
      )}

      {/* attention banner */}
      <div style={css('margin-bottom:22px; padding:16px 18px; background:#fff; border:1px solid #dcdcda; border-radius:8px;')}>
        <div style={css('display:flex; align-items:center; gap:9px; margin-bottom:12px;')}>
          <Svg html={ico('alertTriangle', { size: 15, sw: 1.8 })} style={css('color:#9a6b07;')} />
          <span style={css(MONO + ' font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#9a6b07;')}>Needs attention</span>
        </div>
        <div style={css('display:flex; flex-wrap:wrap; gap:10px 20px; margin-bottom:12px;')}>
          {ATTENTION.map((a) => (
            <span key={a.key} style={css(MONO + ' font-size:11px; color:' + ((summary.attention[a.key] || 0) > 0 ? '#5a4207' : '#b8b8b6') + ';')}>
              {a.label}(<b>{summary.attention[a.key] || 0}</b>)
            </span>
          ))}
        </div>
        <div style={css('display:flex; flex-wrap:wrap; gap:7px;')}>
          {ATTENTION.flatMap((a) => attentionThreads(a.key).map((t) => (
            <Hoverable
              key={a.key + t.id}
              onClick={() => openThread(t.id)}
              base={css(MONO + ' font-size:10.5px; color:#5a4207; background:#f7f2e8; border:1px solid rgba(154,107,7,0.28); border-radius:5px; padding:4px 9px; cursor:pointer;')}
              hover={css('border-color:#9a6b07;')}
            >
              {a.label.toLowerCase()} · {t.id.replace(/^thd_/, '').slice(0, 22)}
            </Hoverable>
          )))}
          {data && ATTENTION.every((a) => (summary.attention[a.key] || 0) === 0) && (
            <span style={css(MONO + ' font-size:11px; color:#1c7a4f;')}>✓ nothing needs attention</span>
          )}
        </div>
      </div>

      {/* lifecycle pipeline */}
      <div style={css('display:grid; grid-template-columns:repeat(' + COLUMNS.length + ', 1fr); gap:14px;')}>
        {COLUMNS.map((col) => {
          const cards = threads.filter((t) => col.stages.includes(t.stage));
          return (
            <div key={col.key} style={css('background:#fbfbfa; border:1px solid #e5e5e5; border-radius:8px; padding:12px 12px 16px;')}>
              <div style={css('display:flex; align-items:baseline; gap:7px; margin-bottom:11px; padding:0 2px;')}>
                <span style={css(label)}>{col.label}</span>
                <span style={css(MONO + ' font-size:11px; color:#8a8a8a;')}>({cards.length})</span>
              </div>
              <div style={css('display:flex; flex-direction:column; gap:9px;')}>
                {cards.map((t) => <PortfolioCard key={t.id} t={t} onOpen={() => openThread(t.id)} />)}
                {cards.length === 0 && <span style={css(MONO + ' font-size:10.5px; color:#c0c0be; padding:6px 2px;')}>—</span>}
              </div>
            </div>
          );
        })}
      </div>

      {error && <div style={css('margin-top:20px; ' + MONO + ' font-size:13px; color:#b3343c;')}>portfolio unavailable — {error}</div>}
      <p style={css('margin:18px 2px 0; ' + MONO + ' font-size:11px; color:#a5a5a5;')}>// read-only projection over every thread’s append-only ledger. conditions counted are those carried, not discharged.</p>
    </div>
  );
}

function PortfolioCard({ t, onOpen }) {
  const glyph = (sym, n, color) => (
    <span style={css(MONO + ' font-size:10.5px; color:' + (n > 0 ? color : '#c0c0be') + ';')}>{sym}{n}</span>
  );
  return (
    <Hoverable
      as="button"
      onClick={onOpen}
      base={css('display:block; width:100%; text-align:left; background:#fff; border:1px solid #e2e2e0; border-radius:6px; padding:11px 12px; cursor:pointer;')}
      hover={css('border-color:#0a0a0a;')}
    >
      <div style={css('display:flex; align-items:baseline; gap:6px; margin-bottom:7px;')}>
        <span style={css('flex:1; min-width:0; font-size:13px; font-weight:500; color:#1a1a1a; line-height:1.35; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;')}>{t.question || t.title || t.id}</span>
        {t.chain_valid == null ? (
          <span title="chain not yet verified" style={css('flex:none; color:#c0c0be; ' + MONO + ' font-size:11px;')}>·</span>
        ) : (
          <span title={t.chain_valid ? 'chain verified' : 'chain INVALID'} style={css('flex:none; color:' + (t.chain_valid === false ? '#b3343c' : '#1c7a4f') + ';')}>
            <Svg html={ico(t.chain_valid === false ? 'circleX' : 'check', { size: 12, sw: 2.2 })} />
          </span>
        )}
      </div>
      <div style={css('display:flex; align-items:center; gap:10px; margin-bottom:6px;')}>
        {glyph('◇', t.open_objections || 0, '#9a6b07')}
        {glyph('▪', t.evidence_count || 0, '#2c5f96')}
        {(t.outstanding_conditions || 0) > 0 && <span style={css(MONO + ' font-size:10.5px; color:#6a4ca5;')}>cond·{t.outstanding_conditions}</span>}
        {(t.claims_total || 0) > 0 && <span style={css(MONO + ' font-size:10.5px; color:' + (t.claims_grounded === 0 ? '#b3343c' : '#8a8a8a') + ';')}>{t.claims_grounded}/{t.claims_total} grnd</span>}
      </div>
      <div style={css('display:flex; align-items:center; gap:8px; ' + MONO + ' font-size:10px; color:#a5a5a5;')}>
        <span style={css('overflow:hidden; text-overflow:ellipsis; white-space:nowrap;')}>{t.owner}</span>
        <span style={css('flex:1;')} />
        <span style={css('color:' + (t.overdue ? '#b3343c' : '#a5a5a5') + ';')}>{relativeTime(t.last)}</span>
      </div>
    </Hoverable>
  );
}
