import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';

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
  GLAZING_TYPES,
  GLASS_THICKNESS_OPTIONS,
  LOW_E_COATINGS,
  GAS_TYPES,
  SPACER_TYPES,
  SPACER_COLOR_OPTIONS,
  TINT_FROSTING_OPTIONS,
  SECURITY_GLASS_OPTIONS,
  HARDWARE_COLORS,
  OPENING_DIRECTIONS,
  SCREEN_TYPES,
  SPECIAL_GLAZING_OPTIONS,
  GRILL_BAR_SIZES,
  GRILL_COLORS,
  WINDOW_CONSTRAINTS,
  WINDOW_MODEL_PATHS,
  getWindowTypeOptions,
  computeEnergyRatings,
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
  Field, Group, Select, Swatches, Toggle, layoutStyles,
} from './components/ui';

import styles from './ConfiguratorPage.module.css';

const FRAME_COLOR_SWATCHES = [
  { value: 'white-137',            label: 'White 137',         hex: '#BCBCB8' },
  { value: 'almond-532',           label: 'Almond 532',        hex: '#C8B89A' },
  { value: 'commercial-brown-424', label: 'Commercial Brown',  hex: '#5C3A21' },
  { value: 'iron-ore-697',         label: 'Iron Ore 697',      hex: '#434343' },
  { value: 'black-525',            label: 'Black 525',         hex: '#1A1A1A' },
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
    + optionPrice(SPECIAL_GLAZING_OPTIONS, cell.specialGlazing)
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
    + optionPrice(TINT_FROSTING_OPTIONS, config.tintFrosting)
    + optionPrice(SECURITY_GLASS_OPTIONS, config.securityGlass)
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
  const typeId     = 'casement';
  const windowType = WINDOW_TYPES.find((w) => w.id === typeId);

  /* ─── Page state ─── */
  const [config, setConfig]               = useState(() => createDefaultConfig(typeId));
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
      'exterior':      config.exteriorColor !== 'white-137' || config.brickmould !== 'none' || config.nailingFin !== 'no' || config.addFoam,
      'interior':      config.interiorColor !== 'white-137' || config.interiorJamb || config.interiorReturns || (cell ? (cell.egressHardware || cell.hardwareColor !== 'white-137') : false),
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
          title="Drag to resize · double-click to reset"
        >
          <span className={styles.colSplitterGrip} aria-hidden />
        </div>

        <Inspector
          windowTypeLabel={windowType.label}
          productCode={typeId.toUpperCase()}
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
    return (
      <>
        {selectedCell && (
          <Group title="Window type">
            <Select
              value={selectedCell.windowType}
              options={getWindowTypeOptions(selectedCell.windowType)}
              onChange={(v) => updateCell(selectedCell.id, { windowType: v })}
              showPriceAddon={false}
            />
          </Group>
        )}

        <div className={layoutStyles.groupHairline} />

        <Group title="Exterior colour">
          <Swatches value={config.exteriorColor} options={FRAME_COLOR_SWATCHES} onChange={(v) => updateConfig({ exteriorColor: v })} />
          <Field label="Or pick from full palette">
            <Select value={config.exteriorColor} options={FRAME_COLORS} onChange={(v) => updateConfig({ exteriorColor: v })} />
          </Field>
        </Group>

        <div className={layoutStyles.groupHairline} />

        <Group title="Brickmould & nailing fin">
          <div className={layoutStyles.fieldGrid2}>
            <Field label="Brickmould"><Select value={config.brickmould}  options={BRICKMOULD_OPTIONS}  onChange={(v) => updateConfig({ brickmould: v })} /></Field>
            <Field label="Snap-in nailing fin"><Select value={config.nailingFin} options={NAILING_FIN_OPTIONS} onChange={(v) => updateConfig({ nailingFin: v })} /></Field>
          </div>
          <div className={layoutStyles.fieldRow}>
            <span className={layoutStyles.fieldLabel}>Foam-injected profile</span>
            <Toggle value={config.addFoam} onChange={(v) => quickUpdate({ addFoam: v })} />
          </div>
        </Group>

        {selectedCell && !['picture', 'high-fix', 'fixed'].includes(selectedCell.windowType) && (
          <>
            <div className={layoutStyles.groupHairline} />
            <Group title="Operation & handing">
              <Field label="Opens from">
                <Select
                  value={selectedCell.openingDirection}
                  options={OPENING_DIRECTIONS}
                  onChange={(v) => updateCell(selectedCell.id, { openingDirection: v })}
                  showPriceAddon={false}
                />
              </Field>
            </Group>
          </>
        )}
      </>
    );
  }

  if (activeStep === 'interior') {
    return (
      <>
        <Group title="Interior colour">
          <Swatches value={config.interiorColor} options={FRAME_COLOR_SWATCHES} onChange={(v) => updateConfig({ interiorColor: v })} />
          <Field label="Or pick from full palette">
            <Select value={config.interiorColor} options={FRAME_COLORS} onChange={(v) => updateConfig({ interiorColor: v })} />
          </Field>
        </Group>

        <div className={layoutStyles.groupHairline} />

        <Group title="Jamb & interior return">
          <div className={layoutStyles.fieldRow}>
            <span className={layoutStyles.fieldLabel}>Jamb extension</span>
            <Toggle value={config.interiorJamb} onChange={(v) => quickUpdate({ interiorJamb: v })} />
          </div>
          <div className={layoutStyles.fieldRow}>
            <span className={layoutStyles.fieldLabel}>Interior return</span>
            <Toggle value={config.interiorReturns} onChange={(v) => quickUpdate({ interiorReturns: v })} />
          </div>
        </Group>

        {selectedCell && (
          <>
            <div className={layoutStyles.groupHairline} />
            <Group title="Hardware & opening">
              <div className={layoutStyles.fieldGrid2}>
                <Field label="Handle & lock colour">
                  <Select value={selectedCell.hardwareColor} options={HARDWARE_COLORS} onChange={(v) => updateCell(selectedCell.id, { hardwareColor: v })} />
                </Field>
                <Field label="Bug screen">
                  <Select value={selectedCell.screenType} options={SCREEN_TYPES} onChange={(v) => updateCell(selectedCell.id, { screenType: v })} />
                </Field>
              </div>
            </Group>
            <div className={layoutStyles.groupHairline} />
            <Group title="Safety">
              <div className={layoutStyles.fieldRow}>
                <span className={layoutStyles.fieldLabel}>Egress hardware</span>
                <Toggle value={selectedCell.egressHardware} onChange={(v) => quickUpdateCell(selectedCell.id, { egressHardware: v })} />
              </div>
            </Group>
          </>
        )}

        {energyRatings && (
          <>
            <div className={layoutStyles.groupHairline} />
            <Group title="Performance">
              <div className={inspectorStyles.energyGrid}>
                <EnergyCard label="U-factor" value={energyRatings.uFactorIP} />
                <EnergyCard label="SHGC"     value={energyRatings.shgc} />
                <EnergyCard label="VT"       value={energyRatings.vt} />
              </div>
            </Group>
          </>
        )}
      </>
    );
  }

  if (activeStep === 'glass-options') {
    return (
      <>
        <Group title="Glazing">
          <div className={layoutStyles.fieldGrid2}>
            <Field label="Pane count"><Select value={config.glazingType}    options={GLAZING_TYPES}            onChange={(v) => updateConfig({ glazingType: v })} /></Field>
            <Field label="Glass thickness"><Select value={config.glassThickness} options={GLASS_THICKNESS_OPTIONS} onChange={(v) => updateConfig({ glassThickness: v })} /></Field>
          </div>
        </Group>

        <div className={layoutStyles.groupHairline} />

        <Group title="Low-E coatings">
          <div className={layoutStyles.fieldGrid2}>
            <Field label="Glass 1 (exterior)"><Select value={config.lowECoating1} options={LOW_E_COATINGS} onChange={(v) => updateConfig({ lowECoating1: v })} /></Field>
            <Field label="Glass 2 (interior)"><Select value={config.lowECoating2} options={LOW_E_COATINGS} onChange={(v) => updateConfig({ lowECoating2: v })} /></Field>
          </div>
        </Group>

        <div className={layoutStyles.groupHairline} />

        <Group title="Spacer & gas fill">
          <div className={layoutStyles.fieldGrid2}>
            <Field label="Gas type"><Select value={config.gasType}     options={GAS_TYPES}     onChange={(v) => updateConfig({ gasType: v })} /></Field>
            <Field label="Spacer type"><Select value={config.spacerType} options={SPACER_TYPES} onChange={(v) => updateConfig({ spacerType: v })} /></Field>
          </div>
          <Field label="Spacer colour">
            <Select value={config.spacerColor} options={SPACER_COLOR_OPTIONS} onChange={(v) => updateConfig({ spacerColor: v })} showPriceAddon={false} />
          </Field>
        </Group>
      </>
    );
  }

  if (activeStep === 'glass-design') {
    return (
      <>
        <Group title="Tint & security">
          <div className={layoutStyles.fieldGrid2}>
            <Field label="Tint or frosting"><Select value={config.tintFrosting}  options={TINT_FROSTING_OPTIONS}  onChange={(v) => updateConfig({ tintFrosting: v })} /></Field>
            <Field label="Security glass"><Select value={config.securityGlass} options={SECURITY_GLASS_OPTIONS} onChange={(v) => updateConfig({ securityGlass: v })} /></Field>
          </div>
        </Group>

        {selectedCell && (
          <>
            <div className={layoutStyles.groupHairline} />
            <Group title="Special glazing">
              <Field label="Apply to selected cell">
                <Select
                  value={selectedCell.specialGlazing}
                  options={SPECIAL_GLAZING_OPTIONS}
                  onChange={(v) => updateCell(selectedCell.id, { specialGlazing: v })}
                />
              </Field>
            </Group>
          </>
        )}

        {selectedCell && (
          <>
            <div className={layoutStyles.groupHairline} />
            <GrillesTab
              cell={selectedCell}
              config={config}
              onUpdateCell={(u) => updateCell(selectedCell.id, u)}
              onQuickUpdateCell={(u) => quickUpdateCell(selectedCell.id, u)}
            />
          </>
        )}
      </>
    );
  }

  return null;
}
