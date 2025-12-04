# TASKS.md - Sistema de Tarefas e Onboarding por Nicho

---

## 📋 Visão Geral

O módulo de Tasks do TrafficHub implementa um sistema completo de gerenciamento de tarefas com:

1. **Templates Operacionais** - Tarefas padrão do gestor de tráfego (aplica-se a TODOS os clientes)
2. **Templates por Nicho** - Tarefas específicas por segmento de cliente
3. **Tasks Organizadas** - Visão diária, prioridades, recorrências
4. **Follow-up Automático** - Notificação via WhatsApp ao concluir tarefas
5. **Notas do Cliente** - Histórico de observações e acompanhamento

### Dois Tipos de Templates

```
┌─────────────────────────────────────────────────────────────────┐
│                     SISTEMA DE TEMPLATES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 TEMPLATES OPERACIONAIS (categoria: 'operational')           │
│  ├── Aplica-se a TODOS os clientes                              │
│  ├── São tarefas do GESTOR (não do cliente)                     │
│  └── Garantem padrão de excelência na gestão                    │
│                                                                 │
│      Diárias → Monitorar KPIs, verificar reprovações            │
│      3 dias  → Otimizar criativos, pausar CTR baixo             │
│      Semanal → Relatório, testar público novo                   │
│      Quinzenal → Deep analysis, análise concorrência            │
│      Mensal → Reunião estratégica, auditoria completa           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🏷️ TEMPLATES POR NICHO (categoria: 'niche')                    │
│  ├── Aplica-se conforme segmento do cliente                     │
│  ├── São tarefas específicas do negócio                         │
│  └── Personalizadas por tipo de cliente                         │
│                                                                 │
│      Fitness → Campanha aulas experimentais, desafios           │
│      Delivery → Atualizar cardápio, fotos de pratos             │
│      E-commerce → Remarketing carrinho, catálogo                │
│      Clínica → Campanha agendamentos, depoimentos               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Problema que Resolve

| Antes | Depois |
|-------|--------|
| Esquece tarefas importantes | Tasks recorrentes automáticas |
| Não sabe o que fazer hoje | Visão "Tarefas de Hoje" |
| Cliente não sabe o status | Follow-up automático WhatsApp |
| Cada cliente começa do zero | Templates por nicho prontos |
| Tarefas sem prioridade clara | Sistema de prioridades visual |
| Gestão inconsistente | Templates operacionais padronizam |
| Esquece de otimizar a cada 3 dias | Recorrência "every_3_days" |

---

## 🗄️ Schema do Banco de Dados

### Tabela: `task_templates`

Templates de tarefas (operacionais e por nicho).

```sql
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Categorização
  category TEXT NOT NULL DEFAULT 'niche' CHECK (category IN ('operational', 'niche')),
  segment TEXT, -- NULL para templates operacionais, preenchido para nicho
  
  -- Conteúdo
  title TEXT NOT NULL,
  description TEXT,
  checklist JSONB DEFAULT '[]', -- Lista de subtarefas/checklist
  
  -- Recorrência
  recurrence TEXT CHECK (recurrence IN ('daily', 'every_3_days', 'weekly', 'biweekly', 'monthly')),
  
  -- Prioridade e notificação
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  notify_client BOOLEAN DEFAULT false,
  notify_message TEXT,
  
  -- Organização
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- true = template padrão do sistema (não pode deletar)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_task_templates_category ON task_templates(category);
CREATE INDEX idx_task_templates_segment ON task_templates(segment);
CREATE INDEX idx_task_templates_user ON task_templates(user_id);
CREATE INDEX idx_task_templates_system ON task_templates(is_system);
```

### Tabela: `tasks`

Tarefas vinculadas aos clientes.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
  
  -- Categorização (herdado do template ou manual)
  category TEXT NOT NULL DEFAULT 'niche' CHECK (category IN ('operational', 'niche', 'custom')),
  
  -- Conteúdo
  title TEXT NOT NULL,
  description TEXT,
  checklist JSONB DEFAULT '[]', -- Lista de subtarefas com status
  
  -- Datas
  due_date DATE NOT NULL,
  due_time TIME,
  
  -- Status e prioridade
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
  completion_notes TEXT, -- Notas ao completar
  
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
```

### Tabela: `client_notes`

Notas e anotações de follow-up do cliente.

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
CREATE INDEX idx_client_notes_created ON client_notes(created_at DESC);
```

### RLS Policies

```sql
-- task_templates
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own templates"
  ON task_templates FOR ALL
  USING (auth.uid() = user_id);

-- tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL
  USING (auth.uid() = user_id);

-- client_notes
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes"
  ON client_notes FOR ALL
  USING (auth.uid() = user_id);
```

---

## 📊 Types TypeScript

```typescript
// src/types/task.ts

/**
 * @file task.ts
 * @description Tipos relacionados a tarefas e templates
 * @module types
 */

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'doing' | 'done' | 'cancelled';
export type TaskRecurrence = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface TaskTemplate {
  id: string;
  user_id: string;
  segment: string;
  title: string;
  description?: string;
  recurrence?: TaskRecurrence;
  priority: TaskPriority;
  notify_client: boolean;
  notify_message?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  client_id: string;
  user_id: string;
  template_id?: string;
  title: string;
  description?: string;
  due_date: string;
  due_time?: string;
  priority: TaskPriority;
  status: TaskStatus;
  is_recurring: boolean;
  recurrence?: TaskRecurrence;
  next_recurrence_date?: string;
  notify_client: boolean;
  notify_message?: string;
  notified_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Relações (quando join)
  client?: {
    id: string;
    name: string;
    contact_phone?: string;
    contact_name?: string;
  };
}

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
  title: string;
  description?: string;
  due_date: string;
  due_time?: string;
  priority?: TaskPriority;
  is_recurring?: boolean;
  recurrence?: TaskRecurrence;
  notify_client?: boolean;
  notify_message?: string;
}

export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {
  status?: TaskStatus;
}

export interface CreateTemplateDTO {
  segment: string;
  title: string;
  description?: string;
  recurrence?: TaskRecurrence;
  priority?: TaskPriority;
  notify_client?: boolean;
  notify_message?: string;
}

export interface CreateNoteDTO {
  client_id: string;
  content: string;
  is_pinned?: boolean;
}
```

---

## 🎨 Componentes

### Estrutura de Pastas

```
src/components/tasks/
├── TaskCard.tsx              # Card individual de tarefa com ações rápidas
├── TaskList.tsx              # Lista de tarefas (filtrada) com suporte a clientsMap
├── TaskForm.tsx              # Formulário criar/editar tarefa
├── TaskModal.tsx             # Modal de detalhes da tarefa
├── TodayTasks.tsx            # Widget "Tarefas de Hoje"
├── PriorityBadge.tsx         # Badge de prioridade colorido
├── TaskStatusBadge.tsx       # Badge de status da tarefa
├── RecurrenceBadge.tsx       # Badge de recorrência
├── TaskQuickActions.tsx      # ⭐ NOVO: Ações rápidas contextuais
├── AddTaskFromTemplateModal.tsx  # ⭐ NOVO: Modal para criar tarefa de template
├── TemplateSelector.tsx      # Seletor de templates no onboarding
├── TemplateManager.tsx       # Gerenciador de templates
├── ClientNotes.tsx           # Seção de notas do cliente
├── NoteCard.tsx              # Card individual de nota
├── WhatsAppNotify.tsx        # Modal de notificação WhatsApp
└── index.ts
```

---

## ⭐ Sistema de Ações Rápidas Contextuais (TaskQuickActions)

### Visão Geral

O sistema de ações rápidas detecta automaticamente o tipo de tarefa baseado em keywords no título e exibe botões de ação relevantes que aceleram o workflow do gestor.

### Tipos de Tarefa Detectados

| Tipo | Keywords | Ações Rápidas |
|------|----------|---------------|
| **criativos** | criativo, captação, gravação, foto, video, design, arte, banner, story, reels | Ads Manager, Google Drive |
| **anuncios** | anúncio, campanha, ads, tráfego, performance, conversão, público, remarketing | Ads Manager, Google Ads |
| **reuniao** | reunião, alinhamento, call, meeting, kickoff, onboarding, feedback | Agendar (calendário), WhatsApp/Email |
| **analise** | análise, auditoria, relatório, métricas, funil, churn, cac, ltv, roas | Relatórios, Ads Manager |
| **social** | instagram, facebook, tiktok, stories, feed, post, engajamento | Instagram, Google Drive |
| **financeiro** | cobrança, pagamento, fatura, nota fiscal, boleto, pix | WhatsApp (lembrete), Email |

### Interface ClientData

```typescript
interface ClientData {
  id: string;
  name: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  contact_name?: string | null;
  drive_url?: string | null;
  ads_account_url?: string | null;
  google_ads_account_url?: string | null;
  instagram_url?: string | null;
  credentials?: ClientCredential[];
}
```

### Uso do Componente

```tsx
import { TaskQuickActions, detectTaskType } from '@/components/tasks';

// Em um TaskCard
<TaskQuickActions
  task={task}
  clientData={clientData}
  onCreateCalendarEvent={handleCreateCalendarEvent}
  size="sm"
  className="mt-2"
/>

// Verificar se tarefa tem tipo detectável
{detectTaskType(task.title) && (
  <TaskQuickActions task={task} clientData={clientData} />
)}
```

### Props do TaskQuickActions

| Prop | Tipo | Descrição |
|------|------|-----------|
| `task` | `Task` | Tarefa para a qual exibir ações |
| `clientData` | `ClientData \| null` | Dados do cliente para links contextuais |
| `onCreateCalendarEvent` | `(task: Task) => void` | Callback para criar evento no calendário |
| `size` | `'sm' \| 'md'` | Tamanho dos botões (default: 'sm') |
| `className` | `string` | Classes CSS adicionais |

### Fluxo de Detecção

```
1. Título da tarefa → normalizado (lowercase, sem acentos)
2. Busca keywords em ordem de prioridade:
   reuniao → criativos → anuncios → analise → social → financeiro
3. Primeiro match retorna o tipo
4. Ações são geradas baseadas no tipo + dados disponíveis do cliente
```

### Integração com Componentes

O TaskQuickActions está integrado em:

1. **TaskCard** - Aparece no corpo do card (quando `showQuickActions={true}`)
2. **TaskList** - Propaga clientData para cada TaskCard
3. **ClientCard** - Exibe ações rápidas inline nas tarefas expandidas
4. **TasksPageContent** - Usa clientsMap para múltiplos clientes
5. **ClientDetailContent** - Passa clientData do cliente atual

---

## ⭐ Modal de Criação de Tarefa a partir de Template

### AddTaskFromTemplateModal

Modal que permite criar uma tarefa diretamente a partir de um template existente, pré-preenchendo os campos.

```tsx
import { AddTaskFromTemplateModal } from '@/components/tasks';

<AddTaskFromTemplateModal
  isOpen={showTemplateModal}
  onClose={() => setShowTemplateModal(false)}
  clientId={client.id}
  onTaskCreated={(task) => {
    // Tarefa criada com sucesso
    refetchTasks();
  }}
/>
```

### Fluxo do Modal

1. Carrega templates disponíveis (operacionais + do segmento do cliente)
2. Usuário seleciona um template
3. Campos são pré-preenchidos (título, descrição, prioridade, recorrência)
4. Usuário pode ajustar e definir data de vencimento
5. Ao submeter, cria a tarefa vinculada ao template

---

## 🔧 Atualizações nos Componentes Existentes

### TaskCard - Atualizado

Novas props adicionadas:

```typescript
interface TaskCardProps {
  task: Task;
  clientData?: ClientData | null;           // ⭐ NOVO
  onStatusChange?: (id: string, status: TaskStatus) => Promise<void>;
  onClick?: (task: Task) => void;
  onDelete?: (id: string) => Promise<void>;
  onChecklistUpdate?: (id: string, checklist: ChecklistItem[]) => Promise<void>;
  onCreateCalendarEvent?: (task: Task) => void;  // ⭐ NOVO
  showClient?: boolean;
  showQuickActions?: boolean;               // ⭐ NOVO (default: true)
  compact?: boolean;
}
```

### TaskList - Atualizado

Novas props para suporte a múltiplos clientes:

```typescript
interface TaskListProps {
  tasks: Task[];
  clientData?: ClientData | null;           // Cliente único
  clientsMap?: Map<string, ClientData>;     // ⭐ NOVO: Múltiplos clientes
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onTaskClick?: (task: Task) => void;
  onDelete?: (taskId: string) => Promise<void>;
  onChecklistUpdate?: (taskId: string, checklist: ChecklistItem[]) => Promise<void>;
  onCreateCalendarEvent?: (task: Task) => void;  // ⭐ NOVO
  showFilters?: boolean;
  showClient?: boolean;
  showQuickActions?: boolean;               // ⭐ NOVO
  compact?: boolean;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}
```

### ClientCard - Atualizado

Agora exibe ações rápidas nas tarefas expandidas:

```tsx
// Prepara clientData
const clientData: ClientData = useMemo(() => ({
  id: client.id,
  name: client.name,
  contact_phone: client.contact_phone,
  contact_email: client.contact_email,
  contact_name: client.contact_name,
  drive_url: client.drive_url,
  ads_account_url: client.ads_account_url,
  google_ads_account_url: client.google_ads_account_url,
  instagram_url: client.instagram_url,
}), [client]);

// No JSX das tarefas
{detectTaskType(task.title) && (
  <TaskQuickActions
    task={task}
    clientData={clientData}
    size="sm"
    className="ml-auto"
  />
)}
```

### Componente: `PriorityBadge`

```tsx
/**
 * @file PriorityBadge.tsx
 * @description Badge visual de prioridade da tarefa
 * @module components/tasks
 */
'use client';

import { TaskPriority } from '@/types/task';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
}

const priorityConfig: Record<TaskPriority, { label: string; className: string; icon: string }> = {
  urgent: {
    label: 'Urgente',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: '🔴',
  },
  high: {
    label: 'Alta',
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    icon: '🟠',
  },
  medium: {
    label: 'Média',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: '🟡',
  },
  low: {
    label: 'Baixa',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: '🟢',
  },
};

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
```

### Componente: `TaskCard`

```tsx
/**
 * @file TaskCard.tsx
 * @description Card de tarefa com ações
 * @module components/tasks
 */
'use client';

import { useState, useCallback } from 'react';
import { Task } from '@/types/task';
import { GlassCard } from '@/components/ui';
import { PriorityBadge } from './PriorityBadge';
import { RecurrenceBadge } from './RecurrenceBadge';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: Task['status']) => void;
  onEdit: (task: Task) => void;
  onNotify: (task: Task) => void;
  showClient?: boolean;
}

export function TaskCard({ 
  task, 
  onStatusChange, 
  onEdit, 
  onNotify,
  showClient = false 
}: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleComplete = useCallback(async () => {
    setIsUpdating(true);
    await onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done');
    setIsUpdating(false);
    
    // Se marcou como feito e tem notificação, abre modal
    if (task.status !== 'done' && task.notify_client) {
      onNotify(task);
    }
  }, [task, onStatusChange, onNotify]);

  const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <GlassCard
      className={cn(
        'p-4 transition-all',
        task.status === 'done' && 'opacity-60',
        isOverdue && 'border-red-500/30'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleComplete}
          disabled={isUpdating}
          className={cn(
            'mt-1 h-5 w-5 rounded-md border-2 flex-shrink-0 transition-all',
            'flex items-center justify-center',
            task.status === 'done'
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-white/20 hover:border-white/40'
          )}
        >
          {task.status === 'done' && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={cn(
                'font-medium text-white',
                task.status === 'done' && 'line-through text-zinc-400'
              )}
            >
              {task.title}
            </h4>
            <PriorityBadge priority={task.priority} size="sm" />
            {task.is_recurring && task.recurrence && (
              <RecurrenceBadge recurrence={task.recurrence} />
            )}
            {task.notify_client && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                📱 WhatsApp
              </span>
            )}
          </div>

          {showClient && task.client && (
            <p className="text-sm text-zinc-400 mt-1">
              👤 {task.client.name}
            </p>
          )}

          {task.description && (
            <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
            <span className={cn(isOverdue && 'text-red-400')}>
              📅 {formatDate(task.due_date)}
              {task.due_time && ` às ${task.due_time}`}
            </span>
            {isOverdue && (
              <span className="text-red-400 font-medium">⚠️ Atrasada</span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            ✏️
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
```

### Componente: `TodayTasks` (Widget Dashboard)

```tsx
/**
 * @file TodayTasks.tsx
 * @description Widget de tarefas do dia para o dashboard
 * @module components/tasks
 */
'use client';

import { useMemo } from 'react';
import { Task } from '@/types/task';
import { GlassCard } from '@/components/ui';
import { TaskCard } from './TaskCard';

interface TodayTasksProps {
  tasks: Task[];
  onStatusChange: (id: string, status: Task['status']) => void;
  onEdit: (task: Task) => void;
  onNotify: (task: Task) => void;
  onViewAll: () => void;
}

export function TodayTasks({ 
  tasks, 
  onStatusChange, 
  onEdit, 
  onNotify,
  onViewAll 
}: TodayTasksProps) {
  // Agrupa por prioridade
  const groupedTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.due_date === today && t.status !== 'done');
    
    return {
      urgent: todayTasks.filter(t => t.priority === 'urgent'),
      high: todayTasks.filter(t => t.priority === 'high'),
      medium: todayTasks.filter(t => t.priority === 'medium'),
      low: todayTasks.filter(t => t.priority === 'low'),
    };
  }, [tasks]);

  const totalToday = Object.values(groupedTasks).flat().length;
  const completedToday = tasks.filter(
    t => t.due_date === new Date().toISOString().split('T')[0] && t.status === 'done'
  ).length;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            📋 Tarefas de Hoje
          </h3>
          <p className="text-sm text-zinc-400">
            {completedToday} de {totalToday + completedToday} concluídas
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          Ver todas →
        </button>
      </div>

      {totalToday === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          <span className="text-4xl mb-2 block">🎉</span>
          <p>Nenhuma tarefa pendente para hoje!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Urgentes primeiro */}
          {groupedTasks.urgent.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onNotify={onNotify}
              showClient
            />
          ))}
          {/* Alta prioridade */}
          {groupedTasks.high.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onNotify={onNotify}
              showClient
            />
          ))}
          {/* Média prioridade */}
          {groupedTasks.medium.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onNotify={onNotify}
              showClient
            />
          ))}
          {/* Baixa prioridade */}
          {groupedTasks.low.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onNotify={onNotify}
              showClient
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
```

### Componente: `TemplateSelector` (Onboarding)

```tsx
/**
 * @file TemplateSelector.tsx
 * @description Seletor de templates no onboarding de cliente
 * @module components/tasks
 */
'use client';

import { useState, useEffect } from 'react';
import { TaskTemplate } from '@/types/task';
import { GlassCard, Button } from '@/components/ui';

interface TemplateSelectorProps {
  segment: string;
  templates: TaskTemplate[];
  onApply: (selectedIds: string[]) => void;
  onSkip: () => void;
}

export function TemplateSelector({ 
  segment, 
  templates, 
  onApply, 
  onSkip 
}: TemplateSelectorProps) {
  const [selected, setSelected] = useState<string[]>([]);

  // Pré-seleciona todos os templates do segmento
  useEffect(() => {
    const segmentTemplates = templates.filter(t => t.segment === segment);
    setSelected(segmentTemplates.map(t => t.id));
  }, [segment, templates]);

  const segmentTemplates = templates.filter(t => t.segment === segment);

  const toggleTemplate = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (segmentTemplates.length === 0) {
    return null;
  }

  return (
    <GlassCard className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          ✨ Tarefas Sugeridas para {segment}
        </h3>
        <p className="text-sm text-zinc-400">
          Selecione as tarefas padrão que deseja aplicar a este cliente
        </p>
      </div>

      <div className="space-y-2 mb-6">
        {segmentTemplates.map(template => (
          <label
            key={template.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.includes(template.id)}
              onChange={() => toggleTemplate(template.id)}
              className="mt-1 rounded border-white/20"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{template.title}</span>
                {template.recurrence && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
                    {template.recurrence === 'daily' && 'Diária'}
                    {template.recurrence === 'weekly' && 'Semanal'}
                    {template.recurrence === 'biweekly' && 'Quinzenal'}
                    {template.recurrence === 'monthly' && 'Mensal'}
                  </span>
                )}
                {template.notify_client && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                    📱 Notifica
                  </span>
                )}
              </div>
              {template.description && (
                <p className="text-sm text-zinc-500 mt-1">{template.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => onApply(selected)} disabled={selected.length === 0}>
          Aplicar {selected.length} tarefa{selected.length !== 1 && 's'}
        </Button>
        <Button variant="ghost" onClick={onSkip}>
          Pular
        </Button>
      </div>
    </GlassCard>
  );
}
```

### Componente: `WhatsAppNotify`

```tsx
/**
 * @file WhatsAppNotify.tsx
 * @description Modal de notificação WhatsApp ao concluir tarefa
 * @module components/tasks
 */
'use client';

import { useState, useMemo } from 'react';
import { Task } from '@/types/task';
import { Modal, Button } from '@/components/ui';

interface WhatsAppNotifyProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppNotify({ task, isOpen, onClose }: WhatsAppNotifyProps) {
  const [customMessage, setCustomMessage] = useState('');

  // Monta a mensagem com variáveis substituídas
  const finalMessage = useMemo(() => {
    if (!task) return '';
    
    let message = customMessage || task.notify_message || getDefaultMessage(task);
    
    // Substitui variáveis
    message = message
      .replace(/\[NOME\]/g, task.client?.contact_name || task.client?.name || 'Cliente')
      .replace(/\[TAREFA\]/g, task.title)
      .replace(/\[DATA\]/g, new Date().toLocaleDateString('pt-BR'));
    
    return message;
  }, [task, customMessage]);

  // Gera link do WhatsApp
  const whatsappLink = useMemo(() => {
    if (!task?.client?.contact_phone) return '';
    
    const phone = task.client.contact_phone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const encodedMessage = encodeURIComponent(finalMessage);
    
    return `https://wa.me/${fullPhone}?text=${encodedMessage}`;
  }, [task, finalMessage]);

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📱 Notificar Cliente">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-zinc-400 mb-2">
            Tarefa concluída: <span className="text-white">{task.title}</span>
          </p>
          <p className="text-sm text-zinc-400">
            Cliente: <span className="text-white">{task.client?.name}</span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Mensagem
          </label>
          <textarea
            value={customMessage || task.notify_message || getDefaultMessage(task)}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 resize-none"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Variáveis: [NOME], [TAREFA], [DATA]
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <p className="text-xs text-zinc-500 mb-2">Prévia:</p>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{finalMessage}</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          {task.client?.contact_phone ? (
            <Button
              as="a"
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <span className="mr-2">📱</span>
              Abrir WhatsApp
            </Button>
          ) : (
            <p className="text-sm text-red-400">
              ⚠️ Cliente sem telefone cadastrado
            </p>
          )}
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function getDefaultMessage(task: Task): string {
  return `Olá [NOME]! 👋

✅ Acabamos de finalizar: *${task.title}*

Qualquer dúvida, é só chamar!

Abraços 🚀`;
}
```

---

## 🔌 API Routes

### Estrutura

```
src/app/api/
├── tasks/
│   ├── route.ts              # GET (list), POST (create)
│   ├── [id]/
│   │   └── route.ts          # GET, PUT, DELETE
│   ├── today/
│   │   └── route.ts          # GET (tarefas de hoje)
│   └── apply-templates/
│       └── route.ts          # POST (aplicar templates ao cliente)
├── templates/
│   ├── route.ts              # GET (list), POST (create)
│   ├── [id]/
│   │   └── route.ts          # GET, PUT, DELETE
│   └── by-segment/
│       └── [segment]/
│           └── route.ts      # GET (templates por segmento)
└── notes/
    ├── route.ts              # GET, POST
    └── [id]/
        └── route.ts          # PUT, DELETE
```

### Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/tasks` | Lista tarefas (query: client_id, status, priority, date_from, date_to) |
| POST | `/api/tasks` | Cria tarefa |
| GET | `/api/tasks/[id]` | Detalhes da tarefa |
| PUT | `/api/tasks/[id]` | Atualiza tarefa |
| DELETE | `/api/tasks/[id]` | Exclui tarefa |
| GET | `/api/tasks/today` | Tarefas de hoje |
| POST | `/api/tasks/apply-templates` | Aplica templates ao cliente |
| GET | `/api/templates` | Lista templates |
| POST | `/api/templates` | Cria template |
| GET | `/api/templates/by-segment/[segment]` | Templates por segmento |
| GET | `/api/notes` | Lista notas (query: client_id) |
| POST | `/api/notes` | Cria nota |

---

## 🪝 Hooks

### `useTasks`

```typescript
// src/hooks/useTasks.ts

/**
 * @file useTasks.ts
 * @description Hook para gerenciamento de tarefas
 * @module hooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '@/types/task';

interface UseTasksOptions {
  clientId?: string;
  status?: Task['status'];
  priority?: Task['priority'];
}

export function useTasks(options: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (options.clientId) params.set('client_id', options.clientId);
      if (options.status) params.set('status', options.status);
      if (options.priority) params.set('priority', options.priority);

      const res = await fetch(`/api/tasks?${params}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      
      const data = await res.json();
      setTasks(data.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [options.clientId, options.status, options.priority]);

  const createTask = useCallback(async (data: CreateTaskDTO) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create task');
    
    const result = await res.json();
    setTasks(prev => [...prev, result.data]);
    return result.data;
  }, []);

  const updateTask = useCallback(async (id: string, data: UpdateTaskDTO) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    
    const result = await res.json();
    setTasks(prev => prev.map(t => t.id === id ? result.data : t));
    return result.data;
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
    
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const completeTask = useCallback(async (id: string) => {
    return updateTask(id, { status: 'done' });
  }, [updateTask]);

  // Computed
  const todayTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t => t.due_date === today);
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t => t.due_date < today && t.status !== 'done');
  }, [tasks]);

  const pendingTasks = useMemo(() => {
    return tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
  }, [tasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    todayTasks,
    overdueTasks,
    pendingTasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
  };
}
```

---

## 📦 Templates Padrão

### A. Templates OPERACIONAIS (Aplica-se a TODOS os clientes)

Estas são as tarefas padrão do gestor de tráfego de alto padrão:

```sql
-- ═══════════════════════════════════════════════════════════════
-- TEMPLATES OPERACIONAIS - TAREFAS DIÁRIAS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (category, segment, title, description, checklist, recurrence, priority, is_system) VALUES

-- Diárias - Monitoramento
('operational', NULL, 'Monitoramento de Performance', 
 'Verificar métricas principais das campanhas',
 '[
   {"id": "1", "text": "Checar CPC, CTR, CPM, CPA, ROAS", "done": false},
   {"id": "2", "text": "Verificar status dos anúncios (reprovações, aprendizado limitado)", "done": false},
   {"id": "3", "text": "Checar orçamento diário e distribuição", "done": false},
   {"id": "4", "text": "Verificar saturação de públicos", "done": false},
   {"id": "5", "text": "Microajustes de lances se necessário", "done": false}
 ]'::jsonb,
 'daily', 'high', true),

('operational', NULL, 'Atendimento e Comunicação', 
 'Manter comunicação ativa com o cliente',
 '[
   {"id": "1", "text": "Verificar mensagens do cliente (responder em até 2h)", "done": false},
   {"id": "2", "text": "Monitorar movimentação do negócio (promoções, imprevistos)", "done": false},
   {"id": "3", "text": "Atualizar insights diários", "done": false}
 ]'::jsonb,
 'daily', 'high', true),

('operational', NULL, 'Monitoramento de Concorrência', 
 'Acompanhar o que os concorrentes estão fazendo',
 '[
   {"id": "1", "text": "Analisar anúncios ativos dos concorrentes", "done": false},
   {"id": "2", "text": "Registrar insights relevantes", "done": false}
 ]'::jsonb,
 'daily', 'medium', true),

('operational', NULL, 'Monitoramento de Funil/SAC', 
 'Acompanhar qualidade do atendimento',
 '[
   {"id": "1", "text": "Acompanhar fluxo de mensagens (WhatsApp, Instagram)", "done": false},
   {"id": "2", "text": "Checar taxa de resposta", "done": false},
   {"id": "3", "text": "Avaliar qualidade das conversas", "done": false}
 ]'::jsonb,
 'daily', 'medium', true),

-- ═══════════════════════════════════════════════════════════════
-- TEMPLATES OPERACIONAIS - A CADA 3 DIAS
-- ═══════════════════════════════════════════════════════════════

('operational', NULL, 'Otimizações Táticas de Campanha', 
 'Ajustes para manter performance alta',
 '[
   {"id": "1", "text": "Pausar anúncios com CTR muito baixo", "done": false},
   {"id": "2", "text": "Duplicar criativos vencedores", "done": false},
   {"id": "3", "text": "Ajustar segmentações (frio/morno/quente)", "done": false},
   {"id": "4", "text": "Revisar mix estáticos vs vídeos", "done": false},
   {"id": "5", "text": "Inserir variações de copy (evitar fadiga)", "done": false}
 ]'::jsonb,
 'every_3_days', 'high', true),

('operational', NULL, 'Ajustes de Criativos', 
 'Atualizar criativos que estão saturando',
 '[
   {"id": "1", "text": "Criar novas versões de criativos saturados", "done": false},
   {"id": "2", "text": "Atualizar headlines e CTAs", "done": false},
   {"id": "3", "text": "Testar novas imagens/vídeos", "done": false}
 ]'::jsonb,
 'every_3_days', 'medium', true),

('operational', NULL, 'Auditoria Rápida de Funil', 
 'Verificar se o funil está funcionando',
 '[
   {"id": "1", "text": "Revisar tempo de resposta no WhatsApp", "done": false},
   {"id": "2", "text": "Avaliar scripts de atendimento", "done": false},
   {"id": "3", "text": "Checar páginas e botões (links quebrados)", "done": false}
 ]'::jsonb,
 'every_3_days', 'medium', true),

-- ═══════════════════════════════════════════════════════════════
-- TEMPLATES OPERACIONAIS - SEMANAIS
-- ═══════════════════════════════════════════════════════════════

('operational', NULL, 'Relatório Semanal de Performance', 
 'Análise completa da semana',
 '[
   {"id": "1", "text": "Compilar CPC, CPM, CTR, CPA por criativo", "done": false},
   {"id": "2", "text": "Calcular ROI/ROAS semanal", "done": false},
   {"id": "3", "text": "Análise de funil (impressão → clique → conversa → venda)", "done": false},
   {"id": "4", "text": "Identificar criativos vencedores e perdedores", "done": false},
   {"id": "5", "text": "Documentar aprendizados da semana", "done": false}
 ]'::jsonb,
 'weekly', 'high', true),

('operational', NULL, 'Reunião/Update Semanal com Cliente', 
 'Comunicar resultados e próximos passos',
 '[
   {"id": "1", "text": "Preparar pontos positivos da semana", "done": false},
   {"id": "2", "text": "Listar alertas de performance", "done": false},
   {"id": "3", "text": "Definir recomendações para próxima semana", "done": false},
   {"id": "4", "text": "Enviar update ou realizar reunião", "done": false}
 ]'::jsonb,
 'weekly', 'high', true),

('operational', NULL, 'Planejamento Criativo Semanal', 
 'Definir criativos da próxima semana',
 '[
   {"id": "1", "text": "Definir novos criativos baseado no que funcionou", "done": false},
   {"id": "2", "text": "Criar pauta de conteúdo para redes", "done": false},
   {"id": "3", "text": "Revisar ofertas da semana", "done": false}
 ]'::jsonb,
 'weekly', 'medium', true),

('operational', NULL, 'SEO Local (GMB)', 
 'Manter Google Meu Negócio atualizado',
 '[
   {"id": "1", "text": "Atualizar Google Meu Negócio", "done": false},
   {"id": "2", "text": "Inserir fotos novas", "done": false},
   {"id": "3", "text": "Publicar post/promoção", "done": false}
 ]'::jsonb,
 'weekly', 'low', true),

('operational', NULL, 'Teste de Novo Público', 
 'Expandir alcance com novos públicos',
 '[
   {"id": "1", "text": "Criar 1 público novo (interest, lookalike, local)", "done": false},
   {"id": "2", "text": "Configurar teste A/B", "done": false},
   {"id": "3", "text": "Documentar hipótese do teste", "done": false}
 ]'::jsonb,
 'weekly', 'medium', true),

-- ═══════════════════════════════════════════════════════════════
-- TEMPLATES OPERACIONAIS - QUINZENAIS
-- ═══════════════════════════════════════════════════════════════

('operational', NULL, 'Deep Analysis (CAC/LTV)', 
 'Análise profunda de métricas de negócio',
 '[
   {"id": "1", "text": "Calcular CAC atualizado", "done": false},
   {"id": "2", "text": "Calcular LTV do cliente", "done": false},
   {"id": "3", "text": "Analisar recorrência de clientes", "done": false},
   {"id": "4", "text": "Identificar melhores dias/horários", "done": false},
   {"id": "5", "text": "Detectar padrões de queda ou crescimento", "done": false}
 ]'::jsonb,
 'biweekly', 'high', true),

('operational', NULL, 'Testes Estruturais de Campanha', 
 'Testar novas abordagens',
 '[
   {"id": "1", "text": "Testar CBO vs ABO", "done": false},
   {"id": "2", "text": "Testar novas abordagens (UGC, depoimento, autoridade)", "done": false},
   {"id": "3", "text": "Testar nova oferta forte", "done": false},
   {"id": "4", "text": "Documentar resultados dos testes", "done": false}
 ]'::jsonb,
 'biweekly', 'high', true),

('operational', NULL, 'Criativos Premium', 
 'Criar criativos de alto impacto',
 '[
   {"id": "1", "text": "Criar criativo flagship com design premium", "done": false},
   {"id": "2", "text": "Criar vídeo motion de impacto", "done": false},
   {"id": "3", "text": "Revisar identidade visual dos anúncios", "done": false}
 ]'::jsonb,
 'biweekly', 'medium', true),

('operational', NULL, 'Análise Profunda de Concorrência', 
 'Entender posicionamento no mercado',
 '[
   {"id": "1", "text": "Pesquisar melhores campanhas da concorrência", "done": false},
   {"id": "2", "text": "Realizar comparação direta", "done": false},
   {"id": "3", "text": "Documentar oportunidades de diferenciação", "done": false},
   {"id": "4", "text": "Identificar gaps de mercado", "done": false}
 ]'::jsonb,
 'biweekly', 'medium', true),

-- ═══════════════════════════════════════════════════════════════
-- TEMPLATES OPERACIONAIS - MENSAIS
-- ═══════════════════════════════════════════════════════════════

('operational', NULL, 'Reunião Estratégica Mensal', 
 'Revisão completa e planejamento do próximo mês',
 '[
   {"id": "1", "text": "Preparar revisão completa do mês", "done": false},
   {"id": "2", "text": "Análise profunda de ROI", "done": false},
   {"id": "3", "text": "Criar plano de ação para 30 dias", "done": false},
   {"id": "4", "text": "Revisar metas de faturamento", "done": false},
   {"id": "5", "text": "Reavaliar persona e mensagens-chave", "done": false},
   {"id": "6", "text": "Realizar reunião com cliente", "done": false}
 ]'::jsonb,
 'monthly', 'urgent', true),

('operational', NULL, 'Planejamento Mensal de Campanhas', 
 'Criar calendário de campanhas do mês',
 '[
   {"id": "1", "text": "Criar calendário de campanhas mensais", "done": false},
   {"id": "2", "text": "Definir datas promocionais fortes", "done": false},
   {"id": "3", "text": "Planejar campanhas premium", "done": false},
   {"id": "4", "text": "Alinhar com eventos sazonais", "done": false}
 ]'::jsonb,
 'monthly', 'high', true),

('operational', NULL, 'Auditoria Completa de Funil', 
 'Revisar todo o processo de vendas',
 '[
   {"id": "1", "text": "Auditar WhatsApp → Atendimento → Fechamento", "done": false},
   {"id": "2", "text": "Identificar pontos de retenção e churn", "done": false},
   {"id": "3", "text": "Atualizar scripts de atendimento", "done": false},
   {"id": "4", "text": "Revisar pós-venda", "done": false}
 ]'::jsonb,
 'monthly', 'high', true),

('operational', NULL, 'Auditoria de Marca (Branding)', 
 'Garantir consistência da marca',
 '[
   {"id": "1", "text": "Verificar padronização visual", "done": false},
   {"id": "2", "text": "Revisar tom de voz", "done": false},
   {"id": "3", "text": "Atualizar elementos de percepção de valor", "done": false}
 ]'::jsonb,
 'monthly', 'medium', true),

('operational', NULL, 'Relatório de Inteligência de Mercado', 
 'Análise de tendências e oportunidades',
 '[
   {"id": "1", "text": "Pesquisar tendências do setor", "done": false},
   {"id": "2", "text": "Identificar novas oportunidades de crescimento", "done": false},
   {"id": "3", "text": "Documentar insights para o cliente", "done": false}
 ]'::jsonb,
 'monthly', 'medium', true);

-- ═══════════════════════════════════════════════════════════════
-- TEMPLATES ESPECÍFICOS PARA DELIVERY (Operacionais)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (category, segment, title, description, checklist, recurrence, priority, is_system) VALUES

('operational', 'delivery', 'Gestão de Reputação (Reviews)', 
 'Monitorar e responder avaliações',
 '[
   {"id": "1", "text": "Verificar avaliações iFood", "done": false},
   {"id": "2", "text": "Verificar avaliações Google", "done": false},
   {"id": "3", "text": "Criar/enviar respostas padrão", "done": false},
   {"id": "4", "text": "Identificar tendências de reclamações", "done": false}
 ]'::jsonb,
 'daily', 'high', true),

('operational', 'delivery', 'Revisão de Mix de Ofertas (Delivery)', 
 'Otimizar promoções do cardápio',
 '[
   {"id": "1", "text": "Analisar pratos com maior margem", "done": false},
   {"id": "2", "text": "Analisar pratos com maior giro", "done": false},
   {"id": "3", "text": "Ajustar promoções conforme estoque", "done": false}
 ]'::jsonb,
 'every_3_days', 'medium', true);

-- ═══════════════════════════════════════════════════════════════
-- TEMPLATES ESPECÍFICOS PARA ACADEMIA (Operacionais)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (category, segment, title, description, checklist, recurrence, priority, is_system) VALUES

('operational', 'fitness', 'Revisão de Mix de Ofertas (Academia)', 
 'Otimizar ofertas de matrícula',
 '[
   {"id": "1", "text": "Revisar ofertas de matrícula", "done": false},
   {"id": "2", "text": "Analisar ofertas de avaliação física", "done": false},
   {"id": "3", "text": "Planejar challenges e desafios", "done": false}
 ]'::jsonb,
 'every_3_days', 'medium', true);
```

### B. Templates POR NICHO (Específicos do segmento)

```sql
-- ═══════════════════════════════════════════════════════════════
-- TEMPLATES POR NICHO - FITNESS / ACADEMIA
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (category, segment, title, description, recurrence, priority, notify_client, notify_message, is_system) VALUES
('niche', 'fitness', 'Criar roteiros para anúncios', 'Desenvolver scripts de vídeo e copy para anúncios', 'weekly', 'high', false, null, true),
('niche', 'fitness', 'Campanha de aulas experimentais', 'Criar campanha para captar leads de aulas grátis', 'monthly', 'high', true, 'Olá [NOME]! Campanha de aulas experimentais no ar 🏋️', true),
('niche', 'fitness', 'Criar conteúdo de transformação', 'Antes/depois, depoimentos de alunos', 'biweekly', 'medium', true, 'Olá [NOME]! Novos conteúdos de transformação prontos ✨', true),
('niche', 'fitness', 'Campanha de desafio fitness', 'Criar campanha de desafio 30 dias ou similar', 'monthly', 'medium', false, null, true);

-- ═══════════════════════════════════════════════════════════════
-- TEMPLATES POR NICHO - DELIVERY / RESTAURANTE
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (category, segment, title, description, recurrence, priority, notify_client, notify_message, is_system) VALUES
('niche', 'delivery', 'Atualizar cardápio digital', 'Revisar fotos, preços e descrições do cardápio', 'monthly', 'medium', true, 'Olá [NOME]! Cardápio atualizado ✅', true),
('niche', 'delivery', 'Captar fotos profissionais dos pratos', 'Organizar sessão de fotos dos pratos principais', 'monthly', 'high', false, null, true),
('niche', 'delivery', 'Criar promoções sazonais', 'Desenvolver promoções para datas especiais', 'biweekly', 'medium', true, 'Olá [NOME]! Nova promoção criada 🍕', true),
('niche', 'delivery', 'Otimizar raio de entrega', 'Analisar e ajustar área de cobertura', 'monthly', 'low', false, null, true),
('niche', 'delivery', 'Campanha de combos', 'Criar ofertas de combos promocionais', 'biweekly', 'medium', false, null, true);

-- ═══════════════════════════════════════════════════════════════
-- TEMPLATES POR NICHO - E-COMMERCE
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (category, segment, title, description, recurrence, priority, notify_client, notify_message, is_system) VALUES
('niche', 'ecommerce', 'Revisar catálogo de produtos', 'Verificar fotos, descrições e preços', 'weekly', 'medium', false, null, true),
('niche', 'ecommerce', 'Criar remarketing de carrinho', 'Configurar campanha de abandono de carrinho', 'monthly', 'high', true, 'Olá [NOME]! Remarketing configurado 🛒', true),
('niche', 'ecommerce', 'Analisar produtos mais vendidos', 'Identificar bestsellers para escalar', 'biweekly', 'medium', false, null, true),
('niche', 'ecommerce', 'Atualizar criativos sazonais', 'Criar criativos para datas comemorativas', 'monthly', 'medium', true, 'Novos criativos prontos! ✨', true),
('niche', 'ecommerce', 'Campanha de lançamento de produto', 'Criar campanha para novos produtos', 'monthly', 'high', false, null, true);

-- ═══════════════════════════════════════════════════════════════
-- TEMPLATES POR NICHO - CLÍNICA / SAÚDE
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (category, segment, title, description, recurrence, priority, notify_client, notify_message, is_system) VALUES
('niche', 'clinica', 'Campanha de agendamentos', 'Criar campanha para gerar consultas', 'weekly', 'high', false, null, true),
('niche', 'clinica', 'Criar criativos com depoimentos', 'Desenvolver anúncios com cases de sucesso', 'monthly', 'medium', true, 'Novos criativos prontos para aprovação 👨‍⚕️', true),
('niche', 'clinica', 'Revisar público-alvo', 'Analisar e ajustar segmentação', 'monthly', 'medium', false, null, true),
('niche', 'clinica', 'Remarketing de consultas', 'Criar campanha para retorno de pacientes', 'biweekly', 'high', false, null, true);

-- ═══════════════════════════════════════════════════════════════
-- TEMPLATES POR NICHO - SERVIÇOS LOCAIS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (category, segment, title, description, recurrence, priority, notify_client, notify_message, is_system) VALUES
('niche', 'servicos', 'Campanha de leads WhatsApp', 'Criar campanha focada em mensagens', 'weekly', 'high', false, null, true),
('niche', 'servicos', 'Otimizar Google Meu Negócio', 'Atualizar informações e fotos', 'monthly', 'medium', true, 'Google Meu Negócio atualizado! 📍', true),
('niche', 'servicos', 'Criar ofertas locais', 'Desenvolver promoções para região', 'biweekly', 'medium', false, null, true),
('niche', 'servicos', 'Revisar e responder avaliações', 'Gerenciar reputação online', 'weekly', 'low', false, null, true);

-- ═══════════════════════════════════════════════════════════════
-- TEMPLATES POR NICHO - IMOBILIÁRIO
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (category, segment, title, description, recurrence, priority, notify_client, notify_message, is_system) VALUES
('niche', 'imobiliario', 'Criar campanhas de lançamento', 'Campanha para novos empreendimentos', 'monthly', 'high', true, 'Campanha de lançamento criada! 🏠', true),
('niche', 'imobiliario', 'Remarketing de visitas', 'Reimpactar quem visitou imóveis', 'weekly', 'high', false, null, true),
('niche', 'imobiliario', 'Atualizar catálogo de imóveis', 'Sincronizar fotos e informações', 'weekly', 'medium', false, null, true),
('niche', 'imobiliario', 'Analisar leads qualificados', 'Classificar e priorizar leads', 'weekly', 'high', false, null, true);

-- ═══════════════════════════════════════════════════════════════
-- TEMPLATES POR NICHO - EDUCAÇÃO / CURSOS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (category, segment, title, description, recurrence, priority, notify_client, notify_message, is_system) VALUES
('niche', 'educacao', 'Campanha de matrículas', 'Criar campanha para captação de alunos', 'monthly', 'high', false, null, true),
('niche', 'educacao', 'Criar conteúdo educativo', 'Desenvolver conteúdo para autoridade', 'weekly', 'medium', true, 'Novo conteúdo publicado! 📚', true),
('niche', 'educacao', 'Remarketing de interessados', 'Reimpactar quem demonstrou interesse', 'weekly', 'high', false, null, true),
('niche', 'educacao', 'Webinar / Live promocional', 'Organizar evento online de captação', 'monthly', 'medium', true, 'Live agendada! 🎥', true);
```

---

## 🎨 Visual de Referência

### Card do Cliente (aba Tarefas)

```
┌─────────────────────────────────────────────────────────────┐
│  🏋️ Academia FitMax                                         │
├─────────────────────────────────────────────────────────────┤
│  [Geral] [Relatórios] [📋 Tarefas] [Notas] [Links]          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📋 Tarefas Pendentes (4)                    [+ Nova Tarefa]│
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☐ Revisar campanhas          🔴 Urgente   📱       │   │
│  │   📅 Hoje                    🔄 Semanal            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☐ Criar criativos novos      🟠 Alta               │   │
│  │   📅 05/12                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☐ Analisar ROAS              🟡 Média   🔄 Semanal │   │
│  │   📅 06/12                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ✅ Concluídas (2)                           [Ver todas]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard - Widget Tarefas Hoje

```
┌─────────────────────────────────────────────────────────────┐
│  📋 Tarefas de Hoje                           [Ver todas →] │
│  3 de 5 concluídas                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ☐ Academia FitMax - Revisar campanhas        🔴 Urgente   │
│  ☐ Loja Fashion - Criar remarketing           🟠 Alta      │
│                                                             │
│  ────────────── Concluídas ──────────────                   │
│                                                             │
│  ☑ Clínica Saúde - Enviar relatório           ✅ 10:30     │
│  ☑ Delivery Sabor - Atualizar cardápio        ✅ 09:15     │
│  ☑ Academia FitMax - Otimizar campanhas       ✅ 08:45     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementação

### Database
- [ ] Migration tabela `task_templates` (com category, checklist, is_system)
- [ ] Migration tabela `tasks` (com category, checklist, completion_notes)
- [ ] Migration tabela `client_notes`
- [ ] RLS Policies para todas as tabelas
- [ ] Seed de templates OPERACIONAIS (20+ templates)
- [ ] Seed de templates por NICHO (30+ templates)

### Types TypeScript
- [ ] `TaskRecurrence` incluindo 'every_3_days'
- [ ] `TaskCategory` ('operational' | 'niche' | 'custom')
- [ ] `ChecklistItem` interface
- [ ] Atualizar interfaces Task, TaskTemplate

### API Routes
- [ ] GET/POST /api/tasks
- [ ] GET/PUT/DELETE /api/tasks/[id]
- [ ] GET /api/tasks/today
- [ ] POST /api/tasks/complete (com recorrência automática)
- [ ] GET/POST /api/templates
- [ ] GET /api/templates/operational (apenas operacionais)
- [ ] GET /api/templates/by-segment/[segment]
- [ ] POST /api/templates/apply (aplicar templates ao cliente)
- [ ] GET/POST /api/notes

### Hooks
- [ ] useTasks (com filtros por categoria)
- [ ] useTemplates (operacionais e por nicho)
- [ ] useNotes

### Componentes
- [ ] TaskCard (com checklist expandível)
- [ ] TaskList (agrupado por categoria)
- [ ] TaskForm (com seleção de categoria)
- [ ] TaskModal
- [ ] TodayTasks (widget dashboard)
- [ ] PriorityBadge
- [ ] RecurrenceBadge (incluindo "A cada 3 dias")
- [ ] CategoryBadge (Operacional / Nicho / Custom)
- [ ] ChecklistView (subtarefas)
- [ ] TemplateSelector (separado por categoria)
- [ ] TemplateManager
- [ ] ClientNotes
- [ ] WhatsAppNotify

### Páginas
- [ ] /tasks (visão geral com filtros)
- [ ] /templates (gerenciar templates)
- [ ] Aba Tarefas no card do cliente
- [ ] Widget TodayTasks no dashboard

### Lógica de Negócio
- [ ] Ao criar cliente: aplicar templates OPERACIONAIS automaticamente
- [ ] Ao criar cliente: oferecer templates do NICHO para seleção
- [ ] Ao completar tarefa recorrente: criar próxima ocorrência
- [ ] Calcular next_recurrence_date para 'every_3_days'

---

*Última atualização: Dezembro 2025*
