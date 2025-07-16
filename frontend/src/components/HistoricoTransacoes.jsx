import { useState, useEffect } from 'react';
import { FaHistory, FaSearch, FaFileDownload, FaFilter, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';

function HistoricoTransacoes({ tipoUsuario = 'comprador', user }) {
  const [transacoes, setTransacoes] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('30dias');
  const [termoBusca, setTermoBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState({ campo: 'data', direcao: 'desc' });
  
  // Buscar boletos reais do usuário
  useEffect(() => {
    if (!user?.uid) return;
    fetch(`http://localhost:3001/boletos/usuario/${user.uid}`)
      .then(res => res.json())
      .then(data => setTransacoes(data))
      .catch(() => setTransacoes([]));
  }, [user]);
  
  // Filtrar transações com base nos critérios selecionados
  const transacoesFiltradas = transacoes
    .filter(tx => {
      // Filtro por status
      if (filtroStatus !== 'todos' && tx.status !== filtroStatus) {
        return false;
      }
      
      // Filtro por período
      const hoje = new Date();
      const dataTransacao = new Date(tx.vencimento);
      
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
          (tx.numero_controle || '').includes(termoBuscaLower) ||
          (tx.cpf_cnpj || '').toLowerCase().includes(termoBuscaLower) ||
          (tx.codigo_barras || '').toLowerCase().includes(termoBuscaLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      const { campo, direcao } = ordenacao;
      
      if (campo === 'data') {
        return direcao === 'asc' 
          ? new Date(a.vencimento) - new Date(b.vencimento)
          : new Date(b.vencimento) - new Date(a.vencimento);
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
      case 'Pago':
        status = 'BAIXADO';
        break;
      case 'Reservado':
        status = 'AGUARDANDO PAGAMENTO';
        break;
      case 'Disponível':
        status = 'DISPONIVEL';
        break;
      case 'cancelado':
        status = 'EXCLUIDO';
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
        
        <div className="relative flex items-center space-x-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por número de boleto, endereço ou tipo..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="form-input pl-10 py-2 text-sm max-w-xs w-full"
            style={{ minWidth: '180px' }}
          />
          <button
            type="button"
            onClick={() => setTermoBusca(termoBusca)}
            className="ml-2 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm"
          >Buscar</button>
        </div>
      </div>
      
      {/* Tabela de transações */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-green-800 text-white">
            <tr className="text-left">
              <th 
                className="p-4 cursor-pointer"
                onClick={() => alternarOrdenacao('data')}
              >
                <div className="flex items-center">
                  Data/Hora
                  {renderIconeOrdenacao('data')}
                </div>
              </th>
              <th className="p-4">Tipo de Operação</th>
              <th className="p-4">Nº Boleto</th>
              <th 
                className="p-4 cursor-pointer"
                onClick={() => alternarOrdenacao('valor')}
              >
                <div className="flex items-center">
                  Valor
                  {renderIconeOrdenacao('valor')}
                </div>
              </th>
              <th className="p-4">Taxas</th>
              <th className="p-4">Contraparte</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {transacoesFiltradas.length > 0 ? (
              transacoesFiltradas.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4">{formatarData(tx.vencimento)}</td>
                  <td className="p-4">{tx.tipoOperacao}</td>
                  <td className="p-4">{tx.numeroBoleto}</td>
                  <td className="p-4">R$ {tx.valor.toFixed(2)}</td>
                  <td className="p-4">R$ {tx.taxas}</td>
                  <td className="p-4">{formatarEndereco(tx.contraparte)}</td>
                  <td className="p-4">{renderBadgeStatus(tx.status)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-8 text-center">
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
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Resumo</h3>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-green-800 text-white">
              <tr>
                <th className="p-3 text-left border-b border-r">Descrição</th>
                <th className="p-3 text-left border-b">Valores</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3 font-medium border-r">Total de Transações</td>
                <td className="p-3">{transacoesFiltradas.length}</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium border-r">Valor Total</td>
                <td className="p-3">R$ {transacoesFiltradas.reduce((acc, tx) => acc + (tx.valor || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td className="p-3 font-medium border-r">Total de Taxas</td>
                <td className="p-3">R$ {transacoesFiltradas.reduce((acc, tx) => acc + parseFloat(tx.taxas || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default HistoricoTransacoes;
