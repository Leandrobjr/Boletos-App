import React, { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { ethers } from 'ethers';
import { approveUSDT, lockUSDT } from '../services/escrowService';
import {
  Box, Button, Card, CardContent, CardHeader, TextField, Typography,
  Grid, Divider, InputAdornment, Alert, CircularProgress
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LockIcon from '@mui/icons-material/Lock';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAccount } from 'wagmi';

function formatarMoeda(valor) {
  const limpo = valor.replace(/\D/g, "");
  if (!limpo) return "0,00";
  const inteiro = limpo.slice(0, -2) || "0";
  const centavos = limpo.slice(-2).padStart(2, "0");
  return parseInt(inteiro, 10).toLocaleString("pt-BR") + "," + centavos;
}

function BoletoForm({ user, onBoletoAdded, handleWalletConnection, isConnected, address }) {
  const [valor, setValor] = useState("");
  const [cotacao, setCotacao] = useState(null);
  const [usdt, setUsdt] = useState("");
  const [cotLoading, setCotLoading] = useState(false);
  const [wallet, setWallet] = useState("");
  const [escrowOk, setEscrowOk] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [cpfCnpjError, setCpfCnpjError] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [codigoBarrasError, setCodigoBarrasError] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [instituicao, setInstituicao] = useState("ASAAS");
  const [loading, setLoading] = useState(false);

  // Usamos o isConnected passado como prop em vez do hook useAccount
  // const { isConnected } = useAccount();

  async function buscarCotacao() {
    setCotLoading(true);
    setFeedback("");
    try {
      const resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=brl');
      const data = await resp.json();
      setCotacao(data.tether.brl);
    } catch (e) {
      setFeedback("Erro ao buscar cotação do USDT. Tente novamente.");
    }
    setCotLoading(false);
  }

  useEffect(() => {
    if (valor && cotacao) {
      const limpo = valor.replace(/\D/g, "");
      const inteiro = limpo.slice(0, -2) || "0";
      const centavos = limpo.slice(-2).padStart(2, "0");
      const valorNum = parseFloat(inteiro + "." + centavos);
      if (!isNaN(valorNum) && cotacao > 0) {
        // Calcula o valor em USDT
        const valorUSDT = valorNum / cotacao;
        // Adiciona a taxa de serviço de 1%
        const taxaServico = valorUSDT * 0.01;
        const valorTotalUSDT = valorUSDT + taxaServico;
        setUsdt(valorTotalUSDT.toFixed(2));
      } else {
        setUsdt("");
      }
    } else {
      setUsdt("");
    }
  }, [valor, cotacao]);

  useEffect(() => { buscarCotacao(); }, []);

  function validarCodigoBarras(valor) {
    const limpo = valor.replace(/\D/g, "");
    return limpo.length === 47;
  }

  function validarCpfCnpj(value) {
    const cpf = value.replace(/\D/g, "");
    if (cpf.length === 11) {
      let sum = 0;
      let rest;
      if (/^(\d)\1+$/.test(cpf)) return false;
      for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i-1, i)) * (11 - i);
      rest = (sum * 10) % 11;
      if ((rest === 10) || (rest === 11)) rest = 0;
      if (rest !== parseInt(cpf.substring(9, 10))) return false;
      sum = 0;
      for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i-1, i)) * (12 - i);
      rest = (sum * 10) % 11;
      if ((rest === 10) || (rest === 11)) rest = 0;
      if (rest !== parseInt(cpf.substring(10, 11))) return false;
      return true;
    }
    if (cpf.length === 14) {
      let tamanho = cpf.length - 2;
      let numeros = cpf.substring(0, tamanho);
      let digitos = cpf.substring(tamanho);
      let soma = 0;
      let pos = tamanho - 7;
      for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
      }
      let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
      if (resultado !== parseInt(digitos.charAt(0))) return false;
      tamanho = tamanho + 1;
      numeros = cpf.substring(0, tamanho);
      soma = 0;
      pos = tamanho - 7;
      for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
      }
      resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
      if (resultado !== parseInt(digitos.charAt(1))) return false;
      return true;
    }
    return false;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarCpfCnpj(cpfCnpj)) {
      setCpfCnpjError("CPF ou CNPJ inválido!");
      alert("CPF ou CNPJ inválido!");
      setLoading(false);
      return;
    } else {
      setCpfCnpjError("");
    }
    if (!validarCodigoBarras(codigoBarras)) {
      setCodigoBarrasError("O código de barras deve conter exatamente 47 dígitos.");
      alert("O código de barras deve conter exatamente 47 dígitos.");
      setLoading(false);
      return;
    } else {
      setCodigoBarrasError("");
    }
    const limpo = valor.replace(/\D/g, "");
    const inteiro = limpo.slice(0, -2) || "0";
    const centavos = limpo.slice(-2).padStart(2, "0");
    const valorNum = parseFloat(inteiro + "." + centavos);
    if (isNaN(valorNum) || valorNum <= 0) {
      alert("Valor inválido! Informe um valor numérico maior que zero.");
      setLoading(false);
      return;
    }
    const dataVenc = vencimento ? new Date(vencimento) : null;
    if (!dataVenc || isNaN(dataVenc.getTime())) {
      alert("Data de vencimento inválida!");
      setLoading(false);
      return;
    }
    if (!instituicao.trim()) {
      alert("Instituição emissora é obrigatória!");
      setLoading(false);
      return;
    }
    setLoading(true);
    let numeroControle = 1;
    try {
      const boletosSnap = await import("firebase/firestore").then(firestore =>
        firestore.getDocs(firestore.query(firestore.collection(db, "boletos")))
      );
      const numeros = boletosSnap.docs.map(doc => Number(doc.data().numeroControle)).filter(n => !isNaN(n));
      if (numeros.length > 0) {
        numeroControle = Math.max(...numeros) + 1;
      }
    } catch (err) {
      console.log('Erro ao buscar numeroControle:', err);
    }
    const numeroControleStr = String(numeroControle).padStart(3, '0');
    const boletoObj = {
      uid: user.uid,
      cpfCnpj,
      codigoBarras,
      valor: valorNum,
      vencimento: dataVenc ? Timestamp.fromDate(dataVenc) : null,
      instituicao,
      status: "pendente",
      criadoEm: Timestamp.now(),
      numeroControle: numeroControleStr
    };
    try {
      await addDoc(collection(db, "boletos"), boletoObj);
      setCpfCnpj(""); setCodigoBarras(""); setValor(""); setVencimento(""); setInstituicao("");
      if (onBoletoAdded) onBoletoAdded();
    } catch (e) {
      alert("Erro ao cadastrar boleto: " + e.message);
    }
    setLoading(false);
  };

  async function conectarETravar() {
    if (carregando) {
      setFeedback("Aguarde, processando...");
      return;
    }
    setCarregando(true);
    setFeedback("Aguarde, processando...");
    setEscrowOk(false);
    try {
      // Verificamos se a carteira está conectada usando a prop isConnected
      if (!isConnected || !address) {
        // Se não estiver conectada, usamos a função handleWalletConnection passada como prop
        setFeedback("Conecte sua carteira antes de finalizar a operação.");
        handleWalletConnection(); // Chamamos a função de conexão passada pelo componente pai
        setCarregando(false);
        return;
      }
      
      if (!window.ethereum) {
        setFeedback("Nenhuma carteira encontrada. Instale MetaMask ou similar.");
        setCarregando(false);
        return;
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 137n && network.chainId !== 80002n) { // 137 = Polygon, 80002 = Polygon Amoy
        setFeedback("Por favor, conecte sua carteira à rede Polygon ou Polygon Amoy para continuar.");
        setCarregando(false);
        return;
      }
      
      // Usamos o endereço já conectado que foi passado como prop
      setWallet(address);
      const usdtAmount = ethers.parseUnits(usdt, 6);
      
      try {
        // Usamos o endereço já conectado para as operações de aprovação e travamento
        await approveUSDT(null, address, usdtAmount);
        await lockUSDT(null, address, 0, usdtAmount);
        setEscrowOk(true);
        setFeedback("Boleto travado aguardando pagamento! Tempo restante para pagamento: 15 minutos.");
        iniciarTemporizador(15 * 60);
      } catch (innerErr) {
        if (innerErr?.code === 4001 || (innerErr?.message && innerErr.message.toLowerCase().includes("user rejected"))) {
          setFeedback("Transação cancelada pelo usuário na carteira.");
        } else {
          setFeedback("Erro ao processar transação: " + (innerErr?.message || innerErr));
        }
      }
    } catch (err) {
      setFeedback("Erro inesperado: " + (err?.message || err));
    }
    setCarregando(false);
  }

  function iniciarTemporizador(segundos) {
    setFeedback(prev => prev + `\nTempo restante para pagamento: ${Math.floor(segundos/60)} minutos.`);
  }

  return (
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 6, boxShadow: 6, borderRadius: 4, bgcolor: 'background.paper' }}>
      <CardHeader
        avatar={<LockIcon sx={{ color: 'primary.main', fontSize: 36 }} />}
        title={<Typography variant="h5" fontWeight={700} color="primary.main">Cadastrar novo boleto</Typography>}
        subheader={<Typography variant="subtitle1" color="text.secondary">Preencha os dados do boleto para vender e travar o valor em USDT</Typography>}
        sx={{ pb: 0, pt: 3 }}
      />
      <Divider sx={{ mb: 2 }} />
      <CardContent>
        <Box component="form" onSubmit={handleSubmit} autoComplete="off" noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="CPF/CNPJ"
                value={cpfCnpj}
                onChange={e => setCpfCnpj(e.target.value.replace(/\D/g, ""))}
                inputProps={{ maxLength: 18, inputMode: 'numeric', pattern: '[0-9]*' }}
                error={!!cpfCnpjError}
                helperText={cpfCnpjError}
                fullWidth
                margin="normal"
                sx={{ fontSize: '1.3rem', height: 56, mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Código de barras"
                value={codigoBarras}
                onChange={e => setCodigoBarras(e.target.value.replace(/\D/g, ""))}
                inputProps={{
                  maxLength: 48,
                  inputMode: 'numeric',
                  style: { 
                    fontFamily: 'monospace', 
                    letterSpacing: 0.8, 
                    fontSize: 16
                  },
                }}
                required
                fullWidth
                error={!!codigoBarrasError}
                helperText={codigoBarrasError || 'Somente números'}
                sx={{ 
                  fontSize: '1.1rem', 
                  mb: 2, 
                  '& .MuiInputBase-root': {
                    width: '100%',
                  },
                  '& .MuiInputBase-input': {
                    width: '100%',
                    overflow: 'visible'
                  }
                }}
              />
            </Grid>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12}>
                <TextField
                  label="Valor em reais"
                  value={formatarMoeda(valor)}
                  onChange={e => setValor(e.target.value.replace(/\D/g, ""))}
                  required
                  fullWidth
                  margin="normal"
                  InputProps={{
                    inputProps: { min: 0, step: 0.01, style: { textAlign: 'right' } },
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    style: { fontSize: '1.3rem', textAlign: 'right', height: 56 }
                  }}
                  sx={{ 
                    mb: 2,
                    '& .MuiInputBase-root': { height: 56 },
                    '& .MuiInputBase-input': { height: 24 }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Valor em USDT"
                  value={usdt}
                  InputProps={{
                    readOnly: true,
                    startAdornment: <InputAdornment position="start">USDT</InputAdornment>,
                    style: { fontWeight: 'bold', fontSize: '1.3rem', letterSpacing: 1, textAlign: 'right', background: '#f5f5f5', borderRadius: 4, height: 56 }
                  }}
                  fullWidth
                  margin="normal"
                  sx={{ 
                    mb: 2,
                    '& .MuiInputBase-root': { height: 56 },
                    '& .MuiInputBase-input': { height: 24 }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={12} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                  Cotação USDT/BRL: <b>{cotLoading ? <CircularProgress size={14} /> : cotacao ? `R$ ${cotacao}` : '--'}</b>
                </Typography>
                <Button size="small" variant="outlined" color="primary" onClick={buscarCotacao} sx={{ ml: 1 }}>
                  Atualizar cotação
                </Button>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Data de vencimento"
                type="date"
                value={vencimento}
                onChange={e => setVencimento(e.target.value)}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <CalendarMonthIcon sx={{ mr: 1, color: 'primary.main' }} /> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Instituição emissora"
                value={instituicao}
                onChange={e => setInstituicao(e.target.value)}
                required
                fullWidth
                InputProps={{ startAdornment: <AccountBalanceIcon sx={{ mr: 1, color: 'primary.main' }} /> }}
              />
            </Grid>
            {feedback && (
              <Grid item xs={12}>
                <Alert severity={escrowOk ? 'success' : 'error'} sx={{ mb: 2 }}>{feedback}</Alert>
              </Grid>
            )}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                type="button"
                variant={isConnected ? "outlined" : "contained"}
                color={isConnected ? "success" : "primary"}
                size="large"
                startIcon={<AccountBalanceWalletIcon />}
                onClick={handleWalletConnection}
                sx={{ mb: 1 }}
                disabled={carregando}
                fullWidth
              >
                {isConnected && address ? 
                  `Conectado: ${address.slice(0, 6)}...${address.slice(-4)}` : 
                  "Conectar Carteira"}
              </Button>
            </Grid>
            {isConnected && (
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<LockIcon />}
                  onClick={conectarETravar}
                  sx={{ mb: 1 }}
                  disabled={carregando || !usdt || usdt === "0"}
                  fullWidth
                >
                  {carregando ? "Processando..." : "Finalizar e Travar USDT"}
                </Button>
              </Grid>
            )}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                sx={{ mb: 1 }}
                onClick={() => window.location.href = '/'}
                disabled={carregando}
              >
                Fechar
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}

export default BoletoForm;