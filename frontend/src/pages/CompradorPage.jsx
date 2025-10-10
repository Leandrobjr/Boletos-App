import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaTrash, FaWallet, FaCheck, FaShoppingCart, FaMoneyBillWave,
  FaExclamationTriangle, FaInfoCircle, FaList, FaHistory, 
  FaCreditCard, FaLock, FaArrowRight, FaUpload, FaClock, FaTimesCircle,
  FaFilePdf, FaExternalLinkAlt, FaFileInvoiceDollar, FaEye
} from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';

import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { useBoletoEscrowFixed } from '../hooks/useBoletoEscrowFixed';
import BalanceRefresher from '../components/BalanceRefresher';
import StatusBadge from '../components/ui/status-badge';
import { buildApiUrl } from '../config/apiConfig';
import WalletConnector from '../components/wallet/WalletConnector';

// FORCE REBUILD - CORREÇÃO DEFINITIVA LAYOUT E MODAIS - CACHE BUSTER
const CompradorPage = () => {
  const { user } = useAuth();
  const { tab } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tab || 'comprar');
  const [selectedBoleto, setSelectedBoleto] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [etapaCompra, setEtapaCompra] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(null);
  const [comprovante, setComprovante] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);
  const [copiedCodigoBarras, setCopiedCodigoBarras] = useState(false);
  const [showComprovanteModal, setShowComprovanteModal] = useState(false);
  const [selectedComprovante, setSelectedComprovante] = useState(null);
  // Removido viewer lateral por simplicidade/performance

  // Hook fixo para usar com contratos Enhanced
  const { 
    createEscrow,
    registerBuyer,
    releaseEscrow,
    connectWallet,
    isLoading,
    error: escrowError,
    isConnected,
    address,
    networkCorrect
  } = useBoletoEscrowFixed();
  
  // Estados de conexão da carteira (agora vêm do hook)

  const taxaConversao = 5.0;

  const [boletosDisponiveis, setBoletosDisponiveis] = useState([]);

  const [meusBoletos, setMeusBoletos] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // Monitorar estado do sistema universal
  // Verificar conexão ao montar componente
  // Conexão da carteira é gerenciada pelo hook useBoletoEscrowFixed

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Verificar se o clique foi dentro de um dropdown
      const dropdownElement = event.target.closest('.dropdown-container');
      if (!dropdownElement) {
        setDropdownOpen(null);
      }
    };
    
    if (dropdownOpen !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [dropdownOpen]);

  // Monitorar mudanças na conexão da carteira
  useEffect(() => {
    if (isConnected && address && etapaCompra === 1) {
      // Sistema universal já gerencia a rede

      // Se a carteira foi conectada durante a etapa 1, avançar automaticamente
      setEtapaCompra(2);
      setAlertInfo({
        type: 'success',
        title: 'Carteira conectada automaticamente!',
        description: `Endereço: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`
      });
      setTimeout(() => setAlertInfo(null), 3000);
    } else if (!isConnected && etapaCompra === 2) {
      // Se a carteira foi desconectada durante a etapa 2, voltar para etapa 1
      setEtapaCompra(1);
      setAlertInfo({
        type: 'destructive',
        title: 'Carteira desconectada',
        description: 'Sua carteira foi desconectada. Conecte novamente para continuar.'
      });
      setTimeout(() => setAlertInfo(null), 3000);
    }
  }, [isConnected, address, etapaCompra]);

  // Verificar e restaurar temporizador para boletos pendentes
  useEffect(() => {
    if (meusBoletos && meusBoletos.length > 0) {
      const boletoPendente = meusBoletos.find(boleto => 
        boleto.status === 'PENDENTE_PAGAMENTO' && 
        boleto.dataCompra && 
        !boleto.comprovante_url
      );
      
      if (boletoPendente && tempoRestante === null) {
        const dataCompra = new Date(boletoPendente.dataCompra);
        const agora = new Date();
        const tempoDecorrido = Math.floor((agora - dataCompra) / 1000);
        const tempoRestanteCalculado = Math.max(0, 3600 - tempoDecorrido); // 1 hora = 3600 segundos
        
        if (tempoRestanteCalculado > 0) {
          setTempoRestante(tempoRestanteCalculado);
          setSelectedBoleto(boletoPendente);
          setEtapaCompra(3);
        }
      }
    }
  }, [meusBoletos, tempoRestante]);

  // Função para buscar boletos do usuário autenticado (ULTRA OTIMIZADA)
  const fetchMeusBoletos = async () => {
    if (!user?.uid) return;
    
    try {
      console.log('🔍 [COMPRADOR] Buscando boletos do usuário:', user.uid);
      
      // SEMPRE FORÇAR REQUISIÇÃO FRESCA - SEM CACHE
      const timestamp = Date.now();
      const walletQuery = address ? `&wallet=${encodeURIComponent(address)}` : '';
      const res = await fetch(buildApiUrl(`/boletos/comprados/${user.uid}?t=${timestamp}${walletQuery}`), {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!res.ok) throw new Error('Erro ao buscar boletos do usuário');
      const data = await res.json();
      const lista = Array.isArray(data) ? data : (data?.data || []);
      
      const boletosMapeados = lista.map(boleto => ({
        ...boleto,
        numeroBoleto: boleto.numero_controle || boleto.numeroBoleto,
        codigoBarras: boleto.codigo_barras || boleto.codigoBarras,
        valor: boleto.valor_brl || boleto.valor || 0,
        valor_usdt: boleto.valor_usdt || 0,
        dataCompra: boleto.criado_em || boleto.dataCompra,
        comprovanteUrl: boleto.comprovante_url || boleto.comprovanteUrl,
        status: mapStatus(boleto.status)
      }));
      
      setMeusBoletos(boletosMapeados);
      // Atualizar cache
      setBoletosCache(boletosMapeados);
      setCacheTime(Date.now());
    } catch (error) {
      console.error('Erro ao buscar boletos:', error);
      setMeusBoletos([]);
    }
  };

  // Cache para boletos do usuário (OTIMIZADO)
  const [boletosCache, setBoletosCache] = useState(null);
  const [cacheTime, setCacheTime] = useState(0);
  const CACHE_DURATION = 0; // CACHE DESABILITADO PARA DEBUG
  
  // LIMPAR TODO O CACHE LOCAL DO COMPRADOR
  useEffect(() => {
    localStorage.removeItem('boletosCache');
    sessionStorage.removeItem('boletosCache');
    localStorage.removeItem('meusBoletosCache');
    sessionStorage.removeItem('meusBoletosCache');
    console.log('🧹 [COMPRADOR] Cache local limpo completamente');
  }, []);
  
  // Preload de dados quando usuário loga
  useEffect(() => {
    if (user?.uid && !boletosCache) {
      // Preload silencioso em background
      fetchMeusBoletos();
    }
  }, [user?.uid]);

  // Função para busca inicial com loading (apenas na navegação)
  const fetchMeusBoletosComLoading = async () => {
    if (!user?.uid) return;
    
    // SEMPRE FORÇAR REQUISIÇÃO REAL - CACHE DESABILITADO
    console.log('🔄 [COMPRADOR] Forçando requisição real ao backend (cache desabilitado)');
    
    setLoadingMeusBoletos(true);
    try {
      await fetchMeusBoletos();
      // Não atualizar cache - sempre buscar dados frescos
      setBoletosCache(null);
      setCacheTime(0);
    } finally {
      setLoadingMeusBoletos(false);
    }
  };

  const handleSelecionarBoleto = (boleto) => {

    setSelectedBoleto(boleto);
    setEtapaCompra(1);
    setShowModal(true);

  };

  const handleConectarCarteira = async () => {
    try {
      console.log('🔄 [DEBUG] Iniciando conexão da carteira...');
      
      // Verificar se MetaMask está disponível
      if (!window.ethereum) {
        throw new Error('MetaMask não detectado. Instale a extensão MetaMask.');
      }
      
      console.log('✅ [DEBUG] MetaMask detectado');
      
      // Solicitar conexão
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('Nenhuma conta disponível');
      }
      
      const selectedAccount = accounts[0];
      console.log('✅ [DEBUG] Conta conectada:', selectedAccount);
      
      // Verificar rede
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const isCorrectNetwork = parseInt(chainId, 16) === 80002; // Polygon Amoy
      
      if (!isCorrectNetwork) {
        console.log('⚠️ [DEBUG] Rede incorreta. Tentando trocar...');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x13882' }] // 0x13882 = 80002 em hex
          });
        } catch (switchError) {
          console.error('❌ [DEBUG] Erro ao trocar rede:', switchError);
          throw new Error('Erro ao trocar para a rede Polygon Amoy');
        }
      }
      
      console.log('✅ [DEBUG] Rede configurada corretamente');
      
      // Chamar o hook original
      await connectWallet();
      
      setAlertInfo({
        type: 'success',
        title: 'Carteira conectada!',
        description: 'Agora você pode escolher um boleto para comprar.'
      });
      setTimeout(() => setAlertInfo(null), 3000);
      
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao conectar carteira:', error);
      setAlertInfo({
        type: 'destructive',
        title: 'Erro de conexão',
        description: error.message || 'Erro ao conectar carteira. Verifique se ela está instalada e desbloqueada.'
      });
      setTimeout(() => setAlertInfo(null), 3000);
    }
  };

  const handleTravarBoleto = async () => {
    if (!isConnected || !address) {
      setAlertInfo({
        type: 'destructive',
        title: 'Carteira não conectada',
        description: 'Conecte sua carteira antes de reservar o boleto.'
      });
      setTimeout(() => setAlertInfo(null), 3000);
      return;
    }

    // Verificar se está na rede correta (sistema universal já gerencia isso)
    // Removido verificação manual - sistema universal já valida a rede

    setAlertInfo({
      type: 'default',
      title: 'Reservando boleto...',
      description: 'Aguarde enquanto reservamos o boleto para você.'
    });

    try {
      // No contrato Enhanced, apenas chamar o backend para reservar
      // O smart contract será atualizado pelo vendedor quando aprovar
      const resourcePath = `/boletos/controle/${selectedBoleto.numero_controle}/reservar`;
      const response = await fetch(buildApiUrl(resourcePath), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.uid,
          wallet_address: address,
          tx_hash: null // Sem transação blockchain neste momento
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao reservar boleto no backend');
      }

      setEtapaCompra(3);
      setSelectedBoleto(prev => prev ? { ...prev, status: 'AGUARDANDO PAGAMENTO' } : prev);
      setTempoRestante(3600);
      setAlertInfo({
        type: 'success',
        title: 'Boleto reservado com sucesso!',
        description: 'Você tem 60 minutos para efetuar o pagamento e enviar o comprovante. O boleto foi reservado para você.'
      });
      setTimeout(() => setAlertInfo(null), 5000);
      
            setBoletosDisponiveis(prevBoletos => 
        prevBoletos.map(b =>
          b.id === selectedBoleto.id ? { ...b, status: 'AGUARDANDO PAGAMENTO' } : b
        )
      );
      fetchMeusBoletosComLoading();
    } catch (error) {
      console.error('Erro ao travar boleto:', error);
      setAlertInfo({
        type: 'destructive',
        title: 'Erro ao reservar boleto',
        description: error.message || 'Não foi possível reservar o boleto. Tente novamente.'
      });
      setTimeout(() => setAlertInfo(null), 5000);
    }
  };

  const handleCancelarCompra = async () => {
    setAlertInfo({
      type: 'default',
      title: 'Cancelando compra...',
      description: 'Aguarde enquanto cancelamos sua compra e liberamos os USDT.'
    });

    try {
      // Se já travou USDT no contrato, liberar
      if (etapaCompra >= 2 && address) {
        const result = await releaseEscrow({
          boletoId: selectedBoleto.numero_controle
        });
        
        if (!result.success) {
          console.warn('Falha ao liberar USDT no contrato:', result);
        }
      }

      // Liberar o boleto no backend
      if (selectedBoleto.numero_controle) {
        await fetch(buildApiUrl(`/boletos/${selectedBoleto.numero_controle}/liberar`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.uid })
        });
      }

      setShowModal(false);
      setEtapaCompra(0);
      setTempoRestante(null);
      setSelectedBoleto(null);

      setBoletosDisponiveis(prevBoletos => 
        prevBoletos.map(b => 
          b.id === selectedBoleto.id ? { ...b, status: 'DISPONIVEL' } : b
        )
      );

      setAlertInfo({
        type: 'destructive',
        title: 'Compra cancelada',
        description: 'O boleto foi liberado para outros compradores e os USDT foram devolvidos.'
      });

      setTimeout(() => setAlertInfo(null), 3000);
    } catch (error) {
      console.error('Erro ao cancelar compra:', error);
      setAlertInfo({
        type: 'destructive',
        title: 'Erro ao cancelar compra',
        description: 'Ocorreu um erro ao cancelar a compra. Tente novamente.'
      });
      setTimeout(() => setAlertInfo(null), 3000);
    }
  };

  // Após envio de comprovante, buscar boletos atualizados do backend
  const handleEnviarComprovante = (e) => {
    e.preventDefault();
    
    // Verificar se há um arquivo selecionado
    if (!comprovante) {
      setAlertInfo({
        type: 'destructive',
        title: 'Arquivo não selecionado',
        description: 'Por favor, selecione um arquivo de comprovante antes de enviar.'
      });
      setTimeout(() => setAlertInfo(null), 3000);
      return;
    }

    const file = comprovante;
    
    setAlertInfo({
      type: 'default',
      title: 'Enviando comprovante...',
      description: 'Aguarde enquanto processamos seu comprovante.'
    });

    // Converter arquivo para base64 para armazenamento
    const reader = new FileReader();
    reader.onload = async () => {
      const comprovanteUrl = reader.result; // Base64 do arquivo
      
      try {
        
        // Enviar comprovante para o backend (usar rota sem /api/)
        const response = await fetch(buildApiUrl(`/boletos/${selectedBoleto.numero_controle}/comprovante`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            comprovante_url: comprovanteUrl,
            filename: file.name,
            filesize: file.size,
            filetype: file.type
          })
        });
        
        if (!response.ok) {
          throw new Error('Erro ao enviar comprovante');
        }
        
        const boletoAtualizado = await response.json();
        
        // Atualizar o boleto selecionado com a URL do comprovante
        setSelectedBoleto(prev => ({
          ...prev,
          comprovanteUrl: comprovanteUrl,
          status: 'AGUARDANDO BAIXA'
        }));
        
        setEtapaCompra(4);
        setTempoRestante(null);
        setShowModal(false);
        setActiveTab('meusBoletos');
        
        // Aguardar um pouco antes de buscar os boletos atualizados
        setTimeout(async () => {
          await fetchMeusBoletosComLoading();
        }, 1000);
        
        setAlertInfo({
          type: 'success',
          title: 'Pagamento confirmado!',
          description: `Comprovante enviado. Aguarde a confirmação da baixa pelo vendedor.`
        });
        setTimeout(() => {
          setAlertInfo(null);
        }, 5000);
      } catch (error) {
        console.error('Erro ao enviar comprovante:', error);
        setAlertInfo({
          type: 'destructive',
          title: 'Erro ao enviar comprovante',
          description: 'Não foi possível enviar o comprovante. Tente novamente.'
        });
        setTimeout(() => setAlertInfo(null), 3000);
      }
    };
    
    reader.readAsDataURL(file);
  };

    // Abrir comprovante em nova aba (solução profissional definitiva)
  const handleVisualizarComprovante = (boleto) => {
    try {

      
      const ident = boleto.numeroBoleto || boleto.numero_controle || boleto.id;
      
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
            console.warn('⚠️ Erro ao criar blob, usando base64 direto:', blobError);
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
      console.error('❌ Erro ao abrir comprovante:', error);
      alert('Erro ao abrir comprovante. Tente novamente.');
    }
  };

  // openComprovantePage removido — única forma é página dedicada

  // Função para pagar boleto
  const handlePagarBoleto = (boleto) => {
    setSelectedBoleto(boleto);
    setEtapaCompra(3);
    setShowModal(true);
  };

  // Função para abrir disputa
  const handleDisputa = (boleto) => {
    setAlertInfo({
      type: 'default',
      title: 'Abrindo disputa...',
      description: 'Funcionalidade de disputa será implementada em breve.'
    });
    setTimeout(() => setAlertInfo(null), 3000);
  };



  useEffect(() => {
    let timer;
    if (tempoRestante !== null && tempoRestante > 0) {
      timer = setInterval(() => {
        setTempoRestante(prev => prev - 1);
      }, 1000);
    } else if (tempoRestante === 0) {
      handleCancelarCompra();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [tempoRestante]);

    // Estados para loading
  const [loadingBoletos, setLoadingBoletos] = useState(false);
  const [loadingMeusBoletos, setLoadingMeusBoletos] = useState(false);

  // Cache para boletos disponíveis (usando variáveis já declaradas acima)

  // Função otimizada para buscar boletos disponíveis
  const fetchBoletosDisponiveis = async (forceRefresh = false) => {
    if (!user?.uid) return;

    try {
      console.log('🔍 [COMPRADOR] Buscando boletos disponíveis...');
      
      // SEMPRE FORÇAR REQUISIÇÃO FRESCA - SEM CACHE
      const timestamp = Date.now();
      const url = buildApiUrl(`/boletos?t=${timestamp}`);
      
      const headers = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      const res = await fetch(url, { headers });
      
      if (!res.ok) throw new Error('Erro ao buscar boletos disponíveis');
      const data = await res.json();
      
      const lista = Array.isArray(data) ? data : (data?.data || []);

      const boletosMapeados = lista.map(boleto => {
        const statusMapeado = boleto.status === 'DISPONIVEL' ? 'DISPONIVEL' : boleto.status;
        return {
          ...boleto,
          numeroBoleto: boleto.numero_controle || boleto.numeroBoleto,
          codigoBarras: boleto.codigo_barras || boleto.codigoBarras,
          valor: boleto.valor_brl || boleto.valor || 0,
          valor_usdt: boleto.valor_usdt || 0,
          dataVencimento: boleto.vencimento || boleto.dataVencimento,
          beneficiario: boleto.cpf_cnpj || boleto.beneficiario,
          status: statusMapeado
        };
      });

      const boletosDisponiveis = boletosMapeados.filter(boleto => boleto.status === 'DISPONIVEL');
      setBoletosDisponiveis(boletosDisponiveis);
    } catch (error) {
      console.error('Erro ao buscar boletos disponíveis:', error);
      setBoletosDisponiveis([]);
    }
  };

  useEffect(() => {
    // Carregamento lazy - só carregar quando necessário
    if (activeTab === 'comprar') {
      fetchBoletosDisponiveis();
    }
  }, [activeTab, user?.uid]); // Adicionado user?.uid como dependência

  useEffect(() => {
    if (tab && tab !== activeTab) setActiveTab(tab);
    // eslint-disable-next-line
  }, [tab]);

  // Polling para atualização automática de boletos (SILENCIOSO)
  useEffect(() => {
    let interval;
    if (activeTab === 'meusBoletos' || activeTab === 'historico') {
      fetchMeusBoletosComLoading(); // Busca inicial com loading
      interval = setInterval(() => {
        fetchMeusBoletos(); // Polling silencioso sem loading
      }, 5000); // 5 segundos como original
    } else if (activeTab === 'comprar') {
      fetchBoletosDisponiveis(true); // Busca inicial com refresh forçado
      interval = setInterval(() => {
        fetchBoletosDisponiveis(); // Polling silencioso para livro de ordens
      }, 3000); // 3 segundos para atualização mais frequente
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, user?.uid]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/app/comprador/${tab}`);
  };

  // Função utilitária para valor líquido USDT
  function valorLiquidoUSDT(valor_usdt) {
    if (valor_usdt === undefined || valor_usdt === null) {
      return '--';
    }
    const valor = Number(valor_usdt);
    if (isNaN(valor)) {
      return '--';
    }
    
    // O valor_usdt já vem convertido do backend, apenas formatar
    return valor.toFixed(2);
  }

  // Função utilitária para taxa de serviço (5%)
  function taxaServicoUSDT(valor_usdt) {
    return valor_usdt !== undefined && valor_usdt !== null ? (Number(valor_usdt) * 0.05).toFixed(2) : '--';
  }

  // Função utilitária para taxa de serviço em reais (5% do valor em reais)
  function taxaServicoReais(valor_reais) {
    return valor_reais !== undefined && valor_reais !== null ? (Number(valor_reais) * 0.05).toFixed(2) : '--';
  }

  return (
    <div className="min-h-screen bg-lime-300 flex flex-col items-center justify-center">
      <main className="flex-1 w-full max-w-6xl px-4 py-1">
        <div className="w-full mx-auto">
          <div className="flex justify-between items-center mb-2 bg-green-800 text-white p-2 rounded-lg">
            <h1 className="text-3xl font-bold">Portal do Comprador</h1>
            <button
              onClick={() => fetchBoletosDisponiveis(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              title="Atualizar lista de boletos"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar
            </button>
          </div>

          {/* Sistema de refresh de saldos em background */}
          <BalanceRefresher address={address} isBackgroundMode={true} />
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-3 bg-lime-300 p-1 rounded-xl">
              <TabsTrigger value="comprar" className="flex items-center justify-center data-[state=active]:bg-lime-600 data-[state=active]:text-white">
                <FaShoppingCart className="mr-2" /> Comprar USDT
              </TabsTrigger>
              <TabsTrigger value="meusBoletos" className="flex items-center justify-center data-[state=active]:bg-lime-600 data-[state=active]:text-white">
                <FaList className="mr-2" /> Meus Boletos
              </TabsTrigger>
              <TabsTrigger value="historico" className="flex items-center justify-center data-[state=active]:bg-lime-600 data-[state=active]:text-white">
                <FaHistory className="mr-2" /> Histórico
              </TabsTrigger>
            </TabsList>
            <TabsContent value="comprar">
              {/* Informações explicativas sobre o sistema */}
              <div style={{
                backgroundColor: '#f0fdf4',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #bbf7d0',
                marginBottom: '1rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#166534',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaInfoCircle style={{ color: '#16a34a' }} />
                  Como funciona o BoletoXCrypto
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p style={{ color: '#15803d', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>•</span>
                    Aqui você visualiza os boletos disponíveis para compra de USDT, de forma segura
                  </p>
                  <p style={{ color: '#15803d', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>•</span>
                    Não necessita confiar no VENDEDOR, como numa operação P2P comum
                  </p>
                  <p style={{ color: '#15803d', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>•</span>
                    Clique em "SELECIONAR" para iniciar a transação de compra
                  </p>
                  <p style={{ color: '#15803d', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>•</span>
                    O crédito em USDT já está travado na blockchain e será liberado na sua carteira, assim que o "VENDEDOR" receber o comprovante de pagamento e confirmar a baixa do boleto
                  </p>
                </div>
              </div>
              
              <Card>
                <CardHeader className="bg-green-800 text-white">
                  <CardTitle className="text-xl">Livro de Ordens - Boletos Disponíveis</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {loadingBoletos ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 text-lg">Carregando boletos disponíveis...</p>
                      <p className="text-gray-500 text-sm mt-2">Aguarde enquanto buscamos as melhores ofertas</p>
                    </div>
                  ) : boletosDisponiveis.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FaFileInvoiceDollar className="mx-auto text-6xl mb-4 text-gray-300" />
                      <h3 className="text-xl font-semibold mb-2">Nenhum boleto disponível</h3>
                      <p>Não há boletos para compra no momento. Tente novamente mais tarde.</p>
                    </div>
                  ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse bg-white rounded-lg overflow-hidden">
                      <thead className="bg-lime-600 text-white">
                        <tr>
                          <th className="py-3 px-4 text-left">Nº Boleto</th>
                          <th className="py-3 px-4 text-left">Valor (R$)</th>
                            <th className="py-3 px-4 text-left">Valor (USDT)</th>
                          <th className="py-3 px-4 text-left">Data Venc/to</th>
                          <th className="py-3 px-4 text-left">Beneficiário</th>
                          <th className="py-3 px-4 text-left">Status</th>
                          <th className="py-3 px-4 text-left">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boletosDisponiveis.map((boleto) => (
                          <tr 
                            key={`disponivel-${boleto.id || boleto.numeroBoleto}-${Math.random()}`} 
                            className={`border-b border-gray-200 hover:bg-lime-50 ${selectedBoleto?.id === boleto.id ? 'bg-lime-100' : ''}`}
                          >
                            <td className="py-3 px-4">{boleto.numeroBoleto}</td>
                            <td className="py-3 px-4">R$ {(boleto.valor !== undefined && boleto.valor !== null) ? boleto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--'}</td>
                            <td className="py-3 px-4">{boleto.valor_usdt ? valorLiquidoUSDT(boleto.valor_usdt) + ' USDT' : '--'}</td>
                            <td className="py-3 px-4">
                              {(() => {
                                try {
                                  // Verificar se a data existe
                                  if (!boleto.dataVencimento || boleto.dataVencimento === null) {
                                    return '--';
                                  }
                                  
                                  // Tentar diferentes formatos de data
                                  let data;
                                  if (typeof boleto.dataVencimento === 'string') {
                                    data = new Date(boleto.dataVencimento);
                                  } else if (boleto.dataVencimento instanceof Date) {
                                    data = boleto.dataVencimento;
                                  } else {
                                    return '--';
                                  }
                                  
                                  if (isNaN(data.getTime())) {
                                    return '--';
                                  }
                                  
                                  return data.toLocaleDateString('pt-BR');
                                } catch (error) {
                                  return '--';
                                }
                              })()}
                            </td>
                            <td className="py-3 px-4">{boleto.beneficiario}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {boleto.status.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button 
                                onClick={() => handleSelecionarBoleto(boleto)} 
                                className="bg-lime-600 hover:bg-lime-700 text-white text-sm py-1 px-2 rounded"
                              >
                                Selecionar
                              </button>
                            </td>
                          </tr>
                        ))}
                        {boletosDisponiveis.length === 0 && (
                          <tr>
                            <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                              Não há boletos disponíveis para compra no momento.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="meusBoletos">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Lista */}
              <Card>
                <CardHeader className="bg-green-800 text-white">
                  <CardTitle className="text-xl">MEUS BOLETOS</CardTitle>
                  <CardDescription className="text-white">Boletos que você comprou e pagou</CardDescription>
                </CardHeader>
                  <CardContent className="p-4">
                    {loadingMeusBoletos ? (
                      <div className="space-y-4">
                        {/* Skeleton loading */}
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-16 bg-gray-200 rounded-lg"></div>
                          </div>
                        ))}
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                          <p className="text-gray-600 text-sm">Carregando seus boletos...</p>
                        </div>
                      </div>
                    ) : meusBoletos.filter(boleto => boleto.status !== 'DISPONIVEL').length === 0 ? (
                      <div className="text-center text-gray-500 py-12">
                        <FaHistory className="mx-auto text-5xl mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum boleto comprado</h3>
                        <p>Você ainda não comprou nenhum boleto.</p>
                      </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse bg-white rounded-lg overflow-hidden">
                        <thead className="bg-lime-600 text-white">
                          <tr>
                            <th className="py-3 px-4 text-left">Nº Boleto</th>
                            <th className="py-3 px-4 text-left">Valor (R$)</th>
                            <th className="py-3 px-4 text-left">Valor Líquido (USDT)</th>
                            <th className="py-3 px-4 text-left">Taxa Serviço</th>
                            <th className="py-3 px-4 text-left">Data Compra</th>
                            <th className="py-3 px-4 text-left">Status</th>
                            <th className="py-3 px-4 text-left">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {meusBoletos.filter(boleto => boleto.status !== 'DISPONIVEL').map((boleto) => (
                            <tr key={`reservado-${boleto.id || boleto.numeroBoleto}-${Math.random()}`} className="border-b border-gray-200 hover:bg-lime-50">
                              <td className="py-3 px-4">{boleto.numeroBoleto}</td>
                              <td className="py-3 px-4">R$ {(boleto.valor !== undefined && boleto.valor !== null) ? Number(boleto.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--'}</td>
                              <td className="py-3 px-4">{boleto.valor_usdt ? valorLiquidoUSDT(boleto.valor_usdt) + ' USDT' : '--'}</td>
                              <td className="py-3 px-4">R$ {boleto.valor ? taxaServicoReais(boleto.valor) : '--'} ({boleto.valor_usdt ? taxaServicoUSDT(boleto.valor_usdt) + ' USDT' : '--'})</td>
                              <td className="py-3 px-4">{boleto.dataCompra ? (() => {
                                const data = new Date(boleto.dataCompra);
                                return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR');
                              })() : '--'}</td>
                                <td className="py-3 px-4"><StatusBadge status={boleto.status} /></td>
                              <td className="py-3 px-6 w-44 flex gap-2">
                                <div className="relative dropdown-container">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDropdownOpen(dropdownOpen === boleto.numeroBoleto ? null : boleto.numeroBoleto);
                                    }}
                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-bold transition-colors duration-200"
                                  >
                                    Ações
                                  </button>
                                  
                                  {dropdownOpen === boleto.numeroBoleto && (
                                    <div 
                                      className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="py-1">
                                        <button
                                          onClick={() => { 
                                            handlePagarBoleto(boleto); 
                                            setDropdownOpen(null); 
                                          }}
                                          disabled={boleto.status === 'AGUARDANDO BAIXA' || boleto.status === 'BAIXADO'}
                                          className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center ${
                                            boleto.status === 'AGUARDANDO BAIXA' || boleto.status === 'BAIXADO' 
                                              ? 'text-gray-400 cursor-not-allowed' 
                                              : 'text-gray-700 hover:bg-gray-100'
                                          }`}
                                        >
                                      <FaCreditCard className="mr-2 text-sm" />
                                      Pagar Boleto
                                        </button>
                                        
                                        <button
                                          onClick={() => { 
                                            setSelectedBoleto(boleto); 
                                            setEtapaCompra(3); 
                                            setShowModal(true); 
                                            setDropdownOpen(null); 
                                          }}
                                          disabled={boleto.comprovante_url || boleto.comprovanteUrl || boleto.status === 'BAIXADO'}
                                          className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center ${
                                            boleto.comprovante_url || boleto.comprovanteUrl || boleto.status === 'BAIXADO' 
                                              ? 'text-gray-400 cursor-not-allowed' 
                                              : 'text-gray-700 hover:bg-gray-100'
                                          }`}
                                        >
                                      <FaUpload className="mr-2 text-sm" />
                                      Enviar Comprovante
                                        </button>

                                        <button
                                          onClick={() => {
                                        handleVisualizarComprovante(boleto);
                                            setDropdownOpen(null);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center"
                                        >
                                          <FaEye className="mr-2 text-sm" />
                                          Visualizar Comprovante
                                        </button>
                                        
                                        <button
                                          onClick={() => { 
                                            handleDisputa(boleto); 
                                            setDropdownOpen(null); 
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center"
                                        >
                                      <FaExclamationTriangle className="mr-2 text-sm" />
                                      Disputa
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

                {/* Viewer lateral removido para simplificar e melhorar performance */}
              </div>
            </TabsContent>
            <TabsContent value="historico">
              <Card>
                <CardHeader className="bg-green-800 text-white">
                  <CardTitle className="text-xl">Histórico de Transações</CardTitle>
                  <CardDescription className="text-white">Registro de todas as suas transações</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {meusBoletos.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Você ainda não realizou nenhuma transação.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse bg-white rounded-lg overflow-hidden">
                        <thead className="bg-lime-600 text-white">
                          <tr>
                            <th className="py-3 px-4 text-left">Data da Compra</th>
                            <th className="py-3 px-4 text-left">Valor (R$)</th>
                            <th className="py-3 px-4 text-left">Valor (USDT)</th>
                            <th className="py-3 px-4 text-left">Taxa Serviço</th>
                            <th className="py-3 px-4 text-left">Comprovante</th>
                          </tr>
                        </thead>
                        <tbody>
                          {meusBoletos.map((boleto) => (
                            <tr key={`historico-${boleto.id || boleto.numeroBoleto}-${Math.random()}`} className="border-b border-gray-200 hover:bg-lime-50">
                              <td className="py-3 px-4">
                                {boleto.dataCompra ? (() => {
                                  const data = new Date(boleto.dataCompra);
                                  return (
                                    <>
                                      {data.toLocaleDateString('pt-BR')}
                                      <br />
                                      <span className="text-xs text-gray-400">
                                        {data.toLocaleTimeString('pt-BR')}
                                      </span>
                                    </>
                                  );
                                })() : '--'}
                              </td>
                              <td className="py-3 px-4">R$ {(boleto.valor !== undefined && boleto.valor !== null) ? Number(boleto.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--'}</td>
                              <td className="py-3 px-4">{boleto.valor_usdt ? valorLiquidoUSDT(boleto.valor_usdt) + ' USDT' : '--'}</td>
                              <td className="py-3 px-4">R$ {boleto.valor ? taxaServicoReais(boleto.valor) : '--'} ({boleto.valor_usdt ? taxaServicoUSDT(boleto.valor_usdt) + ' USDT' : '--'})</td>
                              <td className="py-3 px-4">
                                {(boleto.comprovante_url || boleto.comprovanteUrl || boleto.status === 'AGUARDANDO BAIXA') ? (
                                  <button
                                    onClick={() => {

                                      handleVisualizarComprovante(boleto);
                                    }}
                                    className="bg-green-700 hover:bg-green-800 text-white py-1 px-3 rounded flex items-center justify-center gap-2 text-sm font-semibold transition-colors duration-200"
                                    title="Visualizar Comprovante"
                                  >
                                    <FaUpload /> VISUALIZAR COMPROVANTE
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-sm">Não enviado</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          {alertInfo && (
            <Alert variant={alertInfo.type} className="mb-6">
              <div className="flex items-start">
                {alertInfo.type === 'destructive' && <FaExclamationTriangle className="mr-2 h-4 w-4" />}
                {alertInfo.type === 'success' && <FaCheck className="mr-2 h-4 w-4" />}
                {alertInfo.type === 'default' && <FaInfoCircle className="mr-2 h-4 w-4" />}
                <div>
                  <AlertTitle>{alertInfo.title}</AlertTitle>
                  {alertInfo.description && (
                    <AlertDescription>{alertInfo.description}</AlertDescription>
                  )}
                </div>
              </div>
            </Alert>
          )}
        </div>
      </main>
      {showModal && selectedBoleto && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)',
              zIndex: 9998
            }}
            onClick={() => {
              setShowModal(false);
              setSelectedBoleto(null);
              setEtapaCompra(0);
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '95%',
              maxWidth: '896px',
              maxHeight: '80vh',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              color: '#1f2937',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              borderRadius: '1rem',
              border: '2px solid #16a34a',
              zIndex: 9999,
              pointerEvents: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header melhorado com gradiente e botão fechar destacado */}
            <div style={{
              padding: '1.5rem 1.5rem 1rem 1.5rem',
              borderBottom: '2px solid #16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(to right, #16a34a, #15803d)',
              borderRadius: '1rem 1rem 0 0'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaCreditCard style={{ color: '#ffffff', fontSize: '1.125rem' }} />
                </div>
                Detalhes do Boleto
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedBoleto(null);
                  setEtapaCompra(0);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.color = '#16a34a';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.color = '#ffffff';
                }}
                title="Fechar"
                aria-label="Fechar modal"
              >
                <FaTimesCircle size={18} />
                <span>Fechar</span>
              </button>
            </div>
            <div style={{
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Nº Boleto:</span>
                <span style={{
                  fontFamily: 'monospace',
                  color: '#1f2937',
                  backgroundColor: '#f9fafb',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.5rem'
                }}>{selectedBoleto.numeroBoleto}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Beneficiário CPF/CNPJ:</span>
                <span style={{ color: '#1f2937' }}>{selectedBoleto.beneficiario}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Valor (R$):</span>
                <span style={{
                  color: '#15803d',
                  fontWeight: 'bold',
                  fontSize: '1.125rem'
                }}>
                  R$ {(selectedBoleto.valor !== undefined && selectedBoleto.valor !== null) ? selectedBoleto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Valor Líquido (USDT):</span>
                <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{valorLiquidoUSDT(selectedBoleto.valor_usdt)} USDT</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Código de Barras:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    backgroundColor: '#f3f4f6',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    color: '#1f2937',
                    userSelect: 'all',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    maxWidth: '420px',
                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
                    wordBreak: 'break-all'
                  }}>
                    {(selectedBoleto.codigoBarras || selectedBoleto.codigo_barras || '--')}
                  </span>
                  <button
                    style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#15803d'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#16a34a'}
                    onClick={() => {
                      const codigo = selectedBoleto.codigoBarras || selectedBoleto.codigo_barras || '';
                      if (codigo) {
                        navigator.clipboard.writeText(codigo);
                        setCopiedCodigoBarras(true);
                        setTimeout(() => setCopiedCodigoBarras(false), 1500);
                      }
                    }}
                  >
                    Copiar
                  </button>
                  {copiedCodigoBarras && <span style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: '600' }}>Copiado!</span>}
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Vencimento:</span>
                <span style={{ color: '#1f2937' }}>
                  {(() => {
                    try {
                      if (!selectedBoleto.dataVencimento) return '--';
                      const data = new Date(selectedBoleto.dataVencimento);
                      return isNaN(data.getTime()) ? '--' : data.toLocaleDateString('pt-BR');
                    } catch (error) {
                      console.error('Erro ao processar data no modal:', selectedBoleto.dataVencimento, error);
                      return '--';
                    }
                  })()}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Status:</span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  ...(selectedBoleto.status === 'DISPONIVEL' ? {
                    backgroundColor: '#dcfce7',
                    color: '#166534'
                  } : selectedBoleto.status === 'AGUARDANDO PAGAMENTO' ? {
                    backgroundColor: '#fef3c7',
                    color: '#92400e'
                  } : selectedBoleto.status === 'BAIXADO' ? {
                    backgroundColor: '#dbeafe',
                    color: '#1e40af'
                  } : {
                    backgroundColor: '#f3f4f6',
                    color: '#374151'
                  })
                }}>
                  {selectedBoleto.status || '--'}
                </span>
              </div>
              {/* Etapa 1: Conectar carteira */}
              {etapaCompra === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                  <div style={{
                    backgroundColor: '#eff6ff',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #bfdbfe'
                  }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#1e40af',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <FaWallet style={{ color: '#2563eb' }} />
                      Conectar Carteira
                    </h3>
                    <p style={{ color: '#1e40af', fontSize: '0.875rem' }}>Para prosseguir com a compra, conecte sua carteira digital.</p>
                  </div>
                  <button
                    onClick={handleConectarCarteira}
                    style={{
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#15803d'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#16a34a'}
                  >
                    <FaWallet /> Conectar Carteira
                  </button>
                </div>
              )}
              {/* Etapa 2: Travar boleto */}
              {etapaCompra === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                  {isConnected && address ? (
                    <>
                      <div style={{
                        backgroundColor: '#f0fdf4',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #bbf7d0'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '0.75rem'
                        }}>
                          <FaWallet style={{ color: '#16a34a', marginRight: '0.5rem', fontSize: '1.125rem' }} />
                          <span style={{ fontWeight: '600', color: '#166534', fontSize: '1.125rem' }}>Carteira Conectada</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: '#15803d', wordBreak: 'break-all', marginBottom: '0.5rem' }}>Endereço: {address}</p>
                        <p style={{ fontSize: '0.75rem', color: '#16a34a' }}>Rede: Polygon Amoy</p>
                      </div>
                      <button
                        onClick={handleTravarBoleto}
                        style={{
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          fontWeight: '600',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '0.5rem',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.75rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#15803d'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#16a34a'}
                      >
                        <FaLock /> TRAVAR BOLETO
                      </button>
                    </>
                  ) : (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #fecaca'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '0.75rem'
                      }}>
                        <FaExclamationTriangle style={{ color: '#dc2626', marginRight: '0.5rem', fontSize: '1.125rem' }} />
                        <span style={{ fontWeight: '600', color: '#991b1b', fontSize: '1.125rem' }}>Carteira não conectada</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#dc2626', marginBottom: '1rem' }}>Você precisa conectar sua carteira para continuar.</p>
                      <button
                        onClick={handleConectarCarteira}
                        style={{
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '0.5rem',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.75rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#15803d'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#16a34a'}
                      >
                        <FaWallet /> Conectar Carteira
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* Etapa 3: Enviar comprovante */}
              {etapaCompra === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                  <div style={{
                    backgroundColor: '#fffbeb',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #fed7aa'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <FaClock style={{ color: '#d97706', marginRight: '0.5rem', fontSize: '1.125rem' }} />
                      <span style={{ fontWeight: '600', color: '#92400e', fontSize: '1.125rem' }}>Tempo Restante para Pagamento</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      margin: '1rem 0'
                    }}>
                      <div style={{
                        borderRadius: '0.75rem',
                        backgroundColor: '#fef3c7',
                        border: '2px solid #f59e0b',
                        padding: '1rem 2.5rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '1rem'
                      }}>
                        <span style={{
                          fontSize: '3rem',
                          fontWeight: '800',
                          color: '#92400e',
                          letterSpacing: '0.1em',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          {Math.floor(tempoRestante / 60)}:{(tempoRestante % 60).toString().padStart(2, '0')}
                        </span>
                        <span style={{
                          fontSize: '1.25rem',
                          fontWeight: 'bold',
                          color: '#92400e',
                          marginBottom: '0.25rem',
                          letterSpacing: '0.125em'
                        }}>
                          minutos
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#d97706', marginTop: '0.5rem', textAlign: 'center' }}>
                      Realize o pagamento do boleto e envie o comprovante antes que o tempo acabe.
                    </p>
                  </div>
                  <form onSubmit={handleEnviarComprovante} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{
                      backgroundColor: '#eff6ff',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #bfdbfe'
                    }}>
                      <Label htmlFor="comprovante" style={{
                        color: '#1e40af',
                        fontWeight: '600',
                        fontSize: '1.125rem',
                        marginBottom: '0.5rem',
                        display: 'block'
                      }}>Enviar Comprovante de Pagamento</Label>
                      <Input
                        id="comprovante"
                        type="file"
                        accept="image/*,.pdf"
                        required
                        onChange={(e) => setComprovante(e.target.files[0])}
                        style={{
                          marginTop: '0.5rem',
                          borderColor: '#93c5fd',
                          borderRadius: '0.375rem'
                        }}
                        className="focus:border-blue-500 focus:ring-blue-500"
                      />
                      <p style={{ color: '#1e40af', fontSize: '0.875rem', marginTop: '0.5rem' }}>Aceita imagens (JPG, PNG) e PDFs</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Deseja realmente cancelar esta compra? O boleto será liberado para outros compradores.')) {
                            handleCancelarCompra();
                          }
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: '#d1d5db',
                          color: '#374151',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#9ca3af'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#d1d5db'}
                      >
                        <FaTimesCircle style={{ marginRight: '0.5rem' }} /> Cancelar
                      </button>
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontWeight: '600',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#15803d'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#16a34a'}
                      >
                        <FaUpload style={{ marginRight: '0.5rem' }} /> Enviar Comprovante
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {/* Etapa 4: Pagamento confirmado */}
              {etapaCompra === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                  <div style={{
                    backgroundColor: '#f0fdf4',
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #bbf7d0',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                      <div style={{
                        width: '5rem',
                        height: '5rem',
                        borderRadius: '50%',
                        backgroundColor: '#bbf7d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}>
                        <FaCheck style={{ color: '#16a34a', fontSize: '2.5rem' }} />
                      </div>
                    </div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#15803d',
                      marginBottom: '0.75rem'
                    }}>Pagamento Confirmado!</h3>
                    <p style={{
                      color: '#15803d',
                      marginBottom: '1.5rem',
                      fontSize: '1.125rem'
                    }}>
                      Você receberá <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{valorLiquidoUSDT(selectedBoleto.valor_usdt)} USDT</span> em sua carteira em breve.
                    </p>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setActiveTab('meusBoletos');
                      }}
                      style={{
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        fontSize: '1.125rem',
                        padding: '0.75rem 2rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        fontWeight: '600',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s',
                        margin: '0 auto'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#15803d'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#16a34a'}
                    >
                      <FaList style={{ marginRight: '0.5rem' }} /> Ver Meus Boletos
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {/* Modal do Comprovante */}
      {showComprovanteModal && selectedComprovante && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-[9998]"
            onClick={() => {
              setShowComprovanteModal(false);
              setSelectedComprovante(null);
            }}
          />
          <div
            className="fixed top-1/2 left-1/2 z-[9999] w-[95%] max-w-6xl h-[90vh] flex flex-col text-gray-800 shadow-2xl rounded-2xl border border-green-700"
            style={{
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#bef264',
              maxHeight: '90vh',
              overflow: 'hidden',
              position: 'fixed',
              top: '50%',
              left: '50%',
              pointerEvents: 'auto',
              zIndex: 9999
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Cabeçalho - Fixo */}
            <div className="px-6 pt-6 pb-4 border-b border-green-700 flex items-center justify-between bg-green-50 rounded-t-2xl flex-shrink-0">
              <h2 className="text-2xl font-bold text-green-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <FaUpload className="text-white text-lg" />
                </div>
                Comprovante de Pagamento do Boleto {selectedComprovante.numeroBoleto}
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
                    <div className="text-gray-800 font-mono">{selectedComprovante.numeroBoleto}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-700 mb-1">Valor</div>
                    <div className="text-gray-800 font-semibold">R$ {Number(selectedComprovante.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-700 mb-1">Status</div>
                    <div className="text-gray-800">{selectedComprovante.status}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-700 mb-1">Data Compra</div>
                    <div className="text-gray-800">{(() => {
                      const data = new Date(selectedComprovante.dataCompra);
                      return data.toLocaleDateString('pt-BR');
                    })()}</div>
                  </div>
                </div>
              </div>
              
              {/* Visualização do Comprovante - Priorizada */}
              <div className="bg-white rounded-lg border border-green-200 shadow-sm">
                {/* Área principal do arquivo - Com scroll interno */}
                <div className="p-4">
                  <div className="border border-green-200 rounded-lg overflow-y-auto overflow-x-hidden bg-white" style={{ height: 'calc(100vh - 450px)', minHeight: '350px' }}>
                    {(() => {
                      
                      if (selectedComprovante.comprovanteUrl && selectedComprovante.comprovanteUrl.startsWith('data:')) {
                        // Se for base64, mostrar em iframe ou imagem
                        if (selectedComprovante.comprovanteUrl.startsWith('data:image/')) {
                          return (
                            <img
                              src={selectedComprovante.comprovanteUrl}
                              alt="Comprovante de Pagamento"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                              }}
                              onLoad={() => {
                              }}
                            />
                          );
                        } else {
                          // Corrigir: remover quebras de linha do base64
                          const pdfSrc = selectedComprovante.comprovanteUrl.replace(/\n/g, '');
                          return (
                            <>
                              <iframe
                                src={pdfSrc}
                                className="w-full h-full"
                                title="Comprovante de Pagamento"
                                onError={(e) => {
                                  const fallback = document.getElementById('pdf-fallback');
                                  if (fallback) fallback.style.display = 'block';
                                }}
                                onLoad={() => {
                                }}
                              />
                              <object
                                id="pdf-fallback"
                                data={pdfSrc}
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
                      } else if (selectedComprovante.comprovanteUrl && selectedComprovante.comprovanteUrl.startsWith('http')) {
                        // Se for URL externa, usar iframe
                        return (
                          <iframe
                            src={selectedComprovante.comprovanteUrl}
                            className="w-full h-full"
                            title="Comprovante de Pagamento"
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
              {selectedComprovante.comprovanteUrl && (
                <div className="mb-3 flex justify-center">
                  <a
                    href={selectedComprovante.comprovanteUrl.replace(/\n/g, '')}
                    download={`comprovante-${selectedComprovante.numeroBoleto || 'boleto'}.pdf`}
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
};

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



export default CompradorPage;
