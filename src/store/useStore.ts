import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { Node, NodeChange, EdgeChange, Connection } from '@xyflow/react';

import type { NodeDefinition } from '../types';
import { NODE_TYPES } from '../types';

type StoreState = {
  definitions: NodeDefinition[];
  activeDefinitionId: string | null;
  sidePanelDefinitionId: string | null;
};

type StoreActions = {
  addDefinition: (name?: string) => void;
  removeDefinition: (id: string) => void;
  renameDefinition: (id: string, name: string) => void;
  setActiveDefinition: (id: string) => void;
  setSidePanelDefinition: (id: string | null) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<Record<string, unknown>>) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  getDefinition: (id: string) => NodeDefinition | undefined;
  getInputOutputNodes: (definitionId: string) => { inputs: Node[]; outputs: Node[] };
};

type StoreType = StoreState & StoreActions;

export const useStore = create<StoreType>()((set, get) => ({
  // --- State ---
  definitions: [],
  activeDefinitionId: null,
  sidePanelDefinitionId: null,

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

    set({
      definitions: definitions.map((d) => {
        if (d.id !== activeDefinitionId) return d;
        return {
          ...d,
          nodes: d.nodes.filter((n) => n.id !== nodeId),
          edges: d.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId,
          ),
        };
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

    set({
      definitions: definitions.map((d) => {
        if (d.id !== activeDefinitionId) return d;
        return {
          ...d,
          nodes: applyNodeChanges(changes, d.nodes),
        };
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
}));
