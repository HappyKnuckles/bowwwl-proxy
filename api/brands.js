// api/loadAllBalls.js
export default async function handler(req, res) {
  const apiUrl = 'https://bowwwl.com/restapi/brands';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  try {
    // Forward the request to the external API
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch data from target API');
    }

    const data = await response.json();

    // Return the sorted data as a JSON response
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching all balls:', error);
    res.status(500).json({ error: 'Failed to load all balls' });
  }
}
