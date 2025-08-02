// API Route para Vercel - Teste de conectividade
export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`🚀 API Hello Request: ${req.method} ${req.url}`);

  return res.status(200).json({
    message: 'Backend BXC funcionando no Vercel!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    version: '1.0.0'
  });
}