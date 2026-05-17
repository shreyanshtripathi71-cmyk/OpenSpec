import styles from './Breadcrumb.module.css';

/* Sub-header that sits below the OsNav. Shows the dealer's location
   in the order tree (Back / quote # / unit / spec chip) plus the
   four right-side actions (saved indicator, unlock toggle, View PDF,
   Save & close). */
export function Breadcrumb({
  quoteNumber,
  unitLabel,
  specLabel,
  lastSavedAt,
  onSaveClose,
}) {
  return (
    <div className={styles.osBcRow}>
      <div className={styles.osBcLeftRow}>
        <a href="/windows" className={styles.osBcBackBtn}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M10 12 6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Back
        </a>
        <span className={styles.osBcQuote}>{quoteNumber}</span>
        <span className={styles.osBcDivider}>/</span>
        <span className={styles.osBcUnit}>{unitLabel}</span>
        <span className={styles.osBcSpec}>{specLabel}</span>
      </div>

      <div className={styles.osBcRightRow}>
        <span className={styles.osBcSave}>
          <span className={styles.osBcSaveDot} />
          {lastSavedAt ? 'Saved' : 'Saving…'}
        </span>

        <button className={styles.osBcLockBtn} type="button" title="Lock Column Widths">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M4 7V5a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Unlocked
        </button>

        <button className={styles.osBcViewPdfBtn} type="button" title="View PDF">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M3 2h7l3 3v9H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 2v3h3"      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.5 8h5M5.5 11h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          View PDF
        </button>

        <button className={styles.osBcSaveCloseBtn} type="button" onClick={onSaveClose}>
          Save &amp; close
        </button>
      </div>
    </div>
  );
}
