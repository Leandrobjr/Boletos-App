import React from 'react';
import { FaLock, FaUnlock, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const EscrowInfo = ({ boleto, onRefresh }) => {
  if (!boleto.escrow_id && !boleto.tx_hash) {
    return null;
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'AGUARDANDO PAGAMENTO':
        return <FaLock className="text-yellow-500" />;
      case 'PENDENTE_PAGAMENTO':
        return <FaClock className="text-blue-500" />;
      case 'BAIXADO':
        return <FaCheckCircle className="text-green-500" />;
      case 'DISPONIVEL':
        return <FaUnlock className="text-gray-500" />;
      default:
        return <FaTimesCircle className="text-red-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AGUARDANDO PAGAMENTO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PENDENTE_PAGAMENTO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'BAIXADO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DISPONIVEL':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        {getStatusIcon(boleto.status)}
        Informações do Escrow
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        {boleto.escrow_id && (
          <div>
            <span className="font-medium text-gray-600">ID do Escrow:</span>
            <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
              {boleto.escrow_id.substring(0, 16)}...
            </span>
          </div>
        )}
        
        {boleto.tx_hash && (
          <div>
            <span className="font-medium text-gray-600">Hash da Transação:</span>
            <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
              {boleto.tx_hash.substring(0, 16)}...
            </span>
          </div>
        )}
        
        {boleto.data_travamento && (
          <div>
            <span className="font-medium text-gray-600">Travado em:</span>
            <span className="ml-2">
              {new Date(boleto.data_travamento).toLocaleString('pt-BR')}
            </span>
          </div>
        )}
        
        {boleto.data_destravamento && (
          <div>
            <span className="font-medium text-gray-600">Destravado em:</span>
            <span className="ml-2">
              {new Date(boleto.data_destravamento).toLocaleString('pt-BR')}
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-600">Status:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(boleto.status)}`}>
            {boleto.status}
          </span>
        </div>
      </div>
      
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="mt-3 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Atualizar Status
        </button>
      )}
    </div>
  );
};

export default EscrowInfo;





