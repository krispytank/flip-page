import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import FlipBook from '../components/FlipBook';
import NavigationControls from '../components/NavigationControls';
import ZoomControls from '../components/ZoomControls';

function getDeviceId() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/device_id=([^;]+)/);
  if (match) return match[1];
  const id = crypto.randomUUID();
  document.cookie = `device_id=${id};path=/;max-age=31536000`;
  return id;
}

export default function Viewer() {
  const [pages, setPages] = useState([]);
  const [documentTitle, setDocumentTitle] = useState('Document Viewer');
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [targetZoom, setTargetZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 800, height: 600 });
  const [contentReady, setContentReady] = useState(false);
  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const touchStartRef = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('doc');
    
    if (docId) {
      loadDocumentMeta(docId);
    } else {
      window.location.href = '/';
    }
  }, []);

  const loadDocumentMeta = async (docId) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/documents?id=${docId}`);
      
      if (!res.ok) {
        throw new Error('Document not found');
      }
      
      const doc = await res.json();
      setDocumentInfo(doc);
      setDocumentTitle(doc.title);
      setLoading(false);

      const deviceId = getDeviceId();
      if (deviceId) {
        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_id: deviceId, document_id: docId })
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Error loading document:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const loadDocumentContent = async () => {
    if (!documentInfo) return;
    try {
      setContentLoading(true);
      setError(null);
      
      const fileUrl = `/documents/${documentInfo.filename}`;
      
      if (documentInfo.mimetype.includes('pdf')) {
        await loadPDF(fileUrl);
      } else if (documentInfo.mimetype.startsWith('image/')) {
        loadImages([fileUrl]);
      } else if (documentInfo.mimetype.includes('presentation') || documentInfo.mimetype.includes('powerpoint')) {
        setPages([{
          type: 'placeholder',
          content: `Presentation: ${documentInfo.title}\n\nThis is a PowerPoint presentation. Download it to view the full content.`,
          pageNumber: 1
        }]);
      } else {
        setPages([{
          type: 'placeholder',
          content: `Document: ${documentInfo.title}\n\nFile type: ${documentInfo.mimetype}`,
          pageNumber: 1
        }]);
      }
      setContentReady(true);
    } catch (err) {
      console.error('Error loading content:', err);
      setError(err.message);
    } finally {
      setContentLoading(false);
    }
  };

  const loadPDF = async (url) => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.js';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch PDF file');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        throw new Error('PDF file is empty');
      }
      
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      const renderPage = async (pageNum) => {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.7 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        canvas.width = 0;
        canvas.height = 0;
        return {
          type: 'image',
          src: dataUrl,
          pageNumber: pageNum,
          width: viewport.width,
          height: viewport.height
        };
      };

      const batchSize = 5;
      const initialBatch = Math.min(batchSize, totalPages);
      const pdfPages = [];

      for (let i = 1; i <= initialBatch; i++) {
        pdfPages.push(await renderPage(i));
      }
      setPages([...pdfPages]);

      const loadRemaining = async () => {
        for (let i = initialBatch + 1; i <= totalPages; i++) {
          const pageData = await renderPage(i);
          setPages(prev => {
            const updated = [...prev];
            updated[i - 1] = pageData;
            return updated;
          });
        }
      };
      setTimeout(loadRemaining, 100);
    } catch (error) {
      console.error('Error loading PDF:', error);
      throw error;
    }
  };

  const loadImages = (urls) => {
    const imagePages = urls.map((url, index) => ({
      type: 'image',
      src: url,
      pageNumber: index + 1
    }));
    setPages(imagePages);
  };

  const loadSampleDocument = () => {
    setPages([
      {
        type: 'placeholder',
        content: 'Welcome to FlipPage Viewer! This is a sample document.',
        pageNumber: 1
      },
      {
        type: 'placeholder',
        content: 'Click on pages or use arrow keys to navigate.',
        pageNumber: 2
      },
      {
        type: 'placeholder',
        content: 'Use the zoom controls to adjust the view.',
        pageNumber: 3
      },
      {
        type: 'placeholder',
        content: 'Press F for fullscreen mode.',
        pageNumber: 4
      },
      {
        type: 'placeholder',
        content: 'Enjoy the realistic page-flipping experience!',
        pageNumber: 5
      }
    ]);
    setDocumentTitle('Sample FlipBook');
    setLoading(false);
    setContentReady(true);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const zoomIn = () => {
    setTargetZoom(prev => Math.min(3, prev + 0.1));
  };

  const zoomOut = () => {
    setTargetZoom(prev => Math.max(0.25, prev - 0.1));
  };

  const zoomReset = () => {
    if (containerRef.current && pageDimensions.width && pageDimensions.height) {
      const fitZoom = calculateFitZoom();
      setTargetZoom(fitZoom);
    } else {
      setTargetZoom(1);
    }
  };

  const calculateFitZoom = () => {
    if (!containerRef.current) return 1;
    const container = containerRef.current;
    const padding = 64;
    const availableWidth = container.clientWidth - padding;
    const availableHeight = container.clientHeight - padding;
    const scaleX = availableWidth / pageDimensions.width;
    const scaleY = availableHeight / pageDimensions.height;
    return Math.min(scaleX, scaleY, 1);
  };

  useEffect(() => {
    const diff = targetZoom - zoomLevel;
    if (Math.abs(diff) < 0.005) {
      setZoomLevel(targetZoom);
      return;
    }
    const raf = requestAnimationFrame(() => {
      setZoomLevel(prev => prev + diff * 0.15);
    });
    return () => cancelAnimationFrame(raf);
  }, [zoomLevel, targetZoom]);

  const handleKeydown = (e) => {
    switch (e.key) {
      case 'ArrowLeft':
        setCurrentPage(prev => Math.max(0, prev - 1));
        break;
      case 'ArrowRight':
        setCurrentPage(prev => Math.min(pages.length - 1, prev + 1));
        break;
      case '+':
      case '=':
        zoomIn();
        break;
      case '-':
        zoomOut();
        break;
      case '0':
        zoomReset();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [pages.length]);

  useEffect(() => {
    if (pages.length === 0) return;

    const firstPage = pages[0];
    if (firstPage.width && firstPage.height) {
      setPageDimensions({ width: firstPage.width, height: firstPage.height });
      return;
    }

    if (firstPage.type === 'image' && firstPage.src) {
      const img = new Image();
      img.onload = () => {
        setPageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = firstPage.src;
    }
  }, [pages]);

  useEffect(() => {
    if (pageDimensions.width && pageDimensions.height && containerRef.current) {
      const fitZoom = calculateFitZoom();
      setTargetZoom(fitZoom);
    }
  }, [pageDimensions]);

  useEffect(() => {
    const handleResize = () => {
      if (pageDimensions.width && pageDimensions.height) {
        const fitZoom = calculateFitZoom();
        setTargetZoom(fitZoom);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pageDimensions]);

  const handleTouchStart = (e) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const minSwipe = 50;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
      if (dx < 0) {
        setCurrentPage(prev => Math.min(pages.length - 1, prev + 1));
      } else {
        setCurrentPage(prev => Math.max(0, prev - 1));
      }
    }
    touchStartRef.current = null;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Document</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => { setError(null); loadSampleDocument(); }} className="btn btn-primary">
              Load Sample Document
            </button>
            <a href="/" className="btn btn-secondary">
              Back to Library
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{documentTitle} - FlipPage Viewer</title>
        <meta name="description" content={`View ${documentTitle} with FlipPage`} />
      </Head>

      <div className="viewer-layout" ref={viewerRef}>
        {/* Header */}
        <header className="viewer-header">
          <div className="header-left">
            <a href="/" className="back-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Library
            </a>
            <h1 className="document-title">{documentTitle}</h1>
          </div>
          
          <div className="header-right">
            {documentInfo && (
              <div className="document-meta">
                <span className="meta-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  {documentInfo.view_count} views
                </span>
              </div>
            )}
            
            <button onClick={toggleFullscreen} className="btn btn-ghost" title="Fullscreen">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>
          </div>
        </header>

        {/* Main Viewer */}
        <main 
          className="viewer-main" 
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {!contentReady ? (
            <div className="document-preview">
              <div className="preview-card">
                <div className="preview-icon">
                  {documentInfo?.mimetype?.includes('pdf') ? '📕' :
                   documentInfo?.mimetype?.startsWith('image/') ? '🖼️' : '📄'}
                </div>
                <h2 className="preview-title">{documentTitle}</h2>
                {documentInfo && (
                  <div className="preview-meta">
                    <span>{documentInfo.mimetype?.split('/').pop()?.toUpperCase()}</span>
                    <span>•</span>
                    <span>{formatFileSize(documentInfo.size)}</span>
                    <span>•</span>
                    <span>{documentInfo.view_count} views</span>
                  </div>
                )}
                {documentInfo?.description && (
                  <p className="preview-description">{documentInfo.description}</p>
                )}
                <button 
                  className="btn btn-primary btn-load" 
                  onClick={loadDocumentContent}
                  disabled={contentLoading}
                >
                  {contentLoading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      Open Document
                    </>
                  )}
                </button>
                <a href="/" className="btn btn-ghost btn-back">Back to Library</a>
              </div>
            </div>
          ) : (
            <div 
              className="flipbook-wrapper"
              style={{ 
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center'
              }}
            >
              <FlipBook
                pages={pages}
                initialPage={currentPage}
                onPageChange={handlePageChange}
                pageWidth={pageDimensions.width}
                pageHeight={pageDimensions.height}
              />
            </div>
          )}
        </main>

        {/* Footer Controls */}
        {contentReady && (
          <footer className="viewer-footer">
            <NavigationControls
              currentPage={currentPage}
              totalPages={pages.length}
              onPrev={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              onNext={() => setCurrentPage(prev => Math.min(pages.length - 1, prev + 1))}
            />
            
            <ZoomControls
              zoomLevel={zoomLevel}
              minZoom={0.25}
              maxZoom={3}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onZoomReset={zoomReset}
            />

            <div className="keyboard-hints">
              <span>← → Navigate</span>
              <span>+ - Zoom</span>
              <span>F Fullscreen</span>
            </div>
          </footer>
        )}
      </div>

      <style jsx>{`
        .viewer-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: linear-gradient(135deg, #0d1b2a 0%, #1a2332 50%, #243447 100%);
          overflow: hidden;
        }

        .loading-screen,
        .error-screen {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #0d1b2a 0%, #1a2332 50%, #243447 100%);
        }

        .loading-content,
        .error-content {
          text-align: center;
          color: white;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255, 255, 255, 0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .error-content h2 {
          margin-bottom: 0.5rem;
        }

        .error-content p {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 1.5rem;
        }

        .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 8vh;
          min-height: 44px;
          padding: 0 1.5rem;
          background: rgba(13, 27, 42, 0.6);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(200, 169, 81, 0.15);
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          min-width: 0;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 500;
          transition: color var(--transition-fast);
          flex-shrink: 0;
        }

        .back-button:hover {
          color: #c8a951;
        }

        .document-title {
          font-family: 'Merriweather', serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .document-meta {
          display: flex;
          gap: 1rem;
        }

        .meta-badge {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.3rem 0.7rem;
          background: rgba(200, 169, 81, 0.15);
          border: 1px solid rgba(200, 169, 81, 0.25);
          border-radius: 4px;
          font-size: 0.75rem;
          color: #c8a951;
        }

        .viewer-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 2rem;
          position: relative;
          width: 70%;
          margin: 0 auto;
        }

        .flipbook-wrapper {
          will-change: transform;
        }

        .document-preview {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        .preview-card {
          background: rgba(13, 27, 42, 0.8);
          border: 1px solid rgba(200, 169, 81, 0.2);
          border-radius: 12px;
          padding: 3rem 2.5rem;
          text-align: center;
          max-width: 400px;
          width: 90%;
          backdrop-filter: blur(20px);
        }

        .preview-icon {
          font-size: 3.5rem;
          margin-bottom: 1rem;
        }

        .preview-title {
          font-family: 'Merriweather', serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: white;
          margin: 0 0 0.75rem;
        }

        .preview-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
          margin-bottom: 1rem;
        }

        .preview-description {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.65);
          margin: 0 0 1.5rem;
          line-height: 1.5;
        }

        .btn-load {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.8rem 2rem;
          font-size: 0.95rem;
          font-weight: 600;
          font-family: 'Source Sans 3', sans-serif;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #c8a951;
          color: #0d1b2a;
        }

        .btn-load:hover:not(:disabled) {
          background: #d4b96a;
        }

        .btn-load:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-load:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(13,27,42,0.2);
          border-top-color: #0d1b2a;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.55rem 1.25rem;
          font-size: 0.85rem;
          font-weight: 500;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          text-decoration: none;
          background: transparent;
          color: rgba(255,255,255,0.5);
          transition: all 0.2s ease;
        }

        .btn-back:hover {
          color: rgba(255,255,255,0.8);
          background: rgba(255,255,255,0.1);
        }

        .viewer-footer {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          height: 5vh;
          min-height: 40px;
          padding: 0 1.5rem;
          background: rgba(13, 27, 42, 0.6);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(200, 169, 81, 0.15);
          flex-shrink: 0;
        }

        .keyboard-hints {
          display: flex;
          gap: 1.5rem;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.35);
        }

        .keyboard-hints span {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        @media (max-width: 768px) {
          .viewer-header {
            flex-direction: row;
            gap: 0.5rem;
            padding: 0 1rem;
          }

          .header-left {
            flex: 1;
            min-width: 0;
          }

          .back-button {
            font-size: 0;
            gap: 0;
          }

          .back-button svg {
            width: 20px;
            height: 20px;
          }

          .document-title {
            font-size: 0.9rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .document-meta {
            display: none;
          }

          .viewer-main {
            width: 100%;
            padding: 0.5rem;
          }

          .viewer-footer {
            gap: 0.75rem;
            padding: 0 0.75rem;
          }

          .keyboard-hints {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .viewer-header {
            padding: 0 0.75rem;
          }

          .document-title {
            font-size: 0.8rem;
          }

          .viewer-main {
            padding: 0.25rem;
          }

          .viewer-footer {
            padding: 0 0.5rem;
          }
        }
      `}</style>
    </>
  );
}