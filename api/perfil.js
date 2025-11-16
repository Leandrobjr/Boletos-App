module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'GET') {
      const pathParts = url.pathname.split('/').filter(Boolean);
      const uidFromPath = pathParts[pathParts.length - 1] !== 'perfil' ? pathParts[pathParts.length - 1] : null;
      const uid = url.searchParams.get('uid') || uidFromPath;
      if (!uid) {
        return res.status(400).json({ error: 'UID é obrigatório' });
      }
      return res.status(200).json({ firebase_uid: uid, nome: null, email: null, telefone: null });
    }
    if (req.method === 'POST') {
      const { firebase_uid, nome, email, telefone } = req.body || {};
      if (!firebase_uid) {
        return res.status(400).json({ error: 'firebase_uid é obrigatório' });
      }
      return res.status(200).json({ firebase_uid, nome: nome || null, email: email || null, telefone: telefone || null });
    }
    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};
