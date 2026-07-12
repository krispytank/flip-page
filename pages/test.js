import { useState } from 'react'
import Head from 'next/head'
import FlipBook from '../components/FlipBook'
import NavigationControls from '../components/NavigationControls'
import ZoomControls from '../components/ZoomControls'

export default function TestPage() {
  const [pages, setPages] = useState([
    {
      type: 'placeholder',
      content: 'This is page 1 of the test flipbook.',
      pageNumber: 1
    },
    {
      type: 'placeholder',
      content: 'This is page 2. Click to flip!',
      pageNumber: 2
    },
    {
      type: 'placeholder',
      content: 'Page 3 - Keep flipping!',
      pageNumber: 3
    },
    {
      type: 'placeholder',
      content: 'Page 4 - Almost there!',
      pageNumber: 4
    },
    {
      type: 'placeholder',
      content: 'Page 5 - Last page!',
      pageNumber: 5
    }
  ])
  const [currentPage, setCurrentPage] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1)

  return (
    <>
      <Head>
        <title>FlipBook Test Page</title>
        <meta name="description" content="Test page for FlipBook viewer" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            FlipBook Test Page
          </h1>

          <div className="flex flex-col items-center">
            <div 
              className="mb-4"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            >
              <FlipBook
                pages={pages}
                initialPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>

            <NavigationControls
              currentPage={currentPage}
              totalPages={pages.length}
              onPrev={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              onNext={() => setCurrentPage(prev => Math.min(pages.length - 1, prev + 1))}
            />

            <ZoomControls
              zoomLevel={zoomLevel}
              onZoomIn={() => setZoomLevel(prev => Math.min(2, prev + 0.25))}
              onZoomOut={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
              onZoomReset={() => setZoomLevel(1)}
            />

            <div className="mt-8 text-white text-center">
              <p className="mb-2">Current Page: {currentPage + 1} of {pages.length}</p>
              <p className="text-sm text-green-100">
                Try clicking on pages, using arrow keys, or the navigation buttons
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}