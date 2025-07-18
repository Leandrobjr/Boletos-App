import React from 'react';
import ButtonShowcase from '../components/ui/ButtonShowcase';
import { colors } from '../styles/colors';

/**
 * Página de demonstração dos componentes UI do BoletoXCrypto
 */
const UIShowcasePage = () => {
  return (
    <div className="space-y-8">
      <div className="border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold bitcoin-font" style={{ color: colors.primary }}>
          Biblioteca de Componentes UI
        </h1>
        <p className="text-lg mt-2" style={{ color: colors.gray[600] }}>
          Demonstração dos componentes UI do BoletoXCrypto seguindo o guia de identidade visual
        </p>
      </div>

      {/* Paleta de cores */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Paleta de Cores</h2>
        
        <div className="space-y-6">
          {/* Cores principais */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Cores Principais</h3>
            <div className="flex flex-wrap gap-4">
              <ColorSwatch color={colors.primary} name="Primary" hex="#00A86B" />
              <ColorSwatch color={colors.secondary} name="Secondary" hex="#F7931A" />
            </div>
          </div>
          
          {/* Escala de verdes */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Escala de Verdes</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(colors.green).map(([key, value]) => (
                <ColorSwatch key={key} color={value} name={`Green ${key}`} hex={value} />
              ))}
            </div>
          </div>
          
          {/* Escala Bitcoin */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Escala Bitcoin</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(colors.bitcoin).map(([key, value]) => (
                <ColorSwatch key={key} color={value} name={`Bitcoin ${key}`} hex={value} />
              ))}
            </div>
          </div>
          
          {/* Escala de cinzas */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Escala de Cinzas</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(colors.gray).map(([key, value]) => (
                <ColorSwatch key={key} color={value} name={`Gray ${key}`} hex={value} />
              ))}
            </div>
          </div>
          
          {/* Cores de status */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Cores de Status</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(colors.status).map(([key, value]) => (
                <ColorSwatch key={key} color={value} name={key} hex={value} />
              ))}
            </div>
          </div>
          
          {/* Cores de feedback */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Cores de Feedback</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(colors.feedback).map(([key, value]) => (
                <ColorSwatch key={key} color={value} name={key} hex={value} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tipografia */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Tipografia</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Bitcoin Font</h3>
            <p className="text-3xl bitcoin-font" style={{ color: colors.secondary }}>BoletoXCrypto</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Hierarquia de Texto</h3>
            <div className="space-y-2">
              <p className="text-3xl font-bold">Título Principal (24-32px)</p>
              <p className="text-2xl font-semibold">Subtítulo (18-24px)</p>
              <p className="text-base">Texto de corpo (16px)</p>
              <p className="text-sm" style={{ color: colors.gray[600] }}>Texto secundário (14px)</p>
              <p className="text-xs" style={{ color: colors.gray[500] }}>Texto pequeno/legenda (12px)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Botões */}
      <section className="mb-10">
        <ButtonShowcase />
      </section>
    </div>
  );
};

// Componente auxiliar para exibir amostras de cores
const ColorSwatch = ({ color, name, hex }) => {
  const textColor = isLightColor(color) ? '#000000' : '#FFFFFF';
  
  return (
    <div className="flex flex-col items-center">
      <div 
        className="w-16 h-16 rounded-md shadow-sm flex items-center justify-center mb-2"
        style={{ backgroundColor: color, color: textColor }}
      >
        <span className="text-xs font-medium">{name}</span>
      </div>
      <span className="text-xs">{hex}</span>
    </div>
  );
};

// Função auxiliar para determinar se uma cor é clara ou escura
const isLightColor = (color) => {
  // Converte hex para RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calcula a luminância
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Retorna true se a cor for clara (luminância > 0.5)
  return luminance > 0.5;
};

export default UIShowcasePage;
