const axios = require('axios');

async function run() {
  const numero = process.argv[2] || '1756686301502';
  const url = `http://localhost:3001/boletos/${numero}/comprovante`;
  const payload = {
    comprovante_url: 'data:text/plain;base64,SGVsbG8gQk9MRVRPK1hDUllQVE8=',
    filename: 'comprovante_test.txt',
    filetype: 'text/plain'
  };

  try {
    const res = await axios.patch(url, payload, { headers: { 'Content-Type': 'application/json' } });
    console.log('Status:', res.status);
    console.log('Body:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('Error status:', err.response.status);
      console.error('Error body:', err.response.data);
    } else {
      console.error('Request error:', err.message);
    }
  }
}

run();