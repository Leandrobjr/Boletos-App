/**
 * 🚀 BXC Boletos App - Ponto de entrada principal
 * 
 * Este arquivo serve como ponto de entrada para o Vercel
 * e redireciona para a aplicação principal
 */

const express = require('express');
const path = require('path');
const app = express();

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'src/app')));

// Rota principal - serve a aplicação
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/app/page.sx'));
});

// Rota para todas as outras páginas
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/app/page.sx'));
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 BXC Boletos App rodando na porta ${PORT}`);
  });
}

module.exports = app;