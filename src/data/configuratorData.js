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
  awning: '/windows/casement/Casement.glb',
  casement: '/windows/casement/Casement.glb',
  picture: '/windows/casement/Casement.glb',
  'high-fix': '/windows/casement/Casement.glb',
  'single-hung': '/windows/casement/Casement.glb',
  'double-hung': '/windows/casement/Casement.glb',
  'single-slider': '/windows/casement/Casement.glb',
  'double-slider': '/windows/casement/Casement.glb',
  'end-vent': '/windows/casement/Casement.glb',
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
    hardwareColor: 'white',
    openingDirection: windowType === 'picture' || windowType === 'high-fix' ? 'fixed' : 'right',
    screenType: 'regular',
    screenMesh: 'standard',
    lockType: 'standard',
    tiltFeature: 'none',
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

    exteriorColor: 'white',
    interiorColor: 'white',
    addFoam: false,
    brickmould: 'none',
    nailFin: false,

    glazingType: 'double-pane',
    glassThickness: '3mm',
    lowECoating1: 'loe272',
    lowECoating2: 'clear',
    gasType: 'argon',
    spacerType: 'warm-edge',
    spacerColor: 'black',
    tintFrosting: 'none',
    securityGlass: 'none',
    glassDesign: 'clear',

    jambDepth: 'none',
    interiorReturn: 'drywall',
    hardwareFinish: 'satin-nickel',

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
  { value: 'white', label: 'Classic White', hex: '#FAFAFA', icon: '⬜', priceAddon: 0, description: 'Standard' },
  { value: 'almond', label: 'Almond', hex: '#E8DFC8', icon: '🟫', priceAddon: 0, description: 'Standard' },
  { value: 'brick', label: 'Brick Red', hex: '#A0392B', icon: '🔴', priceAddon: 45, description: 'Premium' },
  { value: 'sage', label: 'Heritage Sage', hex: '#7A8467', icon: '🟢', priceAddon: 55, description: 'Premium' },
  { value: 'bronze', label: 'Bronze', hex: '#5C4A3A', icon: '🟤', priceAddon: 65, description: 'Premium' },
  { value: 'charcoal', label: 'Charcoal Grey', hex: '#3A3F45', icon: '🔘', priceAddon: 75, description: 'Premium' },
  { value: 'black', label: 'Architectural Black', hex: '#1F1F1F', icon: '⬛', priceAddon: 85, description: 'Premium' },
];

export const BRICKMOULD_OPTIONS = [
  { value: 'none', label: 'No Brickmould', priceAddon: 0 },
  { value: 'bm-5-8', label: '5/8″ Brick Mould', priceAddon: 25 },
  { value: 'bm-1-1-4', label: '1-1/4″ Brick Mould', priceAddon: 35 },
  { value: 'bm-2', label: '2″ Brick Mould', priceAddon: 48 },
  { value: 'flat', label: 'Flat Brickmould', priceAddon: 32 },
  { value: 'bm-3s-1-1-4-b-5-8', label: 'BM 3-Sides 1-1/4″ Bottom 5/8″', priceAddon: 42 },
  { value: 'bm-3s-2-b-1-1-4', label: 'BM 3-Sides 2″ Bottom 1-1/4″', priceAddon: 55 },
  { value: 'bm-3s-5-8-b-1-1-4', label: 'BM 3-Sides 5/8″ Bottom 1-1/4″', priceAddon: 38 },
  { value: 'nailing-fin-1-1-4-bm', label: 'Nailing Fin With 1-1/4″ BM', priceAddon: 45 },
  { value: 'nailing-flange-only', label: 'Nailing Flange Only', priceAddon: 18 },
];

export const NAILING_FIN_OPTIONS = [
  { value: 'no', label: 'No', priceAddon: 0 },
  { value: 'yes', label: 'Yes', priceAddon: 6.64 },
];

export const CUT_FOR_SIDING_OPTIONS = [
  { value: 'no', label: 'No', priceAddon: 0 },
  { value: 'yes', label: 'Yes', priceAddon: 12.00 },
];

export const GLAZING_TYPES = [
  { value: 'double-pane', label: 'Double Pane Glass', icon: '🪟', priceAddon: 0 },
  { value: 'triple-pane', label: 'Triple Pane Glass', icon: '🪟', priceAddon: 47.50 },
];

export const LOW_E_COATINGS = [
  { value: 'clear', label: 'Clear', priceAddon: 0, description: 'No Low-E coating' },
  { value: 'loe180', label: 'LoĒ-180', priceAddon: 65, description: 'Solar control' },
  { value: 'loe272', label: 'LoĒ-272', priceAddon: 85, description: 'Year-round balance' },
  { value: 'loe366', label: 'LoĒ-366', priceAddon: 95, description: 'Maximum solar block' },
  { value: 'i89', label: 'Cardinal i89', priceAddon: 120, description: 'Cold-climate optimized' },
];

export const GAS_TYPES = [
  { value: 'air', label: 'Air (No Gas)', priceAddon: 0 },
  { value: 'argon', label: 'Argon', priceAddon: 0, description: 'Standard' },
];

export const SPACER_TYPES = [
  { value: 'standard', label: 'Standard Spacer', priceAddon: 0 },
  { value: 'warm-edge', label: 'Endur® Warm-Edge Spacer', priceAddon: 0, description: 'Standard' },
  { value: 'super-spacer', label: 'Super Spacer', priceAddon: 12.00 },
  { value: 'stainless-steel', label: 'Stainless Steel Spacer', priceAddon: 18.00 },
];

export const GLASS_THICKNESS_OPTIONS = [
  { value: '3mm', label: '3mm', priceAddon: 0, description: 'Standard' },
  { value: '4mm', label: '4mm', priceAddon: 8.50 },
  { value: '5mm', label: '5mm', priceAddon: 15.00 },
];

export const TINT_OPTIONS = [
  { value: 'none', label: 'None', priceAddon: 0 },
  { value: 'bronze-tint', label: 'Bronze Tint', priceAddon: 28.00 },
  { value: 'grey-tint', label: 'Grey Tint', priceAddon: 28.00 },
];

export const FROSTED_GLASS_OPTIONS = [
  { value: 'clear', label: 'Clear', priceAddon: 0 },
  { value: 'sandblasted', label: 'Sandblasted', priceAddon: 60.00 },
  { value: 'rain', label: 'Rain', priceAddon: 55.00 },
  { value: 'glue-chip', label: 'Glue Chip', priceAddon: 65.00 },
];

export const SECURITY_GLASS_OPTIONS = [
  { value: 'none', label: 'None', priceAddon: 0 },
  { value: 'laminated', label: 'Laminated', priceAddon: 65.00 },
  { value: 'tempered', label: 'Tempered', priceAddon: 85.00 },
];

/* ─── Hardware Type Options ─── */
export const HARDWARE_TYPE_CASEMENT = [
  { value: 'contemporary', label: 'Contemporary', priceAddon: 0 },
  { value: 'classic', label: 'Classic', priceAddon: 0 },
];

export const HARDWARE_TYPE_SLIDER = [
  { value: 'automatic', label: 'Automatic', priceAddon: 35 },
  { value: 'standard', label: 'Standard', priceAddon: 0 },
];

export const NIGHTLATCH_OPTIONS = [
  { value: 'no', label: 'No', priceAddon: 0 },
  { value: 'yes', label: 'Yes', priceAddon: 25 },
];

/* ─── Screen & Cleaning (from OpenSpec windowExtrasHTML) ─── */
export const SCREEN_MESH_OPTIONS = [
  { value: 'standard', label: 'Standard Fiberglass', priceAddon: 0, description: 'Standard mesh screen' },
  { value: 'aluminum', label: 'Aluminum Mesh', priceAddon: 12.00, description: 'Durable aluminum weave' },
  { value: 'stainless', label: 'Stainless Steel Mesh', priceAddon: 35.00, description: 'Premium corrosion-resistant' },
  { value: 'pet-resistant', label: 'Pet-Resistant Screen', priceAddon: 28.00, description: 'Heavy-duty for pets' },
  { value: 'none', label: 'No Screen', priceAddon: -5.00, description: 'Screen omitted' },
];

/* ─── Safety Options (from OpenSpec safetyOptionsHTML) ─── */
export const SASH_LIMITER_OPTIONS = [
  { value: 'none', label: 'None', priceAddon: 0, description: 'No sash limiter' },
  { value: 'fall', label: 'Fall-prevention stop (4″)', priceAddon: 25, description: 'Limits sash opening to 4″ for child safety' },
  { value: 'lockable', label: 'Lockable vent stop', priceAddon: 45, description: 'Lockable restrictor — blocks full opening until disengaged' },
];

export const TEMPERED_GLASS_OPTIONS = [
  { value: 'standard', label: 'Standard (Annealed)', priceAddon: 0, description: 'Per code in non-hazard locations' },
  { value: 'tempered', label: 'Tempered Safety Glass', priceAddon: 85.00, description: 'CPSC 16 CFR 1201 — required near floors, doors, tubs' },
  { value: 'laminated', label: 'Laminated Security Glass', priceAddon: 185.00, description: 'PVB interlayer holds glass in frame on impact' },
];

/* ─── Hardware Finishes (from OpenSpec HARDWARE_FINISHES) ─── */
export const HARDWARE_FINISHES = [
  { value: 'matching', label: 'Matching Frame', hex: '#D4D4D4', priceAddon: 0 },
  { value: 'satin-nickel', label: 'Satin Nickel', hex: '#C0C5CC', priceAddon: 0 },
  { value: 'oil-bronze', label: 'Oil-Rubbed Bronze', hex: '#3A2A1F', priceAddon: 35 },
  { value: 'matte-black', label: 'Matte Black', hex: '#1A1A1A', priceAddon: 35 },
  { value: 'antique-brass', label: 'Antique Brass', hex: '#A07840', priceAddon: 45 },
];

/* ─── Window Lock Styles (from OpenSpec WINDOW_LOCK_STYLES) ─── */
export const WINDOW_LOCK_STYLES = [
  { value: 'standard', label: 'Standard cam lock', priceAddon: 0 },
  { value: 'night-vent', label: 'Night-vent latch', priceAddon: 15 },
  { value: 'keyed', label: 'Keyed lock', priceAddon: 35 },
  { value: 'finger-latch', label: 'Finger latch', priceAddon: 12 },
];

/* ─── Hung Window Balances (from OpenSpec HUNG_BALANCES) ─── */
export const HUNG_BALANCES = [
  { value: 'block-tackle', label: 'Block-and-tackle', priceAddon: 0 },
  { value: 'constant-force', label: 'Constant-force', priceAddon: 35 },
  { value: 'spiral', label: 'Spiral', priceAddon: -10 },
];

/* ─── Window Operators (casement/awning/hopper only) ─── */
export const WINDOW_OPERATORS = [
  { value: 'crank-folding', label: 'Folding-handle crank', priceAddon: 0 },
  { value: 'crank-standard', label: 'Standard crank', priceAddon: -15 },
  { value: 'pushout', label: 'Push-out (cottage)', priceAddon: 90 },
];

/* ─── Interior Returns (from OpenSpec INTERIOR_RETURNS) ─── */
export const INTERIOR_RETURN_OPTIONS = [
  { value: 'none', label: 'None', priceAddon: 0, description: 'No factory interior return — installer finishes' },
  { value: 'drywall', label: 'Drywall Return 1/2″', priceAddon: 0, description: 'Standard — homeowner drywalls after install' },
  { value: 'wood', label: 'Wood Return 3/4″', priceAddon: 185, description: 'Factory-applied wood return, ready for paint or stain' },
];

/* ─── Jamb Extension Depths (from OpenSpec JAMB_DEPTHS — full catalog) ─── */
export const JAMB_DEPTH_OPTIONS = [
  // No jamb
  { value: 'none', label: 'No Jamb Extension', priceAddon: 0, group: 'None', description: 'No jamb extension' },
  // Vinyl-J + Casing combos
  { value: 'vinylj-1-3-8-2-5-8', label: 'Vinyl-J 1⅜″ + Casing 2⅝″', priceAddon: 35, group: 'Vinyl jamb + casing', description: 'Vinyl jamb · attached casing' },
  { value: 'vpj-1-3-8-2-5-8-r', label: 'VP-J 1⅜″ + Casing 2⅝″-R', priceAddon: 42, group: 'Vinyl jamb + casing', description: 'Vinyl-PVC composite · revealed' },
  { value: 'vinylj-1-3-8-3-3-8', label: 'Vinyl-J 1⅜″ + Casing 3⅜″', priceAddon: 48, group: 'Vinyl jamb + casing', description: 'Vinyl jamb · wide casing' },
  { value: 'vpj-1-3-8-3-3-8-r', label: 'VP-J 1⅜″ + Casing 3⅜″-R', priceAddon: 55, group: 'Vinyl jamb + casing', description: 'Vinyl-PVC composite · wide revealed' },
  { value: 'vinylj-2-3-8-2-5-8', label: 'Vinyl-J 2⅜″ + Casing 2⅝″', priceAddon: 48, group: 'Vinyl jamb + casing', description: 'Vinyl jamb · attached casing' },
  { value: 'vpj-2-3-8-2-5-8-r', label: 'VP-J 2⅜″ + Casing 2⅝″-R', priceAddon: 55, group: 'Vinyl jamb + casing', description: 'Vinyl-PVC composite · revealed' },
  { value: 'vinylj-2-3-8-3-3-8', label: 'Vinyl-J 2⅜″ + Casing 3⅜″', priceAddon: 62, group: 'Vinyl jamb + casing', description: 'Vinyl jamb · wide casing' },
  { value: 'vpj-2-3-8-3-3-8-r', label: 'VP-J 2⅜″ + Casing 3⅜″-R', priceAddon: 68, group: 'Vinyl jamb + casing', description: 'Vinyl-PVC composite · wide revealed' },
  { value: 'vinylj-3-3-8-2-5-8', label: 'Vinyl-J 3⅜″ + Casing 2⅝″', priceAddon: 65, group: 'Vinyl jamb + casing', description: 'Vinyl jamb · attached casing' },
  { value: 'vpj-3-3-8-2-5-8-r', label: 'VP-J 3⅜″ + Casing 2⅝″-R', priceAddon: 72, group: 'Vinyl jamb + casing', description: 'Vinyl-PVC composite · revealed' },
  { value: 'vinylj-3-3-8-3-3-8', label: 'Vinyl-J 3⅜″ + Casing 3⅜″', priceAddon: 78, group: 'Vinyl jamb + casing', description: 'Vinyl jamb · wide casing' },
  { value: 'vpj-3-3-8-3-3-8-r', label: 'VP-J 3⅜″ + Casing 3⅜″-R', priceAddon: 85, group: 'Vinyl jamb + casing', description: 'Vinyl-PVC composite · wide revealed' },
  { value: 'vinylj-4-3-8-2-5-8', label: 'Vinyl-J 4⅜″ + Casing 2⅝″', priceAddon: 82, group: 'Vinyl jamb + casing', description: 'Vinyl jamb · attached casing' },
  { value: 'vpj-4-3-8-2-5-8-r', label: 'VP-J 4⅜″ + Casing 2⅝″-R', priceAddon: 88, group: 'Vinyl jamb + casing', description: 'Vinyl-PVC composite · revealed' },
  { value: 'vinylj-4-3-8-3-3-8', label: 'Vinyl-J 4⅜″ + Casing 3⅜″', priceAddon: 95, group: 'Vinyl jamb + casing', description: 'Vinyl jamb · wide casing' },
  { value: 'vpj-4-3-8-3-3-8-r', label: 'VP-J 4⅜″ + Casing 3⅜″-R', priceAddon: 105, group: 'Vinyl jamb + casing', description: 'Vinyl-PVC composite · wide revealed' },
  // Vinyl Jamb only (no casing)
  { value: 'vinyl-jamb-1-3-8', label: 'Vinyl Jamb 1⅜″ (No Casing)', priceAddon: 22, group: 'Vinyl jamb only', description: 'Jamb only · no casing' },
  { value: 'vinyl-jamb-2-3-8', label: 'Vinyl Jamb 2⅜″ (No Casing)', priceAddon: 32, group: 'Vinyl jamb only', description: 'Jamb only · no casing' },
  { value: 'vinyl-jamb-3-3-8', label: 'Vinyl Jamb 3⅜″ (No Casing)', priceAddon: 42, group: 'Vinyl jamb only', description: 'Jamb only · no casing' },
  { value: 'vinyl-jamb-4-3-8', label: 'Vinyl Jamb 4⅜″ (No Casing)', priceAddon: 52, group: 'Vinyl jamb only', description: 'Jamb only · no casing' },
  // Wood Ext Primed — Loose
  { value: 'wood-ext-primed-loose-3-5', label: 'Wood Ext Primed Loose ≤3.5″', priceAddon: 78, group: 'Wood extension — primed pine', description: 'Pine, primed · field-attached' },
  { value: 'wood-ext-primed-loose-4-5', label: 'Wood Ext Primed Loose ≤4.5″', priceAddon: 92, group: 'Wood extension — primed pine', description: 'Pine, primed · field-attached' },
  { value: 'wood-ext-primed-loose-5-5', label: 'Wood Ext Primed Loose ≤5.5″', priceAddon: 108, group: 'Wood extension — primed pine', description: 'Pine, primed · field-attached' },
  { value: 'wood-ext-primed-loose-7-25', label: 'Wood Ext Primed Loose ≤7.25″', priceAddon: 145, group: 'Wood extension — primed pine', description: 'Pine, primed · field-attached' },
  { value: 'wood-ext-primed-loose-9-25', label: 'Wood Ext Primed Loose ≤9.25″', priceAddon: 185, group: 'Wood extension — primed pine', description: 'Pine, primed · field-attached' },
  { value: 'wood-ext-primed-loose-12', label: 'Wood Ext Primed Loose ≤12″', priceAddon: 235, group: 'Wood extension — primed pine', description: 'Pine, primed · field-attached' },
  // Wood Ext Primed — Factory-Attached
  { value: 'wood-ext-primed-3-5', label: 'Wood Ext Primed ≤3.5″', priceAddon: 115, group: 'Wood extension — primed pine', description: 'Pine, primed · factory-attached' },
  { value: 'wood-ext-primed-4-5', label: 'Wood Ext Primed ≤4.5″', priceAddon: 135, group: 'Wood extension — primed pine', description: 'Pine, primed · factory-attached' },
  { value: 'wood-ext-primed-5-5', label: 'Wood Ext Primed ≤5.5″', priceAddon: 158, group: 'Wood extension — primed pine', description: 'Pine, primed · factory-attached' },
  { value: 'wood-ext-primed-7-25', label: 'Wood Ext Primed ≤7.25″', priceAddon: 215, group: 'Wood extension — primed pine', description: 'Pine, primed · factory-attached' },
  { value: 'wood-ext-primed-9-25', label: 'Wood Ext Primed ≤9.25″', priceAddon: 285, group: 'Wood extension — primed pine', description: 'Pine, primed · factory-attached' },
  { value: 'wood-ext-primed-12', label: 'Wood Ext Primed ≤12″', priceAddon: 365, group: 'Wood extension — primed pine', description: 'Pine, primed · factory-attached' },
];

/* ─── Brickmould Catalog (from OpenSpec BRICK_MOULDS) ─── */
export const BRICKMOULD_CATALOG = [
  { value: 'none', label: 'None', width: 0, priceAddon: 0 },
  { value: 'bm-5-8', label: '5/8″ Brick Mould', width: 0.625, priceAddon: 25 },
  { value: 'bm-1-1-4', label: '1-1/4″ Brick Mould', width: 1.25, priceAddon: 35 },
  { value: 'bm-2', label: '2″ Brick Mould', width: 2, priceAddon: 48 },
  { value: 'flat', label: 'Flat Brickmould', width: 1.5, priceAddon: 32 },
  { value: 'bm-3s-1-1-4-b-5-8', label: 'BM-3 Sides 1-1/4 Bottom 5/8', width: 1.25, priceAddon: 42 },
  { value: 'bm-3s-2-b-1-1-4', label: 'BM-3 Sides 2″ Bottom 1-1/4', width: 2, priceAddon: 55 },
  { value: 'nailing-fin-1-1-4-bm', label: 'Nailing Fin with 1-1/4 BM', width: 1.25, priceAddon: 45 },
  { value: 'nailing-flange-only', label: 'Nailing Flange Only', width: 0, priceAddon: 18 },
];

/* ─── Hinge Count Options (for casement/awning windows) ─── */
export const HINGE_COUNT_OPTIONS = [
  { value: 2, label: '2 Hinges', priceAddon: 0 },
  { value: 3, label: '3 Hinges', priceAddon: 25 },
  { value: 4, label: '4 Hinges', priceAddon: 55 },
];

/* ─── Window Screens (from OpenSpec WINDOW_SCREENS) ─── */
export const WINDOW_SCREEN_OPTIONS = [
  { value: 'standard', label: 'Standard Fiberglass Mesh', priceAddon: 0 },
  { value: 'fine', label: 'Fine No-See-Um Mesh', priceAddon: 35 },
  { value: 'solar', label: 'Solar-Shading Mesh', priceAddon: 65 },
  { value: 'pet', label: 'Pet-Resistant Mesh', priceAddon: 55 },
  { value: 'none', label: 'No Screen', priceAddon: -25 },
];

/* ─── Tilt Features (from OpenSpec TILT_FEATURES) ─── */
export const TILT_FEATURE_OPTIONS = [
  { value: 'none', label: 'No tilt-in cleaning', priceAddon: 0 },
  { value: 'bottom', label: 'Bottom sash tilt-in', priceAddon: 30 },
  { value: 'both', label: 'Both sashes tilt-in', priceAddon: 55 },
];

/* ─── Glass Designs (from OpenSpec GLASS_DESIGNS — top picks) ─── */
export const GLASS_DESIGN_OPTIONS = [
  { value: 'clear', label: 'Clear Glass', priceAddon: 0, description: 'Clear annealed/tempered IGU' },
  { value: 'frosted', label: 'Frosted', priceAddon: 45, description: 'Even acid-etched privacy' },
  { value: 'satin', label: 'Satin Finish', priceAddon: 55, description: 'Smooth velvet diffusion' },
  { value: 'sandblasted', label: 'Sandblasted Finish', priceAddon: 60, description: 'Uniform heavy frost' },
  { value: 'pure', label: 'Pure', priceAddon: 70, description: 'Frost field, horizontal accent' },
  { value: 'mist', label: 'Mist', priceAddon: 75, description: 'Fine stippled privacy' },
  { value: 'kira', label: 'Kira', priceAddon: 80, description: 'Horizontal reeded bands' },
  { value: 'azur', label: 'Azur', priceAddon: 85, description: 'Fine horizontal reeded' },
  { value: 'screen', label: 'Screen Glass', priceAddon: 90, description: 'Mesh cross-hatch' },
  { value: 'nuando', label: 'Nuando', priceAddon: 95, description: 'Gradient frost shading' },
  { value: 'masterline', label: 'Masterline Glass', priceAddon: 100, description: 'Broad horizontal slats' },
  { value: 'opal', label: 'Opal', priceAddon: 115, description: 'Clean rectilinear leadwork' },
  { value: 'chanelle', label: 'Chanelle', priceAddon: 115, description: 'Top grid + frost field' },
  { value: 'distinction', label: 'Distinction', priceAddon: 125, description: 'Dotted cross overlay' },
  { value: 'avenue', label: 'Avenue', priceAddon: 130, description: 'T-bar with hammered band' },
  { value: 'belmont', label: 'Belmont', priceAddon: 130, description: 'Frosted half with crossbar' },
  { value: 'arima', label: 'Arima', priceAddon: 135, description: 'Vertical leadwork, inset rect' },
  { value: 'equation', label: 'Equation', priceAddon: 140, description: 'Thick cross with texture' },
  { value: 'soft', label: 'Soft', priceAddon: 140, description: 'Diamond quilted texture' },
  { value: 'bolero', label: 'Bolero', priceAddon: 155, description: 'Diagonal break with reeded' },
  { value: 'alys', label: 'Alys', priceAddon: 155, description: 'Organic grass curves' },
  { value: 'nobel', label: 'Nobel', priceAddon: 160, description: 'Cross with reeded quadrant' },
  { value: 'portrait', label: 'Portrait', priceAddon: 160, description: 'Tall side borders, hammered' },
  { value: 'bistro', label: 'Bistro', priceAddon: 160, description: 'Arched, floral top panel' },
  { value: 'liano', label: 'Liano', priceAddon: 170, description: 'Arched lead, diamond inserts' },
  { value: 'winchester', label: 'Winchester', priceAddon: 170, description: 'Corner-accent leadwork' },
  { value: 'celeste', label: 'Celeste', priceAddon: 175, description: 'Prairie border, reeded panel' },
  { value: 'louisbourg', label: 'Louisbourg', priceAddon: 175, description: 'Traditional rectilinear arch' },
  { value: 'cachet', label: 'Cachet', priceAddon: 185, description: 'Prairie cluster leadwork' },
  { value: 'kallima', label: 'Kallima', priceAddon: 190, description: 'Mondrian-style block panels' },
];

export const SPACER_COLOR_OPTIONS = [
  { value: 'white', label: 'White', priceAddon: 0 },
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
  { value: 'white', label: 'White', icon: '⬜', priceAddon: 0 },
  { value: 'almond', label: 'Almond', icon: '🟫', priceAddon: 0 },
  { value: 'black', label: 'Black', icon: '⬛', priceAddon: 8.00 },
];

export const OPENING_DIRECTIONS = [
  { value: 'left', label: 'Left Hinge', icon: '◀️' },
  { value: 'right', label: 'Right Hinge', icon: '▶️' },
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
  { value: 'none', label: 'None', icon: '⊠', priceAddon: 0 },
  { value: 'colonial', label: 'Colonial', icon: '▦', priceAddon: 0, description: 'Evenly-spaced grid pattern' },
  { value: 'prairie', label: 'Prairie', icon: '⊞', priceAddon: 0, description: 'Perimeter bars with open center' },
  { value: 'ladder', label: 'Ladder', icon: '☰', priceAddon: 0, description: 'Horizontal bars only' },
  { value: 'diamond', label: 'Diamond', icon: '◇', priceAddon: 0, description: 'Diagonal crossing bars' },
];

export const GRILL_BAR_TYPES = [
  { value: 'flat', label: 'Flat', priceAddon: 0, description: 'Flat bar between panes' },
  { value: 'georgian', label: 'Georgian', priceAddon: 0, description: 'Beveled profile, classic look' },
  { value: 'pencil', label: 'Pencil', priceAddon: 0, description: 'Slim rounded bar' },
  { value: 'sdl', label: 'SDL (Flat or Colonial Design)', priceAddon: 0, description: 'Simulated Divided Lite — bars on both sides of glass' },
];

/* Per-bar-type sizes — keyed by bar type value */
export const GRILL_BAR_SIZES_BY_TYPE = {
  flat: [
    { value: '5/16', label: '5/16"' },
    { value: '5/8', label: '5/8"' },
    { value: '1', label: '1"' },
  ],
  georgian: [
    { value: '3/4', label: '3/4"' },
    { value: '1', label: '1"' },
  ],
  pencil: [
    { value: '1/4', label: '1/4"' },
  ],
  sdl: [
    { value: '3/4', label: '3/4"' },
    { value: '1', label: '1"' },
    { value: '1-1/4', label: '1 1/4"' },
    { value: '2', label: '2"' },
  ],
};

/* Flat fallback for legacy code that imports GRILL_BAR_SIZES */
export const GRILL_BAR_SIZES = [
  { value: '5/16', label: '5/16"', priceAddon: 0 },
  { value: '5/8', label: '5/8"', priceAddon: 0 },
  { value: '1', label: '1"', priceAddon: 0 },
];

export const GRILL_COLORS = [
  { value: 'white', label: 'White', priceAddon: 0 },
  { value: 'black', label: 'Black', priceAddon: 120.67 },
  { value: 'pewter', label: 'Pewter', priceAddon: 120.67 },
  { value: 'brass', label: 'Brass', priceAddon: 120.67 },
  { value: 'frame-match', label: 'Frame Match', priceAddon: 0 },
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
  if (config.lowECoating1 === 'loe180') { shgc -= 0.05; er += 2; }
  else if (config.lowECoating1 === 'loe272') { shgc -= 0.10; er += 4; }
  else if (config.lowECoating1 === 'loe366') { shgc -= 0.15; er += 6; }
  else if (config.lowECoating1 === 'i89') { shgc -= 0.12; er += 8; }
  if (config.gasType === 'air') { er -= 8; uFactorIP += 0.25; uFactorSI += 0.05; }
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

