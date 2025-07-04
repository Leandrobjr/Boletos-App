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
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useUSDTConversion } from '../hooks/useUSDTConversion';
import { useBoletoEscrow } from '../hooks/useBoletoEscrow';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAuth } from '../components/auth/AuthProvider';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/dropdown-menu';

function VendedorPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cadastrar');
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
  const { taxaConversao, brlToUsdt } = useUSDTConversion();
  const { travarBoleto } = useBoletoEscrow();
  const { openConnectModal } = useConnectModal();

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let errors = {};
    if (formData.cpfCnpj.length < 11) errors.cpfCnpj = 'CPF/CNPJ inválido';
    if (formData.codigoBarras.length < 30) errors.codigoBarras = 'Código de barras inválido';
    if (!formData.valor || parseFloat(formData.valor.replace(/\./g, '').replace(',', '.')) <= 0) errors.valor = 'Valor inválido';
    if (!formData.dataVencimento || new Date(formData.dataVencimento) < new Date()) errors.dataVencimento = 'Data inválida';
    if (!wallet.isConnected) errors.wallet = 'Conecte sua carteira antes de travar o boleto';
    if (!user?.uid) errors.uid = 'Usuário não autenticado';
    if (Object.keys(errors).length) {
      setAlertInfo({
        type: 'destructive',
        title: 'Erro ao cadastrar boleto',
        message: Object.values(errors).join('\n')
      });
      return;
    }
    // Monta o objeto do boleto para o backend
    const valorNum = parseFloat(formData.valor.replace(/\./g, '').replace(',', '.'));
    const boletoObj = {
      uid: user.uid,
      cpfCnpj: formData.cpfCnpj,
      codigoBarras: formData.codigoBarras,
      valor: valorNum,
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
      if (!resp.ok) throw new Error('Erro ao cadastrar boleto');
    setFormData({
      cpfCnpj: '',
      codigoBarras: '',
      valor: '',
      dataVencimento: '',
      instituicao: ''
    });
    setActiveTab('listar');
      setAlertInfo({
        type: 'success',
        title: 'Boleto cadastrado com sucesso',
        message: `Boleto cadastrado e travado!`
      });
      fetchBoletos();
    } catch (e) {
      setAlertInfo({
        type: 'destructive',
        title: 'Erro ao cadastrar boleto',
        message: e.message
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

  return (
    <div className="min-h-screen bg-lime-300 flex flex-col">
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
              <Card>
                <CardHeader className="bg-green-800 text-white">
                  <CardTitle className="text-xl">Cadastrar Boleto</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="codigoBarras">Código de Barras</Label>
                      <Input
                        id="codigoBarras"
                        name="codigoBarras"
                        type="text"
                        value={formData.codigoBarras}
                        onChange={handleChange}
                        maxLength={48}
                        className="w-full max-w-[480px]"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="cpfCnpj">CPF/CNPJ do Beneficiário</Label>
                      <Input
                        id="cpfCnpj"
                        name="cpfCnpj"
                        type="text"
                        value={formData.cpfCnpj}
                        onChange={handleChange}
                        maxLength={14}
                        className="w-64"
                        required
                      />
                    </div>

                      <div>
                        <Label htmlFor="valor">Valor (R$)</Label>
                    </div>
                    <div>
                      <input
                          id="valor"
                          name="valor"
                        type="text"
                          value={formData.valor}
                        onChange={e => setFormData({ ...formData, valor: formatarMoeda(e.target.value) })}
                        onPaste={e => {
                          e.preventDefault();
                          const texto = e.clipboardData.getData('Text');
                          setFormData({ ...formData, valor: formatarMoeda(texto) });
                        }}
                          className="w-48"
                        placeholder="0,00"
                        autoComplete="off"
                          required
                        />
                      </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="valorUsdt">Valor (USDT)</Label>
                        <Input
                          id="valorUsdt"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.valor ? brlToUsdt(formData.valor) : ''}
                          readOnly
                          className="bg-green-100 border-green-500 w-48"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                      <Input
                        id="dataVencimento"
                        name="dataVencimento"
                        type="date"
                        value={formData.dataVencimento}
                        onChange={handleChange}
                        className="w-48"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="instituicao">Instituição Emissora</Label>
                      <Input
                        id="instituicao"
                        name="instituicao"
                        type="text"
                        value={formData.instituicao}
                        onChange={handleChange}
                        className="w-64"
                        required
                      />
                    </div>

                    <div className="flex justify-center mt-6">
                      {!wallet.isConnected ? (
                        <Button type="button" onClick={openConnectModal} className="flex items-center gap-2 px-6 py-3 bg-lime-600 text-white hover:bg-lime-700">
                          <FaWallet /> Conectar Carteira
                        </Button>
                      ) : (
                        <Button type="submit" className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white hover:bg-red-700">
                          <FaWallet /> Cadastrar e Travar Boleto
                      </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
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
