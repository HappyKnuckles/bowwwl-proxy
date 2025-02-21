// api/loadAllBalls.js
export default async function handler(req, res) {
  const apiUrl = 'https://bowwwl.com/restapi/balls?_format=json';

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
