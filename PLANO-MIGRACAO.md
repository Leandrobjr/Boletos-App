# Plano de Migração - BXC Boletos

Este documento detalha o plano de migração do protótipo atual para a implementação final do sistema BXC Boletos, utilizando shadcn UI e integração real de carteiras via wagmi/viem.

## 1. Análise do Protótipo Atual

### Componentes Existentes
- **WalletConnector**: Simulação de conexão com carteiras (MetaMask, WalletConnect, Coinbase)
- **LivroOrdens**: Exibição de boletos disponíveis para pagamento rápido
- **HistoricoTransacoes**: Visualização de histórico de transações com filtros
- **Páginas**: Comprador, Vendedor, Dashboard, Login, Cadastro

### Tecnologias Utilizadas
- React + Vite
- Tailwind CSS v4
- React Router
- React Icons

## 2. Estrutura da Nova Implementação

### Tecnologias a Serem Adotadas
- **TypeScript**: Para tipagem estática e melhor manutenção
- **shadcn UI**: Componentes de UI acessíveis e personalizáveis
- **wagmi/viem**: Biblioteca para integração com carteiras Web3
- **Ethers.js**: Para interação com smart contracts
- **React Query**: Para gerenciamento de estado e cache
- **Zustand**: Para gerenciamento de estado global

### Estrutura de Diretórios Proposta
```
src/
├── components/       # Componentes reutilizáveis
│   ├── ui/           # Componentes shadcn UI
│   ├── wallet/       # Componentes de carteira
│   ├── boletos/      # Componentes específicos de boletos
│   └── layout/       # Componentes de layout
├── hooks/            # Hooks personalizados
│   ├── useWallet.ts  # Hook para gerenciar conexão de carteira
│   └── useBoletos.ts # Hook para operações com boletos
├── pages/            # Páginas da aplicação
├── contracts/        # ABIs e endereços de contratos
├── config/           # Configurações (wagmi, redes, etc.)
├── utils/            # Funções utilitárias
└── styles/           # Estilos globais
```

## 3. Plano de Migração Detalhado

### Fase 1: Configuração Inicial (Semana 1)
1. **Configuração do Projeto**
   - Criar novo projeto com Vite + TypeScript
   - Configurar ESLint, Prettier e husky para hooks de git
   - Configurar Tailwind CSS e shadcn UI

2. **Configuração de Autenticação**
   - Implementar sistema de autenticação baseado em carteiras
   - Configurar provedores wagmi para conexão de carteiras
   - Criar hooks personalizados para gerenciar estado de autenticação

### Fase 2: Migração de Componentes (Semanas 2-3)
1. **Componentes de UI Base**
   - Migrar layout principal com navegação
   - Implementar tema personalizado para shadcn UI
   - Criar componentes base (botões, inputs, modais)

2. **Componentes Específicos**
   - Recriar WalletConnector usando wagmi/viem
   - Migrar LivroOrdens com dados simulados
   - Migrar HistoricoTransacoes com filtros e ordenação
   - Implementar componentes de formulários para cadastro de boletos

### Fase 3: Integração com Blockchain (Semanas 4-5)
1. **Smart Contracts**
   - Desenvolver contratos para travamento de valores
   - Implementar sistema de escrow para pagamentos
   - Configurar interação com contratos via ethers.js

2. **Integração de Carteiras**
   - Implementar suporte para múltiplas redes
   - Configurar sistema de assinatura para autenticação
   - Implementar detecção de mudança de rede e conta

### Fase 4: Backend e APIs (Semanas 6-7)
1. **API RESTful**
   - Desenvolver endpoints para gerenciamento de boletos
   - Implementar sistema de notificações
   - Criar serviços para integração com provedores de boletos

2. **Integração com Serviços Externos**
   - Conectar com APIs de bancos para validação de boletos
   - Implementar sistema de monitoramento de transações blockchain
   - Configurar serviços de indexação para eventos de contratos

### Fase 5: Testes e Otimização (Semanas 8-9)
1. **Testes**
   - Implementar testes unitários para componentes e hooks
   - Criar testes de integração para fluxos principais
   - Testar contratos em ambiente de teste

2. **Otimização**
   - Melhorar performance de renderização
   - Implementar lazy loading para rotas
   - Otimizar interações com blockchain

### Fase 6: Lançamento (Semana 10)
1. **Preparação para Produção**
   - Configurar ambientes de staging e produção
   - Implementar monitoramento e logging
   - Realizar auditoria de segurança

2. **Documentação**
   - Documentar APIs e componentes
   - Criar guias de uso para desenvolvedores
   - Preparar material de treinamento para usuários

## 4. Comparativo de Implementações

| Aspecto | Protótipo Atual | Implementação Final |
|---------|----------------|---------------------|
| **UI/UX** | Tailwind CSS básico | shadcn UI + Tailwind CSS |
| **Carteiras** | Simulação | Integração real via wagmi/viem |
| **Tipagem** | JavaScript | TypeScript |
| **Contratos** | Não implementado | Smart contracts em Solidity |
| **Backend** | Simulado | API RESTful + Blockchain |
| **Segurança** | Básica | Auditada e testada |

## 5. Considerações Importantes

### Compatibilidade
- Garantir que a interface mantenha a mesma experiência do protótipo
- Preservar fluxos de usuário já validados
- Manter compatibilidade com diferentes navegadores e dispositivos

### Segurança
- Implementar práticas seguras para interação com carteiras
- Auditar contratos antes do deploy em produção
- Seguir padrões de segurança para autenticação e autorização

### Performance
- Otimizar carregamento inicial da aplicação
- Minimizar interações com a blockchain
- Implementar estratégias de cache para dados frequentemente acessados

## 6. Próximos Passos Imediatos

1. Configurar ambiente de desenvolvimento com as novas tecnologias
2. Migrar o componente WalletConnector para usar wagmi/viem
3. Implementar primeiro contrato de teste para travamento de valores
4. Criar versão inicial do tema shadcn UI personalizado
