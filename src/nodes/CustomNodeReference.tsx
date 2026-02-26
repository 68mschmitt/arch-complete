import { memo, useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import type { CustomNodeReferenceData } from '../types';
import { NODE_TYPES } from '../types';
import { useStore } from '../store/useStore';
import styles from './CustomNodeReference.module.css';

function CustomNodeReference({
  id,
  data,
}: NodeProps<Node<CustomNodeReferenceData>>) {
  const updateNodeInternals = useUpdateNodeInternals();

  const definition = useStore((state) =>
    state.definitions.find((d) => d.id === data.definitionId) ?? null,
  );

  const inputs = definition
    ? definition.nodes.filter((n) => n.type === NODE_TYPES.INPUT)
    : [];
  const outputs = definition
    ? definition.nodes.filter((n) => n.type === NODE_TYPES.OUTPUT)
    : [];

  const inputCount = inputs.length;
  const outputCount = outputs.length;

  useEffect(() => {
    updateNodeInternals(id);
  }, [inputCount, outputCount, id, updateNodeInternals]);

  if (!definition) {
    return (
      <div className={styles.orphanedNode}>
        <div className={styles.orphanedLabel}>Missing: {data.label}</div>
      </div>
    );
  }

  return (
    <div className={styles.node}>
      <div className={styles.name}>{definition.name}</div>

      {inputs.map((inputNode, index) => (
        <div key={inputNode.id}>
          <Handle
            type="target"
            position={Position.Left}
            id={`input-${inputNode.id}`}
            style={{
              top: `${(100 / (inputCount + 1)) * (index + 1)}%`,
            }}
          />
          <span
            className={styles.handleLabelLeft}
            style={{
              top: `${(100 / (inputCount + 1)) * (index + 1)}%`,
              transform: 'translateY(-50%)',
            }}
          >
            {(inputNode.data as { label?: string }).label ?? 'Input'}
          </span>
        </div>
      ))}

      {outputs.map((outputNode, index) => (
        <div key={outputNode.id}>
          <Handle
            type="source"
            position={Position.Right}
            id={`output-${outputNode.id}`}
            style={{
              top: `${(100 / (outputCount + 1)) * (index + 1)}%`,
            }}
          />
          <span
            className={styles.handleLabelRight}
            style={{
              top: `${(100 / (outputCount + 1)) * (index + 1)}%`,
              transform: 'translateY(-50%)',
            }}
          >
            {(outputNode.data as { label?: string }).label ?? 'Output'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default memo(CustomNodeReference);
