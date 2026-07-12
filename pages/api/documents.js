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
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        return allowedTypes.includes(mimetype);
      },
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const file = files.document[0];
    const id = uuidv4();
    const title = fields.title[0] || path.basename(file.originalFilename, path.extname(file.originalFilename));
    const description = fields.description[0] || '';
    const category = fields.category[0] || 'Documents';
    const tags = fields.tags[0] ? JSON.stringify(fields.tags[0].split(',').map(t => t.trim())) : '[]';

    // Rename file with UUID
    const ext = path.extname(file.originalFilename);
    const newFilename = `${id}${ext}`;
    const newPath = path.join(uploadDir, newFilename);
    
    fs.renameSync(file.filepath, newPath);

    // Get file size
    const stats = fs.statSync(newPath);

    insertDocument.run(
      id,
      title,
      description,
      newFilename,
      file.originalFilename,
      file.mimetype,
      stats.size,
      category,
      tags
    );

    const document = getDocumentById.get(id);
    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
}

async function handleDelete(req, res) {
  try {
    const { id } = req.query;
    
    const document = getDocumentById.get(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'public', 'documents', document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    deleteDocument.run(id);
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}