require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

// Importando as rotas
const transporteRoutes = require('./src/routes/transporteRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Apontando a rota base para os arquivos de rotas
app.use('/api/admin/transportes', transporteRoutes); // 1. Rota para a Tabela do Admin
app.use('/api', transporteRoutes);                   // 2. Rota para o Cliente enviar formulários (Voltou!)
app.use('/api', authRoutes);                         // 3. Rota para o Admin fazer o Login

// Iniciando o servidor
const PORT = 3001; 
const server = http.createServer(app);

server.on('error', (erro) => {
  console.error("❌ ERRO NO SERVIDOR:", erro.message);
});

server.listen(PORT, () => {
  console.log(`✅ Servidor rodando firmemente na porta http://localhost:${PORT}`);
  console.log(`📡 Aguardando requisições do Cliente e do Admin...`);
});