import { memo, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { ConstantNodeData } from '../types';
import { useStore } from '../store/useStore';
import styles from './ConstantNode.module.css';
import { useCanvasMode } from '../contexts/CanvasMode';

function ConstantNode({ id, data, isConnectable }: NodeProps<Node<ConstantNodeData>>) {
  const updateNodeData = useStore(s => s.updateNodeData);
  const { deleteElements } = useReactFlow();
  const mode = useCanvasMode();
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

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);
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
      {mode === 'edit' && (
        <button
          className={`nodrag nopan ${styles.deleteButton}`}
          onClick={handleDelete}
          data-testid="node-delete-button"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default memo(ConstantNode);
