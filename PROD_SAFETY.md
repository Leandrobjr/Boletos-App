# Plano de Foco em Produção e Garantias de Segurança

Este documento descreve como evitar erros e desperdício de tempo, focando exclusivamente no ambiente de produção (Vercel) para o projeto de Boletos.

## Princípios

- Operar apenas em endpoints de produção (`https://boletos-backend-290725.vercel.app/api`).
- Validar rotas com `GET` antes de qualquer operação mutável.
- Usar scripts Node para chamadas HTTP, evitando problemas de escape no PowerShell.
- Registrar claramente cada ação com logs de contexto.
- Não iniciar servidores locais para validação de rotas de produção.

## Rotas de Produção Implementadas

- `PATCH/POST /api/boletos/:numeroControle/comprovante` — salva comprovante e atualiza status para `AGUARDANDO_BAIXA` com limite de 72h.
- `GET /api/proxy/comprovante/:numeroControle` — retorna o comprovante salvo (URL/base64, nome e tipo).

Arquivos adicionados (Vercel Functions):

- `backend-bxc/api/boletos/[numeroControle]/comprovante.js`
- `backend-bxc/api/proxy/comprovante/[numeroControle].js`

## Testes de Produção (não interativos)

Script: `scripts/prod-probe.js`

Uso:

```bash
node scripts/prod-probe.js
```

Saída esperada:

- `GET /api -> 200 ...`
- `PATCH /api/boletos/:id/comprovante -> 200 ...` (após deploy das novas funções)

## Deploy Seguro (Vercel)

1. Commit das mudanças no repositório.
2. Deploy via Git conectado ao Vercel ou `vercel --prod` (requer credenciais configuradas).
3. Verificação pós-deploy usando `node scripts/prod-probe.js`.

## Checklist antes de cada ação

- Confirmar endpoint de status `GET /api`.
- Validar existência da rota alvo (evitar `404` do Vercel).
- Se a rota não existir, criar a função Vercel correspondente.
- Documentar claramente o que será alterado e por quê.

## Observações

- Se o schema do banco diferir dos campos usados (`comprovante_url`, `comprovante_filename`, `comprovante_filetype`, `tempo_limite_baixa`, `upload_em`), ajuste as queries semânticas mantendo o mesmo comportamento de negócio.