import { useState } from 'react';
import { FaPlus, FaTrash, FaWallet, FaFileInvoiceDollar, FaList, FaCheck, FaTimes, FaImage, FaUpload, FaLock, FaBook, FaHistory } from 'react-icons/fa';
import LivroOrdens from '../components/LivroOrdens';
import HistoricoTransacoes from '../components/HistoricoTransacoes';

function CompradorPage() {
  const [activeTab, setActiveTab] = useState('cadastrar');
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
      status: 'Travado para Pagamento',
      comprovante: null
    },
    {
      id: 3,
      numeroBoleto: '45678912',
      codigoBarras: '34191.79001 01043.510047 91020.150008 7 89130000268500',
      beneficiario: 'Serviços Gerais Ltda',
      cpfCnpj: '45.678.912/0001-34',
      dataVencimento: '2025-08-05',
      dataPagamento: null,
      valor: 268.50,
      valorTravado: null,
      taxaServico: null,
      status: 'Pendente',
      comprovante: null
    }
  ]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Adicionar novo boleto à lista
    const novoBoleto = {
      id: boletos.length + 1,
      numeroBoleto: Math.floor(10000000 + Math.random() * 90000000).toString(),
      codigoBarras: formData.codigoBarras,
      beneficiario: formData.beneficiario,
      cpfCnpj: formData.cpfCnpj,
      dataVencimento: formData.dataVencimento,
      dataPagamento: null,
      valor: parseFloat(formData.valor),
      valorTravado: formData.travarParaPagamento ? parseFloat(formData.valor) * 0.2 : null, // 20% do valor como exemplo
      taxaServico: formData.travarParaPagamento ? parseFloat(formData.valor) * 0.01 : null, // 1% do valor como exemplo
      status: formData.travarParaPagamento ? 'Travado para Pagamento' : 'Pendente',
      comprovante: null
    };
    
    setBoletos([...boletos, novoBoleto]);
    
    // Limpar formulário
    setFormData({
      beneficiario: '',
      cpfCnpj: '',
      codigoBarras: '',
      valor: '',
      valorUsdt: '',
      dataVencimento: '',
      travarParaPagamento: true
    });
    
    // Mudar para a aba de listagem
    setActiveTab('listar');
  };
  
  const handleDelete = (id) => {
    setBoletos(boletos.filter(boleto => boleto.id !== id));
  };
  
  const handleUploadComprovante = (id) => {
    // Simulação de upload de comprovante
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          setBoletos(boletos.map(boleto => 
            boleto.id === id 
              ? { ...boleto, comprovante: reader.result, status: 'Pago', dataPagamento: new Date().toISOString().split('T')[0] } 
              : boleto
          ));
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-greenDark">Comprar USDT</h1>
      
      {/* Abas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'livroOrdens'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('livroOrdens')}
          >
            <FaBook className="inline mr-2" /> Livro de Ordens
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cadastrar'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('cadastrar')}
          >
            <FaLock className="inline mr-2" /> Travar Boleto
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'listar'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('listar')}
          >
            <FaList className="inline mr-2" /> Meus Boletos
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'historico'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('historico')}
          >
            <FaHistory className="inline mr-2" /> Histórico de Transações
          </button>
        </nav>
      </div>
      
      {/* Conteúdo da aba */}
      <div className="mt-6">
        {activeTab === 'historico' ? (
          <HistoricoTransacoes tipoUsuario="comprador" />
        ) : activeTab === 'livroOrdens' ? (
          <LivroOrdens />
        ) : activeTab === 'cadastrar' ? (
          <div className="card">
            <h2 className="text-xl font-semibold text-greenDark mb-4">Travar Boleto</h2>
            <p className="text-grayMedium mb-6">Confira os dados do boleto selecionado abaixo e conecte sua carteira para TRAVAR O BOLETO para pagamento.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Beneficiário - Somente leitura */}
                <div>
                  <label htmlFor="beneficiario" className="block text-sm font-medium text-gray-700 mb-1">
                    Beneficiário
                  </label>
                  <input
                    id="beneficiario"
                    name="beneficiario"
                    type="text"
                    value={formData.beneficiario}
                    onChange={handleChange}
                    className="form-input bg-grayLight"
                    readOnly
                  />
                </div>
                
                {/* CPF/CNPJ */}
                <div>
                  <label htmlFor="cpfCnpj" className="block text-sm font-medium text-gray-700 mb-1">
                    CPF/CNPJ do Beneficiário
                  </label>
                  <input
                    id="cpfCnpj"
                    name="cpfCnpj"
                    type="text"
                    value={formData.cpfCnpj}
                    onChange={handleChange}
                    className="form-input bg-grayLight"
                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                    readOnly
                  />
                </div>
                
                {/* Código de Barras */}
                <div className="md:col-span-2">
                  <label htmlFor="codigoBarras" className="block text-sm font-medium text-gray-700 mb-1">
                    Código de Barras
                  </label>
                  <input
                    id="codigoBarras"
                    name="codigoBarras"
                    type="text"
                    value={formData.codigoBarras}
                    onChange={handleChange}
                    className="form-input bg-grayLight"
                    readOnly
                  />
                </div>
                
                {/* Valor em Reais */}
                <div>
                  <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    id="valor"
                    name="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={handleChange}
                    className="form-input bg-grayLight"
                    readOnly
                  />
                </div>
                
                {/* Valor em USDT */}
                <div>
                  <label htmlFor="valorUsdt" className="block text-sm font-medium text-greenDark mb-1 font-semibold">
                    Valor em USDT
                  </label>
                  <div className="relative">
                    <input
                      id="valorUsdt"
                      name="valorUsdt"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor ? (parseFloat(formData.valor) / taxaConversao).toFixed(2) : ''}
                      className="form-input bg-greenLight border-greenPrimary"
                      readOnly
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-greenDark">
                      USDT
                    </div>
                  </div>
                </div>
                
                {/* Valor Final (após comissão) */}
                <div>
                  <label htmlFor="valorFinal" className="block text-sm font-medium text-greenDark mb-1 font-semibold">
                    Valor Final (após 3% de comissão)
                  </label>
                  <div className="relative">
                    <input
                      id="valorFinal"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor ? ((parseFloat(formData.valor) / taxaConversao) * (1 - taxaComissao)).toFixed(2) : ''}
                      className="form-input bg-greenLight border-greenPrimary"
                      readOnly
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-greenDark">
                      USDT
                    </div>
                  </div>
                </div>
                
                {/* Data de Vencimento */}
                <div>
                  <label htmlFor="dataVencimento" className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Vencimento
                  </label>
                  <input
                    id="dataVencimento"
                    name="dataVencimento"
                    type="date"
                    value={formData.dataVencimento}
                    onChange={handleChange}
                    className="form-input bg-grayLight"
                    readOnly
                  />
                </div>
                
                {/* Opção de travar para pagamento */}
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      id="travarParaPagamento"
                      name="travarParaPagamento"
                      type="checkbox"
                      checked={formData.travarParaPagamento}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="travarParaPagamento" className="ml-2 block text-sm text-gray-700">
                      <FaLock className="inline mr-1 text-primary" /> Travar este boleto para pagamento imediato
                    </label>
                  </div>
                  
                  {formData.travarParaPagamento && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                      <p className="font-medium">Informação sobre travamento:</p>
                      <p>Ao travar o boleto, você reserva o valor em USDT para garantir o pagamento. A taxa de serviço é de 1% do valor do boleto.</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  className="btn-primary flex items-center"
                >
                  <FaWallet className="inline mr-2" /> Conectar Carteira e Travar Boleto
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Meus Boletos</h2>
            
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Nº Boleto</th>
                    <th className="table-header-cell">Detalhes</th>
                    <th className="table-header-cell">Datas</th>
                    <th className="table-header-cell">Valores</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Ações</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {boletos.map((boleto) => (
                    <tr key={boleto.id} className="table-row">
                      <td className="table-cell font-medium">
                        {boleto.numeroBoleto}
                        <div className="text-xs text-gray-500 mt-1">
                          Cód: {boleto.codigoBarras.substring(0, 10)}...
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="font-medium">{boleto.beneficiario}</div>
                        <div className="text-xs text-gray-500">{boleto.cpfCnpj}</div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <span className="text-xs font-medium text-gray-500">Vencimento:</span>{' '}
                          {new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}
                        </div>
                        {boleto.dataPagamento && (
                          <div>
                            <span className="text-xs font-medium text-gray-500">Pagamento:</span>{' '}
                            {new Date(boleto.dataPagamento).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        <div>
                          <span className="text-xs font-medium text-gray-500">Valor:</span>{' '}
                          {boleto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        {boleto.valorTravado && (
                          <div>
                            <span className="text-xs font-medium text-gray-500">Travado (USDT):</span>{' '}
                            {boleto.valorTravado.toFixed(2)}
                          </div>
                        )}
                        {boleto.taxaServico && (
                          <div>
                            <span className="text-xs font-medium text-gray-500">Taxa:</span>{' '}
                            {boleto.taxaServico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          boleto.status === 'Pago' 
                            ? 'bg-green-100 text-green-800' 
                            : boleto.status === 'Travado para Pagamento'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {boleto.status === 'Pago' ? <FaCheck className="mr-1" /> : null}
                          {boleto.status === 'Travado para Pagamento' ? <FaLock className="mr-1" /> : null}
                          {boleto.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          {boleto.status === 'Travado para Pagamento' && (
                            <button
                              onClick={() => handleUploadComprovante(boleto.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Enviar Comprovante"
                            >
                              <FaUpload />
                            </button>
                          )}
                          
                          {boleto.comprovante && (
                            <button
                              onClick={() => window.open(boleto.comprovante, '_blank')}
                              className="text-green-600 hover:text-green-900"
                              title="Ver Comprovante"
                            >
                              <FaImage />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDelete(boleto.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {boletos.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        Nenhum boleto cadastrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Seção de Comprovantes */}
            {boletos.some(boleto => boleto.comprovante) && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Comprovantes de Pagamento</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {boletos.filter(boleto => boleto.comprovante).map(boleto => (
                    <div key={`comprovante-${boleto.id}`} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="p-2 bg-gray-50 border-b border-gray-200">
                        <p className="text-sm font-medium">Boleto #{boleto.numeroBoleto}</p>
                      </div>
                      <div className="p-2">
                        <img 
                          src={boleto.comprovante} 
                          alt={`Comprovante do boleto ${boleto.numeroBoleto}`} 
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CompradorPage;
