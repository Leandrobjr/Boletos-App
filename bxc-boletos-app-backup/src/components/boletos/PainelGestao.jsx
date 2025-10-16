import React, { useEffect, useState } from "react";
import { db } from "../services/firebaseConfig";
import { collection, query, getDocs } from "firebase/firestore";
import {
  Card, CardHeader, CardContent, Typography, Table, TableHead, TableRow, TableCell, 
  TableBody, Button, Alert, CircularProgress, Box, Divider, IconButton, Tooltip
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Função para formatar data
function formatDate(timestamp) {
  if (!timestamp) return "—";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('pt-BR');
}

// Função para formatar valores monetários
function formatCurrency(value) {
  if (value === undefined || value === null) return "—";
  return (typeof value === 'number' ? value : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função para formatar valores em USDT
function formatUSDT(value) {
  if (value === undefined || value === null) return "—";
  return (typeof value === 'number' ? value : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USDT";
}

function PainelGestao() {
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // Buscar dados dos boletos
  useEffect(() => {
    const fetchBoletos = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "boletos"));
        const snapshot = await getDocs(q);
        const boletosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBoletos(boletosData);
        setErro("");
      } catch (error) {
        console.error("Erro ao buscar boletos:", error);
        setErro("Falha ao carregar os dados. Por favor, tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchBoletos();
  }, []);

  // Função para visualizar o comprovante
  const visualizarComprovante = (comprovante) => {
    if (comprovante) {
      window.open(comprovante, '_blank');
    }
  };

  return (
    <Card sx={{ maxWidth: 1200, mx: 'auto', mt: 4, boxShadow: 3, borderRadius: 2 }}>
      <CardHeader
        avatar={<ReceiptIcon sx={{ color: 'primary.main', fontSize: 36 }} />}
        title={<Typography variant="h5" fontWeight={700} color="primary.main">GESTÃO</Typography>}
        sx={{ pb: 1, pt: 2 }}
      />
      <Divider />
      
      <CardContent>
        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>Carregando dados...</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" aria-label="tabela de gestão de boletos">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell align="center"><Typography fontWeight="bold">Nº BOLETO</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight="bold">STATUS</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight="bold">COD. BARRAS</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight="bold">BENEFICIÁRIO</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight="bold">DATA VENC.</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight="bold">DATA PAG/TO</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight="bold">VALOR PAGO(R$)</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight="bold">COMPROVANTE</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight="bold">VALOR TRAVADO(USDT)</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight="bold">TAXA DE SERVIÇO</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight="bold">VALOR LIQ. REPASSE</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {boletos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Nenhum boleto encontrado.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  boletos.map((boleto) => (
                    <TableRow key={boleto.id} hover>
                      <TableCell align="center">{boleto.numeroControle || "—"}</TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            bgcolor: 
                              boleto.status === 'BAIXADO' ? 'success.light' :
                              boleto.status === 'DISPONIVEL' ? 'warning.light' :
                              boleto.status === 'AGUARDANDO PAGAMENTO' ? 'info.light' : 'grey.light',
                            borderRadius: 1,
                            px: 1,
                            py: 0.5,
                            display: 'inline-block'
                          }}
                        >
                          {(boleto.status || "—").replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())}
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Tooltip title={boleto.codigoBarras || "Não disponível"}>
                          <span>{boleto.codigoBarras ? `${boleto.codigoBarras.substring(0, 10)}...` : "—"}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">{boleto.beneficiario || "—"}</TableCell>
                      <TableCell align="center">{formatDate(boleto.vencimento)}</TableCell>
                      <TableCell align="center">{formatDate(boleto.dataPagamento)}</TableCell>
                      <TableCell align="center">{formatCurrency(boleto.valorPago)}</TableCell>
                      <TableCell align="center">
                        {boleto.comprovante ? (
                          <IconButton 
                            color="primary" 
                            size="small" 
                            onClick={() => visualizarComprovante(boleto.comprovante)}
                            aria-label="visualizar comprovante"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        ) : "—"}
                      </TableCell>
                      <TableCell align="center">{formatUSDT(boleto.valorTravado)}</TableCell>
                      <TableCell align="center">{formatCurrency(boleto.taxaServico)}</TableCell>
                      <TableCell align="center">{formatCurrency(boleto.valorLiquidoRepasse)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default PainelGestao;
