import { memo, useEffect, useState, useCallback } from 'react';
import { Handle, Position, useUpdateNodeInternals, useReactFlow } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import type { CustomNodeReferenceData } from '../types';
import { NODE_TYPES } from '../types';
import { useStore } from '../store/useStore';
import { useNodeExecutionStatus } from '../hooks/useNodeExecutionStatus';
import styles from './CustomNodeReference.module.css';
import { useCanvasMode } from '../contexts/CanvasMode';
import TestValuesPopup from '../components/TestValuesPopup';

function CustomNodeReference({
  id,
  data,
}: NodeProps<Node<CustomNodeReferenceData>>) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const execStatus = useNodeExecutionStatus(id);
  const [editingLabel, setEditingLabel] = useState(false);





  const [draftLabel, setDraftLabel] = useState(data.label);
  const updateNodeInternals = useUpdateNodeInternals();
  const { deleteElements } = useReactFlow();
  const mode = useCanvasMode();
  const [showTestValues, setShowTestValues] = useState(false);

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

  const definition = useStore((state) =>
    state.definitions.find((d) => d.id === data.definitionId) ?? null,
  );

  const inputs = definition
    ? definition.nodes.filter((n) => n.type === NODE_TYPES.INPUT)
    : [];
  const outputs = definition
    ? definition.nodes.filter((n) => n.type === NODE_TYPES.OUTPUT)
    : [];

  const inputCount = inputs.length;
  const outputCount = outputs.length;

  useEffect(() => {
    updateNodeInternals(id);
  }, [inputCount, outputCount, id, updateNodeInternals]);

  const execClass = execStatus ? styles[`exec${execStatus.charAt(0).toUpperCase() + execStatus.slice(1)}`] ?? '' : '';

  if (!definition) {
    return (
      <div className={`${styles.orphanedNode} ${execClass}`}>


        <div className={styles.orphanedLabel}>
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
            <span onDoubleClick={handleDoubleClick}>Missing: {data.label}</span>
          )}
        </div>
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

  return (
    <div className={`${styles.node} ${execClass}`}>

      <div className={styles.name}>
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
          <span onDoubleClick={handleDoubleClick}>{definition.name}</span>
        )}
      </div>

      {inputs.map((inputNode, index) => (
        <Handle
          key={inputNode.id}
          type="target"
          position={Position.Left}
          id={`input-${inputNode.id}`}
          style={{
            top: `${(100 / (inputCount + 1)) * (index + 1)}%`,
          }}
        />
      ))}

      {outputs.map((outputNode, index) => (
        <Handle
          key={outputNode.id}
          type="source"
          position={Position.Right}
          id={`output-${outputNode.id}`}
          style={{
            top: `${(100 / (outputCount + 1)) * (index + 1)}%`,
          }}
        />
      ))}
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
          fields={inputs.map(inputNode => ({
            key: `input-${inputNode.id}`,
            label: (inputNode.data as { label?: string })?.label || 'Input',
            currentValue: data.testValues?.[`input-${inputNode.id}`]
          }))}
          onSave={handleSaveTestValues}
          onClose={handleCloseTestValues}
        />
      )}
    </div>
  );
}

export default memo(CustomNodeReference);
