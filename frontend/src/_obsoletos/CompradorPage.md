# Documentação Detalhada — Página do Comprador (`CompradorPage.jsx`)

## Visão Geral
A página do Comprador é responsável por toda a experiência de compra de USDT via boletos bancários, incluindo seleção, reserva, envio de comprovante, acompanhamento dos próprios boletos e histórico detalhado de transações. O fluxo é totalmente controlado por React Hooks e utiliza componentes visuais modernos.

---

## Funcionalidades Principais

### 1. Listagem de Boletos Disponíveis
- Exibe todos os boletos disponíveis para compra em uma tabela organizada.
- Mostra número, valor, data de vencimento, beneficiário e status.
- Botão "Selecionar" permite iniciar o fluxo de compra.

### 2. Modal de Compra (Multi-etapas)
- **Etapa 1:** Conectar carteira (simulação, botão com feedback visual).
- **Etapa 2:** Reservar boleto (reserva temporária do boleto, exibe endereço da carteira conectada).
- **Etapa 3:** Enviar comprovante (upload de arquivo, aceita imagem ou PDF, simula URL local para visualização posterior).
- **Etapa 4:** Pagamento confirmado (feedback visual, botão para ir para "Meus Boletos").
- O modal é exibido via `createPortal` para sobrepor a tela principal.

### 3. Meus Boletos
- Lista todos os boletos já comprados/pagos pelo usuário.
- Mostra número, valor, valor líquido em USDT, taxa de serviço, data da compra e status.

### 4. Histórico de Transações
- Exibe uma tabela detalhada com:
  - Data da compra
  - Valor em Reais
  - Valor em USDT
  - Taxa de serviço (R$ e USDT)
  - Botão "VISUALIZAR COMPROVANTE" (abre comprovante enviado em nova aba, se houver)
- Caso não haja comprovante, mostra "Não enviado".

### 5. Alertas e Feedback
- Alertas visuais para todas as ações importantes (sucesso, erro, informação, destrutivo).

---

## Estrutura de Dados
- **boletosDisponiveis:** Array de objetos com dados dos boletos disponíveis.
- **meusBoletos:** Array de objetos com dados dos boletos adquiridos, incluindo comprovanteUrl.
- **selectedBoleto:** Objeto do boleto atualmente selecionado para compra.
- **comprovante:** Arquivo enviado pelo usuário (imagem ou PDF).
- **comprovanteUrl:** URL local (ou futura URL remota) do comprovante anexado ao boleto no histórico.

---

## Tecnologias Utilizadas
- **React 18+** (hooks, JSX)
- **React Icons** (ícones visuais)
- **Tailwind CSS** (estilização)
- **Shadcn UI** (componentes visuais)
- **React DOM Portal** (modais)
- **Simulação de upload local** (URL.createObjectURL)

---

## Observações e Boas Práticas
- O return do componente está sempre envolvido em um único fragmento, evitando erros de JSX.
- O botão de comprovante só aparece se o campo comprovanteUrl existir no objeto do boleto.
- O fluxo é amigável para leigos, com feedback visual em todas as etapas.
- O código está preparado para futura integração com backend para upload real de comprovantes.

---

## Como funciona o botão "VISUALIZAR COMPROVANTE"?
- Ao enviar o comprovante, o arquivo é convertido em uma URL local e salva no objeto do boleto.
- No histórico, o botão abre o comprovante em nova aba.
- Caso seja integrado a um backend, basta salvar a URL do arquivo hospedado no campo comprovanteUrl.

---

## Manutenção e Expansão
- Para adicionar novas etapas ou campos, basta incluir no array de boletos e ajustar os componentes.
- Para integração real com backend, trocar a lógica de URL local pela URL recebida do servidor após upload.

---

## Autoria e Histórico
- Página desenvolvida e documentada por orientação do usuário Marco Aurélio, com foco em clareza, acessibilidade e facilidade para não programadores.
- Última atualização: 26/06/2025
