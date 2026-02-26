import { memo, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { InputNodeData } from '../types';
import { useStore } from '../store/useStore';
import styles from './InputNode.module.css';
import { useCanvasMode } from '../contexts/CanvasMode';

function InputNode({ id, data, isConnectable }: NodeProps<Node<InputNodeData>>) {
  const updateNodeData = useStore(s => s.updateNodeData);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const { deleteElements } = useReactFlow();
  const mode = useCanvasMode();


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
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  return (
    <div className={styles.node}>
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

export default memo(InputNode);
