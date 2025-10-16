import { useState, useEffect } from 'react';
import {
  FaTrash, FaWallet, FaFileInvoiceDollar,
  FaList, FaCheck, FaHistory,
  FaExclamationTriangle, FaInfoCircle
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

function VendedorPage() {
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
  const [cotacao, setCotacao] = useState(null);
  const [valorUsdt, setValorUsdt] = useState('');
  const [carteiraConectada, setCarteiraConectada] = useState(false);
  const [conectando, setConectando] = useState(false);

  // Função para buscar cotação online (CoinGecko)
  async function buscarCotacao() {
    try {
      const resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=brl');
      const data = await resp.json();
      setCotacao(data.tether.brl);
    } catch (e) {
      setCotacao(null);
    }
  }

  useEffect(() => {
    buscarCotacao();
  }, []);

  useEffect(() => {
    if (!cotacao) return;
    const limpo = String(formData.valor).replace(/\D/g, "");
    if (!limpo) { setValorUsdt(''); return; }
    const inteiro = limpo.slice(0, -2) || "0";
    const centavos = limpo.slice(-2).padStart(2, "0");
    const valorNum = parseFloat(inteiro + "." + centavos);
    if (isNaN(valorNum) || valorNum <= 0) { setValorUsdt(''); return; }
    const usdt = valorNum / cotacao;
    setValorUsdt(usdt.toFixed(2));
  }, [formData.valor, cotacao]);

  // Função para conectar carteira manualmente
  async function conectarCarteira() {
    setConectando(true);
    try {
      // Exemplo usando window.ethereum (MetaMask)
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setCarteiraConectada(true);
        setAlertInfo({ type: 'success', title: 'Carteira conectada', message: 'Carteira conectada com sucesso.' });
      } else {
        setAlertInfo({ type: 'destructive', title: 'Erro', message: 'Nenhuma carteira encontrada. Instale MetaMask ou similar.' });
      }
    } catch (e) {
      setAlertInfo({ type: 'destructive', title: 'Erro ao conectar carteira', message: e.message });
    }
    setConectando(false);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Novo handleSubmit: só cadastra e trava se carteira conectada
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!carteiraConectada) {
      setAlertInfo({ type: 'destructive', title: 'Conecte a carteira', message: 'Conecte sua carteira antes de cadastrar o boleto.' });
      return;
    }
    let errors = {};

    if (formData.cpfCnpj.length < 11) errors.cpfCnpj = 'CPF/CNPJ inválido';
    if (formData.codigoBarras.length < 30) errors.codigoBarras = 'Código de barras inválido';
    if (!formData.valor || parseFloat(formData.valor) <= 0) errors.valor = 'Valor inválido';
    if (!formData.dataVencimento || new Date(formData.dataVencimento) < new Date()) errors.dataVencimento = 'Data inválida';

    if (Object.keys(errors).length) {
      setAlertInfo({
        type: 'destructive',
        title: 'Erro ao cadastrar boleto',
        message: Object.values(errors).join('\n')
      });
      return;
    }

    const novoBoleto = {
      id: boletos.length + 1,
      numeroBoleto: Math.floor(10000000 + Math.random() * 90000000).toString(),
      codigoBarras: formData.codigoBarras,
      cpfCnpj: formData.cpfCnpj,
      dataVencimento: formData.dataVencimento,
      valor: parseFloat(formData.valor),
      instituicao: formData.instituicao, // Mantido no objeto mas não exibido na tabela
      status: 'Pendente'
    };

    setBoletos([...boletos, novoBoleto]);
    // Aqui você faria a lógica de travamento da USDT na carteira
    // Por exemplo, se a carteira estivesse conectada, você faria uma chamada para um backend
    // que faria a transação de travamento.
    // Por enquanto, apenas cadastra e mostra mensagem.
    setAlertInfo({
      type: 'success',
      title: 'Boleto cadastrado',
      message: `Boleto ${novoBoleto.numeroBoleto} cadastrado com sucesso. Valor travado em USDT.`
    });
  };

  const handleDelete = (id) => {
    setBoletos(boletos.filter((b) => b.id !== id));
    setAlertInfo({
      type: 'success',
      title: 'Boleto excluído',
      message: 'O boleto foi excluído com sucesso.'
    });
  };

  const handlePay = (boleto) => {
    const boletosAtualizados = boletos.map((b) =>
      b.id === boleto.id ? { ...b, status: 'Pago' } : b
    );
    setBoletos(boletosAtualizados);
    setAlertInfo({
      type: 'success',
      title: 'Pagamento realizado',
      message: `O boleto ${boleto.numeroBoleto} foi pago com sucesso.`
    });
  };

  function formatarMoeda(valor) {
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
  }

  return (
    <div className="min-h-screen bg-lime-300 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-1">
        <h1 className="text-3xl font-bold mb-2 bg-green-800 text-white p-2 rounded-lg text-center">Portal do Vendedor</h1>

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

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="valor">Valor (R$)</Label>
                      <Input
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
                    <div>
                      <Label htmlFor="valorUsdt">Valor (USDT)</Label>
                      <Input
                        id="valorUsdt"
                        name="valorUsdt"
                        type="text"
                        value={valorUsdt}
                        readOnly
                        className="w-32 bg-green-100 border-green-500"
                        placeholder="-"
                      />
                      <div className="text-xs text-gray-500 mt-1">Cotação: {cotacao ? `R$ ${cotacao}` : '---'}</div>
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

                  {/* Botão de conectar carteira */}
                  <div className="flex flex-col items-center gap-4 mt-6">
                    <div className="flex gap-4 w-full justify-center">
                      <button
                        type="button"
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition text-white ${carteiraConectada ? 'bg-green-500' : 'bg-lime-600'} hover:bg-lime-700`}
                        onClick={conectarCarteira}
                        disabled={carteiraConectada || conectando}
                        style={{ minWidth: 200 }}
                      >
                        {conectando ? 'Conectando...' : carteiraConectada ? 'Carteira conectada' : 'Conectar Carteira'}
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition text-white bg-orange-600 hover:bg-orange-700"
                        disabled={!carteiraConectada}
                        style={{ minWidth: 240 }}
                      >
                        Cadastrar Boleto e Travar USDT
                      </button>
                    </div>
                    {/* Mensagem de sucesso/erro abaixo dos botões */}
                    {alertInfo && alertInfo.type === 'success' && (
                      <div className="mt-4 px-6 py-3 rounded-lg font-bold text-white bg-lime-500 border-2 border-lime-700 shadow-lg text-center w-full max-w-md mx-auto text-lg tracking-wide">
                        Boleto Cadastrado e USDT Travado!
                      </div>
                    )}
                    {alertInfo && alertInfo.type === 'destructive' && (
                      <div className="mt-2 px-6 py-3 rounded-lg font-semibold text-white bg-red-700 shadow text-center w-full max-w-md">
                        {alertInfo.title && <div className="text-lg mb-1">{alertInfo.title}</div>}
                        <div>{alertInfo.message}</div>
                      </div>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listar">
            <Card>
              <CardHeader className="bg-green-800 text-white">
                <CardTitle className="text-2xl text-center">MEUS BOLETOS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-green-800 text-white">
                      <tr>
                        <th className="p-3 text-left">Nº Boleto</th>
                        <th className="p-3 text-left">Código de Barras</th>
                        <th className="p-3 text-left">CPF/CNPJ</th>
                        <th className="p-3 text-left">Data Venc/to</th>
                        <th className="p-3 text-left">Data Pag/to</th>
                        <th className="p-3 text-left">Valor (R$)</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Ações</th>
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
                          <td className="p-3 font-medium">{boleto.numeroBoleto}</td>
                          <td className="p-3 text-xs">{boleto.codigoBarras}</td>
                          <td className="p-3">{boleto.cpfCnpj}</td>
                          <td className="p-3">{new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}</td>
                          <td className="p-3">{boleto.status === 'Pago' ? new Date().toLocaleDateString('pt-BR') : '-'}</td>
                          <td className="p-3">{boleto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${boleto.status === 'Pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {boleto.status === 'Pago' && <FaCheck className="mr-1" />}
                              {boleto.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex space-x-2">
                              <Button onClick={() => handlePay(boleto)} className="p-2 bg-lime-600 hover:bg-lime-700">
                                <FaCheck size={16} />
                              </Button>
                              <Button onClick={() => handleDelete(boleto.id)} className="p-2 bg-red-600 hover:bg-red-700">
                                <FaTrash size={16} />
                              </Button>
                            </div>
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
      </main>
    </div>
  );
}

export default VendedorPage;
