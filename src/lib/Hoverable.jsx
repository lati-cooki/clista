import { useState } from 'react';
import { sx } from './css.js';

// An element that merges a `hover` style over its `base` style on pointer hover.
// Replaces the design tool's `style-hover` attribute. `base`/`hover` accept
// either CSS strings or style objects.
export function Hoverable({ as: Tag = 'button', base, hover, children, ...rest }) {
  const [h, setH] = useState(false);
  return (
    <Tag
      style={h ? sx(base, hover) : sx(base)}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
