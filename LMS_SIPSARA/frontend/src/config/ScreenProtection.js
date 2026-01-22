// ScreenProtection.js
import { useEffect } from 'react';

const ScreenProtection = () => {
  useEffect(() => {
    // 1. Disable Right-Click
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e) => {
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u'))
      ) {
        e.preventDefault();
        alert("Screen capture is disabled.");
      }
    };

    // 3. (Optional) Watermark / Blur on Focus Loss
    // This blurs the page if the user clicks away (e.g., to open OBS)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.body.style.filter = 'blur(10px)';
      } else {
        document.body.style.filter = 'none';
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // CSS to block printing
    const style = document.createElement('style');
    style.innerHTML = `@media print { body { display: none; } }`;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.head.removeChild(style);
    };
  }, []);

  return null; // This component renders nothing visually
};

export default ScreenProtection;