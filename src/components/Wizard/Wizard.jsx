import { Icon, GridIcon } from '../ui';
import styles from './Wizard.module.css';

/* 3-step wizard shown before the configurator workspace renders.
   Captures opening size → number of rows → number of columns per row.
   `config.wizardStep` is the gate; once it flips to `'done'`, the
   parent page swaps to the main configurator view. */
export function Wizard({
  config,
  windowTypeLabel,
  maxVertical,
  maxHorizontal,
  minHorizontal,
  onChangeWidth,
  onChangeHeight,
  onContinue,
  onSelectVertical,
  onSelectHorizontal,
  onJumpTo,
}) {
  const stepNumber = config.wizardStep === 'dimensions'
    ? '1'
    : config.wizardStep === 'vertical'
      ? '2'
      : '3';

  return (
    <div className={styles.wizard}>
      <div className={styles.wizardWrap}>
        <span className={styles.eyebrow}>
          <span className={styles.eyebrowDot} /> Step {stepNumber} of 3
        </span>

        <div className={styles.hero}>
          <h1 className={styles.title}>{windowTypeLabel} configuration</h1>
          <p className={styles.subtitle}>
            Enter the opening size, choose the layout, then review frame, glass, cell, grille,
            energy, and quote details in the configurator workspace.
          </p>
        </div>

        <div className={styles.steps}>
          {/* ── STEP 1 — DIMENSIONS ── */}
          <div className={`${styles.step} ${config.wizardStep === 'dimensions' ? styles.stepActive : styles.stepDone}`}>
            <div className={styles.stepNum}>
              {config.wizardStep === 'dimensions' ? '1' : <Icon name="check" size={14} />}
            </div>
            <div className={styles.stepBody}>
              <header className={styles.stepHead}>
                <span className={styles.stepTitle}>Opening size</span>
                {config.wizardStep !== 'dimensions' && (
                  <>
                    <span className={styles.stepSummary}>
                      {config.frameWidth}″ × {config.frameHeight}″
                    </span>
                    <button
                      className={styles.stepEdit}
                      onClick={() => onJumpTo('dimensions')}
                      type="button"
                    >
                      Edit
                    </button>
                  </>
                )}
              </header>
              {config.wizardStep === 'dimensions' && (
                <div className={styles.dimensions}>
                  <div className={styles.dimField}>
                    <span className={styles.dimLabel}>Width</span>
                    <div className={styles.dimInputWrap}>
                      <input
                        className={styles.dimInput}
                        type="number"
                        value={config.frameWidth || ''}
                        onChange={(e) => onChangeWidth(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min={10}
                        max={120}
                        step={0.125}
                        autoFocus
                      />
                      <span className={styles.dimUnit}>in</span>
                    </div>
                  </div>
                  <div className={styles.dimX}>×</div>
                  <div className={styles.dimField}>
                    <span className={styles.dimLabel}>Height</span>
                    <div className={styles.dimInputWrap}>
                      <input
                        className={styles.dimInput}
                        type="number"
                        value={config.frameHeight || ''}
                        onChange={(e) => onChangeHeight(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min={10}
                        max={120}
                        step={0.125}
                      />
                      <span className={styles.dimUnit}>in</span>
                    </div>
                  </div>
                  <button
                    className={styles.cta}
                    type="button"
                    onClick={onContinue}
                    disabled={!(config.frameWidth > 0 && config.frameHeight > 0)}
                  >
                    Continue <Icon name="arrow-right" size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── STEP 2 — VERTICAL COUNT ── */}
          <div
            className={`${styles.step} ${
              config.wizardStep === 'vertical' ? styles.stepActive
              : config.wizardStep === 'horizontal' ? styles.stepDone
              : styles.stepIdle
            }`}
          >
            <div className={styles.stepNum}>
              {config.wizardStep === 'horizontal' ? <Icon name="check" size={14} /> : '2'}
            </div>
            <div className={styles.stepBody}>
              <header className={styles.stepHead}>
                <span className={styles.stepTitle}>How many windows tall?</span>
                {config.wizardStep === 'horizontal' && (
                  <>
                    <span className={styles.stepSummary}>
                      {config.grid.verticalCount} {config.grid.verticalCount === 1 ? 'row' : 'rows'}
                    </span>
                    <button
                      className={styles.stepEdit}
                      onClick={() => onJumpTo('vertical')}
                      type="button"
                    >
                      Edit
                    </button>
                  </>
                )}
              </header>
              {config.wizardStep === 'vertical' && (
                <div className={styles.choices}>
                  {Array.from({ length: Math.max(1, maxVertical) }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      className={`${styles.choice} ${config.grid.verticalCount === n ? styles.choiceActive : ''}`}
                      onClick={() => onSelectVertical(n)}
                      type="button"
                    >
                      <GridIcon rows={n} cols={1} size={38} />
                      <span className={styles.choiceLabel}>{n} row{n > 1 ? 's' : ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── STEP 3 — HORIZONTAL COUNT ── */}
          <div
            className={`${styles.step} ${
              config.wizardStep === 'horizontal' ? styles.stepActive : styles.stepIdle
            }`}
          >
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepBody}>
              <header className={styles.stepHead}>
                <span className={styles.stepTitle}>How many windows wide?</span>
              </header>
              {config.wizardStep === 'horizontal' && (
                <div className={styles.choices}>
                  {Array.from({ length: Math.max(1, maxHorizontal) }, (_, i) => i + 1)
                    .filter((n) => n >= minHorizontal)
                    .map((n) => (
                      <button
                        key={n}
                        className={styles.choice}
                        onClick={() => onSelectHorizontal(n)}
                        type="button"
                      >
                        <GridIcon rows={1} cols={n} size={38} />
                        <span className={styles.choiceLabel}>{n} column{n > 1 ? 's' : ''}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
