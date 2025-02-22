// api/getSameCoreBalls.js
export default async function handler(req, res) {
  const { core, ballId } = req.query; // Extract the core parameter from the request query
  const apiUrl = `https://bowwwl.com/restapi/balls/v2?core=${core}`;

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
      throw new Error('Failed to fetch core balls');
    }

    const coreBalls = await response.json();
    coreBalls = coreBalls.filter((coreBall) => coreBall.ball_id !== ballId);

    res.status(200).json(coreBalls);
  } catch (error) {
    console.error('Error fetching core balls:', error);
    res.status(500).json({ error: 'Failed to fetch core balls' });
  }
}
