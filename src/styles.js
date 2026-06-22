import { css } from './lib/css.js';

// Dynamic, state-driven style builders ported from the design's DCLogic helpers.
// Each returns a React style object.

export const navItemStyle = (active) =>
  css(
    'display:flex; align-items:center; gap:11px; width:100%; padding:9px 10px; border:none; border-radius:6px; cursor:pointer; font-family:Inter Tight,sans-serif; font-size:13px; font-weight:' +
      (active ? '600' : '500') +
      '; letter-spacing:0.01em; text-align:left; background:' +
      (active ? '#0a0a0a' : 'transparent') +
      '; color:' +
      (active ? '#ffffff' : '#3a3a3a') +
      ';'
  );

export const navCountStyle = (active) =>
  css('font-family:JetBrains Mono,monospace; font-size:10.5px; color:' + (active ? 'rgba(255,255,255,0.6)' : '#b0b0b0') + ';');

export const tabStyle = (active) =>
  css(
    'font-family:JetBrains Mono,monospace; font-size:11px; font-weight:500; letter-spacing:0.04em; padding:5px 12px; border:none; cursor:pointer; background:' +
      (active ? '#0a0a0a' : 'transparent') +
      '; color:' +
      (active ? '#ffffff' : '#8a8a8a') +
      ';'
  );

export const filterStyle = (active) =>
  css(
    'font-family:JetBrains Mono,monospace; font-size:10.5px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; padding:5px 12px; border:1px solid ' +
      (active ? '#0a0a0a' : '#dedede') +
      '; border-radius:4px; cursor:pointer; background:' +
      (active ? '#0a0a0a' : '#fff') +
      '; color:' +
      (active ? '#fff' : '#6a6a6a') +
      ';'
  );

const BADGE_MAP = {
  decided: { bg: '#0a0a0a', fg: '#ffffff', bd: '#0a0a0a', dot: '#ffffff' },
  verified: { bg: '#eef5f0', fg: '#1c7a4f', bd: 'rgba(28,122,79,0.3)', dot: '#1c7a4f' },
  active: { bg: '#ffffff', fg: '#4a4a4a', bd: '#d4d4d2', dot: '#8a8a8a' },
  degraded: { bg: '#f7f2e8', fg: '#9a6b07', bd: 'rgba(154,107,7,0.35)', dot: '#9a6b07' },
  failed: { bg: '#f8eeee', fg: '#b3343c', bd: 'rgba(179,52,60,0.35)', dot: '#b3343c' },
};

export function badgeFor(status) {
  const c = BADGE_MAP[status] || BADGE_MAP.active;
  return {
    badge: css(
      'display:inline-flex; align-items:center; gap:7px; font-family:JetBrains Mono,monospace; font-size:10.5px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; padding:5px 11px; border-radius:4px; background:' +
        c.bg +
        '; color:' +
        c.fg +
        '; border:1px solid ' +
        c.bd +
        ';'
    ),
    dot: css('width:6px; height:6px; border-radius:50%; flex:none; background:' + c.dot + ';'),
  };
}

export const provBtnStyle = (open) =>
  css(
    'display:inline-flex; align-items:center; gap:6px; font-family:JetBrains Mono,monospace; font-size:10.5px; letter-spacing:0.04em; color:' +
      (open ? '#0a0a0a' : '#8a8a8a') +
      '; background:none; border:none; cursor:pointer; padding:0;'
  );
