import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

const CompradorPageSimples = () => {
  return (
    <div className="bg-lime-300 min-h-screen p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-green-800 text-white p-4 rounded-lg text-center">
          Portal do Comprador (Versão Simplificada)
        </h1>
        
        <Card>
          <CardHeader className="bg-green-800 text-white">
            <CardTitle className="text-xl">Boletos Disponíveis</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-lg">
              Esta é uma versão simplificada da página do comprador para testar se o problema está na estrutura geral ou em algum componente específico.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompradorPageSimples;
