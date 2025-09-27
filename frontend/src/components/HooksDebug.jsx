import React from 'react';
import { useBoletoEscrow } from '../hooks/useBoletoEscrow';

export function HooksDebug() {
  const { 
    hooksStatus, 
    areHooksReady, 
    isConnected, 
    address,
    contractConfig,
    hooksDebug
  } = useBoletoEscrow();

  const checkHooks = () => {
    console.log('🔍 [DEBUG] Verificando hooks...');
    const ready = areHooksReady();
    console.log('🔍 [DEBUG] Hooks prontos:', ready);
    console.log('🔍 [DEBUG] Status detalhado:', hooksStatus);
    console.log('🔍 [DEBUG] Hooks debug:', hooksDebug);
  };

  // Função para renderizar valores de forma segura
  const renderValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      if (value.id !== undefined) {
        return `${value.name || 'Unknown'} (ID: ${value.id})`;
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">🔍 Debug dos Hooks (useWriteContract + usePublicClient)</h3>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <strong>Status da Carteira:</strong>
          <div className="text-sm">
            Conectado: {isConnected ? '✅' : '❌'}
          </div>
          <div className="text-sm text-gray-600">
            {address ? `Endereço: ${address.slice(0,10)}...` : 'Nenhum endereço'}
          </div>
        </div>
        
        <div>
          <strong>Status dos Hooks:</strong>
          <div className="text-sm">
            {hooksStatus && Object.entries(hooksStatus).map(([hook, status]) => (
              <div key={hook} className={status ? 'text-green-600' : 'text-red-600'}>
                {hook}: {status ? '✅' : '❌'}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-3">
        <strong>Configuração dos Contratos:</strong>
        <div className="text-sm text-gray-600">
          <div>Mock USDT: {contractConfig?.MOCK_USDT || 'N/A'}</div>
          <div>P2P Escrow: {contractConfig?.P2P_ESCROW || 'N/A'}</div>
          <div>Rede: {contractConfig?.NETWORK ? renderValue(contractConfig.NETWORK) : 'N/A'}</div>
          <div>MockUSDT Decimals: {contractConfig?.TOKENS?.MOCK_USDT?.decimals || 'N/A'}</div>
        </div>
      </div>

      <div className="mb-3">
        <strong>Debug Detalhado dos Hooks:</strong>
        <div className="text-sm text-gray-600">
          {hooksDebug && Object.entries(hooksDebug).map(([hookName, hookData]) => (
            <div key={hookName} className="mb-1">
              <div><strong>{hookName}:</strong></div>
              <div className="ml-2 text-xs">
                {hookName === 'writeContractAsync' ? (
                  <div>writeContractAsync: {hookData ? '✅' : '❌'}</div>
                ) : hookName === 'publicClient' ? (
                  <div>publicClient: {hookData ? '✅' : '❌'}</div>
                ) : hookName === 'isError' ? (
                  <div>isError: {hookData ? '❌' : '✅'}</div>
                ) : hookName === 'isPending' ? (
                  <div>isPending: {hookData ? '⏳' : '✅'}</div>
                ) : hookName === 'error' ? (
                  <div>error: {hookData ? hookData.message : 'Nenhum'}</div>
                ) : (
                  <div>{hookName}: {String(hookData)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <strong>Status do Sistema:</strong>
        <div className="text-sm text-gray-600">
          <div>Hooks prontos: {areHooksReady() ? '✅' : '❌'}</div>
          <div>Pode travar boletos: {areHooksReady() && isConnected ? '✅' : '❌'}</div>
          <div>MockUSDT configurado: {contractConfig?.TOKENS?.MOCK_USDT?.decimals === 6 ? '✅' : '❌'}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={checkHooks}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          Verificar Hooks
        </button>
        
        <button
          onClick={() => console.log('🔍 [DEBUG] Status completo:', { hooksStatus, isConnected, address, contractConfig, hooksDebug })}
          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
        >
          Log Completo
        </button>
      </div>
    </div>
  );
}
