export interface IconPart {
  tag: 'path' | 'circle' | 'rect';
  attrs: Record<string, string | number>;
}

export const icons = {
  dice: [
    { tag: 'rect', attrs: { x: 3, y: 3, width: 18, height: 18, rx: 3 } },
    { tag: 'circle', attrs: { cx: 8, cy: 8, r: 1, fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: 16, cy: 8, r: 1, fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: 12, cy: 12, r: 1, fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: 8, cy: 16, r: 1, fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: 16, cy: 16, r: 1, fill: 'currentColor' } },
  ],
  palette: [
    {
      tag: 'path',
      attrs: {
        d: 'M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z',
      },
    },
    { tag: 'circle', attrs: { cx: 13.5, cy: 6.5, r: 0.5, fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: 17.5, cy: 10.5, r: 0.5, fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: 6.5, cy: 12.5, r: 0.5, fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: 8.5, cy: 7.5, r: 0.5, fill: 'currentColor' } },
  ],
  eye: [
    {
      tag: 'path',
      attrs: {
        d: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0',
      },
    },
    { tag: 'circle', attrs: { cx: 12, cy: 12, r: 3 } },
  ],
  bubbles: [
    { tag: 'path', attrs: { d: 'M7.001 15.085A1.5 1.5 0 0 1 9 16.5' } },
    { tag: 'circle', attrs: { cx: 18.5, cy: 8.5, r: 3.5 } },
    { tag: 'circle', attrs: { cx: 7.5, cy: 16.5, r: 5.5 } },
    { tag: 'circle', attrs: { cx: 7.5, cy: 4.5, r: 2.5 } },
  ],
  settings: [
    {
      tag: 'path',
      attrs: {
        d: 'M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915',
      },
    },
    { tag: 'circle', attrs: { cx: 12, cy: 12, r: 3 } },
  ],
  'volume-2': [
    {
      tag: 'path',
      attrs: {
        d: 'M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z',
      },
    },
    { tag: 'path', attrs: { d: 'M16 9a5 5 0 0 1 0 6' } },
    { tag: 'path', attrs: { d: 'M19.364 18.364a9 9 0 0 0 0-12.728' } },
  ],
  'volume-x': [
    {
      tag: 'path',
      attrs: {
        d: 'M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z',
      },
    },
    { tag: 'path', attrs: { d: 'm22 9-6 6' } },
    { tag: 'path', attrs: { d: 'm16 9 6 6' } },
  ],
  star: [
    {
      tag: 'path',
      attrs: {
        d: 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z',
      },
    },
  ],
  clock: [
    { tag: 'circle', attrs: { cx: 12, cy: 12, r: 10 } },
    { tag: 'path', attrs: { d: 'M12 6v6l4 2' } },
  ],
  check: [{ tag: 'path', attrs: { d: 'M20 6 9 17l-5-5' } }],
  x: [
    { tag: 'path', attrs: { d: 'M18 6 6 18' } },
    { tag: 'path', attrs: { d: 'm6 6 12 12' } },
  ],
  play: [
    {
      tag: 'path',
      attrs: {
        d: 'M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z',
      },
    },
  ],
  'arrow-right': [
    { tag: 'path', attrs: { d: 'M5 12h14' } },
    { tag: 'path', attrs: { d: 'm12 5 7 7-7 7' } },
  ],
  'arrow-left': [
    { tag: 'path', attrs: { d: 'M19 12H5' } },
    { tag: 'path', attrs: { d: 'm12 19-7-7 7-7' } },
  ],
  house: [
    {
      tag: 'path',
      attrs: { d: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8' },
    },
    {
      tag: 'path',
      attrs: {
        d: 'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      },
    },
  ],
  info: [
    { tag: 'circle', attrs: { cx: 12, cy: 12, r: 10 } },
    { tag: 'path', attrs: { d: 'M12 16v-4' } },
    { tag: 'path', attrs: { d: 'M12 8h.01' } },
  ],
  'chevron-down': [{ tag: 'path', attrs: { d: 'm6 9 6 6 6-6' } }],
  'book-open': [
    { tag: 'path', attrs: { d: 'M12 7v14' } },
    {
      tag: 'path',
      attrs: {
        d: 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
      },
    },
  ],
  'shield-check': [
    {
      tag: 'path',
      attrs: {
        d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
      },
    },
    { tag: 'path', attrs: { d: 'm9 12 2 2 4-4' } },
  ],
  heart: [
    {
      tag: 'path',
      attrs: {
        d: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
      },
    },
  ],
  users: [
    { tag: 'path', attrs: { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' } },
    { tag: 'path', attrs: { d: 'M16 3.128a4 4 0 0 1 0 7.744' } },
    { tag: 'path', attrs: { d: 'M22 21v-2a4 4 0 0 0-3-3.87' } },
    { tag: 'circle', attrs: { cx: 9, cy: 7, r: 4 } },
  ],
  sparkles: [
    {
      tag: 'path',
      attrs: {
        d: 'm12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z',
      },
    },
  ],
  lock: [
    { tag: 'rect', attrs: { x: 3, y: 11, width: 18, height: 11, rx: 2 } },
    { tag: 'path', attrs: { d: 'M7 11V7a5 5 0 0 1 10 0v4' } },
  ],
} as const satisfies Record<string, readonly IconPart[]>;

export type IconName = keyof typeof icons;
