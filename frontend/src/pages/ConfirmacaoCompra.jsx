import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../services/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { FaWallet } from 'react-icons/fa';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useChainId, useChains } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

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
      // Remover toda lógica baseada em window.ethereum e ethers.BrowserProvider
      // Utilizar apenas hooks do wagmi e RainbowKit para conexão, endereço e rede
      setFeedback("Boleto travado aguardando pagamento!");
      setTimeout(() => navigate("/comprador"), 3500);
    } catch (err) {
      setFeedback("Erro ao conectar carteira: " + err.message);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
    </div>
  );
  
  if (!boleto) return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Erro!</strong>
        <span className="block sm:inline">Boleto não encontrado.</span>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Confirmação de Compra</h1>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-bold mb-4">Detalhes do Boleto</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">BENEFICIÁRIO - CPF/CNPJ:</label>
            <span className="ml-2 text-gray-500">{boleto.cpfCnpj}</span>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">CÓDIGO DE BARRAS:</label>
            <span className="ml-2 text-gray-500">{boleto.codigoBarras}</span>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">VALOR:</label>
            <span className="ml-2 text-gray-500">R$ {(boleto.valor !== undefined && boleto.valor !== null) ? boleto.valor.toLocaleString('pt-BR', {minimumFractionDigits:2}) : '--'}</span>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">DATA VENCIMENTO:</label>
            <span className="ml-2 text-gray-500">{boleto.vencimento && (boleto.vencimento.toDate ? boleto.vencimento.toDate().toLocaleDateString() : new Date(boleto.vencimento).toLocaleDateString())}</span>
          </div>
          
          <div className="mt-4 text-center">
            <button 
              className="bg-primary text-white px-4 py-2 rounded-md"
              onClick={conectarCarteira}
              disabled={loading}
            >
              <FaWallet className="inline-block mr-2" size={20} />
              Conectar Carteira
            </button>
          </div>
          
          {feedback && (
            <div className={`mt-2 p-2 rounded-md ${feedback.includes('travado') || feedback.includes('reservado') ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
              {feedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
