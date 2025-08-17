// Proxy para API Coingecko - evita CORS
module.exports = async (req, res) => {
  // CORS Headers obrigatórios
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('🪙 COINGECKO PROXY - Iniciando requisição');
  console.log('📊 Query params:', req.query);

  try {
    const ticker = req.query.ticker || 'tether';
    const vs = req.query.vs || 'brl';
    
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ticker)}&vs_currencies=${encodeURIComponent(vs)}`;
    console.log('🔗 URL Coingecko:', url);
    
    // Fazer requisição para CoinGecko
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BXC-Boletos/1.0'
      }
    });
    
    console.log('📡 Resposta Coingecko:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      console.error('❌ Erro na API Coingecko:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: `Falha Coingecko ${response.status}`,
        message: response.statusText
      });
    }
    
    const data = await response.json();
    console.log('📦 Dados Coingecko:', data);
    
    // Extrair o preço específico
    const price = data?.[ticker]?.[vs];
    
    if (!price) {
      console.error('❌ Preço não encontrado nos dados:', data);
      return res.status(404).json({ 
        error: 'Preço não encontrado',
        data: data
      });
    }
    
    console.log('✅ SUCESSO - Preço obtido:', price);
    
    // Retornar resultado
    res.json({ 
      price: price,
      ticker: ticker,
      vs: vs,
      timestamp: new Date().toISOString(),
      source: 'coingecko'
    });
    
  } catch (error) {
    console.error('💥 ERRO no proxy Coingecko:', error);
    res.status(500).json({ 
      error: 'Proxy Coingecko falhou', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
