import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'

const FLIP_DURATION = 400

const FlipBook = forwardRef(function FlipBook({ pages = [], initialPage = 0, onPageChange, pageWidth = 800, pageHeight = 600 }, ref) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [isFlipping, setIsFlipping] = useState(false)
  const containerRef = useRef(null)
  const audioContextRef = useRef(null)
  const currentPageRef = useRef(currentPage)

  useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])

  useEffect(() => {
    setCurrentPage(initialPage)
  }, [initialPage])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
  }, [])

  const playFlipSound = useCallback(() => {
    if (!audioContextRef.current) return

    try {
      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const now = ctx.currentTime

      const bufferSize = ctx.sampleRate * 0.15
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.3
      }

      const noise = ctx.createBufferSource()
      noise.buffer = noiseBuffer

      const bandpass = ctx.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.frequency.setValueAtTime(3000, now)
      bandpass.frequency.exponentialRampToValueAtTime(800, now + 0.12)
      bandpass.Q.value = 0.7

      const highpass = ctx.createBiquadFilter()
      highpass.type = 'highpass'
      highpass.frequency.value = 500

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.5, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

      noise.connect(bandpass)
      bandpass.connect(highpass)
      highpass.connect(gain)
      gain.connect(ctx.destination)

      noise.start(now)
      noise.stop(now + 0.15)
    } catch (error) {
      console.warn('Could not play flip sound:', error)
    }
  }, [])

  const goToNextPage = useCallback(() => {
    if (currentPageRef.current < pages.length - 1 && !isFlipping) {
      setIsFlipping(true)
      playFlipSound()

      setTimeout(() => {
        setCurrentPage(prev => {
          const next = prev + 1
          onPageChange?.(next)
          return next
        })
        setTimeout(() => setIsFlipping(false), 50)
      }, FLIP_DURATION)
    }
  }, [isFlipping, pages.length, onPageChange, playFlipSound])

  const goToPreviousPage = useCallback(() => {
    if (currentPageRef.current > 0 && !isFlipping) {
      setIsFlipping(true)
      playFlipSound()

      setTimeout(() => {
        setCurrentPage(prev => {
          const next = prev - 1
          onPageChange?.(next)
          return next
        })
        setTimeout(() => setIsFlipping(false), 50)
      }, FLIP_DURATION)
    }
  }, [isFlipping, onPageChange, playFlipSound])

  const handlePageClick = useCallback((e) => {
    if (isFlipping) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const halfWidth = rect.width / 2

    if (clickX < halfWidth) {
      goToPreviousPage()
    } else {
      goToNextPage()
    }
  }, [isFlipping, goToPreviousPage, goToNextPage])

  useImperativeHandle(ref, () => ({
    goToNextPage,
    goToPreviousPage,
    getCurrentPage: () => currentPageRef.current,
  }), [goToNextPage, goToPreviousPage])

  const getPageStyle = (index) => {
    const diff = index - currentPage

    if (diff === 0) {
      return {
        transform: 'rotateY(0deg)',
        zIndex: 10,
        transition: `transform ${FLIP_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
      }
    } else if (diff < 0) {
      return {
        transform: 'rotateY(-180deg)',
        zIndex: 5 + diff,
        transition: `transform ${FLIP_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
      }
    } else {
      return {
        transform: 'rotateY(0deg)',
        zIndex: Math.max(1, 10 - diff),
        transition: `transform ${FLIP_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
      }
    }
  }

  const renderPageContent = (page, index) => {
    if (page.type === 'image') {
      return (
        <div className="page-image">
          <img src={page.src} alt={`Page ${index + 1}`} draggable={false} />
        </div>
      )
    } else if (page.type === 'pdf') {
      return (
        <div className="page-pdf">
          <canvas data-page={index}></canvas>
        </div>
      )
    } else {
      return (
        <div className="page-placeholder">
          <div className="page-number">{index + 1}</div>
          <div className="page-text">{page.content}</div>
        </div>
      )
    }
  }

  return (
    <div className="flipbook-container" ref={containerRef}>
      <div className="flipbook">
        {pages.map((page, index) => (
          <div
            key={index}
            className={`page ${index === currentPage ? 'current' : ''} ${index < currentPage ? 'previous' : ''} ${index > currentPage ? 'next' : ''}`}
            style={getPageStyle(index)}
            data-page-index={index}
          >
            <div className="page-content">
              <div
                className="page-front click-zone"
                data-direction="previous"
                onClick={handlePageClick}
              >
                {renderPageContent(page, index)}
              </div>
              <div
                className="page-back click-zone"
                data-direction="next"
                onClick={handlePageClick}
              >
                {pages[index + 1] && renderPageContent(pages[index + 1], index + 1)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .flipbook-container {
          perspective: 2000px;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          user-select: none;
        }

        .flipbook {
          position: relative;
          width: ${pageWidth}px;
          height: ${pageHeight}px;
          transform-style: preserve-3d;
        }

        .page {
          position: absolute;
          width: 100%;
          height: 100%;
          transform-origin: left center;
          transform-style: preserve-3d;
          cursor: pointer;
          backface-visibility: hidden;
        }

        .page-front, .page-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          background: white;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          border-radius: 0 10px 10px 0;
          overflow: hidden;
        }

        .page-back {
          transform: rotateY(180deg);
        }

        .click-zone {
          cursor: pointer;
        }

        .click-zone:hover {
          opacity: 0.98;
        }

        .page-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .page-image img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }

        .page-pdf {
          width: 100%;
          height: 100%;
        }

        .page-pdf canvas {
          width: 100%;
          height: 100%;
        }

        .page-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .page-number {
          font-size: 2rem;
          font-weight: bold;
          color: #333;
          margin-bottom: 1rem;
        }

        .page-text {
          font-size: 1.1rem;
          color: #666;
          text-align: center;
          padding: 0 2rem;
        }

        .page.current {
          z-index: 10;
        }

        .page.previous {
          transform: rotateY(-180deg);
          z-index: 5;
        }

        .page.next {
          z-index: 4;
        }
      `}</style>
    </div>
  )
})

export default FlipBook