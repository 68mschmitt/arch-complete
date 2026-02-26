import { memo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import styles from './ScriptEditorPopup.module.css';

type ScriptEditorPopupProps = {
  nodeId: string;
  initialScript: string;
  initialOutputPorts: string[];
  onClose: () => void;
};

function ScriptEditorPopup({ nodeId, initialScript, initialOutputPorts, onClose }: ScriptEditorPopupProps) {
  const updateNodeData = useStore(s => s.updateNodeData);
  const [script, setScript] = useState(initialScript);
  const [outputPortsText, setOutputPortsText] = useState(initialOutputPorts.join(', '));

  const handleSave = useCallback(() => {
    const outputPorts = outputPortsText
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);
    updateNodeData(nodeId, { script, outputPorts });
    onClose();
  }, [nodeId, script, outputPortsText, updateNodeData, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleCancel]);

  // Close on overlay click
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  }, [handleCancel]);

  // Prevent body scroll when popup is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return createPortal(
    <div 
      className={styles.overlay} 
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      data-testid="script-editor-popup"
    >
      <div className={styles.popup}>
        <h3 className={styles.title}>Edit Function Script</h3>
        
        <div className={styles.field}>
          <label className={styles.label}>JavaScript Code</label>
          <textarea
            className={`nodrag ${styles.textarea}`}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="// Your JavaScript code here&#10;// Inputs available as variables&#10;// Return value or set output ports"
            rows={12}
            data-testid="script-editor-textarea"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Output Ports (comma-separated)</label>
          <input
            type="text"
            className={`nodrag ${styles.input}`}
            value={outputPortsText}
            onChange={(e) => setOutputPortsText(e.target.value)}
            placeholder="e.g., sum, product, result"
            data-testid="script-editor-output-ports"
          />
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={handleCancel}
            data-testid="script-editor-cancel"
          >
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles.saveButton}`}
            onClick={handleSave}
            data-testid="script-editor-save"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default memo(ScriptEditorPopup);
