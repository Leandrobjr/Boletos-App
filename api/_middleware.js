// Middleware global para todas as funções Vercel
export function middleware(request) {
  const response = new Response();
  
  // Headers CORS obrigatórios
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  // Responder OPTIONS (preflight) automaticamente
  if (request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: response.headers 
    });
  }
  
  return response;
}

export const config = {
  matcher: '/api/:path*'
};
