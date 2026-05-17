import { useState, useCallback } from 'react';
import { Field, Group, DetailsBox, Select, Stepper, GridIcon, layoutStyles } from '../ui';
import { MEASUREMENT_TYPES, BRICKMOULD_CATALOG } from '@/data/configuratorData';
import styles from './LayoutTab.module.css';

/* Inspector → tab 1. Opening size, row count, per-row breakdown.
   Owns no state — all changes call back to the page for setState. */
export function LayoutTab({
  config,
  maxVertical,
  maxHorizontal,
  minHorizontal,
  onChangeVertical,
  onChangeRowHorizontal,
  onSelectCell,
  onChangeWidth,
  onChangeHeight,
  onChangeRowHeight,
  onChangeMeasurementType,
}) {
  // Local UI state for toggles (matching legacy state.dimUnit / state.sizeMode)
  const [dimUnit, setDimUnit] = useState('in');
  const [sizeMode, setSizeMode] = useState('frame');

  // Compute brickmould width offset per side (inches)
  const bmEntry = BRICKMOULD_CATALOG.find((b) => b.value === config.brickmould) || BRICKMOULD_CATALOG[0];
  const bmW = bmEntry.width || 0;

  // Frame outside dim
  const wFrame = config.frameWidth;
  const hFrame = config.frameHeight;

  // Brickmold outside dim = frame + 2× bmW on each axis
  const wBM = wFrame + bmW * 2;
  const hBM = hFrame + bmW * 2;

  // Active dim depending on size mode
  const wIn = sizeMode === 'brickmold' ? wBM : wFrame;
  const hIn = sizeMode === 'brickmold' ? hBM : hFrame;
  const wMm = Math.round(wIn * 25.4);
  const hMm = Math.round(hIn * 25.4);
  const wDisp = dimUnit === 'in' ? wIn : wMm;
  const hDisp = dimUnit === 'in' ? hIn : hMm;
  const suffix = dimUnit === 'in' ? 'in' : 'mm';
  const modeLabel = sizeMode === 'brickmold' ? 'Brickmold' : 'Frame';

  // Reference lines
  const frameRef = `${wFrame}″ × ${hFrame}″`;
  const bmRef = bmW > 0 ? `${wBM}″ × ${hBM}″` : '(no brickmold)';

  // Handle typed dimension input
  const handleDimInput = useCallback((axis, rawValue) => {
    let val = parseFloat(rawValue);
    if (isNaN(val) || val <= 0) return;
    // Convert back from display unit to inches
    if (dimUnit === 'mm') val = val / 25.4;
    // Subtract brickmold offset if in brickmold mode
    if (sizeMode === 'brickmold' && bmW > 0) val = val - bmW * 2;
    // Clamp
    val = Math.max(10, Math.min(120, val));
    if (axis === 'w') onChangeWidth(Math.round(val * 1000) / 1000);
    else onChangeHeight(Math.round(val * 1000) / 1000);
  }, [dimUnit, sizeMode, bmW, onChangeWidth, onChangeHeight]);

  return (
    <>
      <DetailsBox title="Dimensions" pinned defaultOpen>
        {/* ── Segmented toggles: Frame Size / Brickmold Size + in / mm ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {/* Size mode toggle */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 2, padding: 2, gap: 2, flex: 1, minWidth: 0 }}>
            <button
              type="button"
              onClick={() => setSizeMode('frame')}
              style={{
                padding: '5px 10px', fontSize: 10, border: 'none', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                ...(sizeMode === 'frame'
                  ? { background: '#2e5bc8', color: '#fff' }
                  : { background: 'transparent', color: '#64748B' }),
              }}
            >Frame Size</button>
            <button
              type="button"
              onClick={() => setSizeMode('brickmold')}
              style={{
                padding: '5px 10px', fontSize: 10, border: 'none', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                ...(sizeMode === 'brickmold'
                  ? { background: '#2e5bc8', color: '#fff' }
                  : { background: 'transparent', color: '#64748B' }),
              }}
            >Brickmold Size</button>
          </div>
          {/* Unit toggle */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 2, padding: 2, gap: 2 }}>
            <button
              type="button"
              onClick={() => setDimUnit('in')}
              style={{
                padding: '5px 10px', fontSize: 10, border: 'none', borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                ...(dimUnit === 'in'
                  ? { background: '#2e5bc8', color: '#fff' }
                  : { background: 'transparent', color: '#64748B' }),
              }}
            >in</button>
            <button
              type="button"
              onClick={() => setDimUnit('mm')}
              style={{
                padding: '5px 10px', fontSize: 10, border: 'none', borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                ...(dimUnit === 'mm'
                  ? { background: '#2e5bc8', color: '#fff' }
                  : { background: 'transparent', color: '#64748B' }),
              }}
            >mm</button>
          </div>
        </div>

        {/* ── Window Size label ── */}
        <div style={{ fontSize: 10, color: '#64748B', marginBottom: 6 }}>
          <strong style={{ color: '#0F172A' }}>Window Size</strong> · {modeLabel} Size
          {sizeMode === 'brickmold' && bmW > 0 ? ` (frame + ${bmW}″ brickmold each side)` : ''}
        </div>

        {/* ── Width / Height inputs — plain text with suffix (matches legacy .input.mono) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Width</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={wDisp}
                onChange={(e) => handleDimInput('w', e.target.value)}
                onBlur={(e) => handleDimInput('w', e.target.value)}
                style={{
                  width: '100%', padding: '7px 32px 7px 10px', fontSize: 13,
                  border: '1px solid #CBD5E1', borderRadius: 2, fontFamily: "'IBM Plex Mono', 'SF Mono', Menlo, monospace",
                  background: '#fff', color: '#0F172A', fontVariantNumeric: 'tabular-nums',
                }}
              />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#94A3B8' }}>{suffix}</span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Height</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={hDisp}
                onChange={(e) => handleDimInput('h', e.target.value)}
                onBlur={(e) => handleDimInput('h', e.target.value)}
                style={{
                  width: '100%', padding: '7px 32px 7px 10px', fontSize: 13,
                  border: '1px solid #CBD5E1', borderRadius: 2, fontFamily: "'IBM Plex Mono', 'SF Mono', Menlo, monospace",
                  background: '#fff', color: '#0F172A', fontVariantNumeric: 'tabular-nums',
                }}
              />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#94A3B8' }}>{suffix}</span>
            </div>
          </div>
        </div>

        {/* ── Frame / Brickmold reference (monospace) ── */}
        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 8, fontFamily: "'IBM Plex Mono', 'SF Mono', Menlo, monospace", lineHeight: 1.6 }}>
          <span style={{ display: 'flex', justifyContent: 'space-between' }}><span>Frame:</span><span>{frameRef}</span></span>
          <span style={{ display: 'flex', justifyContent: 'space-between' }}><span>Brickmold:</span><span>{bmRef}</span></span>
        </div>
      </DetailsBox>

      <DetailsBox title="Layout" chip={`${config.grid.horizontalCount} × ${config.grid.verticalCount}`} defaultOpen>
        <div className={styles.layoutPreview}>
          <span className={styles.layoutPreviewIcon}>
            <GridIcon rows={config.grid.verticalCount} cols={config.grid.horizontalCount} size={28} />
          </span>
          <div className={styles.layoutPreviewBody}>
            <span className={styles.layoutPreviewTitle}>
              {config.grid.horizontalCount} wide × {config.grid.verticalCount} high · {config.grid.cells.length} cell{config.grid.cells.length === 1 ? '' : 's'}
            </span>
            <span className={styles.layoutPreviewMeta}>
              {config.frameWidth}″ × {config.frameHeight}″ opening
            </span>
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 8, lineHeight: 1.4 }}>
          Configure how many windows are stacked vertically and placed side-by-side in your opening.
        </div>
      </DetailsBox>

      <DetailsBox title="Number of Vertical Windows" chip={`${config.grid.verticalCount}`} defaultOpen>
        <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 8, lineHeight: 1.4 }}>How many windows are stacked on top of each other — e.g. a transom above an operable casement.</div>
        <div className={styles.gridChoices}>
          {Array.from({ length: Math.max(1, maxVertical) }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`${styles.gridChoice} ${config.grid.verticalCount === n ? styles.gridChoiceActive : ''}`}
              onClick={() => onChangeVertical(n)}
              type="button"
            >
              <span className={styles.gridChoiceIcon}>
                <GridIcon rows={n} cols={1} size={32} />
              </span>
              <span className={styles.gridChoiceLabel}>{n} high</span>
            </button>
          ))}
        </div>
      </DetailsBox>

      <DetailsBox title="Number of Horizontal Windows" chip={`${config.grid.horizontalCount}`} defaultOpen>
        <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 8, lineHeight: 1.4 }}>
          {config.grid.verticalCount > 1
            ? 'Set the number of windows placed side-by-side in each row, and adjust individual row heights.'
            : 'How many windows sit side-by-side within the opening.'}
        </div>
        <div className={styles.layoutRows}>
          {Array.from({ length: config.grid.verticalCount }, (_, r) => {
            const rowCfg = config.grid.rowConfigs?.find((rc) => rc.row === r);
            const rowH = rowCfg?.horizontalCount || config.grid.horizontalCount;
            const rowCells = config.grid.cells.filter((c) => c.row === r);
            const cellH = rowCells[0]?.height || Math.round((config.frameHeight / config.grid.verticalCount) * 10) / 10;
            // r=0 renders at the TOP, r=verticalCount-1 at the BOTTOM (where
            // the operable casement lives). The bottom row enforces type-
            // specific minimums; upper rows can always go down to 1 column.
            const isBottomRow = r === config.grid.verticalCount - 1;
            const isTopRow = r === 0 && config.grid.verticalCount > 1;
            const rowMinHorizontal = isBottomRow ? minHorizontal : 1;
            const colChoices = Array.from({ length: Math.max(1, maxHorizontal) }, (_, i) => i + 1).filter((n) => n >= rowMinHorizontal);
            const isLocked = isBottomRow && colChoices.length === 1;
            const rowPositionLabel = config.grid.verticalCount === 1
              ? 'Layout'
              : isTopRow ? 'Top row' : isBottomRow ? 'Bottom row' : `Row ${r + 1}`;

            return (
              <div key={r} className={styles.rowCard}>
                <div className={styles.rowCardHead}>
                  <span className={styles.rowCardTitle}>
                    <span className={styles.rowCardTitleBadge}>R{r + 1}</span>
                    {rowPositionLabel}
                  </span>
                  <Stepper
                    value={cellH}
                    onChange={(v) => onChangeRowHeight(r, v)}
                    min={6}
                    max={120}
                    step={0.125}
                    unit="in"
                    decimals={3}
                    compact
                  />
                </div>

                <div className={styles.rowCardSubsection}>
                  <div className={styles.rowCardSubsectionHead}>
                    <span className={styles.rowCardSubsectionLabel}>Wide</span>
                  </div>
                  <div className={styles.rowCardChoices}>
                    {colChoices.map((n) => (
                      <button
                        key={n}
                        className={`${styles.rowCardChoice} ${rowH === n ? styles.rowCardChoiceActive : ''} ${isLocked ? styles.rowCardChoiceLocked : ''}`}
                        onClick={() => onChangeRowHorizontal(r, n)}
                        type="button"
                        disabled={isLocked}
                      >
                        <GridIcon rows={1} cols={n} size={26} />
                        <span className={styles.rowCardChoiceLabel}>{n} wide</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.rowCardSubsection}>
                  <span className={styles.rowCardSubsectionLabel}>Cells</span>
                  <div
                    className={styles.rowCardCells}
                    style={{ gridTemplateColumns: `repeat(${Math.min(rowH, 3)}, minmax(0, 1fr))` }}
                  >
                    {rowCells.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`${styles.rowCardCellBtn} ${c.id === config.selectedCellId ? styles.rowCardCellBtnActive : ''}`}
                        onClick={() => onSelectCell(c.id)}
                      >
                        <span className={styles.rowCardCellBtnId}>{c.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DetailsBox>
    </>
  );
}
