const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Função utilitária para mapear status
function mapStatus(status) {
  switch ((status || '').toLowerCase()) {
    case 'pendente': return 'DISPONIVEL';
    case 'pago': return 'BAIXADO';
    case 'reservado': return 'AGUARDANDO PAGAMENTO';
    case 'aguardando_baixa': return 'AGUARDANDO BAIXA';
    case 'cancelado': return 'EXCLUIDO';
    default: return status ? status.toUpperCase() : status;
  }
}

// Rotas da API
app.get('/boletos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('boletos')
      .select('*')
      .order('criado_em', { ascending: false });
    
    if (error) throw error;
    
    const boletosMapeados = data.map(boleto => ({
      ...boleto,
      status: mapStatus(boleto.status)
    }));
    
    res.json(boletosMapeados);
  } catch (error) {
    console.error('Erro ao listar boletos:', error);
    res.status(500).json({ error: 'Erro ao listar boletos' });
  }
});

app.post('/boletos', async (req, res) => {
  const { user_id, cpf_cnpj, codigo_barras, valor_brl, vencimento, instituicao } = req.body;
  try {
    // Gerar número de controle único
    const { count } = await supabase
      .from('boletos')
      .select('*', { count: 'exact', head: true });
    
    const numeroControle = ((count || 0) + 1).toString().padStart(6, '0');
    
    const { data, error } = await supabase
      .from('boletos')
      .insert([{
        user_id,
        cpf_cnpj,
        codigo_barras,
        valor_brl,
        vencimento,
        instituicao,
        numero_controle,
        status: 'pendente'
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const boletoMapeado = {
      ...data,
      status: mapStatus(data.status)
    };
    
    res.status(201).json(boletoMapeado);
  } catch (error) {
    console.error('Erro ao criar boleto:', error);
    res.status(500).json({ error: 'Erro ao criar boleto' });
  }
});

app.get('/boletos/usuario/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const { data, error } = await supabase
      .from('boletos')
      .select('*')
      .eq('user_id', user_id)
      .order('criado_em', { ascending: false });
    
    if (error) throw error;
    
    const boletosMapeados = data.map(boleto => ({
      ...boleto,
      status: mapStatus(boleto.status)
    }));
    
    res.json(boletosMapeados);
  } catch (error) {
    console.error('Erro ao buscar boletos do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar boletos do usuário' });
  }
});

// Perfil do usuário
app.post('/perfil', async (req, res) => {
  const { firebase_uid, nome, email, telefone } = req.body;
  try {
    const { error } = await supabase
      .from('users')
      .upsert([{ firebase_uid, nome, email, telefone }]);
    
    if (error) throw error;
    
    res.json({ message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

app.get('/perfil/:firebase_uid', async (req, res) => {
  const { firebase_uid } = req.params;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', firebase_uid)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    res.json(data || {});
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend Supabase rodando na porta ${PORT}`);
});