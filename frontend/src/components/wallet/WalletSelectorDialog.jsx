import React from 'react';
import { FaWallet } from 'react-icons/fa';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import Button from '../ui/Button';

export function WalletSelectorDialog({
  showWalletSelector,
  walletStep,
  walletOptions = [],
  accountOptions = [],
  networkError,
  connectionError,
  logs = [],
  selectProvider,
  selectAccount,
  switchToAmoyNetwork,
  setShowWalletSelector,
  setWalletStep
}) {
  // Função para copiar logs para a área de transferência
  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
  };

  return (
    <>
      {/* Painel de logs visuais */}
      <div className="fixed bottom-4 right-4 z-[100] bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-lg w-full text-xs text-gray-800" style={{ maxHeight: 200, overflowY: 'auto' }}>
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-lime-700">Logs de Carteira</span>
          <button className="text-xs text-blue-600 underline" onClick={copyLogs}>Copiar</button>
        </div>
        {logs.length === 0 ? (
          <div className="text-gray-400">Nenhum log ainda.</div>
        ) : (
          logs.slice(-10).map((log, idx) => (
            <div key={idx}>{log}</div>
          ))
        )}
      </div>
      {/* Seleção de carteira */}
      <Dialog open={showWalletSelector && walletStep === 'provider'} onOpenChange={setShowWalletSelector}>
        <DialogContent className="max-w-md border-4 border-red-500">
          <DialogHeader>
            <DialogTitle>Conectar Carteira</DialogTitle>
          </DialogHeader>
          {connectionError && (
            <div className="text-center text-red-700 font-semibold py-2">{connectionError}</div>
          )}
          {walletOptions.length === 0 ? (
            <div className="text-center text-red-700 font-semibold py-6">
              Nenhuma carteira encontrada.<br />
              Instale MetaMask ou Rabby para continuar.
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              {walletOptions.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full flex items-center justify-start gap-2"
                  onClick={() => selectProvider(option)}
                >
                  <FaWallet className="text-lime-700" />
                  <span>{option.name}</span>
                </Button>
              ))}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="secondary" onClick={() => setShowWalletSelector(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Seleção de endereço */}
      <Dialog open={showWalletSelector && walletStep === 'account'} onOpenChange={setShowWalletSelector}>
        <DialogContent className="max-w-md border-4 border-red-500">
          <DialogHeader>
            <DialogTitle>Escolha o Endereço</DialogTitle>
          </DialogHeader>
          {connectionError && (
            <div className="text-center text-red-700 font-semibold py-2">{connectionError}</div>
          )}
          <div className="space-y-2 mt-4">
            {accountOptions.map((account, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full flex items-center justify-start gap-2 font-mono"
                onClick={() => selectAccount(account)}
              >
                <span>{account}</span>
              </Button>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="secondary" onClick={() => setWalletStep('provider')}>Voltar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mudança de rede */}
      <Dialog open={showWalletSelector && walletStep === 'network'} onOpenChange={setShowWalletSelector}>
        <DialogContent className="max-w-md border-4 border-red-500">
          <DialogHeader>
            <DialogTitle>Mudar para Rede Polygon Amoy</DialogTitle>
          </DialogHeader>
          {networkError && (
            <div className="text-red-600 text-sm mb-2">Erro: {networkError}</div>
          )}
          {connectionError && (
            <div className="text-center text-red-700 font-semibold py-2">{connectionError}</div>
          )}
          <div className="flex flex-col gap-2 mt-4">
            <Button onClick={switchToAmoyNetwork} variant="primary">
              Mudar para Polygon Amoy
            </Button>
            <Button variant="secondary" onClick={() => setShowWalletSelector(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 