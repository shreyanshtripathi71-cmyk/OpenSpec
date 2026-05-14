import styles from './Toast.module.css';

/* One-shot success snackbar. Renders nothing when `toast` is null. */
export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.icon}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M4 8l3 3 5-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div>
        <div className={styles.strong}>{toast.msg}</div>
        {toast.sub && <div className={styles.sub}>{toast.sub}</div>}
      </div>
    </div>
  );
}

/* Centered full-screen "Updating…" overlay shown while a config
   change is being applied (the simulated 280ms delay in updateCell). */
export function UpdatingOverlay() {
  return (
    <div className={styles.updating}>
      <div className={styles.updatingPill}>
        <span className={styles.spinnerRing} /> Updating preview…
      </div>
    </div>
  );
}
