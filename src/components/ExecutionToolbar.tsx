import { useStore } from '../store/useStore';
import styles from './ExecutionToolbar.module.css';

function ExecutionToolbar() {
  const executionState = useStore((s) => s.executionState);
  const executionRun = useStore((s) => s.executionRun);
  const executionStep = useStore((s) => s.executionStep);
  const executionPause = useStore((s) => s.executionPause);
  const executionReset = useStore((s) => s.executionReset);

  // Button enable/disable logic:
  // idle: Run ✓, Step ✓, Pause ✗, Reset ✗
  // running: Run ✗, Step ✓, Pause ✓, Reset ✓
  // stepping/paused: Run ✓, Step ✓, Pause ✗, Reset ✓
  // completed: Run ✓, Step ✓, Pause ✗, Reset ✓
  // error: Run ✓, Step ✓, Pause ✗, Reset ✓

  const canRun = executionState !== 'running';
  const canStep = true; // Always available
  const canPause = executionState === 'running';
  const canReset = executionState !== 'idle';

  return (
    <div className={styles.toolbar} data-testid="execution-toolbar">
      <button
        className={styles.button}
        onClick={executionRun}
        disabled={!canRun}
        data-testid="exec-run-btn"
        title="Run"
      >
        <span className={styles.icon}>▶</span>
        <span className={styles.label}>Run</span>
      </button>
      <button
        className={styles.button}
        onClick={executionStep}
        disabled={!canStep}
        data-testid="exec-step-btn"
        title="Step"
      >
        <span className={styles.icon}>⏭</span>
        <span className={styles.label}>Step</span>
      </button>
      <button
        className={styles.button}
        onClick={executionPause}
        disabled={!canPause}
        data-testid="exec-pause-btn"
        title="Pause"
      >
        <span className={styles.icon}>⏸</span>
        <span className={styles.label}>Pause</span>
      </button>
      <button
        className={styles.button}
        onClick={executionReset}
        disabled={!canReset}
        data-testid="exec-reset-btn"
        title="Reset"
      >
        <span className={styles.icon}>⏹</span>
        <span className={styles.label}>Reset</span>
      </button>
    </div>
  );
}

export default ExecutionToolbar;
