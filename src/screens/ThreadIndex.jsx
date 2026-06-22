import { useState } from 'react';
import { css } from '../lib/css.js';
import { Svg } from '../lib/Svg.jsx';
import { Hoverable } from '../lib/Hoverable.jsx';
import { ico } from '../icons.js';
import { badgeFor, filterStyle } from '../styles.js';
import { threadsAll } from '../data.js';

const MONO = "font-family:'JetBrains Mono',monospace;";
const FILTERS = ['all', 'active', 'decided', 'degraded', 'failed'];
const colHead = "font-family:'JetBrains Mono',monospace; font-size:9.5px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#a5a5a5;";
const GRID = 'grid-template-columns:1fr 132px 130px 96px 60px; gap:16px;';

export function ThreadIndex({ go }) {
  const [filter, setFilter] = useState('all');
  const threads = threadsAll.filter((t) => filter === 'all' || t.status === filter);

  return (
    <div className="clista-screen" style={css('max-width:1080px; margin:0 auto; padding:28px 40px 64px;')}>
      <div style={css('display:flex; align-items:flex-end; gap:20px; margin-bottom:24px;')}>
        <div>
          <div style={css(MONO + ' font-size:11px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:#9a9a9a; margin-bottom:9px;')}>Thread Index</div>
          <h1 style={css("margin:0; font-family:'Inter Tight',sans-serif; font-size:28px; font-weight:600; letter-spacing:-0.015em; color:#0a0a0a;")}>Decision threads</h1>
        </div>
        <span style={css(MONO + ' font-size:12px; color:#9a9a9a; padding-bottom:5px;')}>6 total · 1 needs attention</span>
        <div style={css('flex:1;')} />
        <Hoverable
          onClick={go('compose')}
          base={css('display:inline-flex; align-items:center; gap:8px; padding:9px 15px; background:#0a0a0a; color:#fff; border:none; border-radius:5px; ' + MONO + ' font-size:11.5px; font-weight:500; letter-spacing:0.04em; cursor:pointer;')}
          hover={css('background:#2a2a2a;')}
        >
          <Svg html={ico('plus', { size: 14, sw: 1.9 })} />New thread
        </Hoverable>
      </div>

      {/* filters */}
      <div style={css('display:flex; align-items:center; gap:8px; margin-bottom:18px;')}>
        <span style={css(MONO + ' font-size:10px; letter-spacing:0.12em; text-transform:uppercase; color:#a5a5a5; margin-right:4px;')}>filter</span>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={filterStyle(filter === f)}>{f}</button>
        ))}
      </div>

      {/* ledger */}
      <div style={css('background:#fff; border:1px solid #dcdcda; border-radius:7px; overflow:hidden;')}>
        <div className="clista-ledger-grid" style={css('display:grid; ' + GRID + ' padding:11px 22px; border-bottom:1px solid #e5e5e5; background:#fcfcfb;')}>
          <span style={css(colHead)}>Question</span>
          <span style={css(colHead)}>Status</span>
          <span style={css(colHead)}>Owner</span>
          <span style={css(colHead)}>Last event</span>
          <span style={css(colHead + ' text-align:right;')}>Events</span>
        </div>
        {threads.map((t) => {
          const b = badgeFor(t.status);
          return (
            <Hoverable
              key={t.id}
              as="button"
              onClick={go('cockpit')}
              base={css('display:grid; ' + GRID + ' align-items:center; width:100%; text-align:left; padding:15px 22px; border:none; border-bottom:1px solid #f0f0ee; background:#fff; cursor:pointer;')}
              hover={css('background:#fafaf9;')}
            >
              <span className="clista-ledger-grid" style={css('display:flex; align-items:center; gap:12px; min-width:0;')}>
                <span style={css(MONO + ' font-size:11px; color:#b0b0b0; flex:none;')}>{t.id}</span>
                <span style={css('font-size:14px; font-weight:500; color:#1a1a1a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;')}>{t.q}</span>
              </span>
              <span><span style={b.badge}><span style={b.dot} />{t.status}</span></span>
              <span style={css('font-size:13px; color:#4a4a4a;')}>{t.owner}</span>
              <span style={css(MONO + ' font-size:11.5px; color:#8a8a8a;')}>{t.last}</span>
              <span style={css(MONO + ' font-size:12px; color:#6a6a6a; text-align:right;')}>{t.events}</span>
            </Hoverable>
          );
        })}
        {threads.length === 0 && (
          <div style={css('padding:56px 22px; text-align:center;')}>
            <div style={css('display:inline-flex; align-items:center; justify-content:center; width:44px; height:44px; border:1px solid #e0e0de; border-radius:50%; color:#b0b0b0; margin-bottom:14px;')}>
              <Svg html={ico('index', { size: 20, sw: 1.6 })} />
            </div>
            <p style={css('margin:0 0 5px; ' + MONO + ' font-size:13px; color:#6a6a6a;')}>No threads in this state.</p>
            <p style={css('margin:0; font-size:13px; color:#9a9a9a;')}>Nothing to show — the ledger only records what has actually happened.</p>
          </div>
        )}
      </div>
      <p style={css('margin:16px 2px 0; ' + MONO + ' font-size:11px; color:#a5a5a5;')}>// the index is a ledger of recorded threads, not a feed. each row is an append-only event chain.</p>
    </div>
  );
}
