import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { useAuth } from '@/components/auth/AuthProvider';

function MeusBoletos() {
  const { user } = useAuth();
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastStatus, setLastStatus] = useState('');

  // Função para formatar data
  const formatarData = (data) => {
    if (!data) return '-';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch (e) {
      return '-';
    }
  };

  // Buscar boletos do usuário
  useEffect(() => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);
    
    const url = `http://localhost:3001/boletos/usuario/${user.uid}`;
    
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        const boletosCorrigidos = data.map(boleto => ({
          ...boleto,
          valor: boleto.valor_brl || boleto.valor || 0,
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

  // Função para formatar valor em reais
  const formatarMoeda = (valor) => {
    if (valor === undefined || valor === null) return "R$ 0,00";
    return `R$ ${(typeof valor === 'number' ? valor : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Renderização
  return (
    <div className="max-w-5xl mx-auto px-2">
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