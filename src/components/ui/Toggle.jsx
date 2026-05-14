import React from 'react';
import styles from './Toggle.module.css';

export const Toggle = React.memo(function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      className={`${styles.toggle} ${value ? styles.toggleOn : ''}`}
      onClick={() => onChange(!value)}
      aria-pressed={value}
    >
      <span className={styles.toggleDot} />
    </button>
  );
});
