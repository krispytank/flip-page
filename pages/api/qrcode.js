import QRCode from 'qrcode';
import { getDocumentById } from '../../database/init';

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const { id, size = 300 } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    const document = getDocumentById.get(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Generate QR code URL
    const baseUrl = req.headers.origin || `http://${req.headers.host}`;
    const documentUrl = `${baseUrl}/viewer?doc=${id}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(documentUrl, {
      width: parseInt(size),
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    res.status(200).json({
      document: {
        id: document.id,
        title: document.title,
        url: documentUrl
      },
      qrCode: qrCodeDataUrl
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}