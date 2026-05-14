import { Field, Group, Select, Stepper, GridIcon, layoutStyles } from '../ui';
import { MEASUREMENT_TYPES } from '@/data/configuratorData';
import styles from './LayoutTab.module.css';

/* Inspector → tab 1. Opening size, row count, per-row breakdown.
   Owns no state — all changes call back to the page for setState. */
export function LayoutTab({
  config,
  maxVertical,
  maxHorizontal,
  minHorizontal,
  onChangeVertical,
  onChangeRowHorizontal,
  onSelectCell,
  onChangeWidth,
  onChangeHeight,
  onChangeRowHeight,
  onChangeMeasurementType,
}) {
  return (
    <>
      <Group title="Opening">
        <Field label="Measurement type">
          <Select
            value={config.measurementType}
            options={MEASUREMENT_TYPES}
            onChange={onChangeMeasurementType}
            showPriceAddon={false}
          />
        </Field>
        <div className={layoutStyles.fieldGrid2}>
          <Field label="Width">
            <Stepper value={config.frameWidth} onChange={onChangeWidth} min={10} max={120} step={0.125} unit="in" decimals={3} />
          </Field>
          <Field label="Height">
            <Stepper value={config.frameHeight} onChange={onChangeHeight} min={10} max={120} step={0.125} unit="in" decimals={3} />
          </Field>
        </div>
      </Group>

      <div className={layoutStyles.groupHairline} />

      <Group title="Layout">
        <div className={styles.layoutPreview}>
          <span className={styles.layoutPreviewIcon}>
            <GridIcon rows={config.grid.verticalCount} cols={config.grid.horizontalCount} size={28} />
          </span>
          <div className={styles.layoutPreviewBody}>
            <span className={styles.layoutPreviewTitle}>
              {config.grid.verticalCount} × {config.grid.horizontalCount} grid · {config.grid.cells.length} cell{config.grid.cells.length === 1 ? '' : 's'}
            </span>
            <span className={styles.layoutPreviewMeta}>
              {config.frameWidth}″ × {config.frameHeight}″ opening
            </span>
          </div>
        </div>

        <Field label="Rows (windows tall)">
          <div className={styles.gridChoices}>
            {Array.from({ length: Math.max(1, maxVertical) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={`${styles.gridChoice} ${config.grid.verticalCount === n ? styles.gridChoiceActive : ''}`}
                onClick={() => onChangeVertical(n)}
                type="button"
              >
                <span className={styles.gridChoiceIcon}>
                  <GridIcon rows={n} cols={1} size={32} />
                </span>
                <span className={styles.gridChoiceLabel}>{n} row{n > 1 ? 's' : ''}</span>
              </button>
            ))}
          </div>
        </Field>
      </Group>

      <Group title={config.grid.verticalCount > 1 ? 'Per-row breakdown' : 'Columns'}>
        <div className={styles.layoutRows}>
          {Array.from({ length: config.grid.verticalCount }, (_, r) => {
            const rowCfg = config.grid.rowConfigs?.find((rc) => rc.row === r);
            const rowH = rowCfg?.horizontalCount || config.grid.horizontalCount;
            const rowCells = config.grid.cells.filter((c) => c.row === r);
            const cellH = rowCells[0]?.height || Math.round((config.frameHeight / config.grid.verticalCount) * 10) / 10;
            // r=0 renders at the TOP, r=verticalCount-1 at the BOTTOM (where
            // the operable casement lives). The bottom row enforces type-
            // specific minimums; upper rows can always go down to 1 column.
            const isBottomRow = r === config.grid.verticalCount - 1;
            const isTopRow = r === 0 && config.grid.verticalCount > 1;
            const rowMinHorizontal = isBottomRow ? minHorizontal : 1;
            const colChoices = Array.from({ length: Math.max(1, maxHorizontal) }, (_, i) => i + 1).filter((n) => n >= rowMinHorizontal);
            const isLocked = isBottomRow && colChoices.length === 1;
            const rowPositionLabel = config.grid.verticalCount === 1
              ? 'Layout'
              : isTopRow ? 'Top row' : isBottomRow ? 'Bottom row' : `Row ${r + 1}`;

            return (
              <div key={r} className={styles.rowCard}>
                <div className={styles.rowCardHead}>
                  <span className={styles.rowCardTitle}>
                    <span className={styles.rowCardTitleBadge}>R{r + 1}</span>
                    {rowPositionLabel}
                  </span>
                  <Stepper
                    value={cellH}
                    onChange={(v) => onChangeRowHeight(r, v)}
                    min={6}
                    max={120}
                    step={0.125}
                    unit="in"
                    decimals={3}
                    compact
                  />
                </div>

                <div className={styles.rowCardSubsection}>
                  <div className={styles.rowCardSubsectionHead}>
                    <span className={styles.rowCardSubsectionLabel}>Columns</span>
                  </div>
                  <div className={styles.rowCardChoices}>
                    {colChoices.map((n) => (
                      <button
                        key={n}
                        className={`${styles.rowCardChoice} ${rowH === n ? styles.rowCardChoiceActive : ''} ${isLocked ? styles.rowCardChoiceLocked : ''}`}
                        onClick={() => onChangeRowHorizontal(r, n)}
                        type="button"
                        disabled={isLocked}
                      >
                        <GridIcon rows={1} cols={n} size={26} />
                        <span className={styles.rowCardChoiceLabel}>{n} col{n > 1 ? 's' : ''}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.rowCardSubsection}>
                  <span className={styles.rowCardSubsectionLabel}>Cells</span>
                  <div
                    className={styles.rowCardCells}
                    style={{ gridTemplateColumns: `repeat(${Math.min(rowH, 3)}, minmax(0, 1fr))` }}
                  >
                    {rowCells.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`${styles.rowCardCellBtn} ${c.id === config.selectedCellId ? styles.rowCardCellBtnActive : ''}`}
                        onClick={() => onSelectCell(c.id)}
                      >
                        <span className={styles.rowCardCellBtnId}>{c.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Group>
    </>
  );
}
