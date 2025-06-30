# Documentação da Landpage (`src/pages/Landpage.jsx`)

## Visão Geral
A Landpage do projeto BoletoXCrypto é a página inicial do sistema, projetada para apresentar o serviço, destacar os diferenciais e direcionar o usuário para as principais ações (Cadastro/Login, Comprador, Vendedor, Gestão). Ela segue o padrão visual do projeto, com foco em clareza, profissionalismo e responsividade.

---

## Estrutura do Arquivo
- **Localização:** `src/pages/Landpage.jsx`
- **Framework:** React
- **Estilização:** Tailwind CSS + estilos inline customizados
- **Componentes Utilizados:**
  - `Link` do `react-router-dom` para navegação

---

## Estrutura do Componente

```jsx
import React from 'react';
import { Link } from 'react-router-dom';

const infoText = `...`;

const Landpage = () => { ... }
export default Landpage;
```

### 1. Header
- Fixo no topo, com fundo branco translúcido e borda verde.
- Título do projeto destacado.
- Navegação para páginas principais (Comprador, Vendedor, Gestão, Cadastro/Login).
- Botões estilizados com bordas arredondadas e cores do projeto.

### 2. Seção Principal
- Título centralizado, fonte grande e cor verde escura.
- Subtítulo explicativo, centralizado, fonte média.
- Dois cards principais lado a lado (responsivos):
  - **PAGAR BOLETO:** Explica o fluxo para quem quer pagar boletos com USDT.
  - **COMPRAR USDT:** Explica o fluxo para quem quer comprar USDT com reais.
- Cada card tem botão de ação levando ao cadastro.

### 3. Caixa de Texto Explicativo
- Caixa horizontal, com fundo verde claro, borda verde e sombra.
- Exibe o texto explicativo principal do serviço (variável `infoText`).
- Texto pode ser alterado facilmente editando a variável no topo do arquivo.

### 4. Rodapé
- Fino, centralizado, com copyright.
- Fundo branco translúcido e bordas arredondadas.

---

## Estilização
- **Tailwind CSS:** Utilizado para espaçamentos, cores, fontes, responsividade e bordas.
- **Estilos Inline:** Usados para gradientes, sombras, bordas e ajustes finos.
- **Cores:**
  - Verde claro: `#d9f99d`, `#bef264`, `#a3e635`, `#65a30d`, `#166534`, `#365314`
  - Branco: para fundos e contraste
  - Cinza: para textos secundários
- **Responsividade:**
  - Cards e layout se adaptam para telas menores (flex-wrap, min/max-width).
  - Padding e margens ajustados para mobile e desktop.

---

## Como Alterar o Texto Explicativo
- O texto principal da caixa explicativa está na variável `infoText` no topo do arquivo.
- Para alterar, basta editar o conteúdo da string, mantendo a formatação desejada.

Exemplo:
```js
const infoText = `* Transações seguras com contratos inteligentes na blockchain.\n**Pagar Boleto com USDT: ...`;
```

---

## Como Alterar Botões e Links
- Os botões de navegação estão no `<header>` e nos cards principais.
- Para mudar o destino ou o texto, edite o componente `<Link>` correspondente.

Exemplo:
```jsx
<Link to="/cadastro" className="bxc-btn bxc-btn-primary">Cadastro/Login</Link>
```

---

## Como Alterar Cores e Estilos
- Para ajustes rápidos, altere as classes Tailwind diretamente nos elementos.
- Para mudanças globais, edite os arquivos em `src/styles/` (ex: `global.css`, `shadcn-theme.css`).
- Gradientes e bordas podem ser ajustados nos estilos inline dos containers.

---

## Dicas de Customização
- **Adicionar novos cards:** Copie um dos blocos de card e ajuste o conteúdo.
- **Alterar layout:** Modifique as propriedades do flexbox ou as classes Tailwind.
- **Mudar fontes:** Altere a propriedade `fontFamily` inline ou nos arquivos de fonte.

---

## Dependências
- `react-router-dom` para navegação.
- Tailwind CSS para estilização.

---

## Observações Finais
- A Landpage foi projetada para ser simples de editar e expandir.
- Siga o padrão visual do projeto para manter a harmonia.
- Para dúvidas ou sugestões, consulte o README principal do projeto ou entre em contato com o responsável pelo frontend. 