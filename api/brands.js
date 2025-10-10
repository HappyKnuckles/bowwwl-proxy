// api/loadAllBrands.js
import { withCors } from '../middleware.js';

async function handler(req, res) {
  const apiUrl = 'https://bowwwl.com/restapi/brands';

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch data from target API');
    }

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load all brands' });
  }
}

export default withCors(handler);
