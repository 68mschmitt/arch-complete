import { useStore } from '../store/useStore';
import { NODE_TYPES, PALETTE_DND_TYPE } from '../types';
import styles from './Palette.module.css';

function Palette() {
  const definitions = useStore((s) => s.definitions);
  const addDefinition = useStore((s) => s.addDefinition);
  const setActiveDefinition = useStore((s) => s.setActiveDefinition);

  const primitives = [
    { type: NODE_TYPES.INPUT, label: 'Input' },
    { type: NODE_TYPES.OUTPUT, label: 'Output' },
    { type: NODE_TYPES.FUNCTION, label: 'Function' },
    { type: NODE_TYPES.CONSTANT, label: 'Constant' },
  ];

  const handlePrimitiveDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: string,
  ) => {
    event.dataTransfer.setData(
      PALETTE_DND_TYPE,
      JSON.stringify({ nodeType }),
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleCustomDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    definitionId: string,
  ) => {
    event.dataTransfer.setData(
      PALETTE_DND_TYPE,
      JSON.stringify({
        nodeType: NODE_TYPES.CUSTOM_REFERENCE,
        definitionId,
      }),
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleNewNode = () => {
    addDefinition();
  };

  const handleCustomNodeClick = (definitionId: string) => {
    setActiveDefinition(definitionId);
  };

  return (
    <div className={styles.palette} data-testid="palette">
      <div className={styles.section} data-testid="palette-primitives">
        <div className={styles.sectionHeader}>Primitives</div>
        {primitives.map((prim) => (
          <div
            key={prim.type}
            className={styles.paletteItem}
            draggable
            onDragStart={(e) => handlePrimitiveDragStart(e, prim.type)}
          >
            {prim.label}
          </div>
        ))}
      </div>

      <div className={styles.divider} />

      <div className={styles.section} data-testid="palette-custom">
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeader}>Custom Nodes</div>
          <button
            className={styles.newNodeButton}
            onClick={handleNewNode}
            data-testid="new-node-button"
          >
            New Node
          </button>
        </div>
        {definitions.map((def) => (
          <div
            key={def.id}
            className={styles.paletteItem}
            draggable
            onDragStart={(e) => handleCustomDragStart(e, def.id)}
            onClick={() => handleCustomNodeClick(def.id)}
          >
            {def.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Palette;
