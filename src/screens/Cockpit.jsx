import { useState } from 'react';
import { css } from '../lib/css.js';
import { Svg } from '../lib/Svg.jsx';
import { Hoverable } from '../lib/Hoverable.jsx';
import { ico } from '../icons.js';
import { badgeFor, tabStyle, provBtnStyle } from '../styles.js';
import { useThread } from '../useThread.js';
import { api } from '../api.js';

const MONO = "font-family:'JetBrains Mono',monospace;";
const eyebrow = "font-family:'JetBrains Mono',monospace; font-size:11.5px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#3a3a3a;";
const medallion = 'display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border:1px solid #d8d8d6; border-radius:50%; color:#0a0a0a; flex:none;';
const sectionCard = 'background:#fff; border:1px solid #dcdcda; border-radius:7px; margin-bottom:18px; overflow:hidden;';
const provPanel = 'margin-top:13px; padding:14px 16px; background:#f7f7f6; border:1px solid #e8e8e6; border-radius:5px; animation:clistaFade 0.2s ease-out;';
const provLabel = "font-family:'JetBrains Mono',monospace; font-size:9.5px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5; margin-bottom:11px;";
const audSig = { evidence: '#7f9cff', objection: '#d6a64a', decided: '#e8ebf2', ok: '#57c98a', fail: '#e0676d' };

function Boundary() {
  return (
    <>
      <div style={css('display:flex; align-items:center; gap:14px; margin-top:26px;')}>
        <span style={css('flex:1; height:1px; background:#d4d4d2;')} />
        <span style={css(MONO + ' font-size:18px; color:#c4c4c2;')}>·</span>
        <span style={css('flex:1; height:1px; background:#d4d4d2;')} />
      </div>
      <p style={css('margin:16px auto 0; text-align:center; font-size:12px; line-height:1.6; color:#9a9a9a; max-width:560px; text-wrap:pretty;')}>
        ClisTa records the shape of a decision. It does not make the decision, rank truth, assign blame, or create consensus.
      </p>
    </>
  );
}

function Notice({ children }) {
  return (
    <div className="clista-screen" style={css('max-width:1080px; margin:0 auto; padding:48px 40px;')}>
      <div style={css(MONO + ' font-size:13px; color:#6a6a6a;')}>{children}</div>
    </div>
  );
}

export function Cockpit({ threadId, me, go }) {
  const { loading, error, vm, empty, reload } = useThread(threadId);
  const [previewDegraded, setPreviewDegraded] = useState(false);
  const [prov, setProv] = useState(null);
  const [auditOpen, setAuditOpen] = useState(true);
  const [joining, setJoining] = useState(false);

  if (loading) return <Notice>projecting reasoning state from the event log…</Notice>;
  if (error) return <Notice><span style={css('color:#b3343c;')}>state could not be loaded — {error}</span></Notice>;
  if (empty || !vm) return <Notice>No events in <span style={css(MONO)}>{threadId}</span> yet. The cockpit only renders what the log records.</Notice>;

  const isParticipant = !!(me && me.authenticated && (vm.participantIds || []).includes(me.actorId));
  const join = async () => {
    setJoining(true);
    await api.join(threadId, 'contributor');
    setJoining(false);
    reload();
  };

  const isDegraded = !vm.verified || previewDegraded;
  const isDecided = !isDegraded;
  const sb = badgeFor(isDecided ? (vm.status === 'decided' ? 'decided' : vm.status) : 'degraded');
  const statusLabel = isDecided ? (vm.status ? vm.status[0].toUpperCase() + vm.status.slice(1) : 'Active') : 'Degraded';
  const toggleProv = (id) => () => setProv((p) => (p === id ? null : id));

  return (
    <div className="clista-screen" style={css('max-width:1080px; margin:0 auto; padding:28px 40px 64px;')}>
      {/* breadcrumb + state toggle */}
      <div style={css('display:flex; align-items:center; gap:10px; margin-bottom:22px;')}>
        <Hoverable onClick={go('index')} base={css(MONO + ' font-size:11px; color:#8a8a8a; background:none; border:none; cursor:pointer; letter-spacing:0.04em; padding:0;')} hover={css('color:#0a0a0a;')}>threads</Hoverable>
        <span style={css('color:#c4c4c2; ' + MONO + ' font-size:11px;')}>/</span>
        <span style={css(MONO + ' font-size:11px; color:#4a4a4a; letter-spacing:0.04em;')}>{vm.threadId}</span>
        <div style={css('flex:1;')} />
        <div style={css('display:flex; align-items:center; gap:7px;')}>
          <span style={css(MONO + ' font-size:9.5px; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5;')}>view</span>
          <div style={css('display:inline-flex; border:1px solid #dedede; border-radius:5px; overflow:hidden; background:#fff;')}>
            <button onClick={() => setPreviewDegraded(false)} style={tabStyle(!previewDegraded)}>live</button>
            <button onClick={() => setPreviewDegraded(true)} style={tabStyle(previewDegraded)}>degraded</button>
          </div>
        </div>
      </div>

      {/* identity / join affordance */}
      {me && me.authenticated && !isParticipant && (
        <div style={css('display:flex; align-items:center; gap:12px; padding:11px 16px; margin-bottom:18px; background:#fff; border:1px solid #e0e0de; border-radius:5px;')}>
          <Svg html={ico('helpCircle', { size: 16 })} style={css('color:#8a8a8a; flex:none;')} />
          <span style={css('font-size:13px; color:#4a4a4a;')}>
            You're viewing as <span style={css(MONO + ' font-size:12px; color:#2a2a2a;')}>{me.actorId}</span> — not yet a participant of this thread. Contributions are rejected fail-closed until you join.
          </span>
          <div style={css('flex:1;')} />
          <Hoverable onClick={joining ? undefined : join} base={css('display:inline-flex; align-items:center; gap:7px; padding:8px 14px; background:#0a0a0a; color:#fff; border:none; border-radius:5px; ' + MONO + ' font-size:11px; font-weight:500; letter-spacing:0.04em; cursor:' + (joining ? 'default' : 'pointer') + '; opacity:' + (joining ? '0.6' : '1') + '; flex:none;')} hover={css('background:#2a2a2a;')}>
            {joining ? 'joining…' : 'Join thread'}
          </Hoverable>
        </div>
      )}

      {/* degraded banner */}
      {isDegraded && (
        <div style={css('display:flex; align-items:flex-start; gap:12px; padding:14px 16px; margin-bottom:18px; background:#f8eeee; border:1px solid rgba(179,52,60,0.28); border-left:3px solid #b3343c; border-radius:5px; animation:clistaFade 0.25s ease-out;')}>
          <Svg html={ico('alertTriangle', { size: 18 })} style={css('flex:none; color:#b3343c; margin-top:1px;')} />
          <div>
            <div style={css(MONO + ' font-size:11px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#b3343c; margin-bottom:4px;')}>Replay diverged · state not provable</div>
            <div style={css('font-size:13px; color:#7a3a3d; line-height:1.5; text-wrap:pretty;')}>
              {previewDegraded
                ? 'Preview: this is how the cockpit renders when deterministic replay does not match the appended record. '
                : 'Deterministic replay does not match the appended record. '}
              The decision below is shown <span style={css('font-weight:600;')}>as last recorded</span> and must not be treated as verified until the chain re-validates. Fail-closed.
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER BAND ── */}
      <div style={css('margin-bottom:24px;')}>
        <div style={css('display:flex; align-items:center; gap:10px; margin-bottom:14px;')}>
          <span style={css(MONO + ' font-size:11px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:#9a9a9a;')}>Decision Thread</span>
          <span style={css('color:#cfcfcd;')}>·</span>
          <span style={css(MONO + ' font-size:11px; color:#9a9a9a; letter-spacing:0.04em;')}>opened {vm.opened}</span>
        </div>
        <div style={css('display:flex; align-items:flex-start; gap:20px;')}>
          <h1 style={css("margin:0; font-family:'Inter Tight',sans-serif; font-size:30px; font-weight:600; line-height:1.22; letter-spacing:-0.018em; color:#0a0a0a; max-width:780px; text-wrap:pretty;")}>
            {vm.question}
          </h1>
          <div style={css('flex:none; margin-top:4px;')}>
            <span style={sb.badge}>
              <span style={sb.dot} />
              {statusLabel}
            </span>
          </div>
        </div>
        <div style={css('display:flex; flex-wrap:wrap; gap:8px; margin-top:18px;')}>
          {vm.participants.map((p) => (
            <div key={p.name} style={css('display:inline-flex; align-items:center; gap:8px; padding:5px 11px 5px 6px; background:#fff; border:1px solid #e5e5e5; border-radius:5px;')}>
              <span style={css("display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:#f1f1ef; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; color:#4a4a4a; flex:none;")}>{p.initial}</span>
              <span style={css('font-size:12.5px; font-weight:500; color:#1a1a1a;')}>{p.name}</span>
              <span style={css(MONO + ' font-size:9px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:#a5a5a5;')}>{p.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── DECISION RECORD ── */}
      <section style={css('background:#fff; border:1px solid #dcdcda; border-radius:7px; box-shadow:0 1px 2px rgba(10,10,10,0.03); margin-bottom:18px; overflow:hidden;')}>
        <div style={css('display:flex; align-items:center; gap:11px; padding:16px 22px; border-bottom:1px solid #ededeb; background:#fcfcfb;')}>
          <Svg html={ico('checkSquare')} style={css(medallion)} />
          <span style={css(eyebrow)}>Decision Record</span>
          <span style={css(MONO + ' font-size:11px; color:#a5a5a5;')}>·</span>
          <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{vm.decision.id}</span>
          <div style={css('flex:1;')} />
          {isDecided ? (
            <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#1c7a4f;')}>
              <Svg html={ico('check', { size: 13, sw: 2 })} />verified
            </span>
          ) : (
            <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#b3343c;')}>
              <Svg html={ico('x', { size: 13, sw: 2 })} />unverified
            </span>
          )}
        </div>
        <div style={css('padding:22px;')}>
          <div style={css('display:flex; align-items:baseline; gap:12px; margin-bottom:18px;')}>
            <span style={css(MONO + ' font-size:11px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase; color:#9a9a9a; flex:none;')}>Decided</span>
            <span style={css("font-family:'Inter Tight',sans-serif; font-size:23px; font-weight:600; letter-spacing:-0.01em; color:#0a0a0a; line-height:1.2;")}>{vm.decision.summary}</span>
          </div>
          {isDegraded && (
            <div style={css('display:inline-flex; align-items:center; gap:8px; padding:6px 11px; margin-bottom:18px; background:#f7f2e8; border:1px solid rgba(154,107,7,0.28); border-radius:5px;')}>
              <Svg html={ico('alertTriangle', { size: 13, sw: 1.9 }).replace('currentColor', '#9a6b07')} />
              <span style={css(MONO + ' font-size:11px; color:#9a6b07; letter-spacing:0.02em;')}>shown as last recorded — not provable from the current chain</span>
            </div>
          )}
          <div style={css('display:grid; grid-template-columns:1fr 1fr; gap:24px 32px;')} className="clista-grid-2">
            <div>
              <div style={css(MONO + ' font-size:10px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5; margin-bottom:7px;')}>Why</div>
              <p style={css('margin:0; font-size:14px; line-height:1.6; color:#2a2a2a; text-wrap:pretty;')}>{vm.decision.why}</p>
            </div>
            <div>
              <div style={css(MONO + ' font-size:10px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5; margin-bottom:7px;')}>Scope</div>
              {vm.decision.conditions.length > 0 && (
                <div style={css('display:inline-flex; align-items:center; gap:7px; padding:3px 9px; background:#f7f2e8; border:1px solid rgba(154,107,7,0.26); border-radius:4px; margin-bottom:9px;')}>
                  <Svg html={ico('chevronUp', { size: 12, sw: 2 }).replace('currentColor', '#9a6b07')} />
                  <span style={css(MONO + ' font-size:9.5px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#9a6b07;')}>Narrower than the question</span>
                </div>
              )}
              <ul style={css('margin:0; padding-left:18px; font-size:13.5px; line-height:1.6; color:#2a2a2a;')}>
                {(vm.decision.conditions.length ? vm.decision.conditions : [vm.decision.summary]).map((c, i) => (
                  <li key={i} style={css('text-wrap:pretty;')}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
          <div style={css('margin-top:24px; padding-top:20px; border-top:1px solid #ededeb;')}>
            <div style={css(MONO + ' font-size:10px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5; margin-bottom:14px;')}>What happens next</div>
            <div style={css('display:flex; align-items:flex-start; gap:12px;')}>
              <span style={css(MONO + ' display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border:1px solid #d8d8d6; border-radius:50%; font-size:11px; font-weight:600; color:#3a3a3a; flex:none;')}>→</span>
              <span style={css('font-size:13.5px; line-height:1.5; color:#2a2a2a; padding-top:2px; text-wrap:pretty;')}>{vm.decision.nextAction}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SURVIVING OBJECTION (signature) ── */}
      {vm.objection && (
        <section style={css('position:relative; background:#fff; border:1px solid rgba(154,107,7,0.4); border-radius:7px; margin-bottom:26px; overflow:hidden; box-shadow:0 1px 2px rgba(10,10,10,0.03);')}>
          <div style={css('position:absolute; left:0; top:0; bottom:0; width:3px; background:#9a6b07;')} />
          <div style={css('padding:18px 22px 18px 24px;')}>
            <div style={css('display:flex; align-items:center; gap:11px; margin-bottom:13px; flex-wrap:wrap;')}>
              <Svg html={ico('scale')} style={css('display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border:1px solid rgba(154,107,7,0.35); border-radius:50%; color:#9a6b07; flex:none;')} />
              <span style={css(eyebrow)}>Objection</span>
              {vm.objection.survived && (
                <span style={css('display:inline-flex; align-items:center; gap:6px; padding:4px 10px; background:#f7f2e8; border:1px solid rgba(154,107,7,0.4); border-radius:4px; ' + MONO + ' font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#9a6b07;')}>
                  <Svg html={ico('shield', { size: 12, sw: 2 })} />Survived approval
                </span>
              )}
              <div style={css('flex:1;')} />
              <span style={css(MONO + ' font-size:11px; color:#a5a5a5;')}>{vm.objection.id}</span>
            </div>
            <p style={css('margin:0 0 14px; font-size:15px; line-height:1.6; color:#1a1a1a; max-width:820px; text-wrap:pretty;')}>{vm.objection.text}</p>
            <div style={css('display:flex; align-items:center; gap:16px; flex-wrap:wrap; padding-top:13px; border-top:1px solid #ededeb;')}>
              <div style={css('display:flex; align-items:center; gap:8px;')}>
                <span style={css(MONO + ' display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; background:#f1f1ef; font-size:9px; font-weight:600; color:#4a4a4a;')}>{vm.objection.who.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2)}</span>
                <span style={css('font-size:12.5px; color:#2a2a2a; font-weight:500;')}>{vm.objection.who}</span>
                <span style={css(MONO + ' font-size:9px; letter-spacing:0.1em; text-transform:uppercase; color:#a5a5a5;')}>{vm.objection.role}</span>
              </div>
              <span style={css('color:#d8d8d6;')}>·</span>
              <span style={css('font-size:12.5px; color:#6a6a6a;')}>Recorded as <span style={css(MONO + ' font-size:11.5px; color:#9a6b07;')}>{vm.objection.status}</span>. Decision proceeded over this objection; it is carried forward as a residual risk.</span>
            </div>
          </div>
        </section>
      )}

      {/* ── EVIDENCE ── */}
      <section style={css(sectionCard)}>
        <div style={css('display:flex; align-items:center; gap:11px; padding:15px 22px; border-bottom:1px solid #ededeb;')}>
          <Svg html={ico('fileSearch')} style={css(medallion)} />
          <span style={css(eyebrow)}>Evidence</span>
          <span style={css('color:#cfcfcd;')}>·</span>
          <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{vm.evidence.length} sourced findings</span>
          <div style={css('flex:1;')} />
          <span style={css(MONO + ' font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:#b0b0b0;')}>confidence · hash · trace</span>
        </div>
        <div>
          {vm.evidence.map((e) => {
            const open = prov === e.id;
            return (
              <div key={e.id} style={css('padding:16px 22px; border-bottom:1px solid #f0f0ee;')}>
                <div style={css('display:flex; gap:16px; align-items:flex-start;')}>
                  <span style={css(MONO + ' font-size:11px; color:#2c5f96; flex:none; padding-top:2px; min-width:42px;')}>{e.id}</span>
                  <div style={css('flex:1;')}>
                    <p style={css('margin:0 0 11px; font-size:14px; line-height:1.55; color:#1a1a1a; text-wrap:pretty;')}>{e.text}</p>
                    <div style={css('display:flex; align-items:center; gap:16px; flex-wrap:wrap;')}>
                      <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:11px; color:#5a5a5a;')}>
                        <span style={css('width:6px; height:6px; border-radius:50%; background:#2c5f96; flex:none;')} />{e.source}
                      </span>
                      {e.conf != null && (
                        <div style={css('display:flex; align-items:center; gap:8px;')}>
                          <span style={css(MONO + ' font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#a5a5a5;')}>conf</span>
                          <span style={css('position:relative; width:54px; height:4px; background:#ececea; border-radius:2px; overflow:hidden;')}>
                            <span style={css('position:absolute; left:0; top:0; bottom:0; width:' + Math.round(e.conf * 100) + '%; background:#2c5f96; border-radius:2px;')} />
                          </span>
                          <span style={css(MONO + ' font-size:12px; font-weight:600; color:#2a2a2a;')}>{e.conf}</span>
                        </div>
                      )}
                      <span style={css(MONO + ' font-size:11px; color:#9a9a9a; overflow:hidden; text-overflow:ellipsis; max-width:220px; white-space:nowrap;')}>{e.hash}</span>
                      <div style={css('flex:1;')} />
                      <Hoverable onClick={toggleProv(e.id)} base={provBtnStyle(open)} hover={css('color:#0a0a0a;')}>
                        <Svg html={ico('fork', { size: 12 })} />trace provenance
                      </Hoverable>
                    </div>
                    {open && (
                      <div style={css(provPanel)}>
                        <div style={css(provLabel)}>Provenance trace</div>
                        <div style={css(MONO + ' display:grid; grid-template-columns:auto 1fr; gap:8px 16px; font-size:12px;')}>
                          <span style={css('color:#a5a5a5;')}>source.type</span><span style={css('color:#2a2a2a;')}>{e.sourceType}</span>
                          <span style={css('color:#a5a5a5;')}>introduced.by</span><span style={css('color:#2a2a2a;')}>{e.introducedBy}</span>
                          <span style={css('color:#a5a5a5;')}>committed.at</span><span style={css('color:#2a2a2a;')}>{e.committedAt}</span>
                          <span style={css('color:#a5a5a5;')}>content.hash</span><span style={css('color:#2a2a2a; overflow-wrap:anywhere;')}>{e.hash}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── ASSUMPTIONS + CLAIMS ── */}
      <div style={css('display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:18px;')} className="clista-grid-2">
        <section style={css('background:#fff; border:1px solid #dcdcda; border-radius:7px; overflow:hidden;')}>
          <div style={css('display:flex; align-items:center; gap:11px; padding:15px 20px; border-bottom:1px solid #ededeb;')}>
            <Svg html={ico('helpCircle')} style={css(medallion)} />
            <span style={css(eyebrow)}>Assumptions</span>
            <span style={css('color:#cfcfcd;')}>·</span>
            <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{vm.assumptions.length}</span>
          </div>
          <div>
            {vm.assumptions.map((a) => {
              const open = prov === a.id;
              return (
                <div key={a.id} style={css('padding:15px 20px; border-bottom:1px solid #f0f0ee;')}>
                  <div style={css('display:flex; gap:13px;')}>
                    <span style={css(MONO + ' font-size:11px; color:#9a9a9a; flex:none; padding-top:1px;')}>{a.id}</span>
                    <div style={css('flex:1;')}>
                      <p style={css('margin:0 0 8px; font-size:13.5px; line-height:1.55; color:#2a2a2a; text-wrap:pretty;')}>{a.text}</p>
                      <Hoverable onClick={toggleProv(a.id)} base={provBtnStyle(open)} hover={css('color:#0a0a0a;')}>
                        <Svg html={ico('fork', { size: 11 })} />trace provenance
                      </Hoverable>
                      {open && (
                        <div style={css('margin-top:11px; padding:12px 14px; background:#f7f7f6; border:1px solid #e8e8e6; border-radius:5px; animation:clistaFade 0.2s ease-out;')}>
                          <div style={css(provLabel)}>Provenance trace</div>
                          <div style={css(MONO + ' display:grid; grid-template-columns:auto 1fr; gap:7px 14px; font-size:11.5px;')}>
                            <span style={css('color:#a5a5a5;')}>source.type</span><span style={css('color:#2a2a2a;')}>{a.sourceType}</span>
                            <span style={css('color:#a5a5a5;')}>introduced.by</span><span style={css('color:#2a2a2a;')}>{a.introducedBy}</span>
                            <span style={css('color:#a5a5a5;')}>basis</span><span style={css('color:#4a4a4a;')}>{a.basis}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section style={css('background:#fff; border:1px solid #dcdcda; border-radius:7px; overflow:hidden;')}>
          <div style={css('display:flex; align-items:center; gap:11px; padding:15px 20px; border-bottom:1px solid #ededeb;')}>
            <Svg html={ico('claims')} style={css(medallion)} />
            <span style={css(eyebrow)}>Claims</span>
            <span style={css('color:#cfcfcd;')}>·</span>
            <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{vm.claims.length}</span>
          </div>
          <div>
            {vm.claims.map((c) => {
              const open = prov === c.id;
              return (
                <div key={c.id} style={css('padding:15px 20px; border-bottom:1px solid #f0f0ee;')}>
                  <div style={css('display:flex; gap:13px;')}>
                    <span style={css(MONO + ' font-size:11px; color:#9a9a9a; flex:none; padding-top:1px;')}>{c.id}</span>
                    <div style={css('flex:1;')}>
                      <p style={css('margin:0 0 7px; font-size:13.5px; line-height:1.5; color:#2a2a2a; text-wrap:pretty;')}>{c.text}</p>
                      <div style={css('display:flex; align-items:center; gap:14px; flex-wrap:wrap;')}>
                        <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:10.5px; color:#a5a5a5;')}>
                          <Svg html={ico('arrowRight', { size: 11, sw: 2 })} />built from {c.from}
                        </span>
                        <Hoverable onClick={toggleProv(c.id)} base={provBtnStyle(open)} hover={css('color:#0a0a0a;')}>
                          <Svg html={ico('fork', { size: 11 })} />trace
                        </Hoverable>
                      </div>
                      {open && (
                        <div style={css('margin-top:11px; padding:12px 14px; background:#f7f7f6; border:1px solid #e8e8e6; border-radius:5px; animation:clistaFade 0.2s ease-out;')}>
                          <div style={css(provLabel)}>Provenance trace</div>
                          <div style={css(MONO + ' display:grid; grid-template-columns:auto 1fr; gap:7px 14px; font-size:11.5px;')}>
                            <span style={css('color:#a5a5a5;')}>source.type</span><span style={css('color:#2a2a2a;')}>{c.sourceType}</span>
                            <span style={css('color:#a5a5a5;')}>introduced.by</span><span style={css('color:#2a2a2a;')}>{c.introducedBy}</span>
                            <span style={css('color:#a5a5a5;')}>built.from</span><span style={css('color:#4a4a4a;')}>{c.from}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── REVIEWS + MINORITY REPORT ── */}
      <div style={css('display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:18px;')} className="clista-grid-2">
        <section style={css('background:#fff; border:1px solid #dcdcda; border-radius:7px; overflow:hidden;')}>
          <div style={css('display:flex; align-items:center; gap:11px; padding:15px 20px; border-bottom:1px solid #ededeb;')}>
            <Svg html={ico('fileCheck')} style={css(medallion)} />
            <span style={css(eyebrow)}>Governance reviews</span>
            <span style={css('color:#cfcfcd;')}>·</span>
            <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{vm.reviews.length}</span>
          </div>
          <div>
            {vm.reviews.map((r) => (
              <div key={r.id} style={css('padding:15px 20px; border-bottom:1px solid #f0f0ee;')}>
                <div style={css('display:flex; align-items:center; gap:10px; margin-bottom:8px;')}>
                  <span style={css('font-size:12.5px; font-weight:600; color:#1a1a1a;')}>{r.who}</span>
                  <div style={css('flex:1;')} />
                  <span style={css(MONO + ' display:inline-flex; align-items:center; gap:5px; font-size:9.5px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#1c7a4f;')}>
                    <Svg html={ico('check', { size: 11, sw: 2.2 })} />{r.verdict}
                  </span>
                </div>
                <p style={css('margin:0; font-size:13px; line-height:1.5; color:#4a4a4a; text-wrap:pretty;')}>{r.text}</p>
              </div>
            ))}
          </div>
        </section>
        {vm.minority && (
          <section style={css('background:#fcfbf8; border:1px solid #dcdcda; border-radius:7px; overflow:hidden;')}>
            <div style={css('display:flex; align-items:center; gap:11px; padding:15px 20px; border-bottom:1px solid #ededeb;')}>
              <Svg html={ico('flag')} style={css(medallion)} />
              <span style={css(eyebrow)}>Minority report</span>
              <span style={css('color:#cfcfcd;')}>·</span>
              <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>preserved</span>
            </div>
            <div style={css('padding:16px 20px;')}>
              <p style={css('margin:0 0 13px; font-size:14px; line-height:1.6; color:#1a1a1a; font-style:italic; text-wrap:pretty;')}>“{vm.minority.text}”</p>
              <div style={css('display:flex; align-items:center; gap:9px; padding-top:12px; border-top:1px solid #ededeb;')}>
                <span style={css(MONO + ' display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; background:#f1f1ef; font-size:9px; font-weight:600; color:#4a4a4a;')}>{vm.minority.who.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2)}</span>
                <span style={css('font-size:12.5px; color:#2a2a2a; font-weight:500;')}>{vm.minority.who}</span>
                <span style={css(MONO + ' font-size:9px; letter-spacing:0.1em; text-transform:uppercase; color:#a5a5a5;')}>{vm.minority.role}</span>
                <div style={css('flex:1;')} />
                <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{vm.minority.id}</span>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ── RESIDUAL RISKS ── */}
      {vm.risks.length > 0 && (
        <section style={css('background:#fff; border:1px solid #dcdcda; border-radius:7px; margin-bottom:26px; overflow:hidden;')}>
          <div style={css('display:flex; align-items:center; gap:11px; padding:15px 22px; border-bottom:1px solid #ededeb;')}>
            <Svg html={ico('alertCircle')} style={css(medallion)} />
            <span style={css(eyebrow)}>Residual risks</span>
            <span style={css('color:#cfcfcd;')}>·</span>
            <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{vm.risks.length} carried forward</span>
          </div>
          <div style={css('display:grid; grid-template-columns:1fr 1fr;')} className="clista-grid-2">
            {vm.risks.map((rk) => (
              <div key={rk.id} style={css('padding:16px 22px; border-bottom:1px solid #f0f0ee; border-right:1px solid #f0f0ee;')}>
                <div style={css('display:flex; align-items:center; gap:10px; margin-bottom:11px;')}>
                  <span style={css(MONO + ' font-size:11px; color:#9a6b07;')}>{rk.id}</span>
                  <span style={css('font-size:14px; font-weight:600; color:#1a1a1a;')}>{rk.text}</span>
                </div>
                <div style={css(MONO + ' display:grid; grid-template-columns:auto 1fr; gap:6px 14px; font-size:11.5px;')}>
                  <span style={css('color:#a5a5a5; text-transform:uppercase; letter-spacing:0.06em; font-size:10px;')}>owner</span>
                  <span style={css("color:#2a2a2a; font-family:'Inter Tight',sans-serif; font-size:13px;")}>{rk.owner}</span>
                  <span style={css('color:#a5a5a5; text-transform:uppercase; letter-spacing:0.06em; font-size:10px;')}>trigger</span>
                  <span style={css("color:#4a4a4a; font-family:'Inter Tight',sans-serif; font-size:13px; line-height:1.45;")}>{rk.trigger}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── AUDIT CHAIN (TERMINAL) ── */}
      <section className="clista-term" style={css('background:#0c0d12; border:1px solid #1c1e26; border-radius:7px; overflow:hidden; box-shadow:0 4px 18px rgba(10,10,10,0.18);')}>
        <div style={css('display:flex; align-items:center; gap:12px; padding:13px 18px; border-bottom:1px solid #1c1e26; background:#101117;')}>
          <Svg html={ico('terminal')} style={css('color:#7f9cff;')} />
          <span style={css(MONO + ' font-size:11.5px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#cdd2dc;')}>Audit chain</span>
          <span style={css(MONO + ' font-size:11px; color:#5a6070;')}>append-only · {vm.audit.count} events</span>
          <div style={css('flex:1;')} />
          <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:' + (vm.audit.validateOk ? '#57c98a' : '#e0676d') + '; border:1px solid ' + (vm.audit.validateOk ? '#57c98a40' : '#e0676d55') + '; border-radius:4px; padding:4px 9px;')}>
            validate <Svg html={ico(vm.audit.validateOk ? 'check' : 'x', { size: 12, sw: 2.4 })} />
          </span>
          <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:' + (isDecided ? '#57c98a' : '#e0676d') + '; border:1px solid ' + (isDecided ? '#57c98a40' : '#e0676d55') + '; border-radius:4px; padding:4px 9px;')}>
            replay <Svg html={ico(isDecided ? 'check' : 'x', { size: 12, sw: 2.4 })} />
          </span>
          <Hoverable onClick={() => setAuditOpen((o) => !o)} base={css(MONO + ' font-size:13px; color:#8a90a0; background:none; border:none; cursor:pointer; padding:4px 6px; margin-left:4px;')} hover={css('color:#cdd2dc;')}>
            {auditOpen ? '▾' : '▸'}
          </Hoverable>
        </div>
        {auditOpen && (
          <div style={css('padding:8px 0; position:relative;')}>
            {vm.audit.events.map((ev) => {
              const c = audSig[ev.sig] || '#aeb4c0';
              const bold = ev.sig === 'decided';
              return (
                <div key={ev.id} style={css('display:flex; align-items:center; gap:14px; padding:6px 18px;')}>
                  <span style={css('width:6px; height:6px; border-radius:50%; flex:none; background:' + c + ';')} />
                  <span style={css(MONO + ' font-size:12px; font-weight:' + (bold ? '600' : '500') + '; color:' + c + '; min-width:210px;')}>{ev.t}</span>
                  <span style={css(MONO + ' font-size:11.5px; color:#6b7180; min-width:90px;')}>{ev.id}</span>
                  <span style={css(MONO + ' font-size:11.5px; color:#8a90a0; min-width:140px;')}>{ev.actor}</span>
                  <span style={css(MONO + ' font-size:11.5px; color:#5a6070;')}>{ev.ts}</span>
                </div>
              );
            })}
            <div style={css('margin:10px 18px 4px; padding-top:12px; border-top:1px solid #1c1e26;')}>
              <span style={css(MONO + ' font-size:11px; color:#5a6070; line-height:1.6;')}>// head {vm.audit.headHash || '—'} · state is provable from events. fail-closed: an unverifiable chain renders the decision <span style={css('color:#8a90a0;')}>unverified</span>, never silently trusted.</span>
            </div>
          </div>
        )}
      </section>

      <Boundary />
    </div>
  );
}
