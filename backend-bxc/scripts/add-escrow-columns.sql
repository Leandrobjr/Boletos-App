-- Script para adicionar colunas escrow_id e tx_hash na tabela boletos
-- Execute este script no banco de dados Neon para corrigir o problema

-- Verificar se as colunas já existem antes de adicionar
DO $$ 
BEGIN
    -- Adicionar coluna escrow_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'boletos' AND column_name = 'escrow_id'
    ) THEN
        ALTER TABLE boletos ADD COLUMN escrow_id VARCHAR(255);
        RAISE NOTICE 'Coluna escrow_id adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna escrow_id já existe';
    END IF;

    -- Adicionar coluna tx_hash se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'boletos' AND column_name = 'tx_hash'
    ) THEN
        ALTER TABLE boletos ADD COLUMN tx_hash VARCHAR(255);
        RAISE NOTICE 'Coluna tx_hash adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna tx_hash já existe';
    END IF;

    -- Adicionar coluna data_travamento se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'boletos' AND column_name = 'data_travamento'
    ) THEN
        ALTER TABLE boletos ADD COLUMN data_travamento TIMESTAMP;
        RAISE NOTICE 'Coluna data_travamento adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna data_travamento já existe';
    END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_boletos_escrow_id ON boletos(escrow_id);
CREATE INDEX IF NOT EXISTS idx_boletos_tx_hash ON boletos(tx_hash);
CREATE INDEX IF NOT EXISTS idx_boletos_data_travamento ON boletos(data_travamento);

-- Adicionar comentários para documentação
COMMENT ON COLUMN boletos.escrow_id IS 'ID do contrato escrow na blockchain';
COMMENT ON COLUMN boletos.tx_hash IS 'Hash da transação de criação do escrow';
COMMENT ON COLUMN boletos.data_travamento IS 'Data e hora do travamento do boleto';

-- Verificar estrutura final da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'boletos' 
ORDER BY ordinal_position;