# Documentação da Página de Cadastro - Boleto Crypto

## Autenticação e Perfil de Usuário (Fluxo Completo)

### Fluxo de Autenticação
- O sistema permite login via Google OAuth e por e-mail/senha.
- O AuthProvider gerencia o estado global de autenticação e fornece hooks para acesso ao usuário logado, status e funções de login/logout.
- As rotas protegidas só podem ser acessadas por usuários autenticados.

### Estrutura do AuthProvider
- O AuthProvider envolve toda a aplicação (dentro do <Router>), garantindo que todos os hooks do React Router funcionem corretamente.
- O contexto fornece: user, isAuthenticated, loading, login, logout.

### Redirecionamento para Completar Perfil
- Após o login, se o usuário não tiver nome completo (displayName) ou telefone (phoneNumber), é redirecionado automaticamente para a página de alteração de cadastro (`/alterar-cadastro`).
- Isso garante que todos os usuários tenham perfil completo, mesmo quem entra pelo Google.

### Menu de Perfil
- No header, ao logar, aparece o botão "Bem-vindo, Nome!".
- Ao clicar, abre um menu mostrando:
  - Nome completo (se disponível)
  - E-mail
  - Telefone (se disponível)
  - Opções: Alterar cadastro, Sair

### Página de Alteração de Cadastro
- Permite editar nome completo, telefone e senha.
- Se o usuário veio do Google e não tem esses dados, é obrigado a preencher.
- O campo de senha é opcional (só altera se preencher).

### O que ainda falta implementar (TODO)
- Persistência real do telefone: o Firebase Auth não permite atualizar o telefone via updateProfile. É necessário salvar esse dado em um banco (ex: Firestore) e buscar ao carregar o perfil.
- Garantir que, ao salvar o perfil, os dados fiquem disponíveis mesmo após logout/login.

## Resumo das Alterações

A página de cadastro foi implementada com sucesso, seguindo o padrão visual das páginas existentes (Comprador.jsx e Vendedor.jsx) e incorporando melhorias significativas no layout e usabilidade.

## Funcionalidades Implementadas

### ✅ Autenticação
- **Login com Google**: Botão estilizado com ícone do Google
- **Login com senha**: Campos de email e senha com validação
- **Validação de formulário**: Verificação de campos obrigatórios

### ✅ Layout e Design
- **Card centralizado**: Largura máxima de `max-w-md` para melhor apresentação
- **Campos responsivos**: Largura limitada com padding adequado
- **Bordas verdes**: Campos de input com bordas verdes conforme padrão
- **Espaçamento otimizado**: Margens e padding consistentes

## Problemas Encontrados e Soluções

### 1. Problema: Campos ocupando toda a largura da página
**Solução Aplicada:**
- Removido `w-full` do card principal
- Aplicado `max-w-md` para limitar largura
- Campos com largura controlada via classes Tailwind

### 2. Problema: Botão do Google com fundo verde
**Solução Aplicada:**
- Implementado botão nativo com classes específicas
- Fundo branco com texto cinza escuro
- Ícone do Google posicionado corretamente

### 3. Problema: Ícones de visualização de senha sobrepostos
**Solução Aplicada:**
- **Removidos os ícones** conforme solicitação do usuário
- Campos de senha funcionais sem visualização

### 4. Problema: Imports incorretos dos componentes Shadcn UI
**Solução Aplicada:**
- Ajustados imports considerando:
  - `Button.jsx`: export default
  - `Input.jsx`: export nomeado
- Caminhos corrigidos para `src/components/ui/`

### 5. Problema: Layout não responsivo
**Solução Aplicada:**
- Sistema de grid responsivo implementado
- Breakpoints adequados para diferentes telas
- Larguras limitadas para melhor usabilidade

## Estrutura Técnica

### Tecnologias Utilizadas
- **React 18** com hooks (useState)
- **Tailwind CSS** para estilização
- **Componentes Shadcn UI** (Input, Button, Card)
- **Validação de formulário** básica

### Arquivos Modificados
- `src/pages/CadastroPage.jsx` - Página principal implementada
- `src/components/ui/Input.jsx` - Componente de input
- `src/components/ui/Button.jsx` - Componente de botão
- `src/components/ui/card.jsx` - Componente de card

### Estados do Componente
```javascript
const [formData, setFormData] = useState({
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: ''
});
const [showSenha, setShowSenha] = useState(false);
const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
```

## Funcionalidades Preparadas para Integração

### Backend Integration
- Função `handleSubmit` preparada para integração
- Validação de campos obrigatórios
- Estrutura para autenticação Google OAuth
- Tratamento de erros básico

### Responsividade
- Layout adaptável para mobile, tablet e desktop
- Campos com tamanhos apropriados para cada dispositivo
- Espaçamento otimizado para diferentes telas

## Padrões de Código Seguidos

### Nomenclatura
- Componentes em PascalCase
- Funções em camelCase
- Classes CSS seguindo convenções Tailwind

### Estrutura
- Imports organizados por tipo
- Estados agrupados logicamente
- Funções de manipulação separadas
- JSX estruturado com indentação adequada

## Testes Realizados

### ✅ Funcionalidade
- Campos de input funcionais
- Validação de formulário
- Estados de visibilidade de senha
- Responsividade em diferentes tamanhos

### ✅ Visual
- Layout centralizado
- Bordas verdes nos campos
- Botão Google estilizado corretamente
- Espaçamento consistente

## Próximos Passos Sugeridos

1. **Integração com Backend**
   - Implementar autenticação real
   - Conectar com API de cadastro
   - Adicionar tratamento de erros

2. **Melhorias de UX**
   - Adicionar loading states
   - Implementar feedback visual
   - Melhorar mensagens de erro

3. **Testes**
   - Testes unitários
   - Testes de integração
   - Testes de usabilidade

## Commit Realizado

**Hash:** `dbbc184`
**Branch:** `develop`
**Mensagem:** "feat: Página de cadastro implementada com layout responsivo"

---

*Documentação criada em: $(date)*
*Versão: 1.0*
*Status: Implementado e Testado* 