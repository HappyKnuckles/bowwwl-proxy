export const config = {
  runtime: 'nodejs',
};

export default function middleware(request) {
  const allowedOrigins = [
    'https://lightningbowl.de',
    'http://localhost:8000',
    'https://*.vercel.app',
  ];
  const origin = request.headers.get('Origin');
  const responseHeaders = new Headers();

  if (allowedOrigins.includes(origin) || !origin) {
    responseHeaders.set('Access-Control-Allow-Origin', origin || '*');
    responseHeaders.set(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,DELETE,OPTIONS'
    );
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type');
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  }

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: responseHeaders,
    });
  }
}
