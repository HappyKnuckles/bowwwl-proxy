// api/loadAllCoverstocks.js
export default async function handler(req, res) {
  const apiUrl = 'https://bowwwl.com/restapi/coverstocks';

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch data from target API');
    }

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load all coverstocks' });
  }
}
