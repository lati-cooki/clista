import { useState } from 'react';
import { css } from '../lib/css.js';
import { Svg } from '../lib/Svg.jsx';
import { Hoverable } from '../lib/Hoverable.jsx';
import { ico } from '../icons.js';
import { badgeFor, tabStyle, provBtnStyle } from '../styles.js';
import {
  participants,
  nextSteps,
  evidence,
  assumptions,
  claims,
  reviews,
  risks,
  auditDecided,
  auditDegraded,
  auditSigColors,
} from '../data.js';

const MONO = "font-family:'JetBrains Mono',monospace;";
const eyebrow = "font-family:'JetBrains Mono',monospace; font-size:11.5px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#3a3a3a;";
const medallion = 'display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border:1px solid #d8d8d6; border-radius:50%; color:#0a0a0a; flex:none;';
const sectionCard = 'background:#fff; border:1px solid #dcdcda; border-radius:7px; margin-bottom:18px; overflow:hidden;';
const provPanel = 'margin-top:13px; padding:14px 16px; background:#f7f7f6; border:1px solid #e8e8e6; border-radius:5px; animation:clistaFade 0.2s ease-out;';
const provLabel = "font-family:'JetBrains Mono',monospace; font-size:9.5px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5; margin-bottom:11px;";

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

export function Cockpit({ go }) {
  const [cockpitState, setCockpitState] = useState('decided');
  const [auditOpen, setAuditOpen] = useState(true);
  const [prov, setProv] = useState(null);

  const isDecided = cockpitState === 'decided';
  const isDegraded = cockpitState === 'degraded';
  const sb = badgeFor(isDecided ? 'decided' : 'degraded');
  const toggleProv = (id) => () => setProv((p) => (p === id ? null : id));
  const auditEvents = isDecided ? auditDecided : auditDegraded;

  return (
    <div className="clista-screen" style={css('max-width:1080px; margin:0 auto; padding:28px 40px 64px;')}>
      {/* breadcrumb + state toggle */}
      <div style={css('display:flex; align-items:center; gap:10px; margin-bottom:22px;')}>
        <Hoverable onClick={go('index')} base={css(MONO + ' font-size:11px; color:#8a8a8a; background:none; border:none; cursor:pointer; letter-spacing:0.04em; padding:0;')} hover={css('color:#0a0a0a;')}>threads</Hoverable>
        <span style={css('color:#c4c4c2; ' + MONO + ' font-size:11px;')}>/</span>
        <span style={css(MONO + ' font-size:11px; color:#4a4a4a; letter-spacing:0.04em;')}>th_8f3ac1</span>
        <div style={css('flex:1;')} />
        <div style={css('display:flex; align-items:center; gap:7px;')}>
          <span style={css(MONO + ' font-size:9.5px; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5;')}>view</span>
          <div style={css('display:inline-flex; border:1px solid #dedede; border-radius:5px; overflow:hidden; background:#fff;')}>
            <button onClick={() => setCockpitState('decided')} style={tabStyle(isDecided)}>decided</button>
            <button onClick={() => setCockpitState('degraded')} style={tabStyle(isDegraded)}>degraded</button>
          </div>
        </div>
      </div>

      {/* degraded banner */}
      {isDegraded && (
        <div style={css('display:flex; align-items:flex-start; gap:12px; padding:14px 16px; margin-bottom:18px; background:#f8eeee; border:1px solid rgba(179,52,60,0.28); border-left:3px solid #b3343c; border-radius:5px; animation:clistaFade 0.25s ease-out;')}>
          <Svg html={ico('alertTriangle', { size: 18 })} style={css('flex:none; color:#b3343c; margin-top:1px;')} />
          <div>
            <div style={css(MONO + ' font-size:11px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#b3343c; margin-bottom:4px;')}>Replay diverged · state not provable</div>
            <div style={css('font-size:13px; color:#7a3a3d; line-height:1.5; text-wrap:pretty;')}>
              Deterministic replay halted at <span style={css(MONO + ' font-size:12px;')}>evt_7c2a</span> — recomputed reasoning state does not match the appended record. The decision below is shown <span style={css('font-weight:600;')}>as last recorded</span> and must not be treated as verified until the chain re-validates. Fail-closed.
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER BAND ── */}
      <div style={css('margin-bottom:24px;')}>
        <div style={css('display:flex; align-items:center; gap:10px; margin-bottom:14px;')}>
          <span style={css(MONO + ' font-size:11px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:#9a9a9a;')}>Decision Thread</span>
          <span style={css('color:#cfcfcd;')}>·</span>
          <span style={css(MONO + ' font-size:11px; color:#9a9a9a; letter-spacing:0.04em;')}>opened 2026-06-18</span>
        </div>
        <div style={css('display:flex; align-items:flex-start; gap:20px;')}>
          <h1 style={css("margin:0; font-family:'Inter Tight',sans-serif; font-size:30px; font-weight:600; line-height:1.22; letter-spacing:-0.018em; color:#0a0a0a; max-width:780px; text-wrap:pretty;")}>
            Should the support team run a limited assistant beta before broader rollout?
          </h1>
          <div style={css('flex:none; margin-top:4px;')}>
            <span style={sb.badge}>
              <span style={sb.dot} />
              {isDecided ? 'Decided' : 'Degraded'}
            </span>
          </div>
        </div>
        <div style={css('display:flex; flex-wrap:wrap; gap:8px; margin-top:18px;')}>
          {participants.map((p) => (
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
          <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>dec_4b9e2f</span>
          <div style={css('flex:1;')} />
          {isDecided && (
            <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#1c7a4f;')}>
              <Svg html={ico('check', { size: 13, sw: 2 })} />verified
            </span>
          )}
          {isDegraded && (
            <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#b3343c;')}>
              <Svg html={ico('x', { size: 13, sw: 2 })} />unverified
            </span>
          )}
        </div>
        <div style={css('padding:22px;')}>
          <div style={css('display:flex; align-items:baseline; gap:12px; margin-bottom:18px;')}>
            <span style={css(MONO + ' font-size:11px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase; color:#9a9a9a; flex:none;')}>Decided</span>
            <span style={css("font-family:'Inter Tight',sans-serif; font-size:23px; font-weight:600; letter-spacing:-0.01em; color:#0a0a0a; line-height:1.2;")}>Yes — run a limited beta.</span>
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
              <p style={css('margin:0; font-size:14px; line-height:1.6; color:#2a2a2a; text-wrap:pretty;')}>
                First-response time has missed the service target for three consecutive weeks <span style={css(MONO + ' font-size:12px; color:#2c5f96;')}>evd_1</span>, and a scoped dry-run resolved redacted tickets faster <span style={css(MONO + ' font-size:12px; color:#2c5f96;')}>evd_2</span>. A beta surfaces drift risk early while staying inside the redaction boundary.
              </p>
            </div>
            <div>
              <div style={css(MONO + ' font-size:10px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5; margin-bottom:7px;')}>Scope</div>
              <div style={css('display:inline-flex; align-items:center; gap:7px; padding:3px 9px; background:#f7f2e8; border:1px solid rgba(154,107,7,0.26); border-radius:4px; margin-bottom:9px;')}>
                <Svg html={ico('chevronUp', { size: 12, sw: 2 }).replace('currentColor', '#9a6b07')} />
                <span style={css(MONO + ' font-size:9.5px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#9a6b07;')}>Narrower than the question</span>
              </div>
              <p style={css('margin:0; font-size:14px; line-height:1.6; color:#2a2a2a; text-wrap:pretty;')}>Redacted sample tickets only — not live customer threads, not the full ticket corpus.</p>
            </div>
          </div>
          <div style={css('margin-top:24px; padding-top:20px; border-top:1px solid #ededeb;')}>
            <div style={css(MONO + ' font-size:10px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5; margin-bottom:14px;')}>What happens next</div>
            <div style={css('display:grid; grid-template-columns:1fr 1fr; gap:14px 28px;')} className="clista-grid-2">
              {nextSteps.map((step) => (
                <div key={step.n} style={css('display:flex; align-items:flex-start; gap:12px;')}>
                  <span style={css(MONO + ' display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border:1px solid #d8d8d6; border-radius:50%; font-size:11px; font-weight:600; color:#3a3a3a; flex:none;')}>{step.n}</span>
                  <span style={css('font-size:13.5px; line-height:1.5; color:#2a2a2a; padding-top:2px; text-wrap:pretty;')}>{step.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SURVIVING OBJECTION (signature) ── */}
      <section style={css('position:relative; background:#fff; border:1px solid rgba(154,107,7,0.4); border-radius:7px; margin-bottom:26px; overflow:hidden; box-shadow:0 1px 2px rgba(10,10,10,0.03);')}>
        <div style={css('position:absolute; left:0; top:0; bottom:0; width:3px; background:#9a6b07;')} />
        <div style={css('padding:18px 22px 18px 24px;')}>
          <div style={css('display:flex; align-items:center; gap:11px; margin-bottom:13px; flex-wrap:wrap;')}>
            <Svg html={ico('scale')} style={css('display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border:1px solid rgba(154,107,7,0.35); border-radius:50%; color:#9a6b07; flex:none;')} />
            <span style={css(eyebrow)}>Objection</span>
            <span style={css('display:inline-flex; align-items:center; gap:6px; padding:4px 10px; background:#f7f2e8; border:1px solid rgba(154,107,7,0.4); border-radius:4px; ' + MONO + ' font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#9a6b07;')}>
              <Svg html={ico('shield', { size: 12, sw: 2 })} />Survived approval
            </span>
            <div style={css('flex:1;')} />
            <span style={css(MONO + ' font-size:11px; color:#a5a5a5;')}>obj_3e1c</span>
          </div>
          <p style={css('margin:0 0 14px; font-size:15px; line-height:1.6; color:#1a1a1a; max-width:820px; text-wrap:pretty;')}>
            Even when redacted, ticket free-text can leak identity through rare phrasing. The beta should log <span style={css('font-weight:600;')}>zero raw free-text</span> until a re-identification audit passes — proceeding before that audit accepts a privacy risk the evidence does not retire.
          </p>
          <div style={css('display:flex; align-items:center; gap:16px; flex-wrap:wrap; padding-top:13px; border-top:1px solid #ededeb;')}>
            <div style={css('display:flex; align-items:center; gap:8px;')}>
              <span style={css(MONO + ' display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; background:#f1f1ef; font-size:9px; font-weight:600; color:#4a4a4a;')}>PR</span>
              <span style={css('font-size:12.5px; color:#2a2a2a; font-weight:500;')}>Privacy Reviewer</span>
              <span style={css(MONO + ' font-size:9px; letter-spacing:0.1em; text-transform:uppercase; color:#a5a5a5;')}>challenger</span>
            </div>
            <span style={css('color:#d8d8d6;')}>·</span>
            <span style={css('font-size:12.5px; color:#6a6a6a;')}>Recorded, not retired. Decision proceeded over this objection; mitigation tracked as residual risk <span style={css(MONO + ' font-size:11.5px; color:#9a6b07;')}>risk_1</span>.</span>
          </div>
        </div>
      </section>

      {/* ── EVIDENCE ── */}
      <section style={css(sectionCard)}>
        <div style={css('display:flex; align-items:center; gap:11px; padding:15px 22px; border-bottom:1px solid #ededeb;')}>
          <Svg html={ico('fileSearch')} style={css(medallion)} />
          <span style={css(eyebrow)}>Evidence</span>
          <span style={css('color:#cfcfcd;')}>·</span>
          <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>4 sourced findings</span>
          <div style={css('flex:1;')} />
          <span style={css(MONO + ' font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:#b0b0b0;')}>confidence · hash · trace</span>
        </div>
        <div>
          {evidence.map((e) => {
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
                      <div style={css('display:flex; align-items:center; gap:8px;')}>
                        <span style={css(MONO + ' font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#a5a5a5;')}>conf</span>
                        <span style={css('position:relative; width:54px; height:4px; background:#ececea; border-radius:2px; overflow:hidden;')}>
                          <span style={css('position:absolute; left:0; top:0; bottom:0; width:' + Math.round(e.conf * 100) + '%; background:#2c5f96; border-radius:2px;')} />
                        </span>
                        <span style={css(MONO + ' font-size:12px; font-weight:600; color:#2a2a2a;')}>{e.conf}</span>
                      </div>
                      <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{e.hash}</span>
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
                          <span style={css('color:#a5a5a5;')}>introduced.by</span><span style={css('color:#2a2a2a;')}>{e.event}</span>
                          <span style={css('color:#a5a5a5;')}>content.hash</span><span style={css('color:#2a2a2a;')}>{e.hash}</span>
                        </div>
                        <div style={css('display:inline-flex; align-items:center; gap:7px; margin-top:12px; padding:4px 9px; background:#fff; border:1px solid #e5e5e5; border-radius:4px;')}>
                          <span style={css('width:6px; height:6px; border-radius:50%; flex:none; background:' + (e.existed ? '#1c7a4f' : '#9a6b07') + ';')} />
                          <span style={css(MONO + ' font-size:10.5px; color:' + (e.existed ? '#1c7a4f' : '#9a6b07') + ';')}>{e.existed ? 'source existed at contribution time' : 'source added after contribution time'}</span>
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
            <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>2</span>
          </div>
          <div>
            {assumptions.map((a) => {
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
                          <div style={css("font-family:'JetBrains Mono',monospace; font-size:9.5px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5; margin-bottom:9px;")}>Provenance trace</div>
                          <div style={css(MONO + ' display:grid; grid-template-columns:auto 1fr; gap:7px 14px; font-size:11.5px;')}>
                            <span style={css('color:#a5a5a5;')}>source.type</span><span style={css('color:#2a2a2a;')}>{a.sourceType}</span>
                            <span style={css('color:#a5a5a5;')}>introduced.by</span><span style={css('color:#2a2a2a;')}>{a.event}</span>
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
            <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>3</span>
          </div>
          <div>
            {claims.map((c) => {
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
                          <div style={css("font-family:'JetBrains Mono',monospace; font-size:9.5px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5; margin-bottom:9px;")}>Provenance trace</div>
                          <div style={css(MONO + ' display:grid; grid-template-columns:auto 1fr; gap:7px 14px; font-size:11.5px;')}>
                            <span style={css('color:#a5a5a5;')}>source.type</span><span style={css('color:#2a2a2a;')}>{c.sourceType}</span>
                            <span style={css('color:#a5a5a5;')}>introduced.by</span><span style={css('color:#2a2a2a;')}>{c.event}</span>
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
            <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>2</span>
          </div>
          <div>
            {reviews.map((r) => (
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
        <section style={css('background:#fcfbf8; border:1px solid #dcdcda; border-radius:7px; overflow:hidden;')}>
          <div style={css('display:flex; align-items:center; gap:11px; padding:15px 20px; border-bottom:1px solid #ededeb;')}>
            <Svg html={ico('flag')} style={css(medallion)} />
            <span style={css(eyebrow)}>Minority report</span>
            <span style={css('color:#cfcfcd;')}>·</span>
            <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>preserved</span>
          </div>
          <div style={css('padding:16px 20px;')}>
            <p style={css('margin:0 0 13px; font-size:14px; line-height:1.6; color:#1a1a1a; font-style:italic; text-wrap:pretty;')}>
              “I do not block the beta, but I record that proceeding before the re-identification audit accepts a privacy risk the evidence does not retire. Preserve this dissent on the record.”
            </p>
            <div style={css('display:flex; align-items:center; gap:9px; padding-top:12px; border-top:1px solid #ededeb;')}>
              <span style={css(MONO + ' display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; background:#f1f1ef; font-size:9px; font-weight:600; color:#4a4a4a;')}>PR</span>
              <span style={css('font-size:12.5px; color:#2a2a2a; font-weight:500;')}>Privacy Reviewer</span>
              <span style={css(MONO + ' font-size:9px; letter-spacing:0.1em; text-transform:uppercase; color:#a5a5a5;')}>challenger</span>
              <div style={css('flex:1;')} />
              <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>min_2f8a</span>
            </div>
          </div>
        </section>
      </div>

      {/* ── RESIDUAL RISKS ── */}
      <section style={css('background:#fff; border:1px solid #dcdcda; border-radius:7px; margin-bottom:26px; overflow:hidden;')}>
        <div style={css('display:flex; align-items:center; gap:11px; padding:15px 22px; border-bottom:1px solid #ededeb;')}>
          <Svg html={ico('alertCircle')} style={css(medallion)} />
          <span style={css(eyebrow)}>Residual risks</span>
          <span style={css('color:#cfcfcd;')}>·</span>
          <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>2 carried forward</span>
        </div>
        <div style={css('display:grid; grid-template-columns:1fr 1fr;')} className="clista-grid-2">
          {risks.map((rk) => (
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

      {/* ── AUDIT CHAIN (TERMINAL) ── */}
      <section className="clista-term" style={css('background:#0c0d12; border:1px solid #1c1e26; border-radius:7px; overflow:hidden; box-shadow:0 4px 18px rgba(10,10,10,0.18);')}>
        <div style={css('display:flex; align-items:center; gap:12px; padding:13px 18px; border-bottom:1px solid #1c1e26; background:#101117;')}>
          <Svg html={ico('terminal')} style={css('color:#7f9cff;')} />
          <span style={css(MONO + ' font-size:11.5px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#cdd2dc;')}>Audit chain</span>
          <span style={css(MONO + ' font-size:11px; color:#5a6070;')}>append-only · {auditEvents.length} events</span>
          <div style={css('flex:1;')} />
          <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#57c98a; border:1px solid #57c98a40; border-radius:4px; padding:4px 9px;')}>
            validate <Svg html={ico('check', { size: 12, sw: 2.4 })} />
          </span>
          {isDecided ? (
            <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#57c98a; border:1px solid #57c98a40; border-radius:4px; padding:4px 9px;')}>
              replay <Svg html={ico('check', { size: 12, sw: 2.4 })} />
            </span>
          ) : (
            <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#e0676d; border:1px solid #e0676d55; border-radius:4px; padding:4px 9px;')}>
              replay <Svg html={ico('x', { size: 12, sw: 2.4 })} />
            </span>
          )}
          <Hoverable onClick={() => setAuditOpen((o) => !o)} base={css(MONO + ' font-size:13px; color:#8a90a0; background:none; border:none; cursor:pointer; padding:4px 6px; margin-left:4px;')} hover={css('color:#cdd2dc;')}>
            {auditOpen ? '▾' : '▸'}
          </Hoverable>
        </div>
        {auditOpen && (
          <div style={css('padding:8px 0; position:relative;')}>
            {auditEvents.map((ev) => {
              const c = auditSigColors[ev.sig] || '#aeb4c0';
              const bold = ev.sig === 'decided' || ev.sig === 'fail';
              return (
                <div key={ev.id} style={css('display:flex; align-items:center; gap:14px; padding:6px 18px;')}>
                  <span style={css('width:6px; height:6px; border-radius:50%; flex:none; background:' + c + ';')} />
                  <span style={css(MONO + ' font-size:12px; font-weight:' + (bold ? '600' : '500') + '; color:' + c + '; min-width:210px;')}>{ev.t}</span>
                  <span style={css(MONO + ' font-size:11.5px; color:#6b7180; min-width:80px;')}>{ev.id}</span>
                  <span style={css(MONO + ' font-size:11.5px; color:#8a90a0; min-width:140px;')}>{ev.actor}</span>
                  <span style={css(MONO + ' font-size:11.5px; color:#5a6070;')}>{ev.ts}</span>
                  <div style={css('flex:1;')} />
                  {ev.note && (
                    <span style={css(MONO + ' font-size:9.5px; letter-spacing:0.08em; text-transform:uppercase; color:' + c + '; border:1px solid ' + c + '55; border-radius:3px; padding:1px 6px;')}>{ev.note}</span>
                  )}
                </div>
              );
            })}
            <div style={css('margin:10px 18px 4px; padding-top:12px; border-top:1px solid #1c1e26;')}>
              <span style={css(MONO + ' font-size:11px; color:#5a6070; line-height:1.6;')}>// state is provable from events. fail-closed: an unverifiable chain renders the decision <span style={css('color:#8a90a0;')}>unverified</span>, never silently trusted.</span>
            </div>
          </div>
        )}
      </section>

      <Boundary />
    </div>
  );
}
