import React from 'react';
import { Icon } from './Icon';
import styles from './Stepper.module.css';

/* Number stepper with [- N +] controls. `decimals` controls how
   many fractional digits we render (we still allow free-form input
   on the field — `clamp` keeps it inside [min, max]). */
export const Stepper = React.memo(function Stepper({
  value, onChange, min = 1, max = 999, step = 1, unit, decimals = 0, compact = false,
}) {
  const clamp = (v) => Math.max(min, Math.min(max, v));
  const fmt   = (v) => decimals > 0 ? v.toFixed(decimals).replace(/\.?0+$/, '') : `${v}`;
  return (
    <div className={`${styles.stepper} ${compact ? styles.stepperCompact : ''}`}>
      <button type="button" className={styles.stepperBtn} onClick={() => onChange(clamp(value - step))} aria-label="decrement">
        <Icon name="minus" size={13} />
      </button>
      <input
        className={styles.stepperInput}
        type="number"
        value={fmt(value)}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (!isNaN(n)) onChange(clamp(n));
          else if (e.target.value === '') onChange(0);
        }}
        step={step}
        min={min}
        max={max}
      />
      {unit && <span className={styles.stepperUnit}>{unit}</span>}
      <button type="button" className={styles.stepperBtn} onClick={() => onChange(clamp(value + step))} aria-label="increment">
        <Icon name="plus" size={13} />
      </button>
    </div>
  );
});
