import React from 'react';
import { FaUser, FaFileInvoiceDollar } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';

/**
 * Página inicial da aplicação
 */
const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-4">Bem-vindo à Plataforma BXC</h1>
      <h2 className="text-xl text-center text-gray-600 mb-8">Sua solução completa para transações seguras</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
          <FaUser className="text-green-600 text-3xl mb-2" />
          <h3 className="text-lg font-semibold mb-2">Para Compradores</h3>
          <p className="text-gray-600 text-center mb-4">Acesse uma plataforma segura para realizar suas compras com total proteção e garantia.</p>
          <RouterLink to={isAuthenticated ? "/app/comprador" : "/login"} className="w-full">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition">Área do Comprador</button>
          </RouterLink>
          <RouterLink to={isAuthenticated ? "/app/vendedor" : "/login"} className="w-full mt-2">
            <button className="w-full bg-lime-500 hover:bg-lime-600 text-green-900 font-semibold py-2 px-4 rounded-lg transition border border-lime-600">QUERO PAGAR BOLETO COM USDT</button>
          </RouterLink>
          <RouterLink to={isAuthenticated ? "/app/comprador" : "/login"} className="w-full mt-2">
            <button className="w-full bg-lime-500 hover:bg-lime-600 text-green-900 font-semibold py-2 px-4 rounded-lg transition border border-lime-600">QUERO COMPRAR USDT</button>
          </RouterLink>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
          <FaFileInvoiceDollar className="text-green-600 text-3xl mb-2" />
          <h3 className="text-lg font-semibold mb-2">Para Vendedores</h3>
          <p className="text-gray-600 text-center mb-4">Cadastre seus boletos e venda com segurança, transparência e agilidade.</p>
          <RouterLink to={isAuthenticated ? "/app/vendedor" : "/login"} className="w-full">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition">Área do Vendedor</button>
          </RouterLink>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
          <FaUser className="text-green-600 text-3xl mb-2" />
          <h3 className="text-lg font-semibold mb-2">Gestão</h3>
          <p className="text-gray-600 text-center mb-4">Acompanhe o histórico de transações, relatórios e gestão de usuários.</p>
          <RouterLink to={isAuthenticated ? "/app/gestao" : "/login"} className="w-full">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition">Dashboard Gestão</button>
          </RouterLink>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
