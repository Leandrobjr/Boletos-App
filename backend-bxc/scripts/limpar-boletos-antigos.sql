-- ============================================
-- SCRIPT: Limpar Boletos Antigos/Expirados
-- ============================================
-- Este script limpa boletos que estão há muito tempo
-- em AGUARDANDO_PAGAMENTO ou PENDENTE_PAGAMENTO
-- e os retorna para o status DISPONIVEL
-- ============================================

-- 1. VERIFICAR BOLETOS QUE SERÃO AFETADOS
-- (Execute primeiro para ver o que será alterado)
SELECT 
  id,
  numero_controle,
  status,
  valor,
  data_travamento,
  comprador_id,
  wallet_address,
  EXTRACT(EPOCH FROM (NOW() - data_travamento))/60 AS minutos_travado
FROM boletos
WHERE 
  status IN ('AGUARDANDO_PAGAMENTO', 'PENDENTE_PAGAMENTO')
  AND data_travamento IS NOT NULL
  AND data_travamento < NOW() - INTERVAL '1 hour'
ORDER BY data_travamento ASC;

-- 2. LIMPAR BOLETOS EXPIRADOS (mais de 1 hora)
-- (Execute este comando para fazer a limpeza)
UPDATE boletos 
SET 
  status = 'DISPONIVEL',
  comprador_id = NULL,
  wallet_address = NULL,
  data_travamento = NULL,
  data_destravamento = NOW()
WHERE 
  status IN ('AGUARDANDO_PAGAMENTO', 'PENDENTE_PAGAMENTO')
  AND data_travamento IS NOT NULL
  AND data_travamento < NOW() - INTERVAL '1 hour';

-- 3. VERIFICAR RESULTADO
-- (Execute para confirmar que os boletos foram limpos)
SELECT 
  id,
  numero_controle,
  status,
  valor,
  data_destravamento,
  comprador_id
FROM boletos
WHERE 
  data_destravamento IS NOT NULL
  AND data_destravamento > NOW() - INTERVAL '5 minutes'
ORDER BY data_destravamento DESC;

-- ============================================
-- COMANDOS ADICIONAIS ÚTEIS
-- ============================================

-- Ver todos os boletos AGUARDANDO_PAGAMENTO
SELECT 
  id,
  numero_controle,
  status,
  valor,
  data_travamento,
  EXTRACT(EPOCH FROM (NOW() - data_travamento))/60 AS minutos_travado
FROM boletos
WHERE status = 'AGUARDANDO_PAGAMENTO'
ORDER BY data_travamento ASC;

-- Ver estatísticas por status
SELECT 
  status,
  COUNT(*) AS quantidade,
  SUM(valor) AS valor_total
FROM boletos
GROUP BY status
ORDER BY quantidade DESC;

-- Limpar boletos MUITO ANTIGOS (mais de 24 horas)
UPDATE boletos 
SET 
  status = 'DISPONIVEL',
  comprador_id = NULL,
  wallet_address = NULL,
  data_travamento = NULL,
  data_destravamento = NOW()
WHERE 
  status IN ('AGUARDANDO_PAGAMENTO', 'PENDENTE_PAGAMENTO')
  AND data_travamento IS NOT NULL
  AND data_travamento < NOW() - INTERVAL '24 hours';

-- =============================================================
-- LEGACY ⚠️ USO PONTUAL APENAS
-- =============================================================
-- Este script foi utilizado pontualmente para limpeza manual.
-- No fluxo atual:
--  - 24h referem-se à escala de taxas, NÃO muda status.
--  - Status após 60min: com comprovante → 'AGUARDANDO BAIXA'; sem → 'DISPONIVEL'.
--  - Após 72h do comprovante: baixa automática via contrato (autoRelease).
-- Portanto, não utilize este script como rotina de produção.
-- =============================================================

