# Documentação de Implementações — BoletoXCrypto

## 1. Instalação e Configuração do Banco de Dados

- **Banco:** PostgreSQL (NeonDB)
- **Configuração:**  
  - Arquivo: `backend-bxc/index.cjs`
  - Utilização do pacote `pg` para conexão.
  - Criação das tabelas `usuarios` e `boletos` via rotas `/criar-tabela` e `/criar-tabela-boletos`.
  - Campos principais: `id`, `uid`, `cpf_cnpj`, `codigo_barras`, `valor`, `vencimento`, `instituicao`, `status`, `criado_em`, `numero_controle`.

## 2. Backend — Funcionalidades e Rotas

- **Cadastro e atualização de usuários:**  
  - Rota: `POST /perfil`  
  - Atualiza ou insere dados do usuário.

- **Cadastro de boletos:**  
  - Rota: `POST /boletos`  
  - Validação de dados, formatação de datas, status inicial padronizado.

- **Listagem de boletos:**  
  - Rota: `GET /boletos`  
  - Rota: `GET /boletos/usuario/:uid`  
  - Conversão de status antigos para o novo padrão antes de retornar ao frontend.

- **Cancelamento e exclusão:**  
  - Rota: `PATCH /boletos/:id/cancelar` (status → EXCLUIDO)
  - Rota: `DELETE /boletos/:id` (remoção física)

- **Padronização de status:**  
  - Função utilitária `mapStatus` converte status antigos para os novos em todas as operações.

## 3. Frontend — Aprimoramentos e Funcionalidades

### 3.1. Padronização de Status

- Todos os status de boletos agora seguem o padrão:
  - DISPONIVEL, AGUARDANDO PAGAMENTO, AGUARDANDO BAIXA, BAIXADO, EXCLUIDO, DISPUTA, VENCIDO.
- Função utilitária em cada página converte status antigos recebidos do backend.

### 3.2. Página “Meus Boletos” (Vendedor e Comprador)

- **Correção de exibição:**  
  - Mapeamento correto dos campos vindos do backend.
  - Datas formatadas para padrão brasileiro.
  - Status exibido sempre com a primeira letra maiúscula.

- **Menu de ações:**  
  - Implementação de Dropdown customizado (Shadcn UI).
  - Ações agrupadas: Visualizar comprovante, Baixar pagamento, Cancelar, Excluir.
  - Exibição condicional das ações conforme status do boleto.

- **Persistência:**  
  - Cancelamento e exclusão afetam o banco de dados.
  - Mensagens de sucesso/erro para cada ação.

- **Layout:**  
  - Tabela responsiva, colunas centralizadas, visual limpo.
  - Painel de debug para UID, endpoint e payload.

### 3.3. Resolução de Bugs

- **Campos em branco e datas inválidas:**  
  - Ajuste no mapeamento dos campos e formatação de datas.
- **Status inconsistentes:**  
  - Conversão automática de status antigos para o novo padrão em todas as telas.
- **Ações inconsistentes:**  
  - Correção das condições de exibição dos botões de ação.

### 3.4. Outras Melhorias

- **Componentização:**  
  - Componentes reutilizáveis para Dropdown, Botão, Input, etc.
- **Estilo:**  
  - Uso de Tailwind e Shadcn UI para padronização visual.
- **Documentação:**  
  - Comentários e painéis de debug para facilitar manutenção.

---

## 4. Como Salvar no GitHub

1. **Adicione todos os arquivos alterados:**
   ```sh
   git add .
   ```
2. **Faça um commit detalhado:**
   ```sh
   git commit -m "Documentação e padronização: status, menu de ações, layout, bugs em Meus Boletos, integração banco e rotas"
   ```
3. **Envie para o repositório remoto:**
   ```sh
   git push origin develop
   ``` 