import { useState, useEffect } from 'react';
import { FaHistory, FaSearch, FaFileDownload, FaFilter, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';

function HistoricoTransacoes({ tipoUsuario = 'comprador' }) {
  const [transacoes, setTransacoes] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('30dias');
  const [termoBusca, setTermoBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState({ campo: 'data', direcao: 'desc' });
  
  // Gerar dados simulados para o histórico de transações
  useEffect(() => {
    const gerarTransacoesSimuladas = () => {
      const statusPossiveis = ['pendente', 'pago', 'confirmado', 'cancelado', 'expirado'];
      const tiposOperacao = tipoUsuario === 'comprador' 
        ? ['Pagamento de Boleto', 'Bloqueio de Boleto', 'Envio de Comprovante'] 
        : ['Emissão de Boleto', 'Confirmação de Pagamento', 'Cancelamento'];
      
      const hoje = new Date();
      
      return Array(25).fill().map((_, index) => {
        const diasAtras = Math.floor(Math.random() * 90);
        const data = new Date(hoje);
        data.setDate(data.getDate() - diasAtras);
        
        const status = statusPossiveis[Math.floor(Math.random() * statusPossiveis.length)];
        const valor = (Math.random() * 10000 + 100).toFixed(2);
        const tipoOperacao = tiposOperacao[Math.floor(Math.random() * tiposOperacao.length)];
        
        return {
          id: `tx-${index + 1}`,
          data,
          valor: parseFloat(valor),
          status,
          tipoOperacao,
          contraparte: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
          numeroBoleto: `${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
          taxas: (parseFloat(valor) * 0.015).toFixed(2),
        };
      });
    };
    
    setTransacoes(gerarTransacoesSimuladas());
  }, [tipoUsuario]);
  
  // Filtrar transações com base nos critérios selecionados
  const transacoesFiltradas = transacoes
    .filter(tx => {
      // Filtro por status
      if (filtroStatus !== 'todos' && tx.status !== filtroStatus) {
        return false;
      }
      
      // Filtro por período
      const hoje = new Date();
      const dataTransacao = new Date(tx.data);
      
      if (filtroPeriodo === '7dias' && (hoje - dataTransacao) > 7 * 24 * 60 * 60 * 1000) {
        return false;
      } else if (filtroPeriodo === '30dias' && (hoje - dataTransacao) > 30 * 24 * 60 * 60 * 1000) {
        return false;
      } else if (filtroPeriodo === '90dias' && (hoje - dataTransacao) > 90 * 24 * 60 * 60 * 1000) {
        return false;
      }
      
      // Filtro por termo de busca
      if (termoBusca) {
        const termoBuscaLower = termoBusca.toLowerCase();
        return (
          tx.numeroBoleto.includes(termoBuscaLower) ||
          tx.contraparte.toLowerCase().includes(termoBuscaLower) ||
          tx.tipoOperacao.toLowerCase().includes(termoBuscaLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      const { campo, direcao } = ordenacao;
      
      if (campo === 'data') {
        return direcao === 'asc' 
          ? new Date(a.data) - new Date(b.data)
          : new Date(b.data) - new Date(a.data);
      } else if (campo === 'valor') {
        return direcao === 'asc' ? a.valor - b.valor : b.valor - a.valor;
      }
      
      return 0;
    });
  
  // Formatar data para exibição
  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Formatar endereço da carteira
  const formatarEndereco = (endereco) => {
    return `${endereco.substring(0, 6)}...${endereco.substring(endereco.length - 4)}`;
  };
  
  // Alternar ordenação
  const alternarOrdenacao = (campo) => {
    if (ordenacao.campo === campo) {
      setOrdenacao({
        campo,
        direcao: ordenacao.direcao === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setOrdenacao({
        campo,
        direcao: 'desc'
      });
    }
  };
  
  // Simular exportação do histórico
  const exportarHistorico = () => {
    alert('Exportação de histórico iniciada. O arquivo será baixado em alguns instantes.');
  };
  
  // Renderizar ícone de ordenação
  const renderIconeOrdenacao = (campo) => {
    if (ordenacao.campo !== campo) return null;
    
    return ordenacao.direcao === 'asc' 
      ? <FaSortAmountUp className="ml-1 text-xs" />
      : <FaSortAmountDown className="ml-1 text-xs" />;
  };
  
  // Renderizar badge de status
  const renderBadgeStatus = (status) => {
    let classes = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'pendente':
        classes += " bg-yellow-100 text-yellow-800";
        break;
      case 'pago':
        classes += " bg-blue-100 text-blue-800";
        break;
      case 'confirmado':
        classes += " bg-green-100 text-green-800";
        break;
      case 'cancelado':
        classes += " bg-red-100 text-red-800";
        break;
      case 'expirado':
        classes += " bg-gray-100 text-gray-800";
        break;
      default:
        classes += " bg-gray-100 text-gray-800";
    }
    
    return <span className={classes}>{status}</span>;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FaHistory className="text-primary text-xl mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">Histórico de Transações</h2>
        </div>
        <button
          onClick={exportarHistorico}
          className="flex items-center space-x-1 bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded-md transition-colors"
        >
          <FaFileDownload />
          <span>Exportar</span>
        </button>
      </div>
      
      {/* Filtros e busca */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <FaFilter className="text-gray-500" />
            <span className="text-sm text-gray-600">Status:</span>
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="form-input text-sm py-1"
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
            <option value="expirado">Expirado</option>
          </select>
          
          <div className="flex items-center space-x-1 ml-4">
            <span className="text-sm text-gray-600">Período:</span>
          </div>
          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="form-input text-sm py-1"
          >
            <option value="7dias">Últimos 7 dias</option>
            <option value="30dias">Últimos 30 dias</option>
            <option value="90dias">Últimos 90 dias</option>
            <option value="todos">Todo o período</option>
          </select>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por número de boleto, endereço ou tipo..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="form-input pl-10 py-2 text-sm w-full md:w-64"
          />
        </div>
      </div>
      
      {/* Tabela de transações */}
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th 
                className="table-header-cell cursor-pointer"
                onClick={() => alternarOrdenacao('data')}
              >
                <div className="flex items-center">
                  Data/Hora
                  {renderIconeOrdenacao('data')}
                </div>
              </th>
              <th className="table-header-cell">Tipo de Operação</th>
              <th className="table-header-cell">Nº Boleto</th>
              <th 
                className="table-header-cell cursor-pointer"
                onClick={() => alternarOrdenacao('valor')}
              >
                <div className="flex items-center">
                  Valor
                  {renderIconeOrdenacao('valor')}
                </div>
              </th>
              <th className="table-header-cell">Taxas</th>
              <th className="table-header-cell">Contraparte</th>
              <th className="table-header-cell">Status</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {transacoesFiltradas.length > 0 ? (
              transacoesFiltradas.map((tx) => (
                <tr key={tx.id} className="table-row">
                  <td className="table-cell">{formatarData(tx.data)}</td>
                  <td className="table-cell">{tx.tipoOperacao}</td>
                  <td className="table-cell">{tx.numeroBoleto}</td>
                  <td className="table-cell">R$ {tx.valor.toFixed(2)}</td>
                  <td className="table-cell">R$ {tx.taxas}</td>
                  <td className="table-cell">{formatarEndereco(tx.contraparte)}</td>
                  <td className="table-cell">{renderBadgeStatus(tx.status)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="table-cell text-center py-8">
                  <div className="text-gray-500">
                    <p>Nenhuma transação encontrada para os filtros selecionados.</p>
                    <p className="text-sm mt-1">Tente ajustar seus filtros ou período de busca.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Resumo de transações */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md">
          <div className="text-sm text-blue-600">Total de Transações</div>
          <div className="text-xl font-bold text-blue-900">{transacoesFiltradas.length}</div>
        </div>
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-md">
          <div className="text-sm text-green-600">Valor Total</div>
          <div className="text-xl font-bold text-green-900">
            R$ {transacoesFiltradas.reduce((acc, tx) => acc + tx.valor, 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-md">
          <div className="text-sm text-purple-600">Total de Taxas</div>
          <div className="text-xl font-bold text-purple-900">
            R$ {transacoesFiltradas.reduce((acc, tx) => acc + parseFloat(tx.taxas), 0).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoricoTransacoes;
