import { Children, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';

import { OsNav } from './components/OsNav/OsNav';
import {
  CUSTOMER_STATUS_LABELS,
  DEMO_CUSTOMERS,
  DEMO_ORDERS,
  DEMO_QUOTES,
  FACTORIES,
  ORDER_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  STATUS_COLORS,
  calendarEvents,
  catalogSections,
  commissionRows,
  customers,
  dashboardMetrics,
  orders,
  quotes,
  settingsSections,
} from './data/salesData';
import styles from './SalesPages.module.css';

const QUOTE_FILTERS = ['All', 'Configuring', 'Sent', 'Won', 'Expired'];
const CUSTOMER_FILTERS = ['All', 'Active', 'In production', 'New this month', 'Builders', 'Multi-family', 'Custom homes', 'At risk'];
const ORDER_FILTERS = ['All', 'Submitted', 'Approved', 'In production', 'Ready to ship', 'Delivered'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_DASHBOARD_WIDGETS = ['attention', 'pipeline', 'recent_quotes', 'calendar', 'commissions'];
const DASHBOARD_WIDGET_CATALOG = [
  { key: 'attention', title: 'Needs your attention', desc: 'Expiring quotes, callbacks, overdue handoffs', size: 'small' },
  { key: 'pipeline', title: 'Production pipeline', desc: 'Live status grouped by factory', size: 'wide' },
  { key: 'recent_quotes', title: 'Recent quotes', desc: 'Latest quotes with status and value', size: 'small' },
  { key: 'calendar', title: 'My calendar', desc: 'Appointments and installations', size: 'wideTall' },
  { key: 'commissions', title: 'Commissions', desc: 'Projected earnings and holdbacks', size: 'smallTall' },
  { key: 'funnel', title: 'Business pipeline flow', desc: 'Leads to delivered revenue', size: 'wide' },
  { key: 'orders_status', title: 'Orders by status', desc: 'Quick breakdown of active orders', size: 'small' },
  { key: 'activity', title: 'Activity feed', desc: 'Latest team and factory events', size: 'smallTall' },
  { key: 'top_customers', title: 'Top customers', desc: 'Best accounts by pipeline value', size: 'small' },
];
const TODAY = new Date('2026-04-29');

function createPrototypeCustomers() {
  return DEMO_CUSTOMERS.map((customer, index) => ({
    ...customer,
    contacts: customer.contacts || [{
      id: `CT-${901 + index}`,
      name: customer.contact,
      title: ['Builder', 'Multi-family'].includes(customer.type) ? 'Project Manager' : 'Owner',
      email: customer.email,
      phone: customer.phone,
      isPrimary: true,
    }],
  }));
}

function createPrototypeOrders() {
  return DEMO_ORDERS.map((order) => ({
    ...order,
    detailTab: 'overview',
    chatChannel: 'factory',
    docs: [
      { id: `${order.id}-po`, name: `${order.id} purchase order.pdf`, size: '184 KB', kind: 'po', uploadedBy: 'Factory', uploadedAgo: '2d ago' },
      { id: `${order.id}-quote`, name: `${order.project} quote package.pdf`, size: '428 KB', kind: 'quote', uploadedBy: 'You', uploadedAgo: '3d ago' },
      { id: `${order.id}-spec`, name: `${order.project} shop drawings.pdf`, size: '1.2 MB', kind: 'spec', uploadedBy: order.factory, uploadedAgo: '1d ago' },
    ],
    chats: {
      factory: [
        { id: 'm1', role: 'factory', name: `${order.factory} ops`, text: order.status === 'production' ? 'Frames welded, awaiting glass package on Wed shipment from supplier.' : 'PO received. We will confirm acknowledgement and production slot shortly.', when: '2d ago' },
        { id: 'm2', role: 'dealer', name: 'Rafi B. · Maple Street', text: 'Confirmed. Customer flagged delivery window between 9am-noon.', when: '3d ago' },
      ],
      customer: [
        { id: 'c1', role: 'customer', name: `${order.project} customer`, text: 'Can you confirm the latest expected date?', when: '1d ago' },
        { id: 'c2', role: 'dealer', name: 'Rafi B. · Maple Street', text: 'Yes, I will update you after factory acknowledgement.', when: '1d ago' },
      ],
    },
  }));
}

function createPrototypeSettings() {
  return {
    companyProfile: {
      name: 'Maple Street',
      tagline: 'Windows & Doors',
      addressLine1: '1842 Lakeshore Rd',
      addressLine2: 'Hamilton, ON L8M 2B7',
      phone: '(905) 555-0100',
      email: 'quotes@maplestreet.ca',
      website: 'maplestreet.ca',
      logoInitials: 'MS',
    },
    pdfTheme: { primary: '#2563EB', accent: '#1E40AF', layout: 'standard', headerStyle: 'gradient', showFooter: true, showWatermark: true, showAccentStrip: true },
    taxConfig: { rate: 13, label: 'HST', currency: 'CAD' },
    defaultTerms: [
      { id: 'deposit', label: 'Deposit', text: '30% required upon order acceptance.' },
      { id: 'leadtime', label: 'Lead time', text: '4-8 weeks from factory acknowledgment.' },
      { id: 'measure', label: 'Field measure', text: 'Customer responsible for verified site dimensions.' },
      { id: 'warranty', label: 'Warranty', text: 'Manufacturer + Maple Street 2-year install.' },
      { id: 'validity', label: 'Validity', text: '30 days from issue. Subject to change after expiry.' },
      { id: 'balance', label: 'Balance', text: 'Due upon delivery, before installation.' },
    ],
  };
}

export function SalesShell() {
  return (
    <div className={styles.scope}>
      <Ambient />
      <OsNav />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

export function DashboardPage() {
  const [customizing, setCustomizing] = useState(false);
  const [modal, setModal] = useState(null);
  const [dashboardWidgetKeys, setDashboardWidgetKeys] = useState(DEFAULT_DASHBOARD_WIDGETS);
  const [activeDashboardModal, setActiveDashboardModal] = useState(null);
  const navigate = useNavigate();

  const visibleWidgets = useMemo(
    () => dashboardWidgetKeys
      .map((key) => DASHBOARD_WIDGET_CATALOG.find((widget) => widget.key === key))
      .filter(Boolean),
    [dashboardWidgetKeys],
  );

  const resetDashboard = () => setDashboardWidgetKeys(DEFAULT_DASHBOARD_WIDGETS);
  const removeDashboardWidget = (key) => setDashboardWidgetKeys((current) => current.filter((item) => item !== key));
  const addDashboardWidget = (key) => setDashboardWidgetKeys((current) => current.includes(key) ? current : [...current, key]);
  const moveDashboardWidget = (key, direction) => {
    setDashboardWidgetKeys((current) => {
      const index = current.indexOf(key);
      const nextIndex = direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  return (
    <section className={styles.page}>
      <PageHeader
        eyebrow="Sales representative · Maple Street Windows & Doors"
        title="Welcome back, Rafi"
        subtitle="7 quotes ready · 3 in production · 1 awaiting factory."
        actions={(
          <>
            <select className={styles.selectControl} defaultValue="mtd" aria-label="Dashboard timeframe">
              <option value="mtd">This month</option>
              <option value="qtd">This quarter</option>
              <option value="ytd">Year to date</option>
              <option value="last12">Last 12 months</option>
            </select>
            <button className={styles.buttonSecondary} type="button" onClick={() => setModal('configurator')}>Configurator</button>
            <button className={styles.button} type="button" onClick={() => setModal('newQuote')}>New quote</button>
          </>
        )}
      />

      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Insights</span>
          <h2 className={styles.cardTitle}>Your widgets</h2>
        </div>
        <button className={styles.buttonSecondary} type="button" onClick={() => setCustomizing((value) => !value)}>
          {customizing ? 'Done' : 'Customize'}
        </button>
      </div>

      {customizing && (
        <div className={styles.editBar}>
          <span><strong>Customize mode</strong> · reorder widgets · remove cards · add widgets from the library.</span>
          <div className={styles.actions}>
            <button className={styles.buttonSecondary} type="button" onClick={resetDashboard}>Reset to default</button>
            <button className={styles.button} type="button" onClick={() => setCustomizing(false)}>Done</button>
          </div>
        </div>
      )}

      <div className={styles.dashboardGrid}>
        {visibleWidgets.map((widget) => (
          <DashboardWidgetFrame
            key={widget.key}
            widget={widget}
            customizing={customizing}
            onRemove={() => removeDashboardWidget(widget.key)}
            onMoveUp={() => moveDashboardWidget(widget.key, 'up')}
            onMoveDown={() => moveDashboardWidget(widget.key, 'down')}
          >
            <DashboardWidgetContent
              widgetKey={widget.key}
              navigate={navigate}
              onOpenModal={setActiveDashboardModal}
            />
          </DashboardWidgetFrame>
        ))}

        {customizing && (
          <article className={`${styles.dashboardWidget} ${styles.dashboardAddWidget}`}>
            <h2 className={styles.cardTitle}>Add widget</h2>
            <p className={styles.muted}>Bring any prototype dashboard card into your workspace.</p>
            <div className={styles.widgetPalette}>
              {DASHBOARD_WIDGET_CATALOG.map((widget) => {
                const added = dashboardWidgetKeys.includes(widget.key);
                return (
                  <button
                    className={styles.paletteTile}
                    type="button"
                    key={widget.key}
                    disabled={added}
                    onClick={() => addDashboardWidget(widget.key)}
                  >
                    <strong>{widget.title}</strong>
                    <span>{added ? 'Already added' : widget.desc}</span>
                  </button>
                );
              })}
            </div>
          </article>
        )}
      </div>

      {activeDashboardModal?.type === 'docs' && (
        <OrderDocsModal order={activeDashboardModal.order} onClose={() => setActiveDashboardModal(null)} />
      )}
      {activeDashboardModal?.type === 'chat' && (
        <OrderChatModal order={activeDashboardModal.order} onClose={() => setActiveDashboardModal(null)} />
      )}

      {modal === 'configurator' && (
        <ConfiguratorPickerModal
          onClose={() => setModal(null)}
          onComplete={() => {
            setModal(null);
            navigate('/quotes/scratch/configurator');
          }}
        />
      )}
      {modal === 'newQuote' && (
        <NewQuoteModal
          onClose={() => setModal(null)}
          onComplete={() => {
            setModal(null);
            navigate('/quotes/Q-NEW/configurator');
          }}
        />
      )}
    </section>
  );
}

function DashboardWidgetFrame({ widget, customizing, onRemove, onMoveUp, onMoveDown, children }) {
  return (
    <article className={`${styles.dashboardWidget} ${styles[`widget_${widget.size}`] || ''}`}>
      {customizing && (
        <div className={styles.widgetChrome}>
          <button type="button" onClick={onMoveUp} title="Move earlier">↑</button>
          <button type="button" onClick={onMoveDown} title="Move later">↓</button>
          <button type="button" onClick={onRemove} title="Remove widget">×</button>
        </div>
      )}
      {children}
    </article>
  );
}

function DashboardWidgetContent({ widgetKey, navigate, onOpenModal }) {
  if (widgetKey === 'attention') return <AttentionWidget navigate={navigate} />;
  if (widgetKey === 'pipeline') return <ProductionPipelineWidget onOpenModal={onOpenModal} />;
  if (widgetKey === 'recent_quotes') return <RecentQuotesWidget navigate={navigate} />;
  if (widgetKey === 'calendar') return <CalendarWidget />;
  if (widgetKey === 'commissions') return <DashboardCommissionsWidget navigate={navigate} />;
  if (widgetKey === 'funnel') return <PipelineFunnelWidget />;
  if (widgetKey === 'orders_status') return <OrdersStatusWidget navigate={navigate} />;
  if (widgetKey === 'activity') return <ActivityWidget />;
  if (widgetKey === 'top_customers') return <TopCustomersWidget navigate={navigate} />;
  return null;
}

function WidgetHead({ title, subtitle, action }) {
  return (
    <div className={styles.widgetHead}>
      <div>
        <h2 className={styles.cardTitle}>{title}</h2>
        {subtitle && <p className={styles.muted}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function AttentionWidget({ navigate }) {
  const items = [
    { label: 'Q-08421', body: 'Maple Street expires in 3 days', action: () => navigate('/quotes/Q-08421') },
    { label: 'O-5512', body: 'East Plant approval pending', action: () => navigate('/orders') },
    { label: 'Measure', body: 'Maple Street site measure today', action: () => navigate('/calendar') },
  ];
  return (
    <div className={styles.attentionWidget}>
      <WidgetHead title="Needs your attention" subtitle="Expiring quotes, callbacks, overdue handoffs" />
      <div className={styles.attentionList}>
        {items.map((item) => (
          <button type="button" className={styles.attentionItem} key={item.label} onClick={item.action}>
            <span className={styles.attentionDot} />
            <span><strong>{item.label}</strong> {item.body}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductionPipelineWidget({ onOpenModal }) {
  const grouped = orders.reduce((acc, order) => {
    acc[order.factory] ||= [];
    acc[order.factory].push(order);
    return acc;
  }, {});
  return (
    <div>
      <WidgetHead title="Production pipeline" subtitle="Live status grouped by factory" />
      <div className={styles.factoryCards}>
        {Object.entries(grouped).map(([factory, factoryOrders]) => {
          const totalValue = factoryOrders.reduce((sum, order) => sum + Number(order.value.replace(/[$,]/g, '')), 0);
          return (
            <div className={styles.factoryCard} key={factory}>
              <div className={styles.factoryCardTop}>
                <span className={styles.factoryBadge}>{factory.slice(0, 2).toUpperCase()}</span>
                <span>
                  <strong>{factory}</strong>
                  <small>{factoryOrders.length} orders · {formatCurrency(totalValue)} active</small>
                </span>
              </div>
              <div className={styles.pipelineBar}>
                <span style={{ width: '32%' }} />
                <span style={{ width: '38%' }} />
                <span style={{ width: '18%' }} />
                <span style={{ width: '12%' }} />
              </div>
              <div className={styles.factoryActions}>
                {factoryOrders.map((order) => (
                  <button
                    type="button"
                    key={order.id}
                    onClick={() => onOpenModal({ type: 'docs', order })}
                  >
                    {order.id} docs
                  </button>
                ))}
                <button type="button" onClick={() => onOpenModal({ type: 'chat', order: factoryOrders[0] })}>Chat</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentQuotesWidget({ navigate }) {
  return (
    <div>
      <WidgetHead
        title="Recent quotes"
        subtitle="Latest quotes with status"
        action={<button className={styles.textButton} type="button" onClick={() => navigate('/quotes')}>View all →</button>}
      />
      <div className={styles.dashboardTable}>
        {quotes.map((quote) => (
          <button type="button" className={styles.dashboardTableRow} key={quote.id} onClick={() => navigate(`/quotes/${quote.id}`)}>
            <span><strong>{quote.id}</strong><small>{quote.customer}</small></span>
            <span>{quote.units} units</span>
            <span>{formatCurrency(quote.value)}</span>
            <span className={`${styles.status} ${statusClass(quote.status)}`}>{quote.status}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CalendarWidget() {
  const days = Array.from({ length: 14 }, (_, i) => i + 14);
  return (
    <div>
      <WidgetHead title="My calendar" subtitle="Appointments and installations" />
      <div className={styles.miniCalendar}>
        {WEEKDAYS.map((day) => <span className={styles.calendarDow} key={day}>{day}</span>)}
        {days.map((day) => (
          <button className={styles.calendarDay} type="button" key={day}>
            <strong>{day}</strong>
            {day === 14 && <span>Measure</span>}
            {day === 15 && <span>Factory</span>}
            {day === 17 && <span>Call</span>}
          </button>
        ))}
      </div>
      <div className={styles.rows}>
        {calendarEvents.slice(0, 3).map((event) => (
          <div className={styles.detailItem} key={`${event.date}-${event.title}`}>
            <div className={styles.detailValue}>{event.title}</div>
            <p className={styles.muted}>{event.date} · {event.time} · {event.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardCommissionsWidget({ navigate }) {
  return (
    <div>
      <WidgetHead title="Commissions" subtitle="PIN protected in full commissions view" />
      <div className={styles.commissionHero}>
        <span>Projected payable</span>
        <strong>{commissionRows[0].payable}</strong>
        <small>after {commissionRows[0].holdback} holdback</small>
      </div>
      <button className={styles.buttonSecondary} type="button" onClick={() => navigate('/commissions')}>Open commissions</button>
    </div>
  );
}

function PipelineFunnelWidget() {
  const stages = [
    ['Leads', 8, 24000],
    ['Quotes', quotes.length, quotes.reduce((sum, quote) => sum + quote.value, 0)],
    ['Orders', orders.length, orders.reduce((sum, order) => sum + Number(order.value.replace(/[$,]/g, '')), 0)],
    ['Production', orders.filter((order) => order.status === 'In production').length, 96850],
    ['Delivered', 2, 62000],
  ];
  return (
    <div>
      <WidgetHead title="Business pipeline flow" subtitle="Leads → quotes → orders → delivered" />
      <div className={styles.funnel}>
        {stages.map(([label, count, value]) => (
          <div className={styles.funnelStage} key={label}>
            <strong>{label}</strong>
            <span>{count}</span>
            <small>{formatCurrency(value)}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersStatusWidget({ navigate }) {
  const statuses = ['Submitted', 'Approved', 'In production', 'Ready to ship', 'Delivered'];
  return (
    <div>
      <WidgetHead title="Orders by status" subtitle="Quick breakdown of active orders" />
      <div className={styles.statusList}>
        {statuses.map((status) => (
          <button type="button" key={status} onClick={() => navigate('/orders')}>
            <span>{status}</span>
            <strong>{orders.filter((order) => order.status === status).length}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function ActivityWidget() {
  const items = [
    ['East Plant', 'requested approval on', 'Q-08418', '2 hours ago'],
    ['You', 'updated grille options in', 'Q-08421', 'today, 11:42 AM'],
    ['North Plant', 'moved Lakeview into production', 'O-5518', 'yesterday'],
    ['You', 'sent follow-up for', 'Q-08344', '2 days ago'],
  ];
  return (
    <div>
      <WidgetHead title="Activity feed" subtitle="Latest team and factory events" />
      <div className={styles.activityFeed}>
        {items.map(([who, action, id, when]) => (
          <div className={styles.activityItem} key={`${who}-${id}`}>
            <span className={styles.activityDot} />
            <span><strong>{who}</strong> {action} <b>{id}</b><small>{when}</small></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopCustomersWidget({ navigate }) {
  return (
    <div>
      <WidgetHead
        title="Top customers"
        subtitle="Best accounts by pipeline value"
        action={<button className={styles.textButton} type="button" onClick={() => navigate('/customers')}>All →</button>}
      />
      <div className={styles.customerList}>
        {customers.map((customer) => (
          <button type="button" key={customer.id} onClick={() => navigate('/customers')}>
            <span className={styles.customerAvatar}>{customer.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
            <span><strong>{customer.name}</strong><small>{customer.segment} · {customer.openQuotes} open</small></span>
            <b>{customer.pipeline}</b>
          </button>
        ))}
      </div>
    </div>
  );
}

function OrderDocsModal({ order, onClose }) {
  const docs = [
    `${order.id}-purchase-order.pdf`,
    `${order.quoteId}-shop-drawings.pdf`,
    `${order.customer}-glass-approval.pdf`,
  ];
  return (
    <DashboardModal title="Order documents" subtitle={`${order.customer} · ${order.factory}`} onClose={onClose}>
      <div className={styles.docList}>
        {docs.map((doc) => (
          <div className={styles.docRow} key={doc}>
            <span>PDF</span>
            <strong>{doc}</strong>
            <button type="button">View</button>
          </div>
        ))}
      </div>
      <label className={styles.uploadDropzone}>
        <input type="file" accept="application/pdf,.pdf" multiple />
        <span>Upload PDF</span>
        <small>Drag and drop or click to browse · PDFs only</small>
      </label>
    </DashboardModal>
  );
}

function OrderChatModal({ order, onClose }) {
  const [messages, setMessages] = useState([
    ['Factory', `${order.factory} acknowledged ${order.id}.`, '2h ago'],
    ['You', 'Please confirm final glass approval before release.', '1h ago'],
  ]);
  const [draft, setDraft] = useState('');
  const send = () => {
    if (!draft.trim()) return;
    setMessages((current) => [...current, ['You', draft.trim(), 'now']]);
    setDraft('');
  };
  return (
    <DashboardModal title="Order chat" subtitle={`${order.customer} · ${order.id}`} onClose={onClose}>
      <div className={styles.chatThread}>
        {messages.map(([who, body, time], index) => (
          <div className={styles.chatMessage} key={`${who}-${time}-${index}`}>
            <strong>{who}</strong>
            <p>{body}</p>
            <small>{time}</small>
          </div>
        ))}
      </div>
      <div className={styles.chatComposer}>
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." rows={2} />
        <button className={styles.button} type="button" onClick={send}>Send</button>
      </div>
    </DashboardModal>
  );
}

function DashboardModal({ title, subtitle, onClose, children }) {
  return createPortal((
    <div className={styles.modalLayer}>
      <button className={styles.modalBackdrop} type="button" aria-label="Close modal" onClick={onClose} />
      <section className={`${styles.modalCard} ${styles.dashboardModal}`}>
        <header className={styles.modalHeader}>
          <div>
            <span className={styles.eyebrow}>{subtitle}</span>
            <h2 className={styles.cardTitle}>{title}</h2>
          </div>
          <button className={styles.backButton} type="button" onClick={onClose}>Close</button>
        </header>
        <div className={styles.modalBody}>{children}</div>
      </section>
    </div>
  ), document.body);
}

export function QuotesPage() {
  const [quoteRows, setQuoteRows] = useState(() => DEMO_QUOTES.map((quote) => ({ ...quote })));
  const [customerRows, setCustomerRows] = useState(createPrototypeCustomers);
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(DEMO_QUOTES[0].id);
  const [showNewQuote, setShowNewQuote] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'createdDate', direction: 'desc' });
  const navigate = useNavigate();
  const filteredQuotes = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const filtered = quoteRows.filter((quote) => {
      const customer = customerRows.find((item) => item.id === quote.customerId);
      const label = QUOTE_STATUS_LABELS[quote.status] || quote.status;
      const matchesFilter = filter === 'All' || label === filter;
      const matchesSearch = !searchTerm || [
        quote.id,
        quote.project,
        customer?.name,
        customer?.contact,
        customer?.city,
        label,
      ].join(' ').toLowerCase().includes(searchTerm);
      return matchesFilter && matchesSearch;
    });

    return [...filtered].sort((a, b) => compareValues(quoteSortValue(a, sort.key, customerRows), quoteSortValue(b, sort.key, customerRows), sort.direction));
  }, [filter, quoteRows, search, sort]);
  const selectedQuote = filteredQuotes.find((quote) => quote.id === selectedId) || filteredQuotes[0] || quoteRows[0];

  const handleSort = (key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleCreateQuote = (draft) => {
    const nextNumber = 1100 + Math.floor(Math.random() * 900);
    const newQuote = {
      id: `Q-${nextNumber}`,
      project: draft.projectName,
      customerId: draft.customerId,
      units: 0,
      total: 0,
      status: 'configuring',
      color: 'blue',
      createdDate: new Date().toISOString().slice(0, 10),
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      sentDate: null,
      notes: 'New quote - start adding units.',
      addressLine: draft.address || '',
      contactId: draft.contactId || null,
      lineItems: [],
      subtotal: 0,
      tax: 0,
      totalAmount: 0,
    };
    setQuoteRows((current) => [newQuote, ...current]);
    setSelectedId(newQuote.id);
    setShowNewQuote(false);
    navigate(`/quotes/${newQuote.id}/configurator`);
  };

  const handleDeleteQuote = (quoteId) => {
    setQuoteRows((current) => current.filter((quote) => quote.id !== quoteId));
    setSelectedId((current) => {
      if (current !== quoteId) return current;
      const fallback = quoteRows.find((quote) => quote.id !== quoteId);
      return fallback?.id || '';
    });
  };

  return (
    <section className={styles.page}>
      <ListPageHeader
        title="Quotes"
        count={quoteRows.length}
        searchLabel="Search quote, project, customer..."
        searchValue={search}
        onSearch={setSearch}
        primaryLabel="New quote"
        onPrimary={() => setShowNewQuote(true)}
        exportLabel="Export"
        onExport={() => window.alert('Quote export prepared for the current filtered view.')}
        filters={QUOTE_FILTERS}
        activeFilter={filter}
        onFilter={setFilter}
        counts={labelCounts(quoteRows, (quote) => QUOTE_STATUS_LABELS[quote.status] || quote.status)}
      />
      <MasterDetail
        rows={filteredQuotes}
        selectedId={selectedQuote?.id}
        columns={[
          { label: 'Quote · Project', key: 'id' },
          { label: 'Customer · Contact', key: 'customerName' },
          { label: 'Units', key: 'units' },
          { label: 'Value', key: 'total' },
          { label: 'Valid until', key: 'validUntil' },
          { label: 'Status', key: 'status' },
        ]}
        sort={sort}
        onSort={handleSort}
        renderRow={(quote) => {
          const customer = customerRows.find((item) => item.id === quote.customerId);
          const contact = getQuoteContact(quote, customer);
          const label = QUOTE_STATUS_LABELS[quote.status] || quote.status;
          const validText = quoteValidityText(quote);
          return (
            <button
              className={`${styles.tableRow} ${quote.id === selectedQuote.id ? styles.rowActive : ''}`}
              type="button"
              key={quote.id}
              onClick={() => setSelectedId(quote.id)}
              onDoubleClick={() => navigate(`/quotes/${quote.id}/configurator`)}
            >
              <span><strong>{quote.id}</strong><small>{quote.project}</small></span>
              <span><strong>{customer?.name || 'No customer'}</strong><small>{contact?.name || customer?.contact} · {contact?.title || customer?.type}</small></span>
              <span>{quote.units}</span>
              <span className={styles.numeric}>{formatCurrency(quote.total)}</span>
              <span>{validText}</span>
              <span className={`${styles.status} ${statusClass(label)}`}>{label}</span>
            </button>
          );
        }}
        detail={selectedQuote ? (
          <QuoteSummary
            quote={selectedQuote}
            customer={customerRows.find((item) => item.id === selectedQuote.customerId)}
            onContactChange={(contactId) => {
              setQuoteRows((current) => current.map((quote) => quote.id === selectedQuote.id ? { ...quote, contactId } : quote));
            }}
            onAddContact={(newContact) => {
              setCustomerRows((current) => current.map((customer) => customer.id === selectedQuote.customerId
                ? { ...customer, contacts: [...(customer.contacts || []), newContact] }
                : customer));
              setQuoteRows((current) => current.map((quote) => quote.id === selectedQuote.id ? { ...quote, contactId: newContact.id } : quote));
            }}
            onDelete={() => handleDeleteQuote(selectedQuote.id)}
            onEmail={() => window.alert(`Email draft ready for ${(customerRows.find((item) => item.id === selectedQuote.customerId)?.email) || 'customer'}.`)}
          />
        ) : <div className={styles.empty}>No quote selected.</div>}
      />
      {showNewQuote && (
        <NewQuoteModal
          customers={customerRows}
          factories={FACTORIES}
          onClose={() => setShowNewQuote(false)}
          onCreate={handleCreateQuote}
        />
      )}
    </section>
  );
}

export function QuoteDetailPage() {
  const { quoteId } = useParams();
  const quote = quotes.find((item) => item.id === quoteId) || quotes[0];

  return (
    <section className={styles.page}>
      <div className={styles.stickyToolbar}>
        <div className={styles.detailHeader}>
          <Link className={styles.buttonSecondary} to="/quotes">Back</Link>
          <div>
            <span className={styles.eyebrow}>{quote.id}</span>
            <h1 className={styles.detailTitle}>{quote.customer}</h1>
            <p className={styles.muted}>Product Only · {quote.address}</p>
          </div>
          <span className={`${styles.status} ${statusClass(quote.status)}`}>{quote.status}</span>
        </div>
        <div className={styles.actions}>
          <button className={styles.buttonSecondary} type="button">Export PDF</button>
          <button className={styles.buttonSecondary} type="button">Email</button>
          <Link className={styles.button} to={`/quotes/${quote.id}/configurator`}>Continue configuring</Link>
        </div>
      </div>
      {quote.status === 'Configuring' && (
        <div className={styles.infoBanner}>
          <strong>Draft in progress.</strong> This quote is still being configured. Finalize line items before sending.
        </div>
      )}
      <article className={styles.fulfillmentCard}>
        <div>
          <span className={styles.eyebrow}>Fulfillment</span>
          <h2 className={styles.cardTitle}>Supply only vs supply + install</h2>
          <p className={styles.muted}>Choose fulfillment mode early so install rates, terms, and PDF totals stay aligned.</p>
        </div>
        <div className={styles.segmentGroup}>
          <button className={`${styles.segment} ${styles.segmentActive}`} type="button">Product Only</button>
          <button className={styles.segment} type="button">Supply + install</button>
        </div>
      </article>
      <div className={styles.pdfPage}>
        <div className={styles.detailHeader}>
          <div>
            <span className={styles.eyebrow}>OpenSpec quote</span>
            <h2 className={styles.detailTitle}>{quote.customer}</h2>
            <p className={styles.muted}>{quote.address}</p>
          </div>
          <span className={`${styles.status} ${statusClass(quote.status)}`}>{quote.status}</span>
        </div>
        <div className={styles.detailGrid}>
          <DetailItem label="Quote number" value={quote.id} />
          <DetailItem label="Contact" value={quote.contact} />
          <DetailItem label="Configured units" value={quote.units} />
          <DetailItem label="Quote value" value={formatCurrency(quote.value)} />
        </div>
        <h3 className={styles.cardTitle}>Fulfillment notes</h3>
        <p className={styles.muted}>{quote.nextStep}. Factory release, signature capture, and finance terms will attach here as the real workflow is wired.</p>
      </div>
    </section>
  );
}

export function OrdersPage() {
  const [orderRows, setOrderRows] = useState(createPrototypeOrders);
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(DEMO_ORDERS[0].id);
  const [search, setSearch] = useState('');
  const [factoryFilter, setFactoryFilter] = useState('all');
  const [sort, setSort] = useState({ key: 'expected', direction: 'asc' });
  const filteredOrders = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const filtered = orderRows.filter((order) => {
      const label = orderStatusLabel(order);
      const matchesStatus = filter === 'All' || label === filter;
      const matchesFactory = factoryFilter === 'all' || order.factory === factoryFilter;
      const matchesSearch = !searchTerm || [
        order.id,
        order.project,
        order.status,
        label,
        order.factory,
      ].join(' ').toLowerCase().includes(searchTerm);
      return matchesStatus && matchesFactory && matchesSearch;
    });
    return [...filtered].sort((a, b) => compareValues(orderSortValue(a, sort.key), orderSortValue(b, sort.key), sort.direction));
  }, [factoryFilter, filter, orderRows, search, sort]);
  const selectedOrder = filteredOrders.find((order) => order.id === selectedId) || filteredOrders[0] || orderRows[0];
  const handleSort = (key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };
  const updateSelectedOrder = (updates) => {
    setOrderRows((current) => current.map((order) => order.id === selectedOrder.id ? { ...order, ...updates } : order));
  };

  return (
    <section className={styles.page}>
      <ListPageHeader
        title="Orders"
        count={orderRows.length}
        searchLabel="Search by PO, project, customer..."
        searchValue={search}
        onSearch={setSearch}
        exportLabel="Export"
        onExport={() => window.alert('Order export prepared for the current filtered view.')}
        filters={ORDER_FILTERS}
        activeFilter={filter}
        onFilter={setFilter}
        counts={labelCounts(orderRows, orderStatusLabel)}
        extraControl={(
          <select className={styles.selectControl} value={factoryFilter} aria-label="Factory filter" onChange={(event) => setFactoryFilter(event.target.value)}>
            <option value="all">All factories</option>
            <option value="Northforge">Northforge</option>
            <option value="Coastline">Coastline</option>
          </select>
        )}
      />
      <MasterDetail
        rows={filteredOrders}
        selectedId={selectedOrder?.id}
        columns={[
          { label: 'PO · Project', key: 'id' },
          { label: 'Factory', key: 'factory' },
          { label: 'Progress', key: 'progress' },
          { label: 'Status', key: 'status' },
          { label: 'Value', key: 'total' },
          { label: 'Expected', key: 'expected' },
        ]}
        sort={sort}
        onSort={handleSort}
        renderRow={(order) => {
          const label = orderStatusLabel(order);
          return (
            <button className={`${styles.tableRow} ${order.id === selectedOrder.id ? styles.rowActive : ''}`} type="button" key={order.id} onClick={() => setSelectedId(order.id)}>
              <span><strong>{order.id}</strong><small>{order.project}</small></span>
              <span>{order.factory}<small>{order.units} units</small></span>
              <span><Progress value={orderStage(order) * 25} /></span>
              <span className={`${styles.status} ${statusClass(label)}`}>{label}</span>
              <span className={styles.numeric}>{formatCurrency(order.total)}</span>
              <span>{order.expected}</span>
            </button>
          );
        }}
        detail={selectedOrder ? <OrderSummary order={selectedOrder} onUpdate={updateSelectedOrder} /> : <div className={styles.empty}>No order selected.</div>}
      />
    </section>
  );
}

export function CustomersPage() {
  const [customerRows, setCustomerRows] = useState(createPrototypeCustomers);
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(DEMO_CUSTOMERS[0].id);
  const [showCustomerModal, setShowCustomerModal] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = customerRows.filter((customer) => {
      const matchesSearch = !term || [
        customer.name,
        customer.type,
        customer.status,
        customer.contact,
        customer.email,
        customer.city,
      ].join(' ').toLowerCase().includes(term);
      const matchesFilter =
        filter === 'All'
        || CUSTOMER_STATUS_LABELS[customer.status] === filter
        || (filter === 'Builders' && customer.type === 'Builder')
        || (filter === 'Multi-family' && customer.type === 'Multi-family')
        || (filter === 'Custom homes' && ['Custom home', 'Single-family'].includes(customer.type))
        || (filter === 'At risk' && ['expired'].includes(customer.status))
        || (filter === 'New this month' && customer.joined?.startsWith('2026'));
      return matchesSearch && matchesFilter;
    });
    return [...filtered].sort((a, b) => compareValues(a[sort.key], b[sort.key], sort.direction));
  }, [customerRows, filter, search, sort]);
  const selectedCustomer = filteredCustomers.find((customer) => customer.id === selectedId) || filteredCustomers[0] || customerRows[0];
  const handleSort = (key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };
  const saveCustomer = (draft) => {
    const normalizedDraft = {
      ...draft,
      type: draft.segment,
      status: reverseCustomerStatus(draft.status),
    };
    if (draft.id) {
      setCustomerRows((current) => current.map((customer) => customer.id === draft.id ? { ...customer, ...normalizedDraft } : customer));
      setSelectedId(draft.id);
    } else {
      const nextId = `C-${String(Math.max(...customerRows.map((customer) => Number(customer.id.replace(/\D/g, '')) || 0)) + 1).padStart(3, '0')}`;
      const newCustomer = {
        id: nextId,
        name: draft.name,
        type: normalizedDraft.type,
        status: normalizedDraft.status,
        contact: draft.contact,
        email: draft.email,
        phone: draft.phone,
        quotes: 0,
        activeQuotes: 0,
        orders: 0,
        inProduction: 0,
        lifetime: 0,
        color: 'blue',
        joined: '2026-04',
        pipeline: '$0',
        city: draft.city,
        contacts: [{ id: `CT-${Date.now()}`, name: draft.contact, title: draft.role || 'Primary contact', email: draft.email, phone: draft.phone, isPrimary: true }],
        activity: [{ label: 'Customer created', detail: 'Just now' }],
      };
      setCustomerRows((current) => [newCustomer, ...current]);
      setSelectedId(nextId);
    }
    setShowCustomerModal(null);
  };
  const updateSelectedCustomer = (updates) => {
    setCustomerRows((current) => current.map((customer) => customer.id === selectedCustomer.id ? { ...customer, ...updates } : customer));
  };

  return (
    <section className={styles.page}>
      <ListPageHeader
        title="Customers"
        count={customerRows.length}
        searchLabel="Search by name, contact, city, or email..."
        searchValue={search}
        onSearch={setSearch}
        primaryLabel="Add customer"
        onPrimary={() => setShowCustomerModal({ mode: 'add' })}
        exportLabel="Export"
        onExport={() => window.alert('Customer export prepared for the current filtered view.')}
        filters={CUSTOMER_FILTERS}
        activeFilter={filter}
        onFilter={setFilter}
        counts={customerCounts(customerRows)}
      />
      <MasterDetail
        rows={filteredCustomers}
        selectedId={selectedCustomer?.id}
        columns={[
          { label: 'Customer', key: 'name' },
          { label: 'Quotes · Orders', key: 'quotes' },
          { label: 'Production', key: 'status' },
          { label: 'Lifetime', key: 'lifetime' },
          { label: 'Status', key: 'status' },
        ]}
        sort={sort}
        onSort={handleSort}
        renderRow={(customer) => (
          <button className={`${styles.tableRow} ${customer.id === selectedCustomer.id ? styles.rowActive : ''}`} type="button" key={customer.id} onClick={() => setSelectedId(customer.id)}>
            <span><strong>{customer.name}</strong><small>{customer.type} · {customer.contact}</small></span>
            <span>{customer.activeQuotes} active / {customer.quotes} total</span>
            <span>{customer.inProduction ? `${customer.inProduction} in production` : 'No active order'}</span>
            <span className={styles.numeric}>{formatCurrency(customer.lifetime)}</span>
            <span className={`${styles.status} ${statusClass(CUSTOMER_STATUS_LABELS[customer.status] || customer.status)}`}>{CUSTOMER_STATUS_LABELS[customer.status] || customer.status}</span>
          </button>
        )}
        detail={selectedCustomer ? (
          <CustomerSummary
            customer={selectedCustomer}
            onEdit={() => setShowCustomerModal({ mode: 'edit', customer: selectedCustomer })}
            onUpdate={updateSelectedCustomer}
          />
        ) : <div className={styles.empty}>No customer selected.</div>}
      />
      {showCustomerModal && (
        <CustomerModal
          customer={showCustomerModal.customer}
          onClose={() => setShowCustomerModal(null)}
          onSave={saveCustomer}
        />
      )}
    </section>
  );
}

export function CatalogPage() {
  const [active, setActive] = useState(catalogSections[0].label);
  const [search, setSearch] = useState('');
  const section = catalogSections.find((item) => item.label === active) || catalogSections[0];
  const visibleItems = section.items.filter((item) => item.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <section className={styles.page}>
      <PageHeader
        eyebrow="Catalog"
        title="Product reference"
        subtitle="A quote-side catalog for product families, glazing, finishes, and hardware."
        actions={<Link className={styles.buttonSecondary} to="/quotes">Back to quotes</Link>}
      />
      <article className={styles.card}>
        <div className={styles.listHeaderRowLeft}>
          <input className={styles.searchCompact} placeholder="Search catalog, SKU, finish, hardware..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <button className={styles.buttonSecondary} type="button" onClick={() => window.alert('Catalog spec sheet export prepared.')}>Export spec sheets</button>
        </div>
        <div className={styles.settingsTabs}>
          {catalogSections.map((item) => (
            <button className={`${styles.segment} ${item.label === active ? styles.segmentActive : ''}`} type="button" key={item.label} onClick={() => setActive(item.label)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className={`${styles.grid4} ${styles.settingsPanel}`}>
          {visibleItems.map((item, index) => (
            <div className={`${styles.detailItem} ${styles.catalogCard}`} key={item}>
              {section.label === 'Finishes' && <span className={styles.catalogSwatch} style={{ background: ['#f8fafc', '#e8dfcf', '#4a3728', '#434343', '#1a1a1a'][index % 5] }} />}
              <div className={styles.detailValue}>{item}</div>
              <p className={styles.muted}>Pricing rule active · Spec sheet ready · Compatible with current quote families.</p>
              <div className={styles.actions}>
                <button className={styles.buttonSecondary} type="button">View specs</button>
                <Link className={styles.button} to="/quotes">Configure</Link>
              </div>
            </div>
          ))}
          {visibleItems.length === 0 && <div className={styles.empty}>No catalog items match your search.</div>}
        </div>
      </article>
    </section>
  );
}

export function CalendarPage() {
  const [month, setMonth] = useState(() => new Date(2026, 3, 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date(2026, 3, 29));
  const [booking, setBooking] = useState(false);
  const [events, setEvents] = useState(() => calendarEvents.map((event) => ({ ...event, dateKey: event.date, linked: event.quote })));
  const [draft, setDraft] = useState({
    title: '',
    type: 'appointment',
    linked: 'Q-1042',
    orgType: 'company',
    orgName: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const days = useMemo(() => buildMonthGrid(month), [month]);
  const selectedKey = dateKey(selectedDate);
  const selectedEvents = events.filter((event) => event.dateKey === selectedKey);
  const addEvent = () => {
    if (!draft.title.trim()) return;
    setEvents((current) => [...current, {
      date: selectedKey,
      dateKey: selectedKey,
      title: draft.title.trim(),
      type: draft.type,
      linked: draft.linked,
      quote: draft.linked,
      customer: draft.orgName || draft.contact || 'New customer',
      contact: draft.contact,
      phone: draft.phone,
      email: draft.email,
      address: draft.address,
      notes: draft.notes,
      _userBooked: true,
    }]);
    setDraft({ title: '', type: 'appointment', linked: 'Q-1042', orgType: 'company', orgName: '', contact: '', phone: '', email: '', address: '', notes: '' });
    setBooking(false);
  };

  return (
    <section className={styles.page}>
      <PageHeader
        eyebrow="Calendar"
        title={monthLabel(month)}
        subtitle="Appointments and installations across your open deals. Tip: double-click any day to book directly."
        actions={(
          <>
            <button className={styles.buttonSecondary} type="button" onClick={() => {
              const today = new Date(2026, 3, 29);
              setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              setSelectedDate(today);
            }}>Today</button>
            <button className={styles.buttonSecondary} type="button" onClick={() => window.alert('Calendar PDF export prepared.')}>Export PDF</button>
            <button className={styles.button} type="button" onClick={() => setBooking(true)}>Book appointment</button>
          </>
        )}
      />
      <div className={styles.calendarToolbar}>
        <div className={styles.actions}>
          <button className={styles.buttonSecondary} type="button" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>Previous</button>
          <button className={styles.buttonSecondary} type="button" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>Next</button>
        </div>
        <div className={styles.legend}>
          {['Appointment', 'Installation', 'Measurement', 'Follow-up'].map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>
      <div className={styles.calendarLayout}>
        <div className={styles.calendarCard}>
          <div className={styles.weekHeader}>
            {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className={styles.calendarGrid}>
            {days.map((day) => (
              <button
                className={`${styles.day} ${dateKey(day.date) === selectedKey ? styles.calendarSelected : ''} ${!day.inMonth ? styles.calendarMuted : ''}`}
                type="button"
                key={day.date.toISOString()}
                onClick={() => setSelectedDate(day.date)}
                onDoubleClick={() => {
                  setSelectedDate(day.date);
                  setBooking(true);
                }}
              >
                <span className={styles.dayNumber}>{day.date.getDate()}</span>
                {events.filter((event) => event.dateKey === dateKey(day.date)).slice(0, 2).map((event) => (
                  <span className={styles.eventPill} key={`${event.linked}-${event.title}`}>{humanize(event.type)}</span>
                ))}
              </button>
            ))}
          </div>
        </div>
        <aside className={styles.card}>
          <span className={styles.eyebrow}>Selected day</span>
          <h2 className={styles.cardTitle}>{shortDate(selectedDate)}</h2>
          {booking && (
            <div className={styles.formGrid}>
              <button className={styles.buttonSecondary} type="button" onClick={() => window.alert('Create customer shortcut opens the standard customer modal in the prototype.')}>Create new customer</button>
              <input className={styles.search} placeholder={draft.type === 'installation' ? 'Installation team' : 'Appointment title'} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
              <select className={styles.selectControl} value={draft.type} aria-label="Appointment type" onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}>
                <option value="appointment">Appointment</option>
                <option value="measurement">Site measurement</option>
                <option value="installation">Installation</option>
                <option value="followup">Follow-up</option>
              </select>
              <div className={styles.segmentGroup}>
                {['company', 'individual'].map((item) => (
                  <button className={`${styles.segment} ${draft.orgType === item ? styles.segmentActive : ''}`} type="button" key={item} onClick={() => setDraft((current) => ({ ...current, orgType: item }))}>
                    {humanize(item)}
                  </button>
                ))}
              </div>
              <input className={styles.search} placeholder={draft.orgType === 'company' ? 'Company name' : 'Full name'} value={draft.orgName} onChange={(event) => setDraft((current) => ({ ...current, orgName: event.target.value }))} />
              {draft.orgType === 'company' && <input className={styles.search} placeholder="Contact person" value={draft.contact} onChange={(event) => setDraft((current) => ({ ...current, contact: event.target.value }))} />}
              <input className={styles.search} placeholder="Phone" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
              <input className={styles.search} placeholder="Email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} />
              <input className={styles.search} placeholder="Address" value={draft.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} />
              <select className={styles.selectControl} value={draft.linked} aria-label="Linked quote or order" onChange={(event) => setDraft((current) => ({ ...current, linked: event.target.value }))}>
                <option value="">Select quote or order</option>
                {DEMO_QUOTES.map((quote) => <option value={quote.id} key={quote.id}>{quote.id} · {quote.project}</option>)}
                {DEMO_ORDERS.map((order) => <option value={order.id} key={order.id}>{order.id} · {order.project}</option>)}
              </select>
              <textarea className={styles.search} rows="3" placeholder="Notes" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
              <div className={styles.actions}>
                <button className={styles.buttonSecondary} type="button" onClick={() => setBooking(false)}>Cancel</button>
                <button className={styles.button} type="button" onClick={addEvent}>Save</button>
              </div>
            </div>
          )}
          <div className={styles.rows}>
            {selectedEvents.length === 0 && <div className={styles.empty}>No appointments booked for this day.</div>}
            {selectedEvents.map((event) => (
              <div className={styles.detailItem} key={`${event.linked}-${event.title}`}>
                <div className={styles.detailValue}>{event.title}</div>
                <p className={styles.muted}>{humanize(event.type)} · {event.linked || event.customer}</p>
                {event.contact && <p className={styles.muted}>Contact: {event.contact}</p>}
                {event.address && <p className={styles.muted}>Address: {event.address}</p>}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

export function CommissionsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const handlePin = (key) => {
    if (key === 'C') {
      setPin('');
      setPinError('');
      return;
    }
    if (key === '⌫') {
      setPin((current) => current.slice(0, -1));
      setPinError('');
      return;
    }
    const next = `${pin}${key}`.slice(0, 4);
    setPin(next);
    setPinError('');
    if (next.length === 4) {
      if (next === '1234') {
        setUnlocked(true);
        setPin('');
      } else {
        setPinError('Incorrect PIN. Try again.');
        setPin('');
      }
    }
  };

  return (
    <section className={styles.page}>
      <PageHeader
        eyebrow="Commissions"
        title="Private earnings view"
        subtitle="Mock-gated commission reporting for booked revenue, payable commission, and holdbacks."
      />
      {!unlocked ? (
        <article className={styles.lockScreen}>
          <div className={styles.lockIcon}>⌁</div>
          <h2 className={styles.cardTitle}>Enter manager PIN</h2>
          <p className={styles.muted}>This phase keeps the lock as local UI state. Real permission checks can be added when authentication exists.</p>
          <div className={styles.pinDots}>
            {[0, 1, 2, 3].map((dot) => <span className={dot < pin.length ? styles.pinDotFilled : ''} key={dot} />)}
          </div>
          {pinError && <p className={styles.errorText}>{pinError}</p>}
          <div className={styles.lockPad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map((key) => (
              <button className={styles.key} type="button" key={key} onClick={() => handlePin(key)}>{key}</button>
            ))}
          </div>
          <p className={styles.muted}>Demo PIN: 1234</p>
        </article>
      ) : (
        <>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.eyebrow}>Unlocked content</span>
              <h2 className={styles.cardTitle}>Year-to-date earnings, payouts, and per-rep breakdown.</h2>
            </div>
            <button className={styles.buttonSecondary} type="button" onClick={() => setUnlocked(false)}>Lock</button>
          </div>
          <div className={styles.grid3}>
            {commissionRows.map((row) => (
              <article className={styles.card} key={`${row.period}-${row.quoteId}`}>
                <span className={styles.eyebrow}>{row.period}</span>
                <DetailItem label="Booked" value={formatCurrency(row.booked)} />
                <DetailItem label="Payable" value={formatCurrency(row.payable)} />
                <DetailItem label="Holdback" value={formatCurrency(row.holdback)} />
              </article>
            ))}
          </div>
          <div className={styles.grid2}>
            <article className={styles.card}>
              <span className={styles.eyebrow}>Recent commissions</span>
              <h2 className={styles.cardTitle}>Deal-level earnings</h2>
              <div className={styles.dashboardTable}>
                {commissionRows.map((row) => (
                  <Link className={styles.dashboardTableRow} to={`/quotes/${row.quoteId}`} key={row.quoteId}>
                    <span><strong>{row.quoteId}</strong><small>{row.project}</small></span>
                    <span>6.5%</span>
                    <span>{formatCurrency(row.payable)}</span>
                    <span className={`${styles.status} ${row.status === 'Pending' ? styles.statusWarn : styles.statusGood}`}>{row.status}</span>
                  </Link>
                ))}
              </div>
            </article>
            <article className={styles.card}>
              <span className={styles.eyebrow}>Tier progress</span>
              <h2 className={styles.cardTitle}>Gold tier · 72% to next bonus</h2>
              <Progress value={72} />
              <p className={styles.muted}>Book $74,000 more this month to unlock the next accelerator tier. Holdbacks release after factory acknowledgement.</p>
              <div className={styles.detailGrid}>
                <DetailItem label="Current rate" value="6.5%" />
                <DetailItem label="Next rate" value="7.25%" />
                <DetailItem label="Holdback" value="$2,100" />
                <DetailItem label="Projected" value="$18,420" />
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  );
}

export function HelpPage() {
  return (
    <section className={styles.page}>
      <PageHeader
        eyebrow="Help and support"
        title="Get unstuck fast"
        subtitle="Support contacts, quick answers, and a message form for quote, order, and configurator questions."
      />
      <div className={styles.grid3}>
        {['Call support', 'Email operations', 'Start chat'].map((item) => (
          <article className={styles.card} key={item}>
            <h2 className={styles.cardTitle}>{item}</h2>
            <p className={styles.muted}>Connect this card to the real support workflow when integrations are ready.</p>
          </article>
        ))}
      </div>
      <div className={styles.grid2}>
        <article className={styles.card}>
          <span className={styles.eyebrow}>Frequently asked</span>
          <h2 className={styles.cardTitle}>FAQ</h2>
          {['How do I convert a scratch quote?', 'Where do factory documents live?', 'Can I customize quote PDFs?'].map((question) => (
            <div className={styles.detailItem} key={question}>
              <div className={styles.detailValue}>{question}</div>
              <p className={styles.muted}>Answer content placeholder.</p>
            </div>
          ))}
        </article>
        <article className={styles.card}>
          <span className={styles.eyebrow}>Send us a message</span>
          <h2 className={styles.cardTitle}>Contact form</h2>
          <DetailItem label="From" value="Rafi M." />
          <DetailItem label="Reply to" value="rafi@maplestreet.demo" />
          <select className={styles.selectControl} defaultValue="question" aria-label="Support category">
            <option value="question">General question</option>
            <option value="bug">Report a bug</option>
            <option value="feature">Feature request</option>
            <option value="billing">Billing & subscription</option>
            <option value="urgent">Urgent issue</option>
          </select>
          <input className={styles.search} placeholder="Subject" />
          <div className={styles.settingsPanel}>
            <textarea className={styles.search} placeholder="Describe the issue" rows="6" />
          </div>
          <button className={styles.button} type="button">Send request</button>
        </article>
      </div>
    </section>
  );
}

export function SettingsPage() {
  const [active, setActive] = useState(settingsSections[0]);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [settingsDraft, setSettingsDraft] = useState(() => ({ ...createPrototypeSettings(), inviteEmail: '', notifications: true, integration: 'QuickBooks connected' }));
  const updateSetting = (key, value) => setSettingsDraft((current) => ({ ...current, [key]: value }));
  const unlock = () => {
    if (password === '1234') {
      setUnlocked(true);
      setError('');
      setPassword('');
    } else {
      setError('Incorrect password. Demo password is 1234.');
    }
  };

  return (
    <section className={styles.page}>
      <PageHeader
        eyebrow="Manager only"
        title="Settings"
        subtitle="Company profile, PDF customizer, terms, taxes, and team access."
        actions={unlocked ? <button className={styles.buttonSecondary} type="button" onClick={() => setUnlocked(false)}>Lock</button> : null}
      />
      {!unlocked && (
        <article className={styles.gateCard}>
          <div className={styles.lockIcon}>◆</div>
          <h2 className={styles.cardTitle}>Manager access required</h2>
          <p className={styles.muted}>This area requires manager-level credentials. Enter your password to unlock company-wide settings.</p>
          <input className={styles.search} type="password" placeholder="Manager password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <p className={styles.errorText}>{error}</p>}
          <p className={styles.muted}>Demo password: 1234</p>
          <div className={styles.actions}>
            <button className={styles.buttonSecondary} type="button" onClick={() => setPassword('')}>Cancel</button>
            <button className={styles.button} type="button" onClick={unlock}>Unlock</button>
          </div>
        </article>
      )}
      {unlocked && (
      <article className={styles.card}>
        <div className={styles.authPill}>Authenticated as Manager</div>
        <div className={styles.settingsTabs}>
          {settingsSections.map((section) => (
            <button className={`${styles.segment} ${section === active ? styles.segmentActive : ''}`} type="button" key={section} onClick={() => setActive(section)}>
              {section}
            </button>
          ))}
        </div>
        <div className={`${styles.detailItem} ${styles.settingsPanel}`}>
          <span className={styles.eyebrow}>{active}</span>
          <h2 className={styles.cardTitle}>Configure {active.toLowerCase()}</h2>
          <SettingsPanel active={active} draft={settingsDraft} onChange={updateSetting} />
        </div>
      </article>
      )}
    </section>
  );
}

function SettingsPanel({ active, draft, onChange }) {
  const updateProfile = (key, value) => onChange('companyProfile', { ...draft.companyProfile, [key]: value });
  const updateTheme = (key, value) => onChange('pdfTheme', { ...draft.pdfTheme, [key]: value });
  const updateTax = (key, value) => onChange('taxConfig', { ...draft.taxConfig, [key]: value });
  if (active === 'Company profile') {
    return (
      <div className={styles.settingsSplit}>
        <div className={styles.formGrid}>
          <input className={styles.search} value={draft.companyProfile.name} onChange={(event) => updateProfile('name', event.target.value)} />
          <input className={styles.search} value={draft.companyProfile.tagline} onChange={(event) => updateProfile('tagline', event.target.value)} />
          <input className={styles.search} value={draft.companyProfile.phone} onChange={(event) => updateProfile('phone', event.target.value)} />
          <input className={styles.search} value={draft.companyProfile.email} onChange={(event) => updateProfile('email', event.target.value)} />
          <textarea className={styles.search} rows="3" value={`${draft.companyProfile.addressLine1}\n${draft.companyProfile.addressLine2}`} onChange={(event) => updateProfile('addressLine1', event.target.value.split('\n')[0] || '')} />
        </div>
        <div className={styles.previewCard}><strong>{draft.companyProfile.name}</strong><span>{draft.companyProfile.logoInitials} · {draft.companyProfile.addressLine1} · {draft.companyProfile.email}</span></div>
      </div>
    );
  }
  if (active === 'PDF customizer') {
    return (
      <div className={styles.settingsSplit}>
        <div className={styles.formGrid}>
          <select className={styles.selectControl} value={draft.pdfTheme.layout} onChange={(event) => updateTheme('layout', event.target.value)}>
            <option value="standard">Standard</option>
            <option value="compact">Compact</option>
            <option value="builder">Builder package</option>
          </select>
          <input className={styles.search} value={draft.pdfTheme.primary} onChange={(event) => updateTheme('primary', event.target.value)} />
          <input className={styles.search} value={draft.pdfTheme.accent} onChange={(event) => updateTheme('accent', event.target.value)} />
          <label className={styles.toggleRow}><input type="checkbox" checked={draft.pdfTheme.showWatermark} onChange={(event) => updateTheme('showWatermark', event.target.checked)} />Show watermark</label>
        </div>
        <div className={styles.previewCard}><strong>{draft.pdfTheme.layout}</strong><span>Primary {draft.pdfTheme.primary} · Accent {draft.pdfTheme.accent}</span></div>
      </div>
    );
  }
  if (active === 'Terms') {
    return (
      <div className={styles.formGrid}>
        {draft.defaultTerms.map((term) => (
          <textarea
            className={styles.search}
            rows="2"
            key={term.id}
            value={`${term.label}: ${term.text}`}
            onChange={(event) => onChange('defaultTerms', draft.defaultTerms.map((item) => item.id === term.id ? { ...item, text: event.target.value.replace(`${term.label}: `, '') } : item))}
          />
        ))}
      </div>
    );
  }
  if (active === 'Taxes & finance') {
    return (
      <div className={styles.formGrid}>
        <input className={styles.search} value={draft.taxConfig.rate} onChange={(event) => updateTax('rate', event.target.value)} />
        <input className={styles.search} value={draft.taxConfig.label} onChange={(event) => updateTax('label', event.target.value)} />
        <select className={styles.selectControl} value={draft.taxConfig.currency} onChange={(event) => updateTax('currency', event.target.value)}><option>CAD</option><option>USD</option></select>
        <input className={styles.search} placeholder="Payment terms" defaultValue="Net 15 after delivery" />
      </div>
    );
  }
  if (active === 'Team & permissions') {
    return (
      <div className={styles.formGrid}>
        <input className={styles.search} placeholder="Invite teammate by email" value={draft.inviteEmail} onChange={(event) => onChange('inviteEmail', event.target.value)} />
        <button className={styles.button} type="button" onClick={() => window.alert(`Invite staged for ${draft.inviteEmail || 'new teammate'}.`)}>Invite</button>
        <div className={styles.detailItem}><div className={styles.detailValue}>Rafi M.</div><p className={styles.muted}>Manager · Sales representative · Full access</p></div>
      </div>
    );
  }
  if (active === 'Notifications') {
    return (
      <label className={styles.toggleRow}>
        <input type="checkbox" checked={draft.notifications} onChange={(event) => onChange('notifications', event.target.checked)} />
        <span>Email me when quotes expire, orders change status, or factory docs arrive.</span>
      </label>
    );
  }
  return (
    <div className={styles.grid2}>
      {['QuickBooks', 'Stripe', 'Google Calendar', 'Slack'].map((item) => (
        <div className={styles.detailItem} key={item}>
          <div className={styles.detailValue}>{item}</div>
          <p className={styles.muted}>{item === 'QuickBooks' ? draft.integration : 'Available to connect'}</p>
          <button className={styles.buttonSecondary} type="button">{item === 'QuickBooks' ? 'Connected' : 'Connect'}</button>
        </div>
      ))}
    </div>
  );
}

function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}

function ListPageHeader({
  title,
  count,
  searchLabel,
  searchValue,
  onSearch,
  primaryLabel,
  primaryTo,
  onPrimary,
  exportLabel,
  onExport,
  filters,
  activeFilter,
  onFilter,
  counts,
  extraControl,
}) {
  return (
    <header className={styles.listHeader}>
      <div className={styles.listHeaderRow}>
        <div className={styles.inlineTitle}>
          <button className={styles.backButton} type="button">Back</button>
          <h1>{title} <span>{count}</span></h1>
        </div>
        {exportLabel && <button className={styles.buttonSecondary} type="button" onClick={onExport}>{exportLabel}</button>}
      </div>
      <div className={styles.listHeaderRowLeft}>
        <input
          className={styles.searchCompact}
          placeholder={searchLabel}
          value={searchValue ?? undefined}
          onChange={(event) => onSearch?.(event.target.value)}
        />
        {extraControl}
        {primaryLabel && (onPrimary ? (
          <button className={styles.button} type="button" onClick={onPrimary}>{primaryLabel}</button>
        ) : primaryTo ? (
          <Link className={styles.button} to={primaryTo}>{primaryLabel}</Link>
        ) : (
          <button className={styles.button} type="button">{primaryLabel}</button>
        ))}
      </div>
      <div className={styles.listHeaderRow}>
        <div className={styles.segmentsCompact}>
          {filters.map((filter) => (
            <button className={`${styles.segment} ${filter === activeFilter ? styles.segmentActive : ''}`} type="button" key={filter} onClick={() => onFilter(filter)}>
              {filter} <span>{filterCount(filter, counts, count)}</span>
            </button>
          ))}
        </div>
        <span className={styles.sortHint}>Click column headers to sort</span>
      </div>
    </header>
  );
}

function MasterDetail({ rows, renderRow, detail, columns, sort, onSort }) {
  return (
    <div className={styles.listShell}>
      <section className={styles.listPane}>
        <div className={styles.tableHead}>
          {columns.map((column) => {
            const config = typeof column === 'string' ? { label: column, key: column } : column;
            return (
              <button
                className={styles.tableHeadButton}
                type="button"
                key={config.label}
                onClick={() => config.key && onSort?.(config.key)}
              >
                {config.label}
                {sort?.key === config.key && <span>{sort.direction === 'asc' ? ' ↑' : ' ↓'}</span>}
              </button>
            );
          })}
        </div>
        <div className={styles.rows}>
          {rows.length ? rows.map(renderRow) : <div className={styles.empty}>No records match this filter.</div>}
        </div>
      </section>
      <aside className={styles.detailPane}>{detail}</aside>
    </div>
  );
}

function Progress({ value }) {
  return (
    <span className={styles.progressTrack}>
      <span style={{ width: `${value}%` }} />
    </span>
  );
}

function ConfiguratorPickerModal({ onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [family, setFamily] = useState('Window');
  const [type, setType] = useState('Casement');
  const title = step === 1 ? "Choose what you're configuring" : `Choose ${family.toLowerCase()} type`;
  const families = ['Window', 'Entry Door', 'Patio Door'];
  const types = {
    Window: ['Casement', 'Awning', 'Picture', 'Slider'],
    'Entry Door': ['Single entry', 'Double entry', 'Sidelite system', 'Garden door'],
    'Patio Door': ['Sliding patio', 'French patio', 'Lift and slide', 'Terrace door'],
  };

  return (
    <ModalFrame title={title} eyebrow={`Step ${step} of 2`} onClose={onClose}>
      <div className={styles.progressDots}>
        {[1, 2].map((item) => <span className={item <= step ? styles.progressDotActive : ''} key={item} />)}
      </div>
      {step === 1 && (
        <div className={styles.choiceGrid}>
          {families.map((item) => (
            <button className={`${styles.choiceCard} ${family === item ? styles.choiceActive : ''}`} type="button" key={item} onClick={() => setFamily(item)}>
              <strong>{item}</strong>
              <span>Start a scratch configuration and convert it into a quote later.</span>
            </button>
          ))}
        </div>
      )}
      {step === 2 && (
        <div className={styles.choiceGrid}>
          {types[family].map((item) => (
            <button className={`${styles.choiceCard} ${type === item ? styles.choiceActive : ''}`} type="button" key={item} onClick={() => setType(item)}>
              <strong>{item}</strong>
              <span>Factory-compatible option for {family.toLowerCase()} quoting.</span>
            </button>
          ))}
        </div>
      )}
      <ModalFooter
        backDisabled={step === 1}
        nextLabel={step === 2 ? 'Open Configurator' : 'Continue'}
        onBack={() => setStep((value) => Math.max(1, value - 1))}
        onNext={() => step === 2 ? onComplete() : setStep((value) => value + 1)}
        onCancel={onClose}
      />
    </ModalFrame>
  );
}

function NewQuoteModal({ customers: customerOptions = customers, factories = FACTORIES, onClose, onComplete, onCreate }) {
  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState(customerOptions[0].id);
  const [customerSearch, setCustomerSearch] = useState('');
  const [project, setProject] = useState({
    name: `${customerOptions[0].name} Project`,
    address: '',
    type: 'Renovation',
    installDate: '',
    contact: customerOptions[0].contact,
    notes: '',
  });
  const [factory, setFactory] = useState('continental');
  const [createdCustomer, setCreatedCustomer] = useState('');
  const selectedCustomer = customerOptions.find((item) => item.id === customer) || customerOptions[0];
  const filteredCustomers = customerOptions.filter((item) => {
    const term = customerSearch.trim().toLowerCase();
    if (!term) return true;
    return [item.name, item.contact, item.email, item.type, item.city].join(' ').toLowerCase().includes(term);
  });
  const title = step === 1 ? 'Choose a customer' : step === 2 ? 'Project details' : 'Pick a factory';
  const canContinue = step !== 2 || project.name.trim();
  const handleSelectCustomer = (id) => {
    const nextCustomer = customerOptions.find((item) => item.id === id);
    setCustomer(id);
    if (nextCustomer) {
      setProject((current) => ({
        ...current,
        name: current.name || `${nextCustomer.name} Project`,
        contact: nextCustomer.contact,
      }));
    }
  };
  const handleCreateCustomer = () => {
    const clean = customerSearch.trim() || 'New customer';
    setCreatedCustomer(clean);
    setProject((current) => ({
      ...current,
      name: `${clean} Project`,
      contact: 'Primary contact',
    }));
    setStep(2);
  };
  const complete = () => {
    if (onCreate) {
      onCreate({
        customerId: selectedCustomer?.id || 'C-NEW',
        customer: createdCustomer || selectedCustomer.name,
        contact: project.contact || selectedCustomer.contact,
        contactId: selectedCustomer.contacts?.find((contact) => contact.name === project.contact)?.id,
        address: project.address,
        projectName: project.name,
        factory,
        notes: project.notes,
      });
      return;
    }
    onComplete?.();
  };

  return (
    <ModalFrame title="New quote" eyebrow={`Step ${step} of 3 - ${title}`} onClose={onClose}>
      <div className={styles.progressDots}>
        {[1, 2, 3].map((item) => <span className={item <= step ? styles.progressDotActive : ''} key={item} />)}
      </div>
      {step === 1 && (
        <>
          <input className={styles.search} placeholder="Search customer..." value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} />
          <div className={styles.choiceGrid}>
            {filteredCustomers.map((item) => (
              <button className={`${styles.choiceCard} ${customer === item.id && !createdCustomer ? styles.choiceActive : ''}`} type="button" key={item.id} onClick={() => handleSelectCustomer(item.id)}>
                <strong>{item.name}</strong>
                <span>{item.type || item.segment} · {item.contact} · {item.city}</span>
              </button>
            ))}
            <button className={`${styles.choiceCard} ${createdCustomer ? styles.choiceActive : ''}`} type="button" onClick={handleCreateCustomer}>
              <strong>Create new customer</strong>
              <span>{customerSearch ? `Create "${customerSearch}" and continue.` : 'Add account details before continuing.'}</span>
            </button>
          </div>
        </>
      )}
      {step === 2 && (
        <div className={styles.formGrid}>
          <DetailItem label="Customer" value={createdCustomer || selectedCustomer.name} />
          <input className={styles.search} placeholder="Project name *" value={project.name} onChange={(event) => setProject((current) => ({ ...current, name: event.target.value }))} />
          <input className={styles.search} placeholder="Project address" value={project.address} onChange={(event) => setProject((current) => ({ ...current, address: event.target.value }))} />
          <select className={styles.selectControl} value={project.type} aria-label="Project type" onChange={(event) => setProject((current) => ({ ...current, type: event.target.value }))}>
            <option value="New construction">New construction</option>
            <option value="Renovation">Renovation</option>
            <option value="Window-only replacement">Window-only replacement</option>
            <option value="Door-only replacement">Door-only replacement</option>
          </select>
          <input className={styles.search} placeholder="Target install date" value={project.installDate} onChange={(event) => setProject((current) => ({ ...current, installDate: event.target.value }))} />
          <select className={styles.selectControl} value={project.contact} aria-label="Quote contact" onChange={(event) => setProject((current) => ({ ...current, contact: event.target.value }))}>
            {(selectedCustomer.contacts || [{ name: selectedCustomer.contact }]).map((contact) => (
              <option key={contact.id || contact.name}>{contact.name}{contact.isPrimary ? ' (primary)' : ''}</option>
            ))}
          </select>
          <textarea className={styles.search} rows="3" placeholder="Internal notes" value={project.notes} onChange={(event) => setProject((current) => ({ ...current, notes: event.target.value }))} />
        </div>
      )}
      {step === 3 && (
        <div className={styles.choiceGrid}>
          {factories.map((factoryItem) => (
            <button className={`${styles.choiceCard} ${factory === factoryItem.key ? styles.choiceActive : ''}`} type="button" key={factoryItem.key} onClick={() => setFactory(factoryItem.key)}>
              <strong>{factoryItem.name}</strong>
              <span>{Object.values(factoryItem.products).reduce((sum, list) => sum + list.length, 0)} styles · {factoryItem.families.join(' · ')}</span>
            </button>
          ))}
        </div>
      )}
      <ModalFooter
        backDisabled={step === 1}
        nextLabel={step === 3 ? 'Create quote' : 'Continue'}
        onBack={() => setStep((value) => Math.max(1, value - 1))}
        onNext={() => step === 3 ? complete() : canContinue && setStep((value) => value + 1)}
        onCancel={onClose}
      />
    </ModalFrame>
  );
}

function CustomerModal({ customer, onClose, onSave }) {
  const [draft, setDraft] = useState(() => ({
    id: customer?.id,
    name: customer?.name || '',
    segment: customer?.type || customer?.segment || 'Builder',
    status: CUSTOMER_STATUS_LABELS[customer?.status] || customer?.status || 'Active',
    contact: customer?.contact || '',
    role: customer?.contacts?.[0]?.title || customer?.contacts?.[0]?.role || 'Primary contact',
    email: customer?.email || '',
    phone: customer?.contacts?.[0]?.phone || '',
    city: customer?.city || '',
    notes: customer?.notes || '',
  }));
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <ModalFrame title={customer ? 'Edit customer' : 'Add customer'} eyebrow="Capture account details" onClose={onClose}>
      <div className={styles.formGrid}>
        <input className={styles.search} placeholder="Account name *" value={draft.name} onChange={(event) => update('name', event.target.value)} />
        <select className={styles.selectControl} value={draft.segment} aria-label="Account type" onChange={(event) => update('segment', event.target.value)}>
          <option>Builder</option>
          <option>Multi-family</option>
          <option>Custom home</option>
          <option>Single-family</option>
        </select>
        <select className={styles.selectControl} value={draft.status} aria-label="Status" onChange={(event) => update('status', event.target.value)}>
          <option>Active</option>
          <option>In production</option>
          <option>Shipped</option>
          <option>Awaiting factory</option>
          <option>Inactive</option>
        </select>
        <input className={styles.search} placeholder="Contact name *" value={draft.contact} onChange={(event) => update('contact', event.target.value)} />
        <input className={styles.search} placeholder="Role" value={draft.role} onChange={(event) => update('role', event.target.value)} />
        <input className={styles.search} placeholder="Email *" value={draft.email} onChange={(event) => update('email', event.target.value)} />
        <input className={styles.search} placeholder="Phone" value={draft.phone} onChange={(event) => update('phone', event.target.value)} />
        <input className={styles.search} placeholder="City" value={draft.city} onChange={(event) => update('city', event.target.value)} />
        <textarea className={styles.search} rows="3" placeholder="Internal notes" value={draft.notes} onChange={(event) => update('notes', event.target.value)} />
      </div>
      <ModalFooter nextLabel="Save customer" onCancel={onClose} onNext={() => onSave(draft)} />
    </ModalFrame>
  );
}

function ModalFrame({ eyebrow, title, children, onClose }) {
  const childItems = Children.toArray(children);
  const footer = childItems.find((child) => child?.type === ModalFooter);
  const body = childItems.filter((child) => child?.type !== ModalFooter);

  return createPortal((
    <div className={styles.modalLayer}>
      <button className={styles.modalBackdrop} type="button" aria-label="Close modal" onClick={onClose} />
      <section className={styles.modalCard}>
        <header className={styles.modalHeader}>
          <div>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <h2 className={styles.cardTitle}>{title}</h2>
          </div>
          <button className={styles.backButton} type="button" onClick={onClose}>Close</button>
        </header>
        <div className={styles.modalBody}>{body}</div>
        {footer}
      </section>
    </div>
  ), document.body);
}

function ModalFooter({ backDisabled = false, nextLabel, onBack, onNext, onCancel }) {
  return (
    <footer className={styles.modalFooter}>
      <button className={styles.buttonSecondary} type="button" onClick={onCancel}>Cancel</button>
      <div className={styles.actions}>
        {onBack && <button className={styles.buttonSecondary} type="button" disabled={backDisabled} onClick={onBack}>Back</button>}
        <button className={styles.button} type="button" onClick={onNext}>{nextLabel}</button>
      </div>
    </footer>
  );
}

function QuoteSummary({ quote, customer, onContactChange, onAddContact, onDelete, onEmail }) {
  const label = QUOTE_STATUS_LABELS[quote.status] || quote.status;
  const contact = getQuoteContact(quote, customer);
  const timeline = quoteTimeline(quote);
  const familyRows = quoteFamilyRows(quote);
  const avgUnit = quote.units ? Math.round(quote.total / quote.units) : 0;
  return (
    <>
      <div className={styles.detailHeader}>
        <div>
          <span className={styles.eyebrow}>{quote.id}</span>
          <h2 className={styles.detailTitle}>{quote.project}</h2>
          <p className={styles.muted}>{customer?.name || 'No customer'} · {quote.units} units · Valid {quote.validUntil}</p>
        </div>
        <span className={`${styles.status} ${statusClass(label)}`}>{label}</span>
      </div>
      <div className={styles.detailGrid}>
        <DetailItem label="Contact" value={contact?.name || 'No contact'} />
        <DetailItem label="Units" value={quote.units} />
        <DetailItem label="Value" value={formatCurrency(quote.total)} />
        <DetailItem label="Avg unit price" value={formatCurrency(avgUnit)} />
      </div>
      <section className={styles.detailSection}>
        <h3 className={styles.cardTitle}>Customer · contact</h3>
        <div className={styles.contactCard}>
          <strong>{contact?.name || customer?.contact || 'No contact assigned'}</strong>
          <span>{contact?.title ? `${contact.title} · ` : ''}{customer?.name} · {customer?.type}</span>
          {contact?.email && <span>{contact.email}</span>}
          {contact?.phone && <span>{contact.phone}</span>}
          <div className={styles.actions}>
            <button className={styles.buttonSecondary} type="button">View profile</button>
            <button className={styles.buttonSecondary} type="button" onClick={onEmail}>Email</button>
          </div>
        </div>
        {customer?.contacts?.length > 0 && (
          <div className={styles.contactPickerRow}>
            <select className={styles.selectControl} value={contact?.id || ''} onChange={(event) => onContactChange(event.target.value)} aria-label="Quote contact">
              {customer.contacts.map((item) => (
                <option value={item.id} key={item.id}>{item.name}{item.title ? ` · ${item.title}` : ''}{item.isPrimary ? ' (primary)' : ''}</option>
              ))}
            </select>
            <button
              className={styles.buttonSecondary}
              type="button"
              onClick={() => onAddContact({
                id: `CT-${Date.now()}`,
                name: 'New contact',
                title: 'Project Coordinator',
                email: 'new-contact@example.com',
                phone: '(905) 555-0100',
                isPrimary: false,
              })}
            >
              Add new contact
            </button>
          </div>
        )}
      </section>
      <section className={styles.detailSection}>
        <h3 className={styles.cardTitle}>Quote timeline</h3>
        <div className={styles.timelineList}>
          {timeline.map((item) => (
            <div className={styles.timelineItem} key={`${quote.id}-${item.label}`}>
              <span />
              <div>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className={styles.detailSection}>
        <h3 className={styles.cardTitle}>Per-unit breakdown</h3>
        <div className={styles.breakdownList}>
          {(familyRows.length ? familyRows : [{ label: 'No configured units yet', count: 0, value: 0 }]).map((item) => (
            <div className={styles.breakdownRow} key={item.label}>
              <span><strong>{item.label}</strong><small>{item.count} unit{item.count === 1 ? '' : 's'}</small></span>
              <b>{formatCurrency(item.value)}</b>
            </div>
          ))}
        </div>
      </section>
      <section className={styles.detailSection}>
        <h3 className={styles.cardTitle}>Notes</h3>
        <p className={styles.empty}>{quote.notes || quote.nextStep}</p>
      </section>
      <div className={styles.actions}>
        <Link className={styles.buttonSecondary} to={`/quotes/${quote.id}`}>View PDF</Link>
        <button className={styles.buttonSecondary} type="button" onClick={onEmail}>Email</button>
        <button className={styles.buttonSecondary} type="button" onClick={onDelete}>Delete quote</button>
        <Link className={styles.button} to={`/quotes/${quote.id}/configurator`}>Configure</Link>
      </div>
    </>
  );
}

function OrderSummary({ order, onUpdate }) {
  const [tab, setTab] = useState(order.detailTab || 'overview');
  const [channel, setChannel] = useState(order.chatChannel || 'factory');
  const [draft, setDraft] = useState('');
  const addMessage = () => {
    if (!draft.trim()) return;
    onUpdate({
      chats: {
        ...order.chats,
        [channel]: [...(order.chats?.[channel] || []), { id: `m-${Date.now()}`, role: 'dealer', name: 'Rafi B. · Maple Street', text: draft.trim(), when: 'just now' }],
      },
    });
    setDraft('');
  };
  const addDocument = () => {
    const docs = [...(order.docs || []), { id: `u-${Date.now()}`, name: `${order.id}-uploaded-${(order.docs?.length || 0) + 1}.pdf`, size: '128 KB', kind: 'upload', uploadedBy: 'You', uploadedAgo: 'just now' }];
    onUpdate({ docs });
  };
  const label = orderStatusLabel(order);
  const stages = orderStages(order);

  return (
    <>
      <div className={styles.detailHeader}>
        <div>
          <span className={styles.eyebrow}>{order.id}</span>
          <h2 className={styles.detailTitle}>{order.project}</h2>
          <p className={styles.muted}>{order.factory} · {order.units} units · Expected {order.expected}</p>
        </div>
        <span className={`${styles.status} ${statusClass(label)}`}>{label}</span>
      </div>
      <div className={styles.detailGrid}>
        <DetailItem label="Factory" value={order.factory} />
        <DetailItem label="Expected" value={order.expected} />
        <DetailItem label="Documents" value={order.docs?.length || 0} />
        <DetailItem label="Value" value={formatCurrency(order.total)} />
      </div>
      <div className={styles.segmentGroup}>
        {['overview', 'messages', 'docs'].map((item) => (
          <button className={`${styles.segment} ${tab === item ? styles.segmentActive : ''}`} type="button" key={item} onClick={() => setTab(item)}>
            {item === 'docs' ? 'PO / Docs' : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'overview' && (
        <>
          <section className={styles.detailSection}>
            <h3 className={styles.cardTitle}>Fulfillment</h3>
            <div className={styles.segmentGroup}>
              {['ship', 'install'].map((mode) => (
                <button className={`${styles.segment} ${order.fulfillmentType === mode ? styles.segmentActive : ''}`} type="button" key={mode} onClick={() => onUpdate({ fulfillmentType: mode })}>
                  {mode === 'ship' ? 'Ship' : 'Install'}
                </button>
              ))}
            </div>
          </section>
          <section className={styles.detailSection}>
            <h3 className={styles.cardTitle}>Production timeline</h3>
            <div className={styles.timelineList}>
              {stages.map((item) => (
                <div className={styles.timelineItem} key={`${order.id}-${item.label}`}>
                  <span />
                  <div>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className={styles.detailSection}>
            <h3 className={styles.cardTitle}>Factory thread preview</h3>
            <p className={styles.empty}>{order.chats?.factory?.[0]?.text || 'No messages yet.'}</p>
          </section>
        </>
      )}
      {tab === 'messages' && (
        <section className={styles.detailSection}>
          <h3 className={styles.cardTitle}>{channel === 'factory' ? 'Factory channel · private' : 'Customer channel · private'}</h3>
          <div className={styles.segmentGroup}>
            {['factory', 'customer'].map((item) => (
              <button className={`${styles.segment} ${channel === item ? styles.segmentActive : ''}`} type="button" key={item} onClick={() => setChannel(item)}>
                {item === 'factory' ? `Factory (${order.factory})` : 'Customer'}
              </button>
            ))}
          </div>
          <div className={styles.chatThread}>
            {(order.chats?.[channel] || []).map((message) => (
              <div className={styles.chatMessage} key={message.id}>
                <strong>{message.name}</strong>
                <p>{message.text}</p>
                <small>{message.when}</small>
              </div>
            ))}
          </div>
          <div className={styles.chatComposer}>
            <textarea value={draft} rows="2" placeholder="Write a message..." onChange={(event) => setDraft(event.target.value)} />
            <button className={styles.button} type="button" onClick={addMessage}>Send</button>
          </div>
        </section>
      )}
      {tab === 'docs' && (
        <section className={styles.detailSection}>
          <h3 className={styles.cardTitle}>Purchase order and documents</h3>
          <div className={styles.docList}>
            {order.docs?.map((doc) => (
              <div className={styles.docRow} key={doc.id}>
                <span>{doc.kind === 'po' ? 'PO' : 'PDF'}</span>
                <strong>{doc.name}</strong>
                <button type="button">Download</button>
              </div>
            ))}
          </div>
          <button className={styles.buttonSecondary} type="button" onClick={addDocument}>Upload PDF</button>
        </section>
      )}
    </>
  );
}

function CustomerSummary({ customer, onEdit, onUpdate }) {
  const addContact = () => {
    const contacts = [
      ...(customer.contacts || []),
      { id: `CT-${Date.now()}`, name: 'New contact', title: 'Estimator', email: 'new-contact@example.com', phone: '555-0100', isPrimary: false },
    ];
    onUpdate({ contacts });
  };

  return (
    <>
      <div className={styles.detailHeader}>
        <div>
          <span className={styles.eyebrow}>{customer.type}</span>
          <h2 className={styles.detailTitle}>{customer.name}</h2>
          <p className={styles.muted}>{customer.contact} · {customer.email}</p>
        </div>
        <span className={`${styles.status} ${statusClass(CUSTOMER_STATUS_LABELS[customer.status] || customer.status)}`}>{CUSTOMER_STATUS_LABELS[customer.status] || customer.status}</span>
      </div>
      <div className={styles.detailGrid}>
        <DetailItem label="Lifetime" value={formatCurrency(customer.lifetime || 0)} />
        <DetailItem label="Open quotes" value={customer.activeQuotes} />
        <DetailItem label="Primary contact" value={customer.contact} />
        <DetailItem label="Customer ID" value={customer.id} />
      </div>
      <div className={styles.actions}>
        <button className={styles.button} type="button" onClick={() => window.alert(`Starting quote for ${customer.name}.`)}>Start quote</button>
        <button className={styles.buttonSecondary} type="button" onClick={() => window.alert(`Email draft ready for ${customer.contact}.`)}>Email</button>
        <button className={styles.buttonSecondary} type="button" onClick={() => window.alert(`Call task created for ${customer.contact}.`)}>Call</button>
        <button className={styles.buttonSecondary} type="button" onClick={onEdit}>Edit</button>
      </div>
      <section className={styles.detailSection}>
        <h3 className={styles.cardTitle}>Contacts</h3>
        <div className={styles.customerList}>
          {customer.contacts?.map((contact) => (
            <button type="button" key={`${contact.name}-${contact.email}`}>
              <span className={styles.customerAvatar}>{contact.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
              <span><strong>{contact.name}</strong><small>{contact.title || contact.role} · {contact.email}</small></span>
              <b>{contact.phone}</b>
            </button>
          ))}
        </div>
        <button className={styles.buttonSecondary} type="button" onClick={addContact}>Add contact</button>
      </section>
      <section className={styles.detailSection}>
        <h3 className={styles.cardTitle}>Revenue snapshot</h3>
        <div className={styles.detailGrid}>
          <DetailItem label="Lifetime" value={formatCurrency(customer.lifetime || 0)} />
          <DetailItem label="Open quotes" value={customer.activeQuotes} />
          <DetailItem label="Orders" value={customer.orders} />
          <DetailItem label="Health" value={customer.status === 'expired' ? 'Needs follow-up' : 'Healthy'} />
        </div>
      </section>
      <section className={styles.detailSection}>
        <h3 className={styles.cardTitle}>Activity</h3>
        <div className={styles.timelineList}>
          {(customer.activity || [
            { label: 'Quote activity', detail: `${customer.quotes} quotes · ${customer.activeQuotes} active` },
            { label: 'Order activity', detail: `${customer.orders} orders · ${customer.inProduction} in production` },
            { label: 'Joined', detail: customer.joined },
          ]).map((item) => (
            <div className={styles.timelineItem} key={`${customer.id}-${item.label}`}>
              <span />
              <div>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className={styles.detailItem}>
      <div className={styles.detailLabel}>{label}</div>
      <div className={styles.detailValue}>{value}</div>
    </div>
  );
}

function buildMonthGrid(month) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return { date, inMonth: date.getMonth() === month.getMonth() };
  });
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function shortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function compareValues(a, b, direction = 'asc') {
  const normalizedA = typeof a === 'number' ? a : String(a ?? '').toLowerCase();
  const normalizedB = typeof b === 'number' ? b : String(b ?? '').toLowerCase();
  if (normalizedA === normalizedB) return 0;
  const result = normalizedA > normalizedB ? 1 : -1;
  return direction === 'asc' ? result : -result;
}

function labelCounts(items, labeler) {
  return items.reduce((acc, item) => {
    const label = labeler(item);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
}

function quoteSortValue(quote, key, customerRows) {
  if (key === 'customerName') return customerRows.find((customer) => customer.id === quote.customerId)?.name || '';
  if (key === 'status') return QUOTE_STATUS_LABELS[quote.status] || quote.status;
  return quote[key];
}

function getQuoteContact(quote, customer) {
  if (!customer) return null;
  const contacts = customer.contacts || [];
  return contacts.find((contact) => contact.id === quote.contactId) || contacts.find((contact) => contact.isPrimary) || contacts[0] || null;
}

function quoteValidityText(quote) {
  if (!['configuring', 'sent'].includes(quote.status)) return quote.validUntil;
  const daysLeft = Math.ceil((new Date(quote.validUntil) - TODAY) / 86400000);
  if (daysLeft < 0) return `${quote.validUntil} (expired)`;
  if (daysLeft <= 7) return `${quote.validUntil} (${daysLeft}d left)`;
  return quote.validUntil;
}

function quoteTimeline(quote) {
  const isExpired = quote.status === 'expired' || new Date(quote.validUntil) < TODAY;
  return [
    { label: 'Created', detail: quote.createdDate },
    { label: 'Configuring', detail: quote.status === 'configuring' ? 'In progress' : quote.sentDate ? 'Done' : '-' },
    { label: 'Sent to customer', detail: quote.sentDate || (quote.status === 'configuring' ? '-' : 'pending') },
    { label: quote.status === 'won' ? 'Accepted' : quote.status === 'expired' ? 'Expired without response' : 'Awaiting response', detail: quote.acceptedDate || (quote.status === 'expired' ? quote.validUntil : '-') },
    { label: 'Valid until', detail: isExpired ? `${quote.validUntil} expired` : quote.validUntil },
  ];
}

function quoteFamilyRows(quote) {
  const totals = {};
  (quote.lineItems || []).forEach((item) => {
    if (!item.unitSpec) return;
    const raw = item.unitSpec.family === 'window'
      ? item.unitSpec.windowType
      : item.unitSpec.family === 'entry'
        ? 'Entry door'
        : item.unitSpec.family === 'patio'
          ? 'Patio door'
          : item.unitSpec.family;
    const label = humanize(raw || 'window');
    totals[label] ||= { label, count: 0, value: 0 };
    totals[label].count += item.qty || 0;
    totals[label].value += item.total || 0;
  });
  return Object.values(totals).sort((a, b) => b.value - a.value);
}

function orderStatusLabel(order) {
  if (order.fulfillmentType === 'install' && order.status === 'ready') return 'Installation';
  if (order.fulfillmentType === 'install' && order.status === 'delivered') return 'Installed';
  return ORDER_STATUS_LABELS[order.status] || order.label || order.status;
}

function orderStage(order) {
  return { submitted: 1, approved: 1, production: 2, ready: 3, delivered: 4 }[order.status] || 0;
}

function orderSortValue(order, key) {
  if (key === 'progress' || key === 'status') return orderStage(order);
  return order[key];
}

function orderStages(order) {
  const stage = orderStage(order);
  const install = order.fulfillmentType === 'install';
  const labels = install
    ? ['Submitted', 'Approved', 'In production', 'Installation', 'Installed']
    : ['Submitted', 'Approved', 'In production', 'Ready to ship', 'Delivered'];
  return labels.map((label, index) => ({
    label,
    detail: index + 1 <= stage ? (index === 0 ? '2026-04-04' : index === 4 ? order.expected : 'In progress') : '-',
  }));
}

function humanize(value) {
  return String(value || '').replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function countByStatus(items, key) {
  return items.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function customerCounts(items) {
  const counts = labelCounts(items, (customer) => CUSTOMER_STATUS_LABELS[customer.status] || customer.status);
  counts.Builders = items.filter((customer) => customer.type === 'Builder').length;
  counts['Multi-family'] = items.filter((customer) => customer.type === 'Multi-family').length;
  counts['Custom homes'] = items.filter((customer) => ['Custom home', 'Single-family'].includes(customer.type)).length;
  counts['At risk'] = items.filter((customer) => customer.status === 'expired').length;
  counts['New this month'] = items.filter((customer) => customer.joined?.startsWith('2026')).length;
  return counts;
}

function reverseCustomerStatus(label) {
  return Object.entries(CUSTOMER_STATUS_LABELS).find(([, value]) => value === label)?.[0] || String(label || '').toLowerCase();
}

function filterCount(filter, counts, total) {
  if (filter === 'All') return total;
  return counts[filter] || 0;
}

function statusClass(status) {
  if (['Won', 'Active', 'In production', 'Approved', 'Ready to ship', 'Delivered'].includes(status)) return styles.statusGood;
  if (['Configuring', 'Sent', 'Awaiting approval', 'Submitted'].includes(status)) return styles.statusWarn;
  if (['Expired', 'Dormant', 'On hold', 'At risk'].includes(status)) return styles.statusDanger;
  return '';
}
