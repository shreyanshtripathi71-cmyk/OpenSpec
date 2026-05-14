/* ══════════════════════════════════════════════════════════════
   Configurator Data — Options, Defaults & Pricing
   ══════════════════════════════════════════════════════════════ */

export const WINDOW_CONSTRAINTS = {
  awning: { minWidth: 19.125, maxWidth: 72, minHeight: 12, maxHeight: 68 },
  casement: { minWidth: 14, maxWidth: 36, minHeight: 24, maxHeight: 72 },
  picture: { minWidth: 12, maxWidth: 96, minHeight: 12, maxHeight: 96 },
  'high-fix': { minWidth: 12, maxWidth: 96, minHeight: 12, maxHeight: 96 },
  'single-hung': { minWidth: 19.5, maxWidth: 44, minHeight: 30, maxHeight: 72 },
  'double-hung': { minWidth: 19.5, maxWidth: 44, minHeight: 30, maxHeight: 72 },
  'single-slider': { minWidth: 36, maxWidth: 72, minHeight: 18, maxHeight: 60 },
  'double-slider': { minWidth: 48, maxWidth: 96, minHeight: 18, maxHeight: 60 },
  'end-vent': { minWidth: 48, maxWidth: 96, minHeight: 18, maxHeight: 60 },
};

/* ─── Model paths per window type ─── */
export const WINDOW_MODEL_PATHS = {
  awning: '/windows/awning/AwningWindow.glb',
  casement: '/windows/casement/Casement.glb',
  picture: '/windows/picture/PictureWindow_Model_1.gltf',
  'high-fix': '/windows/high-fix/HighFixWindow_DoubleGlazing.gltf',
  'single-hung': '/windows/single-hung/SingleHungWindow_optimized.glb',
  'double-hung': '/windows/double-hung/DoubleHungWindow_optimized.glb',
  'single-slider': '/windows/single-slider/SingleSliderWindow_optimized.glb',
  'double-slider': '/windows/double-slider/DoubleSliderWindow_optimized.glb',
  'end-vent': '/windows/end-vent/End Vent Slider Window_Model_1_optimized.glb',
};

/* ─── Helper: Create a default WindowCell ─── */
function createDefaultCell(row, col, windowType, height, colsInRow) {
  const reversedCol = colsInRow - col;
  return {
    id: `W${row + 1}.${reversedCol}`,
    row,
    col,
    windowType,
    sashSize: 'even-split',
    height,
    hardwareType: 'premium-classic',
    hardwareColor: 'white-137',
    openingDirection: windowType === 'picture' || windowType === 'high-fix' ? 'fixed' : 'right',
    screenType: 'regular',
    egressHardware: false,
    specialGlazing: 'default',
    grillPattern: 'none',
    grillBarType: 'flat',
    grillBarSize: '5/16',
    grillColor: 'white',
    grillVertical: Math.max(1, Math.round(height * (colsInRow || 1) / 12)),
    grillHorizontal: Math.max(1, Math.round(height / 12)),
    // Prairie defaults
    prairieHBarLayout: 'top-and-bottom',
    prairieVBarLayout: 'left-and-right',
    prairieHBarDaylight: 5.0,
    prairieVBarDaylight: 5.0,
    prairieBarSpacing: 5,
    prairieLadderHead: 0,
    prairieLadderSill: 0,
    prairieLadderLeft: 0,
    prairieLadderRight: 0,
    prairieHSupportBars: 0,
    prairieVSupportBars: 0,
    // Ladder defaults
    ladderBarSpacing: 16,
  };
}

/* ─── Helper: Build grid cells (supports per-row column counts) ─── */
export function buildGridCells(verticalCount, horizontalCount, totalHeight, baseWindowType, rowConfigs) {
  const rowHeight = Math.round((totalHeight / verticalCount) * 1000) / 1000;
  const cells = [];

  for (let r = 0; r < verticalCount; r++) {
    const rowCfg = rowConfigs?.find(rc => rc.row === r);
    const colsForRow = rowCfg ? rowCfg.horizontalCount : horizontalCount;

    for (let c = 0; c < colsForRow; c++) {
      cells.push(createDefaultCell(r, c, baseWindowType, rowHeight, colsForRow));
    }
  }

  return cells;
}

/* ─── Helper: Build default rowConfigs ─── */
export function buildDefaultRowConfigs(verticalCount, baseHorizontal, upperHorizontal = baseHorizontal) {
  return Array.from({ length: verticalCount }, (_, r) => ({
    row: r,
    horizontalCount: r === 0 ? baseHorizontal : upperHorizontal,
  }));
}

/* ─── Helper: Max vertical count based on height (smart constraint) ─── */
export function getMaxVertical(frameHeight) {
  if (frameHeight <= 0) return 1;
  const max = Math.floor(frameHeight / 24);
  return Math.max(1, Math.min(4, max));
}

/* ─── Helper: Max horizontal count based on width ─── */
export function getMaxHorizontal(frameWidth) {
  if (frameWidth <= 0) return 1;
  const max = Math.floor(frameWidth / 18);
  return Math.max(1, Math.min(4, max));
}

/* ─── Helper: Min horizontal count based on type + width ─── */
export function getMinHorizontal(frameWidth, typeId) {
  if (typeId === 'casement' && frameWidth > 20) return 2;
  return 1;
}

/* ─── Helper: Rebuild cells for a single row when its horizontal count changes ─── */
export function rebuildRowCells(existingCells, row, newHorizontalCount, totalHeight, verticalCount, baseWindowType) {
  const rowHeight = Math.round((totalHeight / verticalCount) * 1000) / 1000;
  const otherCells = existingCells.filter(c => c.row !== row);
  const newRowCells = [];
  for (let c = 0; c < newHorizontalCount; c++) {
    newRowCells.push(createDefaultCell(row, c, baseWindowType, rowHeight, newHorizontalCount));
  }
  return [...otherCells, ...newRowCells].sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col);
}

/* ─── Default State ─── */
export function createDefaultConfig(windowType) {
  return {
    wizardStep: 'dimensions',

    measurementType: 'frame-size',
    frameWidth: 0,
    frameHeight: 0,

    grid: {
      verticalCount: 1,
      horizontalCount: 1,
      rowConfigs: [],
      cells: [],
    },
    selectedCellId: 'W1.1',

    exteriorColor: 'white-137',
    interiorColor: 'white-137',
    addFoam: false,
    brickmould: 'none',
    nailingFin: 'none',

    glazingType: 'double-pane',
    glassThickness: '3mm',
    lowECoating1: 'climaguard-80-70',
    lowECoating2: 'none',
    gasType: 'argon',
    spacerType: 'warm-edge',
    spacerColor: 'black',
    tintFrosting: 'none',
    securityGlass: 'none',

    interiorJamb: false,
    interiorReturns: false,

    description: '',
    quantity: 1,
  };
}

/* ─── Option Lists ─── */

export const MEASUREMENT_TYPES = [
  { value: 'frame-size', label: 'Frame Size', description: 'Measure the frame opening' },
  { value: 'brickmould-size', label: 'Brickmould Size', description: 'Measure to brickmould edges' },
  { value: 'rough-opening', label: 'Rough Opening', description: 'Measure the rough opening' },
];

export const FRAME_COLORS = [
  { value: 'white-137', label: 'White 137', icon: '⬜', priceAddon: 0, description: 'Standard' },
  { value: 'almond-532', label: 'Almond 532', icon: '🟫', priceAddon: 0, description: 'Standard' },
  { value: 'black-525', label: 'Black 525', icon: '⬛', priceAddon: 59.22, description: 'Premium' },
  { value: 'iron-ore-697', label: 'Iron Ore 697', icon: '🔘', priceAddon: 59.22, description: 'Premium' },
  { value: 'commercial-brown-424', label: 'Commercial Brown 424', icon: '🟤', priceAddon: 59.22, description: 'Premium' },
];

export const BRICKMOULD_OPTIONS = [
  { value: 'none', label: 'No Brickmould', priceAddon: 0 },
  { value: '1.5-inch', label: '1-1/2" Brickmould', priceAddon: 15.00 },
  { value: '1.75-inch', label: '1-3/4" Brickmould', priceAddon: 18.50 },
  { value: '2.5-inch', label: '2-1/2" Brickmould', priceAddon: 24.00 },
  { value: '4-inch', label: '4" Brickmould', priceAddon: 32.00 },
];

export const NAILING_FIN_OPTIONS = [
  { value: 'no', label: 'No', priceAddon: 0 },
  { value: 'yes', label: 'Yes', priceAddon: 6.64 },
];

export const GLAZING_TYPES = [
  { value: 'double-pane', label: 'Double Pane Glass', icon: '🪟', priceAddon: 0 },
  { value: 'triple-pane', label: 'Triple Pane Glass', icon: '🪟', priceAddon: 47.50 },
];

export const LOW_E_COATINGS = [
  { value: 'none', label: 'None', priceAddon: 0 },
  { value: 'climaguard-80-70', label: 'ClimaGuard 80/70 (Single)', priceAddon: 0, description: 'Standard' },
  { value: 'climaguard-72-57', label: 'ClimaGuard 72/57 (Single)', priceAddon: 8.00 },
  { value: 'climaguard-70-36', label: 'ClimaGuard 70/36 (Double)', priceAddon: 22.00 },
];

export const GAS_TYPES = [
  { value: 'air', label: 'Air (No Gas)', priceAddon: 0 },
  { value: 'argon', label: 'Argon', priceAddon: 0, description: 'Standard' },
  { value: 'krypton', label: 'Krypton', priceAddon: 35.00 },
];

export const SPACER_TYPES = [
  { value: 'standard', label: 'Standard Spacer', priceAddon: 0 },
  { value: 'warm-edge', label: 'Endur® Warm-Edge Spacer', priceAddon: 0, description: 'Standard' },
  { value: 'super-spacer', label: 'Super Spacer', priceAddon: 12.00 },
];

export const GLASS_THICKNESS_OPTIONS = [
  { value: '3mm', label: '3mm', priceAddon: 0, description: 'Standard' },
  { value: '4mm', label: '4mm', priceAddon: 8.50 },
  { value: '5mm', label: '5mm', priceAddon: 15.00 },
];

export const TINT_FROSTING_OPTIONS = [
  { value: 'none', label: 'None', priceAddon: 0 },
  { value: 'bronze-tint', label: 'Bronze Tint', priceAddon: 28.00 },
  { value: 'grey-tint', label: 'Grey Tint', priceAddon: 28.00 },
  { value: 'frosted', label: 'Frost', priceAddon: 35.00 },
];

export const SECURITY_GLASS_OPTIONS = [
  { value: 'none', label: 'None', priceAddon: 0 },
  { value: 'laminated', label: 'Laminated', priceAddon: 65.00 },
];

export const SPACER_COLOR_OPTIONS = [
  { value: 'black', label: 'Black', priceAddon: 0 },
  { value: 'grey', label: 'Grey', priceAddon: 0 },
];

/* ─── Per-Cell Options ─── */

const AWNING_TYPES = [
  { value: 'awning', label: 'Awning Window', icon: '🏠' },
  { value: 'picture', label: 'Picture Window', icon: '🖼️' },
];

const CASEMENT_TYPES = [
  { value: 'casement', label: 'Casement Window', icon: '🪟' },
  { value: 'picture', label: 'Picture Window', icon: '🖼️' },
];

export function getWindowTypeOptions(baseType) {
  switch (baseType) {
    case 'awning': return AWNING_TYPES;
    case 'casement': return CASEMENT_TYPES;
    default: return [{ value: baseType, label: baseType.charAt(0).toUpperCase() + baseType.slice(1) + ' Window' }];
  }
}

export const HARDWARE_COLORS = [
  { value: 'white-137', label: 'White 137', icon: '⬜', priceAddon: 0 },
  { value: 'almond', label: 'Almond', icon: '🟫', priceAddon: 0 },
  { value: 'black', label: 'Black', icon: '⬛', priceAddon: 8.00 },
];

export const OPENING_DIRECTIONS = [
  { value: 'left', label: 'Left Hand', icon: '◀️' },
  { value: 'right', label: 'Right Hand', icon: '▶️' },
  { value: 'fixed', label: 'Fixed (No Opening)', icon: '⏹️' },
];

export const SCREEN_TYPES = [
  { value: 'regular', label: 'Regular Screen', priceAddon: 0, description: 'Standard' },
  { value: 'heavy-duty', label: 'Heavy Duty Screen', priceAddon: 6.64 },
  { value: 'none', label: 'No Screen', priceAddon: -1.33 },
];

export const SPECIAL_GLAZING_OPTIONS = [
  { value: 'default', label: 'Default Glazing', priceAddon: 0 },
  { value: 'tempered-both', label: '3mm Tempered - Both Panes', priceAddon: 15.94 },
];

export const GRILL_PATTERNS = [
  { value: 'none', label: 'No', icon: '⊠', priceAddon: 0 },
  { value: 'colonial', label: 'Colonial', icon: '▦', priceAddon: 0, description: 'Evenly-spaced grid pattern' },
  { value: 'prairie', label: 'Prairie', icon: '⊞', priceAddon: 0, description: 'Perimeter bars with open center' },
  { value: 'ladder', label: 'Ladder', icon: '☰', priceAddon: 0, description: 'Horizontal bars only' },
  { value: 'diamond', label: 'Diamond', icon: '◇', priceAddon: 0, description: 'Diagonal crossing bars' },
];

export const GRILL_BAR_TYPES = [
  { value: 'georgian', label: 'Georgian', priceAddon: 0, description: 'Standard profile bar' },
  { value: 'flat', label: 'Flat', priceAddon: -79.49, description: 'Flat profile bar' },
  { value: 'pencil', label: 'Pencil', priceAddon: 42.01, description: 'Thin rounded profile' },
  { value: 'sdl', label: 'SDL', priceAddon: 308.45, description: 'Simulated Divided Lite — bars on both sides of glass' },
];

export const GRILL_BAR_SIZES = [
  { value: '5/16', label: '5/16"', priceAddon: 370.05, description: 'Thinnest profile' },
  { value: '5/8', label: '5/8"', priceAddon: 370.05, description: 'Medium profile' },
  { value: '1', label: '1"', priceAddon: 370.05, description: 'Standard width' },
];

export const GRILL_COLORS = [
  { value: 'white', label: 'White', priceAddon: 0 },
  { value: 'brass', label: 'Brass', priceAddon: 120.67 },
  { value: 'pewter', label: 'Pewter', priceAddon: 120.67 },
  { value: 'black', label: 'Black', priceAddon: 120.67 },
];

/* ─── Prairie-specific layout options ─── */
export const PRAIRIE_H_BAR_LAYOUTS = [
  { value: 'top-and-bottom', label: 'Top & Bottom' },
  { value: 'top-only', label: 'Top Only' },
  { value: 'bottom-only', label: 'Bottom Only' },
  { value: 'centered', label: 'Centered' },
  { value: 'none', label: 'None' },
];

export const PRAIRIE_V_BAR_LAYOUTS = [
  { value: 'left-and-right', label: 'Left & Right' },
  { value: 'left-only', label: 'Left Only' },
  { value: 'right-only', label: 'Right Only' },
  { value: 'centered', label: 'Centered' },
  { value: 'none', label: 'None' },
];

/* ─── Energy Ratings ─── */
export function computeEnergyRatings(config, cell) {
  let er = 34;
  let shgc = 0.47;
  let vt = 0.52;
  let uFactorIP = 1.53;
  let uFactorSI = 0.27;

  if (config.glazingType === 'triple-pane') {
    er = 42; shgc = 0.28; vt = 0.40; uFactorIP = 1.05; uFactorSI = 0.19;
  }
  if (config.lowECoating1 === 'climaguard-72-57') { shgc -= 0.05; er += 2; }
  else if (config.lowECoating1 === 'climaguard-70-36') { shgc -= 0.12; er += 4; }
  if (config.gasType === 'krypton') { er += 3; uFactorIP -= 0.15; uFactorSI -= 0.03; }
  else if (config.gasType === 'air') { er -= 8; uFactorIP += 0.25; uFactorSI += 0.05; }
  if (config.addFoam) { er += 2; uFactorIP -= 0.05; uFactorSI -= 0.01; }
  if (config.tintFrosting === 'grey-tint' || config.tintFrosting === 'bronze-tint') { shgc -= 0.08; vt -= 0.10; }
  else if (config.tintFrosting === 'frosted') { vt -= 0.25; }

  const mostEfficient = er >= 40;
  const meetsEgress = config.frameWidth >= 20 && cell.height >= 24;

  const glazeCode = config.glazingType === 'triple-pane' ? '3' : '2';
  const typeCode = cell.windowType === 'awning' ? 'AW' : cell.windowType === 'casement' ? 'CA' : 'PW';
  const nrcanModel = `PWM-${typeCode}-${glazeCode},CL-3,8071(${glazeCode})-16AR97SP`;
  const hashBase = config.frameWidth * 1000 + cell.height * 100 + er * 10 + (config.glazingType === 'triple-pane' ? 5 : 0);
  const nrcanRef = `Nr10905-${35751 + (hashBase % 60000)}798-ES5`;

  return {
    er: Math.round(er),
    shgc: Math.round(shgc * 100) / 100,
    vt: Math.round(vt * 100) / 100,
    uFactorIP: Math.round(uFactorIP * 100) / 100,
    uFactorSI: Math.round(uFactorSI * 100) / 100,
    nrcanModel, nrcanRef, mostEfficient, meetsEgress,
  };
}

