import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config/apiConfig';

export default function ComprovantePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [boleto, setBoleto] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(buildApiUrl(`/boletos/${id}`));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setBoleto(data.data || data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const renderViewer = () => {
    const url = boleto?.comprovante_url || boleto?.comprovanteUrl;
    if (!url) return (
      <div className="w-full h-[70vh] flex items-center justify-center bg-gray-100 rounded-lg border border-green-200">
        <p className="text-gray-500">Comprovante não disponível</p>
      </div>
    );
    if (url.startsWith('data:image/')) {
      return (
        <div className="w-full h-[85vh] bg-white rounded-lg border border-green-200 flex items-center justify-center">
          <img src={url} alt="Comprovante" className="max-w-full max-h-full object-contain" />
        </div>
      );
    }
    // PDF ou URL http/https
    return (
      <iframe
        title="Comprovante"
        src={url.replace(/\n/g, '')}
        className="w-full h-[85vh] rounded-lg border border-green-200 bg-white"
      />
    );
  };

  return (
    <div className="min-h-screen bg-lime-300 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-4">
        <div className="w-full max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-green-800">Comprovante de Pagamento do Boleto {id}</h1>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(-1)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >Voltar</button>
            </div>
          </div>

          {loading && (
            <div className="w-full h-[70vh] flex items-center justify-center text-green-800">Carregando...</div>
          )}
          {error && (
            <div className="w-full h-[70vh] flex items-center justify-center text-red-700">Erro: {error}</div>
          )}
          {!loading && !error && renderViewer()}

          {!loading && boleto && (
            <div className="mt-4 grid grid-cols-2 gap-4 bg-green-50 p-4 rounded-lg border border-green-200">
              <div><span className="font-semibold text-green-800">Nº Boleto:</span> {boleto.numero_controle || boleto.numeroControle || boleto.id}</div>
              <div><span className="font-semibold text-green-800">Valor:</span> R$ {Number(boleto.valor_brl || boleto.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div><span className="font-semibold text-green-800">Status:</span> {boleto.status}</div>
              <div><span className="font-semibold text-green-800">Vencimento:</span> {boleto.vencimento ? new Date(boleto.vencimento).toLocaleDateString('pt-BR') : '--'}</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


