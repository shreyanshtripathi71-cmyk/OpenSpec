import { Link, NavLink, useLocation } from 'react-router-dom';

import styles from './OsNav.module.css';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', match: ['/dashboard'] },
  { label: 'Quotes', to: '/quotes', match: ['/quotes'] },
  { label: 'Orders', to: '/orders', match: ['/orders'] },
  { label: 'Customers', to: '/customers', match: ['/customers'] },
  { label: 'Calendar', to: '/calendar', match: ['/calendar'] },
  { label: 'Commissions', to: '/commissions', match: ['/commissions'] },
  { label: 'Settings', to: '/settings', match: ['/settings'] },
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
          <div className={styles.osNavLogoMark} />
          <span className={styles.osNavWordmark}>OpenSpec</span>
        </Link>
        <nav className={styles.osNavMenu}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={`${styles.osNavItem} ${isActive(item) ? styles.osNavItemActive : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className={styles.osNavRight}>
        <span className={styles.osNavTipText}>
          Tip: <kbd>⌘K</kbd> opens the command palette
        </span>
        <button className={styles.osNavTheme} type="button" title="Toggle light / dark mode">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <span>Dark</span>
        </button>
        <NavLink className={styles.osNavProfile} to="/help" title="Help & support">
          <span className={styles.osNavUserName}>Maple Street</span>
          <span className={styles.osNavUserAvatar}>RM</span>
        </NavLink>
      </div>
    </header>
  );
}
