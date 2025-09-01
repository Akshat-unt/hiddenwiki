import { useEffect, useRef } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventScroll?: boolean;
}

export const useSwipeNavigation = (config: SwipeConfig) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventScroll = false
  } = config;

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchEndRef.current = null;
      touchStartRef.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventScroll) {
        e.preventDefault();
      }
      touchEndRef.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      };
    };

    const handleTouchEnd = () => {
      if (!touchStartRef.current || !touchEndRef.current) return;

      const deltaX = touchStartRef.current.x - touchEndRef.current.x;
      const deltaY = touchStartRef.current.y - touchEndRef.current.y;

      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);

      if (isHorizontalSwipe && Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          // Swiped left
          onSwipeLeft?.();
        } else {
          // Swiped right
          onSwipeRight?.();
        }
      } else if (isVerticalSwipe && Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          // Swiped up
          onSwipeUp?.();
        } else {
          // Swiped down
          onSwipeDown?.();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    document.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, preventScroll]);
};

// Hook for keyboard shortcuts
export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isCtrl = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      const isAlt = event.altKey;

      // Build shortcut key
      let shortcutKey = '';
      if (isCtrl) shortcutKey += 'ctrl+';
      if (isShift) shortcutKey += 'shift+';
      if (isAlt) shortcutKey += 'alt+';
      shortcutKey += key;

      if (shortcuts[shortcutKey]) {
        event.preventDefault();
        shortcuts[shortcutKey]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
