import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config/apiConfig';

export default function ComprovantePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [boleto, setBoleto] = useState(null);
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const rawUrl = boleto?.comprovante_url || boleto?.comprovanteUrl;
  const iframeRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        // Determinar rota correta: ID numérico INT32 vs numero_controle (string/long number)
        const numeric = Number(id);
        const isValidInt32 = Number.isInteger(numeric) && Math.abs(numeric) <= 2147483647;
        const primaryEndpoint = isValidInt32 ? `/boletos/${numeric}` : `/boletos/controle/${encodeURIComponent(id)}`;

        let res = await fetch(buildApiUrl(primaryEndpoint));
        // Fallback: se tentou ID e deu 400/404, tenta como numero_controle
        if (!res.ok && isValidInt32 && (res.status === 400 || res.status === 404)) {
          res = await fetch(buildApiUrl(`/boletos/controle/${encodeURIComponent(id)}`));
        }
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

  // Resolve URL do comprovante (converte data:application/pdf para blob: para permitir visualização estável)
  useEffect(() => {
    if (!boleto) return;
    const ru = boleto?.comprovante_url || boleto?.comprovanteUrl;
    if (!ru) { setResolvedUrl(null); return; }

    // Helper para converter data URL em blob URL
    const toBlobUrl = (dataUrl, mime) => {
      try {
        const base64 = dataUrl.split(',')[1] || '';
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: mime });
        return URL.createObjectURL(blob);
      } catch {
        return null;
      }
    };

    // data:image → usar direto
    if (ru.startsWith('data:image/')) {
      setResolvedUrl(ru);
      return;
    }

    // data:application/pdf → converter para blob:
    if (ru.startsWith('data:application/pdf')) {
      const blobUrl = toBlobUrl(ru, 'application/pdf');
      if (blobUrl) setResolvedUrl(`${blobUrl}#zoom=200&view=FitH`);
      else setResolvedUrl(ru);
      return () => { try { URL.revokeObjectURL(blobUrl); } catch { /* noop */ } };
    }

    // http(s) → anexar parâmetros se for PDF
    if (/\.pdf($|[?#])/i.test(ru)) {
      const base = ru.split('#')[0];
      setResolvedUrl(`${base}#zoom=200&view=FitH`);
    } else {
      setResolvedUrl(ru);
    }
  }, [boleto]);

  const handleBack = () => {
    const params = new URLSearchParams(window.location.search);
    const back = params.get('from');
    if (back) navigate(back);
    else navigate('/app/comprador/meusBoletos');
  };

  const handlePrint = () => {
    const src = (resolvedUrl || rawUrl || '').replace(/\n/g, '');
    try {
      // Tentar imprimir via iframe (PDF)
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        return;
      }
    } catch {}
    // Fallback: abrir em nova aba e acionar print
    if (src) {
      const w = window.open(src, '_blank', 'noopener,noreferrer');
      if (w) {
        const onLoad = () => { try { w.focus(); w.print(); } catch {} };
        try { w.addEventListener('load', onLoad); } catch { try { w.print(); } catch {} }
      }
    }
  };

  const renderContent = () => {
    const url = (resolvedUrl || rawUrl || '').replace(/\n/g, '');
    
    if (loading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-white text-xl">Carregando comprovante...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white">
            <div className="text-xl mb-4">Erro: {error}</div>
            <button onClick={handleBack} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded text-lg">
              Voltar
            </button>
          </div>
        </div>
      );
    }

    if (!url) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white">
            <div className="text-xl mb-4">Comprovante não disponível</div>
            <button onClick={handleBack} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded text-lg">
              Voltar
            </button>
          </div>
        </div>
      );
    }

    // Renderização para imagens
    if (url.startsWith('data:image/') || /\.(png|jpe?g|webp)($|[?#])/i.test(url)) {
      return (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <img 
            src={url} 
            alt="Comprovante" 
            className="max-w-full max-h-full object-contain"
            style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
            draggable={false} 
          />
        </div>
      );
    }

    // Renderização para PDFs - FULLSCREEN ABSOLUTO
    return (
      <iframe 
        ref={iframeRef} 
        src={url}
        className="absolute inset-0 w-full h-full"
        style={{
          width: '100vw',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 40
        }}
        title="Comprovante PDF"
      />
    );
  };

  return (
    <>
      {/* OVERLAY FULLSCREEN ABSOLUTO */}
      <div 
        className="fixed inset-0 bg-black z-50"
        style={{
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          margin: 0,
          padding: 0
        }}
      >
        {/* BOTÕES DE CONTROLE FLUTUANTES */}
        <div className="absolute top-4 right-4 z-50 flex gap-3">
          <button 
            onClick={handleBack} 
            className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg text-lg font-semibold"
            style={{ zIndex: 60 }}
          >
            ← Voltar
          </button>
          <button 
            onClick={handlePrint} 
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-lg shadow-lg text-lg font-semibold"
            style={{ zIndex: 60 }}
          >
            🖨️ Imprimir
          </button>
        </div>

        {/* INFORMAÇÕES DO BOLETO FLUTUANTES */}
        {boleto && !loading && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg z-50 max-w-md">
            <div className="text-sm space-y-1">
              <div><strong>Nº:</strong> {boleto.numero_controle || boleto.numeroControle || boleto.id}</div>
              <div><strong>Valor:</strong> R$ {Number(boleto.valor_brl || boleto.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div><strong>Status:</strong> {boleto.status}</div>
            </div>
          </div>
        )}

        {/* CONTEÚDO DO COMPROVANTE */}
        {renderContent()}
      </div>
    </>
  );
}