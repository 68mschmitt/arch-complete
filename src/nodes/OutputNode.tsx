import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { OutputNodeData } from '../types';
import styles from './OutputNode.module.css';

function OutputNode({ data, isConnectable }: NodeProps<Node<OutputNodeData>>) {
  return (
    <div className={styles.node}>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      <div className={styles.label}>{data.label}</div>
    </div>
  );
}

export default memo(OutputNode);
