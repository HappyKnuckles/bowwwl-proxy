// api/loadBalls.js
export default async function handler(req, res) {
  const { page } = req.query;
  const apiUrl = `https://bowwwl.com/restapi/balls/v2?page=${page}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch balls');
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load balls' });
  }
}
