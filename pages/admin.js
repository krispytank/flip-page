import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Admin() {
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Documents',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.replace('/login');
        } else {
          setAuthChecked(true);
          fetchDocuments();
        }
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data.documents || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const ALLOWED_MIMES = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'image/bmp', 'image/tiff', 'image/tiff-fx', 'image/x-icon', 'image/avif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv', 'application/rtf',
    'application/vnd.oasis.opendocument.presentation',
  ];

  const MIME_TO_CATEGORY = {
    'application/pdf': 'PDFs',
    'image/jpeg': 'Images', 'image/png': 'Images', 'image/gif': 'Images',
    'image/webp': 'Images', 'image/svg+xml': 'Images', 'image/bmp': 'Images',
    'image/tiff': 'Images', 'image/tiff-fx': 'Images', 'image/x-icon': 'Images',
    'image/avif': 'Images',
    'application/msword': 'Documents',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Documents',
    'application/vnd.ms-excel': 'Documents',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Documents',
    'application/vnd.ms-powerpoint': 'Presentations',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Presentations',
    'application/vnd.oasis.opendocument.presentation': 'Presentations',
    'text/plain': 'Documents', 'text/csv': 'Documents', 'application/rtf': 'Documents',
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_MIMES.includes(file.type)) {
      setMessage({
        type: 'error',
        text: `"${file.name}" (${file.type || 'unknown type'}) is not a supported file type. Please upload PDF, images, Word, Excel, PowerPoint, or text files.`
      });
      e.target.value = '';
      return;
    }

    setMessage({ type: '', text: '' });
    setSelectedFile(file);
    setFormData(prev => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      category: MIME_TO_CATEGORY[file.type] || prev.category
    }));
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file to upload' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setMessage({ type: '', text: '' });

    const formDataToSend = new FormData();
    formDataToSend.append('document', selectedFile);
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('tags', formData.tags);

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      });

      xhr.onload = function() {
        if (xhr.status === 201) {
          setMessage({ type: 'success', text: 'Document uploaded successfully!' });
          setFormData({ title: '', description: '', category: 'Documents', tags: '' });
          setSelectedFile(null);
          setPreview(null);
          setUploadProgress(0);
          fetchDocuments();
        } else {
          const error = JSON.parse(xhr.responseText);
          setMessage({ type: 'error', text: error.error || 'Upload failed' });
        }
        setUploading(false);
      };

      xhr.onerror = function() {
        setMessage({ type: 'error', text: 'Network error occurred' });
        setUploading(false);
      };

      xhr.open('POST', '/api/documents');
      xhr.send(formDataToSend);
    } catch (error) {
      setMessage({ type: 'error', text: 'Upload failed' });
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Document deleted successfully' });
        fetchDocuments();
      } else if (res.status === 401) {
        router.replace('/login');
      } else {
        setMessage({ type: 'error', text: 'Failed to delete document' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete document' });
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.replace('/login');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.includes('pdf')) return '📕';
    if (mimetype.includes('image')) return '🖼️';
    if (mimetype.includes('presentation') || mimetype.includes('powerpoint') || mimetype.includes('opendocument.presentation')) return '📊';
    if (mimetype.includes('word') || mimetype.includes('document') || mimetype.includes('msword')) return '📝';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet') || mimetype.includes('ms-excel')) return '📈';
    if (mimetype.includes('text') || mimetype.includes('csv')) return '📄';
    return '📄';
  };

  if (!authChecked) {
    return (
      <>
        <Head>
          <title>Admin - FlipPage</title>
        </Head>
        <div className="admin-layout">
          <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner-large"></div>
          </div>
        </div>
        <style jsx>{`
          .admin-layout { display: flex; min-height: 100vh; background: var(--cream-50); }
          .main-content { flex: 1; display: flex; align-items: center; justify-content: center; }
          .spinner-large { width: 40px; height: 40px; border: 3px solid var(--cream-200); border-top-color: var(--gold-500); border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin - FlipPage Document Management</title>
        <meta name="description" content="Upload and manage documents" />
      </Head>

      <div className="admin-layout">
        {/* Mobile Header */}
        <div className="mobile-header">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <Link href="/" className="mobile-logo">
            <span className="logo-icon">📖</span>
            <span className="logo-text">FlipPage</span>
          </Link>
        </div>

        {/* Sidebar Overlay */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <Link href="/" className="logo">
              <span className="logo-icon">📖</span>
              <span className="logo-text" style={{ color: '#ffffff' }}>FlipPage</span>
            </Link>
          </div>
          
          <nav className="sidebar-nav">
            <Link href="/" className="nav-item" style={{ color: '#ffffff' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Home
            </Link>
            <Link href="/admin" className="nav-item active" style={{ color: '#ffffff' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              Upload Documents
            </Link>
            <button className="nav-item logout-btn" style={{ color: '#ffffff' }} onClick={handleLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="content-header">
            <div className="header-top-row">
              <Link href="/" className="back-to-site">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to Site
              </Link>
            </div>
            <h1>Document Management</h1>
            <p>Upload, organize, and manage your documents</p>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.type === 'success' ? '✓' : '✕'} {message.text}
            </div>
          )}

          <div className="content-grid">
            {/* Upload Form */}
            <div className="upload-section">
              <div className="section-card">
                <h2>Upload New Document</h2>
                
                <form onSubmit={handleSubmit} className="upload-form">
                  <div className="form-group">
                    <label>Document File *</label>
                    <div className="file-input-wrapper">
                      <input
                        type="file"
                        id="document"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,.ico,.avif,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odp"
                        className="file-input"
                      />
                      <label htmlFor="document" className="file-label">
                        {selectedFile ? (
                          <div className="file-selected">
                            <span className="file-icon">{getFileIcon(selectedFile.type)}</span>
                            <span className="file-name">{selectedFile.name}</span>
                            <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                          </div>
                        ) : (
                          <div className="file-placeholder">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="17 8 12 3 7 8"></polyline>
                              <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            <span>Click to select file</span>
                            <span className="file-hint">PDF, Images, Word, Excel, PowerPoint, Text (max 50MB)</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {preview && (
                    <div className="image-preview">
                      <img src={preview} alt="Preview" />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter document title"
                      className="input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter document description"
                      className="input textarea"
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="input"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Tags</label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="Comma-separated tags"
                        className="input"
                      />
                    </div>
                  </div>

                  {uploading && (
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                      <span className="progress-text">{uploadProgress}%</span>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary btn-block"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <div className="spinner-small"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Upload Document
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Documents List */}
            <div className="documents-section">
              <div className="section-card">
                <div className="section-header">
                  <h2>Uploaded Documents</h2>
                  <span className="badge">{documents.length} files</span>
                </div>

                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading documents...</p>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>No documents yet</h3>
                    <p>Upload your first document to get started.</p>
                  </div>
                ) : (
                  <div className="documents-list">
                    {documents.map(doc => (
                      <div key={doc.id} className="document-item">
                        <div className="document-icon">
                          {getFileIcon(doc.mimetype)}
                        </div>
                        <div className="document-info">
                          <h4>{doc.title}</h4>
                          <p className="document-meta">
                            <span>{formatFileSize(doc.size)}</span>
                            <span>•</span>
                            <span>{doc.view_count} views</span>
                            <span>•</span>
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          </p>
                        </div>
                        <div className="document-actions">
                          <Link 
                            href={`/viewer?doc=${doc.id}`}
                            className="btn btn-ghost btn-sm"
                            title="View"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </Link>
                          <button
                            className="btn btn-ghost btn-sm btn-danger"
                            onClick={() => handleDelete(doc.id)}
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: var(--cream-50);
        }

        .sidebar {
          width: 260px;
          background: var(--navy-700);
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          z-index: 50;
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(200, 169, 81, 0.15);
          display: flex;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--white);
          font-family: 'Merriweather', Georgia, serif;
        }

        .logo-icon {
          font-size: 1.8rem;
        }

        .sidebar-nav {
          padding: 1rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.8rem 1rem;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
          white-space: nowrap;
          font-weight: 500;
          font-size: 0.9rem;
          border: none;
          background: none;
          cursor: pointer;
          font-family: inherit;
          width: 100%;
          text-align: left;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff !important;
        }

        .nav-item.active {
          background: rgba(200, 169, 81, 0.15);
          color: var(--gold-400);
        }

        .logout-btn {
          margin-top: auto;
        }

        .logout-btn:hover {
          background: rgba(220, 38, 38, 0.15);
          color: #fca5a5;
        }

        .main-content {
          flex: 1;
          margin-left: 260px;
          padding: 2rem;
        }

        .content-header {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .content-header h1 {
          font-family: 'Merriweather', Georgia, serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--navy-700);
          margin-bottom: 0.25rem;
        }

        .content-header p {
          color: var(--text-muted);
        }

        .header-top-row {
          margin-bottom: 0.75rem;
        }

        .back-to-site {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--gold-500);
          background: rgba(200, 169, 81, 0.1);
          border: 1px solid rgba(200, 169, 81, 0.25);
          border-radius: var(--radius-sm);
          text-decoration: none;
          transition: all var(--transition-fast);
        }

        .back-to-site:hover {
          background: rgba(200, 169, 81, 0.2);
          border-color: var(--gold-500);
          color: var(--gold-400);
        }

        .alert {
          padding: 1rem 1.5rem;
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .alert-success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .alert-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .section-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          padding: 1.5rem;
        }

        .section-card h2 {
          font-family: 'Merriweather', Georgia, serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--navy-700);
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border);
        }

        .badge {
          background: var(--navy-700);
          color: var(--gold-400);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--navy-700);
        }

        .input {
          width: 100%;
          padding: 0.65rem 0.85rem;
          font-size: 0.9rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--cream-50);
          font-family: inherit;
          color: var(--text-primary);
          transition: border-color var(--transition-fast);
        }

        .input:focus {
          outline: none;
          border-color: var(--gold-500);
          box-shadow: 0 0 0 3px rgba(200, 169, 81, 0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .textarea {
          resize: vertical;
          min-height: 80px;
        }

        .file-input-wrapper {
          position: relative;
        }

        .file-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .file-label {
          display: block;
          padding: 1.5rem;
          border: 2px dashed var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .file-label:hover {
          border-color: var(--gold-500);
          background: rgba(200, 169, 81, 0.05);
        }

        .file-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
        }

        .file-placeholder svg {
          color: var(--navy-400);
        }

        .file-hint {
          font-size: 0.75rem;
          color: var(--text-light);
        }

        .file-selected {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .file-icon {
          font-size: 2rem;
        }

        .file-name {
          font-weight: 600;
          color: var(--navy-700);
        }

        .file-size {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .image-preview {
          margin-top: 1rem;
        }

        .image-preview img {
          max-width: 100%;
          max-height: 200px;
          border-radius: var(--radius-md);
          object-fit: contain;
          border: 1px solid var(--border);
        }

        .progress-bar {
          position: relative;
          height: 8px;
          background: var(--cream-200);
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--gold-500);
          transition: width 0.3s ease;
        }

        .progress-text {
          position: absolute;
          right: 0;
          top: -20px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--navy-700);
        }

        .btn-block {
          width: 100%;
          padding: 0.8rem 1.5rem;
          font-size: 0.95rem;
          font-weight: 700;
          background: var(--gold-500);
          color: var(--navy-900);
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-family: 'Source Sans 3', sans-serif;
          letter-spacing: 0.02em;
        }

        .btn-block:hover:not(:disabled) {
          background: var(--gold-400);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(200, 169, 81, 0.3);
        }

        .btn-block:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(13, 27, 42, 0.2);
          border-top-color: var(--navy-900);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .documents-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 600px;
          overflow-y: auto;
        }

        .document-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--cream-50);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .document-item:hover {
          border-color: var(--gold-500);
          background: var(--white);
          box-shadow: var(--shadow-sm);
        }

        .document-icon {
          font-size: 1.5rem;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--cream-100);
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }

        .document-info {
          flex: 1;
          min-width: 0;
        }

        .document-info h4 {
          font-family: 'Source Sans 3', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--navy-700);
          margin-bottom: 0.2rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .document-meta {
          display: flex;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .document-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.45rem;
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-ghost:hover {
          background: var(--cream-100);
          border-color: var(--navy-400);
          color: var(--navy-700);
        }

        .btn-danger:hover {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 3rem;
          color: var(--text-muted);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--cream-200);
          border-top-color: var(--gold-500);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          font-family: 'Merriweather', Georgia, serif;
          font-size: 1.1rem;
          color: var(--navy-700);
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: var(--text-muted);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .mobile-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.85rem 1rem;
            background: var(--navy-700);
            border-bottom: 1px solid rgba(200, 169, 81, 0.15);
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 100;
          }

          .hamburger-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border: none;
            background: rgba(255, 255, 255, 0.1);
            border-radius: var(--radius-sm);
            cursor: pointer;
            color: var(--white);
          }

          .mobile-logo {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            text-decoration: none;
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--white);
            font-family: 'Merriweather', Georgia, serif;
          }

          .sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 200;
          }

          .sidebar {
            position: fixed;
            top: 0;
            left: -260px;
            z-index: 300;
            transition: left 0.3s ease;
          }

          .sidebar.open {
            left: 0;
          }

          .main-content {
            margin-left: 0;
            padding-top: 80px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }

        @media (min-width: 769px) {
          .mobile-header {
            display: none;
          }

          .sidebar-overlay {
            display: none;
          }
        }
      `}</style>
    </>
  );
}