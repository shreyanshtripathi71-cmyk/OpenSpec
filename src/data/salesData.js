export const dashboardMetrics = [
  { label: 'Pipeline value', value: '$284,900', trend: '+12% this month' },
  { label: 'Quotes sent', value: '38', trend: '9 awaiting signature' },
  { label: 'Won rate', value: '64%', trend: '+6 points' },
  { label: 'Factory handoffs', value: '14', trend: '3 due today' },
];

export const dashboardWidgets = [
  { title: 'Hot quotes', body: '6 quotes over $20k have customer activity in the last 48 hours.' },
  { title: 'Production watch', body: 'Lakeview Condos and The Mercer are waiting on final glass approval.' },
  { title: 'Calendar', body: '4 site measures, 2 showroom consultations, and 1 install handoff this week.' },
  { title: 'Commissions', body: '$18,420 projected for the current pay period after holdbacks.' },
];

export const quotes = [
  {
    id: 'Q-08421',
    customerId: 'C-102',
    customer: 'Maple Street Renovation',
    contact: 'Riya Mehta',
    status: 'Configuring',
    value: 18420,
    margin: '31%',
    updated: 'Today, 10:24 AM',
    address: '44 Maple Street',
    units: 12,
    nextStep: 'Finish grille selection and export PDF',
  },
  {
    id: 'Q-08418',
    customerId: 'C-101',
    customer: 'Oakridge Homes',
    contact: 'Daniel Brooks',
    status: 'Sent',
    value: 42680,
    margin: '28%',
    updated: 'Yesterday',
    address: 'Lot 18, Oakridge Estates',
    units: 31,
    nextStep: 'Follow up on financing terms',
  },
  {
    id: 'Q-08397',
    customerId: 'C-103',
    customer: 'Lakeview Condos',
    contact: 'Nadia Patel',
    status: 'Won',
    value: 96850,
    margin: '34%',
    updated: 'May 12',
    address: '218 Lakeshore Road',
    units: 78,
    nextStep: 'Send release package to factory',
  },
  {
    id: 'Q-08344',
    customerId: 'C-104',
    customer: 'The Mercer',
    contact: 'Samira Chen',
    status: 'Expired',
    value: 27110,
    margin: '24%',
    updated: 'May 5',
    address: '700 Mercer Avenue',
    units: 19,
    nextStep: 'Reprice with current glass surcharge',
  },
];

export const customers = [
  {
    id: 'C-101',
    name: 'Oakridge Homes',
    segment: 'Builder',
    status: 'Active',
    contact: 'Daniel Brooks',
    email: 'daniel@oakridge.example',
    pipeline: '$126,400',
    openQuotes: 3,
  },
  {
    id: 'C-102',
    name: 'Maple Street Renovation',
    segment: 'Homeowner',
    status: 'Active',
    contact: 'Riya Mehta',
    email: 'riya@maplestreet.example',
    pipeline: '$18,420',
    openQuotes: 1,
  },
  {
    id: 'C-103',
    name: 'Lakeview Condos',
    segment: 'Developer',
    status: 'In production',
    contact: 'Nadia Patel',
    email: 'nadia@lakeview.example',
    pipeline: '$96,850',
    openQuotes: 1,
  },
  {
    id: 'C-104',
    name: 'The Mercer',
    segment: 'Architect',
    status: 'Dormant',
    contact: 'Samira Chen',
    email: 'samira@mercer.example',
    pipeline: '$27,110',
    openQuotes: 1,
  },
];

export const orders = [
  {
    id: 'O-5518',
    quoteId: 'Q-08397',
    customer: 'Lakeview Condos',
    status: 'In production',
    factory: 'North Plant',
    shipDate: 'May 24',
    documents: 6,
    value: '$96,850',
  },
  {
    id: 'O-5512',
    quoteId: 'Q-08418',
    customer: 'Oakridge Homes',
    status: 'Awaiting approval',
    factory: 'East Plant',
    shipDate: 'May 29',
    documents: 4,
    value: '$42,680',
  },
  {
    id: 'O-5488',
    quoteId: 'Q-08344',
    customer: 'The Mercer',
    status: 'On hold',
    factory: 'North Plant',
    shipDate: 'Pending',
    documents: 2,
    value: '$27,110',
  },
];

export const calendarEvents = [
  { date: 'May 14', title: 'Maple Street site measure', type: 'Measure', time: '9:30 AM' },
  { date: 'May 14', title: 'Oakridge showroom consult', type: 'Consult', time: '1:00 PM' },
  { date: 'May 15', title: 'Lakeview factory release', type: 'Factory', time: '10:00 AM' },
  { date: 'May 17', title: 'The Mercer repricing call', type: 'Follow-up', time: '3:30 PM' },
];

export const commissionRows = [
  { period: 'May 1-15', booked: '$284,900', payable: '$18,420', holdback: '$2,100' },
  { period: 'Apr 16-30', booked: '$231,600', payable: '$14,980', holdback: '$1,850' },
  { period: 'Apr 1-15', booked: '$198,300', payable: '$12,620', holdback: '$1,400' },
];

export const catalogSections = [
  { label: 'Product families', items: ['Vinyl 5000', 'Hybrid 7000', 'Architectural fixed', 'Terrace doors'] },
  { label: 'Glazing', items: ['Double pane Low-E', 'Triple pane Low-E', 'Laminated security', 'Obscure privacy'] },
  { label: 'Finishes', items: ['White 137', 'Almond 532', 'Commercial Brown', 'Iron Ore 697', 'Black 525'] },
  { label: 'Hardware', items: ['Truth nesting operator', 'Encore lock', 'Multi-point door hardware', 'Screens'] },
];

export const settingsSections = [
  'Company profile',
  'PDF customizer',
  'Terms',
  'Taxes & finance',
  'Team & permissions',
  'Notifications',
  'Integrations',
];
