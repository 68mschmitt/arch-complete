import { memo, useState, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { FunctionNodeData } from '../types';
import { useStore } from '../store/useStore';
import styles from './FunctionNode.module.css';

function FunctionNode({ id, data, isConnectable }: NodeProps<Node<FunctionNodeData>>) {
  const updateNodeData = useStore(s => s.updateNodeData);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);

  const handleDoubleClick = useCallback(() => {
    setEditing(true);
    setDraft(data.label);
  }, [data.label]);

  const handleSave = useCallback(() => {
    setEditing(false);
    updateNodeData(id, { label: draft });
  }, [id, draft, updateNodeData]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditing(false);
      setDraft(data.label);
    }
  }, [handleSave, data.label]);
  return (
    <div className={styles.node}>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      {editing ? (
        <input
          className="nodrag"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <div className={styles.label} onDoubleClick={handleDoubleClick}>{data.label}</div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default memo(FunctionNode);
