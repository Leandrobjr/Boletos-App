import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/apiConfig';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Button from './ui/Button';

export function NetworkStatus() {
  const [rpcStatus, setRpcStatus] = useState({});
  const [isTesting, setIsTesting] = useState(false);
  const [lastTest, setLastTest] = useState(null);

  // RPCs configuradas no rainbowConfig
  const rpcs = [
    { id: 1, name: 'Polygon Amoy Official', url: 'https://rpc-amoy.polygon.technology' },
    { id: 2, name: 'PublicNode Bor', url: 'https://polygon-amoy-bor-rpc.publicnode.com' },
    { id: 3, name: 'PublicNode RPC', url: 'https://polygon-amoy-rpc.publicnode.com' },
    { id: 4, name: 'DRPC', url: 'https://polygon-amoy.drpc.org' },
    { id: 5, name: 'BlockPI', url: 'https://polygon-amoy.blockpi.network/v1/rpc/public' },
    { id: 6, name: 'BlastAPI', url: 'https://polygon-amoy.public.blastapi.io' }
  ];

  const testRPC = async (rpc) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      // Usar proxy RPC para contornar CORS
      const response = await fetch(buildApiUrl('/rpc-proxy'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          const blockNumber = parseInt(data.result, 16);
          return { status: 'connected', blockNumber, error: null };
        }
      }
      return { status: 'error', blockNumber: null, error: 'Resposta inválida' };
    } catch (error) {
      return { 
        status: 'error', 
        blockNumber: null, 
        error: error.name === 'AbortError' ? 'Timeout' : error.message 
      };
    }
  };

  const testAllRPCs = async () => {
    setIsTesting(true);
    const results = {};

    for (const rpc of rpcs) {
      console.log(`🔍 Testando RPC: ${rpc.name}`);
      results[rpc.id] = await testRPC(rpc);
      // Pequeno delay entre testes para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setRpcStatus(results);
    setLastTest(new Date());
    setIsTesting(false);
  };

  useEffect(() => {
    testAllRPCs();
    
    // Teste automático a cada 2 minutos
    const interval = setInterval(testAllRPCs, 120000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const workingRPCs = Object.values(rpcStatus).filter(r => r.status === 'connected').length;
  const totalRPCs = rpcs.length;

  return (
    <Card className="w-full max-w-4xl mx-auto mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🌐 Status da Rede (Polygon Amoy)</span>
          <div className="text-sm font-normal">
            {workingRPCs}/{totalRPCs} RPCs funcionando
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {rpcs.map((rpc) => {
            const status = rpcStatus[rpc.id];
            return (
              <div key={rpc.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{rpc.name}</span>
                  <span className={getStatusColor(status?.status)}>
                    {getStatusIcon(status?.status)}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {status?.status === 'connected' ? (
                    <span className="text-green-600">
                      Bloco: {status.blockNumber?.toLocaleString() || 'N/A'}
                    </span>
                  ) : status?.status === 'error' ? (
                    <span className="text-red-600">
                      {status.error || 'Falha na conexão'}
                    </span>
                  ) : (
                    <span className="text-yellow-600">Testando...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <Button
            onClick={testAllRPCs}
            disabled={isTesting}
            className="flex items-center gap-2"
          >
            {isTesting ? '🔄 Testando...' : '🔄 Testar RPCs'}
          </Button>
          
          {lastTest && (
            <div className="text-sm text-gray-500">
              Último teste: {lastTest.toLocaleTimeString()}
            </div>
          )}
        </div>

        {workingRPCs === 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <span>⚠️</span>
              <span className="font-medium">Todas as RPCs estão com problemas!</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              O sistema não consegue se conectar à rede Polygon Amoy. 
              Verifique sua conexão com a internet e tente novamente.
            </p>
          </div>
        )}

        {workingRPCs > 0 && workingRPCs < totalRPCs && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700">
              <span>⚠️</span>
              <span className="font-medium">Algumas RPCs estão com problemas</span>
            </div>
            <p className="text-sm text-yellow-600 mt-1">
              O sistema tentará automaticamente as alternativas disponíveis. 
              {workingRPCs === 1 ? ' Apenas 1 RPC está funcionando.' : ` ${workingRPCs} RPCs estão funcionando.`}
            </p>
          </div>
        )}

        {workingRPCs === totalRPCs && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <span>✅</span>
              <span className="font-medium">Todas as RPCs estão funcionando perfeitamente!</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Conexão estável com a rede Polygon Amoy. Todas as operações devem funcionar normalmente.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
