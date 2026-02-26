import { memo, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { ConstantNodeData } from '../types';
import { useStore } from '../store/useStore';
import { useNodeExecutionStatus } from '../hooks/useNodeExecutionStatus';
import styles from './ConstantNode.module.css';
import { useCanvasMode } from '../contexts/CanvasMode';

function ConstantNode({ id, data, isConnectable }: NodeProps<Node<ConstantNodeData>>) {
  const updateNodeData = useStore(s => s.updateNodeData);
  const execStatus = useNodeExecutionStatus(id);
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
    const newValue = data.valueType === 'boolean' ? e.target.checked.toString() : e.target.value;
    updateNodeData(id, { value: newValue });
  }, [id, data.valueType, updateNodeData]);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'string' | 'number' | 'boolean';
    let newValue = data.value;
    
    // Convert value when switching types
    if (newType === 'boolean') {
      newValue = data.value === 'true' ? 'true' : 'false';
    }
    
    updateNodeData(id, { valueType: newType, value: newValue });
  }, [id, data.value, updateNodeData]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);
  const execClass = execStatus ? styles[`exec${execStatus.charAt(0).toUpperCase() + execStatus.slice(1)}`] ?? '' : '';
  return (
    <div className={`${styles.node} ${execClass}`}>

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
      {data.valueType === 'boolean' ? (
        <label className={styles.checkboxWrapper}>
          <input
            type="checkbox"
            checked={data.value === 'true'}
            onChange={handleValueChange}
            className={`nodrag ${styles.checkbox}`}
          />
          <span className={styles.checkboxLabel}>
            {data.value === 'true' ? 'true' : 'false'}
          </span>
        </label>
      ) : (
        <input
          type={data.valueType === 'number' ? 'number' : 'text'}
          value={data.value}
          onChange={handleValueChange}
          className={`nodrag ${styles.input}`}
        />
      )}
      <select
        value={data.valueType || 'string'}
        onChange={handleTypeChange}
        className={`nodrag ${styles.typeSelect}`}
        data-testid="constant-type-selector"
      >
        <option value="string">string</option>
        <option value="number">number</option>
        <option value="boolean">boolean</option>
      </select>
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
