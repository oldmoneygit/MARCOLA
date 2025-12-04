# IMPLEMENTATION_PLAN.md - Plano de Implementação MARCOLA

> **Documento de execução** - Todas as features identificadas nos documentos, organizadas por prioridade e fase.

**Criado:** 2024-12-04
**Status:** Em Execução

---

## Resumo da Análise

### O que JÁ EXISTE no banco de dados:

| Tabela | Registros | Status |
|--------|-----------|--------|
| clients | 12 | Completa |
| reports | 3 | Completa |
| ads | 25 | Completa |
| payments | 10 | Completa |
| suggestions | 12 | Completa |
| client_credentials | 4 | Completa |
| task_templates | 125 | Precisa atualização |
| tasks | 11 | Precisa atualização |
| client_notes | 0 | Completa |
| content_calendar | 4 | Completa |
| calendar_templates | 0 | Completa |
| briefing_templates | 2 | Completa |
| briefing_questions | 39 | Completa |
| client_intelligence | 2 | Completa |

### O que PRECISA ser implementado:

#### Prioridade ALTA (Core Features)

1. **Sistema de Tasks v2**
   - Adicionar `category` (operational/niche/custom)
   - Adicionar `checklist` JSONB
   - Adicionar recorrência `every_3_days`
   - Adicionar `completion_notes`
   - Adicionar `is_system` nos templates

2. **Checklists de Rotina**
   - Nova tabela `routine_checklists`
   - Checklists diários, 3 dias, semanais, mensais
   - Componentes de visualização

3. **Sistema de Auditorias**
   - Nova tabela `audits`
   - Tipos: Funil, Concorrência, Marca, Fantasma
   - Componentes de formulário e visualização

#### Prioridade MÉDIA (Value-Add Features)

4. **Health Score do Cliente**
   - Cálculo automático baseado em performance, engajamento, financeiro
   - Widget no dashboard
   - Histórico de scores

5. **Templates OPERACIONAIS**
   - Seeds dos templates operacionais (diários, 3 dias, semanais, etc.)
   - Diferenciação visual operacional vs nicho

#### Prioridade BAIXA (Nice-to-Have)

6. **Team Management**
   - Perfis/funções
   - Atribuição de tarefas
   - Níveis de acesso

7. **Integrações Externas**
   - Google Calendar
   - Facebook/Meta Ads API
   - WhatsApp Business API

---

## Fases de Implementação

### FASE 1: Database - Atualizar Tasks

**Migration:** `add_tasks_v2_columns`

```sql
-- Adicionar novas colunas na tabela tasks
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'niche'
  CHECK (category IN ('operational', 'niche', 'custom')),
ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Atualizar constraint de recurrence para incluir every_3_days
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_recurrence_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_recurrence_check
  CHECK (recurrence IN ('daily', 'every_3_days', 'weekly', 'biweekly', 'monthly'));
```

**Validação:**
- [ ] Migration aplicada sem erros
- [ ] Colunas visíveis na tabela

---

### FASE 2: Database - Atualizar Task Templates

**Migration:** `add_task_templates_v2_columns`

```sql
-- Adicionar novas colunas na tabela task_templates
ALTER TABLE task_templates
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'niche'
  CHECK (category IN ('operational', 'niche')),
ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- Atualizar constraint de recurrence para incluir every_3_days
ALTER TABLE task_templates DROP CONSTRAINT IF EXISTS task_templates_recurrence_check;
ALTER TABLE task_templates ADD CONSTRAINT task_templates_recurrence_check
  CHECK (recurrence IN ('daily', 'every_3_days', 'weekly', 'biweekly', 'monthly'));
```

**Validação:**
- [ ] Migration aplicada sem erros
- [ ] Colunas visíveis na tabela

---

### FASE 3: Database - Criar Routine Checklists

**Migration:** `create_routine_checklists`

```sql
CREATE TABLE routine_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Identificação
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', '3days', 'weekly', 'biweekly', 'monthly')),

  -- Items do checklist
  items JSONB NOT NULL DEFAULT '[]',
  -- Estrutura: [{ id, text, category, is_checked, notes, alert_if_unchecked }]

  -- Status
  is_template BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  completion_percentage INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_routine_checklists_user ON routine_checklists(user_id);
CREATE INDEX idx_routine_checklists_client ON routine_checklists(client_id);
CREATE INDEX idx_routine_checklists_frequency ON routine_checklists(frequency);

-- RLS
ALTER TABLE routine_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own checklists"
ON routine_checklists FOR ALL
USING (user_id = auth.uid());
```

---

### FASE 4: Database - Criar Sistema de Auditorias

**Migration:** `create_audits`

```sql
CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Tipo de auditoria
  type TEXT NOT NULL CHECK (type IN ('funnel', 'competitor', 'brand', 'mystery_shopper')),

  -- Dados da auditoria (estrutura flexível por tipo)
  data JSONB NOT NULL DEFAULT '{}',

  -- Resumo
  overall_score DECIMAL(3,1),
  critical_issues JSONB DEFAULT '[]',
  quick_wins JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',

  -- Anexos
  attachments JSONB DEFAULT '[]',

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'shared')),
  shared_with_client BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_audits_user ON audits(user_id);
CREATE INDEX idx_audits_client ON audits(client_id);
CREATE INDEX idx_audits_type ON audits(type);

-- RLS
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own audits"
ON audits FOR ALL
USING (user_id = auth.uid());
```

---

### FASE 5: Database - Health Score

**Migration:** `add_client_health_score`

```sql
-- Adicionar coluna de health score no cliente
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS health_score DECIMAL(4,1),
ADD COLUMN IF NOT EXISTS health_score_updated_at TIMESTAMPTZ;

-- Tabela de histórico de scores
CREATE TABLE client_health_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Scores por componente
  performance_score DECIMAL(4,1),
  engagement_score DECIMAL(4,1),
  financial_score DECIMAL(4,1),
  compliance_score DECIMAL(4,1),
  overall_score DECIMAL(4,1),

  -- Detalhes
  details JSONB DEFAULT '{}',

  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_health_score_history_client ON client_health_score_history(client_id);
CREATE INDEX idx_health_score_history_date ON client_health_score_history(calculated_at);

-- RLS
ALTER TABLE client_health_score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view clients they own"
ON client_health_score_history FOR SELECT
USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
```

---

### FASE 6: TypeScript Types

**Arquivo:** `src/types/tasks-v2.ts`

```typescript
// Recorrência com every_3_days
export type TaskRecurrenceV2 = 'daily' | 'every_3_days' | 'weekly' | 'biweekly' | 'monthly';

// Categoria
export type TaskCategory = 'operational' | 'niche' | 'custom';

// Checklist Item
export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  category?: string;
}

// Task Template v2
export interface TaskTemplateV2 {
  id: string;
  user_id: string | null;
  category: TaskCategory;
  segment: string | null;
  title: string;
  description: string | null;
  checklist: ChecklistItem[];
  recurrence: TaskRecurrenceV2 | null;
  priority: TaskPriority;
  notify_client: boolean;
  notify_message: string | null;
  order_index: number;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

// Task v2
export interface TaskV2 extends Omit<Task, 'recurrence'> {
  category: TaskCategory;
  checklist: ChecklistItem[];
  recurrence: TaskRecurrenceV2 | null;
  completion_notes: string | null;
}
```

**Arquivo:** `src/types/audit.ts`

```typescript
export type AuditType = 'funnel' | 'competitor' | 'brand' | 'mystery_shopper';

export interface FunnelStage {
  name: string;
  conversion_rate: number;
  avg_time: string;
  bottlenecks: string[];
  score: number;
}

export interface FunnelAudit {
  stages: FunnelStage[];
  channels: {
    channel: string;
    response_time: string;
    quality_score: number;
    issues: string[];
  }[];
  scripts: {
    name: string;
    is_updated: boolean;
    effectiveness: number;
    suggestions: string[];
  }[];
}

export interface Audit {
  id: string;
  user_id: string;
  client_id: string;
  type: AuditType;
  data: FunnelAudit | CompetitorAudit | BrandAudit | MysteryShopperAudit;
  overall_score: number;
  critical_issues: string[];
  quick_wins: string[];
  recommendations: string[];
  status: 'draft' | 'completed' | 'shared';
  created_at: string;
  updated_at: string;
}
```

---

### FASE 7: API Routes

**Estrutura:**

```
src/app/api/
├── tasks/
│   ├── complete/route.ts          # POST - Completar tarefa (+ criar próxima se recorrente)
│   └── ... (existentes)
├── templates/
│   ├── operational/route.ts       # GET - Templates operacionais
│   └── by-segment/[segment]/route.ts
├── checklists/
│   ├── route.ts                   # GET, POST
│   ├── [id]/route.ts              # GET, PUT, DELETE
│   └── by-client/[clientId]/route.ts
├── audits/
│   ├── route.ts                   # GET, POST
│   ├── [id]/route.ts              # GET, PUT, DELETE
│   └── by-client/[clientId]/route.ts
└── health-score/
    ├── [clientId]/route.ts        # GET, POST (recalcular)
    └── history/[clientId]/route.ts
```

---

### FASE 8: Componentes React

**Tasks v2:**
```
src/components/tasks/
├── ChecklistView.tsx              # Lista de subtarefas clicáveis
├── RecurrenceBadge.tsx            # Badge com "3 em 3 dias"
├── CategoryBadge.tsx              # Operacional / Nicho
└── TaskCardV2.tsx                 # Card com checklist expandível
```

**Auditorias:**
```
src/components/audits/
├── AuditCard.tsx                  # Card resumo
├── AuditForm.tsx                  # Formulário de auditoria
├── FunnelAuditView.tsx            # Visualização do funil
├── CompetitorAuditView.tsx        # Visualização da concorrência
├── MysteryShopperView.tsx         # Visualização cliente oculto
└── index.ts
```

**Health Score:**
```
src/components/health-score/
├── HealthScoreCard.tsx            # Card com score visual
├── HealthScoreHistory.tsx         # Gráfico de histórico
├── HealthScoreBreakdown.tsx       # Breakdown por componente
└── index.ts
```

---

## Checklist de Validação

Após cada fase, executar:

```bash
# 1. TypeScript
npm run type-check

# 2. Lint
npm run lint

# 3. Build
npm run build

# 4. Se houver testes
npm run test
```

---

## Ordem de Execução Recomendada

| # | Fase | Prioridade | Dependências |
|---|------|------------|--------------|
| 1 | DB: Tasks v2 columns | Alta | Nenhuma |
| 2 | DB: Task Templates v2 | Alta | Fase 1 |
| 3 | Types: tasks-v2.ts | Alta | Fase 1-2 |
| 4 | API: /tasks/complete | Alta | Fase 1-3 |
| 5 | Components: ChecklistView | Alta | Fase 3-4 |
| 6 | DB: Routine Checklists | Média | Nenhuma |
| 7 | DB: Audits | Média | Nenhuma |
| 8 | DB: Health Score | Média | Nenhuma |
| 9 | Types: checklist.ts | Média | Fase 6 |
| 10 | Types: audit.ts | Média | Fase 7 |
| 11 | API: /checklists/* | Média | Fase 6,9 |
| 12 | API: /audits/* | Média | Fase 7,10 |
| 13 | API: /health-score/* | Média | Fase 8 |
| 14 | Components: Audits | Média | Fase 12 |
| 15 | Components: Health Score | Média | Fase 13 |

---

## Próximos Passos (Após Core)

1. **Seeds de Templates Operacionais** - Inserir todos os templates do MARCOLA_FEATURES_PACK.md
2. **TemplateSelector no Onboarding** - Separar operacionais de nichos
3. **Widget TodayTasks melhorado** - Com checklists
4. **Página /audits** - Gerenciamento de auditorias
5. **Dashboard de Health Scores** - Visão geral de todos os clientes

---

*Este documento será atualizado conforme as fases forem completadas.*
