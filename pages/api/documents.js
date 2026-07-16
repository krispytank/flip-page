import { IncomingForm } from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { db, insertDocument, getAllDocuments, getDocumentById, getDocumentsByCategory, updateDocumentViews, deleteDocument, getAllCategories, getDocumentStats } from '../../database/init';
import { isAuthenticated } from '../../lib/auth';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function handleGet(req, res) {
  try {
    const { category, id, stats } = req.query;

    if (stats === 'true') {
      const documentStats = getDocumentStats.get();
      return res.status(200).json(documentStats);
    }

    if (id) {
      const document = getDocumentById.get(id);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      updateDocumentViews.run(id);
      return res.status(200).json(document);
    }

    let documents;
    if (category) {
      documents = getDocumentsByCategory.all(category);
    } else {
      documents = getAllDocuments.all();
    }

    const categories = getAllCategories.all();

    res.status(200).json({ documents, categories });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
}

async function handlePost(req, res) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'documents');
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      filter: ({ mimetype }) => {
        const allowedTypes = [
          // PDF
          'application/pdf',
          // Images
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          'image/bmp',
          'image/tiff',
          'image/tiff-fx',
          'image/x-icon',
          'image/avif',
          // Documents
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/csv',
          'application/rtf',
          // Presentations
          'application/vnd.oasis.opendocument.presentation',
        ];
        return allowedTypes.includes(mimetype);
      },
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const file = files.document[0];
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const id = uuidv4();
    const originalName = file.originalFilename || 'unnamed';
    const title = fields.title[0] || path.basename(originalName, path.extname(originalName));
    const description = fields.description[0] || '';
    const category = fields.category[0] || 'Documents';
    const tags = fields.tags[0] ? JSON.stringify(fields.tags[0].split(',').map(t => t.trim())) : '[]';

    const ext = path.extname(originalName) || '.bin';
    const newFilename = `${id}${ext}`;
    const newPath = path.join(uploadDir, newFilename);
    
    try {
      fs.renameSync(file.filepath, newPath);
    } catch (renameErr) {
      fs.copyFileSync(file.filepath, newPath);
      fs.unlinkSync(file.filepath);
    }

    // Get file size
    const stats = fs.statSync(newPath);

    insertDocument.run(
      id,
      title,
      description,
      newFilename,
      originalName,
      file.mimetype,
      stats.size,
      category,
      tags
    );

    const document = getDocumentById.get(id);
    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document: ' + (error.message || 'Unknown error') });
  }
}

async function handleDelete(req, res) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { id } = req.query;
    
    const document = getDocumentById.get(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(process.cwd(), 'public', 'documents', document.filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileErr) {
      console.warn('Could not delete file from disk:', fileErr.message);
    }

    deleteDocument.run(id);
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}