import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { buildApiUrl } from '../../config/apiConfig';

const MeusBoletos = () => {
  const { user } = useAuth();
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const url = buildApiUrl(`/boletos/usuario/${user.uid}`);
      fetch(url)
        .then(res => res.json())
        .then(data => {
          setBoletos(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Erro ao carregar boletos:', error);
          setLoading(false);
        });
    }
  }, [user]);

  if (loading) {
    return <div className="text-center p-4">Carregando seus boletos...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Meus Boletos</h2>
      {boletos.length === 0 ? (
        <p className="text-gray-500">Você ainda não tem boletos cadastrados.</p>
      ) : (
        <div className="space-y-4">
          {boletos.map((boleto) => (
            <div key={boleto.id} className="border p-4 rounded-lg">
              <h3 className="font-semibold">{boleto.numero_controle}</h3>
              <p className="text-sm text-gray-600">
                Valor: R$ {boleto.valor_brl}
              </p>
              <p className="text-sm text-gray-600">
                Status: {boleto.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MeusBoletos;