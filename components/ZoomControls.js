export default function ZoomControls({ zoomLevel, minZoom = 0.5, maxZoom = 2, onZoomIn, onZoomOut, onZoomReset }) {
  return (
    <div className="zoom-controls">
      <button 
        className="zoom-button" 
        onClick={onZoomOut}
        disabled={zoomLevel <= minZoom}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </button>
      
      <div className="zoom-level">
        <span className="zoom-value">{Math.round(zoomLevel * 100)}%</span>
      </div>
      
      <button 
        className="zoom-button" 
        onClick={onZoomIn}
        disabled={zoomLevel >= maxZoom}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="11" y1="8" x2="11" y2="14"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </button>
      
      <button 
        className="zoom-button reset" 
        onClick={onZoomReset}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10"></polyline>
          <polyline points="23 20 23 14 17 14"></polyline>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
        </svg>
      </button>

      <style jsx>{`
        .zoom-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          background: rgba(13, 27, 42, 0.5);
          padding: 0.35rem 0.7rem;
          border-radius: 6px;
          border: 1px solid rgba(200, 169, 81, 0.2);
        }

        .zoom-button {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        .zoom-button:hover:not(:disabled) {
          background: rgba(200, 169, 81, 0.2);
          color: #c8a951;
        }

        .zoom-button:active:not(:disabled) {
          transform: scale(0.9);
        }

        .zoom-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .zoom-button.reset {
          color: #c8a951;
        }

        .zoom-button.reset:hover {
          background: rgba(200, 169, 81, 0.25);
        }

        .zoom-level {
          min-width: 44px;
          text-align: center;
          font-weight: 600;
          color: rgba(255,255,255,0.8);
          font-size: 0.8rem;
        }

        @media (max-width: 768px) {
          .zoom-controls {
            gap: 0.25rem;
            padding: 0.3rem 0.5rem;
          }

          .zoom-button {
            width: 30px;
            height: 30px;
          }

          .zoom-level {
            min-width: 40px;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  )
}