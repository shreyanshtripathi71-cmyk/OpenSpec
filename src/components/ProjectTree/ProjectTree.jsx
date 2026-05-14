import styles from './ProjectTree.module.css';

const HouseIcon = ({ size = 14, strokeWidth = 1.4 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M2 5l6-3 6 3v8a1 1 0 01-1 1H3a1 1 0 01-1-1z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 14V8h4v6"                                  stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlusIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

/* ── Left sidebar showing the dealer's project ──
   Collapses to a 64-px icon rail by default. Hover/focus opens the
   full panel and keeps it open until the user clicks the edge close
   button.
   `quoteSubtotal` + `quoteTax` drive the Cost/Revenue summary. */
export function ProjectTree({
  treePinned,
  setTreePinned,
  rooms,
  units,
  activeUnitId,
  quoteSubtotal,
  quoteCost,
  quoteTax,
  onSelectUnit,
  onAddUnit,
  onAddRoom,
  onDeleteUnit,
  onDuplicateUnit,
}) {
  const groupedZones = rooms.map((room) => ({
    name: room,
    units: units.filter((unit) => unit.zone === room),
  }));
  const projectMargin = quoteCost > 0 ? Math.round(((quoteSubtotal - quoteCost) / quoteCost) * 100) : 0;

  return (
    <aside
      className={`${styles.projTree} ${treePinned ? styles.projTreePinned : ''}`}
      onMouseEnter={() => setTreePinned(true)}
      onFocus={() => setTreePinned(true)}
    >
      {/* Close chevron — appears on the right edge once the panel is open. */}
      <button
        className={styles.projTreePinBtn}
        type="button"
        onClick={() => setTreePinned(false)}
        title="Close project panel"
        aria-label="Close project panel"
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 4l-4 4 4 4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Vertical icon rail (visible when collapsed) */}
      <div className={styles.projTreeIconRail}>
        <button
          type="button"
          className={styles.projTreeRailItem}
          title="Riverside Heights"
          onClick={() => setTreePinned(true)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4.5A1.5 1.5 0 013.5 3h3.293a1 1 0 01.707.293L8.5 4.293a1 1 0 00.707.293H12.5A1.5 1.5 0 0114 6.086V11.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 11.5z"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className={styles.projTreeRailSep} />
        {groupedZones.map((zone) => (
          <button
            key={zone.name}
            type="button"
            className={`${styles.projTreeRailItem} ${styles.projTreeRailZoneItem} ${zone.units.some((u) => u.id === activeUnitId) ? styles.projTreeRailItemActive : ''}`}
            title={`${zone.name} · ${zone.units.length} windows`}
            onClick={() => setTreePinned(true)}
          >
            <HouseIcon />
            <span className={styles.projTreeRailCount}>{zone.units.length}</span>
          </button>
        ))}
        <div className={styles.projTreeRailSep} />
        <button
          type="button"
          className={styles.projTreeRailItem}
          title="Add unit"
          onClick={() => setTreePinned(true)}
        >
          <PlusIcon />
        </button>
      </div>

      {/* Expanded body */}
      <div className={styles.projTreeBody}>
        <header className={styles.projHead}>
          <div className={styles.projEyebrow}>Project</div>
          <div className={styles.projName}>Riverside Heights</div>
          <div className={styles.projCustomer}>Riverside Heights HOA</div>
          <div className={styles.projMeta}>{units.length} unit{units.length === 1 ? '' : 's'} · {rooms.length} rooms</div>
        </header>

        <div className={styles.projMargin}>
          <div className={styles.projMarginRow}>
            <div>
              <div className={styles.projMarginLabel}>Project margin</div>
              <div className={styles.projMarginHint}>Calculated from per-unit margins</div>
            </div>
            <span className={styles.projMarginValue}>{projectMargin}%</span>
          </div>
          <div className={styles.projMarginStats}>
            <span>Cost: <strong>${quoteCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong></span>
            <span>Revenue: <strong>${(quoteSubtotal + quoteTax).toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong></span>
          </div>
        </div>

        <div className={styles.projFactory}>
          <div className={styles.projFactoryLabel}>Factory</div>
          <button type="button" className={styles.projFactoryBtn}>
            <span className={styles.projFactoryBadge}>CT</span>
            <span className={styles.projFactoryInfo}>
              <span className={styles.projFactoryName}>Continental Full-Line</span>
              <span className={styles.projFactoryFamilies}>Windows · Entry · Patio</span>
            </span>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className={styles.projUnitList}>
          {groupedZones.map((zone) => (
            <div key={zone.name} className={styles.projZone}>
              <div className={styles.projZoneHead}>
                <div className={styles.projZoneIcon}>
                  <HouseIcon size={11} strokeWidth={1.6} />
                </div>
                <span className={styles.projZoneName}>{zone.name}</span>
                <span className={styles.projZoneCount}>{zone.units.length}</span>
              </div>
              {zone.units.length === 0 && (
                <div className={styles.projEmptyRoom}>No units yet</div>
              )}
              {zone.units.map((u) => {
                const cfg = u.config;
                const isActive = u.id === activeUnitId;
                const finish = cfg.exteriorColor?.split('-')[0] || 'white';
                return (
                <div
                  key={u.id}
                  className={`${styles.projUnitRow} ${isActive ? styles.projUnitRowActive : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectUnit(u.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectUnit(u.id);
                    }
                  }}
                >
                  <span className={styles.projUnitDragHandle} aria-hidden>
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                      <circle cx="2" cy="3"  r="1" fill="currentColor" />
                      <circle cx="6" cy="3"  r="1" fill="currentColor" />
                      <circle cx="2" cy="7"  r="1" fill="currentColor" />
                      <circle cx="6" cy="7"  r="1" fill="currentColor" />
                      <circle cx="2" cy="11" r="1" fill="currentColor" />
                      <circle cx="6" cy="11" r="1" fill="currentColor" />
                    </svg>
                  </span>
                  <span className={styles.projUnitTypeIcon} aria-hidden>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  </span>
                  <span className={styles.projUnitInfo}>
                    <span className={styles.projUnitTopRow}>
                    <span className={styles.projUnitId}>#{u.id}</span>
                      <span className={styles.projUnitName}>{u.name}</span>
                      {finish && <span className={styles.projUnitFinish}>· {finish}</span>}
                    </span>
                    <span className={styles.projUnitDims}>{cfg.frameWidth || 0}″ × {cfg.frameHeight || 0}″</span>
                  </span>
                  <span className={styles.projUnitRight}>
                    <span className={styles.projUnitMargin}>{u.margin}%</span>
                    <span className={styles.projUnitPrice}>
                      ${u.lineTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </span>
                  <span className={styles.projUnitActions} onClick={(e) => e.stopPropagation()}>
                    <button type="button" title="Duplicate unit" onClick={() => onDuplicateUnit(u.id)}>⧉</button>
                    <button type="button" title="Delete unit" onClick={() => onDeleteUnit(u.id)}>×</button>
                  </span>
                </div>
              );})}
            </div>
          ))}
        </div>

        <div className={styles.projFooter}>
          <button type="button" className={styles.projAddRoom} onClick={onAddRoom}>
            <HouseIcon size={13} strokeWidth={1.6} />
            Add room
          </button>
          <button type="button" className={styles.projAddUnit} onClick={onAddUnit}>
            <PlusIcon size={13} />
            Add unit
          </button>
        </div>
      </div>
    </aside>
  );
}
