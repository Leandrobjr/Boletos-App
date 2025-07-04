import React, { useState } from 'react';

/**
 * Versão simplificada do WalletConnector sem dependências do Tailwind CSS
 * Usa apenas CSS inline para estilização
 */
const WalletConnectorBasico = () => {
  const [currentScreen, setCurrentScreen] = useState('initial');
  
  // Estilos comuns
  const styles = {
    container: {
      padding: '20px',
      maxWidth: '400px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
    },
    card: {
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: 'white',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    header: {
      marginBottom: '20px',
      textAlign: 'center',
    },
    title: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#333',
      margin: '10px 0',
    },
    description: {
      fontSize: '14px',
      color: '#666',
      margin: '0 0 20px 0',
    },
    button: {
      backgroundColor: '#00A86B',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '10px 15px',
      fontSize: '16px',
      cursor: 'pointer',
      width: '100%',
      fontWeight: 'bold',
    },
    outlineButton: {
      backgroundColor: 'transparent',
      color: '#00A86B',
      border: '1px solid #00A86B',
      borderRadius: '4px',
      padding: '10px 15px',
      fontSize: '16px',
      cursor: 'pointer',
      width: '100%',
      fontWeight: 'bold',
    },
    walletOption: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      marginBottom: '10px',
      cursor: 'pointer',
    },
    walletIcon: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: '#E8F5E9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '10px',
      color: '#00A86B',
      fontWeight: 'bold',
    },
    walletInfo: {
      display: 'flex',
      alignItems: 'center',
    },
    alert: {
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '20px',
      backgroundColor: '#FFF3CD',
      border: '1px solid #FFEEBA',
      color: '#856404',
    },
    successAlert: {
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '20px',
      backgroundColor: '#D4EDDA',
      border: '1px solid #C3E6CB',
      color: '#155724',
    },
    infoBox: {
      padding: '12px',
      backgroundColor: '#f9f9f9',
      borderRadius: '4px',
      marginBottom: '15px',
    },
    addressBox: {
      padding: '8px',
      backgroundColor: '#f0f0f0',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '14px',
      marginBottom: '5px',
    },
    iconButton: {
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '5px',
      color: '#666',
      fontSize: '14px',
    },
    networkBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '5px 10px',
      backgroundColor: '#E8F5E9',
      borderRadius: '20px',
      fontSize: '14px',
      color: '#00A86B',
    },
    networkDot: {
      width: '8px',
      height: '8px',
      backgroundColor: '#00A86B',
      borderRadius: '50%',
      marginRight: '5px',
    },
    footer: {
      marginTop: '20px',
      textAlign: 'center',
    },
  };

  // Carteiras disponíveis (simulação)
  const wallets = [
    { id: 'metamask', name: 'MetaMask' },
    { id: 'walletconnect', name: 'WalletConnect' },
    { id: 'coinbase', name: 'Coinbase Wallet' },
  ];

  // Renderização condicional baseada no estado atual
  const renderScreen = () => {
    switch (currentScreen) {
      case 'initial':
        return (
          <div style={styles.card}>
            <div style={styles.header}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#E8F5E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px auto',
              }}>
                <span style={{ fontSize: '24px', color: '#00A86B' }}>💼</span>
              </div>
              <h2 style={styles.title}>Conecte sua Carteira</h2>
              <p style={styles.description}>
                Conecte-se para acessar todas as funcionalidades do BoletoXCrypto
              </p>
            </div>
            <button 
              style={styles.button}
              onClick={() => setCurrentScreen('select-wallet')}
            >
              Conectar Carteira
            </button>
          </div>
        );

      case 'select-wallet':
        return (
          <div style={styles.card}>
            <div style={styles.header}>
              <h2 style={styles.title}>Selecione sua Carteira</h2>
              <p style={styles.description}>
                Escolha uma das carteiras disponíveis para conectar
              </p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  style={styles.walletOption}
                  onClick={() => setCurrentScreen('connected')}
                >
                  <div style={styles.walletInfo}>
                    <div style={styles.walletIcon}>
                      {wallet.name.substring(0, 1)}
                    </div>
                    <span>{wallet.name}</span>
                  </div>
                  <span>→</span>
                </div>
              ))}
            </div>
            <button 
              style={styles.outlineButton}
              onClick={() => setCurrentScreen('initial')}
            >
              Voltar
            </button>
          </div>
        );

      case 'connected':
        return (
          <div style={styles.card}>
            <div style={styles.header}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={styles.title}>Carteira Conectada</h2>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={styles.networkDot}></div>
                  <span style={{ fontSize: '14px', color: '#00A86B' }}>Conectado</span>
                </div>
              </div>
              <p style={styles.description}>
                Sua carteira está conectada ao BoletoXCrypto
              </p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={styles.infoBox}>
                <div style={styles.walletInfo}>
                  <div style={styles.walletIcon}>M</div>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>MetaMask</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Carteira Web3</div>
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>Endereço</span>
                  <div>
                    <button style={styles.iconButton} title="Copiar endereço">📋</button>
                    <button style={styles.iconButton} title="Ver no explorador">🔗</button>
                  </div>
                </div>
                <div style={styles.addressBox}>0x1234...5678</div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>Rede</span>
                  <button style={styles.iconButton} title="Atualizar">🔄</button>
                </div>
                <div style={styles.networkBadge}>
                  <div style={styles.networkDot}></div>
                  <span>Polygon Mumbai</span>
                </div>
              </div>
              
              <div style={styles.alert}>
                <strong>⚠️ Rede incorreta</strong>
                <p style={{ margin: '5px 0' }}>Para utilizar o BoletoXCrypto, você precisa estar na rede Polygon Amoy.</p>
                <button 
                  style={{...styles.button, marginTop: '10px'}}
                  onClick={() => alert('Troca de rede simulada')}
                >
                  Trocar para Polygon Amoy
                </button>
              </div>
            </div>
            
            <button 
              style={{...styles.outlineButton, color: '#dc3545', borderColor: '#dc3545'}}
              onClick={() => setCurrentScreen('disconnected')}
            >
              Desconectar
            </button>
          </div>
        );

      case 'disconnected':
        return (
          <div style={styles.card}>
            <div style={styles.header}>
              <h2 style={styles.title}>Carteira Desconectada</h2>
              <p style={styles.description}>
                Sua carteira foi desconectada com sucesso
              </p>
            </div>
            <div style={styles.successAlert}>
              <span>✓ </span>
              Você desconectou sua carteira com sucesso. Seus dados foram removidos desta sessão.
            </div>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
              Clique no botão abaixo para reconectar sua carteira
            </p>
            <button 
              style={styles.button}
              onClick={() => setCurrentScreen('initial')}
            >
              Reconectar
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      {renderScreen()}
      {currentScreen !== 'initial' && currentScreen !== 'disconnected' && (
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: '15px' }}>
          BoletoXCrypto nunca solicitará sua frase de recuperação ou chaves privadas.
        </p>
      )}
    </div>
  );
};

export default WalletConnectorBasico;
