const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Acesso negado! Faça login.' });
  }

  try {
    // Aqui usamos a chave do Access Token (JWT_SECRET)
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decodificado; 
    next();
  } catch (erro) {
    res.status(403).json({ erro: 'Token expirado ou inválido.' });
  }
};

module.exports = verificarToken;