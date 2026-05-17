import styles from './Layout.module.css';

/* Label-above-input row. Used by every inspector tab. */
export function Field({ label, children }) {
  return (
    <div className={styles.field}>
      {label && <span className={styles.fieldLabel}>{label}</span>}
      {children}
    </div>
  );
}

/* Titled section. Renders the small uppercase title + the children
   below it. Used inside every inspector tab. */
export function Group({ title, children }) {
  return (
    <section className={styles.group}>
      <header className={styles.groupHead}>
        <span className={styles.groupTitle}>{title}</span>
      </header>
      {children}
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
   DetailsBox — collapsible white card section
   ────────────────────────────────────────────────────────────
   Renders a native <details> element styled as a white card
   with box-shadow, matching the legacy OpenSpec configurator.
   
   Props:
     title       — bold section title (left of summary)
     chip        — optional value chip shown on the right
     chipColor   — 'blue' (default) | 'amber' | 'green'
     defaultOpen — whether to render open initially (default: true)
     pinned      — if true, cannot be collapsed (always open, no arrow)
     children    — the section body
*/
export function DetailsBox({
  title,
  chip,
  chipColor = 'blue',
  defaultOpen = true,
  pinned = false,
  children,
}) {
  const chipClass = chipColor === 'amber'
    ? styles.detailsChipAmber
    : chipColor === 'green'
      ? styles.detailsChipGreen
      : chipColor === 'red'
        ? styles.detailsChipRed
        : styles.detailsChip;

  return (
    <details
      className={styles.detailsBox}
      open={defaultOpen || pinned || undefined}
      {...(pinned ? { 'data-pinned': 'true' } : {})}
    >
      <summary className={styles.detailsSummary}>
        <span className={styles.detailsTitle}>{title}</span>
        {chip && <span className={chipClass}>{chip}</span>}
      </summary>
      <div className={styles.detailsBody}>
        {children}
      </div>
    </details>
  );
}

/* Re-export class names for tabs that need to use the raw layout
   utilities (grid-2, row, hairline) directly inside their JSX. */
export const layoutStyles = styles;
