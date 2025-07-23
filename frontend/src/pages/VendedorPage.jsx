import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FaTrash, FaWallet, FaFileInvoiceDollar,
  FaList, FaCheck, FaHistory,
  FaExclamationTriangle, FaInfoCircle, FaTimes, FaHandPointer,
  FaUpload, FaTimesCircle, FaFilePdf
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
import StatusBadge from '../components/ui/status-badge';
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
  const wallet = useWalletConnection();
  const { taxaConversao, brlToUsdt, fetchTaxaConversao } = useUSDTConversion();
  const { travarBoleto, liberarBoleto } = useBoletoEscrow();
  const { openConnectModal } = useConnectModal();
  const intervalRef = useRef();
  const [success, setSuccess] = useState(false);
  const [buttonMessage, setButtonMessage] = useState('Cadastrar e Travar USDT');
  const [buttonError, setButtonError] = useState(false);
  const [showCotacao, setShowCotacao] = useState(false);
  const [dropdownSide, setDropdownSide] = useState({});
  const [processandoBaixa, setProcessandoBaixa] = useState(false);
  const [boletoParaBaixar, setBoletoParaBaixar] = useState(null);
  const [showWalletInput, setShowWalletInput] = useState(false);
  const [walletAddressInput, setWalletAddressInput] = useState('');
  const [boletoParaInput, setBoletoParaInput] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [showComprovanteModal, setShowComprovanteModal] = useState(false);
  const [selectedComprovante, setSelectedComprovante] = useState(null);

  // Função para abrir o modal de conexão da carteira
  const handleWalletConnection = () => {
    if (openConnectModal) openConnectModal();
  };

  // Função para buscar boletos do backend
  const fetchBoletos = async () => {
    if (!user?.uid) return;
    const url = `http://localhost:3001/boletos/usuario/${user.uid}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Erro ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      
      const boletosMapeados = data.map(boleto => {
        const statusMapeado = mapStatus(boleto.status);
        
        return {
          ...boleto,
          numeroControle: boleto.numero_controle,
          codigoBarras: boleto.codigo_barras,
          cpfCnpj: boleto.cpf_cnpj,
          vencimento: boleto.vencimento,
          status: statusMapeado,
          comprovante_url: boleto.comprovante_url // Garantir que o campo está presente
        };
      });
      
      setBoletos(boletosMapeados);
    } catch (error) {
      console.error('Erro ao buscar boletos:', error);
      setBoletos([]);
      // Não mostrar alerta aqui para não poluir a interface
    }
  };

  // Monitorar mudanças no selectedComprovante e showComprovanteModal
  useEffect(() => {
    if (showComprovanteModal && selectedComprovante) {
    }
  }, [showComprovanteModal, selectedComprovante]);

  useEffect(() => {
    if (user?.uid) fetchBoletos();
  }, [user]);

  // Monitorar estado inicial da carteira
  useEffect(() => {
  }, []);

  // Monitorar mudanças na carteira
  useEffect(() => {
    
    // Se estava processando baixa e agora a carteira está conectada, continuar automaticamente
    if (processandoBaixa && boletoParaBaixar && wallet.isConnected && wallet.address) {
      setProcessandoBaixa(false);
      setBoletoParaBaixar(null);
      
      setTimeout(() => {
        processarBaixaBoleto(boletoParaBaixar);
      }, 2000);
    }
  }, [wallet.isConnected, wallet.address, wallet.chainId, wallet.chain, processandoBaixa, boletoParaBaixar]);

  // Timeout de segurança para limpar estado se conexão não acontecer
  useEffect(() => {
    if (processandoBaixa && boletoParaBaixar) {
      const timeout = setTimeout(() => {
        if (!wallet.isConnected) {
          setProcessandoBaixa(false);
          setBoletoParaBaixar(null);
          setAlertInfo({
            type: 'destructive',
            title: 'Timeout de conexão',
            description: 'Tempo limite excedido para conexão da carteira. Tente novamente.'
          });
          setTimeout(() => setAlertInfo(null), 5000);
        }
      }, 30000); // 30 segundos

      return () => clearTimeout(timeout);
    }
  }, [processandoBaixa, boletoParaBaixar, wallet.isConnected]);

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

  // Função para calcular valor líquido (95% do valor USDT)
  const calcularValorLiquido = (valorUsdt) => {
    return valorUsdt !== undefined && valorUsdt !== null ? (Number(valorUsdt) * 0.95).toFixed(2) : '--';
  };

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
    
    // Validação mais rigorosa da carteira
    if (!wallet.isConnected || !wallet.address) {
      errors.wallet = 'Conecte sua carteira antes de travar o boleto';
    } else {
    }
    
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
  const handleCancelar = async (boleto) => {
    
    try {
      // O backend espera o ID do boleto, não o numero_controle
      const boletoId = boleto.id;
      if (!boletoId) {
        throw new Error('ID do boleto não encontrado');
      }
      
      const url = `http://localhost:3001/boletos/${boletoId}/cancelar`;
      const payload = { 
        user_id: user.uid
      };
      
      const resp = await fetch(url, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${resp.status}: ${resp.statusText}`);
      }
      
      const result = await resp.json();
      
      // Atualizar a lista de boletos
      await fetchBoletos();
      
      setAlertInfo({
        type: 'success',
        title: 'Boleto cancelado',
        message: 'O boleto foi cancelado com sucesso.'
      });
      setTimeout(() => setAlertInfo(null), 3000);
    } catch (e) {
      console.error('Erro ao cancelar boleto:', e);
      setAlertInfo({
        type: 'destructive',
        title: 'Erro ao cancelar boleto',
        message: e.message || 'Não foi possível cancelar o boleto.'
      });
      setTimeout(() => setAlertInfo(null), 5000);
    }
  };

  // Função para baixar pagamento
  const handleBaixarPagamento = async (boleto) => {
    
    // Verificar se a carteira está conectada
    if (!wallet.isConnected || !wallet.address) {
      setBoletoParaBaixar(boleto);
      setProcessandoBaixa(true);
      
      // Abrir modal de conexão automaticamente
      if (openConnectModal) {
        openConnectModal();
      } else {
        alert('Erro ao abrir modal de conexão. Tente conectar a carteira manualmente.');
        return;
      }
      return;
    }

    // Se a carteira já está conectada, processar diretamente
    await processarBaixaBoleto(boleto);
  };

  const handleVisualizarBoleto = (boleto) => {
    
          if (boleto.comprovante_url) {
        // Verificar se é URL de exemplo
        if (boleto.comprovante_url.includes('exemplo.com')) {
          setAlertInfo({
            type: 'destructive',
            title: 'URL de Exemplo Detectada',
            description: 'Este comprovante contém uma URL de exemplo. Entre em contato com o suporte.'
          });
          setTimeout(() => setAlertInfo(null), 5000);
          return;
        }

      // Verificar se é base64 válido
      if (boleto.comprovante_url.startsWith('data:')) {
        const base64Data = boleto.comprovante_url.split(',')[1];
        if (!base64Data || base64Data.length < 100) {
          setAlertInfo({
            type: 'destructive',
            title: 'Comprovante inválido',
            description: 'O arquivo do comprovante parece estar corrompido ou incompleto.'
          });
          setTimeout(() => setAlertInfo(null), 3000);
          return;
        }
      }

      // Verificar se é URL válida
      if (boleto.comprovante_url.startsWith('http')) {
        try {
          new URL(boleto.comprovante_url);
        } catch (e) {
          setAlertInfo({
            type: 'destructive',
            title: 'URL inválida',
            description: 'A URL do comprovante não é válida.'
          });
          setTimeout(() => setAlertInfo(null), 3000);
          return;
        }
      }

      setSelectedComprovante(boleto);
      setShowComprovanteModal(true);
    } else {
      setAlertInfo({
        type: 'destructive',
        title: 'Comprovante não disponível',
        description: 'Comprovante não disponível para este boleto.'
      });
      setTimeout(() => setAlertInfo(null), 3000);
    }
  };

  // Função separada para processar a baixa do boleto
  const processarBaixaBoleto = async (boleto) => {
    
    // Verificar se está na rede correta
    if (wallet.chainId !== 80002) {
      setAlertInfo({
        type: 'destructive',
        title: 'Rede incorreta',
        description: 'Para usar o BoletoXCrypto, você precisa estar na rede Polygon Amoy. Troque de rede na sua carteira.'
      });
      setTimeout(() => setAlertInfo(null), 5000);
      return;
    }

    // Verificar se o boleto tem status "AGUARDANDO BAIXA"
    if (boleto.status !== 'AGUARDANDO BAIXA') {
      setAlertInfo({
        type: 'destructive',
        title: 'Status inválido',
        description: 'Só é possível baixar boletos com status "AGUARDANDO BAIXA".'
      });
      setTimeout(() => setAlertInfo(null), 3000);
      return;
    }

    // Verificar se há endereço do comprador
    if (!boleto.wallet_address) {
      setAlertInfo({
        type: 'destructive',
        title: 'Dados incompletos',
        description: 'Endereço da carteira do comprador não encontrado.'
      });
      setTimeout(() => setAlertInfo(null), 3000);
      return;
    }

    setAlertInfo({
      type: 'default',
      title: 'Baixando boleto...',
      description: 'Aguarde enquanto processamos a baixa do boleto e liberamos os USDT para o comprador.'
    });

    try {
      
      // Primeiro, liberar os USDT do contrato inteligente para o COMPRADOR
      const result = await liberarBoleto({
        boletoId: boleto.numeroControle || boleto.numero_controle,
        enderecoComprador: boleto.wallet_address, // Endereço do COMPRADOR
        enderecoVendedor: wallet.address // Endereço do vendedor (para validação)
      });
      
      if (!result.success) {
        throw new Error('Falha ao liberar USDT do contrato para o comprador');
      }

      // Depois, chamar o backend para baixar o boleto
      const response = await fetch(`http://localhost:3001/boletos/${boleto.numeroControle || boleto.numero_controle}/baixar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.uid,
          wallet_address_vendedor: wallet.address,
          wallet_address_comprador: boleto.wallet_address,
          tx_hash: result.txHash
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      setAlertInfo({
        type: 'success',
        title: 'Boleto baixado com sucesso!',
        description: `USDT liberados para o comprador (${boleto.wallet_address.substring(0, 6)}...${boleto.wallet_address.substring(boleto.wallet_address.length - 4)}). TX: ${result.txHash.substring(0, 10)}...`
      });
      setTimeout(() => setAlertInfo(null), 5000);

      // Atualizar a lista de boletos
      await fetchBoletos();

    } catch (error) {
      console.error('Erro ao baixar boleto:', error);
      setAlertInfo({
        type: 'destructive',
        title: 'Erro ao baixar boleto',
        description: error.message || 'Não foi possível baixar o boleto. Tente novamente.'
      });
      setTimeout(() => setAlertInfo(null), 5000);
    }
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
  };

  // Funções de navegação para as rotas
  const goToTab = (tab) => {
    setActiveTab(tab);
    setSuccess(false);
    setAlertInfo(null);
    navigate(`/app/vendedor/${tab}`);
  };

  return (
    <div className="min-h-screen bg-lime-300 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-1">
        <div className="w-full max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 bg-green-800 text-white p-2 rounded-lg text-center">
            Portal do Vendedor
          </h1>
          
          {/* Status da Carteira */}
          {wallet.isConnected && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">Carteira Conectada</span>
                </div>
                <div className="text-xs text-green-600">
                  {wallet.address?.substring(0, 6)}...{wallet.address?.substring(wallet.address.length - 4)}
                </div>
              </div>
              <div className="mt-1 text-xs text-green-600">
                Rede: {wallet.chain?.name || 'Desconhecida'} 
                {wallet.chainId !== 80002 && (
                  <span className="ml-2 text-orange-600 font-medium">
                    ⚠️ Troque para Polygon Amoy
                  </span>
                )}
              </div>
            </div>
          )}
          

          
          <Tabs value={activeTab} onValueChange={goToTab} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-3 bg-lime-300 p-1 rounded-xl mb-2">
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
              {/* Tabela de boletos */}
              <Card>
                <CardHeader className="bg-green-800 text-white">
                  <CardTitle className="text-xl">Meus Boletos</CardTitle>
                  <CardDescription className="text-white">
                    Todos os boletos cadastrados por você. Boletos com status "AGUARDANDO BAIXA" podem ser baixados manualmente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Tabela de boletos */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse bg-white rounded-lg overflow-hidden">
                      <thead className="bg-lime-600 text-white">
                        <tr>
                          <th className="py-3 px-4 text-left">Nº Boleto</th>
                          <th className="py-3 px-4 text-left">CPF/CNPJ Beneficiário</th>
                          <th className="py-3 px-4 text-left">Valor (R$)</th>
                          <th className="py-3 px-4 text-left">Valor (USDT)</th>
                          <th className="py-3 px-4 text-left">Data Vencimento</th>
                          <th className="py-3 px-4 text-left">Status</th>
                          <th className="py-3 px-4 text-left">Comprador</th>
                          <th className="py-3 px-6 text-left w-44">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boletos.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="py-4 px-4 text-center text-gray-500">
                              Nenhum boleto cadastrado.
                            </td>
                          </tr>
                        ) : (
                          boletos.map((boleto, idx) => {
                            return (
                              <tr key={boleto.numeroControle} className="border-b border-gray-200 hover:bg-lime-50">
                                <td className="py-3 px-4">{boleto.numeroControle}</td>
                                <td className="py-3 px-4">{boleto.cpfCnpj || '--'}</td>
                                <td className="py-3 px-4">R$ {(boleto.valor_brl !== undefined && boleto.valor_brl !== null) ? boleto.valor_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--'}</td>
                                <td className="py-3 px-4">{boleto.valor_usdt !== undefined ? Number(boleto.valor_usdt).toFixed(2) : '--'} USDT</td>
                                <td className="py-3 px-4">{formatarData(boleto.vencimento)}</td>
                                <td className="py-3 px-4">
                                  <StatusBadge status={boleto.status} />
                                </td>
                                <td className="py-3 px-4">
                                  {boleto.wallet_address ? (
                                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                      {boleto.wallet_address.substring(0, 6)}...{boleto.wallet_address.substring(boleto.wallet_address.length - 4)}
                                    </span>
                                  ) : (
                                    '--'
                                  )}
                                </td>
                                <td className="py-3 px-6 w-44 flex gap-2">
                                  <DropdownMenu open={dropdownOpen[boleto.numeroControle] || false} onOpenChange={(open) => setDropdownOpen(prev => ({ ...prev, [boleto.numeroControle]: open }))}>
                                    <DropdownMenuTrigger asChild>
                                      <button className="px-3 py-1 text-xs font-bold rounded bg-blue-600 hover:bg-blue-700 text-white">
                                        Ações
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      {/* Opção para visualizar comprovante - sempre disponível se houver comprovante */}
                                      {boleto.comprovante_url && (
                                        <DropdownMenuItem 
                                          onClick={() => {
                                            handleVisualizarBoleto(boleto);
                                          }}
                                        >
                                          Visualizar Comprovante
                                        </DropdownMenuItem>
                                      )}
                                      
                                      {/* Opção para baixar boleto - apenas para AGUARDANDO BAIXA */}
                                      {boleto.status === 'AGUARDANDO BAIXA' && (
                                        <DropdownMenuItem 
                                          onClick={() => {
                                            handleBaixarPagamento(boleto);
                                          }}
                                        >
                                          Baixar boleto
                                        </DropdownMenuItem>
                                      )}
                                      
                                      {/* Opção para cancelar boleto - apenas para DISPONIVEL */}
                                      {boleto.status === 'DISPONIVEL' && (
                                        <DropdownMenuItem 
                                          onClick={() => {
                                            if (window.confirm('Deseja realmente cancelar este boleto? Esta ação não pode ser desfeita.')) {
                                              handleCancelar(boleto);
                                              setDropdownOpen(prev => ({ ...prev, [boleto.numeroControle]: false }));
                                            }
                                          }}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          Cancelar Boleto
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            );
                          })
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
      
      {/* Modal do Comprovante */}
      {showComprovanteModal && selectedComprovante && (() => {
        return createPortal(
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-[9998]"
            onClick={() => {
              setShowComprovanteModal(false);
              setSelectedComprovante(null);
            }}
          />
          <div
            className="fixed top-1/2 left-1/2 z-[9999] w-[90%] max-w-5xl h-[85vh] flex flex-col text-gray-800 shadow-2xl rounded-2xl border border-green-700"
            style={{
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#bef264'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Cabeçalho - Fixo */}
            <div className="px-6 pt-6 pb-4 border-b border-green-700 flex items-center justify-between bg-green-50 rounded-t-2xl flex-shrink-0">
              <h2 className="text-2xl font-bold text-green-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <FaUpload className="text-white text-lg" />
                </div>
                Comprovante de Pagamento do Boleto {selectedComprovante.numeroControle}
              </h2>
              <button
                onClick={() => {
                  setShowComprovanteModal(false);
                  setSelectedComprovante(null);
                }}
                className="text-gray-500 hover:text-red-600 transition-colors duration-200 p-2 rounded-full hover:bg-red-50"
                title="Fechar"
              >
                <FaTimesCircle size={24} />
              </button>
            </div>
            
            {/* Conteúdo - Sem scroll externo */}
            <div className="flex-1 px-6 py-4">
              {/* Informações do Boleto - Compactas */}
              <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-lime-50 rounded-lg border border-green-200">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-green-700 mb-1">Nº Boleto</div>
                    <div className="text-gray-800 font-mono">{selectedComprovante.numeroControle}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-700 mb-1">Valor</div>
                    <div className="text-gray-800 font-semibold">R$ {Number(selectedComprovante.valor_brl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-700 mb-1">Status</div>
                    <div className="text-gray-800">{selectedComprovante.status}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-700 mb-1">Vencimento</div>
                    <div className="text-gray-800">{formatarData(selectedComprovante.vencimento)}</div>
                  </div>
                </div>
              </div>
              
              {/* Visualização do Comprovante - Priorizada */}
              <div className="bg-white rounded-lg border border-green-200 shadow-sm">
                {/* Área principal do arquivo - Com scroll interno */}
                <div className="p-4">
                  <div className="border border-green-200 rounded-lg overflow-y-auto overflow-x-hidden bg-white" style={{ height: 'calc(100vh - 450px)', minHeight: '350px' }}>
                    {(() => {
                      
                      if (selectedComprovante.comprovante_url && selectedComprovante.comprovante_url.startsWith('data:')) {
                        // Se for base64, mostrar em iframe ou imagem
                        if (selectedComprovante.comprovante_url.startsWith('data:image/')) {
                          return (
                            <img
                              src={selectedComprovante.comprovante_url}
                              alt="Comprovante de Pagamento"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                              }}
                              onLoad={() => {
                              }}
                            />
                          );
                        } else if (selectedComprovante.comprovante_url.startsWith('data:application/pdf')) {
                          // Fallback: tentar iframe e, se falhar, usar <object>
                          return (
                            <>
                              <iframe
                                src={selectedComprovante.comprovante_url.replace(/\n/g, '')}
                                className="w-full h-full"
                                title="Comprovante de Pagamento"
                                onError={(e) => {
                                  document.getElementById('pdf-fallback').style.display = 'block';
                                }}
                              />
                              <object
                                id="pdf-fallback"
                                data={selectedComprovante.comprovante_url.replace(/\n/g, '')}
                                type="application/pdf"
                                className="w-full h-full"
                                style={{ display: 'none' }}
                              >
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                  <p className="text-gray-500">Não foi possível exibir o comprovante PDF. Baixe o arquivo ou tente em outro navegador.</p>
                                </div>
                              </object>

                            </>
                          );
                        }
                      } else if (selectedComprovante.comprovante_url && selectedComprovante.comprovante_url.startsWith('http')) {
                        // Se for URL externa, usar iframe
                        return (
                          <iframe
                            src={selectedComprovante.comprovante_url}
                            className="w-full h-full"
                            title="Comprovante de Pagamento"
                            onError={(e) => {
                            }}
                            onLoad={() => {
                            }}
                          />
                        );
                      } else {
                                                  return (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <p className="text-gray-500">Arquivo não disponível</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Rodapé - Fixo */}
            <div className="p-4 border-t border-green-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
              {/* Botão BAIXAR PDF - Fixo */}
              {selectedComprovante.comprovante_url && (
                <div className="mb-3 flex justify-center">
                  <a
                    href={selectedComprovante.comprovante_url.replace(/\n/g, '')}
                    download={`comprovante-${selectedComprovante.numeroControle || selectedComprovante.numero_controle || 'boleto'}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold px-6 py-3 rounded-lg text-sm transition-colors duration-200"
                    style={{ backgroundColor: '#fecaca !important', color: '#b91c1c !important' }}
                  >
                    <FaFilePdf className="text-sm" style={{ color: '#b91c1c !important' }} />
                    BAIXAR PDF
                  </a>
                </div>
              )}
              
              {/* Botão FECHAR */}
              <button
                onClick={() => {
                  setShowComprovanteModal(false);
                  setSelectedComprovante(null);
                }}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm transition-colors duration-200"
              >
                <FaTimesCircle className="text-sm" /> 
                FECHAR
              </button>
            </div>
          </div>
        </>,
        document.body
      );
      })()}
    </div>
  );
}

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



export default VendedorPage;
