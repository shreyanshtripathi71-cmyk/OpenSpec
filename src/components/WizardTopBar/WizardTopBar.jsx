import styles from './WizardTopBar.module.css';

/* Brand + breadcrumb shown at the top of the wizard. The main
   configurator screen uses its own .osNav header (still inline in
   ConfiguratorPage.jsx — to be extracted in phase 2). */
export function WizardTopBar({ typeId, typeLabel }) {
  return (
    <header className={styles.topbar}>
      <div className={styles.topLeft}>
        <a href="/" className={styles.brand}>
          <span className={styles.brandMark}>O</span>
          <span className={styles.brandText}>OpenSpec</span>
        </a>
        <span className={styles.topDivider} />
        <div className={styles.crumbs}>
          <a href="/windows">Catalog</a>
          <span className={styles.crumbDot} />
          <a href={`/windows/${typeId}`}>{typeLabel}</a>
          <span className={styles.crumbDot} />
          <span className={styles.crumbCurrent}>Configure</span>
        </div>
      </div>
      <div />
      <div className={styles.topRight} />
    </header>
  );
}
