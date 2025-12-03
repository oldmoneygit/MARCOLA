/**
 * @file CalendarEventForm.tsx
 * @description Formulário para criação/edição de eventos de calendário
 * @module components/calendar
 *
 * @example
 * <CalendarEventForm clientId="..." onSubmit={handleSubmit} onCancel={handleCancel} />
 */

'use client';

import { useState, useCallback } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

import {
  CONTENT_TYPE_CONFIG,
  PLATFORM_CONFIG,
  type CalendarEvent,
  type ContentType,
  type CreateCalendarEventDTO,
  type Platform,
} from '@/types';

interface CalendarEventFormProps {
  /** ID do cliente */
  clientId?: string;
  /** Evento existente para edição */
  event?: CalendarEvent;
  /** Data pré-selecionada */
  selectedDate?: string;
  /** Callback ao submeter */
  onSubmit: (data: CreateCalendarEventDTO) => Promise<void>;
  /** Callback ao cancelar */
  onCancel: () => void;
  /** Se está carregando */
  loading?: boolean;
}

interface FormData {
  title: string;
  description: string;
  type: ContentType;
  scheduled_date: string;
  scheduled_time: string;
  platform: Platform[];
  color: string;
  notes: string;
}

const typeOptions = Object.entries(CONTENT_TYPE_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  icon: config.icon,
}));

const platformOptions = Object.entries(PLATFORM_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  icon: config.icon,
}));

function getInitialFormData(
  event: CalendarEvent | undefined,
  selectedDate?: string
): FormData {
  const isoString = new Date().toISOString();
  const defaultDate = isoString.substring(0, 10);

  return {
    title: event?.title || '',
    description: event?.description || '',
    type: event?.type || 'post',
    scheduled_date: event?.scheduled_date || selectedDate || defaultDate,
    scheduled_time: event?.scheduled_time || '',
    platform: event?.platform || [],
    color: event?.color || '',
    notes: event?.notes || '',
  };
}

/**
 * Formulário para criação/edição de eventos de calendário
 */
function CalendarEventForm({
  clientId,
  event,
  selectedDate,
  onSubmit,
  onCancel,
  loading = false,
}: CalendarEventFormProps) {
  const [formData, setFormData] = useState<FormData>(() =>
    getInitialFormData(event, selectedDate)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;

      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

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

  const handlePlatformToggle = useCallback((platform: Platform) => {
    setFormData((prev) => ({
      ...prev,
      platform: prev.platform.includes(platform)
        ? prev.platform.filter((p) => p !== platform)
        : [...prev.platform, platform],
    }));
  }, []);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }
    if (!formData.scheduled_date) {
      newErrors.scheduled_date = 'Data é obrigatória';
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

      const data: CreateCalendarEventDTO = {
        client_id: clientId || event?.client_id || '',
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time || undefined,
        platform: formData.platform.length > 0 ? formData.platform : undefined,
        color: formData.color || undefined,
        notes: formData.notes.trim() || undefined,
      };

      await onSubmit(data);
    },
    [formData, clientId, event, validate, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Título */}
      <Input
        label="Título do Conteúdo"
        name="title"
        value={formData.title}
        onChange={handleChange}
        error={errors.title}
        placeholder="Ex: Post de Black Friday"
        required
      />

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Descrição</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Detalhes sobre o conteúdo..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none"
        />
      </div>

      {/* Tipo de Conteúdo */}
      <Select
        label="Tipo de Conteúdo"
        name="type"
        value={formData.type}
        onChange={handleChange}
        options={typeOptions}
      />

      {/* Data e Hora */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Data Programada"
          name="scheduled_date"
          value={formData.scheduled_date}
          onChange={handleChange}
          error={errors.scheduled_date}
          required
        />
        <Input
          type="time"
          label="Horário (opcional)"
          name="scheduled_time"
          value={formData.scheduled_time}
          onChange={handleChange}
        />
      </div>

      {/* Plataformas */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Plataformas</label>
        <div className="flex flex-wrap gap-2">
          {platformOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handlePlatformToggle(option.value as Platform)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                formData.platform.includes(option.value as Platform)
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-white/[0.03] text-zinc-400 border border-white/[0.08] hover:border-white/[0.15]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cor customizada */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Cor (opcional)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            name="color"
            value={formData.color || '#8b5cf6'}
            onChange={handleChange}
            className="w-10 h-10 rounded cursor-pointer bg-transparent"
          />
          <Input
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="#8b5cf6"
            className="flex-1"
          />
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Notas Internas
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Observações, lembretes..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none"
        />
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {event ? 'Salvar Alterações' : 'Criar Evento'}
        </Button>
      </div>
    </form>
  );
}

export { CalendarEventForm };
export type { CalendarEventFormProps };
