// api/getSameCoverstockBalls.js
import { withCors } from '../middleware.js';

async function handler(req, res) {
  const { coverstock, ballId } = req.query;
  const apiUrl = `https://bowwwl.com/restapi/balls/v2?coverstock=${coverstock}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch coverstock balls');
    }

    let coverstockBalls = await response.json();
    coverstockBalls = coverstockBalls.filter((coverstockBall) => coverstockBall.ball_id !== ballId);

    res.status(200).json(coverstockBalls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coverstock balls' });
  }
}

export default withCors(handler);
