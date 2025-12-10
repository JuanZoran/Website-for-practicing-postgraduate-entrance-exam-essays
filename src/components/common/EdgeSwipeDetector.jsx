/**
 * 边缘滑动检测组件
 * 用于检测从屏幕边缘开始的滑动手势
 */
import { useEffect, useRef } from 'react';

const EdgeSwipeDetector = ({ onSwipeRight, enabled = true }) => {
  const touchStartX = useRef(null);
  const edgeThreshold = 20;

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e) => {
      const touchX = e.touches[0].clientX;
      const screenWidth = window.innerWidth;
      if (screenWidth - touchX <= edgeThreshold) {
        touchStartX.current = touchX;
      }
    };

    const handleTouchMove = (e) => {
      if (touchStartX.current === null) return;
      const touchX = e.touches[0].clientX;
      const deltaX = touchX - touchStartX.current;
      
      if (deltaX < -50) {
        onSwipeRight();
        touchStartX.current = null;
      }
    };

    const handleTouchEnd = () => {
      touchStartX.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onSwipeRight]);

  return null;
};

export default EdgeSwipeDetector;
