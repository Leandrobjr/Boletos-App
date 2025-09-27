const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Frontend funcionando!');
});

app.listen(port, () => {
  console.log(`Servidor de teste rodando em http://localhost:${port}`);
});







