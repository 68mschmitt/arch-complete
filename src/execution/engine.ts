import type { Node, Edge } from '@xyflow/react';
import type { NodeDefinition, NodeExecutionResult } from '../types';
import { NODE_TYPES } from '../types';

// Maximum property accesses on the node proxy before we abort (infinite loop protection)
const MAX_PROXY_ACCESSES = 1_000_000;

// --- Topological Sort (Kahn's algorithm) ---

export type TopologicalSortResult =
  | { ok: true; order: string[] }
  | { ok: false; error: string; cycleNodes: string[] };

export function topologicalSort(nodes: Node[], edges: Edge[]): TopologicalSortResult {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const id of nodeIds) {
    inDegree.set(id, 0);
    adjacency.set(id, []);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    adjacency.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // Start with zero in-degree nodes
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  if (order.length !== nodeIds.size) {
    const cycleNodes = [...nodeIds].filter((id) => !order.includes(id));
    const cycleLabels = cycleNodes
      .map((id) => {
        const node = nodes.find((n) => n.id === id);
        return (node?.data as { label?: string })?.label ?? id;
      })
      .join(' → ');
    return {
      ok: false,
      error: `Cannot execute: cycle detected between nodes: ${cycleLabels}`,
      cycleNodes,
    };
  }

  return { ok: true, order };
}

// --- Input Name Resolution ---

/**
 * Resolve the input variable name for a function node's input edge.
 * Name comes from the source node's label.
 * Duplicates get auto-numbered by source node creation order.
 */
export function resolveInputNames(
  targetNodeId: string,
  nodes: Node[],
  edges: Edge[],
): Record<string, string> {
  // Find all edges pointing into this node
  const incomingEdges = edges.filter((e) => e.target === targetNodeId);

  // Map: source node ID → source node label
  const nameMap: Record<string, string> = {};
  const labelCounts: Record<string, number> = {};

  for (const edge of incomingEdges) {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode) continue;

    const rawLabel = (sourceNode.data as { label?: string })?.label ?? 'input';
    // Sanitize to valid JS identifier
    const baseName = sanitizeIdentifier(rawLabel);

    const count = (labelCounts[baseName] ?? 0) + 1;
    labelCounts[baseName] = count;

    // First occurrence: use baseName, subsequent: baseName + count
    const resolvedName = count === 1 ? baseName : `${baseName}${count}`;
    // Key by edge source + sourceHandle for uniqueness
    const edgeKey = edge.sourceHandle ?? edge.source;
    nameMap[edgeKey] = resolvedName;
  }

  return nameMap;
}

/**
 * Sanitize a label string into a valid JS identifier.
 * Replaces non-alphanumeric chars with underscores, ensures doesn't start with digit.
 */
function sanitizeIdentifier(label: string): string {
  let sanitized = label.replace(/[^a-zA-Z0-9_$]/g, '_');
  if (/^[0-9]/.test(sanitized)) {
    sanitized = '_' + sanitized;
  }
  if (sanitized === '') sanitized = '_input';
  return sanitized;
}

// --- Node Proxy Builder ---

export type ProxyResult = {
  outputs: Record<string, unknown>;
  accessCount: number;
};

/**
 * Create a Proxy-based `node` object for script execution.
 * Reads pull from inputValues, writes push to outputs.
 * Tracks access count for infinite loop detection.
 */
export function createNodeProxy(
  inputValues: Record<string, unknown>,
  _declaredOutputPorts: string[],
): { proxy: Record<string, unknown>; getResult: () => ProxyResult } {
  const outputs: Record<string, unknown> = {};
  let accessCount = 0;

  const proxy = new Proxy({} as Record<string, unknown>, {
    get(_target, prop: string) {
      accessCount++;
      if (accessCount > MAX_PROXY_ACCESSES) {
        throw new Error('Execution limit exceeded — possible infinite loop');
      }
      // If it's a declared output that has been set, return it
      if (prop in outputs) return outputs[prop];
      // Otherwise read from inputs
      return inputValues[prop];
    },
    set(_target, prop: string, value: unknown) {
      accessCount++;
      if (accessCount > MAX_PROXY_ACCESSES) {
        throw new Error('Execution limit exceeded — possible infinite loop');
      }
      outputs[prop] = value;
      return true;
    },
  });

  return {
    proxy,
    getResult: () => ({ outputs, accessCount }),
  };
}

// --- Single Node Executor ---

export function executeNode(
  node: Node,
  inputValues: Record<string, unknown>,
  allDefinitions: NodeDefinition[],
  executionDepth: number = 0,
): { outputValues: Record<string, unknown>; error?: string } {
  const MAX_DEPTH = 50;
  if (executionDepth > MAX_DEPTH) {
    return { outputValues: {}, error: `Maximum recursion depth exceeded (${MAX_DEPTH})` };
  }

  const nodeData = node.data as Record<string, unknown>;

  switch (node.type) {
    case NODE_TYPES.INPUT: {
      // Input node passes its test value or a provided value through
      const label = sanitizeIdentifier((nodeData.label as string) ?? 'input');
      const testValues = (nodeData.testValues ?? {}) as Record<string, unknown>;
      // Input nodes output their own value: either from inputValues (upstream) or testValues
      const value = inputValues[label] ?? testValues[label] ?? testValues['value'] ?? undefined;
      return { outputValues: { [label]: value } };
    }

    case NODE_TYPES.CONSTANT: {
      const label = sanitizeIdentifier((nodeData.label as string) ?? 'constant');
      const rawValue = nodeData.value as string;
      const valueType = (nodeData.valueType as string) ?? 'string';
      let coerced: unknown = rawValue;

      switch (valueType) {
        case 'number':
          coerced = Number(rawValue);
          if (isNaN(coerced as number)) coerced = 0;
          break;
        case 'boolean':
          coerced = rawValue.toLowerCase() === 'true' || rawValue === '1';
          break;
        case 'string':
        default:
          coerced = rawValue;
          break;
      }

      return { outputValues: { [label]: coerced } };
    }

    case NODE_TYPES.FUNCTION: {
      const script = nodeData.script as string | undefined;
      if (!script || script.trim() === '') {
        // No script — pass first input through as output
        const firstInput = Object.values(inputValues)[0];
        const label = sanitizeIdentifier((nodeData.label as string) ?? 'output');
        return { outputValues: { [label]: firstInput } };
      }

      const outputPorts = (nodeData.outputPorts as string[]) ?? [];
      const { proxy, getResult } = createNodeProxy(inputValues, outputPorts);

      try {
        // Execute user script with `node` as the proxy
        const fn = new Function('node', script);
        fn(proxy);
        const { outputs } = getResult();
        return { outputValues: outputs };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { outputValues: {}, error: message };
      }
    }

    case NODE_TYPES.OUTPUT: {
      const label = sanitizeIdentifier((nodeData.label as string) ?? 'output');
      // Output node just passes through whatever it received
      const value = Object.values(inputValues)[0];
      return { outputValues: { [label]: value } };
    }

    case NODE_TYPES.CUSTOM_REFERENCE: {
      const definitionId = nodeData.definitionId as string;
      const definition = allDefinitions.find((d) => d.id === definitionId);
      if (!definition) {
        return {
          outputValues: {},
          error: `Missing definition: ${(nodeData.label as string) ?? definitionId}`,
        };
      }

      // Execute the sub-graph
      const result = executeDefinition(definition, inputValues, allDefinitions, executionDepth + 1);
      if (result.error) {
        return { outputValues: {}, error: result.error };
      }
      return { outputValues: result.outputs };
    }

    default:
      return { outputValues: {}, error: `Unknown node type: ${node.type}` };
  }
}

// --- Full Definition Executor ---

export type DefinitionExecutionResult = {
  outputs: Record<string, unknown>;
  nodeResults: Record<string, NodeExecutionResult>;
  executionOrder: string[];
  error?: string;
};

/**
 * Execute an entire definition's graph (for custom node references).
 */
export function executeDefinition(
  definition: NodeDefinition,
  externalInputs: Record<string, unknown>,
  allDefinitions: NodeDefinition[],
  executionDepth: number = 0,
): DefinitionExecutionResult {
  const { nodes, edges } = definition;

  // Topological sort
  const sortResult = topologicalSort(nodes, edges);
  if (!sortResult.ok) {
    return {
      outputs: {},
      nodeResults: {},
      executionOrder: [],
      error: sortResult.error,
    };
  }

  const { order } = sortResult;
  const nodeResults: Record<string, NodeExecutionResult> = {};
  // Track what value each node's output handle carries
  // Key: "nodeId" or "nodeId:handleId"
  const edgeValues: Record<string, unknown> = {};

  // Initialize all nodes as pending
  for (const nodeId of order) {
    nodeResults[nodeId] = {
      status: 'pending',
      inputValues: {},
      outputValues: {},
    };
  }

  for (const nodeId of order) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    nodeResults[nodeId].status = 'executing';

    // Gather input values from incoming edges
    const incomingEdges = edges.filter((e) => e.target === nodeId);
    const inputValues: Record<string, unknown> = {};

    // Build input name mapping for this node
    const inputNameMap = resolveInputNames(nodeId, nodes, edges);

    for (const edge of incomingEdges) {
      const edgeKey = edge.sourceHandle ?? edge.source;
      const nameKey = inputNameMap[edgeKey];
      if (nameKey) {
        // Look up the value from the source node's output
        const sourceOutputKey = edge.sourceHandle
          ? `${edge.source}:${edge.sourceHandle}`
          : edge.source;
        inputValues[nameKey] = edgeValues[sourceOutputKey];
      }
    }

    // For Input nodes, also inject external inputs
    if (node.type === NODE_TYPES.INPUT) {
      const label = sanitizeIdentifier(
        ((node.data as { label?: string })?.label) ?? 'input',
      );
      if (label in externalInputs) {
        inputValues[label] = externalInputs[label];
      }
    }

    // Check for test value overrides (fallback when no incoming edge provides a value)
    const testValues = ((node.data as Record<string, unknown>).testValues ?? {}) as Record<string, unknown>;
    for (const [key, value] of Object.entries(testValues)) {
      if (!(key in inputValues) || inputValues[key] === undefined) {
        inputValues[key] = value;
      }
    }

    nodeResults[nodeId].inputValues = { ...inputValues };

    // Execute
    const result = executeNode(node, inputValues, allDefinitions, executionDepth);
    nodeResults[nodeId].outputValues = result.outputValues;

    if (result.error) {
      nodeResults[nodeId].status = 'error';
      nodeResults[nodeId].error = result.error;
      return {
        outputs: {},
        nodeResults,
        executionOrder: order,
        error: `Error in node "${((node.data as { label?: string })?.label) ?? nodeId}": ${result.error}`,
      };
    }

    nodeResults[nodeId].status = 'completed';

    // Place output values on edges
    // For nodes with a single output, use nodeId as key
    // For nodes with named outputs, use nodeId:handleId
    const outputEntries = Object.entries(result.outputValues);
    if (outputEntries.length === 1) {
      // Single output — store under both nodeId and any source handles
      const [, value] = outputEntries[0];
      edgeValues[nodeId] = value;

      // Also store under specific handle IDs if this node has outgoing edges with sourceHandle
      const outgoingEdges = edges.filter((e) => e.source === nodeId);
      for (const edge of outgoingEdges) {
        if (edge.sourceHandle) {
          edgeValues[`${nodeId}:${edge.sourceHandle}`] = value;
        }
      }
    } else {
      // Multiple outputs — store under handle-specific keys
      for (const [portName, value] of outputEntries) {
        edgeValues[nodeId] = value; // fallback
        // Try to match port name to handle ID
        const outgoingEdges = edges.filter((e) => e.source === nodeId);
        for (const edge of outgoingEdges) {
          if (edge.sourceHandle) {
            edgeValues[`${nodeId}:${edge.sourceHandle}`] = value;
          }
        }
        // Also store by portName for lookup
        edgeValues[`${nodeId}:${portName}`] = value;
      }
    }
  }

  // Collect final outputs from Output nodes
  const finalOutputs: Record<string, unknown> = {};
  for (const nodeId of order) {
    const node = nodes.find((n) => n.id === nodeId);
    if (node?.type === NODE_TYPES.OUTPUT) {
      const label = sanitizeIdentifier(
        ((node.data as { label?: string })?.label) ?? 'output',
      );
      const result = nodeResults[nodeId];
      if (result) {
        const outVal = Object.values(result.outputValues)[0];
        finalOutputs[label] = outVal;
      }
    }
  }

  return {
    outputs: finalOutputs,
    nodeResults,
    executionOrder: order,
  };
}
