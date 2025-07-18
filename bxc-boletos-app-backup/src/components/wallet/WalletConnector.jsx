import React, { useEffect } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

const WalletConnector = () => {
  const { address, isConnected, connector, status, chain } = useAccount();
  const { connect, connectors, error: connectError, isLoading, pendingConnector } = useConnect();
  const { disconnect, error: disconnectError } = useDisconnect();

  useEffect(() => {
    console.log('[WalletConnector] Estado da conexão:', { address, isConnected, connector, status, chain });
  }, [address, isConnected, connector, status, chain]);

  useEffect(() => {
    if (connectError) console.error('[WalletConnector] Erro ao conectar:', connectError);
    if (disconnectError) console.error('[WalletConnector] Erro ao desconectar:', disconnectError);
  }, [connectError, disconnectError]);

  return (
    <div style={{ background: '#ffe', border: '2px solid #fc0', borderRadius: 8, padding: 16, margin: 8, minWidth: 320 }}>
      <div style={{ fontWeight: 'bold', color: '#b8860b', marginBottom: 8 }}>[DEBUG] Painel de conexão de carteira</div>
      <ConnectButton label="Conectar Carteira" />
      <div style={{ fontSize: 13, color: '#333', marginTop: 12, fontFamily: 'monospace' }}>
        <div><b>isConnected:</b> {String(isConnected)}</div>
        <div><b>address:</b> {address || '-'}</div>
        <div><b>connector:</b> {connector?.name || '-'}</div>
        <div><b>chain:</b> {chain?.name || '-'}</div>
        <div><b>status:</b> {status}</div>
        {connectError && <div style={{ color: 'red' }}><b>Erro conectar:</b> {connectError.message}</div>}
        {disconnectError && <div style={{ color: 'red' }}><b>Erro desconectar:</b> {disconnectError.message}</div>}
      </div>
    </div>
  );
};

export default WalletConnector;
