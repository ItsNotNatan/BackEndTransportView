const supabase = require('../config/supabase');
const { formatarProBanco } = require('../utils/formatters');

const criarTransporte = async (req, res) => {
  const dados = req.body;
 
  try {
    // 1. INSERE O LOCAL DE COLETA
    const { data: localColeta, error: erroColeta } = await supabase
      .from('locais')
      .insert([{ 
        nome_local: dados.empresaColeta, 
        municipio: dados.cidadeColeta, 
        uf: dados.ufColeta,
        cep: dados.cepColeta || null,
        logradouro: dados.logradouroColeta || null,
        numero: dados.numeroColeta || null,
        bairro: dados.bairroColeta || null
      }])
      .select('id');
      
    if (erroColeta) throw new Error('Erro Coleta: ' + erroColeta.message);

    // 2. INSERE O LOCAL DE ENTREGA
    const { data: localEntrega, error: erroEntrega } = await supabase
      .from('locais')
      .insert([{ 
        nome_local: dados.empresaEntrega || 'Destinatário', 
        municipio: dados.cidadeEntrega, 
        uf: dados.ufEntrega,
        cep: dados.cepEntrega || null,
        logradouro: dados.logradouroEntrega || null,
        numero: dados.numeroEntrega || null,
        bairro: dados.bairroEntrega || null
      }])
      .select('id');
      
    if (erroEntrega) throw new Error('Erro Entrega: ' + erroEntrega.message);

    // 3. INSERE O PEDIDO ATM
    const { data: pedidoAtm, error: erroAtm } = await supabase
      .from('pedidos_atm')
      .insert([{ 
        data_solicitacao: formatarProBanco(dados.dataSolicitacao),
        pedido_compra: dados.pedidoCompra, 
        nf: dados.nf || null,
        wbs: dados.wbs,                    
        nome_contato: dados.nomeContato,
        telefone_contato: dados.telefoneContato,
        numero_reserva: dados.numeroReserva || null,
        id_origem: localColeta[0].id,
        id_destino: localEntrega[0].id,
        tipo_frete: dados.frete,
        solicitacao: dados.solicitante,
        veiculo: dados.veiculo,
        modal: dados.modal, 
        volume: parseFloat(dados.volume) || 0,
        peso: parseFloat(dados.peso) || 0,
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
        origem:id_origem (nome_local, logradouro, numero, bairro, municipio, uf, cep),
        destino:id_destino (nome_local, logradouro, numero, bairro, municipio, uf, cep),
        transportadora:id_transportadora (nome),
        faturamento:faturamento_atm (*) 
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // 👇 A CORREÇÃO ESTÁ NESTE MAPEAMENTO 👇
    const dadosFormatados = data.map(item => ({
      ...item,
      // Se houver faturamento, pegamos apenas o primeiro item do array [0]
      // Se não houver, deixamos null. Isso transforma a lista em um objeto único.
      faturamento: item.faturamento && item.faturamento.length > 0 ? item.faturamento[0] : null
    }));

    res.json(dadosFormatados); // Enviamos os dados já "achatados"
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
};

// ... (mantenha os imports e as outras funções criar/listar iguais)

// ... (mantenha os imports e as outras funções criar/listar iguais)

const atualizarTransporteAdmin = async (req, res) => {
  const { id } = req.params; 
  const d = req.body;

  try {
    // 🟢 1. FUNÇÕES AUXILIARES DE LIMPEZA (Vacinadas contra erro de numeric "")
    const num = (val) => (val === "" || val === undefined || val === null ? null : parseFloat(val));
    const str = (val) => (val === "" || val === undefined ? null : val);

    // 🟢 2. ATUALIZA A TABELA PRINCIPAL (pedidos_atm) E BUSCA OS IDS DE ENDEREÇO
    const { data: pedido, error: erroPedido } = await supabase
      .from('pedidos_atm')
      .update({
        status: str(d.status),
        cotacao_bid: str(d.valor), // Valor que vem do campo 'valor' do front
        valor_nf: num(d.valor),    
        nf: str(d.nf),
        pedido_compra: str(d.pedido_compra),
        wbs: str(d.wbs),
        observacoes: str(d.observacoes),
        peso: num(d.peso),
        volume: num(d.volume),
        medidas: str(d.medidas),
        veiculo: str(d.veiculo),
        tipo_frete: str(d.tipo_frete),
        data_entrega: d.data_entrega ? formatarProBanco(d.data_entrega) : null
      })
      .eq('id', id)
      .select('id_origem, id_destino') // Precisamos desses IDs para o próximo passo
      .single();

    if (erroPedido) throw new Error('Erro Pedido: ' + erroPedido.message);

    // 🟢 3. ATUALIZA OS ENDEREÇOS (Tabela locais)
    // Se o front enviou o objeto 'origem', atualizamos a rua/numero/etc
    if (pedido.id_origem && d.origem) {
      await supabase.from('locais').update({
        logradouro: str(d.origem.logradouro),
        numero: str(d.origem.numero),
        municipio: str(d.origem.municipio),
        uf: str(d.origem.uf)
      }).eq('id', pedido.id_origem);
    }

    // O mesmo para o destino
    if (pedido.id_destino && d.destino) {
      await supabase.from('locais').update({
        logradouro: str(d.destino.logradouro),
        numero: str(d.destino.numero),
        municipio: str(d.destino.municipio),
        uf: str(d.destino.uf)
      }).eq('id', pedido.id_destino);
    }

    // 🟢 4. ATUALIZA OU INSERE DADOS FINANCEIROS (faturamento_atm)
    const { error: erroFat } = await supabase
      .from('faturamento_atm')
      .upsert({
        id_atm: id,
        tipo_documento: str(d.tipo_documento),
        data_mapeamento: d.data_mapeamento ? formatarProBanco(d.data_mapeamento) : null,
        fatura_cte: str(d.fatura_cte),
        valor: num(d.valor),
        data_emissao: d.data_emissao ? formatarProBanco(d.data_emissao) : null,
        vencimento: d.vencimento ? formatarProBanco(d.vencimento) : null,
        elemento_pep_cc_wbs: str(d.wbs), // Sincroniza o PEP do financeiro com o logístico
        validacao_pep: str(d.validacao_pep),
        registrado_sap: str(d.registrado_sap)
      }, { onConflict: 'id_atm' });

    if (erroFat) throw new Error('Erro Financeiro: ' + erroFat.message);

    res.json({ mensagem: '✅ Pedido, Endereços e Faturamento atualizados!' });
    
  } catch (erro) {
    console.error("Erro completo no Update:", erro);
    res.status(400).json({ erro: erro.message });
  }
};

// ... (mantenha o module.exports igual)

module.exports = {
  criarTransporte,
  listarTransportesAdmin,
  atualizarTransporteAdmin
};