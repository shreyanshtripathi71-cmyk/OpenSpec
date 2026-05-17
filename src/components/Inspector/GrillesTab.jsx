import {
  Field,
  Group,
  DetailsBox,
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
  GRILL_BAR_SIZES_BY_TYPE,
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
          <DetailsBox title="Pattern" chip={cell.grillPattern} defaultOpen>
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
          </DetailsBox>

          <DetailsBox title="Grill Type" chip={cell.grillBarType} defaultOpen>
            <div className={`${styles.tiles} ${styles.tilesCol4}`}>
              {GRILL_BAR_TYPES.map((bt) => (
                <button
                  key={bt.value}
                  type="button"
                  className={`${styles.tile} ${cell.grillBarType === bt.value ? styles.tileActive : ''}`}
                  onClick={() => {
                    const sizes = GRILL_BAR_SIZES_BY_TYPE[bt.value] || GRILL_BAR_SIZES;
                    const currentValid = sizes.find(s => s.value === cell.grillBarSize);
                    const updates = { grillBarType: bt.value };
                    if (!currentValid) updates.grillBarSize = sizes[0]?.value || '5/16';
                    onUpdateCell(updates);
                  }}
                >
                  <span className={styles.tileIcon}><GrillBarTypeIcon barType={bt.value} /></span>
                  <span>{bt.label}</span>
                </button>
              ))}
            </div>
          </DetailsBox>

          <DetailsBox title="Bar Size" chip={cell.grillBarSize} defaultOpen>
            <div className={`${styles.tiles} ${styles.tilesCol3}`}>
              {(GRILL_BAR_SIZES_BY_TYPE[cell.grillBarType] || GRILL_BAR_SIZES).map((sz) => (
                <button
                  key={sz.value}
                  type="button"
                  className={`${styles.tile} ${cell.grillBarSize === sz.value ? styles.tileActive : ''}`}
                  onClick={() => onUpdateCell({ grillBarSize: sz.value })}
                >
                  <span style={{ fontSize: 15, fontWeight: 700, fontFeatureSettings: '"tnum"' }}>{sz.label}</span>
                </button>
              ))}
            </div>
          </DetailsBox>

          <Field label="Grille Colour">
            <Select value={cell.grillColor} options={GRILL_COLORS} onChange={(v) => onUpdateCell({ grillColor: v })} />
          </Field>

          {(cell.grillPattern === 'colonial' || cell.grillPattern === 'ladder' || cell.grillPattern === 'diamond') && (
            <DetailsBox title={cell.grillPattern === 'diamond' ? 'Points' : 'Lines'} defaultOpen>
              <div className={layoutStyles.fieldGrid2}>
                <Field label={cell.grillPattern === 'diamond' ? 'Horizontal points' : 'Horizontal lines'}>
                  <Stepper value={cell.grillHorizontal} onChange={(v) => onQuickUpdateCell({ grillHorizontal: v })} min={1} max={10} />
                </Field>
                <Field label={cell.grillPattern === 'diamond' ? 'Vertical points' : 'Vertical lines'}>
                  <Stepper value={cell.grillVertical} onChange={(v) => onQuickUpdateCell({ grillVertical: v })} min={1} max={10} />
                </Field>
              </div>
              {cell.grillPattern === 'ladder' && (
                <Field label="Bar Spacing">
                  <Stepper value={cell.ladderBarSpacing || 16} onChange={(v) => onQuickUpdateCell({ ladderBarSpacing: v })} min={4} max={40} unit="in" />
                </Field>
              )}
            </DetailsBox>
          )}

          {cell.grillPattern === 'prairie' && (
            <DetailsBox title="Prairie Configuration" defaultOpen={false}>
              <Field label="Horizontal Bar Layout">
                <Select value={cell.prairieHBarLayout || ''} options={PRAIRIE_H_BAR_LAYOUTS} onChange={(v) => onUpdateCell({ prairieHBarLayout: v })} />
              </Field>
              <Field label="Vertical Bar Layout">
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
                <Field label="Ladder Count Head"><Stepper value={cell.prairieLadderHead || 0} onChange={(v) => onQuickUpdateCell({ prairieLadderHead: v })} min={0} max={10} /></Field>
                <Field label="Ladder Count Sill"><Stepper value={cell.prairieLadderSill || 0} onChange={(v) => onQuickUpdateCell({ prairieLadderSill: v })} min={0} max={10} /></Field>
              </div>
              <div className={layoutStyles.fieldGrid2}>
                <Field label="Ladder Count Left"><Stepper value={cell.prairieLadderLeft || 0} onChange={(v) => onQuickUpdateCell({ prairieLadderLeft: v })} min={0} max={10} /></Field>
                <Field label="Ladder Count Right"><Stepper value={cell.prairieLadderRight || 0} onChange={(v) => onQuickUpdateCell({ prairieLadderRight: v })} min={0} max={10} /></Field>
              </div>
            </DetailsBox>
          )}
        </>
      )}
    </>
  );
}
