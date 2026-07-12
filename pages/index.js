import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

function getDeviceId() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/device_id=([^;]+)/);
  if (match) return match[1];
  const id = crypto.randomUUID();
  document.cookie = `device_id=${id};path=/;max-age=31536000`;
  return id;
}

export default function Home() {
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total_documents: 0, total_size: 0, total_views: 0 });
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  const [recentDocs, setRecentDocs] = useState([]);
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);
    fetchDocuments();
    fetchStats();
    if (id) fetchHistory(id);
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data.documents || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setDocumentsLoaded(true);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/documents?stats=true');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchHistory = async (id) => {
    try {
      const res = await fetch(`/api/history?device_id=${id}`);
      const data = await res.json();
      setRecentDocs(data.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (dateStr) => {
    const now = new Date();
    const then = new Date(dateStr);
    const seconds = Math.floor((now - then) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return then.toLocaleDateString();
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.includes('pdf')) return 'pdf';
    if (mimetype.includes('image')) return 'image';
    if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return 'presentation';
    return 'document';
  };

  return (
    <>
      <Head>
        <title>FlipPage - Interactive Document Library</title>
        <meta name="description" content="Beautiful interactive document library with page flipping effects" />
      </Head>

      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <div className="hero-text animate-fadeIn">
            <h1>Interactive Document Library</h1>
            <div className="hero-divider"></div>
            <p>
              Discover and explore documents with our beautiful page-flipping experience.
              Upload, share, and view documents like never before.
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-num">{stats.total_documents || 0}</span>
                <span className="hero-stat-label">Documents</span>
              </div>
              <div className="hero-stat-sep"></div>
              <div className="hero-stat">
                <span className="hero-stat-num">{formatFileSize(stats.total_size || 0)}</span>
                <span className="hero-stat-label">Total Size</span>
              </div>
              <div className="hero-stat-sep"></div>
              <div className="hero-stat">
                <span className="hero-stat-num">{stats.total_views || 0}</span>
                <span className="hero-stat-label">Views</span>
              </div>
            </div>
            <div className="hero-actions">
              <a href="#catalogue" className="btn btn-primary">Browse Library</a>
              <Link href="/admin" className="btn btn-hero">Upload Documents</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="breadcrumb-bar">
        <div className="container">
          <nav className="breadcrumb">
            <Link href="/">Home</Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Document Catalogue</span>
          </nav>
        </div>
      </div>

      {/* Recently Viewed */}
      {recentDocs.length > 0 && (
        <section className="recent-section">
          <div className="container">
            <h3 className="section-heading">Continue Reading</h3>
            <div className="recent-list">
              {recentDocs.map((doc) => (
                <Link key={doc.id} href={`/viewer?doc=${doc.id}`} className="recent-item">
                  <div className={`recent-icon ${getFileIcon(doc.mimetype)}`}>
                    {doc.mimetype?.includes('pdf') ? 'PDF' :
                     doc.mimetype?.startsWith('image/') ? 'IMG' : 'DOC'}
                  </div>
                  <div className="recent-info">
                    <span className="recent-title">{doc.title}</span>
                    <span className="recent-time">{formatTimeAgo(doc.last_viewed)}</span>
                  </div>
                  <svg className="recent-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Catalogue Section */}
      <section id="catalogue" className="catalogue-section">
        <div className="container">
          <h2 className="section-heading">Document Catalogue</h2>
          <p className="section-subtext">Browse through our collection of documents</p>

          {/* Search */}
          <div className="search-row">
            <div className="search-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="category-row">
            <button
              className={`cat-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                className={`cat-btn ${selectedCategory === category.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.name)}
              >
                <span>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* Documents */}
          {!documentsLoaded ? (
            <div className="doc-grid">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="doc-card skeleton">
                  <div className="skel-header">
                    <div className="skel-icon"></div>
                    <div className="skel-badge"></div>
                  </div>
                  <div className="skel-body">
                    <div className="skel-title"></div>
                    <div className="skel-text"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="empty-box">
              <p className="empty-text">No documents found.</p>
              <Link href="/admin" className="btn btn-primary">Upload Documents</Link>
            </div>
          ) : (
            <div className="doc-grid">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="doc-card">
                  <div className="doc-card-head">
                    <div className={`doc-type-icon ${getFileIcon(doc.mimetype)}`}>
                      {doc.mimetype?.includes('pdf') ? 'PDF' :
                       doc.mimetype?.startsWith('image/') ? 'IMG' : 'DOC'}
                    </div>
                    <span className="doc-category" style={{ color: doc.category_color, borderColor: doc.category_color + '40' }}>
                      {doc.category_name}
                    </span>
                  </div>
                  <h3 className="doc-card-title">{doc.title}</h3>
                  {doc.description && (
                    <p className="doc-card-desc">{doc.description}</p>
                  )}
                  <div className="doc-card-meta">
                    <span>{formatFileSize(doc.size)}</span>
                    <span className="meta-dot"></span>
                    <span>{doc.view_count} views</span>
                  </div>
                  <div className="doc-card-foot">
                    <Link href={`/viewer?doc=${doc.id}`} className="btn btn-primary btn-sm">
                      View Document
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .hero-banner {
          position: relative;
          background: var(--navy-700);
          padding: 5rem 0;
          overflow: hidden;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(13,27,42,0.95), rgba(26,35,50,0.9));
          background-image:
            radial-gradient(circle at 20% 50%, rgba(200,169,81,0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(200,169,81,0.05) 0%, transparent 40%);
        }

        .hero-content {
          position: relative;
          z-index: 1;
        }

        .hero-text {
          max-width: 650px;
        }

        .hero-text h1 {
          font-size: 2.75rem;
          font-weight: 900;
          color: var(--white);
          margin-bottom: 1rem;
          line-height: 1.15;
        }

        .hero-divider {
          width: 60px;
          height: 3px;
          background: var(--gold-500);
          margin-bottom: 1.25rem;
        }

        .hero-text p {
          font-size: 1.1rem;
          color: rgba(255,255,255,0.75);
          line-height: 1.8;
          margin-bottom: 2rem;
        }

        .hero-stats {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 2.5rem;
        }

        .hero-stat {
          display: flex;
          flex-direction: column;
        }

        .hero-stat-num {
          font-family: 'Merriweather', serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--gold-500);
        }

        .hero-stat-label {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .hero-stat-sep {
          width: 1px;
          height: 40px;
          background: rgba(255,255,255,0.15);
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-hero {
          background: transparent;
          color: var(--white);
          border: 1px solid rgba(255,255,255,0.3);
        }

        .btn-hero:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.5);
        }

        .breadcrumb-bar {
          background: var(--cream-100);
          border-bottom: 1px solid var(--border);
          padding: 0.75rem 0;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .breadcrumb a {
          color: var(--navy-500);
          transition: color var(--transition-fast);
        }

        .breadcrumb a:hover {
          color: var(--gold-500);
        }

        .breadcrumb-sep {
          color: var(--text-light);
        }

        .breadcrumb-current {
          color: var(--text-secondary);
        }

        .recent-section {
          padding: 2rem 0;
          background: var(--white);
          border-bottom: 1px solid var(--border);
        }

        .section-heading {
          font-size: 1.5rem;
          color: var(--navy-700);
          margin-bottom: 0.25rem;
        }

        .section-subtext {
          color: var(--text-muted);
          margin-bottom: 1.5rem;
        }

        .recent-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .recent-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 1rem;
          background: var(--cream-50);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .recent-item:hover {
          border-color: var(--gold-500);
          background: var(--white);
        }

        .recent-icon {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 700;
          flex-shrink: 0;
          letter-spacing: 0.03em;
        }

        .recent-icon.pdf {
          background: #fde8e8;
          color: #b91c1c;
        }

        .recent-icon.image {
          background: #d1fae5;
          color: #047857;
        }

        .recent-icon.presentation {
          background: #fef3c7;
          color: #92400e;
        }

        .recent-icon.document {
          background: #e0e7ff;
          color: #3730a3;
        }

        .recent-info {
          flex: 1;
          min-width: 0;
        }

        .recent-title {
          display: block;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 0.9rem;
        }

        .recent-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .recent-arrow {
          color: var(--text-light);
          flex-shrink: 0;
        }

        .catalogue-section {
          padding: 2.5rem 0 4rem;
          background: var(--cream-50);
        }

        .search-row {
          margin-bottom: 1.25rem;
        }

        .search-box {
          position: relative;
          max-width: 480px;
        }

        .search-box svg {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-box input {
          width: 100%;
          padding: 0.7rem 1rem 0.7rem 2.75rem;
          font-size: 0.9rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--white);
          font-family: inherit;
          transition: border-color var(--transition-fast);
        }

        .search-box input:focus {
          outline: none;
          border-color: var(--navy-400);
        }

        .category-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }

        .cat-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 1rem;
          font-size: 0.85rem;
          font-weight: 500;
          font-family: inherit;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--white);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .cat-btn:hover {
          border-color: var(--navy-400);
          color: var(--navy-700);
        }

        .cat-btn.active {
          background: var(--navy-700);
          border-color: var(--navy-700);
          color: var(--white);
        }

        .doc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.25rem;
        }

        .doc-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          transition: all var(--transition-normal);
        }

        .doc-card:hover {
          border-color: var(--gold-500);
          box-shadow: var(--shadow-md);
        }

        .doc-card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .doc-type-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.03em;
        }

        .doc-type-icon.pdf {
          background: #fde8e8;
          color: #b91c1c;
        }

        .doc-type-icon.image {
          background: #d1fae5;
          color: #047857;
        }

        .doc-type-icon.presentation {
          background: #fef3c7;
          color: #92400e;
        }

        .doc-type-icon.document {
          background: #e0e7ff;
          color: #3730a3;
        }

        .doc-category {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.2rem 0.6rem;
          border: 1px solid;
          border-radius: var(--radius-sm);
        }

        .doc-card-title {
          font-size: 1.05rem;
          color: var(--navy-700);
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .doc-card-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.5;
        }

        .doc-card-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }

        .meta-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--text-light);
        }

        .doc-card-foot {
          border-top: 1px solid var(--border);
          padding-top: 1rem;
        }

        .btn-sm {
          padding: 0.5rem 1.25rem;
          font-size: 0.85rem;
        }

        .empty-box {
          text-align: center;
          padding: 3rem;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }

        .empty-text {
          color: var(--text-muted);
          margin-bottom: 1rem;
        }

        .skeleton {
          pointer-events: none;
        }

        .skel-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .skel-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background: var(--cream-200);
          animation: shimmer 1.5s infinite;
        }

        .skel-badge {
          width: 70px;
          height: 22px;
          border-radius: var(--radius-sm);
          background: var(--cream-200);
          animation: shimmer 1.5s infinite;
        }

        .skel-title {
          width: 70%;
          height: 18px;
          border-radius: 4px;
          background: var(--cream-200);
          margin-bottom: 0.75rem;
          animation: shimmer 1.5s infinite;
        }

        .skel-text {
          width: 90%;
          height: 14px;
          border-radius: 4px;
          background: var(--cream-200);
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }

        @media (max-width: 768px) {
          .hero-banner {
            padding: 3rem 0;
          }

          .hero-text h1 {
            font-size: 1.8rem;
          }

          .hero-stats {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .hero-stat-sep {
            display: none;
          }

          .hero-actions {
            flex-direction: column;
          }

          .doc-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
