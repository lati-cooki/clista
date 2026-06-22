// Renders a raw inline-SVG string. The design's icons are authored as HTML SVG
// markup (stroke-width, stroke-linecap, …); rendering them via innerHTML avoids
// converting every attribute to JSX camelCase and keeps them byte-faithful.
export function Svg({ html, style, className }) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', ...(style || {}) }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
