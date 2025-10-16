const axios = require('axios');

async function probe() {
  const base = 'https://boletos-backend-290725.vercel.app/api';
  try {
    const status = await axios.get(base, { headers: { Accept: 'application/json' } });
    console.log('GET /api ->', status.status, status.data);
  } catch (e) {
    console.log('GET /api error:', e.message);
  }

  try {
    const numero = '123456';
    const payload = {
      comprovante_url: 'data:text/plain;base64,SGVsbG8=',
      filename: 'teste.txt',
      filetype: 'text/plain'
    };
    const res = await axios.patch(`${base}/boletos/${numero}/comprovante`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('PATCH /api/boletos/:id/comprovante ->', res.status, res.data);
  } catch (e) {
    if (e.response) {
      console.log('PATCH error ->', e.response.status, e.response.data);
    } else {
      console.log('PATCH error:', e.message);
    }
  }
}

probe();