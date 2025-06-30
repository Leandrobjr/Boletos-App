import React, { useEffect, useState } from "react";
import { db } from "../services/firebaseConfig";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { releaseEscrow } from "../services/escrowService";
import { useAccount, usePublicClient } from "wagmi";
import { 
  Box, 
  Typography, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Button, 
  Alert, 
  CircularProgress, 
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '../components/AuthProvider';

/**
 * Componente que exibe a lista de boletos cadastrados pelo vendedor
 */
function MeusBoletos() {
  const { user } = useAuth();
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBoleto, setSelectedBoleto] = useState(null);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [processandoBaixa, setProcessandoBaixa] = useState(false);
  const [mensagemBaixa, setMensagemBaixa] = useState(null);
  const [sucessoBaixa, setSucessoBaixa] = useState(false);
  
  // Integração com carteira Web3
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();

  // Função para formatar data
  const formatarData = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return data.toLocaleDateString('pt-BR');
    } catch (error) {
      return "Data inválida";
    }
  };

  // Função para formatar valor em reais
  const formatarMoeda = (valor) => {
    if (valor === undefined || valor === null) return "R$ 0,00";
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Buscar boletos do vendedor atual
  const buscarBoletos = async () => {
    if (!user?.uid) {
      setError("Usuário não autenticado");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const q = query(collection(db, "boletos"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      const boletosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setBoletos(boletosData);
    } catch (error) {
      console.error("Erro ao buscar boletos:", error);
      setError("Erro ao carregar boletos. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  // Carregar boletos quando o componente montar
  useEffect(() => {
    buscarBoletos();
  }, [user]);

  // Abrir diálogo de confirmação para exclusão
  const handleConfirmDelete = (boleto) => {
    setSelectedBoleto(boleto);
    setOpenDialog(true);
  };

  // Fechar diálogo de confirmação
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Excluir boleto
  const handleDeleteBoleto = async () => {
    if (!selectedBoleto) return;
    
    try {
      // Em vez de excluir o documento, atualizamos o status para "excluido"
      const boletoRef = doc(db, "boletos", selectedBoleto.id);
      await updateDoc(boletoRef, {
        status: "excluido",
        dataExclusao: new Date()
      });
      
      // Atualiza a lista de boletos
      buscarBoletos();
      setOpenDialog(false);
      setSelectedBoleto(null);
      setError("");
      setMensagemBaixa({ tipo: "success", texto: "Boleto excluído com sucesso!" });
    } catch (error) {
      console.error("Erro ao excluir boleto:", error);
      setError("Erro ao excluir boleto. Tente novamente mais tarde.");
    }
  };

  // Visualizar comprovante
  const handleViewComprovante = (boleto) => {
    if (boleto.comprovanteUrl) {
      setSelectedImage(boleto.comprovanteUrl);
      setOpenImageDialog(true);
    }
  };
  
  // Baixar boleto pago
  const handleBaixarBoleto = async (boleto) => {
    if (!isConnected) {
      setMensagemBaixa({ tipo: "error", texto: "Conecte sua carteira para baixar o boleto" });
      return;
    }
    
    if (!boleto.comprovanteUrl) {
      setMensagemBaixa({ tipo: "error", texto: "Este boleto ainda não possui comprovante de pagamento" });
      return;
    }
    
    if (boleto.status !== "aguardando_baixa") {
      setMensagemBaixa({ tipo: "error", texto: `Não é possível baixar um boleto com status ${traduzirStatus(boleto.status)}` });
      return;
    }
    
    setProcessandoBaixa(true);
    setMensagemBaixa(null);
    setSucessoBaixa(false);
    
    try {
      // Chama a função do contrato para liberar o escrow
      const result = await releaseEscrow(publicClient, boleto.escrowId);
      
      if (result.success) {
        // Atualiza o status do boleto no Firestore
        const boletoRef = doc(db, "boletos", boleto.id);
        await updateDoc(boletoRef, {
          status: "baixado",
          dataBaixa: new Date()
        });
        
        // Atualiza a lista de boletos
        buscarBoletos();
        
        setMensagemBaixa({ tipo: "success", texto: "Boleto baixado com sucesso! USDT liberado para o comprador." });
        setSucessoBaixa(true);
      } else {
        setMensagemBaixa({ tipo: "error", texto: result.message });
      }
    } catch (error) {
      console.error("Erro ao baixar boleto:", error);
      setMensagemBaixa({ tipo: "error", texto: `Erro ao baixar boleto: ${error.message || error}` });
    } finally {
      setProcessandoBaixa(false);
    }
  };

  // Traduzir status do boleto
  const traduzirStatus = (status) => {
    const statusMap = {
      'disponivel': 'DISPONÍVEL',
      'aguardando_pagamento': 'AGUARDANDO PAGAMENTO',
      'aguardando_baixa': 'AGUARDANDO BAIXA',
      'baixado': 'BAIXADO',
      'excluido': 'EXCLUÍDO',
      'disputa': 'DISPUTA',
      'vencido': 'VENCIDO'
    };
    
    return statusMap[status] || status;
  };
  
  // Verificar se o boleto está vencido
  const verificarBoletoVencido = (boleto) => {
    if (!boleto.vencimento) return false;
    
    const dataVencimento = boleto.vencimento.toDate ? boleto.vencimento.toDate() : new Date(boleto.vencimento);
    const hoje = new Date();
    
    // Se o boleto já está com status vencido, retorna true
    if (boleto.status === 'vencido') return true;
    
    // Se o boleto está disponível e a data de vencimento é anterior à data atual
    if (boleto.status === 'disponivel' && dataVencimento < hoje) {
      return true;
    }
    
    return false;
  };

  // Obter cor do status
  const getStatusColor = (status) => {
    const colorMap = {
      'disponivel': '#4CAF50',    // Verde
      'aguardando_pagamento': '#FFA500', // Laranja
      'aguardando_baixa': '#3498db',    // Azul
      'baixado': '#2ecc71',       // Verde claro
      'excluido': '#9e9e9e',      // Cinza
      'disputa': '#e74c3c',       // Vermelho
      'vencido': '#8e44ad'        // Roxo
    };
    
    return colorMap[status] || '#777777';
  };

  return (
    <Card sx={{ width: '100%', boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
      <CardHeader
        title={
          <Typography variant="h5" component="h2" fontWeight="bold" color="primary">
            MEUS BOLETOS
          </Typography>
        }
        sx={{ bgcolor: 'background.paper', borderBottom: '1px solid #e0e0e0', pb: 1 }}
      />
      
      <CardContent sx={{ p: 0 }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        
        {mensagemBaixa && (
          <Alert severity={mensagemBaixa.tipo} sx={{ m: 2 }}>
            {mensagemBaixa.texto}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Carregando boletos...
            </Typography>
          </Box>
        ) : boletos.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              Você ainda não cadastrou nenhum boleto.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nº BOLETO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>COD. BARRAS</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>BENEFICIÁRIO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>DATA VENC.</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>DATA PAG/TO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>VALOR (R$)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>VALOR TRAVADO (USDT)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>TAXA DE SERVIÇO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>COMPROVANTE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>BAIXAR BOLETO PAGO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>EXCLUIR BOLETO</TableCell>
                </TableRow>
              </TableHead>
              
              <TableBody>
                {boletos.map((boleto) => (
                  <TableRow key={boleto.id} hover>
                    <TableCell>{boleto.numeroControle || '---'}</TableCell>
                    <TableCell>
                      <Box 
                        sx={{ 
                          display: 'inline-block',
                          bgcolor: verificarBoletoVencido(boleto) ? getStatusColor('vencido') : getStatusColor(boleto.status),
                          color: 'white',
                          borderRadius: '4px',
                          px: 1,
                          py: 0.5,
                          fontWeight: 'medium'
                        }}
                      >
                        {verificarBoletoVencido(boleto) ? traduzirStatus('vencido') : traduzirStatus(boleto.status)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.8rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '150px'
                        }}
                      >
                        {boleto.codigoBarras}
                      </Typography>
                    </TableCell>
                    <TableCell>{boleto.cpfCnpj}</TableCell>
                    <TableCell>{formatarData(boleto.vencimento)}</TableCell>
                    <TableCell>{boleto.dataPagamento ? formatarData(boleto.dataPagamento) : '---'}</TableCell>
                    <TableCell>{formatarMoeda(boleto.valor)}</TableCell>
                    <TableCell>{boleto.valorUsdt ? `${boleto.valorUsdt} USDT` : '---'}</TableCell>
                    <TableCell>{boleto.taxaServico ? `${boleto.taxaServico}%` : '1%'}</TableCell>
                    <TableCell align="center">
                      {boleto.comprovanteUrl ? (
                        <Tooltip title="Ver comprovante">
                          <IconButton 
                            color="primary" 
                            onClick={() => handleViewComprovante(boleto)}
                            size="small"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          ---
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        disabled={boleto.status !== 'aguardando_baixa' || !boleto.comprovanteUrl || processandoBaixa}
                        onClick={() => handleBaixarBoleto(boleto)}
                        sx={{ fontWeight: 'bold', borderRadius: 2 }}
                      >
                        {processandoBaixa ? "Processando..." : "BAIXAR BOLETO PAGO"}
                      </Button>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Excluir boleto">
                        <IconButton 
                          color="error" 
                          onClick={() => handleConfirmDelete(boleto)}
                          disabled={boleto.status !== 'disponivel'}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>

      {/* Diálogo de confirmação para exclusão */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
      >
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este boleto? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDeleteBoleto} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para visualização do comprovante */}
      <Dialog
        open={openImageDialog}
        onClose={() => setOpenImageDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Comprovante de Pagamento</DialogTitle>
        <DialogContent>
          {selectedImage ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <img 
                src={selectedImage} 
                alt="Comprovante de pagamento" 
                style={{ maxWidth: '100%', maxHeight: '70vh' }} 
              />
            </Box>
          ) : (
            <Typography>Imagem não disponível</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImageDialog(false)} color="primary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default MeusBoletos;
