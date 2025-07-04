import { useState } from 'react';
import { FaPlus, FaTrash, FaWallet, FaFileInvoiceDollar, FaList, FaCheck, FaTimes, FaHistory, FaBitcoin } from 'react-icons/fa';
import HistoricoTransacoes from '../components/HistoricoTransacoes';
import colors from '../styles/colors';

function VendedorPage() {
  const [activeTab, setActiveTab] = useState('cadastrar');
  const [formData, setFormData] = useState({
    beneficiario: '',
    cpfCnpj: '',
    codigoBarras: '',
    valor: '',
    dataVencimento: '',
    instituicao: ''
  });
  
  // Dados simulados de boletos cadastrados
  const [boletos, setBoletos] = useState([
    {
      id: 1,
      numeroBoleto: '12345678',
      codigoBarras: '03399.63290 64000.000006 00125.201020 4 89150000017832',
      beneficiario: 'Empresa ABC Ltda',
      cpfCnpj: '12.345.678/0001-99',
      dataVencimento: '2025-07-15',
      valor: 178.32,
      instituicao: 'Banco do Brasil',
      status: 'Pendente'
    },
    {
      id: 2,
      numeroBoleto: '87654321',
      codigoBarras: '23791.22928 60005.762908 52000.063305 9 89840000010000',
      beneficiario: 'Fornecedor XYZ S/A',
      cpfCnpj: '98.765.432/0001-10',
      dataVencimento: '2025-06-30',
      valor: 100.00,
      instituicao: 'Bradesco',
      status: 'Pago'
    }
  ]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validação dos dados
    let errors = {};
    let hasErrors = false;
    
    // Validar CPF/CNPJ
    if (formData.cpfCnpj.length < 11) {
      errors.cpfCnpj = 'CPF/CNPJ inválido';
      hasErrors = true;
    }
    
    // Validar código de barras
    if (formData.codigoBarras.length < 30) {
      errors.codigoBarras = 'Código de barras inválido ou incompleto';
      hasErrors = true;
    }
    
    // Validar valor
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      errors.valor = 'Valor deve ser maior que zero';
      hasErrors = true;
    }
    
    // Validar data de vencimento
    if (!formData.dataVencimento) {
      errors.dataVencimento = 'Data de vencimento é obrigatória';
      hasErrors = true;
    } else {
      const hoje = new Date();
      const vencimento = new Date(formData.dataVencimento);
      if (vencimento < hoje) {
        errors.dataVencimento = 'A data de vencimento não pode ser no passado';
        hasErrors = true;
      }
    }
    
    // Se houver erros, mostrar mensagens e não prosseguir
    if (hasErrors) {
      alert('Por favor, corrija os seguintes erros:\n' + 
        Object.entries(errors).map(([campo, erro]) => `${erro}`).join('\n'));
      return;
    }
    
    // Adicionar novo boleto à lista
    const novoBoleto = {
      id: boletos.length + 1,
      numeroBoleto: Math.floor(10000000 + Math.random() * 90000000).toString(),
      codigoBarras: formData.codigoBarras,
      beneficiario: 'Não informado', // Campo removido do formulário
      cpfCnpj: formData.cpfCnpj,
      dataVencimento: formData.dataVencimento,
      valor: parseFloat(formData.valor),
      instituicao: formData.instituicao,
      status: 'Pendente'
    };
    
    setBoletos([...boletos, novoBoleto]);
    
    // Chamar o Wallet Connector
    conectarCarteira(novoBoleto);
  };
  
  // Função para conectar carteira
  const conectarCarteira = (boleto) => {
    // Aqui seria chamada a ferramenta Wallet Connector já desenvolvida
    alert(`Boleto cadastrado com sucesso! Conectando à carteira para pagamento do boleto no valor de R$ ${boleto.valor.toFixed(2)}`);
    
    // Após conexão bem-sucedida, limpar formulário e ir para listagem
    setFormData({
      beneficiario: '',
      cpfCnpj: '',
      codigoBarras: '',
      valor: '',
      dataVencimento: '',
      instituicao: ''
    });
    
    // Mudar para a aba de listagem
    setActiveTab('listar');
  };
  
  const handleDelete = (id) => {
    setBoletos(boletos.filter(boleto => boleto.id !== id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-greenDark">Pagar Boleto com USDT</h1>
      <p className="text-grayMedium text-lg">Cadastre seu boleto em reais para ser pago com seu saldo em USDT, SEM TAXAS.</p>
      
      {/* Botões de navegação */}
      <div className="flex flex-wrap gap-4 mb-4">
        <button
          className={`py-3 px-6 rounded-lg font-medium text-sm flex items-center ${
            activeTab === 'cadastrar'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('cadastrar')}
        >
          <FaPlus className="mr-2" /> Cadastrar Boleto
        </button>
        <button
          className={`py-3 px-6 rounded-lg font-medium text-sm flex items-center ${
            activeTab === 'listar'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('listar')}
        >
          <FaList className="mr-2" /> Meus Boletos
        </button>
        <button
          className={`py-3 px-6 rounded-lg font-medium text-sm flex items-center ${
            activeTab === 'historico'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('historico')}
        >
          <FaHistory className="mr-2" /> Histórico de Transações
        </button>
      </div>
      <div className="border-b border-gray-200 mb-6"></div>
      
      {/* Conteúdo da aba */}
      <div className="mt-6">
        {activeTab === 'historico' ? (
          <HistoricoTransacoes tipoUsuario="vendedor" />
        ) : activeTab === 'cadastrar' ? (
          <div className="card">
            <h2 className="text-xl font-semibold text-greenDark mb-4">Cadastrar Novo Boleto</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                
                {/* CPF/CNPJ do Beneficiário */}
                <div>
                  <label htmlFor="cpfCnpj" className="block text-sm font-medium text-gray-700 mb-1">
                    CPF/CNPJ do Beneficiário do Boleto
                  </label>
                  <input
                    id="cpfCnpj"
                    name="cpfCnpj"
                    type="text"
                    value={formData.cpfCnpj}
                    onChange={handleChange}
                    className="form-input w-64"
                    maxLength="18"
                    required
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
                    className="form-input w-full max-w-2xl"
                    maxLength="48"
                    required
                  />
                </div>
                
                {/* Valor */}
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
                    className="form-input w-48"
                    required
                  />
                </div>
                
                {/* Valor em USDT */}
                <div>
                  <label htmlFor="valorUsdt" className="block text-sm font-medium text-greenDark mb-1 font-semibold">
                    Valor em USDT (Online)
                  </label>
                  <div className="relative">
                    <input
                      id="valorUsdt"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor ? (parseFloat(formData.valor) / 5.0).toFixed(2) : ''}
                      className="form-input bg-greenLight border-greenPrimary w-48 pr-16"
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
                    className="form-input w-48"
                    required
                  />
                </div>
                
                {/* Instituição Emissora */}
                <div>
                  <label htmlFor="instituicao" className="block text-sm font-medium text-gray-700 mb-1">
                    Instituição Emissora
                  </label>
                  <input
                    id="instituicao"
                    name="instituicao"
                    type="text"
                    value={formData.instituicao}
                    onChange={handleChange}
                    className="form-input w-64"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-center mt-8">
                <button
                  type="submit"
                  className="flex items-center px-8 py-4 bg-primary text-white rounded-lg shadow-lg text-lg font-medium transition-all duration-200 hover:bg-primary/90 hover:shadow-xl"
                >
                  <FaWallet className="mr-3 text-xl" /> Cadastrar e Conectar Carteira
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
                    <th className="table-header-cell">Código de Barras</th>
                    <th className="table-header-cell">Beneficiário</th>
                    <th className="table-header-cell">Data Vencimento</th>
                    <th className="table-header-cell">Valor (R$)</th>
                    <th className="table-header-cell">Instituição</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Ações</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {boletos.map((boleto) => (
                    <tr key={boleto.id} className="table-row">
                      <td className="table-cell font-medium">{boleto.numeroBoleto}</td>
                      <td className="table-cell">
                        <span className="text-xs">{boleto.codigoBarras}</span>
                      </td>
                      <td className="table-cell">
                        <div>{boleto.beneficiario}</div>
                        <div className="text-xs text-gray-400">{boleto.cpfCnpj}</div>
                      </td>
                      <td className="table-cell">
                        {new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="table-cell">
                        {boleto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="table-cell">{boleto.instituicao}</td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          boleto.status === 'Pago' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {boleto.status === 'Pago' ? <FaCheck className="mr-1" /> : null}
                          {boleto.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleDelete(boleto.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {boletos.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                        Nenhum boleto cadastrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VendedorPage;
