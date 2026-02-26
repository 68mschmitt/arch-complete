import { memo, useState, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { ConstantNodeData } from '../types';
import { useStore } from '../store/useStore';
import styles from './ConstantNode.module.css';

function ConstantNode({ id, data, isConnectable }: NodeProps<Node<ConstantNodeData>>) {
  const updateNodeData = useStore(s => s.updateNodeData);
  const [editingLabel, setEditingLabel] = useState(false);
  const [draftLabel, setDraftLabel] = useState(data.label);

  const handleDoubleClick = useCallback(() => {
    setEditingLabel(true);
    setDraftLabel(data.label);
  }, [data.label]);

  const handleSaveLabel = useCallback(() => {
    setEditingLabel(false);
    updateNodeData(id, { label: draftLabel });
  }, [id, draftLabel, updateNodeData]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveLabel();
    } else if (e.key === 'Escape') {
      setEditingLabel(false);
      setDraftLabel(data.label);
    }
  }, [handleSaveLabel, data.label]);

  const handleValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(id, { value: e.target.value });
  }, [id, updateNodeData]);
  return (
    <div className={styles.node}>
      {editingLabel ? (
        <input
          className="nodrag"
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          onBlur={handleSaveLabel}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <div className={styles.label} onDoubleClick={handleDoubleClick}>{data.label}</div>
      )}
      <input
        type="text"
        value={data.value}
        onChange={handleValueChange}
        className={`nodrag ${styles.input}`}
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
