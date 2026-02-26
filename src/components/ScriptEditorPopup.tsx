import { memo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import styles from './ScriptEditorPopup.module.css';

const DEFAULT_SCRIPT = `function process(inputs) {
  // inputs.name — access input values by name
  // Return an object with your output values
  return {
    output: inputs.input
  };
}`;

type ScriptEditorPopupProps = {
  nodeId: string;
  initialScript: string;
  onClose: () => void;
};

function ScriptEditorPopup({ nodeId, initialScript, onClose }: ScriptEditorPopupProps) {
  const updateNodeData = useStore(s => s.updateNodeData);
  const [script, setScript] = useState(initialScript || DEFAULT_SCRIPT);

  const handleSave = useCallback(() => {
    updateNodeData(nodeId, { script });
    onClose();
  }, [nodeId, script, updateNodeData, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleCancel]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  }, [handleCancel]);

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
          <textarea
            className={`nodrag ${styles.textarea}`}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={14}
            data-testid="script-editor-textarea"
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
