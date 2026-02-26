import { useCallback } from 'react';
import { ReactFlow, useReactFlow, Background, BackgroundVariant } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { nodeTypes } from '../nodes';
import { useStore } from '../store/useStore';
import { NODE_TYPES, PALETTE_DND_TYPE } from '../types';
import { CanvasModeProvider } from '../contexts/CanvasMode';
import styles from './Canvas.module.css';

function Canvas() {
  // Read active definition from store
  const definitions = useStore((s) => s.definitions);
  const activeDefinitionId = useStore((s) => s.activeDefinitionId);
  const activeDefinition = useStore((s) =>
    s.definitions.find((d) => d.id === s.activeDefinitionId),
  );

  // React Flow utilities
  const { screenToFlowPosition } = useReactFlow();

  // Store actions
  const onNodesChange = useStore((s) => s.onNodesChange);
  const onEdgesChange = useStore((s) => s.onEdgesChange);
  const onConnect = useStore((s) => s.onConnect);
  const setActiveDefinition = useStore((s) => s.setActiveDefinition);
  const setSidePanelDefinition = useStore((s) => s.setSidePanelDefinition);
  const addNode = useStore((s) => s.addNode);

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

  // Handle drag over — allow dropping
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop — create new node at drop position
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const rawData = event.dataTransfer.getData(PALETTE_DND_TYPE);
      if (!rawData) return;

      const { nodeType, definitionId } = JSON.parse(rawData);

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const id = crypto.randomUUID();

      let data: Record<string, unknown>;
      switch (nodeType) {
        case NODE_TYPES.CONSTANT:
          data = { label: 'Constant', value: '' };
          break;
        case NODE_TYPES.CUSTOM_REFERENCE: {
          // Look up definition name for the label
          const def = useStore.getState().getDefinition(definitionId);
          data = { definitionId, label: def?.name ?? 'Unknown' };
          break;
        }
        case NODE_TYPES.INPUT:
          data = { label: 'Input' };
          break;
        case NODE_TYPES.OUTPUT:
          data = { label: 'Output' };
          break;
        case NODE_TYPES.FUNCTION:
          data = { label: 'Function' };
          break;
        default:
          data = { label: nodeType };
      }

      addNode({
        id,
        type: nodeType,
        position,
        data,
      });
    },
    [screenToFlowPosition, addNode],
  );

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
        <CanvasModeProvider mode="edit">
          <ReactFlow
            nodes={activeDefinition.nodes}
            edges={activeDefinition.edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            nodeTypes={nodeTypes}
            snapToGrid
            snapGrid={[20, 20]}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          </ReactFlow>
        </CanvasModeProvider>
      ) : (
        <div className={styles.emptyState} data-testid="empty-state">
          Select or create a definition to begin
        </div>
      )}
    </div>
  );
}

export default Canvas;
