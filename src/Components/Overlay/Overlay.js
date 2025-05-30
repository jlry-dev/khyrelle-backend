import { useEffect, useRef } from 'react';
import './Overlay.css';
import { useAppStore } from '../../stores/useStore';

export default function Overlay() {

  const { 
    activeOverlay, 
    isOverlayOpen, 
    overlays, 
    closeOverlay 
  } = useAppStore();
  
  const overlayRef = useRef();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeOverlay();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeOverlay]);

  if (!isOverlayOpen) return null;

  const current = overlays[activeOverlay];

  return (
    <div 
      className="overlay"
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && closeOverlay()}
    >
      <div className="overlay-content">
        <button 
          className="close-btn" 
          onClick={closeOverlay}
          aria-label="Close overlay"
        >
          ×
        </button>
        
        <div className="overlay-header">
          <span className="overlay-icon">{current.icon}</span>
          <h2>{current.title}</h2>
        </div>
        
        <div className="overlay-items">
          {current.content.map((item, index) => (
            <div key={index} className="overlay-item">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}