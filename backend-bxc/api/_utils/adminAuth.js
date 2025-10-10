// Utilitário de autorização administrativa
// Permite acesso por:
// - Header X-App-Admin-Key igual à env ADMIN_API_KEY
// - Header X-Wallet-Address presente na lista ADMIN_WALLETS
// - Authorization: Bearer <Firebase ID Token> com claim customizada { admin: true }

const admin = require('firebase-admin');

let initialized = false;
function initFirebaseAdmin() {
  try {
    if (!initialized && !admin.apps.length && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'projeto-bxc',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
      initialized = true;
    }
  } catch (_) {
    // Evitar crash caso variáveis não estejam configuradas
  }
}

function parseBearer(req) {
  const h = req.headers.authorization || '';
  if (typeof h === 'string' && h.toLowerCase().startsWith('bearer ')) {
    return h.slice(7).trim();
  }
  return null;
}

function apiKeyAllowed(req) {
  const key = req.headers['x-app-admin-key'] || '';
  return process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY;
}

function walletAllowed(req) {
  const addr = (req.headers['x-wallet-address'] || '').toLowerCase();
  const list = (process.env.ADMIN_WALLETS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  if (!addr || list.length === 0) return null;
  return list.includes(addr) ? addr : null;
}

async function verifyFirebase(idToken) {
  try {
    initFirebaseAdmin();
    if (!admin.apps.length) return null;
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded;
  } catch (_) {
    return null;
  }
}

// Retorna true quando autorizado; caso contrário envia 403 e retorna false
async function requireAdmin(req, res) {
  // Liberar preflight
  if (req.method === 'OPTIONS') return true;

  // 1) API key
  if (apiKeyAllowed(req)) return true;

  // 2) Wallet allowlist
  const wallet = walletAllowed(req);
  if (wallet) {
    req.adminWallet = wallet;
    return true;
  }

  // 3) Firebase ID Token com claim admin
  const token = parseBearer(req);
  if (token) {
    const decoded = await verifyFirebase(token);
    if (decoded && (decoded.admin === true)) {
      req.adminUser = decoded;
      return true;
    }
  }

  res.status(403).json({
    error: 'Acesso negado',
    message: 'Permissão administrativa requerida',
    hints: [
      'Envie Authorization: Bearer <Firebase ID Token> com claim { admin: true }',
      'ou X-App-Admin-Key igual à variável de ambiente ADMIN_API_KEY',
      'ou X-Wallet-Address presente em ADMIN_WALLETS (se configurada)'
    ]
  });
  return false;
}

module.exports = { requireAdmin };