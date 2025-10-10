// api/loadAllBalls.js
export default async function handler(req, res) {
  const baseUrl = 'https://bowwwl.com/restapi/balls?_format=json';

  let apiUrl = baseUrl;
  if (req.query.updated) {
    apiUrl += `&updated=${encodeURIComponent(req.query.updated)}`;
  }
  if (req.query.weight) {
    apiUrl += `&weight=${encodeURIComponent(req.query.weight)}`;
  }

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch data from target API');
    }

    const data = await response.json();

    const sortedBalls = data.sort(
      (a, b) => new Date(b.release_date) - new Date(a.release_date)
    );

    res.status(200).json(sortedBalls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load all balls' });
  }
}
