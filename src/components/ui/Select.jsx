import React from 'react';

/* Native <select> — exact copy of the legacy OpenSpec configurator's
   `.select` class. Uses the OS-native dropdown popup.
   Options format: [{ value, label, priceAddon?, description? }] */
export const Select = React.memo(function Select({
  value, options, onChange, showPriceAddon = true,
}) {
  return (
    <select
      className="native-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
          {showPriceAddon && opt.priceAddon > 0 ? ` +$${opt.priceAddon}` : ''}
          {showPriceAddon && opt.priceAddon === 0 ? ' included' : ''}
        </option>
      ))}
    </select>
  );
});
