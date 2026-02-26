import { memo, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { OutputNodeData } from '../types';
import { useStore } from '../store/useStore';
import { useNodeExecutionStatus } from '../hooks/useNodeExecutionStatus';
import styles from './OutputNode.module.css';
import { useCanvasMode } from '../contexts/CanvasMode';
import TestValuesPopup from '../components/TestValuesPopup';

function OutputNode({ id, data, isConnectable }: NodeProps<Node<OutputNodeData>>) {
  const updateNodeData = useStore(s => s.updateNodeData);
  const execStatus = useNodeExecutionStatus(id);
  const [editing, setEditing] = useState(false);


  const [draft, setDraft] = useState(data.label);
  const { deleteElements } = useReactFlow();
  const mode = useCanvasMode();
  const [showTestValues, setShowTestValues] = useState(false);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  const handleOpenTestValues = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTestValues(true);
  }, []);

  const handleCloseTestValues = useCallback(() => {
    setShowTestValues(false);
  }, []);

  const handleSaveTestValues = useCallback((testValues: Record<string, unknown>) => {
    updateNodeData(id, { testValues });
  }, [id, updateNodeData]);

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
  const execClass = execStatus ? styles[`exec${execStatus.charAt(0).toUpperCase() + execStatus.slice(1)}`] ?? '' : '';
  return (
    <div className={`${styles.node} ${execClass}`}>

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
      {mode === 'edit' && (
        <>
          <button
            className={`nodrag nopan ${styles.testButton}`}
            onClick={handleOpenTestValues}
            data-testid="test-values-button"
            title="Set Test Values"
          >
            🧪
          </button>
          <button
            className={`nodrag nopan ${styles.deleteButton}`}
            onClick={handleDelete}
            data-testid="node-delete-button"
          >
            ×
          </button>
        </>
      )}
      {showTestValues && (
        <TestValuesPopup
          nodeLabel={data.label}
          fields={[{ key: 'value', label: data.label, currentValue: data.testValues?.value }]}
          onSave={handleSaveTestValues}
          onClose={handleCloseTestValues}
        />
      )}
    </div>
  );
}

export default memo(OutputNode);
