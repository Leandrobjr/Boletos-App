import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaTrash, FaWallet, FaCheck, FaShoppingCart, FaMoneyBillWave,
  FaExclamationTriangle, FaInfoCircle, FaList, FaHistory, 
  FaCreditCard, FaLock, FaArrowRight, FaUpload, FaClock, FaTimesCircle,
  FaFilePdf, FaExternalLinkAlt
} from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import ModernWalletConnector from '../components/wallet/ModernWalletConnector';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useBoletoEscrow } from '../hooks/useBoletoEscrow';
import { useConnectModal } from '@rainbow-me/rainbowkit';

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

  // Hooks para conexão Web3
  const wallet = useWalletConnection();
  const { travarBoleto } = useBoletoEscrow();
  const { openConnectModal } = useConnectModal();

  const taxaConversao = 5.0;

  const [boletosDisponiveis, setBoletosDisponiveis] = useState([]);

  const [meusBoletos, setMeusBoletos] = useState([]);

  // Monitorar mudanças na conexão da carteira
  useEffect(() => {
    if (wallet.isConnected && wallet.address && etapaCompra === 1) {
      // Verificar se está na rede correta (Polygon Amoy - ID 80002)
      if (wallet.chainId !== 80002) {
        setAlertInfo({
          type: 'destructive',
          title: 'Rede incorreta',
          description: 'Para usar o BoletoXCrypto, você precisa estar na rede Polygon Amoy. Troque de rede na sua carteira.'
        });
        setTimeout(() => setAlertInfo(null), 5000);
        return;
      }

      // Se a carteira foi conectada durante a etapa 1, avançar automaticamente
      setEtapaCompra(2);
      setAlertInfo({
        type: 'success',
        title: 'Carteira conectada automaticamente!',
        description: `Endereço: ${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`
      });
      setTimeout(() => setAlertInfo(null), 3000);
    } else if (!wallet.isConnected && etapaCompra === 2) {
      // Se a carteira foi desconectada durante a etapa 2, voltar para etapa 1
      setEtapaCompra(1);
      setAlertInfo({
        type: 'destructive',
        title: 'Carteira desconectada',
        description: 'Sua carteira foi desconectada. Conecte novamente para continuar.'
      });
      setTimeout(() => setAlertInfo(null), 3000);
    }
  }, [wallet.isConnected, wallet.address, wallet.chainId, etapaCompra]);

  // Função para buscar boletos do usuário autenticado
  const fetchMeusBoletos = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`http://localhost:3001/boletos/comprados/${user.uid}`);
      if (!res.ok) throw new Error('Erro ao buscar boletos do usuário');
      const data = await res.json();
      console.log('DEBUG: Dados brutos recebidos do backend:', JSON.stringify(data, null, 2));
      
      const boletosMapeados = data.map(boleto => ({
        ...boleto,
        numeroBoleto: boleto.numero_controle || boleto.numeroBoleto,
        valor: boleto.valor_brl || boleto.valor || 0,
        valor_usdt: boleto.valor_usdt || 0,
        dataCompra: boleto.criado_em || boleto.dataCompra,
        comprovanteUrl: boleto.comprovante_url || boleto.comprovanteUrl,
        status: mapStatus(boleto.status)
      }));
      
      console.log('DEBUG: Boletos mapeados completos:', JSON.stringify(boletosMapeados, null, 2));
      console.log('DEBUG: Comprovante URLs:', boletosMapeados.map(b => ({
        numeroBoleto: b.numeroBoleto,
        status: b.status,
        comprovanteUrl: b.comprovanteUrl ? (b.comprovanteUrl.startsWith('data:') ? 'BASE64_DATA' : b.comprovanteUrl.substring(0, 100)) : 'NULL'
      })));
      
      setMeusBoletos(boletosMapeados);
    } catch (error) {
      console.error('Erro ao buscar boletos:', error);
      setMeusBoletos([]);
    }
  };

  const handleSelecionarBoleto = (boleto) => {
    setSelectedBoleto(boleto);
    setEtapaCompra(1);
    setShowModal(true);
  };

  const handleConectarCarteira = () => {
    if (!wallet.isConnected) {
      if (openConnectModal) {
        openConnectModal();
      } else {
        setAlertInfo({
          type: 'destructive',
          title: 'Erro de conexão',
          description: 'Modal de conexão não disponível. Tente novamente.'
        });
        setTimeout(() => setAlertInfo(null), 3000);
      }
      return;
    }

    // Se já está conectado, prosseguir para a próxima etapa
    if (wallet.address) {
      setEtapaCompra(2);
      setAlertInfo({
        type: 'success',
        title: 'Carteira conectada com sucesso!',
        description: `Endereço: ${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`
      });
      setTimeout(() => setAlertInfo(null), 3000);
    } else {
      setAlertInfo({
        type: 'destructive',
        title: 'Carteira não conectada',
        description: 'Conecte sua carteira antes de continuar.'
      });
      setTimeout(() => setAlertInfo(null), 3000);
    }
  };

  const handleTravarBoleto = async () => {
    if (!wallet.isConnected || !wallet.address) {
      setAlertInfo({
        type: 'destructive',
        title: 'Carteira não conectada',
        description: 'Conecte sua carteira antes de reservar o boleto.'
      });
      setTimeout(() => setAlertInfo(null), 3000);
      return;
    }

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

    setAlertInfo({
      type: 'default',
      title: 'Travando boleto...',
      description: 'Aguarde enquanto reservamos o boleto e travamos os USDT no contrato.'
    });

    try {
      // Primeiro, travar os USDT no contrato inteligente
      const valorUsdt = Number(selectedBoleto.valor_usdt);
      const result = await travarBoleto({
        boletoId: selectedBoleto.numero_controle,
        valorUsdt: valorUsdt,
        address: wallet.address
      });

      if (!result.success) {
        throw new Error('Falha ao travar USDT no contrato');
      }

      // Depois, chamar o backend para reservar o boleto
      const response = await fetch(`http://localhost:3001/boletos/${selectedBoleto.numero_controle}/reservar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.uid,
          wallet_address: wallet.address,
          tx_hash: result.txHash
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao reservar boleto no backend');
      }

      setEtapaCompra(3);
      setTempoRestante(3600);
      setAlertInfo({
        type: 'success',
        title: 'Boleto reservado e USDT travados com sucesso!',
        description: `Você tem 60 minutos para efetuar o pagamento e enviar o comprovante. TX: ${result.txHash.substring(0, 10)}...`
      });
      setTimeout(() => setAlertInfo(null), 5000);
      
      setBoletosDisponiveis(prevBoletos =>
        prevBoletos.map(b =>
          b.id === selectedBoleto.id ? { ...b, status: 'AGUARDANDO PAGAMENTO' } : b
        )
      );
      fetchMeusBoletos();
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
      if (etapaCompra >= 2 && wallet.address) {
        const { liberarBoleto } = useBoletoEscrow();
        const result = await liberarBoleto({
          boletoId: selectedBoleto.numero_controle
        });
        
        if (!result.success) {
          console.warn('Falha ao liberar USDT no contrato:', result);
        }
      }

      // Liberar o boleto no backend
      if (selectedBoleto.numero_controle) {
        await fetch(`http://localhost:3001/boletos/${selectedBoleto.numero_controle}/liberar`, {
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
        // Enviar comprovante para o backend
        const response = await fetch(`http://localhost:3001/boletos/${selectedBoleto.numero_controle}/comprovante`, {
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
        console.log('DEBUG: Boleto atualizado após envio de comprovante:', boletoAtualizado);
        console.log('DEBUG: URL do comprovante sendo salva:', comprovanteUrl.substring(0, 50) + '...');
        
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
          await fetchMeusBoletos();
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

  // Função para abrir modal do comprovante
  const handleVisualizarComprovante = (boleto) => {
    console.log('DEBUG: Abrindo modal do comprovante para boleto:', {
      numeroBoleto: boleto.numeroBoleto,
      status: boleto.status,
      comprovanteUrl: boleto.comprovanteUrl ? (boleto.comprovanteUrl.startsWith('data:') ? 'BASE64_DATA' : boleto.comprovanteUrl.substring(0, 100)) : 'NULL'
    });
    
    // Se for URL de exemplo, mostrar alerta
    if (boleto.comprovanteUrl && boleto.comprovanteUrl.includes('exemplo.com')) {
      setAlertInfo({
        type: 'destructive',
        title: 'URL de Exemplo Detectada',
        description: 'Este comprovante contém uma URL de exemplo. Use o botão "Limpar URLs de Exemplo" para corrigir.'
      });
      setTimeout(() => setAlertInfo(null), 5000);
      return;
    }

    // Verificar se é base64 válido
    if (boleto.comprovanteUrl && boleto.comprovanteUrl.startsWith('data:')) {
      const base64Data = boleto.comprovanteUrl.split(',')[1];
      if (!base64Data || base64Data.length < 100) {
        console.log('DEBUG: Base64 muito pequeno ou inválido');
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
    if (boleto.comprovanteUrl && boleto.comprovanteUrl.startsWith('http')) {
      try {
        new URL(boleto.comprovanteUrl);
      } catch (e) {
        console.log('DEBUG: URL inválida:', e);
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
  };

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

  // Função para limpar URLs de exemplo (temporária)
  const handleLimparExemplos = async () => {
    try {
      const response = await fetch('http://localhost:3001/boletos/limpar-exemplos', {
        method: 'PATCH'
      });
      const result = await response.json();
      console.log('DEBUG: URLs de exemplo removidas:', result);
      
      setAlertInfo({
        type: 'success',
        title: 'URLs de exemplo removidas!',
        description: `${result.boletosAtualizados} boletos foram atualizados.`
      });
      
      // Recarregar boletos
      await fetchMeusBoletos();
      
      setTimeout(() => setAlertInfo(null), 3000);
    } catch (error) {
      console.error('Erro ao limpar URLs de exemplo:', error);
      setAlertInfo({
        type: 'destructive',
        title: 'Erro ao limpar URLs',
        description: 'Não foi possível limpar as URLs de exemplo.'
      });
      setTimeout(() => setAlertInfo(null), 3000);
    }
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

  useEffect(() => {
    // Buscar boletos disponíveis do backend
    fetch('http://localhost:3001/boletos')
      .then(res => res.json())
      .then(data => setBoletosDisponiveis(data.map(boleto => ({
        ...boleto,
        numeroControle: boleto.numero_controle || boleto.numeroControle,
        valor_brl: boleto.valor_brl || boleto.valor,
        valor_usdt: boleto.valor_usdt || boleto.valorUSDT,
        cpfCnpj: boleto.cpf_cnpj || boleto.cpfCnpj,
        vencimento: boleto.vencimento,
        status: mapStatus(boleto.status)
      }))))
      .catch(() => setBoletosDisponiveis([]));
  }, []);

  useEffect(() => {
    if (tab && tab !== activeTab) setActiveTab(tab);
    // eslint-disable-next-line
  }, [tab]);

  // Polling para atualização automática de boletos
  useEffect(() => {
    let interval;
    if (activeTab === 'meusBoletos' || activeTab === 'historico') {
      fetchMeusBoletos(); // Busca inicial imediata
      interval = setInterval(() => {
        fetchMeusBoletos();
      }, 5000); // Atualiza a cada 5 segundos
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, user]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/app/comprador/${tab}`);
  };

  // Função utilitária para valor líquido USDT
  function valorLiquidoUSDT(valor_usdt) {
    return valor_usdt !== undefined && valor_usdt !== null ? (Number(valor_usdt) * 0.95).toFixed(2) : '--';
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
    <div className="min-h-screen bg-lime-300 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-1">
        <div className="w-full max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 bg-green-800 text-white p-2 rounded-lg text-center">
            Portal do Comprador
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
          
          <ModernWalletConnector />
          
          {/* Botão temporário para limpar URLs de exemplo */}
          <div className="mb-4 text-center">
            <button
              onClick={handleLimparExemplos}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-semibold"
            >
              🧹 Limpar URLs de Exemplo (Correção)
            </button>
          </div>
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
              <Card>
                <CardHeader className="bg-green-800 text-white">
                  <CardTitle className="text-xl">Livro de Ordens - Boletos Disponíveis</CardTitle>
                  <CardDescription className="text-white">Selecione um boleto disponível para comprar USDT</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-700 mb-6">
                    Nesta seção você pode visualizar todos os boletos disponíveis para compra de USDT. 
                    Selecione um boleto e clique em "Selecionar" para prosseguir com a transação.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse bg-white rounded-lg overflow-hidden">
                      <thead className="bg-lime-600 text-white">
                        <tr>
                          <th className="py-3 px-4 text-left">Nº Boleto</th>
                          <th className="py-3 px-4 text-left">Valor (R$)</th>
                          <th className="py-3 px-4 text-left">Valor Líquido (USDT)</th>
                          <th className="py-3 px-4 text-left">Data Venc/to</th>
                          <th className="py-3 px-4 text-left">Beneficiário</th>
                          <th className="py-3 px-4 text-left">Status</th>
                          <th className="py-3 px-4 text-left">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boletosDisponiveis
                          .filter(boleto => ["DISPONIVEL", "AGUARDANDO PAGAMENTO", "AGUARDANDO BAIXA"].includes(boleto.status))
                          .map((boleto) => (
                            <tr key={boleto.id} className={`border-b border-gray-200 hover:bg-lime-50 ${selectedBoleto?.id === boleto.id ? 'bg-lime-100' : ''}`}>
                              <td className="py-3 px-4">{boleto.numeroControle}</td>
                              <td className="py-3 px-4">R$ {(boleto.valor_brl !== undefined && boleto.valor_brl !== null) ? Number(boleto.valor_brl).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--'}</td>
                              <td className="py-3 px-4">{valorLiquidoUSDT(boleto.valor_usdt)} USDT</td>
                              <td className="py-3 px-4">{boleto.vencimento ? new Date(boleto.vencimento).toLocaleDateString('pt-BR') : '--'}</td>
                              <td className="py-3 px-4">{boleto.cpfCnpj || '--'}</td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {boleto.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {boleto.status === "DISPONIVEL" ? (
                                  <button 
                                    onClick={() => handleSelecionarBoleto(boleto)} 
                                    className="bg-lime-600 hover:bg-lime-700 text-white text-sm py-1 px-2 rounded"
                                  >
                                    Selecionar
                                  </button>
                                ) : (
                                  <span className="text-yellow-700 font-semibold">Em Processamento</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        {boletosDisponiveis.filter(boleto => ["DISPONIVEL", "AGUARDANDO PAGAMENTO", "AGUARDANDO BAIXA"].includes(boleto.status)).length === 0 && (
                          <tr>
                            <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                              Não há boletos disponíveis para compra no momento.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="meusBoletos">
              <Card>
                <CardHeader className="bg-green-800 text-white">
                  <CardTitle className="text-xl">MEUS BOLETOS</CardTitle>
                  <CardDescription className="text-white">Boletos que você comprou e pagou</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {meusBoletos.filter(boleto => boleto.status !== 'DISPONIVEL').length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Você ainda não comprou nenhum boleto.
                    </p>
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
                            <tr key={boleto.id} className="border-b border-gray-200 hover:bg-lime-50">
                              <td className="py-3 px-4">{boleto.numeroBoleto}</td>
                              <td className="py-3 px-4">R$ {(boleto.valor !== undefined && boleto.valor !== null) ? boleto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--'}</td>
                              <td className="py-3 px-4">{valorLiquidoUSDT(boleto.valor_usdt)} USDT</td>
                              <td className="py-3 px-4">R$ {taxaServicoReais(boleto.valor)} ({taxaServicoUSDT(boleto.valor_usdt)} USDT)</td>
                              <td className="py-3 px-4">{new Date(boleto.dataCompra).toLocaleDateString('pt-BR')} {new Date(boleto.dataCompra).toLocaleTimeString('pt-BR')}</td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {boleto.status}
                                </span>
                              </td>
                              <td className="py-3 px-6 w-44 flex gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-bold transition-colors duration-200">
                                      Ações
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="min-w-48">
                                    <DropdownMenuItem 
                                      onClick={() => handlePagarBoleto(boleto)}
                                      disabled={boleto.status === 'AGUARDANDO BAIXA' || boleto.status === 'BAIXADO'}
                                      className={`text-sm font-medium ${boleto.status === 'AGUARDANDO BAIXA' || boleto.status === 'BAIXADO' ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                      <FaCreditCard className="mr-2 text-sm" />
                                      Pagar Boleto
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem 
                                      onClick={() => handleEnviarComprovante(boleto)}
                                      disabled={boleto.comprovanteUrl || boleto.status === 'BAIXADO'}
                                      className={`text-sm font-medium ${boleto.comprovanteUrl || boleto.status === 'BAIXADO' ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                      <FaUpload className="mr-2 text-sm" />
                                      Enviar Comprovante
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem 
                                      onClick={() => handleVisualizarComprovante(boleto)}
                                      disabled={!boleto.comprovanteUrl && boleto.status !== 'AGUARDANDO BAIXA'}
                                      className={`text-sm font-medium ${(!boleto.comprovanteUrl && boleto.status !== 'AGUARDANDO BAIXA') ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                      <FaUpload className="mr-2 text-sm" />
                                      Visualizar Comprovante
                                      {boleto.comprovanteUrl && boleto.comprovanteUrl.includes('exemplo.com') && (
                                        <span className="ml-1 text-xs text-orange-600">(Exemplo)</span>
                                      )}
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem 
                                      onClick={() => handleDisputa(boleto)}
                                      className="text-sm font-medium text-gray-700 hover:bg-gray-100"
                                    >
                                      <FaExclamationTriangle className="mr-2 text-sm" />
                                      Disputa
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
                            <tr key={boleto.id} className="border-b border-gray-200 hover:bg-lime-50">
                              <td className="py-3 px-4">{new Date(boleto.dataCompra).toLocaleDateString('pt-BR')}<br /><span className="text-xs text-gray-400">{new Date(boleto.dataCompra).toLocaleTimeString('pt-BR')}</span></td>
                              <td className="py-3 px-4">R$ {(boleto.valor !== undefined && boleto.valor !== null) ? boleto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--'}</td>
                              <td className="py-3 px-4">{valorLiquidoUSDT(boleto.valor_usdt)} USDT</td>
                              <td className="py-3 px-4">R$ {taxaServicoReais(boleto.valor)} ({taxaServicoUSDT(boleto.valor_usdt)} USDT)</td>
                              <td className="py-3 px-4">
                                {(boleto.comprovanteUrl || boleto.status === 'AGUARDANDO BAIXA') ? (
                                  <button
                                    onClick={() => handleVisualizarComprovante(boleto)}
                                    className="bg-green-700 hover:bg-green-800 text-white py-1 px-3 rounded flex items-center justify-center gap-2 text-sm font-semibold transition-colors duration-200"
                                    title="Visualizar Comprovante"
                                  >
                                    <FaUpload /> VISUALIZAR COMPROVANTE
                                    {boleto.comprovanteUrl && boleto.comprovanteUrl.includes('exemplo.com') && (
                                      <span className="ml-1 text-xs">(Exemplo)</span>
                                    )}
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
      {showModal && selectedBoleto && createPortal(
        <React.Fragment>
          <div
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-[9998]"
            onClick={() => {
              setShowModal(false);
              setEtapaCompra(0);
              setSelectedBoleto(null);
            }}
          />
          <div
            className="fixed top-1/2 left-1/2 z-[9999] w-[96%] min-w-[350px] max-w-[650px] max-h-[95vh] overflow-y-auto text-gray-800 shadow-2xl rounded-2xl border border-green-700"
            style={{
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#bef264'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-2 border-b border-green-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-green-700 flex items-center gap-2">
                <FaCreditCard className="text-green-700" /> Detalhes do Boleto
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEtapaCompra(0);
                  setSelectedBoleto(null);
                }}
                className="text-gray-400 hover:text-red-500 transition"
                title="Fechar"
              >
                <FaTimesCircle size={22} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between">
                <span className="font-semibold">Nº Boleto:</span>
                <span>{selectedBoleto.numeroControle || selectedBoleto.numeroBoleto || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Beneficiário CPF/CNPJ:</span>
                <span>{selectedBoleto.cpfCnpj || selectedBoleto.cnpj || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Valor (R$):</span>
                <span>R$ {(selectedBoleto.valor_brl !== undefined ? Number(selectedBoleto.valor_brl) : selectedBoleto.valor)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Valor Líquido (USDT):</span>
                <span>{valorLiquidoUSDT(selectedBoleto.valor_usdt)} USDT</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="font-semibold">Código de Barras:</span>
                <span className="font-mono text-[12px] bg-lime-100 p-3 rounded-2xl border border-green-700 text-gray-800 select-all overflow-x-auto whitespace-nowrap max-w-[420px] shadow-inner" style={{wordBreak:'break-all'}}>
                  {(selectedBoleto.codigoBarras || selectedBoleto.codigo_barras || '--')}
                </span>
                <button
                  className="ml-2 px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-800"
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
                {copiedCodigoBarras && <span className="text-green-700 text-xs ml-1">Copiado!</span>}
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Data de Vencimento:</span>
                <span>{selectedBoleto.vencimento ? new Date(selectedBoleto.vencimento).toLocaleDateString('pt-BR') : '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Status:</span>
                <span>{selectedBoleto.status || '--'}</span>
              </div>
              {/* Etapa 1: Conectar carteira */}
              {etapaCompra === 1 && (
                <div className="flex flex-col gap-3 mt-4">
                  <button
                    onClick={handleConectarCarteira}
                    className="bg-green-700 hover:bg-green-800 text-white text-xl font-semibold py-2 rounded shadow flex items-center justify-center gap-2"
                  >
                    <FaWallet /> Conectar Carteira
                  </button>
                </div>
              )}
              {/* Etapa 2: Travar boleto */}
              {etapaCompra === 2 && (
                <div className="flex flex-col gap-3 mt-4">
                  {wallet.isConnected && wallet.address ? (
                    <>
                      <div className="bg-green-100 p-3 rounded-lg mb-4 border border-green-700">
                        <div className="flex items-center mb-2">
                          <FaWallet className="text-green-700 mr-2" />
                          <span className="font-medium text-green-800">Carteira Conectada</span>
                        </div>
                        <p className="text-sm text-green-700 break-all">Endereço: {wallet.address}</p>
                        <p className="text-xs text-green-600 mt-1">Rede: {wallet.chain?.name || 'Desconhecida'}</p>
                      </div>
                      <button
                        onClick={handleTravarBoleto}
                        className="bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded shadow flex items-center justify-center gap-2 ml-auto"
                      >
                        <FaLock /> Reservar Boleto e Travar USDT
                      </button>
                    </>
                  ) : (
                    <div className="bg-red-100 p-3 rounded-lg mb-4 border border-red-700">
                      <div className="flex items-center mb-2">
                        <FaExclamationTriangle className="text-red-700 mr-2" />
                        <span className="font-medium text-red-800">Carteira não conectada</span>
                      </div>
                      <p className="text-sm text-red-700">Você precisa conectar sua carteira para continuar.</p>
                      <button
                        onClick={handleConectarCarteira}
                        className="bg-green-700 hover:bg-green-800 text-white text-lg font-semibold py-2 rounded shadow flex items-center justify-center gap-2 mt-3"
                      >
                        <FaWallet /> Conectar Carteira
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* Etapa 3: Enviar comprovante */}
              {etapaCompra === 3 && (
                <div className="flex flex-col gap-3 mt-4">
                  <div className="bg-yellow-100 p-3 rounded-lg mb-4 border border-green-700">
                    <div className="flex items-center mb-2">
                      <FaClock className="text-green-700 mr-2" />
                      <span className="font-medium text-green-800">Tempo Restante para Pagamento</span>
                    </div>
                    <div className="flex flex-col items-center my-4">
                      <div className="rounded-xl bg-yellow-300 border-2 border-yellow-500 px-10 py-4 shadow-lg flex items-end gap-4">
                        <span
                          className="text-5xl font-extrabold text-yellow-900 tracking-widest"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {Math.floor(tempoRestante / 60)}:{(tempoRestante % 60).toString().padStart(2, '0')}
                        </span>
                        <span
                          className="text-xl font-bold text-yellow-900 mb-1"
                          style={{ letterSpacing: '2px' }}
                        >
                          minutos
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-green-800 mt-2">
                      Realize o pagamento do boleto e envie o comprovante antes que o tempo acabe.
                    </p>
                  </div>
                  <form onSubmit={handleEnviarComprovante} className="space-y-4">
                    <div>
                      <Label htmlFor="comprovante" className="text-green-800">Enviar Comprovante de Pagamento</Label>
                      <Input
                        id="comprovante"
                        type="file"
                        accept="image/*,.pdf"
                        required
                        onChange={(e) => setComprovante(e.target.files[0])}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Deseja realmente cancelar esta compra? O boleto será liberado para outros compradores.')) {
                            handleCancelarCompra();
                          }
                        }}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded flex items-center"
                      >
                        <FaTimesCircle className="mr-2" /> Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-green-700 hover:bg-green-800 text-white py-2 px-4 rounded flex items-center"
                      >
                        <FaUpload className="mr-2" /> Enviar Comprovante
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {/* Etapa 4: Pagamento confirmado */}
              {etapaCompra === 4 && (
                <div className="flex flex-col gap-3 mt-4">
                  <div className="bg-green-100 p-4 rounded-lg mb-4 border border-green-700 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-green-200 flex items-center justify-center">
                        <FaCheck className="text-green-700 text-3xl" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-green-700 mb-2">Pagamento Confirmado!</h3>
                    <p className="text-green-800 mb-4">
                      Você receberá {valorLiquidoUSDT(selectedBoleto.valor_usdt)} USDT em sua carteira em breve.
                    </p>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setActiveTab('meusBoletos');
                      }}
                      className="bg-green-700 hover:bg-green-800 text-white text-lg py-2 px-4 rounded flex items-center mx-auto"
                    >
                      <FaList className="mr-2" /> Ver Meus Boletos
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </React.Fragment>,
        document.body
      )}
      
      {/* Modal do Comprovante */}
      {showComprovanteModal && selectedComprovante && (() => {
        console.log('DEBUG: Renderizando modal do comprovante:', {
          numeroBoleto: selectedComprovante.numeroBoleto,
          status: selectedComprovante.status,
          comprovanteUrl: selectedComprovante.comprovanteUrl ? (selectedComprovante.comprovanteUrl.startsWith('data:') ? 'BASE64_DATA' : selectedComprovante.comprovanteUrl.substring(0, 100)) : 'NULL',
          comprovanteUrlType: selectedComprovante.comprovanteUrl ? selectedComprovante.comprovanteUrl.substring(0, 50) : 'NULL',
          isImage: selectedComprovante.comprovanteUrl ? selectedComprovante.comprovanteUrl.startsWith('data:image/') : false,
          isPdf: selectedComprovante.comprovanteUrl ? selectedComprovante.comprovanteUrl.startsWith('data:application/pdf') : false
        });
        return createPortal(
        <React.Fragment>
          <div
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-[9998]"
            onClick={() => {
              setShowComprovanteModal(false);
              setSelectedComprovante(null);
            }}
          />
          <div
            className="fixed top-1/2 left-1/2 z-[9999] w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto text-gray-800 shadow-2xl rounded-2xl border border-green-700"
            style={{
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#bef264'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 border-b border-green-700 flex items-center justify-between bg-green-50 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-green-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <FaUpload className="text-white text-lg" />
                </div>
                Comprovante do Boleto {selectedComprovante.numeroBoleto}
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
            <div className="px-6 py-4">
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
                    <div className="text-gray-800">{new Date(selectedComprovante.dataCompra).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
              </div>
              
              {/* Visualização do Comprovante - Priorizada */}
              <div className="bg-white rounded-lg border border-green-200 shadow-sm">
                <div className="p-4 border-b border-green-200">
                  <h3 className="font-bold text-green-800 text-lg flex items-center gap-2">
                    <FaUpload className="text-green-600" />
                    Comprovante de Pagamento
                  </h3>
                </div>
                
                {/* Área principal do arquivo - Maior */}
                <div className="p-4">
                  <div className="border border-green-200 rounded-lg overflow-hidden bg-white">
                    {(() => {
                      console.log('DEBUG: Renderizando arquivo:', {
                        hasUrl: !!selectedComprovante.comprovanteUrl,
                        urlStartsWithData: selectedComprovante.comprovanteUrl ? selectedComprovante.comprovanteUrl.startsWith('data:') : false,
                        urlType: selectedComprovante.comprovanteUrl ? selectedComprovante.comprovanteUrl.substring(0, 50) : 'NULL'
                      });
                      
                      if (selectedComprovante.comprovanteUrl && selectedComprovante.comprovanteUrl.startsWith('data:')) {
                        // Se for base64, mostrar em iframe ou imagem
                        if (selectedComprovante.comprovanteUrl.startsWith('data:image/')) {
                          console.log('DEBUG: Renderizando como imagem');
                          return (
                            <img
                              src={selectedComprovante.comprovanteUrl}
                              alt="Comprovante de Pagamento"
                              className="w-full h-[70vh] object-contain"
                              onError={(e) => {
                                console.log('Erro ao carregar imagem:', e);
                              }}
                              onLoad={() => {
                                console.log('Imagem carregada com sucesso');
                              }}
                            />
                          );
                        } else {
                          console.log('DEBUG: Renderizando como iframe');
                          return (
                            <iframe
                              src={selectedComprovante.comprovanteUrl}
                              className="w-full h-[70vh]"
                              title="Comprovante de Pagamento"
                              onError={(e) => {
                                console.log('Erro ao carregar arquivo:', e);
                              }}
                              onLoad={() => {
                                console.log('Iframe carregado com sucesso');
                              }}
                            />
                          );
                        }
                      } else {
                        console.log('DEBUG: Arquivo não disponível');
                        return (
                          <div className="w-full h-[70vh] flex items-center justify-center bg-gray-100">
                            <p className="text-gray-500">Arquivo não disponível</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
                
                {/* Botões de ação - Compactos */}
                <div className="p-4 border-t border-green-200 bg-gray-50">
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
            </div>
          </div>
        </React.Fragment>,
        document.body
      );
      })()}
      
      {/* Painel de debug temporário para depuração de meusBoletos */}
      {/* 
      <div className="bg-black text-white p-3 mt-4 rounded shadow text-xs overflow-x-auto max-w-4xl mx-auto">
        <b>DEBUG - MeusBoletos recebidos do backend:</b>
        <pre>{JSON.stringify(meusBoletos, null, 2)}</pre>
      </div>
      */}
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