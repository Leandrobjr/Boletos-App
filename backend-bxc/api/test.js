module.exports = (req, res) => {
  res.json({
    message: 'Backend BXC funcionando no Vercel!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}; 