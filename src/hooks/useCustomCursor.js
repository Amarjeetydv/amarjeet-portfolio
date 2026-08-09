import { useEffect } from 'react';

export const useCustomCursor = () => {
  useEffect(() => {
    // Check if touch device
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    // Check if prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Create cursor elements
    const dot = document.createElement('div');
    const ring = document.createElement('div');

    dot.className = 'custom-cursor-dot';
    ring.className = 'custom-cursor-ring';

    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    };

    // Smooth trailing follow using requestAnimationFrame
    let active = true;
    const updateRing = () => {
      if (!active) return;
      
      // Delay coefficient (0.15 for smooth lag)
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;

      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      requestAnimationFrame(updateRing);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    requestAnimationFrame(updateRing);

    // Expand cursor over interactive elements
    const handleMouseOver = (e) => {
      const target = e.target.closest('a, button, [role="button"], input, textarea, select, .work-card, .skill-tab, .cert-card, .timeline-content');
      if (target) {
        ring.classList.add('cursor-hover');
        dot.classList.add('cursor-hover');
      } else {
        ring.classList.remove('cursor-hover');
        dot.classList.remove('cursor-hover');
      }
    };

    window.addEventListener('mouseover', handleMouseOver, { passive: true });

    // CSS styling injector (inlined for zero dependencies and simple lifecycle)
    const style = document.createElement('style');
    style.id = 'custom-cursor-styles';
    style.innerHTML = `
      .custom-cursor-dot {
        position: fixed;
        top: -4px;
        left: -4px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--primary-color);
        z-index: 10000;
        pointer-events: none;
        transition: width 0.2s, height 0.2s, top 0.2s, left 0.2s;
      }
      .custom-cursor-ring {
        position: fixed;
        top: -18px;
        left: -18px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 2px solid var(--accent-color);
        box-shadow: 0 0 10px rgba(6, 182, 212, 0.2);
        z-index: 9999;
        pointer-events: none;
        will-change: transform;
      }
      .custom-cursor-dot.cursor-hover {
        top: -6px;
        left: -6px;
        width: 12px;
        height: 12px;
        background-color: var(--accent-color);
      }
      .custom-cursor-ring.cursor-hover {
        top: -24px;
        left: -24px;
        width: 48px;
        height: 48px;
        border-color: var(--primary-color);
        background-color: rgba(59, 130, 246, 0.05);
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
      }
    `;
    document.head.appendChild(style);

    return () => {
      active = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      dot.remove();
      ring.remove();
      style.remove();
    };
  }, []);
};
