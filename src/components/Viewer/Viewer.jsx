import React, { Suspense, useState, useRef, useCallback, useMemo } from 'react';
import { WINDOW_MODEL_PATHS, FRAME_COLORS, GLAZING_TYPES, LOW_E_COATINGS, GAS_TYPES, BRICKMOULD_OPTIONS } from '@/data/configuratorData';
import styles from './Viewer.module.css';

const WindowViewer = React.lazy(() => import('@/components/WindowViewer'));

function ViewerSkeleton() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '100%', height: '100%', minHeight: 300,
    }}>
      <div style={{ textAlign: 'center', opacity: 0.5 }}>
        <div style={{
          width: 40, height: 40, margin: '0 auto 12px',
          border: '3px solid rgba(15, 23, 42, 0.15)',
          borderTopColor: 'rgba(15, 23, 42, 0.5)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <div style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>Loading 3D Viewer…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function buildPriceLines(config, selectedCell) {
  const lines = [];
  const areaSqFt = Math.max(1, (config.frameWidth * config.frameHeight) / 144);
  lines.push({ label: 'Base · Window', value: 280 + Math.round(areaSqFt * 22) });
  const extColor = FRAME_COLORS.find((c) => c.value === config.exteriorColor);
  if (extColor?.priceAddon) lines.push({ label: `Frame · ${extColor.label}`, value: extColor.priceAddon });
  const glazing = GLAZING_TYPES.find((g) => g.value === config.glazingType);
  if (glazing?.priceAddon) lines.push({ label: 'Glazing Upgrade', value: glazing.priceAddon });
  const loe1 = LOW_E_COATINGS.find((l) => l.value === config.lowECoating1);
  if (loe1?.priceAddon) lines.push({ label: `Low-E · ${loe1.label}`, value: loe1.priceAddon });
  const gas = GAS_TYPES.find((g) => g.value === config.gasType);
  if (gas?.priceAddon) lines.push({ label: `Gas · ${gas.label}`, value: gas.priceAddon });
  const bm = BRICKMOULD_OPTIONS.find((b) => b.value === config.brickmould);
  if (bm?.priceAddon) lines.push({ label: `Brickmould · ${bm.label}`, value: bm.priceAddon });
  if (selectedCell) {
    const cells = config.grid.cells.length || 1;
    if (cells > 1) lines.push({ label: `Multi-Pane (${cells} Cells)`, value: cells * 120 });
    if (selectedCell.grillPattern !== 'none') lines.push({ label: 'Grilles', value: 95 });
    if (selectedCell.egressHardware) lines.push({ label: 'Egress Hardware', value: 35 });
  }
  if (config.addFoam) lines.push({ label: 'Foam-Injected Profile', value: 28 });
  if (config.interiorJamb) lines.push({ label: 'Jamb Extension', value: 45 });
  if (config.interiorReturns) lines.push({ label: 'Interior Return', value: 35 });
  return lines;
}

const fmt = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── GPU-accelerated floating price panel ── */
function PriceSummaryPanel({ config, selectedCell, unitPrice, quoteTotal, lineCount, onClose }) {
  const panelRef = useRef(null);
  const posRef = useRef({ x: 14, y: 14 });
  const dragRef = useRef(null);

  const priceLines = useMemo(() => buildPriceLines(config, selectedCell), [config, selectedCell]);
  const itemTotal = priceLines.reduce((s, l) => s + l.value, 0);

  const onPointerDown = useCallback((e) => {
    if (e.target.closest('[data-no-drag]')) return;
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = { ox: e.clientX - rect.left, oy: e.clientY - rect.top };
    el.setPointerCapture(e.pointerId);
    el.style.transition = 'none';
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const el = panelRef.current;
    const stage = el?.closest('[data-viewer-stage]');
    if (!stage) return;
    const sr = stage.getBoundingClientRect();
    const x = Math.max(0, Math.min(sr.width - el.offsetWidth, e.clientX - sr.left - dragRef.current.ox));
    const y = Math.max(0, Math.min(sr.height - el.offsetHeight, e.clientY - sr.top - dragRef.current.oy));
    posRef.current = { x, y };
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    if (panelRef.current) panelRef.current.style.transition = '';
  }, []);

  return (
    <div
      ref={panelRef}
      className={styles.pricePanel}
      style={{ left: 0, top: 0, transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className={styles.pricePanelHeader}>
        <div className={styles.pricePanelTitle}>Price Summary</div>
        <div className={styles.pricePanelHeaderRight}>
          <span className={styles.pricePanelLive}><span className={styles.pricePanelLiveDot} />Live</span>
          <button data-no-drag className={styles.pricePanelClose} onClick={onClose} type="button" title="Close">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>
      <div className={styles.pricePanelBody} data-no-drag>
        <div className={styles.pricePanelSectionLabel}>Cost Breakdown</div>
        {priceLines.map((l, i) => (
          <div key={i} className={styles.pricePanelRow}>
            <span className={styles.pricePanelRowLabel}>{l.label}</span>
            <span className={styles.pricePanelRowValue}>+${l.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className={styles.pricePanelTotals} data-no-drag>
        <div className={styles.pricePanelTotalRow}><span>Unit Cost</span><span className={styles.pricePanelTotalVal}>{fmt(itemTotal)}</span></div>
        <div className={styles.pricePanelTotalRow}><span>Sell Price</span><span className={styles.pricePanelTotalVal} style={{ color: '#0F172A' }}>{fmt(unitPrice)}</span></div>
        <div className={styles.pricePanelDivider} />
        <div className={styles.pricePanelGrandRow}>
          <span>Quote Total <span style={{ opacity: 0.6, fontWeight: 400 }}>({lineCount} unit{lineCount !== 1 ? 's' : ''})</span></span>
          <span className={styles.pricePanelGrandVal}>{fmt(quoteTotal)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Notes panel — top-right on canvas ── */
function NotesPanel({ config, selectedCell, energyRatings, onClose }) {
  const notes = useMemo(() => {
    const n = [];
    const glazingLabel = GLAZING_TYPES.find(g => g.value === config.glazingType)?.label;
    if (glazingLabel) n.push(['GLAZING', glazingLabel]);

    const extLabel = FRAME_COLORS.find(c => c.value === config.exteriorColor)?.label;
    if (extLabel) n.push(['EXTERIOR', extLabel]);

    const intLabel = FRAME_COLORS.find(c => c.value === config.interiorColor)?.label;
    if (intLabel) n.push(['INTERIOR', intLabel]);

    if (selectedCell) {
      n.push(['CELL TYPE', selectedCell.windowType?.replace(/-/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Fixed']);
      if (selectedCell.lockType) n.push(['LOCKSET', selectedCell.lockType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())]);
      if (selectedCell.operatorType) n.push(['OPERATOR', selectedCell.operatorType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())]);
      if (selectedCell.grillPattern && selectedCell.grillPattern !== 'none') n.push(['GRILLE', selectedCell.grillPattern.replace(/\b\w/g, l => l.toUpperCase())]);
    }

    const loe = LOW_E_COATINGS.find(l => l.value === config.lowECoating1);
    if (loe && loe.value !== 'clear') n.push(['LOW-E', loe.label]);

    const gas = GAS_TYPES.find(g => g.value === config.gasType);
    if (gas) n.push(['GAS FILL', gas.label]);

    const bm = BRICKMOULD_OPTIONS.find(b => b.value === config.brickmould);
    if (bm && bm.value !== 'none') n.push(['BRICK MOULD', bm.label]);

    if (config.nailFin) n.push(['NAIL FIN', 'Yes — 1¼″ PVC Flange']);

    const u = energyRatings?.uFactorIP ?? '0.27';
    const shgc = energyRatings?.shgc ?? '0.28';
    n.push(['PERFORMANCE', `U ${u} · SHGC ${shgc}`]);

    return n;
  }, [config, selectedCell, energyRatings]);

  return (
    <div className={styles.notesPanel}>
      <div className={styles.notesPanelHeader}>
        <span>Specification Notes</span>
        <button className={styles.notesPanelClose} onClick={onClose} type="button" title="Close">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
      </div>
      <div className={styles.notesPanelBody}>
        {notes.map(([key, val], i) => (
          <div key={i} className={styles.notesPanelRow}>
            <span className={styles.notesPanelKey}>{key}</span>
            <span className={styles.notesPanelVal}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ────────────────────────────────────────────────────────────
   CENTER VIEWER COLUMN
   ──────────────────────────────────────────────────────────── */
export function Viewer({
  windowType, typeId, config, quickUpdate,
  isFullscreen, setIsFullscreen,
  viewerModelPath, viewerColour, interiorColorHex,
  controlsRef, selectedCell, energyRatings,
  unitPrice = 0, quoteTotal = 0, lineCount = 1,
}) {
  const hasMultipleCells = config.grid.cells.length > 1;
  const cellHeight = selectedCell?.height ?? config.frameHeight;
  const [showPrice, setShowPrice] = useState(false);
  const [viewSide, setViewSide] = useState('exterior');
  const [viewMode, setViewMode] = useState('3d');

  return (
    <section className={`${styles.viewerColumn} ${isFullscreen ? styles.viewerFull : ''}`} data-viewer-stage>
      <div className={styles.viewerCard}>

        {/* ═══ TOP BAR ═══ */}
        <div className={styles.viewerTopBar}>
          {/* LEFT: toggles */}
          <div className={styles.topBarGroup}>
            <div className={styles.segGroup}>
              <button type="button" className={`${styles.segBtn} ${viewSide === 'exterior' ? styles.segBtnActive : ''}`} onClick={() => setViewSide('exterior')}>Exterior</button>
              <button type="button" className={`${styles.segBtn} ${viewSide === 'interior' ? styles.segBtnActive : ''}`} onClick={() => setViewSide('interior')}>Interior</button>
              <button type="button" className={`${styles.segBtn} ${viewSide === 'split' ? styles.segBtnActive : ''}`} onClick={() => setViewSide('split')}>Split</button>
            </div>

            <div className={styles.segGroup}>
              <button type="button" className={`${styles.segBtn} ${viewMode === '2d' ? styles.segBtnActive : ''}`} onClick={() => setViewMode('2d')}>2D</button>
              <button type="button" className={`${styles.segBtn} ${viewMode === '3d' ? styles.segBtnActive : ''}`} onClick={() => setViewMode('3d')}>3D</button>
            </div>
          </div>

          {/* RIGHT: Price + Cell selector */}
          <div className={styles.topBarGroup}>
            <button type="button" className={`${styles.tbBtn} ${showPrice ? styles.tbBtnActive : ''}`} onClick={() => setShowPrice(v => !v)}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M8 3.5v9M10.5 5.5c0-1.1-1.1-2-2.5-2s-2.5.9-2.5 2 1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2-2.5-.9-2.5-2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
              Price
            </button>
            {hasMultipleCells && (
              <div className={styles.cellTabs}>
                <button
                  type="button"
                  className={`${styles.cellTab} ${(!config.selectedCellId || config.selectedCellId === 'all') ? styles.cellTabActive : ''}`}
                  onClick={() => quickUpdate({ selectedCellId: 'all' })}
                >
                  <strong>All</strong>
                </button>
                {config.grid.cells.map((c) => {
                  const rowCfg = config.grid.rowConfigs?.find((rc) => rc.row === c.row);
                  const rowH = rowCfg?.horizontalCount || config.grid.horizontalCount;
                  const cellW = Math.round((config.frameWidth / rowH) * 10) / 10;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`${styles.cellTab} ${c.id === config.selectedCellId ? styles.cellTabActive : ''}`}
                      onClick={() => quickUpdate({ selectedCellId: c.id })}
                    >
                      <strong>{c.id}</strong>
                      <span>{cellW}×{c.height}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ═══ 3D CANVAS ═══ */}
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
                rows: config.grid.verticalCount, cols: config.grid.horizontalCount,
                widthInches: config.frameWidth, heightInches: config.frameHeight,
                rowColCounts: config.grid.rowConfigs?.map((rc) => rc.horizontalCount),
                cells: config.grid.cells.map((c) => ({
                  row: c.row, col: c.col,
                  modelPath: WINDOW_MODEL_PATHS[c.windowType] || windowType.modelPath,
                  cellType: c.windowType,
                  grillPattern: c.grillPattern, grillBarType: c.grillBarType,
                  grillBarSize: c.grillBarSize, grillColor: c.grillColor,
                  grillVertical: c.grillVertical, grillHorizontal: c.grillHorizontal,
                })),
                selectedCellId: config.selectedCellId,
              }}
              defaultZoom={8.0}
            />
          </Suspense>

          {showPrice && (
            <PriceSummaryPanel
              config={config} selectedCell={selectedCell}
              unitPrice={unitPrice} quoteTotal={quoteTotal} lineCount={lineCount}
              onClose={() => setShowPrice(false)}
            />
          )}
        </div>

        {/* ═══ BOTTOM BAR: dims (left) | controls (right) ═══ */}
        <div className={styles.viewerBottomBar}>
          {/* Left — dimensions & ratings */}
          <div className={styles.vbBox}>
            <ViewerStat label="W" value={`${config.frameWidth}″`} />
            <span className={styles.vbSep} />
            <ViewerStat label="H" value={`${config.frameHeight}″`} />
            <span className={styles.vbSep} />
            <ViewerStat label="U" value={energyRatings?.uFactorIP ?? '0.27'} />
            <span className={styles.vbSep} />
            <ViewerStat label="SHGC" value={energyRatings?.shgc ?? '0.28'} />
          </div>

          {/* Right — controls */}
          <div className={styles.vbBox}>
            <button className={styles.vbIcon} onClick={() => controlsRef.current?.zoomOut()} title="Zoom Out" type="button">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 11l3 3M5 7h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            <button className={styles.vbIcon} onClick={() => controlsRef.current?.zoomIn()} title="Zoom In" type="button">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 11l3 3M7 5v4M5 7h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            <span className={styles.vbSep} />
            <button className={styles.vbIcon} onClick={() => controlsRef.current?.rotateLeft()} title="Rotate Left" type="button">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className={styles.vbIcon} onClick={() => controlsRef.current?.rotateRight()} title="Rotate Right" type="button">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span className={styles.vbSep} />
            <button className={styles.vbIcon} onClick={() => controlsRef.current?.resetView()} title="Reset View" type="button">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 1 0 2-4.5L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M2 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className={styles.vbIcon} onClick={() => setIsFullscreen((v) => !v)} title="Fullscreen" type="button">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
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
