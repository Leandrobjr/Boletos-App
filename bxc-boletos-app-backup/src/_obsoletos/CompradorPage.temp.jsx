import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

const CompradorPage = () => {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <div className="bg-lime-300 min-h-screen p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-green-800 text-white p-4 rounded-lg text-center">
          Portal do Comprador
        </h1>
        
        <Card className="mb-6">
          <CardHeader className="bg-green-800 text-white">
            <CardTitle className="text-xl">Boletos Disponíveis</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="mb-4">Clique no botão abaixo para abrir o modal de teste:</p>
            <button 
              className="bg-lime-600 hover:bg-lime-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => setShowModal(true)}
            >
              Abrir Modal
            </button>
          </CardContent>
        </Card>
        
        {/* Modal de teste */}
        {showModal && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              onClick={() => setShowModal(false)}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl border-4 border-lime-600 w-full max-w-md">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">Modal de Teste</h2>
                  <p className="mb-4">Este é um modal de teste para verificar se o problema está resolvido.</p>
                  <button 
                    className="bg-lime-600 hover:bg-lime-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => setShowModal(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompradorPage;
