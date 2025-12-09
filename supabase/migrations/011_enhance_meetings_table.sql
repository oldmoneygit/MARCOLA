-- =====================================================
-- MIGRATION: 010_enhance_meetings_table.sql
-- Adiciona campos extras à tabela meetings para
-- suportar a nova página dedicada de reuniões
-- =====================================================

-- Adicionar campos que estão faltando na tabela meetings
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Tornar client_id nullable (reuniões podem ser internas)
ALTER TABLE meetings ALTER COLUMN client_id DROP NOT NULL;

-- Comentários dos novos campos
COMMENT ON COLUMN meetings.title IS 'Título/assunto da reunião';
COMMENT ON COLUMN meetings.description IS 'Descrição detalhada da reunião';
COMMENT ON COLUMN meetings.duration_minutes IS 'Duração estimada em minutos';
COMMENT ON COLUMN meetings.priority IS 'Prioridade: low, medium, high, urgent';

-- Índice para busca por título
CREATE INDEX IF NOT EXISTS idx_meetings_title ON meetings(title);

-- Índice para prioridade
CREATE INDEX IF NOT EXISTS idx_meetings_priority ON meetings(priority);

-- Atualizar meetings existentes sem título para terem um título padrão
UPDATE meetings
SET title = CONCAT('Reunião com cliente - ', date::text)
WHERE title IS NULL;
