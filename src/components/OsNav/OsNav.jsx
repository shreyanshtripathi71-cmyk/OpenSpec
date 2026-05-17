import { Link, NavLink, useLocation } from 'react-router-dom';

import styles from './OsNav.module.css';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', match: ['/dashboard'] },
  { label: 'Quotes', to: '/quotes', match: ['/quotes'] },
  { label: 'Orders', to: '/orders', match: ['/orders'] },
  { label: 'Customers', to: '/customers', match: ['/customers'] },
  { label: 'Calendar', to: '/calendar', match: ['/calendar'] },
  { label: 'Commissions', to: '/commissions', match: ['/commissions'] },
  { label: 'Settings', to: '/settings', match: ['/settings'], icon: true },
];

/* Top-of-page nav bar for the sales workspace. Brand + primary routes on
   the left, command-palette tip / theme toggle / user profile on the right. */
export function OsNav() {
  const { pathname } = useLocation();

  const isActive = (item) => item.match.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  return (
    <header className={styles.osNav}>
      <div className={styles.osNavLeft}>
        <Link to="/dashboard" className={styles.osNavBrand} aria-label="OpenSpec home">
          <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="16" height="16" rx="3.6" fill="#2e5bc8"/>
            <rect x="5" y="5" width="4" height="4" fill="#fff" opacity=".95"/>
            <rect x="11" y="5" width="4" height="4" fill="#fff" opacity=".7"/>
            <rect x="5" y="11" width="4" height="4" fill="#fff" opacity=".7"/>
            <rect x="11" y="11" width="4" height="4" fill="#fff" opacity=".95"/>
          </svg>
          <span className={styles.osNavWordmark}>OpenSpec</span>
        </Link>
        <nav className={styles.osNavMenu}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={`${styles.osNavItem} ${isActive(item) ? styles.osNavItemActive : ''}`}
            >
              {item.icon && (
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ marginRight: 5, display: 'inline-block', verticalAlign: '-2px' }}>
                  <path d="M8 5a3 3 0 110 6 3 3 0 010-6zM8 1v2M8 13v2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M1 8h2M13 8h2M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className={styles.osNavRight}>
        <span className={styles.osNavTipText}>
          Tip: <kbd>⌘K</kbd> opens the command palette
        </span>
        <button className={styles.osNavTheme} type="button" title="Toggle Light / Dark Mode">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <span>Dark</span>
        </button>
        <NavLink className={styles.osNavProfile} to="/help" title="Help & Support">
          <span className={styles.osNavUserName}>Maple Street</span>
          <span className={styles.osNavUserAvatar}>RM</span>
        </NavLink>
      </div>
    </header>
  );
}
