import { ReactFlowProvider, ReactFlow } from '@xyflow/react';
import { useStore } from '../store/useStore';
import { nodeTypes } from '../nodes';
import { CanvasModeProvider } from '../contexts/CanvasMode';
import styles from './SidePanel.module.css';

function SidePanel() {
  const sidePanelDefinitionId = useStore(s => s.sidePanelDefinitionId);
  const definition = useStore(s => 
    s.definitions.find(d => d.id === s.sidePanelDefinitionId) ?? null
  );
  const setActiveDefinition = useStore(s => s.setActiveDefinition);
  const setSidePanelDefinition = useStore(s => s.setSidePanelDefinition);

  // If definition was deleted while panel is open
  if (!definition || !sidePanelDefinitionId) return null;

  const handleEdit = () => {
    setActiveDefinition(sidePanelDefinitionId);
    setSidePanelDefinition(null); // optionally close panel
  };

  const handleClose = () => {
    setSidePanelDefinition(null);
  };

  return (
    <div className={styles.panel} data-testid="side-panel">
      <div className={styles.header}>
        <span className={styles.title}>{definition.name}</span>
        <div className={styles.actions}>
          <button 
            data-testid="side-panel-edit-button"
            onClick={handleEdit}
            className={styles.editButton}
          >
            Edit
          </button>
          <button 
            data-testid="side-panel-close-button"
            onClick={handleClose}
            className={styles.closeButton}
          >
            ×
          </button>
        </div>
      </div>
      <div className={styles.preview}>
        <ReactFlowProvider>
          <CanvasModeProvider mode="preview">
            <ReactFlow
              nodes={definition.nodes}
              edges={definition.edges}
              nodeTypes={nodeTypes}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={false}
              zoomOnScroll={false}
              zoomOnDoubleClick={false}
              preventScrolling={false}
              fitView
            />
          </CanvasModeProvider>
        </ReactFlowProvider>
      </div>
    </div>
  );
}

export default SidePanel;
