// src/controllers/authController.js
const supabase = require('../config/supabase'); // Importa a sua conexão com o banco

const login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    // 1. Procura o usuário no Supabase pelo email
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single(); // Esperamos apenas 1 resultado

    // Se houver erro na busca ou não encontrar o usuário
    if (error || !usuario) {
      return res.status(401).json({ mensagem: 'E-mail ou palavra-passe incorretos.' });
    }

    // 2. Verifica se a senha está correta (Comparação direta para teste)
    if (senha !== usuario.senha) {
      return res.status(401).json({ mensagem: 'E-mail ou palavra-passe incorretos.' });
    }

    // 3. Verifica se o usuário está ativo
    if (!usuario.ativo) {
      return res.status(403).json({ mensagem: 'Acesso bloqueado. Contate o administrador.' });
    }

    // 4. Se tudo estiver correto, devolve os dados (SEM A SENHA)
    res.status(200).json({
      mensagem: 'Login aprovado!',
      perfil: usuario.perfil,
      nome: usuario.nome
    });

  } catch (erro) {
    console.error('Erro ao fazer login:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};

module.exports = {
  login
};