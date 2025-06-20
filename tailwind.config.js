/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores principais do BoletoXCrypto
        primary: "#00A86B",       // verde esmeralda moderno
        secondary: "#34C759",     // verde maçã
        accent: "#1B5E20",        // verde escuro para destaques
        background: "#FFFFFF",    // fundo branco
        
        // Tons de verde
        greenPrimary: "#00A86B",  // verde esmeralda moderno
        greenSecondary: "#34C759", // verde maçã
        greenLight: "#E8F5E9",    // fundo suave
        greenDark: "#1B5E20",     // elementos de destaque
        
        // Tons de cinza
        grayDark: "#2C3E50",      // textos principais
        grayMedium: "#607D8B",    // textos secundários
        grayLight: "#ECEFF1",     // fundos e bordas
        
        // Cores de status
        error: "#F44336",         // vermelho para erros/cancelados
        success: "#4CAF50",       // verde para sucesso/confirmados
        warning: "#FFC107",       // amarelo para pendente
        info: "#2196F3",          // azul para travado/informativo
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        bitcoin: ['Bitcoin', 'sans-serif']
      },
    },
  },
  plugins: [],
}
