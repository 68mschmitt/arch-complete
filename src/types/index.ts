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

// DnD type for palette internal reorganization (moving nodes between directories)
export const PALETTE_MOVE_DND_TYPE = 'application/archcomplete-palette-move';

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

// Directory for organizing custom nodes in the palette
export type Directory = {
  id: string;
  name: string;
  parentId: string | null;
};
// Node definition — each canvas IS a node definition
export type NodeDefinition = {
  id: string;
  name: string;
  directoryId: string | null;
  nodes: Node[];
  edges: Edge[];
};

// Application state shape
export type AppState = {
  definitions: NodeDefinition[];
  directories: Directory[];
  activeDefinitionId: string | null;
  sidePanelDefinitionId: string | null;
  paletteCollapsed: boolean;
  darkMode: boolean;
};
