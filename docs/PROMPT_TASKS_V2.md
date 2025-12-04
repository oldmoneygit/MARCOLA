# PROMPT - Implementação Sistema de Tarefas v2 (Operacionais + Nicho)

Cole este prompt no Claude Code para implementar o sistema de tarefas completo do TrafficHub.

---

## 🚀 PROMPT PARA COLAR:

```
Você vai implementar o "Sistema de Tarefas v2" do TrafficHub - um sistema completo de gerenciamento de tarefas com dois tipos de templates:

1. **Templates OPERACIONAIS** - Tarefas padrão do gestor (aplica-se a TODO cliente)
2. **Templates por NICHO** - Tarefas específicas por segmento (fitness, delivery, etc)

Leia a documentação TASKS.md antes de começar.

---

## CONCEITO IMPORTANTE

```
TEMPLATES OPERACIONAIS (category: 'operational')
├── São tarefas do GESTOR DE TRÁFEGO
├── Aplicam-se a TODOS os clientes automaticamente
├── Garantem padrão de excelência na gestão
├── Têm CHECKLIST de subtarefas
└── Periodicidades:
    ├── Diárias: Monitorar KPIs, verificar reprovações, atendimento
    ├── A cada 3 dias: Otimizar criativos, pausar CTR baixo, auditoria funil
    ├── Semanais: Relatório, reunião cliente, testar público novo
    ├── Quinzenais: Deep analysis CAC/LTV, testes estruturais
    └── Mensais: Reunião estratégica, auditoria completa

TEMPLATES POR NICHO (category: 'niche')
├── São tarefas específicas do tipo de negócio
├── Aplicam-se conforme segmento do cliente
├── Usuário seleciona quais quer no onboarding
└── Exemplos:
    ├── Fitness: Campanha aulas experimentais, desafios
    ├── Delivery: Atualizar cardápio, gestão de reviews
    └── E-commerce: Remarketing carrinho, catálogo
```

---

## FASES DE IMPLEMENTAÇÃO

### FASE 1: Database - Migration task_templates

```sql
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Categorização
  category TEXT NOT NULL DEFAULT 'niche' CHECK (category IN ('operational', 'niche')),
  segment TEXT, -- NULL para operacionais, preenchido para nicho
  
  -- Conteúdo
  title TEXT NOT NULL,
  description TEXT,
  checklist JSONB DEFAULT '[]', -- Array de { id, text, done }
  
  -- Recorrência (INCLUI 'every_3_days')
  recurrence TEXT CHECK (recurrence IN ('daily', 'every_3_days', 'weekly', 'biweekly', 'monthly')),
  
  -- Config
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  notify_client BOOLEAN DEFAULT false,
  notify_message TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- true = template padrão (não pode deletar)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_task_templates_category ON task_templates(category);
CREATE INDEX idx_task_templates_segment ON task_templates(segment);
CREATE INDEX idx_task_templates_user ON task_templates(user_id);
CREATE INDEX idx_task_templates_system ON task_templates(is_system);

-- RLS
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own templates or see system" 
  ON task_templates FOR ALL USING (
    auth.uid() = user_id OR is_system = true
  );
```

**Validar:** Executar no Supabase SQL Editor

### FASE 2: Database - Migration tasks

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
  
  -- Categorização
  category TEXT NOT NULL DEFAULT 'niche' CHECK (category IN ('operational', 'niche', 'custom')),
  
  -- Conteúdo
  title TEXT NOT NULL,
  description TEXT,
  checklist JSONB DEFAULT '[]',
  
  -- Datas
  due_date DATE NOT NULL,
  due_time TIME,
  
  -- Status
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done', 'cancelled')),
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurrence TEXT CHECK (recurrence IN ('daily', 'every_3_days', 'weekly', 'biweekly', 'monthly')),
  next_recurrence_date DATE,
  
  -- Notificação
  notify_client BOOLEAN DEFAULT false,
  notify_message TEXT,
  notified_at TIMESTAMPTZ,
  
  -- Conclusão
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tasks_client ON tasks(client_id);
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_recurrence ON tasks(next_recurrence_date) WHERE is_recurring = true;

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks" 
  ON tasks FOR ALL USING (auth.uid() = user_id);
```

**Validar:** Executar no Supabase SQL Editor

### FASE 3: Database - Migration client_notes

```sql
CREATE TABLE client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_client_notes_client ON client_notes(client_id);
CREATE INDEX idx_client_notes_user ON client_notes(user_id);

-- RLS
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notes" 
  ON client_notes FOR ALL USING (auth.uid() = user_id);
```

**Validar:** Executar no Supabase SQL Editor

### FASE 4: Seed - Templates OPERACIONAIS

Inserir TODOS os templates operacionais. São aproximadamente 20 templates.

**IMPORTANTE:**
- category = 'operational'
- segment = NULL
- is_system = true

**Templates DIÁRIOS (5):**
1. Monitoramento de Performance (checklist: CPC/CTR/CPM, reprovações, orçamento, saturação, lances)
2. Atendimento e Comunicação (checklist: mensagens, movimentação, insights)
3. Monitoramento de Concorrência (checklist: anúncios ativos, registrar insights)
4. Monitoramento de Funil/SAC (checklist: WhatsApp, taxa resposta, qualidade)
5. [Delivery] Gestão de Reputação (checklist: iFood, Google, respostas, tendências)

**Templates A CADA 3 DIAS (4):**
1. Otimizações Táticas de Campanha (checklist: pausar CTR baixo, duplicar vencedores, ajustar segmentação, mix estático/vídeo, variações copy)
2. Ajustes de Criativos (checklist: novas versões, headlines, CTAs)
3. Auditoria Rápida de Funil (checklist: tempo resposta, scripts, links quebrados)
4. [Delivery] Revisão de Mix de Ofertas (checklist: margem, giro, estoque)
5. [Fitness] Revisão de Mix de Ofertas (checklist: matrícula, avaliação, challenges)

**Templates SEMANAIS (5):**
1. Relatório Semanal de Performance (checklist: métricas por criativo, ROAS, funil, vencedores/perdedores, aprendizados)
2. Reunião/Update Semanal com Cliente (checklist: positivos, alertas, recomendações, enviar)
3. Planejamento Criativo Semanal (checklist: novos criativos, pauta conteúdo, ofertas)
4. SEO Local (GMB) (checklist: atualizar GMB, fotos, post/promoção)
5. Teste de Novo Público (checklist: criar público, A/B, documentar hipótese)

**Templates QUINZENAIS (4):**
1. Deep Analysis CAC/LTV (checklist: CAC, LTV, recorrência, dias/horários, padrões)
2. Testes Estruturais de Campanha (checklist: CBO vs ABO, UGC/depoimento, oferta forte, documentar)
3. Criativos Premium (checklist: flagship, vídeo motion, identidade visual)
4. Análise Profunda de Concorrência (checklist: melhores campanhas, comparação, oportunidades, gaps)

**Templates MENSAIS (5):**
1. Reunião Estratégica Mensal (checklist: revisão mês, ROI, plano 30 dias, metas, persona, realizar reunião)
2. Planejamento Mensal de Campanhas (checklist: calendário, datas promocionais, campanhas premium, sazonais)
3. Auditoria Completa de Funil (checklist: WhatsApp→Atendimento→Fechamento, churn, scripts, pós-venda)
4. Auditoria de Marca (checklist: padronização visual, tom de voz, percepção valor)
5. Relatório de Inteligência de Mercado (checklist: tendências, oportunidades, insights)

**COPIE O SQL DO TASKS.md** - contém todos os templates com checklists completos.

**Validar:** SELECT COUNT(*) FROM task_templates WHERE category = 'operational'

### FASE 5: Seed - Templates por NICHO

Inserir templates específicos por segmento. São aproximadamente 30+ templates.

**IMPORTANTE:**
- category = 'niche'
- segment = 'fitness' / 'delivery' / 'ecommerce' / 'clinica' / 'servicos' / 'imobiliario' / 'educacao'
- is_system = true

**COPIE O SQL DO TASKS.md** - contém todos os templates por nicho.

**Validar:** SELECT segment, COUNT(*) FROM task_templates WHERE category = 'niche' GROUP BY segment

### FASE 6: Types TypeScript

Criar src/types/task.ts:

```typescript
// Recorrência INCLUI 'every_3_days'
export type TaskRecurrence = 'daily' | 'every_3_days' | 'weekly' | 'biweekly' | 'monthly';

// Categoria
export type TaskCategory = 'operational' | 'niche' | 'custom';

// Checklist
export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

// Prioridade e Status
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'doing' | 'done' | 'cancelled';

// Template
export interface TaskTemplate {
  id: string;
  user_id: string;
  category: TaskCategory;
  segment: string | null;
  title: string;
  description: string | null;
  checklist: ChecklistItem[];
  recurrence: TaskRecurrence | null;
  priority: TaskPriority;
  notify_client: boolean;
  notify_message: string | null;
  order_index: number;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

// Task
export interface Task {
  id: string;
  client_id: string;
  user_id: string;
  template_id: string | null;
  category: TaskCategory;
  title: string;
  description: string | null;
  checklist: ChecklistItem[];
  due_date: string;
  due_time: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  is_recurring: boolean;
  recurrence: TaskRecurrence | null;
  next_recurrence_date: string | null;
  notify_client: boolean;
  notify_message: string | null;
  notified_at: string | null;
  completed_at: string | null;
  completion_notes: string | null;
  created_at: string;
  updated_at: string;
  client?: { id: string; name: string };
}

// Client Note
export interface ClientNote {
  id: string;
  client_id: string;
  user_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

// DTOs
export interface CreateTaskDTO {
  client_id: string;
  template_id?: string;
  category?: TaskCategory;
  title: string;
  description?: string;
  checklist?: ChecklistItem[];
  due_date: string;
  due_time?: string;
  priority?: TaskPriority;
  is_recurring?: boolean;
  recurrence?: TaskRecurrence;
  notify_client?: boolean;
  notify_message?: string;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  checklist?: ChecklistItem[];
  due_date?: string;
  due_time?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  completion_notes?: string;
}

export interface ApplyTemplatesDTO {
  client_id: string;
  template_ids: string[];
}
```

**Validar:** npm run type-check

### FASE 7: API Routes - Tasks

Criar estrutura em src/app/api/:

```
api/
├── tasks/
│   ├── route.ts                    # GET list, POST create
│   ├── [id]/
│   │   └── route.ts                # GET, PUT, DELETE
│   ├── today/
│   │   └── route.ts                # GET tarefas de hoje
│   ├── complete/
│   │   └── route.ts                # POST completar (cria próxima se recorrente)
│   └── apply-templates/
│       └── route.ts                # POST aplicar templates ao cliente
├── templates/
│   ├── route.ts                    # GET list, POST create
│   ├── [id]/
│   │   └── route.ts                # GET, PUT, DELETE
│   ├── operational/
│   │   └── route.ts                # GET apenas operacionais
│   └── by-segment/
│       └── [segment]/
│           └── route.ts            # GET por segmento
└── notes/
    ├── route.ts                    # GET, POST
    └── [id]/
        └── route.ts                # PUT, DELETE
```

**Lógica importante - POST /api/tasks/complete:**

```typescript
export async function POST(req: Request) {
  const { id, completion_notes } = await req.json();
  
  // 1. Buscar tarefa
  const task = await getTask(id);
  
  // 2. Marcar como concluída
  await updateTask(id, {
    status: 'done',
    completed_at: new Date().toISOString(),
    completion_notes
  });
  
  // 3. Se recorrente, criar próxima
  if (task.is_recurring && task.recurrence) {
    const nextDate = calculateNextDate(task.due_date, task.recurrence);
    
    await createTask({
      ...task,
      id: undefined, // Novo ID
      status: 'todo',
      due_date: nextDate,
      completed_at: null,
      checklist: task.checklist.map(item => ({ ...item, done: false })) // Reset checklist
    });
  }
  
  return NextResponse.json({ success: true });
}

function calculateNextDate(currentDate: string, recurrence: TaskRecurrence): string {
  const date = new Date(currentDate);
  switch (recurrence) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'every_3_days':
      date.setDate(date.getDate() + 3);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
  }
  return date.toISOString().split('T')[0];
}
```

**Lógica importante - POST /api/tasks/apply-templates:**

```typescript
export async function POST(req: Request) {
  const { client_id, template_ids } = await req.json();
  
  // 1. Buscar templates
  const templates = await getTemplatesByIds(template_ids);
  
  // 2. Para cada template, criar task
  const tasks = await Promise.all(templates.map(async (template) => {
    const dueDate = calculateInitialDueDate(template.recurrence);
    
    return createTask({
      client_id,
      template_id: template.id,
      category: template.category,
      title: template.title,
      description: template.description,
      checklist: template.checklist,
      due_date: dueDate,
      priority: template.priority,
      is_recurring: !!template.recurrence,
      recurrence: template.recurrence,
      notify_client: template.notify_client,
      notify_message: template.notify_message
    });
  }));
  
  return NextResponse.json({ data: tasks });
}

function calculateInitialDueDate(recurrence: TaskRecurrence | null): string {
  const today = new Date();
  
  switch (recurrence) {
    case 'daily':
    case 'every_3_days':
      return today.toISOString().split('T')[0]; // Hoje
    case 'weekly':
      // Próxima segunda-feira (ou hoje se for segunda)
      const dayOfWeek = today.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
      today.setDate(today.getDate() + daysUntilMonday);
      return today.toISOString().split('T')[0];
    case 'biweekly':
      today.setDate(today.getDate() + 14);
      return today.toISOString().split('T')[0];
    case 'monthly':
      today.setDate(1);
      today.setMonth(today.getMonth() + 1);
      return today.toISOString().split('T')[0];
    default:
      return today.toISOString().split('T')[0];
  }
}
```

**Validar:** npm run build + testar endpoints

### FASE 8: Hooks

Criar hooks em src/hooks/:

**useTasks.ts:**
- fetchTasks(options: { clientId?, category?, status?, dueDate? })
- createTask(data)
- updateTask(id, data)
- deleteTask(id)
- completeTask(id, notes?)
- todayTasks (computed)
- overdueTasks (computed)

**useTemplates.ts:**
- templates (all)
- operationalTemplates (category = 'operational')
- getNicheTemplates(segment)
- createTemplate, updateTemplate, deleteTemplate

**useNotes.ts:**
- fetchNotes(clientId)
- createNote, updateNote, deleteNote, togglePin

**Validar:** npm run type-check

### FASE 9: Componentes Base

Criar em src/components/tasks/:

```
tasks/
├── TaskCard.tsx           # Card com checkbox e checklist expandível
├── TaskList.tsx           # Lista agrupada por prioridade/cliente
├── TaskForm.tsx           # Form criar/editar
├── TaskModal.tsx          # Modal wrapper
├── PriorityBadge.tsx      # 🔴 Urgente, 🟠 Alta, 🟡 Média, 🟢 Baixa
├── RecurrenceBadge.tsx    # 🔄 Diária, 🔄 3 em 3 dias, 🔄 Semanal, etc
├── CategoryBadge.tsx      # 📊 Operacional, 🏷️ Nicho
├── ChecklistView.tsx      # Lista de subtarefas clicáveis
├── TodayTasks.tsx         # Widget dashboard
├── TemplateSelector.tsx   # Seletor no onboarding (2 seções)
├── ClientNotes.tsx        # Seção de notas
├── NoteCard.tsx           # Card de nota individual
├── WhatsAppNotify.tsx     # Modal de notificação WhatsApp
└── index.ts               # Re-exports
```

**RecurrenceBadge deve exibir:**
```typescript
const recurrenceLabels: Record<TaskRecurrence, string> = {
  daily: '🔄 Diária',
  every_3_days: '🔄 3 em 3 dias',
  weekly: '🔄 Semanal',
  biweekly: '🔄 Quinzenal',
  monthly: '🔄 Mensal'
};
```

**Validar:** npm run build

### FASE 10: TemplateSelector (Onboarding)

Componente que aparece ao criar cliente:

```tsx
interface TemplateSelectorProps {
  segment: string; // Segmento selecionado do cliente
  onSelect: (templateIds: string[]) => void;
}

// Layout em 2 seções:
//
// ┌─────────────────────────────────────────────────────────┐
// │ 📊 TAREFAS OPERACIONAIS (Recomendado)                   │
// │ Tarefas padrão de gestão que garantem excelência       │
// │                                                         │
// │ ☑ Monitoramento de Performance        🔄 Diária        │
// │ ☑ Atendimento e Comunicação          🔄 Diária        │
// │ ☑ Otimizações Táticas                🔄 3 em 3 dias   │
// │ ☑ Relatório Semanal                  🔄 Semanal       │
// │ ...                                                     │
// ├─────────────────────────────────────────────────────────┤
// │ 🏷️ TAREFAS DO NICHO: FITNESS                           │
// │ Tarefas específicas para academias e centros fitness   │
// │                                                         │
// │ ☑ Campanha de aulas experimentais     🔄 Mensal        │
// │ ☑ Criar conteúdo de transformação     🔄 Quinzenal     │
// │ ☐ Campanha de desafio fitness         🔄 Mensal        │
// │ ...                                                     │
// └─────────────────────────────────────────────────────────┘
// 
// Templates OPERACIONAIS vêm PRÉ-SELECIONADOS
// Templates de NICHO vêm PRÉ-SELECIONADOS mas podem ser desmarcados
```

**Validar:** Testar visualmente

### FASE 11: Integração no Onboarding de Cliente

Modificar formulário de criação de cliente:

1. Após preencher dados básicos e selecionar segmento
2. Exibir step com TemplateSelector
3. Usuário confirma seleção de templates
4. Ao salvar cliente:
   - Criar cliente
   - Aplicar templates selecionados (POST /api/tasks/apply-templates)

```typescript
const onSubmit = async (data: ClientFormData) => {
  // 1. Criar cliente
  const client = await createClient(data);
  
  // 2. Aplicar templates se selecionados
  if (selectedTemplateIds.length > 0) {
    await fetch('/api/tasks/apply-templates', {
      method: 'POST',
      body: JSON.stringify({
        client_id: client.id,
        template_ids: selectedTemplateIds
      })
    });
  }
  
  toast.success('Cliente criado com tarefas!');
};
```

**Validar:** Testar fluxo completo

### FASE 12: Widget TodayTasks no Dashboard

Adicionar widget no dashboard:

- Exibir tarefas de hoje
- Agrupar por prioridade (Urgentes primeiro)
- Mostrar nome do cliente
- Badge de categoria (Operacional/Nicho)
- Checkbox para marcar concluída
- Expandir checklist ao clicar
- Link "Ver todas" → /tasks

**Validar:** Testar no dashboard

### FASE 13: Página /tasks

Página completa de tarefas:

- Filtros: Hoje, Atrasadas, Semana, Todas
- Filtro por categoria: Todas, Operacionais, Nicho
- Filtro por cliente (dropdown)
- Agrupamento: Por cliente, Por data, Por prioridade
- Criação rápida de tarefa
- Checklist expandível

**Validar:** npm run build + testar

### FASE 14: Aba Tarefas no Cliente

Adicionar aba no card/página do cliente:

- Lista de tarefas do cliente
- Separar Pendentes / Concluídas
- Criar nova tarefa (vinculada ao cliente)
- Filtro por categoria

**Validar:** Testar visualmente

### FASE 15: Página /templates

Página para gerenciar templates:

- Listar todos os templates
- Separar Operacionais / Por Nicho
- Templates is_system=true não podem ser deletados
- Criar templates customizados
- Editar, ativar/desativar

**Validar:** npm run build + testar

---

## REGRAS CRÍTICAS

1. **Recorrência 'every_3_days'**: Incluir em TODOS os lugares (types, selects, badges, cálculos)

2. **Templates is_system**: NÃO podem ser deletados pelo usuário

3. **Checklist como JSONB**: Usar ChecklistItem[] - sempre com {id, text, done}

4. **Ao completar recorrente**: SEMPRE criar próxima ocorrência + resetar checklist

5. **Onboarding**: Templates OPERACIONAIS PRÉ-SELECIONADOS por padrão

6. **Validações após CADA fase**:
   ```bash
   npm run type-check && npm run lint && npm run build
   ```

7. **Visual**: Seguir DESIGN_SYSTEM.md (glassmorphism)

---

## FORMATO DE RESPOSTA

Após cada fase:

```
## ✅ FASE X Concluída: [Nome]

### Arquivos Criados/Modificados:
- path/to/file.ts - Descrição

### Validações:
- ✅ TypeScript: OK
- ✅ Lint: OK
- ✅ Build: OK

### Próxima Fase:
[Nome]
```

---

## COMECE AGORA

1. Confirme que leu TASKS.md
2. Liste quantos templates operacionais e por nicho existem
3. Inicie pela FASE 1: Database - Migration task_templates

Aguardo confirmação.
```

---

## 📝 PROMPTS AUXILIARES

### Para verificar progresso:

```
Qual fase estamos? Liste:
- Fases concluídas
- Fase atual
- O que falta
```

### Se der erro de build:

```
Pare. Execute npm run build e mostre o erro completo.
Corrija ANTES de continuar.
```

### Para testar a aplicação de templates:

```
Teste o fluxo:
1. Crie um cliente do segmento "fitness"
2. Verifique se o TemplateSelector aparece
3. Confirme a seleção de templates
4. Verifique se as tarefas foram criadas
5. Confirme que aparecem no dashboard
```

### Se o checklist não funcionar:

```
O checklist deve:
1. Ser um array JSONB no banco
2. Ter estrutura: [{ id: string, text: string, done: boolean }]
3. Ao clicar em item, atualizar o done
4. Ao completar tarefa recorrente, resetar todos para done: false
Corrija a implementação.
```

### Para continuar de onde parou:

```
Continue a implementação do Sistema de Tarefas v2.
Última fase concluída: [X]
Continue para a fase [X+1].
```

---

## 🎯 RESULTADO ESPERADO

Ao final das 15 fases:

### Templates:
- ✅ ~20 templates OPERACIONAIS (diárias, 3 dias, semanais, quinzenais, mensais)
- ✅ ~30 templates por NICHO (7 segmentos)
- ✅ Todos com checklist de subtarefas
- ✅ Templates do sistema protegidos contra deleção

### Tarefas:
- ✅ Tarefas vinculadas a clientes
- ✅ Prioridade visual (Urgente/Alta/Média/Baixa)
- ✅ Recorrência incluindo "a cada 3 dias"
- ✅ Checklist de subtarefas clicável
- ✅ Ao completar recorrente, cria próxima automaticamente

### Onboarding:
- ✅ TemplateSelector com 2 seções
- ✅ Templates operacionais pré-selecionados
- ✅ Templates do nicho pré-selecionados
- ✅ Aplica templates ao criar cliente

### Interface:
- ✅ Widget "Tarefas de Hoje" no dashboard
- ✅ Página /tasks com filtros
- ✅ Aba Tarefas no card do cliente
- ✅ Página /templates para gerenciamento

### Badges Visuais:
- ✅ PriorityBadge (🔴🟠🟡🟢)
- ✅ RecurrenceBadge (Diária, 3 em 3 dias, Semanal, etc)
- ✅ CategoryBadge (Operacional / Nicho)
