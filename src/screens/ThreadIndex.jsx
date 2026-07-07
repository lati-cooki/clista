import { useEffect, useState } from 'react';
import { css } from '../lib/css.js';
import { Svg } from '../lib/Svg.jsx';
import { Hoverable } from '../lib/Hoverable.jsx';
import { ico } from '../icons.js';
import { badgeFor, filterStyle } from '../styles.js';
import { api } from '../api.js';
import { relativeTime } from '../adapt.js';

const MONO = "font-family:'JetBrains Mono',monospace;";
const FILTERS = ['all', 'active', 'review', 're-review', 'decided', 'degraded', 'failed'];
const colHead = "font-family:'JetBrains Mono',monospace; font-size:9.5px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#a5a5a5;";
const GRID = 'grid-template-columns:40px 1fr 132px 130px 96px 60px; gap:16px;';
const fieldLabel = "display:block; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#6a6a6a; margin-bottom:8px;";
const inputBase = "width:100%; padding:11px 13px; font-family:'JetBrains Mono',monospace; font-size:12.5px; color:#1a1a1a; background:#fcfcfb; border:1px solid #d8d8d6; border-radius:5px; outline:none;";

export function ThreadIndex({ openThread, me }) {
  const [filter, setFilter] = useState('all');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [intake, setIntake] = useState([]);

  const reload = () =>
    api.listThreads().then((res) => {
      if (res.ok) setRows(res.data.threads || []);
      else setError(res.data.error || 'failed to load index');
    });
  // The triage inbox is owner-only server-side (agents get 403); a browser is a
  // human, so just ask — render nothing when it's empty or unavailable.
  const reloadIntake = () =>
    api.listIntake().then((res) => setIntake((res.ok && res.data.intake) || []));

  useEffect(() => {
    let live = true;
    api.listThreads().then((res) => {
      if (!live) return;
      if (res.ok) setRows(res.data.threads || []);
      else setError(res.data.error || 'failed to load index');
    });
    api.listIntake().then((res) => {
      if (live) setIntake((res.ok && res.data.intake) || []);
    });
    return () => {
      live = false;
    };
  }, []);

  const threads = (rows || []).filter((t) => filter === 'all' || t.status === filter);
  // Index numbers follow ledger order (latest change first) and stay stable
  // under status filters — #1 is always the most recently changed thread.
  const numberOf = new Map((rows || []).map((t, i) => [t.id, i + 1]));
  const attention = (rows || []).filter((t) => t.status === 'degraded' || t.status === 'failed' || t.status === 're-review').length;

  return (
    <div className="clista-screen" style={css('max-width:1080px; margin:0 auto; padding:28px 40px 64px;')}>
      <div style={css('display:flex; align-items:flex-end; gap:20px; margin-bottom:24px;')}>
        <div>
          <div style={css(MONO + ' font-size:11px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:#9a9a9a; margin-bottom:9px;')}>Thread Index</div>
          <h1 style={css("margin:0; font-family:'Inter Tight',sans-serif; font-size:28px; font-weight:600; letter-spacing:-0.015em; color:#0a0a0a;")}>Decision threads</h1>
        </div>
        <span style={css(MONO + ' font-size:12px; color:#9a9a9a; padding-bottom:5px;')}>
          {rows ? `${rows.length} total · ${attention} need${attention === 1 ? 's' : ''} attention` : 'loading…'}
        </span>
        <div style={css('flex:1;')} />
        <Hoverable
          onClick={() => setCreating(true)}
          base={css('display:inline-flex; align-items:center; gap:8px; padding:9px 15px; background:#0a0a0a; color:#fff; border:none; border-radius:5px; ' + MONO + ' font-size:11.5px; font-weight:500; letter-spacing:0.04em; cursor:pointer;')}
          hover={css('background:#2a2a2a;')}
        >
          <Svg html={ico('plus', { size: 14, sw: 1.9 })} />New thread
        </Hoverable>
      </div>

      {creating && (
        <NewThreadModal
          me={me}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            openThread(id);
          }}
        />
      )}

      {intake.length > 0 && (
        <IntakePanel
          items={intake}
          onApprove={async (id) => {
            const res = await api.approveIntake(id, {});
            if (res.ok && res.data.id) {
              await reload();
              openThread(res.data.id);
            } else {
              reloadIntake();
            }
          }}
          onDismiss={async (id) => {
            await api.dismissIntake(id, {});
            reloadIntake();
          }}
        />
      )}

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
          <span style={css(colHead)}>#</span>
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
              onClick={() => openThread(t.id)}
              base={css('display:grid; ' + GRID + ' align-items:center; width:100%; text-align:left; padding:15px 22px; border:none; border-bottom:1px solid #f0f0ee; background:#fff; cursor:pointer;')}
              hover={css('background:#fafaf9;')}
            >
              <span style={css(MONO + ' font-size:11.5px; color:#a5a5a5;')}>{numberOf.get(t.id)}</span>
              <span className="clista-ledger-grid" style={css('display:flex; align-items:baseline; gap:10px; min-width:0;')}>
                <span style={css('flex:1 1 auto; min-width:0; font-size:14px; font-weight:500; color:#1a1a1a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;')}>{t.question || t.title}</span>
                <span style={css(MONO + ' flex:0 1 auto; min-width:0; max-width:240px; font-size:10.5px; color:#b0b0b0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;')}>{t.id}</span>
              </span>
              <span><span style={b.badge}><span style={b.dot} />{t.status}</span></span>
              <span style={css('font-size:13px; color:#4a4a4a;')}>{t.owner}</span>
              <span style={css(MONO + ' font-size:11.5px; color:#8a8a8a;')}>{relativeTime(t.last)}</span>
              <span style={css(MONO + ' font-size:12px; color:#6a6a6a; text-align:right;')}>{t.events}</span>
            </Hoverable>
          );
        })}
        {rows && threads.length === 0 && (
          <div style={css('padding:56px 22px; text-align:center;')}>
            <div style={css('display:inline-flex; align-items:center; justify-content:center; width:44px; height:44px; border:1px solid #e0e0de; border-radius:50%; color:#b0b0b0; margin-bottom:14px;')}>
              <Svg html={ico('index', { size: 20, sw: 1.6 })} />
            </div>
            <p style={css('margin:0 0 5px; ' + MONO + ' font-size:13px; color:#6a6a6a;')}>
              {rows.length === 0 ? 'No threads yet.' : 'No threads in this state.'}
            </p>
            <p style={css('margin:0; font-size:13px; color:#9a9a9a;')}>Nothing to show — the ledger only records what has actually happened.</p>
          </div>
        )}
        {error && (
          <div style={css('padding:32px 22px; text-align:center; ' + MONO + ' font-size:13px; color:#b3343c;')}>index unavailable — {error}</div>
        )}
      </div>
      <p style={css('margin:16px 2px 0; ' + MONO + ' font-size:11px; color:#a5a5a5;')}>// the index is a ledger of recorded threads, not a feed. each row is an append-only event chain.</p>
    </div>
  );
}

// Open a new thread: collect its question (and optional title), then POST it.
// The server mints the genesis log (ParticipantDeclared → ThreadCreated) and the
// caller becomes the first participant / decision owner.
function NewThreadModal({ me, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const authed = !!(me && me.authenticated);

  const submit = async () => {
    setError(null);
    if (question.trim().length < 12) {
      setError('A thread needs a question (min 12 chars) — the decision it exists to answer.');
      return;
    }
    setBusy(true);
    const res = await api.createThread(title.trim(), question.trim());
    setBusy(false);
    if (res.ok && res.data.ok) {
      onCreated(res.data.id);
    } else {
      const reasons = res.data.reasons || [];
      setError(reasons.length ? reasons.map((r) => r.reason).join(' · ') : res.data.reason || res.data.error || 'create rejected, fail-closed.');
    }
  };

  return (
    <div
      onClick={onClose}
      style={css('position:fixed; inset:0; z-index:50; display:flex; align-items:flex-start; justify-content:center; padding:96px 24px; background:rgba(20,20,18,0.32); animation:clistaFade 0.16s ease-out;')}
    >
      <div onClick={(e) => e.stopPropagation()} style={css('width:100%; max-width:560px; background:#fff; border:1px solid #dcdcda; border-radius:9px; box-shadow:0 24px 64px rgba(0,0,0,0.22); padding:26px 28px 24px;')}>
        <div style={css('display:inline-flex; align-items:center; gap:8px; ' + MONO + ' font-size:11px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:#1c7a4f; margin-bottom:11px;')}>
          <Svg html={ico('plus', { size: 14, sw: 1.9 })} />New thread · ThreadCreated
        </div>
        <h2 style={css("margin:0 0 7px; font-family:'Inter Tight',sans-serif; font-size:23px; font-weight:600; letter-spacing:-0.015em; color:#0a0a0a;")}>Open a decision thread</h2>
        <p style={css('margin:0 0 22px; font-size:13.5px; color:#6a6a6a; line-height:1.55;')}>The thread records the shape of one decision. You become its first participant and decision owner; everything after is an append.</p>

        <div style={css('margin-bottom:18px;')}>
          <label style={css(fieldLabel)}>thread.question <span style={css('color:#b3343c;')}>*</span></label>
          <textarea
            value={question}
            onChange={(e) => { setQuestion(e.target.value); setError(null); }}
            placeholder="What is the decision this thread exists to answer?"
            rows={3}
            style={css("width:100%; resize:vertical; padding:12px 13px; font-family:'Inter Tight',sans-serif; font-size:14px; line-height:1.55; color:#1a1a1a; background:#fcfcfb; border:1px solid #d8d8d6; border-radius:5px; outline:none;")}
          />
        </div>
        <div style={css('margin-bottom:22px;')}>
          <label style={css(fieldLabel)}>thread.title <span style={css('color:#a5a5a5; font-weight:500;')}>optional</span></label>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(null); }}
            placeholder="short label — defaults to the question"
            style={css(inputBase)}
          />
        </div>

        {!authed && (
          <div style={css('margin-bottom:16px; padding:11px 14px; background:#fcfcfb; border:1px solid #e5e5e5; border-radius:5px; font-size:12.5px; color:#6a6a6a;')}>
            You are not signed in — creating a thread requires an authenticated participant and will be rejected.
          </div>
        )}
        {error && (
          <div style={css('display:flex; gap:11px; margin-bottom:16px; padding:13px 15px; background:#f8eeee; border:1px solid rgba(179,52,60,0.3); border-left:3px solid #b3343c; border-radius:6px;')}>
            <Svg html={ico('circleX', { size: 16, sw: 1.9 })} style={css('flex:none; color:#b3343c; margin-top:1px;')} />
            <p style={css('margin:0; font-size:12.5px; line-height:1.5; color:#7a3a3d; text-wrap:pretty;')}>{error}</p>
          </div>
        )}

        <div style={css('display:flex; align-items:center; gap:12px; padding-top:18px; border-top:1px solid #ededeb;')}>
          <Hoverable onClick={busy ? undefined : submit} base={css('display:inline-flex; align-items:center; gap:8px; padding:11px 18px; background:#0a0a0a; color:#fff; border:none; border-radius:5px; ' + MONO + ' font-size:12px; font-weight:500; letter-spacing:0.04em; cursor:' + (busy ? 'default' : 'pointer') + '; opacity:' + (busy ? '0.6' : '1') + ';')} hover={css('background:#2a2a2a;')}>
            <Svg html={ico('checkArrow', { size: 14, sw: 1.9 })} />{busy ? 'Opening…' : 'Open thread'}
          </Hoverable>
          <Hoverable onClick={onClose} base={css('padding:11px 16px; background:none; color:#6a6a6a; border:1px solid #d8d8d6; border-radius:5px; ' + MONO + ' font-size:12px; cursor:pointer;')} hover={css('border-color:#0a0a0a; color:#0a0a0a;')}>Cancel</Hoverable>
          <div style={css('flex:1;')} />
          <span style={css(MONO + ' font-size:10.5px; color:#a5a5a5;')}>genesis log · validated before append</span>
        </div>
      </div>
    </div>
  );
}

// The triage inbox: proposals (from the autonomous seeder) and submissions
// awaiting the owner's judgement. Quarantined until acted on — approving CREATES
// the thread (owned by the approving human), so this is where "agent/public
// propose → human approves & owns" happens in the UI.
function IntakePanel({ items, onApprove, onDismiss }) {
  return (
    <div style={css('margin-bottom:22px; background:#fff; border:1px solid #dcdcda; border-radius:7px; overflow:hidden;')}>
      <div style={css('display:flex; align-items:center; gap:9px; padding:12px 22px; border-bottom:1px solid #e5e5e5; background:#fcfcfb;')}>
        <Svg html={ico('index', { size: 14, sw: 1.7 })} style={css('color:#1c7a4f;')} />
        <span style={css(MONO + ' font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#1c7a4f;')}>Triage inbox</span>
        <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{items.length} awaiting your decision</span>
        <div style={css('flex:1;')} />
        <span style={css(MONO + ' font-size:10px; color:#a5a5a5;')}>quarantined — nothing is on the ledger until you approve</span>
      </div>
      {items.map((it) => (
        <IntakeCard key={it.id} it={it} onApprove={onApprove} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const KIND_LABEL = {
  thread_proposal: 'thread proposal',
  decision: 'decision',
  contribution: 'contribution',
  run_report: 'run report',
};

function IntakeCard({ it, onApprove, onDismiss }) {
  const [busy, setBusy] = useState(false);
  const payload = it.payload || {};
  const useCases = Array.isArray(payload.useCases) ? payload.useCases : [];
  const tradeoffs = payload.tradeoffs || null;
  const provenance = Array.isArray(it.provenance) ? it.provenance : [];
  // proposal/decision/run_report mint a NEW thread; a contribution attaches to
  // an existing one.
  const creates = it.kind !== 'contribution';

  const act = (fn) => async () => {
    setBusy(true);
    await fn();
    setBusy(false);
  };

  return (
    <div style={css('padding:16px 22px; border-bottom:1px solid #f0f0ee;')}>
      <div style={css('display:flex; align-items:center; gap:8px; margin-bottom:9px;')}>
        <span style={css(MONO + ' font-size:9.5px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#5a5a5a; background:#f1f1ef; border:1px solid #e2e2e0; border-radius:4px; padding:2px 7px;')}>{it.source}</span>
        <span style={css(MONO + ' font-size:9.5px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#1c5fa8; background:#eef3fa; border:1px solid #d6e3f3; border-radius:4px; padding:2px 7px;')}>{KIND_LABEL[it.kind] || it.kind}</span>
        <span style={css(MONO + ' font-size:10.5px; color:#b0b0b0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;')}>{it.id}</span>
        <div style={css('flex:1;')} />
        <span style={css(MONO + ' font-size:10.5px; color:#a5a5a5;')}>{relativeTime(it.submittedAt)}</span>
      </div>

      <div style={css('font-size:14.5px; font-weight:500; color:#1a1a1a; line-height:1.5; margin-bottom:6px;')}>{it.question || it.title}</div>
      {it.targetThreadId && (
        <div style={css(MONO + ' font-size:11px; color:#1c5fa8; margin-bottom:6px;')}>→ onto {it.targetThreadId}</div>
      )}
      {it.body && <p style={css('margin:0 0 10px; font-size:13px; color:#5a5a5a; line-height:1.55;')}>{it.body}</p>}

      {useCases.length > 0 && (
        <div style={css('margin:0 0 10px;')}>
          <div style={css(MONO + ' font-size:9.5px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#a5a5a5; margin-bottom:5px;')}>use cases</div>
          <ul style={css('margin:0; padding-left:18px;')}>
            {useCases.map((u, i) => (
              <li key={i} style={css('font-size:12.5px; color:#4a4a4a; line-height:1.5;')}>{typeof u === 'string' ? u : JSON.stringify(u)}</li>
            ))}
          </ul>
        </div>
      )}

      {tradeoffs && (tradeoffs.pros || tradeoffs.cons) && (
        <div style={css('display:flex; gap:24px; margin:0 0 12px;')}>
          {['pros', 'cons'].map((side) =>
            Array.isArray(tradeoffs[side]) && tradeoffs[side].length ? (
              <div key={side}>
                <div style={css(MONO + ' font-size:9.5px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:' + (side === 'pros' ? '#1c7a4f' : '#b3343c') + '; margin-bottom:4px;')}>{side}</div>
                <ul style={css('margin:0; padding-left:16px;')}>
                  {tradeoffs[side].map((x, i) => (
                    <li key={i} style={css('font-size:12px; color:#5a5a5a; line-height:1.5;')}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>
      )}

      {provenance.length > 0 && (
        <div style={css('margin:0 0 12px; padding:8px 11px; background:#fcfcfb; border:1px solid #ededeb; border-radius:5px;')}>
          <div style={css(MONO + ' font-size:9.5px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#a5a5a5; margin-bottom:5px;')}>source signals</div>
          {provenance.map((p, i) => (
            <div key={i} style={css(MONO + ' font-size:11px; color:#7a7a7a; line-height:1.55;')}>
              {(p.surface ? p.surface + ' · ' : '') + (p.ref || '') + (p.excerpt ? ' — ' + p.excerpt : '')}
            </div>
          ))}
        </div>
      )}

      <div style={css('display:flex; align-items:center; gap:12px; padding-top:6px;')}>
        <Hoverable
          onClick={busy ? undefined : act(() => onApprove(it.id))}
          base={css('display:inline-flex; align-items:center; gap:7px; padding:9px 15px; background:#1c7a4f; color:#fff; border:none; border-radius:5px; ' + MONO + ' font-size:11.5px; font-weight:500; letter-spacing:0.04em; cursor:' + (busy ? 'default' : 'pointer') + '; opacity:' + (busy ? '0.6' : '1') + ';')}
          hover={css('background:#176540;')}
        >
          <Svg html={ico('checkArrow', { size: 13, sw: 1.9 })} />{creates ? 'Approve → create thread' : 'Approve → attest'}
        </Hoverable>
        <Hoverable
          onClick={busy ? undefined : act(() => onDismiss(it.id))}
          base={css('padding:9px 14px; background:none; color:#6a6a6a; border:1px solid #d8d8d6; border-radius:5px; ' + MONO + ' font-size:11.5px; cursor:' + (busy ? 'default' : 'pointer') + ';')}
          hover={css('border-color:#b3343c; color:#b3343c;')}
        >
          Dismiss
        </Hoverable>
      </div>
    </div>
  );
}
