import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// Usa o worker local empacotado pelo Vite (evita CDN e incompatibilidades de versão)
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();
import { useParams, useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config/apiConfig';

export default function ComprovantePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [boleto, setBoleto] = useState(null);
  const [zoom, setZoom] = useState(2.0);
  const [pdfZoom, setPdfZoom] = useState(180);
  const scrollRef = useRef(null);
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const rawUrl = boleto?.comprovante_url || boleto?.comprovanteUrl;
  const [isPdfMode, setIsPdfMode] = useState(false);
  const isPdf = useMemo(() => {
    if (!rawUrl && !resolvedUrl) return false;
    const src = rawUrl || resolvedUrl || '';
    return src.startsWith('data:application/pdf') || /\.pdf($|[?#])/i.test(src) || (src.startsWith('blob:') && true);
  }, [rawUrl, resolvedUrl]);

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

  // Resolve URL do comprovante (converte data:application/pdf para blob: para permitir zoom via #params)
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
      setIsPdfMode(false);
      return;
    }

    // data:application/pdf → converter para blob: e aplicar view params
    if (ru.startsWith('data:application/pdf')) {
      const blobUrl = toBlobUrl(ru, 'application/pdf');
      if (blobUrl) setResolvedUrl(`${blobUrl}#page=1&view=FitH&zoom=${pdfZoom}`);
      else setResolvedUrl(ru);
      setIsPdfMode(true);
      return () => { try { URL.revokeObjectURL(blobUrl); } catch { /* noop */ } };
    }

    // http(s) → anexar parâmetros se for PDF
    if (/\.pdf($|[?#])/i.test(ru)) {
      const base = ru.split('#')[0];
      setResolvedUrl(`${base}#page=1&view=FitH&zoom=${pdfZoom}`);
      setIsPdfMode(true);
    } else {
      setResolvedUrl(ru);
      setIsPdfMode(false);
    }
  }, [boleto, pdfZoom]);

  // Ajuste automático de zoom inicial para mobile/desktop
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    if (isMobile) {
      setZoom(1.2);
      setPdfZoom(220);
    } else {
      setZoom(2.0);
      setPdfZoom(180);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const renderViewer = () => {
    const url = resolvedUrl || rawUrl;
    if (!url) return (
      <div className="w-full flex flex-col items-center gap-4">
        <div className="w-full h-[85vh] flex items-center justify-center bg-gray-100 rounded-lg border border-green-200">
          <p className="text-gray-500">Comprovante não disponível</p>
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
          <button onClick={() => navigate(-1)} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg">Voltar</button>
        </div>
      </div>
    );
    if (url.startsWith('data:image/')) {
      return (
        <div className="w-full h-[85vh] bg-white rounded-lg border border-green-200 overflow-auto" ref={scrollRef}>
          <div className="min-w-full min-h-full p-2">
            <img
              src={url}
              alt="Comprovante"
              className="block select-none"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', maxWidth: 'none', maxHeight: 'none' }}
              draggable={false}
            />
          </div>
        </div>
      );
    }
    // Renderização profissional via PDF.js (react-pdf)
    const src = url.replace(/\n/g, '');
    const scale = pdfZoom / 100;
    return (
      <div className="w-full h-[85vh] rounded-lg border border-green-200 bg-white overflow-auto">
        <Document file={src} onLoadSuccess={({ numPages }) => setNumPages(numPages)} loading={<div className="p-6">Carregando PDF...</div>}>
          {Array.from(new Array(numPages || 1), (el, index) => (
            <Page key={`page_${index + 1}`} pageNumber={index + 1} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} className="mx-auto my-2" />
          ))}
        </Document>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-lime-300 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-4">
        <div className="w-full max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-green-800">Comprovante de Pagamento</h1>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(-1)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >Voltar</button>
              {(resolvedUrl || rawUrl) && (
                <a
                  href={(resolvedUrl || rawUrl).replace(/\n/g, '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg"
                >Abrir em nova aba</a>
              )}
              {!isPdfMode && (resolvedUrl || rawUrl) && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.2).toFixed(2)))} className="px-3 py-2 rounded-lg bg-lime-600 text-white">-</button>
                  <span className="px-2 text-green-800 font-semibold w-16 text-center">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(4, +(z + 0.2).toFixed(2)))} className="px-3 py-2 rounded-lg bg-lime-600 text-white">+</button>
                  <button onClick={() => setZoom(1)} className="px-3 py-2 rounded-lg bg-gray-200 text-green-800">100%</button>
                  <button onClick={() => setZoom(1.6)} className="px-3 py-2 rounded-lg bg-gray-200 text-green-800">Ajustar</button>
                </div>
              )}
              {isPdfMode && (resolvedUrl || rawUrl) && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPdfZoom(z => Math.max(80, z - 20))} className="px-3 py-2 rounded-lg bg-lime-600 text-white">-</button>
                  <span className="px-2 text-green-800 font-semibold w-16 text-center">{pdfZoom}%</span>
                  <button onClick={() => setPdfZoom(z => Math.min(400, z + 20))} className="px-3 py-2 rounded-lg bg-lime-600 text-white">+</button>
                  <button onClick={() => setPdfZoom(100)} className="px-3 py-2 rounded-lg bg-gray-200 text-green-800">100%</button>
                  <button onClick={() => setPdfZoom(180)} className="px-3 py-2 rounded-lg bg-gray-200 text-green-800">Ajustar</button>
                </div>
              )}
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


