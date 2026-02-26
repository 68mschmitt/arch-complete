import { ReactFlowProvider } from '@xyflow/react';
import Palette from './components/Palette';
import Canvas from './components/Canvas';
import SidePanel from './components/SidePanel';
import styles from './App.module.css';

function App() {
  // Side panel is hidden by default (will be wired to store later)
  const showSidePanel = false;
  
  return (
    <div className={styles.container}>
      <Palette />
      <ReactFlowProvider>
        <Canvas />
      </ReactFlowProvider>
      {showSidePanel && <SidePanel />}
    </div>
  );
}

export default App;
