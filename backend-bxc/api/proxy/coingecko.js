// Proxy para API Coingecko - evita CORS nas chamadas do frontend
// Cache simples em memória (TTL 60s) para reduzir chamadas e estabilizar resposta
const cgCache = {};
module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const ticker = req.query.ticker || 'tether';
    const vs = req.query.vs || 'brl';
    const cacheKey = `${ticker}:${vs}`;

    // Retornar do cache se válido (60s)
    const cached = cgCache[cacheKey];
    if (cached && (Date.now() - cached.ts) < 60000) {
      return res.json({ price: cached.price, ticker, vs, cached: true, timestamp: new Date(cached.ts).toISOString(), source: 'coingecko' });
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ticker)}&vs_currencies=${encodeURIComponent(vs)}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BXC-Boletos/1.0'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Falha Coingecko ${response.status}`,
        message: response.statusText
      });
    }

    const data = await response.json();
    const price = data?.[ticker]?.[vs];

    if (!price && price !== 0) {
      return res.status(404).json({
        error: 'Preço não encontrado',
        data
      });
    }

    // Armazenar no cache
    cgCache[cacheKey] = { price, ts: Date.now() };

    res.json({ price, ticker, vs, timestamp: new Date().toISOString(), source: 'coingecko' });
  } catch (error) {
    res.status(500).json({
      error: 'Proxy Coingecko falhou',
      details: error.message
    });
  }
};