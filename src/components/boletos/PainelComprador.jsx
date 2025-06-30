import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebaseConfig";
import { collection, query, where, getDocs, Timestamp, doc, updateDoc } from "firebase/firestore";
import { ethers } from "ethers";
import {
  Card, CardHeader, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, 
  Button, Alert, CircularProgress, Box, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';


function formatDate(ts) {
  if (!ts) return "";
  const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString();
}

function PainelComprador() {
  const navigate = useNavigate();
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  
  // Estados para controlar a seleção de carteira
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [walletOptions, setWalletOptions] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [walletStep, setWalletStep] = useState('provider'); // 'provider', 'account', 'network'
  const [networkError, setNetworkError] = useState('');
  const [selectedBoleto, setSelectedBoleto] = useState(null);

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

  // Função para abrir o seletor de carteira
  const openWalletSelector = (boleto) => {
    setFeedback("");
    
    // Forçar a exibição de MetaMask e Rabby independentemente da detecção
    const forcedProviders = [];
    
    if (!window.ethereum) {
      setFeedback("Nenhuma carteira encontrada! Por favor, instale a extensão MetaMask ou Rabby para continuar.");
      return;
    }
    
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
    setSelectedBoleto(boleto);
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
      setFeedback('Erro ao solicitar contas: ' + (error.message || 'Desconhecido'));
      setShowWalletSelector(false);
    }
  };
  
  // Função para selecionar uma conta
  const selectAccount = async (account, provider) => {
    const actualProvider = provider || selectedProvider;
    try {
      // Verificar a rede atual
      const chainId = await actualProvider.request({ method: 'eth_chainId' });
      console.log('Rede atual:', chainId);
      
      // Verificar se está na rede Polygon Amoy (80002)
      if (chainId !== '0x13882') { // 0x13882 = 80002 em hexadecimal
        setWalletStep('network');
      } else {
        // Já está na rede correta, finaliza a reserva
        finalizarReserva(account);
      }
    } catch (error) {
      console.error('Erro ao verificar rede:', error);
      setFeedback('Erro ao verificar rede: ' + (error.message || 'Desconhecido'));
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
        
        // Após trocar com sucesso, finaliza a reserva
        const accounts = await selectedProvider.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          finalizarReserva(accounts[0]);
        } else {
          setFeedback('Não foi possível obter a conta após a troca de rede.');
          setShowWalletSelector(false);
        }
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
            
            // Após trocar com sucesso na segunda tentativa, finaliza a reserva
            const accounts = await selectedProvider.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
              finalizarReserva(accounts[0]);
            } else {
              setFeedback('Não foi possível obter a conta após a troca de rede.');
              setShowWalletSelector(false);
            }
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
  
  // Função para finalizar a reserva do boleto
  const finalizarReserva = async (account) => {
    if (!selectedBoleto) {
      setFeedback('Erro: Boleto não selecionado.');
      setShowWalletSelector(false);
      return;
    }
    
    try {
      // Atualizar o boleto no Firestore
      const boletoRef = doc(db, "boletos", selectedBoleto.id);
      await updateDoc(boletoRef, {
        status: "reservado",
        enderecoComprador: account,
        dataReserva: Timestamp.now()
      });
      
      // Atualizar a lista de boletos
      const updatedBoletos = boletos.map(b => {
        if (b.id === selectedBoleto.id) {
          return {
            ...b,
            status: "reservado",
            enderecoComprador: account,
            dataReserva: new Date()
          };
        }
        return b;
      });
      
      setBoletos(updatedBoletos);
      setFeedback(`Boleto reservado com sucesso! Endereço: ${account}`);
      setShowWalletSelector(false);
      
      // Redirecionar para a página de detalhes do boleto
      navigate(`/boleto/${selectedBoleto.id}`);
    } catch (error) {
      console.error("Erro ao reservar boleto:", error);
      setFeedback(`Erro ao reservar boleto: ${error.message || "Desconhecido"}`);
      setShowWalletSelector(false);
    }
  };
  
  // Função para iniciar o processo de seleção de boleto
  const handleSelecionar = (boleto) => {
    openWalletSelector(boleto);
  };

  useEffect(() => {
    const fetchBoletos = async () => {
      setLoading(true);
      const q = query(collection(db, "boletos"), where("status", "==", "pendente"));
      const snap = await getDocs(q);
      setBoletos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchBoletos();
  }, []);

  return (
    <>
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
      
      <Card sx={{ maxWidth: 800, mx: 'auto', mt: 6, boxShadow: 6, borderRadius: 4, bgcolor: 'background.paper' }}>
        <CardHeader
          avatar={<AccountBalanceWalletIcon sx={{ color: 'primary.main', fontSize: 36 }} />}
          title={<Typography variant="h5" fontWeight={700} color="primary.main">Boletos Disponíveis</Typography>}
          sx={{ pb: 0, pt: 3 }}
        />
        <Divider sx={{ mb: 2 }} />
        <CardContent>
          {feedback && (
            <Alert severity={feedback.includes('sucesso') || feedback.includes('reservado') ? 'success' : 'error'} sx={{ mb: 2 }}>{feedback}</Alert>
          )}
          {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>Carregando...</Typography>
          </Box>
        ) : (
          boletos.length === 0 ? (
            <Typography variant="body1" color="text.secondary">Nenhum boleto disponível.</Typography>
          ) : (
            <Table sx={{ minWidth: 650 }} size="small" aria-label="boletos disponíveis">
              <TableHead>
                <TableRow sx={{ background: '#f5f5f5' }}>
                  <TableCell><b>Número</b></TableCell>
                  <TableCell><b>Valor</b></TableCell>
                  <TableCell><b>Vencimento</b></TableCell>
                  <TableCell><b>Instituição</b></TableCell>
                  <TableCell align="center"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {boletos.map(b => (
                  <TableRow key={b.id} hover>
                    <TableCell>{b.numeroControle ? b.numeroControle.toString().padStart(3, '0') : '---'}</TableCell>
                    <TableCell>R$ {b.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{formatDate(b.vencimento)}</TableCell>
                    <TableCell>{b.instituicao}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<AccountBalanceWalletIcon />}
                        onClick={() => navigate(`/confirmacao/${b.id}`)}
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                      >
                        Selecionar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}
      </CardContent>
    </Card>
    </>
  );
}

export default PainelComprador;
