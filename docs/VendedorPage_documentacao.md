# Documentação da Página do Vendedor - BXC Boletos App

## Visão Geral
A página do Vendedor permite que usuários cadastrem boletos em reais para serem pagos com saldo em USDT, sem taxas. A interface foi completamente refatorada para melhorar a experiência do usuário, com foco em um fluxo mais direto e intuitivo, utilizando um esquema de cores verde consistente e componentes Shadcn UI.

## Estrutura do Arquivo
- **Arquivo**: `VendedorPage.jsx`
- **Localização**: `src/pages/VendedorPage.jsx`
- **Componente Principal**: `VendedorPage`

## Estado da Aplicação
O componente utiliza os seguintes estados:
- `activeTab`: Controla qual aba está ativa ('cadastrar', 'listar', 'historico')
- `formData`: Armazena os dados do formulário de cadastro de boleto
- `boletos`: Lista de boletos cadastrados pelo usuário
- `alertInfo`: Gerencia alertas e notificações para o usuário

## Esquema de Cores
A aplicação utiliza um esquema de cores verde consistente:
- **Fundo da página**: `bg-lime-300` (verde claro)
- **Cabeçalhos**: `bg-green-800` (verde escuro) com texto branco
- **Botões**: `bg-lime-600` com hover `bg-lime-700`
- **Abas**: Fundo `bg-lime-300`, aba ativa `bg-lime-600`
- **Status de boletos**: 
  - Pendente: `bg-yellow-100 text-yellow-800`
  - Pago: `bg-green-100 text-green-800`

## Funcionalidades Implementadas

### 1. Sistema de Navegação por Abas
- **Cadastrar Boleto**: Formulário para inserção de novos boletos
- **Meus Boletos**: Listagem de boletos cadastrados (renomeado de "Listar")
- **Histórico de Transações**: Exibe histórico de transações com tabela formatada

### 2. Formulário de Cadastro de Boleto
Campos implementados com larguras controladas:
- **Código de Barras**: `max-width-[480px]`, máximo 48 caracteres
- **CPF/CNPJ do Beneficiário**: `w-64`, máximo 14 caracteres
- **Valor em R$**: `w-48`, tipo numérico com validação
- **Valor em USDT**: `w-48`, calculado automaticamente (taxa fixa 1:5), somente leitura
- **Data de Vencimento**: `w-48`, tipo date com validação
- **Instituição Emissora**: `w-64`, texto livre

### 3. Validação de Dados
O sistema valida:
- **CPF/CNPJ**: mínimo de 11 caracteres
- **Código de barras**: mínimo de 30 caracteres
- **Valor**: deve ser maior que zero
- **Data de vencimento**: não pode estar no passado

### 4. Sistema de Alertas
Implementação de alertas visuais para:
- **Sucesso**: Boleto cadastrado, carteira conectada, boleto pago
- **Erro**: Validação de formulário, erros de conexão
- **Informação**: Instruções e avisos gerais

### 5. Listagem de Boletos ("Meus Boletos")
Exibe uma tabela com os boletos cadastrados, contendo:
- **Nº Boleto**: Número único gerado automaticamente
- **Código de Barras**: Código completo
- **CPF/CNPJ**: Identificador do beneficiário
- **Data Venc/to**: Data de vencimento formatada
- **Data Pag/to**: Data de pagamento ou "-" se pendente
- **Valor (R$)**: Valor formatado em reais
- **Status**: Badge visual (verde para pago, amarelo para pendente)
- **Ações**: Botões para pagar e excluir

### 6. Histórico de Transações
Componente `HistoricoTransacoes` com:
- **Filtros**: Por data, tipo de operação
- **Tabela**: Com espaçamento adequado entre colunas (p-4)
- **Resumo**: Tabela de dados com linhas de grade mostrando:
  - Total de Transações
  - Valor Total
  - Total de Taxas

## Componentes UI Utilizados
Todos os componentes da biblioteca Shadcn UI:
- **Card, CardHeader, CardTitle, CardDescription, CardContent**: Para containers
- **Input, Label**: Para campos de formulário
- **Tabs, TabsList, TabsTrigger, TabsContent**: Para navegação por abas
- **Alert, AlertTitle, AlertDescription**: Para notificações
- **Button**: Para ações (substituindo botões nativos)

## Funções Principais
1. `handleChange`: Atualiza o estado do formulário
2. `handleSubmit`: Processa o envio do formulário com validação
3. `conectarCarteira`: Simula conexão com carteira e exibe alerta de sucesso
4. `handleDelete`: Remove boletos da lista com confirmação visual
5. `handlePay`: Marca boletos como pagos e atualiza a data de pagamento

## Estrutura do Objeto Boleto
```javascript
{
  id: Number,
  numeroBoleto: String, // Gerado automaticamente
  codigoBarras: String,
  cpfCnpj: String, // Unificado como identificador do beneficiário
  dataVencimento: String, // Formato YYYY-MM-DD
  valor: Number,
  instituicao: String, // Mantido no objeto mas não exibido na tabela
  status: String // 'Pendente' ou 'Pago'
}
```

## Responsividade
- Layout adaptável para diferentes tamanhos de tela
- Tabelas com `overflow-auto` para visualização em dispositivos móveis
- Campos de formulário com larguras controladas para evitar distorções
- Grid responsivo para organização dos campos em diferentes breakpoints

## Alterações Recentes
1. **Esquema de cores**: Padronização com verde escuro para cabeçalhos, verde médio para botões e verde claro para fundo
2. **Renomeação**: Aba "Listar" para "Meus Boletos"
3. **Campos**: 
   - Renomeação de "Beneficiário" para "CPF/CNPJ do Beneficiário"
   - Remoção do campo separado para beneficiário
4. **Tabela de boletos**:
   - Adição da coluna "Data Pag/to"
   - Renomeação de "Data de Vencimento" para "Data Venc/to"
   - Remoção da coluna "Instituição" (mantida no estado)
5. **Componentes**: Substituição de botões nativos por componentes Shadcn UI Button
6. **Histórico**: Melhoria no espaçamento da tabela e criação de tabela de resumo com linhas de grade
7. **Cabeçalho**: Simplificação do título da página "Meus Boletos"

## Próximos Passos Planejados
1. Implementação real da integração com carteiras de criptomoedas
2. Adição de máscaras para CPF/CNPJ e código de barras
3. Implementação de paginação para tabelas com muitos registros
4. Adição de filtros na listagem de boletos
5. Implementação de testes automatizados
6. Integração com API de cotação de criptomoedas para cálculo dinâmico de valores

---

*Documentação atualizada em 23/06/2025*
