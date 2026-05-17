import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { WINDOW_TYPES } from '@/data/windows';
import {
  createDefaultConfig,
  buildGridCells,
  buildDefaultRowConfigs,
  getMaxVertical,
  getMaxHorizontal,
  getMinHorizontal,
  rebuildRowCells,
  FRAME_COLORS,
  BRICKMOULD_OPTIONS,
  NAILING_FIN_OPTIONS,
  CUT_FOR_SIDING_OPTIONS,
  GLAZING_TYPES,
  GLASS_THICKNESS_OPTIONS,
  LOW_E_COATINGS,
  GAS_TYPES,
  SPACER_TYPES,
  SPACER_COLOR_OPTIONS,
  TINT_OPTIONS,
  FROSTED_GLASS_OPTIONS,
  SECURITY_GLASS_OPTIONS,
  SCREEN_MESH_OPTIONS,
  SASH_LIMITER_OPTIONS,
  TEMPERED_GLASS_OPTIONS,
  HARDWARE_COLORS,
  OPENING_DIRECTIONS,
  SCREEN_TYPES,
  GRILL_BAR_SIZES,
  GRILL_COLORS,
  WINDOW_CONSTRAINTS,
  WINDOW_MODEL_PATHS,
  getWindowTypeOptions,
  computeEnergyRatings,
  HARDWARE_FINISHES,
  WINDOW_LOCK_STYLES,
  HUNG_BALANCES,
  WINDOW_OPERATORS,
  HARDWARE_TYPE_CASEMENT,
  HARDWARE_TYPE_SLIDER,
  NIGHTLATCH_OPTIONS,
  INTERIOR_RETURN_OPTIONS,
  JAMB_DEPTH_OPTIONS,
  BRICKMOULD_CATALOG,
  WINDOW_SCREEN_OPTIONS,
  TILT_FEATURE_OPTIONS,
  GLASS_DESIGN_OPTIONS,
} from '@/data/configuratorData';

import { Wizard }                 from './components/Wizard/Wizard';
import { OsNav }                  from './components/OsNav/OsNav';
import { Breadcrumb }             from './components/Breadcrumb/Breadcrumb';
import { ProjectTree }            from './components/ProjectTree/ProjectTree';
import { Viewer }                 from './components/Viewer/Viewer';
import {
  Inspector, EnergyCard, SECTION_CONFIG, inspectorStyles,
}                                 from './components/Inspector/Inspector';
import { LayoutTab }              from './components/Inspector/LayoutTab';
import { GrillesTab }             from './components/Inspector/GrillesTab';
import { Footer }                 from './components/Footer/Footer';
import { Toast, UpdatingOverlay } from './components/Toast/Toast';
import {
  Field, Group, DetailsBox, Select, Swatches, Toggle, layoutStyles,
} from './components/ui';

import styles from './ConfiguratorPage.module.css';

const FRAME_COLOR_SWATCHES = [
  { value: 'white',    label: 'Classic White',      hex: '#FAFAFA' },
  { value: 'almond',   label: 'Almond',             hex: '#E8DFC8' },
  { value: 'brick',    label: 'Brick Red',           hex: '#A0392B' },
  { value: 'sage',     label: 'Heritage Sage',       hex: '#7A8467' },
  { value: 'bronze',   label: 'Bronze',              hex: '#5C4A3A' },
  { value: 'charcoal', label: 'Charcoal Grey',       hex: '#3A3F45' },
  { value: 'black',    label: 'Architectural Black', hex: '#1F1F1F' },
];

const DEFAULT_ROOMS = ['Front entrance', 'Main floor', 'Master suite', 'Basement'];

function optionPrice(options, value) {
  return options.find((item) => item.value === value)?.priceAddon || 0;
}

function calculateUnitCost(config) {
  const cells = config.grid.cells.length || 1;
  const areaSqFt = Math.max(1, (config.frameWidth * config.frameHeight) / 144);
  const base = 280 + areaSqFt * 22 + cells * 120;
  const cellOptions = config.grid.cells.reduce((sum, cell) => (
    sum
    + optionPrice(HARDWARE_COLORS, cell.hardwareColor)
    + optionPrice(SCREEN_TYPES, cell.screenType)
    + (cell.egressHardware ? 35 : 0)
    + (cell.grillPattern !== 'none' ? 95 : 0)
    + optionPrice(GRILL_BAR_SIZES, cell.grillBarSize)
    + optionPrice(GRILL_COLORS, cell.grillColor)
  ), 0);

  return Math.round(
    base
    + optionPrice(FRAME_COLORS, config.exteriorColor)
    + optionPrice(FRAME_COLORS, config.interiorColor)
    + optionPrice(BRICKMOULD_OPTIONS, config.brickmould)
    + optionPrice(NAILING_FIN_OPTIONS, config.nailingFin)
    + optionPrice(GLAZING_TYPES, config.glazingType)
    + optionPrice(GLASS_THICKNESS_OPTIONS, config.glassThickness)
    + optionPrice(LOW_E_COATINGS, config.lowECoating1)
    + optionPrice(LOW_E_COATINGS, config.lowECoating2)
    + optionPrice(GAS_TYPES, config.gasType)
    + optionPrice(SPACER_TYPES, config.spacerType)
    + optionPrice(TINT_OPTIONS, config.tintFrosting)
    + optionPrice(SECURITY_GLASS_OPTIONS, config.securityGlassExterior)
    + optionPrice(SECURITY_GLASS_OPTIONS, config.securityGlassInterior)
    + (config.addFoam ? 28 : 0)
    + (config.interiorJamb ? 45 : 0)
    + (config.interiorReturns ? 35 : 0)
    + cellOptions,
  );
}

function makeUnit({ id, config, zone = 'Main floor', margin = 25, name = 'Casement' }) {
  return { id, zone, margin, name, family: 'window', config };
}

function unitCost(unit) {
  return calculateUnitCost(unit.config);
}

function unitPrice(unit) {
  return Math.round(unitCost(unit) * (1 + (unit.margin ?? 25) / 100));
}

/* ════════════════════════════════════════════════════════════
   CONFIGURATOR PAGE — top-level orchestrator
   ════════════════════════════════════════════════════════════
   Owns the configurator state (config, active tab, fullscreen,
   etc.), the keyboard shortcut handler, the column splitter drag
   logic, and composes every child component below. */
export default function ConfiguratorPage() {
  const { quoteId } = useParams();
  const [searchParams] = useSearchParams();

  // Read optional URL params from the sales picker (e.g. ?type=casement&w=30&h=60)
  const urlType = searchParams.get('type') || 'casement';
  const urlW    = parseFloat(searchParams.get('w')) || 0;
  const urlH    = parseFloat(searchParams.get('h')) || 0;

  const typeId     = urlType;
  const windowType = WINDOW_TYPES.find((w) => w.id === typeId);

  /* ─── Page state ─── */
  const [config, setConfig]               = useState(() => {
    const cfg = createDefaultConfig(typeId);
    if (urlW > 0 && urlH > 0) {
      // Skip the wizard entirely — dimensions already provided from the sales picker
      cfg.frameWidth = urlW;
      cfg.frameHeight = urlH;
      cfg.wizardStep = 'done';
      cfg.grid = {
        verticalCount: 1,
        horizontalCount: 1,
        rowConfigs: buildDefaultRowConfigs(1, 1),
        cells: buildGridCells(buildDefaultRowConfigs(1, 1), typeId, urlH),
      };
    }
    return cfg;
  });
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [isUpdating, setIsUpdating]       = useState(false);
  const [activeStep, setActiveStep]       = useState('layout');
  const [toast, setToast]                 = useState(null);
  const [lastSavedAt, setLastSavedAt]     = useState(null);
  const [treePinned, setTreePinned]       = useState(false);
  const [inspectorWidth, setInspectorWidth] = useState(480);
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [activeUnitId, setActiveUnitId] = useState('1');
  const [quoteUnits, setQuoteUnits] = useState(() => [
    makeUnit({ id: '1', zone: 'Main floor', config: createDefaultConfig(typeId), name: windowType?.label || 'Casement' }),
  ]);

  const activeUnit = quoteUnits.find((unit) => unit.id === activeUnitId) || quoteUnits[0];

  /* `lines` is the dealer's quote cart. It mirrors the prototype's unit list:
     each configured unit carries its own snapshot, margin, cost, and sell price. */
  const lines = quoteUnits.map((unit) => ({
    ...unit,
    cost: unitCost(unit),
    lineTotal: unitPrice(unit),
  }));

  /* Inspector / viewer splitter — drag the column divider to resize. */
  const isDraggingSplitterRef = useRef(false);
  const splitterStartXRef     = useRef(0);
  const splitterStartWidthRef = useRef(480);
  useEffect(() => {
    const onMove = (e) => {
      if (!isDraggingSplitterRef.current) return;
      const delta = splitterStartXRef.current - e.clientX;
      setInspectorWidth(Math.max(360, Math.min(720, splitterStartWidthRef.current + delta)));
    };
    const onUp = () => {
      if (!isDraggingSplitterRef.current) return;
      isDraggingSplitterRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const controlsRef = useRef(null);
  const quoteNumber = quoteId || 'Q-08421';

  useEffect(() => {
    setQuoteUnits((prev) => prev.map((unit) =>
      unit.id === activeUnitId
        ? {
            ...unit,
            config,
          }
        : unit,
    ));
  }, [activeUnitId, config]);

  /* ─── Derived values ─── */
  const FRAME_HEX_BY_VALUE = useMemo(
    () => Object.fromEntries(FRAME_COLOR_SWATCHES.map((s) => [s.value, s.hex])),
    [],
  );

  const viewerColour = useMemo(() => {
    const swatch = FRAME_COLOR_SWATCHES.find((s) => s.value === config.exteriorColor);
    if (swatch) return { name: swatch.label, hex: swatch.hex };
    return { name: 'White', hex: '#D2D2D0' };
  }, [config.exteriorColor]);

  const interiorColorHex = useMemo(
    () => FRAME_HEX_BY_VALUE[config.interiorColor] || '#DCDCDC',
    [config.interiorColor, FRAME_HEX_BY_VALUE],
  );

  const selectedCell = useMemo(
    () => config.grid.cells.find((c) => c.id === config.selectedCellId) || config.grid.cells[0],
    [config.grid.cells, config.selectedCellId],
  );

  const energyRatings = useMemo(() => {
    if (!selectedCell) return null;
    return computeEnergyRatings(config, selectedCell);
  }, [config, selectedCell]);

  const constraints = useMemo(() => {
    if (!selectedCell) return null;
    return WINDOW_CONSTRAINTS[selectedCell.windowType] || WINDOW_CONSTRAINTS.awning;
  }, [selectedCell]);

  const viewerModelPath = useMemo(() => {
    if (!selectedCell) return windowType?.modelPath || '';
    return WINDOW_MODEL_PATHS[selectedCell.windowType] || windowType?.modelPath || '';
  }, [selectedCell, windowType]);

  /* Soft dot on inspector tabs that have non-default content. */
  const tabHasCustomization = useMemo(() => {
    const cell = selectedCell;
    return {
      'layout':        config.grid.verticalCount > 1 || config.grid.horizontalCount > 1,
      'exterior':      config.exteriorColor !== 'white' || config.brickmould !== 'none' || config.nailFin || config.addFoam || (config.glassDesign && config.glassDesign !== 'clear'),
      'interior':      config.interiorColor !== 'white' || config.jambDepth !== 'none' || (config.interiorReturn && config.interiorReturn !== 'drywall') || config.hardwareFinish !== 'satin-nickel' || (cell ? (cell.egressHardware || cell.hardwareColor !== 'white') : false),
      'glass-options': config.glazingType === 'triple-pane' || config.lowECoating1 !== 'low-e1' || config.lowECoating2 !== 'low-e1' || config.gasType !== 'argon' || config.spacerType !== 'warm-edge',
      'glass-design':  config.tintFrosting !== 'none' || config.securityGlass !== 'none' || (cell ? (cell.grillPattern !== 'none' || cell.specialGlazing !== 'default') : false),
    };
  }, [config, selectedCell]);

  /* Quote totals — derived from the live quote unit list. */
  const quoteSubtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const quoteCost     = lines.reduce((s, l) => s + l.cost, 0);
  const quoteTax      = quoteSubtotal * 0.08;

  /* ─── Mutation helpers ─── */
  const quickUpdate = useCallback((updates) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateConfig = useCallback((updates) => {
    setIsUpdating(true);
    setTimeout(() => {
      setConfig((prev) => ({ ...prev, ...updates }));
      setIsUpdating(false);
    }, 280);
  }, []);

  const quickUpdateCell = useCallback((cellId, updates) => {
    setConfig((prev) => ({
      ...prev,
      grid: { ...prev.grid, cells: prev.grid.cells.map((c) => c.id === cellId ? { ...c, ...updates } : c) },
    }));
  }, []);

  const updateCell = useCallback((cellId, updates) => {
    setIsUpdating(true);
    setTimeout(() => {
      setConfig((prev) => ({
        ...prev,
        grid: { ...prev.grid, cells: prev.grid.cells.map((c) => c.id === cellId ? { ...c, ...updates } : c) },
      }));
      setIsUpdating(false);
    }, 280);
  }, []);

  /* ─── Wizard handlers ─── */
  const handleDimensionsSubmit = useCallback(() => {
    if (config.frameWidth > 0 && config.frameHeight > 0) {
      quickUpdate({ wizardStep: 'vertical' });
    }
  }, [config.frameWidth, config.frameHeight, quickUpdate]);

  const handleVerticalSelect = useCallback((count) => {
    setConfig((prev) => ({ ...prev, grid: { ...prev.grid, verticalCount: count }, wizardStep: 'horizontal' }));
  }, []);

  const handleHorizontalSelect = useCallback((count) => {
    setConfig((prev) => {
      const rowConfigs = buildDefaultRowConfigs(prev.grid.verticalCount, count);
      const cells      = buildGridCells(prev.grid.verticalCount, count, prev.frameHeight, typeId, rowConfigs);
      return {
        ...prev,
        grid: { verticalCount: prev.grid.verticalCount, horizontalCount: count, rowConfigs, cells },
        selectedCellId: 'W1.1',
        wizardStep:     'done',
      };
    });
  }, [typeId]);

  /* Changing the row count from inside the configurator: keep existing
     per-row column counts so a 2×3 grid stays 2×3 when a row is added;
     only NEW rows inherit the base count. */
  const handleVerticalChange = useCallback((count) => {
    setConfig((prev) => {
      const baseHCount = prev.grid.horizontalCount || 1;
      const rowConfigs = [];
      for (let r = 0; r < count; r++) {
        const existing = prev.grid.rowConfigs.find((rc) => rc.row === r);
        rowConfigs.push({ row: r, horizontalCount: existing ? existing.horizontalCount : baseHCount });
      }
      const cells = buildGridCells(count, baseHCount, prev.frameHeight, typeId, rowConfigs);
      return { ...prev, grid: { verticalCount: count, horizontalCount: baseHCount, rowConfigs, cells }, selectedCellId: 'W1.1' };
    });
  }, [typeId]);

  const handleRowHorizontalChange = useCallback((row, newHCount) => {
    setConfig((prev) => {
      const newRowConfigs = prev.grid.rowConfigs.map((rc) =>
        rc.row === row ? { ...rc, horizontalCount: newHCount } : rc,
      );
      const newCells = rebuildRowCells(prev.grid.cells, row, newHCount, prev.frameHeight, prev.grid.verticalCount, typeId);
      const maxH = Math.max(...newRowConfigs.map((rc) => rc.horizontalCount));
      return { ...prev, grid: { ...prev.grid, horizontalCount: maxH, rowConfigs: newRowConfigs, cells: newCells } };
    });
  }, [typeId]);

  const handleSelectUnit = useCallback((unitId) => {
    const unit = quoteUnits.find((item) => item.id === unitId);
    if (!unit) return;
    setActiveUnitId(unit.id);
    setConfig(unit.config);
    setToast({ msg: `Switched to Unit ${unit.id}`, sub: `${unit.name} · ${unit.config.frameWidth || 0}″ × ${unit.config.frameHeight || 0}″` });
    setTimeout(() => setToast(null), 1800);
  }, [quoteUnits]);

  const handleAddUnit = useCallback(() => {
    const nextId = String(Math.max(0, ...quoteUnits.map((unit) => Number(unit.id) || 0)) + 1);
    const newUnit = makeUnit({
      id: nextId,
      zone: activeUnit?.zone || 'Main floor',
      name: windowType?.label || 'Casement',
      margin: activeUnit?.margin ?? 25,
      config: structuredClone(config),
    });
    setQuoteUnits((prev) => [...prev, newUnit]);
    setActiveUnitId(nextId);
    setToast({ msg: `Unit ${nextId} added`, sub: 'Copied the current configuration into the quote' });
    setTimeout(() => setToast(null), 2200);
  }, [activeUnit, config, quoteUnits, windowType]);

  const handleDuplicateUnit = useCallback((unitId) => {
    const source = quoteUnits.find((unit) => unit.id === unitId);
    if (!source) return;
    const nextId = String(Math.max(0, ...quoteUnits.map((unit) => Number(unit.id) || 0)) + 1);
    const clone = makeUnit({
      ...source,
      id: nextId,
      name: `${source.name} copy`,
      config: structuredClone(source.config),
    });
    setQuoteUnits((prev) => [...prev, clone]);
    setActiveUnitId(nextId);
    setConfig(clone.config);
    setToast({ msg: `Unit ${unitId} duplicated`, sub: `Created Unit ${nextId}` });
    setTimeout(() => setToast(null), 2200);
  }, [quoteUnits]);

  const handleDeleteUnit = useCallback((unitId) => {
    if (quoteUnits.length <= 1) {
      setToast({ msg: 'Cannot delete the last unit', sub: 'A quote needs at least one configured unit' });
      setTimeout(() => setToast(null), 2200);
      return;
    }
    setQuoteUnits((prev) => {
      const index = prev.findIndex((unit) => unit.id === unitId);
      const next = prev.filter((unit) => unit.id !== unitId);
      if (unitId === activeUnitId) {
        const fallback = next[Math.max(0, index - 1)] || next[0];
        setActiveUnitId(fallback.id);
        setConfig(fallback.config);
      }
      return next;
    });
    setToast({ msg: `Unit ${unitId} deleted`, sub: 'Quote totals updated' });
    setTimeout(() => setToast(null), 2200);
  }, [activeUnitId, quoteUnits]);

  const handleAddRoom = useCallback(() => {
    const name = window.prompt('Room name');
    const clean = name?.trim();
    if (!clean || rooms.includes(clean)) return;
    setRooms((prev) => [...prev, clean]);
    setToast({ msg: `Room "${clean}" added`, sub: 'Use it to organize units in this quote' });
    setTimeout(() => setToast(null), 2200);
  }, [rooms]);

  const handleSave = useCallback(() => {
    setLastSavedAt(Date.now());
    setToast({ msg: 'Build saved', sub: 'Available in Drafts on the dealer portal' });
    setTimeout(() => setToast(null), 2200);
  }, []);

  const handleSubmitOrder = () => {
    if (lines.length === 0) return;
    setToast({
      msg: 'Order sent to factory',
      sub: `${lines.length} ${lines.length === 1 ? 'line' : 'lines'} · ${quoteNumber}`,
    });
    setTimeout(() => setToast(null), 3000);
  };

  /* ─── Keyboard shortcuts ─── */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') {
        if (e.key === 'Enter') {
          e.target.blur();
          if (config.wizardStep === 'dimensions') handleDimensionsSubmit();
        }
        return;
      }
      if (e.key === 'Escape' && isFullscreen)  setIsFullscreen(false);
      if (e.key === 'r' || e.key === 'R')      controlsRef.current?.resetView();
      if (e.key === 'f' || e.key === 'F')      setIsFullscreen((v) => !v);
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen, config.wizardStep, handleDimensionsSubmit, handleSave]);

  /* Casement >20" min-horizontal enforcement: bottom row hosts the
     operable casement and must satisfy structural minimums. Upper
     transom rows can always go down to 1 column. */
  const minHorizontal = getMinHorizontal(config.frameWidth, typeId);
  useEffect(() => {
    if (config.wizardStep !== 'done') return;
    if (minHorizontal <= 1) return;
    const bottomRowIndex = config.grid.verticalCount - 1;
    const bottomRow = config.grid.rowConfigs.find((rc) => rc.row === bottomRowIndex);
    if (!bottomRow || bottomRow.horizontalCount >= minHorizontal) return;
    setConfig((prev) => {
      const newCells = rebuildRowCells(prev.grid.cells, bottomRowIndex, minHorizontal, prev.frameHeight, prev.grid.verticalCount, typeId);
      const newRowConfigs = prev.grid.rowConfigs.map((r) => r.row === bottomRowIndex ? { ...r, horizontalCount: minHorizontal } : r);
      const maxH = Math.max(...newRowConfigs.map((r) => r.horizontalCount));
      return { ...prev, grid: { ...prev.grid, rowConfigs: newRowConfigs, horizontalCount: maxH, cells: newCells } };
    });
  }, [minHorizontal, config.wizardStep, config.grid.rowConfigs, typeId, config.grid.verticalCount]);

  if (!windowType) return null;

  const isWizard      = config.wizardStep !== 'done';
  const maxVertical   = getMaxVertical(config.frameHeight);
  const maxHorizontal = getMaxHorizontal(config.frameWidth);

  /* ════════════════════════════════════════════════════════════
     WIZARD VIEW
     ════════════════════════════════════════════════════════════ */
  if (isWizard) {
    return (
      <div className={styles.scope}>
        <Ambient />
        <Wizard
          config={config}
          windowTypeLabel={windowType.label}
          maxVertical={maxVertical}
          maxHorizontal={maxHorizontal}
          minHorizontal={minHorizontal}
          onChangeWidth={(v) => quickUpdate({ frameWidth: v })}
          onChangeHeight={(v) => quickUpdate({ frameHeight: v })}
          onContinue={handleDimensionsSubmit}
          onSelectVertical={handleVerticalSelect}
          onSelectHorizontal={handleHorizontalSelect}
          onJumpTo={(step) => quickUpdate({ wizardStep: step })}
        />
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     CONFIGURATOR WORKSPACE
     ════════════════════════════════════════════════════════════ */
  return (
    <div className={styles.scope}>
      <Ambient />

      <OsNav />

      <Breadcrumb
        quoteNumber={quoteNumber}
        unitLabel={`Unit ${activeUnit?.id || 1}`}
        specLabel={`Vinyl 5000 ${activeUnit?.name || windowType.label}`}
        lastSavedAt={lastSavedAt}
        onSaveClose={handleSave}
      />

      {/* 3-column main app: project tree · viewer · inspector */}
      <main
        className={`${styles.app} ${treePinned ? styles.appTreeOpen : ''}`}
        style={{ ['--inspector-w']: `${inspectorWidth}px` }}
      >
        <ProjectTree
          treePinned={treePinned}
          setTreePinned={setTreePinned}
          rooms={rooms}
          units={lines}
          activeUnitId={activeUnitId}
          quoteSubtotal={quoteSubtotal}
          quoteCost={quoteCost}
          quoteTax={quoteTax}
          onSelectUnit={handleSelectUnit}
          onAddUnit={handleAddUnit}
          onAddRoom={handleAddRoom}
          onDeleteUnit={handleDeleteUnit}
          onDuplicateUnit={handleDuplicateUnit}
        />

        <Viewer
          windowType={windowType}
          typeId={typeId}
          config={config}
          quickUpdate={quickUpdate}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
          viewerModelPath={viewerModelPath}
          viewerColour={viewerColour}
          interiorColorHex={interiorColorHex}
          controlsRef={controlsRef}
          selectedCell={selectedCell}
          energyRatings={energyRatings}
          unitPrice={activeUnit ? unitPrice(activeUnit) : 0}
          quoteTotal={quoteSubtotal + quoteTax}
          lineCount={lines.length}
        />

        <div
          className={styles.colSplitter}
          role="separator"
          aria-orientation="vertical"
          aria-label="Drag to resize inspector"
          onMouseDown={(e) => {
            isDraggingSplitterRef.current = true;
            splitterStartXRef.current = e.clientX;
            splitterStartWidthRef.current = inspectorWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
          }}
          onDoubleClick={() => setInspectorWidth(480)}
          title="Drag To Resize · Double-Click To Reset"
        >
          <span className={styles.colSplitterGrip} aria-hidden />
        </div>

        <Inspector
          windowTypeLabel={windowType.label}
          productCode="Vinyl 5000"
          activeStep={activeStep}
          onChangeStep={setActiveStep}
          tabHasCustomization={tabHasCustomization}
        >
          <InspectorTabBody
            activeStep={activeStep}
            config={config}
            constraints={constraints}
            selectedCell={selectedCell}
            energyRatings={energyRatings}
            quickUpdate={quickUpdate}
            updateConfig={updateConfig}
            quickUpdateCell={quickUpdateCell}
            updateCell={updateCell}
            setConfig={setConfig}
            handleVerticalChange={handleVerticalChange}
            handleRowHorizontalChange={handleRowHorizontalChange}
          />
        </Inspector>
      </main>

      <Footer
        quoteTotal={quoteSubtotal + quoteTax}
        lineCount={lines.length}
        onSubmit={handleSubmitOrder}
      />

      <Toast toast={toast} />
      {isUpdating && <UpdatingOverlay />}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   AMBIENT BACKGROUND — static decorative blobs
   ──────────────────────────────────────────────────────────── */
function Ambient() {
  return (
    <div className={styles.ambient}>
      <div className={`${styles.blob} ${styles.blob1}`} />
      <div className={`${styles.blob} ${styles.blob2}`} />
      <div className={`${styles.blob} ${styles.blob3}`} />
      <div className={`${styles.blob} ${styles.blob4}`} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   PRICE CARD — live cost breakdown (matches OpenSpec priceCardHTML)
   ──────────────────────────────────────────────────────────── */
function PriceCard({ config, selectedCell }) {
  const lines = [];
  const areaSqFt = Math.max(1, (config.frameWidth * config.frameHeight) / 144);
  lines.push({ label: 'Base · Window', value: 280 + Math.round(areaSqFt * 22) });

  // Frame colour
  const extColor = FRAME_COLORS.find((c) => c.value === config.exteriorColor);
  if (extColor?.priceAddon) lines.push({ label: `Frame · ${extColor.label}`, value: extColor.priceAddon });

  // Glazing
  const glazing = GLAZING_TYPES.find((g) => g.value === config.glazingType);
  if (glazing?.priceAddon) lines.push({ label: 'Glazing upgrade', value: glazing.priceAddon });

  // Low-E
  const loe1 = LOW_E_COATINGS.find((l) => l.value === config.lowECoating1);
  if (loe1?.priceAddon) lines.push({ label: `Low-E · ${loe1.label}`, value: loe1.priceAddon });

  // Gas
  const gas = GAS_TYPES.find((g) => g.value === config.gasType);
  if (gas?.priceAddon) lines.push({ label: `Gas · ${gas.label}`, value: gas.priceAddon });

  // Brickmould
  const bm = BRICKMOULD_OPTIONS.find((b) => b.value === config.brickmould);
  if (bm?.priceAddon) lines.push({ label: `Brickmould · ${bm.label}`, value: bm.priceAddon });

  // Cell options
  if (selectedCell) {
    const cells = config.grid.cells.length || 1;
    if (cells > 1) lines.push({ label: `Multi-pane (${cells} cells)`, value: cells * 120 });
    if (selectedCell.grillPattern !== 'none') lines.push({ label: 'Grilles', value: 95 });
    if (selectedCell.egressHardware) lines.push({ label: 'Egress hardware', value: 35 });
  }

  if (config.addFoam) lines.push({ label: 'Foam-injected profile', value: 28 });
  if (config.interiorJamb) lines.push({ label: 'Jamb extension', value: 45 });
  if (config.interiorReturns) lines.push({ label: 'Interior return', value: 35 });

  const total = lines.reduce((s, l) => s + l.value, 0);

  return (
    <div style={{
      background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 3,
      padding: 14, boxShadow: '0 1px 2px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.06)',
    }}>
      {lines.map((l, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 0', fontSize: 12, color: '#64748B',
        }}>
          <span>{l.label}</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>
            {l.value > 0 ? `+$${l.value.toFixed(2)}` : `$${l.value.toFixed(2)}`}
          </span>
        </div>
      ))}
      <div style={{ height: 1, background: '#E2E8F0', margin: '8px 0' }} />
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Unit Total</span>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 700,
          color: '#2e5bc8', fontVariantNumeric: 'tabular-nums',
        }}>
          ${total.toLocaleString()}.00
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Updates live</div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   INSPECTOR TAB BODY — dispatches to the active tab
   ────────────────────────────────────────────────────────────
   Inspector tabs that have substantial JSX (LayoutTab, GrillesTab)
   live in their own files. The simpler tabs (Exterior / Interior /
   Glass Options / Glass Design) are inline here because they're
   mostly variations on `<Group><Field><Select/></Field></Group>`. */
function InspectorTabBody({
  activeStep, config, constraints, selectedCell, energyRatings,
  quickUpdate, updateConfig, quickUpdateCell, updateCell, setConfig,
  handleVerticalChange, handleRowHorizontalChange,
}) {
  if (activeStep === 'layout') {
    return (
      <LayoutTab
        config={config}
        maxVertical={4}
        maxHorizontal={constraints ? Math.min(4, Math.floor(constraints.maxWidth / Math.max(constraints.minWidth, 12))) : 4}
        minHorizontal={1}
        onChangeVertical={handleVerticalChange}
        onChangeRowHorizontal={handleRowHorizontalChange}
        onSelectCell={(id) => quickUpdate({ selectedCellId: id })}
        onChangeWidth={(v) => quickUpdate({ frameWidth: v })}
        onChangeHeight={(v) => quickUpdate({ frameHeight: v })}
        onChangeRowHeight={(rowIdx, newH) => {
          setConfig((prev) => ({
            ...prev,
            grid: { ...prev.grid, cells: prev.grid.cells.map((c) => c.row === rowIdx ? { ...c, height: newH } : c) },
            frameHeight: prev.grid.cells.reduce((sum, c, idx, arr) => {
              const seenRows = new Set(arr.slice(0, idx).map((cc) => cc.row));
              if (seenRows.has(c.row)) return sum;
              return sum + (c.row === rowIdx ? newH : c.height);
            }, 0),
          }));
        }}
        onChangeMeasurementType={(v) => quickUpdate({ measurementType: v })}
      />
    );
  }

  if (activeStep === 'exterior') {
    const extColorLabel = FRAME_COLORS.find(c => c.value === config.exteriorColor)?.label || config.exteriorColor;
    const bmLabel = BRICKMOULD_CATALOG.find(b => b.value === (config.brickmould || 'none'))?.label || 'None';
    return (
      <>
        {selectedCell && (
          <DetailsBox title="Window Type" chip={getWindowTypeOptions(selectedCell.windowType).find(o => o.value === selectedCell.windowType)?.label || selectedCell.windowType} defaultOpen>
            <Select
              value={selectedCell.windowType}
              options={getWindowTypeOptions(selectedCell.windowType)}
              onChange={(v) => updateCell(selectedCell.id, { windowType: v })}
              showPriceAddon={false}
            />
          </DetailsBox>
        )}

        <DetailsBox title="Exterior Colour" chip={extColorLabel} defaultOpen>
          <Select value={config.exteriorColor} options={FRAME_COLORS} onChange={(v) => updateConfig({ exteriorColor: v })} />
          <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            {FRAME_COLOR_SWATCHES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => updateConfig({ exteriorColor: s.value })}
                title={s.label}
                style={{
                  width: 38, height: 38, borderRadius: 10, cursor: 'pointer',
                  background: s.hex,
                  border: 'none',
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: config.exteriorColor === s.value
                    ? '0 1px 0 rgba(255,255,255,0.7) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 0 0 2.5px #fff, 0 0 0 4px #2e5bc8, 0 6px 16px -2px rgba(46,91,200,0.25)'
                    : '0 1px 0 rgba(255,255,255,0.7) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px -2px rgba(0,0,0,0.12)',
                  transition: 'transform .15s, box-shadow .15s',
                  transform: config.exteriorColor === s.value ? 'scale(1.02)' : 'none',
                }}
              >
                {config.exteriorColor === s.value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            ))}
          </div>
        </DetailsBox>

        <DetailsBox title="Brickmold" chip={bmLabel} defaultOpen={false}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Profile</label>
            <Select value={config.brickmould || 'none'} options={BRICKMOULD_CATALOG} onChange={(v) => updateConfig({ brickmould: v })} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'pointer', marginBottom: 8 }}>
            <input type="checkbox" checked={config.nailFin || false} onChange={(e) => quickUpdate({ nailFin: e.target.checked })} style={{ cursor: 'pointer', margin: 0 }} />
            <label style={{ flex: 1, cursor: 'pointer', fontSize: 12, color: '#0F172A', fontWeight: 600 }}>Nail Fin</label>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: config.nailFin ? '#2651b3' : '#94A3B8', fontWeight: config.nailFin ? 600 : 400 }}>{config.nailFin ? '+$45' : 'included'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'pointer', marginBottom: 8 }}>
            <input type="checkbox" checked={config.cutForSiding || false} onChange={(e) => quickUpdate({ cutForSiding: e.target.checked })} style={{ cursor: 'pointer', margin: 0 }} />
            <label style={{ flex: 1, cursor: 'pointer', fontSize: 12, color: '#0F172A', fontWeight: 600 }}>Cut for Siding</label>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: config.cutForSiding ? '#2651b3' : '#94A3B8', fontWeight: config.cutForSiding ? 600 : 400 }}>{config.cutForSiding ? '+$12' : 'included'}</span>
          </div>
          <div style={{ fontSize: 10.5, color: '#94A3B8', lineHeight: 1.4 }}>Adds an integral PVC nail fin (1¼″ flange) for new construction installation.</div>
        </DetailsBox>

        {selectedCell && !['picture', 'high-fix', 'fixed'].includes(selectedCell.windowType) && (
          <DetailsBox title="Hinge" chip={OPENING_DIRECTIONS.find(o => o.value === selectedCell.openingDirection)?.label || selectedCell.openingDirection} defaultOpen={false}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {OPENING_DIRECTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => updateCell(selectedCell.id, { openingDirection: d.value })}
                  style={{
                    justifyContent: 'center', padding: 8, fontSize: 11, border: 'none', borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                    ...(selectedCell.openingDirection === d.value
                      ? { background: '#2e5bc8', color: '#fff' }
                      : { background: '#fff', border: '1px solid #E2E8F0', color: '#0F172A' }),
                  }}
                >{d.label}</button>
              ))}
            </div>
          </DetailsBox>
        )}
      </>
    );
  }

  if (activeStep === 'interior') {
    const intColorLabel = FRAME_COLORS.find(c => c.value === config.interiorColor)?.label || config.interiorColor;
    const jambLabel = JAMB_DEPTH_OPTIONS.find(o => o.value === (config.jambDepth || 'none'))?.label || 'None';
    const returnLabel = INTERIOR_RETURN_OPTIONS.find(o => o.value === (config.interiorReturn || 'drywall'))?.label || 'Drywall';
    const hwLabel = HARDWARE_FINISHES.find(h => h.value === (config.hardwareFinish || 'satin-nickel'))?.label || 'Satin Nickel';
    return (
      <>
        <DetailsBox title="Interior Colour" chip={intColorLabel} defaultOpen>
          <Select value={config.interiorColor} options={FRAME_COLORS} onChange={(v) => updateConfig({ interiorColor: v })} />
          <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            {FRAME_COLOR_SWATCHES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => updateConfig({ interiorColor: s.value })}
                title={s.label}
                style={{
                  width: 38, height: 38, borderRadius: 10, cursor: 'pointer',
                  background: s.hex,
                  border: 'none',
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: config.interiorColor === s.value
                    ? '0 1px 0 rgba(255,255,255,0.7) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 0 0 2.5px #fff, 0 0 0 4px #2e5bc8, 0 6px 16px -2px rgba(46,91,200,0.25)'
                    : '0 1px 0 rgba(255,255,255,0.7) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px -2px rgba(0,0,0,0.12)',
                  transition: 'transform .15s, box-shadow .15s',
                  transform: config.interiorColor === s.value ? 'scale(1.02)' : 'none',
                }}
              >
                {config.interiorColor === s.value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            ))}
          </div>
        </DetailsBox>

        <DetailsBox title="Jamb Extension" chip={jambLabel} chipColor="amber" defaultOpen={false}>
          <Select value={config.jambDepth || 'none'} options={JAMB_DEPTH_OPTIONS} onChange={(v) => updateConfig({ jambDepth: v })} />
          {config.jambDepth && config.jambDepth !== 'none' && (
            <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 8, lineHeight: 1.4 }}>
              {JAMB_DEPTH_OPTIONS.find(o => o.value === config.jambDepth)?.description || ''}
            </div>
          )}
        </DetailsBox>

        <DetailsBox title="Interior Return" chip={returnLabel} defaultOpen={false}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {INTERIOR_RETURN_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => updateConfig({ interiorReturn: r.value })}
                style={{
                  padding: '10px 12px', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, textAlign: 'left', lineHeight: 1.25, borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit',
                  ...(config.interiorReturn === r.value || (!config.interiorReturn && r.value === 'drywall')
                    ? { background: '#2e5bc8', border: '1px solid #2651b3', color: '#fff' }
                    : { background: '#fff', border: '1px solid #E2E8F0', color: '#0F172A' }),
                }}
              >
                <span style={{ fontWeight: 700 }}>{r.label}</span>
                <span style={{ fontSize: 10, opacity: 0.85, fontFamily: "'IBM Plex Mono', monospace" }}>{r.priceAddon > 0 ? `+$${r.priceAddon}` : 'included'}</span>
              </button>
            ))}
          </div>
          {config.interiorReturn && config.interiorReturn !== 'none' && (
            <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 10, lineHeight: 1.4 }}>
              {INTERIOR_RETURN_OPTIONS.find(o => o.value === config.interiorReturn)?.description || ''}
            </div>
          )}
        </DetailsBox>

        <DetailsBox title="Hardware Option" chip={hwLabel} defaultOpen>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#0F172A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hardware finish</div>
            <Select value={config.hardwareFinish || 'satin-nickel'} options={HARDWARE_FINISHES} onChange={(v) => updateConfig({ hardwareFinish: v })} />
            <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              {HARDWARE_FINISHES.map((h) => (
                <button
                  key={h.value}
                  onClick={() => updateConfig({ hardwareFinish: h.value })}
                  title={h.label}
                  style={{
                    width: 38, height: 38, borderRadius: 10, cursor: 'pointer',
                    background: h.hex,
                    border: 'none',
                    position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: (config.hardwareFinish || 'satin-nickel') === h.value
                      ? '0 1px 0 rgba(255,255,255,0.7) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 0 0 2.5px #fff, 0 0 0 4px #2e5bc8, 0 6px 16px -2px rgba(46,91,200,0.25)'
                      : '0 1px 0 rgba(255,255,255,0.7) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px -2px rgba(0,0,0,0.12)',
                    transition: 'transform .15s, box-shadow .15s',
                    transform: (config.hardwareFinish || 'satin-nickel') === h.value ? 'scale(1.02)' : 'none',
                  }}
                >
                  {(config.hardwareFinish || 'satin-nickel') === h.value && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedCell && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#0F172A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hardware Type</div>
              {['casement', 'awning'].includes(selectedCell.windowType) && (
                <div style={{ marginBottom: 8 }}>
                  <Select value={selectedCell.hardwareTypeStyle || 'contemporary'} options={HARDWARE_TYPE_CASEMENT} onChange={(v) => updateCell(selectedCell.id, { hardwareTypeStyle: v })} />
                </div>
              )}
              {['single-slider', 'double-slider', 'single-hung', 'double-hung', 'end-vent'].includes(selectedCell.windowType) && (
                <div style={{ marginBottom: 8 }}>
                  <Select value={selectedCell.hardwareTypeStyle || 'standard'} options={HARDWARE_TYPE_SLIDER} onChange={(v) => updateCell(selectedCell.id, { hardwareTypeStyle: v })} />
                </div>
              )}
            </div>
          )}

          {selectedCell && ['single-slider', 'double-slider'].includes(selectedCell.windowType) && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#0F172A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Night Latch</div>
              <Select value={selectedCell.nightlatch || 'no'} options={NIGHTLATCH_OPTIONS} onChange={(v) => updateCell(selectedCell.id, { nightlatch: v })} />
            </div>
          )}


        </DetailsBox>

        {selectedCell && (
          <>
            <DetailsBox title="Screen & cleaning" chip={WINDOW_SCREEN_OPTIONS.find(o => o.value === (selectedCell.screenMesh || 'standard'))?.label || 'Standard'} chipColor="amber" defaultOpen={false}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Screen Mesh</label>
                <Select value={selectedCell.screenMesh || 'standard'} options={WINDOW_SCREEN_OPTIONS} onChange={(v) => updateCell(selectedCell.id, { screenMesh: v })} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Bug Screen</label>
                <Select value={selectedCell.screenType} options={SCREEN_TYPES} onChange={(v) => updateCell(selectedCell.id, { screenType: v })} />
              </div>
              {['single-hung', 'double-hung'].includes(selectedCell.windowType) && (
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Tilt-in cleaning</label>
                  <Select value={selectedCell.tiltFeature || 'none'} options={TILT_FEATURE_OPTIONS} onChange={(v) => updateCell(selectedCell.id, { tiltFeature: v })} />
                </div>
              )}
            </DetailsBox>

            <DetailsBox title="Safety Options" chip="Defaults" chipColor="red" defaultOpen={false}>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Sash Limiter (Child Safety)</label>
                <Select value={selectedCell.sashLimiter || 'none'} options={SASH_LIMITER_OPTIONS} onChange={(v) => updateCell(selectedCell.id, { sashLimiter: v })} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Glass Safety</label>
                <Select value={selectedCell.temperedGlass || 'standard'} options={TEMPERED_GLASS_OPTIONS} onChange={(v) => updateCell(selectedCell.id, { temperedGlass: v })} />
              </div>
            </DetailsBox>
          </>
        )}

        {energyRatings && (
          <DetailsBox title="Performance" pinned defaultOpen>
            <div className={inspectorStyles.energyGrid}>
              <EnergyCard label="U-factor" value={energyRatings.uFactorIP} />
              <EnergyCard label="SHGC"     value={energyRatings.shgc} />
              <EnergyCard label="VT"       value={energyRatings.vt} />
            </div>
          </DetailsBox>
        )}

      </>
    );
  }

  if (activeStep === 'glass-options') {
    const isTriple = config.glazingType === 'triple-pane';
    // Build the coating options for glass 2 — double pane interior glass only allows Clear or i89
    const glass2Options = isTriple
      ? LOW_E_COATINGS
      : LOW_E_COATINGS.filter((c) => c.value === 'clear' || c.value === 'i89');
    const glazingLabel = GLAZING_TYPES.find(g => g.value === config.glazingType)?.label || config.glazingType;
    const thicknessLabel = GLASS_THICKNESS_OPTIONS.find(g => g.value === config.glassThickness)?.label || config.glassThickness;
    const gasLabel = GAS_TYPES.find(g => g.value === config.gasType)?.label || config.gasType;

    return (
      <>
        <DetailsBox title="Glazing Package" chip={glazingLabel} chipColor={isTriple ? 'green' : undefined} defaultOpen>
          <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Pane Count</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
            {/* Double pane button */}
            <button
              type="button"
              onClick={() => updateConfig({ glazingType: 'double-pane' })}
              style={{
                padding: '8px 10px', fontSize: 11, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, textAlign: 'left', lineHeight: 1.25, border: '1px solid', borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit',
                ...(config.glazingType !== 'triple-pane'
                  ? { background: '#2e5bc8', borderColor: '#2651b3', color: 'white' }
                  : { background: '#E8E8F5', borderColor: '#9090C0', color: '#2651b3' }),
              }}
            >
              <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                <svg width="14" height="11" viewBox="0 0 24 16" fill="none" style={{ flexShrink: 0 }}><rect x="3" y="2" width="3" height="12" fill="currentColor" opacity="0.85"/><rect x="18" y="2" width="3" height="12" fill="currentColor" opacity="0.85"/><line x1="6" y1="8" x2="18" y2="8" stroke="currentColor" strokeWidth="0.6" opacity="0.4" strokeDasharray="2 2"/></svg>
                Double pane
              </span>
              <span style={{ fontSize: 9, opacity: 0.85 }}>2 panes · standard</span>
            </button>
            {/* Triple pane button */}
            <button
              type="button"
              onClick={() => updateConfig({ glazingType: 'triple-pane' })}
              style={{
                padding: '8px 10px', fontSize: 11, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, textAlign: 'left', lineHeight: 1.25, border: '1px solid', borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit',
                ...(config.glazingType === 'triple-pane'
                  ? { background: '#16A34A', borderColor: '#15803D', color: 'white' }
                  : { background: '#F0FDF4', borderColor: '#BBF7D0', color: '#15803D' }),
              }}
            >
              <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                <svg width="14" height="11" viewBox="0 0 24 16" fill="none" style={{ flexShrink: 0 }}><rect x="3" y="2" width="3" height="12" fill="currentColor" opacity="0.85"/><rect x="10.5" y="2" width="3" height="12" fill="currentColor" opacity="0.85"/><rect x="18" y="2" width="3" height="12" fill="currentColor" opacity="0.85"/></svg>
                Triple pane
              </span>
              <span style={{ fontSize: 9, opacity: 0.85 }}>3 panes · premium</span>
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Per-glass coating</div>

            {/* Glass 1 — Exterior */}
            <div style={{ padding: '10px 12px', background: '#FAFBFC', border: '1px solid #E2E8F0', borderRadius: 3, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#0F172A' }}>Glass 1 <span style={{ fontWeight: 400, color: '#94A3B8' }}>· Exterior</span></span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 2, background: '#E8E8F5', color: '#2651b3', fontWeight: 600 }}>
                  {LOW_E_COATINGS.find((c) => c.value === config.lowECoating1)?.label || 'Clear'}
                </span>
              </div>
              <Select value={config.lowECoating1} options={LOW_E_COATINGS} onChange={(v) => updateConfig({ lowECoating1: v })} />
            </div>

            {/* Glass 2 — Interior (or Middle for triple) */}
            <div style={{ padding: '10px 12px', background: '#FAFBFC', border: '1px solid #E2E8F0', borderRadius: 3, marginBottom: isTriple ? 8 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#0F172A' }}>Glass 2 <span style={{ fontWeight: 400, color: '#94A3B8' }}>· {isTriple ? 'Middle' : 'Interior'}</span></span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 2, background: '#E8E8F5', color: '#2651b3', fontWeight: 600 }}>
                  {LOW_E_COATINGS.find((c) => c.value === config.lowECoating2)?.label || 'Clear'}
                </span>
              </div>
              <Select value={config.lowECoating2} options={glass2Options} onChange={(v) => updateConfig({ lowECoating2: v })} />
            </div>

            {/* Glass 3 — Interior (only for triple) */}
            {isTriple && (
              <div style={{ padding: '10px 12px', background: '#FAFBFC', border: '1px solid #E2E8F0', borderRadius: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#0F172A' }}>Glass 3 <span style={{ fontWeight: 400, color: '#94A3B8' }}>· Interior</span></span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 2, background: '#F0FDF4', color: '#15803D', fontWeight: 600 }}>
                    {LOW_E_COATINGS.find((c) => c.value === (config.lowECoating3 || 'clear'))?.label || 'Clear'}
                  </span>
                </div>
                <Select value={config.lowECoating3 || 'clear'} options={LOW_E_COATINGS} onChange={(v) => updateConfig({ lowECoating3: v })} />
              </div>
            )}
          </div>
        </DetailsBox>

        <DetailsBox title="Glass Thickness" chip={thicknessLabel} defaultOpen={false}>
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Glass Thickness</label>
            <Select value={config.glassThickness} options={GLASS_THICKNESS_OPTIONS} onChange={(v) => updateConfig({ glassThickness: v })} />
          </div>
        </DetailsBox>

        <DetailsBox title="Security / Safety Glass" chip={SECURITY_GLASS_OPTIONS.find(o => o.value === (config.securityGlassExterior || 'none'))?.label || 'None'} defaultOpen={false}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Exterior Pane</label>
              <Select value={config.securityGlassExterior || 'none'} options={SECURITY_GLASS_OPTIONS} onChange={(v) => updateConfig({ securityGlassExterior: v })} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Interior Pane</label>
              <Select value={config.securityGlassInterior || 'none'} options={SECURITY_GLASS_OPTIONS} onChange={(v) => updateConfig({ securityGlassInterior: v })} />
            </div>
          </div>
        </DetailsBox>

        <DetailsBox title="Spacer & gas fill" chip={gasLabel} defaultOpen={false}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Gas Type</label>
            <Select value={config.gasType} options={GAS_TYPES} onChange={(v) => updateConfig({ gasType: v })} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Spacer Type</label>
            <Select value={config.spacerType} options={SPACER_TYPES} onChange={(v) => updateConfig({ spacerType: v })} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Spacer Colour</label>
            <Select value={config.spacerColor} options={SPACER_COLOR_OPTIONS} onChange={(v) => updateConfig({ spacerColor: v })} showPriceAddon={false} />
          </div>
        </DetailsBox>
      </>
    );
  }

  if (activeStep === 'glass-design') {
    const designLabel = GLASS_DESIGN_OPTIONS.find(o => o.value === (config.glassDesign || 'clear'))?.label || 'Clear';
    return (
      <>
        <DetailsBox title="Frosted Glass" chip={FROSTED_GLASS_OPTIONS.find(o => o.value === (config.frostedGlass || 'clear'))?.label || 'Clear'} defaultOpen>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 2 }}>
            {FROSTED_GLASS_OPTIONS.map((d) => {
              const sel = (config.frostedGlass || 'clear') === d.value;
              /* SVG pattern overlay per type */
              const patternSvg = {
                clear: '',
                sandblasted: `<defs><pattern id="p_sb" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="0.6" fill="#0F172A" opacity="0.18"/></pattern></defs><rect x="2" y="2" width="76" height="76" fill="url(#p_sb)" opacity="0.6"/>`,
                rain: `<defs><pattern id="p_rain" width="6" height="12" patternUnits="userSpaceOnUse"><line x1="3" y1="0" x2="3" y2="12" stroke="#0F172A" stroke-width="0.6" opacity="0.12"/></pattern></defs><rect x="2" y="2" width="76" height="76" fill="url(#p_rain)" opacity="0.8"/>`,
                'glue-chip': `<defs><pattern id="p_gc" width="10" height="10" patternUnits="userSpaceOnUse"><polygon points="5,1 8,4 6,8 2,6 3,3" fill="#0F172A" opacity="0.08" stroke="#0F172A" stroke-width="0.3" stroke-opacity="0.12"/></pattern></defs><rect x="2" y="2" width="76" height="76" fill="url(#p_gc)" opacity="0.9"/>`,
              };
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => updateConfig({ frostedGlass: d.value })}
                  title={d.label}
                  style={{
                    position: 'relative', padding: '8px 6px', border: sel ? '2px solid #2e5bc8' : '1px solid #E2E8F0', background: sel ? '#EAEAF2' : '#FFFFFF', borderRadius: 2, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: 'inherit', fontSize: 11, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, transition: 'border-color 120ms ease, background 120ms ease',
                  }}
                >
                  {sel && (
                    <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5 L4.2 7.2 L8 3" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                  <div style={{ width: 74, height: 74, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, overflow: 'hidden', background: '#F0F4F8' }}>
                    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{ display: 'block', width: '100%', height: '100%' }}>
                      <defs>
                        <linearGradient id={`frostSheen_${d.value}`} x1="0" y1="0" x2="0.2" y2="1"><stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45"/><stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.10"/><stop offset="100%" stopColor="#0F172A" stopOpacity="0.06"/></linearGradient>
                      </defs>
                      <rect x="0" y="0" width="80" height="80" fill="#F0F4F8"/>
                      <rect x="0" y="0" width="80" height="80" fill={`url(#frostSheen_${d.value})`}/>
                      <g dangerouslySetInnerHTML={{ __html: patternSvg[d.value] || '' }} />
                      <rect x="0.5" y="0.5" width="79" height="79" fill="none" stroke="#0F172A" strokeWidth="0.6" opacity="0.25" rx="1"/>
                    </svg>
                  </div>
                  <span style={{ fontWeight: 500, minHeight: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>{d.label}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#94A3B8' }}>{d.priceAddon > 0 ? `+$${d.priceAddon}` : 'included'}</span>
                </button>
              );
            })}
          </div>
        </DetailsBox>

        <DetailsBox title="Tint" chip={TINT_OPTIONS.find(o => o.value === (config.tintFrosting || 'none'))?.label || 'None'} defaultOpen={false}>
          <Select value={config.tintFrosting || 'none'} options={TINT_OPTIONS} onChange={(v) => updateConfig({ tintFrosting: v })} />
        </DetailsBox>

        {selectedCell && (
          <GrillesTab
            cell={selectedCell}
            config={config}
            onUpdateCell={(u) => updateCell(selectedCell.id, u)}
            onQuickUpdateCell={(u) => quickUpdateCell(selectedCell.id, u)}
          />
        )}
      </>
    );
  }

  return null;
}
