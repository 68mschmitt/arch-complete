import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { Node, NodeChange, EdgeChange, Connection } from '@xyflow/react';

import type { NodeDefinition } from '../types';
import { NODE_TYPES } from '../types';

type StoreState = {
  definitions: NodeDefinition[];
  activeDefinitionId: string | null;
  sidePanelDefinitionId: string | null;
  paletteCollapsed: boolean;
  darkMode: boolean;
};

type StoreActions = {
  addDefinition: (name?: string) => void;
  removeDefinition: (id: string) => void;
  renameDefinition: (id: string, name: string) => void;
  setActiveDefinition: (id: string) => void;
  setSidePanelDefinition: (id: string | null) => void;
  togglePalette: () => void;
  toggleDarkMode: () => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<Record<string, unknown>>) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  getDefinition: (id: string) => NodeDefinition | undefined;
  getInputOutputNodes: (definitionId: string) => { inputs: Node[]; outputs: Node[] };
  hydrate: (savedState: { definitions: NodeDefinition[]; activeDefinitionId: string | null; paletteCollapsed?: boolean; darkMode?: boolean }) => void;
};

type StoreType = StoreState & StoreActions;

export const useStore = create<StoreType>()((set, get) => ({
  // --- State ---
  definitions: [],
  activeDefinitionId: null,
  sidePanelDefinitionId: null,
  paletteCollapsed: false,
  darkMode: false,

  // --- Actions ---

  addDefinition: (name?: string) => {
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

  addNode: (node: Node) => {
    const { definitions, activeDefinitionId } = get();
    if (!activeDefinitionId) return;

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

  hydrate: (savedState: { definitions: NodeDefinition[]; activeDefinitionId: string | null; paletteCollapsed?: boolean; darkMode?: boolean }) => {
    set({
      definitions: savedState.definitions,
      activeDefinitionId: savedState.activeDefinitionId,
      paletteCollapsed: savedState.paletteCollapsed ?? false,
      darkMode: savedState.darkMode ?? false,
    });
  },
}));
