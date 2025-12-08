-- =====================================================
-- Lead Sniper - Sistema de Pesquisa de Mercado
-- =====================================================
-- Integra com workflow n8n para prospectar leads via Google Places API
-- =====================================================

-- =====================================================
-- TABELAS
-- =====================================================

-- Tabela de pesquisas de mercado
CREATE TABLE IF NOT EXISTS pesquisas_mercado (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    request_id VARCHAR(100) UNIQUE,

    -- Configuracao da pesquisa
    tipo_negocio VARCHAR(50) NOT NULL,
    cidades_buscadas JSONB NOT NULL DEFAULT '[]',
    score_minimo INTEGER DEFAULT 40,
    max_por_cidade INTEGER DEFAULT 20,

    -- Estatisticas
    total_leads INTEGER DEFAULT 0,
    leads_hot INTEGER DEFAULT 0,
    leads_warm INTEGER DEFAULT 0,
    leads_cool INTEGER DEFAULT 0,
    leads_cold INTEGER DEFAULT 0,
    com_whatsapp INTEGER DEFAULT 0,
    sem_site INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    error_message TEXT,

    -- Metadados
    executado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de leads prospectados
CREATE TABLE IF NOT EXISTS leads_prospectados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pesquisa_id UUID REFERENCES pesquisas_mercado(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clients(id) ON DELETE SET NULL,

    -- Identificador Google
    google_place_id VARCHAR(255),

    -- Dados do Lead
    nome VARCHAR(255) NOT NULL,
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(10),
    telefone VARCHAR(30),
    whatsapp VARCHAR(30),
    link_whatsapp VARCHAR(200),
    site VARCHAR(500),
    google_maps_url VARCHAR(500),

    -- Metricas Google
    rating DECIMAL(2,1),
    total_reviews INTEGER DEFAULT 0,
    tipos JSONB DEFAULT '[]',
    horario_funcionamento JSONB DEFAULT '[]',

    -- Score e Classificacao
    score INTEGER DEFAULT 0,
    classificacao VARCHAR(10) CHECK (classificacao IN ('HOT', 'WARM', 'COOL', 'COLD')),
    prioridade INTEGER DEFAULT 4 CHECK (prioridade BETWEEN 1 AND 4),
    oportunidades JSONB DEFAULT '[]',

    -- Flags
    tem_site BOOLEAN DEFAULT FALSE,
    site_seguro BOOLEAN DEFAULT FALSE,
    tem_telefone BOOLEAN DEFAULT FALSE,
    tem_whatsapp BOOLEAN DEFAULT FALSE,

    -- Status de Follow-up
    status VARCHAR(20) DEFAULT 'NOVO' CHECK (status IN ('NOVO', 'CONTATADO', 'RESPONDEU', 'INTERESSADO', 'FECHADO', 'PERDIDO')),
    data_contato TIMESTAMP WITH TIME ZONE,
    data_resposta TIMESTAMP WITH TIME ZONE,
    notas TEXT,

    -- Metadados
    tipo_negocio VARCHAR(50),
    captured_at TIMESTAMP WITH TIME ZONE,
    source VARCHAR(50) DEFAULT 'google_places_api',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraint para evitar duplicatas
    CONSTRAINT unique_google_place_per_user UNIQUE (user_id, google_place_id)
);

-- Tabela de interacoes com leads (historico de follow-up)
CREATE TABLE IF NOT EXISTS lead_interacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads_prospectados(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('WHATSAPP', 'EMAIL', 'LIGACAO', 'REUNIAO', 'NOTA')),
    direcao VARCHAR(10) CHECK (direcao IN ('ENVIADO', 'RECEBIDO')),
    conteudo TEXT,
    resultado VARCHAR(50) CHECK (resultado IN ('ENVIADO', 'ENTREGUE', 'LIDO', 'RESPONDEU', 'SEM_RESPOSTA', 'AGENDADO', 'REALIZADO')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Pesquisas de mercado
CREATE INDEX IF NOT EXISTS idx_pesquisas_user ON pesquisas_mercado(user_id);
CREATE INDEX IF NOT EXISTS idx_pesquisas_cliente ON pesquisas_mercado(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pesquisas_tipo ON pesquisas_mercado(tipo_negocio);
CREATE INDEX IF NOT EXISTS idx_pesquisas_status ON pesquisas_mercado(status);
CREATE INDEX IF NOT EXISTS idx_pesquisas_created ON pesquisas_mercado(created_at DESC);

-- Leads prospectados
CREATE INDEX IF NOT EXISTS idx_leads_user ON leads_prospectados(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_pesquisa ON leads_prospectados(pesquisa_id);
CREATE INDEX IF NOT EXISTS idx_leads_cliente ON leads_prospectados(cliente_id);
CREATE INDEX IF NOT EXISTS idx_leads_classificacao ON leads_prospectados(classificacao);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads_prospectados(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads_prospectados(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_cidade ON leads_prospectados(cidade);
CREATE INDEX IF NOT EXISTS idx_leads_tipo ON leads_prospectados(tipo_negocio);
CREATE INDEX IF NOT EXISTS idx_leads_google_place ON leads_prospectados(google_place_id);
CREATE INDEX IF NOT EXISTS idx_leads_prioridade ON leads_prospectados(prioridade, score DESC);

-- Interacoes
CREATE INDEX IF NOT EXISTS idx_interacoes_lead ON lead_interacoes(lead_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_user ON lead_interacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_created ON lead_interacoes(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE pesquisas_mercado ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_prospectados ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interacoes ENABLE ROW LEVEL SECURITY;

-- Policies para pesquisas_mercado
CREATE POLICY "Users can view their own pesquisas"
    ON pesquisas_mercado FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create pesquisas"
    ON pesquisas_mercado FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pesquisas"
    ON pesquisas_mercado FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pesquisas"
    ON pesquisas_mercado FOR DELETE
    USING (auth.uid() = user_id);

-- Policies para leads_prospectados
CREATE POLICY "Users can view their own leads"
    ON leads_prospectados FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create leads"
    ON leads_prospectados FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
    ON leads_prospectados FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
    ON leads_prospectados FOR DELETE
    USING (auth.uid() = user_id);

-- Policies para lead_interacoes
CREATE POLICY "Users can view their own interacoes"
    ON lead_interacoes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create interacoes"
    ON lead_interacoes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interacoes"
    ON lead_interacoes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interacoes"
    ON lead_interacoes FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Funcao para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_lead_sniper_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS trigger_pesquisas_mercado_updated_at ON pesquisas_mercado;
CREATE TRIGGER trigger_pesquisas_mercado_updated_at
    BEFORE UPDATE ON pesquisas_mercado
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_sniper_updated_at();

DROP TRIGGER IF EXISTS trigger_leads_prospectados_updated_at ON leads_prospectados;
CREATE TRIGGER trigger_leads_prospectados_updated_at
    BEFORE UPDATE ON leads_prospectados
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_sniper_updated_at();

-- =====================================================
-- DADOS DE REFERENCIA
-- =====================================================

-- Tabela de tipos de negocio suportados (referencia)
CREATE TABLE IF NOT EXISTS tipos_negocio (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    nome_plural VARCHAR(100),
    icone VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE
);

INSERT INTO tipos_negocio (id, nome, nome_plural, icone) VALUES
    ('gym', 'Academia', 'Academias', 'dumbbell'),
    ('restaurant', 'Restaurante', 'Restaurantes', 'utensils'),
    ('beauty_salon', 'Salao de Beleza', 'Saloes de Beleza', 'scissors'),
    ('dentist', 'Dentista', 'Dentistas', 'tooth'),
    ('doctor', 'Medico/Clinica', 'Medicos/Clinicas', 'stethoscope'),
    ('lawyer', 'Advogado', 'Advogados', 'scale'),
    ('real_estate_agency', 'Imobiliaria', 'Imobiliarias', 'home'),
    ('car_dealer', 'Concessionaria', 'Concessionarias', 'car'),
    ('pet_store', 'Pet Shop', 'Pet Shops', 'paw-print'),
    ('veterinary_care', 'Veterinario', 'Veterinarios', 'heart-pulse'),
    ('pharmacy', 'Farmacia', 'Farmacias', 'pill'),
    ('bakery', 'Padaria', 'Padarias', 'croissant'),
    ('cafe', 'Cafeteria', 'Cafeterias', 'coffee'),
    ('bar', 'Bar', 'Bares', 'beer'),
    ('clothing_store', 'Loja de Roupa', 'Lojas de Roupa', 'shirt'),
    ('electronics_store', 'Loja de Eletronicos', 'Lojas de Eletronicos', 'smartphone'),
    ('furniture_store', 'Loja de Moveis', 'Lojas de Moveis', 'sofa'),
    ('hardware_store', 'Loja de Ferragens', 'Lojas de Ferragens', 'wrench'),
    ('home_goods_store', 'Loja de Decoracao', 'Lojas de Decoracao', 'lamp'),
    ('jewelry_store', 'Joalheria', 'Joalherias', 'gem'),
    ('shoe_store', 'Loja de Calcados', 'Lojas de Calcados', 'footprints'),
    ('shopping_mall', 'Shopping Center', 'Shopping Centers', 'building'),
    ('supermarket', 'Supermercado', 'Supermercados', 'shopping-cart')
ON CONFLICT (id) DO NOTHING;

-- Tabela de cidades pre-configuradas (regiao Campinas)
CREATE TABLE IF NOT EXISTS cidades_prospeccao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    estado VARCHAR(2) DEFAULT 'SP',
    lat DECIMAL(10, 6) NOT NULL,
    lng DECIMAL(10, 6) NOT NULL,
    raio_padrao INTEGER DEFAULT 5000,
    regiao VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE
);

INSERT INTO cidades_prospeccao (nome, lat, lng, raio_padrao, regiao) VALUES
    ('Campinas', -22.9099, -47.0626, 8000, 'RMC'),
    ('Paulinia', -22.7612, -47.1543, 5000, 'RMC'),
    ('Sumare', -22.8217, -47.2669, 5000, 'RMC'),
    ('Hortolandia', -22.8584, -47.2200, 5000, 'RMC'),
    ('Valinhos', -22.9708, -46.9958, 4000, 'RMC'),
    ('Vinhedo', -23.0297, -46.9756, 4000, 'RMC'),
    ('Indaiatuba', -23.0903, -47.2181, 6000, 'RMC'),
    ('Americana', -22.7394, -47.3316, 5000, 'RMC'),
    ('Santa Barbara d''Oeste', -22.7554, -47.4145, 5000, 'RMC'),
    ('Nova Odessa', -22.7775, -47.2942, 4000, 'RMC'),
    ('Jundiai', -23.1857, -46.8978, 6000, 'Jundiai'),
    ('Piracicaba', -22.7338, -47.6476, 6000, 'Piracicaba'),
    ('Limeira', -22.5640, -47.4017, 5000, 'Limeira'),
    ('Rio Claro', -22.4149, -47.5651, 5000, 'Rio Claro'),
    ('Sao Paulo', -23.5505, -46.6333, 10000, 'Capital')
ON CONFLICT DO NOTHING;
