import React, { useState, useEffect } from 'react';
import { buildApiUrl, apiRequest } from '../config/apiConfig';

const LivroOrdens = () => {
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBoletos = async () => {
      try {
        console.log('🔄 Iniciando carregamento de boletos...');
        setLoading(true);
        setError(null);

        // Usar a função apiRequest que já tem retry e validação
        const data = await apiRequest('/boletos');
        
        console.log('📊 Dados recebidos:', data);
        
        // Validação dos dados
        if (!data || typeof data !== 'object') {
          throw new Error('Resposta inválida da API');
        }

        const boletosData = data.data || data.boletos || data;
        
        if (!Array.isArray(boletosData)) {
          console.warn('⚠️ Dados não são um array:', boletosData);
          setBoletos([]);
        } else {
          console.log(`✅ ${boletosData.length} boletos carregados com sucesso`);
          setBoletos(boletosData);
        }

      } catch (error) {
        console.error('❌ Erro ao carregar boletos:', error);
        setError(error.message || 'Erro desconhecido ao carregar boletos');
        setBoletos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBoletos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando boletos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar boletos</h2>
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Livro de Ordens</h2>
      
      {boletos.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500">Nenhum boleto disponível no momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {boletos.map((boleto) => (
            <div key={boleto.id || boleto.numero_controle} className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">
                  {boleto.numero_controle || boleto.id || 'N/A'}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  boleto.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                  boleto.status === 'reservado' ? 'bg-yellow-100 text-yellow-800' :
                  boleto.status === 'vendido' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {boleto.status || 'N/A'}
                </span>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                {boleto.valor_brl && (
                  <p>
                    <span className="font-medium">Valor:</span> R$ {Number(boleto.valor_brl).toFixed(2)}
                  </p>
                )}
                {boleto.vencimento && (
                  <p>
                    <span className="font-medium">Vencimento:</span> {new Date(boleto.vencimento).toLocaleDateString('pt-BR')}
                  </p>
                )}
                {boleto.banco && (
                  <p>
                    <span className="font-medium">Banco:</span> {boleto.banco}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LivroOrdens;
