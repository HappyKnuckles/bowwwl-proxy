// CORS middleware wrapper for Vercel serverless functions
export function withCors(handler) {
  return async (req, res) => {
    const allowedOrigins = [
      'https://lightningbowl.de',
      'http://localhost:8100',
      'https://*.vercel.app',
    ];

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin) || !origin) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET,POST,PUT,DELETE,OPTIONS'
      );
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Continue to the actual handler
    return handler(req, res);
  };
}
