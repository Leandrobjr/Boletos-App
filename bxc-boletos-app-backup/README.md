# Sistema de Gestão de Boletos - BoletoXCrypto

## Visão Geral

Este projeto implementa um sistema de gestão de boletos com integração de carteiras de criptomoedas, permitindo o pagamento de boletos com travamento de valores em USDT. O sistema possui interfaces para compradores, vendedores e gestores administrativos.

> **IMPORTANTE**: Este repositório contém o protótipo funcional desenvolvido para validação de conceito e interface. A implementação está sendo aprimorada com componentes personalizados e seguirá a integração real com carteiras via wagmi/viem.

## Funcionalidades Principais

### Perfil Comprador
- Cadastro e pagamento de boletos
- Travamento de valores para pagamento imediato
- Upload de comprovantes de pagamento
- Visualização do histórico de boletos pagos
- Acesso ao livro de ordens para pagamento rápido

### Perfil Vendedor
- Cadastro de boletos para recebimento
- Visualização de boletos cadastrados
- Acompanhamento de status de pagamento

### Dashboard de Gestão
- Visão geral de todos os boletos no sistema
- Filtros por status, período e pesquisa
- Visualização de métricas e valores
- Exportação de dados

## Tecnologias Utilizadas

- **Frontend**: React com Vite
- **Estilização**: Tailwind CSS + CSS personalizado
- **Roteamento**: React Router
- **Ícones**: React Icons
- **Integração de Carteiras**: Simulação de WalletConnect/MetaMask
- **Fonte Bitcoin**: Fonte personalizada para elementos de destaque
- **Sistema de Design**: Biblioteca de componentes UI personalizada

## Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis
│   ├── Layout.jsx    # Layout principal com navegação
│   ├── WalletConnector.jsx # Componente de conexão de carteira
│   ├── LivroOrdens.jsx # Componente do livro de ordens
│   ├── HistoricoTransacoes.jsx # Componente de histórico de transações
│   └── ui/           # Componentes de interface do usuário
│       ├── Button.jsx  # Componente de botão reutilizável
│       └── ButtonShowcase.jsx # Demonstração dos botões
├── pages/            # Páginas da aplicação
│   ├── LoginPage.jsx
│   ├── CadastroPage.jsx
│   ├── CompradorPage.jsx
│   ├── VendedorPage.jsx
│   ├── DashboardGestaoPage.jsx
│   └── UIShowcasePage.jsx # Página de demonstração dos componentes UI
├── styles/           # Arquivos de estilo
│   ├── colors.js     # Paleta de cores do projeto
│   └── bitcoin-font.css # Configuração da fonte Bitcoin
├── fonts/            # Arquivos de fonte
│   ├── bitcoin.woff  # Fonte Bitcoin formato WOFF
│   └── bitcoin.woff2 # Fonte Bitcoin formato WOFF2
└── App.jsx          # Configuração de rotas
```

## Identidade Visual

O projeto possui um guia completo de identidade visual documentado no arquivo [IDENTIDADE-VISUAL.md](./IDENTIDADE-VISUAL.md). Este guia inclui:

- **Paleta de Cores**: Escalas completas para verde, laranja Bitcoin e cinzas neutros
- **Tipografia**: Hierarquia de texto e uso da fonte Bitcoin
- **Componentes**: Guia de estilo para botões, cards, tabelas e formulários
- **Espaçamento e Grid**: Sistema de espaçamento consistente
- **Responsividade**: Breakpoints e adaptações para diferentes dispositivos

A implementação da identidade visual pode ser visualizada na página de demonstração UI acessível em `/ui` na aplicação.

## Componentes UI

### Button

O componente `Button` é um componente reutilizável que suporta várias variantes, tamanhos e estados.

```jsx
import Button from '../components/ui/Button';
import { FaPlus } from 'react-icons/fa';

// Uso básico
<Button variant="primary">Botão Primário</Button>

// Com ícone
<Button variant="secondary" leftIcon={<FaPlus />}>Adicionar</Button>

// Tamanhos diferentes
<Button variant="bitcoin" size="sm">Pequeno</Button>
<Button variant="bitcoin" size="lg">Grande</Button>

// Largura total
<Button variant="primary" fullWidth>Botão de largura completa</Button>

// Desabilitado
<Button variant="danger" disabled>Botão Desabilitado</Button>
```

### Página de Demonstração UI

A página de demonstração UI (`/ui`) exibe todos os componentes disponíveis e a paleta de cores do projeto. É uma referência útil para desenvolvedores que trabalham no projeto.

## Resumo das Melhorias

Um resumo detalhado das melhorias implementadas está disponível no arquivo [RESUMO-MELHORIAS.md](./RESUMO-MELHORIAS.md).

## Sobre o Protótipo

Este protótipo foi desenvolvido para validar o conceito e a interface do sistema de gestão de boletos. Ele utiliza:

- **React + Vite**: Para desenvolvimento rápido e eficiente
- **Tailwind CSS v4**: Para estilização moderna e responsiva
- **Simulação de Carteiras**: Implementação simples para demonstrar o fluxo de conexão

O protótipo inclui:
- Interface completa para compradores e vendedores
- Simulação de conexão com carteiras (MetaMask, WalletConnect, Coinbase)
- Cadastro e listagem de boletos
- Histórico de transações com filtros e ordenação
- Livro de ordens para pagamento rápido

## Plano de Implementação Final

A implementação final do projeto utilizará:

### Frontend Aprimorado
- **shadcn UI**: Componentes de UI de alta qualidade e acessíveis
- **Tailwind CSS**: Mantido para estilização consistente
- **TypeScript**: Para maior segurança de tipos e melhor experiência de desenvolvimento

### Integração Real de Carteiras
- **wagmi/viem**: Biblioteca robusta para integração com carteiras Web3
- **Suporte a múltiplas redes**: Ethereum, Polygon, BSC, etc.
- **Conexão segura**: Implementação de padrões de segurança para transações

### Backend e Smart Contracts
- **API RESTful**: Para comunicação com o frontend
- **Smart Contracts**: Implementação de contratos inteligentes para travamento de valores
- **Integração com APIs de pagamento**: Para processamento de boletos

### Segurança e Auditoria
- **Auditoria de código**: Verificação de segurança dos smart contracts
- **Testes automatizados**: Cobertura completa de testes
- **Monitoramento**: Sistema de alertas e monitoramento de transações

## Como Executar

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Execute o servidor de desenvolvimento: `npm run dev`
4. Acesse a aplicação em `http://localhost:5173`

## Estratégia de Migração para o Projeto Real

### Fase 1: Preparação da Base
- Configurar projeto com TypeScript + Vite
- Implementar shadcn UI com tema personalizado
- Configurar sistema de rotas e autenticação

### Fase 2: Migração de Componentes
- Migrar interfaces mantendo a mesma estrutura de páginas
- Substituir componentes atuais por equivalentes do shadcn UI
- Adaptar o CSS para manter a identidade visual

### Fase 3: Integração de Carteiras
- Implementar wagmi/viem para conexão real com carteiras
- Configurar suporte para múltiplas redes blockchain
- Implementar sistema de assinatura de mensagens para autenticação

### Fase 4: Smart Contracts e Backend
- Desenvolver e auditar smart contracts para travamento de valores
- Implementar API para comunicação com serviços de boletos
- Integrar sistema de notificações para atualizações de status

## Notas para Desenvolvedores

### Estrutura de Branches
- `main`: Versão estável do projeto
- `develop`: Branch de desenvolvimento principal
- `feature/*`: Branches para novas funcionalidades
- `hotfix/*`: Correções urgentes

### Padrões de Código
- Utilizar ESLint e Prettier para formatação consistente
- Seguir padrões de nomenclatura camelCase para variáveis e PascalCase para componentes
- Documentar funções e componentes com JSDoc

### Testes
- Implementar testes unitários com Vitest
- Testes de integração com Cypress
- Testes de contrato com Hardhat

## Próximos Passos

- Implementação de backend real para persistência de dados
- Integração com APIs de carteiras de criptomoedas
- Implementação de autenticação e autorização
- Validação de regras de negócio para cálculo de taxas
- Testes automatizados

## Configuração do Git

### Inicialização do Repositório

```bash
# Inicializar o repositório Git
git init

# Adicionar o repositório remoto
git remote add origin [URL_DO_REPOSITÓRIO]

# Criar o branch principal
git checkout -b main
```

### Fluxo de Trabalho Recomendado

1. **Desenvolvimento em branches**:
   ```bash
   # Criar um novo branch para uma feature
   git checkout -b feature/nome-da-feature
   
   # Fazer commits frequentes
   git add .
   git commit -m "feat: descrição da alteração"
   ```

2. **Mesclar alterações**:
   ```bash
   # Atualizar o branch principal
   git checkout main
   git pull origin main
   
   # Mesclar a feature
   git merge feature/nome-da-feature
   ```

3. **Resolver conflitos**:
   - Em caso de conflitos, resolver manualmente os arquivos conflitantes
   - Após resolver, adicionar os arquivos e completar o merge
   ```bash
   git add .
   git commit -m "merge: feature/nome-da-feature em main"
   ```

### Padrões de Commit

Utilizamos o padrão Conventional Commits para mensagens de commit:

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Alterações na documentação
- `style:` - Formatação, ponto e vírgula, etc; sem alteração de código
- `refactor:` - Refatoração de código
- `test:` - Adição ou correção de testes
- `chore:` - Atualizações de tarefas de build, configurações, etc

Exemplo: `feat: adiciona funcionalidade de conexão com carteira`

### Hooks do Git

Recomendamos configurar hooks do Git para garantir qualidade do código:

- **pre-commit**: Executar linting e formatação
- **pre-push**: Executar testes

## Observações

Este projeto atualmente utiliza dados simulados para demonstração das interfaces. Em uma implementação completa, seria necessário integrar com APIs reais para processamento de pagamentos e gestão de boletos.
