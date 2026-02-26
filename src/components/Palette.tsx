import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { NODE_TYPES, PALETTE_DND_TYPE, PALETTE_MOVE_DND_TYPE } from '../types';
import ConfirmDialog from './ConfirmDialog';
import styles from './Palette.module.css';

function Palette() {
  // --- Store ---
  const definitions = useStore((s) => s.definitions);
  const directories = useStore((s) => s.directories);
  const addDefinition = useStore((s) => s.addDefinition);
  const addDirectory = useStore((s) => s.addDirectory);
  const removeDefinition = useStore((s) => s.removeDefinition);
  const removeDirectory = useStore((s) => s.removeDirectory);
  const setActiveDefinition = useStore((s) => s.setActiveDefinition);
  const renameDefinition = useStore((s) => s.renameDefinition);
  const renameDirectory = useStore((s) => s.renameDirectory);
  const moveDefinitionToDirectory = useStore((s) => s.moveDefinitionToDirectory);
  const moveDirectoryToDirectory = useStore((s) => s.moveDirectoryToDirectory);

  // --- Editing state ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editingDirId, setEditingDirId] = useState<string | null>(null);
  const [editDirName, setEditDirName] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const renameDirInputRef = useRef<HTMLInputElement>(null);

  // --- Directory expand/collapse ---
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() => new Set());

  // --- DnD state ---
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // --- Confirmation dialog ---
  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // --- Primitives ---
  const primitives = [
    { type: NODE_TYPES.INPUT, label: 'Input' },
    { type: NODE_TYPES.OUTPUT, label: 'Output' },
    { type: NODE_TYPES.FUNCTION, label: 'Function' },
    { type: NODE_TYPES.CONSTANT, label: 'Constant' },
  ];

  // --- Focus refs on edit ---
  useEffect(() => {
    if (editingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (editingDirId && renameDirInputRef.current) {
      renameDirInputRef.current.focus();
      renameDirInputRef.current.select();
    }
  }, [editingDirId]);

  // --- Primitive DnD ---
  const handlePrimitiveDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: string,
  ) => {
    event.dataTransfer.setData(
      PALETTE_DND_TYPE,
      JSON.stringify({ nodeType }),
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  // --- Custom node DnD (both canvas-drop and palette-reorder) ---
  const handleCustomDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    definitionId: string,
  ) => {
    // For canvas drops
    event.dataTransfer.setData(
      PALETTE_DND_TYPE,
      JSON.stringify({
        nodeType: NODE_TYPES.CUSTOM_REFERENCE,
        definitionId,
      }),
    );
    // For palette reorganization
    event.dataTransfer.setData(
      PALETTE_MOVE_DND_TYPE,
      JSON.stringify({ type: 'node', id: definitionId }),
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  // --- Directory DnD (palette-reorder only) ---
  const handleDirDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    dirId: string,
  ) => {
    event.dataTransfer.setData(
      PALETTE_MOVE_DND_TYPE,
      JSON.stringify({ type: 'directory', id: dirId }),
    );
    event.dataTransfer.effectAllowed = 'move';
    event.stopPropagation();
  };

  // --- Directory expand/collapse ---
  const toggleDir = useCallback((dirId: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(dirId)) {
        next.delete(dirId);
      } else {
        next.add(dirId);
      }
      return next;
    });
  }, []);

  // --- New node at specific directory level ---
  const handleNewNode = useCallback((directoryId: string | null) => {
    addDefinition(undefined, directoryId);
    // Auto-expand the target directory
    if (directoryId) {
      setExpandedDirs((prev) => new Set(prev).add(directoryId));
    }
  }, [addDefinition]);

  // --- New subfolder ---
  const handleNewFolder = useCallback((parentId: string | null) => {
    addDirectory(undefined, parentId);
    // Auto-expand the parent directory
    if (parentId) {
      setExpandedDirs((prev) => new Set(prev).add(parentId));
    }
  }, [addDirectory]);

  // --- Node rename ---
  const handleDoubleClick = (defId: string, currentName: string) => {
    setEditingId(defId);
    setEditName(currentName);
  };

  const handleRenameCommit = () => {
    if (editingId) {
      renameDefinition(editingId, editName);
      setEditingId(null);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameCommit();
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  // --- Directory rename ---
  const handleDirDoubleClick = (dirId: string, currentName: string) => {
    setEditingDirId(dirId);
    setEditDirName(currentName);
  };

  const handleDirRenameCommit = () => {
    if (editingDirId) {
      renameDirectory(editingDirId, editDirName);
      setEditingDirId(null);
    }
  };

  const handleDirRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDirRenameCommit();
    } else if (e.key === 'Escape') {
      setEditingDirId(null);
    }
  };

  // --- Delete with confirmation ---
  const handleDeleteNode = (e: React.MouseEvent, defId: string, defName: string) => {
    e.stopPropagation();
    setConfirmAction({
      message: `Are you sure you want to delete "${defName}"?`,
      onConfirm: () => {
        removeDefinition(defId);
        setConfirmAction(null);
      },
    });
  };

  const handleDeleteDir = (e: React.MouseEvent, dirId: string, dirName: string) => {
    e.stopPropagation();
    setConfirmAction({
      message: `Are you sure you want to delete the folder "${dirName}"? Its contents will be moved to the parent folder.`,
      onConfirm: () => {
        removeDirectory(dirId);
        setConfirmAction(null);
      },
    });
  };

  // --- DnD: directory drop zone handlers ---
  const handleDirDragOver = (e: React.DragEvent, dirId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(dirId);
  };

  const handleDirDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverTarget(null);
  };

  const handleDirDrop = (e: React.DragEvent, targetDirId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);

    const moveData = e.dataTransfer.getData(PALETTE_MOVE_DND_TYPE);
    if (!moveData) return;

    try {
      const payload = JSON.parse(moveData) as { type: string; id: string };
      if (payload.type === 'node') {
        moveDefinitionToDirectory(payload.id, targetDirId);
      } else if (payload.type === 'directory') {
        moveDirectoryToDirectory(payload.id, targetDirId);
        // Auto-expand the target so the moved folder is visible
        if (targetDirId) {
          setExpandedDirs((prev) => new Set(prev).add(targetDirId));
        }
      }
    } catch {
      // Invalid data — ignore
    }
  };

  // --- Root-level drop zone (moves node to root) ---
  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget('__root__');
  };

  const handleRootDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleRootDrop = (e: React.DragEvent) => {
    handleDirDrop(e, null);
  };

  // --- Node click ---
  const handleCustomNodeClick = (definitionId: string) => {
    setActiveDefinition(definitionId);
  };

  // --- Recursive tree renderer ---
  const renderLevel = (parentDirId: string | null, depth: number) => {
    const childDirs = directories.filter((d) => d.parentId === parentDirId);
    const childDefs = definitions.filter((d) => (d.directoryId ?? null) === parentDirId);

    if (childDirs.length === 0 && childDefs.length === 0) {
      return null;
    }

    return (
      <div
        className={styles.treeLevel}
        style={depth > 0 ? { paddingLeft: 16 } : undefined}
      >
        {childDirs.map((dir) => {
          const isExpanded = expandedDirs.has(dir.id);
          const isDragOver = dragOverTarget === dir.id;

          return (
            <div
              key={dir.id}
              className={styles.directoryGroup}
              onDragOver={(e) => handleDirDragOver(e, dir.id)}
              onDragLeave={handleDirDragLeave}
              onDrop={(e) => handleDirDrop(e, dir.id)}
            >
              <div
                className={`${styles.directoryHeader} ${isDragOver ? styles.directoryDragOver : ''}`}
                data-testid="directory-header"
                draggable={editingDirId !== dir.id}
                onDragStart={(e) => handleDirDragStart(e, dir.id)}
              >
                <span
                  className={styles.expandToggle}
                  onClick={() => toggleDir(dir.id)}
                  data-testid="directory-toggle"
                >
                  {isExpanded ? '▼' : '▶'}
                </span>
                <span className={styles.folderIcon}>📁</span>
                {editingDirId === dir.id ? (
                  <input
                    ref={renameDirInputRef}
                    className={styles.renameInput}
                    data-testid="rename-directory-input"
                    value={editDirName}
                    onChange={(e) => setEditDirName(e.target.value)}
                    onBlur={handleDirRenameCommit}
                    onKeyDown={handleDirRenameKeyDown}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className={styles.directoryName}
                    onDoubleClick={() => handleDirDoubleClick(dir.id, dir.name)}
                  >
                    {dir.name}
                  </span>
                )}
                <div className={styles.directoryActions}>
                  <button
                    className={styles.dirActionButton}
                    onClick={() => handleNewNode(dir.id)}
                    title="New node in this folder"
                    data-testid="directory-new-node"
                  >
                    +
                  </button>
                  <button
                    className={styles.dirActionButton}
                    onClick={() => handleNewFolder(dir.id)}
                    title="New subfolder"
                    data-testid="directory-new-folder"
                  >
                    📁
                  </button>
                  <button
                    className={styles.dirActionButton}
                    onClick={(e) => handleDeleteDir(e, dir.id, dir.name)}
                    title="Delete folder"
                    data-testid="directory-delete"
                  >
                    ×
                  </button>
                </div>
              </div>
              {isExpanded && renderLevel(dir.id, depth + 1)}
            </div>
          );
        })}

        {childDefs.map((def) => (
          <div
            key={def.id}
            className={styles.customEntry}
            draggable={editingId !== def.id}
            onDragStart={(e) => handleCustomDragStart(e, def.id)}
            onClick={() => handleCustomNodeClick(def.id)}
            onDoubleClick={() => handleDoubleClick(def.id, def.name)}
          >
            {editingId === def.id ? (
              <input
                ref={renameInputRef}
                className={styles.renameInput}
                data-testid="rename-definition-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRenameCommit}
                onKeyDown={handleRenameKeyDown}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={styles.entryName}>{def.name}</span>
            )}
            <button
              className={styles.deleteButton}
              data-testid="delete-definition-button"
              onClick={(e) => handleDeleteNode(e, def.id, def.name)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.palette} data-testid="palette">
      {/* Primitives section — unchanged */}
      <div className={styles.section} data-testid="palette-primitives">
        <div className={styles.sectionHeader}>Primitives</div>
        {primitives.map((prim) => (
          <div
            key={prim.type}
            className={styles.paletteItem}
            draggable
            onDragStart={(e) => handlePrimitiveDragStart(e, prim.type)}
          >
            {prim.label}
          </div>
        ))}
      </div>

      <div className={styles.divider} />

      {/* Custom Nodes section — directory tree */}
      <div
        className={styles.section}
        data-testid="palette-custom"
        onDragOver={handleRootDragOver}
        onDragLeave={handleRootDragLeave}
        onDrop={handleRootDrop}
      >
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeader}>Custom Nodes</div>
          <div className={styles.headerActions}>
            <button
              className={styles.newNodeButton}
              onClick={() => handleNewNode(null)}
              data-testid="new-node-button"
            >
              + Node
            </button>
            <button
              className={styles.newFolderButton}
              onClick={() => handleNewFolder(null)}
              data-testid="new-folder-button"
            >
              + Folder
            </button>
          </div>
        </div>
        {renderLevel(null, 0)}
      </div>

      {/* Confirmation dialog */}
      {confirmAction && (
        <ConfirmDialog
          message={confirmAction.message}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

export default Palette;
