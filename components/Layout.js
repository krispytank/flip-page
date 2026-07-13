import Link from 'next/link';
import { useState } from 'react';

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="layout">
      {/* Top Info Bar */}
      <div className="top-bar">
        <div className="container top-bar-inner">
          <div className="top-bar-left">
            <span className="top-bar-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              +254 700 000 000
            </span>
            <span className="top-bar-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Mon - Fri: 8:00 AM - 5:00 PM
            </span>
          </div>
          <div className="top-bar-right">
            <Link href="/login" className="top-bar-link">Admin Panel</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="main-header">
        <div className="container header-inner">
          <Link href="/" className="logo">
            <div className="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
            <div className="logo-text">
              <span className="logo-title">FlipPage</span>
              <span className="logo-subtitle">Document Library</span>
            </div>
          </Link>

          <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
            <Link href="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link href="/#catalogue" className="nav-link" onClick={() => setMenuOpen(false)}>Catalogue</Link>
            <Link href="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Upload</Link>
          </nav>

          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
                <span>FlipPage</span>
              </div>
              <p className="footer-desc">
                Interactive document library with beautiful page-flipping experience.
              </p>
              <div className="footer-contact">
                <p><strong>Opening Hours:</strong></p>
                <p>Mon - Fri: 8:00 AM - 5:00 PM</p>
              </div>
            </div>

            <div className="footer-links">
              <h4>Quick Links</h4>
              <ul>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/#catalogue">Document Catalogue</Link></li>
                <li><Link href="/login">Upload Documents</Link></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Categories</h4>
              <ul>
                <li><Link href="/#catalogue">PDFs</Link></li>
                <li><Link href="/#catalogue">Images</Link></li>
                <li><Link href="/#catalogue">Presentations</Link></li>
                <li><Link href="/#catalogue">Manuals</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>FlipPage Document Library &copy; {new Date().getFullYear()}. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .top-bar {
          background: var(--navy-900);
          color: rgba(255,255,255,0.7);
          font-size: 0.8rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .top-bar-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .top-bar-left {
          display: flex;
          gap: 1.5rem;
        }

        .top-bar-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .top-bar-link {
          color: var(--gold-400);
          transition: color var(--transition-fast);
        }

        .top-bar-link:hover {
          color: var(--gold-300);
        }

        .main-header {
          background: var(--navy-700);
          padding: 0;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: var(--shadow-md);
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1rem;
          padding-bottom: 1rem;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }

        .logo-icon {
          color: var(--gold-500);
          display: flex;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
        }

        .logo-title {
          font-family: 'Merriweather', serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--white);
          line-height: 1.1;
        }

        .logo-subtitle {
          font-size: 0.7rem;
          color: var(--gold-400);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 500;
        }

        .main-nav {
          display: flex;
          gap: 0.25rem;
        }

        .nav-link {
          padding: 0.6rem 1.25rem;
          color: rgba(255,255,255,0.95);
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          letter-spacing: 0.01em;
        }

        .nav-link:hover {
          background: rgba(255,255,255,0.15);
          color: var(--white);
        }

        .menu-toggle {
          display: none;
          background: none;
          border: none;
          color: var(--white);
          cursor: pointer;
          padding: 0.5rem;
        }

        .main-content {
          flex: 1;
        }

        .main-footer {
          background: var(--navy-800);
          color: rgba(255,255,255,0.7);
          padding: 3.5rem 0 0;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 3rem;
          padding-bottom: 2.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: var(--white);
          font-family: 'Merriweather', serif;
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .footer-logo svg {
          color: var(--gold-500);
        }

        .footer-desc {
          font-size: 0.9rem;
          line-height: 1.7;
          margin-bottom: 1.25rem;
          max-width: 320px;
        }

        .footer-contact {
          font-size: 0.85rem;
          line-height: 1.6;
        }

        .footer-contact strong {
          color: var(--white);
        }

        .footer-links h4 {
          font-family: 'Source Sans 3', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .footer-links ul {
          list-style: none;
          padding: 0;
        }

        .footer-links li {
          margin-bottom: 0.5rem;
        }

        .footer-links a {
          font-size: 0.875rem;
          transition: color var(--transition-fast);
        }

        .footer-links a:hover {
          color: var(--gold-400);
        }

        .footer-bottom {
          padding: 1.25rem 0;
          text-align: center;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
        }

        @media (max-width: 768px) {
          .top-bar-left {
            flex-direction: column;
            gap: 0.25rem;
          }

          .top-bar-inner {
            flex-direction: column;
            gap: 0.5rem;
          }

          .menu-toggle {
            display: block;
          }

          .main-nav {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--navy-700);
            flex-direction: column;
            padding: 1rem;
            border-top: 1px solid rgba(255,255,255,0.1);
            box-shadow: var(--shadow-lg);
          }

          .main-nav.open {
            display: flex;
          }

          .nav-link {
            padding: 0.75rem 1rem;
          }

          .footer-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
