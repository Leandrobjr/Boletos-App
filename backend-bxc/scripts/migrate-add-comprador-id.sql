-- =====================================================
-- MIGRAÇÃO: Adicionar coluna comprador_id
-- Sistema: BXC Boletos App
-- Data: 2025-01-07
-- Objetivo: Separar vendedor (user_id) de comprador (comprador_id)
-- =====================================================

-- 1. Adicionar coluna comprador_id
ALTER TABLE boletos 
ADD COLUMN comprador_id VARCHAR(255);

-- 2. Criar índice para performance
CREATE INDEX idx_boletos_comprador_id ON boletos(comprador_id);

-- 3. Criar índice composto para consultas otimizadas
CREATE INDEX idx_boletos_comprador_status ON boletos(comprador_id, status);

-- 4. Adicionar comentário na coluna
COMMENT ON COLUMN boletos.comprador_id IS 'ID do usuário comprador (Firebase UID)';

-- 5. Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'boletos' 
ORDER BY ordinal_position;

-- 6. Verificar índices criados
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'boletos' 
AND indexname LIKE '%comprador%';
