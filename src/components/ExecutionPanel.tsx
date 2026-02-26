import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import type { Node } from '@xyflow/react';
import styles from './ExecutionPanel.module.css';

function ExecutionPanel() {
  const executionState = useStore((s) => s.executionState);
  const executionOrder = useStore((s) => s.executionOrder);
  const currentStepIndex = useStore((s) => s.currentStepIndex);
  const nodeResults = useStore((s) => s.nodeResults);
  const executionError = useStore((s) => s.executionError);
  const activeDefinitionId = useStore((s) => s.activeDefinitionId);
  const definitions = useStore((s) => s.definitions);

  // Don't render panel if idle
  if (executionState === 'idle') return null;

  // Get active definition to look up node labels
  const activeDefinition = definitions.find((d) => d.id === activeDefinitionId);
  if (!activeDefinition) return null;

  const nodesMap = new Map<string, Node>(
    activeDefinition.nodes.map((n) => [n.id, n]),
  );

  // Detect disconnected groups in execution order
  // Build an adjacency map from edges
  const adjacencyMap = new Map<string, Set<string>>();
  for (const edge of activeDefinition.edges) {
    if (!adjacencyMap.has(edge.source)) {
      adjacencyMap.set(edge.source, new Set());
    }
    adjacencyMap.get(edge.source)!.add(edge.target);

    if (!adjacencyMap.has(edge.target)) {
      adjacencyMap.set(edge.target, new Set());
    }
    adjacencyMap.get(edge.target)!.add(edge.source);
  }

  // Detect if two nodes are in different groups (no transitive edge path)
  const isConnected = (nodeA: string, nodeB: string): boolean => {
    const visited = new Set<string>();
    const queue = [nodeA];
    visited.add(nodeA);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === nodeB) return true;

      const neighbors = adjacencyMap.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
    }
    return false;
  };

  // Determine header text
  let headerText = '';
  const totalNodes = executionOrder.length;
  const completedCount = Object.values(nodeResults).filter(
    (r) => r.status === 'completed',
  ).length;

  switch (executionState) {
    case 'running':
      headerText = `Running... (${completedCount}/${totalNodes})`;
      break;
    case 'stepping':
    case 'paused':
      headerText = `Paused at node ${currentStepIndex + 1}/${totalNodes}`;
      break;
    case 'completed':
      headerText = `Completed (${totalNodes}/${totalNodes})`;
      break;
    case 'error':
      headerText = `Error (${completedCount}/${totalNodes})`;
      break;
  }

  return (
    <div className={styles.panel} data-testid="execution-panel">
      <div className={styles.header}>{headerText}</div>
      {executionError && (
        <div className={styles.errorBanner}>{executionError}</div>
      )}
      <div className={styles.nodeList}>
        {executionOrder.map((nodeId, idx) => {
          const node = nodesMap.get(nodeId);
          const result = nodeResults[nodeId];
          if (!node || !result) return null;

          // Check if we need a separator before this node
          const showSeparator =
            idx > 0 && !isConnected(executionOrder[idx - 1], nodeId);

          const nodeLabel: string =
            (node.data as { label?: string })?.label ?? node.type ?? nodeId;

          return (
            <div key={nodeId}>
              {showSeparator && (
                <div className={styles.separator}>
                  — unconnected group (arbitrary order) —
                </div>
              )}
              <NodeResultItem
                nodeId={nodeId}
                nodeLabel={nodeLabel}
                result={result}
                isCurrent={idx === currentStepIndex}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

type NodeResultItemProps = {
  nodeId: string;
  nodeLabel: string;
  result: {
    status: 'pending' | 'executing' | 'completed' | 'error';
    inputValues: Record<string, unknown>;
    outputValues: Record<string, unknown>;
    error?: string;
  };
  isCurrent: boolean;
};

function NodeResultItem({
  nodeId,
  nodeLabel,
  result,
  isCurrent,
}: NodeResultItemProps) {
  const [expanded, setExpanded] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current node
  useEffect(() => {
    if (isCurrent && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isCurrent]);

  let statusIcon = '';
  switch (result.status) {
    case 'pending':
      statusIcon = '⏳';
      break;
    case 'executing':
      statusIcon = '▶';
      break;
    case 'completed':
      statusIcon = '✅';
      break;
    case 'error':
      statusIcon = '❌';
      break;
  }

  return (
    <div
      ref={itemRef}
      className={`${styles.nodeItem} ${isCurrent ? styles.current : ''}`}
      data-testid="exec-node-item"
      data-node-id={nodeId}
    >
      <div
        className={styles.nodeHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <span className={styles.statusIcon}>{statusIcon}</span>
        <span className={styles.nodeLabel}>{nodeLabel}</span>
        <span className={styles.expandIcon}>{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <div className={styles.nodeDetails}>
          {Object.keys(result.inputValues).length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Inputs</div>
              {Object.entries(result.inputValues).map(([key, value]) => (
                <div key={key} className={styles.valueRow}>
                  <span className={styles.valueKey}>{key}:</span>
                  <span className={styles.valueValue}>
                    {JSON.stringify(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {Object.keys(result.outputValues).length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Outputs</div>
              {Object.entries(result.outputValues).map(([key, value]) => (
                <div key={key} className={styles.valueRow}>
                  <span className={styles.valueKey}>{key}:</span>
                  <span className={styles.valueValue}>
                    {JSON.stringify(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {result.error && (
            <div className={styles.section}>
              <div className={styles.errorMessage}>{result.error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ExecutionPanel;
