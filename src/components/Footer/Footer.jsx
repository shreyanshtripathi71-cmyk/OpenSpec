import styles from './Footer.module.css';

/* Sticky bottom KPI bar. Shows quote total + line count + the
   export/email/submit actions. */
export function Footer({ quoteTotal, lineCount, onSubmit }) {
  const fmt = quoteTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <footer className={styles.osFoot}>
      <div className={styles.osFootLeft}>
        <div className={styles.osFootKpi}>
          <div className={styles.osFootKpiLabel}>Quote total</div>
          <div className={styles.osFootKpiValue}>
            ${fmt}
            <span className={styles.osFootKpiCcy}>CAD</span>
          </div>
        </div>
        <span className={styles.osFootDiv} />
        <div className={styles.osFootKpi}>
          <div className={styles.osFootKpiLabel}>{lineCount} of {lineCount || '—'} valid</div>
          <div className={styles.osFootValid}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="m4 8 3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {lineCount === 0 ? 'Awaiting first unit' : 'Ready to submit'}
          </div>
        </div>
      </div>

      <div className={styles.osFootRight}>
        <button className={styles.osFootBtn} type="button" title="Export PDF">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 8v4a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8M5 5l3-3 3 3M8 2v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export PDF
        </button>
        <button className={`${styles.osFootBtn} ${styles.osFootBtnEmail}`} type="button" title="Email Quote">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12v8H2zM2 4l6 5 6-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Email
        </button>
        <button
          className={`${styles.osFootBtn} ${styles.osFootBtnPrimary}`}
          type="button"
          onClick={onSubmit}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Send to factory
        </button>
      </div>
    </footer>
  );
}
