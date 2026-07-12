export default function NavigationControls({ currentPage, totalPages, onPrev, onNext }) {
  return (
    <div className="navigation-controls">
      <button 
        className="nav-button prev" 
        onClick={onPrev}
        disabled={currentPage === 0}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      
      <div className="page-indicator">
        <span className="current-page">{currentPage + 1}</span>
        <span className="separator">/</span>
        <span className="total-pages">{totalPages}</span>
      </div>
      
      <button 
        className="nav-button next" 
        onClick={onNext}
        disabled={currentPage === totalPages - 1}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      <style jsx>{`
        .navigation-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .nav-button {
          width: 30px;
          height: 30px;
          border-radius: 4px;
          border: 1px solid rgba(200, 169, 81, 0.3);
          background: rgba(13, 27, 42, 0.5);
          color: rgba(255,255,255,0.8);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        .nav-button:hover:not(:disabled) {
          background: rgba(200, 169, 81, 0.2);
          border-color: #c8a951;
          color: #c8a951;
        }

        .nav-button:active:not(:disabled) {
          transform: scale(0.95);
        }

        .nav-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .page-indicator {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8rem;
          font-weight: 500;
          color: rgba(255,255,255,0.7);
          min-width: 50px;
          justify-content: center;
        }

        .current-page {
          color: #c8a951;
          font-weight: 700;
        }

        .separator {
          color: rgba(255,255,255,0.3);
        }

        .total-pages {
          color: rgba(255,255,255,0.5);
        }
      `}</style>
    </div>
  )
}