# Guia de Identidade Visual - BoletoXCrypto

Este documento define os padrões visuais e de design para o projeto BoletoXCrypto, garantindo consistência em toda a interface e fortalecendo a identidade da marca.

## Paleta de Cores

### Cores Principais

- **Verde Esmeralda** (#00A86B) - Cor primária da marca, representa segurança e confiabilidade
- **Laranja Bitcoin** (#F7931A) - Cor secundária, representa a conexão com o mundo cripto

### Escalas de Cores

Utilizamos escalas completas para cada cor principal, permitindo variações sutis e consistentes:

- **Verdes**: Do mais claro (#E8F5E9) ao mais escuro (#1B5E20)
- **Laranjas/Bitcoin**: Do mais claro (#FFF8E1) ao mais escuro (#F7931A)
- **Cinzas neutros**: Do mais claro (#FAFAFA) ao mais escuro (#212121)

### Aplicação das Cores

- **Fundos principais**: Branco (#FFFFFF) e cinza muito claro (#FAFAFA)
- **Elementos de destaque**: Verde primário (#00A86B) e laranja Bitcoin (#F7931A)
- **Textos**: Cinza escuro (#424242) para texto principal, cinza médio (#757575) para texto secundário
- **Status**: Utilizamos cores específicas para cada status (pendente, confirmado, cancelado, etc.)

## Tipografia

### Fontes

- **Bitcoin Font**: Utilizada para títulos principais e elementos de marca
- **Inter**: Fonte principal para textos e interface
- **System Sans**: Fallback para garantir consistência em todos os dispositivos

### Hierarquia Tipográfica

- **Títulos principais**: 24-32px, Bitcoin Font ou Inter Bold
- **Subtítulos**: 18-24px, Inter Semibold
- **Texto de corpo**: 16px, Inter Regular
- **Texto secundário**: 14px, Inter Regular
- **Texto pequeno/legenda**: 12px, Inter Regular

## Componentes

### Botões

- **Primário**: Fundo verde (#00A86B), texto branco, border-radius 8px
- **Secundário**: Borda verde (#00A86B), texto verde, fundo transparente
- **Terciário**: Sem borda, texto verde, fundo transparente
- **Perigo**: Fundo vermelho (#F44336), texto branco
- **Desabilitado**: Fundo cinza (#BDBDBD), texto cinza escuro

### Cards

- Fundo branco (#FFFFFF)
- Sombra suave: `0 2px 8px rgba(0,0,0,0.05)`
- Border-radius: 12px
- Padding interno: 16-24px

### Tabelas

- Cabeçalho: Fundo cinza claro (#F5F5F5), texto cinza escuro (#424242)
- Linhas alternadas: Branco e cinza muito claro (#FAFAFA)
- Bordas: Cinza claro (#E0E0E0)
- Hover: Fundo verde muito claro (#E8F5E9)

### Formulários

- Campos: Border-radius 8px, borda cinza (#E0E0E0)
- Foco: Borda verde (#00A86B)
- Erro: Borda vermelha (#F44336)
- Placeholder: Texto cinza médio (#9E9E9E)

## Iconografia

- Utilizamos a biblioteca React Icons (conjunto FA)
- Tamanhos padronizados: 16px, 20px, 24px
- Cores consistentes com o contexto (primária, secundária, etc.)

## Espaçamento

Seguimos um sistema de espaçamento baseado em múltiplos de 4:
- 4px - Espaçamento mínimo
- 8px - Espaçamento pequeno
- 16px - Espaçamento médio
- 24px - Espaçamento grande
- 32px - Espaçamento muito grande
- 48px - Espaçamento extra grande

## Responsividade

- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

## Animações e Transições

- Duração padrão: 200-300ms
- Timing function: ease-in-out
- Transições suaves em hover e focus
- Feedback visual para ações do usuário

## Acessibilidade

- Contraste mínimo de 4.5:1 para texto
- Foco visível em todos os elementos interativos
- Textos alternativos para imagens
- Feedback não apenas visual para ações importantes

---

Este guia deve ser consultado e seguido durante todo o desenvolvimento para garantir uma experiência de usuário consistente e profissional.
