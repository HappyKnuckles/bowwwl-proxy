// api/loadAllCoverstocks.js
import { withCors } from '../middleware.js';

// Whitelist of allowed API endpoints
const ALLOWED_API_URL = 'https://bowwwl.com/restapi/coverstocks';

async function handler(req, res) {
  try {
    const response = await fetch(ALLOWED_API_URL, {
      headers: {
        'User-Agent': 'bowwwl-proxy/1.0',
      },
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data from target API');
    }

    const data = await response.json();

    // Validate response is an array
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format');
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error.message);
    if (error.name === 'AbortError') {
      res.status(504).json({ error: 'Request timeout' });
    } else {
      res.status(500).json({ error: 'Failed to load all coverstocks' });
    }
  }
}

export default withCors(handler);
