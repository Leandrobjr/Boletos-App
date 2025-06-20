import { useState } from 'react';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

function LivroOrdens() {
  // Estado para armazenar as ordens
  const [ordens, setOrdens] = useState([
    {
      id: 1,
      numeroBoleto: '12345678',
      valor: 178.32,
      dataVencimento: '2025-07-15',
      codigoBarras: '03399.63290 64000.000006 00125.201020 4 89150000017832',
      status: 'Disponível'
    },
    {
      id: 2,
      numeroBoleto: '87654321',
      valor: 100.00,
      dataVencimento: '2025-06-30',
      codigoBarras: '23791.22928 60005.762908 52000.063305 9 89840000010000',
      status: 'Disponível'
    },
    {
      id: 3,
      numeroBoleto: '45678912',
      valor: 268.50,
      dataVencimento: '2025-08-05',
      codigoBarras: '34191.79001 01043.510047 91020.150008 7 89130000268500',
      status: 'Em Processamento'
    },
    {
      id: 4,
      numeroBoleto: '98765432',
      valor: 150.00,
      dataVencimento: '2025-07-05',
      codigoBarras: '23793.38128 60117.836209 52000.063305 9 89840000015000',
      status: 'Disponível'
    },
    {
      id: 5,
      numeroBoleto: '56789123',
      valor: 350.00,
      dataVencimento: '2025-07-20',
      codigoBarras: '34191.79001 01043.510047 91020.150008 7 89130000035000',
      status: 'Reservado'
    }
  ]);

  // Estado para controle de ordenação
  const [ordenacao, setOrdenacao] = useState({
    campo: 'dataVencimento',
    direcao: 'asc'
  });

  // Função para ordenar a lista
  const ordenarPor = (campo) => {
    const novaDirecao = 
      ordenacao.campo === campo && ordenacao.direcao === 'asc' 
        ? 'desc' 
        : 'asc';
    
    setOrdenacao({
      campo,
      direcao: novaDirecao
    });
    
    // Ordenar a lista
    const ordensOrdenadas = [...ordens].sort((a, b) => {
      if (campo === 'valor') {
        return novaDirecao === 'asc' ? a[campo] - b[campo] : b[campo] - a[campo];
      } else {
        const valorA = String(a[campo]).toLowerCase();
        const valorB = String(b[campo]).toLowerCase();
        
        if (novaDirecao === 'asc') {
          return valorA.localeCompare(valorB);
        } else {
          return valorB.localeCompare(valorA);
        }
      }
    });
    
    setOrdens(ordensOrdenadas);
  };
  
  // Função para exibir o ícone de ordenação
  const renderIconeOrdenacao = (campo) => {
    if (ordenacao.campo !== campo) {
      return <FaSort className="ml-1 text-gray-400" />;
    }
    
    return ordenacao.direcao === 'asc' 
      ? <FaSortUp className="ml-1 text-primary" />
      : <FaSortDown className="ml-1 text-primary" />;
  };
  
  // Função para selecionar uma ordem
  const selecionarOrdem = (id) => {
    // Aqui implementaríamos a lógica para selecionar uma ordem
    alert(`Ordem ${id} selecionada para pagamento`);
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Livro de Ordens</h2>
      <p className="text-gray-600 mb-4">
        Selecione um boleto disponível para pagamento rápido
      </p>
      
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th 
                className="table-header-cell cursor-pointer"
                onClick={() => ordenarPor('numeroBoleto')}
              >
                <div className="flex items-center">
                  Nº BOLETO
                  {renderIconeOrdenacao('numeroBoleto')}
                </div>
              </th>
              <th 
                className="table-header-cell cursor-pointer"
                onClick={() => ordenarPor('valor')}
              >
                <div className="flex items-center">
                  VALOR (R$)
                  {renderIconeOrdenacao('valor')}
                </div>
              </th>
              <th 
                className="table-header-cell cursor-pointer"
                onClick={() => ordenarPor('dataVencimento')}
              >
                <div className="flex items-center">
                  DATA VENCIMENTO
                  {renderIconeOrdenacao('dataVencimento')}
                </div>
              </th>
              <th className="table-header-cell">COD. BARRAS</th>
              <th 
                className="table-header-cell cursor-pointer"
                onClick={() => ordenarPor('status')}
              >
                <div className="flex items-center">
                  STATUS
                  {renderIconeOrdenacao('status')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="table-body">
            {ordens.map((ordem) => (
              <tr 
                key={ordem.id} 
                className={`table-row ${ordem.status === 'Disponível' ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                onClick={() => ordem.status === 'Disponível' && selecionarOrdem(ordem.id)}
              >
                <td className="table-cell font-medium">{ordem.numeroBoleto}</td>
                <td className="table-cell">
                  {ordem.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="table-cell">
                  {new Date(ordem.dataVencimento).toLocaleDateString('pt-BR')}
                </td>
                <td className="table-cell">
                  <span className="text-xs">{ordem.codigoBarras.substring(0, 15)}...</span>
                </td>
                <td className="table-cell">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    ordem.status === 'Disponível' 
                      ? 'bg-green-100 text-green-800' 
                      : ordem.status === 'Reservado'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {ordem.status}
                  </span>
                </td>
              </tr>
            ))}
            
            {ordens.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Nenhuma ordem disponível no momento
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>* Clique em um boleto com status "Disponível" para selecioná-lo para pagamento</p>
        <p>* Os boletos são atualizados em tempo real</p>
      </div>
    </div>
  );
}

export default LivroOrdens;
