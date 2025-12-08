-- =====================================================
-- Lead Sniper v3 AI - Upgrade Migration
-- =====================================================
-- Adiciona suporte para:
-- - Icebreakers gerados por IA
-- - Scraping de sites
-- - Novos campos da API v3
-- =====================================================

-- =====================================================
-- NOVOS CAMPOS NA TABELA leads_prospectados
-- =====================================================

-- Campos de identificação v3
ALTER TABLE leads_prospectados
    ADD COLUMN IF NOT EXISTS lead_sniper_id INTEGER,
    ADD COLUMN IF NOT EXISTS place_id VARCHAR(255);

-- Novo campo: bairro
ALTER TABLE leads_prospectados
    ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);

-- Novo campo: categoria do Google
ALTER TABLE leads_prospectados
    ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);

-- Novo campo: website (alias para site, mantendo compatibilidade)
ALTER TABLE leads_prospectados
    ADD COLUMN IF NOT EXISTS website VARCHAR(500);

-- Novo campo: total_avaliacoes (alias para total_reviews)
ALTER TABLE leads_prospectados
    ADD COLUMN IF NOT EXISTS total_avaliacoes INTEGER DEFAULT 0;

-- Campos de Icebreaker
ALTER TABLE leads_prospectados
    ADD COLUMN IF NOT EXISTS icebreaker TEXT,
    ADD COLUMN IF NOT EXISTS gatilho VARCHAR(100),
    ADD COLUMN IF NOT EXISTS icebreaker_gerado_por_ia BOOLEAN DEFAULT TRUE;

-- Campos de Scraping
ALTER TABLE leads_prospectados
    ADD COLUMN IF NOT EXISTS site_scraped BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS site_info JSONB;

-- Campo de enriquecimento
ALTER TABLE leads_prospectados
    ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMP WITH TIME ZONE;

-- Campo fonte
ALTER TABLE leads_prospectados
    ADD COLUMN IF NOT EXISTS fonte VARCHAR(50) DEFAULT 'lead_sniper_v3';

-- =====================================================
-- NOVOS CAMPOS NA TABELA pesquisas_mercado
-- =====================================================

-- Campos de configuração v3
ALTER TABLE pesquisas_mercado
    ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
    ADD COLUMN IF NOT EXISTS estado VARCHAR(2),
    ADD COLUMN IF NOT EXISTS quantidade INTEGER DEFAULT 20,
    ADD COLUMN IF NOT EXISTS nome_agencia VARCHAR(200),
    ADD COLUMN IF NOT EXISTS especialidade VARCHAR(200),
    ADD COLUMN IF NOT EXISTS tom_voz VARCHAR(50);

-- Estatísticas adicionais v3
ALTER TABLE pesquisas_mercado
    ADD COLUMN IF NOT EXISTS com_site INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sites_scraped INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS icebreakers_por_ia INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS versao VARCHAR(20);

-- =====================================================
-- INDEXES ADICIONAIS
-- =====================================================

-- Index para place_id (v3 usa place_id em vez de google_place_id)
CREATE INDEX IF NOT EXISTS idx_leads_place_id ON leads_prospectados(place_id);

-- Index para leads com icebreaker
CREATE INDEX IF NOT EXISTS idx_leads_com_icebreaker ON leads_prospectados(icebreaker) WHERE icebreaker IS NOT NULL;

-- Index para leads scraped
CREATE INDEX IF NOT EXISTS idx_leads_scraped ON leads_prospectados(site_scraped) WHERE site_scraped = TRUE;

-- Index para pesquisas por cidade (v3)
CREATE INDEX IF NOT EXISTS idx_pesquisas_cidade ON pesquisas_mercado(cidade);

-- =====================================================
-- ATUALIZAR CONSTRAINT DE UNICIDADE
-- =====================================================

-- Adicionar nova constraint para place_id (mantendo a antiga para compatibilidade)
-- Verifica se já existe antes de criar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_place_id_per_user'
    ) THEN
        ALTER TABLE leads_prospectados
            ADD CONSTRAINT unique_place_id_per_user UNIQUE (user_id, place_id);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

-- =====================================================
-- SYNC: Copiar dados de site para website
-- =====================================================

UPDATE leads_prospectados
SET website = site
WHERE website IS NULL AND site IS NOT NULL;

-- Copiar total_reviews para total_avaliacoes
UPDATE leads_prospectados
SET total_avaliacoes = total_reviews
WHERE total_avaliacoes IS NULL OR total_avaliacoes = 0;

-- Copiar google_place_id para place_id
UPDATE leads_prospectados
SET place_id = google_place_id
WHERE place_id IS NULL AND google_place_id IS NOT NULL;

-- =====================================================
-- COMENTÁRIOS NAS COLUNAS
-- =====================================================

COMMENT ON COLUMN leads_prospectados.icebreaker IS 'Mensagem de abordagem gerada por IA';
COMMENT ON COLUMN leads_prospectados.gatilho IS 'Gatilho usado para gerar o icebreaker (dor, oportunidade, elogio, etc)';
COMMENT ON COLUMN leads_prospectados.icebreaker_gerado_por_ia IS 'Se TRUE, icebreaker foi gerado pela IA. Se FALSE, foi um fallback.';
COMMENT ON COLUMN leads_prospectados.site_scraped IS 'Se TRUE, o site foi scraped com sucesso';
COMMENT ON COLUMN leads_prospectados.site_info IS 'Informações extraídas do site: {title, description, h1}';
COMMENT ON COLUMN leads_prospectados.enriched_at IS 'Timestamp de quando o lead foi enriquecido com dados do site e icebreaker';
COMMENT ON COLUMN leads_prospectados.place_id IS 'Google Place ID (v3 format)';
COMMENT ON COLUMN leads_prospectados.lead_sniper_id IS 'ID sequencial do lead retornado pela API v3';

COMMENT ON COLUMN pesquisas_mercado.cidade IS 'Cidade única da pesquisa (v3)';
COMMENT ON COLUMN pesquisas_mercado.quantidade IS 'Quantidade de leads solicitados (v3)';
COMMENT ON COLUMN pesquisas_mercado.tom_voz IS 'Tom de voz para icebreakers: profissional, amigável, descontraído, formal';
COMMENT ON COLUMN pesquisas_mercado.versao IS 'Versão da API usada (v3-ai, etc)';
