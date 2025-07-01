import React from "react";
import LoginButton from './LoginButton';

function LoginGoogle() {
  // Componente simplificado que usa o LoginButton
  // que já contém toda a lógica de autenticação

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <LoginButton variant="primary" size="md" fullWidth={false} />
    </div>
  );
}

export default LoginGoogle;