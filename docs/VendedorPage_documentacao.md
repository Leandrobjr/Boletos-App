# Documentação da Página do Vendedor - BoletoXCrypto

## Visão Geral
A página do Vendedor permite que usuários cadastrem boletos em reais para serem pagos com saldo em USDT, sem taxas. A interface foi recentemente refatorada para melhorar a experiência do usuário, com foco em um fluxo mais direto e intuitivo.

## Estrutura do Arquivo
- **Arquivo**: `VendedorPage.jsx`
- **Backup**: `VendedorPage.backup.jsx` (criado em 20/06/2025)
- **Componente Principal**: `VendedorPage`

## Estado da Aplicação
O componente utiliza os seguintes estados:
- `activeTab`: Controla qual aba está ativa ('cadastrar', 'listar', 'historico')
- `formData`: Armazena os dados do formulário de cadastro de boleto
- `boletos`: Lista de boletos cadastrados pelo usuário

## Funcionalidades Implementadas

### 1. Sistema de Navegação por Abas
- **Cadastrar Boleto**: Formulário para inserção de novos boletos
- **Meus Boletos**: Listagem de boletos cadastrados
- **Histórico de Transações**: Exibe histórico de transações (componente externo)

### 2. Formulário de Cadastro de Boleto
Campos implementados:
- CPF/CNPJ do Beneficiário do Boleto (tamanho: w-64)
- Código de Barras (tamanho: max-w-2xl)
- Valor em R$ (tamanho: w-48)
- Valor em USDT (calculado automaticamente, somente leitura)
- Data de Vencimento (tamanho: w-48)
- Instituição Emissora (tamanho: w-64)

### 3. Validação de Dados
O sistema valida:
- CPF/CNPJ: mínimo de 11 caracteres
- Código de barras: mínimo de 30 caracteres
- Valor: deve ser maior que zero
- Data de vencimento: não pode estar no passado

### 4. Fluxo de Cadastro e Conexão de Carteira
1. Usuário preenche o formulário
2. Clica no botão "Cadastrar e Conectar Carteira"
3. Sistema valida os dados
4. Se válido, cadastra o boleto
5. Chama automaticamente a função `conectarCarteira()`
6. Após conexão bem-sucedida, limpa o formulário e redireciona para a lista de boletos

### 5. Listagem de Boletos
Exibe uma tabela com os boletos cadastrados, contendo:
- Número do boleto
- Código de barras
- Beneficiário e CPF/CNPJ
- Data de vencimento
- Valor em R$
- Instituição emissora
- Status (Pendente/Pago)
- Ações (excluir)

## Estilização Atual
- **Framework CSS**: Tailwind CSS
- **Componentes**: Nativos HTML com classes Tailwind
- **Cores principais**: 
  - Primária: Definida em `colors.primary` (botões principais)
  - Secundária: Definida em `colors.secondary` (botões secundários)
  - Verde: Variações para elementos relacionados a USDT

## Detalhes Técnicos

### Componentes Importados
- React Icons: `FaPlus`, `FaTrash`, `FaWallet`, etc.
- Componente `HistoricoTransacoes` para a aba de histórico

### Funções Principais
1. `handleChange`: Atualiza o estado do formulário
2. `handleSubmit`: Processa o envio do formulário, valida dados e cadastra boleto
3. `conectarCarteira`: Função para integração com Wallet Connector
4. `handleDelete`: Remove boletos da lista

### Estrutura do Objeto Boleto
```javascript
{
  id: Number,
  numeroBoleto: String,
  codigoBarras: String,
  beneficiario: String,
  cpfCnpj: String,
  dataVencimento: String (formato YYYY-MM-DD),
  valor: Number,
  instituicao: String,
  status: String ('Pendente' ou 'Pago')
}
```

## Alterações Recentes
1. Remoção do campo "Beneficiário" do formulário
2. Unificação dos botões "Conectar Carteira" e "Cadastrar" em um único botão
3. Implementação de validação de dados mais robusta
4. Ajuste de tamanhos dos campos conforme tipo de dados
5. Implementação do fluxo automático de cadastro + conexão de carteira

## Próximos Passos Planejados
1. Integração com Shadcn UI para melhorar a consistência visual
2. Implementação real da integração com Wallet Connector
3. Melhorias na validação de dados (máscaras para CPF/CNPJ e código de barras)
4. Feedback visual para erros de validação diretamente nos campos
5. Implementação de testes automatizados

---

*Documentação gerada em 20/06/2025*
