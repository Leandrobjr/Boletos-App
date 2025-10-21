import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import {
  FaTrash, FaWallet, FaFileInvoiceDollar,
  FaList, FaCheck, FaHistory,
  FaExclamationTriangle, FaInfoCircle, FaTimes, FaHandPointer,
  FaUpload, FaTimesCircle, FaFilePdf, FaUnlock
} from 'react-icons/fa';
// Lazy loading para componentes pesados
const HistoricoTransacoes = lazy(() => import('../components/HistoricoTransacoes'));
// Componentes de teste removidos para limpeza
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
import Button from '../components/ui/Button';
import { useUSDTConversion } from '../hooks/useUSDTConversion';
import { useAuth } from '../components/auth/AuthProvider';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/dropdown-menu';
import { parseValorBRL } from '../lib/utils';
import StatusBadge from '../components/ui/status-badge';
import { useParams, useNavigate } from 'react-router-dom';
import BalanceRefresher from '../components/BalanceRefresher';
import { buildApiUrl, apiRequest } from '../config/apiConfig';
// Hook corrigido - sem endereços hardcoded
import { useBoletoEscrowFixed } from '../hooks/useBoletoEscrowFixed';

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
  const { taxaConversao, brlToUsdt, fetchTaxaConversao } = useUSDTConversion();
  const { 
    createEscrowForSeller: createEscrow, 
    registerBuyer,
    releaseEscrow,
    connectWallet,
    withdrawProtocolEarnings,
    isLoading, 
    error: escrowError,
    isConnected,
    address,
    networkCorrect,
    ownerAddress
  } = useBoletoEscrowFixed();
  
  // Estados de conexão da carteira (agora vêm do hook)
  
  // Função para conectar carteira (agora vem do hook)
  
  // Hook corrigido não precisa de checkConnection
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
  const [destravamentoTimer, setDestravamentoTimer] = useState(null);
  const [loadingBoletos, setLoadingBoletos] = useState(false);
  const isOwner = useMemo(() => {
    if (!address) return false;
    const addr = address.toLowerCase();
    const knownOwner = '0x9950764ad4548e9106e3106c954a87d8b3cf64a7';
    if (addr === knownOwner) return true;
    return ownerAddress && ownerAddress.toLowerCase() === addr;
  }, [ownerAddress, address]);

  const handleWithdrawFees = async () => {
    try {
      setAlertInfo({ type: 'info', title: 'Coletando taxas', message: 'Executando saque de taxas acumuladas...' });
      const res = await withdrawProtocolEarnings();
      if (!res?.success) throw new Error(res?.error || 'Falha ao sacar taxas');
      setAlertInfo({ type: 'success', title: 'Taxas coletadas', message: `TX: ${res.txHash.substring(0,10)}...` });
    } catch (e) {
      setAlertInfo({ type: 'destructive', title: 'Erro ao coletar taxas', message: e.message });
    } finally {
      setTimeout(() => setAlertInfo(null), 6000);
    }
  };

  // Função para abrir o modal de conexão da carteira
  const handleWalletConnection = () => {
    connectWallet();
  };

  // Função para buscar boletos do backend (OTIMIZADA)
  const fetchBoletos = async () => {
    console.log('🚀 [DEBUG] fetchBoletos chamada, user:', user?.uid);
    if (!user?.uid) {
      console.log('❌ [DEBUG] Sem usuário, retornando');
      return;
    }
    
    setLoadingBoletos(true);
    try {
      console.log('🔍 [VENDEDOR] Buscando boletos para usuário:', user.uid);
      
      // SEMPRE FORÇAR REQUISIÇÃO FRESCA - SEM CACHE
      const timestamp = Date.now();
      const res = await fetch(buildApiUrl(`/boletos/usuario/${user.uid}?t=${timestamp}`), {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!res.ok) {
        throw new Error(`Erro ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      
      // Verificar se data tem a propriedade 'data' (array de boletos)
      const boletosArray = data.data || data;
      
      const boletosMapeados = boletosArray.map(boleto => {
        const statusMapeado = mapStatus(boleto.status);
        
      return {
  ...boleto,
  numeroControle: boleto.numero_controle,
  codigoBarras: boleto.codigo_barras,
  cpfCnpj: boleto.cpf_cnpj,
  vencimento: boleto.vencimento,
  valor: boleto.valor_brl || boleto.valor || 0,
  valor_usdt: boleto.valor_usdt || 0,
  status: statusMapeado,
  comprovante_url: boleto.comprovante_url,
  comprovanteUrl: boleto.comprovante_url || boleto.comprovanteUrl,
  comprovante: boleto.comprovante_url || boleto.comprovanteUrl || boleto.comprovante,
  comprador_id: boleto.comprador_id,
  escrow_id: boleto.escrow_id || boleto.escrowId || null,
  tx_hash: boleto.tx_hash || boleto.txHash || null,
  wallet_address: boleto.wallet_address || boleto.walletAddress
};      
      setBoletos(boletosMapeados);
      setBoletosCache(boletosMapeados); // Atualizar cache
    } catch (error) {
      console.error('Erro ao buscar boletos:', error);
      setBoletos([]);
      // Não mostrar alerta aqui para não poluir a interface
    } finally {
      setLoadingBoletos(false);
    }
  };

  // Monitorar mudanças no selectedComprovante e showComprovanteModal
  useEffect(() => {
    if (showComprovanteModal && selectedComprovante) {
    }
  }, [showComprovanteModal, selectedComprovante]);

  // Cache de boletos para evitar requisições desnecessárias (ULTRA OTIMIZADO)
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [boletosCache, setBoletosCache] = useState(null);
  const CACHE_DURATION = 0; // CACHE DESABILITADO TEMPORARIAMENTE PARA DEBUG
  
  // LIMPAR TODO O CACHE LOCAL DO VENDEDOR
  useEffect(() => {
    localStorage.removeItem('boletosCache');
    sessionStorage.removeItem('boletosCache');
    localStorage.removeItem('vendedorBoletosCache');
    sessionStorage.removeItem('vendedorBoletosCache');
    console.log('🧹 [VENDEDOR] Cache local limpo completamente');
  }, []);
  
  // Preload de dados quando usuário loga
  useEffect(() => {
    if (user?.uid) {
      // Preload silencioso em background
      fetchBoletosOptimized();
    }
  }, [user?.uid]);

  // Função otimizada para buscar boletos com cache (ULTRA OTIMIZADA)
  const fetchBoletosOptimized = async (forceRefresh = false) => {
    if (!user?.uid) return;
    
    const now = Date.now();
    // SEMPRE FORÇAR REQUISIÇÃO REAL - CACHE DESABILITADO
    console.log('🔄 [VENDEDOR] Forçando requisição real ao backend (cache desabilitado)');
    
    await fetchBoletos();
    setLastFetchTime(now);
    
    // Não atualizar cache - sempre buscar dados frescos
    setBoletosCache(null);
  };

  useEffect(() => {
    if (user?.uid) fetchBoletosOptimized();
  }, [user?.uid]);

  // Monitorar boletos para destravamento automático
  useEffect(() => {
    if (boletos.length > 0) {
      // Verificar apenas boletos que estão AGUARDANDO PAGAMENTO há mais de 60 minutos
      verificarBoletosParaDestravar();
      
      // Configurar verificação periódica a cada 5 minutos
      const interval = setInterval(() => {
        verificarBoletosParaDestravar();
      }, 5 * 60 * 1000); // 5 minutos
      
      return () => clearInterval(interval);
    }
  }, [boletos]);

  // Limpar timer quando componente for desmontado
  useEffect(() => {
    return () => {
      if (destravamentoTimer) {
        clearInterval(destravamentoTimer);
      }
    };
  }, [destravamentoTimer]);

  // Monitorar estado inicial da carteira
  useEffect(() => {
  }, []);

  // Monitorar mudanças na carteira
  useEffect(() => {
    
    // Se estava processando baixa e agora a carteira está conectada, continuar automaticamente
    if (processandoBaixa && boletoParaBaixar && isConnected && address) {
      setProcessandoBaixa(false);
      setBoletoParaBaixar(null);
      
      setTimeout(() => {
        processarBaixaBoleto(boletoParaBaixar);
      }, 2000);
    }
  }, [isConnected, address, processandoBaixa, boletoParaBaixar]);

  // Timeout de segurança para limpar estado se conexão não acontecer
  useEffect(() => {
    if (processandoBaixa && boletoParaBaixar) {
      const timeout = setTimeout(() => {
        if (!isConnected) {
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
  }, [processandoBaixa, boletoParaBaixar, isConnected]);

  useEffect(() => {
    // Atualiza cotação apenas ao montar (sem polling automático)
    fetchTaxaConversao();
    // POLLING DESABILITADO - estava causando rate limit 429
    // intervalRef.current = setInterval(fetchTaxaConversao, 60000);
    // return () => clearInterval(intervalRef.current);
  }, [fetchTaxaConversao]); // Incluir fetchTaxaConversao nas dependências

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

  // Função para calcular valor líquido (95% do valor USDT) - Otimizada
  const calcularValorLiquido = useCallback((valorUsdt) => {
    return valorUsdt !== undefined && valorUsdt !== null ? (Number(valorUsdt) * 0.95).toFixed(2) : '--';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevenir múltiplas submissões
    if (buttonMessage === 'Cadastrando...' || buttonMessage === 'Travando USDT...' || buttonMessage === 'Cadastrando boleto...' || isLoading) {
      console.log('⚠️ [VENDEDOR] Submissão já em andamento, ignorando');
      return;
    }
    
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
    if (!isConnected || !address) {
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
    try {
      setButtonMessage('Travando USDT...');
      
      // Primeiro, travar USDT no contrato inteligente
      // Primeiro, travar USDT no escrow usando arquitetura universal
      const escrowResult = await createEscrow({
        valorUSDT: valorUsdt,
        codigoBarras: formData.codigoBarras,
        valor: valorNum,
        cpfCnpj: formData.cpfCnpj,
        dataVencimento: formData.dataVencimento,
        instituicao: formData.instituicao
      });

      if (!escrowResult.success) {
        throw new Error('Falha ao travar USDT no contrato');
      }

      console.log('🎯 [DEBUG] Escrow result:', escrowResult);
      setButtonMessage('Cadastrando boleto...');
      
      // Depois, cadastrar o boleto no backend
      const boletoObj = {
        user_id: user.uid,
        cpf_cnpj: formData.cpfCnpj,
        codigo_barras: formData.codigoBarras,
        valor: valorNum,
        valor_usdt: valorUsdt,
        vencimento: formData.dataVencimento,
        instituicao: formData.instituicao,
        numero_controle: Date.now().toString(),
        escrow_id: escrowResult.escrowId,
        tx_hash: escrowResult.txHash || escrowResult.approveTxHash,
        status: 'DISPONIVEL',
        data_travamento: new Date().toISOString()
      };
      
      console.log('🎯 [DEBUG] Enviando boleto para backend:', boletoObj);
      console.log('🎯 [DEBUG] JSON que será enviado:', JSON.stringify(boletoObj, null, 2));
      console.log('🎯 [DEBUG] URL:', buildApiUrl('/boletos'));
      
      try {
        const resp = await fetch(buildApiUrl('/boletos'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(boletoObj)
        });
        
        console.log('🎯 [DEBUG] Resposta do servidor:', resp.status, resp.statusText);
        console.log('🎯 [DEBUG] Headers da resposta:', resp.headers);
        
        if (!resp.ok) {
          const errorText = await resp.text();
          console.log('🎯 [DEBUG] Texto do erro:', errorText);
          throw new Error(`Erro ${resp.status}: ${resp.statusText} - ${errorText}`);
        }
        
        const result = await resp.json();
        console.log('🎯 [DEBUG] Resultado:', result);
      } catch (fetchError) {
        console.error('🎯 [DEBUG] Erro na requisição:', fetchError);
        throw fetchError;
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
        message: `Boleto cadastrado e USDT travado com sucesso! Hash: ${(escrowResult.txHash || escrowResult.approveTxHash || 'N/A').substring(0, 10)}...`
      });
      fetchBoletosOptimized(true); // Forçar refresh após cadastro
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
      const resp = await fetch(buildApiUrl(`/boletos/${id}`), { method: 'DELETE' });
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

  // Função robusta para formatar datas (sempre DD/MM/YYYY) - Otimizada com React.useCallback
  const formatarData = useCallback((data) => {
    if (!data || data === null) {
      return "--";
    }
    
    try {
      // Trata string YYYY-MM-DD
      if (typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
        const [ano, mes, dia] = data.split("-");
        const dataFormatada = `${dia}/${mes}/${ano}`;

        return dataFormatada;
      }
      
      // Trata string ISO completa ou objeto Date
      const d = new Date(data);
      if (!isNaN(d.getTime())) {
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const ano = d.getFullYear();
        const dataFormatada = `${dia}/${mes}/${ano}`;

        return dataFormatada;
      }
      

      return "--";
    } catch (error) {
      console.error('❌ Erro ao formatar data:', error);
      return "--";
    }
  }, []);

  // Função para cancelar boleto
  const handleCancelar = async (boleto) => {
    
    try {
      // O backend espera o ID do boleto, não o numero_controle
      const boletoId = boleto.id;
      if (!boletoId) {
        throw new Error('ID do boleto não encontrado');
      }
      
      const url = buildApiUrl(`/boletos/${boletoId}/cancelar`);
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
      await fetchBoletosOptimized(true);
      
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

  // Estado para controlar qual boleto está sendo baixado
  const [boletoBaixandoId, setBoletoBaixandoId] = useState(null);
  const [statusBaixa, setStatusBaixa] = useState({}); // { [boletoId]: 'processando' | 'sucesso' | null }

  // Função para baixar pagamento
  const handleBaixarPagamento = async (boleto) => {
    const boletoId = boleto.id || boleto.numeroControle || boleto.numero_controle;
    console.log('🚀 Iniciando baixa do boleto:', boletoId);
    
    try {
      // Definir estado de processando
      console.log('⏳ Definindo estado processando para:', boletoId);
      setBoletoBaixandoId(boletoId);
      setStatusBaixa(prev => {
        const newState = { ...prev, [boletoId]: 'processando' };
        console.log('🔄 Status definido como processando:', newState);
        return newState;
      });
    
    // Verificar se a carteira está conectada
    if (!isConnected || !address) {
      setBoletoParaBaixar(boleto);
      setProcessandoBaixa(true);
      
      // Abrir modal de conexão automaticamente
      try {
        await connectWallet();
      } catch (error) {
        console.error('Erro ao abrir modal de conexão:', error);
          
          // Limpar estados de loading
          setBoletoBaixandoId(null);
          setStatusBaixa(prev => ({ ...prev, [boletoId]: null }));
          
        setAlertInfo({
          type: 'destructive',
          title: 'Erro de conexão',
          description: 'Erro ao abrir modal. Tente conectar a carteira manualmente.'
        });
        setTimeout(() => setAlertInfo(null), 3000);
        return;
      }
      return;
    }

    // Se a carteira já está conectada, processar diretamente
    await processarBaixaBoleto(boleto);
    } catch (error) {
      console.error('Erro ao processar baixa:', error);
      
      // Limpar estados de loading
      setBoletoBaixandoId(null);
      setStatusBaixa(prev => ({ ...prev, [boletoId]: null }));
      
      setAlertInfo({
        type: 'destructive',
        title: 'Erro ao baixar boleto',
        description: 'Ocorreu um erro ao processar a baixa. Tente novamente.'
      });
      setTimeout(() => setAlertInfo(null), 5000);
    }
  };

  // Função para abrir disputa
  const handleDisputa = async (boleto) => {
    if (window.confirm('Deseja realmente abrir uma disputa para este boleto? Esta ação iniciará um processo de resolução.')) {
      try {
        // Aqui você pode implementar a lógica de disputa
        // Por exemplo, atualizar o status do boleto para "EM DISPUTA"
        const response = await fetch(buildApiUrl(`/boletos/${boleto.id}/disputa`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'EM DISPUTA',
            data_disputa: new Date().toISOString()
          })
        });

        if (response.ok) {
          setAlertInfo({
            type: 'success',
            title: 'Disputa aberta',
            description: 'A disputa foi aberta com sucesso. O suporte entrará em contato.'
          });
          // Recarregar os boletos para atualizar o status
          fetchBoletosOptimized(true);
        } else {
          throw new Error('Erro ao abrir disputa');
        }
      } catch (error) {
        console.error('Erro ao abrir disputa:', error);
        setAlertInfo({
          type: 'destructive',
          title: 'Erro ao abrir disputa',
          description: 'Ocorreu um erro ao abrir a disputa. Tente novamente.'
        });
      }
      setTimeout(() => setAlertInfo(null), 5000);
    }
  };

  // Função para destravar boleto automaticamente após 60 minutos
  const handleDestravarBoleto = async (boleto) => {
    try {
      console.log(`🔄 Iniciando destravamento automático do boleto ${boleto.id}`);
      
      // Verificar se a carteira está conectada
      if (!isConnected || !address) {
        console.warn('⚠️ Carteira não conectada para destravamento automático');
        setAlertInfo({
          type: 'destructive',
          title: 'Carteira não conectada',
          description: 'Conecte sua carteira para destravar o boleto automaticamente.'
        });
        setTimeout(() => setAlertInfo(null), 5000);
        return;
      }

      // Verificar se o escrow_id é válido
      if (!boleto.escrow_id || boleto.escrow_id === '0x123' || boleto.escrow_id.length < 10) {
        console.error('❌ Escrow ID inválido para destravamento:', boleto.escrow_id);
        return;
      }

      console.log(`🔓 Destravando escrow ${boleto.escrow_id} para boleto ${boleto.id}`);

      // ⚠️ SMART CONTRACT DESABILITADO TEMPORARIAMENTE
      // Pular tentativa de liberar no smart contract por enquanto
      console.log('⚠️ [TEMP] Pulando liberação no smart contract - apenas atualizando banco de dados');
      
      // Ir direto para atualização no backend
      const response = await fetch(buildApiUrl(`/boletos/${boleto.id}/destravar`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'DISPONIVEL',
          data_destravamento: new Date().toISOString(),
          tx_hash: null // Sem transação no smart contract por enquanto
        })
      });

      if (response.ok) {
        setAlertInfo({
          type: 'success',
          title: 'Boleto destravado automaticamente',
          description: `Boleto ${boleto.numeroControle} foi destravado após 60 minutos sem pagamento.`
        });
        // Recarregar os boletos
        fetchBoletosOptimized(true);
      } else {
        console.error('❌ Erro ao atualizar status no backend para boleto:', boleto.id);
        throw new Error('Erro ao atualizar status no backend');
      }
      
      // CÓDIGO ORIGINAL COMENTADO (reativar quando smart contract estiver corrigido):
      // const result = await releaseEscrow({ escrowId: boleto.escrow_id });
      // if (result.success) {
      //   const response = await fetch(buildApiUrl(`/boletos/${boleto.id}/destravar`), {
      //     method: 'PUT',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({
      //       status: 'DISPONIVEL',
      //       data_destravamento: new Date().toISOString(),
      //       tx_hash: result.txHash
      //     })
      //   });
      //   if (response.ok) {
      //     setAlertInfo({
      //       type: 'success',
      //       title: 'Boleto destravado automaticamente',
      //       description: `Boleto ${boleto.numeroControle} foi destravado após 60 minutos sem pagamento.`
      //     });
      //     fetchBoletosOptimized(true);
      //   } else {
      //     throw new Error('Erro ao atualizar status no backend');
      //   }
      // } else {
      //   if (result.error && result.error.includes('não está ativo')) {
      //     await handleLimparBoletoAntigo(boleto);
      //     return;
      //   }
      //   throw new Error(`Erro ao destravar USDT no contrato: ${result.error || 'Erro desconhecido'}`);
      // }
    } catch (error) {
      console.error('❌ Erro ao destravar boleto automaticamente:', boleto.id, error);
      
      // Não mostrar alerta para destravamento automático para não incomodar o usuário
      // O sistema tentará novamente na próxima verificação
      console.log('🔄 Tentativa de destravamento automático falhou, será tentado novamente em 5 minutos');
    }
  };

  // Função para verificar e destravar boletos automaticamente
  const verificarBoletosParaDestravar = () => {
    try {
      const agora = new Date();
      const boletosParaDestravar = [];
      const boletosParaLimpar = [];
      
      boletos.forEach(boleto => {
        // Verificar se o boleto está travado (AGUARDANDO PAGAMENTO)
        if (boleto.status !== 'AGUARDANDO PAGAMENTO') return;
        
        // Verificar se tem data de travamento
        if (!boleto.data_travamento) return;
        
        // Calcular tempo decorrido desde o travamento
        const dataTravamento = new Date(boleto.data_travamento);
        const tempoDecorrido = agora.getTime() - dataTravamento.getTime();
        const minutosDecorridos = tempoDecorrido / (1000 * 60);
        
        // Verificar se tem escrow_id válido
        if (!boleto.escrow_id || boleto.escrow_id === '0x123' || boleto.escrow_id.length < 10) {
          console.warn('⚠️ Boleto sem escrow_id válido:', boleto.id);
          // Se passou de 60 minutos e não tem escrow_id, marcar para limpeza
          if (minutosDecorridos >= 60) {
            boletosParaLimpar.push(boleto);
          }
          return;
        }
        
        // Se passou de 24 horas (1440 minutos), marcar para limpeza (boletos muito antigos)
        if (minutosDecorridos >= 1440) {
          console.log(`🧹 Boleto muito antigo para limpeza: ${boleto.id} - ${minutosDecorridos.toFixed(1)} minutos`);
          boletosParaLimpar.push(boleto);
          return;
        }
        
        // Destravar após 60 minutos
        if (minutosDecorridos >= 60) {
          console.log(`🕐 Boleto ${boleto.id} deve ser destravado - ${minutosDecorridos.toFixed(1)} minutos decorridos`);
          boletosParaDestravar.push(boleto);
        }
      });

      // Limpar boletos antigos ou sem escrow_id
      if (boletosParaLimpar.length > 0) {
        console.log(`🧹 Limpando ${boletosParaLimpar.length} boletos antigos/inválidos`);
        boletosParaLimpar.forEach(boleto => {
          handleLimparBoletoAntigo(boleto);
        });
      }

      // Destravar cada boleto que passou do prazo
      if (boletosParaDestravar.length > 0) {
        console.log(`🔄 Destravando ${boletosParaDestravar.length} boletos automaticamente`);
        boletosParaDestravar.forEach(boleto => {
          handleDestravarBoleto(boleto);
        });
      }
    } catch (error) {
      console.error('❌ Erro ao verificar boletos para destravar:', error);
    }
  };

  // Função para limpar boletos antigos ou inválidos
  const handleLimparBoletoAntigo = async (boleto) => {
    try {
      console.log(`🧹 Limpando boleto antigo: ${boleto.id}`);
      
      // Atualizar status para DISPONIVEL no backend
      const response = await fetch(buildApiUrl(`/boletos/${boleto.id}/destravar`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'DISPONIVEL',
          data_destravamento: new Date().toISOString(),
          tx_hash: null
        })
      });

      if (response.ok) {
        console.log(`✅ Boleto ${boleto.id} marcado como EXPIRADO`);
        // Recarregar os boletos
        fetchBoletosOptimized(true);
      } else {
        console.error('❌ Erro ao marcar boleto como expirado:', boleto.id);
      }
    } catch (error) {
      console.error('❌ Erro ao limpar boleto antigo:', boleto.id, error);
    }
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
    const boletoId = boleto.id || boleto.numeroControle || boleto.numero_controle;
    
    // Verificar se está na rede correta
    // Validação de rede será feita pelo hook DEV

    // Verificar se o boleto tem status "AGUARDANDO BAIXA"
    if (boleto.status !== 'AGUARDANDO BAIXA') {
      setAlertInfo({
        type: 'destructive',
        title: 'Status inválido',
        description: 'Só é possível baixar boletos com status "AGUARDANDO BAIXA".'
      });
      setTimeout(() => setAlertInfo(null), 3000);
      
      // Limpar estados de loading
      setBoletoBaixandoId(null);
      setStatusBaixa(prev => ({ ...prev, [boletoId]: null }));
      return;
    }

    // Verificar se há endereço do comprador (apenas endereço Ethereum válido)
    const candidatoEndereco = boleto.wallet_address || boleto.walletAddress || '';
    const enderecoValido = /^0x[a-fA-F0-9]{40}$/.test(String(candidatoEndereco));
    if (!enderecoValido) {
      setAlertInfo({
        type: 'destructive',
        title: 'Dados incompletos',
        description: 'Endereço da carteira do comprador não encontrado ou inválido.'
      });
      setTimeout(() => setAlertInfo(null), 3000);
      
      // Limpar estados de loading
      setBoletoBaixandoId(null);
      setStatusBaixa(prev => ({ ...prev, [boletoId]: null }));
      return;
    }

    setAlertInfo({
      type: 'default',
      title: 'Baixando boleto...',
      description: 'Aguarde enquanto processamos a baixa do boleto e liberamos os USDT para o comprador.'
    });

    try {
HEAD
      
      // Garantir dados completos do boleto (carregar detalhes se necessário)
      if (!boleto.escrow_id || !boleto.tx_hash) {
        const identDetalhe = boleto.id || boleto.numeroControle || boleto.numero_controle;
        let detObj = null;
        // Estratégia: evitar a rota por path (tem retornado 400) e usar apenas queries locais
        console.debug('🔎 [DETALHE] Tentando detalhe via query id=', identDetalhe);
        let eId = null;
        try {
          const detalhePorId = await apiRequest(`/boletos?id=${identDetalhe}`, { disableBackup: true });
          const found = detalhePorId?.data?.find?.(d => (d.id === identDetalhe || d.uuid  identDetalhe)) || null;
          if (Array.isArray(detalhePorId?.data)) console.debug('ℹ️ [DETALHE] Resposta id possui', detalhePorId.data.length, 'registros');
          if (Array.isArray(detalhePorId?.data)) console.debug('🔎 [DETALHE] IDs/UUIDs (amostra id):', detalhePorId.data.slice(0,10).map(d => ({ id: d.id, uuid: d.uuid, numero_controle: d.numero_controle, numeroControle: d.numeroControle, escrow_id: d.escrow_id })));
          if (found) { detObj = found; console.debug('✅ [DETALHE] Detalhe encontrado via id'); }
        } catch (err) {
          eId = err;
        }
        const numeroCand = boleto.numeroControle || boleto.numero_controle || boleto.numero || identDetalhe;
        if (!detObj) {
          const queryVariants = [
            `/boletos?id=${numeroCand}`,
            `/boletos?numeroControle=${numeroCand}`,
            `/boletos?numero_controle=${numeroCand}`,
          ];
          for (const q of queryVariants) {
            try {
              console.debug('🔎 [DETALHE] Tentando detalhe via query variante:', q);
              const resp = await apiRequest(q, { disableBackup: true });
              const maybe = resp?.data?.find?.(d => (
                d.id === identDetalhe || d.id === numeroCand ||
                d.uuid === identDetalhe || d.uuid === numeroCand ||
                d.numeroControle === numeroCand || d.numero_controle === numeroCand
              )) || null;
              if (Array.isArray(resp?.data)) console.debug('ℹ️ [DETALHE] Resposta variante possui', resp.data.length, 'registros');
              if (Array.isArray(resp?.data)) console.debug('🔎 [DETALHE] IDs/UUIDs (amostra variante):', resp.data.slice(0,10).map(d => ({ id: d.id, uuid: d.uuid, numero_controle: d.numero_controle, numeroControle: d.numeroControle, escrow_id: d.escrow_id })));
              if (maybe) { detObj = maybe; console.debug('✅ [DETALHE] Detalhe encontrado via variante de query'); break; }
            } catch (eVar) {
              // continua tentando
            }
          }
        }
        // Fallback por comprador: consultar boletos comprados do usuário e filtrar
        if (!detObj && boleto?.comprador_id) {
          try {
            console.debug('🔎 [DETALHE] Fallback comprador: /boletos/comprados/', boleto.comprador_id);
            const compradosResp = await apiRequest(`/boletos/comprados/${boleto.comprador_id}`, { disableBackup: true });
            const arrC = Array.isArray(compradosResp?.data) ? compradosResp.data : (Array.isArray(compradosResp) ? compradosResp : []);
            console.debug('ℹ️ [DETALHE] Comprados possui', arrC.length, 'registros');
            console.debug('🔎 [DETALHE] IDs/UUIDs (amostra comprados):', arrC.slice(0,10).map(d => ({ id: d.id, uuid: d.uuid, numero_controle: d.numero_controle, numeroControle: d.numeroControle, escrow_id: d.escrow_id })));
            detObj = arrC.find(d => (
              d?.id === identDetalhe || d?.uuid === identDetalhe ||
              d?.numero_controle === numeroCand || d?.numeroControle === numeroCand
            )) || null;
            if (detObj) console.debug('✅ [DETALHE] Detalhe obtido em comprados');
          } catch (eCompr) {
            console.warn('⚠️ Falha ao consultar comprados do usuário:', boleto.comprador_id, eCompr);
          }
        }
        // Fallback final: buscar lista completa e filtrar client-side
        if (!detObj) {
          try {
            console.debug('🔎 [DETALHE] Fallback final: consultando lista completa /boletos');
            const listResp = await apiRequest('/boletos', { disableBackup: true });
            const arr = Array.isArray(listResp?.data) ? listResp.data : (Array.isArray(listResp) ? listResp : []);
            console.debug('ℹ️ [DETALHE] Lista completa possui', arr.length, 'registros');
            console.debug('🔎 [DETALHE] IDs/UUIDs (amostra lista):', arr.slice(0,10).map(d => ({ id: d.id, uuid: d.uuid, numero_controle: d.numero_controle, numeroControle: d.numeroControle, escrow_id: d.escrow_id })));
            detObj = arr.find(d => (
              d?.id === identDetalhe || d?.id === numeroCand ||
              d?.uuid === identDetalhe || d?.uuid === numeroCand ||
              d?.numeroControle === numeroCand || d?.numero_controle === numeroCand
            )) || null;
            if (detObj) console.debug('✅ [DETALHE] Detalhe obtido da lista completa');
          } catch (eList) {
            console.warn('⚠️ Falha ao consultar lista completa de boletos:', eList);
          }
        }
        if (!detObj) console.warn('⚠️ [DETALHE] Não foi possível localizar detalhe após id/variantes/comprados/lista completa', { identDetalhe, numeroCand, eId });
        if (detObj) {
          console.debug('ℹ️ [DETALHE] detObj keys:', Object.keys(detObj || {}));
          const pickNonEmpty = (...vals) => {
            for (const v of vals) {
              if (v !== undefined && v !== null) {
                const s = typeof v === 'string' ? v.trim() : String(v);
                if (s.length > 0) return s;
              }
            }
            return null;
          };

          const collectEscrowCandidatesDeep = (o) => {
  try {
    const results = [];
    const pick = (...vals) => vals.map(v => typeof v === 'string' ? v.trim() : v).filter(v => v !== undefined && v !== null).map(v => String(v)).filter(s => s.length > 0);
    const walk = (x) => {
      if (!x || typeof x !== 'object') return;
      results.push(...pick(x.escrow_id, x.escrowId, x.contractEscrowId, x.contract_escrow_id, x.escrow_uuid));
      if (x.escrow && typeof x.escrow === 'object') {
        results.push(...pick(x.escrow.id, x.escrow.uuid, x.escrow.escrow_id, x.escrow.escrowId));
      }
      if (x.contract && typeof x.contract === 'object') {
        results.push(...pick(x.contract.escrow_id, x.contract.escrowId));
      }
      Object.keys(x).forEach(k => {
        const v = x[k];
        const escrowish = /escrow/i.test(k) || /contractEscrow/i.test(k);
        if (escrowish) {
          if (typeof v === 'string') results.push(...pick(v));
          if (typeof v === 'object') results.push(...pick(v?.id, v?.uuid, v?.escrow_id, v?.escrowId));
        }
        if (Array.isArray(v)) v.forEach(walk);
        else if (typeof v === 'object') walk(v);
      });
    };
    walk(o);
    return results;
  } catch { return []; }
};

const resolveEscrowId = (obj, fallback = null) => {
  const fromRoot = pickNonEmpty(
    obj?.escrow_id,
    obj?.escrowId,
    obj?.escrow?.id,
    obj?.escrow?.uuid,
    obj?.escrow?.escrow_id,
    obj?.escrow?.escrowId,
    obj?.contract?.escrow_id,
    obj?.contract?.escrowId,
    obj?.contractEscrowId,
    obj?.escrow_uuid
  );
  if (fromRoot) return fromRoot;

  const inTrans = Array.isArray(obj?.transacoes)
    ? obj.transacoes
        .map(t => pickNonEmpty(
          t?.escrow_id,
          t?.escrowId,
          t?.escrow?.id,
          t?.escrow?.uuid,
          t?.escrow?.escrow_id,
          t?.escrow?.escrowId,
          t?.contract?.escrow_id,
          t?.contract?.escrowId
        ))
        .filter(Boolean)
    : [];

  const inDisp = Array.isArray(obj?.disputas)
    ? obj.disputas
        .map(d => pickNonEmpty(
          d?.escrow_id,
          d?.escrowId,
          d?.escrow?.id,
          d?.escrow?.uuid,
          d?.escrow?.escrow_id,
          d?.escrow?.escrowId,
          d?.contract?.escrow_id,
          d?.contract?.escrowId
        ))
        .filter(Boolean)
    : [];

  const inTxs = Array.isArray(obj?.transactions)
    ? obj.transactions
        .map(t => pickNonEmpty(
          t?.escrow_id,
          t?.escrowId,
          t?.escrow?.id,
          t?.escrow?.uuid,
          t?.escrow?.escrow_id,
          t?.escrow?.escrowId,
          t?.contract?.escrow_id,
          t?.contract?.escrowId
        ))
        .filter(Boolean)
    : [];

  const deep = (typeof collectEscrowCandidatesDeep === 'function')
    ? (collectEscrowCandidatesDeep(obj) || [])
    : [];

  const chain = [...deep, ...inTrans, ...inDisp, ...inTxs];
  return pickNonEmpty(chain[0], fallback);
};

let 
escrowResolved = resolveEscrowId(detObj,
boleto?.escrow_id);
console.debug('[DETALHE] escrow-like keys (detObj):', (function keysWithEscrow(o){try{const acc=[]; const walk=(x,p='')=>{ if(!x||typeof x!=='object') return; Object.keys(x).forEach(k=>{ const v=x[k]; const path=p?`${p}.${k}`:k; if(/escrow/i.test(k)||/contractEscrow/i.test(k)) acc.push(path); if(typeof v==='object') walk(v,path);});}; walk(o); return acc.slice(0,50);}catch{return[]}})(detObj));
console.debug('[DETALHE] escrow candidates (detObj):', (collectEscrowCandidatesDeep(detObj) || []).slice(0,10));
          let txResolved = detObj.tx_hash ?? detObj.txHash ?? detObj.hash ?? detObj.txhash ?? boleto.tx_hash;
          const idResolved = detObj.id ?? detObj.uuid ?? boleto.id;
          const numCtrlResolved = detObj.numero_controle ?? detObj.numeroControle ?? boleto.numero_controle ?? boleto.numeroControle;

          // Enriquecer caso escrow/tx ainda estejam ausentes
          if (!escrowResolved && numCtrlResolved) {
            try {
              console.debug('🔎 [DETALHE] Enriquecendo via numero_controle=', numCtrlResolved);
              const byNumCtrl = await apiRequest(`/boletos?numero_controle=${numCtrlResolved}`, { disableBackup: true });
              const arrN = Array.isArray(byNumCtrl?.data) ? byNumCtrl.data : (Array.isArray(byNumCtrl) ? byNumCtrl : []);
              console.debug('ℹ️ [DETALHE] numero_controle lookup retornou', arrN.length, 'registros');
              const matchN = arrN.find(d => (d?.numero_controle === numCtrlResolved || d?.numeroControle === numCtrlResolved || d?.id === idResolved || d?.uuid === idResolved));
              if (matchN) {
                escrowResolved = resolveEscrowId(matchN, escrowResolved);
                txResolved = matchN.tx_hash ?? matchN.txHash ?? matchN.hash ?? matchN.txhash ?? txResolved;
                console.debug('✅ [DETALHE] Enriquecido via numero_controle');
              }
            } catch (eNum) {
              console.warn('⚠️ Falha ao enriquecer por numero_controle:', eNum);
            }
          }
          if (!escrowResolved && boleto?.comprador_id) {
            try {
              console.debug('🔎 [DETALHE] Enriquecendo via comprados do usuário', boleto.comprador_id);
              const compradosResp2 = await apiRequest(`/boletos/comprados/${boleto.comprador_id}`, { disableBackup: true });
              const arrC2 = Array.isArray(compradosResp2?.data) ? compradosResp2.data : (Array.isArray(compradosResp2) ? compradosResp2 : []);
              const matchC = arrC2.find(d => (d?.numero_controle === numCtrlResolved || d?.numeroControle === numCtrlResolved || d?.id === idResolved || d?.uuid === idResolved));
              if (matchC) {
                escrowResolved = resolveEscrowId(matchC, escrowResolved);
                txResolved = matchC.tx_hash ?? matchC.txHash ?? matchC.hash ?? matchC.txhash ?? txResolved;
                console.debug('✅ [DETALHE] Enriquecido via comprados');
              }
            } catch (eCompr2) {
              console.warn('⚠️ Falha ao enriquecer via comprados:', eCompr2);
            }
          }
          if (!escrowResolved) {
            try {
              console.debug('🔎 [DETALHE] Enriquecendo via lista completa');
              const listResp2 = await apiRequest('/boletos', { disableBackup: true });
              const arr2 = Array.isArray(listResp2?.data) ? listResp2.data : (Array.isArray(listResp2) ? listResp2 : []);
              const matchL = arr2.find(d => (d?.numero_controle === numCtrlResolved || d?.numeroControle === numCtrlResolved || d?.id === idResolved || d?.uuid === idResolved));
              if (matchL) {
                escrowResolved = resolveEscrowId(matchL, escrowResolved);
                txResolved = matchL.tx_hash ?? matchL.txHash ?? matchL.hash ?? matchL.txhash ?? txResolved;
                console.debug('✅ [DETALHE] Enriquecido via lista completa');
              }
            } catch (eList2) {
              console.warn('⚠️ Falha ao enriquecer via lista completa:', eList2);
            }
          }

          // Último fallback: tentar rotas de detalhe e resolvedor de escrow
          if (!escrowResolved) {
            const resolverCandidates = [
              `/boletos/${idResolved}`,
              `/boletos/${numCtrlResolved}`,
              `/boletos/detalhe/${idResolved}`,
              `/boletos/detalhe/${numCtrlResolved}`,
              `/escrows/resolve?numero_controle=${numCtrlResolved}`,
              `/escrows/resolve?id=${idResolved}`,
              `/escrow/resolve?numero_controle=${numCtrlResolved}`,
              `/escrow/by_tx?tx_hash=${txResolved}`,
            ];
            for (const rc of resolverCandidates) {
              try {
                console.debug('🔎 [DETALHE] Tentando resolvedor:', rc);
                const r = await apiRequest(rc, { disableBackup: true });
                const data = r?.data ?? r;
                const pickObj = Array.isArray(data) ? data.find(d => d?.id === idResolved || d?.numero_controle === numCtrlResolved || d?.uuid === idResolved) : data;
                const cand = pickObj || data;
                if (cand && typeof cand === 'object') {
                  const esc = resolveEscrowId(cand, escrowResolved);
                  const txc = cand?.tx_hash ?? cand?.txHash ?? cand?.hash ?? cand?.txhash ?? txResolved;
                  if (esc) { escrowResolved = esc; txResolved = txc; console.debug('✅ [DETALHE] Resolvedor obteve escrow'); break; }
                }
              } catch (eRes) {
                // ignora e segue
              }
            }
          }

          console.debug('🔧 [DETALHE] Normalizado', { escrowResolved, txResolved, idResolved, numCtrlResolved });
          boleto = { ...boleto, id: idResolved, numero_controle: numCtrlResolved, escrow_id: escrowResolved, tx_hash: txResolved };
        }
      }

      // Verificar se há escrow_id no boleto
      if (!boleto.escrow_id) {
        throw new Error('ID do escrow não encontrado no boleto. Não é possível liberar os USDT.');
      // Garantir escrow_id: se ausente, criar automaticamente e persistir
      let escrowId = boleto.escrow_id;
      if (!escrowId) {
        const valorUsdtNum = Number(
          boleto.valor_usdt ?? (typeof brlToUsdt === 'function' ? brlToUsdt(Number(boleto.valor || 0)) : 0)
        );

        const escrowCreate = await createEscrow({ valorUSDT: valorUsdtNum });
        if (!escrowCreate?.success || !escrowCreate?.escrowId) {
          throw new Error('Falha ao criar escrow automaticamente para este boleto.');
        }
        escrowId = escrowCreate.escrowId;

        // Persistir no backend (melhor para rastreabilidade)
        const identEscrow = boleto.numeroControle || boleto.numero_controle || boleto.id;
        try {
          await apiRequest(`/boletos/${identEscrow}/escrow`, {
            method: 'PATCH',
            body: {
              user_id: user.uid,
              escrow_id: escrowId,
              tx_hash: escrowCreate.txHash
            }
          });
        } catch (_) {}

        boleto.escrow_id = escrowId;
master
      }

      // Verificar e usar endereço de carteira válido do comprador
      const compradorAddress = candidatoEndereco;
      if (!/^0x[a-fA-F0-9]{40}$/.test(String(compradorAddress))) {
        throw new Error('Endereço da carteira do comprador inválido. Não é possível liberar os USDT.');
      }

      console.log('🔄 [DEBUG] Registrando comprador no contrato:', compradorAddress);
      
      // PRIMEIRO: Registrar o comprador no escrow
      const registerResult = await registerBuyer(boleto.escrow_id, compradorAddress);
      
      if (!registerResult.success) {
        throw new Error('Falha ao registrar comprador no contrato');
      }

      console.log('✅ [DEBUG] Comprador registrado. Liberando pagamento...');

      // SEGUNDO: Liberar os USDT do contrato inteligente para o COMPRADOR
      const result = await releaseEscrow({
        escrowId: boleto.escrow_id
      });
      
      if (!result.success) {
        throw new Error('Falha ao liberar USDT do contrato para o comprador');
      }

      // Depois, chamar o backend para baixar o boleto
      // A API de baixar/liberar espera numero_controle no path
      const identBaixar = boleto.numero_controle || boleto.numeroControle || boleto.id;
      const responseData = await apiRequest(`/boletos/${identBaixar}/baixar`, {
        method: 'PATCH',
        body: {
          user_id: user.uid,
          wallet_address_vendedor: address,
          wallet_address_comprador: compradorAddress,
          tx_hash: result.txHash
        }
      });

      if (responseData && responseData.success === false) {
        throw new Error(responseData.message || 'Falha ao baixar boleto');
      }

      setAlertInfo({
        type: 'success',
        title: 'Boleto baixado com sucesso!',
        description: `USDT liberados para o comprador (${compradorAddress.substring(0, 6)}...${compradorAddress.substring(compradorAddress.length - 4)}). TX: ${result.txHash.substring(0, 10)}...`
      });
      setTimeout(() => setAlertInfo(null), 5000);

      // Atualizar a lista de boletos
      await fetchBoletosOptimized(true);

      // Definir estado de sucesso
      console.log('✅ Boleto baixado com sucesso, definindo status sucesso para:', boletoId);
      setStatusBaixa(prev => {
        const newState = { ...prev, [boletoId]: 'sucesso' };
        console.log('🔄 Status atualizado:', newState);
        return newState;
      });
      
      // Limpar estados após 3 segundos
      setTimeout(() => {
        console.log('🧹 Limpando estados após 3 segundos para:', boletoId);
        setBoletoBaixandoId(null);
        setStatusBaixa(prev => {
          const newState = { ...prev, [boletoId]: null };
          console.log('🔄 Estados limpos:', newState);
          return newState;
        });
      }, 3000);

    } catch (error) {
      const snapshot = {
        boletoId,
        id: boleto?.id,
        numero_controle: boleto?.numero_controle ?? boleto?.numeroControle,
        escrow_id: boleto?.escrow_id,
        tx_hash: boleto?.tx_hash,
        comprador_wallet: boleto?.wallet_address,
        comprador_id: boleto?.comprador_id
      };
      const identBaixarSnap = snapshot.numero_controle || snapshot.id;
      console.error('⛔ [BAIXA] Erro ao baixar boleto:', { snapshot, identBaixar: identBaixarSnap }, error);
      if (error?.stack) console.debug('🧩 [STACK] ', error.stack);
      
      // Limpar estados de loading
      setBoletoBaixandoId(null);
      setStatusBaixa(prev => ({ ...prev, [boletoId]: null }));
      
      const friendly = (msg => {
        if (!msg) return 'Não foi possível baixar o boleto. Tente novamente.';
        if (msg.includes('escrow')) return 'Escrow ausente no boleto. Tente recarregar a lista e repetir a operação.';
        if (msg.includes('comprador')) return 'Carteira do comprador não encontrada. Conecte a carteira correta e tente novamente.';
        return msg;
      })(error?.message);
      setAlertInfo({
        type: 'destructive',
        title: 'Erro ao baixar boleto',
        description: friendly
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
          {/* Sistema de refresh de saldos em background */}
          <BalanceRefresher address={address} isBackgroundMode={true} />

          {isConnected && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">Carteira Conectada</span>
                </div>
                <div className="text-xs text-green-600">
                  {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                </div>
              </div>
              <div className="mt-1 text-xs text-green-600">
                Rede: Polygon Amoy 
                {!isConnected && (
                  <span className="ml-2 text-orange-600 font-medium">
                    ⚠️ Troque para Polygon Amoy
                  </span>
                )}
              </div>
            </div>
          )}
          {isConnected && (
            <div className="w-full mb-3 flex items-center justify-between border border-green-300 rounded p-2 bg-green-50">
              <div className="text-sm text-green-900">
                {isOwner ? (
                  <>Owner do contrato conectado: {address?.slice(0,6)}...{address?.slice(-4)}</>
                ) : (
                  <>Carteira conectada: {address?.slice(0,6)}...{address?.slice(-4)} (não-owner)</>
                )}
              </div>
              <Button onClick={handleWithdrawFees} disabled={isLoading || !isOwner} className={`px-4 py-2 rounded text-white ${isOwner ? 'bg-green-700 hover:bg-green-800' : 'bg-gray-400 cursor-not-allowed'}`}>
                Coletar Taxas do Contrato
              </Button>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={goToTab} className="w-full mb-6">
            {isConnected && (
              <div className="w-full mb-3 flex items-center justify-between">
                <div className="text-sm text-green-900">
                  {isOwner ? (
                    <>Owner do contrato conectado: {address?.slice(0,6)}...{address?.slice(-4)}</>
                  ) : (
                    <>Carteira conectada: {address?.slice(0,6)}...{address?.slice(-4)} (não-owner)</>
                  )}
                </div>
                <Button onClick={handleWithdrawFees} disabled={isLoading || !isOwner} className={`px-4 py-2 rounded text-white ${isOwner ? 'bg-green-700 hover:bg-green-800' : 'bg-gray-400 cursor-not-allowed'}`}>
                  Coletar Taxas do Contrato
                </Button>
              </div>
            )}
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
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-500">Cotação atualizada: 1 USDT = {taxaConversao ? taxaConversao : '--'} BRL</span>
                            <button
                              type="button"
                              onClick={() => {

                                fetchTaxaConversao();
                              }}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors ml-2"
                              title="Atualizar cotação"
                            >
                              🔄 Refresh
                            </button>
                          </div>
                          {!cotacaoValida && (
                            <p className="text-xs text-red-600 mt-1">⚠️ Cotação indisponível - clique em Refresh ou aguarde</p>
                          )}
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
                  onClick={connectWallet}
                  className={`w-1/3 font-bold rounded-xl text-lg h-12 py-3 px-2 flex items-center justify-center transition ${isConnected ? 'bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  disabled={isConnected}
                >
                  {isConnected
                    ? `Conectado: ${address ? address.slice(0,6) + '...' + address.slice(-4) : ''}`
                    : 'Conectar Carteira'}
                </button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  variant={success ? 'success' : buttonError ? 'danger' : 'blue'}
                  disabled={!isConnected || !cotacaoValida || !valorValido || success || buttonError || isLoading}
                  size="lg"
                  className={`w-1/3 font-bold rounded-xl text-lg h-12 py-3 px-2 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed ${success ? 'bg-green-600 hover:bg-green-700 whitespace-pre-line' : ''} ${isLoading ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {isLoading ? '⏳ Processando...' : buttonMessage}
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
                  {/* Loading state */}
                  {loadingBoletos ? (
                    <div className="space-y-3">
                      {/* Skeleton loading mais compacto */}
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-12 bg-gray-100 rounded-md"></div>
                        </div>
                      ))}
                      <div className="text-center py-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mx-auto mb-2"></div>
                        <p className="text-gray-500 text-xs">Carregando...</p>
                      </div>
                    </div>
                  ) : (
                    <Suspense fallback={
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                        <p className="text-gray-600 text-sm">Carregando tabela...</p>
                      </div>
                    }>
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
                              <tr key={`${boleto.id || boleto.numeroControle}-${idx}`} className="border-b border-gray-200 hover:bg-lime-50">
                                <td className="py-3 px-4">{boleto.numeroControle}</td>
                                <td className="py-3 px-4">{boleto.cpfCnpj || '--'}</td>
                                <td className="py-3 px-4">R$ {(boleto.valor !== undefined && boleto.valor !== null) ? boleto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--'}</td>
                                <td className="py-3 px-4">
                                  {(() => {
                                    if (boleto.valor_usdt !== undefined && boleto.valor_usdt !== null) {
                                      const valor = Number(boleto.valor_usdt);
                                      if (!isNaN(valor)) {
                                        return `${valor.toFixed(2)} USDT`;
                                      }
                                    }
                                    return '--';
                                  })()}
                                </td>
                                <td className="py-3 px-4">{formatarData(boleto.vencimento)}</td>
                                <td className="py-3 px-4">
                                  <StatusBadge status={boleto.status} />
                                </td>
                                <td className="py-3 px-4">
                                  {boleto.comprador_id ? (
                                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                      {boleto.comprador_id.substring(0, 6)}...{boleto.comprador_id.substring(boleto.comprador_id.length - 4)}
                                    </span>
                                  ) : boleto.wallet_address ? (
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
                                      {/* Para status AGUARDANDO BAIXA: 3 opções obrigatórias */}
                                      {boleto.status === 'AGUARDANDO BAIXA' && (
                                        <>
                                          {/* 1. Visualizar Comprovante */}
                                          <DropdownMenuItem 
                                            onClick={() => {
                                              try {
                                                const ident = boleto.numeroControle || boleto.numero_controle || boleto.id;
                                                
                                                // SOLUÇÃO 1: Usar URL direta para o comprovante (backend proxy)
                                                const comprovanteUrl = boleto.comprovante_url || boleto.comprovanteUrl || boleto.comprovante;
                                                
                                                if (comprovanteUrl) {
                                                  // Se for base64, criar blob URL para melhor performance
                                                  if (comprovanteUrl.startsWith('data:')) {
                                                    try {
                                                      // Converter base64 para blob
                                                      const [header, base64Data] = comprovanteUrl.split(',');
                                                      const byteCharacters = atob(base64Data);
                                                      const byteNumbers = new Array(byteCharacters.length);
                                                      for (let i = 0; i < byteCharacters.length; i++) {
                                                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                                                      }
                                                      const byteArray = new Uint8Array(byteNumbers);
                                                      const blob = new Blob([byteArray], { type: 'application/pdf' });
                                                      const blobUrl = URL.createObjectURL(blob);
                                                      
                                                      window.open(blobUrl, '_blank', 'noopener,noreferrer');
                                                      
                                                      // Limpar blob URL após 30 segundos
                                                      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
                                                      return;
                                                    } catch (blobError) {
                                                      console.warn('⚠️ VENDEDOR - Erro ao criar blob, usando base64 direto:', blobError);
                                                      window.open(comprovanteUrl, '_blank', 'noopener,noreferrer');
                                                      return;
                                                    }
                                                  } else {
                                                    // URL externa direta
                                                    window.open(comprovanteUrl, '_blank', 'noopener,noreferrer');
                                                    return;
                                                  }
                                                }
                                                
                                                // SOLUÇÃO 2: Fallback - proxy via backend para garantir funcionamento
                                                const proxyUrl = buildApiUrl(`/proxy/comprovante/${ident}`);
                                                window.open(proxyUrl, '_blank', 'noopener,noreferrer');
                                                
                                              } catch (error) {
                                                console.error('❌ VENDEDOR - Erro ao abrir comprovante:', error);
                                                alert('Erro ao abrir comprovante. Tente novamente.');
                                              }
                                            }}
                                          >
                                            Visualizar Comprovante
                                          </DropdownMenuItem>
                                          
                                          {/* 2. Baixar Boleto */}
                                          <DropdownMenuItem 
                                            onClick={() => {
                                              const boletoId = boleto.id || boleto.numeroControle || boleto.numero_controle;
                                              if (statusBaixa[boletoId] !== 'processando') {
                                                handleBaixarPagamento(boleto);
                                              }
                                            }}
                                            disabled={statusBaixa[boleto.id || boleto.numeroControle || boleto.numero_controle] === 'processando'}
                                            className={`${
                                              statusBaixa[boleto.id || boleto.numeroControle || boleto.numero_controle] === 'processando' 
                                                ? 'opacity-60 cursor-not-allowed' 
                                                : statusBaixa[boleto.id || boleto.numeroControle || boleto.numero_controle] === 'sucesso'
                                                ? 'text-green-600 font-semibold'
                                                : ''
                                            }`}
                                          >
                                            {(() => {
                                              const boletoId = boleto.id || boleto.numeroControle || boleto.numero_controle;
                                              const status = statusBaixa[boletoId];
                                              
                                              if (status === 'processando') {
                                                return (
                                                  <div className="flex items-center gap-2">
                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900"></div>
                                                    Processando...
                                                  </div>
                                                );
                                              } else if (status === 'sucesso') {
                                                return (
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-green-600">✓</span>
                                                    Boleto Baixado
                                                  </div>
                                                );
                                              } else {
                                                return 'Baixar Boleto';
                                              }
                                            })()}
                                          </DropdownMenuItem>
                                          
                                          {/* 3. Disputa */}
                                          <DropdownMenuItem 
                                            onClick={() => {
                                              handleDisputa(boleto);
                                              setDropdownOpen(prev => ({ ...prev, [boleto.numeroControle]: false }));
                                            }}
                                            className="text-orange-600 hover:text-orange-700"
                                          >
                                            <FaExclamationTriangle className="mr-2 text-sm" />
                                            Disputa
                                          </DropdownMenuItem>
                                        </>
                                      )}

                                      {/* Para outros status: opções disponíveis */}
                                      {/* Opção para visualizar comprovante - outros status com comprovante */}
                                      {boleto.status !== 'AGUARDANDO BAIXA' && boleto.comprovante_url && (
                                        <DropdownMenuItem 
                                          onClick={() => {
                                            try {
                                              const ident = boleto.numeroControle || boleto.numero_controle || boleto.id;
                                              
                                              const comprovanteUrl = boleto.comprovante_url || boleto.comprovanteUrl || boleto.comprovante;
                                              
                                              if (comprovanteUrl) {
                                                if (comprovanteUrl.startsWith('data:')) {
                                                  try {
                                                    const [header, base64Data] = comprovanteUrl.split(',');
                                                    const byteCharacters = atob(base64Data);
                                                    const byteNumbers = new Array(byteCharacters.length);
                                                    for (let i = 0; i < byteCharacters.length; i++) {
                                                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                                                    }
                                                    const byteArray = new Uint8Array(byteNumbers);
                                                    const blob = new Blob([byteArray], { type: 'application/pdf' });
                                                    const blobUrl = URL.createObjectURL(blob);
                                                    
                                                    window.open(blobUrl, '_blank', 'noopener,noreferrer');
                                                    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
                                                    return;
                                                  } catch (blobError) {
                                                    console.warn('⚠️ VENDEDOR - Erro ao criar blob, usando base64 direto:', blobError);
                                                    window.open(comprovanteUrl, '_blank', 'noopener,noreferrer');
                                                    return;
                                                  }
                                                } else {
                                                  window.open(comprovanteUrl, '_blank', 'noopener,noreferrer');
                                                  return;
                                                }
                                              }
                                              
                                              const proxyUrl = buildApiUrl(`/proxy/comprovante/${ident}`);
                                              window.open(proxyUrl, '_blank', 'noopener,noreferrer');
                                              
                                            } catch (error) {
                                              console.error('❌ VENDEDOR - Erro ao abrir comprovante:', error);
                                              alert('Erro ao abrir comprovante. Tente novamente.');
                                            }
                                          }}
                                        >
                                          Visualizar Comprovante
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
                    </Suspense>
                  )}
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
      {showComprovanteModal && selectedComprovante && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50"
            onClick={() => {
              setShowComprovanteModal(false);
              setSelectedComprovante(null);
            }}
          />
          <div
            className="fixed top-1/2 left-1/2 z-[9999] w-[95%] max-w-6xl h-[90vh] flex flex-col text-gray-800 shadow-2xl rounded-2xl border border-green-700 bg-lime-200"
            style={{
              transform: 'translate(-50%, -50%)',
              maxHeight: '90vh',
              overflow: 'hidden',
              position: 'fixed',
              top: '50%',
              left: '50%'
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
                    <div className="text-gray-800 font-semibold">R$ {Number(selectedComprovante.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
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
        </>
      )}
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
