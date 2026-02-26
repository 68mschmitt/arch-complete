import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useStore } from './store/useStore';
import { usePersistence } from './hooks/usePersistence';
import { useHydration } from './hooks/useHydration';
import Palette from './components/Palette';
import Canvas from './components/Canvas';
import SidePanel from './components/SidePanel';
import ExecutionPanel from './components/ExecutionPanel';
import styles from './App.module.css';

function App() {
  useHydration();
  usePersistence();
  const sidePanelDefinitionId = useStore(s => s.sidePanelDefinitionId);
  const paletteCollapsed = useStore(s => s.paletteCollapsed);
  const togglePalette = useStore(s => s.togglePalette);
  const darkMode = useStore(s => s.darkMode);
  const toggleDarkMode = useStore(s => s.toggleDarkMode);
  const executionState = useStore(s => s.executionState);

  const isExecuting = executionState !== 'idle';

  // Sync data-theme attribute on <html> with store state
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className={styles.container}>
      <button
        className={styles.darkModeToggle}
        onClick={toggleDarkMode}
        data-testid="dark-mode-toggle"
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>
      <div className={styles.mainRow}>
        <div className={`${styles.paletteWrapper} ${paletteCollapsed ? styles.paletteCollapsed : ''}`}>
          <Palette />
        </div>
        <button
          className={`${styles.paletteToggle} ${paletteCollapsed ? styles.paletteToggleCollapsed : ''}`}
          onClick={togglePalette}
          data-testid="palette-toggle"
        >
          {paletteCollapsed ? '\u00BB' : '\u00AB'}
        </button>
        <ReactFlowProvider>
          <Canvas />
        </ReactFlowProvider>
        {isExecuting && <ExecutionPanel />}
      </div>
      {!isExecuting && sidePanelDefinitionId && <SidePanel />}
    </div>
  );
}

export default App;
