-- =====================================================
-- TrafficHub - Add Client Management Fields
-- =====================================================
-- Adiciona campos de gestão, briefing e reuniões fixas
-- Execute no SQL Editor do Supabase
-- =====================================================

-- Adicionar campos de gestão de vídeos
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS captation_frequency VARCHAR(20),
ADD COLUMN IF NOT EXISTS videos_sales VARCHAR(20),
ADD COLUMN IF NOT EXISTS videos_awareness VARCHAR(20);

-- Adicionar campo de briefing (JSONB para dados estruturados)
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS briefing_data JSONB;

-- Adicionar campos para reuniões com dia fixo
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS fixed_meeting_day VARCHAR(20),
ADD COLUMN IF NOT EXISTS fixed_meeting_time TIME,
ADD COLUMN IF NOT EXISTS fixed_meeting_enabled BOOLEAN DEFAULT FALSE;

-- Criar índice para busca em briefing_data
CREATE INDEX IF NOT EXISTS idx_clients_briefing_data ON clients USING GIN (briefing_data);

-- =====================================================
-- NOTA: Se já existem as colunas, o comando será ignorado
-- =====================================================
