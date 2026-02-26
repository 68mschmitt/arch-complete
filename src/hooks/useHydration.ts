import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

const STORAGE_KEY = 'arch-complete-state';

export function useHydration() {
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.definitions && Array.isArray(parsed.definitions)) {
          useStore.getState().hydrate(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to restore from localStorage:', err);
    }
  }, []);
}
