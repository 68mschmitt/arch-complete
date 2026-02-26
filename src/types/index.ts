import type { Node, Edge } from '@xyflow/react';

// Node type constants — used as keys in nodeTypes and for identifying node types
export const NODE_TYPES = {
  INPUT: 'archInput',
  OUTPUT: 'archOutput',
  FUNCTION: 'archFunction',
  CONSTANT: 'archConstant',
  CUSTOM_REFERENCE: 'customNodeReference',
} as const;

// DnD type for palette drag operations
export const PALETTE_DND_TYPE = 'application/archcomplete-node';

// Primitive node data types
export type InputNodeData = {
  label: string;
};

export type OutputNodeData = {
  label: string;
};

export type FunctionNodeData = {
  label: string;
};

export type ConstantNodeData = {
  label: string;
  value: string;
};

// Custom node reference data
export type CustomNodeReferenceData = {
  definitionId: string;
  label: string;
};

// Node definition — each canvas IS a node definition
export type NodeDefinition = {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
};

// Application state shape
export type AppState = {
  definitions: NodeDefinition[];
  activeDefinitionId: string | null;
  sidePanelDefinitionId: string | null;
  paletteCollapsed: boolean;
  darkMode: boolean;
};
