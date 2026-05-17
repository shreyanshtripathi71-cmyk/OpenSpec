import styles from './Inspector.module.css';

const SECTION_CONFIG = [
  { id: 'layout',        num: 1, shortLabel: 'Layout' },
  { id: 'exterior',      num: 2, shortLabel: 'Exterior' },
  { id: 'interior',      num: 3, shortLabel: 'Interior' },
  { id: 'glass-options', num: 4, shortLabel: 'Glass Options' },
  { id: 'glass-design',  num: 5, shortLabel: 'Glass Design' },
];

/* Right-rail inspector. Owns the chrome (product header + tab strip +
   scrolling body + previous/next footer) and dispatches to whichever
   `…Tab` component the page hands in via `children` for the active step.

   `tabHasCustomization` is a `{ [tabId]: boolean }` map; truthy values
   show a small dot on that tab to hint that the user has changed
   something inside it. */
export function Inspector({
  windowTypeLabel,
  productCode,
  activeStep,
  onChangeStep,
  tabHasCustomization,
  children,
}) {
  const currentIndex = SECTION_CONFIG.findIndex((s) => s.id === activeStep);
  const goToPrev = () => { if (currentIndex > 0)                          onChangeStep(SECTION_CONFIG[currentIndex - 1].id); };
  const goToNext = () => { if (currentIndex < SECTION_CONFIG.length - 1)  onChangeStep(SECTION_CONFIG[currentIndex + 1].id); };

  return (
    <aside className={styles.inspector}>
      {/* Top accent bar — legacy: height:3px;background:linear-gradient(90deg,#2e5bc8,#3568d6) */}
      <div className={styles.accentBar} />
      <header className={styles.productHeadSlim}>
        <div className={styles.productHeadSlimLeft}>
          <h2 className={styles.productHeadSlimTitle}>{windowTypeLabel}</h2>
          <span className={styles.productHeadSlimType}>{productCode}</span>
        </div>
        <span className={styles.productHeadStatus}>
          <span className={styles.productHeadStatusDot} />
          Configured
        </span>
      </header>

      <nav className={styles.tabs}>
        {SECTION_CONFIG.map((sec) => (
          <button
            key={sec.id}
            type="button"
            className={`${styles.tab} ${activeStep === sec.id ? styles.tabActive : ''}`}
            onClick={() => onChangeStep(sec.id)}
          >
            <span className={styles.tabNum}>{sec.num}</span>
            {sec.shortLabel}
            {tabHasCustomization[sec.id] && <span className={styles.tabBadge} />}
          </button>
        ))}
      </nav>

      <div className={styles.inspectorBody}>{children}</div>

      <footer className={styles.inspectorFooter}>
        <div className={styles.footerLeft}>
          {currentIndex > 0 && (
            <button className={styles.footerBtn} type="button" onClick={goToPrev}>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <path d="M10 12 6 8l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Previous
              <span className={styles.footerKey}>←</span>
            </button>
          )}
        </div>
        <div className={styles.footerRight}>
          {currentIndex < SECTION_CONFIG.length - 1 && (
            <button className={styles.footerBtn} type="button" onClick={goToNext}>
              Next
              <span className={styles.footerKey}>→</span>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </footer>
    </aside>
  );
}

/* ── Re-export `SECTION_CONFIG` so callers can render tab-specific
   content from the same source of truth (e.g. iterating to compute
   `tabHasCustomization` or driving Prev/Next from the parent). ── */
export { SECTION_CONFIG };

/* ── Energy stat card (used by the Interior tab's Performance group). ── */
export function EnergyCard({ label, value }) {
  return (
    <div className={styles.energyCard}>
      <div className={styles.energyCardLabel}>{label}</div>
      <div className={styles.energyCardValue}>{value}</div>
    </div>
  );
}

export const inspectorStyles = styles;
