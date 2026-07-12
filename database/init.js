const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(process.cwd(), 'database', 'flippage.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create documents table
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    filename TEXT NOT NULL,
    originalname TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size INTEGER NOT NULL,
    category TEXT DEFAULT 'general',
    tags TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT 1,
    view_count INTEGER DEFAULT 0
  )
`);

// Create categories table
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT '📁',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create view_history table
db.exec(`
  CREATE TABLE IF NOT EXISTS view_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_view_history_device ON view_history(device_id, viewed_at DESC)
`);

// Insert default categories
const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name, description, color, icon) 
  VALUES (?, ?, ?, ?)
`);

const defaultCategories = [
  ['Documents', 'General documents', '#3b82f6', '📄'],
  ['Images', 'Image files', '#10b981', '🖼️'],
  ['PDFs', 'PDF documents', '#ef4444', '📕'],
  ['Presentations', 'Slide presentations', '#f59e0b', '📊'],
  ['Manuals', 'User manuals and guides', '#8b5cf6', '📖']
];

defaultCategories.forEach(cat => {
  insertCategory.run(...cat);
});

// Prepared statements
const insertDocument = db.prepare(`
  INSERT INTO documents (id, title, description, filename, originalname, mimetype, size, category, tags)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getAllDocuments = db.prepare(`
  SELECT d.*, c.name as category_name, c.color as category_color, c.icon as category_icon
  FROM documents d
  LEFT JOIN categories c ON d.category = c.name
  WHERE d.is_public = 1
  ORDER BY d.created_at DESC
`);

const getDocumentById = db.prepare(`
  SELECT d.*, c.name as category_name, c.color as category_color, c.icon as category_icon
  FROM documents d
  LEFT JOIN categories c ON d.category = c.name
  WHERE d.id = ?
`);

const getDocumentsByCategory = db.prepare(`
  SELECT d.*, c.name as category_name, c.color as category_color, c.icon as category_icon
  FROM documents d
  LEFT JOIN categories c ON d.category = c.name
  WHERE d.category = ? AND d.is_public = 1
  ORDER BY d.created_at DESC
`);

const updateDocumentViews = db.prepare(`
  UPDATE documents SET view_count = view_count + 1 WHERE id = ?
`);

const deleteDocument = db.prepare(`
  DELETE FROM documents WHERE id = ?
`);

const getAllCategories = db.prepare(`
  SELECT * FROM categories ORDER BY name
`);

const getDocumentStats = db.prepare(`
  SELECT 
    COUNT(*) as total_documents,
    SUM(size) as total_size,
    SUM(view_count) as total_views
  FROM documents
  WHERE is_public = 1
`);

const insertViewHistory = db.prepare(`
  INSERT INTO view_history (device_id, document_id) VALUES (?, ?)
`);

const getViewHistory = db.prepare(`
  SELECT d.*, c.name as category_name, c.color as category_color, c.icon as category_icon,
         MAX(vh.viewed_at) as last_viewed
  FROM view_history vh
  JOIN documents d ON vh.document_id = d.id
  LEFT JOIN categories c ON d.category = c.name
  WHERE vh.device_id = ? AND d.is_public = 1
  GROUP BY vh.document_id
  ORDER BY last_viewed DESC
  LIMIT 10
`);

module.exports = {
  db,
  insertDocument,
  getAllDocuments,
  getDocumentById,
  getDocumentsByCategory,
  updateDocumentViews,
  deleteDocument,
  getAllCategories,
  getDocumentStats,
  insertViewHistory,
  getViewHistory,
  uuidv4
};