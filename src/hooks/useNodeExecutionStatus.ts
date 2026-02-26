import { useStore } from '../store/useStore';
import type { NodeExecutionStatus } from '../types';

/**
 * Hook to get the execution status of a specific node.
 * Returns null if not in execution mode, or the status string.
 */
export function useNodeExecutionStatus(nodeId: string): NodeExecutionStatus | null {
  const executionState = useStore((s) => s.executionState);
  const nodeResults = useStore((s) => s.nodeResults);

  if (executionState === 'idle') return null;

  const result = nodeResults[nodeId];
  return result?.status ?? 'pending';
}
