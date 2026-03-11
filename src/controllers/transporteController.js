const supabase = require('../config/supabase');
const { formatarProBanco } = require('../utils/formatters');

const criarTransporte = async (req, res) => {
  const dados = req.body;
  try {
    const { data: localColeta, error: erroColeta } = await supabase
      .from('locais').insert([{ nome_local: dados.empresaColeta, municipio: dados.cidadeColeta, uf: dados.ufColeta }]).select('id');
    if (erroColeta) throw new Error('Erro Coleta: ' + erroColeta.message);

    const { data: localEntrega, error: erroEntrega } = await supabase
      .from('locais').insert([{ nome_local: dados.empresaEntrega || 'Destinatário', municipio: dados.cidadeEntrega, uf: dados.ufEntrega }]).select('id');
    if (erroEntrega) throw new Error('Erro Entrega: ' + erroEntrega.message);

    const { data: pedidoAtm, error: erroAtm } = await supabase
      .from('pedidos_atm')
      .insert([{ 
        data_solicitacao: formatarProBanco(dados.dataSolicitacao),
        pedido_compra: dados.pedidoCompra, 
        nf: dados.nf || null,
        wbs: dados.wbs,                    
        id_origem: localColeta[0].id,
        id_destino: localEntrega[0].id,
        tipo_frete: dados.frete,
        solicitacao: dados.solicitante,
        veiculo: dados.veiculo,
        modal: dados.modal, // <-- Adicionado para pegar o Automático do front!
        volume: parseFloat(dados.volume),
        peso: parseFloat(dados.peso),
        data_entrega: formatarProBanco(dados.dataEntrega), 
        status: 'Aguardando Aprovação',
        observacoes: dados.obs || null
      }])
      .select('id'); 

    if (erroAtm) throw new Error('Erro ATM: ' + erroAtm.message);
    res.status(201).json({ mensagem: 'Sucesso!', id_gerado: pedidoAtm[0].id });
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
};

const listarTransportesAdmin = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pedidos_atm')
      .select(`
        *,
        origem:id_origem (nome_local, municipio, uf),
        destino:id_destino (nome_local, municipio, uf),
        transportadora:id_transportadora (nome)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    res.json(data);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
};

const atualizarTransporteAdmin = async (req, res) => {
  const { id } = req.params; 
  const dadosAtualizados = req.body; 

  try {
    const { data, error } = await supabase
      .from('pedidos_atm')
      .update({
        status: dadosAtualizados.status,
        cotacao_bid: dadosAtualizados.cotacao_bid,
        valor_nf: dadosAtualizados.valor_nf,
        observacoes: dadosAtualizados.observacoes
      })
      .eq('id', id)
      .select();

    if (error) throw new Error(error.message);
    res.json({ mensagem: 'Pedido atualizado com sucesso!', pedido: data });
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
};

module.exports = {
  criarTransporte,
  listarTransportesAdmin,
  atualizarTransporteAdmin
};