import React from 'react';
import Button from './Button';
import { FaPlus, FaArrowRight, FaDownload, FaTrash, FaCheck, FaBitcoin } from 'react-icons/fa';

/**
 * Componente de demonstração para exibir as diferentes variantes do botão
 */
const ButtonShowcase = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Biblioteca de Botões</h2>
      
      <div className="space-y-8">
        {/* Variantes */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Variantes</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primário</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="tertiary">Terciário</Button>
            <Button variant="danger">Perigo</Button>
            <Button variant="success">Sucesso</Button>
            <Button variant="bitcoin">Bitcoin</Button>
          </div>
        </div>
        
        {/* Tamanhos */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Tamanhos</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" size="sm">Pequeno</Button>
            <Button variant="primary" size="md">Médio</Button>
            <Button variant="primary" size="lg">Grande</Button>
          </div>
        </div>
        
        {/* Estados */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Estados</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Normal</Button>
            <Button variant="primary" disabled>Desabilitado</Button>
          </div>
        </div>
        
        {/* Largura completa */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Largura completa</h3>
          <div className="space-y-2">
            <Button variant="primary" fullWidth>Botão de largura completa</Button>
            <Button variant="secondary" fullWidth>Botão secundário de largura completa</Button>
          </div>
        </div>
        
        {/* Com ícones */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Com ícones</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" leftIcon={<FaPlus />}>Adicionar</Button>
            <Button variant="secondary" rightIcon={<FaArrowRight />}>Continuar</Button>
            <Button variant="tertiary" leftIcon={<FaDownload />}>Baixar</Button>
            <Button variant="danger" leftIcon={<FaTrash />}>Excluir</Button>
            <Button variant="success" leftIcon={<FaCheck />}>Confirmar</Button>
            <Button variant="bitcoin" leftIcon={<FaBitcoin />}>Conectar carteira</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ButtonShowcase;
