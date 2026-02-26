import { memo, useEffect, useState, useCallback } from 'react';
import { Handle, Position, useUpdateNodeInternals, useReactFlow } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import type { CustomNodeReferenceData } from '../types';
import { NODE_TYPES } from '../types';
import { useStore } from '../store/useStore';
import styles from './CustomNodeReference.module.css';
import { useCanvasMode } from '../contexts/CanvasMode';

function CustomNodeReference({
  id,
  data,
}: NodeProps<Node<CustomNodeReferenceData>>) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const [editingLabel, setEditingLabel] = useState(false);
  const [draftLabel, setDraftLabel] = useState(data.label);
  const updateNodeInternals = useUpdateNodeInternals();
  const { deleteElements } = useReactFlow();
  const mode = useCanvasMode();

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

  if (!definition) {
    return (
      <div className={styles.orphanedNode}>
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
    <div className={styles.node}>
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
        <div key={inputNode.id}>
          <Handle
            type="target"
            position={Position.Left}
            id={`input-${inputNode.id}`}
            style={{
              top: `${(100 / (inputCount + 1)) * (index + 1)}%`,
            }}
          />
          <span
            className={styles.handleLabelLeft}
            style={{
              top: `${(100 / (inputCount + 1)) * (index + 1)}%`,
              transform: 'translateY(-50%)',
            }}
          >
            {(inputNode.data as { label?: string }).label ?? 'Input'}
          </span>
        </div>
      ))}

      {outputs.map((outputNode, index) => (
        <div key={outputNode.id}>
          <Handle
            type="source"
            position={Position.Right}
            id={`output-${outputNode.id}`}
            style={{
              top: `${(100 / (outputCount + 1)) * (index + 1)}%`,
            }}
          />
          <span
            className={styles.handleLabelRight}
            style={{
              top: `${(100 / (outputCount + 1)) * (index + 1)}%`,
              transform: 'translateY(-50%)',
            }}
          >
            {(outputNode.data as { label?: string }).label ?? 'Output'}
          </span>
        </div>
      ))}
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

export default memo(CustomNodeReference);
