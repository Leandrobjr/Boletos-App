import { useState } from 'react';
import { FaTrash, FaWallet, FaCheck, FaTimes, FaLock, FaImage, FaUpload, FaBitcoin } from 'react-icons/fa';
import Button from '../components/ui/Button';

function CompradorPage() {
  const [formData, setFormData] = useState({
    beneficiario: '',
    cpfCnpj: '',
    codigoBarras: '',
    valor: '',
    valorUsdt: '',
    dataVencimento: '',
    travarParaPagamento: true
  });
  
  // Taxa de conversão simulada (1 USDT = R$ 5,00)
  const taxaConversao = 5.0;
  // Taxa de comissão do serviço (3%)
  const taxaComissao = 0.03;
  
  // Dados simulados de boletos
  const [boletos, setBoletos] = useState([
    {
      id: 1,
      numeroBoleto: '12345678',
      codigoBarras: '03399.63290 64000.000006 00125.201020 4 89150000017832',
      beneficiario: 'Empresa ABC Ltda',
      cpfCnpj: '12.345.678/0001-99',
      dataVencimento: '2025-07-15',
      dataPagamento: '2025-06-10',
      valor: 178.32,
      valorTravado: 35.66,
      taxaServico: 1.78,
      status: 'Pago',
      comprovante: 'https://via.placeholder.com/300x400?text=Comprovante'
    },
    {
      id: 2,
      numeroBoleto: '87654321',
      codigoBarras: '23791.22928 60005.762908 52000.063305 9 89840000010000',
      beneficiario: 'Fornecedor XYZ S/A',
      cpfCnpj: '98.765.432/0001-10',
      dataVencimento: '2025-06-30',
      dataPagamento: null,
      valor: 100.00,
      valorTravado: 20.00,
      taxaServico: 1.00,
      status: 'Pendente',
      comprovante: null
    },
    {
      id: 3,
      numeroBoleto: '45678912',
      codigoBarras: '34191.79001 01043.510047 91020.150008 5 89840000010000',
      beneficiario: 'Serviços Tech Ltda',
      cpfCnpj: '45.678.912/0001-34',
      dataVencimento: '2025-06-25',
      dataPagamento: null,
      valor: 250.00,
      valorTravado: 0,
      taxaServico: 0,
      status: 'Cancelado',
      comprovante: null
    }
  ]);
  
  // Função para lidar com mudanças no formulário
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => {
      const updatedData = { ...prev, [name]: newValue };
      
      // Atualizar valor em USDT quando o valor em R$ mudar
      if (name === 'valor' && value) {
        updatedData.valorUsdt = (parseFloat(value) / taxaConversao).toFixed(2);
      }
      
      return updatedData;
    });
  };
  
  // Função para lidar com o envio do formulário
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Carteira conectada e boleto travado para pagamento!');
    
    // Aqui seria a integração com a carteira e o backend
    console.log('Dados do formulário:', formData);
    
    // Adicionar o novo boleto à lista (simulação)
    const novoBoleto = {
      id: boletos.length + 1,
      numeroBoleto: Math.floor(10000000 + Math.random() * 90000000).toString(),
      codigoBarras: formData.codigoBarras,
      beneficiario: formData.beneficiario || 'Beneficiário não informado',
      cpfCnpj: formData.cpfCnpj,
      dataVencimento: formData.dataVencimento,
      dataPagamento: null,
      valor: parseFloat(formData.valor),
      valorTravado: parseFloat(formData.valorUsdt),
      taxaServico: parseFloat(formData.valor) * taxaComissao,
      status: 'Pendente',
      comprovante: null
    };
    
    setBoletos([novoBoleto, ...boletos]);
    
    // Limpar o formulário
    setFormData({
      beneficiario: '',
      cpfCnpj: '',
      codigoBarras: '',
      valor: '',
      valorUsdt: '',
      dataVencimento: '',
      travarParaPagamento: true
    });
  };
  
  // Função para cancelar um boleto
  const handleCancelarBoleto = (id) => {
    if (window.confirm('Tem certeza que deseja cancelar este boleto?')) {
      setBoletos(boletos.map(boleto => 
        boleto.id === id ? { ...boleto, status: 'Cancelado' } : boleto
      ));
    }
  };
  
  // Função para fazer upload de comprovante
  const handleUploadComprovante = (id) => {
    // Simulação de upload
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Simulando URL do comprovante
        const comprovante = URL.createObjectURL(file);
        
        setBoletos(boletos.map(boleto => 
          boleto.id === id ? { ...boleto, comprovante, status: 'Pago' } : boleto
        ));
      }
    };
    fileInput.click();
  };
  
  // Função para visualizar comprovante
  const handleVerComprovante = (url) => {
    window.open(url, '_blank');
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Cabeçalho */}
      <div className="bg-green-100 p-4 rounded-lg border border-green-200 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Área do Comprador</h2>
        <p className="text-gray-600">Gerencie seus boletos e realize pagamentos com criptomoedas</p>
      </div>
      
      {/* Layout principal em duas colunas horizontais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Coluna 1: Seção de Cadastro de Boleto */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Cadastrar Novo Boleto</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-6">Confira os dados do boleto selecionado abaixo e conecte sua carteira para TRAVAR O BOLETO para pagamento.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Beneficiário */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="beneficiario">Beneficiário</label>
                  <input
                    type="text"
                    id="beneficiario"
                    name="beneficiario"
                    value={formData.beneficiario}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Nome do beneficiário"
                  />
                </div>
                
                {/* CPF/CNPJ */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cpfCnpj">CPF/CNPJ</label>
                  <input
                    type="text"
                    id="cpfCnpj"
                    name="cpfCnpj"
                    value={formData.cpfCnpj}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                  />
                </div>
                
                {/* Código de Barras */}
                <div className="mb-4 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="codigoBarras">Código de Barras</label>
                  <input
                    type="text"
                    id="codigoBarras"
                    name="codigoBarras"
                    value={formData.codigoBarras}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="valor">Valor (R$)</label>
                    <input
                      type="number"
                      id="valor"
                      name="valor"
                      value={formData.valor}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="0,00"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="valorUsdt">Valor (USDT)</label>
                    <div className="relative">
                      <input
                        type="number"
                        id="valorUsdt"
                        name="valorUsdt"
                        value={formData.valorUsdt}
                        onChange={handleChange}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="0,00"
                        step="0.01"
                        readOnly
                      />
                      <FaBitcoin className="absolute left-2.5 top-2.5 text-primary" size={18} />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="dataVencimento">Data de Vencimento</label>
                    <input
                      type="date"
                      id="dataVencimento"
                      name="dataVencimento"
                      value={formData.dataVencimento}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="mb-4 md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="travarParaPagamento"
                      name="travarParaPagamento"
                      checked={formData.travarParaPagamento}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700" htmlFor="travarParaPagamento">
                      Travar boleto para pagamento imediato
                    </label>
                  </div>
                  
                  {formData.travarParaPagamento && (
                    <div className="mt-3 p-4 bg-primary-50 border border-primary-200 rounded-lg text-sm">
                      <p className="font-medium text-primary-800 mb-1">Informação sobre travamento:</p>
                      <p className="text-gray-700">Ao travar o boleto, você reserva o valor em USDT para garantir o pagamento. A taxa de serviço é de {taxaComissao * 100}% do valor do boleto.</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-5 border-t border-gray-200 mt-8">
                <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
                  <p className="text-sm font-medium text-gray-800">Taxa de serviço: <span className="text-primary-700 font-bold">{taxaComissao * 100}%</span></p>
                  {formData.valor && (
                    <p className="text-sm text-gray-700 mt-1">Taxa estimada: <span className="font-medium text-primary-700">R$ {(parseFloat(formData.valor) * taxaComissao).toFixed(2)}</span></p>
                  )}
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  leftIcon={<FaWallet />}
                >
                  Conectar Carteira e Travar Boleto
                </Button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Coluna 2: Seção de Listagem de Boletos */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Meus Boletos</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Boleto</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beneficiário</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {boletos.map((boleto, index) => (
                    <tr key={boleto.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{boleto.numeroBoleto}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{boleto.beneficiario}</div>
                        <div className="text-xs text-gray-400">{boleto.cpfCnpj}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>R$ {boleto.valor.toFixed(2)}</div>
                        <div className="text-xs text-gray-400">USDT {boleto.valorTravado.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={
                          `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            boleto.status === 'Pago' ? 'bg-green-100 text-green-800' : 
                            boleto.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`
                        }>
                          {boleto.status === 'Pago' ? <FaCheck className="mr-1" size={10} /> : 
                           boleto.status === 'Pendente' ? <FaLock className="mr-1" size={10} /> : 
                           <FaTimes className="mr-1" size={10} />}
                          {boleto.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {boleto.status === 'Travado para Pagamento' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<FaUpload />}
                              onClick={() => handleUploadComprovante(boleto.id)}
                            >
                              Comprovante
                            </Button>
                          )}
                          
                          {boleto.comprovante && (
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<FaImage />}
                              onClick={() => handleVerComprovante(boleto.comprovante)}
                            >
                              Ver
                            </Button>
                          )}
                          
                          {boleto.status !== 'Cancelado' && boleto.status !== 'Pago' && (
                            <Button
                              variant="danger"
                              size="sm"
                              leftIcon={<FaTrash />}
                              onClick={() => handleCancelarBoleto(boleto.id)}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Seção de Comprovantes */}
            {boletos.some(boleto => boleto.comprovante) && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Comprovantes de Pagamento</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {boletos.filter(boleto => boleto.comprovante).map(boleto => (
                    <div key={`comprovante-${boleto.id}`} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <div className="p-3 bg-gray-50 border-b border-gray-200">
                        <h4 className="font-medium text-sm">Boleto #{boleto.numeroBoleto}</h4>
                        <p className="text-xs text-gray-500">Pago em: {boleto.dataPagamento ? new Date(boleto.dataPagamento).toLocaleDateString('pt-BR') : 'N/A'}</p>
                      </div>
                      <div className="p-3">
                        <img 
                          src={boleto.comprovante} 
                          alt={`Comprovante do boleto ${boleto.numeroBoleto}`} 
                          className="w-full h-40 object-cover rounded cursor-pointer"
                          onClick={() => handleVerComprovante(boleto.comprovante)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Rodapé */}
      <div className="bg-green-100 p-4 rounded-lg border border-green-200">
        <p className="text-center text-gray-600">© 2025 BXC Boletos - Sistema de Pagamento de Boletos com Criptomoedas</p>
      </div>
    </div>
  );
}

export default CompradorPage;