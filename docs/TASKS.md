# TASKS.md - Sistema de Tarefas e Onboarding por Nicho

---

## 📋 Visão Geral

O módulo de Tasks do TrafficHub implementa um sistema completo de gerenciamento de tarefas com:

1. **Onboarding por Nicho** - Templates de tarefas pré-definidas por segmento de cliente
2. **Tasks Organizadas** - Visão diária, prioridades, recorrências
3. **Follow-up Automático** - Notificação via WhatsApp ao concluir tarefas
4. **Notas do Cliente** - Histórico de observações e acompanhamento

---

## 🎯 Problema que Resolve

| Antes | Depois |
|-------|--------|
| Esquece tarefas importantes | Tasks recorrentes automáticas |
| Não sabe o que fazer hoje | Visão "Tarefas de Hoje" |
| Cliente não sabe o status | Follow-up automático WhatsApp |
| Cada cliente começa do zero | Templates por nicho prontos |
| Tarefas sem prioridade clara | Sistema de prioridades visual |

---

## 🗄️ Schema do Banco de Dados

### Tabela: `task_templates`

Templates de tarefas padrão por segmento/nicho.

```sql
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  segment TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  recurrence TEXT CHECK (recurrence IN ('daily', 'weekly', 'biweekly', 'monthly')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  notify_client BOOLEAN DEFAULT false,
  notify_message TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_task_templates_segment ON task_templates(segment);
CREATE INDEX idx_task_templates_user ON task_templates(user_id);
```

### Tabela: `tasks`

Tarefas vinculadas aos clientes.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  due_time TIME,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done', 'cancelled')),
  is_recurring BOOLEAN DEFAULT false,
  recurrence TEXT CHECK (recurrence IN ('daily', 'weekly', 'biweekly', 'monthly')),
  next_recurrence_date DATE,
  notify_client BOOLEAN DEFAULT false,
  notify_message TEXT,
  notified_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tasks_client ON tasks(client_id);
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
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
├── TaskCard.tsx           # Card individual de tarefa
├── TaskList.tsx           # Lista de tarefas (filtrada)
├── TaskForm.tsx           # Formulário criar/editar tarefa
├── TaskModal.tsx          # Modal de detalhes da tarefa
├── TodayTasks.tsx         # Widget "Tarefas de Hoje"
├── PriorityBadge.tsx      # Badge de prioridade colorido
├── RecurrenceBadge.tsx    # Badge de recorrência
├── TemplateSelector.tsx   # Seletor de templates no onboarding
├── TemplateManager.tsx    # Gerenciador de templates
├── ClientNotes.tsx        # Seção de notas do cliente
├── NoteCard.tsx           # Card individual de nota
├── WhatsAppNotify.tsx     # Modal de notificação WhatsApp
└── index.ts
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

## 📦 Templates Padrão por Nicho

Seed inicial de templates:

```sql
-- Fitness / Academia
INSERT INTO task_templates (segment, title, recurrence, priority, notify_client, notify_message) VALUES
('fitness', 'Criar roteiros para anúncios', 'weekly', 'high', false, null),
('fitness', 'Revisar e otimizar campanhas', 'weekly', 'high', true, 'Olá [NOME]! Acabamos de otimizar suas campanhas 🚀'),
('fitness', 'Criar criativos novos', 'biweekly', 'medium', true, 'Olá [NOME]! Novos criativos prontos para aprovação ✨'),
('fitness', 'Analisar métricas e ROAS', 'weekly', 'high', false, null),
('fitness', 'Campanha de aulas experimentais', 'monthly', 'medium', false, null);

-- Delivery / Restaurante
INSERT INTO task_templates (segment, title, recurrence, priority, notify_client, notify_message) VALUES
('delivery', 'Atualizar cardápio digital', 'monthly', 'medium', true, 'Olá [NOME]! Cardápio atualizado ✅'),
('delivery', 'Captar fotos dos pratos', 'monthly', 'high', false, null),
('delivery', 'Revisar campanhas de pedidos', 'weekly', 'high', false, null),
('delivery', 'Criar promoções sazonais', 'biweekly', 'medium', true, 'Olá [NOME]! Nova promoção criada 🍕'),
('delivery', 'Otimizar raio de entrega', 'monthly', 'low', false, null);

-- E-commerce
INSERT INTO task_templates (segment, title, recurrence, priority, notify_client, notify_message) VALUES
('ecommerce', 'Revisar catálogo de produtos', 'weekly', 'medium', false, null),
('ecommerce', 'Otimizar campanhas de vendas', 'weekly', 'high', false, null),
('ecommerce', 'Criar remarketing carrinho', 'monthly', 'high', true, 'Olá [NOME]! Remarketing configurado 🛒'),
('ecommerce', 'Analisar produtos mais vendidos', 'biweekly', 'medium', false, null),
('ecommerce', 'Atualizar criativos sazonais', 'monthly', 'medium', true, 'Novos criativos prontos! ✨');

-- Clínica / Saúde
INSERT INTO task_templates (segment, title, recurrence, priority, notify_client, notify_message) VALUES
('clinica', 'Campanha de agendamentos', 'weekly', 'high', false, null),
('clinica', 'Criar criativos com depoimentos', 'monthly', 'medium', true, 'Novos criativos prontos para aprovação 👨‍⚕️'),
('clinica', 'Revisar público-alvo', 'monthly', 'medium', false, null),
('clinica', 'Remarketing de consultas', 'biweekly', 'high', false, null);

-- Serviços Locais
INSERT INTO task_templates (segment, title, recurrence, priority, notify_client, notify_message) VALUES
('servicos', 'Campanha de leads WhatsApp', 'weekly', 'high', false, null),
('servicos', 'Otimizar Google Meu Negócio', 'monthly', 'medium', true, 'Google Meu Negócio atualizado! 📍'),
('servicos', 'Criar ofertas locais', 'biweekly', 'medium', false, null),
('servicos', 'Revisar avaliações e responder', 'weekly', 'low', false, null);

-- Imobiliário
INSERT INTO task_templates (segment, title, recurrence, priority, notify_client, notify_message) VALUES
('imobiliario', 'Criar campanhas de lançamento', 'monthly', 'high', true, 'Campanha de lançamento criada! 🏠'),
('imobiliario', 'Remarketing de visitas', 'weekly', 'high', false, null),
('imobiliario', 'Atualizar catálogo de imóveis', 'weekly', 'medium', false, null),
('imobiliario', 'Analisar leads qualificados', 'weekly', 'high', false, null);

-- Educação / Cursos
INSERT INTO task_templates (segment, title, recurrence, priority, notify_client, notify_message) VALUES
('educacao', 'Campanha de matrículas', 'monthly', 'high', false, null),
('educacao', 'Criar conteúdo educativo', 'weekly', 'medium', true, 'Novo conteúdo publicado! 📚'),
('educacao', 'Remarketing de interessados', 'weekly', 'high', false, null),
('educacao', 'Webinar / Live promocional', 'monthly', 'medium', true, 'Live agendada! 🎥');
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

- [ ] Migrations SQL (task_templates, tasks, client_notes)
- [ ] RLS Policies
- [ ] Types TypeScript
- [ ] Seed de templates padrão
- [ ] API Routes (tasks, templates, notes)
- [ ] Hook useTasks
- [ ] Hook useTemplates
- [ ] Hook useNotes
- [ ] Componentes UI (TaskCard, PriorityBadge, etc)
- [ ] Widget TodayTasks no dashboard
- [ ] Aba Tarefas no card do cliente
- [ ] Modal de criação de tarefa
- [ ] TemplateSelector no onboarding
- [ ] WhatsAppNotify modal
- [ ] Página /tasks (visão geral)
- [ ] Página /templates (gerenciar templates)

---

*Última atualização: Dezembro 2025*
