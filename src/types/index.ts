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
  testValues?: Record<string, unknown>;
};

export type OutputNodeData = {
  label: string;
  testValues?: Record<string, unknown>;
};

export type FunctionNodeData = {
  label: string;
  script?: string;
  outputPorts?: string[];
  testValues?: Record<string, unknown>;
};

export type ConstantNodeData = {
  label: string;
  value: string;
  valueType?: 'number' | 'string' | 'boolean';
  testValues?: Record<string, unknown>;
};

// Custom node reference data
export type CustomNodeReferenceData = {
  definitionId: string;
  label: string;
  testValues?: Record<string, unknown>;
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

// Execution engine types
export type NodeExecutionStatus = 'pending' | 'executing' | 'completed' | 'error';

export type NodeExecutionResult = {
  status: NodeExecutionStatus;
  inputValues: Record<string, unknown>;
  outputValues: Record<string, unknown>;
  error?: string;
};

export type ExecutionState = 'idle' | 'running' | 'stepping' | 'paused' | 'completed' | 'error';

// All node data types share testValues
export type AnyNodeData = InputNodeData | OutputNodeData | FunctionNodeData | ConstantNodeData | CustomNodeReferenceData;
