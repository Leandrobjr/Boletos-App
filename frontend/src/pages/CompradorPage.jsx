import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaTrash, FaWallet, FaCheck, FaShoppingCart, FaMoneyBillWave,
  FaExclamationTriangle, FaInfoCircle, FaList, FaHistory, 
  FaCreditCard, FaLock, FaArrowRight, FaUpload, FaClock, FaTimesCircle
} from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';

const CompradorPage = () => {
  const [activeTab, setActiveTab] = useState('comprar');
  const [selectedBoleto, setSelectedBoleto] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [etapaCompra, setEtapaCompra] = useState(0);
  const [carteiraConectada, setCarteiraConectada] = useState(false);
  const [enderecoCarteira, setEnderecoCarteira] = useState('');
  const [tempoRestante, setTempoRestante] = useState(null);
  const [comprovante, setComprovante] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);

  const taxaConversao = 5.0;

  const [boletosDisponiveis, setBoletosDisponiveis] = useState([]);

  const [meusBoletos, setMeusBoletos] = useState([]);

  const handleSelecionarBoleto = (boleto) => {
    setSelectedBoleto(boleto);
    setEtapaCompra(1);
    setShowModal(true);
  };

  const handleConectarCarteira = () => {
    setAlertInfo({
      type: 'default',
      title: 'Conectando carteira...',
      description: 'Aguarde enquanto conectamos sua carteira.'
    });

    setTimeout(() => {
      const enderecoAleatorio = '0x' + Math.random().toString(16).substring(2, 14) + Math.random().toString(16).substring(2, 14);
      setEnderecoCarteira(enderecoAleatorio);
      setCarteiraConectada(true);
      setEtapaCompra(2);

      setAlertInfo({
        type: 'success',
        title: 'Carteira conectada com sucesso!',
        description: `Endereço: ${enderecoAleatorio.substring(0, 6)}...${enderecoAleatorio.substring(enderecoAleatorio.length - 4)}`
      });

      setTimeout(() => setAlertInfo(null), 3000);
    }, 1500);
  };

  const handleTravarBoleto = () => {
    setAlertInfo({
      type: 'default',
      title: 'Travando boleto...',
      description: 'Aguarde enquanto reservamos o boleto para você.'
    });

    setTimeout(() => {
      setEtapaCompra(3);
      setTempoRestante(3600);

      setAlertInfo({
        type: 'success',
        title: 'Boleto reservado com sucesso!',
        description: 'Você tem 60 minutos para efetuar o pagamento e enviar o Comprovante.'
      });

      setTimeout(() => setAlertInfo(null), 3000);

      setBoletosDisponiveis(prevBoletos => 
        prevBoletos.map(b => 
          b.id === selectedBoleto.id ? { ...b, status: 'AGUARDANDO PAGAMENTO' } : b
        )
      );
    }, 1500);
  };

  const handleCancelarCompra = () => {
    setAlertInfo({
      type: 'default',
      title: 'Cancelando compra...',
      description: 'Aguarde enquanto cancelamos sua compra.'
    });

    setTimeout(() => {
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
        description: 'O boleto foi liberado para outros compradores.'
      });

      setTimeout(() => setAlertInfo(null), 3000);
    }, 1000);
  };

  const handleEnviarComprovante = (e) => {
    e.preventDefault();
    setAlertInfo({
      type: 'default',
      title: 'Enviando comprovante...',
      description: 'Aguarde enquanto processamos seu comprovante.'
    });

    setTimeout(() => {
      setEtapaCompra(4);
      setTempoRestante(null);

      const taxaServico = selectedBoleto.valor <= 200 ? 5 : selectedBoleto.valor * 0.03;
      const valorLiquidoRepassado = selectedBoleto.valor - taxaServico;
      const valorUSDT = (valorLiquidoRepassado / taxaConversao).toFixed(2);
      const taxaServicoUSDT = (taxaServico / taxaConversao).toFixed(2);
      setMeusBoletos(prevBoletos => [
  ...prevBoletos,
  {
    ...selectedBoleto,
    dataCompra: new Date().toISOString(),
    status: 'BAIXADO',
    valorUSDT,
    taxaServico,
    taxaServicoUSDT,
    valorLiquidoRepassado,
    comprovanteUrl: comprovante ? URL.createObjectURL(comprovante) : undefined // Simulação de URL local
  }
]);

      setBoletosDisponiveis(prevBoletos => 
        prevBoletos.filter(b => b.id !== selectedBoleto.id)
      );

      setAlertInfo({
        type: 'success',
        title: 'Pagamento confirmado!',
        description: `Você receberá ${valorUSDT} USDT em sua carteira em breve.`
      });

      setTimeout(() => {
        setAlertInfo(null);
        setShowModal(false);
        setActiveTab('meusBoletos');
      }, 5000);
    }, 2000);
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
        status: mapStatus(boleto.status)
      }))))
      .catch(() => setBoletosDisponiveis([]));
  }, []);

  return (
    <div className="min-h-screen bg-lime-300 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-1">
        <div className="w-full max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 bg-green-800 text-white p-2 rounded-lg text-center">
            Portal do Comprador
          </h1>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
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
                          <th className="py-3 px-4 text-left">Data Venc/to</th>
                          <th className="py-3 px-4 text-left">Beneficiário</th>
                          <th className="py-3 px-4 text-left">Status</th>
                          <th className="py-3 px-4 text-left">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boletosDisponiveis.map((boleto) => (
                          <tr 
                            key={boleto.id} 
                            className={`border-b border-gray-200 hover:bg-lime-50 ${selectedBoleto?.id === boleto.id ? 'bg-lime-100' : ''}`}
                          >
                            <td className="py-3 px-4">{boleto.numeroBoleto}</td>
                            <td className="py-3 px-4">R$ {boleto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-4">{new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}</td>
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
                            <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
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
                  {meusBoletos.length === 0 ? (
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
                          </tr>
                        </thead>
                        <tbody>
                          {meusBoletos.map((boleto) => (
                            <tr key={boleto.id} className="border-b border-gray-200 hover:bg-lime-50">
                              <td className="py-3 px-4">{boleto.numeroBoleto}</td>
                              <td className="py-3 px-4">R$ {boleto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3 px-4">{boleto.valorUSDT} USDT</td>
                              <td className="py-3 px-4">R$ {boleto.taxaServico?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({boleto.taxaServicoUSDT} USDT)</td>
                              <td className="py-3 px-4">{new Date(boleto.dataCompra).toLocaleDateString('pt-BR')} {new Date(boleto.dataCompra).toLocaleTimeString('pt-BR')}</td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {boleto.status}
                                </span>
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
                              <td className="py-3 px-4">R$ {boleto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3 px-4">{boleto.valorUSDT} USDT</td>
                              <td className="py-3 px-4">R$ {boleto.taxaServico?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({boleto.taxaServicoUSDT} USDT)</td>
                              <td className="py-3 px-4">
                                {boleto.comprovanteUrl ? (
                                  <a
                                    href={boleto.comprovanteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-green-700 hover:bg-green-800 text-white py-1 px-3 rounded flex items-center justify-center gap-2 text-sm"
                                    title="Visualizar Comprovante"
                                  >
                                    <FaUpload /> VISUALIZAR COMPROVANTE
                                  </a>
                                ) : (
                                  <span className="text-gray-400">Não enviado</span>
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
                <span>{selectedBoleto.numeroBoleto}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Beneficiário CPF/CNPJ:</span>
                <span>{selectedBoleto.cnpj}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Código de Barras:</span>
                <span className="font-mono text-xs bg-lime-200 p-2 rounded break-all border border-green-700 text-gray-800">{selectedBoleto.codigoBarras}</span>
              </div>
              {(() => {
  const taxaServico = selectedBoleto.valor <= 200 ? 5 : selectedBoleto.valor * 0.03;
  const valorLiquidoRepassado = selectedBoleto.valor - taxaServico;
  const valorUSDT = (valorLiquidoRepassado / taxaConversao).toFixed(2);
  const taxaServicoUSDT = (taxaServico / taxaConversao).toFixed(2);
  return (
    <>
      <div className="flex justify-between">
        <span className="font-semibold">Valor em Reais:</span>
        <span className="text-green-700 font-bold">
          R$ {selectedBoleto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="font-semibold">Taxa de Serviço:</span>
        <span className="text-red-600 font-bold">
          R$ {taxaServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({taxaServicoUSDT} USDT)
        </span>
      </div>
      <div className="flex justify-between">
        <span className="font-semibold">Valor Líquido a Receber:</span>
        <span className="text-green-700 font-bold">{valorUSDT} USDT</span>
      </div>
    </>
  );
})()}
              <div className="flex justify-between">
                <span className="font-semibold">Vencimento:</span>
                <span>{new Date(selectedBoleto.dataVencimento).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="text-xs text-white font-extrabold mt-2 text-center">
                Para travar o boleto para pagamento conecte sua carteira.
              </div>
            </div>
            {etapaCompra === 1 && (
              <div className="px-6 pb-6 flex flex-col gap-3">
                <button
                  onClick={handleConectarCarteira}
                  className="bg-green-700 hover:bg-green-800 text-white text-xl font-semibold py-2 rounded shadow flex items-center justify-center gap-2"
                >
                  <FaWallet /> Conectar Carteira
                </button>
              </div>
            )}
            {etapaCompra === 2 && (
              <div className="px-6 pb-6 w-full">
                <div className="bg-green-100 p-3 rounded-lg mb-4 border border-green-700">
                  <div className="flex items-center mb-2">
                    <FaWallet className="text-green-700 mr-2" />
                    <span className="font-medium text-green-800">Carteira Conectada</span>
                  </div>
                  <p className="text-sm text-green-700 break-all">Endereço: {enderecoCarteira}</p>
                </div>
                <button
                  onClick={handleTravarBoleto}
                  className="bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded shadow flex items-center justify-center gap-2 ml-auto"
                >
                  <FaLock /> Reservar Boleto
                </button>
              </div>
            )}
{etapaCompra === 3 && (
  <div className="px-6 pb-6 w-full">
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
            {etapaCompra === 4 && (
              <div className="px-6 pb-6 w-full">
                <div className="bg-green-100 p-4 rounded-lg mb-4 border border-green-700 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-green-200 flex items-center justify-center">
                      <FaCheck className="text-green-700 text-3xl" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-green-700 mb-2">Pagamento Confirmado!</h3>
                  <p className="text-green-800 mb-4">
                    Você receberá {(selectedBoleto.valor / taxaConversao).toFixed(2)} USDT em sua carteira em breve.
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
        </React.Fragment>,
        document.body
      )}
    </div>
  );
};

function mapStatus(status) {
  switch ((status || '').toLowerCase()) {
    case 'pendente': return 'DISPONIVEL';
    case 'pago': return 'BAIXADO';
    case 'reservado': return 'AGUARDANDO PAGAMENTO';
    case 'cancelado': return 'EXCLUIDO';
    default: return status ? status.toUpperCase() : status;
  }
}

export default CompradorPage;