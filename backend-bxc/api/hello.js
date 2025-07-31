module.exports = (req, res) => {
  res.json({ 
    message: 'Hello from Vercel API!', 
    timestamp: new Date().toISOString(),
    path: '/api/hello'
  });
};
