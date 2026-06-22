import { useState } from 'react';
import { css } from './lib/css.js';
import { Svg } from './lib/Svg.jsx';
import { Hoverable } from './lib/Hoverable.jsx';
import { ico, octopus } from './icons.js';
import { navItemStyle, navCountStyle } from './styles.js';
import { Cockpit } from './screens/Cockpit.jsx';
import { ThreadIndex } from './screens/ThreadIndex.jsx';
import { Compose } from './screens/Compose.jsx';
import { Kit } from './screens/Kit.jsx';

const NAV = [
  { key: 'cockpit', label: 'Thread Cockpit', count: '', icon: ico('cockpit', { size: 18 }) },
  { key: 'index', label: 'Thread Index', count: '6', icon: ico('index', { size: 18 }) },
  { key: 'compose', label: 'Compose / Append', count: '', icon: ico('plus', { size: 18 }) },
  { key: 'kit', label: 'Component Kit', count: '', icon: ico('kit', { size: 18 }) },
];

export function App() {
  const [screen, setScreen] = useState('cockpit');
  const go = (next) => () => setScreen(next);

  return (
    <div
      className="clista-shell"
      style={css(
        'display:grid; grid-template-columns:236px 1fr; grid-template-rows:57px 1fr; height:100vh; width:100%; background:#e7e6e3; overflow:hidden;'
      )}
    >
      {/* ░░ TOPBAR ░░ */}
      <header
        style={css(
          'grid-column:1 / 3; display:flex; align-items:center; gap:14px; padding:0 20px; background:#ffffff; border-bottom:1px solid #e5e5e5; z-index:10;'
        )}
      >
        <div style={css('display:flex; align-items:center; gap:11px;')}>
          <Svg html={octopus} style={css('align-items:center; justify-content:center; width:30px; height:30px; color:#0a0a0a;')} />
          <div style={css('display:flex; flex-direction:column; line-height:1;')}>
            <span style={css("font-family:'JetBrains Mono',monospace; font-size:14px; font-weight:600; letter-spacing:0.18em; color:#0a0a0a;")}>CLISTA</span>
            <span style={css("font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:500; letter-spacing:0.2em; color:#9a9a9a; margin-top:3px;")}>PROTOCOL</span>
          </div>
        </div>
        <div style={css('width:1px; height:24px; background:#e5e5e5; margin:0 4px;')} />
        <div style={css("font-family:'JetBrains Mono',monospace; font-size:11.5px; color:#8a8a8a; letter-spacing:0.02em;")}>app.clista.ai</div>
        <div style={css('flex:1;')} />
        <div data-topbar-tag style={css("font-family:'JetBrains Mono',monospace; font-size:10.5px; color:#9a9a9a; letter-spacing:0.06em; text-transform:uppercase;")}>
          Conversation is input · Reasoning state is output
        </div>
        <div style={css('width:1px; height:24px; background:#e5e5e5; margin:0 8px;')} />
        <div style={css('display:flex; align-items:center; gap:8px;')}>
          <span style={css("display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border:1px solid #e0e0de; border-radius:50%; font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:600; color:#0a0a0a;")}>M</span>
          <span style={css('font-size:12.5px; color:#4a4a4a; font-weight:500;')}>Maya</span>
        </div>
      </header>

      {/* ░░ SIDEBAR ░░ */}
      <aside style={css('grid-row:2 / 3; background:#fbfbfa; border-right:1px solid #e5e5e5; display:flex; flex-direction:column; padding:18px 12px;')}>
        <div data-aside-extra style={css("font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:#a5a5a5; padding:0 10px 10px;")}>Workspace</div>
        <nav style={css('display:flex; flex-direction:column; gap:2px;')}>
          {NAV.map((n) => {
            const active = screen === n.key;
            return (
              <Hoverable key={n.key} onClick={go(n.key)} base={navItemStyle(active)} hover={active ? null : css('background:#f0efed;')}>
                <Svg html={n.icon} style={css('width:18px; height:18px; flex:none;')} />
                <span style={css('flex:1; text-align:left;')}>{n.label}</span>
                <span style={navCountStyle(active)}>{n.count}</span>
              </Hoverable>
            );
          })}
        </nav>

        <div data-aside-extra style={css('margin-top:22px; padding:0 10px;')}>
          <div style={css("font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:#a5a5a5; padding-bottom:10px;")}>Status</div>
          <div style={css('display:flex; flex-direction:column; gap:9px;')}>
            <div style={css('display:flex; align-items:center; gap:9px;')}>
              <span style={css('width:7px; height:7px; border-radius:50%; background:#1c7a4f; flex:none;')} />
              <span style={css("font-family:'JetBrains Mono',monospace; font-size:11px; color:#4a4a4a;")}>chain validated</span>
            </div>
            <div style={css('display:flex; align-items:center; gap:9px;')}>
              <span style={css('width:7px; height:7px; border-radius:50%; background:#1c7a4f; flex:none; animation:clistaPulse 1.6s ease-in-out infinite;')} />
              <span style={css("font-family:'JetBrains Mono',monospace; font-size:11px; color:#4a4a4a;")}>replay deterministic</span>
            </div>
          </div>
        </div>

        <div style={css('flex:1;')} />

        <div data-aside-extra style={css('padding:14px 10px 4px; border-top:1px solid #ececea;')}>
          <p style={css('margin:0; font-size:11px; line-height:1.55; color:#9a9a9a; text-wrap:pretty;')}>
            ClisTa records the <span style={css('color:#5a5a5a;')}>shape</span> of a decision. It does not make the decision, rank truth, assign blame, or create consensus.
          </p>
        </div>
      </aside>

      {/* ░░ MAIN ░░ */}
      <main
        className="clista-scroll"
        style={css(
          'grid-row:2 / 3; overflow-y:auto; background:#e7e6e3; background-image:radial-gradient(circle at 1px 1px, rgba(10,10,10,0.045) 1px, transparent 0); background-size:24px 24px;'
        )}
      >
        {screen === 'cockpit' && <Cockpit go={go} />}
        {screen === 'index' && <ThreadIndex go={go} />}
        {screen === 'compose' && <Compose go={go} />}
        {screen === 'kit' && <Kit />}
      </main>
    </div>
  );
}
