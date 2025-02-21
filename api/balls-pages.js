// api/loadBalls.js
export default async function handler(req, res) {
  const { page } = req.query;
  const apiUrl = `https://bowwwl.com/restapi/balls/v2?page=${page}`;
  
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
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch balls');
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching balls:', error);
    res.status(500).json({ error: 'Failed to load balls' });
  }
}
