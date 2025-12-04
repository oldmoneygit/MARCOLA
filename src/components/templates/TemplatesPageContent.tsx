/**
 * @file TemplatesPageContent.tsx
 * @description Conteúdo da página de templates de tarefas
 * @module components/templates
 */

'use client';

import { useCallback, useMemo, useState } from 'react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, GlassCard, Modal, Skeleton, EmptyState, Icon } from '@/components/ui';
import { PriorityBadge, CategoryBadge, RecurrenceBadge, AddTaskFromTemplateModal } from '@/components/tasks';

import { useTaskTemplates } from '@/hooks';

import type { CreateTaskTemplateDTO, CreateTaskDTO, TaskTemplate, TaskPriority, TaskRecurrence, TaskCategory } from '@/types';
import { TASK_PRIORITY_CONFIG, TASK_RECURRENCE_CONFIG, TASK_CATEGORY_CONFIG } from '@/types';

/** Segmentos comuns para templates */
const COMMON_SEGMENTS = [
  { value: 'all', label: 'Operacionais (Todos)', icon: 'settings' },
  { value: 'restaurante', label: 'Restaurante', icon: 'delivery' },
  { value: 'academia', label: 'Academia', icon: 'fitness' },
  { value: 'ecommerce', label: 'E-commerce', icon: 'ecommerce' },
  { value: 'clinica', label: 'Clínica', icon: 'health' },
  { value: 'imobiliaria', label: 'Imobiliária', icon: 'construction' },
  { value: 'educacao', label: 'Educação', icon: 'education' },
  { value: 'servicos', label: 'Serviços', icon: 'services' },
  { value: 'varejo', label: 'Varejo', icon: 'other' },
];

/**
 * Formulário de template
 */
interface TemplateFormProps {
  template?: TaskTemplate;
  onSubmit: (data: CreateTaskTemplateDTO) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

function TemplateForm({ template, onSubmit, onCancel, loading = false }: TemplateFormProps) {
  const [formData, setFormData] = useState({
    title: template?.title || '',
    description: template?.description || '',
    segment: template?.segment || '',
    default_priority: template?.default_priority || 'medium' as TaskPriority,
    is_recurring: template?.is_recurring || false,
    recurrence: template?.recurrence || '' as TaskRecurrence | '',
    default_days_offset: template?.default_days_offset ?? 0,
    send_whatsapp: template?.send_whatsapp || false,
    whatsapp_template: template?.whatsapp_template || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value),
    }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }
    if (!formData.segment.trim()) {
      newErrors.segment = 'Segmento é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) { return; }

    const data: CreateTaskTemplateDTO = {
      segment: formData.segment,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      default_priority: formData.default_priority,
      default_days_offset: formData.default_days_offset,
      is_recurring: formData.is_recurring,
      recurrence: formData.is_recurring && formData.recurrence ? formData.recurrence as TaskRecurrence : undefined,
      send_whatsapp: formData.send_whatsapp,
      whatsapp_template: formData.send_whatsapp ? formData.whatsapp_template : undefined,
    };

    await onSubmit(data);
  }, [formData, validate, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Título do Template *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Ex: Reunião de alinhamento semanal"
          className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors"
        />
        {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Descrição
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Detalhes do template..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none"
        />
      </div>

      {/* Segmento */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Segmento (Nicho) *
        </label>
        <select
          name="segment"
          value={formData.segment}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-700/50 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors cursor-pointer hover:border-zinc-600/70"
        >
          <option value="" className="bg-zinc-900 text-zinc-400">Selecione um segmento</option>
          {COMMON_SEGMENTS.map(seg => (
            <option key={seg.value} value={seg.value} className="bg-zinc-900 text-white">
              {seg.label}
            </option>
          ))}
        </select>
        {errors.segment && <p className="mt-1 text-xs text-red-400">{errors.segment}</p>}
      </div>

      {/* Prioridade e Dias de Offset */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Prioridade Padrão
          </label>
          <select
            name="default_priority"
            value={formData.default_priority}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-700/50 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors cursor-pointer hover:border-zinc-600/70"
          >
            {Object.entries(TASK_PRIORITY_CONFIG).map(([priority, config]) => (
              <option key={priority} value={priority} className="bg-zinc-900 text-white">
                {config.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Dias após início
          </label>
          <input
            type="number"
            name="default_days_offset"
            value={formData.default_days_offset}
            onChange={handleChange}
            min={0}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors"
          />
        </div>
      </div>

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
          <select
            name="recurrence"
            value={formData.recurrence}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-700/50 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors cursor-pointer hover:border-zinc-600/70"
          >
            <option value="" className="bg-zinc-900 text-zinc-400">Selecione a frequência</option>
            {Object.entries(TASK_RECURRENCE_CONFIG).map(([recurrence, config]) => (
              <option key={recurrence} value={recurrence} className="bg-zinc-900 text-white">
                {config.label}
              </option>
            ))}
          </select>
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
          <textarea
            name="whatsapp_template"
            value={formData.whatsapp_template}
            onChange={handleChange}
            placeholder="Template da mensagem WhatsApp..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none"
          />
        )}
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {template ? 'Salvar Alterações' : 'Criar Template'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Card de template
 */
interface TemplateCardProps {
  template: TaskTemplate;
  onEdit: (template: TaskTemplate) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onAssign: (template: TaskTemplate) => void;
}

function TemplateCard({ template, onEdit, onDelete, onToggleActive, onAssign }: TemplateCardProps) {
  const segmentInfo = COMMON_SEGMENTS.find(s => s.value === template.segment);
  const isOperational = template.category === 'operational' || template.segment === 'all';

  return (
    <div className={`p-4 rounded-xl border transition-colors ${
      template.is_active
        ? 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]'
        : 'bg-zinc-900/50 border-zinc-800/50 opacity-60'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-white">{template.title}</h3>
          {!template.is_active && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-700 text-zinc-400">
              Inativo
            </span>
          )}
          {template.is_system && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-violet-500/20 text-violet-400">
              Sistema
            </span>
          )}
        </div>
        <PriorityBadge priority={template.default_priority} size="sm" />
      </div>

      {template.description && (
        <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{template.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Category Badge */}
        {template.category && (
          <CategoryBadge category={template.category} size="sm" />
        )}

        {/* Recurrence Badge */}
        {template.recurrence && (
          <RecurrenceBadge recurrence={template.recurrence} size="sm" />
        )}

        {/* Segment (if not operational) */}
        {!isOperational && segmentInfo && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs">
            <Icon name={segmentInfo.icon} size="xs" />
            {segmentInfo.label}
          </span>
        )}
        {!isOperational && !segmentInfo && template.segment && (
          <span className="px-2 py-1 rounded-full bg-zinc-500/10 text-zinc-400 text-xs">
            {template.segment}
          </span>
        )}

        {/* Days offset */}
        {template.default_days_offset > 0 && (
          <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs">
            D+{template.default_days_offset}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={() => onToggleActive(template.id, !template.is_active)}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {template.is_active ? 'Desativar' : 'Ativar'}
        </button>
        <div className="flex items-center gap-3">
          {/* Botão Atribuir a Cliente */}
          <button
            type="button"
            onClick={() => onAssign(template)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <Icon name="user-plus" size="xs" />
            Atribuir
          </button>
          <button
            type="button"
            onClick={() => onEdit(template)}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onDelete(template.id)}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente principal da página de templates
 */
export function TemplatesPageContent() {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useTaskTemplates();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [assigningTemplate, setAssigningTemplate] = useState<TaskTemplate | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'all'>('all');
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);

  /**
   * Filtra templates
   */
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    if (!showInactive) {
      filtered = filtered.filter(t => t.is_active);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    // Filter by segment (only if not filtering all categories or segment is not 'all')
    if (filterSegment !== 'all') {
      filtered = filtered.filter(t => t.segment === filterSegment);
    }

    return filtered;
  }, [templates, filterCategory, filterSegment, showInactive]);

  /**
   * Agrupa templates por segmento
   */
  const templatesBySegment = useMemo(() => {
    const groups: Record<string, TaskTemplate[]> = {};

    filteredTemplates.forEach(template => {
      const segment = template.segment ?? 'Sem Segmento';
      (groups[segment] ??= []).push(template);
    });

    return groups;
  }, [filteredTemplates]);

  const handleCreateTemplate = useCallback(async (data: CreateTaskTemplateDTO) => {
    setFormLoading(true);
    try {
      await createTemplate(data);
      setShowCreateModal(false);
    } catch (err) {
      console.error('[TemplatesPageContent] Error creating template:', err);
    } finally {
      setFormLoading(false);
    }
  }, [createTemplate]);

  const handleUpdateTemplate = useCallback(async (data: CreateTaskTemplateDTO) => {
    if (!editingTemplate) { return; }

    setFormLoading(true);
    try {
      await updateTemplate(editingTemplate.id, data);
      setEditingTemplate(null);
    } catch (err) {
      console.error('[TemplatesPageContent] Error updating template:', err);
    } finally {
      setFormLoading(false);
    }
  }, [editingTemplate, updateTemplate]);

  const handleDeleteTemplate = useCallback(async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) { return; }

    try {
      await deleteTemplate(id);
    } catch (err) {
      console.error('[TemplatesPageContent] Error deleting template:', err);
    }
  }, [deleteTemplate]);

  const handleToggleActive = useCallback(async (id: string, isActive: boolean) => {
    try {
      await updateTemplate(id, { is_active: isActive });
    } catch (err) {
      console.error('[TemplatesPageContent] Error toggling template:', err);
    }
  }, [updateTemplate]);

  const handleAssignTemplate = useCallback((template: TaskTemplate) => {
    setAssigningTemplate(template);
  }, []);

  const handleCreateTaskFromTemplate = useCallback(async (data: CreateTaskDTO) => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar tarefa');
    }

    setAssigningTemplate(null);
  }, []);

  // Loading state
  if (loading) {
    return (
      <DashboardLayout title="Templates" subtitle="Gerencie templates de tarefas por segmento">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton.Card key={i} />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Templates"
      subtitle="Gerencie templates de tarefas por segmento"
      headerActions={
        <Button onClick={() => setShowCreateModal(true)}>
          Novo Template
        </Button>
      }
    >
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Category filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Categoria:</span>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as TaskCategory | 'all')}
            className="px-3 py-2 text-sm rounded-lg bg-zinc-900/80 border border-zinc-700/50 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors cursor-pointer hover:border-zinc-600/70"
          >
            <option value="all" className="bg-zinc-900 text-white">Todas</option>
            {Object.entries(TASK_CATEGORY_CONFIG).map(([key, config]) => (
              <option key={key} value={key} className="bg-zinc-900 text-white">
                {config.label}
              </option>
            ))}
          </select>
        </div>

        {/* Segment filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Segmento:</span>
          <select
            value={filterSegment}
            onChange={e => setFilterSegment(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-zinc-900/80 border border-zinc-700/50 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors cursor-pointer hover:border-zinc-600/70"
          >
            <option value="all" className="bg-zinc-900 text-white">Todos</option>
            {COMMON_SEGMENTS.map(seg => (
              <option key={seg.value} value={seg.value} className="bg-zinc-900 text-white">
                {seg.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50"
          />
          Mostrar inativos
        </label>
      </div>

      {/* Lista de templates */}
      {filteredTemplates.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon="📋"
            title="Nenhum template encontrado"
            description="Crie templates para automatizar tarefas de onboarding"
            action={{
              label: 'Criar Template',
              onClick: () => setShowCreateModal(true),
            }}
          />
        </GlassCard>
      ) : (
        <div className="space-y-8">
          {/* Templates por segmento */}
          {Object.entries(templatesBySegment).map(([segment, segmentTemplates]) => {
            const segmentInfo = COMMON_SEGMENTS.find(s => s.value === segment);
            return (
              <div key={segment}>
                <h2 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                  {segmentInfo && (
                    <div className="p-1.5 rounded-lg bg-violet-500/10">
                      <Icon name={segmentInfo.icon} size="sm" className="text-violet-400" />
                    </div>
                  )}
                  <span>{segmentInfo?.label || segment}</span>
                  <span className="text-xs text-zinc-500 font-normal">({segmentTemplates.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {segmentTemplates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onEdit={setEditingTemplate}
                      onDelete={handleDeleteTemplate}
                      onToggleActive={handleToggleActive}
                      onAssign={handleAssignTemplate}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de criação */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Novo Template"
        size="lg"
      >
        <TemplateForm
          onSubmit={handleCreateTemplate}
          onCancel={() => setShowCreateModal(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Modal de edição */}
      <Modal
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        title="Editar Template"
        size="lg"
      >
        {editingTemplate && (
          <TemplateForm
            template={editingTemplate}
            onSubmit={handleUpdateTemplate}
            onCancel={() => setEditingTemplate(null)}
            loading={formLoading}
          />
        )}
      </Modal>

      {/* Modal de atribuição a cliente */}
      <AddTaskFromTemplateModal
        isOpen={!!assigningTemplate}
        onClose={() => setAssigningTemplate(null)}
        selectedTemplate={assigningTemplate || undefined}
        onSubmit={handleCreateTaskFromTemplate}
      />
    </DashboardLayout>
  );
}
