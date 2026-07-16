import fs from 'fs';
import path from 'path';
import { db } from '../../database/init';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filename } = req.query;
  if (!filename) {
    return res.status(400).json({ error: 'Filename required' });
  }

  const doc = db.prepare('SELECT mimetype, filename FROM documents WHERE filename = ?').get(filename);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const filePath = path.join(process.cwd(), 'public', 'documents', doc.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on disk' });
  }

  const stat = fs.statSync(filePath);
  res.setHeader('Content-Type', doc.mimetype);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}
