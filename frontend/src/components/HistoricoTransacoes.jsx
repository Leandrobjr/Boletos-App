import React, { useState, useEffect } from 'react';
import { useAuth } from './auth/AuthProvider';
import { buildApiUrl } from '../config/apiConfig';

const HistoricoTransacoes = () => {
  const { user } = useAuth();
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch(buildApiUrl(`/boletos/usuario/${user.uid}`))
        .then(res => res.json())
        .then(data => {
          setTransacoes(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Erro ao carregar transações:', error);
          setLoading(false);
        });
    }
  }, [user]);

  if (loading) {
    return <div className="text-center p-4">Carregando transações...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Histórico de Transações</h2>
      {transacoes.length === 0 ? (
        <p className="text-gray-500">Nenhuma transação encontrada.</p>
      ) : (
        <div className="space-y-4">
          {transacoes.map((transacao) => (
            <div key={transacao.id} className="border p-4 rounded-lg">
              <h3 className="font-semibold">{transacao.numero_controle}</h3>
              <p className="text-sm text-gray-600">
                Valor: R$ {transacao.valor_brl}
              </p>
              <p className="text-sm text-gray-600">
                Status: {transacao.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoricoTransacoes;
