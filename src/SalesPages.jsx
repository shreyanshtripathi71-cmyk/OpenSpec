import { Children, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';

import { OsNav } from './components/OsNav/OsNav';
import {
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
      <div className={styles.heroBand}>
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
      </div>

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
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(quotes[0].id);
  const [showNewQuote, setShowNewQuote] = useState(false);
  const navigate = useNavigate();
  const filteredQuotes = useMemo(
    () => filter === 'All' ? quotes : quotes.filter((quote) => quote.status === filter),
    [filter],
  );
  const selectedQuote = filteredQuotes.find((quote) => quote.id === selectedId) || filteredQuotes[0] || quotes[0];

  return (
    <section className={styles.page}>
      <ListPageHeader
        title="Quotes"
        count={quotes.length}
        searchLabel="Search quote, project, customer..."
        primaryLabel="New quote"
        onPrimary={() => setShowNewQuote(true)}
        exportLabel="Export"
        filters={QUOTE_FILTERS}
        activeFilter={filter}
        onFilter={setFilter}
        counts={countByStatus(quotes, 'status')}
      />
      <MasterDetail
        rows={filteredQuotes}
        selectedId={selectedQuote.id}
        columns={['Quote · Project', 'Customer · Contact', 'Units', 'Value', 'Valid until', 'Status']}
        renderRow={(quote) => (
          <button
            className={`${styles.tableRow} ${quote.id === selectedQuote.id ? styles.rowActive : ''}`}
            type="button"
            key={quote.id}
            onClick={() => setSelectedId(quote.id)}
          >
            <span><strong>{quote.id}</strong><small>{quote.customer}</small></span>
            <span><strong>{quote.customer}</strong><small>{quote.contact}</small></span>
            <span>{quote.units}</span>
            <span className={styles.numeric}>{formatCurrency(quote.value)}</span>
            <span>{quote.updated}</span>
            <span className={`${styles.status} ${statusClass(quote.status)}`}>{quote.status}</span>
          </button>
        )}
        detail={<QuoteSummary quote={selectedQuote} />}
      />
      {showNewQuote && (
        <NewQuoteModal
          onClose={() => setShowNewQuote(false)}
          onComplete={() => {
            setShowNewQuote(false);
            navigate('/quotes/Q-NEW/configurator');
          }}
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
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(orders[0].id);
  const filteredOrders = useMemo(
    () => filter === 'All' ? orders : orders.filter((order) => order.status === filter),
    [filter],
  );
  const selectedOrder = filteredOrders.find((order) => order.id === selectedId) || filteredOrders[0] || orders[0];

  return (
    <section className={styles.page}>
      <ListPageHeader
        title="Orders"
        count={orders.length}
        searchLabel="Search by PO, project, customer..."
        exportLabel="Export"
        filters={ORDER_FILTERS}
        activeFilter={filter}
        onFilter={setFilter}
        counts={countByStatus(orders, 'status')}
        extraControl={(
          <select className={styles.selectControl} defaultValue="all" aria-label="Factory filter">
            <option value="all">All factories</option>
            <option value="North Plant">North Plant</option>
            <option value="East Plant">East Plant</option>
          </select>
        )}
      />
      <MasterDetail
        rows={filteredOrders}
        selectedId={selectedOrder.id}
        columns={['PO · Project', 'Factory', 'Progress', 'Status', 'Value', 'Expected']}
        renderRow={(order) => (
          <button className={`${styles.tableRow} ${order.id === selectedOrder.id ? styles.rowActive : ''}`} type="button" key={order.id} onClick={() => setSelectedId(order.id)}>
            <span><strong>{order.id}</strong><small>{order.customer}</small></span>
            <span>{order.factory}</span>
            <span><Progress value={order.status === 'In production' ? 62 : order.status === 'Awaiting approval' ? 18 : 8} /></span>
            <span className={`${styles.status} ${statusClass(order.status)}`}>{order.status}</span>
            <span className={styles.numeric}>{order.value}</span>
            <span>{order.shipDate}</span>
          </button>
        )}
        detail={<OrderSummary order={selectedOrder} />}
      />
    </section>
  );
}

export function CustomersPage() {
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(customers[0].id);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const filteredCustomers = useMemo(
    () => filter === 'All' || !['Active', 'In production', 'Dormant'].includes(filter) ? customers : customers.filter((customer) => customer.status === filter),
    [filter],
  );
  const selectedCustomer = filteredCustomers.find((customer) => customer.id === selectedId) || filteredCustomers[0] || customers[0];

  return (
    <section className={styles.page}>
      <ListPageHeader
        title="Customers"
        count={customers.length}
        searchLabel="Search by name, contact, city, or email..."
        primaryLabel="Add customer"
        onPrimary={() => setShowCustomerModal(true)}
        exportLabel="Export"
        filters={CUSTOMER_FILTERS}
        activeFilter={filter}
        onFilter={setFilter}
        counts={countByStatus(customers, 'status')}
      />
      <MasterDetail
        rows={filteredCustomers}
        selectedId={selectedCustomer.id}
        columns={['Customer', 'Quotes · Orders', 'Production', 'Lifetime', 'Status']}
        renderRow={(customer) => (
          <button className={`${styles.tableRow} ${customer.id === selectedCustomer.id ? styles.rowActive : ''}`} type="button" key={customer.id} onClick={() => setSelectedId(customer.id)}>
            <span><strong>{customer.name}</strong><small>{customer.segment} · {customer.contact}</small></span>
            <span>{customer.openQuotes} open quote{customer.openQuotes === 1 ? '' : 's'}</span>
            <span>{customer.status === 'In production' ? 'Factory active' : 'No active order'}</span>
            <span className={styles.numeric}>{customer.pipeline}</span>
            <span className={`${styles.status} ${statusClass(customer.status)}`}>{customer.status}</span>
          </button>
        )}
        detail={<CustomerSummary customer={selectedCustomer} />}
      />
      {showCustomerModal && <CustomerModal onClose={() => setShowCustomerModal(false)} />}
    </section>
  );
}

export function CatalogPage() {
  const [active, setActive] = useState(catalogSections[0].label);
  const section = catalogSections.find((item) => item.label === active) || catalogSections[0];

  return (
    <section className={styles.page}>
      <PageHeader
        eyebrow="Catalog"
        title="Product reference"
        subtitle="A quote-side catalog for product families, glazing, finishes, and hardware."
        actions={<Link className={styles.buttonSecondary} to="/quotes">Back to quotes</Link>}
      />
      <article className={styles.card}>
        <div className={styles.settingsTabs}>
          {catalogSections.map((item) => (
            <button className={`${styles.segment} ${item.label === active ? styles.segmentActive : ''}`} type="button" key={item.label} onClick={() => setActive(item.label)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className={`${styles.grid4} ${styles.settingsPanel}`}>
          {section.items.map((item) => (
            <div className={styles.detailItem} key={item}>
              <div className={styles.detailValue}>{item}</div>
              <p className={styles.muted}>Ready for pricing rules, spec sheets, and compatibility notes.</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export function CalendarPage() {
  const days = Array.from({ length: 42 }, (_, index) => index + 1);
  const todaysEvents = calendarEvents.filter((event) => event.date === 'May 14');

  return (
    <section className={styles.page}>
      <PageHeader
        eyebrow="Calendar"
        title="May 2026"
        subtitle="Appointments and installations across your open deals. Tip: double-click any day to book directly."
        actions={(
          <>
            <button className={styles.buttonSecondary} type="button">Today</button>
            <button className={styles.buttonSecondary} type="button">Export PDF</button>
            <button className={styles.button} type="button">Book appointment</button>
          </>
        )}
      />
      <div className={styles.calendarToolbar}>
        <div className={styles.actions}>
          <button className={styles.buttonSecondary} type="button">Previous</button>
          <button className={styles.buttonSecondary} type="button">Next</button>
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
              <div className={styles.day} key={day}>
                <span className={styles.dayNumber}>{day <= 31 ? day : day - 31}</span>
              {day === 14 && <span className={styles.eventPill}>2 events</span>}
              {day === 15 && <span className={styles.eventPill}>Factory</span>}
              {day === 17 && <span className={styles.eventPill}>Follow-up</span>}
              </div>
            ))}
          </div>
        </div>
        <aside className={styles.card}>
          <span className={styles.eyebrow}>Selected day</span>
          <h2 className={styles.cardTitle}>May 14</h2>
          <div className={styles.formGrid}>
            <input className={styles.search} placeholder="Appointment title" />
            <select className={styles.selectControl} defaultValue="Measure" aria-label="Appointment type">
              <option>Measure</option>
              <option>Consult</option>
              <option>Factory</option>
              <option>Follow-up</option>
            </select>
          </div>
          <div className={styles.rows}>
            {todaysEvents.map((event) => (
              <div className={styles.detailItem} key={`${event.time}-${event.title}`}>
                <div className={styles.detailValue}>{event.time} · {event.title}</div>
                <p className={styles.muted}>{event.type}</p>
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
            {[0, 1, 2, 3].map((dot) => <span key={dot} />)}
          </div>
          <div className={styles.lockPad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map((key) => (
              <button className={styles.key} type="button" key={key}>{key}</button>
            ))}
          </div>
          <button className={styles.button} type="button" onClick={() => setUnlocked(true)}>Unlock demo</button>
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
              <article className={styles.card} key={row.period}>
                <span className={styles.eyebrow}>{row.period}</span>
                <DetailItem label="Booked" value={row.booked} />
                <DetailItem label="Payable" value={row.payable} />
                <DetailItem label="Holdback" value={row.holdback} />
              </article>
            ))}
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
          <input className={styles.search} type="password" placeholder="Manager password" />
          <p className={styles.muted}>Demo password: 1234</p>
          <div className={styles.actions}>
            <button className={styles.buttonSecondary} type="button">Cancel</button>
            <button className={styles.button} type="button" onClick={() => setUnlocked(true)}>Unlock</button>
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
          <p className={styles.muted}>This panel is ready for the real form controls and permission model in the next phase.</p>
          <div className={styles.formGrid}>
            <input className={styles.search} placeholder={`${active} name`} />
            <input className={styles.search} placeholder="Internal reference" />
            <textarea className={styles.search} rows="4" placeholder="Notes and configuration details" />
          </div>
        </div>
      </article>
      )}
    </section>
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
  primaryLabel,
  primaryTo,
  onPrimary,
  exportLabel,
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
        {exportLabel && <button className={styles.buttonSecondary} type="button">{exportLabel}</button>}
      </div>
      <div className={styles.listHeaderRowLeft}>
        <input className={styles.searchCompact} placeholder={searchLabel} />
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

function MasterDetail({ rows, renderRow, detail, columns }) {
  return (
    <div className={styles.listShell}>
      <section className={styles.listPane}>
        <div className={styles.tableHead}>
          {columns.map((column) => <span key={column}>{column}</span>)}
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

function NewQuoteModal({ onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState(customers[0].id);
  const selectedCustomer = customers.find((item) => item.id === customer) || customers[0];
  const title = step === 1 ? 'Choose a customer' : step === 2 ? 'Project details' : 'Pick a factory';

  return (
    <ModalFrame title="New quote" eyebrow={`Step ${step} of 3 - ${title}`} onClose={onClose}>
      <div className={styles.progressDots}>
        {[1, 2, 3].map((item) => <span className={item <= step ? styles.progressDotActive : ''} key={item} />)}
      </div>
      {step === 1 && (
        <>
          <input className={styles.search} placeholder="Search customer..." />
          <div className={styles.choiceGrid}>
            {customers.map((item) => (
              <button className={`${styles.choiceCard} ${customer === item.id ? styles.choiceActive : ''}`} type="button" key={item.id} onClick={() => setCustomer(item.id)}>
                <strong>{item.name}</strong>
                <span>{item.contact} · {item.email}</span>
              </button>
            ))}
            <button className={styles.choiceCard} type="button">
              <strong>Create new customer</strong>
              <span>Add account details before continuing.</span>
            </button>
          </div>
        </>
      )}
      {step === 2 && (
        <div className={styles.formGrid}>
          <DetailItem label="Customer" value={selectedCustomer.name} />
          <input className={styles.search} placeholder="Project name *" defaultValue={`${selectedCustomer.name} Project`} />
          <input className={styles.search} placeholder="Project address" />
          <select className={styles.selectControl} defaultValue="renovation" aria-label="Project type">
            <option value="renovation">Renovation</option>
            <option value="new-build">New build</option>
            <option value="multi-family">Multi-family</option>
          </select>
          <input className={styles.search} placeholder="Target install date" />
          <select className={styles.selectControl} defaultValue={selectedCustomer.contact} aria-label="Quote contact">
            <option>{selectedCustomer.contact}</option>
            <option>Add new contact</option>
          </select>
        </div>
      )}
      {step === 3 && (
        <div className={styles.choiceGrid}>
          {['Continental Full-Line', 'North Plant', 'East Plant', 'Coastline'].map((factory) => (
            <button className={styles.choiceCard} type="button" key={factory}>
              <strong>{factory}</strong>
              <span>Windows · Entry · Patio</span>
            </button>
          ))}
        </div>
      )}
      <ModalFooter
        backDisabled={step === 1}
        nextLabel={step === 3 ? 'Create quote' : 'Continue'}
        onBack={() => setStep((value) => Math.max(1, value - 1))}
        onNext={() => step === 3 ? onComplete() : setStep((value) => value + 1)}
        onCancel={onClose}
      />
    </ModalFrame>
  );
}

function CustomerModal({ onClose }) {
  return (
    <ModalFrame title="Add customer" eyebrow="Capture account details" onClose={onClose}>
      <div className={styles.formGrid}>
        <input className={styles.search} placeholder="Account name *" />
        <select className={styles.selectControl} defaultValue="Builder" aria-label="Account type">
          <option>Single-family</option>
          <option>Custom home</option>
          <option>Builder</option>
          <option>Multi-family</option>
          <option>Architect</option>
          <option>Commercial</option>
        </select>
        <select className={styles.selectControl} defaultValue="Active" aria-label="Status">
          <option>Active</option>
          <option>Prospect</option>
          <option>Inactive</option>
        </select>
        <input className={styles.search} placeholder="Contact name *" />
        <input className={styles.search} placeholder="Role" />
        <input className={styles.search} placeholder="Email *" />
        <input className={styles.search} placeholder="Phone" />
        <input className={styles.search} placeholder="Street address" />
        <input className={styles.search} placeholder="City" />
        <textarea className={styles.search} rows="3" placeholder="Internal notes" />
      </div>
      <ModalFooter nextLabel="Save customer" onCancel={onClose} onNext={onClose} />
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

function QuoteSummary({ quote }) {
  return (
    <>
      <div className={styles.detailHeader}>
        <div>
          <span className={styles.eyebrow}>{quote.id}</span>
          <h2 className={styles.detailTitle}>{quote.customer}</h2>
          <p className={styles.muted}>{quote.address}</p>
        </div>
        <span className={`${styles.status} ${statusClass(quote.status)}`}>{quote.status}</span>
      </div>
      <div className={styles.detailGrid}>
        <DetailItem label="Contact" value={quote.contact} />
        <DetailItem label="Units" value={quote.units} />
        <DetailItem label="Value" value={formatCurrency(quote.value)} />
        <DetailItem label="Margin" value={quote.margin} />
      </div>
      <p className={styles.empty}>{quote.nextStep}</p>
      <div className={styles.actions}>
        <Link className={styles.buttonSecondary} to={`/quotes/${quote.id}`}>View PDF</Link>
        <Link className={styles.button} to={`/quotes/${quote.id}/configurator`}>Configure</Link>
      </div>
    </>
  );
}

function OrderSummary({ order }) {
  return (
    <>
      <div className={styles.detailHeader}>
        <div>
          <span className={styles.eyebrow}>{order.id}</span>
          <h2 className={styles.detailTitle}>{order.customer}</h2>
          <p className={styles.muted}>Linked quote {order.quoteId}</p>
        </div>
        <span className={`${styles.status} ${statusClass(order.status)}`}>{order.status}</span>
      </div>
      <div className={styles.detailGrid}>
        <DetailItem label="Factory" value={order.factory} />
        <DetailItem label="Ship date" value={order.shipDate} />
        <DetailItem label="Documents" value={order.documents} />
        <DetailItem label="Value" value={order.value} />
      </div>
      <p className={styles.empty}>Document drawer, factory chat, and approval controls will attach to this region.</p>
    </>
  );
}

function CustomerSummary({ customer }) {
  return (
    <>
      <div className={styles.detailHeader}>
        <div>
          <span className={styles.eyebrow}>{customer.segment}</span>
          <h2 className={styles.detailTitle}>{customer.name}</h2>
          <p className={styles.muted}>{customer.contact} · {customer.email}</p>
        </div>
        <span className={`${styles.status} ${statusClass(customer.status)}`}>{customer.status}</span>
      </div>
      <div className={styles.detailGrid}>
        <DetailItem label="Pipeline" value={customer.pipeline} />
        <DetailItem label="Open quotes" value={customer.openQuotes} />
        <DetailItem label="Primary contact" value={customer.contact} />
        <DetailItem label="Customer ID" value={customer.id} />
      </div>
      <p className={styles.empty}>Customer notes, activities, and related orders will live here.</p>
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

function countByStatus(items, key) {
  return items.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
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
