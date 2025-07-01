import { useState } from 'react';
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
    conectarCarteira(novoBoleto);
  };

  const conectarCarteira = (boleto) => {
    setAlertInfo({
      type: 'success',
      title: 'Carteira conectada',
      message: `Conectando carteira para pagamento do boleto ${boleto.numeroBoleto}...`
    });

    setFormData({
      cpfCnpj: '',
      codigoBarras: '',
      valor: '',
      dataVencimento: '',
      instituicao: ''
    });
    setActiveTab('listar');
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

  return (
    <div className="min-h-screen bg-lime-300 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-1">
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

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="valor">Valor (R$)</Label>
                      <Input
                        id="valor"
                        name="valor"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.valor}
                        onChange={handleChange}
                        className="w-48"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="valorUsdt">Valor (USDT)</Label>
                      <Input
                        id="valorUsdt"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.valor ? (parseFloat(formData.valor) / 5.0).toFixed(2) : ''}
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
                    <Button type="submit" className="flex items-center gap-2 px-6 py-3 bg-lime-600 text-white hover:bg-lime-700">
                      <FaWallet /> Cadastrar e Conectar Carteira
                    </Button>
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
