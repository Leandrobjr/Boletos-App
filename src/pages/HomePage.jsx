import React from 'react';
import { Container, Typography, Box, Paper, Grid, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

/**
 * Página inicial da aplicação
 */
const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Bem-vindo à Plataforma BXC
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
          Sua solução completa para transações seguras
        </Typography>
        
        <Box sx={{ mt: 6, mb: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h5" component="h3" gutterBottom>
                  Para Compradores
                </Typography>
                <Typography variant="body1" paragraph>
                  Acesse uma plataforma segura para realizar suas compras com total proteção e garantia.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={RouterLink} 
                  to={isAuthenticated ? "/comprador" : "/login"}
                  fullWidth
                >
                  Área do Comprador
                </Button>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h5" component="h3" gutterBottom>
                  Para Vendedores
                </Typography>
                <Typography variant="body1" paragraph>
                  Gerencie suas vendas, acompanhe pagamentos e organize seus produtos em um só lugar.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={RouterLink} 
                  to={isAuthenticated ? "/vendedor" : "/login"}
                  fullWidth
                >
                  Área do Vendedor
                </Button>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h5" component="h3" gutterBottom>
                  Sua Conta
                </Typography>
                <Typography variant="body1" paragraph>
                  Acesse seu perfil, gerencie seus dados e acompanhe seu histórico de transações.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={RouterLink} 
                  to={isAuthenticated ? "/perfil" : "/login"}
                  fullWidth
                >
                  {isAuthenticated ? "Meu Perfil" : "Entrar"}
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;
