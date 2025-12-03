/**
 * @file TaskForm.tsx
 * @description Formulário para criação/edição de tarefas
 * @module components/tasks
 *
 * @example
 * <TaskForm clientId="..." onSubmit={handleSubmit} onCancel={handleCancel} />
 */

'use client';

import { useState, useCallback } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

import { TASK_PRIORITY_CONFIG, TASK_RECURRENCE_CONFIG, type CreateTaskDTO, type Task, type TaskPriority, type TaskRecurrence } from '@/types';

interface TaskFormProps {
  /** ID do cliente (obrigatório para criação) */
  clientId?: string;
  /** Tarefa existente para edição */
  task?: Task;
  /** Callback ao submeter */
  onSubmit: (data: CreateTaskDTO) => Promise<void>;
  /** Callback ao cancelar */
  onCancel: () => void;
  /** Se está carregando */
  loading?: boolean;
}

const priorityOptions = Object.entries(TASK_PRIORITY_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  icon: config.icon,
}));

const recurrenceOptions = [
  { value: '', label: 'Sem recorrência' },
  ...Object.entries(TASK_RECURRENCE_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  })),
];

/**
 * Formulário para criação/edição de tarefas
 */
interface FormData {
  title: string;
  description: string;
  due_date: string;
  due_time: string;
  priority: TaskPriority;
  is_recurring: boolean;
  recurrence: TaskRecurrence | '';
  send_whatsapp: boolean;
  whatsapp_message: string;
}

function getInitialFormData(task: Task | undefined): FormData {
  const isoString = new Date().toISOString();
  const defaultDate = isoString.substring(0, 10); // YYYY-MM-DD
  const dueDate = task?.due_date || defaultDate;

  return {
    title: task?.title || '',
    description: task?.description || '',
    due_date: dueDate,
    due_time: task?.due_time || '',
    priority: task?.priority || 'medium',
    is_recurring: task?.is_recurring || false,
    recurrence: task?.recurrence || '',
    send_whatsapp: task?.send_whatsapp || false,
    whatsapp_message: task?.whatsapp_message || '',
  };
}

function TaskForm({ clientId, task, onSubmit, onCancel, loading = false }: TaskFormProps) {
  const [formData, setFormData] = useState<FormData>(() => getInitialFormData(task));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;

      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));

      // Limpar erro do campo
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }
    if (!formData.due_date) {
      newErrors.due_date = 'Data de vencimento é obrigatória';
    }
    if (formData.is_recurring && !formData.recurrence) {
      newErrors.recurrence = 'Selecione a frequência de recorrência';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) {
        return;
      }

      const data: CreateTaskDTO = {
        client_id: clientId || task?.client_id || '',
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        due_date: formData.due_date,
        due_time: formData.due_time || undefined,
        priority: formData.priority,
        is_recurring: formData.is_recurring,
        recurrence: formData.is_recurring && formData.recurrence ? formData.recurrence as TaskRecurrence : undefined,
        send_whatsapp: formData.send_whatsapp,
        whatsapp_message: formData.send_whatsapp ? formData.whatsapp_message : undefined,
      };

      await onSubmit(data);
    },
    [formData, clientId, task, validate, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Título */}
      <Input
        label="Título da Tarefa"
        name="title"
        value={formData.title}
        onChange={handleChange}
        error={errors.title}
        placeholder="Ex: Criar campanha de Black Friday"
        required
      />

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Descrição
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Detalhes adicionais sobre a tarefa..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none"
        />
      </div>

      {/* Data e Hora */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Data de Vencimento"
          name="due_date"
          value={formData.due_date}
          onChange={handleChange}
          error={errors.due_date}
          required
        />
        <Input
          type="time"
          label="Horário (opcional)"
          name="due_time"
          value={formData.due_time}
          onChange={handleChange}
        />
      </div>

      {/* Prioridade */}
      <Select
        label="Prioridade"
        name="priority"
        value={formData.priority}
        onChange={handleChange}
        options={priorityOptions}
      />

      {/* Recorrência */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="is_recurring"
            checked={formData.is_recurring}
            onChange={handleChange}
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50"
          />
          <span className="text-sm text-zinc-300">Tarefa recorrente</span>
        </label>

        {formData.is_recurring && (
          <Select
            label="Frequência"
            name="recurrence"
            value={formData.recurrence}
            onChange={handleChange}
            options={recurrenceOptions}
            error={errors.recurrence}
          />
        )}
      </div>

      {/* WhatsApp */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="send_whatsapp"
            checked={formData.send_whatsapp}
            onChange={handleChange}
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50"
          />
          <span className="text-sm text-zinc-300">Enviar lembrete via WhatsApp</span>
        </label>

        {formData.send_whatsapp && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Mensagem do WhatsApp
            </label>
            <textarea
              name="whatsapp_message"
              value={formData.whatsapp_message}
              onChange={handleChange}
              placeholder="Olá! Gostaria de lembrar sobre..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none"
            />
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {task ? 'Salvar Alterações' : 'Criar Tarefa'}
        </Button>
      </div>
    </form>
  );
}

export { TaskForm };
export type { TaskFormProps };
