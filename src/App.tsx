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
  
  return (
    <div className={styles.container}>
      <Palette />
      <ReactFlowProvider>
        <Canvas />
      </ReactFlowProvider>
      {sidePanelDefinitionId && <SidePanel />}
    </div>
  );
}

export default App;
