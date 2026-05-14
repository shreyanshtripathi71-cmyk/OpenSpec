/* ────────────────────────────────────────────────────────────
   ICON SET
   ────────────────────────────────────────────────────────────
   Hand-rolled inline SVGs so the configurator has zero icon-
   library dependency. Only the 11 glyphs the JSX actually uses
   are defined; an unknown name renders nothing. */
export function Icon({ name, size = 16, strokeWidth = 1.7 }) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'chevron-down': return <svg {...props}><path d="M6 9l6 6 6-6"/></svg>;
    case 'arrow-right':  return <svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'plus':         return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'minus':        return <svg {...props}><path d="M5 12h14"/></svg>;
    case 'check':        return <svg {...props}><path d="M20 6L9 17l-5-5"/></svg>;
    case 'share':        return <svg {...props}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>;
    case 'help':         return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 015.8 1c0 2-3 2.5-3 4.5"/><circle cx="12" cy="17.5" r="0.6" fill="currentColor"/></svg>;
    case 'inbox':        return <svg {...props}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>;
    case 'bell':         return <svg {...props}><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/></svg>;
    case 'save':         return <svg {...props}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>;
    case 'briefcase':    return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>;
    default:             return null;
  }
}

/* ── Grid composition mini-icon (e.g. "2 rows × 3 cols") ── */
export function GridIcon({ rows, cols, size = 32 }) {
  const pad = 3;
  const inner = size - pad * 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x={pad} y={pad} width={inner} height={inner} rx={2} />
      {Array.from({ length: rows - 1 }, (_, i) => (
        <line key={`r${i}`} x1={pad} y1={pad + (inner / rows) * (i + 1)} x2={pad + inner} y2={pad + (inner / rows) * (i + 1)} />
      ))}
      {Array.from({ length: cols - 1 }, (_, i) => (
        <line key={`c${i}`} x1={pad + (inner / cols) * (i + 1)} y1={pad} x2={pad + (inner / cols) * (i + 1)} y2={pad + inner} />
      ))}
    </svg>
  );
}

/* ── Grille-pattern preview (colonial / prairie / ladder / diamond) ── */
export function GrillPatternIcon({ pattern, size = 30 }) {
  const p = 4;
  const w = size - 2 * p;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.2}>
      <rect x={p} y={p} width={w} height={w} rx={2} strokeWidth={1.4} />
      {pattern === 'colonial' && (<>
        <line x1={p + w / 3}   y1={p} x2={p + w / 3}   y2={p + w} />
        <line x1={p + 2*w/3}   y1={p} x2={p + 2*w/3}   y2={p + w} />
        <line x1={p} y1={p + w / 3}   x2={p + w} y2={p + w / 3} />
        <line x1={p} y1={p + 2*w/3}   x2={p + w} y2={p + 2*w/3} />
      </>)}
      {pattern === 'prairie' && (<>
        <line x1={p + w*0.25} y1={p} x2={p + w*0.25} y2={p + w} />
        <line x1={p + w*0.75} y1={p} x2={p + w*0.75} y2={p + w} />
        <line x1={p} y1={p + w*0.25} x2={p + w} y2={p + w*0.25} />
        <line x1={p} y1={p + w*0.75} x2={p + w} y2={p + w*0.75} />
      </>)}
      {pattern === 'ladder' && (<>
        <line x1={p} y1={p + w*0.25} x2={p + w} y2={p + w*0.25} />
        <line x1={p} y1={p + w*0.50} x2={p + w} y2={p + w*0.50} />
        <line x1={p} y1={p + w*0.75} x2={p + w} y2={p + w*0.75} />
      </>)}
      {pattern === 'diamond' && (<>
        <line x1={p + w / 2} y1={p}       x2={p + w}     y2={p + w / 2} />
        <line x1={p + w}     y1={p + w/2} x2={p + w / 2} y2={p + w} />
        <line x1={p + w / 2} y1={p + w}   x2={p}         y2={p + w / 2} />
        <line x1={p}         y1={p + w/2} x2={p + w / 2} y2={p} />
      </>)}
    </svg>
  );
}

/* ── Grille-bar profile preview (flat / georgian / pencil / sdl) ── */
export function GrillBarTypeIcon({ barType, size = 30 }) {
  const c = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.2}>
      <rect x={4} y={4} width={size - 8} height={size - 8} rx={2} />
      {barType === 'flat'     && (<><line x1={4} y1={c} x2={size-4} y2={c} strokeWidth={2}/><line x1={c} y1={4} x2={c} y2={size-4} strokeWidth={2}/></>)}
      {barType === 'georgian' && (<><rect x={4} y={c-2} width={size-8} height={4} fill="currentColor" opacity={0.25}/><rect x={c-2} y={4} width={4} height={size-8} fill="currentColor" opacity={0.25}/></>)}
      {barType === 'pencil'   && (<><line x1={4} y1={c} x2={size-4} y2={c} strokeLinecap="round"/><line x1={c} y1={4} x2={c} y2={size-4} strokeLinecap="round"/><circle cx={c} cy={c} r={1.6} fill="currentColor" opacity={0.4}/></>)}
      {barType === 'sdl'      && (<><line x1={4} y1={c-1} x2={size-4} y2={c-1}/><line x1={4} y1={c+1} x2={size-4} y2={c+1} strokeDasharray="2 2"/><line x1={c-1} y1={4} x2={c-1} y2={size-4}/><line x1={c+1} y1={4} x2={c+1} y2={size-4} strokeDasharray="2 2"/></>)}
    </svg>
  );
}
