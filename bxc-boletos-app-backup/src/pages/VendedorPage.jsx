import { useState, useEffect, useRef } from 'react';
import {
  FaTrash, FaWallet, FaFileInvoiceDollar,
  FaList, FaCheck, FaHistory,
  FaExclamationTriangle, FaInfoCircle, FaTimes
} from 'react-icons/fa';
import HistoricoTransacoes from '../components/HistoricoTransacoes';
import {
  Card, CardHeader, CardTitle,
  CardDescription, CardContent
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Tabs, TabsList, TabsTrigger,
  TabsContent
} from '../components/ui/tabs';
import {
  Alert, AlertTitle, AlertDescription
} from '../components/ui/alert';
import Button from '../components/ui/button';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useUSDTConversion } from '../hooks/useUSDTConversion';
import { useBoletoEscrow } from '../hooks/useBoletoEscrow';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAuth } from '../components/auth/AuthProvider';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/dropdown-menu';
import { parseValorBRL } from '../lib/utils';
import ModernWalletConnector from '../components/wallet/ModernWalletConnector';
import { useParams, useNavigate } from 'react-router-dom';

function VendedorPage() {
  const { user } = useAuth();
  const { tab } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tab || 'cadastrar');
  const [formData, setFormData] = useState({
    cpfCnpj: '',
    codigoBarras: '',
    valor: '',
    dataVencimento: '',
    instituicao: ''
  });
  const [boletos, setBoletos] = useState([]);
  const [alertInfo, setAlertInfo] = useState(null);
  // Painel de debug
  const [debugBoleto, setDebugBoleto] = useState(null);
  const [debugUrl, setDebugUrl] = useState('');
  const wallet = useWalletConnection();
  const { taxaConversao, brlToUsdt, fetchTaxaConversao } = useUSDTConversion();
  const { travarBoleto } = useBoletoEscrow();
  const { openConnectModal } = useConnectModal();
  const intervalRef = useRef();
  const [success, setSuccess] = useState(false);
  const [buttonMessage, setButtonMessage] = useState('Cadastrar e Travar USDT');
  const [buttonError, setButtonError] = useState(false);
  const [showCotacao, setShowCotacao] = useState(false);

  // Função para abrir o modal de conexão da carteira
  const handleWalletConnection = () => {
    if (openConnectModal) openConnectModal();
  };

  // Função para buscar boletos do backend
  const fetchBoletos = async () => {
    if (!user?.uid) return;
    const url = `http://localhost:3001/boletos/usuario/${user.uid}`;
    setDebugUrl(url);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Erro ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setBoletos(data.map(boleto => ({
        ...boleto,
        numeroControle: boleto.numero_controle,
        codigoBarras: boleto.codigo_barras,
        cpfCnpj: boleto.cpf_cnpj,
        vencimento: boleto.vencimento,
        status: mapStatus(boleto.status)
      })));
    } catch (error) {
      console.error('Erro ao buscar boletos:', error);
      setBoletos([]);
      // Não mostrar alerta aqui para não poluir a interface
    }
  };

  useEffect(() => {
    if (user?.uid) fetchBoletos();
  }, [user]);

  useEffect(() => {
    // Atualiza cotação ao montar e a cada 60s
    fetchTaxaConversao();
    intervalRef.current = setInterval(fetchTaxaConversao, 60000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (tab && tab !== activeTab) setActiveTab(tab);
    // eslint-disable-next-line
  }, [tab]);

  useEffect(() => {
    // Atualiza o valorUSDT sempre que valor ou taxaConversao mudarem
    const taxaConversaoNum = Number(taxaConversao);
    const valorNum = Number(parseValorBRL(formData.valor));
    const valorValido = isFinite(valorNum) && valorNum > 0;
    const cotacaoValida = isFinite(taxaConversaoNum) && taxaConversaoNum > 0;
    if (showCotacao && valorValido && cotacaoValida) {
      setFormData((prev) => ({
        ...prev,
        valorUSDT: (valorNum / taxaConversaoNum).toFixed(2)
      }));
    } else if (!showCotacao) {
      setFormData((prev) => ({ ...prev, valorUSDT: '' }));
    }
  }, [formData.valor, taxaConversao, showCotacao]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'valor') {
      newValue = formatarMoeda(value);
      setShowCotacao(!!newValue && parseFloat(newValue.replace(/\D/g, '')) > 0);
    }
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  // Conversão robusta e logs para depuração
  const taxaConversaoNum = Number(taxaConversao);
  const valorNum = Number(parseValorBRL(formData.valor));
  const valorValido = isFinite(valorNum) && valorNum > 0;
  const cotacaoValida = isFinite(taxaConversaoNum) && taxaConversaoNum > 0;
  let valorUsdt = 0;
  if (cotacaoValida && valorValido) {
    valorUsdt = Number((valorNum / taxaConversaoNum).toFixed(2));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setButtonError(false);
    setButtonMessage('Cadastrando...');
    let errors = {};
    if (formData.cpfCnpj.length < 11) errors.cpfCnpj = 'CPF/CNPJ deve ter pelo menos 11 dígitos';
    if (formData.codigoBarras.length < 30) errors.codigoBarras = 'Código de barras deve ter pelo menos 30 caracteres';
    if (!valorValido) errors.valor = 'Valor deve ser maior que zero';
    if (!formData.dataVencimento) errors.dataVencimento = 'Data de vencimento é obrigatória';
    else if (new Date(formData.dataVencimento) < new Date()) errors.dataVencimento = 'Data de vencimento deve ser futura';
    if (!formData.instituicao.trim()) errors.instituicao = 'Instituição emissora é obrigatória';
    if (!wallet.isConnected) errors.wallet = 'Conecte sua carteira antes de travar o boleto';
    if (!user?.uid) errors.uid = 'Usuário não autenticado';
    if (!cotacaoValida) errors.cotacao = 'Cotação indisponível. Tente novamente em instantes.';
    if (!isFinite(valorUsdt) || valorUsdt <= 0) errors.usdt = 'Conversão para USDT inválida.';
    
    if (Object.keys(errors).length > 0) {
      setButtonError(true);
      setButtonMessage(Object.values(errors)[0]);
      setAlertInfo({
        type: 'destructive',
        title: 'Erro de validação',
        message: Object.values(errors)[0]
      });
      return;
    }
    const boletoObj = {
      user_id: user.uid,
      cpfCnpj: formData.cpfCnpj,
      codigoBarras: formData.codigoBarras,
      valor_brl: valorNum,
      valor_usdt: valorUsdt,
      valorUsdt: valorUsdt,
      vencimento: formData.dataVencimento,
      instituicao: formData.instituicao,
      status: 'DISPONIVEL',
      numeroControle: Date.now().toString()
    };
    setDebugBoleto(boletoObj);
    try {
      const resp = await fetch('http://localhost:3001/boletos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boletoObj)
      });
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${resp.status}: ${resp.statusText}`);
      }
      setButtonMessage('Boleto cadastrado e USDT travado!');
      setSuccess(true);
      setShowCotacao(false);
      setFormData({
        codigoBarras: '',
        cpfCnpj: '',
        valor: '',
        valorUSDT: '',
        dataVencimento: '',
        instituicao: '',
      });
      setAlertInfo({
        type: 'success',
        title: 'Cadastro realizado',
        message: 'Boleto cadastrado e USDT travado com sucesso!'
      });
      fetchBoletos();
      // Botão permanece desabilitado e com mensagem de sucesso
      setButtonError(false);
    } catch (error) {
      console.error('Erro detalhado:', error);
      let errorMessage = 'Erro ao cadastrar boleto';
      
      // Tratamento específico para diferentes tipos de erro
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Erro de conexão: Servidor não está respondendo. Verifique se o backend está rodando.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão: Não foi possível conectar ao servidor.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Erro de rede: Verifique sua conexão com a internet.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setButtonError(true);
      setButtonMessage(errorMessage);
      setAlertInfo({
        type: 'destructive',
        title: 'Erro de conexão',
        message: errorMessage
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const resp = await fetch(`http://localhost:3001/boletos/${id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Erro ao excluir boleto');
    setBoletos(boletos.filter((b) => b.id !== id));
    setAlertInfo({
      type: 'success',
      title: 'Boleto excluído',
      message: 'O boleto foi excluído com sucesso.'
    });
    } catch (e) {
      setAlertInfo({
        type: 'destructive',
        title: 'Erro ao excluir boleto',
        message: e.message
      });
    }
  };

  const handlePay = (boleto) => {
    const boletosAtualizados = boletos.map((b) =>
      b.id === boleto.id ? { ...b, status: 'BAIXADO' } : b
    );
    setBoletos(boletosAtualizados);
    setAlertInfo({
      type: 'success',
      title: 'Pagamento realizado',
      message: `O boleto ${boleto.numeroBoleto} foi pago com sucesso.`
    });
  };

  const formatarMoeda = (valor) => {
    let limpo = String(valor).replace(/\D/g, "");
    if (!limpo) return "0,00";
    limpo = limpo.replace(/^0+/, "");
    if (limpo.length === 0) limpo = "0";
    if (limpo.length === 1) return "0,0" + limpo;
    if (limpo.length === 2) return "0," + limpo;
    let inteiro = limpo.slice(0, -2);
    let centavos = limpo.slice(-2);
    inteiro = parseInt(inteiro, 10).toLocaleString("pt-BR");
    return `${inteiro},${centavos}`;
  };

  // Função robusta para formatar datas (sempre DD/MM/YYYY)
  const formatarData = (data) => {
    if (!data) return "-";
    try {
      // Trata string YYYY-MM-DD
      if (typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
        const [ano, mes, dia] = data.split("-");
        return `${dia}/${mes}/${ano}`;
      }
      // Trata string ISO completa ou objeto Date
      const d = new Date(data);
      if (!isNaN(d.getTime())) {
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const ano = d.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }
      return "Data inválida";
    } catch {
      return "Data inválida";
    }
  };

  // Função para cancelar boleto
  const handleCancelar = async (id) => {
    try {
      const resp = await fetch(`http://localhost:3001/boletos/${id}/cancelar`, { method: 'PATCH' });
      if (!resp.ok) throw new Error('Erro ao cancelar boleto');
      setBoletos(boletos.map(b =>
        b.id === id ? { ...b, status: 'EXCLUIDO' } : b
      ));
      setAlertInfo({
        type: 'success',
        title: 'Operação cancelada',
        message: 'O boleto foi cancelado e o valor será liberado para a carteira após autorização.'
      });
    } catch (e) {
      setAlertInfo({
        type: 'destructive',
        title: 'Erro ao cancelar boleto',
        message: e.message
      });
    }
  };

  // Função para baixar pagamento
  const handleBaixarPagamento = async (id) => {
    setAlertInfo({
      type: 'success',
      title: 'Pagamento baixado',
      message: 'O valor foi liberado para a carteira do vendedor (simulação).'
    });
    // Aqui pode-se integrar com smart contract/carteira
  };

  // Função para resetar o formulário e estado do botão
  const resetForm = () => {
    setFormData({
      cpfCnpj: '',
      codigoBarras: '',
      valor: '',
      valorUSDT: '',
      dataVencimento: '',
      instituicao: ''
    });
    setSuccess(false);
    setButtonError(false);
    setButtonMessage('Cadastrar e Travar USDT');
    setShowCotacao(false);
    setAlertInfo(null);
    // Limpar qualquer estado de debug
    setDebugBoleto(null);
  };

  // Funções de navegação para as rotas
  const goToTab = (tab) => {
    setActiveTab(tab);
    setSuccess(false);
    setAlertInfo(null);
    navigate(`/app/vendedor/${tab}`);
  };

  return (
    <div className="min-h-screen bg-lime-100 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-1">
        <div className="w-full max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 bg-green-800 text-white p-2 rounded-lg text-center">
            Portal do Vendedor
          </h1>
          <Tabs value={activeTab} onValueChange={goToTab} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-3 bg-lime-100 p-1 rounded-xl mb-2">
              <TabsTrigger value="cadastrar" className="flex items-center justify-center text-lg font-bold py-3 h-12 data-[state=active]:bg-lime-600 data-[state=active]:text-white">
                <FaFileInvoiceDollar className="mr-2" /> Cadastrar
              </TabsTrigger>
              <TabsTrigger value="listar" className="flex items-center justify-center text-lg font-bold py-3 h-12 data-[state=active]:bg-lime-600 data-[state=active]:text-white">
                <FaList className="mr-2" /> Meus Boletos
              </TabsTrigger>
              <TabsTrigger value="historico" className="flex items-center justify-center text-lg font-bold py-3 h-12 data-[state=active]:bg-lime-600 data-[state=active]:text-white">
                <FaHistory className="mr-2" /> Histórico
              </TabsTrigger>
            </TabsList>
            <TabsContent value="cadastrar">
              <Card>
                <CardHeader className="bg-green-800 text-white">
                  <CardTitle className="text-xl">Cadastrar Boleto</CardTitle>
                  <CardDescription className="text-white">Cadastre um novo boleto para venda</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3 items-start w-full">
                    <div className="flex flex-col gap-1 w-full">
                      <label htmlFor="codigoBarras" className="font-semibold text-green-900">Código de Barras</label>
                      <Input id="codigoBarras" name="codigoBarras" type="text" value={formData.codigoBarras} onChange={handleChange} maxLength={48} required className="w-full tracking-widest" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="cpfCnpj" className="font-semibold text-green-900">CPF/CNPJ do Beneficiário</label>
                      <Input id="cpfCnpj" name="cpfCnpj" type="text" value={formData.cpfCnpj} onChange={handleChange} maxLength={14} required className="w-72" />
                    </div>
                    <div className="flex flex-row gap-4">
                      {/* Campo Valor (R$) */}
                      <div className="flex flex-col gap-1">
                        <label htmlFor="valor" className="font-semibold text-green-900">Valor (R$)</label>
                        <Input id="valor" name="valor" type="text" value={formData.valor} onChange={handleChange} required className="w-48" autoComplete="off" />
                      </div>
                      {/* Exibe cotação e campo USDT apenas se showCotacao for true */}
                      {showCotacao && (
                        <div className="flex flex-col gap-1">
                          <label htmlFor="valorUSDT" className="font-semibold text-green-900">Valor (USDT)</label>
                          <Input id="valorUSDT" name="valorUSDT" type="text" value={formData.valorUSDT} readOnly className="w-48 bg-gray-100" />
                          <span className="text-xs text-gray-500 mt-1">Cotação atualizada: 1 USDT = {taxaConversao ? taxaConversao : '--'} BRL</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="dataVencimento" className="font-semibold text-green-900">Data de Vencimento</label>
                      <Input id="dataVencimento" name="dataVencimento" type="date" value={formData.dataVencimento} onChange={handleChange} required className="w-48" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="instituicao" className="font-semibold text-green-900">Instituição Emissora</label>
                      <Input id="instituicao" name="instituicao" type="text" value={formData.instituicao} onChange={handleChange} required className="w-72" />
                    </div>
                  </form>
                </CardContent>
              </Card>
              <div className="flex w-full max-w-4xl mx-auto gap-2 mt-4">
                <button
                  type="button"
                  onClick={openConnectModal}
                  className={`w-1/3 font-bold rounded-xl text-lg h-12 py-3 px-2 flex items-center justify-center transition ${wallet.isConnected ? 'bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  disabled={wallet.isConnected}
                >
                  {wallet.isConnected
                    ? `Conectado: ${wallet.address ? wallet.address.slice(0,6) + '...' + wallet.address.slice(-4) : ''}`
                    : 'Conectar Carteira'}
                </button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  variant={success ? 'success' : buttonError ? 'danger' : 'blue'}
                  disabled={!wallet.isConnected || !cotacaoValida || !valorValido || success || buttonError}
                  size="lg"
                  className={`w-1/3 font-bold rounded-xl text-lg h-12 py-3 px-2 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed ${success ? 'bg-green-600 hover:bg-green-700 whitespace-pre-line' : ''}`}
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {buttonMessage}
                </Button>
                <button
                  type="button"
                  className="w-1/3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-lg h-12 py-3 px-2 flex items-center justify-center border border-gray-300 transition"
                  onClick={() => {
                    resetForm();
                    navigate('/');
                  }}
                >
                  Voltar ao Início
                </button>
              </div>
                  {alertInfo && (
                    <Alert variant={alertInfo.type} className="mt-4 max-w-[320px] text-left" onClick={() => setAlertInfo(null)}>
                      <div className="flex flex-col items-start gap-2">
                        {alertInfo.type === 'destructive' && <FaExclamationTriangle className="h-5 w-5 mb-1" />}
                        {alertInfo.type === 'success' && <FaCheck className="h-5 w-5 mb-1" />}
                        {alertInfo.type === 'default' && <FaInfoCircle className="h-5 w-5 mb-1" />}
                        <div>
                          <AlertTitle>{alertInfo.title}</AlertTitle>
                          <AlertDescription className="whitespace-pre-line mt-1">{alertInfo.message}</AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  )}
            </TabsContent>
            <TabsContent value="listar">
              {/* Listagem de boletos do vendedor - pode ser adaptada conforme padrão Comprador */}
              <Card>
                <CardHeader className="bg-green-800 text-white">
                  <CardTitle className="text-xl">Meus Boletos</CardTitle>
                  <CardDescription className="text-white">Todos os boletos cadastrados por você</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Tabela de boletos */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse bg-white rounded-lg overflow-hidden">
                      <thead className="bg-lime-600 text-white">
                        <tr>
                          <th className="py-3 px-4 text-left">Nº Controle</th>
                          <th className="py-3 px-4 text-left">Código de Barras</th>
                          <th className="py-3 px-4 text-left">Valor (R$)</th>
                          <th className="py-3 px-4 text-left">Valor (USDT)</th>
                          <th className="py-3 px-4 text-left">Vencimento</th>
                          <th className="py-3 px-4 text-left">Status</th>
                          <th className="py-3 px-4 text-left">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boletos.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                              Nenhum boleto cadastrado.
                            </td>
                          </tr>
                        ) : (
                          boletos.map((boleto) => (
                            <tr key={boleto.numeroControle} className="border-b border-gray-200 hover:bg-lime-50">
                              <td className="py-3 px-4">{boleto.numeroControle}</td>
                              <td className="py-3 px-4">{boleto.codigoBarras}</td>
                              <td className="py-3 px-4">R$ {(boleto.valor_brl !== undefined && boleto.valor_brl !== null) ? boleto.valor_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--'}</td>
                              <td className="py-3 px-4">{boleto.valor_usdt} USDT</td>
                              <td className="py-3 px-4">{formatarData(boleto.vencimento)}</td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {boleto.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 flex gap-2">
                                <button onClick={() => handleDelete(boleto.id)} className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-xs flex items-center gap-1"><FaTrash /> Excluir</button>
                                <button onClick={() => handlePay(boleto)} className="bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded text-xs flex items-center gap-1"><FaCheck /> Baixar</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="historico">
              <Card>
                <CardHeader className="bg-green-800 text-white">
                  <CardTitle className="text-xl">Histórico de Transações</CardTitle>
                  <CardDescription className="text-white">Registro de todas as suas transações</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <HistoricoTransacoes userId={user?.uid} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function mapStatus(status) {
  switch ((status || '').toLowerCase()) {
    case 'pendente': return 'DISPONIVEL';
    case 'pago': return 'BAIXADO';
    case 'reservado': return 'AGUARDANDO PAGAMENTO';
    case 'cancelado': return 'EXCLUIDO';
    default: return status ? status.toUpperCase() : status;
  }
}

export default VendedorPage;
