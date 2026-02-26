import { memo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './TestValuesPopup.module.css';

export type TestValueField = {
  key: string;
  label: string;
  currentValue: unknown;
};

type TestValuesPopupProps = {
  nodeId?: string;
  nodeLabel: string;
  fields: TestValueField[];
  onSave: (testValues: Record<string, unknown>) => void;
  onClose: () => void;
};

function TestValuesPopup({ nodeLabel, fields, onSave, onClose }: TestValuesPopupProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    fields.forEach(field => {
      initial[field.key] = field.currentValue !== undefined && field.currentValue !== null
        ? String(field.currentValue)
        : '';
    });
    return initial;
  });

  const handleSave = useCallback(() => {
    const testValues: Record<string, unknown> = {};
    Object.keys(values).forEach(key => {
      const val = values[key];
      // Try to parse as number, then boolean, then keep as string
      if (val === '') {
        testValues[key] = undefined;
      } else if (!isNaN(Number(val)) && val.trim() !== '') {
        testValues[key] = Number(val);
      } else if (val === 'true' || val === 'false') {
        testValues[key] = val === 'true';
      } else {
        testValues[key] = val;
      }
    });
    onSave(testValues);
    onClose();
  }, [values, onSave, onClose]);

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

  const handleFieldChange = useCallback((key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  }, []);

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
      data-testid="test-values-popup"
    >
      <div className={styles.popup}>
        <h3 className={styles.title}>Test Values — {nodeLabel}</h3>
        
        <div className={styles.fields}>
          {fields.map(field => (
            <div key={field.key} className={styles.field}>
              <label className={styles.label}>{field.label}</label>
              <input
                type="text"
                className={`nodrag ${styles.input}`}
                value={values[field.key] || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder="Enter test value"
                data-testid={`test-value-input-${field.key}`}
              />
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={handleCancel}
            data-testid="test-values-cancel"
          >
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles.saveButton}`}
            onClick={handleSave}
            data-testid="test-values-save"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default memo(TestValuesPopup);
