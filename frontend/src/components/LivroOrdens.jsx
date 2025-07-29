import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/apiConfig';

const LivroOrdens = () => {
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(buildApiUrl('/boletos'))
      .then(res => res.json())
      .then(data => {
        setBoletos(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Erro ao carregar boletos:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center p-4">Carregando boletos...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Livro de Ordens</h2>
      {boletos.length === 0 ? (
        <p className="text-gray-500">Nenhum boleto disponível.</p>
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

export default LivroOrdens;
