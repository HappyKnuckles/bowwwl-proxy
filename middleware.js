// CORS middleware wrapper for Vercel serverless functions
export function withCors(handler) {
  return async (req, res) => {
    const allowedOrigins = [
      'https://lightningbowl.de',
      'https://test.lightningbowl.de',
      'https://localhost',
      'http://localhost',
      'http://localhost:8100',
      'http://localhost:4200',
    ];

    const vercelRegex = /^https:\/\/([a-zA-Z0-9\-]+)\.vercel\.app$/;

    const origin = req.headers.origin;

    // Check if origin is allowed or matches Vercel preview deployments
    if (
      allowedOrigins.includes(origin) ||
      (origin && vercelRegex.test(origin)) ||
      origin === 'null' ||
      !origin
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
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
