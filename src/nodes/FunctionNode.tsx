import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { FunctionNodeData } from '../types';
import styles from './FunctionNode.module.css';

function FunctionNode({ data, isConnectable }: NodeProps<Node<FunctionNodeData>>) {
  return (
    <div className={styles.node}>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      <div className={styles.label}>{data.label}</div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default memo(FunctionNode);
