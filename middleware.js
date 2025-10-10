import { NextResponse } from 'next/server';

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

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
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

    return new Response(null, {
      status: 200,
      headers: responseHeaders,
    });
  }

  // For non-OPTIONS requests, let them continue and add CORS headers to the response
  const response = NextResponse.next();

  if (allowedOrigins.includes(origin) || !origin) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,DELETE,OPTIONS'
    );
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}
