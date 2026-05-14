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

/* Re-export class names for tabs that need to use the raw layout
   utilities (grid-2, row, hairline) directly inside their JSX. */
export const layoutStyles = styles;
