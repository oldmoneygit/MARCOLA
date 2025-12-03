# DATABASE.md - Schema do Banco de Dados

---

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Diagrama ER](#diagrama-er)
3. [Tabelas](#tabelas)
4. [Enums](#enums)
5. [Índices](#índices)
6. [Políticas RLS](#políticas-rls)
7. [Migrations](#migrations)
8. [Seeds](#seeds)
9. [Queries Comuns](#queries-comuns)

---

## 🗄 Visão Geral

O banco de dados utiliza **PostgreSQL** via **Supabase**. Todas as tabelas implementam:

- `id`: UUID como chave primária
- `created_at`: Timestamp de criação
- `updated_at`: Timestamp de atualização (trigger automático)
- `user_id`: Referência ao usuário dono do registro (para RLS)

---

## 📊 Diagrama ER

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │    clients      │       │    reports      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │──┐    │ id (PK)         │
│ email           │  │    │ user_id (FK)    │  │    │ client_id (FK)  │
│ name            │  └───▶│ name            │  └───▶│ period_start    │
│ created_at      │       │ segment         │       │ period_end      │
│ updated_at      │       │ status          │       │ spend           │
└─────────────────┘       │ contact_phone   │       │ impressions     │
                          │ contact_email   │       │ clicks          │
                          │ monthly_value   │       │ conversions     │
                          │ due_day         │       │ ctr             │
                          │ notes           │       │ cpa             │
                          │ ads_account_url │       │ created_at      │
                          │ created_at      │       └─────────────────┘
                          │ updated_at      │              │
                          └─────────────────┘              │
                                   │                       │
                                   │                       │
                                   ▼                       ▼
                          ┌─────────────────┐       ┌─────────────────┐
                          │    payments     │       │      ads        │
                          ├─────────────────┤       ├─────────────────┤
                          │ id (PK)         │       │ id (PK)         │
                          │ client_id (FK)  │       │ report_id (FK)  │
                          │ amount          │       │ name            │
                          │ due_date        │       │ spend           │
                          │ paid_date       │       │ impressions     │
                          │ status          │       │ clicks          │
                          │ notes           │       │ conversions     │
                          │ created_at      │       │ ctr             │
                          │ updated_at      │       │ cpa             │
                          └─────────────────┘       │ status          │
                                                    │ created_at      │
                                                    └─────────────────┘
```

---

## 📋 Tabelas

### users

Tabela gerenciada pelo Supabase Auth. Estendemos com profile.

```sql
-- A tabela auth.users é gerenciada pelo Supabase
-- Criamos uma tabela de perfil que referencia

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### clients

Tabela de clientes.

```sql
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informações básicas
  name TEXT NOT NULL,
  segment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  
  -- Contato
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  
  -- Financeiro
  monthly_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  due_day INTEGER NOT NULL DEFAULT 10 CHECK (due_day >= 1 AND due_day <= 31),
  
  -- Links
  ads_account_url TEXT,
  website_url TEXT,
  drive_url TEXT,
  
  -- Extra
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_status ON public.clients(status);

-- Trigger para updated_at
CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

#### Campos:

| Campo | Tipo | Nullable | Descrição |
|-------|------|----------|-----------|
| id | UUID | ❌ | Identificador único |
| user_id | UUID | ❌ | Dono do registro |
| name | TEXT | ❌ | Nome do cliente |
| segment | TEXT | ❌ | Segmento (academia, delivery, etc) |
| status | TEXT | ❌ | active, paused, inactive |
| contact_name | TEXT | ✅ | Nome do contato |
| contact_phone | TEXT | ✅ | WhatsApp |
| contact_email | TEXT | ✅ | Email |
| monthly_value | DECIMAL | ❌ | Valor mensal |
| due_day | INTEGER | ❌ | Dia de vencimento (1-31) |
| ads_account_url | TEXT | ✅ | Link da conta de anúncios |
| website_url | TEXT | ✅ | Site do cliente |
| drive_url | TEXT | ✅ | Link do Drive |
| notes | TEXT | ✅ | Anotações |
| created_at | TIMESTAMPTZ | ❌ | Data de criação |
| updated_at | TIMESTAMPTZ | ❌ | Data de atualização |

### reports

Relatórios de performance.

```sql
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Período
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Métricas agregadas
  total_spend DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_impressions BIGINT NOT NULL DEFAULT 0,
  total_clicks BIGINT NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  
  -- Métricas calculadas
  ctr DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN total_impressions > 0 
    THEN (total_clicks::DECIMAL / total_impressions) * 100 
    ELSE 0 END
  ) STORED,
  cpa DECIMAL(10, 2) GENERATED ALWAYS AS (
    CASE WHEN total_conversions > 0 
    THEN total_spend / total_conversions 
    ELSE 0 END
  ) STORED,
  cpm DECIMAL(10, 2) GENERATED ALWAYS AS (
    CASE WHEN total_impressions > 0 
    THEN (total_spend / total_impressions) * 1000 
    ELSE 0 END
  ) STORED,
  
  -- Raw data (JSON do CSV importado)
  raw_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_reports_client_id ON public.reports(client_id);
CREATE INDEX idx_reports_period ON public.reports(period_start, period_end);
```

### ads

Anúncios individuais dentro de um relatório.

```sql
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  
  -- Identificação
  ad_id TEXT, -- ID do Facebook Ads
  ad_name TEXT NOT NULL,
  adset_name TEXT,
  campaign_name TEXT,
  
  -- Métricas
  spend DECIMAL(10, 2) NOT NULL DEFAULT 0,
  impressions BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  
  -- Métricas calculadas
  ctr DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN impressions > 0 
    THEN (clicks::DECIMAL / impressions) * 100 
    ELSE 0 END
  ) STORED,
  cpa DECIMAL(10, 2) GENERATED ALWAYS AS (
    CASE WHEN conversions > 0 
    THEN spend / conversions 
    ELSE 0 END
  ) STORED,
  
  -- Status calculado
  status TEXT NOT NULL DEFAULT 'active',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_ads_report_id ON public.ads(report_id);
CREATE INDEX idx_ads_status ON public.ads(status);
```

### payments

Pagamentos e cobranças.

```sql
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Valores
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Datas
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Referência
  reference_month DATE NOT NULL, -- Primeiro dia do mês de referência
  
  -- Notas
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_payments_client_id ON public.payments(client_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_due_date ON public.payments(due_date);
```

### analysis_suggestions

Sugestões geradas pela análise.

```sql
CREATE TABLE public.analysis_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Tipo
  type TEXT NOT NULL, -- 'fatigue', 'opportunity', 'suggestion', 'andromeda'
  severity TEXT NOT NULL, -- 'urgent', 'warning', 'info'
  
  -- Conteúdo
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  actions JSONB, -- Array de ações recomendadas
  
  -- Dados
  related_data JSONB, -- Dados que geraram a sugestão
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'dismissed', 'completed'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_suggestions_client_id ON public.analysis_suggestions(client_id);
CREATE INDEX idx_suggestions_status ON public.analysis_suggestions(status);
CREATE INDEX idx_suggestions_type ON public.analysis_suggestions(type);
```

---

## 🏷 Enums

### Client Status
```sql
-- Via CHECK constraint ou app-level validation
-- 'active' - Cliente ativo
-- 'paused' - Cliente pausado temporariamente
-- 'inactive' - Cliente inativo
```

### Payment Status
```sql
-- 'pending' - Aguardando pagamento
-- 'paid' - Pago
-- 'overdue' - Atrasado
-- 'cancelled' - Cancelado
```

### Ad Status
```sql
-- 'winner' - Performance excelente
-- 'active' - Performance normal
-- 'fatigue' - Sinais de fadiga criativa
-- 'pause' - Recomendado pausar
```

### Suggestion Type
```sql
-- 'fatigue' - Fadiga criativa
-- 'opportunity' - Oportunidade de escala
-- 'suggestion' - Sugestão geral
-- 'andromeda' - Relacionado a diversidade criativa
```

### Suggestion Severity
```sql
-- 'urgent' - Ação imediata necessária
-- 'warning' - Atenção necessária
-- 'info' - Informativo
```

---

## 📑 Índices

```sql
-- Clientes
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_due_day ON public.clients(due_day);

-- Relatórios
CREATE INDEX idx_reports_client_id ON public.reports(client_id);
CREATE INDEX idx_reports_period ON public.reports(period_start, period_end);

-- Anúncios
CREATE INDEX idx_ads_report_id ON public.ads(report_id);
CREATE INDEX idx_ads_status ON public.ads(status);

-- Pagamentos
CREATE INDEX idx_payments_client_id ON public.payments(client_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_due_date ON public.payments(due_date);

-- Sugestões
CREATE INDEX idx_suggestions_client_id ON public.analysis_suggestions(client_id);
CREATE INDEX idx_suggestions_status ON public.analysis_suggestions(status);
```

---

## 🔒 Políticas RLS

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_suggestions ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- CLIENTS
CREATE POLICY "Users can view own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = user_id);

-- REPORTS (via client)
CREATE POLICY "Users can view reports of own clients"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = reports.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reports for own clients"
  ON public.reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = reports.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- ADS (via report -> client)
CREATE POLICY "Users can view ads of own clients"
  ON public.ads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reports
      JOIN public.clients ON clients.id = reports.client_id
      WHERE reports.id = ads.report_id
      AND clients.user_id = auth.uid()
    )
  );

-- PAYMENTS (via client)
CREATE POLICY "Users can view payments of own clients"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = payments.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage payments of own clients"
  ON public.payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = payments.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- SUGGESTIONS (via client)
CREATE POLICY "Users can view suggestions for own clients"
  ON public.analysis_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = analysis_suggestions.client_id
      AND clients.user_id = auth.uid()
    )
  );
```

---

## 📤 Migrations

### 001_initial_schema.sql

```sql
-- Migration: Initial Schema
-- Created: 2025-12-01

-- Function para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE public.clients (
  -- ... (definição completa acima)
);

-- Reports
CREATE TABLE public.reports (
  -- ... (definição completa acima)
);

-- Ads
CREATE TABLE public.ads (
  -- ... (definição completa acima)
);

-- Payments
CREATE TABLE public.payments (
  -- ... (definição completa acima)
);

-- Analysis Suggestions
CREATE TABLE public.analysis_suggestions (
  -- ... (definição completa acima)
);

-- Enable RLS
-- ... (políticas acima)
```

---

## 🌱 Seeds

```sql
-- seed.sql
-- Dados de exemplo para desenvolvimento

-- Inserir cliente de exemplo (usar após autenticação)
INSERT INTO public.clients (user_id, name, segment, status, contact_phone, monthly_value, due_day)
VALUES 
  ('USER_ID_HERE', 'Construtora Alfa', 'Construção Civil', 'active', '+5511999999999', 1500.00, 5),
  ('USER_ID_HERE', 'Academia FitMax', 'Fitness', 'active', '+5511888888888', 2000.00, 10),
  ('USER_ID_HERE', 'Casa Show Eventos', 'Eventos', 'active', '+5511777777777', 1200.00, 15);

-- Relatório de exemplo
INSERT INTO public.reports (client_id, period_start, period_end, total_spend, total_impressions, total_clicks, total_conversions)
VALUES
  ('CLIENT_ID_HERE', '2025-11-25', '2025-12-01', 4200.00, 124000, 3200, 81);
```

---

## 🔍 Queries Comuns

### Dashboard - Métricas Gerais
```sql
SELECT 
  COUNT(*) as total_clients,
  COUNT(*) FILTER (WHERE status = 'active') as active_clients,
  SUM(monthly_value) as total_revenue
FROM public.clients
WHERE user_id = auth.uid();
```

### Clientes com pagamento atrasado
```sql
SELECT 
  c.*,
  p.due_date,
  p.amount,
  (CURRENT_DATE - p.due_date) as days_overdue
FROM public.clients c
JOIN public.payments p ON p.client_id = c.id
WHERE c.user_id = auth.uid()
  AND p.status = 'overdue'
ORDER BY p.due_date ASC;
```

### Performance consolidada por cliente
```sql
SELECT 
  c.id,
  c.name,
  SUM(r.total_spend) as total_spend,
  SUM(r.total_conversions) as total_conversions,
  AVG(r.cpa) as avg_cpa,
  AVG(r.ctr) as avg_ctr
FROM public.clients c
JOIN public.reports r ON r.client_id = c.id
WHERE c.user_id = auth.uid()
  AND r.period_start >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.id, c.name
ORDER BY total_spend DESC;
```

### Anúncios com fadiga criativa (CTR caindo)
```sql
WITH ad_trends AS (
  SELECT 
    a.id,
    a.ad_name,
    a.ctr as current_ctr,
    LAG(a.ctr) OVER (PARTITION BY a.ad_name ORDER BY r.period_start) as previous_ctr
  FROM public.ads a
  JOIN public.reports r ON r.id = a.report_id
  JOIN public.clients c ON c.id = r.client_id
  WHERE c.user_id = auth.uid()
)
SELECT *,
  ((current_ctr - previous_ctr) / previous_ctr * 100) as ctr_change
FROM ad_trends
WHERE previous_ctr IS NOT NULL
  AND current_ctr < previous_ctr * 0.8; -- CTR caiu mais de 20%
```

---

*Este documento deve ser atualizado sempre que houver alterações no schema do banco de dados.*
