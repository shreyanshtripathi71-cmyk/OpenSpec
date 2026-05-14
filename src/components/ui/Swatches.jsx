import React from 'react';
import styles from './Swatches.module.css';

export const Swatches = React.memo(function Swatches({ value, onChange, options }) {
  const selected = options.find((o) => o.value === value);
  return (
    <>
      <div className={styles.swatches}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`${styles.swatch} ${value === o.value ? styles.swatchActive : ''}`}
            style={{ background: o.hex }}
            onClick={() => onChange(o.value)}
            title={o.label}
            aria-label={o.label}
          />
        ))}
      </div>
      {selected && (
        <div className={styles.swatchSelectedName}>
          <span className={styles.pillDot} style={{ background: selected.hex }} />
          <span><strong>{selected.label}</strong></span>
        </div>
      )}
    </>
  );
});
