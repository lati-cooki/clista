import { css } from '../lib/css.js';
import { Svg } from '../lib/Svg.jsx';
import { Hoverable } from '../lib/Hoverable.jsx';
import { ico } from '../icons.js';

const MONO = "font-family:'JetBrains Mono',monospace;";
const cardTitle = "font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5; margin-bottom:18px;";
const card = 'background:#fff; border:1px solid #dcdcda; border-radius:7px; padding:22px;';
const medallion = 'display:inline-flex; align-items:center; justify-content:center; width:38px; height:38px; border:1px solid #d8d8d6; border-radius:50%; color:#0a0a0a;';

const SWATCHES = [
  { name: 'Ink', hex: '#0a0a0a', bg: '#0a0a0a', bd: '#0a0a0a' },
  { name: 'Paper', hex: '#ffffff', bg: '#ffffff', bd: '#d4d4d2' },
  { name: 'Hairline', hex: '#e5e5e5', bg: '#e5e5e5', bd: '#dcdcda' },
  { name: 'Meta', hex: '#8a8a8a', bg: '#8a8a8a', bd: '#8a8a8a' },
  { name: 'Verified', hex: '#1c7a4f', bg: '#1c7a4f', bd: '#1c7a4f' },
  { name: 'Evidence', hex: '#2c5f96', bg: '#2c5f96', bd: '#2c5f96' },
  { name: 'Degraded', hex: '#9a6b07', bg: '#9a6b07', bd: '#9a6b07' },
  { name: 'Failed', hex: '#b3343c', bg: '#b3343c', bd: '#b3343c' },
];

const BADGES = [
  { label: 'Active', bg: '#fff', fg: '#4a4a4a', bd: '#d4d4d2', dot: '#8a8a8a' },
  { label: 'Decided', bg: '#0a0a0a', fg: '#fff', bd: '#0a0a0a', dot: '#fff' },
  { label: 'Verified', bg: '#eef5f0', fg: '#1c7a4f', bd: 'rgba(28,122,79,0.3)', dot: '#1c7a4f' },
  { label: 'Degraded', bg: '#f7f2e8', fg: '#9a6b07', bd: 'rgba(154,107,7,0.35)', dot: '#9a6b07' },
  { label: 'Failed', bg: '#f8eeee', fg: '#b3343c', bd: 'rgba(179,52,60,0.35)', dot: '#b3343c' },
];

const badgeBase = (b) =>
  'display:inline-flex; align-items:center; gap:7px; ' + MONO + ' font-size:10.5px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; padding:5px 11px; border-radius:4px; background:' + b.bg + '; color:' + b.fg + '; border:1px solid ' + b.bd + ';';

export function Kit() {
  return (
    <div className="clista-screen" style={css('max-width:1080px; margin:0 auto; padding:28px 40px 64px;')}>
      <div style={css('margin-bottom:26px;')}>
        <div style={css(MONO + ' font-size:11px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:#9a9a9a; margin-bottom:9px;')}>Component Kit</div>
        <h1 style={css("margin:0 0 8px; font-family:'Inter Tight',sans-serif; font-size:28px; font-weight:600; letter-spacing:-0.015em; color:#0a0a0a;")}>Protocol primitives</h1>
        <p style={css('margin:0; font-size:14px; color:#6a6a6a; line-height:1.55; max-width:600px;')}>
          Monochrome by conviction. Color appears only as a protocol signal — the green check means something <span style={css('font-style:italic;')}>because</span> nothing else is colored.
        </p>
      </div>

      <div style={css('display:grid; grid-template-columns:1fr 1fr; gap:18px;')} className="clista-grid-2">
        {/* TYPE */}
        <div style={css('grid-column:1 / 3; ' + card)}>
          <div style={css(cardTitle)}>Type · three voices</div>
          <div style={css('display:grid; grid-template-columns:1fr 1fr 1fr; gap:24px;')} className="clista-grid-2">
            <div>
              <div style={css(MONO + ' font-size:9.5px; letter-spacing:0.1em; text-transform:uppercase; color:#b0b0b0; margin-bottom:10px;')}>Inter Tight · display + body</div>
              <div style={css("font-family:'Inter Tight',sans-serif; font-size:26px; font-weight:600; letter-spacing:-0.015em; color:#0a0a0a; line-height:1.15; margin-bottom:8px;")}>Trace its shape.</div>
              <p style={css("margin:0; font-family:'Inter Tight',sans-serif; font-size:13.5px; line-height:1.55; color:#3a3a3a;")}>Running body text for reasoning state and decision records.</p>
            </div>
            <div>
              <div style={css(MONO + ' font-size:9.5px; letter-spacing:0.1em; text-transform:uppercase; color:#b0b0b0; margin-bottom:10px;')}>Mono · eyebrow + label</div>
              <div style={css(MONO + ' font-size:11px; font-weight:600; letter-spacing:0.16em; text-transform:uppercase; color:#3a3a3a; margin-bottom:10px;')}>Decision Record</div>
              <div style={css(MONO + ' font-size:11px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:#9a9a9a;')}>Evidence · 4 items</div>
            </div>
            <div>
              <div style={css(MONO + ' font-size:9.5px; letter-spacing:0.1em; text-transform:uppercase; color:#b0b0b0; margin-bottom:10px;')}>Mono · the engine's voice</div>
              <div style={css(MONO + ' font-size:13px; color:#2a2a2a; line-height:1.7;')}>evd_1<br />sha256:9f2a4c…e1b7<br />2026-06-20 17:12:24Z</div>
            </div>
          </div>
        </div>

        {/* COLOR SIGNALS */}
        <div style={css(card)}>
          <div style={css(cardTitle)}>Color · signal only</div>
          <div style={css('display:grid; grid-template-columns:repeat(4,1fr); gap:14px;')}>
            {SWATCHES.map((s) => (
              <div key={s.name}>
                <div style={css('height:46px; border-radius:5px; margin-bottom:8px; background:' + s.bg + '; border:1px solid ' + s.bd + ';')} />
                <div style={css("font-family:'Inter Tight',sans-serif; font-size:11.5px; font-weight:600; color:#1a1a1a; margin-bottom:1px;")}>{s.name}</div>
                <div style={css(MONO + ' font-size:10px; color:#9a9a9a;')}>{s.hex}</div>
              </div>
            ))}
          </div>
        </div>

        {/* BUTTONS */}
        <div style={css(card)}>
          <div style={css(cardTitle)}>Button</div>
          <div style={css('display:flex; flex-wrap:wrap; gap:10px; align-items:center;')}>
            <Hoverable base={css('display:inline-flex; align-items:center; gap:8px; padding:10px 16px; background:#0a0a0a; color:#fff; border:none; border-radius:5px; ' + MONO + ' font-size:11.5px; font-weight:500; letter-spacing:0.04em; cursor:pointer;')} hover={css('background:#2a2a2a;')}>
              <Svg html={ico('checkArrow', { size: 13, sw: 1.9 })} />Record decision
            </Hoverable>
            <Hoverable base={css('padding:10px 16px; background:#fff; color:#1a1a1a; border:1px solid #d4d4d2; border-radius:5px; ' + MONO + ' font-size:11.5px; font-weight:500; letter-spacing:0.04em; cursor:pointer;')} hover={css('border-color:#0a0a0a;')}>Request review</Hoverable>
            <Hoverable base={css('padding:10px 14px; background:none; color:#6a6a6a; border:none; border-radius:5px; ' + MONO + ' font-size:11.5px; letter-spacing:0.04em; cursor:pointer;')} hover={css('color:#0a0a0a;')}>Cancel</Hoverable>
            <Hoverable base={css('padding:10px 16px; background:#fff; color:#b3343c; border:1px solid rgba(179,52,60,0.4); border-radius:5px; ' + MONO + ' font-size:11.5px; font-weight:500; letter-spacing:0.04em; cursor:pointer;')} hover={css('background:#f8eeee;')}>Withdraw</Hoverable>
          </div>
        </div>

        {/* BADGES */}
        <div style={css('grid-column:1 / 3; ' + card)}>
          <div style={css(cardTitle)}>Badge · protocol status</div>
          <div style={css('display:flex; flex-wrap:wrap; gap:12px; align-items:center;')}>
            {BADGES.map((b) => (
              <span key={b.label} style={css(badgeBase(b))}>
                <span style={css('width:6px; height:6px; border-radius:50%; background:' + b.dot + ';')} />{b.label}
              </span>
            ))}
            <span style={css('width:1px; height:22px; background:#e5e5e5;')} />
            <span style={css('display:inline-flex; align-items:center; gap:6px; padding:5px 11px; background:#f7f2e8; border:1px solid rgba(154,107,7,0.4); border-radius:4px; ' + MONO + ' font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#9a6b07;')}>
              <Svg html={ico('shield', { size: 12, sw: 2 })} />Survived approval
            </span>
          </div>
        </div>

        {/* PRIMITIVES: medallion + numbered step */}
        <div style={css(card)}>
          <div style={css(cardTitle)}>IconMedallion · NumberedStep</div>
          <div style={css('display:flex; gap:12px; margin-bottom:22px;')}>
            <Svg html={ico('checkSquare', { size: 17 })} style={css(medallion)} />
            <Svg html={ico('fileSearch', { size: 17 })} style={css(medallion)} />
            <Svg html={ico('shield', { size: 17 })} style={css(medallion)} />
            <Svg html={ico('fork', { size: 17 })} style={css(medallion)} />
          </div>
          <div style={css('display:flex; flex-direction:column; gap:12px;')}>
            <div style={css('display:flex; align-items:center; gap:12px;')}>
              <span style={css(MONO + ' display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border:1px solid #d8d8d6; border-radius:50%; font-size:11px; font-weight:600; color:#3a3a3a;')}>1</span>
              <span style={css('font-size:13.5px; color:#2a2a2a;')}>Declare the assumption.</span>
            </div>
            <div style={css('display:flex; align-items:center; gap:12px;')}>
              <span style={css(MONO + ' display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border:1px solid #d8d8d6; border-radius:50%; font-size:11px; font-weight:600; color:#3a3a3a;')}>2</span>
              <span style={css('font-size:13.5px; color:#2a2a2a;')}>Attach the evidence.</span>
            </div>
          </div>
        </div>

        {/* CARD + RULEDOT */}
        <div style={css(card)}>
          <div style={css(cardTitle)}>Card · RuleDot</div>
          <div style={css('background:#fcfcfb; border:1px solid #e5e5e5; border-radius:5px; padding:14px 16px; margin-bottom:18px;')}>
            <div style={css(MONO + ' font-size:10.5px; letter-spacing:0.1em; text-transform:uppercase; color:#9a9a9a; margin-bottom:6px;')}>Hairline-bordered · flat</div>
            <p style={css('margin:0; font-size:13.5px; color:#2a2a2a; line-height:1.5;')}>No shadow, no lift. Elevation is communicated by the hairline alone.</p>
          </div>
          <div style={css('display:flex; align-items:center; gap:14px;')}>
            <span style={css('flex:1; height:1px; background:#d4d4d2;')} />
            <span style={css(MONO + ' font-size:18px; color:#c4c4c2;')}>·</span>
            <span style={css('flex:1; height:1px; background:#d4d4d2;')} />
          </div>
        </div>

        {/* TERMINAL */}
        <div style={css('grid-column:1 / 3; ' + card)}>
          <div style={css(cardTitle)}>Terminal · the audit voice</div>
          <div style={css('background:#0c0d12; border:1px solid #1c1e26; border-radius:6px; overflow:hidden;')}>
            <div style={css('display:flex; align-items:center; gap:10px; padding:11px 16px; border-bottom:1px solid #1c1e26; background:#101117;')}>
              <Svg html={ico('terminal', { size: 14 })} style={css('color:#7f9cff;')} />
              <span style={css(MONO + ' font-size:11px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#cdd2dc;')}>Audit chain</span>
              <div style={css('flex:1;')} />
              <span style={css(MONO + ' display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#57c98a; border:1px solid #57c98a40; border-radius:4px; padding:3px 8px;')}>validate <Svg html={ico('check', { size: 11, sw: 2.4 })} /></span>
              <span style={css(MONO + ' display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#57c98a; border:1px solid #57c98a40; border-radius:4px; padding:3px 8px;')}>replay <Svg html={ico('check', { size: 11, sw: 2.4 })} /></span>
            </div>
            <div style={css('padding:10px 0;')}>
              <div style={css('display:flex; align-items:center; gap:14px; padding:5px 16px;')}>
                <span style={css('width:6px; height:6px; border-radius:50%; background:#7f9cff;')} />
                <span style={css(MONO + ' font-size:12px; color:#7f9cff; min-width:200px;')}>evidence.added</span>
                <span style={css(MONO + ' font-size:11.5px; color:#6b7180;')}>evt_1b8c</span>
                <span style={css(MONO + ' font-size:11.5px; color:#5a6070;')}>research_lead</span>
              </div>
              <div style={css('display:flex; align-items:center; gap:14px; padding:5px 16px;')}>
                <span style={css('width:6px; height:6px; border-radius:50%; background:#d6a64a;')} />
                <span style={css(MONO + ' font-size:12px; color:#d6a64a; min-width:200px;')}>objection.raised</span>
                <span style={css(MONO + ' font-size:11.5px; color:#6b7180;')}>evt_5b6d</span>
                <span style={css(MONO + ' font-size:11.5px; color:#5a6070;')}>privacy_reviewer</span>
              </div>
              <div style={css('display:flex; align-items:center; gap:14px; padding:5px 16px;')}>
                <span style={css('width:6px; height:6px; border-radius:50%; background:#e8ebf2;')} />
                <span style={css(MONO + ' font-size:12px; font-weight:600; color:#e8ebf2; min-width:200px;')}>decision.recorded</span>
                <span style={css(MONO + ' font-size:11.5px; color:#6b7180;')}>evt_8a02</span>
                <span style={css(MONO + ' font-size:11.5px; color:#5a6070;')}>maya</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={css('display:flex; align-items:center; gap:14px; margin-top:26px;')}>
        <span style={css('flex:1; height:1px; background:#d4d4d2;')} />
        <span style={css(MONO + ' font-size:18px; color:#c4c4c2;')}>·</span>
        <span style={css('flex:1; height:1px; background:#d4d4d2;')} />
      </div>
      <p style={css('margin:16px auto 0; text-align:center; font-size:12px; line-height:1.6; color:#9a9a9a; max-width:560px; text-wrap:pretty;')}>
        ClisTa records the shape of a decision. It does not make the decision, rank truth, assign blame, or create consensus.
      </p>
    </div>
  );
}
