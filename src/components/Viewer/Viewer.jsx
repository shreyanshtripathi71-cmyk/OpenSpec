import React, { Suspense } from 'react';
import { WINDOW_MODEL_PATHS } from '@/data/configuratorData';
import styles from './Viewer.module.css';

/* Lazy-load the Three.js viewer (700KB+ bundle) so it never blocks
   the configurator UI's first paint. */
const WindowViewer = React.lazy(() => import('@/components/WindowViewer'));

function ViewerSkeleton() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '100%', height: '100%', minHeight: 300,
      background: 'rgba(255, 255, 255, 0.15)', borderRadius: 16,
    }}>
      <div style={{ textAlign: 'center', opacity: 0.5 }}>
        <div style={{
          width: 40, height: 40, margin: '0 auto 12px',
          border: '3px solid rgba(15, 23, 42, 0.15)',
          borderTopColor: 'rgba(15, 23, 42, 0.5)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <div style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>Loading 3D viewer…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   CENTER VIEWER COLUMN
   ────────────────────────────────────────────────────────────
   Renders the 3D model card (live preview), cell chip switcher
   when the grid has more than one cell, and the bottom controls
   bar (zoom / rotate / reset / fullscreen + W / H / U / SHGC). */
export function Viewer({
  windowType,
  typeId,
  config,
  quickUpdate,
  isFullscreen,
  setIsFullscreen,
  viewerModelPath,
  viewerColour,
  interiorColorHex,
  controlsRef,
  selectedCell,
  energyRatings,
}) {
  const hasMultipleCells = config.grid.cells.length > 1;
  const cellHeight = selectedCell?.height ?? config.frameHeight;

  return (
    <section className={`${styles.viewerColumn} ${isFullscreen ? styles.viewerFull : ''}`}>
      <div className={styles.viewerCard}>
        {/* Top bar — live indicator + per-cell chips */}
        <div className={styles.viewerTopBar}>
          <span className={styles.glassPill}>
            <span className={styles.liveDot} />
            Live preview · {windowType.label}
          </span>
          {hasMultipleCells && (
            <div className={styles.cellChips}>
              {config.grid.cells.map((c) => {
                const rowCfg = config.grid.rowConfigs?.find((rc) => rc.row === c.row);
                const rowH   = rowCfg?.horizontalCount || config.grid.horizontalCount;
                const cellW  = Math.round((config.frameWidth / rowH) * 10) / 10;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`${styles.cellChip} ${c.id === config.selectedCellId ? styles.cellChipActive : ''}`}
                    onClick={() => quickUpdate({ selectedCellId: c.id })}
                  >
                    <span className={styles.cellChipId}>{c.id}</span>
                    <span className={styles.cellChipMeta}>{cellW}×{c.height}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3D canvas */}
        <div className={styles.viewerCanvasWrap}>
          <Suspense fallback={<ViewerSkeleton />}>
            <WindowViewer
              modelPath={viewerModelPath}
              typeId={selectedCell?.windowType || typeId}
              colour={viewerColour}
              interiorColorHex={interiorColorHex}
              controlsRef={controlsRef}
              dimensions={{ width: `${config.frameWidth}"`, height: `${cellHeight}"` }}
              grid={{
                rows: config.grid.verticalCount,
                cols: config.grid.horizontalCount,
                widthInches:  config.frameWidth,
                heightInches: config.frameHeight,
                rowColCounts: config.grid.rowConfigs?.map((rc) => rc.horizontalCount),
                cells: config.grid.cells.map((c) => ({
                  row: c.row, col: c.col,
                  modelPath: WINDOW_MODEL_PATHS[c.windowType] || windowType.modelPath,
                  cellType:  c.windowType,
                  grillPattern:    c.grillPattern,
                  grillBarType:    c.grillBarType,
                  grillBarSize:    c.grillBarSize,
                  grillColor:      c.grillColor,
                  grillVertical:   c.grillVertical,
                  grillHorizontal: c.grillHorizontal,
                })),
                selectedCellId: config.selectedCellId,
              }}
              defaultZoom={8.0}
            />
          </Suspense>
        </div>

        {/* Bottom bar — controls + stats */}
        <div className={styles.viewerBottomBar}>
          <div className={styles.vbBox}>
            <button className={styles.vbIcon} onClick={() => controlsRef.current?.zoomOut()} title="Zoom out" type="button">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 11l3 3M5 7h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <button className={styles.vbIcon} onClick={() => controlsRef.current?.zoomIn()} title="Zoom in" type="button">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 11l3 3M7 5v4M5 7h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <span className={styles.vbSep} />
            <button className={styles.vbIcon} onClick={() => controlsRef.current?.rotateLeft()} title="Rotate left" type="button">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className={styles.vbIcon} onClick={() => controlsRef.current?.rotateRight()} title="Rotate right" type="button">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className={styles.vbSep} />
            <button className={styles.vbIcon} onClick={() => controlsRef.current?.resetView()} title="Reset view" type="button">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 8a6 6 0 1 0 2-4.5L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M2 2v4h4"               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className={styles.vbIcon} onClick={() => setIsFullscreen((v) => !v)} title="Fullscreen" type="button">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className={styles.vbBox}>
            <ViewerStat label="W"    value={`${config.frameWidth}″`} />
            <span className={styles.vbSep} />
            <ViewerStat label="H"    value={`${config.frameHeight}″`} />
            <span className={styles.vbSep} />
            <ViewerStat label="U"    value={energyRatings?.uFactorIP ?? '0.27'} />
            <span className={styles.vbSep} />
            <ViewerStat label="SHGC" value={energyRatings?.shgc ?? '0.28'} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ViewerStat({ label, value }) {
  return (
    <div className={styles.vbStat}>
      <span className={styles.vbStatLabel}>{label}</span>
      <span className={styles.vbStatValue}>{value}</span>
    </div>
  );
}
