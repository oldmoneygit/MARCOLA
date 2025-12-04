/**
 * @file AddTaskFromTemplateModal.tsx
 * @description Modal para criar tarefa a partir de um template
 * @module components/tasks
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

import { Modal, Button, Icon, GlassCard, Skeleton } from '@/components/ui';
import { PriorityBadge, CategoryBadge, RecurrenceBadge } from '@/components/tasks';

import { useTaskTemplates } from '@/hooks';

import type { TaskTemplate, CreateTaskDTO, TaskCategory, Client } from '@/types';
import { TASK_CATEGORY_CONFIG } from '@/types';

interface AddTaskFromTemplateModalProps {
  /** Se está aberto */
  isOpen: boolean;
  /** Callback ao fechar */
  onClose: () => void;
  /** ID do cliente (se já definido) */
  clientId?: string;
  /** Nome do cliente (para exibição) */
  clientName?: string;
  /** Template pré-selecionado */
  selectedTemplate?: TaskTemplate;
  /** Callback ao criar tarefa */
  onSubmit: (data: CreateTaskDTO) => Promise<void>;
}

/**
 * Modal para criar tarefa a partir de um template
 */
function AddTaskFromTemplateModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  selectedTemplate: initialTemplate,
  onSubmit,
}: AddTaskFromTemplateModalProps) {
  const { templates, loading: templatesLoading } = useTaskTemplates({ autoFetch: isOpen });

  const [step, setStep] = useState<'select' | 'configure'>(initialTemplate ? 'configure' : 'select');
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(initialTemplate || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'all'>('all');
  const [submitting, setSubmitting] = useState(false);

  // Form data para configuração
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + (initialTemplate?.default_days_offset || 0));
    return date.toISOString().substring(0, 10);
  });
  const [dueTime, setDueTime] = useState('');

  // Lista de clientes (se clientId não fornecido)
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(clientId || '');

  // Carregar clientes se necessário
  useEffect(() => {
    if (isOpen && !clientId) {
      setLoadingClients(true);
      fetch('/api/clients')
        .then((res) => res.json())
        .then((data) => setClients(data))
        .catch((err) => console.error('[AddTaskFromTemplateModal] Error fetching clients:', err))
        .finally(() => setLoadingClients(false));
    }
  }, [isOpen, clientId]);

  // Reset ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setStep(initialTemplate ? 'configure' : 'select');
      setSelectedTemplate(initialTemplate || null);
      setSearchQuery('');
      setFilterCategory('all');
      setSelectedClientId(clientId || '');

      if (initialTemplate) {
        const date = new Date();
        date.setDate(date.getDate() + (initialTemplate.default_days_offset || 0));
        setDueDate(date.toISOString().substring(0, 10));
      }
    }
  }, [isOpen, initialTemplate, clientId]);

  // Filtrar templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates.filter((t) => t.is_active);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.segment?.toLowerCase().includes(query)
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === filterCategory);
    }

    return filtered;
  }, [templates, searchQuery, filterCategory]);

  // Agrupar por categoria
  const templatesByCategory = useMemo(() => {
    const groups: Record<string, TaskTemplate[]> = {};
    filteredTemplates.forEach((t) => {
      const category = t.category || 'custom';
      (groups[category] ??= []).push(t);
    });
    return groups;
  }, [filteredTemplates]);

  const handleSelectTemplate = useCallback((template: TaskTemplate) => {
    setSelectedTemplate(template);
    const date = new Date();
    date.setDate(date.getDate() + (template.default_days_offset || 0));
    setDueDate(date.toISOString().substring(0, 10));
    setStep('configure');
  }, []);

  const handleBack = useCallback(() => {
    setStep('select');
    setSelectedTemplate(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedTemplate) { return; }

    const targetClientId = clientId || selectedClientId;
    if (!targetClientId) { return; }

    setSubmitting(true);
    try {
      const data: CreateTaskDTO = {
        client_id: targetClientId,
        template_id: selectedTemplate.id,
        category: selectedTemplate.category,
        title: selectedTemplate.title,
        description: selectedTemplate.description || undefined,
        checklist: selectedTemplate.checklist,
        due_date: dueDate,
        due_time: dueTime || undefined,
        priority: selectedTemplate.default_priority,
        is_recurring: selectedTemplate.is_recurring,
        recurrence: selectedTemplate.recurrence || undefined,
        send_whatsapp: selectedTemplate.send_whatsapp,
        whatsapp_message: selectedTemplate.whatsapp_template || undefined,
      };

      await onSubmit(data);
      onClose();
    } catch (err) {
      console.error('[AddTaskFromTemplateModal] Error creating task:', err);
    } finally {
      setSubmitting(false);
    }
  }, [selectedTemplate, clientId, selectedClientId, dueDate, dueTime, onSubmit, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'select' ? 'Selecionar Template' : 'Configurar Tarefa'}
      size="lg"
    >
      {step === 'select' ? (
        <div className="space-y-4">
          {/* Barra de busca e filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Icon
                name="search"
                size="sm"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar templates..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as TaskCategory | 'all')}
              className="px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-700/50 text-white focus:outline-none focus:border-violet-500/50"
            >
              <option value="all">Todas categorias</option>
              {Object.entries(TASK_CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de templates */}
          <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
            {templatesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <Icon name="search" size="lg" className="mx-auto mb-2 opacity-50" />
                <p>Nenhum template encontrado</p>
              </div>
            ) : (
              Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                <div key={category}>
                  <h3 className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-2">
                    <CategoryBadge category={category as TaskCategory} size="sm" />
                    <span>({categoryTemplates.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {categoryTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleSelectTemplate(template)}
                        className="w-full text-left p-3 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-violet-500/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{template.title}</h4>
                            {template.description && (
                              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                                {template.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <PriorityBadge priority={template.default_priority} size="sm" />
                            {template.recurrence && (
                              <RecurrenceBadge recurrence={template.recurrence} size="sm" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Template selecionado */}
          {selectedTemplate && (
            <GlassCard className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white">{selectedTemplate.title}</h3>
                  {selectedTemplate.description && (
                    <p className="text-sm text-zinc-400 mt-1">{selectedTemplate.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {selectedTemplate.category && (
                      <CategoryBadge category={selectedTemplate.category} size="sm" />
                    )}
                    <PriorityBadge priority={selectedTemplate.default_priority} size="sm" />
                    {selectedTemplate.recurrence && (
                      <RecurrenceBadge recurrence={selectedTemplate.recurrence} size="sm" />
                    )}
                  </div>
                </div>
                {!initialTemplate && (
                  <Button variant="ghost" size="sm" onClick={handleBack}>
                    <Icon name="arrow-left" size="sm" />
                    Trocar
                  </Button>
                )}
              </div>
            </GlassCard>
          )}

          {/* Cliente (se não definido) */}
          {!clientId && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Cliente *
              </label>
              {loadingClients ? (
                <Skeleton className="h-10" />
              ) : (
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-700/50 text-white focus:outline-none focus:border-violet-500/50"
                  required
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
          )}

          {/* Cliente fixo (exibição) */}
          {clientId && clientName && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Cliente</label>
              <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white">
                {clientName}
              </div>
            </div>
          )}

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Data de Vencimento *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-violet-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Horário (opcional)
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          {/* Checklist preview */}
          {selectedTemplate?.checklist && selectedTemplate.checklist.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Checklist ({selectedTemplate.checklist.length} itens)
              </label>
              <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.08] text-sm text-zinc-400 max-h-24 overflow-y-auto">
                {selectedTemplate.checklist.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 py-0.5">
                    <Icon name="check-square" size="xs" className="text-zinc-600" />
                    <span>{item.text}</span>
                  </div>
                ))}
                {selectedTemplate.checklist.length > 3 && (
                  <p className="text-xs text-zinc-500 mt-1">
                    +{selectedTemplate.checklist.length - 3} mais itens
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={!selectedTemplate || (!clientId && !selectedClientId)}
            >
              <Icon name="plus" size="sm" />
              Criar Tarefa
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export { AddTaskFromTemplateModal };
export type { AddTaskFromTemplateModalProps };
