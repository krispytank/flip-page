import { insertViewHistory, getViewHistory } from '../../database/init';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

function handleGet(req, res) {
  try {
    const { device_id } = req.query;
    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }
    const history = getViewHistory.all(device_id);
    res.status(200).json({ history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
}

function handlePost(req, res) {
  try {
    const { device_id, document_id } = req.body;
    if (!device_id || !document_id) {
      return res.status(400).json({ error: 'device_id and document_id are required' });
    }
    insertViewHistory.run(device_id, document_id);
    res.status(201).json({ message: 'History recorded' });
  } catch (error) {
    console.error('Error recording history:', error);
    res.status(500).json({ error: 'Failed to record history' });
  }
}
