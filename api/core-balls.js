// api/getSameCoreBalls.js
export default async function handler(req, res) {
  const { core, ballId } = req.query; // Extract the core parameter from the request query
  const apiUrl = `https://bowwwl.com/restapi/balls/v2?core=${core}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch core balls');
    }

    let coreBalls = await response.json();
    coreBalls = coreBalls.filter((coreBall) => coreBall.ball_id !== ballId);

    res.status(200).json(coreBalls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch core balls' });
  }
}
