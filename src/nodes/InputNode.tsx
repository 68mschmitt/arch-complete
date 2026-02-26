import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { InputNodeData } from '../types';
import styles from './InputNode.module.css';

function InputNode({ data, isConnectable }: NodeProps<Node<InputNodeData>>) {
  return (
    <div className={styles.node}>
      <div className={styles.label}>{data.label}</div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default memo(InputNode);
