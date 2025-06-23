import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onDrawBuilding: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onToggleFPS: () => void;
  onShowConfig: () => void;
  onExport: () => void;
  onClearAll: () => void;
  onEscape: () => void;
  onUndoLastPoint: () => void;
  isDrawing: boolean;
  isInitialized: boolean;
}

export const useKeyboardShortcuts = ({
  onDrawBuilding,
  onToggleGrid,
  onToggleSnap,
  onToggleFPS,
  onShowConfig,
  onExport,
  onClearAll,
  onEscape,
  onUndoLastPoint,
  isDrawing,
  isInitialized
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in input fields
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Handle shortcuts
      switch (event.key.toLowerCase()) {
        case 'd':
          // Allow 'D' to work even if already drawing - it will restart the drawing mode
          if (isInitialized) {
            event.preventDefault();
            onDrawBuilding();
          }
          break;
        case 'g':
          event.preventDefault();
          onToggleGrid();
          break;
        case 's':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            onToggleSnap();
          }
          break;
        case 'f':
          event.preventDefault();
          onToggleFPS();
          break;
        case 'c':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onShowConfig();
          }
          break;
        case 'e':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onExport();
          }
          break;
        case 'delete':
        case 'backspace':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onClearAll();
          }
          break;
        case 'escape':
          event.preventDefault();
          onEscape();
          break;
        case 'u':
          event.preventDefault();
          onUndoLastPoint();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onDrawBuilding,
    onToggleGrid,
    onToggleSnap,
    onToggleFPS,
    onShowConfig,
    onExport,
    onClearAll,
    onEscape,
    onUndoLastPoint,
    isDrawing,
    isInitialized
  ]);
};