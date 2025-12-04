/**
 * @file AuditForm.tsx
 * @description Formulário para criar/editar auditorias
 * @module components/audits
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button, Icon } from '@/components/ui';
import { AUDIT_TYPE_CONFIG } from '@/types';
import { cn } from '@/lib/utils';

import type { Audit, AuditType, CreateAuditDTO } from '@/types';

interface Client {
  id: string;
  name: string;
}

interface AuditFormProps {
  /** Auditoria existente para edição */
  audit?: Audit;
  /** Callback ao submeter */
  onSubmit: (data: CreateAuditDTO) => Promise<void>;
  /** Callback ao cancelar */
  onCancel: () => void;
}

/**
 * Formulário de criação/edição de auditoria
 */
function AuditForm({ audit, onSubmit, onCancel }: AuditFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateAuditDTO>({
    client_id: audit?.client_id || '',
    type: audit?.type || 'funnel',
    title: audit?.title || '',
    description: audit?.description || '',
  });

  // Carregar clientes
  useEffect(() => {
    async function loadClients() {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        }
      } catch (err) {
        console.error('[AuditForm] Error loading clients:', err);
      } finally {
        setLoadingClients(false);
      }
    }
    loadClients();
  }, []);

  const handleChange = useCallback((field: keyof CreateAuditDTO, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_id || !formData.type || !formData.title) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
    } catch (err) {
      console.error('[AuditForm] Error submitting:', err);
    } finally {
      setSubmitting(false);
    }
  }, [formData, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cliente */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Cliente <span className="text-red-400">*</span>
        </label>
        {loadingClients ? (
          <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
        ) : (
          <select
            value={formData.client_id}
            onChange={(e) => handleChange('client_id', e.target.value)}
            required
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-violet-500 focus:outline-none"
          >
            <option value="">Selecione um cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Tipo de Auditoria <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(AUDIT_TYPE_CONFIG) as [AuditType, typeof AUDIT_TYPE_CONFIG[AuditType]][]).map(
            ([type, config]) => (
              <button
                key={type}
                type="button"
                onClick={() => handleChange('type', type)}
                className={cn(
                  'p-3 rounded-lg border text-left transition-all',
                  formData.type === type
                    ? `${config.bgColor} ${config.textColor} border-current`
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon name={config.icon} size="sm" />
                  <span className="font-medium text-sm">{config.label}</span>
                </div>
                <p className="text-xs opacity-70">{config.description}</p>
              </button>
            )
          )}
        </div>
      </div>

      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Título <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Ex: Auditoria de Funil - Dezembro 2024"
          required
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Descrição
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Descreva o objetivo desta auditoria..."
          rows={3}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={submitting || !formData.client_id || !formData.title}
          className="gap-2"
        >
          {submitting ? (
            <>
              <Icon name="loader-2" size="sm" className="animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Icon name="plus" size="sm" />
              Criar Auditoria
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export { AuditForm };
export type { AuditFormProps };
