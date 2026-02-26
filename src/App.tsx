import { ReactFlowProvider } from '@xyflow/react';
import { useStore } from './store/useStore';
import { usePersistence } from './hooks/usePersistence';
import { useHydration } from './hooks/useHydration';
import Palette from './components/Palette';
import Canvas from './components/Canvas';
import SidePanel from './components/SidePanel';
import styles from './App.module.css';

function App() {
  useHydration();
  usePersistence();
  const sidePanelDefinitionId = useStore(s => s.sidePanelDefinitionId);
  const paletteCollapsed = useStore(s => s.paletteCollapsed);
  const togglePalette = useStore(s => s.togglePalette);
  
  return (
    <div className={styles.container}>
      <div className={styles.mainRow}>
        <div className={`${styles.paletteWrapper} ${paletteCollapsed ? styles.paletteCollapsed : ''}`}>
          <Palette />
        </div>
        <button
          className={styles.paletteToggle}
          onClick={togglePalette}
          data-testid="palette-toggle"
        >
          {paletteCollapsed ? '\u00BB' : '\u00AB'}
        </button>
        <ReactFlowProvider>
          <Canvas />
        </ReactFlowProvider>
      </div>
      {sidePanelDefinitionId && <SidePanel />}
    </div>
  );
}

export default App;
