import React from "react";
import { Box } from '@mui/material';
import LoginButton from './LoginButton';

function LoginGoogle() {
  // Componente simplificado que usa o LoginButton
  // que já contém toda a lógica de autenticação

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <LoginButton 
        variant="contained" 
        size="medium" 
        fullWidth={false} 
      />
    </Box>
  );
}

export default LoginGoogle;