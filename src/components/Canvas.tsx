import { useCallback } from 'react';
import { ReactFlow } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { nodeTypes } from '../nodes';
import { useStore } from '../store/useStore';
import { NODE_TYPES } from '../types';
import styles from './Canvas.module.css';

function Canvas() {
  // Read active definition from store
  const definitions = useStore((s) => s.definitions);
  const activeDefinitionId = useStore((s) => s.activeDefinitionId);
  const activeDefinition = useStore((s) =>
    s.definitions.find((d) => d.id === s.activeDefinitionId),
  );

  // Store actions
  const onNodesChange = useStore((s) => s.onNodesChange);
  const onEdgesChange = useStore((s) => s.onEdgesChange);
  const onConnect = useStore((s) => s.onConnect);
  const setActiveDefinition = useStore((s) => s.setActiveDefinition);
  const setSidePanelDefinition = useStore((s) => s.setSidePanelDefinition);

  // Handle node click — open side panel for custom nodes
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === NODE_TYPES.CUSTOM_REFERENCE) {
        setSidePanelDefinition(
          (node.data as { definitionId: string }).definitionId,
        );
      } else {
        setSidePanelDefinition(null);
      }
    },
    [setSidePanelDefinition],
  );

  // Handle pane click — close side panel
  const handlePaneClick = useCallback(() => {
    setSidePanelDefinition(null);
  }, [setSidePanelDefinition]);

  // Handle definition switching
  const handleDefinitionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setActiveDefinition(e.target.value);
    },
    [setActiveDefinition],
  );

  return (
    <div className={styles.canvas} data-testid="canvas">
      {definitions.length > 0 && (
        <select
          data-testid="definition-selector"
          className={styles.selector}
          value={activeDefinitionId ?? ''}
          onChange={handleDefinitionChange}
        >
          {definitions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      )}
      {activeDefinition ? (
        <ReactFlow
          nodes={activeDefinition.nodes}
          edges={activeDefinition.edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView
        />
      ) : (
        <div className={styles.emptyState}>
          Select or create a definition to begin
        </div>
      )}
    </div>
  );
}

export default Canvas;
