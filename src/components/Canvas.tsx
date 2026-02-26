import styles from './Canvas.module.css';

function Canvas() {
  return (
    <div className={styles.canvas} data-testid="canvas">
      Canvas Area
    </div>
  );
}

export default Canvas;
