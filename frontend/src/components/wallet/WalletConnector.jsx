import React from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';

const WalletConnector = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      margin: '1rem 0',
      padding: '0.5rem'
    }}>
      <ConnectButton 
        label="Conectar Carteira" 
        showBalance={false}
        chainStatus="icon"
      />
    </div>
  );
};

export default WalletConnector;
