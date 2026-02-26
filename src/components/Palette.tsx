import styles from './Palette.module.css';

function Palette() {
  return (
    <div className={styles.palette} data-testid="palette">
      <div className={styles.section} data-testid="palette-primitives">
        <div className={styles.sectionHeader}>Primitives</div>
      </div>
      <div className={styles.section} data-testid="palette-custom">
        <div className={styles.sectionHeader}>Custom Nodes</div>
      </div>
    </div>
  );
}

export default Palette;
