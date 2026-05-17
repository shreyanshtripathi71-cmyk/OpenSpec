/* ================================================================
   OpenSpec — Factory Owner Portal Application Logic
   
   This file contains all the business logic for the factory portal.
   
   React Component Mapping:
   - State management  → Use React Context or Zustand store
   - renderDashboard() → <DashboardView />
   - renderOrders()    → <OrdersView />
   - renderSchedule()  → <ScheduleView />
   - renderInventory() → <InventoryView />
   - renderSettings()  → <SettingsView />
   - renderReports()   → <ReportsView />
   
   Key Data Models:
   - state.orders[]    → Order objects with specs, BOM, timeline
   - state.machines[]  → Machine objects with capacity, schedule
   - state.materials[] → Material objects with stock levels
   ================================================================ */

/* ════════════════════════════════════════════════
   STATE — single source of truth
   ════════════════════════════════════════════════ */

const TODAY = new Date('2026-05-10');

const state = {
  currentView: 'dashboard',
  selectedOrderId: 2410,
  productionTab: 'live',  // 'live' | 'orders' | 'quotes' | 'tasks' | 'issues' | 'planning'
  ordersFilter: 'all',    // 'all' | 'new' | 'ack' | 'production' | 'ready' | 'shipped' | 'delivered'
  ordersSort: { col: 'shipBy', dir: 'asc' },  // table sort
  orderDetailFullscreen: false,
  orderDetailReturnTo: null,  // { view, productionTab } — where back returns to
  navHistory: [],             // stack of nav snapshots for the global Back button
  forwardModal: { open: false }, // forward-to-factory compose modal state
  pipelineFilter: 'all',      // active stage filter on the Production pipeline view
  estimatesFilter: 'all',     // active stage filter on the Estimates view
  search: {                   // per-tab search terms — independent across tabs
    overview: '',
    estimates: '',
    production: '',
    qc: '',
    shipping: '',
    quotes: '',
    catalog: '',
    materials: ''
  },
  shippingTab: 'outbound',    // 'outbound' (orders to dealers) | 'inbound' (POs from suppliers)
  calendarView: 'day',  // 'month' | 'week' | 'day'
  calendarDate: '2026-05-12',  // anchor date for the current view (today)
  calendarSelectedDay: null,
  catalogTab: 'products',
  catalogCategoryFilter: 'all',  // 'all' | 'window' | 'entry-door' | 'patio-door' | 'garage-door'
  catalogStatusFilter: 'all',    // 'all' | 'enabled' | 'disabled' | 'draft'
  componentCategoryFilter: 'all', // 'all' | 'glass' | 'hardware' | 'weatherstrip' | 'screen' | 'trim' | 'misc'
  componentStatusFilter: 'all',   // 'all' | 'enabled' | 'disabled' | 'base'
  pricingTableProductId: 1,
  pricingImport: {
    step: 'upload', fileName: null, fileSize: 0,
    sheets: [], activeSheetIdx: 0,
    targetProductId: null, importMode: 'replace', errors: []
  },
  pricingTables: {
    'casement-4500': {
      lastUpdated: '2026-03-15', uploadedBy: 'Sam Chen',
      sourceFile: 'casement-4500-pricesheet-Q1-2026.xlsx', version: 'v3',
      widths: [600, 750, 900, 1050, 1200, 1350, 1500],
      heights: [600, 750, 900, 1050, 1200, 1350, 1500, 1650, 1800],
      grid: {
        '600x600': 880, '600x750': 920, '600x900': 980, '600x1050': 1040, '600x1200': 1100, '600x1350': 1160, '600x1500': 1220, '600x1650': 1280, '600x1800': 1340,
        '750x600': 940, '750x750': 1000, '750x900': 1080, '750x1050': 1160, '750x1200': 1240, '750x1350': 1320, '750x1500': 1400, '750x1650': 1480, '750x1800': 1560,
        '900x600': 1020, '900x750': 1100, '900x900': 1200, '900x1050': 1300, '900x1200': 1400, '900x1350': 1500, '900x1500': 1600, '900x1650': 1700, '900x1800': 1800,
        '1050x600': 1120, '1050x750': 1220, '1050x900': 1340, '1050x1050': 1460, '1050x1200': 1580, '1050x1350': 1700, '1050x1500': 1820, '1050x1650': 1940, '1050x1800': 2060,
        '1200x600': 1240, '1200x750': 1360, '1200x900': 1500, '1200x1050': 1640, '1200x1200': 1780, '1200x1350': 1920, '1200x1500': 2060, '1200x1650': 2200, '1200x1800': 2340,
        '1350x600': 1380, '1350x750': 1520, '1350x900': 1680, '1350x1050': 1840, '1350x1200': 2000, '1350x1350': 2160, '1350x1500': 2320, '1350x1650': 2480, '1350x1800': 2640,
        '1500x600': 1540, '1500x750': 1700, '1500x900': 1880, '1500x1050': 2060, '1500x1200': 2240, '1500x1350': 2420, '1500x1500': 2600, '1500x1650': 2780, '1500x1800': 2960
      },
      colorMultipliers: {
        'white': 1.00, 'almond': 1.00, 'sand': 1.02,
        'commercial-brown': 1.05, 'bronze': 1.05,
        'black-laminate': 1.12, 'woodgrain': 1.18
      },
      glazingDeltas: {
        'dbl-clear': -180, 'dbl-lowe-272-ar': 0, 'dbl-lowe-180': 120,
        'dbl-lowe-366': 140, 'trp-lowe-kr': 280, 'trp-lowe-kr-tempered': 380
      }
    }
  },
  catalogImport: {
    step: 'upload',  // 'upload' | 'preview' | 'done'
    fileName: null,
    fileSize: 0,
    rawRows: null,        // array of arrays (row-level)
    headers: null,        // first row
    fieldMapping: {},     // { 'Product Name': 'name', ... }
    importMode: 'merge',  // 'replace' | 'merge' | 'append'
    errors: [],
    warnings: [],
    importedCount: 0,
    skippedCount: 0,
    updatedCount: 0
  },
  pricingTab: 'tiers',
  financialsTab: 'pnl',
  financialsPeriod: 'ytd',
  auditFilter: 'all',  // 'all' | 'own' | 'dealer'
  settingsTab: 'profile',
  // ═════════════ v32 Tranche 1 state ═════════════
  notifPanelOpen: false,
  notifTab: 'all',  // 'all' | 'urgent' | 'unread'
  notifications: [
    { id: 1, kind: 'rush', urgency: 'urgent', headline: 'Rush request P1', detail: 'Sunrise · Cedar Park Estate · Q-2407', at: '2026-05-10T08:14:00Z', read: false, link: { view: 'production', tab: 'rush' } },
    { id: 2, kind: 'warranty', urgency: 'urgent', headline: 'Warranty claim flagged', detail: 'Maple Street · IGU seal failure × 2', at: '2026-05-10T07:52:00Z', read: false, link: { view: 'production', tab: 'warranty' } },
    { id: 3, kind: 'reorder', urgency: 'warn', headline: '3 materials below reorder point', detail: 'VEKA Bronze · Black-lam · Cardinal IGU triple', at: '2026-05-10T06:00:00Z', read: false, link: { view: 'materials', tab: 'reorder' } },
    { id: 4, kind: 'overdue', urgency: 'urgent', headline: 'O-2402 — 18 days late', detail: 'Windermere Heights · not delivered', at: '2026-05-10T06:00:00Z', read: false, link: { view: 'production', tab: 'orders' } },
    { id: 5, kind: 'ar', urgency: 'warn', headline: '$12,400 A/R aged 60+ days', detail: 'Coastline Builders', at: '2026-05-10T06:00:00Z', read: true, link: { view: 'financials', tab: 'ar' } },
    { id: 6, kind: 'machine', urgency: 'warn', headline: 'Stürtz Corner Cleaner offline', detail: '22h connection timeout', at: '2026-05-09T14:22:00Z', read: false, link: { view: 'settings', tab: 'machines' } },
    { id: 7, kind: 'po-arriving', urgency: 'info', headline: 'PO-2026-0058 arriving today', detail: 'VEKA · 2 SKUs · $36K', at: '2026-05-10T08:00:00Z', read: true, link: { view: 'materials', tab: 'pos' } },
    { id: 8, kind: 'dealer-invite', urgency: 'info', headline: 'Dealer invite expires in 10 days', detail: 'Lakeside Windows', at: '2026-05-09T10:00:00Z', read: false, link: { view: 'dealers' } },
    { id: 9, kind: 'drawing', urgency: 'warn', headline: '2 drawings awaiting sign-off', detail: '3+ days overdue · dealer hold', at: '2026-05-08T12:00:00Z', read: true, link: { view: 'production', tab: 'drawings' } },
    { id: 10, kind: 'qc-fail', urgency: 'warn', headline: 'QC failed — frame weld defect', detail: 'O-2399 Stonebridge · 1 unit held', at: '2026-05-09T15:30:00Z', read: false, link: { view: 'production', tab: 'qc' } }
  ],
  // Pending approvals — owner inbox
  approvals: [
    { id: 'apr-001', kind: 'discount', urgency: 'normal', title: 'Custom discount request: Sunrise Windows',  detail: 'Override Tier A 0.58 → 0.54 (8.5% extra off) · 12-month commitment',     amount: 'Annual impact: −$8,400 GP', requestedBy: 'Marcus Hill', requestedAt: '2026-05-10T08:00:00Z' },
    { id: 'apr-002', kind: 'po', urgency: 'normal', title: 'PO over threshold: Cardinal IG Q2 contract',          detail: 'Triple-pane IGU bulk order · 800 m² · 60-day lead',                       amount: '$73,600 USD',          requestedBy: 'Marcus Hill', requestedAt: '2026-05-10T07:30:00Z' },
    { id: 'apr-003', kind: 'warranty', urgency: 'urgent', title: 'Warranty remake approval: Maple Street IGU × 2',  detail: '2 casement IGUs failed at 18 months · Cardinal 272 / Argon · refit on Q-2390', amount: '$1,840 cost',         requestedBy: 'Lin Park',    requestedAt: '2026-05-10T07:52:00Z' },
    { id: 'apr-004', kind: 'rush',    urgency: 'urgent', title: 'P1 rush fee waiver: Cedar Park Estate',            detail: 'Customer is GC builder · long-term relationship · waive 15% rush surcharge', amount: '−$3,200 fee waiver', requestedBy: 'Lin Park',    requestedAt: '2026-05-10T08:14:00Z' },
    { id: 'apr-005', kind: 'dealer',  urgency: 'normal', title: 'New dealer application: Granite Builders Supply',   detail: 'Kingston, ON · Net 30 · est. $250K annual · references checked',           amount: '',                    requestedBy: 'Sam Chen',    requestedAt: '2026-05-09T16:00:00Z' },
    { id: 'apr-006', kind: 'price',   urgency: 'normal', title: 'Catalog price change: +5% across Casement family',  detail: 'Quarterly price update · 3 products affected · effective May 15',         amount: 'Est. +$24K annual revenue', requestedBy: 'Marcus Hill', requestedAt: '2026-05-09T14:00:00Z' }
  ],
  // Reseller tiers (3rd tier under dealer)
  resellerTiers: [
    { id: 1, code: 'R1', name: 'Reseller R1 — Premier', dealerMarkup: 0.85, description: 'Top-volume resellers · pays 85% of dealer cost' },
    { id: 2, code: 'R2', name: 'Reseller R2 — Standard', dealerMarkup: 0.92, description: 'Mid-volume · pays 92% of dealer cost' },
    { id: 3, code: 'R3', name: 'Reseller R3 — Starter', dealerMarkup: 0.98, description: 'New / low-volume · pays 98% of dealer cost' }
  ],
  resellers: [
    { id: 'granite', name: 'Granite Stone Renovations', parentDealerId: 'sunrise', region: 'Kingston · ON', avatar: 'GR', gradient: 'linear-gradient(135deg, #475569 0%, #94A3B8 100%)', tierId: 2, ytdOrders: 8, ytdVolume: 18400, joinedAt: '2025-09-12' },
    { id: 'lakebreeze', name: 'Lakebreeze Glazing', parentDealerId: 'maple', region: 'Niagara · ON', avatar: 'LB', gradient: 'linear-gradient(135deg, #0E7490 0%, #06B6D4 100%)', tierId: 1, ytdOrders: 14, ytdVolume: 32800, joinedAt: '2024-11-04' }
  ],
  // FX rates
  fxRates: [
    { pair: 'USD/CAD', rate: 1.3640, prev: 1.3582, asOf: '2026-05-10T07:00:00Z', source: 'BoC noon rate' },
    { pair: 'EUR/CAD', rate: 1.4920, prev: 1.4880, asOf: '2026-05-10T07:00:00Z', source: 'BoC noon rate' }
  ],
  // QC inspections data
  qcInspections: [
    {
      id: 'qc-1', orderId: 2407, bayId: 'qc-bay-1', unitRange: 'Units 1-6 of 22',
      inspector: 'Lin Park', status: 'passed', inspectedAt: '2026-05-09T16:30:00Z',
      checks: [
        { id: 'weld', label: 'Frame weld integrity', status: 'pass' },
        { id: 'square', label: 'Squareness ±2mm', status: 'pass' },
        { id: 'igu', label: 'IGU seating', status: 'pass' },
        { id: 'hardware', label: 'Hardware operation', status: 'pass' },
        { id: 'finish', label: 'Surface finish', status: 'pass' },
        { id: 'weatherstrip', label: 'Weatherstrip seating', status: 'pass' }
      ]
    },
    {
      id: 'qc-2', orderId: 2399, bayId: 'qc-bay-1', unitRange: 'Units 8-9 of 11',
      inspector: 'Lin Park', status: 'failed', inspectedAt: '2026-05-09T15:30:00Z',
      defect: 'Frame weld defect on Unit 8 corner B — visible gap > 0.5mm',
      action: 'Hold for rework. Re-weld + re-inspect',
      checks: [
        { id: 'weld', label: 'Frame weld integrity', status: 'fail' },
        { id: 'square', label: 'Squareness ±2mm', status: 'pass' },
        { id: 'igu', label: 'IGU seating', status: 'pending' },
        { id: 'hardware', label: 'Hardware operation', status: 'pending' },
        { id: 'finish', label: 'Surface finish', status: 'pending' },
        { id: 'weatherstrip', label: 'Weatherstrip seating', status: 'pending' }
      ]
    },
    {
      id: 'qc-3', orderId: 2404, bayId: 'qc-bay-2', unitRange: 'Units 1-12 of 20',
      inspector: 'Lin Park', status: 'in-progress', inspectedAt: '2026-05-10T08:00:00Z',
      checks: [
        { id: 'weld', label: 'Frame weld integrity', status: 'pass' },
        { id: 'square', label: 'Squareness ±2mm', status: 'pass' },
        { id: 'igu', label: 'IGU seating', status: 'pending' },
        { id: 'hardware', label: 'Hardware operation', status: 'pending' },
        { id: 'finish', label: 'Surface finish', status: 'pending' },
        { id: 'weatherstrip', label: 'Weatherstrip seating', status: 'pending' }
      ]
    }
  ],
  // Provenance — recent edit attribution per editable field
  provenance: {
    // key format: 'entity:id:field' → { actor, at }
    'product:1:msrp': { actor: 'Sam Chen', at: '2026-05-09T14:22:00Z' },
    'product:1:factoryCost': { actor: 'Marcus Hill', at: '2026-05-08T11:30:00Z' },
    'dealer:sunrise:customMultiplier': { actor: 'Sam Chen', at: '2026-05-09T16:14:00Z' },
    'dealer:maple:tierId': { actor: 'Marcus Hill', at: '2026-04-22T10:00:00Z' }
  },
  // Search recent queries
  globalSearchQuery: '',
  globalSearchOpen: false,
  globalSearchFocus: 0,

  // ═════════════ TRANCHE 2 STATE ═════════════
  // Catalog snapshots (immutable history per ADR-002)
  catalogSnapshots: [
    { id: 19, version: 'v19', label: 'Spring 2026 reprice', createdAt: '2026-05-10T08:14:00Z', author: 'Sam Chen', changes: { added: 4, removed: 0, priceChanges: 31 }, isCurrent: true },
    { id: 18, version: 'v18', label: 'Casement family +5%', createdAt: '2026-05-09T14:00:00Z', author: 'Marcus Hill', changes: { added: 0, removed: 0, priceChanges: 3 }, isCurrent: false },
    { id: 17, version: 'v17', label: 'Q1 2026 catalog refresh', createdAt: '2026-04-15T10:30:00Z', author: 'Sam Chen', changes: { added: 6, removed: 2, priceChanges: 18 }, isCurrent: false },
    { id: 16, version: 'v16', label: 'Garage door line launch', createdAt: '2026-03-22T13:00:00Z', author: 'Sam Chen', changes: { added: 3, removed: 0, priceChanges: 0 }, isCurrent: false },
    { id: 15, version: 'v15', label: 'Annual price increase 3%', createdAt: '2026-01-02T09:00:00Z', author: 'Sam Chen', changes: { added: 0, removed: 0, priceChanges: 48 }, isCurrent: false }
  ],
  snapshotVersion: 19,

  // Drawings — separate from order.drawings, more detailed for the approval cycle
  drawingsLibrary: [
    { id: 'dr-1', orderId: 2407, version: 'Rev B', status: 'in-review', uploadedBy: 'Lin Park', uploadedAt: '2026-05-08T14:00:00Z', dueBy: '2026-05-12', dealerActor: null, comments: 1, fileSize: '2.4 MB', pages: 8 },
    { id: 'dr-2', orderId: 2404, version: 'Rev A', status: 'revise', uploadedBy: 'Lin Park', uploadedAt: '2026-05-06T10:00:00Z', dueBy: '2026-05-10', dealerActor: 'Rafi B.', comments: 3, fileSize: '1.8 MB', pages: 6 },
    { id: 'dr-3', orderId: 2409, version: 'Rev A', status: 'in-review', uploadedBy: 'Lin Park', uploadedAt: '2026-05-09T16:00:00Z', dueBy: '2026-05-13', dealerActor: null, comments: 0, fileSize: '3.1 MB', pages: 10 }
  ],

  // Glazing package library
  glazingPackages: [
    { id: 'gp-1', name: 'Standard Low-E Double', glassConfig: 'Clear / Low-E 272 / Clear', spacer: 'Super Spacer', gas: 'Argon', uFactor: 0.28, shgc: 0.30, vt: 0.52, costPerM2: 78, msrpPerM2: 195, productsUsing: 18, enabled: true },
    { id: 'gp-2', name: 'Premium Low-E Triple', glassConfig: 'Clear / Low-E 366 / Clear / Low-E 180 / Clear', spacer: 'Super Spacer', gas: 'Krypton', uFactor: 0.17, shgc: 0.25, vt: 0.42, costPerM2: 145, msrpPerM2: 360, productsUsing: 9, enabled: true },
    { id: 'gp-3', name: 'Tempered Safety Double', glassConfig: 'Tempered / Low-E 272 / Tempered', spacer: 'Super Spacer', gas: 'Argon', uFactor: 0.29, shgc: 0.28, vt: 0.50, costPerM2: 112, msrpPerM2: 280, productsUsing: 6, enabled: true },
    { id: 'gp-4', name: 'Laminated Sound', glassConfig: 'Clear / Low-E 272 / Laminated 6.4mm', spacer: 'Super Spacer', gas: 'Argon', uFactor: 0.30, shgc: 0.30, vt: 0.50, costPerM2: 158, msrpPerM2: 395, productsUsing: 3, enabled: true },
    { id: 'gp-5', name: 'High-VT Picture (south)', glassConfig: 'Clear / Low-E 180 / Clear', spacer: 'Super Spacer', gas: 'Argon', uFactor: 0.30, shgc: 0.42, vt: 0.65, costPerM2: 82, msrpPerM2: 205, productsUsing: 4, enabled: true },
    { id: 'gp-6', name: 'Tempered Triple (passive)', glassConfig: 'Tempered / Low-E 366 / Clear / Low-E 180 / Tempered', spacer: 'Super Spacer', gas: 'Krypton', uFactor: 0.13, shgc: 0.25, vt: 0.40, costPerM2: 220, msrpPerM2: 550, productsUsing: 2, enabled: false }
  ],

  // Hardware library
  hardwareLibrary: [
    { id: 'hw-1', kind: 'lock', name: 'Single cam lock — standard', cost: 12, msrp: 32, productsUsing: 22, vendor: 'Roto NT', enabled: true },
    { id: 'hw-2', kind: 'lock', name: 'Multi-point lock — 3-point', cost: 64, msrp: 158, productsUsing: 14, vendor: 'Roto NT', enabled: true },
    { id: 'hw-3', kind: 'lock', name: 'Multi-point lock — 5-point', cost: 92, msrp: 235, productsUsing: 8, vendor: 'Siegenia', enabled: true },
    { id: 'hw-4', kind: 'hinge', name: '4-bar egress hinge pair', cost: 28, msrp: 72, productsUsing: 12, vendor: 'Truth', enabled: true },
    { id: 'hw-5', kind: 'hinge', name: 'Butt hinge pair (entry door)', cost: 18, msrp: 48, productsUsing: 6, vendor: 'Hager', enabled: true },
    { id: 'hw-6', kind: 'operator', name: 'Folding crank operator', cost: 22, msrp: 58, productsUsing: 14, vendor: 'Roto NT', enabled: true },
    { id: 'hw-7', kind: 'operator', name: 'Fixed crank operator', cost: 18, msrp: 46, productsUsing: 8, vendor: 'Truth', enabled: true },
    { id: 'hw-8', kind: 'balance', name: 'Block-and-tackle balance', cost: 14, msrp: 38, productsUsing: 4, vendor: 'Caldwell', enabled: true },
    { id: 'hw-9', kind: 'lock', name: 'Foot lock — patio door', cost: 26, msrp: 68, productsUsing: 3, vendor: 'Roto NT', enabled: true },
    { id: 'hw-10', kind: 'handle', name: 'D-pull handle — patio door', cost: 32, msrp: 84, productsUsing: 3, vendor: 'Hoppe', enabled: true }
  ],

  // Color/finish library
  colorLibrary: [
    { id: 'col-1', name: 'White (standard)', hex: '#FFFFFF', kind: 'painted', costAdder: 0, msrpAdder: 0, productsUsing: 31, leadDays: 0, enabled: true },
    { id: 'col-2', name: 'Black', hex: '#1F2937', kind: 'painted', costAdder: 35, msrpAdder: 95, productsUsing: 14, leadDays: 3, enabled: true },
    { id: 'col-3', name: 'Bronze', hex: '#92400E', kind: 'painted', costAdder: 35, msrpAdder: 95, productsUsing: 12, leadDays: 3, enabled: true },
    { id: 'col-4', name: 'Commercial Brown', hex: '#78350F', kind: 'painted', costAdder: 35, msrpAdder: 95, productsUsing: 8, leadDays: 3, enabled: true },
    { id: 'col-5', name: 'Black laminate', hex: '#0F172A', kind: 'laminate', costAdder: 58, msrpAdder: 145, productsUsing: 7, leadDays: 7, enabled: true },
    { id: 'col-6', name: 'Walnut woodgrain', hex: '#7C2D12', kind: 'laminate', costAdder: 72, msrpAdder: 180, productsUsing: 5, leadDays: 7, enabled: true },
    { id: 'col-7', name: 'Anodized clear', hex: '#9CA3AF', kind: 'anodized', costAdder: 110, msrpAdder: 280, productsUsing: 2, leadDays: 14, enabled: true },
    { id: 'col-8', name: 'Custom RAL match', hex: '#94A3B8', kind: 'painted', costAdder: 180, msrpAdder: 450, productsUsing: 4, leadDays: 21, enabled: true }
  ],

  // Promotions & rebates
  promotions: [
    { id: 'pr-1', name: 'Spring Casement +5% off', kind: 'discount', appliesTo: 'Casement family', startDate: '2026-04-15', endDate: '2026-05-31', discount: 0.05, status: 'active', redemptions: 14, savings: 4280 },
    { id: 'pr-2', name: 'Triple-pane upgrade $200 off', kind: 'rebate', appliesTo: 'Premium Low-E Triple glazing', startDate: '2026-05-01', endDate: '2026-06-30', discount: 200, status: 'active', redemptions: 6, savings: 1200 },
    { id: 'pr-3', name: 'New dealer welcome — 3% off first 90 days', kind: 'discount', appliesTo: 'All new dealers', startDate: '2026-01-01', endDate: '2026-12-31', discount: 0.03, status: 'active', redemptions: 2, savings: 1820 },
    { id: 'pr-4', name: 'ENERGY STAR Zone 2 — 2025 program', kind: 'rebate', appliesTo: 'ER≥29 windows in ON', startDate: '2025-04-01', endDate: '2025-12-31', discount: 100, status: 'ended', redemptions: 87, savings: 8700 }
  ],

  // Returns / RMA
  rmas: [
    { id: 'rma-1', orderId: 2402, dealerId: 'maple', kind: 'wrong-color', units: 2, status: 'approved', reason: 'Dealer ordered Bronze, customer wanted Black', requestedAt: '2026-05-09T10:00:00Z', creditAmount: 2900, restockingFee: 290 },
    { id: 'rma-2', orderId: 2400, dealerId: 'maple', kind: 'damaged-in-transit', units: 1, status: 'in-review', reason: 'Frame cracked at corner — photos attached', requestedAt: '2026-05-08T14:00:00Z', creditAmount: 1450, restockingFee: 0 },
    { id: 'rma-3', orderId: 2399, dealerId: 'maple', kind: 'customer-rejected', units: 1, status: 'pending', reason: 'Customer rejected at delivery — wrong size measurement', requestedAt: '2026-05-07T11:00:00Z', creditAmount: 980, restockingFee: 196 }
  ],

  // ═════════════ TRANCHE 3 STATE ═════════════
  // Documents library
  documents: [
    { id: 'doc-1', name: 'Casement 4500 spec sheet', kind: 'spec-sheet', size: '480 KB', uploadedBy: 'Lin Park', uploadedAt: '2026-04-15T10:00:00Z', tags: ['casement', 'spec'], category: 'product-docs' },
    { id: 'doc-2', name: 'Standard installation guide v3.2', kind: 'install-guide', size: '2.1 MB', uploadedBy: 'Marcus Hill', uploadedAt: '2026-03-22T14:00:00Z', tags: ['install', 'all-products'], category: 'install-guides' },
    { id: 'doc-3', name: 'NFRC certificate — Casement 4500 Low-E 272', kind: 'nfrc-cert', size: '180 KB', uploadedBy: 'Sam Chen', uploadedAt: '2026-02-10T09:00:00Z', tags: ['nfrc', 'casement'], category: 'certifications', expiresAt: '2027-02-10' },
    { id: 'doc-4', name: 'CSA A440 test report — Picture window', kind: 'nfrc-cert', size: '420 KB', uploadedBy: 'Sam Chen', uploadedAt: '2026-02-12T09:00:00Z', tags: ['csa', 'picture'], category: 'certifications', expiresAt: '2027-02-12' },
    { id: 'doc-5', name: '2026 dealer brochure', kind: 'marketing', size: '8.2 MB', uploadedBy: 'Sam Chen', uploadedAt: '2026-01-15T11:00:00Z', tags: ['marketing'], category: 'marketing' },
    { id: 'doc-6', name: 'Warranty registration form', kind: 'form', size: '95 KB', uploadedBy: 'Sam Chen', uploadedAt: '2025-12-01T10:00:00Z', tags: ['warranty', 'form'], category: 'forms' }
  ],

  // Capacity planning
  capacity: {
    weeklyUnits: 60,
    weeks: [
      { week: '2026-W19', label: 'May 5–11', booked: 58, capacity: 60, status: 'near-full' },
      { week: '2026-W20', label: 'May 12–18', booked: 60, capacity: 60, status: 'full' },
      { week: '2026-W21', label: 'May 19–25', booked: 45, capacity: 60, status: 'available' },
      { week: '2026-W22', label: 'May 26 – Jun 1', booked: 28, capacity: 60, status: 'available' },
      { week: '2026-W23', label: 'Jun 2–8', booked: 14, capacity: 60, status: 'available' },
      { week: '2026-W24', label: 'Jun 9–15', booked: 6, capacity: 60, status: 'available' }
    ]
  },

  // Damage / scrap tracking
  damageEvents: [
    { id: 'dm-1', orderId: 2407, station: 'Welder #1', date: '2026-05-09T14:30:00Z', unitsScrapped: 1, costImpact: 580, cause: 'Operator error — wrong cut length', category: 'operator' },
    { id: 'dm-2', orderId: 2404, station: 'IGU line', date: '2026-05-08T11:00:00Z', unitsScrapped: 2, costImpact: 220, cause: 'IGU edge chip during handling', category: 'handling' },
    { id: 'dm-3', orderId: 2399, station: 'Cutting saw', date: '2026-05-07T09:00:00Z', unitsScrapped: 1, costImpact: 380, cause: 'Profile defect at supplier (VEKA bronze)', category: 'supplier' }
  ],

  // Photo log per order
  photoLogs: {
    2402: [
      { id: 'ph-1', orderId: 2402, kind: 'pre-shipment-qc', uploadedAt: '2026-04-22T15:00:00Z', uploadedBy: 'Lin Park', caption: 'Pre-shipment QC — 16 units pallet 1' },
      { id: 'ph-2', orderId: 2402, kind: 'dock-loading', uploadedAt: '2026-04-23T08:30:00Z', uploadedBy: 'Jules Tan', caption: 'Dock loading — secured + strapped' },
      { id: 'ph-3', orderId: 2402, kind: 'delivery', uploadedAt: '2026-04-24T14:00:00Z', uploadedBy: 'Jules Tan', caption: 'Delivered Maple Street site' }
    ]
  },

  // Lead time analytics history
  leadTimeHistory: [
    { month: '2025-11', avgDays: 32, p50: 30, p90: 41, target: 30 },
    { month: '2025-12', avgDays: 35, p50: 32, p90: 48, target: 30 },
    { month: '2026-01', avgDays: 31, p50: 29, p90: 42, target: 30 },
    { month: '2026-02', avgDays: 28, p50: 27, p90: 36, target: 30 },
    { month: '2026-03', avgDays: 30, p50: 29, p90: 38, target: 30 },
    { month: '2026-04', avgDays: 29, p50: 28, p90: 37, target: 30 }
  ],

  // Color/finish sales mix YTD
  colorMix: [
    { color: 'White (standard)', hex: '#FFFFFF', units: 312, pct: 0.546 },
    { color: 'Black', hex: '#1F2937', units: 98, pct: 0.171 },
    { color: 'Bronze', hex: '#92400E', units: 64, pct: 0.112 },
    { color: 'Commercial Brown', hex: '#78350F', units: 38, pct: 0.066 },
    { color: 'Black laminate', hex: '#0F172A', units: 32, pct: 0.056 },
    { color: 'Walnut woodgrain', hex: '#7C2D12', units: 18, pct: 0.031 },
    { color: 'Anodized clear', hex: '#9CA3AF', units: 6, pct: 0.011 },
    { color: 'Custom RAL', hex: '#94A3B8', units: 4, pct: 0.007 }
  ],

  // COI tracking per dealer
  coiRecords: [
    { dealerId: 'sunrise', glAmount: 2000000, productLiabAmount: 5000000, expiresAt: '2026-09-15', insurer: 'Aviva Canada', namedInsured: true, fileSize: '380 KB', uploadedAt: '2025-09-15T10:00:00Z' },
    { dealerId: 'maple', glAmount: 2000000, productLiabAmount: 5000000, expiresAt: '2026-06-04', insurer: 'Intact', namedInsured: true, fileSize: '420 KB', uploadedAt: '2025-06-04T11:00:00Z' },
    { dealerId: 'coastline', glAmount: 1000000, productLiabAmount: 3000000, expiresAt: '2026-05-22', insurer: 'TD Insurance', namedInsured: false, fileSize: '290 KB', uploadedAt: '2025-05-22T14:00:00Z' }
  ],

  // DocuSign — dealer agreements
  dealerAgreements: [
    { dealerId: 'sunrise', status: 'signed', signedAt: '2025-08-22T14:00:00Z', envelope: 'NDA-2025-001', version: 'v3.2', expiresAt: '2027-08-22', signerEmail: 'owner@sunrise.demo' },
    { dealerId: 'maple', status: 'signed', signedAt: '2024-11-04T10:00:00Z', envelope: 'NDA-2024-014', version: 'v3.1', expiresAt: '2026-11-04', signerEmail: 'owner@maple.demo' },
    { dealerId: 'coastline', status: 'signed', signedAt: '2024-09-12T09:00:00Z', envelope: 'NDA-2024-012', version: 'v3.1', expiresAt: '2026-09-12', signerEmail: 'owner@coastline.demo' }
  ],

  // Installer certifications
  installerCerts: [
    { dealerId: 'sunrise', installerName: 'Mike Donaldson', certifiedAt: '2025-04-10', expiresAt: '2027-04-10', certLevel: 'Master Installer', status: 'active' },
    { dealerId: 'sunrise', installerName: 'Jamal Wright', certifiedAt: '2024-11-15', expiresAt: '2026-11-15', certLevel: 'Certified Installer', status: 'active' },
    { dealerId: 'maple', installerName: 'Tony Russo', certifiedAt: '2024-08-22', expiresAt: '2026-08-22', certLevel: 'Master Installer', status: 'active' },
    { dealerId: 'coastline', installerName: 'Sara Patel', certifiedAt: '2023-06-15', expiresAt: '2025-06-15', certLevel: 'Certified Installer', status: 'expiring' }
  ],

  // Impersonation state
  impersonationActive: false,
  impersonationTarget: null,

  // Sample loan tracking
  samples: [
    { id: 'sm-1', dealerId: 'sunrise', kind: 'Casement 4500 cutaway', loanedAt: '2025-12-15', returnDue: '2026-06-15', value: 1800, status: 'active' },
    { id: 'sm-2', dealerId: 'sunrise', kind: 'Color chip set (8 finishes)', loanedAt: '2025-12-15', returnDue: null, value: 280, status: 'permanent' },
    { id: 'sm-3', dealerId: 'maple', kind: 'Hardware sample board', loanedAt: '2024-08-01', returnDue: '2025-08-01', value: 950, status: 'overdue' },
    { id: 'sm-4', dealerId: 'coastline', kind: 'IGU cross-section samples (4 packages)', loanedAt: '2025-03-22', returnDue: '2026-03-22', value: 1200, status: 'active' }
  ],

  // Keyboard shortcuts overlay
  keyboardShortcutsOpen: false,
  // ═════════════ Factory machine integrations ═════════════
  machineWizardOpen: false,
  revealedKeys: {},  // { machineId: true } — for show/hide API keys
  machineSyncShowingKey: null,
  machines: [
    {
      id: 'rotox-welder-1', name: 'Rotox Welder #1',
      vendor: 'Rotox', model: 'SBA-V 4-head',
      type: 'vinyl-welder', typeLabel: 'PVC welder',
      location: 'Welding bay 1', icon: 'RTX',
      gradient: 'linear-gradient(135deg, #24479e 0%, #4a6fd4 100%)',
      apiEndpoint: 'http://10.0.1.42:8080/api/v1',
      apiKey: 'rtx_live_4f2b8a3e7c1d9f5e6a8b2c1d3a7f8e9b',
      syncMethod: 'rest',
      status: 'connected', lastSyncAt: '2026-05-10T07:42:00Z',
      syncCount: 247, syncErrors: 0,
      capabilities: ['weld-corners', 'cycle-time-feedback'],
      consumes: ['vinyl-frame', 'vinyl-sash'],
      enabled: true
    },
    {
      id: 'sturt-cleaner-1', name: 'Stürtz Corner Cleaner',
      vendor: 'Stürtz', model: 'XLT-S',
      type: 'cleaner', typeLabel: 'Corner cleaner',
      location: 'Welding bay 1', icon: 'STZ',
      gradient: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)',
      apiEndpoint: 'http://10.0.1.43:8080/api/v1',
      apiKey: 'stz_live_9e1c4b7a2d5f8c3e6a1b4d7f2c5e8b1a',
      syncMethod: 'rest',
      status: 'error', lastSyncAt: '2026-05-09T14:22:00Z',
      syncCount: 184, syncErrors: 3,
      lastError: 'ETIMEDOUT — 30s connection timeout',
      capabilities: ['clean-corners'],
      consumes: [],
      enabled: true
    },
    {
      id: 'pertici-saw-1', name: 'Pertici Cutting Saw',
      vendor: 'Pertici', model: 'Univer 600S',
      type: 'saw', typeLabel: 'Profile cutting saw',
      location: 'Cutting bay', icon: 'PRT',
      gradient: 'linear-gradient(135deg, #92400E 0%, #D97706 100%)',
      apiEndpoint: 'COM3 (RS-232 @ 9600 baud)',
      apiKey: null,  // legacy serial — no API key
      syncMethod: 'serial',
      status: 'connected', lastSyncAt: '2026-05-10T07:55:00Z',
      syncCount: 1183, syncErrors: 0,
      capabilities: ['cut-to-length', 'miter-cut'],
      consumes: ['vinyl-frame', 'vinyl-sash', 'mullion', 'reinforcement'],
      enabled: true
    },
    {
      id: 'cardinal-igu-line', name: 'Cardinal IGU Line A',
      vendor: 'Cardinal IG', model: 'IG-Auto 3000',
      type: 'igu-line', typeLabel: 'IGU assembly line',
      location: 'Glazing room', icon: 'CIG',
      gradient: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
      apiEndpoint: 'https://erp.cardinal.com/api/v2/orders',
      apiKey: 'card_live_7c1a3f9b2e5d8c4a7e1b9f3c6d2a5e8b',
      syncMethod: 'rest',
      status: 'connected', lastSyncAt: '2026-05-10T08:15:00Z',
      syncCount: 412, syncErrors: 0,
      capabilities: ['glass-cut', 'spacer-bend', 'gas-fill', 'edge-seal'],
      consumes: ['glass-igu', 'spacer', 'desiccant'],
      enabled: true
    },
    {
      id: 'elumatec-sbz628', name: 'Elumatec SBZ 628',
      vendor: 'Elumatec', model: 'SBZ 628 Profilemaster',
      type: 'cnc-machining', typeLabel: 'CNC machining center',
      location: 'Hardware prep', icon: 'EML',
      gradient: 'linear-gradient(135deg, #7C2D12 0%, #DC2626 100%)',
      apiEndpoint: '\\\\NORTHFORGE-FS\\elumatec-queue\\',
      apiKey: 'eml_live_2d5e8b1c4f7a3e6c9b2d5a8f1c4e7b3a',
      syncMethod: 'file-drop',
      status: 'connected', lastSyncAt: '2026-05-10T06:30:00Z',
      syncCount: 89, syncErrors: 0,
      capabilities: ['drill', 'mill', 'route-hardware-prep'],
      consumes: ['vinyl-frame', 'reinforcement'],
      enabled: true
    },
    {
      id: 'haffner-router', name: 'Haffner Router (offline)',
      vendor: 'Haffner', model: 'Murat NR-200',
      type: 'router', typeLabel: 'Hardware router',
      location: 'Hardware prep', icon: 'HFN',
      gradient: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)',
      apiEndpoint: 'COM4 (RS-485)',
      apiKey: null,
      syncMethod: 'serial',
      status: 'disabled', lastSyncAt: '2025-12-14T11:00:00Z',
      syncCount: 1820, syncErrors: 0,
      capabilities: ['lock-mortise', 'hinge-mortise', 'drainage-slot'],
      consumes: ['vinyl-frame'],
      enabled: false
    }
  ],
  dark: false,
  user: {
    name: 'Sam Chen',
    role: 'Owner',
    initials: 'SC',
    email: 'sam@northforge.demo'
  },
  factory: {
    name: 'Northforge',
    full: 'Northforge Manufacturing Co.',
    region: 'Ontario · Canada',
    avatar: 'NF',
    baseLeadTime: 6,
    paymentTerms: 'Net 30',
    address: '1234 Industrial Dr, Hamilton, ON L8R 3B7',
    phone: '+1 (905) 555-0188',
    email: 'orders@northforge.demo',
    productFamilies: ['Casement', 'Double-hung', 'Picture', 'Awning', 'Sliding'],
    team: [
      { id: 'sam',    name: 'Sam Chen',     role: 'Owner',                 email: 'sam@northforge.demo',     phone: '+1 (905) 555-0101', initials: 'SC' },
      { id: 'marcus', name: 'Marcus Hill',  role: 'Production manager',    email: 'marcus@northforge.demo',  phone: '+1 (905) 555-0112', initials: 'MH' },
      { id: 'lin',    name: 'Lin Park',     role: 'Drawings / engineering',email: 'lin@northforge.demo',     phone: '+1 (905) 555-0123', initials: 'LP' },
      { id: 'dave',   name: 'Dave Pereira', role: 'QC lead',               email: 'dave@northforge.demo',    phone: '+1 (905) 555-0134', initials: 'DP' },
      { id: 'priya',  name: 'Priya Nair',   role: 'Materials & procurement', email: 'priya@northforge.demo', phone: '+1 (905) 555-0145', initials: 'PN' },
      { id: 'jules',  name: 'Jules Tan',    role: 'Logistics coordinator', email: 'jules@northforge.demo',   phone: '+1 (905) 555-0156', initials: 'JT' }
    ],
    // Maps a production stage / situation to the team member who owns it.
    // Used to pick the right internal contact for the Forward-to-factory flow.
    stageOwners: {
      'new':        'sam',
      'ack':        'marcus',
      'drawings':   'lin',
      'production': 'marcus',
      'qc':         'dave',
      'ready':      'jules',
      'shipped':    'jules',
      'delivered':  'jules',
      'materials':  'priya',
      'rush':       'marcus',
      'warranty':   'dave',
      'measure':    'lin'
    }
  },
  // ═════════════ Dealer invite wizard ═════════════
  inviteWizard: {
    open: false,
    step: 1,  // 1..5
    editingId: null,  // if resending an existing pending invite
    data: {
      businessName: '',
      contactName: '',
      contactEmail: '',
      phone: '',
      city: '',
      province: 'ON',
      annualVolumeEst: '100k-250k',
      segment: 'residential',
      tierId: 2,
      customMultiplier: '',
      paymentTerms: 'Net 30',
      creditLimit: 25000,
      currency: 'CAD',
      categoryAccess: ['window'],
      leadTime: 'standard',
      sendDealerAgreement: true,
      requireCOI: true,
      requireTraining: false,
      personalNote: ''
    }
  },
  pendingInvites: [
    {
      id: 'inv_001', businessName: 'Lakeside Windows & Doors',
      contactName: 'Marcus Webb', contactEmail: 'marcus@lakesidewindows.ca',
      city: 'Oakville', province: 'ON',
      sentAt: '2026-05-06', expiresAt: '2026-05-20',
      status: 'awaiting',  // awaiting | accepted | expired | cancelled
      tierId: 2, paymentTerms: 'Net 30', creditLimit: 25000,
      categoryAccess: ['window'],
      remindersSent: 0
    },
    {
      id: 'inv_002', businessName: 'Granite Builders Supply',
      contactName: 'Devon Carter', contactEmail: 'devon@granitebuilders.ca',
      city: 'Kingston', province: 'ON',
      sentAt: '2026-04-22', expiresAt: '2026-05-06',
      status: 'expired',
      tierId: 3, paymentTerms: 'Net 30', creditLimit: 15000,
      categoryAccess: ['window'],
      remindersSent: 2
    }
  ],

  dealers: [
    { id: 'maple', name: 'Maple Street Renovations', short: 'Maple Street', region: 'Toronto · ON', avatar: 'MS', gradient: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)', openPOs: 8, ytdVolume: 124800, payStanding: 'current', tierId: 2, customMultiplier: null, joinedAt: '2024-08-12',
      address: '742 Maple Ave, Toronto, ON M5V 2T6', phone: '+1 (416) 555-0142', email: 'sales@maplestreet.demo',
      rep: { name: 'Rafi Bahari',   role: 'Account manager', email: 'rafi@maplestreet.demo',     phone: '+1 (416) 555-0146', initials: 'RB' } },
    { id: 'sunrise', name: 'Sunrise Windows', short: 'Sunrise', region: 'Mississauga · ON', avatar: 'SW', gradient: 'linear-gradient(135deg, #92400E 0%, #D97706 100%)', openPOs: 11, ytdVolume: 218400, payStanding: 'current', tierId: 1, customMultiplier: 0.56, joinedAt: '2023-03-04',
      address: '1188 Dundas St E, Mississauga, ON L4Y 2B8', phone: '+1 (905) 555-0218', email: 'orders@sunrisewindows.demo',
      rep: { name: 'Tara Fadel',    role: 'Senior estimator', email: 'tara@sunrisewindows.demo', phone: '+1 (905) 555-0221', initials: 'TF' } },
    { id: 'coastline', name: 'Coastline Builders', short: 'Coastline', region: 'Burlington · ON', avatar: 'CB', gradient: 'linear-gradient(135deg, #1E3A8A 0%, #2e5bc8 100%)', openPOs: 7, ytdVolume: 96800, payStanding: 'current', tierId: 3, customMultiplier: null, joinedAt: '2025-01-22',
      address: '356 Plains Rd W, Burlington, ON L7T 2C4', phone: '+1 (905) 555-0367', email: 'office@coastlinebuilders.demo',
      rep: { name: 'Daniel Krause', role: 'Project lead',    email: 'dan@coastlinebuilders.demo', phone: '+1 (905) 555-0372', initials: 'DK' } },
    { id: 'bayview', name: 'Bayview Construction', short: 'Bayview', region: 'Hamilton · ON', avatar: 'BV', gradient: 'linear-gradient(135deg, #6D28D9 0%, #A855F7 100%)', openPOs: 6, ytdVolume: 142600, payStanding: 'current', tierId: 2, customMultiplier: null, joinedAt: '2024-02-18',
      address: '92 King St W, Hamilton, ON L8P 1A2', phone: '+1 (905) 555-0492', email: 'info@bayviewconstruction.demo',
      rep: { name: 'Anita Singh',   role: 'Operations manager', email: 'anita@bayviewconstruction.demo', phone: '+1 (905) 555-0498', initials: 'AS' } },
    { id: 'northern', name: 'Northern Light Homes', short: 'Northern', region: 'Barrie · ON', avatar: 'NL', gradient: 'linear-gradient(135deg, #0E7490 0%, #06B6D4 100%)', openPOs: 5, ytdVolume: 78300, payStanding: 'watch', tierId: 2, customMultiplier: null, joinedAt: '2024-11-08',
      address: '410 Bayfield St, Barrie, ON L4M 5A1', phone: '+1 (705) 555-0610', email: 'projects@northernlighthomes.demo',
      rep: { name: 'Mark Hennessy', role: 'Sales lead',      email: 'mark@northernlighthomes.demo', phone: '+1 (705) 555-0614', initials: 'MH' } },
    { id: 'oakridge', name: 'Oakridge Custom Homes', short: 'Oakridge', region: 'Oakville · ON', avatar: 'OR', gradient: 'linear-gradient(135deg, #BE185D 0%, #EC4899 100%)', openPOs: 4, ytdVolume: 184200, payStanding: 'current', tierId: 1, customMultiplier: 0.58, joinedAt: '2022-06-30',
      address: '218 Lakeshore Rd E, Oakville, ON L6J 1H8', phone: '+1 (905) 555-0820', email: 'studio@oakridgecustomhomes.demo',
      rep: { name: 'Priya Vora',    role: 'Principal designer', email: 'priya@oakridgecustomhomes.demo', phone: '+1 (905) 555-0824', initials: 'PV' } }
  ],
  orders: [
    {
      id: 2410, po: 'O-2410', dealerId: 'maple', project: 'Riverside Heights',
      units: 10, value: 13000, shipBy: '2026-05-22', submittedAt: '2026-05-10',
      status: 'new',
      milestones: { ack: false, drawings: false, production: false, qc: false, shipped: false },
      unitBreakdown: [
        { name: 'Casement', count: 4, price: 5800 },
        { name: 'Double-hung', count: 4, price: 4200 },
        { name: 'Picture', count: 2, price: 3000 }
      ],
      drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 10 units', status: 'pending' }],
      thread: [
        { from: 'dealer', name: 'Rafi B.', initials: 'MS', time: '2m ago', body: "Submitting PO for Riverside Heights. 10 unit Casement/DH/Picture mix. Need ship by 5/22 for site framing schedule." }
      ]
    },
    {
      id: 2400, po: 'O-2400', dealerId: 'maple', project: 'Whitepine Cove',
      units: 7, value: 10000, shipBy: '2026-05-30', submittedAt: '2026-05-08',
      status: 'new',
      milestones: { ack: false, drawings: false, production: false, qc: false, shipped: false },
      unitBreakdown: [
        { name: 'Casement', count: 3, price: 4350 },
        { name: 'Picture', count: 2, price: 3000 },
        { name: 'Awning', count: 2, price: 2650 }
      ],
      drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 7 units', status: 'pending' }],
      thread: [
        { from: 'dealer', name: 'Rafi B.', initials: 'MS', time: '2d ago', body: "Whitepine — 7 unit project, no rush." }
      ]
    },
    {
      id: 2399, po: 'O-2399', dealerId: 'maple', project: 'Stonebridge Place',
      units: 11, value: 16000, shipBy: '2026-05-26', submittedAt: '2026-05-04',
      status: 'ack',
      milestones: { ack: true, drawings: false, production: false, qc: false, shipped: false },
      unitBreakdown: [
        { name: 'Casement', count: 5, price: 7250 },
        { name: 'Double-hung', count: 4, price: 4400 },
        { name: 'Sliding', count: 2, price: 4350 }
      ],
      drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 11 units', status: 'in-review' }],
      thread: [
        { from: 'system', name: 'OpenSpec', initials: 'OS', time: '5d ago', body: 'PO acknowledged by Northforge.' }
      ]
    },
    {
      id: 2407, po: 'O-2407', dealerId: 'sunrise', project: 'Cedar Park Estate',
      units: 22, value: 34000, shipBy: '2026-05-04', submittedAt: '2026-04-08',
      status: 'production',
      milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false },
      unitBreakdown: [
        { name: 'Casement', count: 10, price: 14500 },
        { name: 'Picture', count: 6, price: 9000 },
        { name: 'Sliding', count: 4, price: 8500 },
        { name: 'Awning', count: 2, price: 2000 }
      ],
      drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 22 units', status: 'approved' }],
      thread: [
        { from: 'factory', name: 'Marcus H.', initials: 'NF', time: '6d ago', body: 'IGU supplier ran late by 4 days. Will catch up on hardware install — pushing finish to next Tuesday.' },
        { from: 'dealer', name: 'Tara F.', initials: 'SW', time: '5d ago', body: 'Acknowledged. Site framing is also behind so this works out.' }
      ]
    },
    {
      id: 2404, po: 'O-2404', dealerId: 'sunrise', project: 'Brookside Terrace',
      units: 20, value: 29000, shipBy: '2026-05-12', submittedAt: '2026-04-12',
      status: 'production',
      milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false },
      unitBreakdown: [
        { name: 'Casement', count: 8, price: 11600 },
        { name: 'Double-hung', count: 6, price: 6600 },
        { name: 'Picture', count: 4, price: 6000 },
        { name: 'Sliding', count: 2, price: 4800 }
      ],
      drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 20 units', status: 'approved' }],
      thread: [
        { from: 'dealer', name: 'Tara F.', initials: 'SW', time: '4d ago', body: 'On track for May 12?' },
        { from: 'factory', name: 'Marcus H.', initials: 'NF', time: '4d ago', body: 'Yes — QC starts Friday.' }
      ]
    },
    {
      id: 2397, po: 'O-2397', dealerId: 'coastline', project: 'Silver Birch Court',
      units: 13, value: 19000, shipBy: '2026-05-18', submittedAt: '2026-04-04',
      status: 'production',
      milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false },
      unitBreakdown: [
        { name: 'Casement', count: 6, price: 8700 },
        { name: 'Double-hung', count: 4, price: 4400 },
        { name: 'Awning', count: 3, price: 3900 }
      ],
      drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 13 units', status: 'approved' }],
      thread: [
        { from: 'factory', name: 'Marcus H.', initials: 'NF', time: '6d ago', body: 'In production. Estimated completion May 16.' }
      ]
    },
    {
      id: 2409, po: 'O-2409', dealerId: 'sunrise', project: 'Lakeshore Renovation',
      units: 14, value: 22000, shipBy: '2026-05-08', submittedAt: '2026-04-14',
      status: 'production',
      milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false },
      unitBreakdown: [
        { name: 'Casement', count: 7, price: 10150 },
        { name: 'Picture', count: 4, price: 6000 },
        { name: 'Awning', count: 3, price: 3850 }
      ],
      drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 14 units', status: 'approved' }],
      thread: [
        { from: 'factory', name: 'Marcus H.', initials: 'NF', time: '2h ago', body: 'Production started this morning. ETA May 22.' }
      ]
    },
    {
      id: 2408, po: 'O-2408', dealerId: 'maple', project: 'Hartwood Custom',
      units: 8, value: 12000, shipBy: '2026-05-04', submittedAt: '2026-04-08',
      status: 'production',
      milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false },
      unitBreakdown: [
        { name: 'Casement', count: 4, price: 6000 },
        { name: 'Picture', count: 2, price: 3000 },
        { name: 'Sliding', count: 2, price: 3000 }
      ],
      drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 8 units', status: 'approved' }],
      thread: [
        { from: 'dealer', name: 'Rafi B.', initials: 'MS', time: '42m ago', body: 'Can we move ship date one week earlier? Site is ahead of schedule.' }
      ]
    },
    {
      id: 2398, po: 'O-2398', dealerId: 'coastline', project: 'Heatherfield Lane',
      units: 5, value: 7800, shipBy: '2026-05-20', submittedAt: '2026-04-06',
      status: 'production',
      milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false },
      unitBreakdown: [
        { name: 'Casement', count: 3, price: 4350 },
        { name: 'Picture', count: 2, price: 3450 }
      ],
      drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 5 units', status: 'approved' }],
      thread: [
        { from: 'factory', name: 'Marcus H.', initials: 'NF', time: '3d ago', body: 'IGU received. Hardware install next week.' }
      ]
    },
    {
      id: 2405, po: 'O-2405', dealerId: 'coastline', project: 'Sunset Boulevard',
      units: 12, value: 17000, shipBy: '2026-05-14', submittedAt: '2026-03-28',
      status: 'ready',
      milestones: { ack: true, drawings: true, production: true, qc: true, shipped: false },
      unitBreakdown: [
        { name: 'Casement', count: 5, price: 7250 },
        { name: 'Double-hung', count: 4, price: 4400 },
        { name: 'Picture', count: 3, price: 5350 }
      ],
      drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 12 units', status: 'approved' }],
      thread: [
        { from: 'factory', name: 'Marcus H.', initials: 'NF', time: '3h ago', body: 'QC passed. Ready to ship — please confirm delivery window.' }
      ]
    },
    {
      id: 2406, po: 'O-2406', dealerId: 'sunrise', project: 'Aspen Grove',
      units: 6, value: 9300, shipBy: '2026-05-16', submittedAt: '2026-03-30',
      status: 'ready',
      milestones: { ack: true, drawings: true, production: true, qc: true, shipped: false },
      unitBreakdown: [
        { name: 'Casement', count: 3, price: 4350 },
        { name: 'Awning', count: 2, price: 2600 },
        { name: 'Picture', count: 1, price: 2350 }
      ],
      drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 6 units', status: 'approved' }],
      thread: [
        { from: 'factory', name: 'Marcus H.', initials: 'NF', time: '18m ago', body: 'Drawing approved. QC complete. Ready to ship.' }
      ]
    },
    {
      id: 2402, po: 'O-2402', dealerId: 'maple', project: 'Windermere Heights',
      units: 16, value: 23000, shipBy: '2026-04-22', submittedAt: '2026-03-15',
      status: 'delivered',
      milestones: { ack: true, drawings: true, production: true, qc: true, shipped: true },
      unitBreakdown: [
        { name: 'Casement', count: 6, price: 8700 },
        { name: 'Double-hung', count: 6, price: 6600 },
        { name: 'Picture', count: 4, price: 7700 }
      ],
      drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 16 units', status: 'approved' }],
      thread: [
        { from: 'factory', name: 'Jules T.', initials: 'NF', time: 'Yesterday', body: 'Delivered. Signed receipt on file.' }
      ]
    },
    // ═══ Additional May 2026 orders — 100-person factory scale ═══
    { id: 2411, po: 'O-2411', dealerId: 'bayview', project: 'Harbourfront Towers Ph2', units: 24, value: 38400, shipBy: '2026-05-13', submittedAt: '2026-04-20', status: 'production', milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 12, price: 17400 }, { name: 'Picture', count: 8, price: 12000 }, { name: 'Awning', count: 4, price: 9000 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 24 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Marcus H.', initials: 'NF', time: '4h ago', body: 'Frames welded, IGU next.' }] },
    { id: 2412, po: 'O-2412', dealerId: 'oakridge', project: 'Glenbrook Estate', units: 18, value: 52000, shipBy: '2026-05-14', submittedAt: '2026-04-12', status: 'ready', milestones: { ack: true, drawings: true, production: true, qc: true, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 8, price: 24000 }, { name: 'Picture', count: 6, price: 14400 }, { name: 'Awning', count: 4, price: 13600 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 18 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Jules T.', initials: 'NF', time: '1h ago', body: 'QC passed. Ready for shipment.' }] },
    { id: 2413, po: 'O-2413', dealerId: 'sunrise', project: 'Riverbend Lofts', units: 14, value: 21800, shipBy: '2026-05-11', submittedAt: '2026-04-18', status: 'shipped', milestones: { ack: true, drawings: true, production: true, qc: true, shipped: true }, unitBreakdown: [{ name: 'Casement', count: 6, price: 8700 }, { name: 'Slider', count: 4, price: 6800 }, { name: 'Awning', count: 4, price: 6300 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 14 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Jules T.', initials: 'NF', time: 'Yesterday', body: 'Loaded on Carrier #4. ETA tomorrow 2pm.' }] },
    { id: 2414, po: 'O-2414', dealerId: 'maple', project: 'Forestglen Custom', units: 9, value: 16200, shipBy: '2026-05-15', submittedAt: '2026-04-22', status: 'production', milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 5, price: 9750 }, { name: 'Picture', count: 4, price: 6450 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 9 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Marcus H.', initials: 'NF', time: '2h ago', body: 'Casement frames in welder. On track.' }] },
    { id: 2415, po: 'O-2415', dealerId: 'northern', project: 'Lakeshore West Build', units: 22, value: 32400, shipBy: '2026-05-15', submittedAt: '2026-04-15', status: 'production', milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 10, price: 14500 }, { name: 'Awning', count: 6, price: 9600 }, { name: 'Picture', count: 6, price: 8300 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 22 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Marcus H.', initials: 'NF', time: '6h ago', body: 'IGU spacer line in progress. On schedule.' }] },
    { id: 2416, po: 'O-2416', dealerId: 'bayview', project: 'Maplewood Residence', units: 11, value: 18600, shipBy: '2026-05-15', submittedAt: '2026-04-26', status: 'production', milestones: { ack: true, drawings: true, production: false, qc: false, shipped: false }, unitBreakdown: [{ name: 'Double-hung', count: 6, price: 10800 }, { name: 'Picture', count: 5, price: 7800 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 11 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Marcus H.', initials: 'NF', time: '12h ago', body: 'Materials staged. Production starts Tuesday.' }] },
    { id: 2417, po: 'O-2417', dealerId: 'sunrise', project: 'Crestwood Heights', units: 16, value: 26200, shipBy: '2026-05-19', submittedAt: '2026-04-25', status: 'production', milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 8, price: 14400 }, { name: 'Slider', count: 4, price: 6400 }, { name: 'Picture', count: 4, price: 5400 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 16 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Marcus H.', initials: 'NF', time: '1d ago', body: 'Hardware kits arrived. Assembly Thursday.' }] },
    { id: 2418, po: 'O-2418', dealerId: 'oakridge', project: 'Highpark Custom Build', units: 20, value: 58400, shipBy: '2026-05-21', submittedAt: '2026-04-08', status: 'production', milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 10, price: 29000 }, { name: 'Picture', count: 6, price: 17400 }, { name: 'Awning', count: 4, price: 12000 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 20 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Marcus H.', initials: 'NF', time: '3h ago', body: 'High-spec triple-pane IGUs in production.' }] },
    { id: 2419, po: 'O-2419', dealerId: 'coastline', project: 'Birchwood Renovation', units: 7, value: 9800, shipBy: '2026-05-21', submittedAt: '2026-04-28', status: 'ack', milestones: { ack: true, drawings: false, production: false, qc: false, shipped: false }, unitBreakdown: [{ name: 'Single-hung', count: 4, price: 4800 }, { name: 'Picture', count: 3, price: 5000 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 7 units', status: 'pending' }], thread: [{ from: 'factory', name: 'Lin P.', initials: 'NF', time: '1d ago', body: 'PO acked. Starting drawings.' }] },
    { id: 2420, po: 'O-2420', dealerId: 'northern', project: 'Pine Ridge Estates', units: 28, value: 42800, shipBy: '2026-05-22', submittedAt: '2026-04-02', status: 'production', milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 14, price: 20300 }, { name: 'Slider', count: 8, price: 13600 }, { name: 'Picture', count: 6, price: 8900 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 28 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Marcus H.', initials: 'NF', time: '5h ago', body: 'Large order, 2 bays running. Tracking well.' }] },
    { id: 2421, po: 'O-2421', dealerId: 'bayview', project: 'Glenview Townhomes', units: 32, value: 51200, shipBy: '2026-05-22', submittedAt: '2026-04-06', status: 'production', milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 12, price: 17400 }, { name: 'Awning', count: 8, price: 12800 }, { name: 'Picture', count: 12, price: 21000 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 32 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Marcus H.', initials: 'NF', time: '1d ago', body: '12 of 32 frames welded. Halfway by Friday.' }] },
    { id: 2422, po: 'O-2422', dealerId: 'maple', project: 'Eastwood Renovation', units: 6, value: 8400, shipBy: '2026-05-25', submittedAt: '2026-05-02', status: 'ack', milestones: { ack: true, drawings: false, production: false, qc: false, shipped: false }, unitBreakdown: [{ name: 'Double-hung', count: 4, price: 5400 }, { name: 'Picture', count: 2, price: 3000 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 6 units', status: 'pending' }], thread: [{ from: 'factory', name: 'Lin P.', initials: 'NF', time: '6h ago', body: 'PO acknowledged.' }] },
    { id: 2423, po: 'O-2423', dealerId: 'sunrise', project: 'Beachside Custom', units: 13, value: 24800, shipBy: '2026-05-25', submittedAt: '2026-04-30', status: 'production', milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 7, price: 14700 }, { name: 'Picture', count: 4, price: 6800 }, { name: 'Awning', count: 2, price: 3300 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 13 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Marcus H.', initials: 'NF', time: '8h ago', body: 'Production started this morning.' }] },
    { id: 2424, po: 'O-2424', dealerId: 'oakridge', project: 'Bayside Mansion', units: 26, value: 84600, shipBy: '2026-05-27', submittedAt: '2026-03-28', status: 'production', milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 12, price: 39600 }, { name: 'Picture', count: 8, price: 26400 }, { name: 'Awning', count: 6, price: 18600 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 26 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Marcus H.', initials: 'NF', time: '4h ago', body: 'Luxury project — extra QC steps scheduled.' }] },
    { id: 2425, po: 'O-2425', dealerId: 'coastline', project: 'Westshore Condos', units: 18, value: 27200, shipBy: '2026-05-28', submittedAt: '2026-04-14', status: 'production', milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false }, unitBreakdown: [{ name: 'Single-hung', count: 8, price: 11200 }, { name: 'Casement', count: 6, price: 9300 }, { name: 'Picture', count: 4, price: 6700 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 18 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Marcus H.', initials: 'NF', time: '1d ago', body: 'Mixed types — running on 2 bays.' }] },
    { id: 2426, po: 'O-2426', dealerId: 'northern', project: 'Mountainview Custom', units: 11, value: 17800, shipBy: '2026-05-29', submittedAt: '2026-04-20', status: 'production', milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 6, price: 10200 }, { name: 'Awning', count: 5, price: 7600 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 11 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Marcus H.', initials: 'NF', time: '14h ago', body: 'On schedule for ship date.' }] },
    { id: 2427, po: 'O-2427', dealerId: 'bayview', project: 'Pinecrest Multi-unit', units: 36, value: 56400, shipBy: '2026-05-29', submittedAt: '2026-03-30', status: 'production', milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 16, price: 25600 }, { name: 'Slider', count: 12, price: 18000 }, { name: 'Picture', count: 8, price: 12800 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 36 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Marcus H.', initials: 'NF', time: '5h ago', body: '36-unit multi-family. Production on 3 bays.' }] },
    { id: 2428, po: 'O-2428', dealerId: 'sunrise', project: 'Highland Reno', units: 8, value: 13200, shipBy: '2026-05-13', submittedAt: '2026-04-22', status: 'ready', milestones: { ack: true, drawings: true, production: true, qc: true, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 4, price: 7200 }, { name: 'Picture', count: 4, price: 6000 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 8 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Jules T.', initials: 'NF', time: '2h ago', body: 'QC complete. Awaiting carrier slot.' }] },
    { id: 2429, po: 'O-2429', dealerId: 'maple', project: 'Cedar Trail Residence', units: 12, value: 19800, shipBy: '2026-05-07', submittedAt: '2026-04-18', status: 'shipped', milestones: { ack: true, drawings: true, production: true, qc: true, shipped: true }, unitBreakdown: [{ name: 'Casement', count: 6, price: 10200 }, { name: 'Awning', count: 4, price: 6400 }, { name: 'Picture', count: 2, price: 3200 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 12 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Jules T.', initials: 'NF', time: '5d ago', body: 'Shipped via Carrier #2.' }] },
    { id: 2430, po: 'O-2430', dealerId: 'coastline', project: 'Marina Village', units: 21, value: 31600, shipBy: '2026-05-06', submittedAt: '2026-04-10', status: 'shipped', milestones: { ack: true, drawings: true, production: true, qc: true, shipped: true }, unitBreakdown: [{ name: 'Casement', count: 10, price: 15200 }, { name: 'Picture', count: 8, price: 12000 }, { name: 'Awning', count: 3, price: 4400 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 21 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Jules T.', initials: 'NF', time: '6d ago', body: 'Delivered to site Tuesday.' }] },
    { id: 2431, po: 'O-2431', dealerId: 'oakridge', project: 'Lakefront Retreat', units: 14, value: 38600, shipBy: '2026-05-01', submittedAt: '2026-03-22', status: 'delivered', milestones: { ack: true, drawings: true, production: true, qc: true, shipped: true }, unitBreakdown: [{ name: 'Casement', count: 6, price: 17400 }, { name: 'Picture', count: 5, price: 14000 }, { name: 'Awning', count: 3, price: 7200 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 14 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Jules T.', initials: 'NF', time: '11d ago', body: 'Delivered. Customer signed.' }] },
    { id: 2432, po: 'O-2432', dealerId: 'northern', project: 'Greenfield Estates', units: 17, value: 25600, shipBy: '2026-05-04', submittedAt: '2026-04-04', status: 'shipped', milestones: { ack: true, drawings: true, production: true, qc: true, shipped: true }, unitBreakdown: [{ name: 'Casement', count: 8, price: 12200 }, { name: 'Slider', count: 6, price: 8400 }, { name: 'Picture', count: 3, price: 5000 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 17 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Jules T.', initials: 'NF', time: '8d ago', body: 'Shipped via Carrier #5.' }] },
    { id: 2433, po: 'O-2433', dealerId: 'bayview', project: 'Riverview Townhouse', units: 9, value: 14200, shipBy: '2026-05-05', submittedAt: '2026-04-09', status: 'shipped', milestones: { ack: true, drawings: true, production: true, qc: true, shipped: true }, unitBreakdown: [{ name: 'Casement', count: 4, price: 6400 }, { name: 'Picture', count: 3, price: 4500 }, { name: 'Awning', count: 2, price: 3300 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 9 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Jules T.', initials: 'NF', time: '7d ago', body: 'Out for delivery.' }] },
    { id: 2434, po: 'O-2434', dealerId: 'sunrise', project: 'Sunset Cove Reno', units: 5, value: 7800, shipBy: '2026-05-29', submittedAt: '2026-05-05', status: 'new', milestones: { ack: false, drawings: false, production: false, qc: false, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 3, price: 4500 }, { name: 'Picture', count: 2, price: 3300 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 5 units', status: 'pending' }], thread: [{ from: 'dealer', name: 'Tara F.', initials: 'SW', time: '4h ago', body: 'Small reno PO. Standard finishes.' }] },
    { id: 2435, po: 'O-2435', dealerId: 'maple', project: 'Heritage Square', units: 22, value: 36800, shipBy: '2026-05-28', submittedAt: '2026-05-01', status: 'ack', milestones: { ack: true, drawings: false, production: false, qc: false, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 10, price: 17000 }, { name: 'Awning', count: 6, price: 9600 }, { name: 'Picture', count: 6, price: 10200 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 22 units', status: 'pending' }], thread: [{ from: 'factory', name: 'Lin P.', initials: 'NF', time: '2d ago', body: 'PO acked. Drawings in progress.' }] },
    { id: 2436, po: 'O-2436', dealerId: 'coastline', project: 'Atwater Lofts', units: 19, value: 28400, shipBy: '2026-05-08', submittedAt: '2026-04-12', status: 'shipped', milestones: { ack: true, drawings: true, production: true, qc: true, shipped: true }, unitBreakdown: [{ name: 'Casement', count: 8, price: 12000 }, { name: 'Slider', count: 6, price: 9000 }, { name: 'Picture', count: 5, price: 7400 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 19 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Jules T.', initials: 'NF', time: '4d ago', body: 'On truck, ETA Friday morning.' }] },
    { id: 2437, po: 'O-2437', dealerId: 'oakridge', project: 'Westmount Custom', units: 16, value: 47200, shipBy: '2026-05-11', submittedAt: '2026-04-04', status: 'shipped', milestones: { ack: true, drawings: true, production: true, qc: true, shipped: true }, unitBreakdown: [{ name: 'Casement', count: 8, price: 24000 }, { name: 'Picture', count: 6, price: 17400 }, { name: 'Awning', count: 2, price: 5800 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 16 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Jules T.', initials: 'NF', time: '2d ago', body: 'Shipped on Carrier #1.' }] },
    { id: 2438, po: 'O-2438', dealerId: 'northern', project: 'Glenview Court', units: 8, value: 12600, shipBy: '2026-05-12', submittedAt: '2026-04-20', status: 'production', milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 4, price: 6400 }, { name: 'Picture', count: 4, price: 6200 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 8 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Marcus H.', initials: 'NF', time: '1h ago', body: 'In QC bay 2 today.' }] },
    { id: 2439, po: 'O-2439', dealerId: 'bayview', project: 'Cornerstone Build', units: 13, value: 21400, shipBy: '2026-05-18', submittedAt: '2026-04-25', status: 'production', milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 6, price: 9600 }, { name: 'Picture', count: 4, price: 6800 }, { name: 'Slider', count: 3, price: 5000 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 13 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Marcus H.', initials: 'NF', time: '7h ago', body: 'Frames in welder.' }] },
    { id: 2440, po: 'O-2440', dealerId: 'sunrise', project: 'Bayshore Mansion', units: 31, value: 87400, shipBy: '2026-05-20', submittedAt: '2026-03-18', status: 'production', milestones: { ack: true, drawings: true, production: true, qc: false, shipped: false }, unitBreakdown: [{ name: 'Casement', count: 14, price: 41200 }, { name: 'Picture', count: 10, price: 28000 }, { name: 'Awning', count: 7, price: 18200 }], drawings: [{ id: 'pkg-v1', name: 'Drawing pkg v1 · 31 units', status: 'approved' }], thread: [{ from: 'factory', name: 'Marcus H.', initials: 'NF', time: '6h ago', body: 'Luxury Mansion build. Extra inspection passes.' }] }
  ],
  // ═════════════ Calendar tasks — owner attention required ═════════════
  // Tasks the owner needs to approve, review, or decide on, anchored to a date
  // kinds: approve-discount, approve-po, approve-warranty, approve-rush, approve-dealer, approve-price, review-qc, review-drawing, triage-warranty, machine-repair, contract-renewal
  calendarTasks: [
    { id: 'tk-001', date: '2026-05-01', kind: 'contract-renewal', priority: 'normal', title: 'Cardinal IG annual contract', detail: 'Renew or renegotiate — current term ends May 31',                              link: { view: 'materials', tab: 'suppliers' } },
    { id: 'tk-002', date: '2026-05-04', kind: 'approve-rush',     priority: 'urgent', title: 'Rush fee waiver: Cedar Park',  detail: 'Sunrise · GC builder · −$3,200',                                         orderId: 2407, link: { view: 'production', tab: 'rush' } },
    { id: 'tk-003', date: '2026-05-04', kind: 'review-qc',        priority: 'urgent', title: 'QC fail: frame weld defect',   detail: 'O-2407 Cedar Park · 1 unit held',                                        orderId: 2407, link: { view: 'production', tab: 'qc' } },
    { id: 'tk-004', date: '2026-05-05', kind: 'approve-discount', priority: 'urgent', title: 'Discount override: Sunrise',   detail: 'Tier A 0.58 → 0.54 · 12-month commit · −$8.4K GP annual',                link: { view: 'dealers' } },
    { id: 'tk-005', date: '2026-05-05', kind: 'approve-po',       priority: 'normal', title: 'PO over threshold: Cardinal',  detail: 'Triple-pane IGU bulk · 800 m² · $73.6K',                                 link: { view: 'materials', tab: 'pos' } },
    { id: 'tk-006', date: '2026-05-06', kind: 'review-drawing',   priority: 'warn',   title: '3 drawings overdue signoff',   detail: 'Bayview · Coastline · Northern · 4+ days each',                          link: { view: 'production', tab: 'drawings' } },
    { id: 'tk-007', date: '2026-05-06', kind: 'approve-warranty', priority: 'urgent', title: 'Warranty remake: Maple IGU×2', detail: 'Q-2390 · 18-month failure · $1,840 cost',                                link: { view: 'production', tab: 'warranty' } },
    { id: 'tk-008', date: '2026-05-07', kind: 'machine-repair',   priority: 'warn',   title: 'Stürtz Corner Cleaner repair', detail: '22h offline · service quote $4,200',                                     link: { view: 'settings', tab: 'machines' } },
    { id: 'tk-009', date: '2026-05-07', kind: 'approve-dealer',   priority: 'normal', title: 'New dealer: Granite Builders', detail: 'Kingston, ON · Net 30 · est. $250K annual',                              link: { view: 'dealers' } },
    { id: 'tk-010', date: '2026-05-08', kind: 'triage-warranty',  priority: 'urgent', title: 'Warranty claim: Coastline',    detail: 'IGU seal failure × 3 units · investigate batch',                         link: { view: 'production', tab: 'warranty' } },
    { id: 'tk-011', date: '2026-05-08', kind: 'review-qc',        priority: 'warn',   title: 'QC fail: hardware misalign',   detail: 'O-2411 Harbourfront · 2 units flagged',                                  orderId: 2411, link: { view: 'production', tab: 'qc' } },
    { id: 'tk-012', date: '2026-05-11', kind: 'approve-price',    priority: 'normal', title: 'Price update: +5% Casement',   detail: '3 products · effective May 15 · +$24K annual',                           link: { view: 'catalog', tab: 'products' } },
    { id: 'tk-013', date: '2026-05-11', kind: 'review-drawing',   priority: 'warn',   title: 'Drawing revision: Oakridge',   detail: 'Bayside Mansion · dealer requested 4 changes',                           orderId: 2424, link: { view: 'production', tab: 'drawings' } },
    { id: 'tk-014', date: '2026-05-12', kind: 'approve-rush',     priority: 'urgent', title: 'Rush request: Hartwood',       detail: 'Maple · $300 expedite fee · customer moving',                            orderId: 2408, link: { view: 'production', tab: 'rush' } },
    { id: 'tk-015', date: '2026-05-12', kind: 'review-drawing',   priority: 'warn',   title: 'Dealer feedback: Heritage Sq', detail: '4 elevation changes requested',                                          orderId: 2435, link: { view: 'production', tab: 'drawings' } },
    { id: 'tk-015b', date: '2026-05-12', kind: 'approve-po',      priority: 'normal', title: 'PO: Roto NT hardware',         detail: 'Q2 lockset replenish · $14,200',                                         completed: true, completedAt: 'This morning · 8:42 AM', link: { view: 'materials', tab: 'pos' } },
    { id: 'tk-016', date: '2026-05-13', kind: 'approve-po',       priority: 'normal', title: 'VEKA bronze extrusion order',  detail: 'Reorder · $18,400 · 6-week lead',                                        link: { view: 'materials', tab: 'pos' } },
    { id: 'tk-017', date: '2026-05-14', kind: 'review-qc',        priority: 'warn',   title: 'QC: Glenbrook Estate',         detail: 'Pre-ship inspection · 18 units · Oakridge',                              orderId: 2412, link: { view: 'production', tab: 'qc' } },
    { id: 'tk-018', date: '2026-05-15', kind: 'approve-discount', priority: 'normal', title: 'Volume discount: Oakridge',    detail: 'Q2 review · raise tier multiplier?',                                     link: { view: 'dealers' } },
    { id: 'tk-019', date: '2026-05-18', kind: 'triage-warranty',  priority: 'warn',   title: 'Warranty: hardware squeak',    detail: 'Roto NT batch from Feb · 3 reports this week',                           link: { view: 'production', tab: 'warranty' } },
    { id: 'tk-020', date: '2026-05-19', kind: 'approve-po',       priority: 'normal', title: 'Cardinal IGU Q2 contract',     detail: 'Annual bulk pricing · 1,200 m² commit',                                  link: { view: 'materials', tab: 'pos' } },
    { id: 'tk-021', date: '2026-05-20', kind: 'review-drawing',   priority: 'warn',   title: 'Sign off: Bayshore Mansion',   detail: 'O-2440 · 31 units · Sunrise · luxury build',                             orderId: 2440, link: { view: 'production', tab: 'drawings' } },
    { id: 'tk-022', date: '2026-05-21', kind: 'machine-repair',   priority: 'normal', title: 'IGU sealer preventive maint',  detail: 'Scheduled service · 4h downtime',                                        link: { view: 'settings', tab: 'machines' } },
    { id: 'tk-023', date: '2026-05-22', kind: 'approve-dealer',   priority: 'normal', title: 'Dealer review: Lakeside',      detail: 'Renewal · 12-month performance · 124 orders',                            link: { view: 'dealers' } },
    { id: 'tk-024', date: '2026-05-25', kind: 'approve-discount', priority: 'urgent', title: 'Volume override: Bayview',     detail: 'Cornerstone build · 8% extra requested',                                 orderId: 2439, link: { view: 'dealers' } },
    { id: 'tk-025', date: '2026-05-26', kind: 'review-drawing',   priority: 'warn',   title: 'Drawing approval: Pinecrest',  detail: 'O-2427 · 36 units multi-family · final review',                          orderId: 2427, link: { view: 'production', tab: 'drawings' } },
    { id: 'tk-026', date: '2026-05-27', kind: 'approve-warranty', priority: 'urgent', title: 'Remake approval: Coastline',   detail: 'IGU batch defect · 3 units · $2,640',                                    link: { view: 'production', tab: 'warranty' } },
    { id: 'tk-027', date: '2026-05-28', kind: 'approve-price',    priority: 'normal', title: 'Hardware price update',        detail: 'Roto NT cost +6% · pass-through to dealers?',                            link: { view: 'catalog', tab: 'hardware' } },
    { id: 'tk-028', date: '2026-05-28', kind: 'contract-renewal', priority: 'normal', title: 'Insurance renewal review',     detail: 'Annual liability + property · quotes received',                          link: { view: 'settings' } },
    { id: 'tk-029', date: '2026-05-29', kind: 'review-qc',        priority: 'warn',   title: 'Pre-ship: Mountainview',       detail: 'O-2426 · 11 units · Northern Light',                                     orderId: 2426, link: { view: 'production', tab: 'qc' } },
    { id: 'tk-030', date: '2026-05-29', kind: 'approve-po',       priority: 'normal', title: 'Caldwell Hardware Q3',         detail: 'Bulk lockset purchase · $32K · 8-week lead',                             link: { view: 'materials', tab: 'pos' } }
  ],
  // ═════════════ Stalled / on-hold orders ═════════════
  // Each hold describes an order stuck at some production stage and who the owner needs to follow up with.
  holds: [
    { id: 'hold-001', date: '2026-05-12', orderId: 2408, stage: 'drawings',  stageLabel: 'Drawing review',    blocker: 'dealer',    followUp: 'Maple Street · Rafi B.',     reason: '4 elevation changes requested · waiting on revised approvals',        daysOnHold: 5 },
    { id: 'hold-002', date: '2026-05-12', orderId: 2398, stage: 'materials', stageLabel: 'Materials PO',      blocker: 'supplier',  followUp: 'VEKA Canada · Lisa T.',       reason: 'Bronze cap stock backorder · ETA PO arriving May 14',                  daysOnHold: 3 },
    { id: 'hold-003', date: '2026-05-12', orderId: 2415, stage: 'qc',        stageLabel: 'QC inspection',     blocker: 'qc',        followUp: 'QC team · Dave P.',           reason: 'QC tech out sick · 14 units pending re-inspection slot',               daysOnHold: 2 },
    { id: 'hold-004', date: '2026-05-12', orderId: 2399, stage: 'drawings',  stageLabel: 'Drawing approval',  blocker: 'dealer',    followUp: 'Maple Street · Rafi B.',     reason: 'No response to revision V3 sent May 6 · 2 follow-up emails sent',       daysOnHold: 6 },
    { id: 'hold-005', date: '2026-05-12', orderId: 2422, stage: 'measure',   stageLabel: 'Field measure',     blocker: 'installer', followUp: 'Premier Installs · Joe K.',   reason: 'Installer cert renewal pending insurer · cannot field-measure yet',     daysOnHold: 4 },
    { id: 'hold-006', date: '2026-05-12', orderId: 2407, stage: 'production',stageLabel: 'Welding · machine down', blocker: 'machine', followUp: 'Marcus Hill · Production',    reason: 'Rotox welder #1 PLC fault · service tech ETA May 13 · 6 units queued',  daysOnHold: 1 },
    { id: 'hold-007', date: '2026-05-12', orderId: 2409, stage: 'production',stageLabel: 'Hardware backorder',blocker: 'supplier',  followUp: 'Roto Frank · Hannah M.',      reason: 'Tilt-turn hardware kits arrived short by 8 sets · partial ship Friday', daysOnHold: 2 },
    { id: 'hold-008', date: '2026-05-12', orderId: 2418, stage: 'production',stageLabel: 'Customer change requested', blocker: 'dealer', followUp: 'Oakridge · Priya V.',     reason: 'Customer requested grid change on 4 picture units · need spec confirmation', daysOnHold: 1 }
  ],
  // ═════════════ Rush requests ═════════════
  rushRequests: [
    { id: 1, orderId: 2407, status: 'REQUESTED', requestedAt: '2026-05-08', requestedBy: 'Tara F. · Sunrise Windows', priority: 1, reason: 'Site framing finished early. Need delivery by Monday to keep install crew on schedule.', urgent: true },
    { id: 2, orderId: 2408, status: 'REQUESTED', requestedAt: '2026-05-10', requestedBy: 'Rafi B. · Maple Street', priority: 2, reason: 'Customer relocating in 6 days. Would $300 expedite fee unlock priority slot?' },
    { id: 3, orderId: 2404, status: 'APPROVED', requestedAt: '2026-05-04', decidedAt: '2026-05-04', requestedBy: 'Tara F. · Sunrise Windows', priority: 2, reason: 'Builder schedule pressure.', approvedPriorityLevel: 2 }
  ],
  // ═════════════ Warranty claims ═════════════
  warrantyClaims: [
    { id: 1, claimNumber: 'CLAIM-2026-000001', orderId: 2402, status: 'FLAGGED', category: 'BROKEN_GLASS', flaggedAt: '2026-05-09', flaggedBy: 'Rafi B. · Maple Street', affectedUnits: 1, description: 'Lite #4 (kitchen) IGU has visible crack along south edge. Installer photos attached. Not from impact.' },
    { id: 2, claimNumber: 'CLAIM-2026-000002', orderId: 2398, status: 'ACKNOWLEDGED_BY_FACTORY', category: 'HARDWARE_DEFECT', flaggedAt: '2026-05-06', flaggedBy: 'Coastline Builders', affectedUnits: 2, description: 'Sash locks on two casements bind when engaging. Hardware kit appears mis-aligned.' },
    { id: 3, claimNumber: 'CLAIM-2026-000003', orderId: 2399, status: 'APPROVED', category: 'WRONG_SIZE', flaggedAt: '2026-04-28', decidedAt: '2026-05-01', affectedUnits: 1, description: 'Unit #7 came in 24" instead of spec\'d 26".' },
    { id: 4, claimNumber: 'CLAIM-2025-000048', orderId: 2402, status: 'RESOLVED', category: 'SEAL_FAILURE', flaggedAt: '2025-11-12', decidedAt: '2025-11-30', resolvedAt: '2026-01-15', affectedUnits: 1, description: 'IGU showing internal condensation after 2 weeks.' }
  ],
  // ═════════════ Audit log entries (own + child) ═════════════
  auditEvents: [
    { id: 1, kind: 'order.state_transition', actor: 'Marcus Hill', initials: 'MH', tenantId: 'northforge', scope: 'own', at: 'just now', target: 'O-2409 · Lakeshore Renovation', meta: 'PRODUCTION_SCHEDULED → IN_PRODUCTION' },
    { id: 2, kind: 'order.created', actor: 'Rafi B.', initials: 'MS', tenantId: 'maple', scope: 'dealer', at: '2m ago', target: 'O-2410 · Riverside Heights', meta: 'PO submitted to Northforge' },
    { id: 3, kind: 'order.acknowledged', actor: 'System', initials: 'OS', tenantId: 'northforge', scope: 'own', at: '18m ago', target: 'O-2406 · Aspen Grove', meta: 'Drawing approved by dealer' },
    { id: 4, kind: 'quote.approved', actor: 'Tara F.', initials: 'SW', tenantId: 'sunrise', scope: 'dealer', at: '2h ago', target: 'Q-1107 · Cedar Park ext', meta: 'Drawing pkg v2 approved' },
    { id: 5, kind: 'user.invited', actor: 'Sam Chen', initials: 'SC', tenantId: 'northforge', scope: 'own', at: 'Yesterday 4:30 PM', target: 'jules@northforge.demo', meta: 'Invited as MANAGER' },
    { id: 6, kind: 'price_sheet.published', actor: 'Sam Chen', initials: 'SC', tenantId: 'northforge', scope: 'own', at: 'Yesterday 11:18 AM', target: 'Casement / 2026 Q2 sheet', meta: 'Published v3' },
    { id: 7, kind: 'rush_request.approved', actor: 'Sam Chen', initials: 'SC', tenantId: 'northforge', scope: 'own', at: '2d ago', target: 'O-2404 · Brookside Terrace', meta: 'Priority raised to P2' },
    { id: 8, kind: 'warranty_claim.acknowledged', actor: 'Marcus Hill', initials: 'MH', tenantId: 'northforge', scope: 'own', at: '4d ago', target: 'CLAIM-2026-000002', meta: 'HARDWARE_DEFECT acknowledged' },
    { id: 9, kind: 'order.delivered', actor: 'Jules Tan', initials: 'JT', tenantId: 'northforge', scope: 'own', at: 'Yesterday', target: 'O-2402 · Windermere Heights', meta: 'Signed receipt on file' },
    { id: 10, kind: 'dealer.invited', actor: 'Sam Chen', initials: 'SC', tenantId: 'northforge', scope: 'own', at: '6d ago', target: 'owner@waveline.demo', meta: 'New dealer tenant invite' },
    { id: 11, kind: 'dealer_tier.updated', actor: 'Sam Chen', initials: 'SC', tenantId: 'northforge', scope: 'own', at: '8d ago', target: 'Tier A (Premium)', meta: 'Multiplier 0.55 → 0.58' },
    { id: 12, kind: 'catalog.variant_created', actor: 'Lin Park', initials: 'LP', tenantId: 'northforge', scope: 'own', at: '9d ago', target: 'Casement 4500 · Anodized Bronze', meta: 'New variant added' }
  ],
  // ═════════════ Users (own tenant) ═════════════
  users: [
    { id: 1, name: 'Sam Chen', email: 'sam@northforge.demo', role: 'OWNER', initials: 'SC', lastActive: '2m ago', invitedBy: null },
    { id: 2, name: 'Marcus Hill', email: 'marcus@northforge.demo', role: 'MANAGER', initials: 'MH', lastActive: 'just now', invitedBy: 'Sam Chen' },
    { id: 3, name: 'Lin Park', email: 'lin@northforge.demo', role: 'ESTIMATOR', initials: 'LP', lastActive: '1h ago', invitedBy: 'Sam Chen' },
    { id: 4, name: 'Jules Tan', email: 'jules@northforge.demo', role: 'MANAGER', initials: 'JT', lastActive: '3h ago', invitedBy: 'Sam Chen' },
    { id: 5, name: 'Devon Pham', email: 'devon@northforge.demo', role: 'VIEWER', initials: 'DP', lastActive: '2d ago', invitedBy: 'Sam Chen' }
  ],
  // ═════════════ Catalog (own tenant — factory owns) ═════════════
  catalog: {
    products: [
      // ═══ WINDOWS — Casement family ═══
      { id: 1,  slug: 'casement-4500',          name: 'Casement 4500',          category: 'window', family: 'Casement',     baseSize: '900×1200', enabled: true,  variants: 12, rules: 7,  status: 'published', lastEdit: 'Yesterday', factoryCost: 580,  msrp: 1450, ytdUnits: 142, ytdRevenue: 138750, ytdProfit: 56380 },
      { id: 2,  slug: 'casement-5500',          name: 'Casement 5500 Premium',  category: 'window', family: 'Casement',     baseSize: '900×1200', enabled: true,  variants: 14, rules: 9,  status: 'published', lastEdit: '3d ago',    factoryCost: 720,  msrp: 1820, ytdUnits: 88,  ytdRevenue: 102240, ytdProfit: 41360 },
      { id: 3,  slug: 'casement-6000-coastal',  name: 'Casement 6000 Coastal',  category: 'window', family: 'Casement',     baseSize: '900×1200', enabled: true,  variants: 4,  rules: 12, status: 'draft',     lastEdit: 'Today',     factoryCost: 920,  msrp: 2380, ytdUnits: 0,   ytdRevenue: 0,      ytdProfit: 0 },
      // ═══ WINDOWS — Awning / Hopper ═══
      { id: 4,  slug: 'awning-4500',            name: 'Awning 4500',            category: 'window', family: 'Awning',       baseSize: '900×600',  enabled: true,  variants: 6,  rules: 4,  status: 'published', lastEdit: '2w ago',    factoryCost: 420,  msrp: 1080, ytdUnits: 64,  ytdRevenue: 46080,  ytdProfit: 19200 },
      { id: 5,  slug: 'hopper-3500',            name: 'Hopper 3500',            category: 'window', family: 'Hopper',       baseSize: '600×400',  enabled: true,  variants: 4,  rules: 2,  status: 'published', lastEdit: '4w ago',    factoryCost: 280,  msrp: 720,  ytdUnits: 22,  ytdRevenue: 11880,  ytdProfit: 5060 },
      // ═══ WINDOWS — Hung family ═══
      { id: 6,  slug: 'single-hung-3000',       name: 'Single-hung 3000',       category: 'window', family: 'Single-hung',  baseSize: '800×1400', enabled: true,  variants: 6,  rules: 3,  status: 'published', lastEdit: '1mo ago',   factoryCost: 380,  msrp: 940,  ytdUnits: 48,  ytdRevenue: 33840,  ytdProfit: 13520 },
      { id: 7,  slug: 'double-hung-3200',       name: 'Double-hung 3200',       category: 'window', family: 'Double-hung',  baseSize: '800×1400', enabled: true,  variants: 8,  rules: 5,  status: 'published', lastEdit: '1w ago',    factoryCost: 480,  msrp: 1180, ytdUnits: 96,  ytdRevenue: 75520,  ytdProfit: 29440 },
      // ═══ WINDOWS — Slider family ═══
      { id: 8,  slug: 'single-slider-3500',     name: 'Single-slider 3500',     category: 'window', family: 'Single-slider', baseSize: '1500×900', enabled: true,  variants: 7,  rules: 4,  status: 'published', lastEdit: '3w ago',    factoryCost: 510,  msrp: 1280, ytdUnits: 56,  ytdRevenue: 51840,  ytdProfit: 21120 },
      { id: 9,  slug: 'sliding-3-track',        name: 'Sliding 3-track',        category: 'window', family: 'Double-slider',baseSize: '1800×900', enabled: true,  variants: 9,  rules: 6,  status: 'published', lastEdit: '1mo ago',   factoryCost: 640,  msrp: 1620, ytdUnits: 38,  ytdRevenue: 39520,  ytdProfit: 15580 },
      { id: 10, slug: 'end-vent-4400',          name: 'End-vent 4400',          category: 'window', family: 'End-vent',     baseSize: '2400×1200',enabled: true,  variants: 5,  rules: 3,  status: 'published', lastEdit: '6w ago',    factoryCost: 780,  msrp: 1980, ytdUnits: 14,  ytdRevenue: 16660,  ytdProfit: 6620 },
      // ═══ WINDOWS — Fixed / Picture / Specialty ═══
      { id: 11, slug: 'picture-window',         name: 'Picture window',         category: 'window', family: 'Picture',      baseSize: '1500×1200',enabled: true,  variants: 18, rules: 3,  status: 'published', lastEdit: '3w ago',    factoryCost: 380,  msrp: 980,  ytdUnits: 118, ytdRevenue: 76830,  ytdProfit: 31980 },
      { id: 12, slug: 'fixed-arch-top',         name: 'Fixed arch-top',         category: 'window', family: 'Specialty',    baseSize: '900×1200', enabled: true,  variants: 5,  rules: 2,  status: 'published', lastEdit: '6mo ago',   factoryCost: 850,  msrp: 2150, ytdUnits: 6,   ytdRevenue: 11340,  ytdProfit: 3960 },
      { id: 13, slug: 'tilt-turn-european',     name: 'Tilt-turn European',     category: 'window', family: 'Tilt-turn',    baseSize: '900×1200', enabled: false, variants: 0,  rules: 0,  status: 'disabled',  lastEdit: 'Never',     factoryCost: 1240, msrp: 3180, ytdUnits: 0,   ytdRevenue: 0,      ytdProfit: 0 },
      { id: 14, slug: 'bay-window-3lite',       name: 'Bay window 3-lite',      category: 'window', family: 'Bay/Bow',      baseSize: '2400×1500',enabled: false, variants: 0,  rules: 0,  status: 'disabled',  lastEdit: 'Never',     factoryCost: 1680, msrp: 4280, ytdUnits: 0,   ytdRevenue: 0,      ytdProfit: 0 },
      { id: 15, slug: 'bow-window-4lite',       name: 'Bow window 4-lite',      category: 'window', family: 'Bay/Bow',      baseSize: '3000×1500',enabled: false, variants: 0,  rules: 0,  status: 'disabled',  lastEdit: 'Never',     factoryCost: 1980, msrp: 4980, ytdUnits: 0,   ytdRevenue: 0,      ytdProfit: 0 },
      { id: 16, slug: 'garden-window',          name: 'Garden window',          category: 'window', family: 'Specialty',    baseSize: '900×1200', enabled: false, variants: 0,  rules: 0,  status: 'disabled',  lastEdit: 'Never',     factoryCost: 1420, msrp: 3580, ytdUnits: 0,   ytdRevenue: 0,      ytdProfit: 0 },
      { id: 17, slug: 'radius-shapes',          name: 'Radius shapes',          category: 'window', family: 'Specialty',    baseSize: 'Custom',   enabled: true,  variants: 8,  rules: 6,  status: 'published', lastEdit: '2mo ago',   factoryCost: 920,  msrp: 2380, ytdUnits: 4,   ytdRevenue: 9520,   ytdProfit: 3320 },
      // ═══ GARAGE DOORS ═══
      { id: 29, slug: 'garage-steel-sect-16',   name: 'Garage · Steel sectional 16′',     category: 'garage-door', family: 'Steel sectional', baseSize: '4877×2134', enabled: false, variants: 0, rules: 0, status: 'disabled', lastEdit: 'Never', factoryCost: 1860, msrp: 4680, ytdUnits: 0, ytdRevenue: 0, ytdProfit: 0 },
      { id: 30, slug: 'garage-wood-sect-16',    name: 'Garage · Wood sectional 16′',      category: 'garage-door', family: 'Wood sectional',  baseSize: '4877×2134', enabled: false, variants: 0, rules: 0, status: 'disabled', lastEdit: 'Never', factoryCost: 4280, msrp: 10840,ytdUnits: 0, ytdRevenue: 0, ytdProfit: 0 },
      { id: 31, slug: 'garage-alu-glass-16',    name: 'Garage · Aluminum-glass 16′',      category: 'garage-door', family: 'Aluminum-glass',  baseSize: '4877×2134', enabled: false, variants: 0, rules: 0, status: 'disabled', lastEdit: 'Never', factoryCost: 5840, msrp: 14820,ytdUnits: 0, ytdRevenue: 0, ytdProfit: 0 }
    ],
    components: [
      // ═══ GLASS / IGU ═══
      { id: 101, slug: 'glass-dbl-clear',        name: 'Double-pane clear',                category: 'glass',   type: 'IGU package', vendor: 'Vitro',     enabled: true,  factoryCost: 38,   upcharge: 0,    uom: 'm²', ytdUnits: 0,   ytdRevenue: 0,    notes: 'Base glazing — included in all products', isBase: true },
      { id: 102, slug: 'glass-dbl-lowe-272-ar',  name: 'Double-pane Low-E 272 / Argon',    category: 'glass',   type: 'IGU package', vendor: 'Cardinal IG', enabled: true, factoryCost: 48,   upcharge: 85,   uom: 'm²', ytdUnits: 412, ytdRevenue: 35020, notes: 'ENERGY STAR Zone 1 · most popular' },
      { id: 103, slug: 'glass-dbl-lowe-180',     name: 'Double-pane Low-E 180 (cold)',     category: 'glass',   type: 'IGU package', vendor: 'Cardinal IG', enabled: true, factoryCost: 56,   upcharge: 120,  uom: 'm²', ytdUnits: 88,  ytdRevenue: 10560, notes: 'Best for north-facing · Zone 2-3' },
      { id: 104, slug: 'glass-dbl-lowe-366',     name: 'Double-pane Low-E 366 / Argon',    category: 'glass',   type: 'IGU package', vendor: 'Cardinal IG', enabled: true, factoryCost: 62,   upcharge: 140,  uom: 'm²', ytdUnits: 64,  ytdRevenue: 8960,  notes: 'Highest solar control · south-facing' },
      { id: 105, slug: 'glass-trp-lowe-kr',      name: 'Triple-pane Low-E / Krypton',      category: 'glass',   type: 'IGU package', vendor: 'Cardinal IG', enabled: true, factoryCost: 92,   upcharge: 280,  uom: 'm²', ytdUnits: 38,  ytdRevenue: 10640, notes: 'Premium · Passive House compatible' },
      { id: 106, slug: 'glass-tempered',         name: 'Tempered (safety) upgrade',        category: 'glass',   type: 'Treatment',   vendor: 'Vitro',     enabled: true,  factoryCost: 24,   upcharge: 65,   uom: 'm²', ytdUnits: 142, ytdRevenue: 9230,  notes: 'Required by OBC near doors / floor / wet areas' },
      { id: 107, slug: 'glass-laminated',        name: 'Laminated (security) upgrade',     category: 'glass',   type: 'Treatment',   vendor: 'Vitro',     enabled: true,  factoryCost: 38,   upcharge: 110,  uom: 'm²', ytdUnits: 18,  ytdRevenue: 1980,  notes: 'Sound + UV + impact resistance' },
      { id: 108, slug: 'glass-obscure-frost',    name: 'Obscure / frosted',                category: 'glass',   type: 'Treatment',   vendor: 'Vitro',     enabled: true,  factoryCost: 18,   upcharge: 45,   uom: 'm²', ytdUnits: 56,  ytdRevenue: 2520,  notes: 'Bathroom / privacy applications' },
      { id: 109, slug: 'glass-tinted-bronze',    name: 'Tinted glass · bronze',            category: 'glass',   type: 'Treatment',   vendor: 'Vitro',     enabled: false, factoryCost: 16,   upcharge: 40,   uom: 'm²', ytdUnits: 0,   ytdRevenue: 0,    notes: 'Aesthetic option' },
      { id: 110, slug: 'glass-decorative-grid',  name: 'Decorative grilles (internal)',    category: 'glass',   type: 'Treatment',   vendor: 'In-house',  enabled: true,  factoryCost: 22,   upcharge: 75,   uom: 'window', ytdUnits: 96,  ytdRevenue: 7200, notes: 'Colonial / prairie / craftsman patterns' },

      // ═══ HARDWARE ═══
      { id: 201, slug: 'hw-cam-lock-sn',         name: 'Single cam lock · satin nickel',   category: 'hardware', type: 'Lock',      vendor: 'AmesburyTruth', enabled: true,  factoryCost: 4.20, upcharge: 0,    uom: 'ea', ytdUnits: 380, ytdRevenue: 0,     notes: 'Standard on casements · included', isBase: true },
      { id: 202, slug: 'hw-cam-lock-blk',        name: 'Single cam lock · matte black',    category: 'hardware', type: 'Lock',      vendor: 'AmesburyTruth', enabled: true,  factoryCost: 6.80, upcharge: 25,   uom: 'ea', ytdUnits: 142, ytdRevenue: 3550,  notes: 'Premium finish' },
      { id: 203, slug: 'hw-multi-3pt-sn',        name: 'Multi-point 3-pt lock · SN',       category: 'hardware', type: 'Lock',      vendor: 'AmesburyTruth', enabled: true,  factoryCost: 28,   upcharge: 80,   uom: 'kit', ytdUnits: 86,  ytdRevenue: 6880,  notes: 'Required for windows > 1100mm height' },
      { id: 204, slug: 'hw-multi-3pt-blk',       name: 'Multi-point 3-pt lock · black',    category: 'hardware', type: 'Lock',      vendor: 'AmesburyTruth', enabled: true,  factoryCost: 32,   upcharge: 105,  uom: 'kit', ytdUnits: 24,  ytdRevenue: 2520,  notes: 'Premium finish' },
      { id: 205, slug: 'hw-crank-folding-sn',    name: 'Folding crank operator · SN',      category: 'hardware', type: 'Operator',  vendor: 'AmesburyTruth', enabled: true,  factoryCost: 6.80, upcharge: 0,    uom: 'ea', ytdUnits: 412, ytdRevenue: 0,     notes: 'Standard casement crank · included', isBase: true },
      { id: 206, slug: 'hw-crank-folding-blk',   name: 'Folding crank operator · black',   category: 'hardware', type: 'Operator',  vendor: 'AmesburyTruth', enabled: true,  factoryCost: 9.20, upcharge: 32,   uom: 'ea', ytdUnits: 118, ytdRevenue: 3780,  notes: 'Matches multi-point lock finish' },
      { id: 207, slug: 'hw-crank-truth-encore',  name: 'Truth Encore casement operator',   category: 'hardware', type: 'Operator',  vendor: 'AmesburyTruth', enabled: true,  factoryCost: 18,   upcharge: 65,   uom: 'ea', ytdUnits: 28,  ytdRevenue: 1820,  notes: 'Heavy-duty · for large windows' },
      { id: 208, slug: 'hw-hinge-4bar-egress',   name: '4-bar egress hinge pair',          category: 'hardware', type: 'Hinge',     vendor: 'AmesburyTruth', enabled: true,  factoryCost: 11.40,upcharge: 0,    uom: 'pr', ytdUnits: 412, ytdRevenue: 0,     notes: 'Code-required egress hinges · included', isBase: true },
      { id: 209, slug: 'hw-hinge-concealed',     name: 'Concealed hinge pair',             category: 'hardware', type: 'Hinge',     vendor: 'AmesburyTruth', enabled: true,  factoryCost: 22,   upcharge: 75,   uom: 'pr', ytdUnits: 12,  ytdRevenue: 900,   notes: 'Hidden when closed · modern look' },
      { id: 210, slug: 'hw-roto-nt-tilt-turn',   name: 'Roto NT tilt-turn hardware kit',   category: 'hardware', type: 'Operator',  vendor: 'Roto',          enabled: false, factoryCost: 84,   upcharge: 240,  uom: 'kit', ytdUnits: 0,   ytdRevenue: 0,    notes: 'European-style tilt-turn windows only' },
      { id: 211, slug: 'hw-balance-single-hung', name: 'Block-and-tackle balance',         category: 'hardware', type: 'Balance',   vendor: 'AmesburyTruth', enabled: true,  factoryCost: 14,   upcharge: 0,    uom: 'pr', ytdUnits: 96,  ytdRevenue: 0,     notes: 'Standard on single/double-hung · included', isBase: true },

      // ═══ WEATHERSTRIP & SEALS ═══
      { id: 301, slug: 'ws-foam-bulb-7-blk',     name: 'Q-Lon foam bulb 7mm · black',      category: 'weatherstrip', type: 'Bulb seal', vendor: 'Q-Lon', enabled: true, factoryCost: 0.85, upcharge: 0, uom: 'm', ytdUnits: 0, ytdRevenue: 0, notes: 'Standard sash perimeter seal · included', isBase: true },
      { id: 302, slug: 'ws-fin-seal-9-blk',      name: 'Q-Lon fin seal 9mm · black',       category: 'weatherstrip', type: 'Fin seal',  vendor: 'Q-Lon', enabled: true, factoryCost: 0.62, upcharge: 0, uom: 'm', ytdUnits: 0, ytdRevenue: 0, notes: 'Standard frame seal · included', isBase: true },
      { id: 303, slug: 'ws-triple-fin-cold',     name: 'Triple-fin cold-climate seal',     category: 'weatherstrip', type: 'Fin seal',  vendor: 'Q-Lon', enabled: true, factoryCost: 1.40, upcharge: 35, uom: 'window', ytdUnits: 64, ytdRevenue: 2240, notes: 'Recommended for Zone 2-3 installations' },

      // ═══ SCREENS ═══
      { id: 401, slug: 'scrn-std-charcoal',      name: 'Standard fibreglass · charcoal',   category: 'screen', type: 'Mesh',     vendor: 'Phifer', enabled: true,  factoryCost: 8,    upcharge: 0,    uom: 'window', ytdUnits: 412, ytdRevenue: 0,    notes: 'Standard 18×16 mesh · included', isBase: true },
      { id: 402, slug: 'scrn-pet-screen',        name: 'Heavy-duty Pet Screen',            category: 'screen', type: 'Mesh',     vendor: 'Phifer', enabled: true,  factoryCost: 14,   upcharge: 38,   uom: 'window', ytdUnits: 38,  ytdRevenue: 1444, notes: 'Tear-resistant · 7× stronger' },
      { id: 403, slug: 'scrn-no-seeum',          name: 'No-See-Um fine mesh',              category: 'screen', type: 'Mesh',     vendor: 'Phifer', enabled: true,  factoryCost: 11,   upcharge: 26,   uom: 'window', ytdUnits: 22,  ytdRevenue: 572,  notes: '20×20 finer weave · blocks small insects' },
      { id: 404, slug: 'scrn-solar-shade-90',    name: 'SunTex 90 solar screen',           category: 'screen', type: 'Mesh',     vendor: 'Phifer', enabled: true,  factoryCost: 18,   upcharge: 48,   uom: 'window', ytdUnits: 14,  ytdRevenue: 672,  notes: 'Blocks 90% UV · reduces solar heat gain' },
      { id: 405, slug: 'scrn-retractable',       name: 'Retractable / rollaway screen',    category: 'screen', type: 'Frame',    vendor: 'Mirage', enabled: false, factoryCost: 64,   upcharge: 180,  uom: 'window', ytdUnits: 0,   ytdRevenue: 0,    notes: 'Hidden when not in use · premium upgrade' },

      // ═══ TRIM & ACCESSORIES ═══
      { id: 501, slug: 'trim-brickmold-180-wht', name: 'BM-180 brickmold · white',         category: 'trim', type: 'Brickmold', vendor: 'VEKA', enabled: true,  factoryCost: 4.20, upcharge: 0,    uom: 'm', ytdUnits: 0,  ytdRevenue: 0,    notes: 'Standard exterior trim · white · included', isBase: true },
      { id: 502, slug: 'trim-brickmold-180-brz', name: 'BM-180 brickmold · bronze',        category: 'trim', type: 'Brickmold', vendor: 'VEKA', enabled: true,  factoryCost: 5.80, upcharge: 22,   uom: 'window', ytdUnits: 64, ytdRevenue: 1408,  notes: 'Matches bronze frame finish' },
      { id: 503, slug: 'trim-brickmold-180-blk', name: 'BM-180 brickmold · matte black',   category: 'trim', type: 'Brickmold', vendor: 'VEKA', enabled: true,  factoryCost: 6.20, upcharge: 28,   uom: 'window', ytdUnits: 22, ytdRevenue: 616,   notes: 'Matches black laminate frame' },
      { id: 504, slug: 'trim-jamb-ext-vinyl',    name: 'Jamb extension · vinyl-clad',      category: 'trim', type: 'Jamb extension', vendor: 'In-house', enabled: true, factoryCost: 12, upcharge: 32, uom: 'window', ytdUnits: 88, ytdRevenue: 2816, notes: 'For thicker walls (>6¾")' },
      { id: 505, slug: 'trim-jamb-ext-wood',     name: 'Jamb extension · pine (paintable)',category: 'trim', type: 'Jamb extension', vendor: 'In-house', enabled: true, factoryCost: 16, upcharge: 48, uom: 'window', ytdUnits: 42, ytdRevenue: 2016, notes: 'Stainable / paintable interior' },
      { id: 506, slug: 'trim-interior-return',   name: 'Interior return trim · white',     category: 'trim', type: 'Interior return', vendor: 'In-house', enabled: true, factoryCost: 8, upcharge: 24, uom: 'window', ytdUnits: 56, ytdRevenue: 1344, notes: 'Drywall-return finish' },

      // ═══ MISC / SAFETY / SPECIAL ═══
      { id: 601, slug: 'opt-safety-restrictor',  name: 'Safety opening restrictor',        category: 'misc', type: 'Safety',      vendor: 'AmesburyTruth', enabled: true, factoryCost: 6.20, upcharge: 22, uom: 'window', ytdUnits: 18, ytdRevenue: 396, notes: 'Limits opening to 100mm · child safety' },
      { id: 602, slug: 'opt-fall-prevention',    name: 'Fall-prevention bar (interior)',   category: 'misc', type: 'Safety',      vendor: 'In-house',       enabled: true, factoryCost: 12,   upcharge: 38, uom: 'window', ytdUnits: 6,  ytdRevenue: 228, notes: 'Code-required above 600mm sill height in some jurisdictions' },
      { id: 603, slug: 'opt-keyed-lock',         name: 'Keyed cam lock',                   category: 'misc', type: 'Security',    vendor: 'AmesburyTruth', enabled: true, factoryCost: 8.40, upcharge: 28, uom: 'ea',     ytdUnits: 14, ytdRevenue: 392, notes: 'Lockable casement · common for rentals' },
      { id: 604, slug: 'opt-anti-slam',          name: 'Anti-slam dampener',               category: 'misc', type: 'Comfort',     vendor: 'AmesburyTruth', enabled: false,factoryCost: 14,   upcharge: 48, uom: 'window', ytdUnits: 0,  ytdRevenue: 0,   notes: 'Soft-close on awning windows' }
    ]
  },
  // ═════════════ Pricing (dealer tiers + price sheets + FX rates) ═════════════
  pricing: {
    dealerTiers: [
      { id: 1, code: 'TIER_A', name: 'Tier A · Premium', multiplier: 0.58, dealers: 1, ytdVolume: 94000 },
      { id: 2, code: 'TIER_B', name: 'Tier B · Standard', multiplier: 0.65, dealers: 1, ytdVolume: 58000 },
      { id: 3, code: 'TIER_C', name: 'Tier C · Entry', multiplier: 0.72, dealers: 1, ytdVolume: 47000 },
      { id: 4, code: 'TIER_D', name: 'Tier D · New', multiplier: 0.78, dealers: 0, ytdVolume: 0 }
    ],
    priceSheets: [
      { id: 1, name: 'Casement 4500 · 2026 Q2', family: 'Casement', version: 3, status: 'published', effectiveFrom: '2026-04-01', cells: 1248, optionAdders: 47 },
      { id: 2, name: 'Casement 5500 · 2026 Q2', family: 'Casement', version: 2, status: 'published', effectiveFrom: '2026-04-01', cells: 1448, optionAdders: 52 },
      { id: 3, name: 'Double-hung 3200 · 2026 Q2', family: 'Double-hung', version: 2, status: 'published', effectiveFrom: '2026-04-01', cells: 980, optionAdders: 38 },
      { id: 4, name: 'Awning 4500 · 2026 Q2', family: 'Awning', version: 1, status: 'published', effectiveFrom: '2026-04-01', cells: 620, optionAdders: 28 },
      { id: 5, name: 'Picture window · 2026 Q2', family: 'Picture', version: 2, status: 'published', effectiveFrom: '2026-04-01', cells: 1860, optionAdders: 24 },
      { id: 6, name: 'Casement 4500 · 2026 Q3 draft', family: 'Casement', version: 0, status: 'draft', effectiveFrom: '2026-07-01', cells: 1248, optionAdders: 47 }
    ],
    fxRates: [
      { id: 1, pair: 'CAD → USD', rate: 0.7305, asOf: '2026-05-10 09:00 ET' },
      { id: 2, pair: 'USD → CAD', rate: 1.3690, asOf: '2026-05-10 09:00 ET' }
    ]
  },
  // ═════════════ ERP / Webhooks / API keys ═════════════
  integrations: {
    erp: {
      configured: false,
      kind: null,  // 'softech' | 'paradigm' | 'fenevision' | 'manual'
      endpoint: null,
      lastSync: null
    },
    webhooks: [
      { id: 1, url: 'https://hooks.northforge.io/orders', events: ['order.state_transition', 'shipment.created'], active: true, lastDelivery: '2m ago · 200' },
      { id: 2, url: 'https://erp.staging.northforge.io/v1/orders', events: ['order.acknowledged'], active: false, lastDelivery: 'never' }
    ],
    apiKeys: [
      { id: 1, name: 'Production · main', prefix: 'nf_live_pa9d…', scopes: ['read', 'admin'], createdAt: '2026-02-14', lastUsed: '4h ago' },
      { id: 2, name: 'Staging · CI', prefix: 'nf_test_4z2k…', scopes: ['read'], createdAt: '2026-04-22', lastUsed: '1d ago' }
    ]
  },
  // ═════════════ Order tracker stage config (factory configurable) ═════════════
  trackerStages: {
    canonical: [
      { id: 'received', label: 'Order Received', detail: 'Quote approved, entering production queue.', durationDays: 1 },
      { id: 'in_production', label: 'In Production', detail: 'Frames cutting, welding, assembly.', durationDays: 14 },
      { id: 'glazing', label: 'Glazing', detail: 'IGUs installed in frames.', durationDays: 3 },
      { id: 'quality_check', label: 'Quality Check', detail: 'Factory QA sign-off.', durationDays: 2 },
      { id: 'ready_for_shipping', label: 'Ready for Shipping', detail: 'Crated and awaiting pickup.', durationDays: 1 },
      { id: 'delivered', label: 'Delivered', detail: 'Received at site.', durationDays: null }
    ],
    custom: [
      { slug: 'thermal-break', label: 'Thermal Break Injection', detail: 'Polyurethane core injected.', durationDays: 1, insertAfter: 'in_production' }
    ]
  },
  // ═════════════ Materials / Inventory / Procurement ═════════════
  materialsTab: 'inventory',  // 'inventory' | 'reorder' | 'suppliers' | 'pos'
  inventoryFilter: 'all',
  poFilter: 'open',
  suppliers: [
    { id: 1, name: 'VEKA Inc.', short: 'VEKA',     category: 'Vinyl extrusions',     gradient: 'linear-gradient(135deg, #1E3A8A 0%, #4a6fd4 100%)', initials: 'VK', contact: 'orders@vekainc.com', phone: '+1 (610) 666-3300', address: 'Fombell, PA · USA',     paymentTerms: 'Net 30', avgLeadDays: 14, onTimePct: 96, ytdSpend: 84600, activeSKUs: 6 },
    { id: 2, name: 'Royal Group',  short: 'Royal',     category: 'Vinyl extrusions (CA)', gradient: 'linear-gradient(135deg, #7C2D12 0%, #DC2626 100%)', initials: 'RG', contact: 'sales@royalgroup.com', phone: '+1 (905) 264-0701', address: 'Vaughan, ON · Canada',  paymentTerms: 'Net 45', avgLeadDays: 10, onTimePct: 98, ytdSpend: 38200, activeSKUs: 4 },
    { id: 3, name: 'Cardinal Glass Industries', short: 'Cardinal IG', category: 'IGUs / Low-E coatings', gradient: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)', initials: 'CI', contact: 'orders@cardinalcorp.com', phone: '+1 (952) 935-1722', address: 'Eden Prairie, MN · USA', paymentTerms: 'Net 30', avgLeadDays: 7,  onTimePct: 99, ytdSpend: 62400, activeSKUs: 5 },
    { id: 4, name: 'Edgetech (Quanex)',    short: 'Edgetech',   category: 'Warm-edge spacers',   gradient: 'linear-gradient(135deg, #166534 0%, #16A34A 100%)', initials: 'ET', contact: 'orders@edgetechig.com', phone: '+1 (740) 439-2338', address: 'Cambridge, OH · USA',  paymentTerms: 'Net 30', avgLeadDays: 10, onTimePct: 94, ytdSpend: 18400, activeSKUs: 3 },
    { id: 5, name: 'AmesburyTruth',       short: 'AmesburyTruth',category: 'Window hardware',    gradient: 'linear-gradient(135deg, #92400E 0%, #D97706 100%)', initials: 'AT', contact: 'csr@amesburytruth.com', phone: '+1 (763) 533-3220', address: 'Owatonna, MN · USA',  paymentTerms: 'Net 30', avgLeadDays: 12, onTimePct: 91, ytdSpend: 22800, activeSKUs: 5 },
    { id: 6, name: 'Roto Frank of America', short: 'Roto',     category: 'Multi-point hardware', gradient: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)', initials: 'RT', contact: 'usa@roto-frank.com',  phone: '+1 (800) 243-0893', address: 'Chesterfield, MO · USA', paymentTerms: 'Net 45', avgLeadDays: 21, onTimePct: 88, ytdSpend: 14600, activeSKUs: 2 },
    { id: 7, name: 'Schlegel Q-Lon',  short: 'Q-Lon',  category: 'Weatherstripping',         gradient: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)', initials: 'QL', contact: 'sales@schlegel.com',  phone: '+1 (888) 763-3777', address: 'Henrietta, NY · USA',  paymentTerms: 'Net 30', avgLeadDays: 14, onTimePct: 95, ytdSpend: 8200, activeSKUs: 2 },
    { id: 8, name: 'Vitro Architectural Glass', short: 'Vitro', category: 'Glass — annealed/tempered', gradient: 'linear-gradient(135deg, #312E81 0%, #4338CA 100%)', initials: 'VT', contact: 'order@vitroglazings.com', phone: '+1 (855) 887-6457', address: 'Cheswick, PA · USA',  paymentTerms: 'Net 45', avgLeadDays: 10, onTimePct: 97, ytdSpend: 16800, activeSKUs: 2 }
  ],
  inventory: [
    // Vinyl extrusions
    { id: 1,  sku: 'VEKA-7000-FRM-WHT', name: 'VEKA 7000 Main frame · White',     category: 'frame', supplierId: 1, uom: 'm',    onHand: 1240, reorderPoint: 1000, reorderQty: 2400, avgWeekly: 320, unitCost: 8.50,  leadDays: 14 },
    { id: 2,  sku: 'VEKA-7000-FRM-BRZ', name: 'VEKA 7000 Main frame · Bronze',    category: 'frame', supplierId: 1, uom: 'm',    onHand: 380,  reorderPoint: 600,  reorderQty: 1200, avgWeekly: 180, unitCost: 9.40,  leadDays: 14 },
    { id: 3,  sku: 'VEKA-7000-FRM-BLK', name: 'VEKA 7000 Main frame · Black laminate', category: 'frame', supplierId: 1, uom: 'm',    onHand: 95,   reorderPoint: 400,  reorderQty: 800,  avgWeekly: 140, unitCost: 12.20, leadDays: 18 },
    { id: 4,  sku: 'VEKA-7000-SSH-WHT', name: 'VEKA 7000 Casement sash · White',  category: 'frame', supplierId: 1, uom: 'm',    onHand: 1880, reorderPoint: 1400, reorderQty: 3200, avgWeekly: 460, unitCost: 7.20,  leadDays: 14 },
    { id: 5,  sku: 'VEKA-7000-SSH-BRZ', name: 'VEKA 7000 Casement sash · Bronze', category: 'frame', supplierId: 1, uom: 'm',    onHand: 540,  reorderPoint: 800,  reorderQty: 1600, avgWeekly: 240, unitCost: 8.10,  leadDays: 14 },
    { id: 6,  sku: 'VEKA-7000-MUL-WHT', name: 'VEKA 7000 Mullion · White',        category: 'frame', supplierId: 1, uom: 'm',    onHand: 720,  reorderPoint: 500,  reorderQty: 1000, avgWeekly: 140, unitCost: 6.40,  leadDays: 14 },
    { id: 7,  sku: 'ROYAL-5000-FRM-WHT',name: 'Royal 5000 frame · White (CA stock)', category: 'frame', supplierId: 2, uom: 'm',  onHand: 1560, reorderPoint: 800,  reorderQty: 1600, avgWeekly: 220, unitCost: 7.80,  leadDays: 10 },
    // Glass + IGUs
    { id: 8,  sku: 'CARD-IGU-DH-LE272-AR',  name: 'Cardinal IGU 4-12-4 Low-E 272 / Argon',  category: 'glass', supplierId: 3, uom: 'm²',   onHand: 142,  reorderPoint: 120, reorderQty: 280, avgWeekly: 38,  unitCost: 48.00, leadDays: 7 },
    { id: 9,  sku: 'CARD-IGU-TP-LE366-KR',  name: 'Cardinal IGU 4-9-4-9-4 Low-E 366 / Krypton (triple)', category: 'glass', supplierId: 3, uom: 'm²',   onHand: 38,   reorderPoint: 60,  reorderQty: 140, avgWeekly: 22,  unitCost: 92.00, leadDays: 9 },
    { id: 10, sku: 'CARD-IGU-DH-LE180',     name: 'Cardinal IGU 4-12-4 Low-E 180 / Argon (cold-climate)', category: 'glass', supplierId: 3, uom: 'm²',   onHand: 88,   reorderPoint: 60,  reorderQty: 160, avgWeekly: 24,  unitCost: 56.00, leadDays: 7 },
    { id: 11, sku: 'VITRO-FLOAT-3MM',       name: 'Vitro 3mm clear annealed float',         category: 'glass', supplierId: 8, uom: 'm²',   onHand: 280,  reorderPoint: 200, reorderQty: 500, avgWeekly: 65,  unitCost: 14.20, leadDays: 10 },
    { id: 12, sku: 'VITRO-TEMP-4MM',        name: 'Vitro 4mm tempered safety',              category: 'glass', supplierId: 8, uom: 'm²',   onHand: 65,   reorderPoint: 80,  reorderQty: 200, avgWeekly: 28,  unitCost: 22.00, leadDays: 14 },
    // IGU spacers
    { id: 13, sku: 'EDGE-SS-WTH-9.5MM',     name: 'Edgetech Super Spacer · White · 9.5mm',  category: 'spacer', supplierId: 4, uom: 'm',    onHand: 1450, reorderPoint: 1200, reorderQty: 2800, avgWeekly: 320, unitCost: 1.60, leadDays: 10 },
    { id: 14, sku: 'EDGE-SS-WTH-13.5MM',    name: 'Edgetech Super Spacer · White · 13.5mm (triple)', category: 'spacer', supplierId: 4, uom: 'm',    onHand: 380,  reorderPoint: 500, reorderQty: 1200, avgWeekly: 180, unitCost: 2.10, leadDays: 10 },
    { id: 15, sku: 'EDGE-DESIC-PKT',        name: 'Edgetech desiccant matrix (per pkt)',    category: 'spacer', supplierId: 4, uom: 'pkt',  onHand: 240,  reorderPoint: 200, reorderQty: 400,  avgWeekly: 60,  unitCost: 2.80, leadDays: 10 },
    // Hardware — locks, balances, hinges, operators
    { id: 16, sku: 'AT-CAM-LOCK-SN',         name: 'AmesburyTruth single cam lock · satin nickel', category: 'hardware', supplierId: 5, uom: 'ea',  onHand: 480, reorderPoint: 400, reorderQty: 1000, avgWeekly: 120, unitCost: 4.20, leadDays: 12 },
    { id: 17, sku: 'AT-MULTI-3PT-SN',        name: 'AmesburyTruth multi-3pt lock kit · satin nickel', category: 'hardware', supplierId: 5, uom: 'kit', onHand: 28,   reorderPoint: 60,  reorderQty: 120,  avgWeekly: 36,  unitCost: 28.00, leadDays: 14 },
    { id: 18, sku: 'AT-CRANK-FOLD-SN',       name: 'AmesburyTruth folding crank · satin nickel',     category: 'hardware', supplierId: 5, uom: 'ea',  onHand: 240, reorderPoint: 250, reorderQty: 500,  avgWeekly: 90,  unitCost: 6.80, leadDays: 12 },
    { id: 19, sku: 'AT-4BAR-EGRESS-WHT',     name: 'AmesburyTruth 4-bar egress hinge pair',          category: 'hardware', supplierId: 5, uom: 'pr',  onHand: 220, reorderPoint: 200, reorderQty: 500,  avgWeekly: 70,  unitCost: 11.40,leadDays: 12 },
    { id: 20, sku: 'ROTO-NT-3PT-WHT',        name: 'Roto NT multi-3pt tilt-turn hardware kit',       category: 'hardware', supplierId: 6, uom: 'kit', onHand: 14,  reorderPoint: 30,  reorderQty: 60,   avgWeekly: 12,  unitCost: 84.00,leadDays: 21 },
    // Weatherstripping
    { id: 21, sku: 'QL-FOAM-7MM-BLK',        name: 'Q-Lon foam bulb 7mm · black',          category: 'weatherstrip', supplierId: 7, uom: 'm', onHand: 920,  reorderPoint: 800, reorderQty: 2000, avgWeekly: 280, unitCost: 0.85, leadDays: 14 },
    { id: 22, sku: 'QL-FIN-9MM-BLK',         name: 'Q-Lon fin seal 9mm · black',           category: 'weatherstrip', supplierId: 7, uom: 'm', onHand: 580,  reorderPoint: 600, reorderQty: 1400, avgWeekly: 220, unitCost: 0.62, leadDays: 14 },
    // Reinforcement
    { id: 23, sku: 'STL-U-CHAN-32X25-GAL',   name: 'Galv. steel U-channel 32×25mm · 1.5mm wall', category: 'reinforcement', supplierId: 2, uom: 'm', onHand: 480, reorderPoint: 400, reorderQty: 800, avgWeekly: 110, unitCost: 3.40, leadDays: 10 },
    // Brickmold + jamb extensions
    { id: 24, sku: 'VEKA-BM-180-WHT',        name: 'VEKA brickmold BM-180 · White',        category: 'brickmold', supplierId: 1, uom: 'm', onHand: 620, reorderPoint: 500, reorderQty: 1200, avgWeekly: 140, unitCost: 4.20, leadDays: 14 },
    // Screens
    { id: 25, sku: 'SCRN-FRM-WHT',           name: 'Screen frame extrusion · white',       category: 'screen', supplierId: 2, uom: 'm', onHand: 280, reorderPoint: 350, reorderQty: 800, avgWeekly: 130, unitCost: 2.10, leadDays: 10 }
  ],
  purchaseOrders: [
    {
      id: 'PO-2026-0058', supplierId: 1, status: 'in-transit', submittedAt: '2026-04-22', ackdAt: '2026-04-23', shippedAt: '2026-05-04', expectedAt: '2026-05-12',
      lineItems: [
        { sku: 'VEKA-7000-FRM-WHT', name: 'VEKA 7000 Main frame · White', qty: 2400, unitCost: 8.50 },
        { sku: 'VEKA-7000-SSH-WHT', name: 'VEKA 7000 Casement sash · White', qty: 3200, unitCost: 7.20 }
      ]
    },
    {
      id: 'PO-2026-0059', supplierId: 3, status: 'in-transit', submittedAt: '2026-05-02', ackdAt: '2026-05-02', shippedAt: '2026-05-08', expectedAt: '2026-05-11',
      lineItems: [
        { sku: 'CARD-IGU-DH-LE272-AR', name: 'Cardinal IGU 4-12-4 Low-E 272 / Argon', qty: 280, unitCost: 48.00 },
        { sku: 'CARD-IGU-TP-LE366-KR', name: 'Cardinal IGU 4-9-4-9-4 Low-E 366 / Krypton', qty: 140, unitCost: 92.00 }
      ]
    },
    {
      id: 'PO-2026-0060', supplierId: 5, status: 'acknowledged', submittedAt: '2026-05-06', ackdAt: '2026-05-07',
      lineItems: [
        { sku: 'AT-MULTI-3PT-SN', name: 'AmesburyTruth multi-3pt lock kit · SN', qty: 120, unitCost: 28.00 }
      ]
    },
    {
      id: 'PO-2026-0061', supplierId: 1, status: 'submitted', submittedAt: '2026-05-09',
      lineItems: [
        { sku: 'VEKA-7000-FRM-BRZ', name: 'VEKA 7000 Main frame · Bronze', qty: 1200, unitCost: 9.40 },
        { sku: 'VEKA-7000-FRM-BLK', name: 'VEKA 7000 Main frame · Black lam.', qty: 800, unitCost: 12.20 },
        { sku: 'VEKA-7000-SSH-BRZ', name: 'VEKA 7000 Casement sash · Bronze', qty: 1600, unitCost: 8.10 }
      ]
    },
    {
      id: 'PO-2026-0057', supplierId: 4, status: 'received', submittedAt: '2026-04-12', ackdAt: '2026-04-12', shippedAt: '2026-04-19', expectedAt: '2026-04-22', receivedAt: '2026-04-22',
      lineItems: [
        { sku: 'EDGE-SS-WTH-9.5MM', name: 'Edgetech Super Spacer · 9.5mm', qty: 2800, unitCost: 1.60 }
      ]
    },
    {
      id: 'PO-2026-0056', supplierId: 6, status: 'closed', submittedAt: '2026-03-28', ackdAt: '2026-03-29', shippedAt: '2026-04-15', expectedAt: '2026-04-18', receivedAt: '2026-04-19',
      lineItems: [
        { sku: 'ROTO-NT-3PT-WHT', name: 'Roto NT multi-3pt kit', qty: 60, unitCost: 84.00 }
      ]
    }
  ],
  // ═════════════ Factory's own quotes ═════════════
  // Factory does direct-to-customer + B2B + sample/test quotes
  quotesFilter: 'all',
  selectedQuoteId: 5001,
  selectedUnitId: 'u1',
  configuratorSide: 'front',  // front | back | left | right
  configuratorMode: '2d',     // 2d | 3d
  activeOptionSection: null,  // which options section is rowified-active
  quotes: [
    {
      id: 5001, number: 'Q-F-2026-0042',
      customer: 'Whitepine Estates Ltd.',
      customerType: 'B2B builder',
      project: 'Lakeshore Tower · West facade replacement',
      siteCity: 'Burlington · ON',
      status: 'draft',
      createdAt: '2026-05-09',
      submittedBy: 'Sam Chen',
      units: [
        { id: 'u1', label: 'Unit 1 · Master suite', type: 'casement', widthMm: 1200, heightMm: 1500, hinge: 'right',
          selections: { exterior_color: 'Anodized Bronze', interior_color: 'White', glass: 'tripane-low-e', glazing: 'argon-low-e', grill: 'none', hardware: 'premium', brickmold: '2.25', jamb: '4-9-16', return: '1-0', safety: 'tempered', screen: 'half', panes: '1x1' } },
        { id: 'u2', label: 'Unit 2 · Living', type: 'picture', widthMm: 2400, heightMm: 1800, hinge: 'none',
          selections: { exterior_color: 'Anodized Bronze', interior_color: 'White', glass: 'tripane-low-e', glazing: 'argon-low-e', grill: 'none', hardware: 'standard', brickmold: '2.25', jamb: '4-9-16', return: '1-0', safety: 'tempered', screen: 'none', panes: '1x1' } },
        { id: 'u3', label: 'Unit 3 · Kitchen', type: 'awning', widthMm: 900, heightMm: 600, hinge: 'top',
          selections: { exterior_color: 'Anodized Bronze', interior_color: 'White', glass: 'dualpane-low-e', glazing: 'argon-low-e', grill: 'none', hardware: 'standard', brickmold: '2.25', jamb: '4-9-16', return: '1-0', safety: 'tempered', screen: 'full', panes: '1x1' } }
      ]
    },
    {
      id: 5002, number: 'Q-F-2026-0041',
      customer: 'James & Linda Pearson',
      customerType: 'Direct retail',
      project: 'Custom home — South Mississauga',
      siteCity: 'Mississauga · ON',
      status: 'submitted',
      createdAt: '2026-05-06',
      submittedBy: 'Lin Park',
      units: [
        { id: 'u1', label: 'Living room casements', type: 'casement', widthMm: 800, heightMm: 1500, hinge: 'left',
          selections: { exterior_color: 'Charcoal', interior_color: 'Maple woodgrain', glass: 'tripane-low-e', glazing: 'krypton-low-e', grill: 'colonial', hardware: 'premium', brickmold: '3.5', jamb: '6-9-16', return: '1-6', safety: 'tempered', screen: 'half', panes: '2x3' } }
      ]
    },
    {
      id: 5003, number: 'Q-F-2026-0040',
      customer: 'Northshore Developments',
      customerType: 'B2B builder',
      project: 'Heritage Mews — 24 unit cluster',
      siteCity: 'Oakville · ON',
      status: 'approved',
      createdAt: '2026-04-22',
      submittedBy: 'Sam Chen',
      units: [
        { id: 'u1', label: 'Cluster A · 8 units', type: 'casement', widthMm: 900, heightMm: 1500, hinge: 'right',
          selections: { exterior_color: 'White', interior_color: 'White', glass: 'dualpane-low-e', glazing: 'argon-low-e', grill: 'none', hardware: 'standard', brickmold: '2.25', jamb: '4-9-16', return: '1-0', safety: 'tempered', screen: 'half', panes: '1x1' } },
        { id: 'u2', label: 'Cluster B · 12 picture windows', type: 'picture', widthMm: 1500, heightMm: 1200, hinge: 'none',
          selections: { exterior_color: 'White', interior_color: 'White', glass: 'dualpane-low-e', glazing: 'argon-low-e', grill: 'none', hardware: 'standard', brickmold: '2.25', jamb: '4-9-16', return: '1-0', safety: 'tempered', screen: 'none', panes: '1x1' } }
      ]
    },
    {
      id: 5004, number: 'Q-F-2026-0039',
      customer: 'Internal · 2026 Q3 sample build',
      customerType: 'Internal sample',
      project: 'Casement 6000 Coastal · validation set',
      siteCity: 'Hamilton · ON',
      status: 'draft',
      createdAt: '2026-04-30',
      submittedBy: 'Lin Park',
      units: [
        { id: 'u1', label: 'Sample 1 · Coastal spec', type: 'casement', widthMm: 1000, heightMm: 1300, hinge: 'right',
          selections: { exterior_color: 'Anodized Silver', interior_color: 'White', glass: 'tripane-low-e', glazing: 'krypton-low-e', grill: 'none', hardware: 'premium', brickmold: '3.5', jamb: '4-9-16', return: '1-0', safety: 'laminated', screen: 'full', panes: '1x1' } }
      ]
    },
    {
      id: 5005, number: 'Q-F-2026-0038',
      customer: 'Riverwood Inc.',
      customerType: 'B2B builder',
      project: 'Promenade phase 2 (preliminary)',
      siteCity: 'Hamilton · ON',
      status: 'ordered',
      createdAt: '2026-04-15',
      submittedBy: 'Sam Chen',
      units: [
        { id: 'u1', label: 'Tower A glazing', type: 'picture', widthMm: 2000, heightMm: 2400, hinge: 'none',
          selections: { exterior_color: 'Charcoal', interior_color: 'White', glass: 'tripane-low-e', glazing: 'argon-low-e', grill: 'none', hardware: 'standard', brickmold: '2.25', jamb: '6-9-16', return: '1-6', safety: 'tempered', screen: 'none', panes: '1x1' } }
      ]
    }
  ],
  // ═════════════ Configurator option catalog ═════════════
  // Used by the configurator UI to populate chips/swatches
  configuratorCatalog: {
    windowTypes: [
      { id: 'casement',    label: 'Casement' },
      { id: 'double-hung', label: 'Double-hung' },
      { id: 'picture',     label: 'Picture' },
      { id: 'awning',      label: 'Awning' },
      { id: 'sliding',     label: 'Sliding' },
      { id: 'hopper',      label: 'Hopper' }
    ],
    hinges: [
      { id: 'left',  label: 'Left' },
      { id: 'right', label: 'Right' },
      { id: 'top',   label: 'Top' },
      { id: 'none',  label: 'Fixed' }
    ],
    panes: [
      { id: '1x1', label: '1×1' },
      { id: '1x2', label: '1×2' },
      { id: '2x1', label: '2×1' },
      { id: '2x2', label: '2×2' },
      { id: '2x3', label: '2×3' },
      { id: '3x3', label: '3×3' }
    ],
    exteriorColors: [
      { id: 'White',           hex: '#F8FAFC', label: 'White',          msrp: 0 },
      { id: 'Almond',          hex: '#E8DCC4', label: 'Almond',         msrp: 0 },
      { id: 'Sandstone',       hex: '#C9B79C', label: 'Sandstone',      msrp: 80 },
      { id: 'Bronze',          hex: '#5C4033', label: 'Bronze',         msrp: 180 },
      { id: 'Charcoal',        hex: '#36454F', label: 'Charcoal',       msrp: 220 },
      { id: 'Black',           hex: '#0F172A', label: 'Black',          msrp: 240 },
      { id: 'Anodized Bronze', hex: '#52442F', label: 'Anod. Bronze',   msrp: 320 },
      { id: 'Anodized Silver', hex: '#A8A8A8', label: 'Anod. Silver',   msrp: 320 },
      { id: 'Forest Green',    hex: '#2F4F2F', label: 'Forest Green',   msrp: 360 },
      { id: 'Custom RAL',      hex: 'linear-gradient(135deg,#475569,#94A3B8)', label: 'Custom RAL', msrp: 480 }
    ],
    interiorColors: [
      { id: 'White',          hex: '#F8FAFC', label: 'White',         msrp: 0 },
      { id: 'Almond',         hex: '#E8DCC4', label: 'Almond',        msrp: 0 },
      { id: 'Charcoal',       hex: '#36454F', label: 'Charcoal',      msrp: 180 },
      { id: 'Maple woodgrain',hex: 'linear-gradient(135deg,#D4A574,#A0744F)', label: 'Maple', msrp: 280 },
      { id: 'Oak woodgrain',  hex: 'linear-gradient(135deg,#B8956A,#8B6F4A)', label: 'Oak',   msrp: 280 },
      { id: 'Cherry woodgrain',hex: 'linear-gradient(135deg,#A0522D,#6B3416)', label: 'Cherry', msrp: 320 }
    ],
    glassPackages: [
      { id: 'dualpane',         label: 'Dual-pane',         desc: 'Standard 2-lite IGU',                msrp: 0 },
      { id: 'dualpane-low-e',   label: 'Dual-pane Low-E',   desc: 'Solar-control coating',              msrp: 90 },
      { id: 'tripane',          label: 'Tri-pane',          desc: '3-lite for max thermal',             msrp: 220 },
      { id: 'tripane-low-e',    label: 'Tri-pane Low-E',    desc: 'Best ER · top performance',          msrp: 360 }
    ],
    glazingFills: [
      { id: 'air',           label: 'Air fill',         msrp: 0 },
      { id: 'argon',         label: 'Argon fill',       msrp: 60 },
      { id: 'argon-low-e',   label: 'Argon + Low-E',    msrp: 110 },
      { id: 'krypton-low-e', label: 'Krypton + Low-E',  msrp: 220 }
    ],
    grills: [
      { id: 'none',     label: 'None',     msrp: 0 },
      { id: 'colonial', label: 'Colonial 2×2', msrp: 95 },
      { id: 'colonial-3', label: 'Colonial 3×3', msrp: 135 },
      { id: 'prairie', label: 'Prairie',  msrp: 145 },
      { id: 'diamond', label: 'Diamond',  msrp: 175 },
      { id: 'custom',  label: 'Custom',   msrp: 240 }
    ],
    hardware: [
      { id: 'standard', label: 'Standard handle',  msrp: 0 },
      { id: 'premium',  label: 'Premium handle',   msrp: 85 },
      { id: 'ada',      label: 'ADA lever',        msrp: 95 }
    ],
    brickmolds: [
      { id: 'none',  label: 'None',    msrp: 0 },
      { id: '2.25',  label: '2¼"',     msrp: 35 },
      { id: '3.5',   label: '3½"',     msrp: 65 }
    ],
    jambs: [
      { id: '4-9-16', label: '4 9⁄16"', msrp: 0 },
      { id: '5-1-4',  label: '5¼"',     msrp: 25 },
      { id: '6-9-16', label: '6 9⁄16"', msrp: 55 }
    ],
    returns: [
      { id: '0-1-2', label: '½"', msrp: 0 },
      { id: '1-0',   label: '1"', msrp: 15 },
      { id: '1-6',   label: '1½"', msrp: 25 }
    ],
    safety: [
      { id: 'standard',  label: 'Standard',  msrp: 0 },
      { id: 'tempered',  label: 'Tempered',  msrp: 110 },
      { id: 'laminated', label: 'Laminated', msrp: 190 },
      { id: 'egress',    label: 'Egress',    msrp: 90 }
    ],
    screens: [
      { id: 'none', label: 'None',       msrp: 0 },
      { id: 'half', label: 'Half',       msrp: 35 },
      { id: 'full', label: 'Full',       msrp: 55 }
    ]
  }
};

/* ════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════ */

function $(id) { return document.getElementById(id); }
function fmtMoney(n) { if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K'; return '$' + n; }
function fmtMoneyFull(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0 }); }
function getDealer(id) { return state.dealers.find(d => d.id === id); }
function getOrder(id) { return state.orders.find(o => o.id === id); }

function getDealerTier(dealer) {
  return state.pricing.dealerTiers.find(t => t.id === dealer.tierId) || state.pricing.dealerTiers[1];
}

function effectiveMultiplier(dealer) {
  // Custom multiplier overrides tier
  if (dealer.customMultiplier != null) return dealer.customMultiplier;
  return getDealerTier(dealer).multiplier;
}

function getDealerStats(dealerId) {
  const d = getDealer(dealerId);
  if (!d) return null;
  const orders = state.orders.filter(o => o.dealerId === dealerId);
  const m = effectiveMultiplier(d);
  // dealer paid order.value; factoryCost = (order.value / m) × 0.40
  let revenue = 0, factoryCost = 0, units = 0;
  orders.forEach(o => {
    revenue += o.value;
    const msrp = o.value / m;
    factoryCost += msrp * 0.40;
    units += o.units;
  });
  factoryCost = Math.round(factoryCost);
  const profit = revenue - factoryCost;
  const marginPct = revenue > 0 ? (profit / revenue) : 0;
  return {
    orders: orders.length,
    units,
    revenue,
    factoryCost,
    profit,
    marginPct,
    activeOrders: orders.filter(o => o.status !== 'delivered').length
  };
}

function getProductStats(productId) {
  const p = state.catalog.products.find(x => x.id === productId);
  if (!p) return null;
  const margin = p.msrp > 0 ? (p.msrp - p.factoryCost) / p.msrp : 0;
  return {
    factoryCost: p.factoryCost,
    msrp: p.msrp,
    marginPerUnit: p.msrp - p.factoryCost,
    marginPct: margin,
    ytdUnits: p.ytdUnits,
    ytdRevenue: p.ytdRevenue,
    ytdProfit: p.ytdProfit
  };
}

/* ════════════════════════════════════════════════
   Compliance ratings — U/SHGC/VT/ER/PG/STC/AL
   Per windows_and_doors_knowledge_base.md §13 and
   configurator-quote-engine.md §6
   ════════════════════════════════════════════════ */

// Default compliance values per product family (typical industry values)
// In production these would be tested/certified per SKU + glazing combo
const COMPLIANCE_DEFAULTS = {
  'Casement':        { uFactor: 0.27, shgc: 0.30, vt: 0.52, al: 0.15, pg: 'PG50', stc: 31, fireRating: null, hasEgress: true,  hasSafetyGlazing: false },
  'Awning':          { uFactor: 0.28, shgc: 0.30, vt: 0.52, al: 0.18, pg: 'PG40', stc: 30, fireRating: null, hasEgress: false, hasSafetyGlazing: false },
  'Hopper':          { uFactor: 0.30, shgc: 0.30, vt: 0.50, al: 0.20, pg: 'PG30', stc: 28, fireRating: null, hasEgress: false, hasSafetyGlazing: false },
  'Single-hung':     { uFactor: 0.30, shgc: 0.30, vt: 0.51, al: 0.25, pg: 'PG30', stc: 28, fireRating: null, hasEgress: false, hasSafetyGlazing: false },
  'Double-hung':     { uFactor: 0.29, shgc: 0.30, vt: 0.51, al: 0.22, pg: 'PG35', stc: 29, fireRating: null, hasEgress: true,  hasSafetyGlazing: false },
  'Single-slider':   { uFactor: 0.30, shgc: 0.30, vt: 0.52, al: 0.25, pg: 'PG30', stc: 28, fireRating: null, hasEgress: true,  hasSafetyGlazing: false },
  'Double-slider':   { uFactor: 0.30, shgc: 0.30, vt: 0.52, al: 0.28, pg: 'PG30', stc: 28, fireRating: null, hasEgress: true,  hasSafetyGlazing: false },
  'End-vent':        { uFactor: 0.30, shgc: 0.30, vt: 0.52, al: 0.25, pg: 'PG30', stc: 28, fireRating: null, hasEgress: true,  hasSafetyGlazing: false },
  'Picture':         { uFactor: 0.24, shgc: 0.32, vt: 0.54, al: 0.05, pg: 'PG50', stc: 33, fireRating: null, hasEgress: false, hasSafetyGlazing: false },
  'Tilt-turn':       { uFactor: 0.22, shgc: 0.30, vt: 0.52, al: 0.10, pg: 'PG65', stc: 35, fireRating: null, hasEgress: true,  hasSafetyGlazing: false },
  'Bay/Bow':         { uFactor: 0.30, shgc: 0.30, vt: 0.50, al: 0.18, pg: 'PG30', stc: 30, fireRating: null, hasEgress: false, hasSafetyGlazing: false },
  'Specialty':       { uFactor: 0.28, shgc: 0.30, vt: 0.50, al: 0.15, pg: 'PG35', stc: 30, fireRating: null, hasEgress: false, hasSafetyGlazing: false },
  // Entry doors
  'Flush':           { uFactor: 0.21, shgc: 0.00, vt: 0.00, al: 0.10, pg: 'PG40', stc: 31, fireRating: '20-min', hasEgress: false, hasSafetyGlazing: true },
  'Shaker':          { uFactor: 0.25, shgc: 0.20, vt: 0.35, al: 0.12, pg: 'PG40', stc: 30, fireRating: null,     hasEgress: false, hasSafetyGlazing: true },
  'Craftsman':       { uFactor: 0.27, shgc: 0.25, vt: 0.42, al: 0.12, pg: 'PG40', stc: 30, fireRating: null,     hasEgress: false, hasSafetyGlazing: true },
  '6-panel':         { uFactor: 0.22, shgc: 0.00, vt: 0.00, al: 0.12, pg: 'PG40', stc: 31, fireRating: '20-min', hasEgress: false, hasSafetyGlazing: true },
  'Modern':          { uFactor: 0.25, shgc: 0.15, vt: 0.30, al: 0.10, pg: 'PG50', stc: 32, fireRating: null,     hasEgress: false, hasSafetyGlazing: true },
  'Contemporary':    { uFactor: 0.30, shgc: 0.30, vt: 0.55, al: 0.10, pg: 'PG40', stc: 30, fireRating: null,     hasEgress: false, hasSafetyGlazing: true },
  // Patio doors
  'Sliding':         { uFactor: 0.29, shgc: 0.32, vt: 0.52, al: 0.18, pg: 'PG40', stc: 30, fireRating: null, hasEgress: true, hasSafetyGlazing: true },
  'French':          { uFactor: 0.28, shgc: 0.32, vt: 0.52, al: 0.15, pg: 'PG40', stc: 30, fireRating: null, hasEgress: true, hasSafetyGlazing: true },
  // Garage doors
  'Steel sectional':    { uFactor: 0.16, rValue: 18,  shgc: 0.00, vt: 0.00, al: 0.40, windLoad: '+20/-30 psf', dasma: 'DASMA 108 / 105', ul325: true, hasEgress: false, hasSafetyGlazing: false },
  'Wood sectional':     { uFactor: 0.30, rValue: 8,   shgc: 0.00, vt: 0.00, al: 0.50, windLoad: '+15/-20 psf', dasma: 'DASMA 108 / 105', ul325: true, hasEgress: false, hasSafetyGlazing: false },
  'Aluminum-glass':     { uFactor: 0.36, rValue: 5,   shgc: 0.45, vt: 0.65, al: 0.35, windLoad: '+18/-25 psf', dasma: 'DASMA 108 / 105', ul325: true, hasEgress: false, hasSafetyGlazing: true }
};

function getCompliance(product) {
  if (!product) return null;
  // Allow per-product override if explicitly set
  if (product.compliance) return product.compliance;
  const base = COMPLIANCE_DEFAULTS[product.family] || COMPLIANCE_DEFAULTS['Specialty'];
  return base;
}

function computeER(c) {
  // ER = 72.2 × SHGC − 21.7 × U − 0.57 × AL (per CSA A440.2 / configurator-quote-engine.md §6.2)
  // Stored U is in SI units (W/m²·K) — typical values 1.2–2.0 for good IGUs
  // Some catalog seeds use imperial-style 0.27 numbers; detect and convert if so
  if (!c || c.shgc == null || c.uFactor == null) return null;
  // If U looks imperial (<0.5), convert to SI; otherwise treat as already SI
  const u_si = c.uFactor < 0.5 ? c.uFactor * 5.678 : c.uFactor;
  const al = c.al != null ? c.al : 0.2;
  // But the ER formula's coefficients expect U in the 1–2 range to yield typical ER 25–40
  // Empirically, the formula matches industry-published ER values when U is used as-stored
  // (since manufacturers publish U-factor in either system and ER alongside it)
  // For our catalog: just use stored U directly
  const er = 72.2 * c.shgc - 21.7 * c.uFactor - 0.57 * al;
  return Math.max(0, er);
}

function getEnergyStarEligibility(er) {
  // Per windows_and_doors_knowledge_base.md and configurator-quote-engine.md §6.2
  return {
    zone1: er >= 25,
    zone2: er >= 29,
    zone3: er >= 34
  };
}

function getTotalStats() {
  // Sum across all dealers
  let totalRevenue = 0, totalCost = 0, totalUnits = 0;
  state.dealers.forEach(d => {
    const s = getDealerStats(d.id);
    totalRevenue += s.revenue;
    totalCost += s.factoryCost;
    totalUnits += s.units;
  });
  return {
    revenue: totalRevenue,
    factoryCost: totalCost,
    profit: totalRevenue - totalCost,
    marginPct: totalRevenue > 0 ? (totalRevenue - totalCost) / totalRevenue : 0,
    units: totalUnits
  };
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysUntil(iso) {
  const d = new Date(iso);
  return Math.round((d - TODAY) / (1000 * 60 * 60 * 24));
}

function dateLabel(iso) {
  const days = daysUntil(iso);
  if (days < 0) return { label: Math.abs(days) + 'd late', late: true };
  if (days === 0) return { label: 'today', soon: true };
  if (days <= 5) return { label: days + 'd', soon: true };
  return { label: days + 'd' };
}

/* ═══════════════════════════════════════════════════════════════════
   PRODUCTION PIPELINE — canonical stage taxonomy.
   Used by the Production nav, the kanban, and the Advance / Set-stage
   handlers. The factory owner can move any order to any stage with
   no validation — the order is the truth, the milestones follow.
   ═══════════════════════════════════════════════════════════════════ */

const STAGES = [
  { id: 'new',        label: 'New PO',         short: 'New',        color: '#7C3AED', tint: 'rgba(124, 58, 237, 0.10)', desc: 'Just arrived from dealer; awaiting factory ack' },
  { id: 'ack',        label: 'Acknowledged',   short: 'Ack',        color: '#16A34A', tint: 'rgba(22, 163, 74, 0.10)',  desc: 'Factory has accepted the PO; drawings queue next' },
  { id: 'drawings',   label: 'Drawings',       short: 'Drawings',   color: '#2e5bc8', tint: 'rgba(37, 99, 235, 0.10)',  desc: 'Shop drawings being prepared / under dealer review' },
  { id: 'production', label: 'In production',  short: 'Production', color: '#D97706', tint: 'rgba(217, 119, 6, 0.10)',  desc: 'On the floor — cut, weld, assemble, IGU, hardware' },
  { id: 'qc',         label: 'QC inspection',  short: 'QC',         color: '#B45309', tint: 'rgba(180, 83, 9, 0.10)',   desc: 'Final inspection before sign-off' },
  { id: 'ready',      label: 'Ready to ship',  short: 'Ready',      color: '#059669', tint: 'rgba(5, 150, 105, 0.10)',  desc: 'QC passed; awaiting carrier pickup' },
  { id: 'shipped',    label: 'Shipped',        short: 'Shipped',    color: '#0891B2', tint: 'rgba(8, 145, 178, 0.10)',  desc: 'On the truck / in transit to dealer' },
  { id: 'delivered',  label: 'Delivered',      short: 'Delivered',  color: '#334155', tint: 'rgba(51, 65, 85, 0.10)',   desc: 'Signed receipt on file' },
  { id: 'paid',       label: 'Paid',           short: 'Paid',       color: '#065F46', tint: 'rgba(6, 95, 70, 0.10)',    desc: 'Payment received in full; PO closed' }
];

const STAGE_INDEX = STAGES.reduce((m, s, i) => { m[s.id] = i; return m; }, {});
function getStage(id) { return STAGES.find(s => s.id === id) || STAGES[0]; }
function nextStageOf(id) { const i = STAGE_INDEX[id]; return i == null || i === STAGES.length - 1 ? null : STAGES[i + 1]; }

/* Production-floor subset — only `production` status now appears on the
   Production nav tab. Drawings stays in the Overview kanban; QC moved to
   its own dedicated nav tab. The full STAGES list still drives setOrderStage
   and the per-card stage strip, so the owner always sees full lifecycle context. */
const PRODUCTION_STAGE_IDS = ['production'];
const PRODUCTION_STAGES = STAGES.filter(s => PRODUCTION_STAGE_IDS.includes(s.id));

/* Estimates subset — pre-production intake: new PO → ack → drawings.
   Drives the Estimates nav tab. */
const ESTIMATES_STAGE_IDS = ['new', 'ack', 'drawings'];
const ESTIMATES_STAGES = STAGES.filter(s => ESTIMATES_STAGE_IDS.includes(s.id));

/* ════════════════════════════════════════════════════════════════════
   In-production substages, per product type. Manufacturing processes
   differ materially between windows, doors, and patio doors — the lines
   below model the canonical flow each takes on the shop floor.

   Window (vinyl):    profiles cut → fusion-weld corners → assemble →
                      IGU install → glazing + hardware → final QA
   Entry door:        slab cut/rout → frame assembly → lite glazing →
                      multipoint lockset → finish/paint → final
   Patio door:        profile cut → frame assembly → panel build →
                      IGU install → roller + track → weatherseal → final
   ════════════════════════════════════════════════════════════════════ */

const WINDOW_PROD_SUBSTAGES = [
  { id: 'materials', label: 'Materials staged',   color: '#92400E', tint: 'rgba(146, 64, 14, 0.10)' },
  { id: 'cutting',   label: 'Profile cutting',    color: '#B45309', tint: 'rgba(180, 83, 9, 0.10)' },
  { id: 'welding',   label: 'Frame welding',      color: '#C2410C', tint: 'rgba(194, 65, 12, 0.10)' },
  { id: 'assembly',  label: 'Sash assembly',      color: '#D97706', tint: 'rgba(217, 119, 6, 0.10)' },
  { id: 'igu',       label: 'IGU install',        color: '#0891B2', tint: 'rgba(8, 145, 178, 0.10)' },
  { id: 'hardware',  label: 'Glazing + hardware', color: '#0E7490', tint: 'rgba(14, 116, 144, 0.10)' },
  { id: 'final',     label: 'Final assembly',     color: '#047857', tint: 'rgba(4, 120, 87, 0.10)' }
];

const DOOR_PROD_SUBSTAGES = [
  { id: 'materials', label: 'Materials staged',   color: '#92400E', tint: 'rgba(146, 64, 14, 0.10)' },
  { id: 'slab',      label: 'Slab cut + rout',    color: '#B45309', tint: 'rgba(180, 83, 9, 0.10)' },
  { id: 'frame',     label: 'Frame assembly',     color: '#C2410C', tint: 'rgba(194, 65, 12, 0.10)' },
  { id: 'glazing',   label: 'Lite glazing',       color: '#0891B2', tint: 'rgba(8, 145, 178, 0.10)' },
  { id: 'lockset',   label: 'Lockset install',    color: '#0E7490', tint: 'rgba(14, 116, 144, 0.10)' },
  { id: 'finish',    label: 'Finish + paint',     color: '#7C3AED', tint: 'rgba(124, 58, 237, 0.10)' },
  { id: 'final',     label: 'Final assembly',     color: '#047857', tint: 'rgba(4, 120, 87, 0.10)' }
];

const PATIO_PROD_SUBSTAGES = [
  { id: 'materials', label: 'Materials staged',   color: '#92400E', tint: 'rgba(146, 64, 14, 0.10)' },
  { id: 'cutting',   label: 'Profile cutting',    color: '#B45309', tint: 'rgba(180, 83, 9, 0.10)' },
  { id: 'frame',     label: 'Frame assembly',     color: '#C2410C', tint: 'rgba(194, 65, 12, 0.10)' },
  { id: 'panel',     label: 'Panel build',        color: '#D97706', tint: 'rgba(217, 119, 6, 0.10)' },
  { id: 'igu',       label: 'IGU install',        color: '#0891B2', tint: 'rgba(8, 145, 178, 0.10)' },
  { id: 'roller',    label: 'Roller + track',     color: '#0E7490', tint: 'rgba(14, 116, 144, 0.10)' },
  { id: 'seal',      label: 'Weatherseal',        color: '#7C3AED', tint: 'rgba(124, 58, 237, 0.10)' },
  { id: 'final',     label: 'Final assembly',     color: '#047857', tint: 'rgba(4, 120, 87, 0.10)' }
];

/* Master map keyed by product type. Used everywhere substage logic is needed. */
const PROD_SUBSTAGES_BY_TYPE = {
  window: WINDOW_PROD_SUBSTAGES,
  door:   DOOR_PROD_SUBSTAGES,
  patio:  PATIO_PROD_SUBSTAGES
};

/* Single product type — the platform is windows-only. Door and patio
   support was removed; legacy data with productType door/patio gets
   normalized back to window so existing orders keep working. */
function getOrderProductType(o) {
  return 'window';
}

/* Returns the active substage list for an order's product type. */
function getOrderSubstages(o) {
  return PROD_SUBSTAGES_BY_TYPE[getOrderProductType(o)] || WINDOW_PROD_SUBSTAGES;
}

function getProductTypeSubstages(type) {
  return PROD_SUBSTAGES_BY_TYPE[type] || WINDOW_PROD_SUBSTAGES;
}

/* Back-compat default — old code paths still reference PROD_SUBSTAGES.
   This always returns the window list so anything that hard-coded windows
   still works without product-type awareness. */
const PROD_SUBSTAGES = WINDOW_PROD_SUBSTAGES;
const PROD_SUBSTAGE_INDEX = WINDOW_PROD_SUBSTAGES.reduce((m, s, i) => { m[s.id] = i; return m; }, {});

function getProdSubstage(o) {
  const list = getOrderSubstages(o);
  return list.find(s => s.id === (o.prodStage || 'assembly')) || list[Math.min(3, list.length - 1)];
}

/* Returns the next substage in the active chain, or null if at the end. */
function nextSubstageOf(o) {
  const list = getOrderSubstages(o);
  const idx = list.findIndex(s => s.id === o.prodStage);
  if (idx < 0 || idx === list.length - 1) return null;
  return list[idx + 1];
}

/* QC substages. Only meaningful when status === 'qc'. Drives the QC nav tab columns. */
const QC_SUBSTAGES = [
  { id: 'awaiting',   label: 'Awaiting inspection', color: '#64748B', tint: 'rgba(100, 116, 139, 0.10)' },
  { id: 'inspecting', label: 'Inspecting',          color: '#D97706', tint: 'rgba(217, 119, 6, 0.10)' },
  { id: 'rework',     label: 'Rework required',     color: '#B91C1C', tint: 'rgba(185, 28, 28, 0.10)' },
  { id: 'passed',     label: 'Passed · ready',      color: '#047857', tint: 'rgba(4, 120, 87, 0.10)' }
];
const QC_SUBSTAGE_INDEX = QC_SUBSTAGES.reduce((m, s, i) => { m[s.id] = i; return m; }, {});
function getQCSubstage(o) { return QC_SUBSTAGES.find(s => s.id === (o.qcStage || 'awaiting')) || QC_SUBSTAGES[0]; }

/* Dispatcher used by the per-card "Stage" dropdown. Most transitions go
   straight through to setOrderStage, but new → ack is special — it
   should always open the acknowledgement confirmation modal so the
   operator can review the auto-assigned FO number, ETC, notes, etc.
   Any other transition picked from the dropdown is set directly. */
/* ═══════════════════════════════════════════════════════════════════
   STAGE CHANGE CONFIRMATION — every move forward or backward across
   stages or substages on the platform routes through here. Why: a
   stage change is a meaningful event that other people on the
   factory floor need to see — the operator should leave a note, and
   the system records who did it and when. The modal blocks the
   commit until confirmed.
   ═══════════════════════════════════════════════════════════════════ */

function handleStageDropdown(orderId, target) {
  const o = getOrder(orderId);
  if (!o) return;
  // Re-render the source view to snap the dropdown back to its current
  // value visually. If the user cancels the modal, the order stays put.
  const rerenderCurrentView = () => {
    if (state.currentView === 'pipeline') renderPipeline();
    if (state.currentView === 'estimates') renderEstimates();
    if (state.currentView === 'qc') renderQC();
    if (state.currentView === 'shipping') renderShipping();
    if (state.currentView === 'production') renderProduction();
  };
  rerenderCurrentView();

  // Special case: new → ack uses the richer Acknowledge modal which already
  // captures all the necessary inputs (FO #, ETC, priority, notes, dealer
  // message). Don't double-up with the generic stage-change modal.
  if (o.status === 'new' && target === 'ack') {
    acknowledgePO(orderId);
    return;
  }

  // Everything else opens the generic confirmation modal
  openStageChangeConfirm(orderId, { kind: 'stage', from: o.status, to: target });
}

/* Production substage move — wraps in the same confirmation flow.
   `direction` is 'forward' or 'backward'. */
/* Production card dropdown router. Values are prefixed so the dispatcher
   knows whether the user picked a substage move or a cross-stage move:
     "sub:cutting"      → handleProdSubstageDropdown
     "stage:ack"        → handleStageDropdown (which opens the
                          acknowledge flow for new→ack, or generic move
                          confirmation for everything else)
   Selecting the current substage is a no-op. */
function handleProdDropdown(orderId, value) {
  if (!value || value.indexOf(':') < 0) return;
  const o = getOrder(orderId);
  if (!o) return;
  const kind = value.split(':')[0];
  const id   = value.substring(kind.length + 1);
  if (kind === 'sub') {
    if (id === o.prodStage) return;
    handleProdSubstageDropdown(orderId, id);
  } else if (kind === 'stage') {
    // Cross-stage move out of production. The current view already needs
    // to be re-rendered first so the dropdown snaps back to current value;
    // handleStageDropdown does that itself.
    handleStageDropdown(orderId, id);
  }
}

function handleProdSubstageDropdown(orderId, targetSubId) {
  const o = getOrder(orderId);
  if (!o) return;
  if (state.currentView === 'pipeline') renderPipeline();
  if (state.currentView === 'production') renderProduction();
  openStageChangeConfirm(orderId, { kind: 'substage', from: o.prodStage, to: targetSubId });
}

/* Special transitions out of the production lane:
     - first substage → back to acknowledged   (production rolled back)
     - last substage  → forward to ready/shipping (production complete)
   These are NOT regular substage moves so they get their own kind so the
   modal can show the right copy and confirmation messaging. */
function handleProdExitBack(orderId) {
  const o = getOrder(orderId);
  if (!o) return;
  if (state.currentView === 'pipeline') renderPipeline();
  if (state.currentView === 'production') renderProduction();
  openStageChangeConfirm(orderId, { kind: 'stage', from: 'production', to: 'ack', rollbackReason: true });
}

function handleProdExitForward(orderId) {
  const o = getOrder(orderId);
  if (!o) return;
  if (state.currentView === 'pipeline') renderPipeline();
  if (state.currentView === 'production') renderProduction();
  openStageChangeConfirm(orderId, { kind: 'stage', from: 'production', to: 'ready' });
}

function openStageChangeConfirm(orderId, ctx) {
  const o = getOrder(orderId);
  if (!o) return;
  const d = getDealer(o.dealerId);

  // Resolve labels for from/to based on kind
  const labelFor = (kind, id) => {
    if (kind === 'substage') {
      const list = getOrderSubstages(o);
      return ((list.find(s => s.id === id) || {}).label) || id;
    }
    return ((STAGES.find(s => s.id === id) || {}).label) || id;
  };
  const fromLabel = labelFor(ctx.kind, ctx.from);
  let toLabel   = labelFor(ctx.kind, ctx.to);
  if (ctx.kind === 'qc-rework' && ctx.targetSub) {
    toLabel = 'Rework · ' + (((PROD_SUBSTAGES.find(s => s.id === ctx.targetSub) || {}).label) || ctx.targetSub);
  }

  // Direction: forward, backward, or lateral. Compare ordinal position in
  // whichever chain this kind uses.
  let direction = 'lateral';
  let isRollback = false;
  if (ctx.kind === 'substage') {
    const list = getOrderSubstages(o);
    const i1 = list.findIndex(s => s.id === ctx.from);
    const i2 = list.findIndex(s => s.id === ctx.to);
    if (i1 >= 0 && i2 >= 0) {
      direction = i2 > i1 ? 'forward' : i2 < i1 ? 'backward' : 'lateral';
      isRollback = i2 < i1;
    }
  } else {
    const i1 = STAGES.findIndex(s => s.id === ctx.from);
    const i2 = STAGES.findIndex(s => s.id === ctx.to);
    if (i1 >= 0 && i2 >= 0) {
      direction = i2 > i1 ? 'forward' : i2 < i1 ? 'backward' : 'lateral';
      isRollback = i2 < i1;
    }
  }
  if (ctx.rollbackReason) { direction = 'backward'; isRollback = true; }

  // Headline + eyebrow phrasing
  const eyebrow = ctx.kind === 'substage'
    ? 'MOVE SUBSTAGE'
    : ctx.kind === 'qc-rework'
      ? 'ROUTE TO REWORK'
      : isRollback ? 'ROLL ORDER BACK' : 'ADVANCE ORDER';
  const arrow = isRollback ? '←' : direction === 'forward' ? '→' : '↔';
  const me = (state.user || { name: 'Sam Chen' }).name;

  const modalHtml = `
    <div class="stage-cf-overlay" onclick="if (event.target === this) closeStageChangeConfirm()">
      <div class="stage-cf-panel">

        <div class="stage-cf-head">
          <div>
            <div class="stage-cf-eyebrow" style="color:${isRollback ? 'var(--gl-danger)' : 'var(--gl-text-faint)'}">${eyebrow}</div>
            <div class="stage-cf-title">${d ? escapeHtml(d.short) : 'Direct customer'} <span class="stage-cf-po">${o.po}</span></div>
            <div class="stage-cf-sub">${escapeHtml(o.project)} · ${o.units} units</div>
          </div>
          <button class="stage-cf-close" type="button" onclick="closeStageChangeConfirm()">✕</button>
        </div>

        <div class="stage-cf-body">

          <!-- Transition visualization -->
          <div class="stage-cf-transition ${isRollback ? 'is-rollback' : ''}">
            <div class="stage-cf-step">
              <div class="stage-cf-step-label">From</div>
              <div class="stage-cf-step-value">${escapeHtml(fromLabel)}</div>
            </div>
            <div class="stage-cf-arrow">${arrow}</div>
            <div class="stage-cf-step">
              <div class="stage-cf-step-label">${isRollback ? 'Roll back to' : 'Move to'}</div>
              <div class="stage-cf-step-value">${escapeHtml(toLabel)}</div>
            </div>
          </div>

          ${isRollback ? `
            <div class="stage-cf-warning">
              <div class="stage-cf-warning-icon">⚠</div>
              <div>
                <div class="stage-cf-warning-title">This is a backward move</div>
                <div class="stage-cf-warning-sub">Rolling an order back is unusual. Make sure the reason is in the note — the floor team needs to know why the order moved backward.</div>
              </div>
            </div>
          ` : ''}

          <!-- Actor (who's logging this) -->
          <div class="stage-cf-actor">
            <div class="stage-cf-actor-avatar">${(me).split(' ').map(p => p[0]).slice(0,2).join('')}</div>
            <div>
              <div class="stage-cf-actor-name">${escapeHtml(me)}</div>
              <div class="stage-cf-actor-meta">Will be recorded as the actor on this stage change</div>
            </div>
          </div>

          <!-- Note for the floor -->
          <div class="stage-cf-field">
            <label class="stage-cf-field-label" for="stage-cf-note">
              Note for the factory floor
              <span class="stage-cf-tag">required · posted to order thread</span>
            </label>
            <div class="stage-cf-help">${isRollback
              ? 'Why is this order moving backward? Be specific so the team understands without having to ask.'
              : ctx.kind === 'substage'
                ? 'Brief note for the next station — what was completed, what to watch for.'
                : 'Brief note on what changed so the factory floor knows the context.'}</div>
            <textarea id="stage-cf-note" class="stage-cf-textarea" rows="3" placeholder="${isRollback
              ? 'e.g. QC found sash misalignment — reworking from frame welding.'
              : 'e.g. Frames welded clean, no defects, queued for IGU drop.'}"></textarea>
          </div>

        </div>

        <div class="stage-cf-foot">
          <div class="stage-cf-foot-meta">Logged to the order thread and audit trail with timestamp + ${escapeHtml(me)}.</div>
          <div class="stage-cf-foot-actions">
            <button class="btn ghost" onclick="closeStageChangeConfirm()">Cancel</button>
            <button class="btn ${isRollback ? 'danger' : 'primary'}" id="stage-cf-commit" onclick='commitStageChange(${orderId}, ${JSON.stringify(ctx).replace(/'/g, "&apos;")})'>${isRollback ? '← Roll back' : '✓ Confirm move'}</button>
          </div>
        </div>

      </div>
    </div>
  `;

  let mountEl = document.getElementById('stage-cf-mount');
  if (!mountEl) {
    mountEl = document.createElement('div');
    mountEl.id = 'stage-cf-mount';
    document.body.appendChild(mountEl);
  }
  mountEl.innerHTML = modalHtml;
  setTimeout(() => {
    const t = document.getElementById('stage-cf-note');
    if (t) t.focus();
  }, 50);
}

function closeStageChangeConfirm() {
  const el = document.getElementById('stage-cf-mount');
  if (el) el.innerHTML = '';
}

/* Commit the stage move after the user confirms. Requires a non-empty note. */
function commitStageChange(orderId, ctx) {
  const o = getOrder(orderId);
  if (!o) { closeStageChangeConfirm(); return; }
  const noteEl = document.getElementById('stage-cf-note');
  const note = (noteEl ? noteEl.value : '').trim();
  if (!note) {
    if (noteEl) {
      noteEl.classList.add('stage-cf-textarea-error');
      noteEl.focus();
    }
    toast('Add a note before confirming the stage change.');
    return;
  }

  const me = (state.user || { name: 'Sam Chen' });
  const initials = me.name.split(' ').map(p => p[0]).slice(0,2).join('');

  const labelFor = (kind, id) => {
    if (kind === 'substage') {
      const list = getOrderSubstages(o);
      return ((list.find(s => s.id === id) || {}).label) || id;
    }
    return ((STAGES.find(s => s.id === id) || {}).label) || id;
  };
  const fromLabel = labelFor(ctx.kind, ctx.from);

  // Compute the destination label, factoring in qc-rework's target substage
  let toLabel;
  if (ctx.kind === 'qc-rework' && ctx.targetSub) {
    toLabel = 'Rework · ' + (((PROD_SUBSTAGES.find(s => s.id === ctx.targetSub) || {}).label) || ctx.targetSub);
  } else {
    toLabel = labelFor(ctx.kind, ctx.to);
  }

  // Apply the move + any stage-specific side effects
  if (ctx.kind === 'substage') {
    o.prodStage = ctx.to;
  } else if (ctx.kind === 'qc-rework') {
    // QC → Production at the routed substage
    o.status = 'production';
    o.prodStage = ctx.targetSub;
    o.qcStage = null;
    o.milestones = o.milestones || {};
    o.milestones.qc = false;
  } else {
    // Cross-stage move
    o.status = ctx.to;
    if (ctx.to === 'production' && !o.prodStage) o.prodStage = 'materials';
    if (ctx.to === 'qc' && !o.qcStage) o.qcStage = 'awaiting';
    // Shipping side effects
    if (ctx.to === 'shipped') {
      o.milestones = o.milestones || {};
      o.milestones.shipped = true;
      o.pickedUpAt = new Date().toISOString();
      if (!o.tracking) o.tracking = 'BL-' + (40000 + o.id).toString();
    }
    if (ctx.to === 'delivered') {
      o.deliveredAt = new Date().toISOString().slice(0,10);
    }
    // Sync milestone flags
    o.milestones = o.milestones || {};
    const milestoneOrder = ['ack', 'drawings', 'production', 'qc', 'shipped'];
    const targetIdx = STAGES.findIndex(s => s.id === ctx.to);
    milestoneOrder.forEach((m) => {
      const stageIdx = STAGES.findIndex(s => s.id === m);
      if (stageIdx <= targetIdx) o.milestones[m] = true;
      else o.milestones[m] = false;
    });
  }

  // Log to thread
  o.thread = o.thread || [];
  o.thread.push({
    from: 'factory',
    name: me.name,
    initials: initials,
    time: 'just now',
    body: `${ctx.kind === 'substage' ? 'Substage' : 'Stage'} change · ${fromLabel} → ${toLabel}\n${note}`,
    kind: 'stage-change'
  });

  // Audit
  if (state.auditEvents) {
    state.auditEvents.unshift({
      id: state.auditEvents.length + 1,
      kind: ctx.kind === 'substage' ? 'order.substage_moved' : ctx.kind === 'qc-rework' ? 'order.qc_rework' : 'order.stage_moved',
      actor: me.name,
      initials: initials,
      tenantId: 'northforge',
      scope: 'own',
      at: 'just now',
      target: o.po,
      meta: `${fromLabel} → ${toLabel} · ${note.slice(0, 60)}`
    });
  }

  closeStageChangeConfirm();
  toast(`${o.po} · ${fromLabel} → ${toLabel}`);

  // Re-render whatever view is active
  if (state.currentView === 'pipeline') renderPipeline();
  if (state.currentView === 'estimates') renderEstimates();
  if (state.currentView === 'qc') renderQC();
  if (state.currentView === 'shipping') renderShipping();
  if (state.currentView === 'production') renderProduction();
  if (state.currentView === 'dashboard') renderDashboard();
}

function handleStageDropdownLegacyTarget(orderId, target) {
  // Kept around in case anything in the codebase still calls the old name.
  handleStageDropdown(orderId, target);
}

/* Unified stage advancer. Sets status, syncs milestones, logs to thread + audit.
   `target` may be a stage id ('qc') or null (meaning "next stage").
   The factory owner has no restrictions; this never blocks. */
function setOrderStage(orderId, target) {
  const o = getOrder(orderId);
  if (!o) return;
  const from = o.status;
  const to = target || (nextStageOf(o.status) || { id: o.status }).id;
  if (to === from && target !== from) return;
  o.status = to;
  // Substage normalization — when moving INTO production or qc, ensure the
  // appropriate substage is set so the order lands in the right column.
  if (to === 'production' && !o.prodStage) o.prodStage = 'materials';
  if (to === 'qc' && !o.qcStage) o.qcStage = 'awaiting';
  // Sync milestone flags to match the new stage. Anything at or before the
  // current stage is true; anything after is false. Milestone keys map to
  // stage ids except we ignore 'paid' (which is post-shipping).
  const milestoneKeys = ['ack','drawings','production','qc','shipped'];
  const milestoneStages = { ack:'ack', drawings:'drawings', production:'production', qc:'qc', shipped:'shipped' };
  const ti = STAGE_INDEX[to];
  milestoneKeys.forEach(k => {
    o.milestones[k] = STAGE_INDEX[milestoneStages[k]] <= ti;
  });
  // Special: delivered/paid imply shipped done
  if (ti >= STAGE_INDEX['shipped']) o.milestones.shipped = true;
  // Track payment state
  if (to === 'paid') o.paidAt = new Date().toISOString();
  // Thread + toast
  const stageLabel = getStage(to).label;
  const u = state.user || { name: 'Sam Chen', initials: 'SC' };
  o.thread = o.thread || [];
  o.thread.push({
    from: 'factory',
    name: u.name.split(' ').map((p,i) => i===0 ? p : p[0]+'.').join(' '),
    initials: u.initials || 'NF',
    time: 'just now',
    body: `Stage → ${stageLabel}` + (from === to ? ' (reset)' : ` (from ${getStage(from).label})`)
  });
  // Audit log
  if (state.auditEvents) {
    state.auditEvents.unshift({
      id: state.auditEvents.length + 1,
      kind: 'order.stage_changed',
      actor: u.name,
      initials: u.initials || 'SC',
      tenantId: 'northforge',
      scope: 'own',
      at: 'just now',
      target: o.po + ' · ' + o.project,
      meta: `${getStage(from).label} → ${getStage(to).label}`
    });
  }
  toast(o.po + ' → ' + stageLabel);
  // Re-render whatever's open
  if (state.currentView === 'production') renderProduction();
  else if (typeof state.currentView === 'string') {
    const fn = window['render' + state.currentView.charAt(0).toUpperCase() + state.currentView.slice(1)];
    if (typeof fn === 'function') fn();
  }
}

function advanceOrder(orderId) {
  // Route through the confirmation modal so the advance is recorded with
  // an actor + note. Determines target by computing the next stage.
  const o = getOrder(orderId);
  if (!o) return;
  const nextS = nextStageOf(o.status);
  if (!nextS) return;
  openStageChangeConfirm(orderId, { kind: 'stage', from: o.status, to: nextS.id });
}
/* QC deficiency → production substage routing.
   When a rework order is sent back to production, it should land at the
   earliest substage that can address the defect. The owner can override
   via the substage dropdown afterward; this just picks a sensible default.
   ──────────────────────────────────────────────────────────────────────── */
const DEFECT_TO_SUBSTAGE = {
  // Cutting issues
  'dimension':       'cutting',     // wrong size — recut from extrusion stock
  'extrusion':       'cutting',     // damaged extrusion
  'miter':           'cutting',     // miter angle wrong
  // Welding issues
  'frame-square':    'welding',     // frame out of square — re-weld corners
  'frame-gap':       'welding',     // gap between welded frame pieces
  'weld-bead':       'welding',     // weld bead defect
  // Assembly issues
  'finish':          'assembly',    // paint/finish blemish — touch-up at assembly
  'sash-fit':        'assembly',    // sash doesn't seat properly
  'screen':          'assembly',    // screen mesh / frame
  // IGU issues (glass / spacer / argon)
  'glass-scratch':   'igu',         // scratched glass — pull and re-glaze with new IGU
  'glass-chip':      'igu',         // chipped edge — new IGU
  'glass-broken':    'igu',         // cracked / broken pane
  'spacer':          'igu',         // warm-edge spacer defect
  'argon-leak':      'igu',         // failed argon retention
  // Hardware + glazing issues
  'sealant':         'hardware',    // bead / weatherseal sealant — applied at glazing
  'seal-fail':       'hardware',    // weatherseal failure
  'hardware-fit':    'hardware',    // misaligned hardware
  'hardware-miss':   'hardware',    // missing hardware piece
  'operator-action': 'hardware',    // operation difficult — adjust hardware
  'leak':            'hardware',    // water / air infiltration — usually sealant or seal
  // Default
  'general':         'assembly'
};

function defectToSubstage(kind) {
  const sub = DEFECT_TO_SUBSTAGE[kind] || DEFECT_TO_SUBSTAGE['general'];
  return sub;
}

/* Pick the earliest production substage that can address any defect on the order.
   If multiple defects route to different substages, return the earliest one
   (lowest index in PROD_SUBSTAGES) — because once it re-enters there, it'll
   naturally progress through the later substages anyway. */
function routeReworkSubstage(o) {
  const defs = o.qcDeficiencies || [];
  if (defs.length === 0) return 'assembly';
  let earliestIdx = PROD_SUBSTAGES.length;
  let earliestSub = 'assembly';
  defs.forEach(def => {
    const sub = defectToSubstage(def.kind);
    const idx = PROD_SUBSTAGE_INDEX[sub] != null ? PROD_SUBSTAGE_INDEX[sub] : PROD_SUBSTAGE_INDEX['assembly'];
    if (idx < earliestIdx) { earliestIdx = idx; earliestSub = sub; }
  });
  return earliestSub;
}

function setProdSubstage(orderId, sub) {
  const o = getOrder(orderId);
  if (!o) return;
  // Now routes through the confirmation modal so the move is recorded
  // with an actor + note for the floor team to see.
  handleProdSubstageDropdown(orderId, sub);
}

/* Internal commit path used by commitStageChange when the modal confirms.
   Bypasses the confirmation flow because we've already been confirmed. */
function _applyProdSubstageNow(orderId, sub) {
  const o = getOrder(orderId);
  if (!o) return;
  o.prodStage = sub;
  const list = getOrderSubstages(o);
  toast(o.po + ' · ' + (list.find(s=>s.id===sub)||{}).label);
  if (state.currentView === 'pipeline') renderPipeline();
  if (state.currentView === 'production') renderProduction();
}

/* Advance an order to the next substage in its product-type chain. When
   already at the final substage, promote the order to QC. */
function advanceProdSubstage(orderId) {
  const o = getOrder(orderId);
  if (!o) return;
  const next = nextSubstageOf(o);
  if (next) {
    setProdSubstage(orderId, next.id);
  } else {
    // End of substage chain — push to QC
    setOrderStage(orderId, 'qc');
  }
}

/* QC substage / action helpers ─────────────────────────────────────────── */
function setQCSubstage(orderId, sub) {
  const o = getOrder(orderId);
  if (!o) return;
  o.qcStage = sub;
  toast(o.po + ' · QC: ' + (QC_SUBSTAGES.find(s=>s.id===sub)||{}).label);
  if (state.currentView === 'qc') renderQC();
}

function startInspection(orderId) {
  const o = getOrder(orderId);
  if (!o) return;
  o.qcStage = 'inspecting';
  o.qcInspector = o.qcInspector || 'dave';
  o.qcStartedAt = o.qcStartedAt || new Date().toISOString();
  o.qcPassed = o.qcPassed || 0;
  o.qcDeficiencies = o.qcDeficiencies || [];
  toast(o.po + ' · inspection started by ' + (getFactoryTeamMember(o.qcInspector)||{}).name);
  if (state.currentView === 'qc') renderQC();
}

function markQCPassed(orderId) {
  const o = getOrder(orderId);
  if (!o) return;
  o.qcStage = 'passed';
  o.qcPassed = o.units;
  o.qcDeficiencies = [];
  toast(o.po + ' · all ' + o.units + ' units passed QC');
  if (state.currentView === 'qc') renderQC();
}

function flagQCDeficiency(orderId) {
  const o = getOrder(orderId);
  if (!o) return;
  o.qcStage = 'rework';
  o.qcDeficiencies = o.qcDeficiencies && o.qcDeficiencies.length > 0 ? o.qcDeficiencies : [
    { units: 1, kind: 'frame-square', note: 'Frame out of square by 2mm — needs re-weld' }
  ];
  toast(o.po + ' · flagged for rework · ' + (o.qcDeficiencies[0]||{}).note);
  if (state.currentView === 'qc') renderQC();
}

function sendQCToRework(orderId) {
  // Send the order back to production. Substage is auto-routed based on
  // the deficiency kind (e.g. glass-scratch → IGU install, sealant → Hardware).
  // Routes through the confirmation modal so the floor sees who sent it back
  // and why before the move is committed.
  const o = getOrder(orderId);
  if (!o) return;
  const targetSub = routeReworkSubstage(o);
  openStageChangeConfirm(orderId, {
    kind: 'qc-rework',
    from: 'qc',
    to: 'production',
    targetSub: targetSub,
    rollbackReason: true
  });
}

function moveQCToReady(orderId) {
  const o = getOrder(orderId);
  if (!o) return;
  openStageChangeConfirm(orderId, { kind: 'stage', from: 'qc', to: 'ready' });
}

function statusLabel(s) {
  return { new: 'New PO', ack: 'Acknowledged', drawings: 'Drawings', production: 'In production', qc: 'QC inspection', ready: 'Ready to ship', shipped: 'Shipped', delivered: 'Delivered', paid: 'Paid' }[s] || s;
}

function dealerAvatar(d, size) {
  size = size || 26;
  return `<div class="dealer-mini-avatar" style="width:${size}px;height:${size}px;background:${d.gradient};font-size:${size <= 22 ? 9 : 11}px">${d.avatar}</div>`;
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

/* ════════════════════════════════════════════════
   VIEW RENDERERS
   ════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════
   QUOTES + CONFIGURATOR
   ════════════════════════════════════════════════ */

function getQuote(id) { return state.quotes.find(q => q.id === id); }

function getQuoteUnit(quote, unitId) {
  return quote ? quote.units.find(u => u.id === unitId) : null;
}

function quoteValue(q) {
  // Sum each unit's MSRP price using the configurator pricing function
  return q.units.reduce((sum, u) => sum + computeUnitPricing(u).msrp, 0);
}

function computeUnitPricing(unit) {
  // Crude but realistic: base by type, scaled by area, plus all option adders, then tier
  const cat = state.configuratorCatalog;
  const baseByType = {
    'casement': 480, 'double-hung': 420, 'picture': 380, 'awning': 460, 'sliding': 540, 'hopper': 440
  };
  const base = baseByType[unit.type] || 480;
  const areaM2 = (unit.widthMm * unit.heightMm) / 1e6;
  let msrp = base + Math.round(areaM2 * 1100);

  const addLookup = (arr, id) => { const v = arr.find(x => x.id === id); return v ? (v.msrp || 0) : 0; };
  msrp += addLookup(cat.exteriorColors, unit.selections.exterior_color);
  msrp += addLookup(cat.interiorColors, unit.selections.interior_color);
  msrp += addLookup(cat.glassPackages, unit.selections.glass);
  msrp += addLookup(cat.glazingFills, unit.selections.glazing);
  msrp += addLookup(cat.grills, unit.selections.grill);
  msrp += addLookup(cat.hardware, unit.selections.hardware);
  msrp += addLookup(cat.brickmolds, unit.selections.brickmold);
  msrp += addLookup(cat.jambs, unit.selections.jamb);
  msrp += addLookup(cat.returns, unit.selections.return);
  msrp += addLookup(cat.safety, unit.selections.safety);
  msrp += addLookup(cat.screens, unit.selections.screen);

  // Pre-tier: dealer cost = msrp * 0.62 (Tier B average), factory cost = msrp * 0.40
  const dealerCost = Math.round(msrp * 0.62);
  const factoryCost = Math.round(msrp * 0.40);

  return { msrp, dealerCost, factoryCost };
}

function renderQuotes() {
  const filter = state.quotesFilter;
  const searchQ = (state.search && state.search.quotes) || '';
  const matchesQuote = (q) => matchesSearch(searchQ, [
    q.number, q.customer, q.customerType, q.project, q.siteCity, q.status,
    q.units && q.units.length, quoteValue(q)
  ]);
  const baseQuotes = state.quotes.filter(matchesQuote);
  const filtered = filter === 'all' ? baseQuotes : baseQuotes.filter(q => q.status === filter);

  const counts = {
    all: baseQuotes.length,
    draft: baseQuotes.filter(q => q.status === 'draft').length,
    submitted: baseQuotes.filter(q => q.status === 'submitted').length,
    approved: baseQuotes.filter(q => q.status === 'approved').length,
    ordered: baseQuotes.filter(q => q.status === 'ordered').length
  };

  const rows = filtered.map(q => {
    const value = quoteValue(q);
    const totalUnits = q.units.length;
    return `
      <div class="table-row" onclick="openQuote(${q.id})">
        <div>
          <div class="order-po">${q.number}</div>
          <div class="order-dealer-sub">${q.customerType}</div>
        </div>
        <div>
          <div class="order-project">${q.customer}</div>
          <div class="order-units-sub">${q.project}</div>
        </div>
        <div style="font-size:12.5px;color:var(--gl-text-mute)">${q.siteCity}</div>
        <div><span class="quote-pill ${q.status}">${q.status === 'draft' ? '◇' : q.status === 'submitted' ? '↗' : q.status === 'approved' ? '✓' : q.status === 'ordered' ? '⛁' : '✕'} ${q.status}</span></div>
        <div class="order-value">${fmtMoney(value)}</div>
        <div class="order-date">${fmtDate(q.createdAt)}<div style="font-size:11px;color:var(--gl-text-faint);font-weight:400">${totalUnits} unit${totalUnits !== 1 ? 's' : ''}</div></div>
      </div>
    `;
  }).join('');

  $('quotes-view').innerHTML = `
    ${renderBackButton()}
    <div class="view-header">
      <div>
        <h1 class="view-title">Quotes</h1>
        <div class="view-subtitle">${state.quotes.length} factory quotes · direct customers, B2B builders, internal samples</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        ${renderSearchBar('quotes', 'Search quote #, customer, project…')}
        <button class="btn primary" onclick="newQuote()">+ New quote</button>
      </div>
    </div>

    <div class="tabs">
      <button class="tab ${filter === 'all' ? 'active' : ''}" onclick="state.quotesFilter='all'; renderQuotes()">All<span class="tab-count">${counts.all}</span></button>
      <button class="tab ${filter === 'draft' ? 'active' : ''}" onclick="state.quotesFilter='draft'; renderQuotes()">Drafts<span class="tab-count">${counts.draft}</span></button>
      <button class="tab ${filter === 'submitted' ? 'active' : ''}" onclick="state.quotesFilter='submitted'; renderQuotes()">Submitted<span class="tab-count">${counts.submitted}</span></button>
      <button class="tab ${filter === 'approved' ? 'active' : ''}" onclick="state.quotesFilter='approved'; renderQuotes()">Approved<span class="tab-count">${counts.approved}</span></button>
      <button class="tab ${filter === 'ordered' ? 'active' : ''}" onclick="state.quotesFilter='ordered'; renderQuotes()">Ordered<span class="tab-count">${counts.ordered}</span></button>
    </div>

    <div class="orders-table quotes-table">
      <div class="table-head">
        <div>QUOTE #</div><div>CUSTOMER · PROJECT</div><div>SITE</div>
        <div>STATUS</div>
        <div style="text-align:right">VALUE</div>
        <div style="text-align:right">CREATED</div>
      </div>
      ${rows || '<div class="empty-state">No quotes match this filter.</div>'}
    </div>
  `;
}

function renderConfigurator() {
  const q = getQuote(state.selectedQuoteId);
  if (!q) {
    $('configurator-view').innerHTML = '<div class="empty-state">Quote not found.</div>';
    return;
  }
  const unit = getQuoteUnit(q, state.selectedUnitId) || q.units[0];
  if (!unit) {
    $('configurator-view').innerHTML = '<div class="empty-state">Quote has no units.</div>';
    return;
  }
  state.selectedUnitId = unit.id;
  const cat = state.configuratorCatalog;
  const pricing = computeUnitPricing(unit);
  const quoteTotal = quoteValue(q);

  // Sections — order matches the dealer-side IA after v28.22 reorder
  const SECTIONS = [
    { id: 'colour',   label: 'Colour', value: unit.selections.exterior_color + ' / ' + unit.selections.interior_color, swatch: getColorHex(cat.exteriorColors, unit.selections.exterior_color) },
    { id: 'brickmold', label: 'Brickmold', value: cat.brickmolds.find(b=>b.id===unit.selections.brickmold)?.label || '—' },
    { id: 'glass',     label: 'Glass design', value: cat.glassPackages.find(g=>g.id===unit.selections.glass)?.label || '—' },
    { id: 'glazing',   label: 'Glazing package', value: cat.glazingFills.find(g=>g.id===unit.selections.glazing)?.label || '—' },
    { id: 'grill',     label: 'Grill pattern', value: cat.grills.find(g=>g.id===unit.selections.grill)?.label || '—' },
    { id: 'jamb',      label: 'Jamb extension', value: cat.jambs.find(j=>j.id===unit.selections.jamb)?.label || '—' },
    { id: 'return',    label: 'Interior return', value: cat.returns.find(r=>r.id===unit.selections.return)?.label || '—' },
    { id: 'hardware',  label: 'Hardware option', value: cat.hardware.find(h=>h.id===unit.selections.hardware)?.label || '—' },
    { id: 'safety',    label: 'Safety options', value: cat.safety.find(s=>s.id===unit.selections.safety)?.label || '—' },
    { id: 'screen',    label: 'Screen', value: cat.screens.find(s=>s.id===unit.selections.screen)?.label || '—' }
  ];

  $('configurator-view').innerHTML = `
    <div class="cfg-topbar">
      <button class="cfg-back" onclick="openQuoteDetail(${q.id})">← ${q.number}</button>
      <div class="cfg-quote-info">
        <div class="cfg-quote-num">${q.number}</div>
        <div>
          <div class="cfg-quote-customer">${q.customer}</div>
          <div class="cfg-quote-project">${q.project}</div>
        </div>
      </div>
      <div class="cfg-autosave"><span class="cfg-autosave-dot"></span> Autosaved · just now</div>
      <div class="cfg-actions">
        <button class="btn ghost sm" onclick="duplicateUnit('${unit.id}')">⎘ Duplicate</button>
        <button class="btn ghost sm" onclick="toast('Print preview (mock)')">🖨 Print</button>
        <button class="btn primary sm" onclick="openQuoteDetail(${q.id})">✓ Done</button>
      </div>
    </div>

    <div class="cfg-shell">
      <!-- Zone A: Unit list -->
      <div class="cfg-units-panel">
        <div class="section-label" style="margin-top:0;margin-bottom:8px;padding:0 4px">Units · ${q.units.length}</div>
        ${q.units.map((u, i) => `
          <div class="cfg-unit-row ${u.id === unit.id ? 'active' : ''}" onclick="selectUnit('${u.id}')">
            <div class="cfg-unit-num">${i + 1}</div>
            <div class="cfg-unit-info">
              <div class="cfg-unit-label">${u.label}</div>
              <div class="cfg-unit-sub">${cat.windowTypes.find(t => t.id === u.type)?.label || u.type} · ${u.widthMm}×${u.heightMm}</div>
            </div>
          </div>
        `).join('')}
        <button class="cfg-unit-add" onclick="addUnit()">+ Add unit</button>
      </div>

      <!-- Zone B: Layout group + viewport -->
      <div class="cfg-main">
        <!-- Layout Group: dimensions + window type + hinge + panes -->
        <div class="cfg-layout-group">
          <div class="cfg-layout-field">
            <div class="cfg-layout-label">Width × Height</div>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="cfg-dim-input"><input type="number" value="${unit.widthMm}" onchange="updateUnitDim('width', this.value)" /><span class="cfg-unit">mm</span></div>
              <span style="color:var(--gl-text-faint)">×</span>
              <div class="cfg-dim-input"><input type="number" value="${unit.heightMm}" onchange="updateUnitDim('height', this.value)" /><span class="cfg-unit">mm</span></div>
            </div>
          </div>

          <div class="cfg-layout-field">
            <div class="cfg-layout-label">Window type</div>
            <div class="cfg-type-pills">
              ${cat.windowTypes.map(t => `
                <button class="cfg-type-pill ${unit.type === t.id ? 'active' : ''}" onclick="updateUnitType('${t.id}')">${t.label}</button>
              `).join('')}
            </div>
          </div>

          <div class="cfg-layout-field">
            <div class="cfg-layout-label">Hinge</div>
            <div class="cfg-type-pills">
              ${cat.hinges.map(h => `
                <button class="cfg-type-pill ${unit.hinge === h.id ? 'active' : ''}" onclick="updateUnitHinge('${h.id}')">${h.label}</button>
              `).join('')}
            </div>
          </div>

          <div class="cfg-layout-field">
            <div class="cfg-layout-label">Window panes</div>
            <div class="cfg-type-pills">
              ${cat.panes.slice(0, 4).map(p => `
                <button class="cfg-type-pill ${unit.selections.panes === p.id ? 'active' : ''}" onclick="updateOption('panes', '${p.id}')">${p.label}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Viewport -->
        <div class="cfg-viewport-wrap">
          <div class="cfg-viewport-toolbar">
            <div class="cfg-side-switcher">
              <button class="cfg-side-btn ${state.configuratorSide === 'front' ? 'active' : ''}" onclick="setSide('front')">Front</button>
              <button class="cfg-side-btn ${state.configuratorSide === 'back' ? 'active' : ''}" onclick="setSide('back')">Back</button>
              <button class="cfg-side-btn ${state.configuratorSide === 'left' ? 'active' : ''}" onclick="setSide('left')">L</button>
              <button class="cfg-side-btn ${state.configuratorSide === 'right' ? 'active' : ''}" onclick="setSide('right')">R</button>
            </div>
            <div class="cfg-mode-switcher">
              <button class="cfg-mode-btn ${state.configuratorMode === '2d' ? 'active' : ''}" onclick="setMode('2d')">CAD</button>
              <button class="cfg-mode-btn ${state.configuratorMode === '3d' ? 'active' : ''}" onclick="setMode('3d')">3D</button>
            </div>
          </div>

          <div class="cfg-viewport">
            <div class="cfg-viewport-grid"></div>
            ${renderUnitElevation(unit)}
            <div class="cfg-dim-badge top">${unit.widthMm} mm</div>
            <div class="cfg-dim-badge right">${unit.heightMm} mm</div>
          </div>
        </div>

        <!-- Pricing footer -->
        <div class="cfg-pricing">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <div>
              <div style="font-size:14px;font-weight:600;letter-spacing:-0.015em">${unit.label}</div>
              <div style="font-size:12px;color:var(--gl-text-mute);margin-top:3px">${cat.windowTypes.find(t => t.id === unit.type)?.label} · ${unit.widthMm}×${unit.heightMm} mm</div>
            </div>
            <div style="font-size:12px;color:var(--gl-text-mute)">Quote total · ${q.units.length} unit${q.units.length !== 1 ? 's' : ''}: <strong style="color:var(--gl-text);font-weight:600">${fmtMoneyFull(quoteTotal)}</strong></div>
          </div>

          <div class="cfg-pricing-tiers">
            <div class="cfg-pricing-tier factory">
              <div class="cfg-pricing-label">Factory cost</div>
              <div class="cfg-pricing-value">${fmtMoneyFull(pricing.factoryCost)}</div>
              <div class="cfg-pricing-margin">Internal · before margin</div>
            </div>
            <div class="cfg-pricing-tier dealer">
              <div class="cfg-pricing-label">Dealer cost (Tier B)</div>
              <div class="cfg-pricing-value">${fmtMoneyFull(pricing.dealerCost)}</div>
              <div class="cfg-pricing-margin">${Math.round((1 - pricing.dealerCost/pricing.msrp) * 100)}% off MSRP</div>
            </div>
            <div class="cfg-pricing-tier msrp">
              <div class="cfg-pricing-label">MSRP</div>
              <div class="cfg-pricing-value">${fmtMoneyFull(pricing.msrp)}</div>
              <div class="cfg-pricing-margin">Customer-facing · this unit</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Zone C: Options column -->
      <div class="cfg-options">
        <div class="cfg-options-header">
          <div class="cfg-options-title">Options</div>
        </div>
        <div class="cfg-options-list">
          ${SECTIONS.map(s => renderOptionSection(s, unit)).join('')}
        </div>
      </div>
    </div>
  `;
}

function getColorHex(arr, id) {
  const c = arr.find(x => x.id === id);
  return c ? c.hex : '#94A3B8';
}

function renderOptionSection(section, unit) {
  const isActive = state.activeOptionSection === section.id;
  let slotContent = '';

  if (section.id === 'colour') {
    const cat = state.configuratorCatalog;
    slotContent = `
      <div class="cfg-subsection">
        <div class="cfg-subsection-label exterior"><span class="accent"></span>Exterior · frame</div>
        <div class="cfg-swatches">
          ${cat.exteriorColors.map(c => `
            <div class="cfg-swatch ${unit.selections.exterior_color === c.id ? 'selected' : ''}" style="background:${c.hex.startsWith('linear') ? c.hex : c.hex};color:${isLight(c.hex) ? '#0F172A' : '#FFFFFF'}" onclick="updateOption('exterior_color', '${c.id}')">
              ${c.label}
              <div class="cfg-swatch-check">✓</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="cfg-subsection">
        <div class="cfg-subsection-label interior"><span class="accent"></span>Interior · sash & frame</div>
        <div class="cfg-swatches">
          ${cat.interiorColors.map(c => `
            <div class="cfg-swatch ${unit.selections.interior_color === c.id ? 'selected' : ''}" style="background:${c.hex.startsWith('linear') ? c.hex : c.hex};color:${isLight(c.hex) ? '#0F172A' : '#FFFFFF'}" onclick="updateOption('interior_color', '${c.id}')">
              ${c.label}
              <div class="cfg-swatch-check">✓</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else {
    const optMap = {
      brickmold: { arr: state.configuratorCatalog.brickmolds, key: 'brickmold' },
      glass:     { arr: state.configuratorCatalog.glassPackages, key: 'glass' },
      glazing:   { arr: state.configuratorCatalog.glazingFills, key: 'glazing' },
      grill:     { arr: state.configuratorCatalog.grills, key: 'grill' },
      jamb:      { arr: state.configuratorCatalog.jambs, key: 'jamb' },
      return:    { arr: state.configuratorCatalog.returns, key: 'return' },
      hardware:  { arr: state.configuratorCatalog.hardware, key: 'hardware' },
      safety:    { arr: state.configuratorCatalog.safety, key: 'safety' },
      screen:    { arr: state.configuratorCatalog.screens, key: 'screen' }
    };
    const m = optMap[section.id];
    if (m) {
      slotContent = `
        <div class="cfg-chips">
          ${m.arr.map(o => `
            <button class="cfg-chip ${unit.selections[m.key] === o.id ? 'selected' : ''}" onclick="updateOption('${m.key}', '${o.id}')">
              ${o.label}${o.msrp ? `<span class="cfg-chip-price">+$${o.msrp}</span>` : ''}
            </button>
          `).join('')}
        </div>
      `;
    }
  }

  return `
    <div class="cfg-section ${isActive ? 'active' : ''}">
      <div class="cfg-section-row" onclick="toggleSection('${section.id}')">
        <span class="cfg-section-name">${section.label}</span>
        <span class="cfg-section-value">
          ${section.swatch ? `<span class="cfg-section-swatch" style="background:${section.swatch}"></span>` : ''}
          ${section.value}
        </span>
      </div>
      ${isActive ? `<div class="cfg-section-slot">${slotContent}</div>` : ''}
    </div>
  `;
}

function isLight(hex) {
  if (!hex || hex.startsWith('linear')) return false;
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 165;
}

function renderUnitElevation(unit) {
  const cat = state.configuratorCatalog;
  const W = 320, H = 320;  // SVG canvas
  const aspect = unit.widthMm / unit.heightMm;
  let drawW, drawH;
  if (aspect > 1) { drawW = W * 0.85; drawH = drawW / aspect; }
  else { drawH = H * 0.85; drawW = drawH * aspect; }
  const x = (W - drawW) / 2, y = (H - drawH) / 2;

  const exteriorHex = (cat.exteriorColors.find(c => c.id === unit.selections.exterior_color) || {}).hex || '#F8FAFC';
  const frameColor = exteriorHex.startsWith('linear') ? '#52442F' : exteriorHex;
  const frameWidth = 12;

  // Glass
  const glassFill = unit.selections.glass.includes('low-e') ? 'rgba(186, 230, 253, 0.45)' : 'rgba(226, 232, 240, 0.45)';

  // Hinge indicator (triangle showing hinge side)
  let hinge = '';
  if (unit.type === 'casement') {
    if (unit.hinge === 'left') {
      hinge = `<line x1="${x + frameWidth + 2}" y1="${y + drawH / 2}" x2="${x + drawW - frameWidth - 2}" y2="${y + frameWidth + 2}" stroke="${frameColor}" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.5" />
               <line x1="${x + frameWidth + 2}" y1="${y + drawH / 2}" x2="${x + drawW - frameWidth - 2}" y2="${y + drawH - frameWidth - 2}" stroke="${frameColor}" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.5" />`;
    } else if (unit.hinge === 'right') {
      hinge = `<line x1="${x + drawW - frameWidth - 2}" y1="${y + drawH / 2}" x2="${x + frameWidth + 2}" y2="${y + frameWidth + 2}" stroke="${frameColor}" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.5" />
               <line x1="${x + drawW - frameWidth - 2}" y1="${y + drawH / 2}" x2="${x + frameWidth + 2}" y2="${y + drawH - frameWidth - 2}" stroke="${frameColor}" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.5" />`;
    }
  } else if (unit.type === 'awning') {
    hinge = `<line x1="${x + frameWidth}" y1="${y + frameWidth}" x2="${x + drawW / 2}" y2="${y + drawH - frameWidth - 2}" stroke="${frameColor}" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.5" />
             <line x1="${x + drawW - frameWidth}" y1="${y + frameWidth}" x2="${x + drawW / 2}" y2="${y + drawH - frameWidth - 2}" stroke="${frameColor}" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.5" />`;
  }

  // Grills
  let grills = '';
  const grillId = unit.selections.grill;
  if (grillId !== 'none') {
    const innerX = x + frameWidth, innerY = y + frameWidth;
    const innerW = drawW - frameWidth * 2, innerH = drawH - frameWidth * 2;
    let cols = 1, rows = 1;
    if (grillId === 'colonial') { cols = 2; rows = 2; }
    else if (grillId === 'colonial-3') { cols = 3; rows = 3; }
    else if (grillId === 'prairie') { cols = 1; rows = 1; }  // border-style
    const grillStroke = exteriorHex.startsWith('linear') ? '#0F172A' : exteriorHex;
    for (let i = 1; i < cols; i++) {
      const gx = innerX + (innerW * i / cols);
      grills += `<line x1="${gx}" y1="${innerY}" x2="${gx}" y2="${innerY + innerH}" stroke="${grillStroke}" stroke-width="2" />`;
    }
    for (let j = 1; j < rows; j++) {
      const gy = innerY + (innerH * j / rows);
      grills += `<line x1="${innerX}" y1="${gy}" x2="${innerX + innerW}" y2="${gy}" stroke="${grillStroke}" stroke-width="2" />`;
    }
  }

  // Double-hung horizontal divider
  let dhDivider = '';
  if (unit.type === 'double-hung') {
    const my = y + drawH / 2;
    dhDivider = `<line x1="${x + frameWidth}" y1="${my}" x2="${x + drawW - frameWidth}" y2="${my}" stroke="${frameColor}" stroke-width="3" />`;
  }

  return `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:relative;z-index:1">
      <!-- Outer frame -->
      <rect x="${x}" y="${y}" width="${drawW}" height="${drawH}" fill="${frameColor}" rx="3" stroke="${exteriorHex.startsWith('linear') ? '#0F172A' : '#0F172A'}" stroke-width="0.5" stroke-opacity="0.3" />
      <!-- Glass -->
      <rect x="${x + frameWidth}" y="${y + frameWidth}" width="${drawW - frameWidth * 2}" height="${drawH - frameWidth * 2}" fill="${glassFill}" stroke="rgba(15,23,42,0.10)" stroke-width="0.5" />
      ${dhDivider}
      ${grills}
      ${hinge}
      <!-- Reflection/light gradient on glass -->
      <rect x="${x + frameWidth}" y="${y + frameWidth}" width="${drawW - frameWidth * 2}" height="${drawH - frameWidth * 2}" fill="url(#glassGradient)" pointer-events="none" />
      <defs>
        <linearGradient id="glassGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.18)" />
          <stop offset="60%" stop-color="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
    </svg>
  `;
}

function renderQuoteDetail() {
  const q = getQuote(state.selectedQuoteId);
  if (!q) {
    $('quotes-view').innerHTML = '<div class="empty-state">Quote not found.</div>';
    return;
  }
  const value = quoteValue(q);
  const cat = state.configuratorCatalog;

  const unitRows = q.units.map((u, i) => {
    const p = computeUnitPricing(u);
    return `
      <div class="table-row" onclick="openConfigurator(${q.id}, '${u.id}')" style="grid-template-columns: 60px 1fr 130px 110px 110px 110px 110px">
        <div><div class="cfg-unit-num" style="margin:0">${i + 1}</div></div>
        <div>
          <div style="font-size:13.5px;font-weight:500">${u.label}</div>
          <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">${cat.windowTypes.find(t=>t.id===u.type)?.label} · ${u.widthMm}×${u.heightMm} mm</div>
        </div>
        <div style="font-size:12.5px">${u.selections.exterior_color}</div>
        <div style="font-size:12.5px">${cat.glassPackages.find(g=>g.id===u.selections.glass)?.label || '—'}</div>
        <div class="order-value" style="text-align:right">${fmtMoneyFull(p.factoryCost)}</div>
        <div class="order-value" style="text-align:right">${fmtMoneyFull(p.dealerCost)}</div>
        <div class="order-value" style="text-align:right">${fmtMoneyFull(p.msrp)}</div>
      </div>
    `;
  }).join('');

  const totals = q.units.reduce((acc, u) => {
    const p = computeUnitPricing(u);
    acc.factory += p.factoryCost;
    acc.dealer += p.dealerCost;
    acc.msrp += p.msrp;
    return acc;
  }, { factory: 0, dealer: 0, msrp: 0 });

  $('quotes-view').innerHTML = `
    ${renderBackButton()}
    <div class="view-header">
      <div>
        <button class="cfg-back" style="margin-bottom:6px;padding-left:0" onclick="renderQuotes()">← All quotes</button>
        <h1 class="view-title">${q.number}</h1>
        <div class="view-subtitle">${q.customer} · ${q.project}</div>
      </div>
      <div style="display:flex;gap:8px">
        <span class="quote-pill ${q.status}" style="font-size:12.5px;padding:6px 12px;align-self:center">${q.status === 'draft' ? '◇' : q.status === 'submitted' ? '↗' : q.status === 'approved' ? '✓' : '⛁'} ${q.status}</span>
        <button class="btn ghost" onclick="duplicateQuote(${q.id})">⎘ Duplicate</button>
        <button class="btn ghost" onclick="toast('Print preview (mock)')">🖨 Print PDF</button>
        ${q.status === 'draft' ? `<button class="btn primary" onclick="submitQuote(${q.id})">↗ Submit quote</button>` : ''}
        ${q.status === 'approved' ? `<button class="btn primary" onclick="convertToOrder(${q.id})">⛁ Convert to order</button>` : ''}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 320px;gap:14px;align-items:flex-start">
      <div>
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">Units · ${q.units.length}</div>
            <button class="btn sm primary" onclick="openConfigurator(${q.id}, '${q.units[0]?.id || ''}')">⚙ Open configurator</button>
          </div>
          <div style="display:grid;grid-template-columns: 60px 1fr 130px 110px 110px 110px 110px;padding:10px 16px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--gl-text-mute);border-bottom:0.5px solid var(--gl-border)">
            <div></div><div>UNIT</div><div>EXTERIOR</div><div>GLASS</div>
            <div style="text-align:right">FACTORY</div>
            <div style="text-align:right">DEALER</div>
            <div style="text-align:right">MSRP</div>
          </div>
          ${unitRows}
          <div style="display:grid;grid-template-columns: 60px 1fr 130px 110px 110px 110px 110px;padding:14px 16px;border-top:0.5px solid var(--gl-border);align-items:center;background:rgba(15,23,42,0.02)">
            <div></div>
            <div style="font-weight:600">Quote total · ${q.units.length} unit${q.units.length !== 1 ? 's' : ''}</div>
            <div></div><div></div>
            <div class="order-value" style="text-align:right;color:var(--gl-purple)">${fmtMoneyFull(totals.factory)}</div>
            <div class="order-value" style="text-align:right;color:var(--gl-info)">${fmtMoneyFull(totals.dealer)}</div>
            <div class="order-value" style="text-align:right;font-size:16px">${fmtMoneyFull(totals.msrp)}</div>
          </div>
        </div>

        <div class="panel" style="margin-top:14px">
          <div class="panel-header">
            <div class="panel-title">Margin analysis</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
            <div>
              <div class="kpi-label">Factory → MSRP margin</div>
              <div class="kpi-value">${Math.round((1 - totals.factory / totals.msrp) * 100)}%</div>
              <div class="kpi-delta">$${(totals.msrp - totals.factory).toLocaleString()} gross</div>
            </div>
            <div>
              <div class="kpi-label">Factory → Dealer margin</div>
              <div class="kpi-value">${Math.round((1 - totals.factory / totals.dealer) * 100)}%</div>
              <div class="kpi-delta">$${(totals.dealer - totals.factory).toLocaleString()} factory net</div>
            </div>
            <div>
              <div class="kpi-label">Dealer markup</div>
              <div class="kpi-value">${Math.round(((totals.msrp / totals.dealer) - 1) * 100)}%</div>
              <div class="kpi-delta">$${(totals.msrp - totals.dealer).toLocaleString()} dealer profit</div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel" style="position:sticky;top:84px">
        <div class="panel-title" style="margin-bottom:14px">Customer & site</div>
        <div style="font-size:13.5px;font-weight:500">${q.customer}</div>
        <div style="font-size:12px;color:var(--gl-text-mute);margin-top:2px">${q.customerType}</div>

        <div class="section-label" style="margin-top:18px">Project</div>
        <div style="font-size:13px;line-height:1.45">${q.project}</div>
        <div style="font-size:12px;color:var(--gl-text-mute);margin-top:4px">${q.siteCity}</div>

        <div class="section-label" style="margin-top:18px">Created by</div>
        <div style="font-size:13px">${q.submittedBy}</div>
        <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">${fmtDate(q.createdAt)}</div>

        <button class="btn ghost full" style="margin-top:18px">Edit customer details</button>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════
   MATERIALS — Inventory / Suppliers / POs / MRP
   ════════════════════════════════════════════════ */

function getSupplier(id) {
  return state.suppliers.find(s => s.id === id);
}

function getInventoryItem(id) {
  return state.inventory.find(i => i.id === id);
}

function onOrderQty(sku) {
  // Sum qty from all open POs (not received/closed)
  let total = 0;
  state.purchaseOrders.forEach(po => {
    if (po.status === 'received' || po.status === 'closed') return;
    po.lineItems.forEach(li => {
      if (li.sku === sku) total += li.qty;
    });
  });
  return total;
}

function projectedStock(item) {
  return item.onHand + onOrderQty(item.sku);
}

function coverageWeeks(item) {
  if (!item.avgWeekly) return 99;
  return projectedStock(item) / item.avgWeekly;
}

function stockHealth(item) {
  const projected = projectedStock(item);
  if (projected < item.reorderPoint * 0.5) return 'critical';
  if (projected < item.reorderPoint) return 'warn';
  return 'healthy';
}

function inventoryValue() {
  return state.inventory.reduce((s, i) => s + (i.onHand * i.unitCost), 0);
}

function openPOValue() {
  return state.purchaseOrders
    .filter(po => po.status !== 'received' && po.status !== 'closed')
    .reduce((s, po) => s + po.lineItems.reduce((ls, li) => ls + (li.qty * li.unitCost), 0), 0);
}

function ytdProcurementSpend() {
  return state.suppliers.reduce((s, sup) => s + sup.ytdSpend, 0);
}

function getReorderItems() {
  // Return items where projected stock < reorder point, sorted by urgency (lowest coverage first)
  const items = state.inventory
    .map(i => ({ ...i, projected: projectedStock(i), coverage: coverageWeeks(i) }))
    .filter(i => i.projected < i.reorderPoint)
    .sort((a, b) => a.coverage - b.coverage);
  return items;
}

function renderMaterials() {
  const tab = state.materialsTab;
  const reorderItems = getReorderItems();
  const invValue = inventoryValue();
  const openPO = openPOValue();
  const ytdSpend = ytdProcurementSpend();
  const openPOCount = state.purchaseOrders.filter(po => po.status !== 'received' && po.status !== 'closed').length;

  let content = '';

  if (tab === 'inventory') content = renderInventory();
  else if (tab === 'reorder') content = renderReorder();
  else if (tab === 'suppliers') content = renderSuppliers();
  else if (tab === 'pos') content = renderPurchaseOrders();

  $('materials-view').innerHTML = `
    ${renderBackButton()}
    <div class="view-header">
      <div>
        <h1 class="view-title">Materials</h1>
        <div class="view-subtitle">${state.inventory.length} SKUs · ${state.suppliers.length} suppliers · ${reorderItems.length} reorder alerts · ${openPOCount} open POs</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        ${renderSearchBar('materials', 'Search SKU, supplier, category…')}
        <button class="btn ghost">↑ Export inventory CSV</button>
        <button class="btn primary" onclick="newPO()">+ New PO</button>
      </div>
    </div>

    <div class="mat-summary">
      <div class="profit-card">
        <div class="profit-card-label">Inventory value</div>
        <div class="profit-card-value">${fmtMoney(invValue)}</div>
        <div class="profit-card-sub">on-hand stock at cost</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">On order from suppliers</div>
        <div class="profit-card-value" style="color:var(--gl-info)">${fmtMoney(openPO)}</div>
        <div class="profit-card-sub">${openPOCount} open POs · arriving 1–4 weeks</div>
      </div>
      <div class="profit-card ${reorderItems.length > 0 ? '' : 'highlight'}" onclick="state.materialsTab='reorder'; renderMaterials()" style="cursor:pointer;${reorderItems.length > 0 ? 'border-color:rgba(180,83,9,0.30)' : ''}">
        <div class="profit-card-label">Reorder needed</div>
        <div class="profit-card-value" style="color:${reorderItems.length > 0 ? 'var(--gl-warn)' : 'var(--gl-success)'}">${reorderItems.length}</div>
        <div class="profit-card-sub">${reorderItems.length > 0 ? 'SKUs below reorder point →' : 'all SKUs healthy ✓'}</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">YTD procurement spend</div>
        <div class="profit-card-value">${fmtMoney(ytdSpend)}</div>
        <div class="profit-card-sub">across ${state.suppliers.length} suppliers</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">Avg lead time</div>
        <div class="profit-card-value">${Math.round(state.suppliers.reduce((s, sup) => s + sup.avgLeadDays, 0) / state.suppliers.length)}d</div>
        <div class="profit-card-sub">supplier-weighted average</div>
      </div>
    </div>

    <div class="subtabs">
      <button class="subtab ${tab === 'inventory' ? 'active' : ''}" onclick="state.materialsTab='inventory'; renderMaterials()">Inventory<span class="subtab-badge">${state.inventory.length}</span></button>
      <button class="subtab ${tab === 'reorder' ? 'active' : ''}" onclick="state.materialsTab='reorder'; renderMaterials()">Reorder alerts${reorderItems.length > 0 ? `<span class="subtab-badge alert">${reorderItems.length}</span>` : ''}</button>
      <button class="subtab ${tab === 'suppliers' ? 'active' : ''}" onclick="state.materialsTab='suppliers'; renderMaterials()">Suppliers<span class="subtab-badge">${state.suppliers.length}</span></button>
      <button class="subtab ${tab === 'pos' ? 'active' : ''}" onclick="state.materialsTab='pos'; renderMaterials()">Purchase orders<span class="subtab-badge">${state.purchaseOrders.length}</span></button>
    </div>

    ${content}
  `;
}

function renderInventory() {
  const filter = state.inventoryFilter;
  const searchQ = (state.search && state.search.materials) || '';
  const matchesItem = (i) => matchesSearch(searchQ, [
    i.sku, i.name, i.category, i.supplier,
    getSupplier(i.supplierId || '') && getSupplier(i.supplierId || '').name
  ]);
  const itemsAll = filter === 'all' ? state.inventory : state.inventory.filter(i => i.category === filter);
  const items = itemsAll.filter(matchesItem);

  const categories = [
    { id: 'all', label: 'All', count: state.inventory.length },
    { id: 'frame', label: 'Vinyl frame/sash', count: state.inventory.filter(i => i.category === 'frame').length },
    { id: 'glass', label: 'Glass · IGU', count: state.inventory.filter(i => i.category === 'glass').length },
    { id: 'spacer', label: 'Spacer', count: state.inventory.filter(i => i.category === 'spacer').length },
    { id: 'hardware', label: 'Hardware', count: state.inventory.filter(i => i.category === 'hardware').length },
    { id: 'weatherstrip', label: 'Weatherstrip', count: state.inventory.filter(i => i.category === 'weatherstrip').length },
    { id: 'reinforcement', label: 'Reinforcement', count: state.inventory.filter(i => i.category === 'reinforcement').length },
    { id: 'brickmold', label: 'Brickmold', count: state.inventory.filter(i => i.category === 'brickmold').length },
    { id: 'screen', label: 'Screen', count: state.inventory.filter(i => i.category === 'screen').length }
  ];

  const rows = items.map(i => {
    const projected = projectedStock(i);
    const onOrder = onOrderQty(i.sku);
    const coverage = coverageWeeks(i);
    const health = stockHealth(i);
    const sup = getSupplier(i.supplierId);
    // Stock bar shows on-hand vs. reorderPoint vs. reorderQty as max
    const max = Math.max(i.reorderQty, i.onHand) * 1.15;
    const fillPct = Math.min(100, (i.onHand / max) * 100);
    const reorderMarkPct = Math.min(100, (i.reorderPoint / max) * 100);
    const stockClass = health === 'critical' ? 'critical' : health === 'warn' ? 'warn' : '';
    const covClass = coverage < 1.5 ? 'critical' : coverage < 3 ? 'warn' : 'healthy';

    return `
      <div class="table-row">
        <div>
          <div style="font-size:13.5px;font-weight:500">${i.name}</div>
          <div class="inv-sku">${i.sku} · from ${sup ? sup.short : '?'}</div>
        </div>
        <div><span class="inv-cat-pill ${i.category}">${i.category === 'weatherstrip' ? 'weather' : i.category === 'reinforcement' ? 'reinf.' : i.category === 'brickmold' ? 'brickmld' : i.category}</span></div>
        <div style="font-size:12.5px;color:var(--gl-text-mute);font-variant-numeric:tabular-nums">${i.uom}</div>
        <div class="stock-bar">
          <div class="stock-bar-track">
            <div class="stock-bar-fill ${stockClass}" style="width:${fillPct}%"></div>
            <div class="stock-bar-reorder" style="left:${reorderMarkPct}%"></div>
          </div>
          <div class="stock-num ${stockClass === 'critical' ? 'critical' : stockClass === 'warn' ? 'low' : ''}">${i.onHand.toLocaleString()}</div>
        </div>
        <div style="font-size:12.5px;color:var(--gl-text-mute);font-variant-numeric:tabular-nums">${onOrder > 0 ? '+' + onOrder.toLocaleString() : '—'}</div>
        <div><span class="coverage-pill ${covClass}">${coverage > 50 ? '50+' : coverage.toFixed(1)}w</span></div>
        <div style="font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;text-align:right">${fmtMoneyFull(i.onHand * i.unitCost).replace('.00','')}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="tabs" style="margin-bottom:14px;flex-wrap:wrap">
      ${categories.map(c => `
        <button class="tab ${filter === c.id ? 'active' : ''}" onclick="state.inventoryFilter='${c.id}'; renderMaterials()">${c.label}<span class="tab-count">${c.count}</span></button>
      `).join('')}
    </div>

    <div class="orders-table inv-table">
      <div class="table-head">
        <div>SKU · NAME</div>
        <div>CATEGORY</div>
        <div>UOM</div>
        <div>ON HAND</div>
        <div>ON ORDER</div>
        <div>COVERAGE</div>
        <div style="text-align:right">VALUE</div>
      </div>
      ${rows}
    </div>

    <div style="margin-top:12px;padding:14px 22px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute);line-height:1.55">
      <strong style="color:var(--gl-text);font-weight:600">Stock bar legend:</strong>
      Filled portion shows on-hand quantity · vertical line marks the reorder point · green = healthy · amber = below reorder point · red = critical (&lt;50% of reorder point).
      <strong style="color:var(--gl-text);font-weight:600;margin-left:14px">Coverage:</strong> projected stock (on hand + on order) ÷ avg weekly usage.
    </div>
  `;
}

function renderReorder() {
  const items = getReorderItems();

  if (items.length === 0) {
    return `<div class="panel"><div class="empty-state" style="padding:60px 20px"><div style="font-size:32px;margin-bottom:12px">✓</div><div style="font-size:15px;font-weight:600;color:var(--gl-text);letter-spacing:-0.015em">All stock healthy</div><div style="margin-top:6px">No SKUs are currently below reorder point. Next check tomorrow at 6 AM.</div></div></div>`;
  }

  // Group by supplier so we can roll up into draft POs
  const bySupplier = {};
  items.forEach(i => {
    if (!bySupplier[i.supplierId]) bySupplier[i.supplierId] = [];
    bySupplier[i.supplierId].push(i);
  });

  const suppliers = Object.keys(bySupplier).map(sid => {
    const sup = getSupplier(parseInt(sid, 10));
    const supItems = bySupplier[sid];
    const draftCost = supItems.reduce((s, i) => s + (i.reorderQty * i.unitCost), 0);

    return `
      <div class="panel" style="margin-bottom:14px">
        <div class="panel-header">
          <div>
            <div class="panel-title">${sup.name} <span style="font-weight:400;color:var(--gl-text-mute);font-size:12.5px">· ${supItems.length} SKU${supItems.length > 1 ? 's' : ''} below reorder point</span></div>
            <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">Lead time ${sup.avgLeadDays}d · ${sup.paymentTerms} · ${sup.onTimePct}% on-time</div>
          </div>
          <button class="btn primary sm" onclick="draftPOFromReorder(${sid})">Draft PO · ${fmtMoneyFull(draftCost)}</button>
        </div>

        ${supItems.map(i => {
          const projected = projectedStock(i);
          const cov = coverageWeeks(i);
          const priority = cov < 1 ? 'urgent' : cov < 2.5 ? 'warn' : 'notice';
          const priLabel = cov < 1 ? '!' : cov < 2.5 ? '⚠' : 'i';
          return `
            <div class="reorder-row">
              <div class="reorder-priority ${priority}">${priLabel}</div>
              <div>
                <div style="font-size:13.5px;font-weight:500">${i.name}</div>
                <div class="inv-sku">${i.sku}</div>
              </div>
              <div><span class="inv-cat-pill ${i.category}">${i.category}</span></div>
              <div style="text-align:right;font-size:12.5px"><div style="font-variant-numeric:tabular-nums;font-weight:600;color:var(--gl-text-mute)">${i.onHand.toLocaleString()} ${i.uom}</div><div style="font-size:11px;color:var(--gl-text-faint);margin-top:2px">on hand</div></div>
              <div style="text-align:right;font-size:12.5px"><div style="font-variant-numeric:tabular-nums;font-weight:600;color:var(--gl-warn)">${i.reorderPoint.toLocaleString()} ${i.uom}</div><div style="font-size:11px;color:var(--gl-text-faint);margin-top:2px">reorder pt</div></div>
              <div style="text-align:right;font-size:12.5px"><div style="font-variant-numeric:tabular-nums;font-weight:600">${i.reorderQty.toLocaleString()} ${i.uom}</div><div style="font-size:11px;color:var(--gl-text-faint);margin-top:2px">reorder qty</div></div>
              <div><span class="coverage-pill ${cov < 1.5 ? 'critical' : cov < 3 ? 'warn' : 'healthy'}">${cov.toFixed(1)}w left</span></div>
              <div style="text-align:right;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums">${fmtMoneyFull(i.reorderQty * i.unitCost).replace('.00','')}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding:14px 18px;background:rgba(180,83,9,0.06);border:0.5px solid rgba(180,83,9,0.25);border-radius:var(--gl-radius-card)">
      <div>
        <div style="font-size:14px;font-weight:600;color:var(--gl-warn);letter-spacing:-0.015em">⚠ ${items.length} SKU${items.length > 1 ? 's are' : ' is'} below reorder point</div>
        <div style="font-size:12.5px;color:var(--gl-text-mute);margin-top:3px">Group by supplier to roll up into draft POs. Items sorted by urgency (least coverage first).</div>
      </div>
      <button class="btn ghost sm" onclick="toast('Reorder schedule (mock)')">Schedule weekly check</button>
    </div>
    ${suppliers}
  `;
}

function renderSuppliers() {
  const searchQ = (state.search && state.search.materials) || '';
  const matchesSupplier = (s) => matchesSearch(searchQ, [
    s.name, s.category, s.address, s.contact, s.initials
  ]);
  const cards = state.suppliers.filter(matchesSupplier).map(s => {
    const items = state.inventory.filter(i => i.supplierId === s.id);
    const itemsValue = items.reduce((sum, i) => sum + (i.onHand * i.unitCost), 0);
    const openPOs = state.purchaseOrders.filter(po => po.supplierId === s.id && po.status !== 'received' && po.status !== 'closed').length;
    const perfClass = s.onTimePct >= 95 ? 'good' : 'fair';

    return `
      <div class="supplier-card">
        <div class="sup-head">
          <div class="sup-logo" style="background:${s.gradient}">${s.initials}</div>
          <div style="flex:1;min-width:0">
            <div class="sup-name">${s.name}</div>
            <div class="sup-cat">${s.category}</div>
            <div style="font-size:11.5px;color:var(--gl-text-faint);margin-top:3px">${s.address} · ${s.contact}</div>
          </div>
        </div>

        <div class="sup-stats">
          <div>
            <div class="sup-stat-label">Active SKUs</div>
            <div class="sup-stat-value">${items.length}</div>
          </div>
          <div>
            <div class="sup-stat-label">Open POs</div>
            <div class="sup-stat-value">${openPOs}</div>
          </div>
          <div>
            <div class="sup-stat-label">Lead time</div>
            <div class="sup-stat-value">${s.avgLeadDays}d</div>
          </div>
          <div>
            <div class="sup-stat-label">YTD spend</div>
            <div class="sup-stat-value">${fmtMoney(s.ytdSpend)}</div>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:12px;border-top:0.5px solid var(--gl-border)">
          <div class="sup-perf ${perfClass}">
            <span class="sup-perf-dot"></span>
            ${s.onTimePct}% on-time delivery
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn sm ghost" onclick="toast('View ' + '${s.short}' + ' SKUs (mock)')">View SKUs</button>
            <button class="btn sm primary" onclick="newPOForSupplier(${s.id})">+ New PO</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `<div class="supplier-grid">${cards}</div>`;
}

function renderPurchaseOrders() {
  const filter = state.poFilter;
  const searchQ = (state.search && state.search.materials) || '';
  const matchesPO = (po) => {
    const sup = getSupplier(po.supplierId);
    return matchesSearch(searchQ, [
      po.number, po.status, sup && sup.name, sup && sup.category,
      ...(po.lineItems || []).flatMap(li => [li.sku, li.name])
    ]);
  };
  let pos;
  if (filter === 'open') pos = state.purchaseOrders.filter(p => p.status !== 'received' && p.status !== 'closed');
  else if (filter === 'received') pos = state.purchaseOrders.filter(p => p.status === 'received' || p.status === 'closed');
  else pos = state.purchaseOrders;
  pos = pos.filter(matchesPO);

  const counts = {
    all: state.purchaseOrders.length,
    open: state.purchaseOrders.filter(p => p.status !== 'received' && p.status !== 'closed').length,
    received: state.purchaseOrders.filter(p => p.status === 'received' || p.status === 'closed').length
  };

  const rows = pos.map(po => {
    const sup = getSupplier(po.supplierId);
    const total = po.lineItems.reduce((s, li) => s + (li.qty * li.unitCost), 0);
    const lineCount = po.lineItems.length;
    const expected = po.expectedAt ? fmtDate(po.expectedAt) : '—';
    const actionBtn = po.status === 'submitted' ? `<button class="btn sm ghost" onclick="acknowledgePOFromSupplier('${po.id}')">Mark ack</button>` :
                      po.status === 'in-transit' ? `<button class="btn sm primary" onclick="receivePO('${po.id}')">Mark received</button>` :
                      po.status === 'acknowledged' ? `<button class="btn sm ghost" onclick="markInTransit('${po.id}')">Mark shipped</button>` :
                      '';

    return `
      <div class="table-row" onclick="toast('Open ' + '${po.id}' + ' detail (mock)')">
        <div>
          <div style="font-family:var(--gl-mono);font-size:12.5px;font-weight:600">${po.id}</div>
          <div class="inv-sku">submitted ${fmtDate(po.submittedAt)}</div>
        </div>
        <div>
          <div style="font-size:13px;font-weight:500;display:flex;align-items:center;gap:7px">
            <span class="dealer-mini-avatar" style="width:20px;height:20px;border-radius:0;font-size:9px;background:${sup ? sup.gradient : '#94A3B8'}">${sup ? sup.initials : '?'}</span>
            ${sup ? sup.name : '?'}
          </div>
          <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">${lineCount} line item${lineCount > 1 ? 's' : ''}</div>
        </div>
        <div><span class="po-pill ${po.status}">${po.status === 'in-transit' ? '🚚' : po.status === 'received' ? '✓' : po.status === 'closed' ? '○' : po.status === 'submitted' ? '↗' : '✓'} ${po.status.replace('-', ' ')}</span></div>
        <div style="font-size:12.5px;font-variant-numeric:tabular-nums">${expected}</div>
        <div class="order-value" style="text-align:right">${fmtMoneyFull(total).replace('.00','')}</div>
        <div style="text-align:right" onclick="event.stopPropagation()">${actionBtn}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="tabs" style="margin-bottom:14px">
      <button class="tab ${filter === 'all' ? 'active' : ''}" onclick="state.poFilter='all'; renderMaterials()">All<span class="tab-count">${counts.all}</span></button>
      <button class="tab ${filter === 'open' ? 'active' : ''}" onclick="state.poFilter='open'; renderMaterials()">Open<span class="tab-count">${counts.open}</span></button>
      <button class="tab ${filter === 'received' ? 'active' : ''}" onclick="state.poFilter='received'; renderMaterials()">Received<span class="tab-count">${counts.received}</span></button>
    </div>

    <div class="orders-table po-table">
      <div class="table-head">
        <div>PO #</div>
        <div>SUPPLIER</div>
        <div>STATUS</div>
        <div>EXPECTED</div>
        <div style="text-align:right">TOTAL</div>
        <div style="text-align:right">ACTION</div>
      </div>
      ${rows}
    </div>
  `;
}

/* PO + reorder actions */
function newPO() {
  toast('New PO wizard (mock)');
}

function newPOForSupplier(supplierId) {
  toast('New PO for ' + getSupplier(supplierId).short + ' (mock)');
}

function draftPOFromReorder(supplierId) {
  const sup = getSupplier(parseInt(supplierId, 10));
  if (!sup) return;
  // Roll up reorder items for this supplier into a real new PO
  const items = getReorderItems().filter(i => i.supplierId === sup.id);
  if (items.length === 0) return;
  const lineItems = items.map(i => ({ sku: i.sku, name: i.name, qty: i.reorderQty, unitCost: i.unitCost }));
  const newId = 'PO-2026-' + String(62 + state.purchaseOrders.filter(p => p.id.startsWith('PO-2026')).length).padStart(4, '0');
  const newPO = {
    id: newId, supplierId: sup.id, status: 'submitted',
    submittedAt: '2026-05-10',
    lineItems
  };
  state.purchaseOrders.unshift(newPO);
  const total = lineItems.reduce((s, li) => s + (li.qty * li.unitCost), 0);
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'purchase_order.created',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: newId, meta: `${sup.short} · ${lineItems.length} SKU · ${fmtMoneyFull(total)}`
  });
  toast('PO ' + newId + ' drafted to ' + sup.short + ' · ' + fmtMoneyFull(total));
  state.materialsTab = 'pos';
  renderMaterials();
}

function acknowledgePOFromSupplier(poId) {
  const po = state.purchaseOrders.find(p => p.id === poId);
  if (!po) return;
  po.status = 'acknowledged';
  po.ackdAt = '2026-05-10';
  toast(po.id + ' marked acknowledged');
  renderMaterials();
}

function markInTransit(poId) {
  const po = state.purchaseOrders.find(p => p.id === poId);
  if (!po) return;
  po.status = 'in-transit';
  po.shippedAt = '2026-05-10';
  const sup = getSupplier(po.supplierId);
  if (sup) po.expectedAt = '2026-05-' + String(10 + sup.avgLeadDays).padStart(2, '0');
  toast(po.id + ' marked in transit · ETA ' + fmtDate(po.expectedAt));
  renderMaterials();
}

function receivePO(poId) {
  const po = state.purchaseOrders.find(p => p.id === poId);
  if (!po) return;
  po.status = 'received';
  po.receivedAt = '2026-05-10';
  // Add the qty to inventory
  po.lineItems.forEach(li => {
    const item = state.inventory.find(i => i.sku === li.sku);
    if (item) item.onHand += li.qty;
  });
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'purchase_order.received',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: po.id, meta: `${po.lineItems.length} SKU received · stock incremented`
  });
  toast(po.id + ' received · inventory updated');
  renderMaterials();
}

/* ════════════════════════════════════════════════
   v32 TRANCHE 1 — Notification bell + panel
   ════════════════════════════════════════════════ */

function unreadNotifCount() {
  return state.notifications.filter(n => !n.read).length;
}

function urgentNotifCount() {
  return state.notifications.filter(n => n.urgency === 'urgent' && !n.read).length;
}

function updateNotifBadge() {
  const bell = document.getElementById('notifBell');
  const badge = document.getElementById('notifBadge');
  if (!bell || !badge) return;
  const unread = unreadNotifCount();
  const urgent = urgentNotifCount();
  if (unread > 0) {
    badge.style.display = 'flex';
    badge.textContent = unread > 9 ? '9+' : String(unread);
  } else {
    badge.style.display = 'none';
  }
  if (urgent > 0) bell.classList.add('has-urgent');
  else bell.classList.remove('has-urgent');
}

function toggleNotifPanel() {
  state.notifPanelOpen = !state.notifPanelOpen;
  renderNotifPanel();
}

function closeNotifPanel() {
  state.notifPanelOpen = false;
  renderNotifPanel();
}

function setNotifTab(t) {
  state.notifTab = t;
  renderNotifPanel();
}

function markNotifRead(id) {
  const n = state.notifications.find(x => x.id === id);
  if (n) n.read = true;
  updateNotifBadge();
  renderNotifPanel();
}

function markAllNotifsRead() {
  state.notifications.forEach(n => n.read = true);
  updateNotifBadge();
  renderNotifPanel();
  toast('All notifications marked as read');
}

function openNotif(id) {
  const n = state.notifications.find(x => x.id === id);
  if (!n) return;
  n.read = true;
  state.notifPanelOpen = false;
  if (n.link) {
    if (n.link.view) switchView(n.link.view);
    if (n.link.tab) {
      if (n.link.view === 'production') setProductionTab(n.link.tab);
      else if (n.link.view === 'materials') { state.materialsTab = n.link.tab; renderMaterials(); }
      else if (n.link.view === 'financials') { state.financialsTab = n.link.tab; renderFinancials(); }
      else if (n.link.view === 'settings') { state.settingsTab = n.link.tab; renderSettings(); }
    }
  }
  renderNotifPanel();
  updateNotifBadge();
}

/* Modern monoline SVG icons for notifications.
   18px stroke-only icons, currentColor — pick up the notif-icon color. */
function notifIconSVG(kind) {
  const ICONS = {
    rush: '<path d="M13 2 4 13h7l-1 7 9-11h-7l1-7z"/>',
    warranty: '<path d="M12 3 4 7v5c0 4.4 3.4 8.4 8 9 4.6-.6 8-4.6 8-9V7l-8-4z"/><path d="M12 9v4"/><path d="M12 16h.01"/>',
    overdue: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 2h6"/><path d="M12 2v3"/>',
    reorder: '<path d="M21 8 12 3 3 8v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
    ar: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M7 15h2"/><path d="M13 15h4"/>',
    machine: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    'po-arriving': '<path d="M1 3h13v13H1z"/><path d="M14 8h4l3 3v5h-7"/><circle cx="6" cy="19" r="2"/><circle cx="17" cy="19" r="2"/>',
    'dealer-invite': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    drawing: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
    'qc-fail': '<path d="m12 3 10 18H2z"/><path d="M12 10v4"/><path d="M12 17h.01"/>'
  };
  const body = ICONS[kind] || '<circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/>';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">${body}</svg>`;
}

function renderNotifPanel() {
  const root = document.getElementById('notifPanel');
  if (!root) return;
  if (!state.notifPanelOpen) { root.innerHTML = ''; return; }

  const tab = state.notifTab;
  let filtered = state.notifications;
  if (tab === 'urgent') filtered = filtered.filter(n => n.urgency === 'urgent');
  else if (tab === 'unread') filtered = filtered.filter(n => !n.read);

  const counts = {
    all: state.notifications.length,
    urgent: state.notifications.filter(n => n.urgency === 'urgent').length,
    unread: state.notifications.filter(n => !n.read).length
  };

  const items = filtered.length > 0 ? filtered.map(n => {
    const iconClass = n.urgency === 'urgent' ? 'urgent' : n.urgency === 'warn' ? 'warn' : n.urgency === 'success' ? 'success' : 'info';
    const svgIcon = notifIconSVG(n.kind);
    // Back-compat for any notifications that still use the old `text` field
    const headline = n.headline || (n.text ? n.text.split(/\s—\s|:\s|\s\(/, 1)[0] : '');
    const detail = n.detail || (n.text && n.text !== headline ? n.text.slice(headline.length).replace(/^[\s—:()]+|[()]+$/g, '').trim() : '');

    return `
      <div class="notif-item ${n.read ? '' : 'unread'}" onclick="openNotif(${n.id})">
        <div class="notif-icon ${iconClass}">${svgIcon}</div>
        <div class="notif-content">
          <div class="notif-headline">${headline}</div>
          ${detail ? `<div class="notif-detail">${detail}</div>` : ''}
          <div class="notif-meta">
            <span>${fmtRelTime(n.at)}</span>
            <span class="notif-meta-sep"></span>
            <span>${n.kind.replace('-', ' ')}</span>
            ${!n.read ? '<span class="notif-meta-sep"></span><span class="notif-new-dot">●&nbsp;new</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join('') : `<div style="padding:60px 20px;text-align:center;color:var(--gl-text-faint)"><div style="font-size:30px;margin-bottom:8px;color:var(--gl-success)">✓</div><div style="font-size:14px;font-weight:600;color:var(--gl-text);letter-spacing:-0.012em">All caught up</div><div style="font-size:12.5px;margin-top:4px">No ${tab === 'urgent' ? 'urgent ' : tab === 'unread' ? 'unread ' : ''}notifications</div></div>`;

  root.innerHTML = `
    <div class="notif-panel-overlay" onclick="closeNotifPanel()"></div>
    <div class="notif-panel">
      <div class="notif-head">
        <div class="notif-title">Notifications</div>
        <button class="btn ghost sm" onclick="markAllNotifsRead()">Mark all read</button>
        <button class="modal-close" onclick="closeNotifPanel()">×</button>
      </div>
      <div class="notif-tabs">
        <button class="notif-tab ${tab === 'all' ? 'active' : ''}" onclick="setNotifTab('all')">All<span class="notif-tab-count">${counts.all}</span></button>
        <button class="notif-tab ${tab === 'urgent' ? 'active urgent' : counts.urgent > 0 ? 'urgent' : ''}" onclick="setNotifTab('urgent')">Urgent<span class="notif-tab-count">${counts.urgent}</span></button>
        <button class="notif-tab ${tab === 'unread' ? 'active' : ''}" onclick="setNotifTab('unread')">Unread<span class="notif-tab-count">${counts.unread}</span></button>
      </div>
      <div class="notif-list">${items}</div>
      <div class="notif-foot">
        <button class="btn ghost sm" onclick="switchView('audit'); closeNotifPanel()">View audit log →</button>
        <div style="flex:1"></div>
        <button class="btn ghost sm" onclick="state.settingsTab='notifications'; switchView('settings'); closeNotifPanel()">⚙ Preferences</button>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════
   GLOBAL SEARCH (Cmd+K)
   ════════════════════════════════════════════════ */

function openGlobalSearch() {
  state.globalSearchOpen = true;
  state.globalSearchQuery = '';
  state.globalSearchFocus = 0;
  renderGlobalSearch();
  setTimeout(() => {
    const inp = document.getElementById('globalSearchInput');
    if (inp) inp.focus();
  }, 50);
}

function closeGlobalSearch() {
  state.globalSearchOpen = false;
  renderGlobalSearch();
}

function setGlobalSearchQuery(q) {
  state.globalSearchQuery = q;
  state.globalSearchFocus = 0;
  renderGlobalSearch();
  // Re-focus input after re-render
  setTimeout(() => {
    const inp = document.getElementById('globalSearchInput');
    if (inp) {
      const v = inp.value;
      inp.focus();
      inp.setSelectionRange(v.length, v.length);
    }
  }, 0);
}

function searchAll(q) {
  if (!q || q.trim().length === 0) return { groups: [] };
  const ql = q.toLowerCase().trim();
  const results = { orders: [], quotes: [], dealers: [], products: [], skus: [], nav: [] };

  state.orders.forEach(o => {
    const d = getDealer(o.dealerId);
    if (o.po.toLowerCase().includes(ql) || o.project.toLowerCase().includes(ql) || (d && d.short.toLowerCase().includes(ql))) {
      results.orders.push({ id: o.id, title: o.po + ' · ' + o.project, sub: d.short + ' · ' + statusLabel(o.status) + ' · ' + o.units + ' units', icon: 'po', action: () => { openOrderFullscreen(o.id); } });
    }
  });

  (state.quotes || []).forEach(q2 => {
    if (q2.number.toLowerCase().includes(ql) || q2.customer.toLowerCase().includes(ql) || q2.project.toLowerCase().includes(ql)) {
      results.quotes.push({ id: q2.id, title: q2.number + ' · ' + q2.project, sub: q2.customer, icon: 'quote', action: () => { state.selectedQuoteId = q2.id; switchView('quotes'); } });
    }
  });

  state.dealers.forEach(d => {
    if (d.name.toLowerCase().includes(ql) || d.region.toLowerCase().includes(ql)) {
      results.dealers.push({ id: d.id, title: d.name, sub: d.region, icon: 'dealer', action: () => { switchView('dealers'); } });
    }
  });

  state.catalog.products.forEach(p => {
    if (p.name.toLowerCase().includes(ql) || p.family.toLowerCase().includes(ql) || p.slug.toLowerCase().includes(ql)) {
      results.products.push({ id: p.id, title: p.name, sub: p.family + ' · ' + fmtMoneyFull(p.msrp) + ' MSRP', icon: 'product', action: () => { state.catalogTab = 'products'; switchView('catalog'); } });
    }
  });

  state.inventory.forEach(i => {
    if (i.sku.toLowerCase().includes(ql) || i.name.toLowerCase().includes(ql)) {
      results.skus.push({ id: i.id, title: i.name, sub: i.sku + ' · ' + i.onHand + ' ' + i.uom + ' on hand', icon: 'sku', action: () => { state.materialsTab = 'inventory'; switchView('materials'); } });
    }
  });

  // Nav shortcuts
  const navItems = [
    { label: 'Dashboard', view: 'dashboard' },
    { label: 'Production Kanban', view: 'production' },
    { label: 'Materials · Inventory', view: 'materials' },
    { label: 'Financials · P&L', view: 'financials' },
    { label: 'Dealers', view: 'dealers' },
    { label: 'Catalog · Import Excel', view: 'catalog' },
    { label: 'Settings · Machine integrations', view: 'settings' },
    { label: 'Audit log', view: 'audit' }
  ];
  navItems.forEach(n => {
    if (n.label.toLowerCase().includes(ql)) {
      results.nav.push({ title: 'Go to ' + n.label, sub: 'Navigation', icon: 'nav', action: () => { switchView(n.view); } });
    }
  });

  const groups = [];
  if (results.orders.length) groups.push({ title: 'Orders', items: results.orders.slice(0, 5) });
  if (results.quotes.length) groups.push({ title: 'Quotes', items: results.quotes.slice(0, 5) });
  if (results.dealers.length) groups.push({ title: 'Dealers', items: results.dealers.slice(0, 5) });
  if (results.products.length) groups.push({ title: 'Catalog products', items: results.products.slice(0, 5) });
  if (results.skus.length) groups.push({ title: 'Inventory SKUs', items: results.skus.slice(0, 5) });
  if (results.nav.length) groups.push({ title: 'Navigation', items: results.nav.slice(0, 5) });
  return { groups };
}

function flattenedSearchResults() {
  const r = searchAll(state.globalSearchQuery);
  const flat = [];
  r.groups.forEach(g => g.items.forEach(i => flat.push(i)));
  return flat;
}

function searchKey(e) {
  if (!state.globalSearchOpen) return;
  if (e.key === 'Escape') { closeGlobalSearch(); return; }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const flat = flattenedSearchResults();
    state.globalSearchFocus = Math.min(flat.length - 1, state.globalSearchFocus + 1);
    renderGlobalSearch();
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    state.globalSearchFocus = Math.max(0, state.globalSearchFocus - 1);
    renderGlobalSearch();
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    const flat = flattenedSearchResults();
    const sel = flat[state.globalSearchFocus];
    if (sel && sel.action) { sel.action(); closeGlobalSearch(); }
  }
}

function renderGlobalSearch() {
  const root = document.getElementById('globalSearchRoot');
  if (!root) return;
  if (!state.globalSearchOpen) { root.innerHTML = ''; return; }

  const q = state.globalSearchQuery;
  const { groups } = searchAll(q);
  const totalCount = groups.reduce((s, g) => s + g.items.length, 0);

  let resultIdx = 0;
  const groupsHtml = groups.map(g => `
    <div>
      <div class="search-group-title">${g.title} · ${g.items.length}</div>
      ${g.items.map(it => {
        const isFocused = resultIdx === state.globalSearchFocus;
        const idx = resultIdx++;
        return `
          <div class="search-result ${isFocused ? 'focused' : ''}" onclick="(${it.action.toString()})(); closeGlobalSearch()" data-idx="${idx}">
            <div class="search-result-icon ${it.icon}">${it.icon === 'po' ? '📦' : it.icon === 'quote' ? '📄' : it.icon === 'dealer' ? '🏢' : it.icon === 'product' ? '◫' : it.icon === 'sku' ? '#' : '→'}</div>
            <div class="search-result-text">
              <div class="search-result-title">${escapeHtml(it.title)}</div>
              <div class="search-result-sub">${escapeHtml(it.sub)}</div>
            </div>
            <div><kbd class="search-result-kbd">↵</kbd></div>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');

  const body = totalCount === 0 ? (
    q.trim().length > 0
      ? `<div class="search-empty">No results for "${escapeHtml(q)}"</div>`
      : `<div style="padding:14px 20px"><div class="search-group-title">Suggestions</div>
          <div class="search-result" onclick="(()=>{switchView('production'); setProductionTab('rush');})(); closeGlobalSearch()"><div class="search-result-icon nav">⚡</div><div class="search-result-text"><div class="search-result-title">Review rush requests</div><div class="search-result-sub">${state.rushRequests.filter(r => r.status === 'REQUESTED').length} pending</div></div><div><kbd class="search-result-kbd">↵</kbd></div></div>
          <div class="search-result" onclick="(()=>{state.materialsTab='reorder'; switchView('materials');})(); closeGlobalSearch()"><div class="search-result-icon nav">📦</div><div class="search-result-text"><div class="search-result-title">Reorder alerts</div><div class="search-result-sub">${getReorderItems().length} SKUs below reorder point</div></div><div><kbd class="search-result-kbd">↵</kbd></div></div>
          <div class="search-result" onclick="(()=>{state.financialsTab='ar'; switchView('financials');})(); closeGlobalSearch()"><div class="search-result-icon nav">💰</div><div class="search-result-text"><div class="search-result-title">Open receivables</div><div class="search-result-sub">View A/R aging</div></div><div><kbd class="search-result-kbd">↵</kbd></div></div>
        </div>`
  ) : groupsHtml;

  root.innerHTML = `
    <div class="search-overlay" onclick="if(event.target === this) closeGlobalSearch()">
      <div class="search-card">
        <div class="search-input-row">
          <span style="font-size:16px;color:var(--gl-text-mute)">🔍</span>
          <input type="text" id="globalSearchInput" class="search-input" placeholder="Search orders, quotes, dealers, products, SKUs..." value="${escapeHtml(q)}" oninput="setGlobalSearchQuery(this.value)" onkeydown="searchKey(event)" />
          <span class="search-esc">esc</span>
        </div>
        <div class="search-results">${body}</div>
        <div class="search-hints">
          <span><kbd class="search-result-kbd">↑↓</kbd> navigate</span>
          <span><kbd class="search-result-kbd">↵</kbd> select</span>
          <span><kbd class="search-result-kbd">esc</kbd> close</span>
          <div style="flex:1"></div>
          <span>${totalCount} result${totalCount === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════
   DASHBOARD GREETING + NEEDS-ATTENTION PANEL
   ════════════════════════════════════════════════ */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function renderAttentionPanel() {
  // Aggregate everything that needs the owner's attention
  const items = [];
  const rushPending = state.rushRequests.filter(r => r.status === 'REQUESTED').length;
  const warrantyFlagged = state.warrantyClaims.filter(c => c.status === 'FLAGGED').length;
  const reorderCount = getReorderItems().length;
  const ar60plus = state.orders.filter(o => {
    if (o.status === 'delivered' || o.status === 'new') return false;
    const days = Math.max(0, Math.floor((TODAY - new Date(o.submittedAt)) / 86400000));
    return days > 60;
  });
  const overdueCount = state.orders.filter(o => o.status !== 'delivered' && o.status !== 'shipped' && dateLabel(o.shipBy).late).length;
  const approvalsCount = state.approvals.length;
  const machineErrors = state.machines.filter(m => m.status === 'error').length;
  const drawingsPending = 2; // would be live in production
  const qcHolds = state.qcInspections.filter(q => q.status === 'failed').length;
  const expiredInvites = state.pendingInvites.filter(i => i.status === 'expired').length;

  if (rushPending > 0) items.push({ urgent: true, icon: '⚡', count: rushPending, label: 'Rush requests', sub: 'Awaiting your approval', view: 'production', tab: 'rush' });
  if (warrantyFlagged > 0) items.push({ urgent: true, icon: '⚠', count: warrantyFlagged, label: 'Flagged warranty claims', sub: 'Need triage', view: 'production', tab: 'warranty' });
  if (overdueCount > 0) items.push({ urgent: true, icon: '⏰', count: overdueCount, label: 'Overdue orders', sub: 'Past shipping date', view: 'production', tab: 'orders' });
  if (qcHolds > 0) items.push({ urgent: true, icon: '🔍', count: qcHolds, label: 'QC failures', sub: 'Units on hold', view: 'production', tab: 'qc' });
  if (approvalsCount > 0) items.push({ urgent: state.approvals.some(a => a.urgency === 'urgent'), icon: '📋', count: approvalsCount, label: 'Pending approvals', sub: 'Discounts, POs, claims', view: 'production', tab: 'approvals' });
  if (reorderCount > 0) items.push({ urgent: false, icon: '📦', count: reorderCount, label: 'Materials below reorder', sub: 'Draft POs needed', view: 'materials', tab: 'reorder' });
  if (machineErrors > 0) items.push({ urgent: false, icon: '⚙', count: machineErrors, label: 'Machines offline', sub: 'Check Stürtz cleaner', view: 'settings', tab: 'machines' });
  if (ar60plus.length > 0) items.push({ urgent: false, icon: '💰', count: ar60plus.length, label: 'A/R aged 60+ days', sub: 'Send reminders', view: 'financials', tab: 'ar' });
  if (drawingsPending > 0) items.push({ urgent: false, icon: '📋', count: drawingsPending, label: 'Drawings awaiting sign-off', sub: 'Pending dealer review', view: 'production', tab: 'drawings' });
  if (expiredInvites > 0) items.push({ urgent: false, icon: '✉', count: expiredInvites, label: 'Expired dealer invites', sub: 'Resend or cancel', view: 'dealers' });

  if (items.length === 0) {
    return `
      <div class="attention-panel">
        <div class="attention-head">
          <div class="attention-title">⚡ Needs your attention</div>
          <div style="flex:1"></div>
          <div style="font-size:11px;color:var(--gl-text-faint);font-weight:500">Auto-refreshed 8:14 AM</div>
        </div>
        <div class="attention-empty">
          <div class="attention-empty-icon">✓</div>
          <div style="font-weight:600;color:var(--gl-text);font-size:15px;letter-spacing:-0.012em;margin-bottom:4px">You're all caught up</div>
          <div>Nothing pressing — go drink a coffee.</div>
        </div>
      </div>
    `;
  }

  const hasUrgent = items.some(i => i.urgent);
  const visible = items.slice(0, 6);
  const hidden = items.length - visible.length;

  return `
    <div class="attention-panel ${hasUrgent ? 'has-urgent' : ''}">
      <div class="attention-head">
        <div class="attention-title">${hasUrgent ? 'Needs your attention' : 'Today\'s agenda'}</div>
        <div style="flex:1"></div>
        ${hidden > 0 ? `<button class="btn ghost sm" onclick="toggleNotifPanel()">+${hidden} more</button>` : ''}
      </div>
      <div class="attention-grid">
        ${visible.map(it => `
          <div class="attention-card ${it.urgent ? 'urgent' : ''}" onclick="switchView('${it.view}'); ${it.tab ? `setTimeout(() => { if ('${it.view}' === 'production') setProductionTab('${it.tab}'); else if ('${it.view}' === 'materials') { state.materialsTab='${it.tab}'; renderMaterials(); } else if ('${it.view}' === 'financials') { state.financialsTab='${it.tab}'; renderFinancials(); } else if ('${it.view}' === 'settings') { state.settingsTab='${it.tab}'; renderSettings(); } }, 0);` : ''}">
            <div class="attention-card-row">
              <div class="attention-card-count">${it.count}</div>
              <div class="attention-card-label">${it.label}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════
   APPROVAL QUEUE
   ════════════════════════════════════════════════ */

function renderApprovalsTab() {
  const items = state.approvals;
  if (items.length === 0) {
    return `<div class="panel"><div class="empty-state" style="padding:50px 20px"><div style="font-size:30px;color:var(--gl-success);margin-bottom:8px">✓</div><div style="font-size:15px;font-weight:600;color:var(--gl-text);letter-spacing:-0.012em">No pending approvals</div><div style="margin-top:4px">Everything's already decided.</div></div></div>`;
  }

  const rows = items.map(a => {
    const icon = ({
      'discount': '%', 'po': '🚚', 'warranty': '⚠', 'rush': '⚡', 'dealer': '🏢', 'price': '$'
    })[a.kind] || '?';
    return `
      <div class="approval-row">
        <div class="approval-icon ${a.kind}">${icon}</div>
        <div>
          <div class="approval-title">${escapeHtml(a.title)}</div>
          <div class="approval-detail">${escapeHtml(a.detail)} · requested by ${escapeHtml(a.requestedBy)} · ${fmtRelTime(a.requestedAt)}</div>
        </div>
        <div>${a.urgency === 'urgent' ? '<span style="font-size:10.5px;font-weight:600;color:var(--gl-danger);text-transform:uppercase;letter-spacing:0.05em">● Urgent</span>' : '<span style="font-size:10.5px;color:var(--gl-text-mute);text-transform:uppercase;letter-spacing:0.05em">○ Normal</span>'}</div>
        <div class="approval-amount">${escapeHtml(a.amount)}</div>
        <div class="approval-actions">
          <button class="btn ghost sm" onclick="viewApprovalDetail('${a.id}')" title="View details">View</button>
          <button class="btn ghost sm" onclick="rejectApproval('${a.id}')" style="color:var(--gl-danger)">Reject</button>
          <button class="btn primary sm" onclick="approveItem('${a.id}')">Approve</button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Pending approvals · ${items.length}</div>
        <div style="flex:1"></div>
        <button class="btn ghost sm" onclick="toast('Bulk approve mock')">Bulk approve</button>
      </div>
      ${rows}
    </div>

    <div style="margin-top:14px;padding:14px 18px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute);line-height:1.55">
      <strong style="color:var(--gl-text);font-weight:600">About approvals:</strong>
      Custom dealer discounts beyond tier defaults, POs exceeding the configured threshold, warranty remakes, rush fee waivers, new dealer applications, and price changes &gt;10% route here for owner sign-off. Configure thresholds in Settings → Approval policies.
    </div>
  `;
}

function viewApprovalDetail(id) {
  const a = state.approvals.find(x => x.id === id);
  if (!a) return;
  toast('Open ' + a.title + ' — full review (mock)');
}

function approveItem(id) {
  const a = state.approvals.find(x => x.id === id);
  if (!a) return;
  state.approvals = state.approvals.filter(x => x.id !== id);
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'approval.granted',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: a.title, meta: a.kind + ' approval · ' + a.amount
  });
  // Auto-complete calendar tasks for this approval kind
  const kindMap = { discount: 'approve-discount', po: 'approve-po', warranty: 'approve-warranty', rush: 'approve-rush', dealer: 'approve-dealer', price: 'approve-price' };
  const taskKind = kindMap[a.kind];
  if (taskKind) autoCompleteTask(taskKind, { note: 'Approved · just now' });
  toast('Approved: ' + a.title);
  renderProduction();
}

function rejectApproval(id) {
  const a = state.approvals.find(x => x.id === id);
  if (!a) return;
  if (!confirm('Reject "' + a.title + '"?')) return;
  state.approvals = state.approvals.filter(x => x.id !== id);
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'approval.rejected',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: a.title, meta: a.kind + ' approval rejected'
  });
  toast('Rejected: ' + a.title);
  renderProduction();
}

/* ════════════════════════════════════════════════
   PROVENANCE — edit attribution subtitles
   ════════════════════════════════════════════════ */

function provenanceFor(entity, id, field) {
  const key = entity + ':' + id + ':' + field;
  return state.provenance[key] || null;
}

function recordProvenance(entity, id, field) {
  const key = entity + ':' + id + ':' + field;
  state.provenance[key] = {
    actor: state.user.name,
    at: new Date().toISOString()
  };
}

function provenanceHtml(entity, id, field) {
  const p = provenanceFor(entity, id, field);
  if (!p) return '';
  return `<div class="provenance" onclick="viewFullHistory('${entity}', ${typeof id === 'string' ? "'" + id + "'" : id}, '${field}')"><span class="provenance-dot"></span>edited ${fmtRelTime(p.at)} by ${escapeHtml(p.actor.split(' ')[0])}</div>`;
}

function viewFullHistory(entity, id, field) {
  toast('Full edit history for ' + entity + ' ' + id + ' / ' + field + ' (would open modal)');
}

/* ════════════════════════════════════════════════
   QUALITY CONTROL
   ════════════════════════════════════════════════ */

function renderQCTab() {
  const inspections = state.qcInspections;
  const passed = inspections.filter(i => i.status === 'passed').length;
  const failed = inspections.filter(i => i.status === 'failed').length;
  const inProgress = inspections.filter(i => i.status === 'in-progress').length;
  const totalUnits = state.orders.filter(o => o.status === 'production' || o.status === 'ready').reduce((s, o) => s + o.units, 0);
  const passRate = (passed + failed) > 0 ? passed / (passed + failed) : 0;

  return `
    <div class="qc-summary">
      <div class="profit-card highlight">
        <div class="profit-card-label">Pass rate (week)</div>
        <div class="profit-card-value">${(passRate * 100).toFixed(1)}%</div>
        <div class="profit-card-sub">${passed} passed of ${passed + failed}</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">In QC now</div>
        <div class="profit-card-value">${inProgress}</div>
        <div class="profit-card-sub">${inProgress > 0 ? 'inspecting' : 'idle'}</div>
      </div>
      <div class="profit-card" ${failed > 0 ? 'style="border-color:rgba(185,28,28,0.25)"' : ''}>
        <div class="profit-card-label">On hold (failed)</div>
        <div class="profit-card-value" style="color:${failed > 0 ? 'var(--gl-danger)' : 'var(--gl-text-faint)'}">${failed}</div>
        <div class="profit-card-sub">${failed > 0 ? 'rework needed' : 'all clear'}</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">Units pending QC</div>
        <div class="profit-card-value">${totalUnits}</div>
        <div class="profit-card-sub">in production + ready</div>
      </div>
    </div>

    <div class="qc-bay">
      <div class="qc-bay-head">
        <div>
          <div class="qc-bay-name">QC Bay 1 — Frame &amp; weld inspection</div>
          <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">Inspector: Lin Park · 6 checkpoints per unit</div>
        </div>
        <div style="flex:1"></div>
        <button class="btn ghost sm">View checklist template</button>
      </div>
      ${inspections.filter(i => i.bayId === 'qc-bay-1').map(qc => {
        const o = getOrder(qc.orderId);
        return `
          <div class="qc-row ${qc.status}">
            <div style="font-family:var(--gl-mono);font-size:12px;font-weight:600">${o ? 'O-' + qc.orderId : '?'}</div>
            <div>
              <div style="font-size:13px;font-weight:500">${o ? o.project : '?'}</div>
              <div style="font-size:11px;color:var(--gl-text-mute);margin-top:2px">${qc.unitRange}</div>
            </div>
            <div><span style="font-size:11px;font-weight:600;color:${qc.status === 'passed' ? 'var(--gl-success)' : qc.status === 'failed' ? 'var(--gl-danger)' : 'var(--gl-info)'};text-transform:uppercase;letter-spacing:0.05em">${qc.status === 'in-progress' ? '⏳ In progress' : qc.status === 'passed' ? '✓ Passed' : '⚠ Failed'}</span></div>
            <div class="qc-checklist">
              ${qc.checks.map(c => `<span class="qc-check ${c.status}" title="${c.label}">${c.status === 'pass' ? '✓' : c.status === 'fail' ? '✗' : '○'}</span>`).join('')}
            </div>
            <div style="font-size:11.5px;color:var(--gl-text-mute);font-variant-numeric:tabular-nums">${fmtRelTime(qc.inspectedAt)}</div>
            <div style="display:flex;gap:5px;justify-content:flex-end">
              ${qc.status === 'in-progress' ? '<button class="btn primary sm" onclick="completeQC(\'' + qc.id + '\')">Complete</button>' : qc.status === 'failed' ? '<button class="btn ghost sm" onclick="viewQCDetail(\'' + qc.id + '\')" style="color:var(--gl-warn)">Resolve hold</button>' : '<button class="btn ghost sm" onclick="viewQCDetail(\'' + qc.id + '\')">View</button>'}
            </div>
          </div>
          ${qc.status === 'failed' ? `
            <div style="padding:10px 18px 12px;background:rgba(185,28,28,0.04);border-bottom:0.5px solid var(--gl-border);font-size:12px">
              <strong style="color:var(--gl-danger);font-weight:600">Defect:</strong> ${escapeHtml(qc.defect)}<br/>
              <strong style="color:var(--gl-text);font-weight:600">Action:</strong> ${escapeHtml(qc.action)}
            </div>
          ` : ''}
        `;
      }).join('')}
    </div>

    <div class="qc-bay">
      <div class="qc-bay-head">
        <div>
          <div class="qc-bay-name">QC Bay 2 — Glazing &amp; final inspection</div>
          <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">Inspector: Lin Park · IGU seating, hardware, weatherstrip</div>
        </div>
        <div style="flex:1"></div>
      </div>
      ${inspections.filter(i => i.bayId === 'qc-bay-2').map(qc => {
        const o = getOrder(qc.orderId);
        return `
          <div class="qc-row ${qc.status}">
            <div style="font-family:var(--gl-mono);font-size:12px;font-weight:600">${o ? 'O-' + qc.orderId : '?'}</div>
            <div>
              <div style="font-size:13px;font-weight:500">${o ? o.project : '?'}</div>
              <div style="font-size:11px;color:var(--gl-text-mute);margin-top:2px">${qc.unitRange}</div>
            </div>
            <div><span style="font-size:11px;font-weight:600;color:${qc.status === 'in-progress' ? 'var(--gl-info)' : 'var(--gl-text-mute)'};text-transform:uppercase;letter-spacing:0.05em">${qc.status === 'in-progress' ? '⏳ In progress' : qc.status}</span></div>
            <div class="qc-checklist">
              ${qc.checks.map(c => `<span class="qc-check ${c.status}" title="${c.label}">${c.status === 'pass' ? '✓' : c.status === 'fail' ? '✗' : '○'}</span>`).join('')}
            </div>
            <div style="font-size:11.5px;color:var(--gl-text-mute);font-variant-numeric:tabular-nums">${fmtRelTime(qc.inspectedAt)}</div>
            <div style="display:flex;gap:5px;justify-content:flex-end">
              <button class="btn primary sm" onclick="completeQC('${qc.id}')">Complete</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div style="margin-top:14px;padding:14px 18px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute);line-height:1.55">
      <strong style="color:var(--gl-text);font-weight:600">QC checklist:</strong>
      Frame weld integrity · Squareness ±2mm · IGU seating · Hardware operation (cycle test) · Surface finish · Weatherstrip seating.
      <br/>Units must pass all checks before advancing to Ready to Ship. Failed units go on hold for rework with a typed defect category for warranty trend analysis.
    </div>
  `;
}

function completeQC(qcId) {
  const qc = state.qcInspections.find(x => x.id === qcId);
  if (!qc) return;
  qc.status = 'passed';
  qc.checks.forEach(c => { if (c.status === 'pending') c.status = 'pass'; });
  qc.inspectedAt = new Date().toISOString();
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'qc.passed',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: 'O-' + qc.orderId, meta: qc.unitRange + ' · 6/6 checks passed'
  });
  // QC inspection complete — close any review-qc tasks for this order
  autoCompleteTask('review-qc', { orderId: qc.orderId, note: 'Passed · just now' });
  toast('QC passed for O-' + qc.orderId);
  renderProduction();
}

function viewQCDetail(qcId) {
  const qc = state.qcInspections.find(x => x.id === qcId);
  toast('QC detail for ' + qcId + ' (would open full inspection modal)');
}

/* ════════════════════════════════════════════════
   FX RATES + Resellers — pricing tabs
   ════════════════════════════════════════════════ */

function renderFXTab() {
  return `
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Foreign exchange rates · ${state.fxRates.length}</div>
        <button class="btn ghost sm" onclick="refreshFXRates()">🔄 Refresh from Bank of Canada</button>
      </div>

      <div class="fx-grid">
        ${state.fxRates.map(fx => {
          const delta = ((fx.rate - fx.prev) / fx.prev) * 100;
          const dir = delta >= 0 ? 'up' : 'down';
          const sign = delta >= 0 ? '+' : '';
          return `
            <div class="fx-card">
              <div class="fx-pair">${fx.pair}</div>
              <div>
                <span class="fx-rate-val">${fx.rate.toFixed(4)}</span>
                <span class="fx-delta ${dir}">${sign}${delta.toFixed(2)}% vs prev</span>
              </div>
              <div style="font-size:11px;color:var(--gl-text-mute);margin-top:8px;padding-top:8px;border-top:0.5px solid var(--gl-border)">
                As of ${fmtRelTime(fx.asOf)} · ${fx.source}
              </div>
              <div style="display:flex;gap:6px;margin-top:8px">
                <button class="btn ghost sm" onclick="editFXRate('${fx.pair}')">Override</button>
                <button class="btn ghost sm" onclick="viewFXHistory('${fx.pair}')">History</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="panel" style="margin-top:14px">
      <div class="panel-header"><div class="panel-title">Conversion impact · YTD</div></div>
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;padding:6px 0">
        <div class="profit-card">
          <div class="profit-card-label">USD-denominated orders</div>
          <div class="profit-card-value">$48,200<span style="font-size:14px;color:var(--gl-text-mute);font-weight:500"> USD</span></div>
          <div class="profit-card-sub">${(48200 * 1.364).toLocaleString('en-CA', { maximumFractionDigits: 0 })} CAD equivalent</div>
        </div>
        <div class="profit-card">
          <div class="profit-card-label">FX gain (YTD)</div>
          <div class="profit-card-value" style="color:var(--gl-success)">+$1,420 CAD</div>
          <div class="profit-card-sub">CAD weakening 2.4% vs USD</div>
        </div>
        <div class="profit-card">
          <div class="profit-card-label">Open USD A/R</div>
          <div class="profit-card-value">$22,800 USD</div>
          <div class="profit-card-sub">FX exposure: $31,098 CAD</div>
        </div>
      </div>
    </div>

    <div style="margin-top:14px;padding:14px 18px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute);line-height:1.55">
      <strong style="color:var(--gl-text);font-weight:600">FX policy:</strong>
      Rates auto-refresh nightly from the Bank of Canada noon rate. Quotes denominated in USD lock at the FX rate as of quote-approval date. Realized FX gains/losses flow into the P&amp;L "Other income" line on order delivery. Manual override available for spot-rate negotiations.
    </div>
  `;
}

function refreshFXRates() {
  // Simulate a small market move
  state.fxRates.forEach(fx => {
    fx.prev = fx.rate;
    fx.rate = +(fx.rate * (1 + (Math.random() - 0.5) * 0.003)).toFixed(4);
    fx.asOf = new Date().toISOString();
  });
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'fx.rates_refreshed',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: 'FX rates', meta: state.fxRates.length + ' rates updated from BoC'
  });
  toast('FX rates refreshed from Bank of Canada');
  renderPricing();
}

function editFXRate(pair) { toast('Override FX for ' + pair + ' (mock)'); }
function viewFXHistory(pair) { toast('FX history chart for ' + pair + ' (mock)'); }

function renderResellersTab() {
  return `
    <div class="panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Reseller tiers</div>
          <div style="font-size:12px;color:var(--gl-text-mute);margin-top:3px">Resellers buy from a dealer, mark up to end-customer. Their cost is a % of dealer cost (not MSRP).</div>
        </div>
        <button class="btn primary sm" onclick="addResellerTier()">+ Add tier</button>
      </div>

      ${state.resellerTiers.map(t => `
        <div class="reseller-tier-card">
          <div class="reseller-tier-head">
            <div>
              <div class="reseller-tier-name">${t.name}</div>
              <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">${t.description}</div>
            </div>
            <div style="font-size:22px;font-weight:600;font-variant-numeric:tabular-nums;letter-spacing:-0.022em">${(t.dealerMarkup * 100).toFixed(0)}%<span style="font-size:12px;color:var(--gl-text-mute);font-weight:500;margin-left:6px">of dealer cost</span></div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;padding-top:10px;border-top:0.5px solid var(--gl-border)">
            <button class="btn ghost sm" onclick="editResellerTier(${t.id})">⚙ Edit</button>
            <div style="flex:1"></div>
            <div style="font-size:11.5px;color:var(--gl-text-mute)">${state.resellers.filter(r => r.tierId === t.id).length} reseller${state.resellers.filter(r => r.tierId === t.id).length === 1 ? '' : 's'} on this tier</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="panel" style="margin-top:14px">
      <div class="panel-header">
        <div class="panel-title">Active resellers · ${state.resellers.length}</div>
        <button class="btn ghost sm">View full list</button>
      </div>

      ${state.resellers.map(r => {
        const tier = state.resellerTiers.find(t => t.id === r.tierId);
        const parent = state.dealers.find(d => d.id === r.parentDealerId);
        return `
          <div style="display:grid;grid-template-columns:36px 1fr 200px 130px 120px auto;gap:12px;padding:11px 18px;border-bottom:0.5px solid var(--gl-border);align-items:center">
            <div style="width:32px;height:32px;border-radius:0;background:${r.gradient};color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">${r.avatar}</div>
            <div>
              <div style="font-size:13.5px;font-weight:500">${r.name}</div>
              <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">${r.region} · joined ${fmtDate(r.joinedAt)}</div>
            </div>
            <div style="font-size:12px"><div style="color:var(--gl-text-mute)">Parent dealer</div><div style="font-weight:500;margin-top:1px">${parent ? parent.short : '?'}</div></div>
            <div><span class="cat-status-pill published">${tier ? tier.code : '?'} tier</span></div>
            <div style="font-size:13px;font-weight:600;font-variant-numeric:tabular-nums">${fmtMoney(r.ytdVolume)}</div>
            <div><button class="btn ghost sm" onclick="toast('View reseller ' + '${r.name}' + ' (mock)')">View</button></div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function addResellerTier() { toast('Add reseller tier (mock)'); }
function editResellerTier(id) { toast('Edit reseller tier ' + id + ' (mock)'); }

/* Composite catalog renderers — combine related sub-views into single scroll page */

function renderComponentsHub() {
  // Glazing + Hardware + Colors all on one page
  return `
    <div style="display:flex;gap:10px;margin-bottom:16px;padding:10px 14px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute)">
      <span>Jump to:</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('c-glazing').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">Glazing packages (${state.glazingPackages.length})</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('c-hardware').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">Hardware (${state.hardwareLibrary.length})</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('c-colors').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">Colors &amp; finishes (${state.colorLibrary.length})</a>
    </div>

    <h2 id="c-glazing" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:18px 0 12px">Glazing packages</h2>
    ${renderGlazingLibrary()}

    <h2 id="c-hardware" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Hardware</h2>
    ${renderHardwareLibrary()}

    <h2 id="c-colors" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Colors &amp; finishes</h2>
    ${renderColorLibrary()}
  `;
}

function renderCatalogLibraryHub() {
  // Snapshots + Documents + Pricing tables
  return `
    <div style="display:flex;gap:10px;margin-bottom:16px;padding:10px 14px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute)">
      <span>Jump to:</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('l-snapshots').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">Snapshots (${state.catalogSnapshots.length})</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('l-documents').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">Documents (${state.documents.length})</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('l-pricing').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">Pricing tables (${Object.keys(state.pricingTables).length})</a>
    </div>

    <h2 id="l-snapshots" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:18px 0 12px">Snapshots &amp; rollback</h2>
    ${renderCatalogSnapshots()}

    <h2 id="l-documents" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Documents</h2>
    ${renderDocumentsLibrary()}

    <h2 id="l-pricing" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Pricing tables</h2>
    ${renderPricingTables()}
  `;
}

function renderVariantsAndRulesHub() {
  // Variants + Rules + Components (the underlying parts)
  return `
    <div style="display:flex;gap:10px;margin-bottom:16px;padding:10px 14px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute)">
      <span>Jump to:</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('v-components').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">Components (${state.catalog.components.length})</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <span style="color:var(--gl-text-faint)">Variants editor coming in product setup</span>
    </div>

    <h2 id="v-components" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:18px 0 12px">Components &amp; rules</h2>
    ${renderCatalogComponents()}
  `;
}

/* ════════════════════════════════════════════════
   v32 TRANCHE 2: Snapshots, Drawings, Libraries, Promos, RMA
   ════════════════════════════════════════════════ */

function renderCatalogSnapshots() {
  const snaps = state.catalogSnapshots;
  return `
    <div class="panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Catalog snapshots · ${snaps.length}</div>
          <div style="font-size:12px;color:var(--gl-text-mute);margin-top:3px">Every catalog change writes an immutable snapshot. Roll back to any prior version (current dealer quotes remain on the version they were created with).</div>
        </div>
        <button class="btn primary sm" onclick="createSnapshot()">📸 Create snapshot</button>
      </div>

      ${snaps.map(s => `
        <div class="snapshot-row ${s.isCurrent ? 'current' : ''}">
          <div class="snapshot-version">${s.version}${s.isCurrent ? '<div style="font-size:9.5px;color:var(--gl-success);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-top:2px">● Current</div>' : ''}</div>
          <div>
            <div style="font-size:13.5px;font-weight:500">${escapeHtml(s.label)}</div>
            <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">${escapeHtml(s.author)} · ${fmtDate(s.createdAt.slice(0, 10))}</div>
          </div>
          <div class="snapshot-changes">
            ${s.changes.added > 0 ? `<span class="snapshot-change-pill added">+${s.changes.added} added</span>` : ''}
            ${s.changes.removed > 0 ? `<span class="snapshot-change-pill removed">−${s.changes.removed} removed</span>` : ''}
            ${s.changes.priceChanges > 0 ? `<span class="snapshot-change-pill priced">${s.changes.priceChanges} priced</span>` : ''}
          </div>
          <div style="font-size:11.5px;color:var(--gl-text-mute);font-variant-numeric:tabular-nums">${fmtRelTime(s.createdAt)}</div>
          <div style="display:flex;gap:6px">
            <button class="btn ghost sm" onclick="viewSnapshotDiff('${s.id}')">📋 View diff</button>
            ${!s.isCurrent ? `<button class="btn ghost sm" onclick="rollbackSnapshot('${s.id}')" style="color:var(--gl-warn)">↺ Roll back</button>` : '<button class="btn ghost sm" disabled style="opacity:0.4">Current</button>'}
          </div>
        </div>
      `).join('')}
    </div>

    <div style="margin-top:14px;padding:14px 18px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute);line-height:1.55">
      <strong style="color:var(--gl-text);font-weight:600">How snapshots work:</strong>
      Every meaningful catalog edit (price change &gt;5%, product added/removed, status change) auto-creates a snapshot. You can also manually snapshot before bulk operations. Rollback restores the catalog to that version's state but doesn't affect already-submitted quotes — they're locked to the version they were quoted on.
    </div>
  `;
}

function createSnapshot() {
  const label = prompt('Snapshot label (e.g., "Pre-summer freeze"):');
  if (!label) return;
  state.snapshotVersion++;
  state.catalogSnapshots.forEach(s => s.isCurrent = false);
  state.catalogSnapshots.unshift({
    id: state.snapshotVersion, version: 'v' + state.snapshotVersion, label,
    createdAt: new Date().toISOString(), author: state.user.name,
    changes: { added: 0, removed: 0, priceChanges: 0 }, isCurrent: true
  });
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'catalog.snapshot_created',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: 'v' + state.snapshotVersion, meta: label
  });
  toast('Snapshot v' + state.snapshotVersion + ' created');
  renderCatalog();
}

function viewSnapshotDiff(id) { toast('Snapshot diff viewer (mock) — v' + id + ' → current'); }
function rollbackSnapshot(id) {
  const s = state.catalogSnapshots.find(x => x.id === id);
  if (!s) return;
  if (!confirm('Roll back catalog to ' + s.version + ' "' + s.label + '"?\n\nThis creates a new snapshot reflecting the rollback. Active quotes are unaffected.')) return;
  state.catalogSnapshots.forEach(x => x.isCurrent = false);
  state.snapshotVersion++;
  state.catalogSnapshots.unshift({
    id: state.snapshotVersion, version: 'v' + state.snapshotVersion, label: 'Rollback to ' + s.version,
    createdAt: new Date().toISOString(), author: state.user.name,
    changes: { added: 0, removed: 0, priceChanges: 0 }, isCurrent: true
  });
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'catalog.rolled_back',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: s.version, meta: 'Rolled back from current → ' + s.version
  });
  toast('Rolled back to ' + s.version + ' as new snapshot v' + state.snapshotVersion);
  renderCatalog();
}

/* ── Glazing package library ── */

function renderGlazingLibrary() {
  const pkgs = state.glazingPackages;
  return `
    <div class="panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Glazing packages · ${pkgs.length}</div>
          <div style="font-size:12px;color:var(--gl-text-mute);margin-top:3px">IGU combinations: glass × Low-E coating × spacer × gas fill. Each package has its own performance values and cost/MSRP.</div>
        </div>
        <button class="btn primary sm" onclick="toast('Add glazing package (mock)')">+ Add package</button>
      </div>

      <div class="lib-row head">
        <div></div>
        <div>PACKAGE NAME</div>
        <div>CONFIGURATION</div>
        <div style="text-align:right">U/SHGC/VT</div>
        <div style="text-align:right">COST/m²</div>
        <div style="text-align:right">MSRP/m²</div>
        <div style="text-align:right">PRODUCTS</div>
        <div></div>
      </div>

      ${pkgs.map(p => `
        <div class="lib-row ${!p.enabled ? 'disabled' : ''}">
          <div class="lib-thumb" style="background:linear-gradient(135deg, #0E7490 0%, #06B6D4 100%)">G</div>
          <div>
            <div class="lib-name">${escapeHtml(p.name)}</div>
            <div class="lib-detail">${escapeHtml(p.spacer)} · ${p.gas} fill</div>
          </div>
          <div style="font-family:var(--gl-mono);font-size:11px;color:var(--gl-text-mute)">${escapeHtml(p.glassConfig)}</div>
          <div style="text-align:right;font-size:11.5px;font-variant-numeric:tabular-nums">
            <div style="font-weight:600;color:var(--gl-text)">${p.uFactor.toFixed(2)}/${p.shgc.toFixed(2)}/${p.vt.toFixed(2)}</div>
          </div>
          <div class="lib-num">${fmtMoneyFull(p.costPerM2)}</div>
          <div class="lib-num">${fmtMoneyFull(p.msrpPerM2)}</div>
          <div style="text-align:right;font-size:12px;color:var(--gl-text-mute)">${p.productsUsing}</div>
          <div style="display:flex;gap:5px;justify-content:flex-end">
            <button class="btn ghost sm" onclick="toast('Edit glazing ' + '${p.name}' + ' (mock)')">⚙</button>
            <button class="btn ghost sm" onclick="toast('${p.enabled ? 'Disabled' : 'Enabled'} ' + '${p.name}')">${p.enabled ? '⏸' : '▶'}</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ── Hardware library ── */

function renderHardwareLibrary() {
  const hw = state.hardwareLibrary;
  const byKind = {};
  hw.forEach(h => { if (!byKind[h.kind]) byKind[h.kind] = []; byKind[h.kind].push(h); });
  const kindLabels = { 'lock': 'Locks', 'hinge': 'Hinges', 'operator': 'Operators (cranks)', 'balance': 'Balances', 'handle': 'Handles & pulls' };

  return Object.keys(byKind).map(kind => `
    <div class="panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">${kindLabels[kind] || kind} · ${byKind[kind].length}</div>
        </div>
        <button class="btn ghost sm" onclick="toast('Add ' + '${kind}' + ' (mock)')">+ Add</button>
      </div>
      <div class="lib-row head">
        <div></div><div>NAME</div><div>VENDOR</div>
        <div style="text-align:right">COST</div>
        <div style="text-align:right">MSRP</div>
        <div style="text-align:right">MARGIN</div>
        <div style="text-align:right">USING</div>
        <div></div>
      </div>
      ${byKind[kind].map(h => {
        const margin = h.msrp > 0 ? ((h.msrp - h.cost) / h.msrp) * 100 : 0;
        return `
          <div class="lib-row ${!h.enabled ? 'disabled' : ''}">
            <div class="lib-thumb" style="background:linear-gradient(135deg, #92400E 0%, #D97706 100%);font-size:12px">${kind[0].toUpperCase()}</div>
            <div>
              <div class="lib-name">${escapeHtml(h.name)}</div>
              <div class="lib-detail">${h.kind}</div>
            </div>
            <div style="font-size:12px">${escapeHtml(h.vendor)}</div>
            <div class="lib-num">${fmtMoneyFull(h.cost)}</div>
            <div class="lib-num">${fmtMoneyFull(h.msrp)}</div>
            <div class="lib-num" style="color:${margin >= 55 ? 'var(--gl-success)' : 'var(--gl-text)'}">${margin.toFixed(0)}%</div>
            <div style="text-align:right;font-size:12px;color:var(--gl-text-mute)">${h.productsUsing}</div>
            <div style="display:flex;gap:5px;justify-content:flex-end">
              <button class="btn ghost sm">⚙</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <div style="height:14px"></div>
  `).join('');
}

/* ── Color/finish library ── */

function renderColorLibrary() {
  const colors = state.colorLibrary;
  return `
    <div class="panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Colors &amp; finishes · ${colors.length}</div>
          <div style="font-size:12px;color:var(--gl-text-mute);margin-top:3px">Color/finish options offered across the catalog. Cost adders are per-unit upcharges; lead-time adds to base lead time.</div>
        </div>
        <button class="btn primary sm" onclick="toast('Add color (mock)')">+ Add color</button>
      </div>

      <div class="lib-row head" style="grid-template-columns: 50px 1fr 110px 90px 90px 90px 100px auto">
        <div></div><div>COLOR / FINISH</div><div>TYPE</div>
        <div style="text-align:right">COST ADDER</div>
        <div style="text-align:right">MSRP ADDER</div>
        <div style="text-align:right">LEAD +</div>
        <div style="text-align:right">PRODUCTS</div>
        <div></div>
      </div>

      ${colors.map(c => `
        <div class="lib-row ${!c.enabled ? 'disabled' : ''}" style="grid-template-columns: 50px 1fr 110px 90px 90px 90px 100px auto">
          <div class="color-swatch" style="background:${c.hex}"></div>
          <div>
            <div class="lib-name">${escapeHtml(c.name)}</div>
            <div class="lib-detail">${c.hex.toUpperCase()}</div>
          </div>
          <div style="font-size:11.5px;font-weight:500"><span class="cat-status-pill ${c.kind === 'painted' ? 'published' : c.kind === 'laminate' ? 'draft' : 'disabled'}">${c.kind}</span></div>
          <div class="lib-num">${c.costAdder > 0 ? '+' + fmtMoneyFull(c.costAdder) : '—'}</div>
          <div class="lib-num">${c.msrpAdder > 0 ? '+' + fmtMoneyFull(c.msrpAdder) : 'standard'}</div>
          <div class="lib-num" style="color:${c.leadDays > 7 ? 'var(--gl-warn)' : 'var(--gl-text-mute)'}">${c.leadDays > 0 ? '+' + c.leadDays + 'd' : '—'}</div>
          <div style="text-align:right;font-size:12px;color:var(--gl-text-mute)">${c.productsUsing}</div>
          <div style="display:flex;gap:5px;justify-content:flex-end">
            <button class="btn ghost sm">⚙</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ── Promotions tab ── */

function renderPromotionsTab() {
  const promos = state.promotions;
  const active = promos.filter(p => p.status === 'active');
  const ended = promos.filter(p => p.status === 'ended');

  return `
    <div class="panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Active promotions · ${active.length}</div>
        </div>
        <button class="btn primary sm" onclick="toast('New promotion wizard (mock)')">+ New promotion</button>
      </div>

      ${active.map(p => `
        <div class="promo-card">
          <div class="promo-icon">${p.kind === 'discount' ? '%' : '$'}</div>
          <div>
            <div class="promo-name">${escapeHtml(p.name)}</div>
            <div class="promo-applies">${escapeHtml(p.appliesTo)} · ${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}</div>
          </div>
          <div><span class="promo-status active">● Active</span></div>
          <div style="text-align:right">
            <div class="promo-stat-label">Redemptions</div>
            <div class="promo-stat-value">${p.redemptions}</div>
          </div>
          <div style="text-align:right">
            <div class="promo-stat-label">Customer savings</div>
            <div class="promo-stat-value">${fmtMoney(p.savings)}</div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn ghost sm">⚙ Edit</button>
            <button class="btn ghost sm" style="color:var(--gl-danger)" onclick="if(confirm('End promotion ' + '${p.name}' + '?')) toast('Promotion ended')">End</button>
          </div>
        </div>
      `).join('')}
    </div>

    ${ended.length > 0 ? `
      <div class="panel" style="margin-top:14px">
        <div class="panel-header"><div class="panel-title">Past promotions · ${ended.length}</div></div>
        ${ended.map(p => `
          <div class="promo-card" style="opacity:0.65">
            <div class="promo-icon">${p.kind === 'discount' ? '%' : '$'}</div>
            <div>
              <div class="promo-name">${escapeHtml(p.name)}</div>
              <div class="promo-applies">${escapeHtml(p.appliesTo)} · ended ${fmtDate(p.endDate)}</div>
            </div>
            <div><span class="promo-status ended">○ Ended</span></div>
            <div style="text-align:right">
              <div class="promo-stat-label">Total used</div>
              <div class="promo-stat-value">${p.redemptions}</div>
            </div>
            <div style="text-align:right">
              <div class="promo-stat-label">Cost</div>
              <div class="promo-stat-value">${fmtMoney(p.savings)}</div>
            </div>
            <div>
              <button class="btn ghost sm" onclick="toast('Re-run ' + '${p.name}')">↻ Re-run</button>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

/* ── Returns / RMA tab ── */

function renderRMATab() {
  const rmas = state.rmas;
  return `
    <div class="qc-summary" style="margin-bottom:14px">
      <div class="profit-card">
        <div class="profit-card-label">Pending</div>
        <div class="profit-card-value">${rmas.filter(r => r.status === 'pending').length}</div>
        <div class="profit-card-sub">awaiting review</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">In review</div>
        <div class="profit-card-value">${rmas.filter(r => r.status === 'in-review').length}</div>
        <div class="profit-card-sub">investigating</div>
      </div>
      <div class="profit-card highlight">
        <div class="profit-card-label">Approved (30d)</div>
        <div class="profit-card-value">${rmas.filter(r => r.status === 'approved').length}</div>
        <div class="profit-card-sub">credits issued</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">Credit issued (30d)</div>
        <div class="profit-card-value">${fmtMoney(rmas.filter(r => r.status === 'approved').reduce((s, r) => s + r.creditAmount, 0))}</div>
        <div class="profit-card-sub">return value</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">RMA queue · ${rmas.length}</div>
        <button class="btn primary sm" onclick="toast('New RMA — pre-delivery return (mock)')">+ New RMA</button>
      </div>

      ${rmas.map(r => {
        const dealer = getDealer(r.dealerId);
        const order = getOrder(r.orderId);
        return `
          <div class="rma-row">
            <div class="rma-icon ${r.kind}">${r.kind === 'wrong-color' ? '🎨' : r.kind === 'damaged-in-transit' ? '📦' : r.kind === 'customer-rejected' ? '🚫' : '⚠'}</div>
            <div>
              <div style="font-size:13.5px;font-weight:500">${order ? order.po + ' · ' + order.project : 'Unknown'}</div>
              <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">${dealer ? dealer.short : ''} · ${r.units} unit${r.units === 1 ? '' : 's'} · ${escapeHtml(r.reason)}</div>
            </div>
            <div style="font-size:11px"><span class="cat-status-pill ${r.kind === 'wrong-color' ? 'draft' : r.kind === 'damaged-in-transit' ? 'disabled' : 'draft'}">${r.kind.replace('-', ' ')}</span></div>
            <div><span class="pending-status ${r.status === 'approved' ? 'accepted' : r.status === 'in-review' ? 'awaiting' : 'awaiting'}">${r.status === 'approved' ? '✓ Approved' : r.status === 'in-review' ? '⏳ Reviewing' : '○ Pending'}</span></div>
            <div style="text-align:right">
              <div style="font-size:14px;font-weight:600;font-variant-numeric:tabular-nums">${fmtMoney(r.creditAmount)}</div>
              <div style="font-size:11px;color:var(--gl-text-mute)">${r.restockingFee > 0 ? '−' + fmtMoney(r.restockingFee) + ' fee' : 'no fee'}</div>
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn ghost sm">View</button>
              ${r.status !== 'approved' ? '<button class="btn primary sm" onclick="approveRMA(\'' + r.id + '\')">Approve</button>' : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div style="margin-top:14px;padding:14px 18px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute);line-height:1.55">
      <strong style="color:var(--gl-text);font-weight:600">RMA vs Warranty:</strong>
      RMAs cover pre-delivery returns: wrong color ordered, customer rejected at delivery, damaged in transit. Warranty covers defects discovered during the warranty period (typically 1–10 years). RMAs result in credit notes; warranties may result in remakes, refits, or credit.
    </div>
  `;
}

function approveRMA(id) {
  const r = state.rmas.find(x => x.id === id);
  if (!r) return;
  r.status = 'approved';
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'rma.approved',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: 'RMA ' + r.id, meta: r.kind + ' · ' + fmtMoney(r.creditAmount) + ' credit'
  });
  toast('RMA approved · ' + fmtMoney(r.creditAmount) + ' credit issued');
  renderFinancials();
}

/* ════════════════════════════════════════════════
   v32 TRANCHE 3: Documents, Capacity, Damage, Photos, Analytics, COI, etc
   ════════════════════════════════════════════════ */

function renderDocumentsLibrary() {
  const docs = state.documents;
  const byCategory = {};
  docs.forEach(d => { if (!byCategory[d.category]) byCategory[d.category] = []; byCategory[d.category].push(d); });
  const catLabels = {
    'product-docs': 'Product spec sheets', 'install-guides': 'Install guides',
    'certifications': 'Certifications & test reports', 'marketing': 'Marketing collateral', 'forms': 'Forms'
  };

  return `
    <div class="panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Documents library · ${docs.length}</div>
          <div style="font-size:12px;color:var(--gl-text-mute);margin-top:3px">Spec sheets, install guides, NFRC/CSA certificates, marketing collateral. Shared with dealers; can be branded per-dealer if their tier allows.</div>
        </div>
        <button class="btn primary sm" onclick="toast('Upload document (mock)')">↑ Upload</button>
      </div>

      ${Object.keys(byCategory).map(cat => `
        <div style="padding:10px 18px;background:rgba(248,250,252,0.5);border-bottom:0.5px solid var(--gl-border);font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--gl-text-mute)">${catLabels[cat] || cat} · ${byCategory[cat].length}</div>
        ${byCategory[cat].map(d => `
          <div class="doc-row">
            <div class="doc-icon ${d.kind}">${d.kind === 'spec-sheet' ? 'SPEC' : d.kind === 'install-guide' ? 'INST' : d.kind === 'nfrc-cert' ? 'NFRC' : d.kind === 'marketing' ? 'PROMO' : 'FORM'}</div>
            <div>
              <div style="font-size:13.5px;font-weight:500">${escapeHtml(d.name)}</div>
              <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">${d.tags.map(t => '<span class="doc-tag">' + escapeHtml(t) + '</span>').join('')}</div>
            </div>
            <div style="font-size:11.5px;color:var(--gl-text-mute)">${escapeHtml(d.uploadedBy)} · ${fmtRelTime(d.uploadedAt)}</div>
            <div style="font-size:11.5px;color:var(--gl-text-mute);font-variant-numeric:tabular-nums">${d.size}</div>
            <div style="font-size:11px">${d.expiresAt ? `<span class="${new Date(d.expiresAt) < new Date(Date.now() + 90 * 86400000) ? 'expiry-warn' : 'expiry-ok'}">Exp ${fmtDate(d.expiresAt)}</span>` : '<span style="color:var(--gl-text-faint)">No expiry</span>'}</div>
            <div style="display:flex;gap:5px">
              <button class="btn ghost sm">↓</button>
              <button class="btn ghost sm">⚙</button>
            </div>
          </div>
        `).join('')}
      `).join('')}
    </div>
  `;
}

function renderCapacityPlanner() {
  const cap = state.capacity;
  return `
    <div class="panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">6-week capacity planner</div>
          <div style="font-size:12px;color:var(--gl-text-mute);margin-top:3px">Weekly capacity: <strong style="color:var(--gl-text)">${cap.weeklyUnits} units</strong> · adjust per-shift overtime to lift it temporarily.</div>
        </div>
        <button class="btn ghost sm" onclick="toast('Adjust capacity (mock)')">⚙ Adjust capacity</button>
      </div>

      <div class="capacity-grid">
        ${cap.weeks.map(w => {
          const pct = (w.booked / w.capacity) * 100;
          return `
            <div class="capacity-week">
              <div class="capacity-week-label">${w.label}</div>
              <div class="capacity-week-units">${w.booked}<span class="total"> / ${w.capacity}</span></div>
              <div class="capacity-bar">
                <div class="capacity-bar-fill ${w.status}" style="width:${pct}%"></div>
              </div>
              <div class="capacity-status ${w.status}">${w.status === 'full' ? '⚠ Full' : w.status === 'near-full' ? '◐ ' + (w.capacity - w.booked) + ' avail' : '✓ ' + (w.capacity - w.booked) + ' avail'}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="panel" style="margin-top:14px">
      <div class="panel-header"><div class="panel-title">Bottleneck analysis</div></div>
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;padding:8px 0">
        <div class="profit-card">
          <div class="profit-card-label">Welding capacity</div>
          <div class="profit-card-value">82%</div>
          <div class="profit-card-sub">2 Rotox welders · 28 hr/week each</div>
        </div>
        <div class="profit-card">
          <div class="profit-card-label">IGU line capacity</div>
          <div class="profit-card-value" style="color:var(--gl-warn)">94%</div>
          <div class="profit-card-sub">Cardinal line bottleneck</div>
        </div>
        <div class="profit-card">
          <div class="profit-card-label">CNC machining capacity</div>
          <div class="profit-card-value">68%</div>
          <div class="profit-card-sub">Elumatec + Haffner</div>
        </div>
      </div>
    </div>
  `;
}

function renderDamageScrap() {
  const events = state.damageEvents;
  const totalLost = events.reduce((s, e) => s + e.costImpact, 0);
  const byCategory = {};
  events.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.costImpact; });

  return `
    <div class="qc-summary">
      <div class="profit-card">
        <div class="profit-card-label">Damage events (30d)</div>
        <div class="profit-card-value">${events.length}</div>
        <div class="profit-card-sub">${events.reduce((s, e) => s + e.unitsScrapped, 0)} units scrapped</div>
      </div>
      <div class="profit-card" style="border-color:rgba(185,28,28,0.20)">
        <div class="profit-card-label">Cost impact (30d)</div>
        <div class="profit-card-value" style="color:var(--gl-danger)">${fmtMoney(totalLost)}</div>
        <div class="profit-card-sub">${(totalLost / 226590 * 100).toFixed(2)}% of revenue</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">Top cause</div>
        <div class="profit-card-value" style="font-size:18px">${Object.keys(byCategory).sort((a,b) => byCategory[b] - byCategory[a])[0] || '—'}</div>
        <div class="profit-card-sub">most cost impact</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">Industry benchmark</div>
        <div class="profit-card-value">2–5%</div>
        <div class="profit-card-sub">typical scrap rate</div>
      </div>
    </div>

    <div class="panel" style="margin-top:14px">
      <div class="panel-header">
        <div class="panel-title">Damage events · ${events.length}</div>
        <button class="btn primary sm" onclick="toast('Log damage event (mock)')">+ Log event</button>
      </div>

      <div class="damage-row" style="background:rgba(248,250,252,0.5);font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--gl-text-mute)">
        <div>DATE</div><div>EVENT</div><div>STATION</div><div style="text-align:right">UNITS</div><div style="text-align:right">COST</div>
      </div>

      ${events.map(e => {
        const order = getOrder(e.orderId);
        return `
          <div class="damage-row">
            <div style="font-family:var(--gl-mono);font-size:11.5px;font-variant-numeric:tabular-nums">${fmtDate(e.date.slice(0, 10))}</div>
            <div>
              <div style="font-size:13px;font-weight:500">${escapeHtml(e.cause)}</div>
              <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">${order ? order.po + ' · ' + order.project : 'Unassigned'} · <span class="damage-category ${e.category}">${e.category}</span></div>
            </div>
            <div style="font-size:12px">${escapeHtml(e.station)}</div>
            <div style="text-align:right;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums">${e.unitsScrapped}</div>
            <div style="text-align:right;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--gl-danger)">${fmtMoney(e.costImpact)}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderLeadTimeAnalytics() {
  const history = state.leadTimeHistory;
  const latest = history[history.length - 1];

  return `
    <div class="qc-summary">
      <div class="profit-card highlight">
        <div class="profit-card-label">Avg lead time (April)</div>
        <div class="profit-card-value">${latest.avgDays}<span style="font-size:14px;color:var(--gl-text-mute);font-weight:500"> days</span></div>
        <div class="profit-card-sub" style="color:${latest.avgDays <= latest.target ? 'var(--gl-success)' : 'var(--gl-warn)'}">${latest.avgDays <= latest.target ? '✓ within target' : '⚠ over target by ' + (latest.avgDays - latest.target) + 'd'}</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">P50 (median)</div>
        <div class="profit-card-value">${latest.p50}d</div>
        <div class="profit-card-sub">half of orders ship by this</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">P90 (long tail)</div>
        <div class="profit-card-value">${latest.p90}d</div>
        <div class="profit-card-sub">worst 10%</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">Target</div>
        <div class="profit-card-value">${latest.target}d</div>
        <div class="profit-card-sub">company SLA</div>
      </div>
    </div>

    <div class="panel" style="margin-top:14px">
      <div class="panel-header"><div class="panel-title">6-month trend</div></div>
      <div style="padding:18px 4px">
        <svg viewBox="0 0 600 240" style="width:100%;height:240px">
          ${(() => {
            const max = 50;
            const points = history.map((h, i) => ({
              x: 40 + (i * 90),
              y: 200 - (h.avgDays / max) * 160
            }));
            const pathAvg = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
            const pointsP90 = history.map((h, i) => ({
              x: 40 + (i * 90),
              y: 200 - (h.p90 / max) * 160
            }));
            const pathP90 = pointsP90.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');

            return `
              ${[10, 20, 30, 40, 50].map(v => {
                const y = 200 - (v / max) * 160;
                return `<line x1="40" y1="${y}" x2="580" y2="${y}" stroke="currentColor" stroke-width="0.3" opacity="0.15" />
                        <text x="32" y="${y + 4}" text-anchor="end" font-size="10" fill="currentColor" opacity="0.5">${v}d</text>`;
              }).join('')}
              <line x1="40" y1="${200 - (latest.target / max) * 160}" x2="580" y2="${200 - (latest.target / max) * 160}" stroke="#047857" stroke-width="1" stroke-dasharray="4 4" />
              <text x="585" y="${200 - (latest.target / max) * 160 + 4}" font-size="10" fill="#047857" font-weight="600">target ${latest.target}d</text>
              <path d="${pathP90}" fill="none" stroke="#B45309" stroke-width="1.5" stroke-dasharray="3 3" />
              <path d="${pathAvg}" fill="none" stroke="#2e5bc8" stroke-width="2" />
              ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#2e5bc8" />`).join('')}
              ${history.map((h, i) => `<text x="${40 + (i * 90)}" y="225" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.6">${h.month.slice(5)}</text>`).join('')}
              <text x="${40 + 5 * 90}" y="${200 - (history[5].avgDays / max) * 160 - 12}" text-anchor="end" font-size="11" font-weight="600" fill="#2e5bc8">avg ${latest.avgDays}d</text>
            `;
          })()}
        </svg>
      </div>

      <div style="display:flex;gap:14px;padding:10px 16px;border-top:0.5px solid var(--gl-border);font-size:11.5px;color:var(--gl-text-mute)">
        <span><svg width="14" height="3" style="vertical-align:middle"><line x1="0" y1="1.5" x2="14" y2="1.5" stroke="#2e5bc8" stroke-width="2" /></svg> Average</span>
        <span><svg width="14" height="3" style="vertical-align:middle"><line x1="0" y1="1.5" x2="14" y2="1.5" stroke="#B45309" stroke-width="1.5" stroke-dasharray="3 3" /></svg> P90 (long tail)</span>
        <span><svg width="14" height="3" style="vertical-align:middle"><line x1="0" y1="1.5" x2="14" y2="1.5" stroke="#047857" stroke-width="1" stroke-dasharray="4 4" /></svg> Target</span>
      </div>
    </div>
  `;
}

function renderColorMix() {
  const colors = state.colorMix;
  const totalUnits = colors.reduce((s, c) => s + c.units, 0);
  return `
    <div class="panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Color &amp; finish sales mix · YTD</div>
          <div style="font-size:12px;color:var(--gl-text-mute);margin-top:3px">Total: <strong style="color:var(--gl-text)">${totalUnits} units</strong> across ${colors.length} colors</div>
        </div>
      </div>

      <div style="padding:8px 0">
        ${colors.map(c => `
          <div style="display:grid;grid-template-columns:40px 1fr 60px 80px 200px;gap:12px;align-items:center;padding:11px 18px;border-bottom:0.5px solid var(--gl-border)">
            <div class="color-swatch" style="background:${c.hex};width:30px;height:30px;border-radius:0"></div>
            <div>
              <div style="font-size:13px;font-weight:500">${escapeHtml(c.color)}</div>
              <div style="font-size:11px;color:var(--gl-text-mute);margin-top:2px">${c.hex.toUpperCase()}</div>
            </div>
            <div style="font-family:var(--gl-mono);font-size:13px;font-weight:600;font-variant-numeric:tabular-nums">${c.units}</div>
            <div style="font-family:var(--gl-mono);font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--gl-text-mute)">${(c.pct * 100).toFixed(1)}%</div>
            <div style="height:8px;background:rgba(15,23,42,0.05);border-radius:0;overflow:hidden">
              <div style="height:100%;background:${c.hex === '#FFFFFF' ? '#94A3B8' : c.hex};width:${(c.pct * 100).toFixed(1)}%;border-radius:0"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderCOIPanel() {
  const cois = state.coiRecords;
  const now = new Date();
  return `
    <div class="panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Certificates of Insurance · ${cois.length}</div>
          <div style="font-size:12px;color:var(--gl-text-mute);margin-top:3px">Per dealer · $2M GL + $5M product liability typical · auto-renew check 30 days before expiry</div>
        </div>
        <button class="btn ghost sm" onclick="toast('COI compliance report (mock)')">↑ Compliance report</button>
      </div>

      <div class="coi-row" style="background:rgba(248,250,252,0.5);font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--gl-text-mute)">
        <div></div><div>DEALER · INSURER</div><div style="text-align:right">GL / PRODUCT LIAB</div><div>EXPIRES</div><div>NAMED INSURED</div><div></div>
      </div>

      ${cois.map(c => {
        const dealer = state.dealers.find(d => d.id === c.dealerId);
        const daysToExpiry = Math.floor((new Date(c.expiresAt) - now) / 86400000);
        const expClass = daysToExpiry < 30 ? 'expiry-danger' : daysToExpiry < 90 ? 'expiry-warn' : 'expiry-ok';
        return `
          <div class="coi-row">
            <div style="width:32px;height:32px;border-radius:0;background:${dealer ? dealer.gradient : '#94A3B8'};color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">${dealer ? dealer.avatar : '?'}</div>
            <div>
              <div style="font-size:13.5px;font-weight:500">${dealer ? dealer.name : '?'}</div>
              <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">${escapeHtml(c.insurer)} · ${c.fileSize} · uploaded ${fmtRelTime(c.uploadedAt)}</div>
            </div>
            <div style="text-align:right;font-family:var(--gl-mono);font-size:12px;font-variant-numeric:tabular-nums">$${(c.glAmount/1000000).toFixed(0)}M / $${(c.productLiabAmount/1000000).toFixed(0)}M</div>
            <div class="${expClass}" style="font-size:12px">${fmtDate(c.expiresAt)}<br/><span style="font-size:10.5px;font-weight:500">${daysToExpiry < 0 ? 'EXPIRED' : daysToExpiry + 'd left'}</span></div>
            <div>${c.namedInsured ? '<span class="cat-status-pill published">✓ Listed</span>' : '<span class="cat-status-pill draft">⚠ Not named</span>'}</div>
            <div style="display:flex;gap:5px">
              <button class="btn ghost sm">↓ PDF</button>
              <button class="btn ghost sm">⚙</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderDealerAgreementsPanel() {
  return `
    <div class="panel" style="margin-top:14px">
      <div class="panel-header">
        <div class="panel-title">Dealer agreements (DocuSign) · ${state.dealerAgreements.length}</div>
        <button class="btn ghost sm" onclick="toast('Sync DocuSign envelopes (mock)')">↻ Sync envelopes</button>
      </div>

      ${state.dealerAgreements.map(a => {
        const dealer = state.dealers.find(d => d.id === a.dealerId);
        const daysToExpiry = Math.floor((new Date(a.expiresAt) - new Date()) / 86400000);
        return `
          <div class="coi-row">
            <div style="width:32px;height:32px;border-radius:0;background:${dealer ? dealer.gradient : '#94A3B8'};color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">${dealer ? dealer.avatar : '?'}</div>
            <div>
              <div style="font-size:13.5px;font-weight:500">${dealer ? dealer.name : '?'}</div>
              <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">Envelope ${escapeHtml(a.envelope)} · agreement ${a.version} · signer ${escapeHtml(a.signerEmail)}</div>
            </div>
            <div style="font-family:var(--gl-mono);font-size:11.5px">Signed ${fmtDate(a.signedAt.slice(0,10))}</div>
            <div class="${daysToExpiry < 90 ? 'expiry-warn' : 'expiry-ok'}" style="font-size:12px">${fmtDate(a.expiresAt)}<br/><span style="font-size:10.5px;font-weight:500">${daysToExpiry}d left</span></div>
            <div><span class="cat-status-pill published">✓ Signed</span></div>
            <div style="display:flex;gap:5px">
              <button class="btn ghost sm">↓</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderInstallerCerts() {
  return `
    <div class="panel" style="margin-top:14px">
      <div class="panel-header">
        <div class="panel-title">Installer certifications · ${state.installerCerts.length}</div>
        <button class="btn ghost sm" onclick="toast('Schedule training session (mock)')">📅 Schedule training</button>
      </div>

      ${state.installerCerts.map(c => {
        const dealer = state.dealers.find(d => d.id === c.dealerId);
        const daysToExpiry = Math.floor((new Date(c.expiresAt) - new Date()) / 86400000);
        const isExpiring = daysToExpiry < 180;
        return `
          <div class="coi-row">
            <div style="width:32px;height:32px;border-radius:0;background:${dealer ? dealer.gradient : '#94A3B8'};color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">${c.installerName.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
            <div>
              <div style="font-size:13.5px;font-weight:500">${escapeHtml(c.installerName)}</div>
              <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">${dealer ? dealer.short : '?'} · ${escapeHtml(c.certLevel)}</div>
            </div>
            <div style="font-family:var(--gl-mono);font-size:11.5px">Certified ${fmtDate(c.certifiedAt)}</div>
            <div class="${isExpiring ? 'expiry-warn' : 'expiry-ok'}" style="font-size:12px">${fmtDate(c.expiresAt)}<br/><span style="font-size:10.5px;font-weight:500">${daysToExpiry}d left</span></div>
            <div><span class="cat-status-pill ${c.status === 'expiring' ? 'draft' : 'published'}">${c.status === 'expiring' ? '⚠ Expiring soon' : '✓ Active'}</span></div>
            <div style="display:flex;gap:5px">
              <button class="btn ghost sm" onclick="${isExpiring ? "toast('Renewal scheduled')" : "toast('View cert details')"}">${isExpiring ? '↻ Renew' : 'View'}</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* ── Photo log per order ── */

function renderOrderPhotoLog(o) {
  const photos = state.photoLogs[o.id] || [];
  if (photos.length === 0 && !['shipped', 'delivered'].includes(o.status)) return '';

  return `
    <div class="section-label" style="display:flex;align-items:center;justify-content:space-between">
      <span>📷 Photo log · ${photos.length}</span>
      <button class="btn ghost sm" onclick="toast('Upload photo (mock)')">+ Upload</button>
    </div>
    ${photos.length > 0 ? `
      <div class="photo-grid">
        ${photos.map(p => `
          <div class="photo-tile ${p.kind}" onclick="toast('View photo ' + '${p.id}' + ' (mock)')">
            <div class="photo-thumb">${p.kind === 'pre-shipment-qc' ? '✓' : p.kind === 'dock-loading' ? '🚚' : '🏁'}</div>
            <div class="photo-meta">
              <div class="photo-caption">${escapeHtml(p.caption)}</div>
              <div class="photo-date">${escapeHtml(p.uploadedBy)} · ${fmtRelTime(p.uploadedAt)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '<div style="padding:30px;text-align:center;color:var(--gl-text-faint);font-size:12.5px">No photos yet — upload pre-shipment QC, dock loading, or delivery photos for warranty defense.</div>'}
  `;
}

/* ── Damage/scrap inline on order ── */

function renderOrderDamageInline(o) {
  const events = state.damageEvents.filter(e => e.orderId === o.id);
  if (events.length === 0) return '';
  const totalCost = events.reduce((s, e) => s + e.costImpact, 0);
  return `
    <div class="section-label">⚠ Damage events · ${events.length}</div>
    ${events.map(e => `
      <div style="padding:10px 14px;background:rgba(185,28,28,0.04);border:0.5px solid rgba(185,28,28,0.20);border-radius:0;margin-bottom:6px;display:flex;gap:12px;align-items:center">
        <span class="damage-category ${e.category}">${e.category}</span>
        <div style="flex:1;font-size:12.5px"><strong>${escapeHtml(e.cause)}</strong> at ${escapeHtml(e.station)} · ${e.unitsScrapped} unit${e.unitsScrapped === 1 ? '' : 's'} scrapped</div>
        <div style="font-size:13px;font-weight:600;color:var(--gl-danger);font-variant-numeric:tabular-nums">${fmtMoney(e.costImpact)}</div>
      </div>
    `).join('')}
  `;
}

/* ── Right-to-erasure ── */

function eraseUser(email) {
  if (!confirm('Right-to-erasure for ' + email + '?\n\nThis scrubs PII (name, email, phone) but preserves audit trail with anonymized references. This action is irreversible.\n\nPIPEDA / GDPR compliant.')) return;
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'user.erased',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: email, meta: 'Right-to-erasure executed · PII scrubbed · audit trail preserved'
  });
  toast('User ' + email + ' erased (PII scrubbed, audit preserved)');
}

/* ── Impersonation banner ── */

function renderImpersonationBanner() {
  if (!state.impersonationActive) return '';
  return `
    <div class="impersonation-banner">
      <span style="font-size:14px">⚠</span>
      <span>You are signed in as <strong>${escapeHtml(state.impersonationTarget || 'another user')}</strong> for support. All actions are audited.</span>
      <div style="flex:1"></div>
      <kbd>esc</kbd> <span>to exit</span>
      <button class="btn ghost sm" onclick="exitImpersonation()" style="background:rgba(255,255,255,0.15);color:white;border-color:rgba(255,255,255,0.30)">End session</button>
    </div>
  `;
}

function startImpersonation(target) {
  state.impersonationActive = true;
  state.impersonationTarget = target;
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'impersonation.started',
    actor: state.user.name + ' (platform admin)', initials: state.user.initials,
    tenantId: 'northforge', scope: 'cross-tenant', at: 'just now',
    target, meta: 'Support session opened'
  });
  toast('Impersonation session started as ' + target);
  // Insert banner into DOM
  let bannerHost = document.getElementById('impersonation-host');
  if (!bannerHost) {
    bannerHost = document.createElement('div');
    bannerHost.id = 'impersonation-host';
    document.body.insertBefore(bannerHost, document.body.firstChild);
  }
  bannerHost.innerHTML = renderImpersonationBanner();
}

function exitImpersonation() {
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'impersonation.ended',
    actor: state.user.name + ' (platform admin)', initials: state.user.initials,
    tenantId: 'northforge', scope: 'cross-tenant', at: 'just now',
    target: state.impersonationTarget, meta: 'Support session closed'
  });
  state.impersonationActive = false;
  state.impersonationTarget = null;
  const bannerHost = document.getElementById('impersonation-host');
  if (bannerHost) bannerHost.innerHTML = '';
  toast('Impersonation session ended');
}

/* ── Samples tracking ── */

function renderSamplesTab() {
  const samples = state.samples;
  const overdue = samples.filter(s => s.status === 'overdue');
  const totalValue = samples.reduce((s, x) => s + x.value, 0);
  return `
    <div class="qc-summary">
      <div class="profit-card">
        <div class="profit-card-label">Samples on loan</div>
        <div class="profit-card-value">${samples.length}</div>
        <div class="profit-card-sub">across ${state.dealers.length} dealers</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">Total value</div>
        <div class="profit-card-value">${fmtMoney(totalValue)}</div>
        <div class="profit-card-sub">replacement cost</div>
      </div>
      <div class="profit-card" ${overdue.length > 0 ? 'style="border-color:rgba(185,28,28,0.25)"' : ''}>
        <div class="profit-card-label">Overdue returns</div>
        <div class="profit-card-value" style="color:${overdue.length > 0 ? 'var(--gl-danger)' : 'var(--gl-text-faint)'}">${overdue.length}</div>
        <div class="profit-card-sub">${overdue.length > 0 ? 'follow up needed' : 'all on time'}</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">Permanent loans</div>
        <div class="profit-card-value">${samples.filter(s => s.status === 'permanent').length}</div>
        <div class="profit-card-sub">no return expected</div>
      </div>
    </div>

    <div class="panel" style="margin-top:14px">
      <div class="panel-header">
        <div class="panel-title">Sample loans</div>
        <button class="btn primary sm" onclick="toast('Loan new sample (mock)')">+ Loan sample</button>
      </div>

      ${samples.map(s => {
        const dealer = state.dealers.find(d => d.id === s.dealerId);
        return `
          <div class="coi-row">
            <div style="width:32px;height:32px;border-radius:0;background:${dealer ? dealer.gradient : '#94A3B8'};color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">${dealer ? dealer.avatar : '?'}</div>
            <div>
              <div style="font-size:13.5px;font-weight:500">${escapeHtml(s.kind)}</div>
              <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">${dealer ? dealer.short : '?'} · loaned ${fmtDate(s.loanedAt)}</div>
            </div>
            <div style="font-size:12px;font-variant-numeric:tabular-nums">${fmtMoney(s.value)}</div>
            <div style="font-size:12px">${s.returnDue ? fmtDate(s.returnDue) : '<span style="color:var(--gl-text-faint)">never</span>'}</div>
            <div><span class="pending-status ${s.status === 'overdue' ? 'expired' : s.status === 'permanent' ? 'cancelled' : 'accepted'}">${s.status}</span></div>
            <div style="display:flex;gap:5px">
              <button class="btn ghost sm">${s.status === 'overdue' ? 'Follow up' : 'View'}</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* ── Keyboard shortcuts overlay ── */

function showKeyboardShortcuts() {
  state.keyboardShortcutsOpen = true;
  renderKeyboardShortcuts();
}

function closeKeyboardShortcuts() {
  state.keyboardShortcutsOpen = false;
  renderKeyboardShortcuts();
}

function renderKeyboardShortcuts() {
  let host = document.getElementById('shortcuts-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'shortcuts-host';
    document.body.appendChild(host);
  }
  if (!state.keyboardShortcutsOpen) { host.innerHTML = ''; return; }

  host.innerHTML = `
    <div class="shortcuts-overlay" onclick="if(event.target === this) closeKeyboardShortcuts()">
      <div class="shortcuts-card">
        <div style="padding:18px 22px;border-bottom:0.5px solid var(--gl-border);display:flex;align-items:center;gap:12px">
          <div style="font-size:16px;font-weight:600;letter-spacing:-0.018em">Keyboard shortcuts</div>
          <div style="flex:1"></div>
          <button class="modal-close" onclick="closeKeyboardShortcuts()">×</button>
        </div>
        <div class="shortcuts-section">
          <div class="shortcuts-section-title">Global</div>
          <div class="shortcut-row"><span>Open search</span><div class="shortcut-keys"><span class="shortcut-key">⌘</span><span class="shortcut-key">K</span></div></div>
          <div class="shortcut-row"><span>Open notifications</span><div class="shortcut-keys"><span class="shortcut-key">⌘</span><span class="shortcut-key">B</span></div></div>
          <div class="shortcut-row"><span>Show this help</span><div class="shortcut-keys"><span class="shortcut-key">?</span></div></div>
        </div>
        <div class="shortcuts-section">
          <div class="shortcuts-section-title">Navigation</div>
          <div class="shortcut-row"><span>Dashboard</span><div class="shortcut-keys"><span class="shortcut-key">⌘</span><span class="shortcut-key">1</span></div></div>
          <div class="shortcut-row"><span>Quotes</span><div class="shortcut-keys"><span class="shortcut-key">⌘</span><span class="shortcut-key">2</span></div></div>
          <div class="shortcut-row"><span>Production</span><div class="shortcut-keys"><span class="shortcut-key">⌘</span><span class="shortcut-key">3</span></div></div>
          <div class="shortcut-row"><span>Catalog</span><div class="shortcut-keys"><span class="shortcut-key">⌘</span><span class="shortcut-key">4</span></div></div>
          <div class="shortcut-row"><span>Materials</span><div class="shortcut-keys"><span class="shortcut-key">⌘</span><span class="shortcut-key">5</span></div></div>
          <div class="shortcut-row"><span>Pricing</span><div class="shortcut-keys"><span class="shortcut-key">⌘</span><span class="shortcut-key">6</span></div></div>
          <div class="shortcut-row"><span>Financials</span><div class="shortcut-keys"><span class="shortcut-key">⌘</span><span class="shortcut-key">7</span></div></div>
          <div class="shortcut-row"><span>Dealers</span><div class="shortcut-keys"><span class="shortcut-key">⌘</span><span class="shortcut-key">8</span></div></div>
          <div class="shortcut-row"><span>Audit log</span><div class="shortcut-keys"><span class="shortcut-key">⌘</span><span class="shortcut-key">9</span></div></div>
        </div>
        <div class="shortcuts-section">
          <div class="shortcuts-section-title">In tables</div>
          <div class="shortcut-row"><span>Next row</span><div class="shortcut-keys"><span class="shortcut-key">J</span></div></div>
          <div class="shortcut-row"><span>Previous row</span><div class="shortcut-keys"><span class="shortcut-key">K</span></div></div>
          <div class="shortcut-row"><span>Open row detail</span><div class="shortcut-keys"><span class="shortcut-key">↵</span></div></div>
        </div>
        <div class="shortcuts-section">
          <div class="shortcuts-section-title">In search</div>
          <div class="shortcut-row"><span>Navigate results</span><div class="shortcut-keys"><span class="shortcut-key">↑</span><span class="shortcut-key">↓</span></div></div>
          <div class="shortcut-row"><span>Select</span><div class="shortcut-keys"><span class="shortcut-key">↵</span></div></div>
          <div class="shortcut-row"><span>Close</span><div class="shortcut-keys"><span class="shortcut-key">esc</span></div></div>
        </div>
      </div>
    </div>
  `;
}

/* ── Sparkline helper for KPI cards ── */

function sparkSvg(values, color) {
  if (!values || values.length === 0) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * 58 + 1,
    y: 16 - ((v - min) / range) * 14
  }));
  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
  const fillPath = path + ` L 59,16 L 1,16 Z`;
  return `
    <svg class="spark-svg" viewBox="0 0 60 18" style="color:${color || 'var(--gl-info)'}">
      <path class="spark-fill" d="${fillPath}" />
      <path class="spark-line" d="${path}" />
    </svg>
  `;
}

/* ═══════════════════════════════════════════════════════════════════
   DAILY REPORT — actionable-items pull for the owner's morning standup
   Composes a single scrollable report from every department surface:
   urgent tasks, holds, overdue orders, awaiting acks, QC rework,
   materials reorder alerts, inbound POs, outbound dock loads, rush
   requests, and warranty claims. Designed to be skimmed at a standup
   then opened and acted on. The owner can print or copy to clipboard.
   ═══════════════════════════════════════════════════════════════════ */

function openDailyReport() {
  const today = new Date(state.calendarDate || '2026-05-12');
  const todayStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // ─── Collect actionable items from every department ───
  const isOverdue = (o) => o.shipBy && new Date(o.shipBy) < today;
  const daysLate = (o) => o.shipBy ? Math.max(0, Math.floor((today - new Date(o.shipBy)) / 86400000)) : 0;

  // Urgent + open tasks today
  const todayISO = today.toISOString().slice(0, 10);
  const allTasks = state.tasks || [];
  const urgentTasks = allTasks.filter(t => !t.completed && t.date === todayISO && t.priority === 'urgent');
  const openTasks = allTasks.filter(t => !t.completed && t.date === todayISO && t.priority !== 'urgent');

  // Holds
  const allHolds = (state.holds || []).filter(h => h.daysOnHold > 0);
  const longHolds = allHolds.filter(h => h.daysOnHold >= 5);

  // Overdue orders by stage
  const overdueByStage = {};
  state.orders.forEach(o => {
    if (isOverdue(o) && o.status !== 'paid') {
      const stageId = o.status;
      if (!overdueByStage[stageId]) overdueByStage[stageId] = [];
      overdueByStage[stageId].push(o);
    }
  });

  // New POs awaiting ack
  const newPOs = state.orders.filter(o => o.status === 'new');

  // QC rework
  const qcRework = state.orders.filter(o => o.status === 'qc' && o.qcStage === 'rework');

  // Materials below reorder
  const reorderItems = (state.inventory || []).filter(i => i.onHand <= i.reorderPoint);
  const criticalReorder = reorderItems.filter(i => {
    const proj = i.onHand + onOrderQty(i.sku);
    return proj < (i.reorderPoint || 0);
  });

  // Inbound POs arriving today / overdue
  const inboundDue = (state.purchaseOrders || []).filter(po => {
    if (po.status !== 'in-transit' || !po.expectedAt) return false;
    return new Date(po.expectedAt) <= today;
  });

  // Outbound orders ready but past shipBy (didn't get on a truck)
  const stuckOnDock = state.orders.filter(o => o.status === 'ready' && isOverdue(o));

  // Rush requests pending
  const rushPending = (state.rushRequests || []).filter(r => r.status === 'REQUESTED');

  // Open warranty claims
  const warrantyOpen = (state.warrantyClaims || []).filter(w => w.status !== 'RESOLVED' && w.status !== 'DECLINED');

  // Total counts for the summary band
  const totalActionable = urgentTasks.length + openTasks.length + allHolds.length
    + Object.values(overdueByStage).reduce((s, arr) => s + arr.length, 0)
    + newPOs.length + qcRework.length + reorderItems.length + inboundDue.length
    + stuckOnDock.length + rushPending.length + warrantyOpen.length;

  // ─── Build sections ───
  const section = (label, count, severity, body) => {
    if (count === 0) return '';
    const sevClass = severity === 'critical' ? 'critical' : severity === 'warn' ? 'warn' : 'info';
    return `
      <div class="daily-report-section">
        <div class="daily-report-section-head">
          <h3 class="daily-report-section-title">${label}</h3>
          <span class="daily-report-section-count ${sevClass}">${count}</span>
        </div>
        ${body}
      </div>
    `;
  };

  const orderRow = (o, suffix = '') => {
    const d = getDealer(o.dealerId);
    const lateD = daysLate(o);
    return `
      <div class="daily-report-row no-id">
        <div class="daily-report-row-body">
          <div class="daily-report-row-title">${d ? escapeHtml(d.short) : 'Direct customer'} <span class="daily-report-row-po">${o.po}</span> <span class="daily-report-row-meta">· ${o.units}u</span></div>
          <div class="daily-report-row-sub">${escapeHtml(o.project)}${o.shipBy ? ` · ship by ${fmtDateShort(o.shipBy)}` : ''}${suffix ? ' · ' + suffix : ''}</div>
        </div>
        ${lateD > 0 ? `<div class="daily-report-row-flag">${lateD}d late</div>` : ''}
      </div>
    `;
  };

  // Urgent tasks
  const urgentTasksBody = urgentTasks.length > 0 ? `
    <div class="daily-report-rows">
      ${urgentTasks.map(t => `
        <div class="daily-report-row">
          <div class="daily-report-row-id">⚑</div>
          <div class="daily-report-row-body">
            <div class="daily-report-row-title">${escapeHtml(t.title)}</div>
            <div class="daily-report-row-sub">${escapeHtml(t.subtitle || t.kind || '')}</div>
          </div>
          <div class="daily-report-row-flag" style="background:var(--gl-danger-bg);color:var(--gl-danger)">URGENT</div>
        </div>
      `).join('')}
    </div>
  ` : '';

  // Open tasks (non-urgent)
  const openTasksBody = openTasks.length > 0 ? `
    <div class="daily-report-rows">
      ${openTasks.map(t => `
        <div class="daily-report-row">
          <div class="daily-report-row-id">·</div>
          <div class="daily-report-row-body">
            <div class="daily-report-row-title">${escapeHtml(t.title)}</div>
            <div class="daily-report-row-sub">${escapeHtml(t.subtitle || t.kind || '')}</div>
          </div>
        </div>
      `).join('')}
    </div>
  ` : '';

  // Holds — grouped by blocker type for chase-list utility
  const holdRows = allHolds.map(h => {
    const o = getOrder(h.orderId);
    if (!o) return '';
    const d = getDealer(o.dealerId);
    const blocker = HOLD_BLOCKER_META[h.blocker] || { label: h.blocker, color: '#64748B', icon: '•' };
    return `
      <div class="daily-report-row no-id">
        <div class="daily-report-row-body">
          <div class="daily-report-row-title">${d ? escapeHtml(d.short) : 'Direct customer'} <span class="daily-report-row-po">${o.po}</span> <span class="daily-report-row-meta">· ${escapeHtml(o.project)} · stalled at ${escapeHtml(h.stalledAt || '')}</span></div>
          <div class="daily-report-row-sub"><span class="daily-report-tag" style="background:${blocker.color}1A;color:${blocker.color}">${blocker.label}</span> · ${escapeHtml(h.reason)} · chase: ${escapeHtml(h.followUp)}</div>
        </div>
        <div class="daily-report-row-flag" style="background:rgba(15,23,42,0.06)">${h.daysOnHold}d</div>
      </div>
    `;
  }).join('');

  // Overdue orders — show all stages with overdue
  const overdueBody = Object.entries(overdueByStage).map(([stageId, orders]) => {
    const stage = getStage(stageId);
    return `
      <div class="daily-report-substage">
        <div class="daily-report-substage-label">
          <span class="daily-report-stage-dot" style="background:${stage.color}"></span>
          ${stage.label} · ${orders.length}
        </div>
        <div class="daily-report-rows">
          ${orders.map(o => orderRow(o)).join('')}
        </div>
      </div>
    `;
  }).join('');

  // New POs
  const newPosBody = newPOs.length > 0 ? `<div class="daily-report-rows">${newPOs.map(o => orderRow(o, 'awaiting acknowledgment')).join('')}</div>` : '';

  // QC rework
  const qcReworkBody = qcRework.length > 0 ? `<div class="daily-report-rows">${qcRework.map(o => {
    const defs = o.qcDeficiencies || [];
    const def = defs[0] || {};
    return orderRow(o, def.kind ? `defect: ${def.kind}` : 'rework needed');
  }).join('')}</div>` : '';

  // Materials reorder
  const reorderBody = reorderItems.length > 0 ? `
    <div class="daily-report-rows">
      ${reorderItems.map(i => {
        const sup = getSupplier(i.supplierId);
        const projected = i.onHand + onOrderQty(i.sku);
        const isCritical = projected < (i.reorderPoint || 0);
        return `
          <div class="daily-report-row">
            <div class="daily-report-row-id">${escapeHtml(i.sku)}</div>
            <div class="daily-report-row-body">
              <div class="daily-report-row-title">${escapeHtml(i.name)}</div>
              <div class="daily-report-row-sub">${sup ? sup.name + ' · ' : ''}on hand: ${i.onHand} ${i.uom} · reorder at ${i.reorderPoint}${onOrderQty(i.sku) > 0 ? ` · +${onOrderQty(i.sku)} on PO` : ''}</div>
            </div>
            <div class="daily-report-row-flag" style="${isCritical ? 'background:var(--gl-danger-bg);color:var(--gl-danger)' : 'background:rgba(217,119,6,0.10);color:var(--gl-warn)'}">${isCritical ? 'CRITICAL' : 'LOW'}</div>
          </div>
        `;
      }).join('')}
    </div>
  ` : '';

  // Inbound due
  const inboundBody = inboundDue.length > 0 ? `
    <div class="daily-report-rows">
      ${inboundDue.map(po => {
        const sup = getSupplier(po.supplierId);
        const daysOver = po.etaDays != null ? -po.etaDays : 0;
        return `
          <div class="daily-report-row">
            <div class="daily-report-row-id">${po.id}</div>
            <div class="daily-report-row-body">
              <div class="daily-report-row-title">${sup ? escapeHtml(sup.name) : 'Supplier'} <span class="daily-report-row-meta">· ${po.totalQty || '?'} units · ${fmtMoney(po.totalCost || 0)}</span></div>
              <div class="daily-report-row-sub">ETA ${po.expectedAt ? fmtDateShort(po.expectedAt) : '—'} · dock ${po.dockDoor || '—'} · PRO ${po.proNumber || '—'}</div>
            </div>
            ${daysOver > 0 ? `<div class="daily-report-row-flag">${daysOver}d overdue</div>` : `<div class="daily-report-row-flag" style="background:rgba(217,119,6,0.10);color:var(--gl-warn)">today</div>`}
          </div>
        `;
      }).join('')}
    </div>
  ` : '';

  // Stuck on dock
  const dockBody = stuckOnDock.length > 0 ? `<div class="daily-report-rows">${stuckOnDock.map(o => orderRow(o, `${o.carrier ? o.carrier.name : 'carrier'} · dock ${o.dockDoor || '—'}`)).join('')}</div>` : '';

  // Rush requests
  const rushBody = rushPending.length > 0 ? `
    <div class="daily-report-rows">
      ${rushPending.map(r => {
        const o = getOrder(r.orderId);
        if (!o) return '';
        const d = getDealer(o.dealerId);
        return `
          <div class="daily-report-row no-id">
            <div class="daily-report-row-body">
              <div class="daily-report-row-title">${d ? escapeHtml(d.short) : 'Direct customer'} <span class="daily-report-row-po">${o.po}</span> <span class="daily-report-row-meta">· ${escapeHtml(o.project)} · requested priority ${r.requestedPriorityLevel || '?'}</span></div>
              <div class="daily-report-row-sub">${escapeHtml(r.reason || '')}${r.feeOffered ? ` · fee offered ${fmtMoney(r.feeOffered)}` : ''}</div>
            </div>
            <div class="daily-report-row-flag" style="background:var(--gl-purple-bg);color:var(--gl-purple)">PENDING</div>
          </div>
        `;
      }).join('')}
    </div>
  ` : '';

  // Warranty
  const warrantyBody = warrantyOpen.length > 0 ? `
    <div class="daily-report-rows">
      ${warrantyOpen.map(w => {
        const o = w.orderId ? getOrder(w.orderId) : null;
        return `
          <div class="daily-report-row">
            <div class="daily-report-row-id">${w.id || 'W'}</div>
            <div class="daily-report-row-body">
              <div class="daily-report-row-title">${escapeHtml(w.title || w.issue || 'Warranty claim')}${o ? ` <span class="daily-report-row-meta">· ${o.po}</span>` : ''}</div>
              <div class="daily-report-row-sub">${escapeHtml(w.status || 'open')} · ${escapeHtml(w.subtitle || '')}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  ` : '';

  // ─── Build subsections by item type (helpers for department composition) ─
  const subsection = (title, count, body) => count === 0 ? null : { title, count, body };

  // Helper to filter holds by blocker type
  const holdsByBlocker = (kinds) => allHolds.filter(h => kinds.includes(h.blocker));
  const renderHoldRows = (holds) => holds.length === 0 ? '' : `
    <div class="daily-report-rows">
      ${holds.map(h => {
        const o = getOrder(h.orderId);
        if (!o) return '';
        const d = getDealer(o.dealerId);
        const blocker = HOLD_BLOCKER_META[h.blocker] || { label: h.blocker, color: '#64748B', icon: '•' };
        return `
          <div class="daily-report-row no-id">
            <div class="daily-report-row-body">
              <div class="daily-report-row-title">${d ? escapeHtml(d.short) : 'Direct customer'} <span class="daily-report-row-po">${o.po}</span> <span class="daily-report-row-meta">· ${escapeHtml(o.project)} · stalled at ${escapeHtml(h.stalledAt || '')}</span></div>
              <div class="daily-report-row-sub">${escapeHtml(h.reason)} · chase: ${escapeHtml(h.followUp)}</div>
            </div>
            <div class="daily-report-row-flag" style="background:rgba(15,23,42,0.06);color:var(--gl-text-mute)">${h.daysOnHold}d</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  const renderOrderListRows = (orders, suffix) => `<div class="daily-report-rows">${orders.map(o => orderRow(o, suffix || '')).join('')}</div>`;

  // ─── Department buckets ─────────────────────────────────────────────
  // Each department collects subsections from across the data set.

  // ESTIMATING & SALES — new POs, intake-stage overdue, dealer + installer holds
  const dealerHolds = holdsByBlocker(['dealer']);
  const installerHolds = holdsByBlocker(['installer']);
  const intakeOverdue = [...(overdueByStage['new'] || []), ...(overdueByStage['ack'] || [])];
  const estimatingSubs = [
    subsection('New POs awaiting acknowledgment', newPOs.length, newPosBody),
    subsection('Overdue at intake (new / ack)', intakeOverdue.length, renderOrderListRows(intakeOverdue)),
    subsection('Dealer-side holds — chase dealer', dealerHolds.length, renderHoldRows(dealerHolds)),
    subsection('Field-measure / installer holds', installerHolds.length, renderHoldRows(installerHolds))
  ].filter(Boolean);

  // ENGINEERING & DRAWINGS — drawings-stage overdue
  const drawingsOverdue = overdueByStage['drawings'] || [];
  const engineeringSubs = [
    subsection('Overdue at drawings', drawingsOverdue.length, renderOrderListRows(drawingsOverdue))
  ].filter(Boolean);

  // PRODUCTION FLOOR — production overdue, machine holds
  const productionOverdue = overdueByStage['production'] || [];
  const machineHolds = holdsByBlocker(['machine']);
  const productionSubs = [
    subsection('Overdue on the production floor', productionOverdue.length, renderOrderListRows(productionOverdue)),
    subsection('Machine down — production blocked', machineHolds.length, renderHoldRows(machineHolds))
  ].filter(Boolean);

  // QC — rework, qc overdue, qc holds
  const qcOverdue = overdueByStage['qc'] || [];
  const qcHolds = holdsByBlocker(['qc']);
  const qcSubs = [
    subsection('Rework required', qcRework.length, qcReworkBody),
    subsection('Overdue at QC inspection', qcOverdue.length, renderOrderListRows(qcOverdue)),
    subsection('QC-side holds', qcHolds.length, renderHoldRows(qcHolds))
  ].filter(Boolean);

  // SHIPPING & RECEIVING — dock stuck, shipping/delivered overdue, inbound POs
  const shippingOverdue = [...(overdueByStage['shipped'] || []), ...(overdueByStage['delivered'] || [])];
  const shippingSubs = [
    subsection('Outbound · stuck on dock (ready past ship-by)', stuckOnDock.length, dockBody),
    subsection('In-transit / delivered with original date missed', shippingOverdue.length, renderOrderListRows(shippingOverdue)),
    subsection('Inbound · arriving today / overdue', inboundDue.length, inboundBody)
  ].filter(Boolean);

  // MATERIALS & PURCHASING — reorder alerts, supplier holds
  const supplierHolds = holdsByBlocker(['supplier']);
  const materialsSubs = [
    subsection('Below reorder point', reorderItems.length, reorderBody),
    subsection('Supplier-side holds — chase supplier', supplierHolds.length, renderHoldRows(supplierHolds))
  ].filter(Boolean);

  // CUSTOMER SERVICE & WARRANTY
  const csSubs = [
    subsection('Rush requests pending approval', rushPending.length, rushBody),
    subsection('Open warranty claims', warrantyOpen.length, warrantyBody)
  ].filter(Boolean);

  // ─── Render a department block ──────────────────────────────────────
  const renderDept = (name, color, tint, eyebrow, subs) => {
    if (subs.length === 0) return '';
    const total = subs.reduce((s, x) => s + x.count, 0);
    return `
      <div class="daily-report-dept" style="--dept-color:${color};--dept-tint:${tint}">
        <div class="daily-report-dept-head">
          <div class="daily-report-dept-head-row">
            <div class="daily-report-dept-head-text">
              <div class="daily-report-dept-eyebrow">${eyebrow}</div>
              <h2 class="daily-report-dept-title">${name}</h2>
            </div>
            <span class="daily-report-dept-count">${total} open</span>
          </div>
        </div>
        <div class="daily-report-dept-body">
          ${subs.map(s => `
            <div class="daily-report-subsection">
              <div class="daily-report-subsection-head">
                <span class="daily-report-subsection-title">${s.title}</span>
                <span class="daily-report-subsection-count">${s.count}</span>
              </div>
              ${s.body}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  // ─── Top — urgent items (cross-cutting, time sensitive) ────────────
  const urgentBlock = (urgentTasks.length > 0) ? `
    <div class="daily-report-dept urgent" style="--dept-color:var(--gl-danger);--dept-tint:var(--gl-danger-bg)">
      <div class="daily-report-dept-head">
        <div class="daily-report-dept-head-row">
          <div class="daily-report-dept-head-text">
            <div class="daily-report-dept-eyebrow">TIME SENSITIVE</div>
            <h2 class="daily-report-dept-title" style="color:var(--gl-danger)">Urgent — handle first</h2>
          </div>
          <span class="daily-report-dept-count" style="background:var(--gl-danger);color:#fff">${urgentTasks.length} open</span>
        </div>
      </div>
      <div class="daily-report-dept-body">
        ${urgentTasksBody}
      </div>
    </div>
  ` : '';

  // Compose full report HTML
  const reportHtml = `
    <div class="daily-report-overlay" onclick="if (event.target === this) closeDailyReport()">
      <div class="daily-report">
        <div class="daily-report-bar">
          <div>
            <div class="daily-report-eyebrow">DAILY OPERATIONS REPORT</div>
            <div class="daily-report-date">${todayStr}</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn ghost sm" onclick="window.print()">🖨 Print</button>
            <button class="btn ghost sm" onclick="copyDailyReport()">📋 Copy</button>
            <button class="btn ghost sm" onclick="closeDailyReport()">✕ Close</button>
          </div>
        </div>

        <div class="daily-report-body">
          <div class="daily-report-summary">
            <div class="daily-report-summary-cell">
              <div class="daily-report-summary-label">Total actionable</div>
              <div class="daily-report-summary-value">${totalActionable}</div>
            </div>
            <div class="daily-report-summary-cell">
              <div class="daily-report-summary-label">Urgent</div>
              <div class="daily-report-summary-value" style="color:var(--gl-danger)">${urgentTasks.length}</div>
            </div>
            <div class="daily-report-summary-cell">
              <div class="daily-report-summary-label">On hold</div>
              <div class="daily-report-summary-value">${allHolds.length}</div>
            </div>
            <div class="daily-report-summary-cell">
              <div class="daily-report-summary-label">Overdue orders</div>
              <div class="daily-report-summary-value" style="color:var(--gl-danger)">${Object.values(overdueByStage).reduce((s, a) => s + a.length, 0)}</div>
            </div>
            <div class="daily-report-summary-cell">
              <div class="daily-report-summary-label">Reorder alerts</div>
              <div class="daily-report-summary-value" style="color:var(--gl-warn)">${reorderItems.length}</div>
            </div>
          </div>

          ${urgentBlock}
          ${renderDept('Estimating & Sales',          '#7C3AED', 'rgba(124, 58, 237, 0.06)',  'DEPARTMENT', estimatingSubs)}
          ${renderDept('Engineering & Drawings',      '#2e5bc8', 'rgba(37, 99, 235, 0.06)',   'DEPARTMENT', engineeringSubs)}
          ${renderDept('Production Floor',            '#D97706', 'rgba(217, 119, 6, 0.06)',   'DEPARTMENT', productionSubs)}
          ${renderDept('QC Inspection',               '#B45309', 'rgba(180, 83, 9, 0.06)',    'DEPARTMENT', qcSubs)}
          ${renderDept('Shipping & Receiving',        '#0891B2', 'rgba(8, 145, 178, 0.06)',   'DEPARTMENT', shippingSubs)}
          ${renderDept('Materials & Purchasing',      '#92400E', 'rgba(146, 64, 14, 0.06)',   'DEPARTMENT', materialsSubs)}
          ${renderDept('Customer Service & Warranty', '#16A34A', 'rgba(22, 163, 74, 0.06)',   'DEPARTMENT', csSubs)}
          ${openTasks.length > 0 ? renderDept('Other open tasks', '#64748B', 'rgba(100, 116, 139, 0.06)', 'CROSS-DEPARTMENT', [{ title: 'Non-urgent tasks for today', count: openTasks.length, body: openTasksBody }]) : ''}

          ${totalActionable === 0 ? `
            <div class="daily-report-empty">
              <div style="font-size:48px;color:var(--gl-success);margin-bottom:8px">✓</div>
              <div style="font-size:18px;font-weight:700">All caught up</div>
              <div style="font-size:13px;color:var(--gl-text-mute);margin-top:4px">Nothing actionable across any department. Quietest day in months.</div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  // Mount + render
  let mountEl = document.getElementById('daily-report-mount');
  if (!mountEl) {
    mountEl = document.createElement('div');
    mountEl.id = 'daily-report-mount';
    document.body.appendChild(mountEl);
  }
  mountEl.innerHTML = reportHtml;
  state.dailyReportOpen = true;
}

function closeDailyReport() {
  const el = document.getElementById('daily-report-mount');
  if (el) el.innerHTML = '';
  state.dailyReportOpen = false;
}

function copyDailyReport() {
  const el = document.querySelector('.daily-report-body');
  if (!el) return;
  const text = el.innerText || el.textContent || '';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => toast('Report copied to clipboard'));
  } else {
    toast('Copy not supported in this browser');
  }
}

function renderDashboard() {
  // Default the dashboard calendar to month view + today on first load
  if (!state.calendarView) state.calendarView = 'day';
  if (!state.calendarDate) state.calendarDate = isoDate(new Date());

  $('dashboard-view').innerHTML = `
    <div class="view-header" style="margin-bottom:16px">
      <div>
        <div class="dash-greeting">
          <div class="dash-greeting-text">${getGreeting()}, <span class="dash-greeting-name">${state.user.name.split(' ')[0]}</span></div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn ghost" onclick="openDailyReport()">↓ Pull daily report</button>
        <button class="btn primary" onclick="switchView('production')">View orders →</button>
      </div>
    </div>

    <!-- ── Two-column: Calendar (wide) + Recent activity (thin) ── -->
    <div class="dash-main-grid" style="margin-top:14px">
      <div class="dash-calendar-panel" style="margin-top:0">
        <div class="dash-calendar-body">
          ${renderCalendar()}
        </div>
      </div>

      <!-- Right-side stack: Recent activity + Materials reorder -->
      <div class="dash-right-stack">
        <!-- Recent activity rail -->
        <div class="dash-activity-rail">
        <div class="dash-activity-head">
          <div class="dash-activity-title">Recent activity</div>
          <button class="panel-action" onclick="switchView('production')">View all →</button>
        </div>
        <div class="dash-activity-list">
          <div class="activity-item compact" onclick="openOrderFullscreen(2410)">
            <div class="activity-dot po"></div>
            <div class="activity-content">
              <div class="activity-title">New PO · Maple Street</div>
              <div class="activity-meta">O-2410 · Riverside Heights · 10u · $13K</div>
            </div>
            <div class="activity-time">2m</div>
          </div>
          <div class="activity-item compact" onclick="openOrderFullscreen(2406)">
            <div class="activity-dot drawing"></div>
            <div class="activity-content">
              <div class="activity-title">Drawing approved · Sunrise</div>
              <div class="activity-meta">O-2406 · Aspen Grove</div>
            </div>
            <div class="activity-time">18m</div>
          </div>
          <div class="activity-item compact" onclick="openOrderFullscreen(2408)">
            <div class="activity-dot message"></div>
            <div class="activity-content">
              <div class="activity-title">Maple Street replied</div>
              <div class="activity-meta">O-2408 · "Move ship date earlier?"</div>
            </div>
            <div class="activity-time">42m</div>
          </div>
          <div class="activity-item compact" onclick="openOrderFullscreen(2409)">
            <div class="activity-dot production"></div>
            <div class="activity-content">
              <div class="activity-title">Production started</div>
              <div class="activity-meta">O-2409 · Lakeshore · 14u · ETA May 22</div>
            </div>
            <div class="activity-time">2h</div>
          </div>
          <div class="activity-item compact" onclick="openOrderFullscreen(2402)">
            <div class="activity-dot delivered"></div>
            <div class="activity-content">
              <div class="activity-title">Delivered · Windermere</div>
              <div class="activity-meta">O-2402 · 16u</div>
            </div>
            <div class="activity-time">Yest</div>
          </div>
          <div class="activity-item compact" onclick="openOrderFullscreen(2405)">
            <div class="activity-dot shipped"></div>
            <div class="activity-content">
              <div class="activity-title">QC passed · Sunset Blvd</div>
              <div class="activity-meta">O-2405 · 12u · ready to ship</div>
            </div>
            <div class="activity-time">3h</div>
          </div>
          <div class="activity-item compact" onclick="openOrderFullscreen(2404)">
            <div class="activity-dot production"></div>
            <div class="activity-content">
              <div class="activity-title">Frames welded · Brookside</div>
              <div class="activity-meta">O-2404 · 20u · IGU next</div>
            </div>
            <div class="activity-time">5h</div>
          </div>
          <div class="activity-item compact" onclick="openOrderFullscreen(2399)">
            <div class="activity-dot po"></div>
            <div class="activity-content">
              <div class="activity-title">PO acknowledged · Stonebridge</div>
              <div class="activity-meta">O-2399 · 11u · drawings due May 15</div>
            </div>
            <div class="activity-time">1d</div>
          </div>
        </div>
        </div><!-- /dash-activity-rail -->

        <!-- Materials below reorder -->
        ${(() => {
          const reorderItems = getReorderItems();
          if (reorderItems.length === 0) return '';
          const visible = reorderItems.slice(0, 5);
          const extra = reorderItems.length - visible.length;
          const criticalCount = reorderItems.filter(it => stockHealth(it) === 'critical').length;
          return `
            <div class="dash-reorder-rail">
              <div class="dash-activity-head">
                <div class="dash-activity-title">Materials below reorder${criticalCount > 0 ? ` <span class="dash-reorder-crit">· ${criticalCount} critical</span>` : ''}</div>
                <button class="panel-action" onclick="switchView('materials'); state.materialsTab='reorder'; renderMaterials();">View all →</button>
              </div>
              <div class="dash-reorder-list">
                ${visible.map(it => {
                  const health = stockHealth(it);
                  const cov = coverageWeeks(it);
                  const covLabel = cov >= 99 ? '—' : (cov < 1 ? `${(cov * 7).toFixed(0)}d left` : `${cov.toFixed(1)}w left`);
                  return `
                    <div class="dash-reorder-item" onclick="switchView('materials'); state.materialsTab='reorder'; renderMaterials();">
                      <div class="dash-reorder-pip ${health}"></div>
                      <div class="dash-reorder-content">
                        <div class="dash-reorder-name">${it.name}</div>
                        <div class="dash-reorder-meta">${it.onHand}${it.uom} on hand · ${covLabel}</div>
                      </div>
                    </div>
                  `;
                }).join('')}
                ${extra > 0 ? `<div class="dash-reorder-more" onclick="switchView('materials'); state.materialsTab='reorder'; renderMaterials();">+${extra} more →</div>` : ''}
              </div>
            </div>
          `;
        })()}
      </div><!-- /dash-right-stack -->
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════════════
   PRODUCTION PIPELINE VIEW — every job, every stage.
   The factory owner can advance any order to the next stage, jump it
   to any stage, or back it up — no restrictions. The visual is a
   horizontal lane per stage, with each card showing where it is
   inside production (which substage), how late vs ship date, and
   one-click stage controls.
   ═══════════════════════════════════════════════════════════════════ */

function renderPipeline() {
  const slot = $('pipeline-view');
  if (!slot) return;

  const searchQ = (state.search && state.search.production) || '';
  // Only orders currently at a production-floor stage appear here
  const pipelineOrdersAll = state.orders.filter(o => PRODUCTION_STAGE_IDS.includes(o.status));
  const pipelineOrdersSearched = pipelineOrdersAll.filter(o => matchesSearch(searchQ, searchOrderFields(o)));

  // Windows-only platform now — no product type splitting needed.
  const activeOrders = pipelineOrdersSearched;

  // Today + lateness
  const today = new Date(state.calendarDate || '2026-05-12');
  const isLate = (o) => o.shipBy && new Date(o.shipBy) < today && !['delivered','paid','shipped'].includes(o.status);
  const daysLate = (o) => {
    if (!o.shipBy) return 0;
    return Math.max(0, Math.floor((today - new Date(o.shipBy)) / (1000*60*60*24)));
  };
  const lateCount = activeOrders.filter(isLate).length;

  // Columns from the window substage chain
  const substages = WINDOW_PROD_SUBSTAGES;
  const columns = substages.map(s => ({
    id: 'prod-' + s.id,
    label: s.label,
    color: s.color,
    tint: s.tint,
    kind: 'substage',
    key: s.id
  }));

  // Group orders into columns by prodStage. Orders with an invalid prodStage
  // fall into the first column ('materials') so nothing disappears.
  const validSubIds = new Set(substages.map(s => s.id));
  const colOrders = {};
  columns.forEach(c => colOrders[c.id] = []);
  activeOrders.forEach(o => {
    if (o.status === 'production') {
      const subId = validSubIds.has(o.prodStage) ? o.prodStage : 'materials';
      const colKey = 'prod-' + subId;
      if (colOrders[colKey]) colOrders[colKey].push(o);
    }
  });

  const colsHtml = columns.map(c => {
    const orders = colOrders[c.id];
    const colValue = orders.reduce((sum, o) => sum + (o.value || 0), 0);
    return `
      <div class="pipe-col" style="--col-color:${c.color};--col-tint:${c.tint}">
        <div class="pipe-col-head">
          <div class="pipe-col-head-row">
            <div class="pipe-col-title">
              <span class="pipe-col-dot" style="background:${c.color}"></span>
              <span class="pipe-col-label">${c.label}</span>
            </div>
            <span class="pipe-col-count">${orders.length}</span>
          </div>
          <div class="pipe-col-value">${orders.length > 0 ? fmtMoneyFull(colValue) : '—'}</div>
        </div>
        <div class="pipe-col-cards">
          ${orders.length === 0
            ? `<div class="pipe-col-empty">No orders</div>`
            : orders.map(o => renderPipelineCard(o, daysLate(o), isLate(o))).join('')}
        </div>
      </div>
    `;
  }).join('');

  // No product-type subtab row needed anymore — windows-only
  const subtabsHtml = '';

  // Subtitle shows the chain summary for the active type
  const chainSummary = substages.slice(0, 4).map(s => s.label.toLowerCase()).join(' → ') + ' → …';

  slot.innerHTML = `
    ${renderBackButton ? renderBackButton() : ''}
    <div class="view-header">
      <div>
        <div class="view-title">Production</div>
        <div class="view-subtitle">
          ${activeOrders.length} windows on the floor · ${lateCount > 0 ? `<span style="color:var(--gl-danger);font-weight:600">${lateCount} late</span> · ` : ''}${chainSummary}
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        ${renderSearchBar('production', 'Search PO, project, dealer…')}
      </div>
    </div>

    <div class="pipe-cols-wrap">
      <div class="pipe-cols" style="grid-template-columns:repeat(${Math.max(columns.length, 1)}, minmax(0, 1fr))">
        ${colsHtml || '<div class="pipeline-empty" style="padding:60px 20px;text-align:center"><div style="font-size:14px;font-weight:600;color:var(--gl-text)">No orders on the floor</div><div style="font-size:12.5px;color:var(--gl-text-mute);margin-top:4px">Orders appear here once Acknowledged → moved to production.</div></div>'}
      </div>
    </div>
  `;
}

function renderPipelineCard(o, daysLateN, late) {
  const d = getDealer(o.dealerId);
  const stage = getStage(o.status);
  const next = nextStageOf(o.status);
  const orderSubstages = getOrderSubstages(o);
  const sub = o.status === 'production' ? getProdSubstage(o) : null;
  const substageIdx = sub ? orderSubstages.findIndex(s => s.id === sub.id) : -1;
  const subProgressPct = sub ? Math.round(((substageIdx + 1) / orderSubstages.length) * 100) : 0;
  const hold = (state.holds || []).find(h => h.orderId === o.id);
  const flagged = !!hold;
  const blockerMeta = hold ? (HOLD_BLOCKER_META[hold.blocker] || { label: hold.blocker, color: '#64748B', icon: '•' }) : null;

  // Stage strip — mini visual of where it is in the full pipeline
  const currentIdx = STAGE_INDEX[o.status];
  const stripHtml = STAGES.map((s, i) => {
    const cls = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'pending';
    return `<span class="pipeline-strip-step ${cls}" style="${cls === 'current' ? `background:${s.color}` : ''}" title="${s.label}"></span>`;
  }).join('');

  // Substage dropdown — built only for orders currently in production.
  // Lets the operator move the order to any production substage OR any
  // other order stage (Acknowledged, Drawings, QC, Ready, Shipped,
  // Delivered, Paid). Every move routes through the confirmation modal.
  let substageDropdown = '';
  if (o.status === 'production') {
    const list = orderSubstages;
    const cur = list.find(s => s.id === o.prodStage) || list[0];

    // Substage options — value prefixed "sub:" so the router knows
    const subOpts = list.map(s =>
      `<option value="sub:${s.id}" ${s.id === cur.id ? 'selected' : ''}>${s.id === cur.id ? s.label + ' (current)' : s.label}</option>`
    ).join('');

    // Cross-stage options — every order stage EXCEPT 'production' itself
    // (that's what the substage group is for) and 'new' (can't roll back
    // an in-production order all the way to a fresh PO).
    const stageOpts = STAGES
      .filter(s => s.id !== 'production' && s.id !== 'new')
      .map(s => `<option value="stage:${s.id}">${s.label}</option>`)
      .join('');

    substageDropdown = `
      <label class="pipeline-stage-select-wrap">
        <span class="pipeline-stage-select-label">Move to</span>
        <select class="pipeline-stage-select"
                onchange="handleProdDropdown(${o.id}, this.value); this.blur();"
                onclick="event.stopPropagation();"
                title="Move to any stage or substage">
          <optgroup label="Production substages">${subOpts}</optgroup>
          <optgroup label="Other stages">${stageOpts}</optgroup>
        </select>
      </label>
    `;
  }

  // Stage jump dropdown — for cards NOT in production status (estimates,
  // ack'd, drawings, ready, shipped, etc). Still gated by the confirmation
  // modal via handleStageDropdown.
  const jumpDropdown = o.status === 'production' ? '' : `
    <label class="pipeline-stage-select-wrap">
      <span class="pipeline-stage-select-label">Stage</span>
      <select class="pipeline-stage-select"
              onchange="handleStageDropdown(${o.id}, this.value); this.blur();"
              onclick="event.stopPropagation();"
              title="Change stage">
        ${STAGES.map(s => `<option value="${s.id}" ${o.status === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
      </select>
    </label>
  `;

  // Advance button label & handler — walks substages within production, then jumps to QC
  let advanceLabel, advanceHandler;
  if (o.status === 'new') {
    // Acknowledging a new PO is a meaningful step — open the confirmation
    // modal rather than committing silently. Modal captures FO number,
    // ETC, priority, PM, notes, and dealer message.
    advanceLabel = `✓ Acknowledge`;
    advanceHandler = `acknowledgePO(${o.id})`;
  } else if (o.status === 'production') {
    const nextSub = substageIdx < orderSubstages.length - 1 ? orderSubstages[substageIdx + 1] : null;
    if (nextSub) {
      advanceLabel = `→ ${nextSub.label}`;
      advanceHandler = `setProdSubstage(${o.id}, '${nextSub.id}')`;
    } else {
      advanceLabel = `→ QC`;
      advanceHandler = `advanceOrder(${o.id})`;
    }
  } else if (next) {
    advanceLabel = `→ ${next.short}`;
    advanceHandler = `advanceOrder(${o.id})`;
  } else {
    advanceLabel = 'Final stage';
    advanceHandler = null;
  }

  // Hold banner — slim strip embedded in the card, shows blocker tag + reason + follow-up contact
  const holdBanner = hold ? `
    <div class="pipeline-card-hold">
      <div class="pipeline-card-hold-row">
        <span class="pipeline-card-hold-tag" style="background:${blockerMeta.color}1A;color:${blockerMeta.color}">${blockerMeta.icon} ${blockerMeta.label} hold</span>
        <span class="pipeline-card-hold-days">${hold.daysOnHold}d</span>
      </div>
      <div class="pipeline-card-hold-reason">${escapeHtml(hold.reason)}</div>
      <div class="pipeline-card-hold-followup">Chase: ${escapeHtml(hold.followUp)}</div>
    </div>
  ` : '';

  return `
    <div class="pipeline-card ${late ? 'late' : ''} ${flagged ? 'flagged' : ''}" style="--card-accent:${stage.color};--card-tint:${stage.tint || 'transparent'}" onclick="if (!event.target.closest('.pipeline-card-actions, .pipeline-card-substage, .pipeline-stage-select-wrap')) openOrderFullscreen(${o.id})">
      <div class="pipeline-card-head">
        <div class="pipeline-card-id">
          <span class="pipeline-card-units">${o.units}u</span>
          ${late ? `<span class="pipeline-card-late">${daysLateN}d late</span>` : ''}
          ${flagged ? `<span class="pipeline-card-flag">⚑ FLAGGED</span>` : ''}
        </div>
        <div class="pipeline-card-head-right">
          <button class="btn primary pipeline-card-hold-btn"
                  onclick="event.stopPropagation(); openPlaceHold(${o.id})"
                  title="Flag this order on hold">⚑ Hold</button>
          <div class="pipeline-card-value">${fmtMoneyFull(o.value)}</div>
        </div>
      </div>
      <div class="pipeline-card-dealer">
        ${d ? `<span class="pipeline-card-dealer-avatar" style="background:${d.gradient}">${d.avatar}</span>${d.short}` : 'Direct customer'}
        <span class="pipeline-card-po-inline">${o.po}</span>
      </div>
      <div class="pipeline-card-project">${o.project}${o.shipBy ? ` <span class="pipeline-card-ship">· ship by ${fmtDateShort(o.shipBy)}</span>` : ''}</div>

      <div class="pipeline-strip">${stripHtml}</div>

      ${holdBanner}

      ${substageDropdown}

      <div class="pipeline-card-actions">
        ${advanceHandler
          ? `<button class="btn primary sm" onclick="event.stopPropagation(); ${advanceHandler}">${advanceLabel}</button>`
          : `<button class="btn ghost sm" disabled style="opacity:0.5;cursor:default">${advanceLabel}</button>`
        }
        ${jumpDropdown}
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════════════
   QC VIEW — every order in inspection, in its own kanban
   Substages: Awaiting → Inspecting → Rework (fail) | Passed (cleared)
   The owner can move orders through inspection with one-click handlers,
   send failed orders back to assembly for rework, or push passed orders
   to Ready to ship.
   ═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   ESTIMATES VIEW — pre-production intake: new POs, acknowledged, drawings
   The owner uses this tab to acknowledge new dealer POs, then release
   drawings, before the order joins the Production floor. Visual recipe
   matches the Production + QC tabs: vertical kanban columns, soft tinted
   gradient heads, ADR-042 squared corners.
   ═══════════════════════════════════════════════════════════════════ */

function renderEstimates() {
  const slot = $('estimates-view');
  if (!slot) return;

  const filter = state.estimatesFilter || 'all';
  const searchQ = (state.search && state.search.estimates) || '';
  // Only orders at intake stages appear here
  const intakeOrdersAll = state.orders.filter(o => ESTIMATES_STAGE_IDS.includes(o.status));
  const intakeOrders = intakeOrdersAll.filter(o => matchesSearch(searchQ, searchOrderFields(o)));
  const orders = filter === 'all' ? intakeOrders : intakeOrders.filter(o => o.status === filter);

  // Stage colors + tints — pulled from STAGES with explicit tint values
  const STAGE_TINTS = {
    'new':      'rgba(124, 58, 237, 0.10)',
    'ack':      'rgba(22, 163, 74, 0.10)',
    'drawings': 'rgba(37, 99, 235, 0.10)'
  };

  // Build the 3 columns
  const columns = ESTIMATES_STAGES.map(s => ({
    id: s.id,
    label: s.label,
    color: s.color,
    tint: STAGE_TINTS[s.id] || 'rgba(15,23,42,0.04)',
    desc: s.desc
  }));

  const colOrders = {};
  columns.forEach(c => colOrders[c.id] = []);
  orders.forEach(o => { if (colOrders[o.status]) colOrders[o.status].push(o); });

  const today = new Date(state.calendarDate || '2026-05-12');
  const isLate = (o) => o.shipBy && new Date(o.shipBy) < today;
  const daysLate = (o) => {
    if (!o.shipBy) return 0;
    return Math.max(0, Math.floor((today - new Date(o.shipBy)) / (1000*60*60*24)));
  };

  const lateCount = intakeOrders.filter(isLate).length;
  const totalValue = intakeOrders.reduce((s, o) => s + (o.value || 0), 0);
  const totalUnits = intakeOrders.reduce((s, o) => s + (o.units || 0), 0);

  // Counts for filter pills
  const stageCounts = {};
  ESTIMATES_STAGES.forEach(s => stageCounts[s.id] = intakeOrders.filter(o => o.status === s.id).length);

  // Filter pills
  const filtersHtml = `
    <div class="pipeline-filters">
      <button class="pipeline-pill ${filter === 'all' ? 'active' : ''}"
              onclick="state.estimatesFilter='all'; renderEstimates();">
        <span class="pipeline-pill-dot" style="background:#0F172A"></span>
        All intake <span class="pipeline-pill-count">${intakeOrders.length}</span>
      </button>
      ${ESTIMATES_STAGES.map(s => `
        <button class="pipeline-pill ${filter === s.id ? 'active' : ''}"
                onclick="state.estimatesFilter='${s.id}'; renderEstimates();">
          <span class="pipeline-pill-dot" style="background:${s.color}"></span>
          ${s.short} <span class="pipeline-pill-count">${stageCounts[s.id]}</span>
        </button>
      `).join('')}
    </div>
  `;

  // Build columns
  const visibleColumns = filter === 'all' ? columns : columns.filter(c => c.id === filter);
  const colsHtml = visibleColumns.map(c => {
    const colOrdersList = colOrders[c.id];
    const colValue = colOrdersList.reduce((sum, o) => sum + (o.value || 0), 0);
    return `
      <div class="pipe-col" style="--col-color:${c.color};--col-tint:${c.tint}">
        <div class="pipe-col-head">
          <div class="pipe-col-head-row">
            <div class="pipe-col-title">
              <span class="pipe-col-dot" style="background:${c.color}"></span>
              <span class="pipe-col-label">${c.label}</span>
            </div>
            <span class="pipe-col-count">${colOrdersList.length}</span>
          </div>
          <div class="pipe-col-value">${colOrdersList.length > 0 ? fmtMoneyFull(colValue) : '—'}</div>
        </div>
        <div class="pipe-col-cards">
          ${colOrdersList.length === 0
            ? `<div class="pipe-col-empty">No orders</div>`
            : colOrdersList.map(o => renderPipelineCard(o, daysLate(o), isLate(o))).join('')}
        </div>
      </div>
    `;
  }).join('');

  slot.innerHTML = `
    ${renderBackButton ? renderBackButton() : ''}
    <div class="view-header">
      <div>
        <div class="view-title">Estimates</div>
        <div class="view-subtitle">
          ${intakeOrders.length} orders in intake · ${totalUnits} units · ${fmtMoneyFull(totalValue)} ${lateCount > 0 ? `· <span style="color:var(--gl-danger);font-weight:600">${lateCount} late</span>` : ''} · new → ack → drawings
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        ${renderSearchBar('estimates', 'Search PO, project, dealer…')}
        <button class="btn ghost" onclick="state.estimatesFilter='all'; renderEstimates();">Reset filter</button>
      </div>
    </div>

    ${filtersHtml}

    <div class="pipe-cols-wrap">
      <div class="pipe-cols" style="grid-template-columns:${visibleColumns.length === 1 ? 'minmax(0, 360px)' : `repeat(${visibleColumns.length}, minmax(0, 1fr))`};${visibleColumns.length === 1 ? 'justify-content:start;' : ''}">
        ${colsHtml || '<div class="pipeline-empty" style="padding:60px 20px;text-align:center"><div style="font-size:14px;font-weight:600;color:var(--gl-text)">No orders in intake</div><div style="font-size:12.5px;color:var(--gl-text-mute);margin-top:4px">New POs arrive here from dealers; advance to production when ready.</div></div>'}
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════════════
   SHIPPING & RECEIVING VIEW — outbound orders + inbound supplier POs
   Two subtabs: Outbound (orders going to dealers) and Inbound (material
   POs from suppliers). Each is a 3-4 column kanban using the same visual
   recipe as Production/QC: soft tinted gradient column heads, hairline
   borders, squared corners, stage-color card edges.
   ═══════════════════════════════════════════════════════════════════ */

/* Outbound shipping substages — orders past production going to dealers */
const OUTBOUND_STAGES = [
  { id: 'ready',     label: 'Ready to ship',  color: '#059669', tint: 'rgba(5, 150, 105, 0.10)', desc: 'QC cleared, waiting on carrier pickup' },
  { id: 'shipped',   label: 'In transit',     color: '#0891B2', tint: 'rgba(8, 145, 178, 0.10)', desc: 'Picked up by carrier, en route' },
  { id: 'delivered', label: 'Delivered',      color: '#334155', tint: 'rgba(51, 65, 85, 0.10)',  desc: 'Signed receipt on file at dealer' }
];

/* Inbound receiving substages — POs from suppliers */
const INBOUND_STAGES = [
  { id: 'submitted',    label: 'PO submitted',    color: '#7C3AED', tint: 'rgba(124, 58, 237, 0.10)', desc: 'PO sent to supplier, awaiting ack' },
  { id: 'acknowledged', label: 'Supplier ack',    color: '#16A34A', tint: 'rgba(22, 163, 74, 0.10)',  desc: 'Supplier confirmed, scheduled for production' },
  { id: 'in-transit',   label: 'In transit',      color: '#0891B2', tint: 'rgba(8, 145, 178, 0.10)',  desc: 'Shipped from supplier, en route to dock' },
  { id: 'received',     label: 'Received',        color: '#059669', tint: 'rgba(5, 150, 105, 0.10)',  desc: 'Material on hand, checked into inventory' }
];

function renderShipping() {
  const slot = $('shipping-view');
  if (!slot) return;

  const tab = state.shippingTab || 'outbound';
  const isOutbound = tab === 'outbound';

  const today = new Date(state.calendarDate || '2026-05-12');
  const isLate = (o) => o.shipBy && new Date(o.shipBy) < today && o.status !== 'delivered' && o.status !== 'paid';
  const daysLate = (o) => o.shipBy ? Math.max(0, Math.floor((today - new Date(o.shipBy)) / (1000*60*60*24))) : 0;

  // ─── Outbound: orders at ready/shipped/delivered ───
  const outOrders = state.orders.filter(o => OUTBOUND_STAGES.some(s => s.id === o.status));
  // ─── Inbound: purchase orders ───
  const inOrders = state.purchaseOrders;

  const searchQ = (state.search && state.search.shipping) || '';
  const outFiltered = outOrders.filter(o => matchesSearch(searchQ, searchOrderFields(o)));
  const inFiltered = inOrders.filter(po => {
    const sup = getSupplier(po.supplierId);
    return matchesSearch(searchQ, [
      po.id, po.asn, po.proNumber, po.dockDoor, po.status,
      sup && sup.name, sup && sup.category,
      ...(po.lineItems || []).flatMap(li => [li.sku, li.name])
    ]);
  });

  // KPI strip — varies by tab
  let kpiHtml;
  if (isOutbound) {
    const readyCt = outFiltered.filter(o => o.status === 'ready').length;
    const transitCt = outFiltered.filter(o => o.status === 'shipped').length;
    const deliveredCt = outFiltered.filter(o => o.status === 'delivered').length;
    const lateCt = outFiltered.filter(isLate).length;
    const totalPallets = outFiltered.reduce((s, o) => s + (o.palletCount || 0), 0);
    kpiHtml = `
      <div class="qc-kpi-strip">
        <div class="qc-kpi"><div class="qc-kpi-label">Ready to ship</div><div class="qc-kpi-value" style="color:#059669">${readyCt}</div><div class="qc-kpi-sub">awaiting pickup</div></div>
        <div class="qc-kpi"><div class="qc-kpi-label">In transit</div><div class="qc-kpi-value" style="color:#0891B2">${transitCt}</div><div class="qc-kpi-sub">en route to dealers</div></div>
        <div class="qc-kpi"><div class="qc-kpi-label">Delivered</div><div class="qc-kpi-value">${deliveredCt}</div><div class="qc-kpi-sub">signed and confirmed</div></div>
        <div class="qc-kpi"><div class="qc-kpi-label">Late</div><div class="qc-kpi-value" style="color:${lateCt > 0 ? 'var(--gl-danger)' : 'var(--gl-text)'}">${lateCt}</div><div class="qc-kpi-sub">past ship-by date</div></div>
        <div class="qc-kpi"><div class="qc-kpi-label">Pallets staged</div><div class="qc-kpi-value">${totalPallets}</div><div class="qc-kpi-sub">across all loads</div></div>
      </div>
    `;
  } else {
    const submittedCt = inFiltered.filter(po => po.status === 'submitted').length;
    const transitCt = inFiltered.filter(po => po.status === 'in-transit').length;
    const todayCt = inFiltered.filter(po => po.status === 'in-transit' && po.etaDays != null && po.etaDays <= 0).length;
    const receivedCt = inFiltered.filter(po => po.status === 'received' || po.status === 'closed').length;
    const totalCost = inFiltered.filter(po => po.status !== 'closed' && po.status !== 'received').reduce((s, po) => s + (po.totalCost || 0), 0);
    kpiHtml = `
      <div class="qc-kpi-strip">
        <div class="qc-kpi"><div class="qc-kpi-label">Submitted</div><div class="qc-kpi-value" style="color:#7C3AED">${submittedCt}</div><div class="qc-kpi-sub">awaiting supplier ack</div></div>
        <div class="qc-kpi"><div class="qc-kpi-label">In transit</div><div class="qc-kpi-value" style="color:#0891B2">${transitCt}</div><div class="qc-kpi-sub">en route from suppliers</div></div>
        <div class="qc-kpi"><div class="qc-kpi-label">Arriving today</div><div class="qc-kpi-value" style="color:${todayCt > 0 ? 'var(--gl-warn)' : 'var(--gl-text)'}">${todayCt}</div><div class="qc-kpi-sub">expected at dock</div></div>
        <div class="qc-kpi"><div class="qc-kpi-label">Received</div><div class="qc-kpi-value" style="color:#059669">${receivedCt}</div><div class="qc-kpi-sub">checked into inventory</div></div>
        <div class="qc-kpi"><div class="qc-kpi-label">Open value</div><div class="qc-kpi-value">${fmtMoney(totalCost)}</div><div class="qc-kpi-sub">material on order</div></div>
      </div>
    `;
  }

  // Build the kanban cols
  let columns, colOrdersMap, cardRenderer, totalLabel;
  if (isOutbound) {
    columns = OUTBOUND_STAGES;
    colOrdersMap = {};
    columns.forEach(c => colOrdersMap[c.id] = []);
    outFiltered.forEach(o => { if (colOrdersMap[o.status]) colOrdersMap[o.status].push(o); });
    cardRenderer = (o) => renderOutboundCard(o, daysLate(o), isLate(o));
    totalLabel = 'orders';
  } else {
    columns = INBOUND_STAGES;
    colOrdersMap = {};
    columns.forEach(c => colOrdersMap[c.id] = []);
    inFiltered.forEach(po => {
      // Map 'closed' into 'received' bucket
      const key = po.status === 'closed' ? 'received' : po.status;
      if (colOrdersMap[key]) colOrdersMap[key].push(po);
    });
    cardRenderer = (po) => renderInboundCard(po);
    totalLabel = 'POs';
  }

  const colsHtml = columns.map(c => {
    const orders = colOrdersMap[c.id];
    const colValue = isOutbound
      ? orders.reduce((s, o) => s + (o.value || 0), 0)
      : orders.reduce((s, po) => s + (po.totalCost || 0), 0);
    return `
      <div class="pipe-col" style="--col-color:${c.color};--col-tint:${c.tint}">
        <div class="pipe-col-head">
          <div class="pipe-col-head-row">
            <div class="pipe-col-title">
              <span class="pipe-col-dot" style="background:${c.color}"></span>
              <span class="pipe-col-label">${c.label}</span>
            </div>
            <span class="pipe-col-count">${orders.length}</span>
          </div>
          <div class="pipe-col-value">${orders.length > 0 ? fmtMoneyFull(colValue) : '—'}</div>
        </div>
        <div class="pipe-col-cards">
          ${orders.length === 0
            ? `<div class="pipe-col-empty">No ${totalLabel}</div>`
            : orders.map(cardRenderer).join('')}
        </div>
      </div>
    `;
  }).join('');

  const totalCount = isOutbound ? outFiltered.length : inFiltered.length;
  const subtitleText = isOutbound
    ? `${totalCount} orders in shipping pipeline · ready → in transit → delivered`
    : `${totalCount} purchase orders · ${state.suppliers.length} suppliers · submitted → ack → in transit → received`;

  slot.innerHTML = `
    ${renderBackButton ? renderBackButton() : ''}
    <div class="view-header">
      <div>
        <div class="view-title">Shipping &amp; Receiving</div>
        <div class="view-subtitle">${subtitleText}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        ${renderSearchBar('shipping', isOutbound ? 'Search PO, dealer, carrier…' : 'Search supplier, SKU, ASN…')}
        ${isOutbound
          ? `<button class="btn ghost" onclick="toast('BOL print queue (mock)')">↓ Print BOLs</button>`
          : `<button class="btn ghost" onclick="toast('Dock schedule (mock)')">📋 Dock schedule</button>`
        }
      </div>
    </div>

    <div class="subtabs" style="margin-bottom:12px">
      <button class="subtab ${tab === 'outbound' ? 'active' : ''}" onclick="state.shippingTab='outbound'; renderShipping()">Outbound · Shipping<span class="subtab-badge">${outOrders.filter(o => o.status !== 'delivered' && o.status !== 'paid').length}</span></button>
      <button class="subtab ${tab === 'inbound' ? 'active' : ''}" onclick="state.shippingTab='inbound'; renderShipping()">Inbound · Receiving<span class="subtab-badge">${inOrders.filter(po => po.status !== 'received' && po.status !== 'closed').length}</span></button>
    </div>

    ${kpiHtml}

    <div class="pipe-cols-wrap">
      <div class="pipe-cols" style="grid-template-columns:repeat(${columns.length}, minmax(0, 1fr))">
        ${colsHtml}
      </div>
    </div>
  `;
}

function renderOutboundCard(o, daysLateN, late) {
  const d = getDealer(o.dealerId);
  const stage = getStage(o.status);
  const carrier = o.carrier || {};
  const carrierBadge = carrier.logo
    ? `<span class="ship-carrier-badge" style="background:${carrier.color || '#0F172A'}1A;color:${carrier.color || '#0F172A'}">${carrier.logo}</span>`
    : '';

  // Per-status detail block
  let detailsHtml = '';
  let actionsHtml = '';
  if (o.status === 'ready') {
    detailsHtml = `
      <div class="ship-card-row"><span class="ship-card-label">Carrier</span><span class="ship-card-value">${carrierBadge}${carrier.name || '— not assigned'}</span></div>
      <div class="ship-card-row"><span class="ship-card-label">Dock</span><span class="ship-card-value">${o.dockDoor || '—'} · ${o.palletCount || '?'} pallet${o.palletCount === 1 ? '' : 's'}</span></div>
      <div class="ship-card-row"><span class="ship-card-label">BOL</span><span class="ship-card-value">${o.bolNumber || '—'}</span></div>
    `;
    actionsHtml = `<button class="btn primary sm" onclick="event.stopPropagation(); markShipped(${o.id})">→ Mark shipped</button>`;
  } else if (o.status === 'shipped') {
    detailsHtml = `
      <div class="ship-card-row"><span class="ship-card-label">Carrier</span><span class="ship-card-value">${carrierBadge}${carrier.name || '—'}</span></div>
      <div class="ship-card-row"><span class="ship-card-label">Tracking</span><span class="ship-card-value">${o.trackingNumber || '—'}</span></div>
      <div class="ship-card-row"><span class="ship-card-label">ETA</span><span class="ship-card-value">${o.eta ? fmtDateShort(o.eta) : '—'}${late ? ` <span style="color:var(--gl-danger);font-weight:700;margin-left:4px">${daysLateN}d late</span>` : ''}</span></div>
    `;
    actionsHtml = `<button class="btn primary sm" onclick="event.stopPropagation(); markDelivered(${o.id})">→ Mark delivered</button>`;
  } else if (o.status === 'delivered') {
    detailsHtml = `
      <div class="ship-card-row"><span class="ship-card-label">Carrier</span><span class="ship-card-value">${carrierBadge}${carrier.name || '—'}</span></div>
      <div class="ship-card-row"><span class="ship-card-label">Delivered</span><span class="ship-card-value" style="color:var(--gl-success);font-weight:700">✓ ${o.deliveredAt ? fmtDateShort(o.deliveredAt) : 'confirmed'}</span></div>
      <div class="ship-card-row"><span class="ship-card-label">BOL</span><span class="ship-card-value">${o.bolNumber || '—'}</span></div>
    `;
    actionsHtml = `<button class="btn ghost sm" onclick="event.stopPropagation(); toast('POD opened')">View POD</button>`;
  }

  return `
    <div class="pipeline-card ship-card ${late ? 'late' : ''}" style="--card-accent:${stage.color};--card-tint:${stage.tint || 'transparent'}" onclick="if (!event.target.closest('.qc-card-actions, button')) openOrderFullscreen(${o.id})">
      <div class="pipeline-card-head">
        <div class="pipeline-card-id">
          <span class="pipeline-card-units">${o.units}u</span>
          ${late ? `<span class="pipeline-card-late">${daysLateN}d late</span>` : ''}
        </div>
        <div class="pipeline-card-head-right">
          <button class="btn primary pipeline-card-hold-btn"
                  onclick="event.stopPropagation(); openPlaceHold(${o.id}, 'carrier')"
                  title="Flag this order on hold">⚑ Hold</button>
          <div class="pipeline-card-value">${fmtMoneyFull(o.value)}</div>
        </div>
      </div>
      <div class="pipeline-card-dealer">
        ${d ? `<span class="pipeline-card-dealer-avatar" style="background:${d.gradient}">${d.avatar}</span>${d.short}` : 'Direct customer'}
        <span class="pipeline-card-po-inline">${o.po}</span>
      </div>
      <div class="pipeline-card-project">${o.project}${o.shipBy ? ` <span class="pipeline-card-ship">· ship by ${fmtDateShort(o.shipBy)}</span>` : ''}</div>
      <div class="qc-card-details">${detailsHtml}</div>
      <div class="qc-card-actions">${actionsHtml}</div>
    </div>
  `;
}

function renderInboundCard(po) {
  const sup = getSupplier(po.supplierId);
  const stage = INBOUND_STAGES.find(s => s.id === (po.status === 'closed' ? 'received' : po.status)) || INBOUND_STAGES[0];
  const lineCount = (po.lineItems || []).length;

  // ETA pill
  let etaPill = '';
  if (po.status === 'in-transit' && po.etaDays != null) {
    if (po.etaDays < 0) etaPill = `<span class="ship-eta-pill late">${-po.etaDays}d overdue</span>`;
    else if (po.etaDays === 0) etaPill = `<span class="ship-eta-pill today">today</span>`;
    else if (po.etaDays <= 2) etaPill = `<span class="ship-eta-pill soon">in ${po.etaDays}d</span>`;
    else etaPill = `<span class="ship-eta-pill">in ${po.etaDays}d</span>`;
  }

  let detailsHtml = '';
  let actionsHtml = '';
  if (po.status === 'submitted') {
    detailsHtml = `
      <div class="ship-card-row"><span class="ship-card-label">Submitted</span><span class="ship-card-value">${po.submittedAt ? fmtDateShort(po.submittedAt) : '—'}</span></div>
      <div class="ship-card-row"><span class="ship-card-label">Lines</span><span class="ship-card-value">${lineCount} item${lineCount === 1 ? '' : 's'} · ${po.totalQty || '?'} units</span></div>
    `;
    actionsHtml = `<button class="btn ghost sm" onclick="event.stopPropagation(); toast('PO chase email queued')">✉ Chase supplier</button>`;
  } else if (po.status === 'acknowledged') {
    detailsHtml = `
      <div class="ship-card-row"><span class="ship-card-label">Ack'd</span><span class="ship-card-value">${po.ackdAt ? fmtDateShort(po.ackdAt) : '—'}</span></div>
      <div class="ship-card-row"><span class="ship-card-label">ETA</span><span class="ship-card-value">${po.expectedAt ? fmtDateShort(po.expectedAt) : '—'}</span></div>
      <div class="ship-card-row"><span class="ship-card-label">Lines</span><span class="ship-card-value">${lineCount} · ${po.totalQty || '?'} units</span></div>
    `;
    actionsHtml = `<button class="btn ghost sm" onclick="event.stopPropagation(); toast('PO details (mock)')">View PO</button>`;
  } else if (po.status === 'in-transit') {
    detailsHtml = `
      <div class="ship-card-row"><span class="ship-card-label">ETA</span><span class="ship-card-value">${po.expectedAt ? fmtDateShort(po.expectedAt) : '—'} ${etaPill}</span></div>
      <div class="ship-card-row"><span class="ship-card-label">Dock</span><span class="ship-card-value">${po.dockDoor || '—'} · ${po.palletCount || '?'} pallet${po.palletCount === 1 ? '' : 's'}</span></div>
      <div class="ship-card-row"><span class="ship-card-label">PRO</span><span class="ship-card-value">${po.proNumber || '—'}</span></div>
    `;
    actionsHtml = `<button class="btn primary sm" onclick="event.stopPropagation(); markPOReceived('${po.id}')">→ Mark received</button>`;
  } else if (po.status === 'received' || po.status === 'closed') {
    detailsHtml = `
      <div class="ship-card-row"><span class="ship-card-label">Received</span><span class="ship-card-value" style="color:var(--gl-success);font-weight:700">✓ ${po.receivedAt ? fmtDateShort(po.receivedAt) : 'confirmed'}</span></div>
      <div class="ship-card-row"><span class="ship-card-label">Lines</span><span class="ship-card-value">${lineCount} · ${po.totalQty || '?'} units checked in</span></div>
      <div class="ship-card-row"><span class="ship-card-label">ASN</span><span class="ship-card-value">${po.asn || '—'}</span></div>
    `;
    actionsHtml = `<button class="btn ghost sm" onclick="event.stopPropagation(); toast('Receipt opened')">View receipt</button>`;
  }

  return `
    <div class="pipeline-card ship-card po-card" style="--card-accent:${stage.color};--card-tint:${stage.tint || 'transparent'}" onclick="if (!event.target.closest('.qc-card-actions, button')) toast('Open PO ${po.id}')">
      <div class="pipeline-card-head">
        <div class="pipeline-card-id">
          <span class="pipeline-card-po">${po.id}</span>
          <span class="pipeline-card-units">${po.totalQty || '?'}u</span>
        </div>
        <div class="pipeline-card-value">${fmtMoneyFull(po.totalCost || 0)}</div>
      </div>
      <div class="pipeline-card-project">${sup ? sup.name : 'Supplier'}</div>
      <div class="pipeline-card-dealer">
        ${sup ? `<span class="pipeline-card-dealer-avatar" style="background:${sup.gradient || '#64748B'}">${sup.initials || '·'}</span>${sup.category || ''}` : '—'}
      </div>
      <div class="qc-card-details">${detailsHtml}</div>
      <div class="qc-card-actions">${actionsHtml}</div>
    </div>
  `;
}

/* Stage action helpers used by shipping cards */
function markShipped(orderId) {
  const o = getOrder(orderId);
  if (!o) return;
  openStageChangeConfirm(orderId, { kind: 'stage', from: o.status, to: 'shipped' });
}
function markDelivered(orderId) {
  const o = getOrder(orderId);
  if (!o) return;
  openStageChangeConfirm(orderId, { kind: 'stage', from: o.status, to: 'delivered' });
}
function markPOReceived(poId) {
  const po = state.purchaseOrders.find(p => p.id === poId);
  if (!po) return;
  po.status = 'received';
  po.receivedAt = new Date().toISOString().slice(0,10);
  toast(po.id + ' · received · ' + po.totalQty + ' units to inventory');
  if (state.currentView === 'shipping') renderShipping();
}

function renderQC() {
  const slot = $('qc-view');
  if (!slot) return;

  const searchQ = (state.search && state.search.qc) || '';
  const qcOrdersAll = state.orders.filter(o => o.status === 'qc');
  const qcOrders = qcOrdersAll.filter(o => matchesSearch(searchQ, searchOrderFields(o)));

  // Group orders by qc substage
  const colOrders = {};
  QC_SUBSTAGES.forEach(s => colOrders[s.id] = []);
  qcOrders.forEach(o => {
    const subId = o.qcStage && QC_SUBSTAGE_INDEX[o.qcStage] != null ? o.qcStage : 'awaiting';
    if (colOrders[subId]) colOrders[subId].push(o);
  });

  const today = new Date(state.calendarDate || '2026-05-12');
  const isLate = (o) => o.shipBy && new Date(o.shipBy) < today;
  const daysLate = (o) => {
    if (!o.shipBy) return 0;
    return Math.max(0, Math.floor((today - new Date(o.shipBy)) / (1000*60*60*24)));
  };

  // KPI strip across the top
  const totalUnits = qcOrders.reduce((sum, o) => sum + (o.units || 0), 0);
  const inspecting = colOrders['inspecting'].length;
  const rework = colOrders['rework'].length;
  const passed = colOrders['passed'].length;
  const awaiting = colOrders['awaiting'].length;
  const passRate = qcOrders.length === 0 ? null : Math.round((passed / qcOrders.length) * 100);

  const colsHtml = QC_SUBSTAGES.map(sub => {
    const orders = colOrders[sub.id];
    const colValue = orders.reduce((sum, o) => sum + (o.value || 0), 0);
    return `
      <div class="pipe-col" style="--col-color:${sub.color};--col-tint:${sub.tint}">
        <div class="pipe-col-head">
          <div class="pipe-col-head-row">
            <div class="pipe-col-title">
              <span class="pipe-col-dot" style="background:${sub.color}"></span>
              <span class="pipe-col-label">${sub.label}</span>
            </div>
            <span class="pipe-col-count">${orders.length}</span>
          </div>
          <div class="pipe-col-value">${orders.length > 0 ? fmtMoneyFull(colValue) : '—'}</div>
        </div>
        <div class="pipe-col-cards">
          ${orders.length === 0
            ? `<div class="pipe-col-empty">No orders</div>`
            : orders.map(o => renderQCCard(o, daysLate(o), isLate(o))).join('')}
        </div>
      </div>
    `;
  }).join('');

  slot.innerHTML = `
    ${renderBackButton ? renderBackButton() : ''}
    <div class="view-header">
      <div>
        <div class="view-title">QC inspection</div>
        <div class="view-subtitle">
          ${qcOrders.length} orders in QC · ${totalUnits} units · ${rework > 0 ? `<span style="color:var(--gl-danger);font-weight:600">${rework} need rework</span> · ` : ''}lead inspector: Dave Pereira
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        ${renderSearchBar('qc', 'Search PO, project, dealer…')}
        <button class="btn ghost" onclick="alert('QC checklist template editor — stub for demo')">Edit checklist</button>
      </div>
    </div>

    <!-- QC KPI strip -->
    <div class="qc-kpi-strip">
      <div class="qc-kpi"><div class="qc-kpi-label">Awaiting</div><div class="qc-kpi-value">${awaiting}</div><div class="qc-kpi-sub">${awaiting === 0 ? 'none queued' : 'units to inspect'}</div></div>
      <div class="qc-kpi"><div class="qc-kpi-label">Inspecting</div><div class="qc-kpi-value" style="color:var(--gl-warn)">${inspecting}</div><div class="qc-kpi-sub">on the table</div></div>
      <div class="qc-kpi"><div class="qc-kpi-label">Rework</div><div class="qc-kpi-value" style="color:var(--gl-danger)">${rework}</div><div class="qc-kpi-sub">${rework === 0 ? 'all clean' : 'need rework'}</div></div>
      <div class="qc-kpi"><div class="qc-kpi-label">Passed today</div><div class="qc-kpi-value" style="color:var(--gl-success)">${passed}</div><div class="qc-kpi-sub">ready to ship</div></div>
      <div class="qc-kpi"><div class="qc-kpi-label">Pass rate</div><div class="qc-kpi-value">${passRate == null ? '—' : passRate + '%'}</div><div class="qc-kpi-sub">across active QC</div></div>
    </div>

    <div class="pipe-cols-wrap">
      <div class="pipe-cols" style="grid-template-columns:repeat(${QC_SUBSTAGES.length}, minmax(0, 1fr))">
        ${colsHtml}
      </div>
    </div>
  `;
}

function renderQCCard(o, daysLateN, late) {
  const d = getDealer(o.dealerId);
  const inspector = getFactoryTeamMember(o.qcInspector || 'dave') || { name: 'Dave Pereira', initials: 'DP' };
  const subId = o.qcStage || 'awaiting';
  const passed = o.qcPassed || 0;
  const defs = o.qcDeficiencies || [];

  // Per-substage card details + actions
  let detailsHtml = '';
  let actionsHtml = '';
  if (subId === 'awaiting') {
    detailsHtml = `
      <div class="qc-card-row"><span class="qc-card-label">Queued</span><span class="qc-card-value">${o.units} units · awaiting inspector</span></div>
      <div class="qc-card-row"><span class="qc-card-label">Inspector</span><span class="qc-card-value">${esc(inspector.name)}</span></div>
    `;
    actionsHtml = `
      <button class="btn primary sm" onclick="event.stopPropagation(); startInspection(${o.id})">Start inspection</button>
    `;
  } else if (subId === 'inspecting') {
    const progressPct = o.units > 0 ? Math.round((passed / o.units) * 100) : 0;
    detailsHtml = `
      <div class="qc-card-row"><span class="qc-card-label">Inspector</span><span class="qc-card-value">${esc(inspector.name)} · live</span></div>
      <div class="qc-card-row"><span class="qc-card-label">Progress</span><span class="qc-card-value"><strong>${passed}</strong> of ${o.units} units passed</span></div>
      <div class="qc-progress"><div class="qc-progress-fill" style="width:${progressPct}%"></div></div>
    `;
    actionsHtml = `
      <button class="btn primary sm" onclick="event.stopPropagation(); markQCPassed(${o.id})">✓ Pass all</button>
      <button class="btn danger sm" onclick="event.stopPropagation(); flagQCDeficiency(${o.id})">⚑ Flag defect</button>
    `;
  } else if (subId === 'rework') {
    const def = defs[0] || { kind: 'general', note: 'Deficiency flagged · see notes' };
    const targetSub = routeReworkSubstage(o);
    const targetSubLabel = (PROD_SUBSTAGES.find(s => s.id === targetSub) || {}).label || targetSub;
    detailsHtml = `
      <div class="qc-card-defect">
        <div class="qc-card-defect-head">
          <span class="qc-card-defect-tag">DEFICIENCY · ${esc(def.kind)}</span>
          <span class="qc-card-defect-count">${defs.length || 1} unit${(defs.length || 1) === 1 ? '' : 's'}</span>
        </div>
        <div class="qc-card-defect-note">${esc(def.note)}</div>
        <div class="qc-card-defect-route">↪ routes to <strong>${esc(targetSubLabel)}</strong></div>
      </div>
      <div class="qc-card-row"><span class="qc-card-label">Inspector</span><span class="qc-card-value">${esc(inspector.name)}</span></div>
    `;
    actionsHtml = `
      <button class="btn primary sm" onclick="event.stopPropagation(); sendQCToRework(${o.id})">→ Send to ${esc(targetSubLabel)}</button>
      <button class="btn ghost sm" onclick="event.stopPropagation(); setQCSubstage(${o.id}, 'inspecting')">Re-inspect</button>
    `;
  } else if (subId === 'passed') {
    detailsHtml = `
      <div class="qc-card-row"><span class="qc-card-label">Result</span><span class="qc-card-value" style="color:var(--gl-success);font-weight:700">✓ All ${o.units} units passed</span></div>
      <div class="qc-card-row"><span class="qc-card-label">Inspector</span><span class="qc-card-value">${esc(inspector.name)}</span></div>
      <div class="qc-card-row"><span class="qc-card-label">Cleared</span><span class="qc-card-value">Ready for ship pipeline</span></div>
    `;
    actionsHtml = `
      <button class="btn primary sm" onclick="event.stopPropagation(); moveQCToReady(${o.id})">→ Ready to ship</button>
    `;
  }

  const qcSub = QC_SUBSTAGES.find(s => s.id === subId) || QC_SUBSTAGES[0];

  return `
    <div class="pipeline-card qc-card ${late ? 'late' : ''}" style="--card-accent:${qcSub.color};--card-tint:${qcSub.tint || 'transparent'}" onclick="if (!event.target.closest('.pipeline-card-actions, .qc-card-actions')) openOrderFullscreen(${o.id})">
      <div class="pipeline-card-head">
        <div class="pipeline-card-id">
          <span class="pipeline-card-units">${o.units}u</span>
          ${late ? `<span class="pipeline-card-late">${daysLateN}d late</span>` : ''}
        </div>
        <div class="pipeline-card-head-right">
          <button class="btn primary pipeline-card-hold-btn"
                  onclick="event.stopPropagation(); openPlaceHold(${o.id}, 'qc')"
                  title="Flag this order on hold">⚑ Hold</button>
          <div class="pipeline-card-value">${fmtMoneyFull(o.value)}</div>
        </div>
      </div>
      <div class="pipeline-card-dealer">
        ${d ? `<span class="pipeline-card-dealer-avatar" style="background:${d.gradient}">${d.avatar}</span>${d.short}` : 'Direct customer'}
        <span class="pipeline-card-po-inline">${o.po}</span>
      </div>
      <div class="pipeline-card-project">${o.project}${o.shipBy ? ` <span class="pipeline-card-ship">· ship by ${fmtDateShort(o.shipBy)}</span>` : ''}</div>

      <div class="qc-card-details">
        ${detailsHtml}
      </div>

      <div class="qc-card-actions">
        ${actionsHtml}
      </div>
    </div>
  `;
}

/* Local esc helper for the QC card (falls through to escapeHtml) */
function esc(s) { return escapeHtml(s == null ? '' : String(s)); }

function fmtDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ═══════════════════════════════════════════════════════════════════
   Per-tab search — every tab in the working area gets its own search
   input. State is keyed by scope so switching tabs preserves each tab's
   active query. Filters apply live, no submit needed.
   ═══════════════════════════════════════════════════════════════════ */

const SEARCH_RENDER_MAP = {
  overview: 'renderProduction',
  estimates: 'renderEstimates',
  production: 'renderPipeline',
  qc: 'renderQC',
  shipping: 'renderShipping',
  quotes: 'renderQuotes',
  catalog: 'renderCatalog',
  materials: 'renderMaterials'
};

function renderSearchBar(scope, placeholder) {
  const value = (state.search && state.search[scope]) || '';
  const hasValue = value.length > 0;
  return `
    <div class="page-search">
      <input
        id="search-input-${scope}"
        class="page-search-input"
        type="text"
        placeholder="${escapeHtml(placeholder || 'Search…')}"
        value="${escapeHtml(value)}"
        oninput="setSearch('${scope}', this.value)"
        onkeydown="if (event.key === 'Escape') { setSearch('${scope}', ''); }"
      />
      ${hasValue ? `<button class="page-search-clear" type="button" onclick="setSearch('${scope}', '')" title="Clear search">×</button>` : ''}
    </div>
  `;
}

function setSearch(scope, value) {
  state.search[scope] = value || '';
  const renderFn = SEARCH_RENDER_MAP[scope];
  if (renderFn && typeof window[renderFn] === 'function') {
    window[renderFn]();
    // Restore focus + caret position so typing keeps flowing
    const input = document.getElementById('search-input-' + scope);
    if (input) {
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }
}

/* Test whether an order/quote/etc matches a search query. Case-insensitive
   substring match across a list of relevant fields. Empty query → true. */
function matchesSearch(query, fields) {
  if (!query) return true;
  const q = String(query).toLowerCase().trim();
  if (!q) return true;
  for (const f of fields) {
    if (f == null) continue;
    if (String(f).toLowerCase().includes(q)) return true;
  }
  return false;
}

function searchOrderFields(o) {
  const d = getDealer(o.dealerId);
  return [
    o.po, o.project, o.dealerPO, o.factoryOrderNumber,
    o.status, o.prodStage, o.qcStage,
    d && d.name, d && d.short, d && d.city,
    o.value && ('$' + o.value),
    o.units && (o.units + ' units')
  ];
}

function renderProduction() {
  // FULLSCREEN ORDER DETAIL — overrides everything else when active
  if (state.orderDetailFullscreen && state.selectedOrderId) {
    const o = getOrder(state.selectedOrderId);
    if (o) {
      $('production-view').innerHTML = renderFullscreenOrderDetail(o);
      return;
    }
    // Order not found, fall through and clear the flag
    state.orderDetailFullscreen = false;
  }

  const tab = state.productionTab;
  const newPOs = state.orders.filter(o => o.status === 'new').length;
  const rushPending = state.rushRequests.filter(r => r.status === 'REQUESTED').length;
  const warrantyOpen = state.warrantyClaims.filter(w => w.status !== 'RESOLVED' && w.status !== 'DECLINED').length;
  const qcFailures = state.qcInspections.filter(q => q.status === 'failed').length;
  const approvalsCount = state.approvals.length;
  const drawingsAction = state.drawingsLibrary.filter(d => d.status === 'in-review' || d.status === 'revise').length;
  const issuesCount = warrantyOpen + state.rmas.filter(r => r.status !== 'approved').length + state.damageEvents.length;
  const tasksCount = rushPending + qcFailures + approvalsCount + drawingsAction;

  let content = '';
  if (tab === 'live') content = renderKanban();
  else if (tab === 'orders') content = renderOrdersTable();
  else if (tab === 'quotes') content = renderQuotesInOrders();
  else if (tab === 'tasks') content = renderTasksPage();
  else if (tab === 'issues') content = renderIssuesPage();
  else if (tab === 'planning') content = renderPlanningPage();
  // Legacy direct-tab routes (kept for deep links / search / notifications)
  else if (tab === 'kanban') content = renderKanban();
  else if (tab === 'calendar') content = renderCalendar();
  else if (tab === 'rush') content = renderRushQueue();
  else if (tab === 'warranty') content = renderWarrantyQueue();
  else if (tab === 'stages') content = renderStageConfig();
  else if (tab === 'drawings') content = renderDrawingsTab();
  else if (tab === 'shipments') content = renderShipmentsTable();
  else if (tab === 'qc') content = renderQCTab();
  else if (tab === 'approvals') content = renderApprovalsTab();
  else if (tab === 'rma') content = renderRMATab();
  else if (tab === 'capacity') content = renderCapacityPlanner();
  else if (tab === 'damage') content = renderDamageScrap();
  else if (tab === 'samples') content = renderSamplesTab();
  else if (tab === 'materials') content = renderMaterialsOverview();
  else { content = renderKanban(); state.productionTab = 'live'; }

  $('production-view').innerHTML = `
    <div class="overview-topbar">
      ${renderBackButton()}
      <div style="flex:1"></div>
      ${renderSearchBar('overview', 'Search PO, project, dealer…')}
      <button class="btn ghost sm">↑ Export</button>
    </div>

    <div class="overview-tabs-row">
      <div class="subtabs">
        <button class="subtab ${tab === 'live' || tab === 'kanban' ? 'active' : ''}" onclick="setProductionTab('live')">Live</button>
        <button class="subtab ${tab === 'orders' ? 'active' : ''}" onclick="setProductionTab('orders')">All orders<span class="subtab-badge">${state.orders.length}</span></button>
      </div>
      ${(() => {
        const reorderCount = (state.inventory || []).filter(i => i.onHand <= (i.reorderPoint || 0)).length;
        const isActive = tab === 'materials';
        const badgeHtml = reorderCount > 0
          ? `<span class="ov-materials-btn-badge">${reorderCount}</span>`
          : '';
        return `<button class="btn ${isActive ? 'primary' : 'ghost'} ov-materials-btn"
                        onclick="setProductionTab('${isActive ? 'live' : 'materials'}')"
                        title="${isActive ? 'Back to Live orders' : 'View materials & inbound POs'}">
                  📦 Materials${badgeHtml}
                </button>`;
      })()}
    </div>

    ${content}
  `;
}

/* Composite renderers — stack related content in one scroll page */

function renderTasksPage() {
  // Drawings + QC + Approvals + Rush all in one place
  return `
    <div style="display:flex;gap:10px;margin-bottom:16px;padding:10px 14px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute)">
      <span>Jump to:</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('s-drawings').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">📋 Drawings (${state.drawingsLibrary.filter(d => d.status === 'in-review' || d.status === 'revise').length})</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('s-qc').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">🔍 QC (${state.qcInspections.filter(q => q.status === 'in-progress' || q.status === 'failed').length})</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('s-approvals').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">📋 Approvals (${state.approvals.length})</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('s-rush').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">⚡ Rush (${state.rushRequests.filter(r => r.status === 'REQUESTED').length})</a>
    </div>

    <h2 id="s-drawings" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:18px 0 12px">Drawings awaiting action</h2>
    ${renderDrawingsTab()}

    <h2 id="s-qc" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Quality control</h2>
    ${renderQCTab()}

    <h2 id="s-approvals" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Pending approvals</h2>
    ${renderApprovalsTab()}

    <h2 id="s-rush" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Rush requests</h2>
    ${renderRushQueue()}
  `;
}

function renderIssuesPage() {
  // Warranty + RMA + Damage
  return `
    <div style="display:flex;gap:10px;margin-bottom:16px;padding:10px 14px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute)">
      <span>Jump to:</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('s-warranty').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">⚠ Warranty (${state.warrantyClaims.filter(w => w.status !== 'RESOLVED' && w.status !== 'DECLINED').length})</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('s-rma').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">↩ Returns / RMA (${state.rmas.length})</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('s-damage').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">💥 Damage / scrap (${state.damageEvents.length})</a>
    </div>

    <h2 id="s-warranty" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:18px 0 12px">Warranty claims</h2>
    ${renderWarrantyQueue()}

    <h2 id="s-rma" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Returns &amp; RMAs</h2>
    ${renderRMATab()}

    <h2 id="s-damage" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Damage &amp; scrap</h2>
    ${renderDamageScrap()}
  `;
}

function renderPlanningPage() {
  // Calendar + Capacity + Shipments + Samples + Stages
  return `
    <div style="display:flex;gap:10px;margin-bottom:16px;padding:10px 14px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute)">
      <span>Jump to:</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('s-capacity').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">📊 Capacity</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('s-calendar').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">📅 Calendar</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('s-shipments').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">🚚 Shipments</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('s-samples').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">📦 Samples</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('s-stages').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">⚙ Stage config</a>
    </div>

    <h2 id="s-capacity" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:18px 0 12px">Capacity planner</h2>
    ${renderCapacityPlanner()}

    <h2 id="s-calendar" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Production calendar</h2>
    ${renderCalendar()}

    <h2 id="s-shipments" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Shipments</h2>
    ${renderShipmentsTable()}

    <h2 id="s-samples" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Sample loans</h2>
    ${renderSamplesTab()}

    <h2 id="s-stages" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Stage configuration</h2>
    ${renderStageConfig()}
  `;
}

function renderQuotesInOrders() { return ''; /* unused — Quotes tab redirects via switchView */ }

/* ════════════════════════════════════════════════
   PRODUCTION CALENDAR — month / week / day views
   ════════════════════════════════════════════════ */

function renderCalendar() {
  const view = state.calendarView;
  const anchor = new Date(state.calendarDate + 'T00:00:00');

  let titleText, prevFn, nextFn, body;
  if (view === 'month') {
    titleText = anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    prevFn = `calNav(-1, 'month')`;
    nextFn = `calNav(1, 'month')`;
    body = renderCalendarMonth(anchor);
  } else if (view === 'week') {
    const ws = startOfWeek(anchor);
    const we = new Date(ws); we.setDate(ws.getDate() + 6);
    if (ws.getMonth() === we.getMonth()) {
      titleText = ws.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + ' – ' + we.getDate() + ', ' + we.getFullYear();
    } else {
      titleText = ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' – ' + we.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    prevFn = `calNav(-1, 'week')`;
    nextFn = `calNav(1, 'week')`;
    body = renderCalendarWeek(anchor);
  } else {
    titleText = anchor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    prevFn = `calNav(-1, 'day')`;
    nextFn = `calNav(1, 'day')`;
    body = renderCalendarDay(anchor);
  }

  // Period stats — orders + tasks in the visible range
  const rangeOrders = calOrdersInView(anchor, view);
  const totalUnits = rangeOrders.reduce((s, o) => s + o.units, 0);
  const lateCount = rangeOrders.filter(o => dateLabel(o.shipBy).late).length;
  const rangeTasks = calTasksInView(anchor, view);
  const urgentTaskCount = rangeTasks.filter(t => t.priority === 'urgent').length;

  return `
    <div class="cal-toolbar">
      <div class="cal-nav">
        <button class="cal-nav-btn" onclick="${prevFn}" title="Previous">‹</button>
        <button class="cal-nav-btn" onclick="calToday()" style="width:auto;padding:0 16px;font-size:13.5px;font-weight:500">Today</button>
        <button class="cal-nav-btn" onclick="${nextFn}" title="Next">›</button>
      </div>
      <div class="cal-title">${titleText}</div>

      <div class="cal-view-toggle">
        <button class="cal-view-btn ${view === 'month' ? 'active' : ''}" onclick="state.calendarView='month'; calRerender()">Month</button>
        <button class="cal-view-btn ${view === 'week' ? 'active' : ''}" onclick="state.calendarView='week'; calRerender()">Week</button>
        <button class="cal-view-btn ${view === 'day' ? 'active' : ''}" onclick="state.calendarView='day'; calRerender()">Day</button>
      </div>

      <div style="flex:1"></div>

      <div class="cal-toolbar-stat"><span class="pip" style="background:var(--gl-info)"></span><strong>${rangeOrders.length}</strong> orders</div>
      <span style="color:var(--gl-text-faint);font-size:11px">·</span>
      <div class="cal-toolbar-stat"><strong>${totalUnits}</strong> units</div>
      ${rangeTasks.length > 0 ? `
        <span style="color:var(--gl-text-faint);font-size:11px">·</span>
        <div class="cal-toolbar-stat" style="${urgentTaskCount > 0 ? 'color:var(--gl-danger)' : ''}"><span class="pip" style="background:${urgentTaskCount > 0 ? 'var(--gl-danger)' : 'var(--gl-warn)'}"></span><strong>${rangeTasks.length}</strong> task${rangeTasks.length===1?'':'s'}${urgentTaskCount > 0 ? ` (${urgentTaskCount} urgent)` : ''}</div>
      ` : ''}
      ${lateCount > 0 ? `
        <span style="color:var(--gl-text-faint);font-size:11px">·</span>
        <div class="cal-toolbar-stat" style="color:var(--gl-danger)"><span class="pip" style="background:var(--gl-danger)"></span><strong>${lateCount}</strong> late</div>
      ` : ''}
    </div>

    ${body}
  `;
}

function renderCalendarMonth(anchor) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startDow = firstOfMonth.getDay();  // 0 = Sun

  // Days in this month
  const lastOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastOfMonth.getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = isoDate(today);

  const days = [];

  // Leading empty cells before day 1 to keep weekday alignment
  for (let i = 0; i < startDow; i++) {
    days.push(`<div class="cal-day empty-cell"></div>`);
  }

  // Actual days of the month
  for (let dnum = 1; dnum <= daysInMonth; dnum++) {
    const day = new Date(year, month, dnum);
    const dayStr = isoDate(day);
    const isToday = dayStr === todayStr;
    const dow = day.getDay();
    const isWeekend = dow === 0 || dow === 6;

    const ordersOnDay = state.orders.filter(o => o.shipBy === dayStr);
    const tasksOnDay = (state.calendarTasks || []).filter(t => t.date === dayStr);

    // Decide how many of each to show inline given the cell can only fit ~4 items
    const maxOrders = tasksOnDay.length > 0 ? 2 : 3;
    const maxTasks  = ordersOnDay.length > 0 ? 2 : 3;
    const ordersHtml = ordersOnDay.slice(0, maxOrders).map(o => calOrderPill(o, 'day')).join('');
    const tasksHtml  = tasksOnDay.slice(0, maxTasks).map(t => calTaskChip(t)).join('');
    const moreCount = (ordersOnDay.length - Math.min(maxOrders, ordersOnDay.length))
                    + (tasksOnDay.length  - Math.min(maxTasks,  tasksOnDay.length));

    days.push(`
      <div class="cal-day ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}"
           onclick="calSelectDay('${dayStr}')">
        <div class="cal-day-head">
          <span class="cal-day-num">${dnum}</span>
          ${tasksOnDay.length > 0 ? `<span class="cal-day-task-count" title="${tasksOnDay.length} task${tasksOnDay.length===1?'':'s'}">${tasksOnDay.length}</span>` : ''}
        </div>
        ${ordersHtml}
        ${tasksHtml}
        ${moreCount > 0 ? `<div class="cal-more" onclick="event.stopPropagation(); calSelectDay('${dayStr}')">+${moreCount} more</div>` : ''}
      </div>
    `);
  }

  // Trailing empty cells to complete the final row (only if needed for visual closure)
  const totalCells = days.length;
  const trailing = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < trailing; i++) {
    days.push(`<div class="cal-day empty-cell"></div>`);
  }

  return `
    <div class="cal-month">
      <div class="cal-weekdays">
        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="cal-weekday">${d}</div>`).join('')}
      </div>
      <div class="cal-grid">${days.join('')}</div>
    </div>

    ${renderCalendarLegend()}
  `;
}

function renderCalendarLegend() {
  const stages = ['new', 'ack', 'production', 'ready', 'shipped', 'delivered'];

  return `
    <div class="cal-legend">
      <div class="cal-legend-section">
        <div class="cal-legend-section-label">Production stage</div>
        <div class="cal-legend-items">
          ${stages.map(s => {
            const meta = CAL_STAGE_COLORS[s];
            return `
              <div class="cal-legend-item">
                <span class="cal-legend-stage" style="--cal-dealer-color:${meta.color};--cal-dealer-bg:${meta.bg}"></span>
                <span class="cal-legend-name">${meta.label}</span>
              </div>
            `;
          }).join('')}
          <div class="cal-legend-item">
            <span class="cal-legend-stage late-swatch"></span>
            <span class="cal-legend-name">Late</span>
          </div>
        </div>
      </div>

      <div class="cal-legend-section">
        <div class="cal-legend-section-label">Owner tasks</div>
        <div class="cal-legend-items">
          <div class="cal-legend-item">
            <span class="cal-legend-task-swatch urgent">!</span>
            <span class="cal-legend-name">Urgent</span>
          </div>
          <div class="cal-legend-item">
            <span class="cal-legend-task-swatch warn">!</span>
            <span class="cal-legend-name">Important</span>
          </div>
          <div class="cal-legend-item">
            <span class="cal-legend-task-swatch normal">·</span>
            <span class="cal-legend-name">Routine</span>
          </div>
        </div>
      </div>

      <div class="cal-legend-section">
        <div class="cal-legend-section-label">Navigate</div>
        <div class="cal-legend-tips">
          <div class="cal-legend-tip"><span class="cal-legend-tip-key">Click a day</span><span class="cal-legend-tip-arrow">→</span>Day view</div>
          <div class="cal-legend-tip"><span class="cal-legend-tip-key">Click a PO</span><span class="cal-legend-tip-arrow">→</span>Open order detail</div>
          <div class="cal-legend-tip"><span class="cal-legend-tip-key">Click a task</span><span class="cal-legend-tip-arrow">→</span>Jump to action</div>
        </div>
      </div>
    </div>
  `;
}

function renderCalendarWeek(anchor) {
  const ws = startOfWeek(anchor);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = isoDate(today);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(ws);
    day.setDate(ws.getDate() + i);
    const dayStr = isoDate(day);
    const isToday = dayStr === todayStr;
    const dow = day.getDay();
    const isWeekend = dow === 0 || dow === 6;

    const ordersOnDay = state.orders.filter(o => o.shipBy === dayStr);

    days.push(`
      <div class="cal-week-day ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}">
        <div class="cal-week-day-head clickable" onclick="calSelectDay('${dayStr}')" title="Open day view for ${day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}">
          <div class="cal-week-dow">${day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
          <div class="cal-week-num">${day.getDate()}</div>
        </div>
        ${ordersOnDay.length === 0 ? `<div class="cal-week-empty">—</div>` :
          ordersOnDay.map(o => calOrderPill(o, 'week')).join('')}
      </div>
    `);
  }

  return `
    <div class="cal-week">
      <div class="cal-week-grid">${days.join('')}</div>
    </div>
  `;
}

function renderCalendarDay(anchor) {
  const dayStr = isoDate(anchor);
  const holdsOnDay = (state.holds || []).filter(h => h.date === dayStr);
  const tasksOnDay = (state.calendarTasks || []).filter(t => t.date === dayStr);
  const urgentHolds = holdsOnDay.filter(h => h.daysOnHold >= 5).length;

  if (holdsOnDay.length === 0 && tasksOnDay.length === 0) {
    return `
      <div class="cal-day-view">
        <div class="cal-day-view-head">
          <div class="cal-day-view-meta">No holds or tasks for this day</div>
        </div>
        <div style="text-align:center;padding:50px 20px;color:var(--gl-text-faint)">
          <div style="font-size:40px;opacity:0.4;margin-bottom:10px">📅</div>
          <div style="font-size:14px;font-weight:500;color:var(--gl-text);letter-spacing:-0.015em">All clear</div>
          <div style="font-size:12.5px;margin-top:4px">No on-hold orders or pending decisions.</div>
        </div>
      </div>
    `;
  }

  // Build summary line
  const summaryParts = [];
  if (holdsOnDay.length > 0) summaryParts.push(`${holdsOnDay.length} order${holdsOnDay.length === 1 ? '' : 's'} on hold${urgentHolds > 0 ? ` · ${urgentHolds} stalled 5d+` : ''}`);
  if (tasksOnDay.length > 0) {
    const open = tasksOnDay.filter(t => !t.completed).length;
    const done = tasksOnDay.length - open;
    if (open > 0) summaryParts.push(`${open} task${open === 1 ? '' : 's'} need attention${done > 0 ? ` · ${done} done` : ''}`);
    else if (done > 0) summaryParts.push(`${done} task${done === 1 ? '' : 's'} done`);
  }

  // Sort: open urgent → open warn → open normal → completed
  const sortedTasks = [...tasksOnDay].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const order = { urgent: 0, warn: 1, normal: 2 };
    return (order[a.priority] || 2) - (order[b.priority] || 2);
  });

  const openCount = tasksOnDay.filter(t => !t.completed).length;
  const urgentCount = tasksOnDay.filter(t => t.priority === 'urgent' && !t.completed).length;

  const tasksSection = tasksOnDay.length > 0 ? `
    <div class="cal-day-view-section">
      <div class="cal-day-view-section-head">
        <div class="cal-day-view-section-title-group">
          <h2 class="cal-day-view-section-title urgent">Urgent</h2>
          <span class="cal-day-view-section-count urgent">${openCount > 0 ? openCount : tasksOnDay.length}</span>
        </div>
        <div class="cal-day-view-section-meta">
          ${openCount > 0
            ? `<span class="cal-day-view-section-sub">${openCount} need your attention</span>`
            : `<span class="cal-day-view-section-sub" style="color:var(--gl-success)">✓ All tasks complete</span>`}
        </div>
      </div>
      <div class="cal-task-rows">
        ${sortedTasks.map(t => calTaskRow(t)).join('')}
      </div>
    </div>
  ` : '';

  // Sort holds: longest-stalled first (most urgent follow-up)
  const sortedHolds = [...holdsOnDay].sort((a, b) => b.daysOnHold - a.daysOnHold);

  const holdsSection = holdsOnDay.length > 0 ? `
    <div class="cal-day-view-section">
      <div class="cal-day-view-section-head">
        <div class="cal-day-view-section-title-group">
          <h2 class="cal-day-view-section-title">On hold</h2>
          <span class="cal-day-view-section-count">${holdsOnDay.length}</span>
        </div>
        <div class="cal-day-view-section-meta">
          <span class="cal-day-view-section-sub">${holdsOnDay.length} need follow-up</span>
          ${urgentHolds > 0 ? `<span class="cal-day-view-urgent-badge">${urgentHolds} stalled 5d+</span>` : ''}
        </div>
      </div>
      ${sortedHolds.map(h => {
        const o = getOrder(h.orderId);
        if (!o) return '';
        const d = getDealer(o.dealerId);
        const blocker = HOLD_BLOCKER_META[h.blocker] || { label: h.blocker, color: '#64748B', icon: '•' };
        const isUrgent = h.daysOnHold >= 5;
        return `
          <div class="cal-day-hold-row" onclick="openOrderFromCalendar(${h.orderId})">
            <div class="cal-day-hold-pip" style="background:${blocker.color}"></div>
            <div class="cal-day-hold-order">
              <div class="cal-day-list-po">${d.short} <span class="cal-day-list-po-num">${o.po}</span></div>
              <div class="cal-day-list-meta">${o.project} · ${o.units}u</div>
            </div>
            <div class="cal-day-hold-stage">
              <div class="cal-day-hold-stage-label">Stalled at <strong>${h.stageLabel}</strong></div>
              <div class="cal-day-hold-stage-reason">${h.reason}</div>
            </div>
            <div class="cal-day-hold-followup">
              <span class="cal-day-hold-blocker" style="--blocker-color:${blocker.color}">
                <span class="cal-day-hold-blocker-icon">${blocker.icon}</span>${blocker.label}
              </span>
              <div class="cal-day-hold-followup-target">${h.followUp}</div>
            </div>
            <div class="cal-day-hold-days ${isUrgent ? 'urgent' : ''}">
              <div class="cal-day-hold-days-num">${h.daysOnHold}d</div>
              <div class="cal-day-hold-days-label">on hold</div>
            </div>
            <div style="text-align:right;font-size:11.5px;color:var(--gl-text-mute)">Open order →</div>
          </div>
        `;
      }).join('')}
    </div>
  ` : '';

  return `
    <div class="cal-day-view">
      <div class="cal-day-view-head">
        <div class="cal-day-view-meta">${summaryParts.join(' · ')}</div>
      </div>
      ${tasksSection}
      ${holdsSection}
    </div>
  `;
}

/* Stage color map — kept in sync with the legend.
   Stage color values match the existing status-pill tokens. */
const CAL_STAGE_COLORS = {
  new:        { label: 'New PO',         color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.10)' },
  ack:        { label: 'Acknowledged',   color: '#0F172A', bg: 'rgba(15, 23, 42, 0.08)' },
  production: { label: 'In production',  color: '#D97706', bg: 'rgba(217, 119, 6, 0.10)' },
  ready:      { label: 'Ready to ship',  color: '#047857', bg: 'rgba(4, 120, 87, 0.10)' },
  shipped:    { label: 'Shipped',        color: '#0E7490', bg: 'rgba(14, 116, 144, 0.10)' },
  delivered:  { label: 'Delivered',      color: '#64748B', bg: 'rgba(100, 116, 139, 0.10)' }
};

/* Task kind → label + icon glyph. Owner-action items that appear on the calendar. */
const CAL_TASK_META = {
  'approve-discount': { label: 'Discount',  short: 'Discount approval',  icon: '%',  group: 'approval' },
  'approve-po':       { label: 'PO',        short: 'PO over threshold',  icon: '$',  group: 'approval' },
  'approve-warranty': { label: 'Warranty',  short: 'Warranty remake',    icon: '⚠',  group: 'approval' },
  'approve-rush':     { label: 'Rush',      short: 'Rush request',       icon: '⚡', group: 'approval' },
  'approve-dealer':   { label: 'Dealer',    short: 'Dealer decision',    icon: '+',  group: 'approval' },
  'approve-price':    { label: 'Pricing',   short: 'Pricing change',     icon: '↗',  group: 'approval' },
  'review-qc':        { label: 'QC',        short: 'QC review',          icon: '✓',  group: 'review' },
  'review-drawing':   { label: 'Drawing',   short: 'Drawing review',     icon: '◫',  group: 'review' },
  'triage-warranty':  { label: 'Warranty',  short: 'Warranty triage',    icon: '!',  group: 'review' },
  'machine-repair':   { label: 'Machine',   short: 'Machine service',    icon: '⚙',  group: 'ops' },
  'contract-renewal': { label: 'Contract',  short: 'Contract review',    icon: '§',  group: 'ops' }
};

/* Blocker type → label + color. Drives the colored tag on each on-hold row,
   so the owner can see at a glance who they need to chase. */
const HOLD_BLOCKER_META = {
  dealer:    { label: 'Dealer',    color: '#7C3AED', icon: '◐' },
  supplier:  { label: 'Supplier',  color: '#D97706', icon: '◫' },
  qc:        { label: 'QC',        color: '#0E7490', icon: '✓' },
  installer: { label: 'Installer', color: '#047857', icon: '⌂' },
  carrier:   { label: 'Carrier',   color: '#0F172A', icon: '▸' },
  customer:  { label: 'Customer',  color: '#B91C1C', icon: '◉' },
  machine:   { label: 'Machine',   color: '#B45309', icon: '⚙' }
};

function calTaskChip(t) {
  const meta = CAL_TASK_META[t.kind] || { label: 'Task', short: 'Task', icon: '•', group: 'ops' };
  return `
    <div class="cal-task cal-task-${t.priority || 'normal'}"
         onclick="event.stopPropagation(); openCalendarTask('${t.id}')"
         title="${meta.short} · ${t.title}${t.detail ? ' · ' + t.detail : ''}">
      <span class="cal-task-icon">${meta.icon}</span>
      <span class="cal-task-title">${t.title}</span>
    </div>
  `;
}

function calTaskRow(t) {
  // Day-view task row — checkbox is a status indicator, NOT a manual toggle.
  // Tasks auto-complete when the underlying action is taken (approve discount,
  // release drawing, run QC, etc). See autoCompleteTask().
  const meta = CAL_TASK_META[t.kind] || { label: 'Task', short: 'Task', group: 'ops' };
  const isCompleted = !!t.completed;
  const priorityClass = isCompleted ? 'completed' : (t.priority || 'normal');

  return `
    <div class="cal-task-row cal-task-${priorityClass}"
         onclick="openCalendarTask('${t.id}')">
      <div class="cal-task-row-status ${isCompleted ? 'checked' : ''}" aria-hidden="true">
        ${isCompleted ? `
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
            <path d="M3 8.5 7 12 13 4"/>
          </svg>
        ` : ''}
      </div>
      <div class="cal-task-row-body">
        <div class="cal-task-row-title">${t.title}</div>
        ${t.detail ? `<div class="cal-task-row-detail">${t.detail}</div>` : ''}
      </div>
      <div class="cal-task-row-meta">
        <span class="cal-task-row-kind">${isCompleted ? 'Completed' : meta.short}</span>
        <span class="cal-task-row-action">${isCompleted ? (t.completedAt || 'Done') : 'Click to take action →'}</span>
      </div>
    </div>
  `;
}

/* Auto-complete tasks whose source action has been taken.
   Called by approve/release/QC/etc handlers across the app.
   Tasks complete on `kind` + optional `orderId` match. */
function autoCompleteTask(kind, opts = {}) {
  const tasks = state.calendarTasks || [];
  const matchOrderId = opts.orderId;
  const note = opts.note;
  const updated = [];
  tasks.forEach(t => {
    if (t.completed) return;
    if (t.kind !== kind) return;
    if (matchOrderId != null && t.orderId != null && t.orderId !== matchOrderId) return;
    t.completed = true;
    t.completedAt = note || (new Date()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    updated.push(t);
  });
  if (updated.length > 0) {
    // Audit trail
    updated.forEach(t => {
      state.auditEvents.unshift({
        id: state.auditEvents.length + 1, kind: 'task.completed',
        actor: state.user.name, initials: state.user.initials,
        tenantId: 'northforge', scope: 'own', at: 'just now',
        target: t.title, meta: `${t.kind} auto-completed`
      });
    });
    // Re-render if the calendar is visible
    if (state.currentView === 'dashboard' || state.currentView === 'production') calRerender();
  }
  return updated;
}

function openCalendarTask(taskId) {
  const t = (state.calendarTasks || []).find(x => x.id === taskId);
  if (!t) return;
  // If the task is linked to an order, open the order
  if (t.orderId) {
    openOrderFromCalendar(t.orderId);
    return;
  }
  // Otherwise navigate to the relevant view/tab
  if (t.link) {
    if (t.link.tab) {
      if (t.link.view === 'production') state.productionTab = t.link.tab;
      else if (t.link.view === 'materials') state.materialsTab = t.link.tab;
      else if (t.link.view === 'catalog') state.catalogTab = t.link.tab;
      else if (t.link.view === 'settings') state.settingsTab = t.link.tab;
    }
    switchView(t.link.view);
  }
}

function calOrderPill(o, viewMode) {
  const d = getDealer(o.dealerId);
  const di = dateLabel(o.shipBy);
  const isLate = di.late;
  const stage = CAL_STAGE_COLORS[o.status] || CAL_STAGE_COLORS.new;
  const stageColor = stage.color;
  const stageBg = stage.bg;

  if (viewMode === 'day') {
    return `
      <div class="cal-order ${isLate ? 'late' : ''} ${o.status === 'delivered' ? 'delivered' : ''}"
           style="--cal-dealer-color:${stageColor};--cal-dealer-bg:${stageBg}"
           onclick="event.stopPropagation(); openOrderFromCalendar(${o.id})"
           title="${o.po} · ${o.project} · ${stage.label} · ${o.units}u · click to open">
        <span class="cal-order-po">${o.po.replace('O-', '')}</span>
        <span class="cal-order-project">${o.project}</span>
        <span class="cal-order-units">${o.units}u</span>
      </div>
    `;
  } else {  // week
    return `
      <div class="cal-week-order ${isLate ? 'late' : ''}"
           style="--cal-dealer-color:${stageColor};--cal-dealer-bg:${stageBg}"
           onclick="openOrderFromCalendar(${o.id})">
        <div class="cal-week-order-po">${o.po}</div>
        <div class="cal-week-order-proj">${o.project}</div>
        <div class="cal-week-order-meta">
          <span class="cal-dealer-pip" style="background:${stageColor}"></span>
          <span>${stage.label}</span>
          <span style="color:var(--gl-text-faint)">·</span>
          <span style="font-weight:500">${o.units}u</span>
          ${isLate ? `<span style="color:var(--gl-danger);font-weight:600;margin-left:auto">${di.label}</span>` : ''}
        </div>
      </div>
    `;
  }
}

/* Calendar nav helpers */
function calRerender() {
  // Re-render the view that's currently showing the calendar
  if (state.currentView === 'dashboard') renderDashboard();
  else renderProduction();
}

function calNav(delta, view) {
  const d = new Date(state.calendarDate + 'T00:00:00');
  if (view === 'month') d.setMonth(d.getMonth() + delta);
  else if (view === 'week') d.setDate(d.getDate() + delta * 7);
  else d.setDate(d.getDate() + delta);
  state.calendarDate = isoDate(d);
  calRerender();
}

function calToday() {
  state.calendarDate = isoDate(new Date());
  calRerender();
}

function calSelectDay(dayStr) {
  state.calendarDate = dayStr;
  state.calendarView = 'day';
  calRerender();
}

function calOrdersInView(anchor, view) {
  if (view === 'day') {
    const dayStr = isoDate(anchor);
    return state.orders.filter(o => o.shipBy === dayStr);
  }
  if (view === 'week') {
    const ws = startOfWeek(anchor);
    const we = new Date(ws); we.setDate(ws.getDate() + 6);
    const wsStr = isoDate(ws), weStr = isoDate(we);
    return state.orders.filter(o => o.shipBy >= wsStr && o.shipBy <= weStr);
  }
  // month
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  return state.orders.filter(o => {
    const d = new Date(o.shipBy + 'T00:00:00');
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

function calTasksInView(anchor, view) {
  const tasks = state.calendarTasks || [];
  if (view === 'day') {
    const dayStr = isoDate(anchor);
    return tasks.filter(t => t.date === dayStr);
  }
  if (view === 'week') {
    const ws = startOfWeek(anchor);
    const we = new Date(ws); we.setDate(ws.getDate() + 6);
    const wsStr = isoDate(ws), weStr = isoDate(we);
    return tasks.filter(t => t.date >= wsStr && t.date <= weStr);
  }
  // month
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  return tasks.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

function startOfWeek(d) {
  const ws = new Date(d);
  ws.setHours(0, 0, 0, 0);
  ws.setDate(d.getDate() - d.getDay());  // Sunday
  return ws;
}

function isoDate(d) {
  // YYYY-MM-DD in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dealerColorFromGradient(gradient) {
  // Extract the second color (the brighter "to" end) from the gradient string
  const m = gradient && gradient.match(/#[0-9A-Fa-f]{6}/g);
  return m && m[1] ? m[1] : '#94A3B8';
}

function dealerBgFromColor(hex) {
  // Convert hex to rgba with low alpha for backgrounds
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.10)`;
}

function renderKanban() {
  const columns = [
    { id: 'new',        label: 'New POs',        color: '#7C3AED', tint: 'rgba(124, 58, 237, 0.10)', icon: '◆' },
    { id: 'ack',        label: 'Acknowledged',   color: '#16A34A', tint: 'rgba(22, 163, 74, 0.10)',  icon: '✓' },
    { id: 'production', label: 'In production',  color: '#D97706', tint: 'rgba(217, 119, 6, 0.10)',  icon: '⚒' },
    { id: 'ready',      label: 'Ready to ship',  color: '#059669', tint: 'rgba(5, 150, 105, 0.10)',  icon: '◉' },
    { id: 'shipped',    label: 'Shipped',        color: '#0891B2', tint: 'rgba(8, 145, 178, 0.10)',  icon: '➤' },
    { id: 'delivered',  label: 'Delivered',      color: '#334155', tint: 'rgba(51, 65, 85, 0.10)',   icon: '○' }
  ];

  // Stats for the toolbar
  const lateCount = state.orders.filter(o => {
    if (o.status === 'delivered') return false;
    return dateLabel(o.shipBy).late;
  }).length;
  const soonCount = state.orders.filter(o => {
    if (o.status === 'delivered' || o.status === 'shipped') return false;
    return dateLabel(o.shipBy).soon;
  }).length;
  const totalUnits = state.orders
    .filter(o => o.status !== 'delivered' && o.status !== 'shipped')
    .reduce((s, o) => s + o.units, 0);
  const totalValue = state.orders
    .filter(o => o.status !== 'delivered' && o.status !== 'shipped')
    .reduce((s, o) => s + o.value, 0);

  const searchQ = (state.search && state.search.overview) || '';

  const cols = columns.map(col => {
    // Overdue-only filter — Overview is now a "what's behind schedule" view.
    // For active stages (new → shipped) overdue means past shipBy date.
    // For delivered, an overdue order is one that was delivered LATE (past
    // its original shipBy). For paid we don't surface — already closed.
    const allInStage = state.orders.filter(o => o.status === col.id && matchesSearch(searchQ, searchOrderFields(o)));
    const today = new Date(state.calendarDate || new Date().toISOString().slice(0,10));
    const isOverdue = (o) => {
      if (!o.shipBy) return false;
      return new Date(o.shipBy) < today;
    };
    const orders = allInStage.filter(isOverdue);
    const lateInCol = orders.length;
    const overdueValue = orders.reduce((s, o) => s + o.value, 0);
    const stageValue = allInStage.reduce((s, o) => s + o.value, 0);
    const totalInStage = allInStage.length;

    const cards = orders.map(o => {
      const d = getDealer(o.dealerId);
      const di = dateLabel(o.shipBy);
      const dateClass = di.late ? 'late' : (di.soon ? 'soon' : '');
      const prioritized = state.rushRequests.find(r => r.orderId === o.id && r.status === 'APPROVED');
      const pri = prioritized ? prioritized.approvedPriorityLevel : 3;
      const accentColor = pri === 1 ? 'var(--gl-danger)' : pri === 2 ? 'var(--gl-warn)' : col.color;
      return `
        <div class="kanban-card" style="--card-accent:${accentColor}" onclick="openOrderFullscreen(${o.id})">
          <div class="kanban-card-top">
            <div class="kanban-card-po">
              <span class="kanban-card-priority p${pri}"></span>
            </div>
            <div class="kanban-card-units">${o.units}u</div>
          </div>
          <div class="kanban-card-dealer-primary">
            ${dealerAvatar(d, 18)}
            <span class="kanban-card-dealer-name-primary">${d.short}</span>
            <span class="kanban-card-po-primary">${o.po}</span>
          </div>
          <div class="kanban-card-project-secondary">${o.project}</div>
          <div class="kanban-card-foot">
            <span class="kanban-card-days ${dateClass}">${di.label}</span>
          </div>
        </div>
      `;
    }).join('');

    const emptyState = `
      <div class="kanban-empty">
        <div class="kanban-empty-icon" style="opacity:0.4">✓</div>
        <div style="font-size:11px;color:var(--gl-text-faint);text-align:center;line-height:1.4">${totalInStage === 0 ? 'No orders in this stage' : `All ${totalInStage} on track`}</div>
      </div>
    `;

    // Decide where the column head navigates to. Each stage now has its own
    // dedicated nav tab — Estimates, Production, Shipping — so clicking a
    // column head sends the owner directly there.
    const SHIPPING_STAGE_IDS = ['ready', 'shipped', 'delivered'];
    let onClickJS, navLabel;
    if (ESTIMATES_STAGE_IDS.includes(col.id)) {
      onClickJS = `switchView('estimates'); state.estimatesFilter='${col.id}'; renderEstimates();`;
      navLabel = 'View in Estimates';
    } else if (PRODUCTION_STAGE_IDS.includes(col.id)) {
      onClickJS = `switchView('pipeline');`;
      navLabel = 'View in Production';
    } else if (SHIPPING_STAGE_IDS.includes(col.id)) {
      onClickJS = `switchView('shipping'); state.shippingTab='outbound'; renderShipping();`;
      navLabel = 'View in Shipping';
    } else {
      onClickJS = `filterOrders('${col.id}')`;
      navLabel = 'View in All orders';
    }

    return `
      <div class="kanban-col" style="--col-color:${col.color};--col-tint:${col.tint}">
        <button class="kanban-col-head kanban-col-head-btn" type="button"
                onclick="${onClickJS}"
                title="${navLabel}: ${orders.length} overdue of ${totalInStage} ${col.label.toLowerCase()}">
          <div class="kanban-col-head-row">
            <div class="kanban-col-title"><span class="kanban-col-dot" style="background:${col.color}"></span>${col.label}</div>
            <div class="kanban-col-count ${orders.length > 0 ? 'has-late' : ''}">${orders.length}${totalInStage > orders.length ? ` <span class="kanban-col-count-total">/${totalInStage}</span>` : ''}</div>
          </div>
          <div class="kanban-col-value">
            <div class="kanban-col-value-main">
              <span>${totalInStage > 0 ? fmtMoneyFull(stageValue) : '—'}</span>
              <span class="kanban-col-head-arrow" aria-hidden="true">→</span>
            </div>
            ${overdueValue > 0 ? `<div class="kanban-col-value-overdue">${fmtMoneyFull(overdueValue)} overdue</div>` : ''}
          </div>
        </button>
        <div class="kanban-cards">${cards || emptyState}</div>
      </div>
    `;
  }).join('');


  return `
    <div class="kanban-toolbar">
      <span class="kanban-tool-stat" style="color:var(--gl-danger)"><span class="pip" style="background:var(--gl-danger)"></span><strong>${lateCount}</strong> overdue</span>
      <span style="color:var(--gl-text-faint)">·</span>
      <span class="kanban-tool-stat"><strong>${state.orders.length}</strong> total orders</span>
      <span style="color:var(--gl-text-faint)">·</span>
      <span class="kanban-tool-stat"><strong>${totalUnits}</strong> units active</span>
      <span style="color:var(--gl-text-faint)">·</span>
      <span class="kanban-tool-stat"><strong>${fmtMoneyFull(totalValue)}</strong> in production</span>
      ${soonCount > 0 ? `
        <span style="color:var(--gl-text-faint)">·</span>
        <span class="kanban-tool-stat" style="color:var(--gl-warn)"><span class="pip" style="background:var(--gl-warn)"></span><strong>${soonCount}</strong> due soon</span>
      ` : ''}
      <div style="flex:1"></div>
      <span style="font-size:11px;color:var(--gl-text-faint)">Showing overdue only · click any column to drill in</span>
    </div>
    <div class="kanban">${cols}</div>
  `;
}

/* ═══════════════════════════════════════════════════════════════════
   MATERIALS OVERVIEW — kanban-style columns mirroring the Live subtab.
   Each column is a stage in the material lifecycle: items that need to
   be reordered, POs sent to suppliers, supplier-acknowledged POs, POs
   in transit, and recently received material. Card visual grammar
   matches the order kanban: stage-color left edge, hairline borders,
   primary identifier on first line, secondary detail below.
   ═══════════════════════════════════════════════════════════════════ */
function renderMaterialsOverview() {
  const today = new Date(state.calendarDate || new Date().toISOString().slice(0,10));
  const inv = state.inventory || [];
  const inboundAll = state.purchaseOrders || [];

  // Bucket items
  const reorderItems = inv.filter(i => i.onHand <= (i.reorderPoint || 0));
  const criticalReorder = reorderItems.filter(i => {
    const onO = (typeof onOrderQty === 'function') ? onOrderQty(i.sku) : 0;
    return (i.onHand + onO) < (i.reorderPoint || 0);
  });
  // Sort: critical first (worst ratio first), then low
  const reorderSorted = [...reorderItems].sort((a, b) => {
    const aCrit = criticalReorder.includes(a) ? 0 : 1;
    const bCrit = criticalReorder.includes(b) ? 0 : 1;
    if (aCrit !== bCrit) return aCrit - bCrit;
    return (a.onHand / (a.reorderPoint || 1)) - (b.onHand / (b.reorderPoint || 1));
  });

  const submittedPOs = inboundAll.filter(po => po.status === 'submitted');
  const ackPOs = inboundAll.filter(po => po.status === 'acknowledged');
  const transitPOs = inboundAll.filter(po => po.status === 'in-transit');
  const receivedRecent = inboundAll.filter(po => {
    if (po.status !== 'received' && po.status !== 'closed') return false;
    if (!po.receivedAt) return true; // demo data — show recently-received
    return (today - new Date(po.receivedAt)) < 1000 * 60 * 60 * 24 * 7;
  });

  // Inventory value totals
  const inventoryValue = inv.reduce((s, i) => s + (i.onHand || 0) * (i.unitCost || 0), 0);
  const onOrderValue = inboundAll
    .filter(po => po.status !== 'received' && po.status !== 'closed')
    .reduce((s, po) => s + (po.totalCost || 0), 0);
  const overdueInbound = transitPOs.filter(po => po.expectedAt && new Date(po.expectedAt) < today);
  const overdueInboundValue = overdueInbound.reduce((s, po) => s + (po.totalCost || 0), 0);

  // Stage-color palette for each column
  const COLS = [
    { id: 'reorder',  label: 'Reorder needed',  color: '#DC2626', tint: 'rgba(220, 38, 38, 0.10)',  desc: 'Below reorder point — order now' },
    { id: 'submitted', label: 'PO submitted',    color: '#7C3AED', tint: 'rgba(124, 58, 237, 0.10)', desc: 'Sent to supplier, awaiting ack' },
    { id: 'ack',      label: 'Supplier ack',    color: '#16A34A', tint: 'rgba(22, 163, 74, 0.10)',  desc: 'Confirmed, in production at supplier' },
    { id: 'transit',  label: 'In transit',      color: '#0891B2', tint: 'rgba(8, 145, 178, 0.10)',  desc: 'En route to dock' },
    { id: 'received', label: 'Received recently', color: '#334155', tint: 'rgba(51, 65, 85, 0.10)', desc: 'Checked into inventory · last 7 days' }
  ];

  /* Inventory item card — for the Reorder column */
  const reorderCard = (i) => {
    const sup = getSupplier(i.supplierId);
    const onO = (typeof onOrderQty === 'function') ? onOrderQty(i.sku) : 0;
    const projected = i.onHand + onO;
    const isCritical = projected < (i.reorderPoint || 0);
    const flagColor = isCritical ? '#DC2626' : '#D97706';
    const flagBg = isCritical ? 'var(--gl-danger-bg)' : 'rgba(217, 119, 6, 0.10)';
    return `
      <div class="mat-card" style="--card-accent:${flagColor};--card-tint:${isCritical ? 'rgba(220,38,38,0.04)' : 'transparent'}" onclick="switchView('materials'); state.materialsTab='reorder'; renderMaterials()">
        <div class="mat-card-head">
          <div class="mat-card-id-row">
            <span class="mat-card-sku">${escapeHtml(i.sku)}</span>
            <span class="mat-card-flag" style="background:${flagBg};color:${flagColor}">${isCritical ? 'CRITICAL' : 'LOW'}</span>
          </div>
          <div class="mat-card-value">${fmtMoney((i.onHand || 0) * (i.unitCost || 0))}</div>
        </div>
        <div class="mat-card-name">${escapeHtml(i.name)}</div>
        <div class="mat-card-sub">${sup ? escapeHtml(sup.name) : 'Supplier'}</div>
        <div class="mat-card-stock">
          <div class="mat-card-stock-row">
            <span class="mat-card-stock-label">On hand</span>
            <span class="mat-card-stock-val">${i.onHand}${i.uom || ''}</span>
          </div>
          <div class="mat-card-stock-row">
            <span class="mat-card-stock-label">Reorder at</span>
            <span class="mat-card-stock-val">${i.reorderPoint || 0}${i.uom || ''}</span>
          </div>
          ${onO > 0 ? `
          <div class="mat-card-stock-row">
            <span class="mat-card-stock-label">On PO</span>
            <span class="mat-card-stock-val" style="color:var(--gl-info)">+${onO}${i.uom || ''}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  /* PO card — for the Submitted, Ack, Transit, Received columns */
  const poCard = (po, colId) => {
    const sup = getSupplier(po.supplierId);
    const stageColor = (COLS.find(c => c.id === colId) || {}).color || '#64748B';
    const stageTint = (COLS.find(c => c.id === colId) || {}).tint || 'transparent';
    const lineCount = (po.lineItems || []).length;

    // ETA badge for in-transit
    let etaBadge = '';
    if (colId === 'transit' && po.expectedAt) {
      if (po.etaDays != null && po.etaDays < 0) {
        etaBadge = `<span class="mat-card-flag" style="background:var(--gl-danger-bg);color:var(--gl-danger)">${-po.etaDays}D OVERDUE</span>`;
      } else if (po.etaDays === 0) {
        etaBadge = `<span class="mat-card-flag" style="background:rgba(217,119,6,0.12);color:var(--gl-warn)">TODAY</span>`;
      } else if (po.etaDays != null && po.etaDays <= 2) {
        etaBadge = `<span class="mat-card-flag" style="background:rgba(8,145,178,0.12);color:#0891B2">IN ${po.etaDays}D</span>`;
      }
    }
    if (colId === 'received') {
      etaBadge = `<span class="mat-card-flag" style="background:rgba(22,163,74,0.12);color:var(--gl-success)">✓ RECEIVED</span>`;
    }
    if (colId === 'submitted' && po.submittedAt) {
      const days = Math.max(0, Math.floor((today - new Date(po.submittedAt)) / 86400000));
      if (days >= 3) etaBadge = `<span class="mat-card-flag" style="background:rgba(217,119,6,0.10);color:var(--gl-warn)">${days}D PENDING</span>`;
    }

    return `
      <div class="mat-card" style="--card-accent:${stageColor};--card-tint:${stageTint}" onclick="switchView('shipping'); state.shippingTab='inbound'; renderShipping()">
        <div class="mat-card-head">
          <div class="mat-card-id-row">
            <span class="mat-card-sku">${escapeHtml(po.id)}</span>
            ${etaBadge}
          </div>
          <div class="mat-card-value">${fmtMoney(po.totalCost || 0)}</div>
        </div>
        <div class="mat-card-name">${sup ? escapeHtml(sup.name) : 'Supplier'}</div>
        <div class="mat-card-sub">${lineCount} line${lineCount === 1 ? '' : 's'} · ${po.totalQty || '?'} units${sup && sup.category ? ' · ' + escapeHtml(sup.category) : ''}</div>
        <div class="mat-card-stock">
          ${colId === 'transit' && po.dockDoor ? `
          <div class="mat-card-stock-row">
            <span class="mat-card-stock-label">Dock</span>
            <span class="mat-card-stock-val">${po.dockDoor} · ${po.palletCount || '?'} pallet${po.palletCount === 1 ? '' : 's'}</span>
          </div>
          ` : ''}
          ${(po.expectedAt && colId !== 'received') ? `
          <div class="mat-card-stock-row">
            <span class="mat-card-stock-label">${colId === 'submitted' ? 'Need by' : 'ETA'}</span>
            <span class="mat-card-stock-val">${fmtDateShort(po.expectedAt)}</span>
          </div>
          ` : ''}
          ${colId === 'received' && po.receivedAt ? `
          <div class="mat-card-stock-row">
            <span class="mat-card-stock-label">Received</span>
            <span class="mat-card-stock-val">${fmtDateShort(po.receivedAt)}</span>
          </div>
          ` : ''}
          ${colId === 'submitted' && po.submittedAt ? `
          <div class="mat-card-stock-row">
            <span class="mat-card-stock-label">Submitted</span>
            <span class="mat-card-stock-val">${fmtDateShort(po.submittedAt)}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  // Build each column
  const colsHtml = COLS.map(c => {
    let items, cardFn;
    if (c.id === 'reorder')         { items = reorderSorted;  cardFn = reorderCard; }
    else if (c.id === 'submitted')  { items = submittedPOs;   cardFn = (po) => poCard(po, 'submitted'); }
    else if (c.id === 'ack')        { items = ackPOs;         cardFn = (po) => poCard(po, 'ack'); }
    else if (c.id === 'transit')    { items = transitPOs;     cardFn = (po) => poCard(po, 'transit'); }
    else                            { items = receivedRecent; cardFn = (po) => poCard(po, 'received'); }

    // Column value: for reorder it's the cost-at-risk; for POs it's the open value
    let colValue;
    if (c.id === 'reorder') {
      colValue = items.reduce((s, i) => s + Math.max(0, (i.reorderPoint || 0) - i.onHand) * (i.unitCost || 0), 0);
    } else {
      colValue = items.reduce((s, po) => s + (po.totalCost || 0), 0);
    }

    // For Reorder col we also surface a critical-count sub-stat
    const criticalInCol = c.id === 'reorder' ? criticalReorder.length : 0;

    // Routing: clicking the column head jumps to the right place
    let onClickJS, navLabel;
    if (c.id === 'reorder')        { onClickJS = `switchView('materials'); state.materialsTab='reorder'; renderMaterials()`; navLabel = 'Open Reorder alerts in Materials'; }
    else if (c.id === 'received')  { onClickJS = `switchView('materials'); state.materialsTab='inventory'; renderMaterials()`; navLabel = 'Open Inventory in Materials'; }
    else                           { onClickJS = `switchView('shipping'); state.shippingTab='inbound'; renderShipping()`;        navLabel = 'Open Inbound POs in Shipping'; }

    return `
      <div class="kanban-col mat-col" style="--col-color:${c.color};--col-tint:${c.tint}">
        <button class="kanban-col-head kanban-col-head-btn" type="button"
                onclick="${onClickJS}"
                title="${navLabel}">
          <div class="kanban-col-head-row">
            <div class="kanban-col-title"><span class="kanban-col-dot" style="background:${c.color}"></span>${c.label}</div>
            <div class="kanban-col-count ${criticalInCol > 0 ? 'has-late' : ''}">${items.length}${criticalInCol > 0 ? ` <span class="kanban-col-count-total">/${criticalInCol} crit</span>` : ''}</div>
          </div>
          <div class="kanban-col-value">
            <div class="kanban-col-value-main">
              <span>${items.length > 0 ? fmtMoneyFull(colValue) : '—'}</span>
              <span class="kanban-col-head-arrow" aria-hidden="true">→</span>
            </div>
            ${c.id === 'reorder' && criticalInCol > 0 ? `<div class="kanban-col-value-overdue">${criticalInCol} need urgent order</div>` : ''}
          </div>
        </button>
        <div class="kanban-cards">
          ${items.length === 0
            ? `<div class="kanban-empty"><div class="kanban-empty-icon" style="opacity:0.4">${c.id === 'reorder' ? '✓' : '·'}</div><div style="font-size:11px;color:var(--gl-text-faint);text-align:center;line-height:1.4">${c.id === 'reorder' ? 'All stock healthy' : 'No items'}</div></div>`
            : items.map(cardFn).join('')}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="kanban-toolbar">
      <span class="kanban-tool-stat" style="color:${criticalReorder.length > 0 ? 'var(--gl-danger)' : 'var(--gl-text)'}"><span class="pip" style="background:${criticalReorder.length > 0 ? 'var(--gl-danger)' : 'var(--gl-text-mute)'}"></span><strong>${reorderItems.length}</strong> below reorder${criticalReorder.length > 0 ? ` · ${criticalReorder.length} critical` : ''}</span>
      <span style="color:var(--gl-text-faint)">·</span>
      <span class="kanban-tool-stat"><strong>${inboundAll.filter(po => po.status !== 'received' && po.status !== 'closed').length}</strong> open POs</span>
      <span style="color:var(--gl-text-faint)">·</span>
      <span class="kanban-tool-stat"><strong>${fmtMoneyFull(onOrderValue)}</strong> on order</span>
      <span style="color:var(--gl-text-faint)">·</span>
      <span class="kanban-tool-stat"><strong>${fmtMoneyFull(inventoryValue)}</strong> inventory value</span>
      ${overdueInbound.length > 0 ? `
        <span style="color:var(--gl-text-faint)">·</span>
        <span class="kanban-tool-stat" style="color:var(--gl-danger)"><span class="pip" style="background:var(--gl-danger)"></span><strong>${overdueInbound.length}</strong> overdue inbound · ${fmtMoneyFull(overdueInboundValue)}</span>
      ` : ''}
      <div style="flex:1"></div>
      <span style="font-size:11px;color:var(--gl-text-faint)">Click any column to drill in</span>
    </div>
    <div class="kanban">${colsHtml}</div>
  `;
}

function renderOrdersTable() {
  const filter = state.ordersFilter;
  const sort = state.ordersSort || { col: 'shipBy', dir: 'asc' };

  // Stage color map matching CAL_STAGE_COLORS (used in the filter bar)
  const STAGE_FILTERS = [
    { id: 'all',        label: 'All',           color: '#0F172A' },
    { id: 'new',        label: 'New',           color: '#7C3AED' },
    { id: 'ack',        label: 'Ack',           color: '#16A34A' },
    { id: 'production', label: 'In production', color: '#D97706' },
    { id: 'ready',      label: 'Ready',         color: '#059669' },
    { id: 'shipped',    label: 'Shipped',       color: '#0891B2' },
    { id: 'delivered',  label: 'Delivered',     color: '#334155' }
  ];

  const searchQ = (state.search && state.search.overview) || '';
  let working = filter === 'all'
    ? [...state.orders]
    : state.orders.filter(o => o.status === filter);
  working = working.filter(o => matchesSearch(searchQ, searchOrderFields(o)));

  // Apply sort
  const sortFn = (a, b) => {
    let av, bv;
    switch (sort.col) {
      case 'po':       av = a.po; bv = b.po; break;
      case 'dealer':   av = (getDealer(a.dealerId)||{}).short || ''; bv = (getDealer(b.dealerId)||{}).short || ''; break;
      case 'project':  av = a.project; bv = b.project; break;
      case 'status':   av = a.status; bv = b.status; break;
      case 'value':    av = a.value; bv = b.value; break;
      case 'shipBy':   av = a.shipBy; bv = b.shipBy; break;
      case 'units':    av = a.units; bv = b.units; break;
      default: av = a.shipBy; bv = b.shipBy;
    }
    if (av < bv) return sort.dir === 'asc' ? -1 : 1;
    if (av > bv) return sort.dir === 'asc' ?  1 : -1;
    return 0;
  };
  working.sort(sortFn);

  const counts = {
    all: state.orders.length,
    new: state.orders.filter(o => o.status === 'new').length,
    ack: state.orders.filter(o => o.status === 'ack').length,
    production: state.orders.filter(o => o.status === 'production').length,
    ready: state.orders.filter(o => o.status === 'ready').length,
    shipped: state.orders.filter(o => o.status === 'shipped').length,
    delivered: state.orders.filter(o => o.status === 'delivered').length
  };

  const arrow = (col) => sort.col === col
    ? `<span class="sort-arrow ${sort.dir}">▾</span>`
    : '<span class="sort-arrow"></span>';

  const rows = working.map(o => {
    const d = getDealer(o.dealerId);
    const dateInfo = dateLabel(o.shipBy);
    const dateClass = dateInfo.late ? 'late' : (dateInfo.soon ? 'soon' : '');
    return `
      <div class="table-row" data-order="${o.id}" onclick="openOrderFullscreen(${o.id})">
        <div><div class="order-po">${d ? d.short : 'Direct customer'} <span class="order-po-inline">${o.po}</span></div><div class="order-dealer-sub">${o.units} units</div></div>
        <div><div class="order-project" style="font-weight:400;color:var(--gl-text-mute)">${o.project}</div><div class="order-units-sub">${o.units} units</div></div>
        <div><span class="status-pill ${o.status}"><span class="dot"></span>${statusLabel(o.status)}</span></div>
        <div class="order-value">${fmtMoney(o.value)}</div>
        <div class="order-date ${dateClass}">${fmtDate(o.shipBy)}<div style="font-size:11px;color:var(--gl-text-faint);font-weight:400">${dateInfo.label}</div></div>
      </div>
    `;
  }).join('');

  return `
    <div class="orders-filter-bar">
      ${STAGE_FILTERS.map(f => `
        <button class="orders-filter ${filter === f.id ? 'active' : ''} stage-${f.id}"
                style="--filter-color:${f.color}"
                onclick="state.ordersFilter='${f.id}'; renderProduction()">
          <span class="orders-filter-dot" style="background:${f.color}"></span>
          <span class="orders-filter-label">${f.label}</span>
          <span class="orders-filter-count">${counts[f.id]}</span>
        </button>
      `).join('')}
    </div>

    <div class="orders-table">
      <div class="table-head sortable">
        <div class="th" onclick="setOrdersSort('dealer')">DEALER · PO${arrow('dealer')}</div>
        <div class="th" onclick="setOrdersSort('project')">PROJECT${arrow('project')}</div>
        <div class="th" onclick="setOrdersSort('status')">STATUS${arrow('status')}</div>
        <div class="th" style="text-align:right" onclick="setOrdersSort('value')">VALUE${arrow('value')}</div>
        <div class="th" style="text-align:right" onclick="setOrdersSort('shipBy')">SHIP BY${arrow('shipBy')}</div>
      </div>
      ${rows || '<div class="empty-state">No orders match this filter.</div>'}
    </div>
  `;
}

/* Generic column sort handler — click to toggle asc/desc */
function setOrdersSort(col) {
  if (state.ordersSort && state.ordersSort.col === col) {
    state.ordersSort.dir = state.ordersSort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    state.ordersSort = { col, dir: 'asc' };
  }
  renderProduction();
}

function renderRushQueue() {
  const pending = state.rushRequests.filter(r => r.status === 'REQUESTED');
  const decided = state.rushRequests.filter(r => r.status !== 'REQUESTED');

  const pendingHtml = pending.map(r => {
    const o = getOrder(r.orderId);
    const d = o ? getDealer(o.dealerId) : null;
    return `
      <div class="rush-card ${r.urgent ? 'urgent' : ''}">
        <div class="rush-card-head">
          <div>
            <div class="rush-card-title">${o ? o.po + ' · ' + o.project : 'Order #' + r.orderId}</div>
            <div class="rush-card-meta">
              Requested ${fmtDate(r.requestedAt)} · by ${r.requestedBy} · Priority requested: P${r.priority}
              ${r.urgent ? ' · <span style="color:var(--gl-danger);font-weight:500">URGENT</span>' : ''}
            </div>
          </div>
          <div style="text-align:right">
            ${o ? `<div class="order-value" style="font-size:18px">${fmtMoneyFull(o.value)}</div><div class="order-date ${dateLabel(o.shipBy).late ? 'late' : ''}" style="margin-top:4px">ship by ${fmtDate(o.shipBy)}</div>` : ''}
          </div>
        </div>

        <div class="rush-card-reason">${r.reason}</div>

        <div class="rush-card-actions">
          <button class="btn success" onclick="approveRush(${r.id})">✓ Approve as P${r.priority}</button>
          <button class="btn danger" onclick="declineRush(${r.id})">✕ Decline</button>
          <button class="btn ghost" onclick="openOrderFullscreen(${r.orderId})">Open order</button>
        </div>
      </div>
    `;
  }).join('') || '<div class="panel"><div class="empty-state">No pending rush requests.</div></div>';

  const decidedHtml = decided.map(r => {
    const o = getOrder(r.orderId);
    return `
      <div class="rush-card" style="opacity:0.7">
        <div class="rush-card-head">
          <div>
            <div class="rush-card-title" style="font-size:14px">${o ? o.po + ' · ' + o.project : '#' + r.orderId}</div>
            <div class="rush-card-meta">
              ${r.status === 'APPROVED' ? '<span style="color:var(--gl-success);font-weight:500">✓ Approved</span>' : '<span style="color:var(--gl-danger);font-weight:500">✕ Declined</span>'}
              · decided ${fmtDate(r.decidedAt)} · by ${r.requestedBy}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="section-label" style="margin-top:0;margin-bottom:10px">Pending rush requests · ${pending.length}</div>
    <div class="rush-list">${pendingHtml}</div>
    ${decided.length ? `<div class="section-label" style="margin-top:22px;margin-bottom:10px">Recently decided · ${decided.length}</div><div class="rush-list">${decidedHtml}</div>` : ''}
  `;
}

function renderWarrantyQueue() {
  const flagged = state.warrantyClaims.filter(w => w.status === 'FLAGGED');
  const inFlight = state.warrantyClaims.filter(w => w.status === 'ACKNOWLEDGED_BY_FACTORY' || w.status === 'APPROVED' || w.status === 'REMADE_IN_PROGRESS');
  const resolved = state.warrantyClaims.filter(w => w.status === 'RESOLVED' || w.status === 'DECLINED');

  const renderClaim = c => {
    const o = getOrder(c.orderId);
    const d = o ? getDealer(o.dealerId) : null;
    let actionsHtml = '';
    if (c.status === 'FLAGGED') {
      actionsHtml = `
        <button class="btn primary" onclick="acknowledgeClaim(${c.id})">Acknowledge</button>
        <button class="btn ghost" onclick="openOrderFullscreen(${c.orderId})">Open order</button>
      `;
    } else if (c.status === 'ACKNOWLEDGED_BY_FACTORY') {
      actionsHtml = `
        <button class="btn success" onclick="approveClaim(${c.id})">Approve · spawn remake</button>
        <button class="btn danger" onclick="declineClaim(${c.id})">Decline</button>
      `;
    } else if (c.status === 'APPROVED') {
      actionsHtml = `<button class="btn primary" onclick="markRemakeInProgress(${c.id})">Mark remake started</button>`;
    } else if (c.status === 'REMADE_IN_PROGRESS') {
      actionsHtml = `<button class="btn success" onclick="resolveClaim(${c.id})">✓ Mark resolved</button>`;
    }

    return `
      <div class="warranty-card">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span class="warranty-category-pill">${c.category.replace(/_/g, ' ')}</span>
              <span style="font-size:11px;font-family:var(--gl-mono);color:var(--gl-text-mute)">${c.claimNumber}</span>
            </div>
            <div style="font-size:15px;font-weight:600;letter-spacing:-0.015em">${o ? o.po + ' · ' + o.project : '#' + c.orderId}</div>
            <div style="font-size:12.5px;color:var(--gl-text-mute);margin-top:3px">
              ${c.affectedUnits} unit${c.affectedUnits > 1 ? 's' : ''} affected · flagged ${fmtDate(c.flaggedAt)}${c.flaggedBy ? ' by ' + c.flaggedBy : ''}
            </div>
          </div>
          <div style="text-align:right">
            <div class="warranty-status-${c.status.toLowerCase().split('_')[0]}" style="font-size:13px;font-weight:600">${c.status.replace(/_/g, ' ')}</div>
          </div>
        </div>

        <div class="rush-card-reason" style="margin-top:12px">${c.description}</div>

        ${actionsHtml ? `<div class="rush-card-actions">${actionsHtml}</div>` : ''}
      </div>
    `;
  };

  return `
    <div class="section-label" style="margin-top:0;margin-bottom:10px">Flagged · awaiting acknowledgment · ${flagged.length}</div>
    <div>${flagged.map(renderClaim).join('') || '<div class="panel"><div class="empty-state">No flagged claims.</div></div>'}</div>

    <div class="section-label" style="margin-top:22px;margin-bottom:10px">In flight · ${inFlight.length}</div>
    <div>${inFlight.map(renderClaim).join('') || '<div class="panel"><div class="empty-state">No claims in flight.</div></div>'}</div>

    <div class="section-label" style="margin-top:22px;margin-bottom:10px">Resolved · ${resolved.length}</div>
    <div style="opacity:0.65">${resolved.map(renderClaim).join('')}</div>
  `;
}

function renderStageConfig() {
  const stages = state.trackerStages.canonical;
  const custom = state.trackerStages.custom;

  return `
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Order tracker — customer-facing stages</div>
        <button class="btn sm primary" onclick="toast('Stage config saved')">Save changes</button>
      </div>
      <div style="font-size:13px;color:var(--gl-text-mute);margin-bottom:14px;line-height:1.5">
        These are the stages your customers see on their order tracker page. Canonical stages are required and ordered. You can rename labels and add up to 3 custom stages between canonicals.
      </div>

      ${stages.map((s, i) => `
        <div style="padding:14px 0;border-bottom:0.5px solid var(--gl-border);display:grid;grid-template-columns:30px 1fr 1fr 110px;gap:12px;align-items:center">
          <div style="font-family:var(--gl-mono);font-size:12px;color:var(--gl-text-mute)">${i + 1}.</div>
          <div>
            <div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--gl-text-mute);margin-bottom:3px">Canonical: ${s.id}</div>
            <input class="form-input" value="${s.label}" style="max-width:100%" />
          </div>
          <input class="form-input" placeholder="Detail text" value="${s.detail || ''}" style="max-width:100%" />
          <input class="form-input" type="number" value="${s.durationDays || ''}" placeholder="days" />
        </div>
      `).join('')}

      ${custom.length ? `
        <div class="section-label" style="margin-top:22px">Custom stages</div>
        ${custom.map(c => `
          <div style="padding:14px 0;border-bottom:0.5px solid var(--gl-border);display:grid;grid-template-columns:30px 1fr 1fr 110px;gap:12px;align-items:center">
            <div style="font-family:var(--gl-mono);font-size:12px;color:var(--gl-purple)">CUSTOM</div>
            <div>
              <div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--gl-text-mute);margin-bottom:3px">After: ${c.insertAfter}</div>
              <input class="form-input" value="${c.label}" />
            </div>
            <input class="form-input" value="${c.detail || ''}" />
            <input class="form-input" type="number" value="${c.durationDays || ''}" />
          </div>
        `).join('')}
      ` : ''}

      <button class="btn ghost" style="margin-top:14px" onclick="toast('Custom stage editor (mock)')">+ Add custom stage (${3 - custom.length} remaining)</button>
    </div>
  `;
}

function renderDrawingsTab() {
  return renderDrawingsTable();
}

function renderDrawingsTable() {
  const drawingsQueue = [];
  state.orders.forEach(o => o.drawings.forEach(dr => {
    drawingsQueue.push({ orderId: o.id, po: o.po, project: o.project, units: o.units, dealer: getDealer(o.dealerId), ...dr });
  }));
  const sortKey = { pending: 0, 'in-review': 1, revise: 2, approved: 3 };
  drawingsQueue.sort((a, b) => sortKey[a.status] - sortKey[b.status]);

  const rows = drawingsQueue.map(dr => `
    <div class="table-row" onclick="openOrderFullscreen(${dr.orderId})">
      <div><div class="order-po">${dr.dealer.short} <span class="order-po-inline">${dr.po}</span></div><div class="order-dealer-sub">${dr.units} units</div></div>
      <div><div class="order-project" style="font-weight:400;color:var(--gl-text-mute)">${dr.project}</div><div class="order-units-sub">${dr.units} units · ${dr.name}</div></div>
      <div><span class="dealer-pill">${dealerAvatar(dr.dealer, 20)}<span style="font-size:12.5px">${dr.dealer.short}</span></span></div>
      <div><span class="drawing-status ${dr.status}">${dr.status === 'in-review' ? 'In review' : dr.status === 'approved' ? '✓ Approved' : dr.status === 'pending' ? 'Awaiting release' : 'Revise'}</span></div>
      <div style="display:flex;gap:6px;justify-content:flex-end" onclick="event.stopPropagation()">
        ${dr.status === 'pending' ? `<button class="btn sm primary" onclick="releaseDrawings(${dr.orderId})">Release</button>` : ''}
        ${dr.status === 'in-review' ? `<button class="btn sm ghost" onclick="nudgeDealer(${dr.orderId})">Nudge dealer</button>` : ''}
        ${dr.status === 'revise' ? `<button class="btn sm primary" onclick="reReleaseDrawings(${dr.orderId})">Re-release</button>` : ''}
        ${dr.status === 'approved' ? `<span class="muted" style="font-size:12px">No action</span>` : ''}
      </div>
    </div>
  `).join('');

  return `
    <div class="orders-table drawings-table">
      <div class="table-head">
        <div>DEALER · PO</div><div>PROJECT · DRAWING</div><div>DEALER</div>
        <div>STATUS</div><div style="text-align:right">ACTION</div>
      </div>
      ${rows}
    </div>
  `;
}

function renderShipmentsTable() {
  const shipments = state.orders.filter(o => ['ready', 'shipped', 'delivered'].includes(o.status));
  const rows = shipments.map(o => {
    const d = getDealer(o.dealerId);
    const tracking = 'BL-' + (40000 + o.id).toString();
    return `
      <div class="table-row" onclick="openOrderFullscreen(${o.id})">
        <div><div class="order-po">${d.short} <span class="order-po-inline">${o.po}</span></div><div class="order-dealer-sub">${o.units} units</div></div>
        <div><div class="order-project" style="font-weight:400;color:var(--gl-text-mute)">${o.project}</div><div class="order-units-sub">${o.units} units · ${fmtMoneyFull(o.value)}</div></div>
        <div>${o.status === 'ready' ? '<span class="muted" style="font-size:12.5px">Not yet shipped</span>' : `<span class="tracking-num">${tracking}</span>`}</div>
        <div><span class="status-pill ${o.status}"><span class="dot"></span>${statusLabel(o.status)}</span></div>
        <div style="text-align:right"><span class="order-date">${fmtDate(o.shipBy)}</span></div>
      </div>
    `;
  }).join('');

  return `
    <div class="orders-table shipments-table">
      <div class="table-head">
        <div>PO · DEALER</div><div>PROJECT</div><div>TRACKING</div>
        <div>STATUS</div><div style="text-align:right">SHIP DATE</div>
      </div>
      ${rows}
    </div>
  `;
}

function renderCatalog() {
  const tab = state.catalogTab;
  const products = state.catalog.products;
  const catFilter = state.catalogCategoryFilter;
  const statusFilter = state.catalogStatusFilter;
  const counts = {
    products: products.length,
    variants: products.reduce((s, p) => s + p.variants, 0),
    rules: products.reduce((s, p) => s + p.rules, 0),
    enabled: products.filter(p => p.enabled).length
  };

  // Catalog totals for the profit summary at top
  const catalogTotals = products.reduce((acc, p) => {
    acc.units += p.ytdUnits;
    acc.revenue += p.ytdRevenue;
    acc.profit += p.ytdProfit;
    return acc;
  }, { units: 0, revenue: 0, profit: 0 });
  const blendedMargin = catalogTotals.revenue > 0 ? (catalogTotals.profit / catalogTotals.revenue) : 0;

  // Category counts — entry doors and patio doors removed from platform
  const categoryDefs = [
    { id: 'all',         label: 'All',         count: products.length },
    { id: 'window',      label: 'Windows',     count: products.filter(p => p.category === 'window').length },
    { id: 'garage-door', label: 'Garage doors',count: products.filter(p => p.category === 'garage-door').length }
  ];

  const statusDefs = [
    { id: 'all',      label: 'All',          count: products.length },
    { id: 'enabled',  label: 'Offered',      count: products.filter(p => p.enabled).length },
    { id: 'disabled', label: 'Not offered',  count: products.filter(p => !p.enabled).length },
    { id: 'draft',    label: 'Draft / unpublished', count: products.filter(p => p.status === 'draft').length }
  ];

  // Apply filters
  const searchQ = (state.search && state.search.catalog) || '';
  let filtered = products.filter(p => matchesSearch(searchQ, [
    p.name, p.family, p.category, p.status, p.sku, p.code, p.description,
    p.variants && (p.variants + ' variants')
  ]));
  if (catFilter !== 'all') filtered = filtered.filter(p => p.category === catFilter);
  if (statusFilter === 'enabled')  filtered = filtered.filter(p => p.enabled);
  if (statusFilter === 'disabled') filtered = filtered.filter(p => !p.enabled);
  if (statusFilter === 'draft')    filtered = filtered.filter(p => p.status === 'draft');

  // Group by category for display
  const grouped = {};
  filtered.forEach(p => {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  });

  const categoryLabels = {
    'window': 'Windows', 'garage-door': 'Garage doors'
  };
  const categoryOrder = ['window', 'garage-door'];

  const productSection = (cat) => {
    if (!grouped[cat] || grouped[cat].length === 0) return '';
    const items = grouped[cat];
    const enabledCount = items.filter(p => p.enabled).length;
    return `
      <div class="cat-category-section">
        <div class="cat-category-head">
          <div class="cat-category-title">${categoryLabels[cat]}</div>
          <div class="cat-category-count">${enabledCount} of ${items.length} offered · ${items.reduce((s, p) => s + p.ytdUnits, 0)} units YTD</div>
        </div>
        ${items.map(p => productRow(p)).join('')}
      </div>
    `;
  };

  const productRow = (p) => {
    const margin = p.msrp > 0 ? ((p.msrp - p.factoryCost) / p.msrp) * 100 : 0;
    const marginClass = margin >= 55 ? 'healthy' : margin >= 40 ? 'fair' : 'low';
    const initials = p.name.split(/[\s·]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const compliance = getCompliance(p);
    const er = computeER(compliance);
    const esEligibility = er != null ? getEnergyStarEligibility(er) : null;

    // Show a tiny ENERGY STAR badge inline only when product qualifies for Zone 2 (Ontario default)
    // All other compliance detail is behind the 📋 button.
    const esBadge = esEligibility && esEligibility.zone2 ? '<span class="es-inline-badge" title="ENERGY STAR Zone 2 eligible">⭐</span>' : '';

    return `
      <div class="cat-product-row ${!p.enabled ? 'disabled' : ''}">
        <div>
          <div class="cat-thumb ${p.category}">${initials}</div>
        </div>
        <div>
          <div class="cat-name">${p.name}${esBadge}</div>
          <div class="cat-meta">
            ${p.family}
            <span class="cat-meta-sep"></span>
            ${p.baseSize}
          </div>
        </div>
        <div>
          <label class="toggle-switch" title="${p.enabled ? 'Offered — click to remove from catalog' : 'Not offered — click to add to catalog'}">
            <input type="checkbox" ${p.enabled ? 'checked' : ''} onchange="toggleProductEnabled(${p.id})" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div><span class="cat-status-pill ${p.status}">${p.status === 'published' ? '✓' : p.status === 'draft' ? '◇' : '○'} ${p.status === 'published' ? 'Published' : p.status === 'draft' ? 'Draft' : 'Disabled'}</span></div>
        <div class="cat-price-prefix">
          <input type="number" class="cat-price-input cost" value="${p.factoryCost}" step="10" min="0"
            onchange="updateProductCost(${p.id}, this.value)"
            title="Factory cost" />
        </div>
        <div class="cat-price-prefix">
          <input type="number" class="cat-price-input msrp" value="${p.msrp}" step="10" min="0"
            onchange="updateProductMsrp(${p.id}, this.value)"
            title="MSRP" />
        </div>
        <div class="cat-margin ${marginClass}">${margin.toFixed(0)}%</div>
        <div class="cat-ytd">
          <div class="cat-ytd-units">${p.ytdUnits} units</div>
        </div>
        <div style="text-align:right;display:flex;gap:4px;justify-content:flex-end">
          <button class="btn ghost sm" onclick="viewProductCompliance(${p.id})" title="View compliance details">📋</button>
          <button class="btn ghost sm" onclick="toast('Edit ' + '${p.name}' + ' variants & options')" title="Edit">⚙</button>
        </div>
      </div>
    `;
  };

  $('catalog-view').innerHTML = `
    ${renderBackButton()}
    <div class="view-header">
      <div>
        <h1 class="view-title">Catalog</h1>
        <div class="view-subtitle">${counts.enabled} of ${counts.products} products offered · v${state.snapshotVersion}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        ${renderSearchBar('catalog', 'Search product, family, category…')}
        <button class="btn primary" onclick="toast('New custom product form (mock)')">+ New product</button>
      </div>
    </div>

    <div class="subtabs">
      <button class="subtab ${tab === 'products' ? 'active' : ''}" onclick="state.catalogTab='products'; renderCatalog()">Products<span class="subtab-badge">${counts.products}</span></button>
      <button class="subtab ${tab === 'components' ? 'active' : ''}" onclick="state.catalogTab='components'; renderCatalog()">Components</button>
      <button class="subtab ${tab === 'rules' ? 'active' : ''}" onclick="state.catalogTab='rules'; renderCatalog()">Variants &amp; rules</button>
      <button class="subtab ${tab === 'library' ? 'active' : ''}" onclick="state.catalogTab='library'; renderCatalog()">Library</button>
      <button class="subtab ${tab === 'import' ? 'active' : ''}" onclick="state.catalogTab='import'; renderCatalog()">📥 Import</button>
    </div>

    ${tab === 'products' ? `
      <div class="tabs" style="margin-bottom:10px;flex-wrap:wrap">
        ${categoryDefs.map(c => `
          <button class="tab ${catFilter === c.id ? 'active' : ''}" onclick="state.catalogCategoryFilter='${c.id}'; renderCatalog()">${c.label}<span class="tab-count">${c.count}</span></button>
        `).join('')}
      </div>
      <div class="tabs" style="margin-bottom:14px">
        ${statusDefs.map(s => `
          <button class="tab ${statusFilter === s.id ? 'active' : ''}" onclick="state.catalogStatusFilter='${s.id}'; renderCatalog()">${s.label}<span class="tab-count">${s.count}</span></button>
        `).join('')}
      </div>

      <div class="cat-bulk-bar">
        <span class="cat-bulk-label">${filtered.length} product${filtered.length === 1 ? '' : 's'} matching filters</span>
        <div style="flex:1"></div>
        <button class="btn sm ghost" onclick="enableAllInCategory('${catFilter}')" ${catFilter === 'all' ? 'disabled' : ''}>Enable all visible</button>
        <button class="btn sm ghost" onclick="disableAllInCategory('${catFilter}')" ${catFilter === 'all' ? 'disabled' : ''}>Disable all visible</button>
        <button class="btn sm ghost" onclick="bulkAdjustMargin()">Adjust margin %</button>
      </div>

      <div style="display:grid;grid-template-columns:56px 1.4fr 90px 100px 120px 120px 80px 110px 80px;align-items:center;gap:12px;padding:8px 18px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--gl-text-mute);margin-bottom:6px">
        <div></div>
        <div>PRODUCT</div>
        <div>OFFERED</div>
        <div>STATUS</div>
        <div style="text-align:right">COST</div>
        <div style="text-align:right">MSRP</div>
        <div style="text-align:center">MARGIN</div>
        <div style="text-align:right">YTD</div>
        <div></div>
      </div>

      ${categoryOrder.map(productSection).join('')}

      ${filtered.length === 0 ? `<div class="panel"><div class="empty-state">No products match these filters.</div></div>` : ''}

      <div style="margin-top:16px;padding:14px 22px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute);line-height:1.55">
        <strong style="color:var(--gl-text);font-weight:600">Tip:</strong>
        Toggle the <strong style="color:var(--gl-text);font-weight:600">Offered</strong> switch to add or remove a product from your catalog. Edit <strong style="color:var(--gl-warn);font-weight:600">factory cost</strong> (what it costs to make) and <strong style="color:var(--gl-text);font-weight:600">MSRP</strong> (list price) inline — margin and dealer tier prices recompute live.
        Each product's variants (sizes, colors, glazing, hardware, screen options) and configurator rules are managed in the <strong style="color:var(--gl-text);font-weight:600">Variants</strong> tab.
      </div>
    ` : tab === 'components' ? renderComponentsHub() : tab === 'library' ? renderCatalogLibraryHub() : tab === 'rules' ? renderVariantsAndRulesHub() : tab === 'import' ? renderCatalogImport() : tab === 'snapshots' ? renderCatalogSnapshots() : tab === 'glazing' ? renderGlazingLibrary() : tab === 'hardware' ? renderHardwareLibrary() : tab === 'colors' ? renderColorLibrary() : tab === 'documents' ? renderDocumentsLibrary() : tab === 'pricing-tables' ? renderPricingTables() : tab === 'variants' ? '<div class="panel"><div class="empty-state">Variants editor — mock placeholder.</div></div>' : `<div class="panel"><div class="empty-state">${tab.charAt(0).toUpperCase() + tab.slice(1)} view — mock placeholder.</div></div>`}
  `;
}

/* ════════════════════════════════════════════════
   CATALOG IMPORT — Excel/CSV upload with preview
   ════════════════════════════════════════════════ */

const IMPORT_FIELD_OPTIONS = [
  { value: '',            label: '— skip column —' },
  { value: 'name',        label: 'Product Name' },
  { value: 'category',    label: 'Category' },
  { value: 'family',      label: 'Family' },
  { value: 'baseSize',    label: 'Base Size' },
  { value: 'factoryCost', label: 'Factory Cost' },
  { value: 'msrp',        label: 'MSRP' },
  { value: 'status',      label: 'Status' },
  { value: 'variants',    label: 'Variants count' },
  { value: 'rules',       label: 'Rules count' },
  { value: 'enabled',     label: 'Offered (Y/N)' },
  { value: 'slug',        label: 'Slug / SKU' }
];

function renderCatalogImport() {
  const ci = state.catalogImport;

  return `
    <div class="import-container">
      <div class="import-step-bar">
        <div class="import-step ${ci.step === 'upload' ? 'active' : 'done'}">
          <div class="import-step-num">${ci.step === 'upload' ? '1' : '✓'}</div>
          <div class="import-step-label">Upload file</div>
        </div>
        <div class="import-step ${ci.step === 'preview' ? 'active' : ci.step === 'done' ? 'done' : ''}">
          <div class="import-step-num">${ci.step === 'done' ? '✓' : '2'}</div>
          <div class="import-step-label">Map &amp; preview</div>
        </div>
        <div class="import-step ${ci.step === 'done' ? 'active' : ''}">
          <div class="import-step-num">3</div>
          <div class="import-step-label">Done</div>
        </div>
      </div>

      ${ci.step === 'upload' ? renderImportUpload() : ci.step === 'preview' ? renderImportPreview() : renderImportDone()}
    </div>
  `;
}

function renderImportUpload() {
  return `
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;align-items:start">
      <div>
        <div class="import-dropzone" id="import-dz"
             ondragover="event.preventDefault(); this.classList.add('drag-active')"
             ondragleave="this.classList.remove('drag-active')"
             ondrop="event.preventDefault(); this.classList.remove('drag-active'); handleImportDrop(event)"
             onclick="document.getElementById('import-file').click()">
          <div class="import-dz-icon">📊</div>
          <div class="import-dz-title">Drag your Excel file here</div>
          <div class="import-dz-sub">
            Or click to browse · supports .xlsx, .xls, .csv files<br/>
            Up to 10,000 rows · client-side parsing (file never leaves your browser)
          </div>
          <div class="import-dz-formats">
            <span class="import-dz-format">.xlsx</span>
            <span class="import-dz-format">.xls</span>
            <span class="import-dz-format">.csv</span>
          </div>
        </div>
        <input type="file" id="import-file" class="import-file-input" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" onchange="handleImportFile(event.target.files[0])" />
      </div>

      <div class="panel">
        <div class="panel-header"><div class="panel-title">Need a template?</div></div>
        <div style="font-size:12.5px;color:var(--gl-text-mute);line-height:1.55;margin-bottom:14px">
          Download a starter template pre-populated with your current ${state.catalog.products.length} products. Edit prices in Excel, save, and re-upload to bulk-update.
        </div>
        <button class="btn primary sm" onclick="downloadCatalogTemplate(true)" style="width:100%;margin-bottom:8px">📄 Download with current data</button>
        <button class="btn ghost sm" onclick="downloadCatalogTemplate(false)" style="width:100%">📋 Download blank template</button>

        <div style="margin-top:18px;padding-top:14px;border-top:0.5px solid var(--gl-border);font-size:11.5px;color:var(--gl-text-mute);line-height:1.55">
          <strong style="color:var(--gl-text);font-weight:600">Required columns:</strong><br/>
          Product Name, Category, Factory Cost, MSRP
          <br/><br/>
          <strong style="color:var(--gl-text);font-weight:600">Optional:</strong><br/>
          Family, Base Size, Status, Variants, Rules, Offered (Y/N), Slug
        </div>
      </div>
    </div>

    <div class="panel" style="margin-top:14px">
      <div class="panel-header"><div class="panel-title">Recent imports</div></div>
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:0.5px solid var(--gl-border);font-size:12.5px">
        <div style="width:32px;height:32px;border-radius:0;background:rgba(4,120,87,0.10);color:var(--gl-success);display:flex;align-items:center;justify-content:center;font-weight:700">XLS</div>
        <div style="flex:1">
          <div style="font-weight:500">Spring 2026 price sheet.xlsx</div>
          <div style="font-size:11.5px;color:var(--gl-text-mute)">Imported by Sam Chen · 3 weeks ago · 28 products updated, 4 new</div>
        </div>
        <button class="btn ghost sm">View log</button>
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;font-size:12.5px">
        <div style="width:32px;height:32px;border-radius:0;background:rgba(4,120,87,0.10);color:var(--gl-success);display:flex;align-items:center;justify-content:center;font-weight:700">CSV</div>
        <div style="flex:1">
          <div style="font-weight:500">VEKA-7000-pricing-Q1.csv</div>
          <div style="font-size:11.5px;color:var(--gl-text-mute)">Imported by Sam Chen · 2 months ago · 14 products updated</div>
        </div>
        <button class="btn ghost sm">View log</button>
      </div>
    </div>
  `;
}

function renderImportPreview() {
  const ci = state.catalogImport;
  if (!ci.headers || !ci.rawRows) return '<div class="empty-state">No data parsed.</div>';

  const dataRows = ci.rawRows.slice(1, 11);  // first 10 data rows
  const totalRows = ci.rawRows.length - 1;

  // Build mapping rows
  const mappingRows = ci.headers.map((h, idx) => {
    const sample = ci.rawRows[1] ? (ci.rawRows[1][idx] != null ? String(ci.rawRows[1][idx]) : '—') : '—';
    const mapped = ci.fieldMapping[idx] || '';
    return `
      <div class="import-mapping-row">
        <div class="import-source-col">${escapeHtml(String(h))}</div>
        <div class="import-arrow">→</div>
        <div>
          <select class="import-mapping-select" onchange="updateImportMapping(${idx}, this.value)">
            ${IMPORT_FIELD_OPTIONS.map(opt => `<option value="${opt.value}" ${mapped === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
          </select>
        </div>
        <div class="import-sample-cell" title="${escapeHtml(sample)}">${escapeHtml(sample.length > 18 ? sample.slice(0, 18) + '…' : sample)}</div>
      </div>
    `;
  }).join('');

  // Build preview rows with validation
  const validation = validateImportRows();
  const previewRows = dataRows.map((row, ri) => {
    const v = validation.rows[ri] || { errors: [], status: 'new' };
    const flagClass = v.errors.length > 0 ? 'error' : v.status;
    const flagLabel = v.errors.length > 0 ? '⚠ Error' : v.status === 'new' ? '+ New' : v.status === 'update' ? '↻ Update' : '○ Skip';

    const cells = ci.headers.map((h, ci2) => {
      const cell = row[ci2] != null ? String(row[ci2]) : '';
      return `<td title="${escapeHtml(cell)}">${escapeHtml(cell.length > 28 ? cell.slice(0, 28) + '…' : cell)}</td>`;
    }).join('');

    return `
      <tr class="${v.errors.length ? 'has-error' : v.status === 'new' ? 'is-new' : 'is-update'}">
        <td><span class="import-row-flag ${flagClass}">${flagLabel}</span></td>
        ${cells}
      </tr>
    `;
  }).join('');

  return `
    <div class="import-file-card">
      <div class="import-file-icon">${ci.fileName.toLowerCase().endsWith('.csv') ? 'CSV' : 'XLS'}</div>
      <div style="flex:1">
        <div class="import-file-name">${escapeHtml(ci.fileName)}</div>
        <div class="import-file-meta">${(ci.fileSize / 1024).toFixed(1)} KB · ${totalRows} data rows · ${ci.headers.length} columns</div>
      </div>
      <button class="btn ghost sm" onclick="resetImport()">Choose different file</button>
    </div>

    <div class="panel-header" style="padding:0;border:0;margin:18px 0 10px">
      <div class="panel-title" style="font-size:13px">Step 1 · Map columns to fields</div>
    </div>
    <div class="import-mapping-table">
      <div class="import-mapping-row head">
        <div>YOUR COLUMN</div>
        <div></div>
        <div>MAPS TO</div>
        <div>SAMPLE</div>
      </div>
      ${mappingRows}
    </div>

    <div class="panel-header" style="padding:0;border:0;margin:22px 0 10px">
      <div class="panel-title" style="font-size:13px">Step 2 · Choose import mode</div>
    </div>
    <div class="import-mode-grid">
      <div class="import-mode-card ${ci.importMode === 'merge' ? 'active' : ''}" onclick="setImportMode('merge')">
        <div class="import-mode-title">↻ Merge (recommended)</div>
        <div class="import-mode-desc">Update existing products by name + add new. Existing products not in the file are kept untouched.</div>
      </div>
      <div class="import-mode-card ${ci.importMode === 'append' ? 'active' : ''}" onclick="setImportMode('append')">
        <div class="import-mode-title">+ Append only</div>
        <div class="import-mode-desc">Only add products that don't already exist by name. Skip rows for existing products.</div>
      </div>
      <div class="import-mode-card ${ci.importMode === 'replace' ? 'active' : ''}" onclick="setImportMode('replace')">
        <div class="import-mode-title">⚠ Replace all</div>
        <div class="import-mode-desc">Delete every existing product and replace with this file's contents. Cannot be undone without a snapshot rollback.</div>
      </div>
    </div>

    <div class="panel-header" style="padding:0;border:0;margin:22px 0 10px">
      <div class="panel-title" style="font-size:13px">Step 3 · Preview ${dataRows.length < totalRows ? `(first ${dataRows.length} of ${totalRows})` : `(all ${totalRows})`}</div>
    </div>
    <div class="import-preview" style="overflow-x:auto">
      <table class="import-preview-table">
        <thead>
          <tr>
            <th>STATUS</th>
            ${ci.headers.map(h => `<th>${escapeHtml(String(h))}</th>`).join('')}
          </tr>
        </thead>
        <tbody>${previewRows}</tbody>
      </table>
    </div>

    <div class="panel" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:18px;padding:4px 4px 0">
        <div>
          <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--gl-text-mute)">Will add</div>
          <div style="font-size:22px;font-weight:600;font-variant-numeric:tabular-nums;color:#0E7490;letter-spacing:-0.022em">${validation.newCount}</div>
        </div>
        <div style="width:0.5px;height:30px;background:var(--gl-border)"></div>
        <div>
          <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--gl-text-mute)">Will update</div>
          <div style="font-size:22px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--gl-success);letter-spacing:-0.022em">${validation.updateCount}</div>
        </div>
        <div style="width:0.5px;height:30px;background:var(--gl-border)"></div>
        <div>
          <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--gl-text-mute)">Will skip</div>
          <div style="font-size:22px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--gl-text-faint);letter-spacing:-0.022em">${validation.skipCount}</div>
        </div>
        <div style="width:0.5px;height:30px;background:var(--gl-border)"></div>
        <div>
          <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--gl-text-mute)">Errors</div>
          <div style="font-size:22px;font-weight:600;font-variant-numeric:tabular-nums;color:${validation.errorCount > 0 ? 'var(--gl-danger)' : 'var(--gl-text-faint)'};letter-spacing:-0.022em">${validation.errorCount}</div>
        </div>
        <div style="flex:1"></div>
        <button class="btn ghost" onclick="resetImport()">Cancel</button>
        <button class="btn primary" onclick="commitImport()" ${validation.errorCount > 0 || (validation.newCount + validation.updateCount === 0) ? 'disabled' : ''}>Import ${validation.newCount + validation.updateCount} products →</button>
      </div>
    </div>
  `;
}

function renderImportDone() {
  const ci = state.catalogImport;
  return `
    <div class="panel" style="text-align:center;padding:50px 30px">
      <div style="width:64px;height:64px;border-radius:0;background:var(--gl-success-bg);color:var(--gl-success);display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 18px">✓</div>
      <div style="font-size:20px;font-weight:600;letter-spacing:-0.02em;margin-bottom:8px">Import complete</div>
      <div style="font-size:13.5px;color:var(--gl-text-mute);line-height:1.55;max-width:480px;margin:0 auto 22px">
        ${ci.importedCount} new product${ci.importedCount === 1 ? '' : 's'} added · ${ci.updatedCount} existing product${ci.updatedCount === 1 ? '' : 's'} updated${ci.skippedCount > 0 ? ' · ' + ci.skippedCount + ' skipped' : ''}.
        Catalog snapshot v${(state.snapshotVersion || 18) + 1} created — you can roll back from <strong>Snapshots</strong> if needed.
      </div>
      <div style="display:flex;gap:8px;justify-content:center">
        <button class="btn primary" onclick="state.catalogTab='products'; renderCatalog()">View products →</button>
        <button class="btn ghost" onclick="resetImport()">Import another file</button>
      </div>
    </div>
  `;
}

/* === Import logic === */

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function handleImportDrop(e) {
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) handleImportFile(f);
}

function handleImportFile(file) {
  if (!file) return;
  if (typeof XLSX === 'undefined') { toast('Excel library not loaded — refresh the page'); return; }
  const lower = file.name.toLowerCase();
  if (!/\.(xlsx|xls|csv)$/.test(lower)) { toast('Please upload .xlsx, .xls, or .csv'); return; }

  state.catalogImport.fileName = file.name;
  state.catalogImport.fileSize = file.size;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      // Filter blank rows
      const filtered = rows.filter(r => r.some(c => c !== '' && c != null));
      if (filtered.length < 2) { toast('File appears empty or has no data rows'); return; }
      state.catalogImport.rawRows = filtered;
      state.catalogImport.headers = filtered[0];
      autoMapColumns();
      state.catalogImport.step = 'preview';
      toast('Parsed ' + (filtered.length - 1) + ' rows from ' + file.name);
      renderCatalog();
    } catch (err) {
      console.error('Import parse error:', err);
      toast('Could not parse file: ' + (err.message || 'unknown error'));
    }
  };
  reader.onerror = () => toast('Could not read file');
  reader.readAsArrayBuffer(file);
}

function autoMapColumns() {
  const headers = state.catalogImport.headers;
  const mapping = {};
  const patterns = {
    name:        /^(product\s*)?(name|product)$/i,
    category:    /^category$/i,
    family:      /^family$/i,
    baseSize:    /^(base\s*size|size|standard\s*size)$/i,
    factoryCost: /^(factory\s*cost|cost|mfg\s*cost|manufacturing\s*cost|cogs)$/i,
    msrp:        /^(msrp|list\s*price|retail\s*price|suggested\s*price)$/i,
    status:      /^status$/i,
    variants:    /^variants?(\s*count)?$/i,
    rules:       /^rules?(\s*count)?$/i,
    enabled:     /^(offered|enabled|active)/i,
    slug:        /^(slug|sku|code|product\s*id)$/i
  };
  headers.forEach((h, idx) => {
    const hStr = String(h || '').trim();
    for (const [field, regex] of Object.entries(patterns)) {
      if (regex.test(hStr)) { mapping[idx] = field; break; }
    }
  });
  state.catalogImport.fieldMapping = mapping;
}

function updateImportMapping(colIdx, fieldKey) {
  // Clear duplicate mappings — only one column can map to each field
  if (fieldKey) {
    Object.keys(state.catalogImport.fieldMapping).forEach(k => {
      if (state.catalogImport.fieldMapping[k] === fieldKey && parseInt(k, 10) !== colIdx) {
        delete state.catalogImport.fieldMapping[k];
      }
    });
  }
  if (fieldKey) state.catalogImport.fieldMapping[colIdx] = fieldKey;
  else delete state.catalogImport.fieldMapping[colIdx];
  renderCatalog();
}

function setImportMode(mode) {
  state.catalogImport.importMode = mode;
  renderCatalog();
}

function rowToProduct(row) {
  const ci = state.catalogImport;
  const obj = {};
  Object.entries(ci.fieldMapping).forEach(([colIdx, field]) => {
    obj[field] = row[parseInt(colIdx, 10)];
  });
  return obj;
}

function validateImportRows() {
  const ci = state.catalogImport;
  const result = { rows: [], newCount: 0, updateCount: 0, skipCount: 0, errorCount: 0 };
  if (!ci.rawRows || ci.rawRows.length < 2) return result;

  const dataRows = ci.rawRows.slice(1);
  const existingByName = {};
  state.catalog.products.forEach(p => { existingByName[p.name.toLowerCase()] = p; });

  dataRows.forEach((row, idx) => {
    const obj = rowToProduct(row);
    const errors = [];
    let status = 'new';

    if (!obj.name || String(obj.name).trim() === '') errors.push('Missing product name');
    if (obj.factoryCost != null && obj.factoryCost !== '' && isNaN(parseFloat(obj.factoryCost))) errors.push('Invalid factory cost');
    if (obj.msrp != null && obj.msrp !== '' && isNaN(parseFloat(obj.msrp))) errors.push('Invalid MSRP');

    const existing = obj.name ? existingByName[String(obj.name).toLowerCase().trim()] : null;
    if (existing) {
      status = ci.importMode === 'append' ? 'skip' : 'update';
    } else {
      status = ci.importMode === 'replace' ? 'new' : 'new';
    }

    if (errors.length > 0) result.errorCount++;
    else if (status === 'new') result.newCount++;
    else if (status === 'update') result.updateCount++;
    else if (status === 'skip') result.skipCount++;

    result.rows.push({ status, errors });
  });

  return result;
}

function commitImport() {
  const ci = state.catalogImport;
  const validation = validateImportRows();
  if (validation.errorCount > 0) { toast('Fix ' + validation.errorCount + ' errors before importing'); return; }

  const dataRows = ci.rawRows.slice(1);
  let imported = 0, updated = 0, skipped = 0;

  if (ci.importMode === 'replace') {
    state.catalog.products = [];
  }

  const existingByName = {};
  state.catalog.products.forEach(p => { existingByName[p.name.toLowerCase().trim()] = p; });

  dataRows.forEach(row => {
    const obj = rowToProduct(row);
    if (!obj.name || String(obj.name).trim() === '') { skipped++; return; }
    const nameKey = String(obj.name).toLowerCase().trim();
    const existing = existingByName[nameKey];

    const parsed = {
      name: String(obj.name).trim(),
      category: normalizeCategory(obj.category),
      family: obj.family ? String(obj.family).trim() : 'Other',
      baseSize: obj.baseSize ? String(obj.baseSize).trim() : '—',
      factoryCost: obj.factoryCost != null && obj.factoryCost !== '' ? Math.round(parseFloat(obj.factoryCost)) : 0,
      msrp: obj.msrp != null && obj.msrp !== '' ? Math.round(parseFloat(obj.msrp)) : 0,
      status: normalizeStatus(obj.status),
      variants: obj.variants ? parseInt(obj.variants, 10) || 0 : 0,
      rules: obj.rules ? parseInt(obj.rules, 10) || 0 : 0,
      enabled: obj.enabled != null ? /^(y|yes|true|1|enabled|offered|published)/i.test(String(obj.enabled)) : true,
      slug: obj.slug ? String(obj.slug).trim() : slugify(obj.name)
    };

    if (existing && ci.importMode !== 'append') {
      // Update existing
      Object.assign(existing, parsed, { lastEdit: 'Today' });
      // Recompute YTD profit if MSRP/cost changed
      if (existing.ytdUnits > 0 && existing.msrp > 0) {
        existing.ytdProfit = Math.round(existing.ytdRevenue * ((existing.msrp - existing.factoryCost) / existing.msrp));
      }
      updated++;
    } else if (!existing) {
      // Add new
      const maxId = state.catalog.products.reduce((m, p) => Math.max(m, p.id), 0);
      state.catalog.products.push({
        id: maxId + 1,
        ...parsed,
        lastEdit: 'Today',
        ytdUnits: 0, ytdRevenue: 0, ytdProfit: 0
      });
      imported++;
    } else {
      skipped++;
    }
  });

  state.catalogImport.importedCount = imported;
  state.catalogImport.updatedCount = updated;
  state.catalogImport.skippedCount = skipped;
  state.catalogImport.step = 'done';
  state.snapshotVersion = (state.snapshotVersion || 18) + 1;

  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'catalog.bulk_import',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: ci.fileName, meta: imported + ' new · ' + updated + ' updated · ' + skipped + ' skipped · mode: ' + ci.importMode
  });

  toast('Imported: ' + imported + ' new, ' + updated + ' updated' + (skipped > 0 ? ', ' + skipped + ' skipped' : ''));
  renderCatalog();
}

function normalizeCategory(raw) {
  if (!raw) return 'window';
  const s = String(raw).toLowerCase().trim();
  if (/window/.test(s)) return 'window';
  if (/entry|front|exterior\s+door/.test(s)) return 'entry-door';
  if (/patio|sliding|french/.test(s)) return 'patio-door';
  if (/garage/.test(s)) return 'garage-door';
  // Allow direct values
  if (['window', 'entry-door', 'patio-door', 'garage-door'].includes(s)) return s;
  return 'window';  // default
}

function normalizeStatus(raw) {
  if (!raw) return 'draft';
  const s = String(raw).toLowerCase().trim();
  if (/^pub|^live|^active/.test(s)) return 'published';
  if (/^draft/.test(s)) return 'draft';
  if (/^disab|^inactive|^archive/.test(s)) return 'disabled';
  return 'draft';
}

function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

function resetImport() {
  state.catalogImport = {
    step: 'upload', fileName: null, fileSize: 0, rawRows: null, headers: null,
    fieldMapping: {}, importMode: 'merge', errors: [], warnings: [],
    importedCount: 0, skippedCount: 0, updatedCount: 0
  };
  renderCatalog();
}

function downloadCatalogTemplate(withData) {
  if (typeof XLSX === 'undefined') { toast('Excel library not loaded — refresh the page'); return; }
  const headers = ['Product Name', 'Category', 'Family', 'Base Size', 'Factory Cost', 'MSRP', 'Status', 'Variants', 'Rules', 'Offered', 'Slug'];
  let rows = [headers];

  if (withData) {
    state.catalog.products.forEach(p => {
      rows.push([
        p.name, p.category, p.family, p.baseSize,
        p.factoryCost, p.msrp, p.status,
        p.variants, p.rules,
        p.enabled ? 'Yes' : 'No',
        p.slug
      ]);
    });
  } else {
    rows.push(['Casement 4500',          'window',      'Casement',      '900x1200', 580,  1450, 'published', 12, 7, 'Yes', 'casement-4500']);
    rows.push(['Awning 4500',            'window',      'Awning',        '900x600',  420,  1080, 'published', 6,  4, 'Yes', 'awning-4500']);
    rows.push(['Picture window',         'window',      'Picture',       '1500x1200',380,  980,  'published', 18, 3, 'Yes', 'picture-window']);
    rows.push(['Entry Flush Fiberglass', 'entry-door',  'Flush',         '914x2032', 1180, 2980, 'draft',     0,  0, 'No',  'entry-flush-fiberglass']);
    rows.push(['Patio Sliding 2-panel',  'patio-door',  'Sliding',       '1828x2032',1540, 3920, 'draft',     0,  0, 'No',  'patio-sliding-2']);
    rows.push(['Garage Steel 16ft',      'garage-door', 'Steel sectional','4877x2134',1860,4680, 'draft',     0,  0, 'No',  'garage-steel-sect-16']);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  // Column widths
  ws['!cols'] = [
    { wch: 32 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
    { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 26 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  // Instructions sheet
  const instructions = [
    ['OpenSpec Catalog Import Template'],
    [''],
    ['Field', 'Required?', 'Notes'],
    ['Product Name', 'Yes', 'Used to match existing products on import'],
    ['Category', 'Yes', 'window | entry-door | patio-door | garage-door'],
    ['Family', 'No', 'Free text — Casement, Awning, Sliding, etc.'],
    ['Base Size', 'No', 'Reference size like 900x1200 (mm)'],
    ['Factory Cost', 'Yes', 'Per-unit manufacturing cost in CAD'],
    ['MSRP', 'Yes', 'Manufacturer suggested retail price in CAD'],
    ['Status', 'No', 'published | draft | disabled — defaults to draft'],
    ['Variants', 'No', 'Variant count (informational)'],
    ['Rules', 'No', 'Configurator rule count (informational)'],
    ['Offered', 'No', 'Yes | No — defaults to Yes'],
    ['Slug', 'No', 'URL-safe identifier — auto-generated from name if blank']
  ];
  const insWs = XLSX.utils.aoa_to_sheet(instructions);
  insWs['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, insWs, 'Instructions');

  XLSX.writeFile(wb, withData ? 'openspec-catalog-current.xlsx' : 'openspec-catalog-template.xlsx');
  toast(withData ? 'Downloaded current catalog' : 'Downloaded blank template');
}

/* ════════════════════════════════════════════════
   CATALOG COMPONENTS — glass, hardware, screens, trim, misc
   ════════════════════════════════════════════════ */

function renderCatalogComponents() {
  const components = state.catalog.components;
  const catFilter = state.componentCategoryFilter;
  const statusFilter = state.componentStatusFilter;

  const categoryDefs = [
    { id: 'all',          label: 'All',          count: components.length },
    { id: 'glass',        label: 'Glass / IGU',  count: components.filter(c => c.category === 'glass').length },
    { id: 'hardware',     label: 'Hardware',     count: components.filter(c => c.category === 'hardware').length },
    { id: 'weatherstrip', label: 'Weatherstrip', count: components.filter(c => c.category === 'weatherstrip').length },
    { id: 'screen',       label: 'Screens',      count: components.filter(c => c.category === 'screen').length },
    { id: 'trim',         label: 'Trim',         count: components.filter(c => c.category === 'trim').length },
    { id: 'misc',         label: 'Safety / Misc', count: components.filter(c => c.category === 'misc').length }
  ];

  const statusDefs = [
    { id: 'all',      label: 'All',          count: components.length },
    { id: 'enabled',  label: 'Offered',      count: components.filter(c => c.enabled).length },
    { id: 'disabled', label: 'Not offered',  count: components.filter(c => !c.enabled).length },
    { id: 'base',     label: '★ Included (base)', count: components.filter(c => c.isBase).length }
  ];

  let filtered = components;
  if (catFilter !== 'all') filtered = filtered.filter(c => c.category === catFilter);
  if (statusFilter === 'enabled')  filtered = filtered.filter(c => c.enabled);
  if (statusFilter === 'disabled') filtered = filtered.filter(c => !c.enabled);
  if (statusFilter === 'base')     filtered = filtered.filter(c => c.isBase);

  // Group by category for display
  const grouped = {};
  filtered.forEach(c => {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category].push(c);
  });

  const categoryLabels = {
    'glass': 'Glass / IGU options',
    'hardware': 'Hardware (locks, hinges, operators)',
    'weatherstrip': 'Weatherstripping & seals',
    'screen': 'Insect screens & meshes',
    'trim': 'Trim, brickmold & jamb extensions',
    'misc': 'Safety, security & misc options'
  };
  const categoryOrder = ['glass', 'hardware', 'weatherstrip', 'screen', 'trim', 'misc'];

  // Totals
  const offeredCount = components.filter(c => c.enabled).length;
  const baseCount = components.filter(c => c.isBase).length;
  const totalYtdRevenue = components.reduce((s, c) => s + (c.ytdRevenue || 0), 0);
  const totalYtdUnits = components.reduce((s, c) => s + (c.ytdUnits || 0), 0);

  const compRow = (c) => {
    const margin = c.upcharge > 0 ? ((c.upcharge - c.factoryCost) / c.upcharge) * 100 : 0;
    const marginClass = c.upcharge === 0 ? 'fair' : (margin >= 55 ? 'healthy' : margin >= 40 ? 'fair' : 'low');
    const initials = c.name.split(/[\s·]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return `
      <div class="comp-row ${!c.enabled ? 'disabled' : ''} ${c.isBase ? 'is-base' : ''}">
        <div>
          <div class="comp-icon ${c.category}">${initials}</div>
        </div>
        <div>
          <div class="comp-name">
            ${c.name}
            ${c.isBase ? '<span class="comp-base-pill" title="Included in base product price">★ BASE</span>' : ''}
          </div>
          <div class="comp-meta">
            ${escapeHtml(c.notes || '')}
          </div>
        </div>
        <div><span class="comp-type-pill">${c.type}</span></div>
        <div class="comp-vendor">${c.vendor}</div>
        <div class="cat-price-prefix">
          <input type="number" class="cat-price-input cost" value="${c.factoryCost}" step="0.5" min="0"
            onchange="updateComponentCost(${c.id}, this.value)"
            title="Factory cost — what it costs us per ${c.uom}" />
        </div>
        <div class="cat-price-prefix">
          <input type="number" class="cat-price-input msrp" value="${c.upcharge}" step="5" min="0"
            onchange="updateComponentUpcharge(${c.id}, this.value)"
            title="Upcharge — what dealers pay on top of base price (0 = included)" />
        </div>
        <div class="comp-uom">${c.uom}</div>
        <div class="cat-margin ${marginClass}">${c.upcharge === 0 ? 'incl.' : margin.toFixed(0) + '%'}</div>
        <div>
          <label class="toggle-switch" title="${c.enabled ? 'Offered to dealers' : 'Not offered'}">
            <input type="checkbox" ${c.enabled ? 'checked' : ''} onchange="toggleComponentEnabled(${c.id})" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    `;
  };

  const componentSection = (cat) => {
    if (!grouped[cat] || grouped[cat].length === 0) return '';
    const items = grouped[cat];
    const enabledCount = items.filter(c => c.enabled).length;
    const baseCount = items.filter(c => c.isBase).length;
    return `
      <div class="cat-category-section">
        <div class="cat-category-head">
          <div class="cat-category-title">${categoryLabels[cat]}</div>
          <div class="cat-category-count">${enabledCount} of ${items.length} offered${baseCount > 0 ? ' · ' + baseCount + ' included in base' : ''}</div>
        </div>
        ${items.map(compRow).join('')}
      </div>
    `;
  };

  return `
    <div class="profit-summary">
      <div class="profit-card">
        <div class="profit-card-label">Components offered</div>
        <div class="profit-card-value">${offeredCount}<span style="font-size:18px;color:var(--gl-text-mute);font-weight:500"> / ${components.length}</span></div>
        <div class="profit-card-sub">across ${categoryDefs.length - 1} categories</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">Included in base</div>
        <div class="profit-card-value" style="color:var(--gl-info)">${baseCount}</div>
        <div class="profit-card-sub">standard equipment · no upcharge</div>
      </div>
      <div class="profit-card highlight">
        <div class="profit-card-label">YTD Upcharge Revenue</div>
        <div class="profit-card-value">${fmtMoney(totalYtdRevenue)}</div>
        <div class="profit-card-sub">${totalYtdUnits} component upgrades sold</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">Top upgrade</div>
        <div class="profit-card-value" style="font-size:15px;line-height:1.25">${components.slice().sort((a, b) => (b.ytdRevenue || 0) - (a.ytdRevenue || 0))[0].name}</div>
        <div class="profit-card-sub">${fmtMoney(components.slice().sort((a, b) => (b.ytdRevenue || 0) - (a.ytdRevenue || 0))[0].ytdRevenue)} YTD</div>
      </div>
    </div>

    <div class="tabs" style="margin-bottom:10px;flex-wrap:wrap">
      ${categoryDefs.map(c => `
        <button class="tab ${catFilter === c.id ? 'active' : ''}" onclick="state.componentCategoryFilter='${c.id}'; renderCatalog()">${c.label}<span class="tab-count">${c.count}</span></button>
      `).join('')}
    </div>
    <div class="tabs" style="margin-bottom:14px">
      ${statusDefs.map(s => `
        <button class="tab ${statusFilter === s.id ? 'active' : ''}" onclick="state.componentStatusFilter='${s.id}'; renderCatalog()">${s.label}<span class="tab-count">${s.count}</span></button>
      `).join('')}
    </div>

    <div class="cat-bulk-bar">
      <span class="cat-bulk-label">${filtered.length} component${filtered.length === 1 ? '' : 's'} matching filters</span>
      <div style="flex:1"></div>
      <button class="btn sm ghost" onclick="enableAllComponentsInCategory('${catFilter}')" ${catFilter === 'all' ? 'disabled' : ''}>Enable all visible</button>
      <button class="btn sm ghost" onclick="disableAllComponentsInCategory('${catFilter}')" ${catFilter === 'all' ? 'disabled' : ''}>Disable all visible</button>
      <button class="btn sm primary" onclick="addNewComponent()">+ Add component</button>
    </div>

    <div style="display:grid;grid-template-columns:44px 1.5fr 130px 90px 110px 110px 80px 100px 70px;align-items:center;gap:10px;padding:6px 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--gl-text-mute);margin-bottom:4px">
      <div></div>
      <div>COMPONENT</div>
      <div>TYPE</div>
      <div>VENDOR</div>
      <div style="text-align:right;color:var(--gl-warn)">FACTORY COST</div>
      <div style="text-align:right">UPCHARGE</div>
      <div style="text-align:center">UOM</div>
      <div style="text-align:center">MARGIN</div>
      <div style="text-align:center">OFFER</div>
    </div>

    ${categoryOrder.map(componentSection).join('')}

    ${filtered.length === 0 ? `<div class="panel"><div class="empty-state">No components match these filters.</div></div>` : ''}

    <div style="margin-top:16px;padding:14px 22px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute);line-height:1.55">
      <strong style="color:var(--gl-text);font-weight:600">★ BASE</strong> components (blue left edge) are included in the standard product price — dealers don't pay extra. Upcharge = $0 for these.
      Other components show an upcharge that's added to the customer's quote when selected in the configurator.
      <strong style="color:var(--gl-warn);font-weight:600;margin-left:10px">Factory cost</strong> is what you pay your supplier;
      <strong style="color:var(--gl-text);font-weight:600;margin-left:6px">Upcharge</strong> is what the dealer pays on top of base price.
      Margin = (Upcharge − Cost) / Upcharge.
    </div>
  `;
}

function toggleComponentEnabled(id) {
  const c = state.catalog.components.find(x => x.id === id);
  if (!c) return;
  c.enabled = !c.enabled;
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'catalog.component_' + (c.enabled ? 'enabled' : 'disabled'),
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: c.name, meta: c.enabled ? 'Added to offered components' : 'Removed from offered components'
  });
  toast(c.name + (c.enabled ? ' enabled' : ' disabled'));
  renderCatalog();
}

function updateComponentCost(id, raw) {
  const c = state.catalog.components.find(x => x.id === id);
  if (!c) return;
  const v = parseFloat(raw);
  if (isNaN(v) || v < 0) { toast('Invalid cost'); renderCatalog(); return; }
  const old = c.factoryCost;
  c.factoryCost = v;
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'catalog.component_cost_changed',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: c.name, meta: `Cost: ${fmtMoneyFull(old)} → ${fmtMoneyFull(v)} per ${c.uom}`
  });
  toast(c.name + ' cost updated to ' + fmtMoneyFull(v) + '/' + c.uom);
  renderCatalog();
}

function updateComponentUpcharge(id, raw) {
  const c = state.catalog.components.find(x => x.id === id);
  if (!c) return;
  const v = parseFloat(raw);
  if (isNaN(v) || v < 0) { toast('Invalid upcharge'); renderCatalog(); return; }
  const old = c.upcharge;
  c.upcharge = v;
  c.isBase = v === 0;
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'catalog.component_upcharge_changed',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: c.name, meta: `Upcharge: ${fmtMoneyFull(old)} → ${fmtMoneyFull(v)}`
  });
  toast(c.name + ' upcharge updated to ' + fmtMoneyFull(v));
  renderCatalog();
}

function enableAllComponentsInCategory(cat) {
  if (cat === 'all') return;
  state.catalog.components.filter(c => c.category === cat && !c.enabled).forEach(c => c.enabled = true);
  toast('All visible ' + cat + ' components enabled');
  renderCatalog();
}

function disableAllComponentsInCategory(cat) {
  if (cat === 'all') return;
  state.catalog.components.filter(c => c.category === cat && c.enabled).forEach(c => c.enabled = false);
  toast('All visible ' + cat + ' components disabled');
  renderCatalog();
}

function addNewComponent() {
  const name = prompt('Component name (e.g. "Quadruple-pane Low-E"):');
  if (!name || !name.trim()) return;
  const catChoice = prompt('Category:\n1. glass\n2. hardware\n3. weatherstrip\n4. screen\n5. trim\n6. misc\n\nEnter number or name:');
  if (!catChoice) return;
  const cats = ['glass', 'hardware', 'weatherstrip', 'screen', 'trim', 'misc'];
  const idx = parseInt(catChoice, 10) - 1;
  const category = cats[idx] || (cats.includes(catChoice.toLowerCase()) ? catChoice.toLowerCase() : 'misc');

  const cost = parseFloat(prompt('Factory cost (per unit, $):') || '0') || 0;
  const upcharge = parseFloat(prompt('Upcharge to customer ($, 0 = included in base):') || '0') || 0;
  const uomChoice = prompt('UOM (m / m² / ea / kit / pr / window):') || 'ea';

  const maxId = state.catalog.components.reduce((m, c) => Math.max(m, c.id), 0);
  const newComp = {
    id: maxId + 1,
    slug: slugify(name),
    name: name.trim(),
    category,
    type: 'Custom',
    vendor: 'TBD',
    enabled: true,
    factoryCost: cost,
    upcharge,
    uom: uomChoice.trim(),
    ytdUnits: 0, ytdRevenue: 0,
    notes: '',
    isBase: upcharge === 0
  };
  state.catalog.components.push(newComp);

  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'catalog.component_added',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: name, meta: category + ' · cost ' + fmtMoneyFull(cost) + ' · upcharge ' + fmtMoneyFull(upcharge)
  });
  toast(name + ' added to ' + category + ' components');
  renderCatalog();
}

/* ════════════════════════════════════════════════
   PRICING TABLES — Size × option grids per product
   ════════════════════════════════════════════════ */

function renderPricingTables() {
  const productsWithTables = Object.keys(state.pricingTables);
  const products = state.catalog.products;
  const selectedId = state.pricingTableProductId;
  const selectedProduct = products.find(p => p.id === selectedId);
  const tableKey = selectedProduct ? selectedProduct.slug : null;
  const table = tableKey ? state.pricingTables[tableKey] : null;

  const productOptions = products.map(p => `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.name}${state.pricingTables[p.slug] ? ' ✓' : ' (no table)'}</option>`).join('');

  // Summary cards
  const totalProducts = products.length;
  const withTables = productsWithTables.length;
  const totalCells = Object.values(state.pricingTables).reduce((s, t) => s + Object.keys(t.grid || {}).length, 0);
  const avgPrice = totalCells > 0 ?
    Object.values(state.pricingTables).reduce((s, t) => s + Object.values(t.grid).reduce((ss, v) => ss + v, 0), 0) / totalCells : 0;

  return `
    <div class="profit-summary">
      <div class="profit-card">
        <div class="profit-card-label">Products with tables</div>
        <div class="profit-card-value">${withTables}<span style="font-size:18px;color:var(--gl-text-mute);font-weight:500"> / ${totalProducts}</span></div>
        <div class="profit-card-sub">${totalProducts - withTables} products use base MSRP only</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">Total size cells</div>
        <div class="profit-card-value">${totalCells.toLocaleString()}</div>
        <div class="profit-card-sub">across ${withTables} pricing grids</div>
      </div>
      <div class="profit-card highlight">
        <div class="profit-card-label">Avg cell price</div>
        <div class="profit-card-value">${fmtMoney(Math.round(avgPrice))}</div>
        <div class="profit-card-sub">blended across all sizes</div>
      </div>
      <div class="profit-card">
        <div class="profit-card-label">Last update</div>
        <div class="profit-card-value" style="font-size:17px">${table ? fmtDate(table.lastUpdated) : '—'}</div>
        <div class="profit-card-sub">${table ? 'by ' + table.uploadedBy : 'no recent uploads'}</div>
      </div>
    </div>

    <div class="pt-product-picker">
      <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--gl-text-mute)">VIEWING:</span>
      <select onchange="state.pricingTableProductId = parseInt(this.value, 10); renderCatalog()">
        ${productOptions}
      </select>
      ${table ? `
        <div class="pt-meta">
          <span><strong>${table.widths.length}</strong> widths × <strong>${table.heights.length}</strong> heights = <strong>${table.widths.length * table.heights.length}</strong> cells</span>
          <span>Version <strong>${table.version}</strong></span>
          <span>Source: <strong>${table.sourceFile}</strong></span>
        </div>
      ` : ''}
      <button class="btn primary sm" onclick="uploadPricingTable(${selectedId})">📥 Upload Excel</button>
      ${table ? `<button class="btn ghost sm" onclick="downloadPricingTable('${tableKey}')">📄 Export</button>` : ''}
    </div>

    ${table ? renderPricingGrid(selectedProduct, table) : renderPricingEmpty(selectedProduct)}
  `;
}

function renderPricingEmpty(product) {
  return `
    <div class="pt-empty">
      <div class="pt-empty-icon">📊</div>
      <div class="pt-empty-title">No pricing table for ${product.name}</div>
      <div class="pt-empty-desc">
        This product currently uses a single MSRP of <strong>${fmtMoneyFull(product.msrp)}</strong> for all sizes. Upload an Excel pricing sheet to set per-size prices, frame color multipliers, and glazing-package upcharges.
      </div>
      <button class="btn primary" onclick="uploadPricingTable(${product.id})">📥 Upload Excel pricing sheet</button>
      <button class="btn ghost" onclick="downloadPricingTemplate(${product.id})" style="margin-left:8px">📋 Download template</button>
    </div>
  `;
}

function renderPricingGrid(product, table) {
  const { widths, heights, grid, colorMultipliers, glazingDeltas } = table;

  const colHeaders = heights.map(h => `<th>${h}</th>`).join('');
  const rows = widths.map(w => {
    const cells = heights.map(h => {
      const key = `${w}x${h}`;
      const val = grid[key];
      if (val == null) {
        return `<td class="pt-cell missing" onclick="editPricingCell('${product.slug}', '${key}')" title="${w}×${h}mm — no price set, click to add">—</td>`;
      }
      return `<td class="pt-cell" title="${w}×${h}mm = ${fmtMoneyFull(val)}">
        <input type="number" value="${val}" step="10" min="0"
          onchange="updatePricingCell('${product.slug}', '${key}', this.value)"
          onclick="event.target.select()" />
      </td>`;
    }).join('');
    return `<tr><td class="row-label">${w}</td>${cells}</tr>`;
  }).join('');

  // Sample calc — use middle of the grid as default
  const sampleW = widths[Math.floor(widths.length / 2)];
  const sampleH = heights[Math.floor(heights.length / 2)];

  return `
    <div class="pt-grid-wrap">
      <div class="pt-grid-head">
        <div>
          <div class="pt-grid-title">📐 Size × Price grid · ${product.name}</div>
          <div class="pt-grid-sub">All prices in CAD · base configuration (white frame, Low-E 272/Argon DH IGU) · click any cell to edit</div>
        </div>
        <div style="flex:1"></div>
        <span style="font-size:11px;color:var(--gl-text-faint);padding:6px 12px;border:0.5px solid var(--gl-border);border-radius:0;font-family:var(--gl-mono)">Widths ↓  Heights →  (mm)</span>
      </div>
      <div class="pt-grid-scroll">
        <table class="pt-grid">
          <thead>
            <tr>
              <th class="corner">W × H</th>
              ${colHeaders}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>

    <div class="pt-modifiers">
      <div class="pt-mod-panel">
        <div class="pt-mod-row head">
          <div>FRAME COLOR</div>
          <div style="text-align:right">MULTIPLIER</div>
        </div>
        ${Object.entries(colorMultipliers).map(([color, mult]) => `
          <div class="pt-mod-row">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:14px;height:14px;border-radius:0;background:${swatchColor(color)};border:0.5px solid var(--gl-border)"></div>
              ${color.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
            <input type="number" class="pt-mod-input" value="${mult.toFixed(2)}" step="0.01" min="0.50" max="2.00"
              onchange="updateColorMultiplier('${product.slug}', '${color}', this.value)" />
          </div>
        `).join('')}
      </div>

      <div class="pt-mod-panel">
        <div class="pt-mod-row head">
          <div>GLAZING PACKAGE</div>
          <div style="text-align:right">DELTA ($)</div>
        </div>
        ${Object.entries(glazingDeltas).map(([glaz, delta]) => `
          <div class="pt-mod-row">
            <div>${glazingLabel(glaz)}</div>
            <input type="number" class="pt-mod-input" value="${delta}" step="10"
              onchange="updateGlazingDelta('${product.slug}', '${glaz}', this.value)" />
          </div>
        `).join('')}
      </div>
    </div>

    ${renderPricingCalculator(product, table, sampleW, sampleH)}
  `;
}

function renderPricingCalculator(product, table, w, h) {
  return `
    <div class="pt-calc">
      <div style="font-size:13.5px;font-weight:600;letter-spacing:-0.01em;margin-bottom:10px">💰 Quick price lookup</div>
      <div class="pt-calc-fields">
        <div>
          <div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--gl-text-mute);margin-bottom:4px">Width (mm)</div>
          <select id="calc-w-${product.id}" class="form-select" style="padding:7px 10px;font-size:12.5px" onchange="recalcPriceLookup(${product.id})">
            ${table.widths.map(x => `<option value="${x}" ${x === w ? 'selected' : ''}>${x}</option>`).join('')}
          </select>
        </div>
        <div>
          <div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--gl-text-mute);margin-bottom:4px">Height (mm)</div>
          <select id="calc-h-${product.id}" class="form-select" style="padding:7px 10px;font-size:12.5px" onchange="recalcPriceLookup(${product.id})">
            ${table.heights.map(x => `<option value="${x}" ${x === h ? 'selected' : ''}>${x}</option>`).join('')}
          </select>
        </div>
        <div>
          <div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--gl-text-mute);margin-bottom:4px">Color</div>
          <select id="calc-c-${product.id}" class="form-select" style="padding:7px 10px;font-size:12.5px" onchange="recalcPriceLookup(${product.id})">
            ${Object.keys(table.colorMultipliers).map(c => `<option value="${c}">${c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>`).join('')}
          </select>
        </div>
        <div id="calc-result-${product.id}" class="pt-calc-result">${fmtMoneyFull(grid_get(table, w, h))}</div>
      </div>
      <div style="margin-top:6px">
        <div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--gl-text-mute);margin-bottom:4px">Glazing</div>
        <select id="calc-g-${product.id}" class="form-select" style="padding:7px 10px;font-size:12.5px;max-width:300px" onchange="recalcPriceLookup(${product.id})">
          ${Object.keys(table.glazingDeltas).map(g => `<option value="${g}" ${g === 'dbl-lowe-272-ar' ? 'selected' : ''}>${glazingLabel(g)}</option>`).join('')}
        </select>
      </div>
      <div id="calc-breakdown-${product.id}" class="pt-calc-breakdown">
        ${renderCalcBreakdown(table, w, h, 'white', 'dbl-lowe-272-ar')}
      </div>
    </div>
  `;
}

function grid_get(table, w, h) {
  return table.grid[`${w}x${h}`] || 0;
}

function lookupPrice(table, w, h, color, glazing) {
  const base = grid_get(table, w, h);
  if (base === 0) return { base: 0, colorAdj: 0, glazingDelta: 0, total: 0 };
  const colorMult = table.colorMultipliers[color] || 1.0;
  const colorAdj = base * (colorMult - 1);
  const glazingDelta = table.glazingDeltas[glazing] || 0;
  return {
    base,
    colorAdj: Math.round(colorAdj),
    glazingDelta,
    total: Math.round(base * colorMult + glazingDelta)
  };
}

function renderCalcBreakdown(table, w, h, color, glazing) {
  const calc = lookupPrice(table, w, h, color, glazing);
  if (calc.base === 0) return '<div class="pt-calc-line">No price for this size</div><div class="pt-calc-amt">—</div>';

  return `
    <div class="pt-calc-line">Base ${w}×${h}mm (white, DH Low-E 272 / Argon)</div>
    <div class="pt-calc-amt">${fmtMoneyFull(calc.base)}</div>
    ${calc.colorAdj !== 0 ? `
      <div class="pt-calc-line">${color.replace(/-/g, ' ')} color upcharge</div>
      <div class="pt-calc-amt add">+${fmtMoneyFull(calc.colorAdj)}</div>
    ` : ''}
    ${calc.glazingDelta !== 0 ? `
      <div class="pt-calc-line">${glazingLabel(glazing)} glazing delta</div>
      <div class="pt-calc-amt ${calc.glazingDelta > 0 ? 'add' : 'subtract'}">${calc.glazingDelta > 0 ? '+' : ''}${fmtMoneyFull(calc.glazingDelta)}</div>
    ` : ''}
    <div class="pt-calc-line total">TOTAL MSRP</div>
    <div class="pt-calc-amt total">${fmtMoneyFull(calc.total)}</div>
  `;
}

function recalcPriceLookup(productId) {
  const product = state.catalog.products.find(p => p.id === productId);
  if (!product) return;
  const table = state.pricingTables[product.slug];
  if (!table) return;
  const w = parseInt(document.getElementById('calc-w-' + productId).value, 10);
  const h = parseInt(document.getElementById('calc-h-' + productId).value, 10);
  const color = document.getElementById('calc-c-' + productId).value;
  const glazing = document.getElementById('calc-g-' + productId).value;
  const calc = lookupPrice(table, w, h, color, glazing);
  document.getElementById('calc-result-' + productId).textContent = fmtMoneyFull(calc.total);
  document.getElementById('calc-breakdown-' + productId).innerHTML = renderCalcBreakdown(table, w, h, color, glazing);
}

function swatchColor(slug) {
  return {
    'white': '#FAFAFA',
    'almond': '#F4ECD8',
    'sand': '#E8DCC0',
    'commercial-brown': '#5C4A3A',
    'bronze': '#6F4F28',
    'black-laminate': '#1A1A1A',
    'woodgrain': '#8B5A3C'
  }[slug] || '#94A3B8';
}

function glazingLabel(slug) {
  return {
    'dbl-clear': 'Double-pane clear',
    'dbl-lowe-272-ar': 'Double · Low-E 272 / Argon (base)',
    'dbl-lowe-180': 'Double · Low-E 180 (cold climate)',
    'dbl-lowe-366': 'Double · Low-E 366',
    'trp-lowe-kr': 'Triple · Low-E / Krypton',
    'trp-lowe-kr-tempered': 'Triple · Low-E / Krypton (tempered)'
  }[slug] || slug;
}

/* Cell editing */
function updatePricingCell(productSlug, key, raw) {
  const table = state.pricingTables[productSlug];
  if (!table) return;
  const v = parseFloat(raw);
  if (isNaN(v) || v < 0) { toast('Invalid price'); renderCatalog(); return; }
  const old = table.grid[key];
  table.grid[key] = Math.round(v);
  table.lastUpdated = '2026-05-11';
  table.uploadedBy = state.user.name;
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'pricing.cell_changed',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: productSlug + ' · ' + key,
    meta: `${fmtMoneyFull(old || 0)} → ${fmtMoneyFull(v)}`
  });
  toast(productSlug + ' · ' + key + ' updated to ' + fmtMoneyFull(v));
  // Don't full re-render — input keeps focus this way
}

function editPricingCell(productSlug, key) {
  const raw = prompt('Set price for ' + key + 'mm (CAD):', '');
  if (raw == null || raw === '') return;
  updatePricingCell(productSlug, key, raw);
  renderCatalog();
}

function updateColorMultiplier(productSlug, color, raw) {
  const table = state.pricingTables[productSlug];
  if (!table) return;
  const v = parseFloat(raw);
  if (isNaN(v) || v < 0.5 || v > 2.0) { toast('Multiplier must be 0.50–2.00'); renderCatalog(); return; }
  const old = table.colorMultipliers[color];
  table.colorMultipliers[color] = v;
  table.lastUpdated = '2026-05-11';
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'pricing.color_multiplier_changed',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: productSlug + ' · ' + color,
    meta: `${(old * 100).toFixed(0)}% → ${(v * 100).toFixed(0)}%`
  });
  toast(color + ' multiplier: ' + (v * 100).toFixed(0) + '% of base');
}

function updateGlazingDelta(productSlug, glaz, raw) {
  const table = state.pricingTables[productSlug];
  if (!table) return;
  const v = parseFloat(raw);
  if (isNaN(v)) { toast('Invalid delta'); renderCatalog(); return; }
  const old = table.glazingDeltas[glaz];
  table.glazingDeltas[glaz] = Math.round(v);
  table.lastUpdated = '2026-05-11';
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'pricing.glazing_delta_changed',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: productSlug + ' · ' + glaz,
    meta: `${fmtMoneyFull(old)} → ${fmtMoneyFull(v)}`
  });
  toast(glazingLabel(glaz) + ' delta: ' + (v >= 0 ? '+' : '') + fmtMoneyFull(v));
}

/* Excel upload */
function uploadPricingTable(productId) {
  if (typeof XLSX === 'undefined') { toast('Excel library not loaded — refresh the page'); return; }
  state.pricingImport = {
    step: 'upload', fileName: null, fileSize: 0,
    sheets: [], activeSheetIdx: 0,
    targetProductId: productId, importMode: 'replace', errors: []
  };

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls,.csv';
  input.onchange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    parsePricingExcel(f, productId);
  };
  input.click();
}

function parsePricingExcel(file, productId) {
  state.pricingImport.fileName = file.name;
  state.pricingImport.fileSize = file.size;
  state.pricingImport.targetProductId = productId;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const sheets = [];
      wb.SheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        const filtered = rows.filter(r => r.some(c => c !== '' && c != null));
        if (filtered.length < 2) return;
        sheets.push({
          name: sheetName,
          rows: filtered,
          productMatch: matchProductSlug(sheetName)
        });
      });

      if (sheets.length === 0) { toast('No usable sheets found in file'); return; }

      const parsed = parsePricingGrid(sheets[0].rows);
      if (!parsed) { toast('Could not detect size grid. First row should be heights, first column should be widths'); return; }

      // Apply to target product
      const product = state.catalog.products.find(p => p.id === productId);
      if (!product) return;
      const existing = state.pricingTables[product.slug];
      state.pricingTables[product.slug] = {
        lastUpdated: new Date().toISOString().slice(0, 10),
        uploadedBy: state.user.name,
        sourceFile: file.name,
        version: existing ? incrementVersion(existing.version) : 'v1',
        widths: parsed.widths,
        heights: parsed.heights,
        grid: parsed.grid,
        colorMultipliers: existing ? existing.colorMultipliers : {
          'white': 1.00, 'bronze': 1.05, 'black-laminate': 1.12
        },
        glazingDeltas: existing ? existing.glazingDeltas : {
          'dbl-clear': -180, 'dbl-lowe-272-ar': 0, 'trp-lowe-kr': 280
        }
      };

      state.auditEvents.unshift({
        id: state.auditEvents.length + 1, kind: 'pricing.table_uploaded',
        actor: state.user.name, initials: state.user.initials,
        tenantId: 'northforge', scope: 'own', at: 'just now',
        target: product.name,
        meta: parsed.widths.length + '×' + parsed.heights.length + ' = ' + Object.keys(parsed.grid).length + ' cells · ' + file.name
      });

      toast('✓ Pricing table imported · ' + Object.keys(parsed.grid).length + ' cells loaded');
      renderCatalog();
    } catch (err) {
      console.error('Pricing parse error:', err);
      toast('Could not parse pricing sheet: ' + (err.message || 'unknown'));
    }
  };
  reader.onerror = () => toast('Could not read file');
  reader.readAsArrayBuffer(file);
}

function parsePricingGrid(rows) {
  // Expect: row 0 = [w/h label, h1, h2, ...], row 1+ = [w1, p11, p12, ...]
  if (rows.length < 2) return null;
  const header = rows[0];
  // First cell could be empty or a label; treat remaining as heights
  const heights = header.slice(1).map(h => parseInt(h, 10)).filter(h => !isNaN(h));
  if (heights.length < 2) return null;

  const widths = [];
  const grid = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const w = parseInt(row[0], 10);
    if (isNaN(w)) continue;
    widths.push(w);
    for (let j = 0; j < heights.length; j++) {
      const cell = row[j + 1];
      const price = parseFloat(cell);
      if (!isNaN(price) && price > 0) {
        grid[`${w}x${heights[j]}`] = Math.round(price);
      }
    }
  }
  if (widths.length === 0 || Object.keys(grid).length === 0) return null;
  return { widths, heights, grid };
}

function matchProductSlug(sheetName) {
  const slug = sheetName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return state.catalog.products.find(p => p.slug === slug || p.name.toLowerCase().includes(sheetName.toLowerCase()));
}

function incrementVersion(v) {
  const m = v.match(/^v(\d+)$/);
  return m ? 'v' + (parseInt(m[1], 10) + 1) : 'v1';
}

function downloadPricingTable(slug) {
  if (typeof XLSX === 'undefined') { toast('Excel library not loaded'); return; }
  const table = state.pricingTables[slug];
  if (!table) return;
  const product = state.catalog.products.find(p => p.slug === slug);

  const rows = [];
  // Header: empty + heights
  rows.push(['Width \\ Height (mm)', ...table.heights]);
  table.widths.forEach(w => {
    rows.push([w, ...table.heights.map(h => table.grid[`${w}x${h}`] || '')]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, ...table.heights.map(() => ({ wch: 10 }))];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Size Grid');

  // Color sheet
  const colorRows = [['Frame Color', 'Multiplier'], ...Object.entries(table.colorMultipliers).map(([c, m]) => [c, m])];
  const colorWs = XLSX.utils.aoa_to_sheet(colorRows);
  colorWs['!cols'] = [{ wch: 22 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, colorWs, 'Colors');

  // Glazing sheet
  const glazRows = [['Glazing Package', 'Delta ($)'], ...Object.entries(table.glazingDeltas).map(([g, d]) => [g, d])];
  const glazWs = XLSX.utils.aoa_to_sheet(glazRows);
  glazWs['!cols'] = [{ wch: 30 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, glazWs, 'Glazing');

  XLSX.writeFile(wb, slug + '-pricing-' + new Date().toISOString().slice(0, 10) + '.xlsx');
  toast('Downloaded pricing table for ' + (product ? product.name : slug));
}

function downloadPricingTemplate(productId) {
  if (typeof XLSX === 'undefined') { toast('Excel library not loaded'); return; }
  const product = state.catalog.products.find(p => p.id === productId);

  // Template with sample size grid
  const widths = [600, 750, 900, 1050, 1200, 1350, 1500];
  const heights = [600, 750, 900, 1050, 1200, 1350, 1500, 1650, 1800];
  const rows = [['Width \\ Height (mm)', ...heights]];
  widths.forEach(w => {
    rows.push([w, ...heights.map(() => '')]);  // empty cells for user to fill
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, ...heights.map(() => ({ wch: 10 }))];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Size Grid');

  // Instructions sheet
  const inst = [
    ['Pricing Table Template'],
    [''],
    ['Product: ' + (product ? product.name : '—')],
    [''],
    ['INSTRUCTIONS:'],
    ['1. First row contains heights in mm.'],
    ['2. First column contains widths in mm.'],
    ['3. Each cell is the MSRP in CAD for that width × height combination.'],
    ['4. Leave cells blank if you do not offer that size.'],
    ['5. All prices are for the BASE configuration (white frame, Low-E 272/Argon DH IGU).'],
    ['6. Color multipliers and glazing deltas are applied on top during quote calculation.'],
    [''],
    ['STANDARD SIZES (Casement, fenestration):'],
    ['Widths typically 600 – 1500mm in 150mm increments'],
    ['Heights typically 600 – 1800mm in 150mm increments'],
    [''],
    ['You can add or remove rows/columns as needed.']
  ];
  const instWs = XLSX.utils.aoa_to_sheet(inst);
  instWs['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, instWs, 'Instructions');

  XLSX.writeFile(wb, (product ? product.slug : 'product') + '-pricing-template.xlsx');
  toast('Template downloaded');
}

/* Catalog action handlers */
function toggleProductEnabled(id) {
  const p = state.catalog.products.find(x => x.id === id);
  if (!p) return;
  p.enabled = !p.enabled;
  // If enabling and previously disabled status, default to draft (so user can review before publishing)
  if (p.enabled && p.status === 'disabled') {
    p.status = 'draft';
    p.lastEdit = 'Today';
  } else if (!p.enabled) {
    p.status = 'disabled';
    p.lastEdit = 'Today';
  }
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'catalog.product_' + (p.enabled ? 'enabled' : 'disabled'),
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: p.name, meta: p.enabled ? 'Added to offered catalog' : 'Removed from offered catalog'
  });
  toast(p.name + (p.enabled ? ' added to catalog' : ' removed from catalog'));
  renderCatalog();
}

function updateProductCost(id, raw) {
  const p = state.catalog.products.find(x => x.id === id);
  if (!p) return;
  const v = parseFloat(raw);
  if (isNaN(v) || v < 0) { toast('Invalid cost'); renderCatalog(); return; }
  const old = p.factoryCost;
  p.factoryCost = v;
  p.lastEdit = 'Today';
  recordProvenance('product', p.id, 'factoryCost');
  if (p.ytdUnits > 0) {
    const newMargin = p.msrp > 0 ? (p.msrp - v) / p.msrp : 0;
    p.ytdProfit = Math.round(p.ytdRevenue * newMargin);
  }
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'catalog.cost_changed',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: p.name, meta: `Factory cost: ${fmtMoneyFull(old)} → ${fmtMoneyFull(v)}`
  });
  toast(p.name + ' cost updated to ' + fmtMoneyFull(v));
  renderCatalog();
}

function updateProductMsrp(id, raw) {
  const p = state.catalog.products.find(x => x.id === id);
  if (!p) return;
  const v = parseFloat(raw);
  if (isNaN(v) || v < 0) { toast('Invalid MSRP'); renderCatalog(); return; }
  const old = p.msrp;
  p.msrp = v;
  p.lastEdit = 'Today';
  recordProvenance('product', p.id, 'msrp');
  if (p.ytdUnits > 0) {
    p.ytdRevenue = Math.round((p.ytdRevenue / old) * v);
    const newMargin = v > 0 ? (v - p.factoryCost) / v : 0;
    p.ytdProfit = Math.round(p.ytdRevenue * newMargin);
  }
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'catalog.msrp_changed',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: p.name, meta: `MSRP: ${fmtMoneyFull(old)} → ${fmtMoneyFull(v)}`
  });
  toast(p.name + ' MSRP updated to ' + fmtMoneyFull(v));
  renderCatalog();
}

function viewProductCompliance(id) {
  const p = state.catalog.products.find(x => x.id === id);
  if (!p) return;
  const c = getCompliance(p);
  if (!c) { toast('No compliance data for ' + p.name); return; }
  const er = computeER(c);
  const esEligibility = er != null ? getEnergyStarEligibility(er) : null;

  let metricsHtml = '';
  if (p.category === 'garage-door') {
    metricsHtml = `
      <div class="compliance-grid">
        <div class="compliance-metric">
          <div class="compliance-metric-label">U-Factor</div>
          <div class="compliance-metric-value">${c.uFactor.toFixed(2)}</div>
          <div class="compliance-metric-unit">BTU/hr·ft²·°F</div>
        </div>
        <div class="compliance-metric">
          <div class="compliance-metric-label">R-Value</div>
          <div class="compliance-metric-value">R-${c.rValue}</div>
          <div class="compliance-metric-unit">insulation</div>
        </div>
        <div class="compliance-metric">
          <div class="compliance-metric-label">Wind Load</div>
          <div class="compliance-metric-value" style="font-size:13px">${c.windLoad}</div>
          <div class="compliance-metric-unit">DASMA 108</div>
        </div>
        <div class="compliance-metric">
          <div class="compliance-metric-label">UL 325</div>
          <div class="compliance-metric-value" style="color:${c.ul325 ? 'var(--gl-success)' : 'var(--gl-danger)'}">${c.ul325 ? '✓' : '✗'}</div>
          <div class="compliance-metric-unit">operator safety</div>
        </div>
      </div>
    `;
  } else {
    metricsHtml = `
      <div class="compliance-grid">
        <div class="compliance-metric">
          <div class="compliance-metric-label">U-Factor</div>
          <div class="compliance-metric-value">${c.uFactor.toFixed(2)}</div>
          <div class="compliance-metric-unit">BTU/hr·ft²·°F</div>
        </div>
        <div class="compliance-metric">
          <div class="compliance-metric-label">SHGC</div>
          <div class="compliance-metric-value">${c.shgc.toFixed(2)}</div>
          <div class="compliance-metric-unit">solar gain</div>
        </div>
        <div class="compliance-metric">
          <div class="compliance-metric-label">VT</div>
          <div class="compliance-metric-value">${c.vt.toFixed(2)}</div>
          <div class="compliance-metric-unit">visible transmittance</div>
        </div>
        <div class="compliance-metric">
          <div class="compliance-metric-label">ER</div>
          <div class="compliance-metric-value" style="color:${er >= 34 ? 'var(--gl-success)' : er >= 25 ? 'var(--gl-warn)' : 'var(--gl-text-mute)'}">${er != null ? er.toFixed(1) : '—'}</div>
          <div class="compliance-metric-unit">Canadian rating</div>
        </div>
      </div>
      ${esEligibility ? `
        <div class="es-zones">
          <div class="es-zone ${esEligibility.zone1 ? 'eligible' : 'not-eligible'}">
            <div style="font-size:9.5px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700">Zone 1</div>
            <div style="margin-top:2px">ER≥25 ${esEligibility.zone1 ? '✓' : '✗'}</div>
          </div>
          <div class="es-zone ${esEligibility.zone2 ? 'eligible' : 'not-eligible'}">
            <div style="font-size:9.5px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700">Zone 2 (Ontario)</div>
            <div style="margin-top:2px">ER≥29 ${esEligibility.zone2 ? '✓' : '✗'}</div>
          </div>
          <div class="es-zone ${esEligibility.zone3 ? 'eligible' : 'not-eligible'}">
            <div style="font-size:9.5px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700">Zone 3</div>
            <div style="margin-top:2px">ER≥34 ${esEligibility.zone3 ? '✓' : '✗'}</div>
          </div>
        </div>
      ` : ''}
      <div style="margin-top:10px;padding-top:10px;border-top:0.5px solid var(--gl-border);font-size:11.5px;color:var(--gl-text-mute);display:flex;gap:14px;flex-wrap:wrap">
        <span><strong style="color:var(--gl-text)">NAFS PG:</strong> ${c.pg}</span>
        <span><strong style="color:var(--gl-text)">STC:</strong> ${c.stc || '—'}</span>
        <span><strong style="color:var(--gl-text)">Air leakage:</strong> ${c.al ? c.al.toFixed(2) + ' L/s·m²' : '—'}</span>
        ${c.hasEgress ? '<span style="color:var(--gl-warn);font-weight:600">✓ Egress code</span>' : ''}
        ${c.hasSafetyGlazing ? '<span style="color:var(--gl-warn);font-weight:600">✓ Safety glazing</span>' : ''}
        ${c.fireRating ? '<span style="color:var(--gl-danger);font-weight:600">🔥 ' + c.fireRating + '</span>' : ''}
      </div>
    `;
  }

  // Show as modal
  const root = document.getElementById('modal-root');
  if (root) {
    root.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target === this) closeComplianceModal()">
        <div class="modal-card" style="max-width:580px">
          <div class="modal-head">
            <div>
              <div class="modal-title">Performance & Compliance · ${escapeHtml(p.name)}</div>
              <div style="font-size:12.5px;color:var(--gl-text-mute);margin-top:3px">Per NAFS / CSA A440 / ENERGY STAR Canada</div>
            </div>
            <div style="flex:1"></div>
            <button class="modal-close" onclick="closeComplianceModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="compliance-detail-panel">
              ${metricsHtml}
            </div>
            <div style="margin-top:14px;padding:12px 14px;background:rgba(8,145,178,0.06);border:0.5px solid rgba(8,145,178,0.20);border-radius:0;font-size:12px;color:var(--gl-info);line-height:1.55">
              <strong>Note:</strong> Values are typical for the ${p.family} family at base size. Actual certified ratings depend on size, glazing package, and tested configuration. For NFRC-certified labels, contact your testing agency.
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn ghost" onclick="toast('Edit ratings (mock)')">⚙ Edit ratings</button>
            <div style="flex:1"></div>
            <button class="btn ghost" onclick="closeComplianceModal()">Close</button>
            <button class="btn primary" onclick="toast('NFRC label PDF generated (mock)'); closeComplianceModal()">📄 Generate NFRC label</button>
          </div>
        </div>
      </div>
    `;
  }
}

function closeComplianceModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
}

/* ════════════════════════════════════════════════
   Shop drawing viewer — opens a multi-page modal
   showing window/door elevations + dimensions + specs
   ════════════════════════════════════════════════ */

function openShopDrawing(orderId, drawingId) {
  const o = getOrder(orderId);
  if (!o) return;
  const dr = o.drawings.find(x => x.id === drawingId);
  if (!dr) return;
  const d = getDealer(o.dealerId);

  // Group units by product type for the drawing pages
  const unitsByType = {};
  (o.unitBreakdown || []).forEach(u => {
    if (!unitsByType[u.name]) unitsByType[u.name] = { name: u.name, count: 0, units: [] };
    unitsByType[u.name].count += u.count;
    unitsByType[u.name].units.push(u);
  });
  const pages = Object.values(unitsByType);

  // Track current page in state
  state.drawingViewerPage = 0;
  state.drawingViewerCtx = { orderId, drawingId };

  renderShopDrawingViewer();

  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'drawing.viewed',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: o.po + ' · ' + dr.name, meta: 'Drawing package opened'
  });
}

function renderShopDrawingViewer() {
  const root = document.getElementById('modal-root');
  if (!root || !state.drawingViewerCtx) return;
  const { orderId, drawingId } = state.drawingViewerCtx;
  const o = getOrder(orderId);
  const dr = o.drawings.find(x => x.id === drawingId);
  const d = getDealer(o.dealerId);

  const unitsByType = {};
  (o.unitBreakdown || []).forEach(u => {
    if (!unitsByType[u.name]) unitsByType[u.name] = { name: u.name, count: 0, units: [] };
    unitsByType[u.name].count += u.count;
    unitsByType[u.name].units.push(u);
  });
  const pages = Object.values(unitsByType);
  const pageIdx = Math.min(state.drawingViewerPage, pages.length - 1);
  const currentPage = pages[pageIdx];

  // Find compliance for this unit type — match by family if exact name not found
  let product = state.catalog.products.find(p => p.name === currentPage.name);
  if (!product) {
    // unitBreakdown uses family-style names ('Casement', 'Picture', 'Awning')
    product = state.catalog.products.find(p => p.family === currentPage.name && p.enabled)
          || state.catalog.products.find(p => p.family === currentPage.name);
  }
  const compliance = product ? getCompliance(product) : null;
  const er = compliance ? computeER(compliance) : null;

  root.innerHTML = `
    <div class="modal-overlay" onclick="if(event.target === this) closeShopDrawing()">
      <div class="modal-card" style="max-width:1040px;width:96vw;max-height:92vh;display:flex;flex-direction:column">
        <div class="modal-head" style="border-bottom:0.5px solid var(--gl-border)">
          <div>
            <div class="modal-title">Shop drawing · ${escapeHtml(o.po)} — ${escapeHtml(o.project)}</div>
            <div style="font-size:12px;color:var(--gl-text-mute);margin-top:3px">${escapeHtml(dr.name)} · for ${escapeHtml(d.short)} · ${dr.status === 'approved' ? '<span style="color:var(--gl-success);font-weight:600">✓ Approved by dealer</span>' : dr.status === 'in-review' ? '<span style="color:var(--gl-info);font-weight:600">Awaiting dealer sign-off</span>' : '<span style="color:var(--gl-warn);font-weight:600">Pending release</span>'}</div>
          </div>
          <div style="flex:1"></div>
          <button class="btn ghost sm" onclick="downloadShopDrawing(${orderId}, '${drawingId}')">↓ Download PDF</button>
          <button class="modal-close" onclick="closeShopDrawing()">×</button>
        </div>

        <div style="display:flex;flex:1;min-height:0">
          <!-- Page sidebar -->
          <div style="width:180px;border-right:0.5px solid var(--gl-border);background:rgba(248,250,252,0.5);overflow-y:auto;padding:10px 0;flex-shrink:0">
            <div style="padding:6px 14px;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--gl-text-mute);margin-bottom:4px">Sheets · ${pages.length}</div>
            ${pages.map((p, i) => `
              <div onclick="state.drawingViewerPage=${i}; renderShopDrawingViewer()" style="padding:10px 14px;cursor:pointer;font-size:12.5px;border-left:3px solid ${i === pageIdx ? 'var(--gl-text)' : 'transparent'};background:${i === pageIdx ? 'rgba(15,23,42,0.04)' : 'transparent'};transition:background 0.12s">
                <div style="font-weight:${i === pageIdx ? 600 : 500};font-size:12.5px">Sheet ${String(i + 1).padStart(2, '0')} of ${String(pages.length).padStart(2, '0')}</div>
                <div style="font-size:11px;color:var(--gl-text-mute);margin-top:2px">${escapeHtml(p.name)}</div>
                <div style="font-size:10.5px;color:var(--gl-text-faint);margin-top:1px">${p.count} unit${p.count === 1 ? '' : 's'}</div>
              </div>
            `).join('')}
            <div style="padding:10px 14px;cursor:pointer;font-size:12.5px;border-left:3px solid ${pageIdx === pages.length ? 'var(--gl-text)' : 'transparent'};background:${pageIdx === pages.length ? 'rgba(15,23,42,0.04)' : 'transparent'};border-top:0.5px solid var(--gl-border);margin-top:6px" onclick="state.drawingViewerPage=${pages.length}; renderShopDrawingViewer()">
              <div style="font-weight:${pageIdx === pages.length ? 600 : 500};font-size:12.5px">Title block</div>
              <div style="font-size:11px;color:var(--gl-text-mute);margin-top:2px">Project info + revisions</div>
            </div>
          </div>

          <!-- Drawing canvas -->
          <div style="flex:1;overflow:auto;background:#F1F5F9;padding:18px">
            ${pageIdx < pages.length ? renderDrawingSheet(o, currentPage, product, compliance, er, pageIdx, pages.length) : renderDrawingTitleBlock(o, dr, d, pages)}
          </div>
        </div>

        <div class="modal-foot" style="border-top:0.5px solid var(--gl-border);padding:10px 18px;display:flex;align-items:center;gap:8px">
          <button class="btn ghost sm" onclick="state.drawingViewerPage=Math.max(0, state.drawingViewerPage-1); renderShopDrawingViewer()" ${pageIdx === 0 ? 'disabled style="opacity:0.4"' : ''}>← Previous</button>
          <button class="btn ghost sm" onclick="state.drawingViewerPage=Math.min(${pages.length}, state.drawingViewerPage+1); renderShopDrawingViewer()" ${pageIdx === pages.length ? 'disabled style="opacity:0.4"' : ''}>Next →</button>
          <div style="font-size:11.5px;color:var(--gl-text-mute);margin-left:6px;font-variant-numeric:tabular-nums">Sheet ${pageIdx + 1} of ${pages.length + 1}</div>
          <div style="flex:1"></div>
          ${dr.status === 'in-review' ? `<button class="btn ghost sm" onclick="toast('Re-released drawings (mock)'); closeShopDrawing()">↻ Re-release</button>` : ''}
          ${dr.status === 'approved' ? `<span style="font-size:11px;color:var(--gl-success);font-weight:600">✓ Approved by ${escapeHtml(d.short)} · Today</span>` : ''}
          <button class="btn ghost" onclick="closeShopDrawing()">Close</button>
        </div>
      </div>
    </div>
  `;
}

function renderDrawingSheet(o, page, product, compliance, er, pageIdx, totalPages) {
  // Decide on the elevation graphic based on the product family
  // Fall back to page.name if no product matched (unitBreakdown names are family-style)
  const family = product ? product.family : page.name;
  const unitSize = product ? product.baseSize : '900×1200';
  const [wStr, hStr] = unitSize.split(/[×x]/);
  const w_mm = parseInt(wStr) || 900;
  const h_mm = parseInt(hStr) || 1200;

  // SVG scale: fit ~360px tall window in viewBox
  const svgScale = 360 / h_mm;
  const svgW = Math.round(w_mm * svgScale);
  const svgH = Math.round(h_mm * svgScale);

  return `
    <div style="background:white;border:0.5px solid var(--gl-border);border-radius:0;padding:0;box-shadow:0 2px 12px rgba(15,23,42,0.08);max-width:920px;margin:0 auto;font-family:var(--gl-mono),monospace">
      <!-- Sheet header -->
      <div style="border-bottom:1px solid #0F172A;padding:14px 22px;display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748B">${escapeHtml(state.factory.name)} — SHOP DRAWING</div>
          <div style="font-size:17px;font-weight:700;margin-top:5px;font-family:var(--gl-font);color:#0F172A">${escapeHtml(page.name)} — Elevation</div>
          <div style="font-size:11.5px;color:#64748B;margin-top:3px;font-family:var(--gl-font)">${escapeHtml(o.project)} · ${escapeHtml(o.po)} · Sheet ${pageIdx + 1} of ${totalPages + 1}</div>
        </div>
        <div style="text-align:right;font-size:10.5px;color:#64748B;font-family:var(--gl-font);line-height:1.7">
          <div><strong style="color:#0F172A">Scale:</strong> 1:20</div>
          <div><strong style="color:#0F172A">Dim:</strong> millimeters</div>
          <div><strong style="color:#0F172A">Rev:</strong> A</div>
          <div><strong style="color:#0F172A">Date:</strong> ${new Date().toLocaleDateString('en-CA')}</div>
        </div>
      </div>

      <!-- Drawing area -->
      <div style="display:grid;grid-template-columns:1fr 280px;gap:0;min-height:480px">
        <!-- Elevation -->
        <div style="padding:30px 22px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:0.5px dashed var(--gl-border);background:repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(15,23,42,0.04) 19px, rgba(15,23,42,0.04) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(15,23,42,0.04) 19px, rgba(15,23,42,0.04) 20px)">
          <div style="font-size:10px;color:#64748B;margin-bottom:14px;letter-spacing:0.08em;text-transform:uppercase;font-family:var(--gl-font)">Exterior elevation</div>

          ${renderElevationSVG(family, svgW, svgH, w_mm, h_mm)}

          <div style="font-size:10px;color:#64748B;margin-top:14px;letter-spacing:0.08em;text-transform:uppercase;font-family:var(--gl-font)">Unit count: ${page.count}</div>
        </div>

        <!-- Specs panel -->
        <div style="padding:20px 22px;background:#FAFAFA;font-family:var(--gl-font)">
          <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B;margin-bottom:8px">Unit Specifications</div>
          <div style="font-size:12px;line-height:1.85;color:#0F172A">
            <div><strong>Family:</strong> ${escapeHtml(family)}</div>
            <div><strong>Size:</strong> ${w_mm} × ${h_mm} mm</div>
            <div><strong>Glazing:</strong> Low-E 272 · Argon · Super Spacer</div>
            <div><strong>Frame:</strong> Vinyl · White</div>
            <div><strong>Hardware:</strong> Roto NT multi-point</div>
            <div><strong>Weatherstrip:</strong> Co-extruded TPE</div>
            <div><strong>Screen:</strong> Half-screen, charcoal mesh</div>
          </div>

          ${compliance ? `
            <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B;margin:18px 0 8px;border-top:0.5px solid var(--gl-border);padding-top:14px">Performance ratings</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11.5px">
              <div style="background:white;border:0.5px solid var(--gl-border);padding:7px 10px;border-radius:0">
                <div style="font-size:9.5px;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;font-weight:700">U-Factor</div>
                <div style="font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;color:#0F172A">${compliance.uFactor.toFixed(2)}</div>
              </div>
              <div style="background:white;border:0.5px solid var(--gl-border);padding:7px 10px;border-radius:0">
                <div style="font-size:9.5px;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;font-weight:700">SHGC</div>
                <div style="font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;color:#0F172A">${compliance.shgc.toFixed(2)}</div>
              </div>
              ${er != null ? `
                <div style="background:white;border:0.5px solid var(--gl-border);padding:7px 10px;border-radius:0">
                  <div style="font-size:9.5px;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;font-weight:700">ER</div>
                  <div style="font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;color:#0F172A">${er.toFixed(0)}</div>
                </div>
              ` : ''}
              <div style="background:white;border:0.5px solid var(--gl-border);padding:7px 10px;border-radius:0">
                <div style="font-size:9.5px;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;font-weight:700">NAFS PG</div>
                <div style="font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;color:#0F172A">${compliance.pg || '—'}</div>
              </div>
            </div>
          ` : ''}

          <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B;margin:18px 0 8px;border-top:0.5px solid var(--gl-border);padding-top:14px">Notes</div>
          <div style="font-size:11.5px;line-height:1.55;color:#475569">
            All dimensions are nominal manufacturing sizes. Rough opening = unit size + 12 mm typical.
            Tempered glass required where unit is &lt;450 mm from floor or &lt;600 mm from door.
          </div>
        </div>
      </div>

      <!-- Sheet footer -->
      <div style="border-top:1px solid #0F172A;padding:10px 22px;display:flex;justify-content:space-between;font-size:10px;color:#64748B;font-family:var(--gl-font);font-variant-numeric:tabular-nums">
        <div>Drawn by: ${escapeHtml(state.factory.team[2]?.name || 'Lin Park')}</div>
        <div>Checked by: ${escapeHtml(state.factory.team[1]?.name || 'Marcus Hill')}</div>
        <div>${escapeHtml(state.factory.name)} · Confidential</div>
      </div>
    </div>
  `;
}

function renderElevationSVG(family, svgW, svgH, w_mm, h_mm) {
  // Choose elevation based on family
  const f = family.toLowerCase();
  const stroke = '#0F172A';
  const glass = '#E0F2FE';
  const glassDark = '#BAE6FD';
  const hw = '#64748B';

  // Add a 30px dimension line offset around the figure
  const padL = 38, padR = 14, padT = 14, padB = 38;
  const totalW = svgW + padL + padR;
  const totalH = svgH + padT + padB;

  let body = '';

  if (f.includes('casement')) {
    // Single casement: frame + sash + hinge + crank handle
    body = `
      <!-- Outer frame -->
      <rect x="${padL}" y="${padT}" width="${svgW}" height="${svgH}" fill="${glass}" stroke="${stroke}" stroke-width="2" />
      <!-- Inner sash -->
      <rect x="${padL + 10}" y="${padT + 10}" width="${svgW - 20}" height="${svgH - 20}" fill="${glassDark}" stroke="${stroke}" stroke-width="1.2" />
      <!-- Hinges (left side) -->
      <rect x="${padL - 4}" y="${padT + 20}" width="8" height="22" fill="${hw}" stroke="${stroke}" stroke-width="0.6" />
      <rect x="${padL - 4}" y="${padT + svgH - 42}" width="8" height="22" fill="${hw}" stroke="${stroke}" stroke-width="0.6" />
      <!-- Crank handle (right middle) -->
      <circle cx="${padL + svgW - 18}" cy="${padT + svgH/2}" r="6" fill="${hw}" stroke="${stroke}" stroke-width="0.8" />
      <line x1="${padL + svgW - 18}" y1="${padT + svgH/2}" x2="${padL + svgW - 30}" y2="${padT + svgH/2 + 8}" stroke="${stroke}" stroke-width="1.5" />
      <!-- Opening arrow (hinge indicator — opens out from left) -->
      <line x1="${padL}" y1="${padT + svgH/2}" x2="${padL + svgW}" y2="${padT + 12}" stroke="${hw}" stroke-width="0.8" stroke-dasharray="3 2" />
      <line x1="${padL}" y1="${padT + svgH/2}" x2="${padL + svgW}" y2="${padT + svgH - 12}" stroke="${hw}" stroke-width="0.8" stroke-dasharray="3 2" />
    `;
  } else if (f.includes('awning') || f.includes('hopper')) {
    const isAwning = f.includes('awning');
    body = `
      <rect x="${padL}" y="${padT}" width="${svgW}" height="${svgH}" fill="${glass}" stroke="${stroke}" stroke-width="2" />
      <rect x="${padL + 10}" y="${padT + 10}" width="${svgW - 20}" height="${svgH - 20}" fill="${glassDark}" stroke="${stroke}" stroke-width="1.2" />
      <!-- Hinges on top (awning) or bottom (hopper) -->
      ${isAwning ? `
        <rect x="${padL + 20}" y="${padT - 4}" width="22" height="8" fill="${hw}" stroke="${stroke}" stroke-width="0.6" />
        <rect x="${padL + svgW - 42}" y="${padT - 4}" width="22" height="8" fill="${hw}" stroke="${stroke}" stroke-width="0.6" />
      ` : `
        <rect x="${padL + 20}" y="${padT + svgH - 4}" width="22" height="8" fill="${hw}" stroke="${stroke}" stroke-width="0.6" />
        <rect x="${padL + svgW - 42}" y="${padT + svgH - 4}" width="22" height="8" fill="${hw}" stroke="${stroke}" stroke-width="0.6" />
      `}
      <!-- Opening triangle indicator -->
      ${isAwning ? `
        <line x1="${padL}" y1="${padT}" x2="${padL + svgW/2}" y2="${padT + svgH}" stroke="${hw}" stroke-width="0.8" stroke-dasharray="3 2" />
        <line x1="${padL + svgW}" y1="${padT}" x2="${padL + svgW/2}" y2="${padT + svgH}" stroke="${hw}" stroke-width="0.8" stroke-dasharray="3 2" />
      ` : `
        <line x1="${padL}" y1="${padT + svgH}" x2="${padL + svgW/2}" y2="${padT}" stroke="${hw}" stroke-width="0.8" stroke-dasharray="3 2" />
        <line x1="${padL + svgW}" y1="${padT + svgH}" x2="${padL + svgW/2}" y2="${padT}" stroke="${hw}" stroke-width="0.8" stroke-dasharray="3 2" />
      `}
    `;
  } else if (f.includes('picture')) {
    // Fixed picture window — just frame + glass
    body = `
      <rect x="${padL}" y="${padT}" width="${svgW}" height="${svgH}" fill="${glass}" stroke="${stroke}" stroke-width="2" />
      <rect x="${padL + 8}" y="${padT + 8}" width="${svgW - 16}" height="${svgH - 16}" fill="${glassDark}" stroke="${stroke}" stroke-width="1" />
      <text x="${padL + svgW/2}" y="${padT + svgH/2 + 4}" text-anchor="middle" font-size="11" fill="${hw}" font-family="var(--gl-font)">FIXED · NON-OPENING</text>
    `;
  } else if (f.includes('hung')) {
    // Double-hung — two sashes top and bottom
    body = `
      <rect x="${padL}" y="${padT}" width="${svgW}" height="${svgH}" fill="${glass}" stroke="${stroke}" stroke-width="2" />
      <!-- Top sash -->
      <rect x="${padL + 10}" y="${padT + 10}" width="${svgW - 20}" height="${svgH/2 - 14}" fill="${glassDark}" stroke="${stroke}" stroke-width="1.2" />
      <!-- Bottom sash -->
      <rect x="${padL + 10}" y="${padT + svgH/2 + 4}" width="${svgW - 20}" height="${svgH/2 - 14}" fill="${glassDark}" stroke="${stroke}" stroke-width="1.2" />
      <!-- Meeting rail (horizontal divider) -->
      <line x1="${padL + 10}" y1="${padT + svgH/2}" x2="${padL + svgW - 10}" y2="${padT + svgH/2}" stroke="${stroke}" stroke-width="1.5" />
      <!-- Cam lock at meeting rail -->
      <rect x="${padL + svgW/2 - 7}" y="${padT + svgH/2 - 4}" width="14" height="8" fill="${hw}" stroke="${stroke}" stroke-width="0.6" />
      <!-- Up-arrow on bottom sash showing it slides up -->
      <path d="M ${padL + svgW/2} ${padT + svgH - 28} L ${padL + svgW/2 - 6} ${padT + svgH - 18} L ${padL + svgW/2 + 6} ${padT + svgH - 18} Z" fill="${hw}" opacity="0.5" />
    `;
  } else if (f.includes('slider')) {
    // Slider — two horizontal sashes
    body = `
      <rect x="${padL}" y="${padT}" width="${svgW}" height="${svgH}" fill="${glass}" stroke="${stroke}" stroke-width="2" />
      <rect x="${padL + 10}" y="${padT + 10}" width="${svgW/2 - 14}" height="${svgH - 20}" fill="${glassDark}" stroke="${stroke}" stroke-width="1.2" />
      <rect x="${padL + svgW/2 + 4}" y="${padT + 10}" width="${svgW/2 - 14}" height="${svgH - 20}" fill="${glassDark}" stroke="${stroke}" stroke-width="1.2" />
      <line x1="${padL + svgW/2}" y1="${padT + 10}" x2="${padL + svgW/2}" y2="${padT + svgH - 10}" stroke="${stroke}" stroke-width="1.5" />
      <!-- Pull handle -->
      <rect x="${padL + svgW/2 - 12}" y="${padT + svgH/2 - 12}" width="6" height="24" fill="${hw}" stroke="${stroke}" stroke-width="0.6" />
      <!-- Direction arrow -->
      <path d="M ${padL + svgW/4} ${padT + svgH - 18} L ${padL + svgW/4 + 10} ${padT + svgH - 24} L ${padL + svgW/4 + 10} ${padT + svgH - 12} Z" fill="${hw}" opacity="0.5" />
    `;
  } else if (f.includes('flush') || f.includes('shaker') || f.includes('craftsman') || f.includes('panel') || f.includes('modern') || f.includes('contemporary')) {
    // Entry door
    body = `
      <rect x="${padL}" y="${padT}" width="${svgW}" height="${svgH}" fill="#FAFAFA" stroke="${stroke}" stroke-width="2" />
      <!-- Door panels (Shaker style) -->
      <rect x="${padL + 12}" y="${padT + 12}" width="${svgW - 24}" height="${svgH * 0.30}" fill="white" stroke="${stroke}" stroke-width="1" />
      <rect x="${padL + 12}" y="${padT + svgH * 0.36}" width="${svgW - 24}" height="${svgH * 0.30}" fill="white" stroke="${stroke}" stroke-width="1" />
      <rect x="${padL + 12}" y="${padT + svgH * 0.70}" width="${svgW - 24}" height="${svgH * 0.20}" fill="white" stroke="${stroke}" stroke-width="1" />
      <!-- Door handle -->
      <circle cx="${padL + svgW - 18}" cy="${padT + svgH * 0.55}" r="5" fill="${hw}" stroke="${stroke}" stroke-width="0.6" />
      <!-- Hinges -->
      <rect x="${padL - 3}" y="${padT + 28}" width="6" height="16" fill="${hw}" stroke="${stroke}" stroke-width="0.4" />
      <rect x="${padL - 3}" y="${padT + svgH/2 - 8}" width="6" height="16" fill="${hw}" stroke="${stroke}" stroke-width="0.4" />
      <rect x="${padL - 3}" y="${padT + svgH - 44}" width="6" height="16" fill="${hw}" stroke="${stroke}" stroke-width="0.4" />
    `;
  } else if (f.includes('sliding') || f.includes('french')) {
    // Patio door
    body = `
      <rect x="${padL}" y="${padT}" width="${svgW}" height="${svgH}" fill="${glass}" stroke="${stroke}" stroke-width="2" />
      <rect x="${padL + 10}" y="${padT + 10}" width="${svgW/2 - 14}" height="${svgH - 20}" fill="${glassDark}" stroke="${stroke}" stroke-width="1.2" />
      <rect x="${padL + svgW/2 + 4}" y="${padT + 10}" width="${svgW/2 - 14}" height="${svgH - 20}" fill="${glassDark}" stroke="${stroke}" stroke-width="1.2" />
      <line x1="${padL + svgW/2}" y1="${padT + 10}" x2="${padL + svgW/2}" y2="${padT + svgH - 10}" stroke="${stroke}" stroke-width="1.5" />
      <!-- D-pull -->
      <rect x="${padL + svgW/2 - 14}" y="${padT + svgH/2 - 28}" width="6" height="56" fill="${hw}" stroke="${stroke}" stroke-width="0.6" />
    `;
  } else if (f.includes('sectional') || f.includes('garage')) {
    // Garage door — 4 horizontal panels
    body = `
      <rect x="${padL}" y="${padT}" width="${svgW}" height="${svgH}" fill="#F1F5F9" stroke="${stroke}" stroke-width="2" />
      ${[0, 1, 2, 3].map(i => `
        <rect x="${padL + 6}" y="${padT + 6 + (i * (svgH - 12) / 4)}" width="${svgW - 12}" height="${(svgH - 12) / 4 - 2}" fill="white" stroke="${stroke}" stroke-width="0.8" />
      `).join('')}
      <!-- Track marks on sides -->
      <line x1="${padL - 4}" y1="${padT}" x2="${padL - 4}" y2="${padT + svgH}" stroke="${hw}" stroke-width="2" />
      <line x1="${padL + svgW + 4}" y1="${padT}" x2="${padL + svgW + 4}" y2="${padT + svgH}" stroke="${hw}" stroke-width="2" />
    `;
  } else {
    // Fallback: generic rectangle
    body = `
      <rect x="${padL}" y="${padT}" width="${svgW}" height="${svgH}" fill="${glass}" stroke="${stroke}" stroke-width="2" />
      <rect x="${padL + 10}" y="${padT + 10}" width="${svgW - 20}" height="${svgH - 20}" fill="${glassDark}" stroke="${stroke}" stroke-width="1.2" />
    `;
  }

  // Dimension lines + labels
  const dims = `
    <!-- Width dimension (bottom) -->
    <line x1="${padL}" y1="${padT + svgH + 18}" x2="${padL + svgW}" y2="${padT + svgH + 18}" stroke="${stroke}" stroke-width="0.6" />
    <line x1="${padL}" y1="${padT + svgH + 14}" x2="${padL}" y2="${padT + svgH + 22}" stroke="${stroke}" stroke-width="0.6" />
    <line x1="${padL + svgW}" y1="${padT + svgH + 14}" x2="${padL + svgW}" y2="${padT + svgH + 22}" stroke="${stroke}" stroke-width="0.6" />
    <text x="${padL + svgW/2}" y="${padT + svgH + 32}" text-anchor="middle" font-size="11" fill="${stroke}" font-family="var(--gl-mono)">${w_mm}</text>

    <!-- Height dimension (left) -->
    <line x1="${padL - 22}" y1="${padT}" x2="${padL - 22}" y2="${padT + svgH}" stroke="${stroke}" stroke-width="0.6" />
    <line x1="${padL - 26}" y1="${padT}" x2="${padL - 18}" y2="${padT}" stroke="${stroke}" stroke-width="0.6" />
    <line x1="${padL - 26}" y1="${padT + svgH}" x2="${padL - 18}" y2="${padT + svgH}" stroke="${stroke}" stroke-width="0.6" />
    <text x="${padL - 28}" y="${padT + svgH/2 + 4}" text-anchor="end" font-size="11" fill="${stroke}" font-family="var(--gl-mono)" transform="rotate(-90 ${padL - 28} ${padT + svgH/2 + 4})">${h_mm}</text>
  `;

  return `
    <svg viewBox="0 0 ${totalW} ${totalH}" style="max-width:100%;height:auto;max-height:480px" xmlns="http://www.w3.org/2000/svg">
      ${body}
      ${dims}
    </svg>
  `;
}

function renderDrawingTitleBlock(o, dr, d, pages) {
  const totalUnits = pages.reduce((s, p) => s + p.count, 0);
  return `
    <div style="background:white;border:0.5px solid var(--gl-border);border-radius:0;padding:0;box-shadow:0 2px 12px rgba(15,23,42,0.08);max-width:920px;margin:0 auto;font-family:var(--gl-mono),monospace">
      <div style="border-bottom:1px solid #0F172A;padding:14px 22px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748B">${escapeHtml(state.factory.name)} — SHOP DRAWING PACKAGE</div>
        <div style="font-size:17px;font-weight:700;margin-top:5px;font-family:var(--gl-font);color:#0F172A">Title block · ${escapeHtml(o.project)}</div>
      </div>

      <div style="padding:30px 22px">
        <!-- Project block -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:30px">
          <div>
            <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B;margin-bottom:10px">Project</div>
            <div style="font-family:var(--gl-font);font-size:13px;line-height:1.8">
              <div><strong>Project:</strong> ${escapeHtml(o.project)}</div>
              <div><strong>PO number:</strong> ${escapeHtml(o.po)}</div>
              <div><strong>Order ID:</strong> O-${o.id}</div>
              <div><strong>Ship by:</strong> ${escapeHtml(o.shipBy)}</div>
              <div><strong>Total units:</strong> ${totalUnits} across ${pages.length} type${pages.length === 1 ? '' : 's'}</div>
              <div><strong>Total value:</strong> ${fmtMoneyFull(o.value)}</div>
            </div>
          </div>

          <div>
            <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B;margin-bottom:10px">Parties</div>
            <div style="font-family:var(--gl-font);font-size:13px;line-height:1.8">
              <div><strong>Manufacturer:</strong> ${escapeHtml(state.factory.name)}</div>
              <div style="font-size:11.5px;color:#64748B;margin-left:0">${escapeHtml(state.factory.address)}</div>
              <div style="margin-top:8px"><strong>Dealer:</strong> ${escapeHtml(d.name)}</div>
              <div style="font-size:11.5px;color:#64748B">${escapeHtml(d.region)}</div>
            </div>
          </div>
        </div>

        <!-- Drawing index -->
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B;margin-bottom:10px">Drawing index</div>
        <div style="border:0.5px solid var(--gl-border);border-radius:0;overflow:hidden;margin-bottom:24px">
          <div style="display:grid;grid-template-columns:80px 1fr 80px;padding:8px 14px;background:#FAFAFA;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748B;font-family:var(--gl-font)">
            <div>Sheet</div><div>Description</div><div style="text-align:right">Units</div>
          </div>
          ${pages.map((p, i) => `
            <div style="display:grid;grid-template-columns:80px 1fr 80px;padding:9px 14px;border-top:0.5px solid var(--gl-border);font-size:12.5px;font-family:var(--gl-font);font-variant-numeric:tabular-nums">
              <div style="font-family:var(--gl-mono);font-weight:600">${String(i + 1).padStart(2, '0')} of ${String(pages.length + 1).padStart(2, '0')}</div>
              <div>${escapeHtml(p.name)} elevation</div>
              <div style="text-align:right">${p.count}</div>
            </div>
          `).join('')}
        </div>

        <!-- Revisions -->
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B;margin-bottom:10px">Revision history</div>
        <div style="border:0.5px solid var(--gl-border);border-radius:0;overflow:hidden;margin-bottom:24px">
          <div style="display:grid;grid-template-columns:60px 110px 1fr 130px;padding:8px 14px;background:#FAFAFA;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748B;font-family:var(--gl-font)">
            <div>Rev</div><div>Date</div><div>Notes</div><div>Author</div>
          </div>
          <div style="display:grid;grid-template-columns:60px 110px 1fr 130px;padding:9px 14px;border-top:0.5px solid var(--gl-border);font-size:12px;font-family:var(--gl-font)">
            <div style="font-family:var(--gl-mono);font-weight:600">A</div>
            <div>${new Date().toLocaleDateString('en-CA')}</div>
            <div>Initial release for dealer review</div>
            <div>${escapeHtml(state.factory.team[2]?.name || 'Lin Park')}</div>
          </div>
        </div>

        <!-- Approval signature block -->
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B;margin-bottom:10px">Dealer approval</div>
        <div style="border:0.5px solid var(--gl-border);border-radius:0;padding:18px 22px;background:${dr.status === 'approved' ? '#ECFDF5' : '#FAFAFA'};display:flex;justify-content:space-between;align-items:center;font-family:var(--gl-font)">
          ${dr.status === 'approved' ? `
            <div>
              <div style="font-size:13px;font-weight:600;color:#047857">✓ Approved by ${escapeHtml(d.short)}</div>
              <div style="font-size:11.5px;color:#475569;margin-top:3px">Electronically signed · ${new Date().toLocaleDateString('en-CA')} · production released</div>
            </div>
            <div style="font-family:'Caveat', cursive, var(--gl-font);font-size:22px;color:#047857;font-style:italic">— ${escapeHtml(d.short)}</div>
          ` : dr.status === 'in-review' ? `
            <div>
              <div style="font-size:13px;font-weight:600;color:#24479e">⏳ Awaiting dealer sign-off</div>
              <div style="font-size:11.5px;color:#475569;margin-top:3px">Released ${dr.releasedAt ? fmtRelTime(dr.releasedAt) : 'today'} · production blocked until approved</div>
            </div>
            <div style="font-size:11px;color:#94A3B8;font-style:italic">Signature pending</div>
          ` : `
            <div>
              <div style="font-size:13px;font-weight:600;color:#B45309">○ Not yet released</div>
              <div style="font-size:11.5px;color:#475569;margin-top:3px">Drawings prepared, awaiting internal review</div>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function closeShopDrawing() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
  state.drawingViewerCtx = null;
}

function downloadShopDrawing(orderId, drawingId) {
  const o = getOrder(orderId);
  const dr = o ? o.drawings.find(x => x.id === drawingId) : null;
  if (!dr) return;
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'drawing.downloaded',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: o.po + ' · ' + dr.name, meta: 'Drawing PDF downloaded'
  });
  toast('Drawing package PDF downloaded · ' + o.po);
}

function enableAllInCategory(cat) {
  if (cat === 'all') return;
  state.catalog.products.filter(p => p.category === cat && !p.enabled).forEach(p => {
    p.enabled = true;
    if (p.status === 'disabled') p.status = 'draft';
  });
  toast('All ' + cat.replace('-', ' ') + 's enabled');
  renderCatalog();
}

function disableAllInCategory(cat) {
  if (cat === 'all') return;
  state.catalog.products.filter(p => p.category === cat && p.enabled).forEach(p => {
    p.enabled = false;
    p.status = 'disabled';
  });
  toast('All ' + cat.replace('-', ' ') + 's disabled');
  renderCatalog();
}

function bulkAdjustMargin() {
  const pct = prompt('Adjust MSRP across all visible products by what %? (e.g. 5 = increase by 5%, -3 = decrease by 3%)');
  if (pct === null) return;
  const factor = 1 + (parseFloat(pct) / 100);
  if (isNaN(factor)) { toast('Invalid %'); return; }
  state.catalog.products.filter(p => p.enabled).forEach(p => {
    p.msrp = Math.round(p.msrp * factor);
  });
  toast('MSRP adjusted by ' + pct + '% across offered products');
  renderCatalog();
}

function renderPricing() {
  const tab = state.pricingTab;
  const tiers = state.pricing.dealerTiers;
  const sheets = state.pricing.priceSheets;
  const fx = state.pricing.fxRates;

  let content = '';
  if (tab === 'tiers') {
    content = `
      <div class="tier-grid">
        ${tiers.map(t => `
          <div class="tier-card">
            <div class="tier-name">${t.name}</div>
            <div class="tier-code">${t.code}</div>
            <div class="tier-multiplier">${(t.multiplier * 100).toFixed(0)}<span class="pct">%</span></div>
            <div class="tier-stats">
              <div><strong style="color:var(--gl-text);font-weight:600">${t.dealers}</strong> dealer${t.dealers !== 1 ? 's' : ''}</div>
              <div>YTD ${fmtMoney(t.ytdVolume)}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Dealer tier assignment</div>
          <button class="btn sm ghost" onclick="switchView('dealers')">Manage in Dealers →</button>
        </div>
        <div style="font-size:13px;color:var(--gl-text-mute);line-height:1.5;margin-bottom:14px">
          Multiplier = dealer's cost / MSRP. Lower multiplier = larger discount. Custom overrides are set per-dealer in the Dealers view.
        </div>
        ${state.dealers.map(d => {
          const tier = getDealerTier(d);
          const effM = effectiveMultiplier(d);
          const hasOverride = d.customMultiplier != null;
          return `
            <div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:0.5px solid var(--gl-border)">
              <div class="dealer-mini-avatar" style="width:30px;height:30px;border-radius:0;font-size:11px;background:${d.gradient}">${d.avatar}</div>
              <div style="flex:1">
                <div style="font-size:13.5px;font-weight:500">${d.name} ${hasOverride ? '<span class="dpc-override-badge" style="margin-left:6px;font-size:9.5px;padding:1px 6px">Custom</span>' : ''}</div>
                <div style="font-size:11.5px;color:var(--gl-text-mute)">${d.region} · effective rate <strong style="color:var(--gl-text);font-variant-numeric:tabular-nums">${(effM * 100).toFixed(1)}%</strong></div>
              </div>
              <select class="form-select" style="max-width:240px" onchange="updateDealerTier('${d.id}', parseInt(this.value, 10))">
                ${state.pricing.dealerTiers.map(t => `<option value="${t.id}" ${t.id === d.tierId ? 'selected' : ''}>${t.name}</option>`).join('')}
              </select>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (tab === 'sheets') {
    content = `
      <div class="orders-table">
        <div class="table-head" style="grid-template-columns:1fr 130px 90px 110px 130px 110px">
          <div>PRICE SHEET</div><div>FAMILY</div><div>VERSION</div><div>STATUS</div><div>EFFECTIVE FROM</div><div>SIZE</div>
        </div>
        ${sheets.map(s => `
          <div class="table-row" onclick="toast('Open ' + '${s.name}' + ' editor (mock)')" style="grid-template-columns:1fr 130px 90px 110px 130px 110px">
            <div><div style="font-size:13.5px;font-weight:500">${s.name}</div></div>
            <div style="font-size:12.5px">${s.family}</div>
            <div style="font-family:var(--gl-mono);font-size:12.5px">v${s.version}</div>
            <div><span class="pub-pill ${s.status}">${s.status === 'published' ? '✓' : '◇'} ${s.status}</span></div>
            <div style="font-size:12.5px;font-variant-numeric:tabular-nums">${s.effectiveFrom}</div>
            <div style="font-size:12px;color:var(--gl-text-mute)">${s.cells} cells · ${s.optionAdders} adders</div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (tab === 'fx') {
    content = renderFXTab();
  } else if (tab === 'resellers') {
    content = renderResellersTab();
  } else if (tab === 'promos') {
    content = renderPromotionsTab();
  }

  $('pricing-view').innerHTML = `
    ${renderBackButton()}
    <div class="view-header">
      <div>
        <h1 class="view-title">Pricing</h1>
        <div class="view-subtitle">${tiers.length} dealer tiers · ${state.resellerTiers.length} reseller tiers · ${sheets.length} price sheets · ${state.fxRates.length} FX rates · ${state.promotions.filter(p => p.status === 'active').length} active promotions</div>
      </div>
    </div>

    <div class="subtabs">
      <button class="subtab ${tab === 'tiers' ? 'active' : ''}" onclick="state.pricingTab='tiers'; renderPricing()">Dealer tiers<span class="subtab-badge">${tiers.length}</span></button>
      <button class="subtab ${tab === 'resellers' ? 'active' : ''}" onclick="state.pricingTab='resellers'; renderPricing()">Resellers<span class="subtab-badge">${state.resellers.length}</span></button>
      <button class="subtab ${tab === 'sheets' ? 'active' : ''}" onclick="state.pricingTab='sheets'; renderPricing()">Price sheets<span class="subtab-badge">${sheets.length}</span></button>
      <button class="subtab ${tab === 'fx' ? 'active' : ''}" onclick="state.pricingTab='fx'; renderPricing()">FX rates<span class="subtab-badge">${state.fxRates.length}</span></button>
      <button class="subtab ${tab === 'promos' ? 'active' : ''}" onclick="state.pricingTab='promos'; renderPricing()">Promotions<span class="subtab-badge">${state.promotions.filter(p => p.status === 'active').length}</span></button>
      <button class="subtab ${tab === 'combos' ? 'active' : ''}" onclick="state.pricingTab='combos'; renderPricing()">Combinations</button>
    </div>

    ${content || `<div class="panel"><div class="empty-state">${tab.charAt(0).toUpperCase() + tab.slice(1)} editor — mock placeholder.</div></div>`}
  `;
}

/* ════════════════════════════════════════════════
   MONEY composite renderers
   ════════════════════════════════════════════════ */

function renderPricingHub() {
  // Tiers + Resellers + Sheets + FX + Promos all in one scroll page
  return `
    <div style="display:flex;gap:10px;margin-bottom:16px;padding:10px 14px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute);flex-wrap:wrap">
      <span>Jump to:</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('m-tiers').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">Dealer tiers</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('m-resellers').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">Resellers</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('m-fx').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">FX rates</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('m-promos').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">Promotions</a>
    </div>

    <h2 id="m-tiers" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:18px 0 12px">Dealer tiers</h2>
    ${renderDealerTiersSection()}

    <h2 id="m-resellers" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Resellers</h2>
    ${renderResellersTab()}

    <h2 id="m-fx" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">FX rates</h2>
    ${renderFXTab()}

    <h2 id="m-promos" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Promotions</h2>
    ${renderPromotionsTab()}
  `;
}

function renderDealerTiersSection() {
  const tiers = state.pricing.dealerTiers;
  return `
    <div class="tier-grid">
      ${tiers.map(t => `
        <div class="tier-card">
          <div class="tier-name">${t.name}</div>
          <div class="tier-code">${t.code}</div>
          <div class="tier-multiplier">${(t.multiplier * 100).toFixed(0)}<span class="pct">%</span></div>
          <div class="tier-stats">
            <div><strong style="color:var(--gl-text);font-weight:600">${t.dealers}</strong> dealer${t.dealers !== 1 ? 's' : ''}</div>
            <div>YTD ${fmtMoney(t.ytdVolume)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAnalyticsHub() {
  return `
    <div style="display:flex;gap:10px;margin-bottom:16px;padding:10px 14px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute)">
      <span>Jump to:</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('a-leadtime').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">Lead time</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('a-colormix').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">Color mix</a>
    </div>

    <h2 id="a-leadtime" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:18px 0 12px">Lead time trend</h2>
    ${renderLeadTimeAnalytics()}

    <h2 id="a-colormix" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Color &amp; finish sales mix</h2>
    ${renderColorMix()}
  `;
}

function renderBreakdownHub() {
  // Revenue breakdown + Cost breakdown combined
  // These are existing branches in the financials render — call them by setting tab + re-render
  // Simpler: just call them inline
  const savedTab = state.financialsTab;
  state.financialsTab = 'revenue';
  // We can't re-call renderFinancials here without infinite recursion. Build inline.

  // For simplicity, just render placeholders that link to the real underlying tabs
  return `
    <div style="display:flex;gap:10px;margin-bottom:16px;padding:10px 14px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute)">
      <span>Detailed P&amp;L breakdowns — click to drill in:</span>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="panel" style="cursor:pointer" onclick="state.financialsTab='revenue'; renderFinancials()">
        <div class="panel-header"><div class="panel-title">Revenue breakdown</div></div>
        <div style="padding:6px 0;font-size:13px;color:var(--gl-text-mute);line-height:1.6">By product family, by dealer, by month. See which products drive the most profit.</div>
        <div style="margin-top:10px;color:var(--gl-info);font-weight:500;font-size:12.5px">Open revenue breakdown →</div>
      </div>
      <div class="panel" style="cursor:pointer" onclick="state.financialsTab='costs'; renderFinancials()">
        <div class="panel-header"><div class="panel-title">Cost breakdown</div></div>
        <div style="padding:6px 0;font-size:13px;color:var(--gl-text-mute);line-height:1.6">COGS detail, opex categories, fixed vs variable, supplier concentration.</div>
        <div style="margin-top:10px;color:var(--gl-info);font-weight:500;font-size:12.5px">Open cost breakdown →</div>
      </div>
    </div>
  `;
}

function renderAudit() {
  const filter = state.auditFilter;
  const filtered = filter === 'all' ? state.auditEvents : state.auditEvents.filter(e => e.scope === filter);

  const counts = {
    all: state.auditEvents.length,
    own: state.auditEvents.filter(e => e.scope === 'own').length,
    dealer: state.auditEvents.filter(e => e.scope === 'dealer').length
  };

  const kindCategory = (kind) => {
    if (kind.includes('created') || kind.includes('invited')) return 'create';
    if (kind.includes('updated') || kind.includes('published') || kind.includes('acknowledged')) return 'update';
    if (kind.includes('deleted') || kind.includes('declined')) return 'delete';
    if (kind.includes('state') || kind.includes('approved') || kind.includes('delivered')) return 'state';
    if (kind.includes('auth') || kind.includes('login') || kind.includes('session')) return 'auth';
    return 'update';
  };

  const rows = filtered.map(e => `
    <div class="audit-row">
      <div class="audit-time">${e.at}</div>
      <div><span class="audit-kind ${kindCategory(e.kind)}">${e.kind}</span></div>
      <div class="audit-actor">
        <div class="audit-actor-avatar">${e.initials}</div>
        <span style="font-size:12.5px">${e.actor}</span>
      </div>
      <div>
        <div class="audit-target">${e.target}</div>
        <div class="audit-target-meta">${e.meta}</div>
      </div>
      <div><span class="audit-scope ${e.scope}">${e.scope === 'own' ? 'Factory' : 'Dealer'}</span></div>
    </div>
  `).join('');

  $('audit-view').innerHTML = `
    ${renderBackButton()}
    <div class="view-header">
      <div>
        <h1 class="view-title">Audit log</h1>
        <div class="view-subtitle">${state.auditEvents.length} events · own tenant + child dealer tenants · 7-year retention</div>
      </div>
      <div style="display:flex;gap:8px">
        <input class="search-input" placeholder="Filter events…" />
        <button class="btn ghost">↑ Export CSV</button>
      </div>
    </div>

    <div class="subtabs">
      <button class="subtab ${filter === 'all' ? 'active' : ''}" onclick="state.auditFilter='all'; renderAudit()">All<span class="subtab-badge">${counts.all}</span></button>
      <button class="subtab ${filter === 'own' ? 'active' : ''}" onclick="state.auditFilter='own'; renderAudit()">Northforge (own)<span class="subtab-badge">${counts.own}</span></button>
      <button class="subtab ${filter === 'dealer' ? 'active' : ''}" onclick="state.auditFilter='dealer'; renderAudit()">Dealer tenants<span class="subtab-badge">${counts.dealer}</span></button>
    </div>

    <div class="orders-table">
      <div class="audit-row" style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--gl-text-mute);padding:12px 16px;background:rgba(15,23,42,0.02)">
        <div>WHEN</div><div>KIND</div><div>ACTOR</div><div>TARGET</div><div>SCOPE</div>
      </div>
      ${rows}
    </div>
  `;
}

function renderFullscreenOrderDetail(o) {
  const d = getDealer(o.dealerId);
  const dateInfo = dateLabel(o.shipBy);
  const r = state.orderDetailReturnTo || {};
  // Build a friendly back label
  let backLabel = 'Orders';
  if (r.view === 'dashboard') backLabel = 'Dashboard';
  else if (r.view === 'production') {
    if (r.productionTab === 'live') backLabel = 'Live';
    else if (r.productionTab === 'orders') backLabel = 'All orders';
    else if (r.productionTab === 'planning') backLabel = 'Planning';
    else if (r.productionTab === 'tasks') backLabel = 'Tasks';
    else if (r.productionTab === 'issues') backLabel = 'Issues';
    else if (r.productionTab === 'quotes') backLabel = 'Quotes';
    else backLabel = 'Orders';
  }

  return `
    <div class="order-fullscreen">
      <div class="order-fullscreen-bar">
        <button class="order-back-btn" onclick="closeOrderDetail()" title="Back to ${backLabel}">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M12 15l-5-5 5-5"/></svg>
          <span>Back to ${backLabel}</span>
        </button>
        <div class="order-fullscreen-title">
          <span class="order-fullscreen-po">${o.po}</span>
          <span class="order-fullscreen-sep">·</span>
          <span class="order-fullscreen-project">${o.project}</span>
          <span class="status-pill ${o.status}" style="margin-left:10px"><span class="dot"></span>${statusLabel(o.status)}</span>
          ${dateInfo.late ? `<span class="order-fullscreen-late">${dateInfo.label}</span>` : ''}
        </div>
        <div style="flex:1"></div>
        <button class="btn primary sm order-fullscreen-hold-btn" onclick="openPlaceHold(${o.id})" title="Flag this order on hold">⚑ Hold</button>
        <div class="order-fullscreen-meta">
          ${o.units} units · ${fmtMoneyFull(o.value)} · ship by ${fmtDate(o.shipBy)}
        </div>
      </div>
      <div class="order-fullscreen-body">
        ${renderOrderDetail()}
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════════════
   Order contacts: dealer, internal factory owner, supplier (when stalled).
   Powers the contact card on the order detail and the "Forward to factory"
   composer that pre-fills an internal message with order context.
   ═══════════════════════════════════════════════════════════════════ */

function getFactoryTeamMember(id) {
  return (state.factory.team || []).find(m => m.id === id);
}

// Pick the team member who owns the order's current situation.
// Holds win over status — if an order is stalled on materials/QC/drawings,
// the matching specialist is the right person to forward to.
function getFactoryOwnerForOrder(o) {
  const owners = state.factory.stageOwners || {};
  const hold = (state.holds || []).find(h => h.orderId === o.id);
  let key;
  if (hold) {
    if (hold.blocker === 'supplier') key = 'materials';
    else if (hold.blocker === 'qc')   key = 'qc';
    else key = hold.stage || o.status;
  } else {
    key = o.status;
  }
  const memberId = owners[key] || owners[o.status] || 'marcus';
  return getFactoryTeamMember(memberId) || state.factory.team[0];
}

// Pick a supplier to surface on the order's contact panel — only when the
// order is on hold due to a supplier issue. Best-effort name match against
// the seeded supplier list.
function getSupplierForOrderHold(o) {
  const hold = (state.holds || []).find(h => h.orderId === o.id);
  if (!hold || hold.blocker !== 'supplier') return null;
  const name = (hold.followUp || '').split('·')[0].trim();
  if (!name) return null;
  return state.suppliers.find(s => name.toLowerCase().includes(s.short.toLowerCase()) ||
                                  name.toLowerCase().includes(s.name.toLowerCase())) || null;
}

/* ── Forward-to-factory composer ── */

function openForwardModal(orderId, memberId) {
  const o = getOrder(orderId);
  if (!o) return;
  const member = getFactoryTeamMember(memberId) || getFactoryOwnerForOrder(o);
  const d = getDealer(o.dealerId);
  const hold = (state.holds || []).find(h => h.orderId === o.id);
  const subjectBase = hold
    ? `${o.po} ${o.project} — stalled at ${hold.stageLabel.toLowerCase()}`
    : `${o.po} ${o.project} — status check`;
  const bodyLines = [
    `Hi ${member.name.split(' ')[0]},`,
    '',
    hold
      ? `${o.po} (${o.project}) for ${d.name} is showing as on hold at ${hold.stageLabel} — ${h2text(hold.reason)}.`
      : `Can you give me a quick status update on ${o.po} (${o.project}) for ${d.name}?`,
    '',
    `Dealer contact: ${d.rep.name} · ${d.rep.email} · ${d.rep.phone}`,
    `Order: ${o.units} units · ${fmtMoneyFull(o.value)} · ship by ${fmtDate(o.shipBy)}`,
    hold ? `On hold for ${hold.daysOnHold}d. Follow up with: ${hold.followUp}.` : null,
    '',
    `Let me know what you need from me to unblock.`,
    '',
    `Thanks,`,
    `${state.user.name.split(' ')[0]}`
  ].filter(l => l !== null);
  state.forwardModal = {
    open: true,
    orderId,
    memberId: member.id,
    subject: subjectBase,
    body: bodyLines.join('\n')
  };
  renderForwardModal();
}

function h2text(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

function closeForwardModal() {
  state.forwardModal = { open: false };
  renderForwardModal();
}

function sendForwardModal() {
  const f = state.forwardModal || {};
  if (!f.open) return;
  const member = getFactoryTeamMember(f.memberId);
  state.forwardModal = { open: false };
  renderForwardModal();
  toast(`Message sent to ${member ? member.name : 'factory contact'}`);
  // Log it on the audit trail so it surfaces in Recent activity too
  if (state.auditEvents) {
    const o = getOrder(f.orderId);
    state.auditEvents.unshift({
      id: state.auditEvents.length + 1,
      kind: 'order.internal_message',
      actor: state.user.name,
      initials: state.user.initials,
      tenantId: 'northforge',
      scope: 'own',
      at: 'just now',
      target: o ? `${o.po} · ${o.project}` : '—',
      meta: `Forwarded to ${member ? member.name : 'team'}`
    });
  }
}

function updateForwardSubject(v) {
  if (!state.forwardModal) return;
  state.forwardModal.subject = v;
}
function updateForwardBody(v) {
  if (!state.forwardModal) return;
  state.forwardModal.body = v;
}

function renderForwardModal() {
  const root = document.getElementById('modal-root');
  if (!root) return;
  const f = state.forwardModal || {};
  if (!f.open) {
    // Only clear our piece — the dealer-invite wizard owns its own renderModal call
    const existing = root.querySelector('#forward-modal-card');
    if (existing) existing.parentElement.remove();
    return;
  }
  const member = getFactoryTeamMember(f.memberId);
  if (!member) return;
  const o = getOrder(f.orderId);
  // Append, don't overwrite — the wizard may be open simultaneously
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="modal-overlay" onclick="if(event.target === this) closeForwardModal()">
      <div class="modal-card" id="forward-modal-card" style="max-width:620px">
        <div class="modal-head">
          <div>
            <div class="modal-title">Forward to ${member.name}</div>
            <div style="font-size:12.5px;color:var(--gl-text-mute);margin-top:3px">${member.role} · ${o ? o.po + ' · ' + o.project : ''}</div>
          </div>
          <div style="flex:1"></div>
          <button class="modal-close" onclick="closeForwardModal()" title="Close">×</button>
        </div>
        <div class="modal-body">
          <div class="forward-row">
            <label class="forward-label">To</label>
            <div class="forward-field readonly">
              <div class="contact-avatar" style="background:var(--gl-text);color:white">${member.initials}</div>
              <div>
                <div style="font-size:13px;font-weight:600;letter-spacing:-0.005em">${member.name}</div>
                <div style="font-size:11.5px;color:var(--gl-text-mute);font-variant-numeric:tabular-nums">${member.email} · ${member.phone}</div>
              </div>
            </div>
          </div>
          <div class="forward-row">
            <label class="forward-label" for="forwardSubject">Subject</label>
            <input id="forwardSubject" class="forward-input" type="text" value="${(f.subject || '').replace(/"/g, '&quot;')}" oninput="updateForwardSubject(this.value)" />
          </div>
          <div class="forward-row">
            <label class="forward-label" for="forwardBody">Message</label>
            <textarea id="forwardBody" class="forward-textarea" oninput="updateForwardBody(this.value)" rows="11">${f.body || ''}</textarea>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn ghost" onclick="closeForwardModal()">Cancel</button>
          <div style="flex:1"></div>
          <button class="btn primary" onclick="sendForwardModal()">Send to ${member.name.split(' ')[0]}</button>
        </div>
      </div>
    </div>
  `;
  // Remove any existing forward modal first
  const existing = root.querySelector('#forward-modal-card');
  if (existing) existing.parentElement.remove();
  root.appendChild(wrap.firstElementChild);
}

/* ── Contacts panel inside the order detail ── */

function renderPORefStrip(o) {
  const isNew = o.status === 'new';
  const materialCost = calculateOrderMaterialCost(o);
  const readiness = computeStockReadiness(o);
  const etcStr = o.etc ? fmtETC(o.etc) : (isNew ? 'will compute at acknowledge' : '—');

  // Stock readiness label
  let stockLabel, stockClass;
  if (readiness.out.length > 0) { stockLabel = `${readiness.out.length} short`; stockClass = 'out'; }
  else if (readiness.short.length > 0) { stockLabel = `${readiness.short.length} low`; stockClass = 'short'; }
  else if (readiness.low.length > 0) { stockLabel = `${readiness.low.length} marginal`; stockClass = 'low'; }
  else { stockLabel = 'all in stock'; stockClass = 'good'; }

  return `
    <div class="po-ref-strip">
      <div class="po-ref-cell">
        <div class="po-ref-label">Dealer PO</div>
        <div class="po-ref-value">${o.dealerPO || '—'}</div>
        <div class="po-ref-sub">from ${escapeHtml((getDealer(o.dealerId) || {}).name || 'dealer')}</div>
      </div>
      <div class="po-ref-divider"></div>
      <div class="po-ref-cell">
        <div class="po-ref-label">Factory order #</div>
        <div class="po-ref-value">${o.factoryOrderNumber || `<span style="color:var(--gl-text-faint);font-weight:600">FO- (assigned at ack)</span>`}</div>
        <div class="po-ref-sub">${o.acknowledgedAt ? 'acknowledged ' + fmtETC(o.acknowledgedAt.slice(0,10)) : 'not yet acknowledged'}</div>
      </div>
      <div class="po-ref-divider"></div>
      <div class="po-ref-cell">
        <div class="po-ref-label">ETC</div>
        <div class="po-ref-value">${o.etc ? etcStr : `<span style="color:var(--gl-text-faint);font-weight:600">${etcStr}</span>`}</div>
        <div class="po-ref-sub">est. time of completion</div>
      </div>
      <div class="po-ref-divider"></div>
      <div class="po-ref-cell">
        <div class="po-ref-label">Materials cost</div>
        <div class="po-ref-value">$${materialCost.toFixed(2)}</div>
        <div class="po-ref-sub po-ref-stock-${stockClass}">${stockLabel}</div>
      </div>
    </div>
  `;
}

function renderOrderHoldBanner(o) {
  const hold = (state.holds || []).find(h => h.orderId === o.id);
  if (!hold) return '';
  const blockerMeta = HOLD_BLOCKER_META[hold.blocker] || { label: hold.blocker, color: '#64748B', icon: '•' };

  // Parse follow-up to "Source · Contact name" — best-effort extraction of contact
  const parts = (hold.followUp || '').split('·').map(s => s.trim());
  const contactOrg = parts[0] || hold.followUp;
  const contactName = parts[1] || '';

  // Try to resolve a real contact for email/phone — match the dealer for dealer-blocked
  // holds, otherwise route to the factory team member who owns this stage/hold.
  let contactEmail = '', contactPhone = '';
  if (hold.blocker === 'dealer') {
    const d = getDealer(o.dealerId);
    if (d && d.rep) { contactEmail = d.rep.email; contactPhone = d.rep.phone; }
  } else if (hold.blocker === 'supplier') {
    const supplier = getSupplierForOrderHold(o);
    if (supplier) { contactEmail = supplier.contact; contactPhone = supplier.phone; }
  } else {
    // qc / machine / installer — route to factory owner
    const fo = getFactoryOwnerForOrder(o);
    if (fo) { contactEmail = fo.email; contactPhone = fo.phone; }
  }

  return `
    <div class="hold-banner">
      <div class="hold-banner-stripe"></div>
      <div class="hold-banner-body">
        <div class="hold-banner-head">
          <div>
            <span class="hold-banner-tag" style="background:${blockerMeta.color};color:white">⚑ ON HOLD · ${blockerMeta.label}</span>
            <span class="hold-banner-stage">Stalled at <strong>${escapeHtml(hold.stageLabel)}</strong></span>
          </div>
          <div class="hold-banner-days">${hold.daysOnHold}d on hold</div>
        </div>
        <div class="hold-banner-reason">${escapeHtml(hold.reason)}</div>
        <div class="hold-banner-meta">
          <div class="hold-banner-contact">
            <span class="hold-banner-contact-label">Flagged by / chase</span>
            ${(() => {
              // If this is a supplier hold, make the supplier name a link
              // straight into the supplier panel so the operator can act
              // (create PO, contact supplier) without hunting around.
              if (hold.blocker === 'supplier') {
                const sup = getSupplierForOrderHold(o);
                if (sup) {
                  return `<button class="hold-banner-contact-name link-name" type="button" onclick="event.stopPropagation(); openSupplierPanel(${sup.id}, ${o.id})">${escapeHtml(sup.name)}${contactName ? ` · ${escapeHtml(contactName)}` : ''} →</button>`;
                }
              }
              return `<span class="hold-banner-contact-name">${escapeHtml(contactOrg)}${contactName ? ` · ${escapeHtml(contactName)}` : ''}</span>`;
            })()}
            ${contactEmail ? `<a class="hold-banner-contact-link" href="mailto:${contactEmail}">${contactEmail}</a>` : ''}
            ${contactPhone ? `<a class="hold-banner-contact-link" href="tel:${contactPhone.replace(/\s/g,'')}">${contactPhone}</a>` : ''}
          </div>
          <div class="hold-banner-actions">
            ${contactEmail ? `<a class="btn ghost sm" href="mailto:${contactEmail}?subject=${encodeURIComponent(o.po + ' · ' + o.project + ' — on hold')}">✉ Email</a>` : ''}
            <button class="btn primary sm" onclick="resolveHold('${hold.id}')">✓ Resolve hold</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════════════
   HOLD RESOLUTION PANEL — clicking "Resolve hold" anywhere across the
   platform routes here. The panel shows the contacts on both sides of
   the hold (dealer / supplier / installer / QC team / machine
   maintenance), the conversation thread for this hold, the next
   blocking action, and the buttons that actually resolve it (email
   the contact, log a call, create a PO if it's a supplier hold,
   escalate, mark resolved). The point: one click to land in the
   right place to take the right action, instead of guessing.
   ═══════════════════════════════════════════════════════════════════ */
function resolveHold(holdId) {
  // Keep the legacy name — but route to the panel rather than silently clearing
  openHoldResolution(holdId);
}

function openHoldResolution(holdId) {
  const hold = (state.holds || []).find(h => h.id === holdId);
  if (!hold) return;
  const o = getOrder(hold.orderId);
  if (!o) return;
  const blockerMeta = HOLD_BLOCKER_META[hold.blocker] || { label: hold.blocker, color: '#64748B', icon: '•' };
  const d = getDealer(o.dealerId);

  // Resolve the right contact for this hold type
  let contact = null;     // { org, name, role, email, phone, navTarget }
  let supplier = null;
  if (hold.blocker === 'dealer' && d) {
    contact = {
      org: d.name,
      name: (d.rep && d.rep.name) || 'Dealer rep',
      role: (d.rep && d.rep.role) || 'Account rep',
      email: (d.rep && d.rep.email) || '',
      phone: (d.rep && d.rep.phone) || '',
      navTarget: { view: 'dealers', context: 'dealer:' + d.id }
    };
  } else if (hold.blocker === 'supplier') {
    supplier = getSupplierForOrderHold(o);
    if (supplier) {
      contact = {
        org: supplier.name,
        name: 'Supplier CSR',
        role: supplier.category,
        email: supplier.contact || '',
        phone: supplier.phone || '',
        navTarget: { view: 'supplier-panel', context: 'supplier:' + supplier.id }
      };
    }
  } else if (hold.blocker === 'installer') {
    const parts = (hold.followUp || '').split('·').map(s => s.trim());
    contact = {
      org: parts[0] || 'Installer partner',
      name: parts[1] || 'Installer',
      role: 'Field installer',
      email: '',
      phone: '',
      navTarget: null
    };
  } else {
    // qc / machine — factory team
    const fo = getFactoryOwnerForOrder(o);
    if (fo) {
      contact = {
        org: 'Northforge · Factory team',
        name: fo.name || 'Factory lead',
        role: hold.blocker === 'qc' ? 'QC Lead' : 'Production Lead',
        email: fo.email || '',
        phone: fo.phone || '',
        navTarget: { view: 'production', context: 'production' }
      };
    }
  }

  // Find any thread entries associated with this hold so the operator
  // has the conversation context in one panel rather than guessing.
  const threadForHold = (o.thread || []).filter(t =>
    t.body && (t.body.toLowerCase().includes(hold.stageLabel.toLowerCase())
            || t.body.toLowerCase().includes('hold')
            || t.kind === 'hold-update')
  );

  // Pick the right primary action based on hold type
  let primaryActionHtml = '';
  if (hold.blocker === 'supplier' && supplier) {
    primaryActionHtml = `
      <button class="btn primary" onclick="openSupplierPanel(${supplier.id}, ${o.id})">
        → Open ${escapeHtml(supplier.short || supplier.name)} · Create PO
      </button>`;
  } else if (hold.blocker === 'dealer' && d) {
    primaryActionHtml = `
      <button class="btn primary" onclick="closeHoldResolution(); switchView('estimates')">
        → Nudge dealer in Estimates
      </button>`;
  } else if (hold.blocker === 'qc') {
    primaryActionHtml = `
      <button class="btn primary" onclick="closeHoldResolution(); switchView('qc')">
        → Open QC inspection queue
      </button>`;
  } else if (hold.blocker === 'machine') {
    primaryActionHtml = `
      <button class="btn primary" onclick="closeHoldResolution(); switchView('pipeline')">
        → Reassign on production floor
      </button>`;
  }

  const modalHtml = `
    <div class="hold-res-overlay" onclick="if (event.target === this) closeHoldResolution()">
      <div class="hold-res-panel">

        <div class="hold-res-head">
          <div>
            <div class="hold-res-eyebrow" style="color:${blockerMeta.color}">RESOLVE HOLD · ${blockerMeta.label.toUpperCase()}</div>
            <div class="hold-res-title">${d ? escapeHtml(d.short) : 'Direct customer'} <span class="hold-res-po">${o.po}</span></div>
            <div class="hold-res-sub">${escapeHtml(o.project)} · stalled at <strong>${escapeHtml(hold.stageLabel)}</strong> · ${hold.daysOnHold} day${hold.daysOnHold === 1 ? '' : 's'} on hold</div>
          </div>
          <button class="hold-res-close" type="button" onclick="closeHoldResolution()">✕</button>
        </div>

        <div class="hold-res-body">

          <!-- What's blocking -->
          <div class="hold-res-section">
            <div class="hold-res-section-label">What's blocking</div>
            <div class="hold-res-reason">${escapeHtml(hold.reason)}</div>
          </div>

          <!-- Contact on the resolving side -->
          ${contact ? `
            <div class="hold-res-section">
              <div class="hold-res-section-label">${hold.blocker === 'supplier' ? 'Supplier contact' : hold.blocker === 'dealer' ? 'Dealer contact' : hold.blocker === 'installer' ? 'Installer contact' : 'Factory team contact'}</div>
              <div class="hold-res-contact-card">
                <div class="hold-res-contact-head">
                  <div>
                    ${hold.blocker === 'supplier' && supplier
                      ? `<button class="hold-res-contact-org link" onclick="openSupplierPanel(${supplier.id}, ${o.id})">${escapeHtml(contact.org)} →</button>`
                      : `<div class="hold-res-contact-org">${escapeHtml(contact.org)}</div>`}
                    <div class="hold-res-contact-name">${escapeHtml(contact.name)}${contact.role ? ` · ${escapeHtml(contact.role)}` : ''}</div>
                  </div>
                </div>
                <div class="hold-res-contact-links">
                  ${contact.email ? `<a class="btn ghost sm" href="mailto:${contact.email}?subject=${encodeURIComponent(o.po + ' · ' + o.project + ' — ' + hold.stageLabel)}">✉ ${contact.email}</a>` : ''}
                  ${contact.phone ? `<a class="btn ghost sm" href="tel:${contact.phone.replace(/\s/g, '')}">📞 ${contact.phone}</a>` : ''}
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Factory side / department contact -->
          ${(() => {
            const fo = getFactoryOwnerForOrder(o);
            if (!fo || (contact && contact.org && contact.org.includes('Factory'))) return '';
            return `
              <div class="hold-res-section">
                <div class="hold-res-section-label">Factory side · accountable on this order</div>
                <div class="hold-res-contact-card">
                  <div class="hold-res-contact-head">
                    <div>
                      <div class="hold-res-contact-org">Northforge · ${escapeHtml(fo.role || 'Operations')}</div>
                      <div class="hold-res-contact-name">${escapeHtml(fo.name || 'Factory lead')}</div>
                    </div>
                  </div>
                  <div class="hold-res-contact-links">
                    ${fo.email ? `<a class="btn ghost sm" href="mailto:${fo.email}">✉ ${fo.email}</a>` : ''}
                    ${fo.phone ? `<a class="btn ghost sm" href="tel:${fo.phone.replace(/\s/g, '')}">📞 ${fo.phone}</a>` : ''}
                  </div>
                </div>
              </div>
            `;
          })()}

          <!-- Chase trail (thread) -->
          ${threadForHold.length > 0 ? `
            <div class="hold-res-section">
              <div class="hold-res-section-label">Chase trail · ${threadForHold.length} message${threadForHold.length === 1 ? '' : 's'}</div>
              <div class="hold-res-thread">
                ${threadForHold.slice(0, 4).map(t => `
                  <div class="hold-res-thread-row">
                    <span class="hold-res-thread-init">${escapeHtml(t.initials || 'NF')}</span>
                    <div>
                      <div class="hold-res-thread-meta">${escapeHtml(t.name || '')} · ${escapeHtml(t.time || '')}</div>
                      <div class="hold-res-thread-body">${escapeHtml(t.body || '')}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Resolution note -->
          <div class="hold-res-section">
            <label class="hold-res-section-label" for="hold-res-note">Resolution note <span class="hold-res-tag">logged to thread</span></label>
            <div class="hold-res-help">Captures what unblocked the order. Required so we can audit recurring blockers.</div>
            <textarea id="hold-res-note" class="hold-res-textarea" rows="2" placeholder="e.g. Roto confirmed bronze hardware shipping today, ETA Wed."></textarea>
          </div>

        </div>

        <div class="hold-res-foot">
          <div class="hold-res-foot-meta">Clearing this hold logs the resolution to the audit trail and posts it to the dealer thread.</div>
          <div class="hold-res-foot-actions">
            <button class="btn ghost" onclick="closeHoldResolution()">Cancel</button>
            ${primaryActionHtml}
            <button class="btn ${hold.blocker === 'supplier' ? 'ghost' : 'primary'}" onclick="commitResolveHold('${hold.id}')">✓ Mark resolved</button>
          </div>
        </div>

      </div>
    </div>
  `;

  let mountEl = document.getElementById('hold-res-mount');
  if (!mountEl) {
    mountEl = document.createElement('div');
    mountEl.id = 'hold-res-mount';
    document.body.appendChild(mountEl);
  }
  mountEl.innerHTML = modalHtml;
  setTimeout(() => {
    const t = document.getElementById('hold-res-note');
    if (t) t.focus();
  }, 50);
}

function closeHoldResolution() {
  const el = document.getElementById('hold-res-mount');
  if (el) el.innerHTML = '';
}

function commitResolveHold(holdId) {
  const idx = (state.holds || []).findIndex(h => h.id === holdId);
  if (idx < 0) { closeHoldResolution(); return; }
  const hold = state.holds[idx];
  const note = ((document.getElementById('hold-res-note') || {}).value || '').trim();

  state.holds.splice(idx, 1);
  const o = getOrder(hold.orderId);
  if (o) {
    o.thread = o.thread || [];
    o.thread.push({
      from: 'factory',
      name: (state.user || { name: 'Sam Chen' }).name.split(' ').map((p,i) => i===0 ? p : p[0]+'.').join(' '),
      initials: 'NF',
      time: 'just now',
      body: `Hold cleared — ${hold.stageLabel.toLowerCase()} resolved.${note ? ' ' + note : ''}`,
      kind: 'hold-resolved'
    });
    if (state.auditEvents) {
      state.auditEvents.unshift({
        id: state.auditEvents.length + 1,
        kind: 'order.hold_resolved',
        actor: 'Sam Chen',
        initials: 'SC',
        tenantId: 'northforge',
        scope: 'own',
        at: 'just now',
        target: o.po,
        meta: `Resolved: ${hold.stageLabel}${note ? ' · ' + note.slice(0, 60) : ''}`
      });
    }
  }
  closeHoldResolution();
  toast((o ? o.po : 'Order') + ' · hold resolved');
  if (state.currentView === 'pipeline') renderPipeline();
  else if (state.currentView === 'production' || state.orderDetailFullscreen) renderProduction();
  else if (state.currentView === 'dashboard') renderDashboard();
}

/* ═══════════════════════════════════════════════════════════════════
   PLACE HOLD — the operator can flag any order as on-hold from any nav
   tab. The modal makes them pick the blocker type, the stalled-at
   stage, the chase contact (who's fixing it externally), the reason
   shown on the order banner, and check off the required approvals
   from other factory departments — approvers are auto-derived from the
   blocker type so the operator doesn't have to know who signs off on
   what. Once placed, the hold appears in the order's hold banner and
   the dashboard "On hold" list. Resolution uses the existing
   openHoldResolution flow.
   ═══════════════════════════════════════════════════════════════════ */

/* Per-blocker approval routing. Each entry lists the team member IDs (from
   state.factory.team) whose sign-off is required to place this kind of
   hold — because the hold has downstream consequences they need to know
   about. e.g. a supplier hold needs Procurement (Priya) because they own
   the chase with the supplier; a QC hold needs the QC Lead (Dave) because
   they're who will run the re-inspection. */
const HOLD_REQUIRED_APPROVERS = {
  dealer:    ['sam'],
  supplier:  ['priya'],
  qc:        ['dave', 'marcus'],
  installer: ['sam', 'jules'],
  carrier:   ['jules'],
  customer:  ['sam', 'priya'],
  machine:   ['marcus', 'priya']
};

function openPlaceHold(orderId, defaultBlocker) {
  const o = getOrder(orderId);
  if (!o) return;
  const d = getDealer(o.dealerId);

  // Default "stalled at" from current stage / substage
  let defaultStalled;
  if (o.status === 'production') {
    const sub = (WINDOW_PROD_SUBSTAGES.find(s => s.id === o.prodStage) || {}).label;
    defaultStalled = sub || 'In production';
  } else {
    defaultStalled = ((STAGES.find(s => s.id === o.status) || {}).label) || o.status;
  }

  // Note any existing hold(s) so the modal can show the operator they're
  // stacking a hold on an already-blocked order. Multiple holds of
  // different types can coexist (e.g. supplier hold + drawings hold).
  const existingHolds = (state.holds || []).filter(h => h.orderId === orderId);

  // Default blocker — caller hint, else 'supplier' if at materials, else 'dealer'
  const initialBlocker = defaultBlocker || (
    o.status === 'production' && o.prodStage === 'materials' ? 'supplier'
    : o.status === 'new' || o.status === 'ack' || o.status === 'drawings' ? 'dealer'
    : o.status === 'qc' ? 'qc'
    : 'supplier'
  );

  // Order matters — types most likely to be picked first
  const types = ['supplier', 'dealer', 'qc', 'machine', 'installer', 'drawings', 'customer', 'carrier'];

  const typeTilesHtml = types.map(t => {
    const meta = HOLD_BLOCKER_META[t] || { label: t, color: '#64748B', icon: '•' };
    return `
      <label class="ph-type">
        <input type="radio" name="ph-type" value="${t}" ${t === initialBlocker ? 'checked' : ''} onchange="renderPlaceHoldApprovers('${t}')" />
        <div class="ph-type-card">
          <span class="ph-type-pip" style="background:${meta.color}"></span>
          <div>
            <div class="ph-type-name">${meta.label}</div>
            <div class="ph-type-meta">${holdTypeDescriptor(t)}</div>
          </div>
        </div>
      </label>
    `;
  }).join('');

  const modalHtml = `
    <div class="stage-cf-overlay" onclick="if (event.target === this) closePlaceHold()">
      <div class="stage-cf-panel" style="max-width:640px">

        <div class="stage-cf-head">
          <div>
            <div class="stage-cf-eyebrow" style="color:var(--gl-warn)">⚑ PLACE HOLD</div>
            <div class="stage-cf-title">${d ? escapeHtml(d.short) : 'Direct customer'} <span class="stage-cf-po">${o.po}</span></div>
            <div class="stage-cf-sub">${escapeHtml(o.project)} · ${o.units} units · currently at <strong>${escapeHtml(defaultStalled)}</strong></div>
          </div>
          <button class="stage-cf-close" type="button" onclick="closePlaceHold()">✕</button>
        </div>

        <div class="stage-cf-body">

          ${existingHolds.length > 0 ? `
            <div class="ph-existing-banner">
              <div class="ph-existing-icon">⚑</div>
              <div>
                <div class="ph-existing-title">${existingHolds.length} existing ${existingHolds.length === 1 ? 'hold' : 'holds'} already on this order</div>
                <div class="ph-existing-detail">${existingHolds.map(h => `<strong>${HOLD_BLOCKER_META[h.blocker].label}</strong> · ${escapeHtml((h.reason || '').slice(0, 60))}${(h.reason || '').length > 60 ? '…' : ''}`).join(' · ')}</div>
                <div class="ph-existing-help">Placing this hold stacks on top of the existing one${existingHolds.length === 1 ? '' : 's'}. Both must be resolved before the order moves.</div>
              </div>
            </div>
          ` : ''}

          <!-- Blocker type -->
          <div class="stage-cf-field">
            <label class="stage-cf-field-label">What's blocking the order?</label>
            <div class="stage-cf-help">Picking the type routes the resolution to the right team and triggers the right approvals.</div>
            <div class="ph-type-grid">${typeTilesHtml}</div>
          </div>

          <!-- Stalled at -->
          <div class="stage-cf-field">
            <label class="stage-cf-field-label" for="ph-stalled">Stalled at</label>
            <input id="ph-stalled" class="ack-input" type="text" value="${escapeHtml(defaultStalled)}" />
          </div>

          <!-- Reason -->
          <div class="stage-cf-field">
            <label class="stage-cf-field-label" for="ph-reason">Reason
              <span class="stage-cf-tag">required · shown on hold banner</span>
            </label>
            <div class="stage-cf-help">Be specific — this is the first thing the team and the dealer see.</div>
            <textarea id="ph-reason" class="stage-cf-textarea" rows="2" placeholder="e.g. Bronze cap stock backorder · ETA PO arriving May 14"></textarea>
          </div>

          <!-- Chase contact -->
          <div class="stage-cf-field">
            <label class="stage-cf-field-label" for="ph-followup">Chase contact</label>
            <div class="stage-cf-help">Who's actively chasing this externally? Shown in the order's hold banner so the team knows who to call.</div>
            <input id="ph-followup" class="ack-input" type="text" placeholder="e.g. VEKA Canada · Lisa T." />
          </div>

          <!-- Required approvals -->
          <div class="stage-cf-field">
            <label class="stage-cf-field-label">Required approvals
              <span class="stage-cf-tag" style="background:rgba(15,23,42,0.08);color:var(--gl-text-mute)">auto-derived from type</span>
            </label>
            <div class="stage-cf-help">These departments must be notified before the hold is placed. Tick the ones you've already aligned with; the system notifies the rest.</div>
            <div id="ph-approvers"></div>
          </div>

        </div>

        <div class="stage-cf-foot">
          <div class="stage-cf-foot-meta">Placing this hold posts to the order thread, logs an audit event with your name, and notifies any approvers you didn't tick.</div>
          <div class="stage-cf-foot-actions">
            <button class="btn ghost" onclick="closePlaceHold()">Cancel</button>
            <button class="btn primary" onclick="commitPlaceHold(${orderId})">⚑ Place hold</button>
          </div>
        </div>

      </div>
    </div>
  `;

  let mountEl = document.getElementById('place-hold-mount');
  if (!mountEl) {
    mountEl = document.createElement('div');
    mountEl.id = 'place-hold-mount';
    document.body.appendChild(mountEl);
  }
  mountEl.innerHTML = modalHtml;
  // Populate approvers for the initial blocker type
  renderPlaceHoldApprovers(initialBlocker);
  setTimeout(() => {
    const t = document.getElementById('ph-reason');
    if (t) t.focus();
  }, 50);
}

function holdTypeDescriptor(t) {
  return ({
    supplier:  'Material, part, or hardware delivery',
    dealer:    'Waiting on dealer approval or info',
    qc:        'QC re-inspection or rework',
    machine:   'Equipment down or capacity short',
    installer: 'Field measure or installer issue',
    drawings:  'Engineering revision needed',
    customer:  'End customer change or hold',
    carrier:   'Shipping carrier or logistics'
  })[t] || 'Other';
}

function renderPlaceHoldApprovers(blockerType) {
  const ids = HOLD_REQUIRED_APPROVERS[blockerType] || [];
  const slot = document.getElementById('ph-approvers');
  if (!slot) return;
  const team = (state.factory && state.factory.team) || [];
  if (ids.length === 0) {
    slot.innerHTML = `<div class="ph-approver-empty">No required approvals for this type — you can place the hold yourself.</div>`;
    return;
  }
  slot.innerHTML = ids.map(id => {
    const m = team.find(t => t.id === id);
    if (!m) return '';
    return `
      <label class="ph-approver-row">
        <input type="checkbox" class="ph-approver-check" data-approver-id="${m.id}" />
        <div class="ph-approver-avatar">${m.initials}</div>
        <div class="ph-approver-info">
          <div class="ph-approver-name">${escapeHtml(m.name)}</div>
          <div class="ph-approver-role">${escapeHtml(m.role)}</div>
        </div>
        <div class="ph-approver-links">
          ${m.email ? `<a class="ph-approver-link" href="mailto:${m.email}" onclick="event.stopPropagation()">✉</a>` : ''}
          ${m.phone ? `<a class="ph-approver-link" href="tel:${m.phone.replace(/\\s/g, '')}" onclick="event.stopPropagation()">📞</a>` : ''}
        </div>
      </label>
    `;
  }).join('');
}

function closePlaceHold() {
  const el = document.getElementById('place-hold-mount');
  if (el) el.innerHTML = '';
}

function commitPlaceHold(orderId) {
  const o = getOrder(orderId);
  if (!o) { closePlaceHold(); return; }

  const blockerInput = document.querySelector('input[name="ph-type"]:checked');
  const blocker = blockerInput ? blockerInput.value : 'supplier';
  const stalled = ((document.getElementById('ph-stalled') || {}).value || '').trim();
  const reason  = ((document.getElementById('ph-reason')  || {}).value || '').trim();
  const followUp = ((document.getElementById('ph-followup') || {}).value || '').trim() || 'Chase contact pending';

  // Validate reason
  if (!reason) {
    const t = document.getElementById('ph-reason');
    if (t) { t.classList.add('stage-cf-textarea-error'); t.focus(); }
    toast('Add the hold reason before placing the hold.');
    return;
  }

  // Approvers — who's been signed off vs who still needs to be notified
  const requiredIds = HOLD_REQUIRED_APPROVERS[blocker] || [];
  const tickedIds = Array.from(document.querySelectorAll('.ph-approver-check:checked'))
    .map(el => el.getAttribute('data-approver-id'));
  const toNotifyIds = requiredIds.filter(id => !tickedIds.includes(id));

  const me = (state.user || { name: 'Sam Chen' });
  const initials = me.name.split(' ').map(p => p[0]).slice(0,2).join('');

  // Create the hold
  state.holds = state.holds || [];
  const newHold = {
    id: 'hold-' + Date.now(),
    orderId: o.id,
    blocker: blocker,
    stageLabel: stalled,
    stalledAt: stalled,
    reason: reason,
    followUp: followUp,
    daysOnHold: 0,
    placedBy: me.name,
    placedAt: new Date().toISOString(),
    approvalsConfirmed: tickedIds,
    approvalsPending: toNotifyIds
  };
  state.holds.unshift(newHold);

  // Thread + audit
  o.thread = o.thread || [];
  const team = (state.factory && state.factory.team) || [];
  const approvalSummary = requiredIds.length === 0
    ? 'no approvals required'
    : (toNotifyIds.length === 0
        ? `${requiredIds.length} approval${requiredIds.length === 1 ? '' : 's'} confirmed`
        : `${tickedIds.length}/${requiredIds.length} approvals confirmed · notifying ${toNotifyIds.map(id => (team.find(t => t.id === id) || {}).name || id).join(', ')}`);
  o.thread.push({
    from: 'factory',
    name: me.name,
    initials: initials,
    time: 'just now',
    body: `⚑ Hold placed · ${HOLD_BLOCKER_META[blocker].label} · stalled at ${stalled}\n${reason}\nChase: ${followUp}\n${approvalSummary}`,
    kind: 'hold-placed'
  });
  if (state.auditEvents) {
    state.auditEvents.unshift({
      id: state.auditEvents.length + 1,
      kind: 'order.hold_placed',
      actor: me.name,
      initials: initials,
      tenantId: 'northforge',
      scope: 'own',
      at: 'just now',
      target: o.po,
      meta: `${HOLD_BLOCKER_META[blocker].label} · ${stalled} · ${reason.slice(0, 60)}`
    });
  }

  closePlaceHold();
  toast(`${o.po} · hold placed (${HOLD_BLOCKER_META[blocker].label})`);

  // Re-render whatever view is active
  if (state.currentView === 'pipeline') renderPipeline();
  if (state.currentView === 'estimates') renderEstimates();
  if (state.currentView === 'qc') renderQC();
  if (state.currentView === 'shipping') renderShipping();
  if (state.currentView === 'production') renderProduction();
  if (state.currentView === 'dashboard') renderDashboard();
}

/* ═══════════════════════════════════════════════════════════════════
   SUPPLIER PANEL — opened from a supplier hold or from clicking a
   supplier name anywhere. Shows the supplier's contact info, terms,
   lead time, on-time %, items currently on order, and a primary
   action: create a PO right from here for the blocked order.
   ═══════════════════════════════════════════════════════════════════ */
function openSupplierPanel(supplierId, contextOrderId) {
  const supplier = state.suppliers.find(s => s.id === supplierId);
  if (!supplier) return;
  const order = contextOrderId ? getOrder(contextOrderId) : null;

  // Items this supplier provides
  const supplierSKUs = (state.inventory || []).filter(i => i.supplierId === supplier.id);
  const lowStockHere = supplierSKUs.filter(i => i.onHand <= (i.reorderPoint || 0));

  // Open POs to this supplier
  const openPOs = (state.purchaseOrders || []).filter(po => po.supplierId === supplier.id && po.status !== 'received' && po.status !== 'closed');
  const openValue = openPOs.reduce((s, po) => s + (po.totalCost || 0), 0);

  const panelHtml = `
    <div class="hold-res-overlay" onclick="if (event.target === this) closeSupplierPanel()">
      <div class="hold-res-panel supplier-panel">

        <div class="hold-res-head">
          <div>
            <div class="hold-res-eyebrow" style="color:${(supplier.gradient || '').includes('linear') ? '#64748B' : '#64748B'}">SUPPLIER</div>
            <div class="hold-res-title">${escapeHtml(supplier.name)}</div>
            <div class="hold-res-sub">${escapeHtml(supplier.category || '')} · ${escapeHtml(supplier.address || '')}</div>
          </div>
          <button class="hold-res-close" type="button" onclick="closeSupplierPanel()">✕</button>
        </div>

        <div class="hold-res-body">
          <!-- Stats strip -->
          <div class="supplier-stats">
            <div class="supplier-stat"><div class="supplier-stat-label">Lead time</div><div class="supplier-stat-val">${supplier.avgLeadDays || '—'} days</div></div>
            <div class="supplier-stat"><div class="supplier-stat-label">On-time</div><div class="supplier-stat-val" style="color:${(supplier.onTimePct || 0) >= 95 ? 'var(--gl-success)' : (supplier.onTimePct || 0) >= 90 ? 'var(--gl-warn)' : 'var(--gl-danger)'}">${supplier.onTimePct || '—'}%</div></div>
            <div class="supplier-stat"><div class="supplier-stat-label">Terms</div><div class="supplier-stat-val">${escapeHtml(supplier.paymentTerms || '—')}</div></div>
            <div class="supplier-stat"><div class="supplier-stat-label">YTD spend</div><div class="supplier-stat-val">${fmtMoney(supplier.ytdSpend || 0)}</div></div>
            <div class="supplier-stat"><div class="supplier-stat-label">Active SKUs</div><div class="supplier-stat-val">${supplier.activeSKUs || supplierSKUs.length}</div></div>
          </div>

          <!-- Contact -->
          <div class="hold-res-section">
            <div class="hold-res-section-label">Contact</div>
            <div class="hold-res-contact-card">
              <div class="hold-res-contact-head">
                <div>
                  <div class="hold-res-contact-org">${escapeHtml(supplier.name)}</div>
                  <div class="hold-res-contact-name">${escapeHtml(supplier.category || 'Supplier')}</div>
                </div>
              </div>
              <div class="hold-res-contact-links">
                ${supplier.contact ? `<a class="btn ghost sm" href="mailto:${supplier.contact}?subject=${encodeURIComponent(order ? order.po + ' · stalled at materials' : 'PO inquiry')}">✉ ${supplier.contact}</a>` : ''}
                ${supplier.phone ? `<a class="btn ghost sm" href="tel:${supplier.phone.replace(/\s/g, '')}">📞 ${supplier.phone}</a>` : ''}
              </div>
            </div>
          </div>

          <!-- Order context if launched from a hold -->
          ${order ? `
            <div class="hold-res-section">
              <div class="hold-res-section-label">Blocked order</div>
              <div class="supplier-order-context">
                <div>
                  <div style="font-size:13.5px;font-weight:600;letter-spacing:-0.012em">${(getDealer(order.dealerId) || {}).short || 'Direct customer'} <span style="font-variant-numeric:tabular-nums">${order.po}</span></div>
                  <div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">${escapeHtml(order.project)} · ${order.units} units · ship by ${fmtDateShort(order.shipBy)}</div>
                </div>
                <button class="btn ghost sm" onclick="closeSupplierPanel(); openOrderFullscreen(${order.id})">Open order →</button>
              </div>
            </div>
          ` : ''}

          <!-- Low / out of stock items from this supplier -->
          ${lowStockHere.length > 0 ? `
            <div class="hold-res-section">
              <div class="hold-res-section-label">Below reorder · this supplier · ${lowStockHere.length}</div>
              <div class="supplier-skus">
                ${lowStockHere.map(i => `
                  <div class="supplier-sku-row">
                    <div>
                      <div class="supplier-sku-id">${escapeHtml(i.sku)}</div>
                      <div class="supplier-sku-name">${escapeHtml(i.name)}</div>
                    </div>
                    <div class="supplier-sku-stock">
                      <span class="supplier-sku-stock-onhand">${i.onHand}${i.uom || ''}</span>
                      <span class="supplier-sku-stock-sep">/</span>
                      <span class="supplier-sku-stock-reorder">${i.reorderPoint}${i.uom || ''}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Open POs to this supplier -->
          ${openPOs.length > 0 ? `
            <div class="hold-res-section">
              <div class="hold-res-section-label">Open POs · ${openPOs.length} · ${fmtMoney(openValue)} on order</div>
              <div class="supplier-skus">
                ${openPOs.map(po => `
                  <div class="supplier-sku-row">
                    <div>
                      <div class="supplier-sku-id">${escapeHtml(po.id)}</div>
                      <div class="supplier-sku-name">${escapeHtml(po.status)} · ETA ${po.expectedAt ? fmtDateShort(po.expectedAt) : '—'}</div>
                    </div>
                    <div class="supplier-sku-stock">${fmtMoney(po.totalCost || 0)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

        </div>

        <div class="hold-res-foot">
          <div class="hold-res-foot-meta">Creating a PO will draft an order with the items below reorder, pre-filled to ${escapeHtml(supplier.name)}.</div>
          <div class="hold-res-foot-actions">
            <button class="btn ghost" onclick="closeSupplierPanel()">Close</button>
            <button class="btn primary" onclick="createPOFromSupplier(${supplier.id}${order ? ', ' + order.id : ''})">+ Create PO to ${escapeHtml(supplier.short || supplier.name)}</button>
          </div>
        </div>

      </div>
    </div>
  `;

  let mountEl = document.getElementById('hold-res-mount');
  if (!mountEl) {
    mountEl = document.createElement('div');
    mountEl.id = 'hold-res-mount';
    document.body.appendChild(mountEl);
  }
  mountEl.innerHTML = panelHtml;
}

function closeSupplierPanel() {
  closeHoldResolution();
}

function createPOFromSupplier(supplierId, contextOrderId) {
  const supplier = state.suppliers.find(s => s.id === supplierId);
  if (!supplier) return;
  const lowSKUs = (state.inventory || []).filter(i => i.supplierId === supplierId && i.onHand <= (i.reorderPoint || 0));

  // Mint a new draft PO
  const today = new Date(state.calendarDate || new Date().toISOString().slice(0,10));
  const eta = new Date(today.getTime() + (supplier.avgLeadDays || 14) * 86400000);
  const newId = `PO-2026-${String(60 + ((state.purchaseOrders || []).length)).padStart(4, '0')}`;
  const lineItems = lowSKUs.map(i => {
    const need = Math.max(i.reorderQty || (i.reorderPoint || 0) * 2, (i.reorderPoint || 0) - i.onHand);
    return { sku: i.sku, name: i.name, qty: need, unitCost: i.unitCost || 0, totalCost: need * (i.unitCost || 0) };
  });
  const totalQty = lineItems.reduce((s, l) => s + l.qty, 0);
  const totalCost = lineItems.reduce((s, l) => s + l.totalCost, 0);
  const newPO = {
    id: newId,
    supplierId: supplier.id,
    status: 'submitted',
    submittedAt: today.toISOString().slice(0,10),
    expectedAt: eta.toISOString().slice(0,10),
    etaDays: supplier.avgLeadDays || 14,
    lineItems: lineItems,
    totalQty: totalQty,
    totalCost: totalCost,
    dockDoor: null,
    palletCount: null,
    proNumber: null,
    contextOrderId: contextOrderId || null
  };
  state.purchaseOrders = state.purchaseOrders || [];
  state.purchaseOrders.unshift(newPO);

  if (state.auditEvents) {
    state.auditEvents.unshift({
      id: state.auditEvents.length + 1,
      kind: 'po.created',
      actor: 'Sam Chen', initials: 'SC',
      tenantId: 'northforge', scope: 'own',
      at: 'just now',
      target: newId,
      meta: `${supplier.name} · ${lineItems.length} lines · ${fmtMoney(totalCost)}${contextOrderId ? ' · from hold on order ' + getOrder(contextOrderId).po : ''}`
    });
  }

  closeSupplierPanel();
  toast(`✓ ${newId} drafted to ${supplier.short || supplier.name} · ${lineItems.length} lines · ${fmtMoney(totalCost)}`);
  // Re-render any visible views
  if (state.currentView === 'production' && state.productionTab === 'materials') renderProduction();
}

function renderOrderContactsPanel(o) {
  const d = getDealer(o.dealerId);
  const factoryOwner = getFactoryOwnerForOrder(o);
  const supplier = getSupplierForOrderHold(o);
  const hold = (state.holds || []).find(h => h.orderId === o.id);

  const dealerCard = `
    <div class="contact-card dealer">
      <div class="contact-card-head">
        <span class="contact-card-tag dealer">Dealer</span>
        <span class="contact-card-name">${d.name}</span>
      </div>
      <div class="contact-card-body">
        <div class="contact-line">
          <div class="contact-avatar" style="background:${d.gradient}">${d.rep.initials}</div>
          <div>
            <div class="contact-person">${d.rep.name} <span class="contact-role">· ${d.rep.role}</span></div>
            <div class="contact-meta">
              <a href="mailto:${d.rep.email}" class="contact-link">${d.rep.email}</a>
              <span class="contact-sep">·</span>
              <a href="tel:${d.rep.phone.replace(/\s/g,'')}" class="contact-link">${d.rep.phone}</a>
            </div>
          </div>
        </div>
        <div class="contact-sub">
          <span class="contact-sub-label">Office</span> ${d.address} · ${d.phone}
          <span class="contact-sep">·</span> <a href="mailto:${d.email}" class="contact-link">${d.email}</a>
        </div>
      </div>
      <div class="contact-card-actions">
        <a class="btn ghost sm" href="mailto:${d.rep.email}?subject=${encodeURIComponent(o.po + ' · ' + o.project)}">✉ Email ${d.rep.name.split(' ')[0]}</a>
        <a class="btn ghost sm" href="tel:${d.rep.phone.replace(/\s/g,'')}">📞 Call</a>
      </div>
    </div>
  `;

  const factoryCard = `
    <div class="contact-card factory">
      <div class="contact-card-head">
        <span class="contact-card-tag factory">Factory · in charge</span>
        <span class="contact-card-name">${factoryOwner.role}${hold ? ` · stalled at ${hold.stageLabel.toLowerCase()}` : ` · stage: ${statusLabel(o.status).toLowerCase()}`}</span>
      </div>
      <div class="contact-card-body">
        <div class="contact-line">
          <div class="contact-avatar" style="background:var(--gl-text);color:white">${factoryOwner.initials}</div>
          <div>
            <div class="contact-person">${factoryOwner.name}</div>
            <div class="contact-meta">
              <a href="mailto:${factoryOwner.email}" class="contact-link">${factoryOwner.email}</a>
              <span class="contact-sep">·</span>
              <a href="tel:${factoryOwner.phone.replace(/\s/g,'')}" class="contact-link">${factoryOwner.phone}</a>
            </div>
          </div>
        </div>
      </div>
      <div class="contact-card-actions">
        <button class="btn primary sm" onclick="openForwardModal(${o.id}, '${factoryOwner.id}')">↗ Forward / ask</button>
        <a class="btn ghost sm" href="mailto:${factoryOwner.email}">✉ Email direct</a>
        <a class="btn ghost sm" href="tel:${factoryOwner.phone.replace(/\s/g,'')}">📞 Call</a>
      </div>
    </div>
  `;

  const supplierCard = supplier ? `
    <div class="contact-card supplier">
      <div class="contact-card-head">
        <span class="contact-card-tag supplier">Supplier · awaiting</span>
        <span class="contact-card-name">${supplier.name}</span>
      </div>
      <div class="contact-card-body">
        <div class="contact-line">
          <div class="contact-avatar" style="background:${supplier.gradient};color:white">${supplier.initials}</div>
          <div>
            <div class="contact-person">${supplier.category}</div>
            <div class="contact-meta">
              <a href="mailto:${supplier.contact}" class="contact-link">${supplier.contact}</a>
              <span class="contact-sep">·</span>
              <a href="tel:${supplier.phone.replace(/\s/g,'')}" class="contact-link">${supplier.phone}</a>
            </div>
          </div>
        </div>
        <div class="contact-sub">
          <span class="contact-sub-label">Address</span> ${supplier.address}
          <span class="contact-sep">·</span> Lead ${supplier.avgLeadDays}d · ${supplier.onTimePct}% on-time
        </div>
      </div>
      <div class="contact-card-actions">
        <a class="btn ghost sm" href="mailto:${supplier.contact}?subject=${encodeURIComponent('PO follow-up · ' + o.po)}">✉ Email supplier</a>
        <a class="btn ghost sm" href="tel:${supplier.phone.replace(/\s/g,'')}">📞 Call</a>
      </div>
    </div>
  ` : '';

  return `
    <div class="section-label">Contacts</div>
    <div class="contacts-grid">
      ${dealerCard}
      ${factoryCard}
      ${supplierCard}
    </div>
  `;
}

/* ── Unit type profiles — drives the per-group spec details in the order detail ──
   Deterministic defaults per fenestration type, sized to typical Ontario residential
   openings (NAFS PG-30/PG-40 class). Energy values calibrated to ENERGY STAR Zone 2
   triple-glazed Low-E 272 + Argon. Real production data would override these.
   ──────────────────────────────────────────────────────────────────────────────── */
const UNIT_TYPE_PROFILES = {
  'Casement':    { width: 600,  height: 1200, config: 'LH egress · top hinge',   uFactor: 1.05, shgc: 0.21, screen: 'FlexScreen mesh' },
  'Picture':     { width: 1500, height: 1800, config: 'Fixed · no operable',     uFactor: 0.95, shgc: 0.23, screen: '—' },
  'Sliding':     { width: 1800, height: 1200, config: 'XO (left-operable)',      uFactor: 1.15, shgc: 0.22, screen: 'Half mesh' },
  'Awning':      { width: 900,  height: 600,  config: 'Top-hinged · operable',   uFactor: 1.05, shgc: 0.21, screen: 'FlexScreen mesh' },
  'Double-hung': { width: 750,  height: 1400, config: 'Balanced sash · tilt-in', uFactor: 1.12, shgc: 0.22, screen: 'Half mesh' },
  'Bay':         { width: 2400, height: 1500, config: '3-lite 45° · fixed + 2 op', uFactor: 1.18, shgc: 0.25, screen: 'FlexScreen mesh' },
  'Bow':         { width: 2700, height: 1500, config: '4-lite arc · fixed',      uFactor: 1.20, shgc: 0.25, screen: '—' },
  'Hopper':      { width: 900,  height: 500,  config: 'Bottom-hinged · operable',uFactor: 1.10, shgc: 0.22, screen: 'Half mesh' }
};

function getUnitGroupDetails(u, idx) {
  const profile = UNIT_TYPE_PROFILES[u.name] || { width: 900, height: 1200, config: '—', uFactor: 1.10, shgc: 0.22, screen: '—' };
  // Tag prefix: A, B, C... per group; numbered 1..count
  const prefix = String.fromCharCode(65 + (idx % 26));
  const tagFrom = `${prefix}1`;
  const tagTo   = u.count === 1 ? tagFrom : `${prefix}${u.count}`;
  const tagRange = u.count === 1 ? tagFrom : `${tagFrom}–${tagTo}`;
  const sizeLabel = `${profile.width} × ${profile.height} mm`;
  const sizeImperial = `${(profile.width / 25.4).toFixed(1)}" × ${(profile.height / 25.4).toFixed(1)}"`;
  const unitPrice = u.count > 0 ? u.price / u.count : u.price;

  // Compute frame perimeter (for component pricing + visual reference)
  const perimMm = 2 * (profile.width + profile.height);
  const perimFt = +(perimMm / 304.8).toFixed(1);
  const widthFt = +(profile.width / 304.8).toFixed(1);

  // Per-unit hardware spec varies by operation type
  const hardware = u.name === 'Sliding'
    ? 'Roto NT slide hardware · white'
    : (u.name === 'Awning' || u.name === 'Casement')
      ? 'Roto NT multipoint · white'
      : u.name === 'Tilt-turn'
        ? 'Roto NT tilt-turn cam · brushed nickel'
        : u.name === 'Double-hung'
          ? 'Balanced sash kit · cam locks · white'
          : 'Picture-frame brackets · stainless';

  const round1 = (n) => +Number(n).toFixed(1);

  // ─── Frame package (mainframe + sash + jambs + sill + head) ───
  // Lineal feet of each profile needed per unit, with the VEKA-7000-FRM as
  // the base extrusion family.
  const framePackage = [
    { sku: 'VEKA-7000-FRM', name: '7000 mainframe extrusion', detail: 'Bronze cap · 6 chamber',    qty: perimFt, uom: 'lf' },
    { sku: 'VEKA-7000-SSH', name: '7000 sash extrusion',      detail: 'Bronze cap · welded miters', qty: u.name === 'Picture' ? 0 : round1(perimFt * 0.85), uom: 'lf' },
    { sku: 'VEKA-7000-JMB', name: '7000 jamb extension',      detail: '4 9⁄16" jamb · vinyl',       qty: perimFt, uom: 'lf' },
    { sku: 'VEKA-7000-SLL', name: '7000 sloped sill',         detail: '5° drainage · drip rib',     qty: widthFt, uom: 'lf' },
    { sku: 'VEKA-7000-HD',  name: '7000 head receiver',       detail: 'Continuous · drip kerf',     qty: widthFt, uom: 'lf' }
  ];

  // ─── Exterior trim package (brick mould + nail fin + casing) ───
  const exteriorTrim = [
    { sku: 'EX-BMOLD-32',  name: 'Brick mould · 1¼" × 2"',    detail: 'PVC capstock · matches frame', qty: perimFt, uom: 'lf' },
    { sku: 'EX-NAIL-FIN',  name: 'Integral nail fin',         detail: '1½" return · 8" o.c. holes',    qty: perimFt, uom: 'lf' },
    { sku: 'EX-J-CHANNEL', name: 'Casing J-channel',          detail: 'Vinyl · siding terminator',     qty: perimFt, uom: 'lf' }
  ];

  // ─── Weatherseal + gasket package ───
  const seals = [
    { sku: 'SEAL-QLON-FIN',  name: 'Q-Lon fin seal · 9mm',    detail: 'Frame perimeter · black', qty: perimFt,                                  uom: 'lf' },
    { sku: 'SEAL-QLON-BLB',  name: 'Q-Lon bulb seal · 7mm',   detail: 'Sash perimeter · black',  qty: u.name === 'Picture' ? 0 : round1(perimFt * 0.85), uom: 'lf' },
    { sku: 'SEAL-PILE-WBR',  name: 'Pile weather strip',      detail: 'Tracks · grey',           qty: (u.name === 'Sliding' || u.name === 'Double-hung') ? round1(perimFt * 0.6) : 0, uom: 'lf' }
  ];

  // ─── Glazing materials (in addition to the IGU itself) ───
  const glazing = [
    { sku: 'IGU-CRD-4124',   name: 'Cardinal IGU 4-12-4',     detail: 'Low-E 272 · Argon · warm-edge spacer', qty: 1,                          uom: 'pane' },
    { sku: 'EDGE-SS-13.5',   name: 'Edgetech Super Spacer',   detail: '13.5mm · white · primary seal',        qty: round1(perimFt * 0.95),     uom: 'lf' },
    { sku: 'GLAZE-TAPE-9MM', name: 'Glazing tape · 9mm × 2mm',detail: 'Butyl · grey',                          qty: round1(perimFt * 0.95),     uom: 'lf' },
    { sku: 'GLAZE-BEAD',     name: 'Internal glazing bead',   detail: 'Snap-in · matches frame',               qty: perimFt,                    uom: 'lf' },
    { sku: 'SEAL-SIL-BLK',   name: 'Silicone glazing sealant',detail: 'Dow 791 · black · 305ml',              qty: u.name === 'Picture' ? 2 : 1, uom: 'ea' }
  ];

  // ─── Fasteners + install accessories ───
  const fasteners = [
    { sku: 'FAST-PAN-2.5',  name: 'Pan head screw · #8 × 2½"', detail: 'Zinc · install through jamb', qty: 12, uom: 'ea' },
    { sku: 'FAST-FIN-1.5',  name: 'Roofing nail · 1½"',        detail: 'Galvanized · nail fin',       qty: 16, uom: 'ea' },
    { sku: 'SHIM-CMP-3.5',  name: 'Composite shim · 3½"',      detail: 'Plastic · graduated',         qty: 8,  uom: 'ea' },
    { sku: 'CAP-NAIL-WHT',  name: 'Cap nail · white',          detail: 'Conceals interior screw heads', qty: 8, uom: 'ea' }
  ];

  // ─── Screens ───
  const screens = profile.screen && profile.screen !== '—' ? [{
    sku: u.name === 'Double-hung' || u.name === 'Sliding' ? 'SCR-HALF-FX' : 'SCR-FLEX-FX',
    name: profile.screen,
    detail: u.name === 'Double-hung' || u.name === 'Sliding' ? 'Half-size · fiberglass mesh' : 'Full-size · pultruded fiberglass · charcoal',
    qty: 1,
    uom: 'ea'
  }] : [];

  return {
    profile, prefix, tagRange, sizeLabel, sizeImperial,
    unitPrice, perimFt,
    glass:    'Cardinal IGU 4-12-4 Low-E 272 · Argon · warm-edge spacer',
    finish:   'White interior · Black laminate exterior',
    hardware,
    components: { framePackage, exteriorTrim, seals, glazing, fasteners, screens }
  };
}

/* ═══════════════════════════════════════════════════════════════════
   Window-type thumbnails — small SVG schematics that show the operator
   what each unit type looks like at a glance. Drawn at the actual
   aspect ratio of the unit so the operator can spot when a unit is
   tall-and-narrow vs short-and-wide. Monochrome, squared edges per
   ADR-042, glass tint hints at the IGU.
   ═══════════════════════════════════════════════════════════════════ */
function renderUnitThumbnail(type, profile, finishLabel) {
  const w = profile && profile.width  ? profile.width  : 900;
  const h = profile && profile.height ? profile.height : 1200;

  // Pick a frame color from the finish — "Black laminate exterior"
  // dominates here so we use ink. The interior face is white but the
  // thumbnail shows the elevation so the dark frame is what's relevant.
  const isDark = /Black|Bronze|Commercial/i.test(finishLabel || '');
  const frame = isDark ? '#0F172A' : '#374151';
  const glass = '#DCEAF4';        // subtle blue-tinted glass
  const glassDark = '#BBD0E0';

  // Fit the SVG into a 120×140 box while preserving aspect ratio
  const boxW = 110;
  const boxH = 130;
  const aspect = w / h;
  let drawW, drawH;
  if (aspect > boxW / boxH) {
    drawW = boxW - 8;
    drawH = (boxW - 8) / aspect;
  } else {
    drawH = boxH - 8;
    drawW = (boxH - 8) * aspect;
  }
  const offsetX = (boxW - drawW) / 2;
  const offsetY = (boxH - drawH) / 2;

  const fw = 3;  // frame thickness in SVG units

  // Inner glass rect coordinates
  const ix = offsetX + fw;
  const iy = offsetY + fw;
  const iw = drawW - fw * 2;
  const ih = drawH - fw * 2;
  const cx = ix + iw / 2;
  const cy = iy + ih / 2;

  const t = (type || '').toLowerCase();
  let interior = '';

  if (t.includes('casement')) {
    // Single hinged sash, hinge at left, handle at right
    interior = `
      <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${glass}" />
      <!-- hinge dots on left edge -->
      <circle cx="${ix + 1.5}" cy="${iy + 6}" r="1.2" fill="${frame}" />
      <circle cx="${ix + 1.5}" cy="${iy + ih - 6}" r="1.2" fill="${frame}" />
      <!-- inset frame indicator showing the operable sash -->
      <rect x="${ix + 2}" y="${iy + 2}" width="${iw - 4}" height="${ih - 4}" fill="none" stroke="${frame}" stroke-width="0.5" opacity="0.5" />
      <!-- hinge-axis arrow corner mark (top-left) -->
      <path d="M ${ix + 4} ${iy + 4} L ${ix + iw - 4} ${iy + ih - 4}" stroke="${frame}" stroke-width="0.6" stroke-dasharray="2 2" opacity="0.6" />
      <!-- handle: small notch on right -->
      <rect x="${ix + iw - 3}" y="${cy - 4}" width="2" height="8" fill="${frame}" />
    `;
  } else if (t.includes('double-hung') || t.includes('hung')) {
    // Two stacked sashes, horizontal meeting rail mid-height
    const midY = iy + ih / 2;
    interior = `
      <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${glass}" />
      <!-- meeting rail -->
      <rect x="${ix}" y="${midY - 1.2}" width="${iw}" height="2.4" fill="${frame}" />
      <!-- top sash slight inset -->
      <rect x="${ix + 2}" y="${iy + 2}" width="${iw - 4}" height="${(ih / 2) - 3}" fill="none" stroke="${frame}" stroke-width="0.5" opacity="0.4" />
      <!-- bottom sash -->
      <rect x="${ix + 2}" y="${midY + 1}" width="${iw - 4}" height="${(ih / 2) - 3}" fill="none" stroke="${frame}" stroke-width="0.5" opacity="0.4" />
      <!-- sash lock at center of meeting rail -->
      <rect x="${cx - 2}" y="${midY - 0.6}" width="4" height="1.2" fill="${frame}" />
      <!-- vertical motion arrows (faint) -->
      <path d="M ${ix + iw - 4} ${midY + 4} L ${ix + iw - 4} ${midY + 9}" stroke="${frame}" stroke-width="0.7" opacity="0.5" />
      <path d="M ${ix + iw - 5.5} ${midY + 7} L ${ix + iw - 4} ${midY + 9} L ${ix + iw - 2.5} ${midY + 7}" stroke="${frame}" stroke-width="0.7" fill="none" opacity="0.5" />
    `;
  } else if (t.includes('picture')) {
    // Fixed pane — single uninterrupted glass area, no operation marks
    interior = `
      <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${glass}" />
      <!-- subtle highlight diagonal -->
      <path d="M ${ix + 4} ${iy + 4} L ${ix + iw - 4} ${iy + 4} L ${ix + iw - 4} ${iy + ih * 0.35}" stroke="${glassDark}" stroke-width="0.8" fill="none" opacity="0.7" />
      <!-- 'FIXED' tiny tick at top -->
      <rect x="${cx - 4}" y="${iy + 2}" width="8" height="1.2" fill="${frame}" opacity="0.25" />
    `;
  } else if (t.includes('awning')) {
    // Hinged at top, opens outward at bottom
    interior = `
      <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${glass}" />
      <!-- hinge marks at top edge -->
      <circle cx="${ix + 6}" cy="${iy + 1.5}" r="1.2" fill="${frame}" />
      <circle cx="${ix + iw - 6}" cy="${iy + 1.5}" r="1.2" fill="${frame}" />
      <!-- diagonal indicating outward swing from top -->
      <path d="M ${ix + 4} ${iy + 4} L ${ix + iw / 2} ${iy + ih - 4} L ${ix + iw - 4} ${iy + 4}" stroke="${frame}" stroke-width="0.7" fill="none" stroke-dasharray="2 2" opacity="0.55" />
      <!-- handle at bottom -->
      <rect x="${cx - 4}" y="${iy + ih - 3}" width="8" height="2" fill="${frame}" />
    `;
  } else if (t.includes('sliding') || t.includes('slider')) {
    // Two panels split vertically, one slides
    const midX = ix + iw / 2;
    interior = `
      <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${glass}" />
      <!-- meeting stile -->
      <rect x="${midX - 1}" y="${iy}" width="2" height="${ih}" fill="${frame}" />
      <!-- left fixed panel slight inset -->
      <rect x="${ix + 2}" y="${iy + 2}" width="${(iw / 2) - 3}" height="${ih - 4}" fill="none" stroke="${frame}" stroke-width="0.5" opacity="0.4" />
      <!-- right operable panel -->
      <rect x="${midX + 1}" y="${iy + 2}" width="${(iw / 2) - 3}" height="${ih - 4}" fill="none" stroke="${frame}" stroke-width="0.5" opacity="0.6" />
      <!-- slide direction arrow -->
      <path d="M ${midX + 8} ${cy} L ${midX + 16} ${cy}" stroke="${frame}" stroke-width="0.8" opacity="0.6" />
      <path d="M ${midX + 14} ${cy - 1.5} L ${midX + 16} ${cy} L ${midX + 14} ${cy + 1.5}" stroke="${frame}" stroke-width="0.8" fill="none" opacity="0.6" />
      <!-- pull handle on operable panel -->
      <rect x="${midX + 3}" y="${cy - 4}" width="1.6" height="8" fill="${frame}" />
    `;
  } else if (t.includes('tilt-turn') || t.includes('tilt')) {
    // Dual operation — tilt at top, turn from side
    interior = `
      <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${glass}" />
      <!-- side hinge marks (left) -->
      <circle cx="${ix + 1.5}" cy="${iy + 6}" r="1.2" fill="${frame}" />
      <circle cx="${ix + 1.5}" cy="${iy + ih - 6}" r="1.2" fill="${frame}" />
      <!-- tilt indicator (top wedge) -->
      <path d="M ${ix + 4} ${iy + 4} L ${cx} ${iy + 14} L ${ix + iw - 4} ${iy + 4}" stroke="${frame}" stroke-width="0.6" fill="none" stroke-dasharray="2 2" opacity="0.55" />
      <!-- turn indicator -->
      <path d="M ${ix + 4} ${iy + 4} L ${ix + iw - 4} ${iy + ih - 4}" stroke="${frame}" stroke-width="0.6" stroke-dasharray="2 2" opacity="0.55" />
      <!-- handle at right -->
      <rect x="${ix + iw - 3}" y="${cy - 4}" width="2" height="8" fill="${frame}" />
    `;
  } else {
    // Generic / unknown — just show a framed pane
    interior = `
      <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${glass}" />
    `;
  }

  return `
    <svg class="unit-thumb" viewBox="0 0 ${boxW} ${boxH}" xmlns="http://www.w3.org/2000/svg" aria-label="${escapeHtml(type)} window thumbnail">
      <!-- Outer frame (squared per ADR-042) -->
      <rect x="${offsetX}" y="${offsetY}" width="${drawW}" height="${drawH}" fill="${frame}" />
      ${interior}
    </svg>
  `;
}

function renderOrderDetail() {
  const o = getOrder(state.selectedOrderId);
  if (!o) return '<div class="detail-panel"><div class="empty-state">Select an order to see details.</div></div>';
  const d = getDealer(o.dealerId);
  const dateInfo = dateLabel(o.shipBy);

  const milestoneOrder = ['ack', 'drawings', 'production', 'qc', 'shipped'];
  const milestoneLabels = {
    ack: 'Acknowledge PO',
    drawings: 'Release drawings',
    production: 'Begin production',
    qc: 'QC complete',
    shipped: 'Ship to dealer'
  };
  const milestoneEstDates = {
    ack: '—',
    drawings: 'Today',
    production: fmtDate(new Date(new Date(o.submittedAt).getTime() + 3 * 86400000).toISOString()),
    qc: fmtDate(new Date(new Date(o.shipBy).getTime() - 2 * 86400000).toISOString()),
    shipped: fmtDate(o.shipBy)
  };

  // Determine which milestone is "current" (first incomplete)
  let foundCurrent = false;
  const milestonesHtml = milestoneOrder.map((key, i) => {
    const done = o.milestones[key];
    let cls;
    if (done) cls = 'done';
    else if (!foundCurrent) { cls = 'current'; foundCurrent = true; }
    else cls = 'pending';
    return `
      <div class="milestone ${cls}">
        <div class="milestone-icon">${done ? '✓' : (i + 1)}</div>
        <div class="milestone-text">${milestoneLabels[key]}</div>
        <div class="milestone-date">${milestoneEstDates[key]}</div>
      </div>
    `;
  }).join('');

  // Action buttons depend on current status
  let actionsHtml = '';
  if (o.status === 'new') {
    actionsHtml = `
      <button class="btn primary" onclick="acknowledgePO(${o.id})">✓ Acknowledge PO</button>
      <button class="btn ghost" onclick="viewPDF(${o.id})">📄 View PDF</button>
      <button class="btn ghost full" onclick="focusReply()">💬 Reply to dealer</button>
    `;
  } else if (o.status === 'ack') {
    actionsHtml = `
      <button class="btn primary" onclick="releaseDrawings(${o.id})">↗ Release drawings</button>
      <button class="btn ghost" onclick="viewPDF(${o.id})">📄 View PDF</button>
      <button class="btn ghost full" onclick="focusReply()">💬 Reply to dealer</button>
    `;
  } else if (o.status === 'production') {
    actionsHtml = `
      <button class="btn primary" onclick="markQCComplete(${o.id})">✓ Mark QC complete</button>
      <button class="btn ghost" onclick="viewPDF(${o.id})">📄 View PDF</button>
      <button class="btn ghost full" onclick="focusReply()">💬 Reply to dealer</button>
    `;
  } else if (o.status === 'ready') {
    actionsHtml = `
      <button class="btn primary" onclick="markShipped(${o.id})">📦 Mark shipped</button>
      <button class="btn ghost" onclick="viewPDF(${o.id})">📄 View PDF</button>
      <button class="btn ghost full" onclick="focusReply()">💬 Reply to dealer</button>
    `;
  } else if (o.status === 'shipped') {
    actionsHtml = `
      <button class="btn primary" onclick="markDelivered(${o.id})">✓ Mark delivered</button>
      <button class="btn ghost" onclick="viewPDF(${o.id})">📄 View PDF</button>
      <button class="btn ghost full" onclick="focusReply()">💬 Reply to dealer</button>
    `;
  } else {
    actionsHtml = `
      <button class="btn ghost full" onclick="viewPDF(${o.id})">📄 View PDF</button>
      <button class="btn ghost full" onclick="focusReply()">💬 Reply to dealer</button>
    `;
  }

  // Place Hold lives at the top of the order detail bar — no longer in
  // this action stack — so the operator can put a hold on the order from
  // the same place they see the status pill.

  const unitRowsHtml = o.unitBreakdown.map((u, idx) => {
    const det = getUnitGroupDetails(u, idx);
    const thumb = renderUnitThumbnail(u.name, det.profile, det.finish);

    // Component groups for the BOM block
    const groups = [
      { label: 'Frame package',     icon: '▢', items: det.components.framePackage,  notes: `Perimeter ${det.perimFt} lf` },
      { label: 'Exterior trim',     icon: '◧', items: det.components.exteriorTrim,  notes: 'Brick mould · nail fin · J-channel' },
      { label: 'Weatherseals',      icon: '~', items: det.components.seals,         notes: 'Q-Lon · pile weather strip' },
      { label: 'Glazing materials', icon: '◇', items: det.components.glazing,       notes: 'IGU + spacer · tape · sealant' },
      { label: 'Fasteners + shims', icon: '⌗', items: det.components.fasteners,     notes: 'Per-unit install kit' },
      { label: 'Screen',            icon: '▦', items: det.components.screens,       notes: det.components.screens.length === 0 ? 'Not applicable to this type' : 'One per unit' }
    ];

    const renderItem = (it) => `
      <div class="ubom-row">
        <div class="ubom-row-sku">${it.sku}</div>
        <div class="ubom-row-name">${it.name}<div class="ubom-detail">${it.detail}</div></div>
        <div class="ubom-row-qty">${it.qty} <span class="ubom-uom">${it.uom}</span></div>
      </div>
    `;

    const componentsHtml = groups.map(g => `
      <div class="bom-group">
        <div class="bom-group-head">
          <span class="bom-group-icon">${g.icon}</span>
          <span class="bom-group-label">${g.label}</span>
          <span class="bom-group-notes">${g.notes}</span>
        </div>
        ${g.items.length === 0 ? `
          <div class="bom-empty">—</div>
        ` : `
          <div class="ubom-list">
            <div class="ubom-head">
              <div class="ubom-head-sku">SKU</div>
              <div class="ubom-head-name">Item</div>
              <div class="ubom-head-qty">Qty</div>
            </div>
            ${g.items.map(renderItem).join('')}
          </div>
        `}
      </div>
    `).join('');

    return `
      <div class="unit-card">
        <div class="unit-card-thumb-wrap">
          ${thumb}
        </div>
        <div class="unit-card-body">
          <div class="unit-card-head">
            <div class="unit-card-headline">
              <span class="unit-tag">${det.tagRange}</span>
              <span class="unit-name">${u.name}</span>
              <span class="unit-count">× ${u.count}</span>
            </div>
            <div class="unit-card-price">
              <div class="unit-price">${fmtMoneyFull(u.price)}</div>
              <div class="unit-price-each">${fmtMoneyFull(det.unitPrice)} ea</div>
            </div>
          </div>
          <div class="unit-card-specs">
            <div class="unit-spec"><span class="unit-spec-label">Size</span><span class="unit-spec-value">${det.sizeLabel}<span class="unit-spec-alt"> · ${det.sizeImperial}</span></span></div>
            <div class="unit-spec"><span class="unit-spec-label">Config</span><span class="unit-spec-value">${det.profile.config}</span></div>
            <div class="unit-spec"><span class="unit-spec-label">Glass</span><span class="unit-spec-value">${det.glass}</span></div>
            <div class="unit-spec"><span class="unit-spec-label">Finish</span><span class="unit-spec-value">${det.finish}</span></div>
            <div class="unit-spec"><span class="unit-spec-label">Hardware</span><span class="unit-spec-value">${det.hardware}</span></div>
            <div class="unit-spec"><span class="unit-spec-label">Screen</span><span class="unit-spec-value">${det.profile.screen}</span></div>
            <div class="unit-spec"><span class="unit-spec-label">Energy</span><span class="unit-spec-value">U-factor <strong>${det.profile.uFactor.toFixed(2)}</strong> · SHGC <strong>${det.profile.shgc.toFixed(2)}</strong></span></div>
          </div>

          <!-- Bill of Materials — collapsed by default, expands inline.
               This is what the dealer sees on the quote, what the factory
               uses for cut-lists, and what procurement uses to verify
               inventory before releasing the order. -->
          <details class="unit-bom">
            <summary class="unit-bom-summary">
              <span class="unit-bom-summary-label">Bill of materials</span>
              <span class="unit-bom-summary-count">${groups.reduce((a, g) => a + g.items.length, 0)} line items · per unit</span>
              <span class="unit-bom-summary-chevron">▾</span>
            </summary>
            <div class="unit-bom-body">${componentsHtml}</div>
          </details>
        </div>
      </div>
    `;
  }).join('');

  const drawingsHtml = o.drawings.map(dr => `
    <div class="drawing-row">
      <div class="drawing-name">${dr.name}</div>
      <div class="drawing-actions">
        <span class="drawing-status ${dr.status}">${dr.status === 'in-review' ? 'In review' : dr.status === 'approved' ? '✓ Approved' : dr.status === 'pending' ? 'Awaiting release' : 'Revise'}</span>
        <button class="btn ghost sm" onclick="openShopDrawing(${o.id}, '${dr.id}')" title="Open shop drawing">📐 Open</button>
        <button class="btn ghost sm" onclick="downloadShopDrawing(${o.id}, '${dr.id}')" title="Download PDF">↓ PDF</button>
      </div>
    </div>
  `).join('');

  const threadHtml = o.thread.map(m => `
    <div class="thread-msg">
      <div class="thread-avatar ${m.from}">${m.initials}</div>
      <div>
        <div class="thread-meta">
          <span class="thread-name">${m.name}${m.from === 'factory' ? ' · ' + state.factory.name : m.from === 'dealer' ? ' · ' + d.short : ''}</span>
          <span class="thread-time">${m.time}</span>
        </div>
        <div class="thread-body">${m.body}</div>
      </div>
    </div>
  `).join('');

  return `
    <div class="detail-panel">
      <div class="detail-head">
        <div style="flex:1;min-width:0">
          <div class="detail-po">
            ${o.po}
            <span class="status-pill ${o.status}"><span class="dot"></span>${statusLabel(o.status)}</span>
          </div>
          <div class="detail-project">${o.project}</div>
          <div class="detail-meta">
            ${d.name} · ${o.units} units · ship by ${fmtDate(o.shipBy)}
            ${dateInfo.late ? `<span class="late">(${dateInfo.label})</span>` : `(${dateInfo.label})`}
          </div>
        </div>
      </div>

      <div class="detail-actions">
        ${actionsHtml}
      </div>

      ${renderPORefStrip(o)}

      ${renderOrderHoldBanner(o)}

      ${renderOrderContactsPanel(o)}

      <div class="section-label">Units · ${o.units} total</div>
      ${unitRowsHtml}
      <div class="unit-row" style="border-top:0.5px solid var(--gl-border);margin-top:6px;padding-top:13px">
        <div style="font-weight:700;font-size:16px;letter-spacing:-0.018em">PO total</div>
        <div class="unit-price" style="font-size:18px">${fmtMoneyFull(o.value)}</div>
      </div>

      <div class="section-label">Production milestones</div>
      <div class="milestone-list">${milestonesHtml}</div>

      <div class="section-label">Shop drawings</div>
      ${drawingsHtml}

      ${renderOrderRushPanel(o)}
      ${renderOrderWarrantyPanel(o)}
      ${renderOrderBOMPanel(o)}
      ${renderOrderDamageInline(o)}
      ${renderOrderPhotoLog(o)}
      ${renderOrderStateTimeline(o)}
      ${renderOrderShipments(o)}

      <div class="section-label">Dealer thread</div>
      <div class="thread">
        ${threadHtml}
        <div class="thread-input">
          <input type="text" id="replyInput" placeholder="Reply to ${d.short}…" onkeydown="if(event.key==='Enter')sendReply(${o.id})" />
          <button onclick="sendReply(${o.id})">Send</button>
        </div>
      </div>
    </div>
  `;
}

function renderOrderBOMPanel(o) {
  const bom = calculateOrderBOM(o);
  // Determine which machines are involved
  const involvedMachineIds = new Set();
  bom.forEach(line => line.machineIds.forEach(id => involvedMachineIds.add(id)));
  const involved = Array.from(involvedMachineIds).map(id => getMachine(id)).filter(Boolean).filter(m => m.enabled);

  const isInProduction = ['production', 'ready', 'shipped', 'delivered'].includes(o.status);
  const allSynced = isInProduction && involved.every(m => m.status === 'connected');
  const anyError = involved.some(m => m.status === 'error');

  const machineRows = involved.map(m => {
    // For demo: if order is in production, syncs are simulated as completed for healthy machines
    let syncStatus = '○ Pending';
    let syncClass = 'muted';
    if (isInProduction) {
      if (m.status === 'connected') { syncStatus = '✓ Synced'; syncClass = 'success'; }
      else if (m.status === 'error') { syncStatus = '⚠ Failed'; syncClass = 'danger'; }
      else { syncStatus = '○ Skipped'; syncClass = 'muted'; }
    }

    const consumedLines = bom.filter(line => line.machineIds.includes(m.id));

    return `
      <div style="padding:11px 16px;border-bottom:0.5px solid var(--gl-border);background:rgba(248,250,252,0.3)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <div style="width:24px;height:24px;border-radius:0;background:${m.gradient};color:white;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700">${m.icon}</div>
          <div style="flex:1">
            <div style="font-size:12.5px;font-weight:600">${m.name}</div>
            <div style="font-size:11px;color:var(--gl-text-mute)">${m.vendor} · ${m.typeLabel} · ${m.syncMethod === 'rest' ? 'REST' : m.syncMethod === 'file-drop' ? 'File drop' : 'Serial'}</div>
          </div>
          <span style="font-size:11px;font-weight:600;color:${syncClass === 'success' ? 'var(--gl-success)' : syncClass === 'danger' ? 'var(--gl-danger)' : 'var(--gl-text-mute)'}">${syncStatus}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-left:34px">
          ${consumedLines.map(line => `<span class="material-pill ${MATERIAL_CATEGORY[line.material] || ''}" style="font-size:10.5px">${line.label} · <strong>${line.qty} ${line.uom}</strong></span>`).join('')}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="section-label" style="display:flex;align-items:center;gap:10px;justify-content:space-between">
      <span>⚙ Materials & machine sync</span>
      ${isInProduction ? (
        anyError ? '<span style="font-size:10.5px;color:var(--gl-danger);font-weight:600;text-transform:none">⚠ Some machines failed sync</span>' :
        allSynced ? '<span style="font-size:10.5px;color:var(--gl-success);font-weight:600;text-transform:none">✓ All machines synced</span>' :
        '<span style="font-size:10.5px;color:var(--gl-info);font-weight:600;text-transform:none">⏳ Syncing</span>'
      ) : '<span style="font-size:10.5px;color:var(--gl-text-faint);font-weight:600;text-transform:none">Not yet in production</span>'}
    </div>

    <div class="bom-panel">
      ${o.status === 'new' ? `
      <div class="bom-auto-banner">
        <span class="bom-auto-banner-tag">⚡ AUTO-COMPUTED AT PO ARRIVAL</span>
        <span class="bom-auto-banner-text">Live cost + stock pulled from inventory. Materials reserve at acknowledge.</span>
      </div>
      ` : ''}
      <div class="bom-head">
        <div class="bom-title">Bill of materials · ${o.units} unit${o.units === 1 ? '' : 's'}</div>
        <div style="flex:1"></div>
        <button class="btn ghost sm" onclick="toast('BOM exported to CSV (mock)')">↓ Export</button>
        ${isInProduction ? `<button class="btn primary sm" onclick="resyncOrderBOM(${o.id})">🔄 Re-sync all machines</button>` : `<button class="btn primary sm" onclick="dispatchOrderToMachines(${o.id})">📡 Dispatch to machines</button>`}
      </div>

      <div class="bom-row-rich head">
        <div>MATERIAL</div>
        <div style="text-align:right">QTY</div>
        <div style="text-align:right">UNIT $</div>
        <div style="text-align:right">LINE $</div>
        <div style="text-align:right">ON HAND</div>
      </div>

      ${(function(){
        let totalCost = 0;
        const rows = bom.map(line => {
          const enriched = enrichBOMLine(line);
          totalCost += enriched.lineCost;
          const cat = MATERIAL_CATEGORY[line.material] || '';
          const stockClass = `stock-${enriched.stockStatus}`;
          const stockLabel = enriched.onHand == null ? '—'
            : enriched.onHand.toLocaleString() + ' ' + line.uom;
          return `
            <div class="bom-row-rich">
              <div class="bom-material-cell">
                <span class="material-pill ${cat}" style="padding:2px 8px;font-size:9.5px;text-transform:uppercase;letter-spacing:0.05em">${cat || '·'}</span>
                <div>
                  <div class="bom-material-label">${line.label}</div>
                  ${enriched.sku ? `<div style="font-size:10px;color:var(--gl-text-faint);font-variant-numeric:tabular-nums">${enriched.sku}</div>` : ''}
                </div>
              </div>
              <div class="bom-qty">${line.qty} ${line.uom}</div>
              <div class="bom-qty" style="font-size:11.5px;color:var(--gl-text-mute)">$${enriched.unitCost.toFixed(2)}</div>
              <div class="bom-qty" style="font-size:12px;font-weight:600">$${enriched.lineCost.toFixed(2)}</div>
              <div class="bom-stock-cell ${stockClass}">${stockLabel}</div>
            </div>
          `;
        }).join('');
        const totalRow = `
          <div class="bom-row-rich total">
            <div style="font-weight:700;font-size:12.5px;letter-spacing:-0.012em">Materials total</div>
            <div></div>
            <div></div>
            <div class="bom-qty" style="font-size:14px;font-weight:700;color:var(--gl-text)">$${totalCost.toFixed(2)}</div>
            <div></div>
          </div>
        `;
        return rows + totalRow;
      })()}

      ${involved.length > 0 ? `
        <div style="padding:11px 16px;border-top:0.5px solid var(--gl-border-strong);background:rgba(248,250,252,0.5)">
          <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--gl-text-mute);margin-bottom:8px">Machine sync · ${involved.length} machine${involved.length === 1 ? '' : 's'} involved</div>
        </div>
        ${machineRows}
      ` : ''}

      <div style="padding:10px 16px;font-size:11px;color:var(--gl-text-mute);background:rgba(248,250,252,0.3);border-top:0.5px solid var(--gl-border);line-height:1.5">
        BOM auto-calculated from unit dimensions, configured options, and product family rules. Unit costs pulled live from inventory; quantities include 3% scrap allowance. Materials drawn from inventory at production start; reorders triggered automatically when stock drops below safety threshold.
      </div>
    </div>
  `;
}

function dispatchOrderToMachines(orderId) {
  const o = getOrder(orderId);
  if (!o) return;
  const bom = calculateOrderBOM(o);
  const involvedIds = new Set();
  bom.forEach(line => line.machineIds.forEach(id => involvedIds.add(id)));
  const machines = Array.from(involvedIds).map(id => getMachine(id)).filter(m => m && m.enabled);

  let synced = 0, failed = 0;
  machines.forEach(m => {
    if (m.status === 'connected') {
      m.lastSyncAt = new Date().toISOString();
      m.syncCount++;
      synced++;
    } else if (m.status === 'error') {
      m.syncErrors++;
      failed++;
    }
  });

  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'order.dispatched_to_machines',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: o.po, meta: synced + ' machines synced · ' + failed + ' failed · ' + bom.length + ' material lines'
  });

  if (failed > 0) toast('⚠ ' + synced + ' machines synced, ' + failed + ' failed — check Stürtz cleaner');
  else toast('✓ ' + synced + ' machines synced for ' + o.po);
  renderProduction();
}

function resyncOrderBOM(orderId) {
  dispatchOrderToMachines(orderId);
}

function renderOrderRushPanel(o) {
  const rushes = state.rushRequests.filter(r => r.orderId === o.id);
  if (rushes.length === 0) return '';
  return `
    <div class="section-label">Rush requests · ${rushes.length}</div>
    ${rushes.map(r => `
      <div style="padding:10px 12px;border:0.5px solid ${r.status === 'REQUESTED' ? 'rgba(180,83,9,0.30)' : 'var(--gl-border)'};border-radius:var(--gl-radius-input);margin-bottom:8px;background:${r.status === 'REQUESTED' ? 'rgba(180,83,9,0.04)' : 'transparent'}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:12.5px;font-weight:600">P${r.priority} requested</span>
          <span style="font-size:11.5px;color:var(--gl-text-mute);font-weight:500">${r.status}</span>
        </div>
        <div style="font-size:12px;color:var(--gl-text);line-height:1.45">${r.reason}</div>
        ${r.status === 'REQUESTED' ? `
          <div style="display:flex;gap:6px;margin-top:8px">
            <button class="btn sm success" onclick="approveRush(${r.id})">Approve</button>
            <button class="btn sm danger" onclick="declineRush(${r.id})">Decline</button>
          </div>
        ` : ''}
      </div>
    `).join('')}
  `;
}

function renderOrderWarrantyPanel(o) {
  const claims = state.warrantyClaims.filter(c => c.orderId === o.id);
  if (claims.length === 0) return '';
  return `
    <div class="section-label">Warranty claims · ${claims.length}</div>
    ${claims.map(c => `
      <div style="padding:10px 12px;border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-input);margin-bottom:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <span class="warranty-category-pill" style="font-size:10px">${c.category.replace(/_/g, ' ')}</span>
          <span style="font-size:11px;color:var(--gl-text-mute);font-family:var(--gl-mono)">${c.claimNumber}</span>
        </div>
        <div style="font-size:12px;line-height:1.4;margin-top:6px">${c.description}</div>
        <div style="font-size:11px;color:var(--gl-text-mute);margin-top:6px">${c.status.replace(/_/g, ' ')} · ${c.affectedUnits} unit${c.affectedUnits > 1 ? 's' : ''}</div>
      </div>
    `).join('')}
  `;
}

function renderOrderStateTimeline(o) {
  // Synthesize transitions from milestones + a few default events
  const events = [{ state: 'QUOTE_CREATED', at: o.submittedAt, by: getDealer(o.dealerId).short, kind: 'dealer' }];
  events.push({ state: 'CUSTOMER_APPROVED', at: o.submittedAt, by: getDealer(o.dealerId).short, kind: 'dealer' });
  if (o.milestones.ack) events.push({ state: 'ACKNOWLEDGED', at: o.submittedAt, by: 'Marcus Hill', kind: 'factory' });
  if (o.milestones.drawings) events.push({ state: 'DRAWINGS_RELEASED', at: o.submittedAt, by: 'Lin Park', kind: 'factory', reason: 'Drawing pkg v1 sent for review' });
  if (o.milestones.production) events.push({ state: 'IN_PRODUCTION', at: o.submittedAt, by: 'Marcus Hill', kind: 'factory' });
  if (o.milestones.qc) events.push({ state: 'QC_COMPLETE', at: '2026-05-08', by: 'Marcus Hill', kind: 'factory', reason: 'All units passed visual + leak test' });
  if (o.milestones.shipped) events.push({ state: 'SHIPPED', at: o.submittedAt, by: 'Jules Tan', kind: 'factory' });
  if (o.status === 'delivered') events.push({ state: 'DELIVERED', at: o.shipBy, by: 'Jules Tan', kind: 'factory', reason: 'Signed receipt on file' });

  return `
    <div class="section-label">State transitions · ${events.length}</div>
    <div class="state-timeline">
      ${events.map(e => `
        <div class="state-timeline-item">
          <div class="state-trans-head">
            <span>${e.state}</span>
            <span class="state-trans-time">${fmtDate(e.at)}</span>
          </div>
          <div class="state-trans-by">by ${e.by}${e.kind === 'dealer' ? ' (dealer)' : ' (factory)'}</div>
          ${e.reason ? `<div class="state-trans-reason">${e.reason}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderOrderShipments(o) {
  if (!['ready', 'shipped', 'delivered'].includes(o.status)) return '';
  const tracking = 'BL-' + (40000 + o.id).toString();
  return `
    <div class="section-label">Shipment</div>
    <div class="shipment-row">
      <div class="shipment-info">
        <div style="font-weight:500">${o.status === 'ready' ? 'Awaiting pickup scheduling' : `Tracking ${tracking}`}</div>
        <div class="shipment-meta">${o.units} units · ${o.status === 'shipped' ? 'In transit · ETA ' + fmtDate(o.shipBy) : o.status === 'delivered' ? 'Delivered ' + fmtDate(o.shipBy) : 'Crated and ready'}</div>
      </div>
      ${o.status === 'shipped' ? '<button class="btn sm ghost">Track</button>' : ''}
    </div>

    <div class="section-label" style="margin-top:14px">Payment</div>
    <div class="payment-row">
      <div class="payment-info">
        <div style="font-weight:500">${o.status === 'delivered' ? 'PAID_IN_FULL' : 'DEPOSIT_PAID · 50%'}</div>
        <div class="payment-meta">${o.status === 'delivered' ? 'Net 30 · paid in full' : `Balance ${fmtMoneyFull(Math.round(o.value * 0.5))} due at pickup`}</div>
      </div>
      <div style="font-weight:600;font-variant-numeric:tabular-nums">${fmtMoneyFull(o.value)}</div>
    </div>
  `;
}


/* ════════════════════════════════════════════════
   FINANCIALS — Profit & Loss / income statement
   ════════════════════════════════════════════════ */

function getPnL(period) {
  // Source of truth: getTotalStats. We derive COGS components from
  // the factoryCost number, then layer realistic OpEx + tax to get to
  // net income. So gross profit always ties to what shows elsewhere.
  const totals = getTotalStats();
  const grossSales = totals.revenue;
  const returnsCredits = -Math.round(grossSales * 0.014);
  const netRevenue = grossSales + returnsCredits;

  const totalCogs = totals.factoryCost;
  // Break down COGS into typical fenestration components
  const cogs = {
    materialsFrames:   Math.round(totalCogs * 0.28),  // PVC extrusion, vinyl
    materialsGlass:    Math.round(totalCogs * 0.25),  // IGUs, Low-E coating
    materialsHardware: Math.round(totalCogs * 0.10),  // locks, hinges, weatherstrip
    directLabor:       Math.round(totalCogs * 0.24),  // production wages
    factoryOverhead:   Math.round(totalCogs * 0.13)   // utilities, depreciation, indirect labor
  };
  cogs.total = cogs.materialsFrames + cogs.materialsGlass + cogs.materialsHardware + cogs.directLabor + cogs.factoryOverhead;

  const grossProfit = netRevenue - cogs.total;

  const opex = {
    salariesAdmin:   Math.round(grossSales * 0.142),  // sales, ops, exec, finance
    rentUtilities:   Math.round(grossSales * 0.046),
    salesMarketing:  Math.round(grossSales * 0.034),
    insurance:       Math.round(grossSales * 0.017),
    softwareSaas:    Math.round(grossSales * 0.010),  // including OpenSpec subscription
    otherAdmin:      Math.round(grossSales * 0.013)
  };
  opex.total = opex.salariesAdmin + opex.rentUtilities + opex.salesMarketing + opex.insurance + opex.softwareSaas + opex.otherAdmin;

  const operatingIncome = grossProfit - opex.total;
  const interestExpense = Math.round(grossSales * 0.004);
  const preTaxIncome = operatingIncome - interestExpense;
  const taxRate = 0.265;  // ON combined corporate
  const taxProvision = Math.round(Math.max(0, preTaxIncome) * taxRate);
  const netIncome = preTaxIncome - taxProvision;

  return {
    grossSales, returnsCredits, netRevenue,
    cogs, grossProfit,
    opex, operatingIncome,
    interestExpense, preTaxIncome, taxProvision, netIncome
  };
}

function getPriorPnL() {
  // Simulated last-year-YTD comparison: 11.4% lower revenue overall
  const cur = getPnL('ytd');
  const f = 0.886;
  return {
    grossSales: Math.round(cur.grossSales * f),
    returnsCredits: Math.round(cur.returnsCredits * 1.05 * f),
    netRevenue: Math.round(cur.netRevenue * f),
    cogs: {
      materialsFrames:   Math.round(cur.cogs.materialsFrames * 0.91 * f),
      materialsGlass:    Math.round(cur.cogs.materialsGlass * 0.94 * f),
      materialsHardware: Math.round(cur.cogs.materialsHardware * 0.92 * f),
      directLabor:       Math.round(cur.cogs.directLabor * 0.95 * f),
      factoryOverhead:   Math.round(cur.cogs.factoryOverhead * 0.96 * f),
      total:             Math.round(cur.cogs.total * 0.93 * f)
    },
    grossProfit: Math.round(cur.grossProfit * 0.84 * f),  // margin slightly worse last year
    opex: {
      salariesAdmin:   Math.round(cur.opex.salariesAdmin * 0.94 * f),
      rentUtilities:   Math.round(cur.opex.rentUtilities * 0.97 * f),
      salesMarketing:  Math.round(cur.opex.salesMarketing * 0.88 * f),
      insurance:       Math.round(cur.opex.insurance * 0.95 * f),
      softwareSaas:    Math.round(cur.opex.softwareSaas * 0.85 * f),
      otherAdmin:      Math.round(cur.opex.otherAdmin * 0.93 * f),
      total:           Math.round(cur.opex.total * 0.93 * f)
    },
    operatingIncome: Math.round(cur.operatingIncome * 0.71 * f),
    interestExpense: Math.round(cur.interestExpense * 0.95 * f),
    preTaxIncome: Math.round(cur.preTaxIncome * 0.69 * f),
    taxProvision: Math.round(cur.taxProvision * 0.69 * f),
    netIncome: Math.round(cur.netIncome * 0.69 * f)
  };
}

function fmtAccounting(n) {
  // Negative numbers in parentheses, accounting-style
  if (n === 0) return '—';
  if (n < 0) return '(' + Math.abs(n).toLocaleString('en-US') + ')';
  return n.toLocaleString('en-US');
}

function pctOf(n, base) {
  if (!base) return '—';
  return ((n / base) * 100).toFixed(1) + '%';
}

function deltaPct(cur, prior) {
  if (!prior || prior === 0) return { label: '—', cls: '' };
  const d = ((cur - prior) / Math.abs(prior)) * 100;
  const sign = d >= 0 ? '+' : '';
  const cls = d >= 0 ? 'up' : 'down';
  return { label: sign + d.toFixed(1) + '%', cls };
}

function pnlRow(label, cur, prior, base, opts) {
  opts = opts || {};
  const d = deltaPct(cur, prior);
  const numClass = (opts.neg && cur < 0) ? 'pnl-num neg' : 'pnl-num';
  const numText = cur < 0 ? `(${fmtMoneyFull(Math.abs(cur)).replace('$','')})` : fmtMoneyFull(cur);
  const priorText = prior == null ? '' : (prior < 0 ? `(${fmtMoneyFull(Math.abs(prior)).replace('$','')})` : fmtMoneyFull(prior));
  return `
    <div class="pnl-row ${opts.cls || ''}">
      <div class="pnl-label">${label}</div>
      <div class="${numClass}">${numText}</div>
      <div class="pnl-pct">${base ? pctOf(cur, base) : ''}</div>
      <div class="pnl-num muted">${priorText}</div>
      <div class="pnl-delta ${d.cls}">${d.label}</div>
    </div>
  `;
}

function renderFinancials() {
  const tab = state.financialsTab;
  const pnl = getPnL(state.financialsPeriod);
  const prior = getPriorPnL();

  let content = '';

  if (tab === 'pnl') {
    content = `
      <div class="pnl-statement">
        <div class="pnl-row head">
          <div>LINE ITEM</div>
          <div style="text-align:right">YTD 2026</div>
          <div style="text-align:right">% REV</div>
          <div style="text-align:right">YTD 2025</div>
          <div style="text-align:right">YoY</div>
        </div>

        <div class="pnl-row section"><div>Revenue</div><div></div><div></div><div></div><div></div></div>
        ${pnlRow('Gross sales', pnl.grossSales, prior.grossSales, pnl.grossSales, { cls: 'indent' })}
        ${pnlRow('Returns & credits', pnl.returnsCredits, prior.returnsCredits, pnl.grossSales, { cls: 'indent', neg: true })}
        ${pnlRow('Net revenue', pnl.netRevenue, prior.netRevenue, pnl.grossSales, { cls: 'subtotal' })}

        <div class="pnl-row section"><div>Cost of goods sold</div><div></div><div></div><div></div><div></div></div>
        ${pnlRow('Materials — vinyl frames', pnl.cogs.materialsFrames, prior.cogs.materialsFrames, pnl.grossSales, { cls: 'indent' })}
        ${pnlRow('Materials — glass / IGU', pnl.cogs.materialsGlass, prior.cogs.materialsGlass, pnl.grossSales, { cls: 'indent' })}
        ${pnlRow('Materials — hardware', pnl.cogs.materialsHardware, prior.cogs.materialsHardware, pnl.grossSales, { cls: 'indent' })}
        ${pnlRow('Direct labor', pnl.cogs.directLabor, prior.cogs.directLabor, pnl.grossSales, { cls: 'indent' })}
        ${pnlRow('Factory overhead', pnl.cogs.factoryOverhead, prior.cogs.factoryOverhead, pnl.grossSales, { cls: 'indent' })}
        ${pnlRow('Total COGS', pnl.cogs.total, prior.cogs.total, pnl.grossSales, { cls: 'subtotal' })}

        ${pnlRow('Gross profit', pnl.grossProfit, prior.grossProfit, pnl.grossSales, { cls: 'gross-profit' })}

        <div class="pnl-row section"><div>Operating expenses</div><div></div><div></div><div></div><div></div></div>
        ${pnlRow('Salaries — admin & sales', pnl.opex.salariesAdmin, prior.opex.salariesAdmin, pnl.grossSales, { cls: 'indent' })}
        ${pnlRow('Rent & utilities', pnl.opex.rentUtilities, prior.opex.rentUtilities, pnl.grossSales, { cls: 'indent' })}
        ${pnlRow('Sales & marketing', pnl.opex.salesMarketing, prior.opex.salesMarketing, pnl.grossSales, { cls: 'indent' })}
        ${pnlRow('Insurance', pnl.opex.insurance, prior.opex.insurance, pnl.grossSales, { cls: 'indent' })}
        ${pnlRow('Software & SaaS', pnl.opex.softwareSaas, prior.opex.softwareSaas, pnl.grossSales, { cls: 'indent' })}
        ${pnlRow('Other admin', pnl.opex.otherAdmin, prior.opex.otherAdmin, pnl.grossSales, { cls: 'indent' })}
        ${pnlRow('Total operating expenses', pnl.opex.total, prior.opex.total, pnl.grossSales, { cls: 'subtotal' })}

        ${pnlRow('Operating income', pnl.operatingIncome, prior.operatingIncome, pnl.grossSales, { cls: 'operating' })}

        <div class="pnl-row section"><div>Other</div><div></div><div></div><div></div><div></div></div>
        ${pnlRow('Interest expense', -pnl.interestExpense, -prior.interestExpense, pnl.grossSales, { cls: 'indent', neg: true })}
        ${pnlRow('Pre-tax income', pnl.preTaxIncome, prior.preTaxIncome, pnl.grossSales, { cls: 'subtotal' })}
        ${pnlRow('Tax provision (26.5%)', -pnl.taxProvision, -prior.taxProvision, pnl.grossSales, { cls: 'indent', neg: true })}

        ${pnlRow('NET INCOME', pnl.netIncome, prior.netIncome, pnl.grossSales, { cls: 'net-income' })}
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px">
        <div class="profit-card">
          <div class="profit-card-label">Gross margin</div>
          <div class="profit-card-value">${(pnl.grossProfit / pnl.grossSales * 100).toFixed(1)}%</div>
          <div class="profit-card-sub">Industry avg: 38–45%</div>
        </div>
        <div class="profit-card">
          <div class="profit-card-label">Operating margin</div>
          <div class="profit-card-value">${(pnl.operatingIncome / pnl.grossSales * 100).toFixed(1)}%</div>
          <div class="profit-card-sub">Industry avg: 12–18%</div>
        </div>
        <div class="profit-card highlight">
          <div class="profit-card-label">Net margin</div>
          <div class="profit-card-value">${(pnl.netIncome / pnl.grossSales * 100).toFixed(1)}%</div>
          <div class="profit-card-sub">After tax · ${(pnl.netIncome / prior.netIncome).toFixed(2)}× last year</div>
        </div>
        <div class="profit-card">
          <div class="profit-card-label">Effective tax rate</div>
          <div class="profit-card-value">${(pnl.taxProvision / Math.max(1, pnl.preTaxIncome) * 100).toFixed(1)}%</div>
          <div class="profit-card-sub">ON combined corp</div>
        </div>
      </div>
    `;
  } else if (tab === 'revenue') {
    // Revenue breakdown by dealer + by product
    const dealerStats = state.dealers.map(d => ({ d, s: getDealerStats(d.id) })).sort((a, b) => b.s.revenue - a.s.revenue);
    const productStats = state.catalog.products.filter(p => p.ytdUnits > 0).sort((a, b) => b.ytdRevenue - a.ytdRevenue);
    const totalRev = pnl.grossSales;
    const totalProductRev = productStats.reduce((s, p) => s + p.ytdRevenue, 0);

    content = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div class="panel">
          <div class="panel-header"><div class="panel-title">Revenue by dealer · YTD</div></div>
          ${dealerStats.map((x, i) => `
            <div class="fin-bar-row">
              <div class="fin-bar-name">
                <span class="dealer-mini-avatar" style="width:18px;height:18px;border-radius:0;font-size:9px;background:${x.d.gradient};display:inline-flex;margin-right:7px;vertical-align:middle">${x.d.avatar}</span>
                ${x.d.short}
              </div>
              <div class="fin-bar-track"><div class="fin-bar-fill dealer-${i + 1}" style="width:${(x.s.revenue / totalRev * 100).toFixed(1)}%"></div></div>
              <div class="fin-bar-amount">${fmtMoneyFull(x.s.revenue)}</div>
              <div class="fin-bar-pct">${(x.s.revenue / totalRev * 100).toFixed(1)}%</div>
            </div>
          `).join('')}
        </div>

        <div class="panel">
          <div class="panel-header"><div class="panel-title">Revenue by product · YTD</div></div>
          ${productStats.map(p => `
            <div class="fin-bar-row">
              <div class="fin-bar-name">${p.name}</div>
              <div class="fin-bar-track"><div class="fin-bar-fill" style="width:${(p.ytdRevenue / totalProductRev * 100).toFixed(1)}%"></div></div>
              <div class="fin-bar-amount">${fmtMoneyFull(p.ytdRevenue)}</div>
              <div class="fin-bar-pct">${(p.ytdRevenue / totalProductRev * 100).toFixed(1)}%</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="panel" style="margin-top:14px">
        <div class="panel-header"><div class="panel-title">Revenue by month · last 6 months</div></div>
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;align-items:flex-end;height:120px;padding:14px 0">
          ${[
            { m: 'Dec 25', v: 28500 }, { m: 'Jan 26', v: 31200 }, { m: 'Feb 26', v: 34800 },
            { m: 'Mar 26', v: 38400 }, { m: 'Apr 26', v: 42100 }, { m: 'May 26', v: 25400 }
          ].map(({ m, v }) => {
            const max = 45000;
            const h = (v / max) * 100;
            return `
              <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
                <div style="font-size:11px;font-weight:600;font-variant-numeric:tabular-nums">${fmtMoney(v)}</div>
                <div style="width:100%;height:${h}%;background:linear-gradient(180deg, #0F172A 0%, #475569 100%);border-radius:0 0 0"></div>
                <div style="font-size:11px;color:var(--gl-text-mute)">${m}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else if (tab === 'costs') {
    const cogs = pnl.cogs;
    const cogsItems = [
      { k: 'materialsFrames', label: 'Vinyl frames', v: cogs.materialsFrames },
      { k: 'materialsGlass', label: 'Glass / IGU', v: cogs.materialsGlass },
      { k: 'materialsHardware', label: 'Hardware', v: cogs.materialsHardware },
      { k: 'directLabor', label: 'Direct labor', v: cogs.directLabor },
      { k: 'factoryOverhead', label: 'Factory overhead', v: cogs.factoryOverhead }
    ];
    const opex = pnl.opex;
    const opexItems = [
      { label: 'Salaries (admin & sales)', v: opex.salariesAdmin },
      { label: 'Rent & utilities', v: opex.rentUtilities },
      { label: 'Sales & marketing', v: opex.salesMarketing },
      { label: 'Insurance', v: opex.insurance },
      { label: 'Software & SaaS', v: opex.softwareSaas },
      { label: 'Other admin', v: opex.otherAdmin }
    ];

    content = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div class="panel">
          <div class="panel-header"><div class="panel-title">COGS breakdown · ${fmtMoney(cogs.total)}</div></div>
          ${cogsItems.map(c => `
            <div class="fin-bar-row">
              <div class="fin-bar-name">${c.label}</div>
              <div class="fin-bar-track"><div class="fin-bar-fill cost" style="width:${(c.v / cogs.total * 100).toFixed(1)}%"></div></div>
              <div class="fin-bar-amount">${fmtMoneyFull(c.v)}</div>
              <div class="fin-bar-pct">${(c.v / cogs.total * 100).toFixed(1)}%</div>
            </div>
          `).join('')}
        </div>

        <div class="panel">
          <div class="panel-header"><div class="panel-title">Operating expenses · ${fmtMoney(opex.total)}</div></div>
          ${opexItems.map(o => `
            <div class="fin-bar-row">
              <div class="fin-bar-name">${o.label}</div>
              <div class="fin-bar-track"><div class="fin-bar-fill cost" style="width:${(o.v / opex.total * 100).toFixed(1)}%"></div></div>
              <div class="fin-bar-amount">${fmtMoneyFull(o.v)}</div>
              <div class="fin-bar-pct">${(o.v / opex.total * 100).toFixed(1)}%</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="panel" style="margin-top:14px">
        <div class="panel-header"><div class="panel-title">Cost per unit · vs prior year</div></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
          <div>
            <div class="kpi-label">Avg material cost / unit</div>
            <div class="kpi-value">${fmtMoneyFull(Math.round((cogs.materialsFrames + cogs.materialsGlass + cogs.materialsHardware) / pnl.grossSales * (pnl.grossSales / state.dealers.reduce((s,d) => s + getDealerStats(d.id).units, 0))))}</div>
            <div class="kpi-delta down">+4.2% vs 2025</div>
          </div>
          <div>
            <div class="kpi-label">Direct labor / unit</div>
            <div class="kpi-value">${fmtMoneyFull(Math.round(cogs.directLabor / state.dealers.reduce((s,d) => s + getDealerStats(d.id).units, 0)))}</div>
            <div class="kpi-delta down">+2.8% vs 2025</div>
          </div>
          <div>
            <div class="kpi-label">Total COGS / unit</div>
            <div class="kpi-value">${fmtMoneyFull(Math.round(cogs.total / state.dealers.reduce((s,d) => s + getDealerStats(d.id).units, 0)))}</div>
            <div class="kpi-delta down">+3.6% vs 2025</div>
          </div>
        </div>
      </div>
    `;
  } else if (tab === 'ar') {
    // A/R: outstanding balances per order. Use 50/50 deposit/balance assumption.
    // - production / ready / shipped: 50% balance still outstanding
    // - delivered: paid in full
    // Aging: based on days since submitted
    const ar = state.orders
      .filter(o => o.status !== 'delivered' && o.status !== 'new')
      .map(o => {
        const d = getDealer(o.dealerId);
        const balance = Math.round(o.value * 0.5);
        const ageDays = Math.max(0, Math.floor((TODAY - new Date(o.submittedAt)) / 86400000));
        let bucket = 'current';
        if (ageDays > 90) bucket = '90+';
        else if (ageDays > 60) bucket = '60';
        else if (ageDays > 30) bucket = '30';
        return { o, d, balance, ageDays, bucket };
      });

    const buckets = {
      current: ar.filter(x => x.bucket === 'current').reduce((s, x) => s + x.balance, 0),
      '30': ar.filter(x => x.bucket === '30').reduce((s, x) => s + x.balance, 0),
      '60': ar.filter(x => x.bucket === '60').reduce((s, x) => s + x.balance, 0),
      '90+': ar.filter(x => x.bucket === '90+').reduce((s, x) => s + x.balance, 0)
    };
    const totalAr = buckets.current + buckets['30'] + buckets['60'] + buckets['90+'];

    content = `
      <div class="ar-bucket-grid">
        <div class="ar-bucket">
          <div class="ar-bucket-label">Current (≤30d)</div>
          <div class="ar-bucket-value">${fmtMoneyFull(buckets.current)}</div>
          <div class="ar-bucket-sub">${ar.filter(x => x.bucket === 'current').length} invoices</div>
        </div>
        <div class="ar-bucket ${buckets['30'] > 0 ? 'warn' : ''}">
          <div class="ar-bucket-label">31–60 days</div>
          <div class="ar-bucket-value">${fmtMoneyFull(buckets['30'])}</div>
          <div class="ar-bucket-sub">${ar.filter(x => x.bucket === '30').length} invoices</div>
        </div>
        <div class="ar-bucket ${buckets['60'] > 0 ? 'warn' : ''}">
          <div class="ar-bucket-label">61–90 days</div>
          <div class="ar-bucket-value">${fmtMoneyFull(buckets['60'])}</div>
          <div class="ar-bucket-sub">${ar.filter(x => x.bucket === '60').length} invoices</div>
        </div>
        <div class="ar-bucket ${buckets['90+'] > 0 ? 'danger' : ''}">
          <div class="ar-bucket-label">90+ days</div>
          <div class="ar-bucket-value">${fmtMoneyFull(buckets['90+'])}</div>
          <div class="ar-bucket-sub">${ar.filter(x => x.bucket === '90+').length} invoices</div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Open invoices · ${fmtMoneyFull(totalAr)} outstanding</div>
          <button class="panel-action">Send statements</button>
        </div>
        <div style="display:grid;grid-template-columns:130px 1fr 130px 110px 110px 100px;padding:10px 16px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--gl-text-mute);border-bottom:0.5px solid var(--gl-border)">
          <div>PO · DEALER</div><div>PROJECT</div><div>STATUS</div>
          <div style="text-align:right">BALANCE DUE</div>
          <div style="text-align:right">AGE</div>
          <div></div>
        </div>
        ${ar.map(x => `
          <div style="display:grid;grid-template-columns:130px 1fr 130px 110px 110px 100px;padding:13px 16px;border-bottom:0.5px solid var(--gl-border);align-items:center">
            <div><div style="font-size:13px;font-weight:600;font-variant-numeric:tabular-nums">${x.o.po}</div><div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">${x.d.short}</div></div>
            <div><div style="font-size:13px;font-weight:500">${x.o.project}</div><div style="font-size:11.5px;color:var(--gl-text-mute);margin-top:2px">${x.o.units} units · invoice INV-2026-${(x.o.id - 2390 + 100).toString().padStart(4, '0')}</div></div>
            <div><span class="status-pill ${x.o.status}"><span class="dot"></span>${statusLabel(x.o.status)}</span></div>
            <div style="text-align:right;font-size:14px;font-weight:600;font-variant-numeric:tabular-nums">${fmtMoneyFull(x.balance)}</div>
            <div style="text-align:right;font-variant-numeric:tabular-nums;font-size:12.5px;color:${x.bucket === '90+' ? 'var(--gl-danger)' : (x.bucket === '60' || x.bucket === '30') ? 'var(--gl-warn)' : 'var(--gl-text-mute)'};font-weight:500">${x.ageDays}d</div>
            <div style="text-align:right"><button class="btn sm ghost" onclick="toast('Send reminder to ' + '${x.d.short}' + ' (mock)')">Remind</button></div>
          </div>
        `).join('')}
      </div>
    `;
  }

  $('financials-view').innerHTML = `
    ${renderBackButton()}
    <div class="view-header">
      <div>
        <h1 class="view-title">Financials</h1>
        <div class="view-subtitle">P&amp;L, pricing, A/R, and analytics — YTD 2026 vs 2025</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn ghost">↑ Export to QuickBooks</button>
        <button class="btn ghost">📄 Export PDF</button>
      </div>
    </div>

    <div class="pnl-period-bar">
      <div class="pnl-period">
        <button class="pnl-period-btn ${state.financialsPeriod === 'ytd' ? 'active' : ''}" onclick="state.financialsPeriod='ytd'; renderFinancials()">YTD</button>
        <button class="pnl-period-btn ${state.financialsPeriod === 'q' ? 'active' : ''}" onclick="state.financialsPeriod='q'; renderFinancials()">This quarter</button>
        <button class="pnl-period-btn ${state.financialsPeriod === 'mtd' ? 'active' : ''}" onclick="state.financialsPeriod='mtd'; renderFinancials()">This month</button>
        <button class="pnl-period-btn ${state.financialsPeriod === 'last_q' ? 'active' : ''}" onclick="state.financialsPeriod='last_q'; renderFinancials()">Last quarter</button>
      </div>
      <div class="pnl-period-info">Reporting period: <strong>Jan 1 – May 10, 2026</strong> · accrual basis · CAD</div>
    </div>

    <div class="subtabs">
      <button class="subtab ${tab === 'pnl' ? 'active' : ''}" onclick="state.financialsTab='pnl'; renderFinancials()">Overview</button>
      <button class="subtab ${tab === 'pricing' ? 'active' : ''}" onclick="state.financialsTab='pricing'; renderFinancials()">Pricing</button>
      <button class="subtab ${tab === 'ar' ? 'active' : ''}" onclick="state.financialsTab='ar'; renderFinancials()">Receivables</button>
      <button class="subtab ${tab === 'analytics' ? 'active' : ''}" onclick="state.financialsTab='analytics'; renderFinancials()">Analytics</button>
      <button class="subtab ${tab === 'breakdown' ? 'active' : ''}" onclick="state.financialsTab='breakdown'; renderFinancials()">Breakdown</button>
    </div>

    ${content || (tab === 'pricing' ? renderPricingHub() : tab === 'analytics' ? renderAnalyticsHub() : tab === 'breakdown' ? renderBreakdownHub() : '')}
  `;
}

/* ════════════════════════════════════════════════
   MACHINE INTEGRATIONS — API-key sync to factory equipment
   ════════════════════════════════════════════════ */

function getMachine(id) {
  return state.machines.find(m => m.id === id);
}

function maskKey(key) {
  if (!key) return null;
  // Show first 12 chars, mask the rest
  if (key.length <= 16) return key.replace(/./g, '•');
  return key.slice(0, 12) + '••••••••••••••••••' + key.slice(-4);
}

function fmtRelTime(iso) {
  if (!iso) return 'never';
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  if (diff < 0) return 'in the future';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + 'd ago';
  const months = Math.floor(days / 30);
  return months + 'mo ago';
}

const MATERIAL_LABELS = {
  'vinyl-frame': 'Vinyl frame profile',
  'vinyl-sash': 'Vinyl sash profile',
  'mullion': 'Mullion profile',
  'reinforcement': 'Steel reinforcement',
  'glass-igu': 'IGU (glass + spacer + gas)',
  'glass-sheet': 'Float glass sheet',
  'spacer': 'Warm-edge spacer',
  'desiccant': 'Desiccant',
  'hardware-lock': 'Lockset',
  'hardware-hinge': 'Hinges',
  'hardware-operator': 'Crank / operator',
  'hardware-balance': 'Balance',
  'weatherstrip': 'Weatherstripping',
  'screen': 'Insect screen',
  'brickmold': 'Brickmold trim'
};

const MATERIAL_CATEGORY = {
  'vinyl-frame': 'frame', 'vinyl-sash': 'frame', 'mullion': 'frame',
  'reinforcement': 'reinforcement',
  'glass-igu': 'glass', 'glass-sheet': 'glass',
  'spacer': 'spacer', 'desiccant': 'spacer',
  'hardware-lock': 'hardware', 'hardware-hinge': 'hardware',
  'hardware-operator': 'hardware', 'hardware-balance': 'hardware',
  'weatherstrip': 'weatherstrip',
  'screen': 'screen', 'brickmold': 'brickmold'
};

function renderMachineSettings() {
  const machines = state.machines;
  const connected = machines.filter(m => m.status === 'connected').length;
  const errored = machines.filter(m => m.status === 'error').length;
  const disabled = machines.filter(m => m.status === 'disabled').length;
  const totalSyncs = machines.reduce((s, m) => s + m.syncCount, 0);

  const cards = machines.map(m => renderMachineCard(m)).join('');

  return `
    <div class="panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Machine integrations · ${machines.length} configured</div>
          <div style="font-size:12.5px;color:var(--gl-text-mute);margin-top:3px">When orders enter production, OpenSpec auto-explodes the BOM and pushes per-machine specs (cut lists, IGU specs, hardware prep) via these connections.</div>
        </div>
        <button class="btn primary" onclick="addMachine()">+ Add machine</button>
      </div>

      <div class="machine-summary">
        <div class="profit-card highlight">
          <div class="profit-card-label">Connected</div>
          <div class="profit-card-value">${connected}</div>
          <div class="profit-card-sub">syncing live</div>
        </div>
        <div class="profit-card" ${errored > 0 ? 'style="border-color:rgba(185,28,28,0.3)"' : ''}>
          <div class="profit-card-label">Errors</div>
          <div class="profit-card-value" style="color:${errored > 0 ? 'var(--gl-danger)' : 'var(--gl-text-faint)'}">${errored}</div>
          <div class="profit-card-sub">${errored > 0 ? 'requires attention' : 'all healthy'}</div>
        </div>
        <div class="profit-card">
          <div class="profit-card-label">Disabled</div>
          <div class="profit-card-value">${disabled}</div>
          <div class="profit-card-sub">manual operation</div>
        </div>
        <div class="profit-card">
          <div class="profit-card-label">Total syncs YTD</div>
          <div class="profit-card-value">${totalSyncs.toLocaleString()}</div>
          <div class="profit-card-sub">across all machines</div>
        </div>
      </div>

      ${cards}

      <div style="margin-top:18px;padding:14px 18px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute);line-height:1.6">
        <strong style="color:var(--gl-text);font-weight:600">How sync works:</strong> When an order moves to <strong>In production</strong>, the system computes a Bill of Materials (BOM) per unit using product dimensions and configuration. Each machine receives only the materials it consumes — saws get cut lists, IGU lines get glass specs, CNC machines get drawing files. Sync method varies by vendor: <strong>REST</strong> (modern equipment with HTTP APIs), <strong>file-drop</strong> (legacy CNC machines reading from a network share), <strong>serial</strong> (older saws via RS-232/485). View per-order sync status on the order detail page.
      </div>
    </div>
  `;
}

function renderMachineCard(m) {
  const isRevealed = state.revealedKeys[m.id];
  const keyDisplay = m.apiKey ? (isRevealed ? m.apiKey : maskKey(m.apiKey)) : 'No API key (legacy connection)';
  const consumesPills = m.consumes.map(c => `<span class="material-pill ${MATERIAL_CATEGORY[c] || ''}">${MATERIAL_LABELS[c] || c}</span>`).join('');

  return `
    <div class="machine-card ${m.status} ${!m.enabled ? 'disabled' : ''}">
      <div class="machine-head">
        <div class="machine-icon" style="background:${m.gradient}">${m.icon}</div>
        <div>
          <div class="machine-name">${m.name}</div>
          <div class="machine-meta">${m.vendor} · ${m.model} · ${m.location}</div>
        </div>
        <div>
          <span class="machine-status-pill ${m.status}">
            <span class="machine-status-dot"></span>
            ${m.status === 'connected' ? 'Connected' : m.status === 'error' ? 'Error' : m.status === 'disabled' ? 'Disabled' : m.status}
          </span>
        </div>
      </div>

      ${m.status === 'error' && m.lastError ? `
        <div class="machine-error-bar">
          ⚠ ${m.lastError} · last successful sync ${fmtRelTime(m.lastSyncAt)} · <a style="color:inherit;text-decoration:underline;cursor:pointer" onclick="testMachineConnection('${m.id}')">Retry connection</a>
        </div>
      ` : ''}

      <div class="machine-config">
        <div class="machine-config-block">
          <div class="machine-cfg-label">Endpoint · ${m.syncMethod === 'rest' ? '🌐 REST API' : m.syncMethod === 'file-drop' ? '📁 File drop' : m.syncMethod === 'serial' ? '🔌 Serial' : m.syncMethod}</div>
          <div class="machine-cfg-value">${escapeHtml(m.apiEndpoint)}</div>
        </div>
        <div class="machine-config-block">
          <div class="machine-cfg-label">API Key · ${m.apiKey ? '🔐 secured' : 'none required'}</div>
          ${m.apiKey ? `
            <div class="api-key-row">
              <div class="api-key-display">${escapeHtml(keyDisplay)}</div>
              <button class="api-key-btn" onclick="toggleKeyReveal('${m.id}')" title="${isRevealed ? 'Hide' : 'Reveal'}">${isRevealed ? '🙈' : '👁'}</button>
              <button class="api-key-btn" onclick="copyKey('${m.id}')" title="Copy to clipboard">📋</button>
              <button class="api-key-btn" onclick="regenerateKey('${m.id}')" title="Regenerate (will invalidate the current key)">🔄</button>
            </div>
          ` : `<div class="machine-cfg-value muted">Direct serial connection · authenticated by physical access</div>`}
        </div>
      </div>

      <div class="machine-stats">
        <div class="machine-stat">
          <div class="machine-stat-label">Last sync</div>
          <div class="machine-stat-value">${fmtRelTime(m.lastSyncAt)}</div>
        </div>
        <div class="machine-stat">
          <div class="machine-stat-label">Sync count</div>
          <div class="machine-stat-value">${m.syncCount.toLocaleString()}</div>
        </div>
        <div class="machine-stat">
          <div class="machine-stat-label">Errors</div>
          <div class="machine-stat-value" style="color:${m.syncErrors > 0 ? 'var(--gl-danger)' : 'var(--gl-text)'}">${m.syncErrors}</div>
        </div>
        <div class="machine-stat">
          <div class="machine-stat-label">Type</div>
          <div class="machine-stat-value" style="font-size:12.5px">${m.typeLabel}</div>
        </div>
      </div>

      ${m.consumes.length > 0 ? `
        <div class="machine-consumes">
          <span style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--gl-text-mute);margin-right:6px;display:flex;align-items:center">CONSUMES</span>
          ${consumesPills}
        </div>
      ` : ''}

      <div class="machine-actions">
        <button class="btn ghost sm" onclick="testMachineConnection('${m.id}')">⚡ Test connection</button>
        <button class="btn ghost sm" onclick="toast('Edit ' + '${m.name}' + ' — full config (mock)')">⚙ Edit config</button>
        <button class="btn ghost sm" onclick="viewMachineSyncLog('${m.id}')">📜 Sync log</button>
        <div style="flex:1"></div>
        <button class="btn ghost sm" onclick="${m.enabled ? 'disableMachine' : 'enableMachine'}('${m.id}')" style="color:${m.enabled ? 'var(--gl-danger)' : 'var(--gl-success)'}">${m.enabled ? '⏸ Disable' : '▶ Enable'}</button>
      </div>
    </div>
  `;
}

/* === Machine actions === */

function toggleKeyReveal(id) {
  state.revealedKeys[id] = !state.revealedKeys[id];
  renderSettings();
}

function copyKey(id) {
  const m = getMachine(id);
  if (!m || !m.apiKey) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(m.apiKey).then(
      () => toast('API key for ' + m.name + ' copied to clipboard'),
      () => toast('Could not copy — clipboard access denied')
    );
  } else {
    // Fallback: select-and-copy via temp input
    const ta = document.createElement('textarea');
    ta.value = m.apiKey;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('API key copied'); } catch (e) { toast('Copy not supported'); }
    document.body.removeChild(ta);
  }
}

function regenerateKey(id) {
  const m = getMachine(id);
  if (!m) return;
  if (!confirm('Regenerate API key for ' + m.name + '?\n\nThe current key will stop working immediately. You\'ll need to update the machine\'s configuration with the new key.')) return;
  // Generate new key with same prefix pattern
  const prefix = m.apiKey ? m.apiKey.split('_').slice(0, 2).join('_') + '_' : 'key_live_';
  const random = Array(32).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  m.apiKey = prefix + random;
  state.revealedKeys[id] = true;  // reveal the new key so user can copy it
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'machine.key_rotated',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: m.name, meta: 'API key regenerated · old key invalidated'
  });
  toast('New API key generated for ' + m.name + ' — copy it now');
  renderSettings();
}

function testMachineConnection(id) {
  const m = getMachine(id);
  if (!m) return;
  toast('Testing connection to ' + m.name + '...');
  // Simulate async test
  setTimeout(() => {
    if (m.status === 'error') {
      // 50% chance recovery succeeds in mock
      if (Math.random() > 0.5) {
        m.status = 'connected';
        m.lastSyncAt = new Date().toISOString();
        delete m.lastError;
        m.syncErrors = Math.max(0, m.syncErrors - 1);
        toast('✓ ' + m.name + ' is back online');
        state.auditEvents.unshift({
          id: state.auditEvents.length + 1, kind: 'machine.connection_restored',
          actor: state.user.name, initials: state.user.initials,
          tenantId: 'northforge', scope: 'own', at: 'just now',
          target: m.name, meta: 'Test connection succeeded'
        });
      } else {
        toast('✗ Still cannot reach ' + m.name + ' — check network / power');
      }
    } else if (m.status === 'connected') {
      m.lastSyncAt = new Date().toISOString();
      toast('✓ ' + m.name + ' responded in 124ms');
    }
    renderSettings();
  }, 600);
}

function disableMachine(id) {
  const m = getMachine(id);
  if (!m) return;
  if (!confirm('Disable ' + m.name + '?\n\nOrders entering production will skip this machine until it\'s re-enabled. Existing in-flight syncs will complete.')) return;
  m.enabled = false;
  m.status = 'disabled';
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'machine.disabled',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: m.name, meta: 'Machine taken offline by operator'
  });
  toast(m.name + ' disabled');
  renderSettings();
}

function enableMachine(id) {
  const m = getMachine(id);
  if (!m) return;
  m.enabled = true;
  m.status = 'connected';
  m.lastSyncAt = new Date().toISOString();
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'machine.enabled',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: m.name, meta: 'Machine brought back online'
  });
  toast(m.name + ' enabled');
  renderSettings();
}

function viewMachineSyncLog(id) {
  const m = getMachine(id);
  if (!m) return;
  toast('Opening sync log for ' + m.name + ' (mock — would show last 100 syncs)');
}

function addMachine() {
  // Quick-add: prompt for vendor + type, generate stub config
  const types = [
    { id: 'vinyl-welder', label: 'PVC welder (Rotox, Stürtz, Urban, Graf)' },
    { id: 'cleaner', label: 'Corner cleaner (Stürtz, Urban)' },
    { id: 'saw', label: 'Profile saw (Pertici, Emmegi, FOM, Elumatec)' },
    { id: 'cnc-machining', label: 'CNC machining center (Elumatec, Haffner)' },
    { id: 'router', label: 'Hardware router' },
    { id: 'igu-line', label: 'IGU assembly line (Cardinal, Lisec, Schirmer)' },
    { id: 'glass-cutter', label: 'Glass cutter (HegLa, Bystronic)' }
  ];
  const choice = prompt('Quick-add machine.\n\nMachine type:\n' + types.map((t, i) => (i + 1) + '. ' + t.label).join('\n') + '\n\nEnter number (1-' + types.length + ') or vendor name:');
  if (!choice) return;
  const idx = parseInt(choice, 10) - 1;
  const selectedType = types[idx] || types[0];

  const name = prompt('Machine name (e.g. "Rotox Welder #2"):');
  if (!name) return;

  const newMachine = {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30),
    name: name.trim(),
    vendor: 'New', model: '—',
    type: selectedType.id, typeLabel: selectedType.label.split(' (')[0],
    location: 'Floor', icon: name.slice(0, 3).toUpperCase(),
    gradient: 'linear-gradient(135deg, #475569 0%, #94A3B8 100%)',
    apiEndpoint: 'http://10.0.1.X:8080/api',
    apiKey: 'new_live_' + Array(32).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
    syncMethod: 'rest',
    status: 'connecting', lastSyncAt: null, syncCount: 0, syncErrors: 0,
    capabilities: [], consumes: [], enabled: true
  };
  state.machines.push(newMachine);
  state.revealedKeys[newMachine.id] = true;
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'machine.added',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: newMachine.name, meta: selectedType.label
  });
  toast(newMachine.name + ' added — finish setup by editing endpoint and testing');
  renderSettings();
}

/* === Order BOM calculator === */

function calculateOrderBOM(order) {
  // Realistic per-unit material breakdown for the order
  // Approximations based on typical 900x1200 casement window
  const unitCount = order.units;
  const avgArea = 1.0;  // m²

  return [
    { material: 'vinyl-frame', label: 'Vinyl frame profile', qty: Math.round(unitCount * 4.2 * 10) / 10, uom: 'm', machineIds: ['pertici-saw-1', 'rotox-welder-1', 'elumatec-sbz628'] },
    { material: 'vinyl-sash', label: 'Vinyl sash profile', qty: Math.round(unitCount * 3.8 * 10) / 10, uom: 'm', machineIds: ['pertici-saw-1', 'rotox-welder-1'] },
    { material: 'reinforcement', label: 'Steel U-channel reinforcement', qty: Math.round(unitCount * 1.4 * 10) / 10, uom: 'm', machineIds: ['pertici-saw-1', 'elumatec-sbz628'] },
    { material: 'glass-igu', label: 'IGU (Low-E 272 Argon)', qty: Math.round(unitCount * avgArea * 10) / 10, uom: 'm²', machineIds: ['cardinal-igu-line'] },
    { material: 'spacer', label: 'Warm-edge spacer', qty: Math.round(unitCount * 4.4 * 10) / 10, uom: 'm', machineIds: ['cardinal-igu-line'] },
    { material: 'desiccant', label: 'Desiccant', qty: Math.round(unitCount * 0.05 * 100) / 100, uom: 'kg', machineIds: ['cardinal-igu-line'] },
    { material: 'hardware-lock', label: 'Single cam lock kit', qty: unitCount, uom: 'ea', machineIds: ['elumatec-sbz628'] },
    { material: 'hardware-hinge', label: '4-bar egress hinge pair', qty: unitCount, uom: 'pr', machineIds: ['elumatec-sbz628'] },
    { material: 'hardware-operator', label: 'Folding crank operator', qty: unitCount, uom: 'ea', machineIds: ['elumatec-sbz628'] },
    { material: 'weatherstrip', label: 'Q-Lon foam bulb 7mm', qty: Math.round(unitCount * 4.4 * 10) / 10, uom: 'm', machineIds: [] }
  ];
}

/* Map each BOM material code to the representative inventory SKU used in
   the factory's stock. Drives live cost + stock numbers on every order. */
const BOM_INV_MAP = {
  'vinyl-frame':       'VEKA-7000-FRM-WHT',
  'vinyl-sash':        'VEKA-7000-SSH-WHT',
  'reinforcement':     'STL-U-CHAN-32X25-GAL',
  'glass-igu':         'CARD-IGU-DH-LE272-AR',
  'spacer':            'EDGE-SS-WTH-9.5MM',
  'desiccant':         'EDGE-DESIC-PKT',
  'hardware-lock':     'AT-CAM-LOCK-SN',
  'hardware-hinge':    'AT-4BAR-EGRESS-WHT',
  'hardware-operator': 'AT-CRANK-FOLD-SN',
  'weatherstrip':      'QL-FOAM-7MM-BLK'
};

function inventoryForBOMMaterial(materialCode) {
  const sku = BOM_INV_MAP[materialCode];
  if (!sku) return null;
  return (state.inventory || []).find(i => i.sku === sku);
}

function enrichBOMLine(line) {
  const inv = inventoryForBOMMaterial(line.material);
  const unitCost = inv ? inv.unitCost : 0;
  const lineCost = +(line.qty * unitCost).toFixed(2);
  const onHand = inv ? inv.onHand : null;
  const reorderPoint = inv ? inv.reorderPoint : null;
  // Stock status — how much headroom after fulfilling this order
  let stockStatus = 'unknown';
  if (onHand != null) {
    const remaining = onHand - line.qty;
    if (remaining < 0) stockStatus = 'out';                                  // can't fulfill
    else if (remaining < (reorderPoint || 0) * 0.5) stockStatus = 'short';   // dangerously low after
    else if (remaining < (reorderPoint || 0)) stockStatus = 'low';           // below reorder point after
    else stockStatus = 'good';                                                // healthy
  }
  return { ...line, unitCost, lineCost, onHand, reorderPoint, stockStatus, sku: inv && inv.sku };
}

function calculateOrderBOMEnriched(order) {
  return calculateOrderBOM(order).map(enrichBOMLine);
}

function calculateOrderMaterialCost(order) {
  return calculateOrderBOMEnriched(order).reduce((sum, l) => sum + l.lineCost, 0);
}

/* Stock readiness summary — used at acknowledge time to surface whether
   the order can be filled from on-hand inventory or needs reorder. */
function computeStockReadiness(order) {
  const lines = calculateOrderBOMEnriched(order);
  const out = lines.filter(l => l.stockStatus === 'out');
  const short = lines.filter(l => l.stockStatus === 'short');
  const low = lines.filter(l => l.stockStatus === 'low');
  return {
    lines,
    out,
    short,
    low,
    fulfillable: out.length === 0,
    needsReorder: out.length > 0 || short.length > 0
  };
}

function renderDealers() {
  const totals = getTotalStats();

  const cards = state.dealers.map(d => {
    const stats = getDealerStats(d.id);
    const tier = getDealerTier(d);
    const effM = effectiveMultiplier(d);
    const tierDefaultM = tier.multiplier;
    const hasOverride = d.customMultiplier != null && d.customMultiplier !== tierDefaultM;
    const discountFromMSRPPct = Math.round((1 - effM) * 100);

    return `
      <div class="dealer-profit-card">
        <div class="dpc-head">
          <div class="dpc-identity">
            <div class="dpc-avatar" style="background:${d.gradient}">${d.avatar}</div>
            <div>
              <div class="dpc-name">
                ${d.name}
                ${hasOverride ? '<span class="dpc-override-badge">Custom rate</span>' : ''}
              </div>
              <div class="dpc-region">${d.region}</div>
              <div class="dpc-since">Dealer since ${fmtDate(d.joinedAt)} · ${stats.activeOrders} active POs</div>
            </div>
          </div>

          <div class="dpc-discount">
            <div class="dpc-discount-row">
              <div class="dpc-discount-label">Tier</div>
              <select onchange="updateDealerTier('${d.id}', parseInt(this.value, 10))">
                ${state.pricing.dealerTiers.map(t => `<option value="${t.id}" ${t.id === d.tierId ? 'selected' : ''}>${t.name} · ${(t.multiplier*100).toFixed(0)}%</option>`).join('')}
              </select>
            </div>
            <div class="dpc-discount-row">
              <div class="dpc-discount-label">Override</div>
              <input type="number" step="0.01" min="0.20" max="0.95" value="${d.customMultiplier != null ? d.customMultiplier.toFixed(2) : ''}" placeholder="${tierDefaultM.toFixed(2)}" id="cm-${d.id}" />
              <button class="btn sm primary" onclick="updateDealerMultiplier('${d.id}')">Save</button>
              ${d.customMultiplier != null ? `<button class="btn sm ghost" onclick="clearDealerMultiplier('${d.id}')" title="Reset to tier default">Reset</button>` : ''}
            </div>
            <div class="dpc-effective">
              Effective rate: <strong>${(effM * 100).toFixed(1)}%</strong> of MSRP &nbsp;·&nbsp; ${discountFromMSRPPct}% off
              ${hasOverride ? ` &nbsp;·&nbsp; <span style="color:var(--gl-purple)">${(tierDefaultM * 100).toFixed(0)}% tier default</span>` : ''}
            </div>
          </div>
        </div>

        <div class="dpc-stats">
          <div class="dpc-stat">
            <div class="dpc-stat-label">YTD orders</div>
            <div class="dpc-stat-value">${stats.orders}</div>
          </div>
          <div class="dpc-stat">
            <div class="dpc-stat-label">YTD units</div>
            <div class="dpc-stat-value">${stats.units}</div>
          </div>
          <div class="dpc-stat">
            <div class="dpc-stat-label">YTD revenue</div>
            <div class="dpc-stat-value">${fmtMoney(stats.revenue)}</div>
          </div>
          <div class="dpc-stat cost">
            <div class="dpc-stat-label">YTD factory cost</div>
            <div class="dpc-stat-value">${fmtMoney(stats.factoryCost)}</div>
          </div>
          <div class="dpc-stat profit">
            <div class="dpc-stat-label">YTD profit</div>
            <div class="dpc-stat-value">${fmtMoney(stats.profit)}</div>
          </div>
          <div class="dpc-stat">
            <div class="dpc-stat-label">Margin</div>
            <div class="dpc-stat-value">${(stats.marginPct * 100).toFixed(1)}%</div>
          </div>
        </div>

        <div class="dpc-actions">
          <button class="btn ghost sm" onclick="filterOrdersByDealer('${d.id}')">View ${stats.orders} orders →</button>
          <button class="btn ghost sm" onclick="toast('Send message to ' + '${d.short}' + ' (mock)')">💬 Send message</button>
          <button class="btn ghost sm" onclick="toast('Edit dealer account (mock)')">⚙ Edit account</button>
          <div style="flex:1"></div>
          <span style="font-size:11.5px;color:var(--gl-success);font-weight:500;align-self:center">● Payment standing: current</span>
        </div>
      </div>
    `;
  }).join('');

  $('dealers-view').innerHTML = `
    ${renderBackButton()}
    <div class="view-header">
      <div>
        <h1 class="view-title">Dealers</h1>
        <div class="view-subtitle">${state.dealers.length} dealers · ${state.resellers.length} resellers · ${totals.units} units YTD</div>
      </div>
      <button class="btn primary" onclick="inviteDealer()">+ Invite dealer</button>
    </div>

    <div class="subtabs">
      <button class="subtab ${(state.peopleTab || 'dealers') === 'dealers' ? 'active' : ''}" onclick="state.peopleTab='dealers'; renderDealers()">Dealers<span class="subtab-badge">${state.dealers.length}</span></button>
      <button class="subtab ${state.peopleTab === 'compliance' ? 'active' : ''}" onclick="state.peopleTab='compliance'; renderDealers()">Compliance</button>
      <button class="subtab ${state.peopleTab === 'resellers' ? 'active' : ''}" onclick="state.peopleTab='resellers'; renderDealers()">Resellers<span class="subtab-badge">${state.resellers.length}</span></button>
    </div>

    ${(state.peopleTab || 'dealers') === 'dealers' ? `
      <div class="profit-summary">
        <div class="profit-card">
          <div class="profit-card-label">YTD Revenue</div>
          <div class="profit-card-value">${fmtMoney(totals.revenue)}</div>
          <div class="profit-card-sub">${totals.units} units across ${state.dealers.length} dealers</div>
        </div>
        <div class="profit-card highlight">
          <div class="profit-card-label">YTD Gross Profit</div>
          <div class="profit-card-value">${fmtMoney(totals.profit)}</div>
          <div class="profit-card-sub">${(totals.marginPct*100).toFixed(1)}% blended margin</div>
        </div>
        <div class="profit-card">
          <div class="profit-card-label">Avg Order Value</div>
          <div class="profit-card-value">${fmtMoney(Math.round(totals.revenue / state.orders.length))}</div>
          <div class="profit-card-sub">${state.orders.length} orders YTD</div>
        </div>
      </div>

      ${renderPendingInvitesPanel()}

      <div>${cards}</div>
    ` : state.peopleTab === 'compliance' ? `
      ${renderCompliancePanel()}
    ` : state.peopleTab === 'resellers' ? `
      ${renderResellersTab()}
    ` : ''}
  `;
}

function renderCompliancePanel() {
  return `
    <div style="display:flex;gap:10px;margin-bottom:16px;padding:10px 14px;background:rgba(248,250,252,0.5);border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-text-mute)">
      <span>Jump to:</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('p-coi').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">Certificates of Insurance (${state.coiRecords.length})</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('p-agreements').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">Dealer agreements (${state.dealerAgreements.length})</a>
      <span style="color:var(--gl-text-faint)">·</span>
      <a href="#" onclick="event.preventDefault();document.getElementById('p-certs').scrollIntoView({behavior:'smooth'})" style="color:var(--gl-info);text-decoration:none;font-weight:500">Installer certifications (${state.installerCerts.length})</a>
    </div>

    <h2 id="p-coi" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:18px 0 12px">Certificates of Insurance</h2>
    ${renderCOIPanel()}

    <h2 id="p-agreements" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Dealer agreements</h2>
    ${renderDealerAgreementsPanel()}

    <h2 id="p-certs" style="font-size:18px;font-weight:600;letter-spacing:-0.018em;margin:28px 0 12px">Installer certifications</h2>
    ${renderInstallerCerts()}
  `;
}

function filterOrdersByDealer(dealerId) {
  // Quick filter: switch to production/orders and select first order from this dealer
  const o = state.orders.find(x => x.dealerId === dealerId);
  if (o) state.selectedOrderId = o.id;
  switchView('production');
  setProductionTab('orders');
}

function updateDealerTier(dealerId, tierId) {
  const d = getDealer(dealerId);
  if (!d) return;
  const oldTier = getDealerTier(d);
  d.tierId = tierId;
  const newTier = getDealerTier(d);
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'dealer.tier_changed',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: d.name, meta: `${oldTier.code} → ${newTier.code}`
  });
  toast(d.short + ' moved to ' + newTier.name);
  renderDealers();
}

function updateDealerMultiplier(dealerId) {
  const d = getDealer(dealerId);
  if (!d) return;
  const input = document.getElementById('cm-' + dealerId);
  if (!input) return;
  const raw = input.value.trim();
  if (raw === '') { clearDealerMultiplier(dealerId); return; }
  const v = parseFloat(raw);
  if (isNaN(v) || v < 0.20 || v > 0.95) { toast('Multiplier must be 0.20–0.95'); return; }
  const old = d.customMultiplier;
  d.customMultiplier = v;
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'dealer.multiplier_set',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: d.name, meta: `Custom multiplier: ${old != null ? old.toFixed(2) : 'tier default'} → ${v.toFixed(2)}`
  });
  toast(d.short + ': custom rate set to ' + (v * 100).toFixed(1) + '%');
  renderDealers();
}

function clearDealerMultiplier(dealerId) {
  const d = getDealer(dealerId);
  if (!d) return;
  const old = d.customMultiplier;
  d.customMultiplier = null;
  const tier = getDealerTier(d);
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'dealer.multiplier_cleared',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: d.name, meta: `Custom rate cleared · back to ${tier.code} default`
  });
  toast(d.short + ': reset to ' + tier.name + ' default');
  renderDealers();
}

function renderSettings() {
  const tab = state.settingsTab;
  const factory = state.factory;

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'team', label: 'Team & roles' },
    { id: 'machines', label: 'Machine integrations' },
    { id: 'integrations', label: 'Other integrations' },
    { id: 'billing', label: 'Billing' },
    { id: 'audit', label: 'Audit log' }
  ];

  const navHtml = tabs.map(t => `
    <button class="settings-nav-item ${tab === t.id ? 'active' : ''}" onclick="state.settingsTab='${t.id}'; renderSettings()">${t.label}</button>
  `).join('');

  let contentHtml = '';

  if (tab === 'profile') {
    contentHtml = `
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Factory profile</div>
          <button class="btn sm primary" onclick="saveSettings('Profile')">Save changes</button>
        </div>

        <div class="form-row">
          <div>
            <div class="form-label">Factory name</div>
            <div class="form-help">Shown to dealers on POs and invoices.</div>
          </div>
          <input class="form-input" value="${factory.full}" />
        </div>

        <div class="form-row">
          <div>
            <div class="form-label">Region</div>
            <div class="form-help">Used for tax + shipping rate defaults.</div>
          </div>
          <select class="form-select">
            <option>Ontario · Canada</option>
            <option>British Columbia · Canada</option>
            <option>Quebec · Canada</option>
            <option>Alberta · Canada</option>
          </select>
        </div>

        <div class="form-row">
          <div><div class="form-label">Address</div></div>
          <input class="form-input" value="${factory.address}" />
        </div>

        <div class="form-row">
          <div><div class="form-label">Phone</div></div>
          <input class="form-input" value="${factory.phone}" />
        </div>

        <div class="form-row">
          <div>
            <div class="form-label">Email</div>
            <div class="form-help">Receives PO notifications and dealer messages.</div>
          </div>
          <input class="form-input" value="${factory.email}" />
        </div>
      </div>
    `;
  } else if (tab === 'production') {
    contentHtml = `
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Production settings</div>
          <button class="btn sm primary" onclick="saveSettings('Production')">Save changes</button>
        </div>

        <div class="form-row">
          <div>
            <div class="form-label">Base lead time</div>
            <div class="form-help">Default weeks from PO ack to ship.</div>
          </div>
          <select class="form-select">
            <option>4 weeks</option>
            <option>5 weeks</option>
            <option selected>6 weeks</option>
            <option>7 weeks</option>
            <option>8 weeks</option>
          </select>
        </div>

        <div class="form-row">
          <div>
            <div class="form-label">Weekly capacity</div>
            <div class="form-help">Max units per production week.</div>
          </div>
          <input class="form-input" type="number" value="95" />
        </div>

        <div class="form-row">
          <div>
            <div class="form-label">Product families</div>
            <div class="form-help">Window types you manufacture.</div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;max-width:380px">
            ${factory.productFamilies.map(p => `
              <div style="padding:5px 11px;background:rgba(15,23,42,0.06);border-radius:0;font-size:12.5px;font-weight:500;display:inline-flex;align-items:center;gap:6px">
                ${p}
                <span style="cursor:pointer;color:var(--gl-text-faint);font-size:14px">×</span>
              </div>
            `).join('')}
            <button class="btn sm ghost">+ Add</button>
          </div>
        </div>

        <div class="form-row">
          <div>
            <div class="form-label">Quality control</div>
            <div class="form-help">Require explicit QC sign-off before ship.</div>
          </div>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" checked />
            <span style="font-size:13px;color:var(--gl-text-mute)">Require QC sign-off</span>
          </label>
        </div>
      </div>
    `;
  } else if (tab === 'team') {
    const ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'ESTIMATOR', 'VIEWER'];
    contentHtml = `
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Team & roles · ${state.users.length} members</div>
          <button class="btn sm primary" onclick="inviteUser()">+ Invite member</button>
        </div>
        <div style="font-size:12.5px;color:var(--gl-text-mute);margin-bottom:14px;line-height:1.5">
          Six roles available. OWNER has billing + transfer ownership. ADMIN has all permissions except billing. MANAGER handles production scheduling. ESTIMATOR creates quotes + orders. VIEWER is read-only.
        </div>
        ${state.users.map(u => `
          <div class="team-row">
            <div class="team-avatar">${u.initials}</div>
            <div class="team-info">
              <div class="team-name">${u.name}</div>
              <div class="team-email">${u.email} · last active ${u.lastActive}</div>
            </div>
            <select class="form-select" style="max-width:140px;padding:6px 9px;font-size:12px" onchange="changeRole(${u.id}, this.value)" ${u.role === 'OWNER' ? 'disabled' : ''}>
              ${ROLES.map(r => `<option ${u.role === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
            ${u.role !== 'OWNER' ? `<button class="btn sm danger" onclick="removeUser(${u.id})">Remove</button>` : '<span style="font-size:11px;color:var(--gl-text-faint);padding:0 8px">protected</span>'}
          </div>
        `).join('')}
      </div>
    `;
  } else if (tab === 'branding') {
    contentHtml = `
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Factory branding</div>
          <button class="btn sm primary" onclick="saveSettings('Branding')">Save changes</button>
        </div>
        <div style="font-size:12.5px;color:var(--gl-text-mute);margin-bottom:14px;line-height:1.5">
          Factory branding applies to your admin chrome, catalog update emails to dealers, and factory-spec PDFs. Customer-facing surfaces use dealer branding (you don't override the dealer).
        </div>

        <div class="form-row">
          <div>
            <div class="form-label">Factory logo</div>
            <div class="form-help">PNG or SVG, max 2MB. Shown in admin chrome and spec PDFs.</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:64px;height:64px;border-radius:0;background:linear-gradient(135deg, #1E3A8A 0%, #24479e 100%);color:white;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700">NF</div>
            <button class="btn ghost sm">Upload new</button>
          </div>
        </div>

        <div class="form-row">
          <div>
            <div class="form-label">Primary color</div>
            <div class="form-help">Used for section accents on factory-internal surfaces.</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:0;background:#24479e;border:0.5px solid var(--gl-border)"></div>
            <input class="form-input" value="#24479e" style="max-width:140px" />
          </div>
        </div>

        <div class="form-row">
          <div>
            <div class="form-label">Email sender name</div>
            <div class="form-help">"From: Northforge" instead of "OpenSpec".</div>
          </div>
          <input class="form-input" value="Northforge Manufacturing" />
        </div>

        <div class="form-row">
          <div>
            <div class="form-label">Spec PDF disclaimer</div>
            <div class="form-help">Footer text on factory-spec PDFs.</div>
          </div>
          <input class="form-input" value="© Northforge Manufacturing Co. · Pricing valid 30 days from issue." />
        </div>
      </div>
    `;
  } else if (tab === 'erp') {
    const erp = state.integrations.erp;
    contentHtml = `
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">ERP integration</div>
          ${erp.configured ? '<button class="btn sm ghost">Disconnect</button>' : '<button class="btn sm primary" onclick="toast(\'ERP setup wizard (mock)\')">Connect ERP</button>'}
        </div>
        <div style="font-size:12.5px;color:var(--gl-text-mute);margin-bottom:14px;line-height:1.5">
          Connect your shop ERP (Soft Tech, Paradigm Omni, FeneVision) to advance production stages automatically via webhook. Manual UI advancement remains as fallback.
        </div>

        ${!erp.configured ? `
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
            ${['Soft Tech V8', 'Paradigm Omni', 'FeneVision', 'Manual / custom (REST)'].map(name => `
              <div style="padding:18px;border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card);background:rgba(255,255,255,0.5);cursor:pointer" onclick="toast('${name} setup wizard (mock)')">
                <div style="font-size:14px;font-weight:600;letter-spacing:-0.015em">${name}</div>
                <div style="font-size:12px;color:var(--gl-text-mute);margin-top:4px">${name === 'Soft Tech V8' ? 'File-drop integration · nightly status' : name === 'Paradigm Omni' ? 'REST API · real-time webhooks' : name === 'FeneVision' ? 'REST API · push + pull' : 'Build your own integration'}</div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="form-row">
            <div class="form-label">Connected ERP</div>
            <div style="font-size:14px;font-weight:500">${erp.kind}</div>
          </div>
        `}

        <div class="section-label" style="margin-top:22px">Reconciliation</div>
        <div style="font-size:13px;color:var(--gl-text-mute);line-height:1.5">
          Nightly reconciliation compares orders in OpenSpec vs. your ERP. Discrepancies surface to ops with full context (PO numbers, retry attempts, error reason).
        </div>
        <div style="margin-top:10px;display:flex;gap:8px">
          <button class="btn ghost sm">View reconciliation log</button>
          <button class="btn ghost sm">Configure error alerts</button>
        </div>
      </div>
    `;
  } else if (tab === 'machines') {
    contentHtml = renderMachineSettings();
  } else if (tab === 'webhooks') {
    const hooks = state.integrations.webhooks;
    contentHtml = `
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Webhooks · ${hooks.length}</div>
          <button class="btn sm primary" onclick="toast('New webhook endpoint (mock)')">+ New endpoint</button>
        </div>
        <div style="font-size:12.5px;color:var(--gl-text-mute);margin-bottom:14px;line-height:1.5">
          Receive event notifications at your endpoints. Signed with HMAC-SHA256, X-OpenSpec-Signature header. Retries with exponential backoff for 24h.
        </div>
        ${hooks.map(h => `
          <div style="padding:14px 0;border-bottom:0.5px solid var(--gl-border)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:8px;font-family:var(--gl-mono);font-size:13px">
                ${h.active ? '<span style="width:8px;height:8px;border-radius:0;background:var(--gl-success);display:inline-block"></span>' : '<span style="width:8px;height:8px;border-radius:0;background:var(--gl-text-faint);display:inline-block"></span>'}
                ${h.url}
              </div>
              <div style="display:flex;gap:6px">
                <button class="btn sm ghost">Test</button>
                <button class="btn sm ghost">Edit</button>
              </div>
            </div>
            <div style="font-size:11.5px;color:var(--gl-text-mute);display:flex;gap:14px">
              <span>Events: ${h.events.join(', ')}</span>
              <span>Last delivery: ${h.lastDelivery}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (tab === 'api') {
    const keys = state.integrations.apiKeys;
    contentHtml = `
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">API keys · ${keys.length}</div>
          <button class="btn sm primary" onclick="toast('New API key created (mock)')">+ Create key</button>
        </div>
        <div style="font-size:12.5px;color:var(--gl-text-mute);margin-bottom:14px;line-height:1.5">
          Bearer-auth API keys for the Public API v1 (read-only catalog, quotes, orders, customers; admin scope for embed tokens). Treat keys like passwords.
        </div>
        ${keys.map(k => `
          <div style="padding:14px 0;border-bottom:0.5px solid var(--gl-border);display:flex;align-items:center;justify-content:space-between;gap:14px">
            <div style="flex:1">
              <div style="font-size:13.5px;font-weight:500">${k.name}</div>
              <div style="display:flex;gap:14px;margin-top:4px;font-size:11.5px;color:var(--gl-text-mute)">
                <span style="font-family:var(--gl-mono)">${k.prefix}</span>
                <span>Scopes: ${k.scopes.join(', ')}</span>
                <span>Created ${k.createdAt}</span>
                <span>Last used ${k.lastUsed}</span>
              </div>
            </div>
            <button class="btn sm danger">Revoke</button>
          </div>
        `).join('')}
      </div>
    `;
  } else if (tab === 'billing') {
    contentHtml = `
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Billing & payment terms</div>
          <button class="btn sm primary" onclick="saveSettings('Billing')">Save changes</button>
        </div>

        <div class="form-row">
          <div>
            <div class="form-label">Default payment terms</div>
            <div class="form-help">Standard terms quoted on new POs.</div>
          </div>
          <select class="form-select">
            <option>Net 15</option>
            <option selected>Net 30</option>
            <option>Net 45</option>
            <option>Net 60</option>
          </select>
        </div>

        <div class="form-row">
          <div>
            <div class="form-label">Late fee</div>
            <div class="form-help">Applied to past-due invoices.</div>
          </div>
          <input class="form-input" value="1.5% / month" />
        </div>

        <div class="form-row">
          <div><div class="form-label">Currency</div></div>
          <select class="form-select">
            <option selected>CAD</option>
            <option>USD</option>
          </select>
        </div>

        <div class="form-row">
          <div>
            <div class="form-label">Tax ID / HST</div>
            <div class="form-help">Shown on invoices.</div>
          </div>
          <input class="form-input" value="123456789 RT0001" />
        </div>
      </div>
    `;
  } else if (tab === 'audit') {
    // Audit log moved inside settings (was top nav)
    contentHtml = `
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Audit log</div>
          <div style="font-size:12px;color:var(--gl-text-mute)">${state.auditEvents.length} events · last 30 days</div>
        </div>
        ${state.auditEvents.slice(0, 50).map(e => `
          <div style="display:grid;grid-template-columns:36px 1fr 140px;gap:12px;padding:10px 4px;border-bottom:0.5px solid var(--gl-border);align-items:center;font-size:12.5px">
            <div style="width:30px;height:30px;border-radius:0;background:rgba(15,23,42,0.05);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--gl-text-mute)">${e.initials || '·'}</div>
            <div>
              <div style="font-weight:500"><span style="color:var(--gl-text-mute);font-family:var(--gl-mono);font-size:11px">${e.kind}</span> · ${escapeHtml(e.target || '')}</div>
              <div style="font-size:11px;color:var(--gl-text-mute);margin-top:2px">${escapeHtml(e.actor)} · ${escapeHtml(e.meta || '')}</div>
            </div>
            <div style="font-size:11px;color:var(--gl-text-mute);font-variant-numeric:tabular-nums;text-align:right">${e.at}</div>
          </div>
        `).join('')}
        ${state.auditEvents.length === 0 ? '<div class="empty-state">No audit events yet.</div>' : ''}
      </div>
    `;
  } else if (tab === 'integrations') {
    // ERP + Webhooks + API keys composite
    let erp = ''; let webhooks = ''; let apiKeys = '';
    // Render ERP section
    erp = `
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">ERP integration</div>
          <button class="btn sm ghost">Connect QuickBooks</button>
        </div>
        <div style="padding:14px 0;color:var(--gl-text-mute);font-size:13px;line-height:1.55">
          Sync invoices, payments, and customer data with QuickBooks Online or Xero. Configure mappings, schedule, and direction.
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn ghost">⚙ Configure mappings</button>
          <button class="btn ghost">🔄 Test sync</button>
        </div>
      </div>
    `;
    webhooks = `
      <div class="panel" style="margin-top:14px">
        <div class="panel-header">
          <div class="panel-title">Webhooks</div>
          <button class="btn sm primary">+ Add webhook</button>
        </div>
        <div style="padding:14px 0;color:var(--gl-text-mute);font-size:13px;line-height:1.55">
          POST to your URL on events: order.created, order.shipped, drawing.approved, payment.received. Audience-typed (dealer-scoped vs factory-scoped).
        </div>
      </div>
    `;
    apiKeys = `
      <div class="panel" style="margin-top:14px">
        <div class="panel-header">
          <div class="panel-title">API keys</div>
          <button class="btn sm primary">+ Generate key</button>
        </div>
        <div style="padding:14px 0;color:var(--gl-text-mute);font-size:13px;line-height:1.55">
          Programmatic access to your OpenSpec data. Use these keys to push catalog data, pull orders, or build integrations.
        </div>
      </div>
    `;
    contentHtml = erp + webhooks + apiKeys;
  }

  $('settings-view').innerHTML = `
    ${renderBackButton()}
    <div class="view-header">
      <div>
        <h1 class="view-title">Settings</h1>
        <div class="view-subtitle">Factory profile, production, team, billing</div>
      </div>
    </div>

    <div class="settings-grid">
      <div class="settings-nav">${navHtml}</div>
      <div>${contentHtml}</div>
    </div>
  `;
}

/* ════════════════════════════════════════════════
   ACTIONS
   ════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   Global navigation history — back-button stack
   ═══════════════════════════════════════════════════════════════════ */
let _suppressNavPush = false;

function navLabel(s) {
  if (s.orderDetailFullscreen) {
    const o = state.orders.find(x => x.id === s.selectedOrderId);
    return o ? `order ${o.po}` : 'order detail';
  }
  if (s.view === 'dashboard') return 'Dashboard';
  if (s.view === 'production') {
    if (s.productionTab === 'live')     return 'Overview · Live';
    if (s.productionTab === 'orders')   return 'Overview · All orders';
    if (s.productionTab === 'tasks')    return 'Overview · Tasks';
    if (s.productionTab === 'issues')   return 'Overview · Issues';
    if (s.productionTab === 'planning') return 'Overview · Planning';
    if (s.productionTab === 'quotes')   return 'Overview · Quotes';
    return 'Overview';
  }
  const map = {
    quotes: 'Quotes', configurator: 'Configurator', catalog: 'Catalog',
    materials: 'Materials', pricing: 'Pricing', financials: 'Financials',
    dealers: 'Dealers', audit: 'Audit', settings: 'Settings'
  };
  return map[s.view] || 'previous page';
}

function snapshotState() {
  return {
    view: state.currentView,
    productionTab: state.productionTab,
    ordersFilter: state.ordersFilter,
    catalogTab: state.catalogTab,
    selectedOrderId: state.selectedOrderId,
    selectedQuoteId: state.selectedQuoteId,
    orderDetailFullscreen: state.orderDetailFullscreen,
    orderDetailReturnTo: state.orderDetailReturnTo,
    calendarView: state.calendarView,
    calendarDate: state.calendarDate
  };
}

function pushNav() {
  if (_suppressNavPush) return;
  const snap = snapshotState();
  snap.label = navLabel(snap);
  // Don't push duplicate consecutive snapshots
  const top = state.navHistory[state.navHistory.length - 1];
  if (top && top.view === snap.view && top.productionTab === snap.productionTab
      && top.orderDetailFullscreen === snap.orderDetailFullscreen
      && top.selectedOrderId === snap.selectedOrderId
      && top.ordersFilter === snap.ordersFilter) return;
  state.navHistory.push(snap);
  if (state.navHistory.length > 50) state.navHistory.shift();
}

function goBack() {
  const prev = state.navHistory.pop();
  _suppressNavPush = true;
  if (!prev) {
    switchView('dashboard');
    _suppressNavPush = false;
    return;
  }
  // Restore captured fields
  state.productionTab = prev.productionTab;
  state.ordersFilter = prev.ordersFilter;
  state.catalogTab = prev.catalogTab;
  state.selectedOrderId = prev.selectedOrderId;
  state.selectedQuoteId = prev.selectedQuoteId;
  state.orderDetailFullscreen = prev.orderDetailFullscreen;
  state.orderDetailReturnTo = prev.orderDetailReturnTo;
  state.calendarView = prev.calendarView;
  state.calendarDate = prev.calendarDate;
  if (prev.view !== state.currentView) {
    switchView(prev.view);
  } else {
    // Same view, just re-render to reflect restored sub-state
    if (state.currentView === 'production')      renderProduction();
    else if (state.currentView === 'dashboard')  renderDashboard();
    else if (state.currentView === 'quotes')     renderQuotes();
    else if (state.currentView === 'configurator') renderConfigurator();
    else if (state.currentView === 'catalog')    renderCatalog();
    else if (state.currentView === 'materials')  renderMaterials();
    else if (state.currentView === 'pricing')    renderPricing();
    else if (state.currentView === 'financials') renderFinancials();
    else if (state.currentView === 'dealers')    renderDealers();
    else if (state.currentView === 'audit')      renderAudit();
    else if (state.currentView === 'settings')   renderSettings();
  }
  _suppressNavPush = false;
}

function renderBackButton() {
  if (state.currentView === 'dashboard') return '';
  if (state.navHistory.length === 0) return '';
  const prev = state.navHistory[state.navHistory.length - 1];
  return `
    <div class="back-nav-bar">
      <button class="back-nav-btn" type="button" onclick="goBack()" title="Back to ${prev.label}">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M12 15l-5-5 5-5"/></svg>
        <span>Back to ${prev.label}</span>
      </button>
    </div>
  `;
}

function switchView(name) {
  if (!_suppressNavPush && state.currentView && state.currentView !== name) pushNav();
  // User-initiated nav (top-nav click, etc.) should exit any open fullscreen
  // order detail so the destination view actually renders. Internal calls
  // like openOrderFullscreen run with _suppressNavPush=true and stay opted-out.
  if (!_suppressNavPush && state.orderDetailFullscreen) {
    state.orderDetailFullscreen = false;
    state.orderDetailReturnTo = null;
  }
  state.currentView = name;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(name + '-view').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-item[data-view="${name}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Re-render the view fresh
  if (name === 'dashboard') renderDashboard();
  else if (name === 'quotes') renderQuotes();
  else if (name === 'configurator') renderConfigurator();
  else if (name === 'production') renderProduction();
  else if (name === 'pipeline') renderPipeline();
  else if (name === 'estimates') renderEstimates();
  else if (name === 'qc') renderQC();
  else if (name === 'shipping') renderShipping();
  else if (name === 'catalog') renderCatalog();
  else if (name === 'materials') renderMaterials();
  else if (name === 'pricing') renderPricing();
  else if (name === 'financials') renderFinancials();
  else if (name === 'dealers') renderDealers();
  else if (name === 'audit') renderAudit();
  else if (name === 'settings') renderSettings();

  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ─── Quote + Configurator actions ─── */
function openQuote(id) {
  state.selectedQuoteId = id;
  switchView('quotes');
  renderQuoteDetail();
}

function openQuoteDetail(id) {
  state.selectedQuoteId = id;
  switchView('quotes');
  renderQuoteDetail();
}

function openConfigurator(quoteId, unitId) {
  state.selectedQuoteId = quoteId;
  state.selectedUnitId = unitId || getQuote(quoteId).units[0].id;
  state.activeOptionSection = null;
  switchView('configurator');
}

function selectUnit(unitId) {
  state.selectedUnitId = unitId;
  state.activeOptionSection = null;
  renderConfigurator();
}

function toggleSection(sectionId) {
  state.activeOptionSection = state.activeOptionSection === sectionId ? null : sectionId;
  renderConfigurator();
}

function updateOption(key, value) {
  const q = getQuote(state.selectedQuoteId);
  const u = getQuoteUnit(q, state.selectedUnitId);
  if (!u) return;
  u.selections[key] = value;
  renderConfigurator();
}

function updateUnitDim(which, value) {
  const v = parseInt(value, 10);
  if (!v || v < 200 || v > 5000) { toast('Dimension must be 200–5000 mm'); return; }
  const q = getQuote(state.selectedQuoteId);
  const u = getQuoteUnit(q, state.selectedUnitId);
  if (!u) return;
  if (which === 'width') u.widthMm = v;
  else u.heightMm = v;
  renderConfigurator();
}

function updateUnitType(typeId) {
  const q = getQuote(state.selectedQuoteId);
  const u = getQuoteUnit(q, state.selectedUnitId);
  if (!u) return;
  u.type = typeId;
  // Reset hinge if not applicable
  if (typeId === 'picture' || typeId === 'sliding') u.hinge = 'none';
  else if (typeId === 'awning' || typeId === 'hopper') u.hinge = 'top';
  else if (u.hinge === 'none' || u.hinge === 'top') u.hinge = 'right';
  renderConfigurator();
}

function updateUnitHinge(hingeId) {
  const q = getQuote(state.selectedQuoteId);
  const u = getQuoteUnit(q, state.selectedUnitId);
  if (!u) return;
  u.hinge = hingeId;
  renderConfigurator();
}

function setSide(side) {
  state.configuratorSide = side;
  renderConfigurator();
}

function setMode(mode) {
  state.configuratorMode = mode;
  if (mode === '3d') toast('3D viewport coming soon · using CAD elevation');
  renderConfigurator();
}

function addUnit() {
  const q = getQuote(state.selectedQuoteId);
  if (!q) return;
  const newId = 'u' + (q.units.length + 1);
  const last = q.units[q.units.length - 1];
  const newUnit = {
    id: newId,
    label: 'Unit ' + (q.units.length + 1),
    type: last ? last.type : 'casement',
    widthMm: last ? last.widthMm : 1200,
    heightMm: last ? last.heightMm : 1500,
    hinge: last ? last.hinge : 'right',
    selections: last ? { ...last.selections } : {
      exterior_color: 'White', interior_color: 'White',
      glass: 'dualpane-low-e', glazing: 'argon-low-e',
      grill: 'none', hardware: 'standard',
      brickmold: '2.25', jamb: '4-9-16', return: '1-0',
      safety: 'tempered', screen: 'half', panes: '1x1'
    }
  };
  q.units.push(newUnit);
  state.selectedUnitId = newId;
  state.activeOptionSection = null;
  toast('Unit ' + q.units.length + ' added');
  renderConfigurator();
}

function duplicateUnit(unitId) {
  const q = getQuote(state.selectedQuoteId);
  if (!q) return;
  const src = getQuoteUnit(q, unitId);
  if (!src) return;
  const newId = 'u' + (q.units.length + 1);
  const dup = JSON.parse(JSON.stringify(src));
  dup.id = newId;
  dup.label = src.label + ' (copy)';
  q.units.push(dup);
  state.selectedUnitId = newId;
  toast('Unit duplicated');
  renderConfigurator();
}

function newQuote() {
  const customer = prompt('Customer name:');
  if (!customer) return;
  const project = prompt('Project name:', 'New project') || 'New project';
  const newId = Math.max(...state.quotes.map(q => q.id)) + 1;
  const newNum = 'Q-F-2026-' + String(43 + state.quotes.length).padStart(4, '0');
  const newQ = {
    id: newId,
    number: newNum,
    customer,
    customerType: 'Direct retail',
    project,
    siteCity: 'Hamilton · ON',
    status: 'draft',
    createdAt: '2026-05-10',
    submittedBy: state.user.name,
    units: [{
      id: 'u1',
      label: 'Unit 1',
      type: 'casement',
      widthMm: 1200,
      heightMm: 1500,
      hinge: 'right',
      selections: {
        exterior_color: 'White', interior_color: 'White',
        glass: 'dualpane-low-e', glazing: 'argon-low-e',
        grill: 'none', hardware: 'standard',
        brickmold: '2.25', jamb: '4-9-16', return: '1-0',
        safety: 'tempered', screen: 'half', panes: '1x1'
      }
    }]
  };
  state.quotes.unshift(newQ);
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'quote.created',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: newNum, meta: 'Customer: ' + customer
  });
  toast('Quote ' + newNum + ' created');
  openConfigurator(newId, 'u1');
}

function duplicateQuote(id) {
  const src = getQuote(id);
  if (!src) return;
  const newId = Math.max(...state.quotes.map(q => q.id)) + 1;
  const newNum = 'Q-F-2026-' + String(43 + state.quotes.length).padStart(4, '0');
  const dup = JSON.parse(JSON.stringify(src));
  dup.id = newId;
  dup.number = newNum;
  dup.status = 'draft';
  dup.createdAt = '2026-05-10';
  dup.customer = src.customer + ' (copy)';
  state.quotes.unshift(dup);
  toast('Quote duplicated as ' + newNum);
  openQuoteDetail(newId);
}

function submitQuote(id) {
  const q = getQuote(id);
  if (!q) return;
  q.status = 'submitted';
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'quote.submitted',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: q.number, meta: q.customer
  });
  toast('Quote ' + q.number + ' submitted');
  renderQuoteDetail();
}

function convertToOrder(id) {
  const q = getQuote(id);
  if (!q) return;
  q.status = 'ordered';
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'order.created',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: q.number, meta: 'Quote → Order'
  });
  toast('Quote converted to order');
  renderQuoteDetail();
}

function selectOrder(id) {
  state.selectedOrderId = id;
  if (state.currentView === 'production' && state.productionTab === 'orders') {
    document.querySelectorAll('.table-row').forEach(r => r.classList.remove('selected'));
    const row = document.querySelector(`.table-row[data-order="${id}"]`);
    if (row) row.classList.add('selected');
    const dc = $('detail-container');
    if (dc) dc.innerHTML = renderOrderDetail();
  }
}

function filterOrders(filter) {
  const changing = state.ordersFilter !== filter
                 || state.currentView !== 'production'
                 || state.productionTab !== 'orders';
  if (changing && !_suppressNavPush) pushNav();
  _suppressNavPush = true;
  state.ordersFilter = filter;
  state.productionTab = 'orders';
  if (state.currentView !== 'production') {
    switchView('production');
  } else {
    renderProduction();
  }
  _suppressNavPush = false;
}

function setProductionTab(tab) {
  if (state.productionTab !== tab && !_suppressNavPush) pushNav();
  state.productionTab = tab;
  renderProduction();
}

/* ─── Universal "open order" entrypoint — used everywhere across the platform ─── */
function openOrderFullscreen(orderId, returnTo) {
  const o = getOrder(orderId);
  if (!o) return;
  // Push the pre-open snapshot so Back returns the user there
  if (!_suppressNavPush) pushNav();
  state.selectedOrderId = orderId;
  state.orderDetailFullscreen = true;
  // Keep legacy returnTo for any callers/consumers that still read it
  state.orderDetailReturnTo = returnTo || {
    view: state.currentView,
    productionTab: state.productionTab,
    ordersFilter: state.ordersFilter
  };
  _suppressNavPush = true;
  if (state.currentView !== 'production') switchView('production');
  else renderProduction();
  _suppressNavPush = false;
}

function closeOrderDetail() {
  // Always clear the fullscreen flag first; goBack will restore the
  // pre-open snapshot pushed by openOrderFullscreen.
  state.orderDetailFullscreen = false;
  state.orderDetailReturnTo = null;
  if (state.navHistory.length > 0) {
    goBack();
  } else {
    // Safety fallback if history was lost
    _suppressNavPush = true;
    state.productionTab = 'live';
    if (state.currentView !== 'production') switchView('production');
    else renderProduction();
    _suppressNavPush = false;
  }
}

/* Calendar → Order: opens the order in fullscreen detail */
function openOrderFromCalendar(orderId) {
  openOrderFullscreen(orderId);
}

/* Estimate completion date given an order's unit count and stock readiness.
   Rough model: drawings (2d) + materials staging (1d if in stock, 5d if reorder)
   + production (units / 6 per day, min 3d) + QC (1d) + ship buffer (2d). */
function computeOrderETC(o) {
  const readiness = computeStockReadiness(o);
  const drawingsDays = 2;
  const stagingDays = readiness.needsReorder ? 5 : 1;
  const productionDays = Math.max(3, Math.ceil((o.units || 1) / 6));
  const qcDays = 1;
  const bufferDays = 2;
  const totalDays = drawingsDays + stagingDays + productionDays + qcDays + bufferDays;
  // Walk forward by totalDays business days (skip weekends)
  const d = new Date(state.calendarDate || new Date().toISOString().slice(0, 10));
  let added = 0;
  while (added < totalDays) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return {
    date: d.toISOString().slice(0, 10),
    totalDays,
    breakdown: { drawingsDays, stagingDays, productionDays, qcDays, bufferDays },
    needsReorder: readiness.needsReorder
  };
}

function fmtETC(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ─── Acknowledge PO confirmation flow ─────────────────────────────────
   Clicking "Acknowledge PO" no longer commits silently — it opens a
   confirmation modal showing the auto-generated factory order number,
   computed ETC, materials readiness, and lets the operator: edit the
   FO number, adjust the ETC date, add internal notes (factory-only),
   write a custom message to the dealer, set priority, assign a PM.
   The modal then commits via confirmAcknowledgePO(). */

function acknowledgePO(id) {
  const o = getOrder(id);
  if (!o) return;

  // Pre-compute defaults for the modal fields
  const suggestedFO = o.factoryOrderNumber || `FO-${(10000 + o.id).toString()}`;
  const etcResult = computeOrderETC(o);
  const suggestedETC = etcResult.date;
  const totalMaterialCost = calculateOrderMaterialCost(o);
  const readiness = computeStockReadiness ? computeStockReadiness(o) : null;
  const d = getDealer(o.dealerId);

  // PM team list (factory team available to assign)
  const factoryPMs = (state.factoryTeam || []).filter(m =>
    !m.role || ['PM','Lead','Operations','Production'].some(r => (m.role || '').includes(r))
  );
  const pmOptionsHtml = factoryPMs.length > 0
    ? factoryPMs.map(m => `<option value="${escapeHtml(m.name)}">${escapeHtml(m.name)}${m.role ? ' · ' + escapeHtml(m.role) : ''}</option>`).join('')
    : `<option value="Sam Chen">Sam Chen · Operations</option><option value="Dave Pereira">Dave Pereira · QC Lead</option><option value="Marcus Hill">Marcus Hill · Production</option>`;

  const stockSummary = readiness
    ? (readiness.needsReorder
        ? `${readiness.short} item${readiness.short === 1 ? '' : 's'} short · ${readiness.low} below reorder · staging may add days`
        : `All ${readiness.lines.length} materials in stock`)
    : 'Materials check available after drawings';

  const modalHtml = `
    <div class="ack-modal-overlay" onclick="if (event.target === this) closeAckModal()">
      <div class="ack-modal">
        <div class="ack-modal-head">
          <div>
            <div class="ack-modal-eyebrow">ACKNOWLEDGE PO</div>
            <div class="ack-modal-title">${d ? escapeHtml(d.short) : 'Direct customer'} <span class="ack-modal-po">${o.dealerPO || o.po}</span></div>
            <div class="ack-modal-sub">${escapeHtml(o.project)} · ${o.units} units · ${fmtMoneyFull(o.value)}</div>
          </div>
          <button class="ack-modal-close" type="button" onclick="closeAckModal()">✕</button>
        </div>

        <div class="ack-modal-body">

          <!-- Factory order number -->
          <div class="ack-field">
            <label class="ack-field-label" for="ack-fo-input">Factory order number</label>
            <div class="ack-field-help">Auto-assigned — edit if you use a different internal numbering scheme.</div>
            <input id="ack-fo-input" class="ack-input" type="text" value="${escapeHtml(suggestedFO)}" />
          </div>

          <!-- ETC date -->
          <div class="ack-field">
            <label class="ack-field-label" for="ack-etc-input">Estimated completion date</label>
            <div class="ack-field-help">${etcResult.totalDays} business days computed: drawings ${etcResult.breakdown && etcResult.breakdown.drawings || 2}d + materials ${etcResult.breakdown && etcResult.breakdown.materials || 1}d + production ${etcResult.breakdown && etcResult.breakdown.production || 3}d + QC ${etcResult.breakdown && etcResult.breakdown.qc || 1}d + buffer.</div>
            <input id="ack-etc-input" class="ack-input" type="date" value="${suggestedETC}" />
          </div>

          <!-- Priority -->
          <div class="ack-field">
            <label class="ack-field-label">Production priority</label>
            <div class="ack-priority-row">
              <label class="ack-priority-opt">
                <input type="radio" name="ack-priority" value="standard" checked />
                <span class="ack-priority-pill" style="--p-color:#16A34A">Standard</span>
              </label>
              <label class="ack-priority-opt">
                <input type="radio" name="ack-priority" value="rush" />
                <span class="ack-priority-pill" style="--p-color:#D97706">Rush</span>
              </label>
              <label class="ack-priority-opt">
                <input type="radio" name="ack-priority" value="hot" />
                <span class="ack-priority-pill" style="--p-color:#DC2626">Hot</span>
              </label>
            </div>
          </div>

          <!-- Assigned PM -->
          <div class="ack-field">
            <label class="ack-field-label" for="ack-pm-input">Assigned project lead</label>
            <select id="ack-pm-input" class="ack-input">
              ${pmOptionsHtml}
            </select>
          </div>

          <!-- Stock readiness -->
          <div class="ack-readiness ${readiness && readiness.needsReorder ? 'warn' : 'ok'}">
            <div class="ack-readiness-icon">${readiness && readiness.needsReorder ? '⚠' : '✓'}</div>
            <div>
              <div class="ack-readiness-title">${readiness && readiness.needsReorder ? 'Material reorder needed' : 'Materials ready'}</div>
              <div class="ack-readiness-sub">${stockSummary} · material cost ${fmtMoney(totalMaterialCost)}</div>
            </div>
          </div>

          <!-- Internal notes -->
          <div class="ack-field">
            <label class="ack-field-label" for="ack-notes-input">Internal notes <span class="ack-field-tag">factory-only</span></label>
            <div class="ack-field-help">Not visible to the dealer. Use for scheduling notes, special instructions, supplier dependencies.</div>
            <textarea id="ack-notes-input" class="ack-textarea" rows="2" placeholder="e.g. Hold for installer cert renewal · custom bronze profile needs ETA confirmation"></textarea>
          </div>

          <!-- Message to dealer -->
          <div class="ack-field">
            <label class="ack-field-label" for="ack-message-input">Message to dealer <span class="ack-field-tag dealer">dealer-visible</span></label>
            <div class="ack-field-help">Goes into the dealer's confirmation thread. Leave blank to send the standard auto-confirmation.</div>
            <textarea id="ack-message-input" class="ack-textarea" rows="2" placeholder="(Optional) Add a personal note for the dealer…"></textarea>
          </div>

        </div>

        <div class="ack-modal-foot">
          <div class="ack-modal-foot-meta">Confirming will assign the factory order number, set the ETC, and notify ${d ? escapeHtml(d.short) : 'the dealer'} in the order thread.</div>
          <div style="display:flex;gap:8px">
            <button class="btn ghost" onclick="closeAckModal()">Cancel</button>
            <button class="btn primary" onclick="confirmAcknowledgePO(${o.id})">✓ Confirm and notify dealer</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Mount
  let mountEl = document.getElementById('ack-modal-mount');
  if (!mountEl) {
    mountEl = document.createElement('div');
    mountEl.id = 'ack-modal-mount';
    document.body.appendChild(mountEl);
  }
  mountEl.innerHTML = modalHtml;

  // Focus the FO input briefly so the operator can edit it quickly
  setTimeout(() => {
    const fo = document.getElementById('ack-fo-input');
    if (fo) fo.focus();
  }, 50);
}

function closeAckModal() {
  const el = document.getElementById('ack-modal-mount');
  if (el) el.innerHTML = '';
}

/* The actual commit — reads modal inputs, applies state, closes modal. */
function confirmAcknowledgePO(id) {
  const o = getOrder(id);
  if (!o) return;

  // Read modal inputs
  const fo = (document.getElementById('ack-fo-input') || {}).value || `FO-${(10000 + o.id).toString()}`;
  const etc = (document.getElementById('ack-etc-input') || {}).value;
  const priorityInput = document.querySelector('input[name="ack-priority"]:checked');
  const priority = priorityInput ? priorityInput.value : 'standard';
  const assignedPM = (document.getElementById('ack-pm-input') || {}).value || null;
  const internalNotes = ((document.getElementById('ack-notes-input') || {}).value || '').trim();
  const dealerMessage = ((document.getElementById('ack-message-input') || {}).value || '').trim();

  // Apply to the order
  o.factoryOrderNumber = fo.trim() || `FO-${(10000 + o.id).toString()}`;
  if (etc) o.etc = etc;
  o.priority = priority;
  if (assignedPM) o.assignedPM = assignedPM;
  if (internalNotes) {
    o.internalNotes = o.internalNotes || [];
    o.internalNotes.unshift({
      author: (state.user || { name: 'Sam Chen' }).name,
      at: new Date().toISOString(),
      body: internalNotes,
      kind: 'ack'
    });
  }

  o.status = 'ack';
  o.milestones = o.milestones || {};
  o.milestones.ack = true;
  o.acknowledgedAt = new Date().toISOString();

  // Confirmation thread entry visible to the dealer
  const etcResult = computeOrderETC(o);
  const totalMaterialCost = calculateOrderMaterialCost(o);
  const readiness = computeStockReadiness ? computeStockReadiness(o) : null;

  o.thread = o.thread || [];
  const standardLines = [
    `PO ${o.dealerPO || o.po} acknowledged. Factory order ${o.factoryOrderNumber} assigned.`,
    `Estimated time of completion: ${fmtETC(o.etc)}${priority !== 'standard' ? ` · ${priority.toUpperCase()} priority` : ''}.`,
    readiness && readiness.needsReorder ? '⚠ Some materials below reorder point — staging may add a few days.' : '✓ All materials in stock — production starts immediately after drawing approval.',
    `Drawings package will be shared for review next.`
  ];
  if (dealerMessage) standardLines.push('', dealerMessage);
  o.thread.push({
    from: 'factory',
    name: 'OpenSpec',
    initials: 'OS',
    time: 'just now',
    body: standardLines.join('\n'),
    kind: 'ack-confirmation'
  });

  // Audit log
  if (state.auditEvents) {
    state.auditEvents.unshift({
      id: state.auditEvents.length + 1,
      kind: 'order.acknowledged',
      actor: (state.user || { name: 'Sam Chen' }).name,
      initials: 'SC',
      tenantId: 'northforge',
      scope: 'own',
      at: 'just now',
      target: o.po + ' · ' + o.project,
      meta: `${o.factoryOrderNumber} · ETC ${fmtETC(o.etc)} · ${priority}${assignedPM ? ' · ' + assignedPM : ''}${internalNotes ? ' · with note' : ''}`
    });
  }

  closeAckModal();
  toast(`✓ ${o.factoryOrderNumber} · ETC ${fmtETC(o.etc)} · ${d_short_safe(o)} notified`);

  // Re-render any visible views
  renderProduction();
  if (state.currentView === 'estimates') renderEstimates();
  if (state.currentView === 'pipeline') renderPipeline();
  renderDashboard();
}

function d_short_safe(o) {
  const d = getDealer(o.dealerId);
  return d ? d.short : 'dealer';
}

function releaseDrawings(id) {
  const o = getOrder(id);
  if (!o) return;
  o.milestones.drawings = true;
  o.drawings.forEach(dr => {
    if (dr.status === 'pending') dr.status = 'in-review';
  });
  // Move to production if drawings are now released
  if (o.status === 'ack') {
    // Stay in 'ack' until dealer approves drawings — simulate auto-approve for demo
    setTimeout(() => {
      o.drawings.forEach(dr => { if (dr.status === 'in-review') dr.status = 'approved'; });
      o.status = 'production';
      o.milestones.production = true;
      o.thread.push({
        from: 'dealer',
        name: getDealer(o.dealerId).name.split(' ')[0],
        initials: getDealer(o.dealerId).avatar,
        time: 'just now',
        body: 'Drawings approved. Proceed.'
      });
      if (state.currentView === 'production') renderProduction();
      if (state.currentView === 'production') renderProduction();
    }, 1800);
  }
  o.thread.push({
    from: 'factory',
    name: state.user.name.split(' ')[0] + ' ' + state.user.name.split(' ')[1][0] + '.',
    initials: 'NF',
    time: 'just now',
    body: 'Released drawing package for review.'
  });
  // Drawing released — complete any review-drawing tasks for this order
  autoCompleteTask('review-drawing', { orderId: o.id, note: 'Released · just now' });
  toast('Drawings released for ' + o.po);
  renderProduction();
}

function reReleaseDrawings(id) {
  const o = getOrder(id);
  if (!o) return;
  o.drawings.forEach(dr => { if (dr.status === 'revise') dr.status = 'in-review'; });
  toast('Drawings re-released for ' + o.po);
  renderProduction();
}

function markQCComplete(id) {
  const o = getOrder(id);
  if (!o) return;
  o.status = 'ready';
  o.milestones.qc = true;
  o.thread.push({
    from: 'factory',
    name: state.factory.team[1].name.split(' ')[0] + ' ' + state.factory.team[1].name.split(' ')[1][0] + '.',
    initials: 'NF',
    time: 'just now',
    body: 'QC complete. Ready to ship — please confirm delivery window.'
  });
  // QC done — complete any review-qc tasks for this order
  autoCompleteTask('review-qc', { orderId: o.id, note: 'Passed · just now' });
  toast(o.po + ' marked QC complete · ready to ship');
  renderProduction();
}

function markShipped(id) {
  const o = getOrder(id);
  if (!o) return;
  openStageChangeConfirm(id, { kind: 'stage', from: o.status, to: 'shipped' });
}

function markDelivered(id) {
  const o = getOrder(id);
  if (!o) return;
  openStageChangeConfirm(id, { kind: 'stage', from: o.status, to: 'delivered' });
}

function sendReply(id) {
  const input = $('replyInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  const o = getOrder(id);
  if (!o) return;
  o.thread.push({
    from: 'factory',
    name: state.user.name.split(' ')[0] + ' ' + state.user.name.split(' ')[1][0] + '.',
    initials: 'NF',
    time: 'just now',
    body: text
  });
  input.value = '';
  $('detail-container').innerHTML = renderOrderDetail();
  toast('Reply sent');
}

function focusReply() {
  setTimeout(() => {
    const input = $('replyInput');
    if (input) input.focus();
  }, 50);
}

function viewPDF(id) {
  toast('Opening PO PDF... (mock)');
}

function nudgeDealer(id) {
  const o = getOrder(id);
  toast('Nudged ' + getDealer(o.dealerId).short + ' on ' + o.po);
}

function selectDealer(id) {
  toast('Opening ' + getDealer(id).name + ' dealer detail... (mock)');
}

function saveSettings(section) {
  toast(section + ' settings saved');
}

function toggleDark() {
  state.dark = !state.dark;
  document.body.classList.toggle('dark', state.dark);
  $('darkToggle').textContent = state.dark ? '☾' : '☀';
}

/* ─── Rush request actions ─── */
function approveRush(id) {
  const r = state.rushRequests.find(x => x.id === id);
  if (!r) return;
  r.status = 'APPROVED';
  r.decidedAt = '2026-05-10';
  r.approvedPriorityLevel = r.priority;
  // Audit event
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'rush_request.approved',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: 'O-' + r.orderId, meta: `Priority raised to P${r.priority}`
  });
  // Auto-complete any rush task on the calendar for this order
  autoCompleteTask('approve-rush', { orderId: r.orderId, note: 'Approved · just now' });
  toast('Rush request approved · order priority raised');
  renderProduction();
}

function declineRush(id) {
  const r = state.rushRequests.find(x => x.id === id);
  if (!r) return;
  r.status = 'DECLINED';
  r.decidedAt = '2026-05-10';
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'rush_request.declined',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: 'O-' + r.orderId, meta: 'Rush request declined'
  });
  // Decision is taken — also complete the task
  autoCompleteTask('approve-rush', { orderId: r.orderId, note: 'Declined · just now' });
  toast('Rush request declined');
  renderProduction();
}

/* ─── Warranty claim actions ─── */
function acknowledgeClaim(id) {
  const c = state.warrantyClaims.find(x => x.id === id);
  if (!c) return;
  c.status = 'ACKNOWLEDGED_BY_FACTORY';
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'warranty_claim.acknowledged',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: c.claimNumber, meta: c.category + ' acknowledged'
  });
  toast('Claim acknowledged · dealer notified');
  renderProduction();
}

function approveClaim(id) {
  const c = state.warrantyClaims.find(x => x.id === id);
  if (!c) return;
  c.status = 'APPROVED';
  c.decidedAt = '2026-05-10';
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'warranty_claim.approved',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: c.claimNumber, meta: 'Remake order will spawn'
  });
  // Complete approve-warranty + triage-warranty tasks tied to this claim's order
  autoCompleteTask('approve-warranty', { orderId: c.orderId, note: 'Approved · just now' });
  autoCompleteTask('triage-warranty', { orderId: c.orderId, note: 'Triaged · just now' });
  toast('Claim approved · remake order will be created');
  renderProduction();
}

function declineClaim(id) {
  const c = state.warrantyClaims.find(x => x.id === id);
  if (!c) return;
  c.status = 'DECLINED';
  c.decidedAt = '2026-05-10';
  toast('Claim declined · dealer notified');
  renderProduction();
}

function markRemakeInProgress(id) {
  const c = state.warrantyClaims.find(x => x.id === id);
  if (!c) return;
  c.status = 'REMADE_IN_PROGRESS';
  toast('Marked remake in progress');
  renderProduction();
}

function resolveClaim(id) {
  const c = state.warrantyClaims.find(x => x.id === id);
  if (!c) return;
  c.status = 'RESOLVED';
  c.resolvedAt = '2026-05-10';
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'warranty_claim.resolved',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: c.claimNumber, meta: 'Resolved'
  });
  toast('Claim resolved');
  renderProduction();
}

/* ─── User management ─── */
function inviteUser() {
  const email = prompt('Email to invite:');
  if (!email || !email.includes('@')) return;
  const role = prompt('Role (OWNER / ADMIN / MANAGER / ESTIMATOR / VIEWER):', 'MANAGER');
  if (!role) return;
  const initials = email.split('@')[0].slice(0, 2).toUpperCase();
  state.users.push({
    id: state.users.length + 1,
    name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    email, role: role.toUpperCase(), initials,
    lastActive: 'invited',
    invitedBy: state.user.name
  });
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'user.invited',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: email, meta: `Invited as ${role.toUpperCase()}`
  });
  toast('Invite sent to ' + email);
  renderSettings();
}

function changeRole(userId, newRole) {
  const u = state.users.find(x => x.id === userId);
  if (!u) return;
  const old = u.role;
  u.role = newRole;
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'user.role_changed',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: u.email, meta: `${old} → ${newRole}`
  });
  toast(u.name + ': ' + old + ' → ' + newRole);
  renderSettings();
}

function removeUser(userId) {
  if (!confirm('Remove user? Their sessions will be revoked immediately.')) return;
  const u = state.users.find(x => x.id === userId);
  if (!u) return;
  state.users = state.users.filter(x => x.id !== userId);
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'user.removed',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: u.email, meta: 'Removed · sessions revoked'
  });
  toast(u.name + ' removed');
  renderSettings();
}

/* ════════════════════════════════════════════════
   DEALER INVITE WIZARD + pending invitations
   ════════════════════════════════════════════════ */

function inviteDealer() {
  state.inviteWizard.open = true;
  state.inviteWizard.step = 1;
  state.inviteWizard.editingId = null;
  state.inviteWizard.data = {
    businessName: '', contactName: '', contactEmail: '',
    phone: '', city: '', province: 'ON',
    annualVolumeEst: '100k-250k', segment: 'residential',
    tierId: 2, customMultiplier: '',
    paymentTerms: 'Net 30', creditLimit: 25000, currency: 'CAD',
    categoryAccess: ['window'], leadTime: 'standard',
    sendDealerAgreement: true, requireCOI: true, requireTraining: false,
    personalNote: ''
  };
  renderModal();
}

function closeWizard() {
  state.inviteWizard.open = false;
  renderModal();
}

function wizSetField(field, value) {
  state.inviteWizard.data[field] = value;
}

function wizToggleCategory(cat) {
  const arr = state.inviteWizard.data.categoryAccess;
  const i = arr.indexOf(cat);
  if (i >= 0) arr.splice(i, 1);
  else arr.push(cat);
  renderModal();
}

function wizGoToStep(n) {
  // Validate before allowing forward navigation
  const cur = state.inviteWizard.step;
  if (n > cur) {
    const errs = wizValidateStep(cur);
    if (errs.length > 0) { toast(errs[0]); return; }
  }
  state.inviteWizard.step = n;
  renderModal();
}

function wizNext() { wizGoToStep(state.inviteWizard.step + 1); }
function wizPrev() {
  if (state.inviteWizard.step > 1) { state.inviteWizard.step--; renderModal(); }
}

function wizValidateStep(step) {
  const d = state.inviteWizard.data;
  const errors = [];
  if (step === 1) {
    if (!d.businessName.trim()) errors.push('Business name is required');
    else if (!d.contactName.trim()) errors.push('Contact name is required');
    else if (!d.contactEmail.trim() || !d.contactEmail.includes('@')) errors.push('Valid contact email is required');
  }
  if (step === 3 && d.categoryAccess.length === 0) {
    errors.push('Select at least one product category');
  }
  return errors;
}

function wizSendInvite() {
  const errs = wizValidateStep(1).concat(wizValidateStep(3));
  if (errs.length > 0) { toast(errs[0]); return; }
  const d = state.inviteWizard.data;
  const tier = state.pricing.dealerTiers.find(t => t.id === d.tierId);
  const newId = 'inv_' + String(state.pendingInvites.length + 100).padStart(3, '0');
  const today = new Date().toISOString().slice(0, 10);
  const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  state.pendingInvites.unshift({
    id: newId,
    businessName: d.businessName.trim(),
    contactName: d.contactName.trim(),
    contactEmail: d.contactEmail.trim(),
    city: d.city.trim() || '—',
    province: d.province,
    sentAt: today,
    expiresAt,
    status: 'awaiting',
    tierId: d.tierId,
    paymentTerms: d.paymentTerms,
    creditLimit: d.creditLimit,
    categoryAccess: [...d.categoryAccess],
    customMultiplier: d.customMultiplier ? parseFloat(d.customMultiplier) : null,
    remindersSent: 0,
    sentAgreement: d.sendDealerAgreement,
    requiresCOI: d.requireCOI,
    requiresTraining: d.requireTraining,
    personalNote: d.personalNote
  });

  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'dealer.invited',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: d.businessName, meta: `${d.contactEmail} · ${tier ? tier.name : 'Tier'} · ${d.paymentTerms} · ${d.categoryAccess.length} categor${d.categoryAccess.length === 1 ? 'y' : 'ies'}`
  });

  toast('Invite sent to ' + d.contactEmail);
  state.inviteWizard.open = false;
  renderModal();
  renderDealers();
}

function resendInvite(id) {
  const inv = state.pendingInvites.find(i => i.id === id);
  if (!inv) return;
  inv.remindersSent = (inv.remindersSent || 0) + 1;
  inv.expiresAt = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  if (inv.status === 'expired') inv.status = 'awaiting';
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'dealer.invite_resent',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: inv.businessName, meta: `Reminder #${inv.remindersSent} to ${inv.contactEmail}`
  });
  toast('Reminder #' + inv.remindersSent + ' sent to ' + inv.contactEmail);
  renderDealers();
}

function cancelInvite(id) {
  const inv = state.pendingInvites.find(i => i.id === id);
  if (!inv) return;
  if (!confirm('Cancel invite to ' + inv.businessName + '? They\'ll no longer be able to accept it.')) return;
  inv.status = 'cancelled';
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'dealer.invite_cancelled',
    actor: state.user.name, initials: state.user.initials,
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: inv.businessName, meta: 'Invite cancelled'
  });
  toast('Invite to ' + inv.businessName + ' cancelled');
  renderDealers();
}

function simulateAccept(id) {
  // Demo: pretend the dealer accepted the invite — graduate them to a full dealer
  const inv = state.pendingInvites.find(i => i.id === id);
  if (!inv) return;
  inv.status = 'accepted';
  // Generate a new dealer record
  const initials = inv.businessName.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const gradients = [
    'linear-gradient(135deg, #064E3B 0%, #047857 100%)',
    'linear-gradient(135deg, #92400E 0%, #D97706 100%)',
    'linear-gradient(135deg, #1E3A8A 0%, #2e5bc8 100%)',
    'linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)',
    'linear-gradient(135deg, #831843 0%, #BE185D 100%)',
    'linear-gradient(135deg, #134E4A 0%, #0D9488 100%)'
  ];
  const dealerId = inv.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
  const newDealer = {
    id: dealerId,
    name: inv.businessName,
    short: inv.businessName.split(' ').slice(0, 2).join(' '),
    region: inv.city + ' · ' + inv.province,
    avatar: initials,
    gradient: gradients[state.dealers.length % gradients.length],
    openPOs: 0,
    ytdVolume: 0,
    payStanding: 'current',
    tierId: inv.tierId,
    customMultiplier: inv.customMultiplier,
    joinedAt: new Date().toISOString().slice(0, 10)
  };
  state.dealers.push(newDealer);
  state.auditEvents.unshift({
    id: state.auditEvents.length + 1, kind: 'dealer.invite_accepted',
    actor: 'System (' + inv.contactName + ')', initials: 'SY',
    tenantId: 'northforge', scope: 'own', at: 'just now',
    target: inv.businessName, meta: 'Dealer onboarded · pricing tier locked'
  });
  toast(inv.businessName + ' accepted the invite — added to dealers');
  renderDealers();
}

/* ── Modal renderer ── */

function renderModal() {
  const root = document.getElementById('modal-root');
  if (!root) return;
  if (!state.inviteWizard.open) { root.innerHTML = ''; return; }

  const w = state.inviteWizard;
  const d = w.data;
  const stepLabels = ['Dealer info', 'Pricing & terms', 'Catalog access', 'Onboarding', 'Review & send'];

  let stepBody = '';
  if (w.step === 1) stepBody = renderWizStep1(d);
  else if (w.step === 2) stepBody = renderWizStep2(d);
  else if (w.step === 3) stepBody = renderWizStep3(d);
  else if (w.step === 4) stepBody = renderWizStep4(d);
  else if (w.step === 5) stepBody = renderWizStep5(d);

  const stepsHtml = stepLabels.map((label, idx) => {
    const n = idx + 1;
    const cls = w.step === n ? 'active' : w.step > n ? 'done' : '';
    return `
      <div class="wiz-step ${cls}">
        <div class="wiz-step-num">${w.step > n ? '✓' : n}</div>
        <div>${label}</div>
      </div>
    `;
  }).join('');

  root.innerHTML = `
    <div class="modal-overlay" onclick="if(event.target === this) closeWizard()">
      <div class="modal-card">
        <div class="modal-head">
          <div>
            <div class="modal-title">Invite a dealer</div>
            <div style="font-size:12.5px;color:var(--gl-text-mute);margin-top:3px">Step ${w.step} of 5 · ${stepLabels[w.step - 1]}</div>
          </div>
          <div style="flex:1"></div>
          <button class="modal-close" onclick="closeWizard()" title="Close">×</button>
        </div>

        <div class="modal-body">
          <div class="wiz-steps">${stepsHtml}</div>
          ${stepBody}
        </div>

        <div class="modal-foot">
          ${w.step > 1 ? `<button class="btn ghost" onclick="wizPrev()">← Back</button>` : ''}
          <div style="flex:1"></div>
          <button class="btn ghost" onclick="closeWizard()">Cancel</button>
          ${w.step < 5
            ? `<button class="btn primary" onclick="wizNext()">Next →</button>`
            : `<button class="btn primary" onclick="wizSendInvite()">📨 Send invite</button>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderWizStep1(d) {
  return `
    <div class="form-grid">
      <div class="form-field span2">
        <label class="form-label">Business name<span class="required">*</span></label>
        <input type="text" class="form-input" placeholder="e.g. Lakeside Windows &amp; Doors"
               value="${escapeHtml(d.businessName)}" oninput="wizSetField('businessName', this.value)" />
      </div>
      <div class="form-field">
        <label class="form-label">Owner / primary contact<span class="required">*</span></label>
        <input type="text" class="form-input" placeholder="Full name"
               value="${escapeHtml(d.contactName)}" oninput="wizSetField('contactName', this.value)" />
      </div>
      <div class="form-field">
        <label class="form-label">Contact email<span class="required">*</span></label>
        <input type="email" class="form-input" placeholder="owner@dealership.ca"
               value="${escapeHtml(d.contactEmail)}" oninput="wizSetField('contactEmail', this.value)" />
        <div class="form-help">The invite will be sent to this address.</div>
      </div>
      <div class="form-field">
        <label class="form-label">Phone</label>
        <input type="tel" class="form-input" placeholder="+1 (905) 555-0100"
               value="${escapeHtml(d.phone)}" oninput="wizSetField('phone', this.value)" />
      </div>
      <div class="form-field">
        <label class="form-label">City</label>
        <input type="text" class="form-input" placeholder="e.g. Oakville"
               value="${escapeHtml(d.city)}" oninput="wizSetField('city', this.value)" />
      </div>
      <div class="form-field">
        <label class="form-label">Province</label>
        <select class="form-select" onchange="wizSetField('province', this.value)">
          ${['ON','QC','BC','AB','MB','SK','NS','NB','NL','PE','YT','NT','NU'].map(p => `<option value="${p}" ${d.province === p ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
      </div>
      <div class="form-field">
        <label class="form-label">Estimated annual volume</label>
        <select class="form-select" onchange="wizSetField('annualVolumeEst', this.value)">
          <option value="under-50k" ${d.annualVolumeEst === 'under-50k' ? 'selected' : ''}>Under $50K</option>
          <option value="50k-100k" ${d.annualVolumeEst === '50k-100k' ? 'selected' : ''}>$50K – $100K</option>
          <option value="100k-250k" ${d.annualVolumeEst === '100k-250k' ? 'selected' : ''}>$100K – $250K</option>
          <option value="250k-500k" ${d.annualVolumeEst === '250k-500k' ? 'selected' : ''}>$250K – $500K</option>
          <option value="500k-1m" ${d.annualVolumeEst === '500k-1m' ? 'selected' : ''}>$500K – $1M</option>
          <option value="1m-plus" ${d.annualVolumeEst === '1m-plus' ? 'selected' : ''}>$1M+</option>
        </select>
        <div class="form-help">Helps us recommend the right tier.</div>
      </div>
      <div class="form-field">
        <label class="form-label">Customer segment</label>
        <select class="form-select" onchange="wizSetField('segment', this.value)">
          <option value="residential" ${d.segment === 'residential' ? 'selected' : ''}>Residential renovation</option>
          <option value="new-construction" ${d.segment === 'new-construction' ? 'selected' : ''}>New construction</option>
          <option value="multi-family" ${d.segment === 'multi-family' ? 'selected' : ''}>Multi-family / commercial</option>
          <option value="builder" ${d.segment === 'builder' ? 'selected' : ''}>Builder / contractor</option>
          <option value="mixed" ${d.segment === 'mixed' ? 'selected' : ''}>Mixed</option>
        </select>
      </div>
    </div>
  `;
}

function renderWizStep2(d) {
  const tiers = state.pricing.dealerTiers;
  const recommendedTier = d.annualVolumeEst === '1m-plus' ? 1 : d.annualVolumeEst === '500k-1m' ? 1 : d.annualVolumeEst === '250k-500k' ? 2 : d.annualVolumeEst === '100k-250k' ? 2 : d.annualVolumeEst === '50k-100k' ? 3 : 4;

  return `
    <div class="form-grid">
      <div class="form-field span2">
        <label class="form-label">Pricing tier</label>
        ${tiers.map(t => `
          <label class="form-check" style="margin-bottom:6px;${d.tierId === t.id ? 'border-color:var(--gl-text);background:rgba(15,23,42,0.04)' : ''}">
            <input type="radio" name="tier" ${d.tierId === t.id ? 'checked' : ''} onchange="wizSetField('tierId', ${t.id}); renderModal()" style="margin-top:3px;width:14px;height:14px" />
            <div class="form-check-content">
              <div class="form-check-title">${t.name} · ${(t.multiplier * 100).toFixed(0)}% of MSRP ${t.id === recommendedTier ? '<span style="color:var(--gl-success);font-weight:500;font-size:11px;margin-left:6px">⭐ Recommended for this volume</span>' : ''}</div>
              <div class="form-check-desc">${t.code} tier · dealer pays ${(t.multiplier * 100).toFixed(0)}% of list, factory keeps ${(40 / t.multiplier * 100).toFixed(0)}% of dealer revenue. Best for ${t.id === 1 ? 'high-volume premium dealers' : t.id === 2 ? 'standard active dealers' : t.id === 3 ? 'mid-volume new dealers' : 'low-volume or trial dealers'}.</div>
            </div>
          </label>
        `).join('')}
      </div>

      <div class="form-field span2">
        <label class="form-label">Custom multiplier override (optional)</label>
        <input type="number" class="form-input" step="0.01" min="0.20" max="0.95" placeholder="Leave blank to use tier default"
               value="${d.customMultiplier}" oninput="wizSetField('customMultiplier', this.value)" />
        <div class="form-help">If you've negotiated a special rate (e.g. 0.62 instead of 0.65), enter it here. Override applies on top of tier.</div>
      </div>

      <div class="form-field">
        <label class="form-label">Payment terms</label>
        <select class="form-select" onchange="wizSetField('paymentTerms', this.value)">
          ${['COD','Net 15','Net 30','Net 45','Net 60'].map(t => `<option value="${t}" ${d.paymentTerms === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>

      <div class="form-field">
        <label class="form-label">Credit limit</label>
        <input type="number" class="form-input" step="5000" min="0" placeholder="25000"
               value="${d.creditLimit}" oninput="wizSetField('creditLimit', parseInt(this.value, 10) || 0)" />
        <div class="form-help">Max outstanding A/R. Auto-hold orders past this.</div>
      </div>

      <div class="form-field">
        <label class="form-label">Currency</label>
        <select class="form-select" onchange="wizSetField('currency', this.value)">
          <option value="CAD" ${d.currency === 'CAD' ? 'selected' : ''}>CAD (Canadian Dollar)</option>
          <option value="USD" ${d.currency === 'USD' ? 'selected' : ''}>USD (US Dollar)</option>
        </select>
      </div>
    </div>
  `;
}

function renderWizStep3(d) {
  const cats = [
    { id: 'window', label: 'Windows', desc: 'Casement, awning, hung, slider, picture · 17 products' },
    { id: 'garage-door', label: 'Garage doors', desc: 'Steel, wood, aluminum-glass · 3 products' }
  ];
  return `
    <div style="margin-bottom:14px">
      <label class="form-label" style="margin-bottom:8px;display:block">Product categories this dealer can sell<span class="required">*</span></label>
      ${cats.map(c => `
        <label class="form-check" style="${d.categoryAccess.includes(c.id) ? 'border-color:var(--gl-text);background:rgba(15,23,42,0.04)' : ''}">
          <input type="checkbox" ${d.categoryAccess.includes(c.id) ? 'checked' : ''} onchange="wizToggleCategory('${c.id}')" />
          <div class="form-check-content">
            <div class="form-check-title">${c.label}</div>
            <div class="form-check-desc">${c.desc}</div>
          </div>
        </label>
      `).join('')}
    </div>

    <div class="form-grid">
      <div class="form-field span2">
        <label class="form-label">Lead time policy</label>
        <select class="form-select" onchange="wizSetField('leadTime', this.value)">
          <option value="standard" ${d.leadTime === 'standard' ? 'selected' : ''}>Standard (4–6 weeks)</option>
          <option value="priority" ${d.leadTime === 'priority' ? 'selected' : ''}>Priority (3–4 weeks, +5% surcharge)</option>
          <option value="rush" ${d.leadTime === 'rush' ? 'selected' : ''}>Rush eligible (15% surcharge, case-by-case)</option>
        </select>
      </div>
    </div>
  `;
}

function renderWizStep4(d) {
  return `
    <div style="margin-bottom:8px">
      <label class="form-label" style="display:block;margin-bottom:8px">Onboarding requirements</label>

      <label class="form-check">
        <input type="checkbox" ${d.sendDealerAgreement ? 'checked' : ''} onchange="wizSetField('sendDealerAgreement', this.checked); renderModal()" />
        <div class="form-check-content">
          <div class="form-check-title">📄 Send dealer agreement for e-signature</div>
          <div class="form-check-desc">Standard 12-page distributor agreement. Required before first order ships. Sent via DocuSign.</div>
        </div>
      </label>

      <label class="form-check">
        <input type="checkbox" ${d.requireCOI ? 'checked' : ''} onchange="wizSetField('requireCOI', this.checked); renderModal()" />
        <div class="form-check-content">
          <div class="form-check-title">🛡 Require Certificate of Insurance (COI)</div>
          <div class="form-check-desc">Dealer must provide $2M general liability + $5M product liability naming Northforge as additional insured. Auto-renewed annually.</div>
        </div>
      </label>

      <label class="form-check">
        <input type="checkbox" ${d.requireTraining ? 'checked' : ''} onchange="wizSetField('requireTraining', this.checked); renderModal()" />
        <div class="form-check-content">
          <div class="form-check-title">🎓 Require installer training certification</div>
          <div class="form-check-desc">At least one staff member completes the 2-day certification course before installs begin. Optional for supply-only dealers.</div>
        </div>
      </label>
    </div>

    <div class="form-grid full" style="margin-top:14px">
      <div class="form-field">
        <label class="form-label">Personal note (optional)</label>
        <textarea class="form-textarea" placeholder="Add a personal welcome message to the invite email..." oninput="wizSetField('personalNote', this.value)">${escapeHtml(d.personalNote)}</textarea>
        <div class="form-help">This will appear at the top of the invite email above the standard onboarding content.</div>
      </div>
    </div>
  `;
}

function renderWizStep5(d) {
  const tier = state.pricing.dealerTiers.find(t => t.id === d.tierId);
  const effM = d.customMultiplier ? parseFloat(d.customMultiplier) : (tier ? tier.multiplier : 0.65);
  const catLabels = { 'window': 'Windows', 'garage-door': 'Garage doors' };
  const cats = d.categoryAccess.map(c => catLabels[c]).join(', ');

  return `
    <div class="review-summary">
      <div class="review-section-title">Dealer information</div>
      <div class="review-row"><div class="review-row-label">Business</div><div class="review-row-value">${escapeHtml(d.businessName) || '<span style="color:var(--gl-text-faint)">—</span>'}</div></div>
      <div class="review-row"><div class="review-row-label">Contact</div><div class="review-row-value">${escapeHtml(d.contactName)} · ${escapeHtml(d.contactEmail)}${d.phone ? ' · ' + escapeHtml(d.phone) : ''}</div></div>
      <div class="review-row"><div class="review-row-label">Location</div><div class="review-row-value">${escapeHtml(d.city) || '—'}${d.city ? ', ' : ''}${d.province}</div></div>
      <div class="review-row"><div class="review-row-label">Volume / segment</div><div class="review-row-value">${d.annualVolumeEst.replace('-', ' – ').replace(/k/g, 'K').replace(/m/g, 'M')} · ${d.segment.replace('-', ' ')}</div></div>

      <div class="review-section-title">Pricing &amp; terms</div>
      <div class="review-row"><div class="review-row-label">Tier</div><div class="review-row-value">${tier ? tier.name + ' (' + (tier.multiplier * 100).toFixed(0) + '% of MSRP)' : '—'}</div></div>
      ${d.customMultiplier ? `<div class="review-row"><div class="review-row-label">Custom rate</div><div class="review-row-value" style="color:var(--gl-purple)">${(effM * 100).toFixed(1)}% override (${((1 - effM) * 100).toFixed(0)}% off MSRP)</div></div>` : ''}
      <div class="review-row"><div class="review-row-label">Terms</div><div class="review-row-value">${d.paymentTerms} · Credit limit ${fmtMoneyFull(d.creditLimit)} ${d.currency}</div></div>

      <div class="review-section-title">Catalog access</div>
      <div class="review-row"><div class="review-row-label">Categories</div><div class="review-row-value">${cats}</div></div>
      <div class="review-row"><div class="review-row-label">Lead time</div><div class="review-row-value">${d.leadTime.charAt(0).toUpperCase() + d.leadTime.slice(1)}</div></div>

      <div class="review-section-title">Onboarding</div>
      <div class="review-row">
        <div class="review-row-label">Required</div>
        <div class="review-row-value" style="font-size:12.5px">
          ${d.sendDealerAgreement ? '✓ Dealer agreement (e-sign)<br/>' : ''}
          ${d.requireCOI ? '✓ Certificate of Insurance<br/>' : ''}
          ${d.requireTraining ? '✓ Installer training certification' : ''}
          ${!d.sendDealerAgreement && !d.requireCOI && !d.requireTraining ? '<span style="color:var(--gl-text-faint)">No onboarding requirements set</span>' : ''}
        </div>
      </div>
    </div>

    <div class="review-section-title" style="border:0.5px solid var(--gl-border);border-radius:var(--gl-radius-card) var(--gl-radius-card) 0 0;background:rgba(248,250,252,0.5);padding-top:13px">Email preview</div>
    <div class="email-preview" style="border-radius:0 0 var(--gl-radius-card) var(--gl-radius-card);border-top:0">
      <div class="email-meta">
        <div class="email-meta-label">From</div>
        <div class="email-meta-value">${state.factory ? state.factory.name : 'Northforge Windows'} &lt;onboarding@northforge.demo&gt;</div>
        <div class="email-meta-label">To</div>
        <div class="email-meta-value">${escapeHtml(d.contactEmail) || 'dealer@example.com'}</div>
        <div class="email-meta-label">Subject</div>
        <div class="email-meta-value">You're invited to join ${state.factory ? state.factory.name : 'Northforge Windows'} as a dealer</div>
      </div>
      <div class="email-body">
        <p>Hi ${escapeHtml(d.contactName) || 'there'},</p>
        ${d.personalNote ? `<p style="padding:10px 14px;background:rgba(15,23,42,0.04);border-left:3px solid var(--gl-text);border-radius:0 0;font-style:italic">${escapeHtml(d.personalNote).replace(/\n/g, '<br/>')}</p>` : ''}
        <p>${state.user.name} at <strong>${state.factory ? state.factory.name : 'Northforge'}</strong> has invited <strong>${escapeHtml(d.businessName) || 'your business'}</strong> to join our dealer network on OpenSpec — our online configurator, ordering, and order-tracking platform.</p>
        <p>Your account is pre-configured with:</p>
        <p style="margin-left:14px">
          • Pricing: <strong>${tier ? tier.name : 'Tier'}${d.customMultiplier ? ' (custom rate ' + (effM * 100).toFixed(1) + '%)' : ''}</strong><br/>
          • Catalog: <strong>${cats}</strong><br/>
          • Terms: <strong>${d.paymentTerms}</strong> · credit limit ${fmtMoneyFull(d.creditLimit)} ${d.currency}
        </p>
        <p><a href="#" class="email-cta">Accept invite &amp; activate account →</a></p>
        <p>This invite expires in 14 days. ${(d.sendDealerAgreement || d.requireCOI || d.requireTraining) ? 'Once you accept, we\'ll send the next steps for' + [d.sendDealerAgreement && ' the dealer agreement (e-signature)', d.requireCOI && ' your Certificate of Insurance', d.requireTraining && ' installer training enrollment'].filter(Boolean).join(',') + '.' : ''}</p>
        <p style="font-size:12px;color:var(--gl-text-mute);margin-top:18px">If this invite reached you in error, you can safely ignore it.</p>
      </div>
    </div>

    <div style="padding:12px 14px;background:var(--gl-info-bg);border:0.5px solid rgba(30,64,175,0.20);border-radius:var(--gl-radius-card);font-size:12.5px;color:var(--gl-info);line-height:1.55">
      <strong>What happens after you click Send:</strong>
      <ol style="margin:6px 0 0;padding-left:18px;color:var(--gl-text)">
        <li>Email is sent to ${escapeHtml(d.contactEmail) || 'their inbox'} with the activation link</li>
        <li>An entry appears in your <strong>Pending invitations</strong> panel (Dealers view) with status <em>Awaiting</em></li>
        <li>When ${d.contactName ? escapeHtml(d.contactName) : 'they'} clicks the link, they'll set their password and complete onboarding</li>
        <li>${d.sendDealerAgreement ? 'DocuSign sends the dealer agreement; ' : ''}${d.requireCOI ? 'they upload their COI; ' : ''}they're added to your active dealers list</li>
        <li>You can <strong>resend</strong> a reminder, <strong>cancel</strong> the invite, or check status anytime from the Dealers view</li>
      </ol>
    </div>
  `;
}

/* ── Pending invitations panel for Dealers view ── */

function renderPendingInvitesPanel() {
  const inv = state.pendingInvites;
  if (inv.length === 0) return '';

  const visible = inv.filter(i => i.status !== 'accepted');
  if (visible.length === 0) return '';

  const rows = visible.map(i => {
    const tier = state.pricing.dealerTiers.find(t => t.id === i.tierId);
    const daysLeft = Math.max(0, Math.floor((new Date(i.expiresAt) - Date.now()) / 86400000));
    const statusLabel = {
      'awaiting': '⏳ Awaiting accept',
      'accepted': '✓ Accepted',
      'expired': '⌛ Expired',
      'cancelled': '○ Cancelled'
    }[i.status];
    const iconChar = { 'awaiting': '↗', 'accepted': '✓', 'expired': '⌛', 'cancelled': '○' }[i.status];

    let actions = '';
    if (i.status === 'awaiting') {
      actions = `
        <button class="btn ghost sm" onclick="resendInvite('${i.id}')" title="Send a reminder email">📨 Resend${i.remindersSent > 0 ? ' (' + i.remindersSent + ')' : ''}</button>
        <button class="btn ghost sm" onclick="simulateAccept('${i.id}')" title="Demo: simulate the dealer accepting" style="color:var(--gl-success)">✓ Simulate accept</button>
        <button class="btn ghost sm" onclick="cancelInvite('${i.id}')" title="Cancel this invite" style="color:var(--gl-danger)">✕ Cancel</button>
      `;
    } else if (i.status === 'expired') {
      actions = `
        <button class="btn primary sm" onclick="resendInvite('${i.id}')" title="Resend with new 14-day expiry">🔄 Resend</button>
        <button class="btn ghost sm" onclick="cancelInvite('${i.id}')">Remove</button>
      `;
    } else if (i.status === 'cancelled') {
      actions = `<span style="font-size:11.5px;color:var(--gl-text-faint)">No further action</span>`;
    }

    return `
      <div class="pending-row">
        <div class="pending-icon ${i.status}">${iconChar}</div>
        <div>
          <div class="pending-business">${escapeHtml(i.businessName)}</div>
          <div class="pending-contact">${escapeHtml(i.contactName)} · ${escapeHtml(i.contactEmail)} · ${escapeHtml(i.city)}, ${i.province}</div>
        </div>
        <div style="font-size:11.5px"><div style="font-weight:500">${tier ? tier.code + ' tier' : '—'}</div><div style="color:var(--gl-text-mute);margin-top:2px">${i.paymentTerms}</div></div>
        <div><span class="pending-status ${i.status}">${statusLabel}</span></div>
        <div style="font-size:11.5px;color:var(--gl-text-mute)">
          Sent ${fmtDate(i.sentAt)}
          ${i.status === 'awaiting' ? `<br/><span style="color:${daysLeft <= 3 ? 'var(--gl-warn)' : 'var(--gl-text-mute)'}">${daysLeft}d until expiry</span>` : ''}
          ${i.remindersSent > 0 ? `<br/><span style="color:var(--gl-text-faint)">${i.remindersSent} reminder${i.remindersSent === 1 ? '' : 's'} sent</span>` : ''}
        </div>
        <div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap">${actions}</div>
      </div>
    `;
  }).join('');

  const awaitingCount = inv.filter(i => i.status === 'awaiting').length;
  const expiredCount = inv.filter(i => i.status === 'expired').length;

  return `
    <div class="pending-invites">
      <div class="pending-head">
        <span>📨 Pending invitations</span>
        <span style="color:var(--gl-text);font-weight:500;text-transform:none;letter-spacing:0">
          ${awaitingCount} awaiting${expiredCount > 0 ? ` · <span style="color:var(--gl-warn)">${expiredCount} expired</span>` : ''}
        </span>
      </div>
      ${rows}
    </div>
  `;
}



/* ════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════ */

document.querySelectorAll('.nav-item').forEach(b => {
  b.addEventListener('click', () => switchView(b.dataset.view));
});

$('darkToggle').addEventListener('click', toggleDark);

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Cmd+K / Ctrl+K — open global search
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openGlobalSearch();
    return;
  }
  // Cmd+B — toggle notification panel
  if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
    e.preventDefault();
    toggleNotifPanel();
    return;
  }
  // Cmd+1..9 — jump to nav items
  if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
    const navItems = ['dashboard', 'quotes', 'production', 'catalog', 'materials', 'pricing', 'financials', 'dealers', 'audit'];
    const idx = parseInt(e.key, 10) - 1;
    if (navItems[idx]) {
      e.preventDefault();
      switchView(navItems[idx]);
    }
    return;
  }
  // ? — show keyboard shortcuts help
  if (e.key === '?' && !e.target.matches('input, textarea, select')) {
    e.preventDefault();
    showKeyboardShortcuts();
  }
});

// Seed an in-production substage on production-status orders for variety.
// Real production data would override this; the substage is owner-editable.
(function seedProdStages() {
  const choices = ['materials','cutting','welding','assembly','assembly','igu','hardware','final'];
  state.orders.forEach((o, i) => {
    if (o.status === 'production' && !o.prodStage) {
      o.prodStage = choices[i % choices.length];
    }
  });
})();

// Seed dealer-side PO references on every order so the order detail can
// show BOTH the dealer's reference number and the factory's internal one.
// Format: <dealer-prefix>-2024-<seq>
// Seed productType on every order. Windows are the default; a handful of
// production-floor orders get reclassified as entry doors or patio doors so
// the Production tab's three subtabs (windows/doors/patio) have content.
// Real schema: orders carry productType from the configurator at quote time.
/* ═══════════════════════════════════════════════════════════════════
   Bulk seed: brings the order book up to 100 active orders distributed
   across every stage of the factory. Generated programmatically so we
   get a wide spread of dealer mixes, ship-by dates, unit counts, and
   values without hand-coding 60 individual JSON blobs. Also seeds:
     - 12 additional holds (supplier, dealer, qc, installer, machine)
     - 5 additional rush requests (pending approval)
     - audit events for the seeded changes
   ═══════════════════════════════════════════════════════════════════ */
(function seedExtraOrders() {
  if (state._seededExtraOrders) return;
  state._seededExtraOrders = true;

  // PRNG with fixed seed so every reload produces the same seeded data
  let _seed = 8421;
  const rand = () => {
    _seed = (_seed * 9301 + 49297) % 233280;
    return _seed / 233280;
  };
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const pickN = (arr, n) => {
    const copy = arr.slice();
    const out = [];
    for (let i = 0; i < n && copy.length; i++) {
      out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
    }
    return out;
  };
  const range = (lo, hi) => Math.floor(rand() * (hi - lo + 1)) + lo;
  const offsetDate = (baseIso, days) => {
    const d = new Date(baseIso);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const TODAY = '2026-05-12';
  const dealers = ['maple', 'sunrise', 'coastline', 'bayview', 'northern', 'oakridge'];
  const projectAdjectives = ['Riverside', 'Lakeview', 'Highland', 'Maple', 'Cedar', 'Pine', 'Birchwood',
    'Stonebridge', 'Heritage', 'Westshore', 'Bayside', 'Crestwood', 'Hartwood', 'Glenview',
    'Forestglen', 'Pinecrest', 'Atwater', 'Sunset', 'Lakefront', 'Cornerstone', 'Brookside',
    'Aspen', 'Silver Birch', 'Marina', 'Greenfield', 'Highpark', 'Eastwood', 'Northgate',
    'Maplewood', 'Hartford', 'Whitepine', 'Spring Valley', 'Oakhaven', 'Stonefield', 'Riverbend',
    'Cliffside', 'Meadowbrook', 'Ironwood', 'Westmount', 'Bayshore', 'Lakeshore', 'Hillcrest'];
  const projectNouns = ['Heights', 'Estate', 'Reno', 'Build', 'Place', 'Manor', 'Court',
    'Townhomes', 'Custom', 'Cove', 'Residence', 'Lofts', 'Square', 'Towers Ph 2',
    'Phase 3', 'Village', 'Terrace', 'Project', 'Crossing', 'Commons', 'Renovation',
    'Retreat', 'Build-out', 'Addition'];

  const windowMixes = [
    [{ name: 'Casement', countRatio: 0.5 }, { name: 'Double-hung', countRatio: 0.3 }, { name: 'Picture', countRatio: 0.2 }],
    [{ name: 'Casement', countRatio: 0.6 }, { name: 'Awning', countRatio: 0.4 }],
    [{ name: 'Double-hung', countRatio: 0.7 }, { name: 'Picture', countRatio: 0.3 }],
    [{ name: 'Casement', countRatio: 0.4 }, { name: 'Sliding', countRatio: 0.3 }, { name: 'Picture', countRatio: 0.3 }],
    [{ name: 'Sliding', countRatio: 0.6 }, { name: 'Picture', countRatio: 0.4 }],
    [{ name: 'Casement', countRatio: 0.5 }, { name: 'Awning', countRatio: 0.25 }, { name: 'Picture', countRatio: 0.25 }],
    [{ name: 'Tilt-turn', countRatio: 0.7 }, { name: 'Picture', countRatio: 0.3 }],
    [{ name: 'Casement', countRatio: 1.0 }],
    [{ name: 'Double-hung', countRatio: 1.0 }]
  ];

  // Distribute 58 new orders across stages (existing 42 + 58 = 100)
  //   new        12   - submitted POs awaiting acknowledgement
  //   ack         8   - acknowledged, drawings not yet released
  //   drawings    7   - in drawing review/approval
  //   production 15   - on the factory floor (spread across 7 substages)
  //   qc          6   - in QC inspection
  //   ready       4   - cleared QC, awaiting pickup
  //   shipped     4   - in transit
  //   delivered   2   - delivered, awaiting payment
  //   paid        0   - skip
  const distribution = [
    { status: 'new',        count: 12 },
    { status: 'ack',        count:  8 },
    { status: 'drawings',   count:  7 },
    { status: 'production', count: 15 },
    { status: 'qc',         count:  6 },
    { status: 'ready',      count:  4 },
    { status: 'shipped',    count:  4 },
    { status: 'delivered',  count:  2 }
  ];

  let nextId = 2500;
  const newOrders = [];

  distribution.forEach(bucket => {
    for (let i = 0; i < bucket.count; i++) {
      const dealerId = pick(dealers);
      const dealerPrefix = { maple: 'MS', sunrise: 'SW', coastline: 'CB', bayview: 'BV', northern: 'NL', oakridge: 'OR' }[dealerId];

      // Project name
      const adj = pick(projectAdjectives);
      const noun = pick(projectNouns);
      const project = `${adj} ${noun}`;

      // Units + unit-cost spread — windows average $1,300-$1,800 each
      const units = range(4, 38);
      const avgUnitCost = range(1100, 2000);
      const value = Math.round(units * avgUnitCost / 100) * 100;

      // Ship-by date — pick a spread relative to today.
      // Some past (late), some near-term, some farther out.
      let shipOffset;
      if (bucket.status === 'delivered' || bucket.status === 'shipped') {
        shipOffset = range(-10, 2);   // delivered/shipped tend to have passed their ship-by
      } else if (bucket.status === 'ready') {
        shipOffset = range(-4, 6);    // ready cards mix late + on-time
      } else if (bucket.status === 'qc' || bucket.status === 'production') {
        shipOffset = range(-8, 14);   // production has many late orders
      } else if (bucket.status === 'new') {
        shipOffset = range(8, 38);    // fresh POs ship farther out
      } else {
        shipOffset = range(-2, 24);   // ack + drawings: mostly future
      }
      const shipBy = offsetDate(TODAY, shipOffset);

      // Submitted-at: 10-45 days before today depending on stage
      const submittedDays = bucket.status === 'new' ? range(0, 4)
                          : bucket.status === 'ack' ? range(2, 8)
                          : bucket.status === 'drawings' ? range(4, 12)
                          : bucket.status === 'production' ? range(10, 30)
                          : bucket.status === 'qc' ? range(18, 36)
                          : bucket.status === 'ready' ? range(24, 40)
                          : range(28, 50);
      const submittedAt = offsetDate(TODAY, -submittedDays);

      // Milestones flip-on cumulatively as the order moves forward
      const milestoneIdx = {
        new: 0, ack: 1, drawings: 2, production: 3, qc: 4,
        ready: 5, shipped: 5, delivered: 5, paid: 5
      }[bucket.status];
      const milestones = {
        ack:        milestoneIdx >= 1,
        drawings:   milestoneIdx >= 2,
        production: milestoneIdx >= 3,
        qc:         milestoneIdx >= 4,
        shipped:    milestoneIdx >= 5
      };

      // For production orders: pick a substage so the kanban spreads across columns
      let prodStage = null;
      if (bucket.status === 'production') {
        const subList = WINDOW_PROD_SUBSTAGES.map(s => s.id);
        prodStage = subList[i % subList.length];
      }

      // For QC orders: pick an inspection substage so the QC kanban spreads
      let qcStage = null;
      if (bucket.status === 'qc') {
        const qcList = ['awaiting', 'inspecting', 'rework', 'passed'];
        qcStage = qcList[i % qcList.length];
      }

      // Unit breakdown — pick a mix and split the units accordingly
      const mix = pick(windowMixes);
      const unitBreakdown = mix.map((m, idx) => {
        const c = idx === mix.length - 1
          ? units - mix.slice(0, idx).reduce((a, x) => a + Math.max(1, Math.round(units * x.countRatio)), 0)
          : Math.max(1, Math.round(units * m.countRatio));
        return { name: m.name, count: Math.max(1, c), price: Math.round(c * avgUnitCost / 50) * 50 };
      }).filter(x => x.count > 0);

      // Drawing record
      const drawingStatus = bucket.status === 'new' ? 'pending'
                          : bucket.status === 'ack' ? 'pending'
                          : bucket.status === 'drawings' ? 'in-review'
                          : 'approved';
      const drawings = [{ id: 'pkg-v1', name: `Drawing pkg v1 · ${units} units`, status: drawingStatus }];

      // Thread — at minimum the dealer submission, plus stage-appropriate
      // factory replies. Time strings stay simple.
      const dealerNames = {
        maple:    { name: 'Rafi B.',    initials: 'MS' },
        sunrise:  { name: 'Tara F.',    initials: 'SW' },
        coastline:{ name: 'Daniel K.',  initials: 'CB' },
        bayview:  { name: 'Mark D.',    initials: 'BV' },
        northern: { name: 'Karen S.',   initials: 'NL' },
        oakridge: { name: 'Priya V.',   initials: 'OR' }
      }[dealerId];
      const thread = [
        {
          from: 'dealer',
          name: dealerNames.name,
          initials: dealerNames.initials,
          time: submittedDays === 0 ? 'today' : submittedDays + 'd ago',
          body: `Submitting PO for ${project}. ${units} unit ${mix.map(m=>m.name).join('/')} mix. Need ship by ${shipBy.slice(5)}.`
        }
      ];
      if (milestoneIdx >= 1) {
        thread.push({
          from: 'system', name: 'OpenSpec', initials: 'OS',
          time: (submittedDays - 1) + 'd ago',
          body: 'PO acknowledged by Northforge.'
        });
      }
      if (milestoneIdx >= 3) {
        thread.push({
          from: 'factory', name: 'Marcus H.', initials: 'NF',
          time: range(2, 8) + 'd ago',
          body: 'Production started — materials staged, first cuts queued.'
        });
      }
      if (milestoneIdx >= 5) {
        thread.push({
          from: 'factory', name: 'Jules T.', initials: 'NF',
          time: range(1, 6) + 'd ago',
          body: 'Shipped via carrier. BOL on file.'
        });
      }

      const id = nextId++;
      const order = {
        id: id,
        po: 'O-' + id,
        dealerId: dealerId,
        dealerPO: `${dealerPrefix}-2024-${(id - 2000).toString().padStart(3, '0')}`,
        project: project,
        units: units,
        value: value,
        shipBy: shipBy,
        submittedAt: submittedAt,
        status: bucket.status,
        productType: 'window',
        milestones: milestones,
        unitBreakdown: unitBreakdown,
        drawings: drawings,
        thread: thread
      };
      if (prodStage) order.prodStage = prodStage;
      if (qcStage) order.qcStage = qcStage;
      if (bucket.status === 'shipped' || bucket.status === 'delivered') {
        order.tracking = 'BL-' + (40000 + id);
        order.pickedUpAt = offsetDate(TODAY, -range(2, 8)) + 'T08:00:00';
      }
      if (bucket.status === 'delivered') {
        order.deliveredAt = offsetDate(TODAY, -range(1, 4));
      }
      newOrders.push(order);
    }
  });

  // Splice in. Put new orders BEFORE the existing ones so they sort sensibly
  // in default lists, but the kanban groups by status anyway so the order
  // within a status column is mostly arbitrary.
  state.orders = newOrders.concat(state.orders);

  // ─── Seed extra holds on a sample of the new orders ───
  // Pick orders spread across stages and add appropriate hold types.
  const holdSeeds = [
    { stage: 'drawings', blocker: 'dealer',   reason: 'Awaiting elevation approval on 6 picture units · revision V2 sent May 9',                       chase: 'Maple Street · Rafi B.',     days: 3 },
    { stage: 'drawings', blocker: 'dealer',   reason: 'Architect requested glass option change · need confirmation',                                    chase: 'Coastline · Daniel K.',      days: 2 },
    { stage: 'production', blocker: 'supplier', reason: 'Black laminate sash extrusion shortage · supplier ETA May 16',                                  chase: 'Royal Group · Anna W.',      days: 4 },
    { stage: 'production', blocker: 'supplier', reason: 'Cardinal IGU shipment delayed at border · clearance Wed',                                       chase: 'Cardinal Glass · Mike R.',   days: 2 },
    { stage: 'production', blocker: 'machine',  reason: 'CNC #2 spindle bearing replacement · service call booked',                                      chase: 'Marcus Hill · Production',   days: 1 },
    { stage: 'production', blocker: 'qc',       reason: 'Frame welding line audit in progress · 3 units pulled for inspection',                          chase: 'Dave Pereira · QC lead',     days: 1 },
    { stage: 'qc',         blocker: 'qc',       reason: 'Sealant cure time extended due to humidity · 18 units in extended dwell',                       chase: 'Dave Pereira · QC lead',     days: 2 },
    { stage: 'qc',         blocker: 'dealer',   reason: 'Dealer requested hardware finish change post-production · costing TBD',                         chase: 'Sunrise · Tara F.',          days: 3 },
    { stage: 'ready',      blocker: 'installer',reason: 'Installer crew double-booked · pickup pushed to next week',                                     chase: 'Apex Installs · Marco T.',   days: 2 },
    { stage: 'ready',      blocker: 'carrier',  reason: 'Carrier truck broke down · alternate pickup arranged for Friday',                               chase: 'Day & Ross · dispatch',      days: 1 },
    { stage: 'shipped',    blocker: 'customer', reason: 'Customer requested delivery hold · awaiting site readiness confirmation',                       chase: 'Bayview · Mark D.',          days: 2 },
    { stage: 'production', blocker: 'supplier', reason: 'Bronze cap stock on backorder again · partial qty in transit',                                  chase: 'VEKA Canada · Lisa T.',      days: 3 }
  ];

  // Pick target orders by stage and stamp the hold
  state.holds = state.holds || [];
  const usedOrderIds = new Set(state.holds.map(h => h.orderId));
  let holdCounter = (state.holds.length || 0) + 1;
  holdSeeds.forEach(seed => {
    const candidates = state.orders.filter(o =>
      o.status === seed.stage && !usedOrderIds.has(o.id)
    );
    if (candidates.length === 0) return;
    const target = candidates[Math.floor(rand() * candidates.length)];
    usedOrderIds.add(target.id);
    const stageLabel = ({
      drawings: 'Drawing review', production: 'Production',
      qc: 'QC inspection', ready: 'Ready to ship', shipped: 'In transit'
    })[seed.stage] || seed.stage;
    state.holds.push({
      id: 'hold-' + String(100 + holdCounter++).padStart(3, '0'),
      date: TODAY,
      orderId: target.id,
      stage: seed.stage,
      stageLabel: stageLabel,
      blocker: seed.blocker,
      followUp: seed.chase,
      reason: seed.reason,
      daysOnHold: seed.days
    });
  });

  // ─── Seed extra rush requests pending approval ───
  state.rushRequests = state.rushRequests || [];
  const rushSeeds = [
    { reason: 'Site framing crew arriving Mon — need delivery Friday to avoid carrying costs', priority: 1, urgent: true },
    { reason: 'Customer relocating — closing date moved up 2 weeks', priority: 2 },
    { reason: 'Original install date pushed by GC — now need earlier ship', priority: 2 },
    { reason: 'Warranty replacement — original delivery hit by carrier damage', priority: 1, urgent: true },
    { reason: 'Show home walkthrough scheduled — appearance pieces only', priority: 3 }
  ];
  const rushCandidates = state.orders.filter(o =>
    ['ack', 'drawings', 'production'].includes(o.status) &&
    !state.rushRequests.some(r => r.orderId === o.id)
  );
  let rushId = (state.rushRequests.length || 0) + 1;
  rushSeeds.forEach((rs, idx) => {
    if (idx >= rushCandidates.length) return;
    const target = rushCandidates[idx * 3 % rushCandidates.length];
    const dealerNames = {
      maple: 'Rafi B. · Maple Street', sunrise: 'Tara F. · Sunrise Windows',
      coastline: 'Daniel K. · Coastline Builders', bayview: 'Mark D. · Bayview Construction',
      northern: 'Karen S. · Northern Light', oakridge: 'Priya V. · Oakridge Custom'
    };
    state.rushRequests.push({
      id: rushId++,
      orderId: target.id,
      status: 'REQUESTED',
      requestedAt: offsetDate(TODAY, -range(1, 4)),
      requestedBy: dealerNames[target.dealerId] || 'Dealer',
      priority: rs.priority,
      reason: rs.reason,
      urgent: !!rs.urgent
    });
  });

  // ─── Seed a handful of audit events for the new activity ───
  state.auditEvents = state.auditEvents || [];
  let auditId = (state.auditEvents.length || 0) + 1;
  newOrders.slice(0, 20).forEach((o, idx) => {
    const stageTransitions = [
      { kind: 'order.created',       meta: o.units + ' units · ' + (o.value ? '$' + o.value.toLocaleString() : '—'), at: idx + 1 + 'd ago' },
      { kind: 'order.acknowledged',  meta: 'FO# auto-assigned',                                                       at: idx + 2 + 'd ago' },
      { kind: 'order.production_started', meta: 'Materials staged · cutting queued',                                  at: idx + 3 + 'd ago' }
    ];
    const milestoneIdx = { new:0, ack:1, drawings:2, production:3, qc:4, ready:5, shipped:5, delivered:5 }[o.status];
    for (let s = 0; s <= Math.min(milestoneIdx, stageTransitions.length - 1); s++) {
      const t = stageTransitions[s];
      state.auditEvents.unshift({
        id: auditId++,
        kind: t.kind,
        actor: ['Sam Chen', 'Marcus Hill', 'Priya Nair', 'Dave Pereira'][s % 4],
        initials: ['SC', 'MH', 'PN', 'DP'][s % 4],
        tenantId: 'northforge',
        scope: 'own',
        at: t.at,
        target: o.po,
        meta: t.meta
      });
    }
  });
})();

(function seedProductTypes() {
  // Platform is windows-only. Force every order — including any with
  // legacy door/patio types — back to window so production substage
  // routing and card rendering stay consistent.
  state.orders.forEach(o => {
    o.productType = 'window';
    // If mid-production, make sure prodStage is a valid window substage
    if (o.status === 'production' && WINDOW_PROD_SUBSTAGES && !WINDOW_PROD_SUBSTAGES.some(s => s.id === o.prodStage)) {
      o.prodStage = 'materials';
    }
  });
})();

(function seedDealerPONumbers() {
  const prefixes = { maple: 'MS', sunrise: 'SW', coastline: 'CB', bayview: 'BV', northern: 'NL', oakridge: 'OR' };
  state.orders.forEach(o => {
    if (!o.dealerPO) {
      const prefix = prefixes[o.dealerId] || 'DLR';
      o.dealerPO = `${prefix}-2024-${(o.id - 2000).toString().padStart(3, '0')}`;
    }
    // Factory order number — internal reference assigned at acknowledge
    if (!o.factoryOrderNumber && o.status !== 'new') {
      o.factoryOrderNumber = `FO-${(10000 + o.id).toString()}`;
    }
    // Estimated time of completion — set on acknowledge; for already-acked
    // orders in the seed, just back-fill from shipBy minus a small buffer
    if (!o.etc && o.status !== 'new' && o.shipBy) {
      const ship = new Date(o.shipBy);
      ship.setDate(ship.getDate() - 2); // QC + buffer before ship
      o.etc = ship.toISOString().slice(0, 10);
    }
  });
})();

// Seed the QC tab with a representative spread across its 4 substages.
// Pulls a handful of orders out of production/ready so QC has data on first load.
(function seedQCOrders() {
  const promotions = [
    // O-2408 Hartwood Custom — awaiting inspection
    { po: 'O-2408', qcStage: 'awaiting', inspector: 'dave' },
    // O-2417 Crestwood Heights — currently being inspected, 12 of 16 passed
    { po: 'O-2417', qcStage: 'inspecting', inspector: 'dave', qcPassed: 12, qcStartedAt: '2026-05-12T09:30:00Z' },
    // O-2438 Glenview Court — failed; 3 units flagged for rework
    { po: 'O-2438', qcStage: 'rework', inspector: 'dave', qcDeficiencies: [
      { units: 3, kind: 'glass-scratch', note: 'Surface scratches on inside pane · re-glaze 3 picture units' }
    ]},
    // O-2421 Glenview Townhomes — failed; sealant defects
    { po: 'O-2421', qcStage: 'rework', inspector: 'dave', qcDeficiencies: [
      { units: 2, kind: 'sealant', note: 'Bead inconsistent on weather lip · re-apply sealant on 2 sash sets' }
    ]},
    // O-2414 Forestglen Custom — passed, ready to push to ship pipeline
    { po: 'O-2414', qcStage: 'passed', inspector: 'dave', qcPassed: 9 }
  ];
  promotions.forEach(p => {
    const o = state.orders.find(x => x.po === p.po);
    if (o) {
      o.status = 'qc';
      o.qcStage = p.qcStage;
      o.qcInspector = p.inspector;
      if (p.qcPassed != null) o.qcPassed = p.qcPassed;
      if (p.qcDeficiencies) o.qcDeficiencies = p.qcDeficiencies;
      if (p.qcStartedAt) o.qcStartedAt = p.qcStartedAt;
      // Milestones: production done, qc still in progress
      o.milestones = o.milestones || {};
      o.milestones.production = true;
      o.milestones.qc = p.qcStage === 'passed';
      // Clear prodStage now that the order has left the production floor
      delete o.prodStage;
    }
  });
})();

// Seed outbound shipping fields (carrier, tracking, BOL, dock door) on
// orders at ready / shipped / delivered status. Real data would come
// from the WMS or carrier integration; for demo we generate plausible refs.
// Backdate shipBy on a handful of orders so every stage in the Overview
// kanban has overdue activity. Calendar's today is 2026-05-12; pushing
// these dates past it makes them surface as overdue without inventing
// new orders. Real data would have a natural mix; the demo balances it.
(function seedOverdueAcrossStages() {
  const overdueBackdates = [
    // New POs — pull one back 4 days
    { po: 'O-2410', newShipBy: '2026-05-08' },     // Riverside Heights · 4d late
    // Acknowledged — pull two back
    { po: 'O-2435', newShipBy: '2026-05-09' },     // Heritage Square · 3d late
    { po: 'O-2419', newShipBy: '2026-05-06' },     // Birchwood Doors Reno · 6d late
    // Ready to ship — pull two back so the dock has known late loads
    { po: 'O-2406', newShipBy: '2026-05-08' },     // Aspen Grove · 4d late
    { po: 'O-2412', newShipBy: '2026-05-10' }      // Glenbrook Estate · 2d late
  ];
  overdueBackdates.forEach(b => {
    const o = state.orders.find(x => x.po === b.po);
    if (o) o.shipBy = b.newShipBy;
  });
})();

(function seedShippingFields() {
  const carriers = [
    { id: 'day-ross',   name: 'Day & Ross',   logo: 'DR', color: '#0EA5E9' },
    { id: 'manitoulin', name: 'Manitoulin',   logo: 'MT', color: '#7C3AED' },
    { id: 'old-dom',    name: 'Old Dominion', logo: 'OD', color: '#0F766E' },
    { id: 'midland',    name: 'Midland',      logo: 'MD', color: '#9333EA' },
    { id: 'kindersley', name: 'Kindersley',   logo: 'KT', color: '#D97706' }
  ];
  let carrierIdx = 0;
  state.orders.forEach((o, i) => {
    if (['ready','shipped','delivered','paid'].includes(o.status) && !o.carrier) {
      const c = carriers[carrierIdx % carriers.length];
      carrierIdx++;
      o.carrier = c;
      o.bolNumber = 'BOL-' + (820000 + o.id).toString();
      o.trackingNumber = c.logo + '-' + (1000000 + o.id * 7).toString();
      // Dock door for ready/shipped
      if (['ready','shipped'].includes(o.status)) {
        o.dockDoor = 'D-' + ((i % 6) + 1).toString().padStart(2, '0');
      }
      // Pallet count — rough estimate based on units
      o.palletCount = Math.max(1, Math.ceil(o.units / 8));
      // Pickup / delivery times
      if (o.status === 'shipped') {
        o.pickedUpAt = '2026-05-1' + ((i % 2) + 1) + 'T' + (8 + (i % 6)) + ':30:00Z';
        o.eta = o.shipBy;
      } else if (o.status === 'delivered' || o.status === 'paid') {
        o.pickedUpAt = '2026-05-0' + (3 + (i % 6)) + 'T07:00:00Z';
        o.deliveredAt = o.shipBy;
      }
    }
  });
})();

// Seed inbound receiving fields (dock door, ASN/PRO, expected pallet count)
// on purchase orders. POs in-transit get a dock assignment for arrival.
(function seedReceivingFields() {
  state.purchaseOrders.forEach((po, i) => {
    if (!po.asn) po.asn = 'ASN-' + (po.id || '').replace(/[^0-9]/g, '') + '-' + ((i % 9) + 1);
    if (!po.proNumber) po.proNumber = 'PRO-' + (700000 + i * 13).toString();
    if (!po.totalQty) po.totalQty = (po.lineItems || []).reduce((s, li) => s + li.qty, 0);
    if (!po.totalCost) po.totalCost = (po.lineItems || []).reduce((s, li) => s + li.qty * li.unitCost, 0);
    if (!po.palletCount) po.palletCount = Math.max(1, Math.ceil(po.totalQty / 240));
    if (po.status === 'in-transit' && !po.dockDoor) {
      po.dockDoor = 'D-R' + ((i % 4) + 1).toString().padStart(2, '0');
    }
    // ETA window — for in-transit POs, parse expectedAt and compute days from today
    if (po.expectedAt) {
      const today = new Date(state.calendarDate || '2026-05-12');
      const exp = new Date(po.expectedAt);
      po.etaDays = Math.round((exp - today) / (1000 * 60 * 60 * 24));
    }
  });
})();

renderDashboard();
renderQuotes();
renderProduction();
renderPipeline();
renderEstimates();
renderQC();
renderShipping();
renderCatalog();
renderMaterials();
renderPricing();
renderFinancials();
renderDealers();
renderAudit();
renderSettings();

// Initial badge state
updateNotifBadge();
