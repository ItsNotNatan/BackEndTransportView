// server.js - Versão Corrigida
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

// 1. Importando as rotas
const transporteRoutes = require('./src/routes/transporteRoutes');
const authRoutes = require('./src/routes/authRoutes');

// 2. INICIALIZANDO O APP (Isso tem que vir antes de qualquer 'app.use')
const app = express(); 

// 3. MIDDLEWARES GLOBAIS
app.use(cors());
app.use(express.json());

// 4. DEFINIÇÃO DAS ROTAS (Prefixos limpos para evitar o erro 404)
// O login fica em: http://localhost:3001/api/auth/login
app.use('/api/auth', authRoutes); 

// O admin fica em: http://localhost:3001/api/admin/transportes
app.use('/api', transporteRoutes); 

// 5. INICIALIZAÇÃO DO SERVIDOR
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});