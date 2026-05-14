export const FACTORIES = [
  { key: 'northforge', name: 'NorthForge Windows', region: 'Hamilton, ON', desc: 'Vinyl & fiberglass window specialist. Full residential lineup, 5 colors, ENERGY STAR certified.', color: '#2563EB', accent: '#DBEAFE', initials: 'NF', families: ['window'], products: { window: ['casement', 'awning', 'high-fix', 'picture', 'single-slider', 'double-slider', 'single-hung', 'double-hung', 'end-vent', 'hopper', 'radius-shapes', 'non-radius-shapes'] } },
  { key: 'oakridge', name: 'OakRidge Doors', region: 'Brampton, ON', desc: 'Entry & patio door manufacturer. Fiberglass, steel, wood slabs. Sidelites, transoms, full hardware.', color: '#16A34A', accent: '#DCFCE7', initials: 'OR', families: ['entry', 'patio'], products: { entry: ['flush', 'shaker', 'craftsman', 'panel6', 'panel2-square', 'panel2-arch', 'modern-flush', 'contemporary'], patio: ['sliding-2', 'sliding-3', 'sliding-4', 'french-2', 'french-4'] } },
  { key: 'continental', name: 'Continental Full-Line', region: 'Mississauga, ON', desc: 'Full-service factory - windows, entry doors, patio doors. One PO covers the whole opening package.', color: '#A855F7', accent: '#F3E8FF', initials: 'CT', families: ['window', 'entry', 'patio'], products: { window: ['casement', 'awning', 'picture', 'single-slider', 'double-slider', 'single-hung', 'double-hung', 'hopper'], entry: ['flush', 'shaker', 'craftsman', 'panel6', 'panel2-square', 'modern-flush'], patio: ['sliding-2', 'sliding-3', 'sliding-4'] } },
  { key: 'glasswerks', name: 'GlassWerks Premium', region: 'Concord, ON', desc: 'Aluminum-clad and storefront. Slim-sightline picture + multi-slide patio. Premium architectural projects.', color: '#0891B2', accent: '#CFFAFE', initials: 'GW', families: ['window', 'patio'], products: { window: ['picture', 'high-fix', 'casement', 'radius-shapes', 'non-radius-shapes'], patio: ['multislide', 'sliding-2', 'sliding-4'] } },
];

export const STATUS_COLORS = {
  blue: { bg: '#EFF6FF', fg: '#1D4ED8' },
  amber: { bg: '#FEF3C7', fg: '#92400E' },
  green: { bg: '#F0FDF4', fg: '#166534' },
  gray: { bg: '#F1F5F9', fg: '#475569' },
  purple: { bg: '#F5F3FF', fg: '#6D28D9' },
  cyan: { bg: '#ECFEFF', fg: '#0E7490' },
  slate: { bg: '#F8FAFC', fg: '#64748B' },
};

export const QUOTE_STATUS_LABELS = { configuring: 'Configuring', sent: 'Sent', won: 'Won', expired: 'Expired' };
export const CUSTOMER_STATUS_LABELS = { active: 'Active', production: 'In production', shipped: 'Shipped', acknowledged: 'Awaiting factory', expired: 'Inactive' };
export const ORDER_STATUS_LABELS = { submitted: 'Submitted', approved: 'Approved', production: 'In production', ready: 'Ready to ship', delivered: 'Delivered' };

export const DEMO_QUOTES = [
  { id: 'Q-1042', project: 'Riverside Heights', customerId: 'C-101', units: 10, total: 13015, status: 'configuring', color: 'blue', createdDate: '2026-04-22', validUntil: '2026-05-22', sentDate: null, notes: 'Block A windows + main entry. Awaiting final glass spec.', lineItems: [
    { desc: 'Casement window - 30x60 white vinyl', qty: 4, unit: 425, total: 1700, unitSpec: { family: 'window', windowType: 'casement' } },
    { desc: 'Casement window - 30x60 white vinyl, multi-3pt', qty: 2, unit: 485, total: 970, unitSpec: { family: 'window', windowType: 'casement' } },
    { desc: 'Awning window - 36x24 white vinyl', qty: 1, unit: 395, total: 395, unitSpec: { family: 'window', windowType: 'awning' } },
    { desc: 'Double-hung - 32x54 white vinyl', qty: 1, unit: 512, total: 512, unitSpec: { family: 'window', windowType: 'double-hung' } },
    { desc: 'Picture window - 48x48 bronze', qty: 1, unit: 680, total: 680, unitSpec: { family: 'window', windowType: 'picture' } },
    { desc: 'Entry door - Craftsman half-lite, sage, 2 sidelites + transom', qty: 1, unit: 4150, total: 4150, unitSpec: { family: 'entry', doorStyle: 'craftsman' } },
    { desc: 'Patio door - Sliding 2-panel, 72x80 brick, multi-3pt', qty: 1, unit: 3240, total: 3240, unitSpec: { family: 'patio', patioType: 'sliding-2' } },
    { desc: 'LoE-180 + i89 glazing upgrade (all units)', qty: 10, unit: 120, total: 1200 },
    { desc: 'Brickmould BM-180 (all units)', qty: 10, unit: 18, total: 180 },
  ], subtotal: 13027, tax: 0, totalAmount: 13015 },
  { id: 'Q-1041', project: 'Maple Ridge Custom', customerId: 'C-105', units: 6, total: 8420, status: 'sent', color: 'amber', createdDate: '2026-04-18', validUntil: '2026-05-18', sentDate: '2026-04-19', notes: 'Two-story custom. Customer requested Antique Brass hardware throughout.', lineItems: [
    { desc: 'Casement window - 24x48 sage exterior / white interior', qty: 4, unit: 445, total: 1780, unitSpec: { family: 'window', windowType: 'casement' } },
    { desc: 'Picture window - 60x48 sage', qty: 2, unit: 720, total: 1440, unitSpec: { family: 'window', windowType: 'picture' } },
    { desc: 'Entry door - Shaker 5-panel, sage, RH inswing', qty: 1, unit: 2850, total: 2850, unitSpec: { family: 'entry', doorStyle: 'shaker' } },
    { desc: 'Antique Brass hardware upgrade (all units)', qty: 6, unit: 35, total: 210 },
    { desc: 'LoE-272 glazing', qty: 6, unit: 85, total: 510 },
    { desc: 'Custom mulling, transom + sidelite', qty: 1, unit: 1630, total: 1630 },
  ], subtotal: 8420, tax: 0, totalAmount: 8420 },
  { id: 'Q-1040', project: 'Lakeshore Renovation', customerId: 'C-104', units: 14, total: 21840, status: 'won', color: 'green', createdDate: '2026-04-08', validUntil: '2026-05-08', sentDate: '2026-04-10', acceptedDate: '2026-04-15', notes: 'Won - converted to order O-2409. Production at NorthForge.', lineItems: [
    { desc: 'Double-hung - 32x54 white', qty: 8, unit: 495, total: 3960, unitSpec: { family: 'window', windowType: 'double-hung' } },
    { desc: 'Casement - 30x60 white', qty: 3, unit: 450, total: 1350, unitSpec: { family: 'window', windowType: 'casement' } },
    { desc: 'Picture - 48x60 white', qty: 2, unit: 780, total: 1560, unitSpec: { family: 'window', windowType: 'picture' } },
    { desc: 'Entry door - Fiberglass Craftsman, sidelite + transom', qty: 1, unit: 4250, total: 4250, unitSpec: { family: 'entry', doorStyle: 'craftsman' } },
    { desc: 'Patio door - Sliding 4-panel, 144x80', qty: 1, unit: 3800, total: 3800, unitSpec: { family: 'patio', patioType: 'sliding-4' } },
    { desc: 'Triple-pane LoE-272 upgrade (all units)', qty: 14, unit: 245, total: 3430 },
    { desc: 'Bronze frame finish upgrade (5 units)', qty: 5, unit: 90, total: 450 },
    { desc: 'Multi-point lock upgrade (entry + patio)', qty: 2, unit: 120, total: 240 },
    { desc: 'Project mulling, install template, shop drawings', qty: 1, unit: 2800, total: 2800 },
  ], subtotal: 21840, tax: 0, totalAmount: 21840 },
  { id: 'Q-1039', project: 'Birchwood Townhomes', customerId: 'C-102', units: 48, total: 62300, status: 'sent', color: 'amber', createdDate: '2026-04-12', validUntil: '2026-05-12', sentDate: '2026-04-14', notes: '12-unit phase 1 of 4-phase development. Awaiting GC sign-off.', lineItems: [
    { desc: 'Standard window package per unit (4 windows)', qty: 12, unit: 2150, total: 25800 },
    { desc: 'Entry door - Steel shaker, RH inswing', qty: 12, unit: 1850, total: 22200 },
    { desc: 'Patio door - Sliding 2-panel, 72x80', qty: 12, unit: 1200, total: 14400 },
    { desc: 'Volume discount (-5%)', qty: 1, unit: -3100, total: -3100 },
    { desc: 'Coordinated factory delivery scheduling', qty: 1, unit: 3000, total: 3000 },
  ], subtotal: 62300, tax: 0, totalAmount: 62300 },
  { id: 'Q-1038', project: 'Cedar Park Estate', customerId: 'C-103', units: 22, total: 34125, status: 'configuring', color: 'blue', createdDate: '2026-04-20', validUntil: '2026-05-20', sentDate: null, notes: 'Custom estate, all-bronze package. 6 windows still in design.', lineItems: [
    { desc: 'Casement - 30x60 bronze (in progress)', qty: 8, unit: 540, total: 4320 },
    { desc: 'Picture - variable sizes bronze', qty: 6, unit: 850, total: 5100 },
  ], subtotal: 9420, tax: 0, totalAmount: 34125 },
  { id: 'Q-1037', project: 'Willow Glen Phase 2', customerId: 'C-115', units: 18, total: 27680, status: 'expired', color: 'gray', createdDate: '2026-02-28', validUntil: '2026-03-30', sentDate: '2026-03-01', notes: 'Expired - customer went with competing bid.', lineItems: [
    { desc: 'Standard window package per unit', qty: 18, unit: 1340, total: 24120 },
    { desc: 'Project setup + delivery', qty: 1, unit: 3560, total: 3560 },
  ], subtotal: 27680, tax: 0, totalAmount: 27680 },
];

export const DEMO_ORDERS = [
  { id: 'O-2410', project: 'Riverside Heights', factory: 'Northforge', units: 10, total: 13015, expected: '2026-05-22', status: 'submitted', color: 'purple', label: 'Submitted', fulfillmentType: 'install' },
  { id: 'O-2409', project: 'Lakeshore Renovation', factory: 'Northforge', units: 14, total: 21840, expected: '2026-05-08', status: 'production', color: 'amber', label: 'In production', fulfillmentType: 'ship' },
  { id: 'O-2408', project: 'Hartwood Custom', factory: 'Coastline', units: 8, total: 11960, expected: '2026-05-04', status: 'production', color: 'amber', label: 'In production', fulfillmentType: 'install' },
  { id: 'O-2407', project: 'Cedar Park Estate', factory: 'Northforge', units: 22, total: 34125, expected: '2026-05-15', status: 'production', color: 'amber', label: 'In production', fulfillmentType: 'install' },
  { id: 'O-2406', project: 'Aspen Grove', factory: 'Coastline', units: 6, total: 9320, expected: '2026-04-30', status: 'ready', color: 'green', label: 'Ready to ship', fulfillmentType: 'install' },
  { id: 'O-2405', project: 'Sunset Boulevard', factory: 'Northforge', units: 12, total: 17340, expected: '2026-04-28', status: 'ready', color: 'green', label: 'Ready to ship', fulfillmentType: 'ship' },
  { id: 'O-2404', project: 'Brookside Terrace', factory: 'Northforge', units: 20, total: 28560, expected: '2026-05-12', status: 'production', color: 'amber', label: 'In production', fulfillmentType: 'install' },
  { id: 'O-2403', project: 'Pinecrest Manor', factory: 'Coastline', units: 4, total: 7250, expected: '2026-04-25', status: 'ready', color: 'green', label: 'Ready to ship', fulfillmentType: 'install' },
  { id: 'O-2402', project: 'Windermere Heights', factory: 'Northforge', units: 16, total: 22980, expected: '2026-04-22', status: 'delivered', color: 'gray', label: 'Delivered', fulfillmentType: 'ship' },
  { id: 'O-2401', project: 'Oakridge Estates', factory: 'Coastline', units: 9, total: 13520, expected: '2026-04-18', status: 'delivered', color: 'gray', label: 'Delivered', fulfillmentType: 'ship' },
  { id: 'O-2400', project: 'Whitepine Cove', factory: 'Northforge', units: 7, total: 10180, expected: '2026-05-30', status: 'submitted', color: 'purple', label: 'Submitted', fulfillmentType: 'install' },
  { id: 'O-2399', project: 'Stonebridge Place', factory: 'Northforge', units: 11, total: 15670, expected: '2026-05-26', status: 'approved', color: 'blue', label: 'Approved', fulfillmentType: 'ship' },
  { id: 'O-2398', project: 'Heatherfield Lane', factory: 'Coastline', units: 5, total: 7840, expected: '2026-05-20', status: 'production', color: 'amber', label: 'In production', fulfillmentType: 'install' },
  { id: 'O-2397', project: 'Silver Birch Court', factory: 'Northforge', units: 13, total: 18920, expected: '2026-05-18', status: 'production', color: 'amber', label: 'In production', fulfillmentType: 'ship' },
];

export const DEMO_CUSTOMERS = [
  { id: 'C-101', name: 'Riverside Heights HOA', type: 'Multi-family', contact: 'Jennifer Walsh', email: 'j.walsh@rsh.com', phone: '(905) 555-0142', city: 'Hamilton, ON', quotes: 3, activeQuotes: 1, orders: 2, inProduction: 1, lifetime: 127400, status: 'active', color: 'blue', joined: '2024-08' },
  { id: 'C-102', name: 'Birchwood Townhome Group', type: 'Builder', contact: 'Marcus Chen', email: 'mchen@birchwood-dev.com', phone: '(416) 555-0188', city: 'Toronto, ON', quotes: 5, activeQuotes: 2, orders: 4, inProduction: 2, lifetime: 284600, status: 'active', color: 'blue', joined: '2023-11' },
  { id: 'C-103', name: 'Cedar Park Estate', type: 'Custom home', contact: 'Robert Tanaka', email: 'r.tanaka@cedarpark.ca', phone: '(905) 555-0167', city: 'Oakville, ON', quotes: 1, activeQuotes: 1, orders: 1, inProduction: 1, lifetime: 34125, status: 'production', color: 'amber', joined: '2026-02' },
  { id: 'C-104', name: 'Lakeshore Construction Ltd', type: 'Builder', contact: 'Priya Singh', email: 'priya@lakeshore.ca', phone: '(416) 555-0153', city: 'Toronto, ON', quotes: 8, activeQuotes: 1, orders: 7, inProduction: 0, lifetime: 412800, status: 'active', color: 'blue', joined: '2022-04' },
  { id: 'C-105', name: 'Maple Ridge Custom Builders', type: 'Builder', contact: 'David O’Brien', email: 'david@maple-ridge.com', phone: '(905) 555-0119', city: 'Mississauga, ON', quotes: 4, activeQuotes: 1, orders: 3, inProduction: 0, lifetime: 89240, status: 'active', color: 'blue', joined: '2024-01' },
  { id: 'C-106', name: 'Aspen Grove Homeowners', type: 'Single-family', contact: 'Linda Hayes', email: 'lhayes@aspengrove.ca', phone: '(289) 555-0144', city: 'Burlington, ON', quotes: 2, activeQuotes: 0, orders: 1, inProduction: 0, lifetime: 9320, status: 'shipped', color: 'green', joined: '2026-01' },
  { id: 'C-107', name: 'Hartwood Custom', type: 'Custom home', contact: 'Andre Petrov', email: 'andre@hartwood.ca', phone: '(416) 555-0173', city: 'Toronto, ON', quotes: 1, activeQuotes: 0, orders: 1, inProduction: 1, lifetime: 11960, status: 'production', color: 'amber', joined: '2026-02' },
  { id: 'C-108', name: 'Brookside Terrace Condo', type: 'Multi-family', contact: 'Sarah Mitchell', email: 'smitchell@brookside.com', phone: '(905) 555-0181', city: 'Hamilton, ON', quotes: 2, activeQuotes: 0, orders: 1, inProduction: 1, lifetime: 28560, status: 'production', color: 'amber', joined: '2025-09' },
  { id: 'C-109', name: 'Pinecrest Manor', type: 'Custom home', contact: 'Tom Whitfield', email: 'tom@pinecrest.ca', phone: '(289) 555-0162', city: 'Oakville, ON', quotes: 1, activeQuotes: 0, orders: 1, inProduction: 0, lifetime: 7250, status: 'shipped', color: 'green', joined: '2025-12' },
  { id: 'C-110', name: 'Sunset Boulevard Devs', type: 'Builder', contact: 'Maya Khan', email: 'maya@sunset.dev', phone: '(416) 555-0125', city: 'Toronto, ON', quotes: 3, activeQuotes: 1, orders: 2, inProduction: 0, lifetime: 42180, status: 'active', color: 'blue', joined: '2024-06' },
  { id: 'C-111', name: 'Whitepine Cove HOA', type: 'Multi-family', contact: 'James Reed', email: 'jreed@whitepine.org', phone: '(905) 555-0198', city: 'Burlington, ON', quotes: 2, activeQuotes: 0, orders: 1, inProduction: 0, lifetime: 10180, status: 'acknowledged', color: 'blue', joined: '2026-03' },
  { id: 'C-112', name: 'Stonebridge Properties', type: 'Builder', contact: 'Olivia Marchetti', email: 'olivia@stonebridge.ca', phone: '(416) 555-0157', city: 'Toronto, ON', quotes: 4, activeQuotes: 1, orders: 3, inProduction: 0, lifetime: 67200, status: 'active', color: 'blue', joined: '2024-03' },
  { id: 'C-113', name: 'Heatherfield Renovations', type: 'Custom home', contact: 'Eric Sanderson', email: 'eric@heatherfield.com', phone: '(905) 555-0136', city: 'Mississauga, ON', quotes: 2, activeQuotes: 0, orders: 1, inProduction: 1, lifetime: 7840, status: 'production', color: 'amber', joined: '2026-01' },
  { id: 'C-114', name: 'Silver Birch Court', type: 'Multi-family', contact: 'Anya Volkova', email: 'anya@silverbirch.com', phone: '(289) 555-0149', city: 'Oakville, ON', quotes: 1, activeQuotes: 0, orders: 1, inProduction: 1, lifetime: 18920, status: 'production', color: 'amber', joined: '2025-11' },
  { id: 'C-115', name: 'Willow Glen Phase 2', type: 'Builder', contact: 'Marcus Reyes', email: 'marcus@willowglen.dev', phone: '(416) 555-0192', city: 'Toronto, ON', quotes: 1, activeQuotes: 0, orders: 0, inProduction: 0, lifetime: 0, status: 'expired', color: 'gray', joined: '2025-08' },
];

export const calendarEvents = [
  { date: '2026-04-29', title: 'Riverside Heights site measure', type: 'measurement', customer: 'Riverside Heights HOA', quote: 'Q-1042' },
  { date: '2026-04-29', title: 'Maple Ridge follow-up', type: 'followup', customer: 'Maple Ridge Custom Builders', quote: 'Q-1041' },
  { date: '2026-04-30', title: 'Aspen Grove installation', type: 'installation', customer: 'Aspen Grove Homeowners', quote: 'O-2406' },
  { date: '2026-05-04', title: 'Hartwood production check', type: 'appointment', customer: 'Hartwood Custom', quote: 'O-2408' },
];

export const commissionRows = [
  { period: 'May 2026', quoteId: 'Q-1042', project: 'Riverside Heights', booked: 13015, payable: 846, holdback: 98, status: 'Pending' },
  { period: 'Apr 2026', quoteId: 'Q-1040', project: 'Lakeshore Renovation', booked: 21840, payable: 1419, holdback: 164, status: 'Earned' },
  { period: 'Apr 2026', quoteId: 'Q-1039', project: 'Birchwood Townhomes', booked: 62300, payable: 4049, holdback: 467, status: 'Earned' },
];

export const catalogSections = [
  { label: 'Product families', key: 'families', items: ['Vinyl 5000', 'Hybrid 7000', 'Architectural fixed', 'Terrace doors'] },
  { label: 'Glazing', key: 'glazing', items: ['Double pane Low-E', 'Triple pane Low-E', 'Laminated security', 'Obscure privacy'] },
  { label: 'Finishes', key: 'finishes', items: ['White 137', 'Almond 532', 'Commercial Brown', 'Iron Ore 697', 'Black 525'] },
  { label: 'Hardware', key: 'hardware', items: ['Truth nesting operator', 'Encore lock', 'Multi-point door hardware', 'Screens'] },
];

export const settingsSections = ['Company profile', 'PDF customizer', 'Terms', 'Taxes & finance', 'Team & permissions', 'Notifications', 'Integrations'];

export const dashboardMetrics = [
  { label: 'Pipeline value', value: '$284,900', trend: '+12% this month' },
  { label: 'Quotes sent', value: '38', trend: '9 awaiting signature' },
  { label: 'Won rate', value: '64%', trend: '+6 points' },
  { label: 'Factory handoffs', value: '14', trend: '3 due today' },
];

export const quotes = DEMO_QUOTES.map((q) => ({
  id: q.id,
  customerId: q.customerId,
  customer: q.project,
  contact: DEMO_CUSTOMERS.find((c) => c.id === q.customerId)?.contact || '',
  status: QUOTE_STATUS_LABELS[q.status],
  value: q.total,
  margin: '26%',
  updated: q.createdDate,
  address: DEMO_CUSTOMERS.find((c) => c.id === q.customerId)?.city || '',
  units: q.units,
  nextStep: q.notes,
}));

export const customers = DEMO_CUSTOMERS.map((c) => ({
  id: c.id,
  name: c.name,
  segment: c.type,
  status: CUSTOMER_STATUS_LABELS[c.status] || c.status,
  contact: c.contact,
  email: c.email,
  pipeline: `$${c.lifetime.toLocaleString()}`,
  openQuotes: c.activeQuotes,
}));

export const orders = DEMO_ORDERS.map((o) => ({
  id: o.id,
  quoteId: DEMO_QUOTES.find((q) => q.project === o.project)?.id || o.id,
  customer: o.project,
  status: ORDER_STATUS_LABELS[o.status],
  factory: o.factory,
  shipDate: o.expected,
  documents: 3,
  value: `$${o.total.toLocaleString()}`,
}));
