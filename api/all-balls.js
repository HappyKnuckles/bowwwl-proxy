// api/loadAllBalls.js
export default async function handler(req, res) {
  const apiUrl = 'https://bowwwl.com/restapi/balls?_format=json';
  
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

    // Sort the data based on release_date
    const sortedBalls = data.sort((a, b) => {
      return (
        new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      );
    });

    // Return the sorted data as a JSON response
    res.status(200).json(sortedBalls);
  } catch (error) {
    console.error('Error fetching all balls:', error);
    res.status(500).json({ error: 'Failed to load all balls' });
  }
}
