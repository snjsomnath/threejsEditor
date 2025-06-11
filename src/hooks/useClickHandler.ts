import { useEffect, useRef } from 'react';

export const useClickHandler = (
  containerRef: React.RefObject<HTMLDivElement>,
  onSingleClick: (event: MouseEvent, container: HTMLElement) => void,
  onDoubleClick: () => void
) => {
  const clickTimeoutRef = useRef<number | null>(null);
  const isDoubleClickRef = useRef(false);
  const lastClickTimeRef = useRef(0);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (event: MouseEvent) => {
      mouseDownPosRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (!mouseDownPosRef.current) return;

      // Check if it's a real click (not a drag)
      const dx = Math.abs(event.clientX - mouseDownPosRef.current.x);
      const dy = Math.abs(event.clientY - mouseDownPosRef.current.y);
      if (dx > 5 || dy > 5) {
        mouseDownPosRef.current = null;
        return;
      }

      // Handle click timing
      const now = Date.now();
      const timeDiff = now - lastClickTimeRef.current;

      if (timeDiff < 300) {
        // Double click
        isDoubleClickRef.current = true;
        
        if (clickTimeoutRef.current) {
          window.clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }
        
        onDoubleClick();
      } else {
        // Single click - delay processing
        isDoubleClickRef.current = false;
        
        if (clickTimeoutRef.current) {
          window.clearTimeout(clickTimeoutRef.current);
        }
        
        clickTimeoutRef.current = window.setTimeout(() => {
          if (!isDoubleClickRef.current && container) {
            onSingleClick(event, container);
          }
          clickTimeoutRef.current = null;
        }, 300);
      }

      lastClickTimeRef.current = now;
      mouseDownPosRef.current = null;
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [containerRef, onSingleClick, onDoubleClick]);
};