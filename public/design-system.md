# OpenSpec Design System Reference
> For developers recreating the UI in React

## Quick Start
The legacy portals are now organized into clean folders:
```
public/
├── login/         → index.html + styles.css
├── master-login/  → index.html + styles.css
├── sales/         → index.html + styles.css + app.js
├── factory/       → index.html + styles.css + app.js
└── landing.html   → Compiled static (do not modify)
```

The React configurator lives in `src/` and already uses this design system.

---

## 🎨 Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#2e5bc8` | Primary buttons, active states, links, selection indicators |
| `--accent-hover` | `#2651b3` | Button hover states |
| `--accent-light` | `#F0F6FF` | Selected item backgrounds |
| `--accent-ring` | `#eaeaf2` | Hover card backgrounds |
| `--text` | `#0F172A` | Primary text, headings |
| `--text-mute` | `#64748B` | Secondary text, labels |
| `--text-faint` | `#94A3B8` | Placeholder text, disabled |
| `--border` | `#E2E8F0` | All borders, dividers |
| `--surface` | `#FFFFFF` | Card backgrounds, panels |
| `--body-bg` | `#FAFBFC` | Page background |
| `--success` | `#16A34A` | Success states, sales role |
| `--danger` | `#DC2626` | Error states, destructive actions |
| `--warning` | `#F59E0B` | Warning badges |
| `--purple` | `#7C3AED` | Factory role accent |

### Role Colors (User Icons)
| Role | Background | Text |
|------|-----------|------|
| Master Admin | `#2e5bc8` | `#FFFFFF` |
| Dealer | `#94A3B8` | `#FFFFFF` |
| Sales Rep | `#16A34A` | `#FFFFFF` |
| Factory Owner | `#7C3AED` | `#FFFFFF` |

---

## 📐 Typography

### Font Stack
```css
/* UI text */
font-family: 'Inter', system-ui, -apple-system, sans-serif;

/* Monospace / data */
font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace;
```

### Scale
| Element | Size | Weight | Letter-spacing |
|---------|------|--------|---------------|
| Page title | 22-26px | 600-700 | -0.025em |
| Section title | 15-17px | 600 | -0.012em |
| Body text | 13-13.5px | 400-500 | -0.005em |
| Labels (uppercase) | 10-11px | 600-700 | 0.04-0.08em |
| Small text | 11px | 400-500 | normal |
| Monospace data | 12-13px | 500-600 | -0.01em |

---

## 📦 Component Patterns

### Buttons
```css
/* Primary button */
.btn-primary {
  background: #2e5bc8;
  color: #fff;
  border: none;
  border-radius: 2px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms;
}
.btn-primary:hover { background: #2651b3; }

/* Ghost button */
.btn-ghost {
  background: transparent;
  border: 1px solid #E2E8F0;
  border-radius: 2px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;
}
.btn-ghost:hover { border-color: #94A3B8; color: #0F172A; }
```

### Cards / Panels
```css
.panel {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 2px;           /* sharp corners throughout */
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #E2E8F0;
  font-size: 13px;
  font-weight: 600;
}
.panel-body {
  padding: 16px;
}
```

### Form Inputs
```css
.form-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 2px;
  font-size: 13px;
  background: #FAFBFC;
  outline: none;
  transition: border-color 120ms;
}
.form-input:focus {
  border-color: #2e5bc8;
  background: #fff;
}
```

### Selection Tiles (Product Options)
```css
/* Tile container */
.tile { 
  position: relative;
  padding: 10px 8px;
  border: 1px solid #E2E8F0;
  border-radius: 2px;
  cursor: pointer;
  text-align: center;
  transition: border-color 120ms, background 120ms;
}

/* Selected state */
.tile.selected {
  border: 2px solid #2e5bc8;
  background: #F0F6FF;
}

/* Selection checkmark (positioned top-right) */
.tile-check {
  position: absolute;
  top: 6px; right: 6px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: #2e5bc8;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Navigation (Topbar)
```css
.nav-bar {
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #E2E8F0;
}

.nav-item {
  padding: 9px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  border: none;
  background: transparent;
  cursor: pointer;
}
.nav-item:hover {
  color: #0F172A;
  background: #F1F5F9;
}
.nav-item.active {
  color: #0F172A;
  background: #F1F5F9;
}
```

### Tabs (Segment Controls)
```css
.tab {
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 3px;
  cursor: pointer;
}
.tab.active {
  background: #2e5bc8;
  color: #fff;
  border-color: #2e5bc8;
}
```

### Status Badges
```css
/* Generic badge pattern */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 2px;
}

/* Status variants */
.badge-success { background: #DCFCE7; color: #16A34A; }
.badge-warning { background: #FEF9C3; color: #CA8A04; }
.badge-danger  { background: #FEE2E2; color: #DC2626; }
.badge-info    { background: #DBEAFE; color: #2563EB; }
.badge-neutral { background: #F1F5F9; color: #64748B; }
```

### KPI Cards
```css
.kpi-card {
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 2px;
  padding: 16px 18px;
}
.kpi-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94A3B8;
  margin-bottom: 6px;
}
.kpi-value {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  font-family: 'IBM Plex Mono', monospace;
}
```

---

## 📐 Spacing & Layout

| Pattern | Value |
|---------|-------|
| Page padding | `24px` horizontal |
| Card padding | `16-18px` |
| Grid gap | `10-14px` |
| Section gap | `20-24px` |
| Border radius | `2-3px` (sharp/boxy look) |
| Nav height | `64px` |
| Sidebar width | `280px` (factory) |

---

## 🔀 Page → React Component Mapping

### Login (`/login/`)
| HTML Element | React Component |
|-------------|-----------------|
| `<nav class="nav">` | `<OsNav />` (already exists) |
| `<div class="login-card">` | `<LoginCard />` |
| `<div class="user-grid">` | `<PortalSelector />` |
| `<a class="user-card">` | `<UserCard role={} href={} />` |
| `<div class="divider-text">` | `<Divider label="" />` |
| Login form inputs | `<LoginForm onSubmit={} />` |

### Sales (`/sales/`)
| HTML Element | React Component |
|-------------|-----------------|
| Top navigation | `<SalesNav activeView={} />` |
| `#dashboard-view` | `<DashboardView />` |
| `#quotesList-view` | `<QuotesListView />` |
| `#orders-view` | `<OrdersView />` |
| Quote configurator | `<ConfiguratorPage />` (**already in React**) |
| Customer list | `<CustomersView />` |
| Calendar | `<CalendarView />` |

### Factory (`/factory/`)
| HTML Element | React Component |
|-------------|-----------------|
| Sidebar + topbar | `<FactoryShell />` |
| Dashboard KPIs | `<KpiStrip cards={} />` |
| Orders pipeline | `<PipelineBoard stages={} />` |
| Order detail | `<OrderDetail order={} />` |
| Production schedule | `<ScheduleView />` |
| Inventory | `<InventoryView />` |
| Settings | `<SettingsView tabs={} />` |

### Master Login (`/master-login/`)
| HTML Element | React Component |
|-------------|-----------------|
| Login screen | `<AdminLoginScreen />` |
| App topbar | `<AdminTopbar />` |
| Tenants table | `<TenantsTable />` |
| Tenant detail modal | `<TenantModal />` |
| Add tenant wizard | `<AddTenantWizard />` |

---

## 🎯 Design Principles

1. **Flat & Sharp** — No rounded corners (2-3px max), no gradients, no shadows beyond subtle 1px
2. **Enterprise Blue** — All interactive elements use `#2e5bc8`, never dark/black for CTAs
3. **Monospace for Data** — Use IBM Plex Mono for prices, dates, counts, IDs
4. **Dense Layout** — Small fonts (11-13px), tight padding — enterprise density
5. **Minimal Animation** — Only `120ms ease` transitions on border/background/color
6. **Boxy Grid** — Square tiles for product options, sharp-cornered cards
