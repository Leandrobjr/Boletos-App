import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../services/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ethers } from "ethers";
import { Container, Typography, Box, Paper, Button, Alert, CircularProgress, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export default function ConfirmacaoCompra() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [boleto, setBoleto] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState("");

  useEffect(() => {
    async function fetchBoleto() {
      setLoading(true);
      const ref = doc(db, "boletos", id);
      const snap = await getDoc(ref);
      if (snap.exists()) setBoleto({ id: snap.id, ...snap.data() });
      setLoading(false);
    }
    fetchBoleto();
  }, [id]);

  async function conectarCarteira() {
    setFeedback("");
    try {
      if (!window.ethereum) {
        setFeedback("MetaMask não encontrada! Instale a extensão para prosseguir.");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      setWallet(address);
      // Atualiza boleto no Firestore
      await updateDoc(doc(db, "boletos", id), { status: "reservado", compradorWallet: address });
      setFeedback("Boleto travado aguardando pagamento!");
      setTimeout(() => navigate("/comprador"), 3500);
    } catch (err) {
      setFeedback("Erro ao conectar carteira: " + err.message);
    }
  }

  if (loading) return (
    <Container maxWidth="md" sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
      <CircularProgress />
    </Container>
  );
  
  if (!boleto) return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Alert severity="error">Boleto não encontrado.</Alert>
    </Container>
  );

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Confirmação de Compra
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Detalhes do Boleto
          </Typography>
          
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 'bold', width: '30%' }}>BENEFICIÁRIO - CPF/CNPJ:</TableCell>
                  <TableCell>{boleto.cpfCnpj}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 'bold' }}>CÓDIGO DE BARRAS:</TableCell>
                  <TableCell>{boleto.codigoBarras}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 'bold' }}>VALOR:</TableCell>
                  <TableCell>R$ {boleto.valor && boleto.valor.toLocaleString('pt-BR', {minimumFractionDigits:2})}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 'bold' }}>DATA VENCIMENTO:</TableCell>
                  <TableCell>{boleto.vencimento && (boleto.vencimento.toDate ? boleto.vencimento.toDate().toLocaleDateString() : new Date(boleto.vencimento).toLocaleDateString())}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
            Quero travar este boleto para pagamento imediato
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              startIcon={<AccountBalanceWalletIcon />}
              onClick={conectarCarteira}
              disabled={loading}
            >
              Conectar Carteira
            </Button>
          </Box>
          
          {feedback && (
            <Alert severity={feedback.includes('travado') || feedback.includes('reservado') ? 'success' : 'error'} sx={{ mt: 2 }}>
              {feedback}
            </Alert>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
