import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { ConstantNodeData } from '../types';
import styles from './ConstantNode.module.css';

function ConstantNode({ data, isConnectable }: NodeProps<Node<ConstantNodeData>>) {
  return (
    <div className={styles.node}>
      <div className={styles.label}>{data.label}</div>
      <input
        type="text"
        value={data.value}
        className={`nodrag ${styles.input}`}
        readOnly
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default memo(ConstantNode);
