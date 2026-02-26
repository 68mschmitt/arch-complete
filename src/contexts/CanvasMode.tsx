import { createContext, useContext } from 'react';

type CanvasMode = 'edit' | 'preview';

const CanvasModeContext = createContext<CanvasMode>('edit');

export function CanvasModeProvider({ mode, children }: { mode: CanvasMode; children: React.ReactNode }) {
  return <CanvasModeContext.Provider value={mode}>{children}</CanvasModeContext.Provider>;
}

export function useCanvasMode(): CanvasMode {
  return useContext(CanvasModeContext);
}
