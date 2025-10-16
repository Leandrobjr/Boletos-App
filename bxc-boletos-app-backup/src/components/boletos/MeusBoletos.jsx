import React, { useEffect, useState } from "react";
import { useAuth } from '../components/auth/AuthProvider';
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/alert";
import { useAccount, usePublicClient } from "wagmi";
import { releaseEscrow } from "../services/escrowService";

function MeusBoletos() {
  const { user } = useAuth();
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugUrl, setDebugUrl] = useState("");
  const [lastStatus, setLastStatus] = useState("");

  // Função robusta para formatar datas
  const formatarData = (data) => {
    if (!data) return "N/A";
    try {
      if (data instanceof Date && !isNaN(data.getTime())) {
      return data.toLocaleDateString('pt-BR');
      }
      if (typeof data === "string") {
        const d = new Date(data);
        if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
        const partes = data.split("-");
        if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
      return "Data inválida";
    } catch {
      return "Data inválida";
    }
  };

  // Busca automática e reativa
  useEffect(() => {
    if (!user?.uid) {
      setBoletos([]);
      setDebugUrl("");
      setLastStatus("Usuário não autenticado");
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    const url = `http://localhost:3001/boletos/usuario/${user.uid}`;
    setDebugUrl(url);
    setLastStatus("Buscando boletos...");
    fetch(url)
      .then(res => {
        setLastStatus(`Status HTTP: ${res.status}`);
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        const boletosCorrigidos = (data || []).map(boleto => ({
          ...boleto,
          cpfCnpj: boleto.cpf_cnpj,
          codigoBarras: boleto.codigo_barras,
          numeroControle: boleto.numero_controle,
          vencimento: boleto.vencimento,
        }));
        setBoletos(boletosCorrigidos);
        setLastStatus(`Boletos recebidos: ${boletosCorrigidos.length}`);
      })
      .catch(err => {
      setError("Erro ao carregar boletos. Tente novamente mais tarde.");
        setBoletos([]);
        setLastStatus(err.message);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (boletos && boletos.length > 0) {
      console.log('[DEBUG] Boleto bruto recebido:', boletos[0]);
    }
  }, [boletos]);

  // Interceptor global para fetch (apenas em dev)
  if (typeof window !== 'undefined' && window.fetch && !window._fetchIntercepted) {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      if (typeof args[0] === 'string' && args[0].includes('/boletos/')) {
        console.log('[FETCH DEBUG] Chamada para:', args[0]);
      }
      return originalFetch.apply(this, args);
    };
    window._fetchIntercepted = true;
  }

  // Painel de debug sempre visível
  const PainelDebug = () => (
    <div className="bg-black text-white p-3 mb-4 rounded shadow text-sm">
      <div><b>DEBUG UID autenticado:</b> {user?.uid || 'N/A'}</div>
      <div><b>Endpoint usado na busca:</b> <span className="text-green-400">{debugUrl || 'NÃO CHAMADO'}</span></div>
      <div><b>Status da requisição:</b> {loading ? 'CARREGANDO...' : error ? `ERRO: ${error}` : lastStatus || 'OK'}</div>
      <div><b>Exemplo de vencimento recebido:</b> {boletos[0]?.vencimento ? String(boletos[0].vencimento) : 'N/A'}</div>
      <div><b>Exemplo de boleto bruto:</b> {boletos[0] ? JSON.stringify(boletos[0]) : 'N/A'}</div>
    </div>
  );

  // Função para formatar valor em reais
  const formatarMoeda = (valor) => {
    if (valor === undefined || valor === null) return "R$ 0,00";
    return `R$ ${(typeof valor === 'number' ? valor : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Renderização
  return (
    <div className="max-w-5xl mx-auto px-2">
      <PainelDebug />
      <Card className="w-full shadow-lg rounded-lg overflow-hidden">
        <CardHeader>
          <h2 className="text-lg font-bold text-gray-800">MEUS BOLETOS</h2>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive">{error}</Alert>}
          {!user?.uid && <Alert variant="warning">Faça login para visualizar seus boletos.</Alert>}
          {loading && <div className="text-center py-4">Carregando boletos...</div>}
          {!loading && boletos.length === 0 && !error && user?.uid && (
            <div className="text-center text-gray-500 py-4">Nenhum boleto encontrado para este usuário.</div>
          )}
          {!loading && boletos.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Nº Boleto</th>
                    <th className="p-2">Código de Barras</th>
                    <th className="p-2">CPF/CNPJ</th>
                    <th className="p-2">Data Vencimento</th>
                    <th className="p-2">Valor (R$)</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {boletos.map((boleto, idx) => (
                    <tr key={boleto.id || idx} className="border-b hover:bg-gray-50">
                      <td className="p-2">{boleto.numeroControle || boleto.id || '-'}</td>
                      <td className="p-2">{boleto.codigoBarras || '-'}</td>
                      <td className="p-2">{boleto.cpfCnpj || '-'}</td>
                      <td className="p-2">{formatarData(boleto.vencimento)}</td>
                      <td className="p-2">{formatarMoeda(boleto.valor)}</td>
                      <td className="p-2">{boleto.status || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
    </Card>
    </div>
  );
}

export default MeusBoletos;