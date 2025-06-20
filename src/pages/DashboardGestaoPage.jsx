import { useState } from 'react';
import { FaSearch, FaFileInvoiceDollar, FaFilter, FaDownload, FaImage, FaChartBar, FaExchangeAlt, FaUsers, FaUserCheck, FaIdCard } from 'react-icons/fa';

function DashboardGestaoPage() {
  // Estado para controle de abas
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Estados para filtros
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  
  // Estado para consulta de cadastros
  const [pesquisaCadastro, setPesquisaCadastro] = useState('');
  const [tipoPesquisa, setTipoPesquisa] = useState('nome');
  
  // Dados simulados de usuários cadastrados
  const [usuarios, setUsuarios] = useState([
    {
      id: 1,
      nome: 'João Silva',
      email: 'joao.silva@email.com',
      cpfCnpj: '123.456.789-00',
      telefone: '(11) 98765-4321',
      endereco: 'Rua das Flores, 123 - São Paulo/SP',
      tipoUsuario: 'comprador',
      dataCadastro: '2025-01-15',
      ultimoAcesso: '2025-06-18',
      carteira: '0x1a2b3c4d5e6f7g8h9i0j',
      status: 'Ativo'
    },
    {
      id: 2,
      nome: 'Maria Oliveira',
      email: 'maria.oliveira@empresa.com.br',
      cpfCnpj: '98.765.432/0001-10',
      telefone: '(21) 99876-5432',
      endereco: 'Av. Principal, 500 - Rio de Janeiro/RJ',
      tipoUsuario: 'vendedor',
      dataCadastro: '2025-02-20',
      ultimoAcesso: '2025-06-17',
      carteira: '0xabcdef1234567890abcdef',
      status: 'Ativo'
    },
    {
      id: 3,
      nome: 'Carlos Pereira',
      email: 'carlos.pereira@email.com',
      cpfCnpj: '987.654.321-00',
      telefone: '(31) 97654-3210',
      endereco: 'Rua dos Ipês, 45 - Belo Horizonte/MG',
      tipoUsuario: 'comprador',
      dataCadastro: '2025-03-10',
      ultimoAcesso: '2025-06-15',
      carteira: '0x9876543210abcdef123456',
      status: 'Inativo'
    },
    {
      id: 4,
      nome: 'Empresa ABC Ltda',
      email: 'contato@empresaabc.com.br',
      cpfCnpj: '12.345.678/0001-99',
      telefone: '(11) 3456-7890',
      endereco: 'Av. Comercial, 1000 - São Paulo/SP',
      tipoUsuario: 'vendedor',
      dataCadastro: '2025-01-05',
      ultimoAcesso: '2025-06-19',
      carteira: '0x123456789abcdef123456789',
      status: 'Ativo'
    },
    {
      id: 5,
      nome: 'Ana Santos',
      email: 'ana.santos@email.com',
      cpfCnpj: '456.789.123-00',
      telefone: '(41) 98765-1234',
      endereco: 'Rua das Araucárias, 78 - Curitiba/PR',
      tipoUsuario: 'comprador',
      dataCadastro: '2025-04-25',
      ultimoAcesso: '2025-06-10',
      carteira: '0xfedcba9876543210fedcba',
      status: 'Ativo'
    }
  ]);
  
  // Dados simulados de boletos para o dashboard de gestão
  const [boletos, setBoletos] = useState([
    {
      id: 1,
      numeroBoleto: '12345678',
      codigoBarras: '03399.63290 64000.000006 00125.201020 4 89150000017832',
      beneficiario: 'Empresa ABC Ltda',
      cpfCnpj: '12.345.678/0001-99',
      dataVencimento: '2025-07-15',
      dataPagamento: '2025-06-10',
      valorPago: 178.32,
      valorTravado: 35.66,
      taxaServico: 1.78,
      valorLiquidoRepasse: 176.54,
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
      dataPagamento: '2025-06-18',
      valorPago: 100.00,
      valorTravado: 20.00,
      taxaServico: 1.00,
      valorLiquidoRepasse: 99.00,
      status: 'Pago',
      comprovante: 'https://via.placeholder.com/300x400?text=Comprovante'
    },
    {
      id: 3,
      numeroBoleto: '45678912',
      codigoBarras: '34191.79001 01043.510047 91020.150008 7 89130000268500',
      beneficiario: 'Serviços Gerais Ltda',
      cpfCnpj: '45.678.912/0001-34',
      dataVencimento: '2025-08-05',
      dataPagamento: null,
      valorPago: 0,
      valorTravado: 53.70,
      taxaServico: 2.68,
      valorLiquidoRepasse: 0,
      status: 'Travado',
      comprovante: null
    },
    {
      id: 4,
      numeroBoleto: '98765432',
      codigoBarras: '23793.38128 60117.836209 52000.063305 9 89840000015000',
      beneficiario: 'Distribuidora ABC',
      cpfCnpj: '12.345.678/0001-99',
      dataVencimento: '2025-07-05',
      dataPagamento: '2025-06-15',
      valorPago: 150.00,
      valorTravado: 30.00,
      taxaServico: 1.50,
      valorLiquidoRepasse: 148.50,
      status: 'Pago',
      comprovante: 'https://via.placeholder.com/300x400?text=Comprovante'
    },
    {
      id: 5,
      numeroBoleto: '56789123',
      codigoBarras: '34191.79001 01043.510047 91020.150008 7 89130000035000',
      beneficiario: 'Consultoria Técnica Ltda',
      cpfCnpj: '98.765.432/0001-10',
      dataVencimento: '2025-07-20',
      dataPagamento: null,
      valorPago: 0,
      valorTravado: 70.00,
      taxaServico: 3.50,
      valorLiquidoRepasse: 0,
      status: 'Travado',
      comprovante: null
    }
  ]);
  
  // Estatísticas calculadas
  const totalBoletos = boletos.length;
  const totalPagos = boletos.filter(b => b.status === 'Pago').length;
  const totalTravados = boletos.filter(b => b.status === 'Travado').length;
  const valorTotal = boletos.reduce((acc, b) => acc + (b.valorPago || 0), 0);
  const valorTaxas = boletos.reduce((acc, b) => acc + (b.taxaServico || 0), 0);
  
  // Filtrar boletos com base nos filtros e pesquisa
  const boletosFiltrados = boletos.filter(boleto => {
    // Filtro por status
    if (filtroStatus && boleto.status !== filtroStatus) return false;
    
    // Filtro por pesquisa (número do boleto, beneficiário ou código de barras)
    if (pesquisa && 
        !boleto.numeroBoleto.includes(pesquisa) && 
        !boleto.beneficiario.toLowerCase().includes(pesquisa.toLowerCase()) &&
        !boleto.codigoBarras.includes(pesquisa)) {
      return false;
    }
    
    // Filtro por período (simplificado)
    if (filtroPeriodo === 'hoje') {
      const hoje = new Date().toISOString().split('T')[0];
      if (boleto.dataPagamento !== hoje) return false;
    } else if (filtroPeriodo === 'semana') {
      // Lógica simplificada para esta demonstração
      const umaSemanaAtras = new Date();
      umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
      if (!boleto.dataPagamento || new Date(boleto.dataPagamento) < umaSemanaAtras) return false;
    } else if (filtroPeriodo === 'mes') {
      // Lógica simplificada para esta demonstração
      const umMesAtras = new Date();
      umMesAtras.setMonth(umMesAtras.getMonth() - 1);
      if (!boleto.dataPagamento || new Date(boleto.dataPagamento) < umMesAtras) return false;
    }
    
    return true;
  });
  
  // Filtrar usuários com base na pesquisa
  const usuariosFiltrados = usuarios.filter(usuario => {
    if (!pesquisaCadastro) return true;
    
    const termoPesquisa = pesquisaCadastro.toLowerCase();
    
    switch (tipoPesquisa) {
      case 'nome':
        return usuario.nome.toLowerCase().includes(termoPesquisa);
      case 'email':
        return usuario.email.toLowerCase().includes(termoPesquisa);
      case 'cpfCnpj':
        return usuario.cpfCnpj.includes(pesquisaCadastro);
      case 'carteira':
        return usuario.carteira.toLowerCase().includes(termoPesquisa);
      default:
        return true;
    }
  });
  
  // Função para visualizar comprovante
  const handleVerComprovante = (comprovante) => {
    if (comprovante) {
      window.open(comprovante, '_blank');
    }
  };
  
  // Função para exportar dados (simulada)
  const handleExportarDados = () => {
    alert('Função de exportação de dados seria implementada aqui.');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-greenDark bitcoin-font">Dashboard de Gestão</h1>
      
      {/* Sistema de abas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard' 
              ? 'border-greenPrimary text-greenDark' 
              : 'border-transparent text-grayMedium hover:text-grayDark hover:border-grayLight'}`}
          >
            <FaChartBar className="inline-block mr-2" /> Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab('cadastros')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'cadastros' 
              ? 'border-greenPrimary text-greenDark' 
              : 'border-transparent text-grayMedium hover:text-grayDark hover:border-grayLight'}`}
          >
            <FaUsers className="inline-block mr-2" /> Consulta de Cadastros
          </button>
        </nav>
      </div>
      
      {/* Conteúdo da aba Dashboard */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-l-4 border-primary">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary text-white mr-4">
              <FaFileInvoiceDollar className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Boletos</p>
              <p className="text-xl font-bold">{totalBoletos}</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-green-50 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 text-white mr-4">
              <FaChartBar className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Boletos Pagos</p>
              <p className="text-xl font-bold">{totalPagos}</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-yellow-50 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-500 text-white mr-4">
              <FaExchangeAlt className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Boletos Travados</p>
              <p className="text-xl font-bold">{totalTravados}</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-purple-50 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500 text-white mr-4">
              <FaFileInvoiceDollar className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Valor Total</p>
              <p className="text-xl font-bold">
                {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-gray-500">
                Taxas: {valorTaxas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filtros e pesquisa */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar boleto..."
                className="form-input pl-10"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-400" />
              <select
                className="form-input"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="Pago">Pagos</option>
                <option value="Travado">Travados</option>
              </select>
            </div>
            
            <div>
              <select
                className="form-input"
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value)}
              >
                <option value="">Todos os períodos</option>
                <option value="hoje">Hoje</option>
                <option value="semana">Última semana</option>
                <option value="mes">Último mês</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleExportarDados}
            className="flex items-center justify-center px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90"
          >
            <FaDownload className="mr-2" /> Exportar Dados
          </button>
        </div>
      </div>
      
      {/* Tabela de boletos */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Gestão de Boletos</h2>
        
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Nº Boleto</th>
                <th className="table-header-cell">Código de Barras</th>
                <th className="table-header-cell">Beneficiário</th>
                <th className="table-header-cell">Data Venc.</th>
                <th className="table-header-cell">Data Pagto</th>
                <th className="table-header-cell">Valor Pago (R$)</th>
                <th className="table-header-cell">Comprovante</th>
                <th className="table-header-cell">Valor Travado (USDT)</th>
                <th className="table-header-cell">Taxa de Serviço</th>
                <th className="table-header-cell">Valor Líq. Repasse</th>
                <th className="table-header-cell">Status</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {boletosFiltrados.map((boleto) => (
                <tr key={boleto.id} className="table-row">
                  <td className="table-cell font-medium">{boleto.numeroBoleto}</td>
                  <td className="table-cell">
                    <span className="text-xs">{boleto.codigoBarras.substring(0, 15)}...</span>
                  </td>
                  <td className="table-cell">
                    <div>{boleto.beneficiario}</div>
                    <div className="text-xs text-gray-400">{boleto.cpfCnpj}</div>
                  </td>
                  <td className="table-cell">
                    {new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="table-cell">
                    {boleto.dataPagamento ? new Date(boleto.dataPagamento).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="table-cell">
                    {boleto.valorPago ? boleto.valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                  </td>
                  <td className="table-cell">
                    {boleto.comprovante ? (
                      <button
                        onClick={() => handleVerComprovante(boleto.comprovante)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver Comprovante"
                      >
                        <FaImage />
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="table-cell">
                    {boleto.valorTravado ? boleto.valorTravado.toFixed(2) : '-'}
                  </td>
                  <td className="table-cell">
                    {boleto.taxaServico ? boleto.taxaServico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                  </td>
                  <td className="table-cell">
                    {boleto.valorLiquidoRepasse ? boleto.valorLiquidoRepasse.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      boleto.status === 'Pago' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {boleto.status}
                    </span>
                  </td>
                </tr>
              ))}
              
              {boletosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="11" className="px-6 py-4 text-center text-gray-500">
                    Nenhum boleto encontrado com os filtros aplicados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          </div>
        </div>
      )}
      
      {/* Conteúdo da aba Consulta de Cadastros */}
      {activeTab === 'cadastros' && (
        <div>
          {/* Filtros e pesquisa */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-greenDark mb-4">Consulta de Usuários Cadastrados</h2>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={pesquisaCadastro}
                    onChange={(e) => setPesquisaCadastro(e.target.value)}
                    className="form-input pl-10 w-full"
                    placeholder="Buscar usuários..."
                  />
                </div>
              </div>
              
              <div className="w-full md:w-auto">
                <select
                  value={tipoPesquisa}
                  onChange={(e) => setTipoPesquisa(e.target.value)}
                  className="form-select w-full"
                >
                  <option value="nome">Nome</option>
                  <option value="email">Email</option>
                  <option value="cpfCnpj">CPF/CNPJ</option>
                  <option value="carteira">Endereço da Carteira</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome/Empresa</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF/CNPJ</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acesso</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuariosFiltrados.length > 0 ? (
                    usuariosFiltrados.map(usuario => (
                      <tr key={usuario.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <FaUserCheck className="text-gray-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{usuario.nome}</div>
                              <div className="text-sm text-gray-500">{usuario.telefone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.cpfCnpj}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${usuario.tipoUsuario === 'comprador' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {usuario.tipoUsuario === 'comprador' ? 'Comprador' : 'Vendedor'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${usuario.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {usuario.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.ultimoAcesso}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-greenPrimary hover:text-greenDark mr-3">Detalhes</button>
                          <button className="text-yellow-500 hover:text-yellow-700 mr-3">Editar</button>
                          {usuario.status === 'Ativo' ? (
                            <button className="text-red-500 hover:text-red-700">Desativar</button>
                          ) : (
                            <button className="text-green-500 hover:text-green-700">Ativar</button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        Nenhum usuário encontrado com os critérios de busca.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Mostrando {usuariosFiltrados.length} de {usuarios.length} usuários
              </div>
              
              <div>
                <button 
                  onClick={handleExportarDados}
                  className="btn-secondary flex items-center"
                >
                  <FaDownload className="mr-2" /> Exportar Dados
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardGestaoPage;
