/**
 * @file OnboardingTemplateSelector.tsx
 * @description Componente para seleção de templates de onboarding por nicho
 * @module components/clients
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Skeleton } from '@/components/ui';
import { PriorityBadge } from '@/components/tasks';

import type { TaskTemplate, TaskPriority, TaskRecurrence } from '@/types';
import { TASK_RECURRENCE_CONFIG } from '@/types';

interface OnboardingTemplateSelectorProps {
  /** Segmento selecionado para buscar templates */
  segment: string;
  /** IDs dos templates selecionados */
  selectedTemplateIds: string[];
  /** Callback quando seleção muda */
  onSelectionChange: (templateIds: string[]) => void;
  /** Se está em modo de visualização apenas */
  readOnly?: boolean;
}

/** Agrupa templates por fase (baseado no order_index) */
function getPhase(orderIndex: number): { id: number; name: string; icon: string } {
  if (orderIndex < 10) {
    return { id: 1, name: 'Setup & Tracking', icon: '⚙️' };
  }
  if (orderIndex < 20) {
    return { id: 2, name: 'Otimização de Plataforma', icon: '🎯' };
  }
  if (orderIndex < 30) {
    return { id: 3, name: 'Estratégia de Tráfego', icon: '📢' };
  }
  return { id: 4, name: 'Follow-up & Manutenção', icon: '🔄' };
}

/** Interface para template do banco de dados */
interface DbTemplate {
  id: string;
  segment: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  recurrence: TaskRecurrence | null;
  order_index: number;
  is_active: boolean;
}

/**
 * Seletor de templates de onboarding por nicho
 */
export function OnboardingTemplateSelector({
  segment,
  selectedTemplateIds,
  onSelectionChange,
  readOnly = false,
}: OnboardingTemplateSelectorProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca templates do segmento
   */
  useEffect(() => {
    if (!segment) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    const fetchTemplates = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/templates/by-segment/${encodeURIComponent(segment)}`);

        if (!response.ok) {
          throw new Error('Erro ao buscar templates');
        }

        const data: DbTemplate[] = await response.json();

        // Transformar DB → Frontend
        const transformed: TaskTemplate[] = data.map((t) => ({
          id: t.id,
          user_id: '',
          segment: t.segment,
          title: t.title,
          description: t.description,
          default_priority: t.priority,
          default_days_offset: 0,
          is_recurring: t.recurrence !== null,
          recurrence: t.recurrence,
          send_whatsapp: false,
          whatsapp_template: null,
          order_index: t.order_index,
          is_active: t.is_active,
          created_at: '',
          updated_at: '',
        }));

        setTemplates(transformed);

        // Auto-selecionar todos por padrão na primeira carga
        if (selectedTemplateIds.length === 0 && transformed.length > 0) {
          onSelectionChange(transformed.map((t) => t.id));
        }
      } catch (err) {
        console.error('[OnboardingTemplateSelector] Error:', err);
        setError('Não foi possível carregar os templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [segment]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Agrupa templates por fase
   */
  const templatesByPhase = useMemo(() => {
    const groups: Record<number, { phase: ReturnType<typeof getPhase>; templates: TaskTemplate[] }> = {};

    templates.forEach((template) => {
      const phase = getPhase(template.order_index);
      if (!groups[phase.id]) {
        groups[phase.id] = { phase, templates: [] };
      }
      const group = groups[phase.id];
      if (group) {
        group.templates.push(template);
      }
    });

    return Object.values(groups).sort((a, b) => a.phase.id - b.phase.id);
  }, [templates]);

  /**
   * Toggle seleção de um template
   */
  const handleToggleTemplate = useCallback(
    (templateId: string) => {
      if (readOnly) {
        return;
      }

      const isSelected = selectedTemplateIds.includes(templateId);
      if (isSelected) {
        onSelectionChange(selectedTemplateIds.filter((id) => id !== templateId));
      } else {
        onSelectionChange([...selectedTemplateIds, templateId]);
      }
    },
    [selectedTemplateIds, onSelectionChange, readOnly]
  );

  /**
   * Selecionar/desselecionar todos de uma fase
   */
  const handleTogglePhase = useCallback(
    (phaseTemplates: TaskTemplate[]) => {
      if (readOnly) {
        return;
      }

      const phaseIds = phaseTemplates.map((t) => t.id);
      const allSelected = phaseIds.every((id) => selectedTemplateIds.includes(id));

      if (allSelected) {
        // Desselecionar todos da fase
        onSelectionChange(selectedTemplateIds.filter((id) => !phaseIds.includes(id)));
      } else {
        // Selecionar todos da fase
        const newSelection = Array.from(new Set([...selectedTemplateIds, ...phaseIds]));
        onSelectionChange(newSelection);
      }
    },
    [selectedTemplateIds, onSelectionChange, readOnly]
  );

  /**
   * Selecionar/desselecionar todos
   */
  const handleToggleAll = useCallback(() => {
    if (readOnly) {
      return;
    }

    if (selectedTemplateIds.length === templates.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(templates.map((t) => t.id));
    }
  }, [templates, selectedTemplateIds, onSelectionChange, readOnly]);

  if (!segment) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500">Selecione um segmento primeiro para ver os templates de onboarding.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500">Nenhum template de onboarding disponível para este segmento.</p>
        <p className="text-sm text-zinc-600 mt-2">
          Você pode criar templates em Configurações {'>'} Templates.
        </p>
      </div>
    );
  }

  const selectedCount = selectedTemplateIds.length;
  const totalCount = templates.length;

  return (
    <div className="space-y-4">
      {/* Header com seleção global */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-white">Templates de Onboarding</h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            {selectedCount} de {totalCount} tarefas selecionadas
          </p>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={handleToggleAll}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            {selectedCount === totalCount ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
        )}
      </div>

      {/* Templates agrupados por fase */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {templatesByPhase.map(({ phase, templates: phaseTemplates }) => {
          const phaseIds = phaseTemplates.map((t) => t.id);
          const selectedInPhase = phaseIds.filter((id) => selectedTemplateIds.includes(id)).length;
          const allSelected = selectedInPhase === phaseTemplates.length;

          return (
            <div key={phase.id} className="space-y-2">
              {/* Fase Header */}
              <div className="flex items-center justify-between sticky top-0 bg-[#0a0a0f] py-1 z-10">
                <div className="flex items-center gap-2">
                  <span className="text-base">{phase.icon}</span>
                  <span className="text-sm font-medium text-zinc-300">
                    Fase {phase.id}: {phase.name}
                  </span>
                  <span className="text-xs text-zinc-600">
                    ({selectedInPhase}/{phaseTemplates.length})
                  </span>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleTogglePhase(phaseTemplates)}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {allSelected ? 'Desmarcar fase' : 'Marcar fase'}
                  </button>
                )}
              </div>

              {/* Templates da fase */}
              <div className="space-y-1.5 pl-6">
                {phaseTemplates.map((template) => {
                  const isSelected = selectedTemplateIds.includes(template.id);
                  const recurrenceConfig = template.recurrence
                    ? TASK_RECURRENCE_CONFIG[template.recurrence]
                    : null;

                  return (
                    <label
                      key={template.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-violet-500/10 border-violet-500/30'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                      } ${readOnly ? 'cursor-default' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleTemplate(template.id)}
                        disabled={readOnly}
                        className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-white font-medium">{template.title}</span>
                          <PriorityBadge priority={template.default_priority} size="sm" showIcon={false} />
                          {recurrenceConfig && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-400">
                              {recurrenceConfig.label}
                            </span>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{template.description}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
        <p className="text-xs text-violet-300">
          <strong>Dica:</strong> As tarefas selecionadas serão criadas automaticamente após salvar o cliente.
          Tarefas recorrentes serão programadas para execução periódica.
        </p>
      </div>
    </div>
  );
}
