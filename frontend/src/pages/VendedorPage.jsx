import { useState, useEffect } from 'react';
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
import { useUSDTConversion } from '../hooks/useUSDTConversion';
import { useBoletoEscrow } from '../hooks/useBoletoEscrow';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAuth } from '../components/auth/AuthProvider';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/dropdown-menu';
import BoletoForm from '../components/boletos/BoletoForm';
import WalletConnector from '../components/wallet/WalletConnector';
import ModernWalletConnector from '../components/wallet/ModernWalletConnector';

function VendedorPage() {
  const { user } = useAuth();
  console.log('[VendedorPage] Renderizou. user:', user);
  const [activeTab, setActiveTab] = useState('cadastrar');
  const [boletos, setBoletos] = useState([]);
  const [alertInfo, setAlertInfo] = useState(null);
  // Painel de debug
  const [debugBoleto, setDebugBoleto] = useState(null);
  const [debugUrl, setDebugUrl] = useState('');
  const [disputaModal, setDisputaModal] = useState({ open: false, boletoId: null });
  const [motivoDisputa, setMotivoDisputa] = useState('');
  const [statusDisputa, setStatusDisputa] = useState(null);

  // Remover importação do useWalletConnection
  // import { useWalletConnection } from '../hooks/useWalletConnection';
  const { taxaConversao, brlToUsdt } = useUSDTConversion();
  const { travarBoleto, liberarBoleto } = useBoletoEscrow();
  const { openConnectModal } = useConnectModal();

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
      const data = await res.json();
      setBoletos(data.map(boleto => ({
        ...boleto,
        numeroControle: boleto.numero_controle,
        codigoBarras: boleto.codigo_barras,
        cpfCnpj: boleto.cpf_cnpj,
        vencimento: boleto.vencimento,
        status: mapStatus(boleto.status)
      })));
    } catch {
      setBoletos([]);
    }
  };

  useEffect(() => {
    if (user?.uid) fetchBoletos();
  }, [user]);

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
    try {
      setAlertInfo({ type: 'default', title: 'Aguardando confirmação on-chain', message: 'Liberando valor na blockchain...' });
      // Chamar releaseEscrow no contrato
      const tx = await liberarBoleto({ escrowId: id });
      if (!tx.success) throw new Error(tx.error);
      // Atualizar status no backend
      await fetch(`http://localhost:3001/boletos/${id}/atualizar-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'BAIXADO', txHash: tx.txHash })
      });
      setAlertInfo({ type: 'success', title: 'Pagamento baixado', message: 'Valor liberado na blockchain e status atualizado.' });
      fetchBoletos();
    } catch (e) {
      setAlertInfo({ type: 'destructive', title: 'Erro ao baixar pagamento', message: e.message });
    }
  };

  const abrirDisputa = (boletoId) => {
    setDisputaModal({ open: true, boletoId });
    setMotivoDisputa('');
    setStatusDisputa(null);
  };
  const enviarDisputa = async () => {
    try {
      const resp = await fetch(`http://localhost:3001/boletos/${disputaModal.boletoId}/disputa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoDisputa, usuario: user?.uid })
      });
      if (!resp.ok) throw new Error('Erro ao registrar disputa');
      const data = await resp.json();
      setStatusDisputa(`Disputa aberta com sucesso!\nProtocolo: ${data.id}`);
      fetchBoletos();
    } catch (e) {
      setStatusDisputa('Erro ao abrir disputa: ' + e.message);
    }
  };
  const consultarDisputa = async (boletoId) => {
    try {
      const resp = await fetch(`http://localhost:3001/boletos/${boletoId}/disputa`);
      if (!resp.ok) throw new Error('Nenhuma disputa encontrada');
      const data = await resp.json();
      setStatusDisputa(`Status: ${data.status} | Motivo: ${data.motivo}`);
    } catch (e) {
      setStatusDisputa('Nenhuma disputa encontrada');
    }
  };

  // Substituir o formulário de cadastro pelo BoletoForm
  return (
    <div className="min-h-screen bg-lime-300 flex flex-col">
      <div style={{ background: '#ffe', color: '#b8860b', padding: 8, marginBottom: 8, borderRadius: 4 }}>
        <b>[DEBUG] Painel de conexão de carteira (moderno)</b>
        <ModernWalletConnector />
      </div>
      {/* Painel de debug */}
      <div style={{background:'#222',color:'#fff',padding:8,marginBottom:8,borderRadius:4}}>
        <b>DEBUG UID autenticado:</b> {user?.uid || 'N/A'}<br/>
        <b>Endpoint usado na busca:</b> <span style={{color:'#0f0'}}>{debugUrl || 'NÃO CHAMADO'}</span><br/>
        <b>Objeto enviado no cadastro:</b> <pre style={{display:'inline',color:'#0f0'}}>{debugBoleto ? JSON.stringify(debugBoleto,null,2) : '---'}</pre>
      </div>
      <main className="flex-1 container mx-auto px-4 py-1">
        <div className="w-full max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 bg-green-800 text-white p-2 rounded-lg text-center">Portal do Vendedor</h1>

          {alertInfo && (
            <Alert variant={alertInfo.type} className="mb-6" onClick={() => setAlertInfo(null)}>
              <div className="flex items-start">
                {alertInfo.type === 'destructive' && <FaExclamationTriangle className="mr-2 h-4 w-4" />}
                {alertInfo.type === 'success' && <FaCheck className="mr-2 h-4 w-4" />}
                {alertInfo.type === 'default' && <FaInfoCircle className="mr-2 h-4 w-4" />}
                <div>
                  <AlertTitle>{alertInfo.title}</AlertTitle>
                  <AlertDescription className="whitespace-pre-line">{alertInfo.message}</AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-3 bg-lime-300 p-1 rounded-xl">
              <TabsTrigger value="cadastrar" className="flex items-center justify-center data-[state=active]:bg-lime-600 data-[state=active]:text-white">
                <FaFileInvoiceDollar className="mr-2" /> Cadastrar
              </TabsTrigger>
              <TabsTrigger value="listar" className="flex items-center justify-center data-[state=active]:bg-lime-600 data-[state=active]:text-white">
                <FaList className="mr-2" /> Meus Boletos
              </TabsTrigger>
              <TabsTrigger value="historico" className="flex items-center justify-center data-[state=active]:bg-lime-600 data-[state=active]:text-white">
                <FaHistory className="mr-2" /> Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cadastrar">
              <BoletoForm user={user} onBoletoAdded={fetchBoletos} handleWalletConnection={handleWalletConnection} />
            </TabsContent>

            <TabsContent value="listar">
              <Card className="w-full max-w-7xl mx-auto shadow-lg rounded-lg overflow-hidden">
                <CardHeader className="bg-green-800 text-white">
                  <CardTitle className="text-2xl text-center">MEUS BOLETOS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-100">
                        <tr className="bg-gray-100">
                          <th className="p-3 text-center">Nº Boleto</th>
                          <th className="p-3 text-center">Código de Barras</th>
                          <th className="p-3 text-center">CPF/CNPJ</th>
                          <th className="p-3 text-center">Data Venc/to</th>
                          <th className="p-3 text-center">Valor (R$)</th>
                          <th className="p-3 text-center">Valor (USDT)</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boletos.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-gray-500">Nenhum boleto cadastrado</td>
                          </tr>
                        )}

                        {boletos.map((boleto) => (
                          <tr key={boleto.id} className="border-b border-gray-200">
                            <td className="p-3 text-center font-medium">{boleto.numeroControle || '-'}</td>
                            <td className="p-3 text-center text-xs">{boleto.codigoBarras}</td>
                            <td className="p-3 text-center">{boleto.cpfCnpj}</td>
                            <td className="p-3 text-center">{formatarData(boleto.vencimento)}</td>
                            <td className="p-3 text-center">{boleto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="p-3 text-center">{brlToUsdt ? brlToUsdt(boleto.valor) : '-'}</td>
                            <td className="p-3 text-center">{boleto.status.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())}</td>
                            <td className="p-3 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline">Ações</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {boleto.comprovanteUrl && (
                                    <DropdownMenuItem onClick={() => window.open(boleto.comprovanteUrl, '_blank')}>Visualizar comprovante</DropdownMenuItem>
                                  )}
                                  {boleto.comprovanteUrl && (
                                    <DropdownMenuItem onClick={() => handleBaixarPagamento(boleto.id)}>Baixar pagamento</DropdownMenuItem>
                                  )}
                                  {boleto.status !== 'EXCLUIDO' && (
                                    <DropdownMenuItem onClick={() => handleCancelar(boleto.id)}>Cancelar</DropdownMenuItem>
                                  )}
                                  {boleto.status === 'EXCLUIDO' && (
                                    <DropdownMenuItem onClick={() => handleDelete(boleto.id)}>Excluir</DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => abrirDisputa(boleto.id)}>
                                    Abrir disputa
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => consultarDisputa(boleto.id)}>
                                    Consultar disputa
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historico">
              <Card>
                <CardHeader className="bg-green-800 text-white">
                  <CardTitle>Histórico de Transações</CardTitle>
                  <CardDescription>Acompanhe todas as suas transações realizadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <HistoricoTransacoes tipoUsuario="vendedor" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      {disputaModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-start justify-center pt-12 z-50">
          <div className="bg-white bg-opacity-100 p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-300 flex flex-col justify-center items-center z-60" style={{ backgroundColor: 'rgba(255,255,255,1)', minHeight: '24rem' }}>
            <h2 className="text-2xl font-bold mb-0 text-center text-lime-700">Abrir Disputa</h2>
            <p className="text-gray-600 text-center mb-4 mt-1">Descreva o motivo da disputa para gerar um protocolo de atendimento.</p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 mb-6 text-gray-800 focus:ring-2 focus:ring-lime-600 focus:outline-none resize-none"
              rows={12}
              placeholder="Descreva o motivo da disputa"
              value={motivoDisputa}
              onChange={e => setMotivoDisputa(e.target.value)}
              style={{ boxSizing: 'border-box', minHeight: '12rem' }}
            />
            <div className="flex justify-end gap-3 mt-2">
              <button className="bg-lime-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-lime-700 transition" onClick={enviarDisputa}>Enviar</button>
              <button className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg font-semibold hover:bg-gray-300 transition" onClick={() => setDisputaModal({ open: false, boletoId: null })}>Cancelar</button>
            </div>
            {statusDisputa && (
              <div className="mt-6 text-center text-base font-medium text-lime-700 bg-lime-50 border border-lime-200 rounded-lg py-2 px-3 shadow-sm">
                {statusDisputa}
              </div>
            )}
          </div>
        </div>
      )}
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
