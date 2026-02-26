import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { Node, NodeChange, EdgeChange, Connection } from '@xyflow/react';

import type { NodeDefinition, Directory, ExecutionState, NodeExecutionResult } from '../types';
import { NODE_TYPES } from '../types';
import { topologicalSort, executeNode, resolveInputNames } from '../execution/engine';

type StoreState = {
  definitions: NodeDefinition[];
  directories: Directory[];
  activeDefinitionId: string | null;
  sidePanelDefinitionId: string | null;
  paletteCollapsed: boolean;
  darkMode: boolean;

  // Execution state (transient — NOT persisted)
  executionState: ExecutionState;
  executionOrder: string[];
  currentStepIndex: number;
  nodeResults: Record<string, NodeExecutionResult>;
  edgeValues: Record<string, unknown>;
  executionError: string | null;
  autoStepTimerId: ReturnType<typeof setTimeout> | null;
};

type StoreActions = {
  addDefinition: (name?: string, directoryId?: string | null) => void;
  removeDefinition: (id: string) => void;
  renameDefinition: (id: string, name: string) => void;
  setActiveDefinition: (id: string) => void;
  setSidePanelDefinition: (id: string | null) => void;
  togglePalette: () => void;
  toggleDarkMode: () => void;
  addDirectory: (name?: string, parentId?: string | null) => void;
  removeDirectory: (id: string) => void;
  renameDirectory: (id: string, name: string) => void;
  moveDefinitionToDirectory: (definitionId: string, directoryId: string | null) => void;
  moveDirectoryToDirectory: (dirId: string, newParentId: string | null) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<Record<string, unknown>>) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  getDefinition: (id: string) => NodeDefinition | undefined;
  getInputOutputNodes: (definitionId: string) => { inputs: Node[]; outputs: Node[] };
  hydrate: (savedState: {
    definitions: NodeDefinition[];
    directories?: Directory[];
    activeDefinitionId: string | null;
    paletteCollapsed?: boolean;
    darkMode?: boolean;
  }) => void;

  // Execution actions
  executionRun: () => void;
  executionStep: () => void;
  executionPause: () => void;
  executionReset: () => void;
  _executeNextNode: () => void;
  _autoResetExecution: () => void;
};

type StoreType = StoreState & StoreActions;

const AUTO_STEP_DELAY_MS = 400;

export const useStore = create<StoreType>()((set, get) => ({
  // --- State ---
  definitions: [],
  directories: [],
  activeDefinitionId: null,
  sidePanelDefinitionId: null,
  paletteCollapsed: false,
  darkMode: false,

  // --- Execution State ---
  executionState: 'idle',
  executionOrder: [],
  currentStepIndex: -1,
  nodeResults: {},
  edgeValues: {},
  executionError: null,
  autoStepTimerId: null,

  // --- Actions ---

  addDefinition: (name?: string, directoryId?: string | null) => {
    const { definitions } = get();

    let definitionName: string;
    if (name) {
      definitionName = name;
    } else {
      const untitledCount = definitions.filter((d) =>
        d.name.startsWith('Untitled Node'),
      ).length;
      definitionName =
        untitledCount === 0
          ? 'Untitled Node'
          : `Untitled Node ${untitledCount + 1}`;
    }

    const newDefinition: NodeDefinition = {
      id: crypto.randomUUID(),
      name: definitionName,
      directoryId: directoryId ?? null,
      nodes: [],
      edges: [],
    };

    set({
      definitions: [...definitions, newDefinition],
      activeDefinitionId: newDefinition.id,
    });
  },

  removeDefinition: (id: string) => {
    const { definitions, activeDefinitionId, sidePanelDefinitionId } = get();
    const updated = definitions.filter((d) => d.id !== id);

    let newActiveId = activeDefinitionId;
    if (activeDefinitionId === id) {
      newActiveId = updated.length > 0 ? updated[0].id : null;
    }

    let newSidePanelId = sidePanelDefinitionId;
    if (sidePanelDefinitionId === id) {
      newSidePanelId = null;
    }

    set({
      definitions: updated,
      activeDefinitionId: newActiveId,
      sidePanelDefinitionId: newSidePanelId,
    });
  },

  renameDefinition: (id: string, name: string) => {
    const { definitions } = get();
    set({
      definitions: definitions.map((d) =>
        d.id === id ? { ...d, name } : d,
      ),
    });
  },

  setActiveDefinition: (id: string) => {
    get()._autoResetExecution();
    set({ activeDefinitionId: id });
  },

  setSidePanelDefinition: (id: string | null) => {
    set({ sidePanelDefinitionId: id });
  },

  togglePalette: () => {
    set({ paletteCollapsed: !get().paletteCollapsed });
  },

  toggleDarkMode: () => {
    set({ darkMode: !get().darkMode });
  },

  // --- Directory Actions ---

  addDirectory: (name?: string, parentId?: string | null) => {
    const { directories } = get();

    let dirName: string;
    if (name) {
      dirName = name;
    } else {
      const folderCount = directories.filter((d) =>
        d.name.startsWith('New Folder'),
      ).length;
      dirName =
        folderCount === 0
          ? 'New Folder'
          : `New Folder ${folderCount + 1}`;
    }

    const newDir: Directory = {
      id: crypto.randomUUID(),
      name: dirName,
      parentId: parentId ?? null,
    };

    set({ directories: [...directories, newDir] });
  },

  removeDirectory: (id: string) => {
    const { directories, definitions } = get();
    const dir = directories.find((d) => d.id === id);
    if (!dir) return;

    const parentId = dir.parentId;

    // Move child directories to parent
    const updatedDirs = directories
      .filter((d) => d.id !== id)
      .map((d) => (d.parentId === id ? { ...d, parentId } : d));

    // Move child definitions to parent
    const updatedDefs = definitions.map((d) =>
      d.directoryId === id ? { ...d, directoryId: parentId } : d,
    );

    set({ directories: updatedDirs, definitions: updatedDefs });
  },

  renameDirectory: (id: string, name: string) => {
    const { directories } = get();
    set({
      directories: directories.map((d) =>
        d.id === id ? { ...d, name } : d,
      ),
    });
  },

  moveDefinitionToDirectory: (definitionId: string, directoryId: string | null) => {
    const { definitions } = get();
    set({
      definitions: definitions.map((d) =>
        d.id === definitionId ? { ...d, directoryId } : d,
      ),
    });
  },

  moveDirectoryToDirectory: (dirId: string, newParentId: string | null) => {
    const { directories } = get();
    // Prevent moving a directory into itself
    if (dirId === newParentId) return;

    // Prevent moving into own descendant (cycle)
    let cursor = newParentId;
    while (cursor !== null) {
      if (cursor === dirId) return;
      const parent = directories.find((d) => d.id === cursor);
      cursor = parent?.parentId ?? null;
    }

    set({
      directories: directories.map((d) =>
        d.id === dirId ? { ...d, parentId: newParentId } : d,
      ),
    });
  },

  // --- Node/Edge Actions ---

  addNode: (node: Node) => {
    const { definitions, activeDefinitionId } = get();
    if (!activeDefinitionId) return;

    get()._autoResetExecution();

    set({
      definitions: definitions.map((d) =>
        d.id === activeDefinitionId
          ? { ...d, nodes: [...d.nodes, node] }
          : d,
      ),
    });
  },

  removeNode: (nodeId: string) => {
    const { definitions, activeDefinitionId } = get();
    if (!activeDefinitionId) return;

    get()._autoResetExecution();

    const activeDef = definitions.find(d => d.id === activeDefinitionId);
    if (!activeDef) return;

    const removedNode = activeDef.nodes.find(n => n.id === nodeId);
    if (!removedNode) return;

    // Check if the removed node is an Input or Output (interface node)
    const isInterfaceNode = removedNode.type === NODE_TYPES.INPUT || removedNode.type === NODE_TYPES.OUTPUT;

    // Build the handle ID that will disappear from instances of this definition
    let removedHandleId: string | null = null;
    if (isInterfaceNode) {
      removedHandleId = removedNode.type === NODE_TYPES.INPUT
        ? `input-${nodeId}`
        : `output-${nodeId}`;
    }

    set({
      definitions: definitions.map((d) => {
        if (d.id === activeDefinitionId) {
          // Remove the node and its direct edges from active definition
          return {
            ...d,
            nodes: d.nodes.filter((n) => n.id !== nodeId),
            edges: d.edges.filter(
              (e) => e.source !== nodeId && e.target !== nodeId,
            ),
          };
        }

        // For other definitions: clean up edges connected to the removed handle
        if (removedHandleId) {
          const hasInstances = d.nodes.some(
            (n) => n.type === NODE_TYPES.CUSTOM_REFERENCE &&
                   (n.data as { definitionId?: string }).definitionId === activeDefinitionId,
          );

          if (hasInstances) {
            return {
              ...d,
              edges: d.edges.filter((e) => {
                return e.sourceHandle !== removedHandleId && e.targetHandle !== removedHandleId;
              }),
            };
          }
        }

        return d;
      }),
    });
  },

  updateNodeData: (nodeId: string, data: Partial<Record<string, unknown>>) => {
    const { definitions, activeDefinitionId } = get();
    if (!activeDefinitionId) return;

    get()._autoResetExecution();

    set({
      definitions: definitions.map((d) => {
        if (d.id !== activeDefinitionId) return d;
        return {
          ...d,
          nodes: d.nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
          ),
        };
      }),
    });
  },

  onNodesChange: (changes: NodeChange[]) => {
    const { definitions, activeDefinitionId } = get();
    if (!activeDefinitionId) return;

    // Auto-reset execution on structural changes (not just selections/positions)
    const structuralChange = changes.some((c) => c.type === 'remove' || c.type === 'add');
    if (structuralChange) {
      get()._autoResetExecution();
    }

    // Separate remove changes to identify deleted Input/Output nodes
    const removeChanges = changes.filter((c) => c.type === 'remove');
    
    // Collect handle IDs from removed Input/Output nodes
    const removedHandleIds = new Set<string>();
    if (removeChanges.length > 0) {
      const activeDef = definitions.find((d) => d.id === activeDefinitionId);
      if (activeDef) {
        removeChanges.forEach((change) => {
          if (change.type === 'remove') {
            const removedNode = activeDef.nodes.find((n) => n.id === change.id);
            if (removedNode) {
              const isInterfaceNode = removedNode.type === NODE_TYPES.INPUT || removedNode.type === NODE_TYPES.OUTPUT;
              if (isInterfaceNode) {
                const handleId = removedNode.type === NODE_TYPES.INPUT
                  ? `input-${change.id}`
                  : `output-${change.id}`;
                removedHandleIds.add(handleId);
              }
            }
          }
        });
      }
    }

    set({
      definitions: definitions.map((d) => {
        if (d.id === activeDefinitionId) {
          // Apply all node changes (including removes) to active definition
          return {
            ...d,
            nodes: applyNodeChanges(changes, d.nodes),
          };
        }

        // For other definitions: clean up edges if they have instances and removed handles exist
        if (removedHandleIds.size > 0) {
          const hasInstances = d.nodes.some(
            (n) => n.type === NODE_TYPES.CUSTOM_REFERENCE &&
                   (n.data as { definitionId?: string }).definitionId === activeDefinitionId,
          );

          if (hasInstances) {
            return {
              ...d,
              edges: d.edges.filter((e) => {
                return !removedHandleIds.has(e.sourceHandle ?? '') && !removedHandleIds.has(e.targetHandle ?? '');
              }),
            };
          }
        }

        return d;
      }),
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const { definitions, activeDefinitionId } = get();
    if (!activeDefinitionId) return;

    get()._autoResetExecution();

    set({
      definitions: definitions.map((d) => {
        if (d.id !== activeDefinitionId) return d;
        return {
          ...d,
          edges: applyEdgeChanges(changes, d.edges),
        };
      }),
    });
  },

  onConnect: (connection: Connection) => {
    const { definitions, activeDefinitionId } = get();
    if (!activeDefinitionId) return;

    get()._autoResetExecution();

    set({
      definitions: definitions.map((d) => {
        if (d.id !== activeDefinitionId) return d;
        return {
          ...d,
          edges: addEdge(connection, d.edges),
        };
      }),
    });
  },

  getDefinition: (id: string) => {
    const { definitions } = get();
    return definitions.find((d) => d.id === id);
  },

  getInputOutputNodes: (definitionId: string) => {
    const { definitions } = get();
    const definition = definitions.find((d) => d.id === definitionId);
    if (!definition) return { inputs: [], outputs: [] };

    const inputs = definition.nodes.filter(
      (n) => n.type === NODE_TYPES.INPUT,
    );
    const outputs = definition.nodes.filter(
      (n) => n.type === NODE_TYPES.OUTPUT,
    );

    return { inputs, outputs };
  },

  hydrate: (savedState: {
    definitions: NodeDefinition[];
    directories?: Directory[];
    activeDefinitionId: string | null;
    paletteCollapsed?: boolean;
    darkMode?: boolean;
  }) => {
    set({
      // Normalize: ensure directoryId exists on all definitions (backward compat)
      definitions: savedState.definitions.map((d) => ({
        ...d,
        directoryId: d.directoryId ?? null,
      })),
      directories: savedState.directories ?? [],
      activeDefinitionId: savedState.activeDefinitionId,
      paletteCollapsed: savedState.paletteCollapsed ?? false,
      darkMode: savedState.darkMode ?? false,
    });
  },

  // --- Execution Actions ---

  _autoResetExecution: () => {
    const { executionState, autoStepTimerId } = get();
    if (executionState === 'idle') return;

    if (autoStepTimerId !== null) {
      clearTimeout(autoStepTimerId);
    }

    set({
      executionState: 'idle',
      executionOrder: [],
      currentStepIndex: -1,
      nodeResults: {},
      edgeValues: {},
      executionError: null,
      autoStepTimerId: null,
    });
  },

  executionReset: () => {
    const { autoStepTimerId } = get();
    if (autoStepTimerId !== null) {
      clearTimeout(autoStepTimerId);
    }

    set({
      executionState: 'idle',
      executionOrder: [],
      currentStepIndex: -1,
      nodeResults: {},
      edgeValues: {},
      executionError: null,
      autoStepTimerId: null,
    });
  },

  executionRun: () => {
    const { executionState, activeDefinitionId, definitions } = get();

    // If paused, resume auto-stepping
    if (executionState === 'paused' || executionState === 'stepping') {
      set({ executionState: 'running' });
      const timerId = setTimeout(() => get()._executeNextNode(), AUTO_STEP_DELAY_MS);
      set({ autoStepTimerId: timerId });
      return;
    }

    // If completed/error, reset first
    if (executionState === 'completed' || executionState === 'error') {
      get().executionReset();
    }

    if (!activeDefinitionId) return;
    const definition = definitions.find((d) => d.id === activeDefinitionId);
    if (!definition || definition.nodes.length === 0) return;

    // Topological sort
    const sortResult = topologicalSort(definition.nodes, definition.edges);
    if (!sortResult.ok) {
      set({
        executionState: 'error',
        executionError: sortResult.error,
      });
      return;
    }

    // Initialize node results
    const nodeResults: Record<string, NodeExecutionResult> = {};
    for (const nodeId of sortResult.order) {
      nodeResults[nodeId] = {
        status: 'pending',
        inputValues: {},
        outputValues: {},
      };
    }

    set({
      executionState: 'running',
      executionOrder: sortResult.order,
      currentStepIndex: -1,
      nodeResults,
      edgeValues: {},
      executionError: null,
    });

    // Start auto-stepping
    const timerId = setTimeout(() => get()._executeNextNode(), AUTO_STEP_DELAY_MS);
    set({ autoStepTimerId: timerId });
  },

  executionStep: () => {
    const { executionState, activeDefinitionId, definitions } = get();

    // If running, pause first then we'll advance one step
    if (executionState === 'running') {
      const { autoStepTimerId } = get();
      if (autoStepTimerId !== null) {
        clearTimeout(autoStepTimerId);
      }
      set({ executionState: 'stepping', autoStepTimerId: null });
      get()._executeNextNode();
      return;
    }

    // If paused or stepping, advance one step
    if (executionState === 'paused' || executionState === 'stepping') {
      set({ executionState: 'stepping' });
      get()._executeNextNode();
      return;
    }

    // If completed/error, reset and start stepping
    if (executionState === 'completed' || executionState === 'error') {
      get().executionReset();
    }

    // Start fresh stepping
    if (!activeDefinitionId) return;
    const definition = definitions.find((d) => d.id === activeDefinitionId);
    if (!definition || definition.nodes.length === 0) return;

    const sortResult = topologicalSort(definition.nodes, definition.edges);
    if (!sortResult.ok) {
      set({
        executionState: 'error',
        executionError: sortResult.error,
      });
      return;
    }

    const nodeResults: Record<string, NodeExecutionResult> = {};
    for (const nodeId of sortResult.order) {
      nodeResults[nodeId] = {
        status: 'pending',
        inputValues: {},
        outputValues: {},
      };
    }

    set({
      executionState: 'stepping',
      executionOrder: sortResult.order,
      currentStepIndex: -1,
      nodeResults,
      edgeValues: {},
      executionError: null,
    });

    // Execute first node
    get()._executeNextNode();
  },

  executionPause: () => {
    const { executionState, autoStepTimerId } = get();
    if (executionState !== 'running') return;

    if (autoStepTimerId !== null) {
      clearTimeout(autoStepTimerId);
    }

    set({
      executionState: 'paused',
      autoStepTimerId: null,
    });
  },

  _executeNextNode: () => {
    const {
      executionState,
      executionOrder,
      currentStepIndex,
      nodeResults,
      edgeValues,
      activeDefinitionId,
      definitions,
    } = get();

    if (executionState !== 'running' && executionState !== 'stepping') return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= executionOrder.length) {
      // All nodes executed
      set({ executionState: 'completed', currentStepIndex: nextIndex });
      return;
    }

    const definition = definitions.find((d) => d.id === activeDefinitionId);
    if (!definition) return;

    const nodeId = executionOrder[nextIndex];
    const node = definition.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // Gather input values from incoming edges
    const incomingEdges = definition.edges.filter((e) => e.target === nodeId);
    const inputNameMap = resolveInputNames(nodeId, definition.nodes, definition.edges);
    const inputValues: Record<string, unknown> = {};

    for (const edge of incomingEdges) {
      const edgeKey = edge.sourceHandle ?? edge.source;
      const nameKey = inputNameMap[edgeKey];
      if (nameKey) {
        const sourceOutputKey = edge.sourceHandle
          ? `${edge.source}:${edge.sourceHandle}`
          : edge.source;
        inputValues[nameKey] = edgeValues[sourceOutputKey];
      }
    }

    // For Input nodes, inject test values as the actual value
    if (node.type === NODE_TYPES.INPUT) {
      const testValues = ((node.data as Record<string, unknown>).testValues ?? {}) as Record<string, unknown>;
      const label = (node.data as { label?: string })?.label ?? 'input';
      const sanitized = label.replace(/[^a-zA-Z0-9_$]/g, '_');
      if ('value' in testValues) {
        inputValues[sanitized] = testValues['value'];
      }
    }

    // Check for test value fallbacks (all node types)
    const testValues = ((node.data as Record<string, unknown>).testValues ?? {}) as Record<string, unknown>;
    for (const [key, value] of Object.entries(testValues)) {
      if (!(key in inputValues) || inputValues[key] === undefined) {
        inputValues[key] = value;
      }
    }

    // Mark as executing
    const updatedResults = {
      ...nodeResults,
      [nodeId]: {
        ...nodeResults[nodeId],
        status: 'executing' as const,
        inputValues: { ...inputValues },
      },
    };
    set({ nodeResults: updatedResults, currentStepIndex: nextIndex });

    // Execute the node
    const result = executeNode(node, inputValues, definitions);

    // Update edge values with outputs
    const newEdgeValues = { ...edgeValues };
    const outputEntries = Object.entries(result.outputValues);
    if (outputEntries.length >= 1) {
      const [, firstValue] = outputEntries[0];
      newEdgeValues[nodeId] = firstValue;

      // Store under specific handle IDs
      const outgoingEdges = definition.edges.filter((e) => e.source === nodeId);
      for (const edge of outgoingEdges) {
        if (edge.sourceHandle) {
          newEdgeValues[`${nodeId}:${edge.sourceHandle}`] = firstValue;
        }
      }
    }
    for (const [portName, value] of outputEntries) {
      newEdgeValues[`${nodeId}:${portName}`] = value;
    }

    // Update results
    const finalResults = {
      ...updatedResults,
      [nodeId]: {
        status: result.error ? 'error' as const : 'completed' as const,
        inputValues: { ...inputValues },
        outputValues: result.outputValues,
        error: result.error,
      },
    };

    if (result.error) {
      set({
        nodeResults: finalResults,
        edgeValues: newEdgeValues,
        executionState: 'error',
        executionError: `Error in node "${((node.data as { label?: string })?.label) ?? nodeId}": ${result.error}`,
      });
      return;
    }

    set({
      nodeResults: finalResults,
      edgeValues: newEdgeValues,
    });

    // If running (auto-step), schedule next
    if (executionState === 'running') {
      const timerId = setTimeout(() => get()._executeNextNode(), AUTO_STEP_DELAY_MS);
      set({ autoStepTimerId: timerId });
    }
    // If stepping, we're done until user clicks again
  },
}));
