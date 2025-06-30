import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Grid, Tabs, Tab, Button, Divider, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { useAuth } from '../components/AuthProvider';
import BoletoForm from '../components/BoletoForm';
import MeusBoletos from '../components/MeusBoletos';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

/**
 * Página da área do vendedor
 * Contém o formulário para cadastro de boletos e a listagem de boletos do vendedor
 */
const VendedorPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [boletosAtualizados, setBoletosAtualizados] = useState(false);
  
  // Estado para controlar a conexão com a carteira
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Função simplificada para detectar provedores de carteira
  const detectProviders = () => {
    console.log('Iniciando detecção de provedores...');
    const providers = [];
    
    // Verificar se temos provedores injetados
    if (!window.ethereum) {
      console.log('Nenhum provedor Ethereum detectado');
      return providers;
    }
    
    // Sempre adicionar MetaMask e Rabby como opções
    providers.push({
      name: 'MetaMask',
      provider: window.ethereum
    });
    
    providers.push({
      name: 'Rabby',
      provider: window.ethereum
    });
    
    console.log('Provedores adicionados manualmente:', providers.map(p => p.name));
    return providers;
  };
  
  // Estado para controlar a exibição do modal de seleção de carteira
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [walletOptions, setWalletOptions] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [walletStep, setWalletStep] = useState('provider'); // 'provider', 'account', 'network'
  const [networkError, setNetworkError] = useState('');
  
  // Função para abrir o seletor de carteira
  const openWalletSelector = () => {
    // Forçar a exibição de MetaMask e Rabby independentemente da detecção
    const forcedProviders = [];
    
    // Adicionar MetaMask
    forcedProviders.push({
      name: 'MetaMask',
      provider: window.ethereum
    });
    
    // Adicionar Rabby
    forcedProviders.push({
      name: 'Rabby',
      provider: window.ethereum
    });
    
    console.log('Provedores forçados:', forcedProviders);
    setWalletOptions(forcedProviders);
    setWalletStep('provider');
    setShowWalletSelector(true);
  };
  
  // Função para selecionar um provedor de carteira
  const selectProvider = async (providerObj) => {
    try {
      console.log('Provedor selecionado:', providerObj.name);
      
      // Armazenar o provedor selecionado
      setSelectedProvider(providerObj.provider);
      const provider = providerObj.provider;
      
      // Verificar qual carteira foi selecionada e usar o provedor correto
      let selectedWalletProvider = window.ethereum;
      
      // Se temos múltiplos provedores, tente encontrar o correto
      if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
        console.log('Buscando provedor específico para', providerObj.name);
        
        if (providerObj.name === 'MetaMask') {
          // Buscar MetaMask no array de provedores
          const metamask = window.ethereum.providers.find(p => p.isMetaMask && !p.isRabby);
          if (metamask) {
            console.log('Usando provedor específico do MetaMask');
            selectedWalletProvider = metamask;
          }
        } else if (providerObj.name === 'Rabby') {
          // Buscar Rabby no array de provedores
          const rabby = window.ethereum.providers.find(p => p.isRabby);
          if (rabby) {
            console.log('Usando provedor específico do Rabby');
            selectedWalletProvider = rabby;
          }
        }
      }
      
      console.log('Solicitando contas do provedor:', providerObj.name);
      
      // Primeiro solicitar permissão para acessar as contas
      await selectedWalletProvider.request({ method: 'eth_requestAccounts' });
      
      // Depois obter todas as contas disponíveis
      const accounts = await selectedWalletProvider.request({ method: 'eth_accounts' });
      console.log('Contas obtidas:', accounts);
      
      // Sempre mostrar a tela de seleção de endereços, mesmo com apenas um endereço
      setAccountOptions(accounts);
      setWalletStep('account');
    } catch (error) {
      console.error('Erro ao solicitar contas:', error);
      alert('Erro ao solicitar contas: ' + (error.message || 'Desconhecido'));
      setShowWalletSelector(false);
    }
  };
  
  // Função para selecionar uma conta
  const selectAccount = async (account, provider) => {
    const actualProvider = provider || selectedProvider;
    setAddress(account);
    setIsConnected(true);
    console.log('Conta selecionada:', account);
    
    try {
      // Verificar a rede atual
      const chainId = await actualProvider.request({ method: 'eth_chainId' });
      console.log('Rede atual:', chainId);
      
      // Verificar se está na rede Polygon Amoy (80002)
      if (chainId !== '0x13882') { // 0x13882 = 80002 em hexadecimal
        setWalletStep('network');
      } else {
        // Já está na rede correta, fecha o seletor
        setShowWalletSelector(false);
      }
    } catch (error) {
      console.error('Erro ao verificar rede:', error);
      setShowWalletSelector(false);
    }
  };
  
  // Função para trocar para a rede Polygon Amoy
  const switchToAmoyNetwork = async () => {
    setNetworkError('');
    try {
      console.log('Tentando trocar para rede Polygon Amoy com provedor:', selectedProvider);
      
      // Primeiro tenta adicionar a rede
      try {
        await selectedProvider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x13882', // chainId 80002 em hexadecimal
            chainName: 'Polygon Amoy Testnet',
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18
            },
            rpcUrls: ['https://rpc-amoy.polygon.technology/'],
            blockExplorerUrls: ['https://amoy.polygonscan.com/']
          }]
        });
        console.log('Rede Polygon Amoy adicionada com sucesso');
      } catch (addError) {
        console.log('Erro ao adicionar rede ou rede já existente:', addError);
        // Continua tentando trocar mesmo se falhar ao adicionar
      }
      
      // Depois tenta trocar para a rede
      try {
        await selectedProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13882' }]
        });
        console.log('Troca para rede Polygon Amoy bem-sucedida');
        setShowWalletSelector(false);
      } catch (switchError) {
        // Se o erro for 4902 (rede não reconhecida), tenta adicionar novamente
        if (switchError.code === 4902) {
          console.log('Rede não reconhecida, tentando adicionar novamente...');
          try {
            await selectedProvider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x13882',
                chainName: 'Polygon Amoy Testnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18
                },
                rpcUrls: ['https://rpc-amoy.polygon.technology/'],
                blockExplorerUrls: ['https://amoy.polygonscan.com/']
              }]
            });
            // Tenta trocar novamente após adicionar
            await selectedProvider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x13882' }]
            });
            console.log('Rede adicionada e troca bem-sucedida na segunda tentativa');
            setShowWalletSelector(false);
          } catch (secondError) {
            console.error('Erro na segunda tentativa:', secondError);
            setNetworkError('Não foi possível adicionar ou trocar para a rede Polygon Amoy. Por favor, adicione manualmente nas configurações da sua carteira.');
          }
        } else {
          console.error('Erro ao trocar para rede Polygon Amoy:', switchError);
          setNetworkError(switchError.message || 'Erro desconhecido ao trocar de rede');
        }
      }
    } catch (error) {
      console.error('Erro geral ao configurar rede:', error);
      setNetworkError(error.message || 'Erro desconhecido ao configurar rede');
    }
  };
  
  // Função para conectar carteira (inicia o processo)
  const connectWallet = () => {
    openWalletSelector();
  };
  
  // Função para desconectar carteira
  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
    console.log('Carteira desconectada');
  };
  
  // Efeito para configurar listeners de eventos da carteira
  useEffect(() => {
    const setupListeners = () => {
      if (window.ethereum) {
        try {          
          // Adiciona listener para mudanças de conta
          window.ethereum.on('accountsChanged', (newAccounts) => {
            console.log('Contas alteradas:', newAccounts);
            if (newAccounts && newAccounts.length > 0) {
              setAddress(newAccounts[0]);
              setIsConnected(true);
            } else {
              setAddress(null);
              setIsConnected(false);
            }
          });
          
          // Adiciona listener para mudanças de rede
          window.ethereum.on('chainChanged', () => {
            console.log('Rede alterada, recarregando...');
            window.location.reload();
          });
          
          // Adiciona listener para desconexão
          window.ethereum.on('disconnect', () => {
            console.log('Carteira desconectada');
            setAddress(null);
            setIsConnected(false);
          });
        } catch (error) {
          console.error('Erro ao configurar listeners:', error);
        }
      }
    };
    
    setupListeners();
    
    // Limpeza dos listeners quando o componente for desmontado
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
        window.ethereum.removeListener('disconnect', () => {});
      }
    };
  }, []);

  // Função para alternar entre as abas
  const handleChangeTab = (event, newValue) => {
    setActiveTab(newValue);
    // Se estiver mudando para a aba de Meus Boletos, atualiza a lista
    if (newValue === 1) {
      setBoletosAtualizados(prev => !prev);
    }
  };

  // Função chamada quando um boleto é adicionado
  const handleBoletoAdded = () => {
    // Força atualização da lista de boletos
    setBoletosAtualizados(prev => !prev);
    // Muda para a aba de Meus Boletos após cadastrar um boleto
    setActiveTab(1);
  };

  // Função para conectar/desconectar carteira
  const handleWalletConnection = () => {
    console.log('handleWalletConnection chamado, isConnected:', isConnected);
    if (isConnected) {
      console.log('Desconectando carteira...');
      disconnectWallet();
    } else {
      console.log('Iniciando conexão com carteira...');
      connectWallet();
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mb: 8 }}>
      {/* Diálogo de seleção de carteira */}
      <Dialog open={showWalletSelector && walletStep === 'provider'} onClose={() => setShowWalletSelector(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Escolha sua Carteira</DialogTitle>
        <DialogContent>
          <List>
            {walletOptions.map((option, index) => (
              <ListItem 
                component="button"
                key={index} 
                onClick={() => selectProvider(option)}
                sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1, '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <ListItemIcon>
                  <AccountBalanceWalletIcon fontSize="large" />
                </ListItemIcon>
                <ListItemText primary={option.name} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWalletSelector(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de seleção de endereço */}
      <Dialog open={showWalletSelector && walletStep === 'account'} onClose={() => setShowWalletSelector(false)} maxWidth="md" fullWidth>
        <DialogTitle>Escolha o Endereço</DialogTitle>
        <DialogContent>
          <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
            {accountOptions.map((account, index) => (
              <ListItem 
                component="button" 
                key={index} 
                onClick={() => selectAccount(account)}
                sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1, '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <ListItemText primary={account} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWalletStep('provider')}>Voltar</Button>
          <Button onClick={() => setShowWalletSelector(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de mudança de rede */}
      <Dialog open={showWalletSelector && walletStep === 'network'} onClose={() => setShowWalletSelector(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mudar para Rede Polygon Amoy</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Para usar este aplicativo, é necessário estar na rede Polygon Amoy (Testnet).
          </Typography>
          {networkError && (
            <Typography color="error" paragraph>
              Erro: {networkError}
            </Typography>
          )}
          <Typography paragraph>
            Clique no botão abaixo para adicionar e mudar para esta rede automaticamente.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWalletSelector(false)}>Cancelar</Button>
          <Button 
            onClick={switchToAmoyNetwork} 
            variant="contained" 
            color="primary"
            startIcon={<AccountBalanceIcon />}
          >
            Mudar para Polygon Amoy
          </Button>
        </DialogActions>
      </Dialog>
      
      <Box sx={{ my: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Grid item>
            <Typography variant="h4" component="h1" fontWeight="bold" color="primary.main">
              Área do Vendedor
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Bem-vindo, {user?.displayName || 'Vendedor'}! Gerencie seus boletos e acompanhe suas vendas.
            </Typography>
          </Grid>
          
          <Grid item>
            <Button
              variant={isConnected ? "outlined" : "contained"}
              color={isConnected ? "success" : "primary"}
              startIcon={<AccountBalanceWalletIcon />}
              onClick={handleWalletConnection}
              sx={{ fontWeight: 'bold', borderRadius: 2 }}
            >
              {isConnected && address ? 
                `Conectado: ${address.slice(0, 6)}...${address.slice(-4)}` : 
                "Conectar Carteira"}
            </Button>
          </Grid>
        </Grid>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleChangeTab}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab 
              icon={<AddCircleOutlineIcon />} 
              iconPosition="start" 
              label="Cadastrar Boleto" 
              sx={{ fontWeight: 'bold', fontSize: '1rem' }} 
            />
            <Tab 
              icon={<ListAltIcon />} 
              iconPosition="start" 
              label="Meus Boletos" 
              sx={{ fontWeight: 'bold', fontSize: '1rem' }} 
            />
          </Tabs>
        </Box>
        
        {/* Conteúdo das abas */}
        <Box sx={{ mt: 2 }}>
          {activeTab === 0 ? (
            <Box>
              <BoletoForm 
                user={user} 
                onBoletoAdded={handleBoletoAdded} 
                handleWalletConnection={handleWalletConnection}
                isConnected={isConnected}
                address={address}
              />
            </Box>
          ) : (
            <Box>
              <MeusBoletos key={boletosAtualizados ? 'updated' : 'initial'} />
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default VendedorPage;
