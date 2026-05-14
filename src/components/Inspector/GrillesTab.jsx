import {
  Field,
  Group,
  Select,
  Stepper,
  Toggle,
  GrillPatternIcon,
  GrillBarTypeIcon,
  layoutStyles,
} from '../ui';
import {
  GRILL_PATTERNS,
  GRILL_BAR_TYPES,
  GRILL_BAR_SIZES,
  GRILL_COLORS,
  PRAIRIE_H_BAR_LAYOUTS,
  PRAIRIE_V_BAR_LAYOUTS,
} from '@/data/configuratorData';
import styles from './GrillesTab.module.css';

/* Inspector → Glass design → Grilles block.
   Owns the toggle that adds/removes grilles, and the pattern /
   profile / size / colour configuration for the selected cell.
   Prairie pattern unlocks an extra "Prairie configuration" group. */
export function GrillesTab({ cell, config, onUpdateCell, onQuickUpdateCell }) {
  const enabled = cell.grillPattern !== 'none';
  return (
    <>
      <div className={styles.selectedCellCard}>
        <span className={styles.selectedCellMark}>{cell.id}</span>
        <div className={styles.selectedCellInfo}>
          <div className={styles.selectedCellTitle}>Grilles</div>
          <div className={styles.selectedCellMeta}>{enabled ? cell.grillPattern : 'None applied'}</div>
        </div>
        <Toggle
          value={enabled}
          onChange={(v) => {
            if (!v) onUpdateCell({ grillPattern: 'none' });
            else {
              const cellWidth = config.frameWidth / (config.grid.horizontalCount || 1);
              const cellHeight = cell.height || config.frameHeight / (config.grid.verticalCount || 1);
              onUpdateCell({
                grillPattern: 'colonial',
                grillVertical:   Math.max(1, Math.round(cellWidth / 10) - 1),
                grillHorizontal: Math.max(1, Math.round(cellHeight / 10) - 1),
              });
            }
          }}
        />
      </div>

      {enabled && (
        <>
          <Group title="Pattern">
            <div className={`${styles.tiles} ${styles.tilesCol4}`}>
              {GRILL_PATTERNS.filter((p) => p.value !== 'none').map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`${styles.tile} ${cell.grillPattern === p.value ? styles.tileActive : ''}`}
                  onClick={() => {
                    const updates = { grillPattern: p.value };
                    if (p.value === 'prairie') {
                      Object.assign(updates, {
                        prairieHBarLayout: 'top-and-bottom',
                        prairieVBarLayout: 'left-and-right',
                        prairieHBarDaylight: 5.0,
                        prairieVBarDaylight: 5.0,
                        prairieBarSpacing:   5,
                        prairieLadderHead: 0, prairieLadderSill: 0,
                        prairieLadderLeft: 0, prairieLadderRight: 0,
                        prairieHSupportBars: 0, prairieVSupportBars: 0,
                      });
                    }
                    if (p.value === 'ladder')  Object.assign(updates, { grillHorizontal: 1, grillVertical: 4, ladderBarSpacing: 20 });
                    if (p.value === 'diamond') Object.assign(updates, { grillHorizontal: 4, grillVertical: 4 });
                    onUpdateCell(updates);
                  }}
                  title={p.description || p.label}
                >
                  <span className={styles.tileIcon}><GrillPatternIcon pattern={p.value} /></span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </Group>

          <Group title="Bar profile">
            <div className={`${styles.tiles} ${styles.tilesCol4}`}>
              {GRILL_BAR_TYPES.map((bt) => (
                <button
                  key={bt.value}
                  type="button"
                  className={`${styles.tile} ${cell.grillBarType === bt.value ? styles.tileActive : ''}`}
                  onClick={() => onUpdateCell({ grillBarType: bt.value })}
                >
                  <span className={styles.tileIcon}><GrillBarTypeIcon barType={bt.value} /></span>
                  <span>{bt.label}</span>
                </button>
              ))}
            </div>
          </Group>

          <Group title="Bar size">
            <div className={`${styles.tiles} ${styles.tilesCol3}`}>
              {GRILL_BAR_SIZES.map((sz) => (
                <button
                  key={sz.value}
                  type="button"
                  className={`${styles.tile} ${cell.grillBarSize === sz.value ? styles.tileActive : ''}`}
                  onClick={() => onUpdateCell({ grillBarSize: sz.value })}
                >
                  <span style={{ fontSize: 15, fontWeight: 700, fontFeatureSettings: '"tnum"' }}>{sz.label}</span>
                  {sz.priceAddon
                    ? <span className={styles.tilePrice}>+${sz.priceAddon.toFixed(2)}</span>
                    : <span className={styles.tilePrice}>included</span>}
                </button>
              ))}
            </div>
          </Group>

          <Field label="Grille colour">
            <Select value={cell.grillColor} options={GRILL_COLORS} onChange={(v) => onUpdateCell({ grillColor: v })} />
          </Field>

          {(cell.grillPattern === 'colonial' || cell.grillPattern === 'ladder' || cell.grillPattern === 'diamond') && (
            <Group title={cell.grillPattern === 'diamond' ? 'Points' : 'Lines'}>
              <div className={layoutStyles.fieldGrid2}>
                <Field label={cell.grillPattern === 'diamond' ? 'Horizontal points' : 'Horizontal lines'}>
                  <Stepper value={cell.grillHorizontal} onChange={(v) => onQuickUpdateCell({ grillHorizontal: v })} min={1} max={10} />
                </Field>
                <Field label={cell.grillPattern === 'diamond' ? 'Vertical points' : 'Vertical lines'}>
                  <Stepper value={cell.grillVertical} onChange={(v) => onQuickUpdateCell({ grillVertical: v })} min={1} max={10} />
                </Field>
              </div>
              {cell.grillPattern === 'ladder' && (
                <Field label="Bar spacing">
                  <Stepper value={cell.ladderBarSpacing || 16} onChange={(v) => onQuickUpdateCell({ ladderBarSpacing: v })} min={4} max={40} unit="in" />
                </Field>
              )}
            </Group>
          )}

          {cell.grillPattern === 'prairie' && (
            <Group title="Prairie configuration">
              <Field label="Horizontal bar layout">
                <Select value={cell.prairieHBarLayout || ''} options={PRAIRIE_H_BAR_LAYOUTS} onChange={(v) => onUpdateCell({ prairieHBarLayout: v })} />
              </Field>
              <Field label="Vertical bar layout">
                <Select value={cell.prairieVBarLayout || ''} options={PRAIRIE_V_BAR_LAYOUTS} onChange={(v) => onUpdateCell({ prairieVBarLayout: v })} />
              </Field>
              <div className={layoutStyles.fieldGrid2}>
                <Field label="H support bars"><Stepper value={cell.prairieHSupportBars || 0} onChange={(v) => onQuickUpdateCell({ prairieHSupportBars: v })} min={0} max={10} /></Field>
                <Field label="V support bars"><Stepper value={cell.prairieVSupportBars || 0} onChange={(v) => onQuickUpdateCell({ prairieVSupportBars: v })} min={0} max={10} /></Field>
              </div>
              <div className={layoutStyles.fieldGrid2}>
                <Field label="H bar daylight"><Stepper value={cell.prairieHBarDaylight || 5} onChange={(v) => onQuickUpdateCell({ prairieHBarDaylight: v })} min={1} max={20} step={0.5} unit="in" decimals={1} /></Field>
                <Field label="V bar daylight"><Stepper value={cell.prairieVBarDaylight || 5} onChange={(v) => onQuickUpdateCell({ prairieVBarDaylight: v })} min={1} max={20} step={0.5} unit="in" decimals={1} /></Field>
              </div>
              <div className={layoutStyles.fieldGrid2}>
                <Field label="Ladder count head"><Stepper value={cell.prairieLadderHead || 0} onChange={(v) => onQuickUpdateCell({ prairieLadderHead: v })} min={0} max={10} /></Field>
                <Field label="Ladder count sill"><Stepper value={cell.prairieLadderSill || 0} onChange={(v) => onQuickUpdateCell({ prairieLadderSill: v })} min={0} max={10} /></Field>
              </div>
              <div className={layoutStyles.fieldGrid2}>
                <Field label="Ladder count left"><Stepper value={cell.prairieLadderLeft || 0} onChange={(v) => onQuickUpdateCell({ prairieLadderLeft: v })} min={0} max={10} /></Field>
                <Field label="Ladder count right"><Stepper value={cell.prairieLadderRight || 0} onChange={(v) => onQuickUpdateCell({ prairieLadderRight: v })} min={0} max={10} /></Field>
              </div>
            </Group>
          )}
        </>
      )}
    </>
  );
}
