import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSwitchChain, useDisconnect } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { Box, Typography, Paper, Container, Button, Alert, Divider, Card, CardContent } from '@mui/material';

/**
 * Componente de teste para conexão de carteiras usando RainbowKit
 * Este componente demonstra as funcionalidades básicas do RainbowKit:
 * - Botão de conexão com carteiras
 * - Exibição do endereço conectado
 * - Troca de rede
 * - Seleção de endereços
 */
const TestWalletConnector = () => {
  // Hooks do Wagmi v2 para gerenciar a conexão
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  
  // Estado para rastrear se o usuário já conectou antes
  const [hasConnected, setHasConnected] = useState(false);
  
  // Monitorar mudanças na conexão
  useEffect(() => {
    // Monitorar mudanças na conexão
    if (isConnected && !hasConnected) {
      setHasConnected(true);
    }
  }, [isConnected, hasConnected]);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          Teste de Conexão Multi-Carteiras
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Esta página demonstra o fluxo de conexão com carteiras Web3 usando RainbowKit.
          Você pode conectar qualquer carteira compatível e selecionar entre múltiplos endereços.
        </Alert>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          {/* Botão de conexão do RainbowKit */}
          <ConnectButton label="Conectar Carteira" />
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        {isConnected ? (
          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Carteira Conectada
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Provedor:</strong> {connector?.name || 'Desconhecido'}
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Endereço:</strong> {address}
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 3 }}>
                <strong>Rede:</strong> {chainId === polygonAmoy.id ? 'Polygon Amoy' : 'Outra rede'} (ID: {chainId || 'N/A'})
              </Typography>
              
              {chainId !== polygonAmoy.id && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => switchChain({ chainId: polygonAmoy.id })}
                  sx={{ mr: 2 }}
                >
                  Trocar para Polygon Amoy
                </Button>
              )}
              
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => disconnect()}
              >
                Desconectar
              </Button>
            </CardContent>
          </Card>
        ) : hasConnected ? (
          <Alert severity="warning" sx={{ mb: 4 }}>
            Você desconectou sua carteira. Clique em "Conectar Carteira" para reconectar.
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 4 }}>
            Clique em "Conectar Carteira" para iniciar o processo de conexão.
            Você poderá escolher entre as carteiras disponíveis e selecionar o endereço desejado.
          </Alert>
        )}
        
        <Typography variant="h6" gutterBottom>
          Como funciona:
        </Typography>
        
        <ol>
          <li>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Conectar Carteira:</strong> Clique no botão acima para ver as carteiras disponíveis.
            </Typography>
          </li>
          <li>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Selecionar Endereço:</strong> Após escolher uma carteira, você poderá selecionar qual endereço usar.
            </Typography>
          </li>
          <li>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Trocar Rede:</strong> Se necessário, você pode trocar para a rede Polygon Amoy.
            </Typography>
          </li>
        </ol>
      </Paper>
    </Container>
  );
};

export default TestWalletConnector;
