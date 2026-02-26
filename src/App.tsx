import { ReactFlowProvider } from '@xyflow/react';
import { useStore } from './store/useStore';
import Palette from './components/Palette';
import Canvas from './components/Canvas';
import SidePanel from './components/SidePanel';
import styles from './App.module.css';

function App() {
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
