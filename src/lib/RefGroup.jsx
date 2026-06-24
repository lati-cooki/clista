import { css } from './css.js';
import { filterStyle } from '../styles.js';

const MONO = "font-family:'JetBrains Mono',monospace;";
const fieldLabel = "display:block; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#6a6a6a; margin-bottom:8px;";

// A compact toggle-chip multi-select over a projection reference list (claims,
// evidence, assumptions, objections). Used by the Compose screen and the cockpit's
// stage-a-decision panel to pick a decision request's support sets.
//   items:    [{ id, text }]
//   selected: [id, …]
//   onToggle: (id) => void
export function RefGroup({ title, items = [], selected = [], onToggle }) {
  return (
    <div style={css('margin-bottom:14px;')}>
      <label style={css(fieldLabel)}>{title} <span style={css('color:#a5a5a5; font-weight:500;')}>{selected.length ? `${selected.length} selected` : 'optional'}</span></label>
      {items.length ? (
        <div style={css('display:flex; flex-wrap:wrap; gap:7px;')}>
          {items.map((it) => (
            <button key={it.id} onClick={() => onToggle(it.id)} title={it.text} style={filterStyle(selected.includes(it.id))}>{it.id}</button>
          ))}
        </div>
      ) : (
        <p style={css('margin:0; ' + MONO + ' font-size:11px; color:#b0b0b0;')}>// none in this thread yet</p>
      )}
    </div>
  );
}
