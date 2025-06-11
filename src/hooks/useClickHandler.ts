import { useEffect, useRef } from 'react';

export const useClickHandler = (
  containerRef: React.RefObject<HTMLDivElement>,
  onSingleClick: (event: MouseEvent, container: HTMLElement) => void,
  onDoubleClick: () => void,
  onMouseMove?: (event: MouseEvent, container: HTMLElement) => void
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

    const handleMouseMove = (event: MouseEvent) => {
      if (onMouseMove) {
        onMouseMove(event, container);
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (!mouseDownPosRef.current) return;

      // Ultra-tight drag threshold for instant response
      const dx = Math.abs(event.clientX - mouseDownPosRef.current.x);
      const dy = Math.abs(event.clientY - mouseDownPosRef.current.y);
      if (dx > 2 || dy > 2) {
        mouseDownPosRef.current = null;
        return;
      }

      // Ultra-fast click detection
      const now = Date.now();
      const timeDiff = now - lastClickTimeRef.current;

      if (timeDiff < 200) { // Reduced to 200ms for faster double-click
        // Double click - immediate response
        isDoubleClickRef.current = true;
        
        if (clickTimeoutRef.current) {
          window.clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }
        
        onDoubleClick();
      } else {
        // Single click - IMMEDIATE response with minimal delay
        isDoubleClickRef.current = false;
        
        if (clickTimeoutRef.current) {
          window.clearTimeout(clickTimeoutRef.current);
        }
        
        // Reduced to just 50ms for near-instant response!
        clickTimeoutRef.current = window.setTimeout(() => {
          if (!isDoubleClickRef.current && container) {
            onSingleClick(event, container);
          }
          clickTimeoutRef.current = null;
        }, 50);
      }

      lastClickTimeRef.current = now;
      mouseDownPosRef.current = null;
    };

    // High-frequency event listeners for maximum responsiveness
    container.addEventListener('mousedown', handleMouseDown, { passive: true });
    container.addEventListener('mouseup', handleMouseUp, { passive: true });
    container.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [containerRef, onSingleClick, onDoubleClick, onMouseMove]);
};