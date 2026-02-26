import { useEffect } from 'react';
import { useStore } from '../store/useStore';

const STORAGE_KEY = 'arch-complete-state';
const DEBOUNCE_MS = 500;

export function usePersistence() {
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const unsubscribe = useStore.subscribe((state) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        try {
          const toSave = {
            definitions: state.definitions,
            activeDefinitionId: state.activeDefinitionId,
            paletteCollapsed: state.paletteCollapsed,
            darkMode: state.darkMode,
            // DO NOT save sidePanelDefinitionId — transient UI state
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch (err) {
          console.warn('Failed to save to localStorage:', err);
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);
}
