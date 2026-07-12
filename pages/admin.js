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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, title: prev.title || file.name.replace(/\.[^/.]+$/, '') }));
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
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
    if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return '📊';
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
          .admin-layout { display: flex; min-height: 100vh; background: var(--secondary-50); }
          .main-content { flex: 1; }
          .spinner-large { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--gold-500); border-radius: 50%; animation: spin 0.8s linear infinite; }
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
              <span className="logo-text">FlipPage</span>
            </Link>
          </div>
          
          <nav className="sidebar-nav">
            <Link href="/" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Home
            </Link>
            <Link href="/admin" className="nav-item active">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              Upload Documents
            </Link>
            <button className="nav-item logout-btn" onClick={handleLogout}>
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
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.ppt,.pptx"
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
                            <span className="file-hint">PDF, Images, or PowerPoint (max 50MB)</span>
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
          background: var(--secondary-50);
        }

        .sidebar {
          width: 260px;
          background: white;
          border-right: 1px solid var(--secondary-200);
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--secondary-100);
          display: flex;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--secondary-900);
        }

        .logo-icon {
          font-size: 2rem;
        }

        .sidebar-nav {
          padding: 1rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          color: var(--secondary-600);
          text-decoration: none;
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .nav-item:hover {
          background: var(--secondary-100);
          color: var(--secondary-900);
        }

        .nav-item.active {
          background: var(--primary-50);
          color: var(--primary-600);
        }

        .logout-btn {
          margin-top: auto;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: inherit;
          width: 100%;
          text-align: left;
          color: var(--secondary-600);
        }

        .logout-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .main-content {
          flex: 1;
          margin-left: 260px;
          padding: 2rem;
        }

        .content-header {
          margin-bottom: 2rem;
        }

        .content-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--secondary-900);
          margin-bottom: 0.25rem;
        }

        .content-header p {
          color: var(--secondary-500);
        }

        .alert {
          padding: 1rem 1.5rem;
          border-radius: var(--radius-lg);
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .alert-success {
          background: #d1fae5;
          color: #065f46;
        }

        .alert-error {
          background: #fee2e2;
          color: #991b1b;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .section-card {
          background: white;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-md);
          padding: 1.5rem;
        }

        .section-card h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--secondary-900);
          margin-bottom: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--secondary-700);
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
          border: 2px dashed var(--secondary-300);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .file-label:hover {
          border-color: var(--primary-500);
          background: var(--primary-50);
        }

        .file-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: var(--secondary-500);
        }

        .file-placeholder svg {
          color: var(--secondary-400);
        }

        .file-hint {
          font-size: 0.75rem;
          color: var(--secondary-400);
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
          font-weight: 500;
          color: var(--secondary-900);
        }

        .file-size {
          font-size: 0.875rem;
          color: var(--secondary-500);
        }

        .image-preview {
          margin-top: 1rem;
        }

        .image-preview img {
          max-width: 100%;
          max-height: 200px;
          border-radius: var(--radius-lg);
          object-fit: contain;
        }

        .progress-bar {
          position: relative;
          height: 8px;
          background: var(--secondary-200);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--gradient-primary);
          transition: width 0.3s ease;
        }

        .progress-text {
          position: absolute;
          right: 0;
          top: -20px;
          font-size: 0.75rem;
          color: var(--secondary-600);
        }

        .btn-block {
          width: 100%;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .documents-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 600px;
          overflow-y: auto;
        }

        .document-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--secondary-50);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
        }

        .document-item:hover {
          background: var(--secondary-100);
        }

        .document-info {
          flex: 1;
          min-width: 0;
        }

        .document-info h4 {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--secondary-900);
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .document-meta {
          display: flex;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--secondary-500);
        }

        .document-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-danger:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 3rem;
          color: var(--secondary-500);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--secondary-200);
          border-top-color: var(--primary-500);
          border-radius: 50%;
          animation: spin 1s linear infinite;
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
          font-size: 1.125rem;
          color: var(--secondary-900);
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: var(--secondary-500);
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
            padding: 1rem;
            background: white;
            border-bottom: 1px solid var(--secondary-200);
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
            background: var(--secondary-100);
            border-radius: var(--radius-lg);
            cursor: pointer;
            color: var(--secondary-700);
          }

          .mobile-logo {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            text-decoration: none;
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--secondary-900);
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