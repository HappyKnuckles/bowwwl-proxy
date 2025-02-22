// api/getSameCoverstockBalls.js
export default async function handler(req, res) {
  const { coverstock, ballId } = req.query; // Extract the coverstock parameter from the request query
  const apiUrl = `https://bowwwl.com/restapi/balls/v2?coverstock=${coverstock}`;

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
      throw new Error('Failed to fetch coverstock balls');
    }

    const coverstockBalls = await response.json();
    coverstockBalls.filter((coverstockBall) => coverstockBall.ball_id !== ballId);
    
    res.status(200).json(coverstockBalls);
  } catch (error) {
    console.error('Error fetching coverstock balls:', error);
    res.status(500).json({ error: 'Failed to fetch coverstock balls' });
  }
}
