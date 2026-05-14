import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import styles from './Select.module.css';

/* Dropdown select that closes when you click anywhere outside it.
   Memo'd so the inspector tabs don't re-render the select tree on
   every parent state change. */
export const Select = React.memo(function Select({
  value, options, onChange, placeholder, showPriceAddon = true,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const click = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', click);
    return () => document.removeEventListener('mousedown', click);
  }, []);

  return (
    <div className={styles.select} ref={ref}>
      <button
        type="button"
        className={`${styles.selectTrigger} ${open ? styles.selectTriggerOpen : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span className={styles.selectValue}>
          {selected?.icon && <span className={styles.selectIcon}>{selected.icon}</span>}
          {selected?.label || placeholder || 'Select'}
          {showPriceAddon && selected?.priceAddon !== undefined && selected.priceAddon > 0 && (
            <span className={styles.selectAddon}>+${selected.priceAddon.toFixed(2)}</span>
          )}
        </span>
        <span className={`${styles.selectChev} ${open ? styles.selectChevOpen : ''}`}>
          <Icon name="chevron-down" size={14} />
        </span>
      </button>

      {open && (
        <div className={styles.selectMenu}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.selectOpt} ${opt.value === value ? styles.selectOptActive : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.icon && <span className={styles.selectIcon}>{opt.icon}</span>}
              <span className={styles.selectOptInfo}>
                <span className={styles.selectOptLabel}>{opt.label}</span>
                {opt.description && <span className={styles.selectOptDesc}>{opt.description}</span>}
              </span>
              {showPriceAddon && opt.priceAddon !== undefined && opt.priceAddon > 0 && (
                <span className={styles.selectOptPrice}>+${opt.priceAddon.toFixed(2)}</span>
              )}
              {opt.value === value && <span className={styles.selectOptCheck}><Icon name="check" size={14} /></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
