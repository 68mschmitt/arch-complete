import { useStore } from '../store/useStore';
import { NODE_TYPES } from '../types';
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

  const inputs = definition.nodes.filter(n => n.type === NODE_TYPES.INPUT);
  const outputs = definition.nodes.filter(n => n.type === NODE_TYPES.OUTPUT);

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
      <div className={styles.interfaceView}>
        <div className={styles.inputList}>
          {inputs.map(node => (
            <div key={node.id} className={styles.connectionLabel}>
              {(node.data as { label?: string }).label ?? 'Input'}
              <span className={styles.connector}>&#x2500;</span>
            </div>
          ))}
        </div>
        <div className={styles.nodeBox}>
          <span className={styles.nodeBoxName}>{definition.name}</span>
        </div>
        <div className={styles.outputList}>
          {outputs.map(node => (
            <div key={node.id} className={styles.connectionLabel}>
              <span className={styles.connector}>&#x2500;</span>
              {(node.data as { label?: string }).label ?? 'Output'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SidePanel;
