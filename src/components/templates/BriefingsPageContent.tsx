/**
 * @file BriefingsPageContent.tsx
 * @description Conteúdo da página de gerenciamento de briefings (questionários por nicho)
 * @module components/templates
 */

'use client';

import { useCallback, useMemo, useState } from 'react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, GlassCard, Modal, Skeleton, EmptyState, Input, Select } from '@/components/ui';

import { useBriefingTemplates } from '@/hooks/useBriefingTemplates';

import type {
  BriefingFieldType,
  BriefingTemplateWithQuestions,
  CreateBriefingQuestionDTO,
  CreateBriefingTemplateDTO,
} from '@/types';

// =============================================
// Constantes
// =============================================

/** Segmentos comuns para briefings */
const COMMON_SEGMENTS = [
  { value: 'delivery', label: 'Delivery', icon: '🛵' },
  { value: 'restaurante', label: 'Restaurante', icon: '🍽️' },
  { value: 'academia', label: 'Academia', icon: '💪' },
  { value: 'ecommerce', label: 'E-commerce', icon: '🛒' },
  { value: 'clinica', label: 'Clínica', icon: '🏥' },
  { value: 'imobiliaria', label: 'Imobiliária', icon: '🏠' },
  { value: 'educacao', label: 'Educação', icon: '📚' },
  { value: 'servicos', label: 'Serviços', icon: '🔧' },
  { value: 'varejo', label: 'Varejo', icon: '🏪' },
  { value: 'saude', label: 'Saúde', icon: '❤️' },
  { value: 'beleza', label: 'Beleza', icon: '💅' },
  { value: 'pet', label: 'Pet Shop', icon: '🐾' },
];

/** Tipos de campo disponíveis */
const FIELD_TYPES: { value: BriefingFieldType; label: string; icon: string }[] = [
  { value: 'text', label: 'Texto curto', icon: '📝' },
  { value: 'textarea', label: 'Texto longo', icon: '📄' },
  { value: 'select', label: 'Seleção única', icon: '☑️' },
  { value: 'multiselect', label: 'Seleção múltipla', icon: '✅' },
  { value: 'checkbox', label: 'Sim/Não', icon: '🔘' },
  { value: 'number', label: 'Número', icon: '🔢' },
  { value: 'date', label: 'Data', icon: '📅' },
];

// =============================================
// QuestionEditor Component
// =============================================

interface QuestionEditorProps {
  question: CreateBriefingQuestionDTO;
  index: number;
  onChange: (index: number, question: CreateBriefingQuestionDTO) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

function QuestionEditor({
  question,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: QuestionEditorProps) {
  const needsOptions = question.field_type === 'select' || question.field_type === 'multiselect';
  const [optionsText, setOptionsText] = useState(question.options?.join('\n') || '');

  const handleFieldChange = useCallback(
    (field: keyof CreateBriefingQuestionDTO, value: unknown) => {
      onChange(index, { ...question, [field]: value });
    },
    [index, onChange, question]
  );

  const handleOptionsChange = useCallback(
    (text: string) => {
      setOptionsText(text);
      const options = text
        .split('\n')
        .map((o) => o.trim())
        .filter((o) => o.length > 0);
      handleFieldChange('options', options.length > 0 ? options : undefined);
    },
    [handleFieldChange]
  );

  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">Pergunta {index + 1}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] disabled:opacity-30 transition-colors"
            title="Mover para cima"
          >
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={isLast}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] disabled:opacity-30 transition-colors"
            title="Mover para baixo"
          >
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
            title="Remover pergunta"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Pergunta */}
      <div>
        <Input
          value={question.question}
          onChange={(e) => handleFieldChange('question', e.target.value)}
          placeholder="Digite a pergunta..."
        />
      </div>

      {/* Tipo e Obrigatória */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          value={question.field_type}
          onChange={(e) => handleFieldChange('field_type', e.target.value as BriefingFieldType)}
          options={FIELD_TYPES.map((t) => ({ value: t.value, label: `${t.icon} ${t.label}` }))}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={question.is_required || false}
            onChange={(e) => handleFieldChange('is_required', e.target.checked)}
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50"
          />
          <span className="text-sm text-zinc-300">Obrigatória</span>
        </label>
      </div>

      {/* Placeholder */}
      <Input
        value={question.placeholder || ''}
        onChange={(e) => handleFieldChange('placeholder', e.target.value || undefined)}
        placeholder="Placeholder (opcional)"
      />

      {/* Opções (para select/multiselect) */}
      {needsOptions && (
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">
            Opções (uma por linha)
          </label>
          <textarea
            value={optionsText}
            onChange={(e) => handleOptionsChange(e.target.value)}
            placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
            rows={4}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none text-sm"
          />
        </div>
      )}
    </div>
  );
}

// =============================================
// BriefingTemplateForm Component
// =============================================

interface BriefingTemplateFormProps {
  template?: BriefingTemplateWithQuestions;
  onSubmit: (data: CreateBriefingTemplateDTO) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

function BriefingTemplateForm({
  template,
  onSubmit,
  onCancel,
  loading = false,
}: BriefingTemplateFormProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    segment: template?.segment || '',
  });

  const [questions, setQuestions] = useState<CreateBriefingQuestionDTO[]>(() => {
    if (template?.questions && template.questions.length > 0) {
      return template.questions.map((q) => ({
        question: q.question,
        field_type: q.field_type,
        options: q.options || undefined,
        placeholder: q.placeholder || undefined,
        is_required: q.is_required,
        order_index: q.order_index,
      }));
    }
    return [];
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
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

  const addQuestion = useCallback(() => {
    setQuestions((prev) => [
      ...prev,
      {
        question: '',
        field_type: 'text',
        is_required: false,
        order_index: prev.length,
      },
    ]);
  }, []);

  const updateQuestion = useCallback((index: number, question: CreateBriefingQuestionDTO) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = question;
      return updated;
    });
  }, []);

  const removeQuestion = useCallback((index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveQuestion = useCallback((index: number, direction: 'up' | 'down') => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newQuestions.length) {
        return prev;
      }
      const currentItem = newQuestions[index];
      const targetItem = newQuestions[targetIndex];
      if (!currentItem || !targetItem) {
        return prev;
      }
      newQuestions[index] = targetItem;
      newQuestions[targetIndex] = currentItem;
      return newQuestions;
    });
  }, []);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    if (!formData.segment.trim()) {
      newErrors.segment = 'Segmento é obrigatório';
    }
    if (questions.length === 0) {
      newErrors.questions = 'Adicione pelo menos uma pergunta';
    } else {
      const hasEmptyQuestion = questions.some((q) => !q.question.trim());
      if (hasEmptyQuestion) {
        newErrors.questions = 'Preencha todas as perguntas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, questions]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) {
        return;
      }

      const data: CreateBriefingTemplateDTO = {
        segment: formData.segment,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        is_active: true,
        questions: questions.map((q, i) => ({
          ...q,
          order_index: i,
        })),
      };

      await onSubmit(data);
    },
    [formData, questions, validate, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações básicas */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-zinc-300">Informações do Template</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Nome *</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Briefing Delivery"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Segmento *</label>
            <select
              name="segment"
              value={formData.segment}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors"
            >
              <option value="">Selecione...</option>
              {COMMON_SEGMENTS.map((seg) => (
                <option key={seg.value} value={seg.value}>
                  {seg.icon} {seg.label}
                </option>
              ))}
            </select>
            {errors.segment && <p className="mt-1 text-xs text-red-400">{errors.segment}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Descrição</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Descrição do briefing..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Perguntas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-zinc-300">
            Perguntas ({questions.length})
          </h4>
          <Button type="button" variant="ghost" size="sm" onClick={addQuestion}>
            + Adicionar Pergunta
          </Button>
        </div>

        {errors.questions && (
          <p className="text-xs text-red-400">{errors.questions}</p>
        )}

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {questions.map((question, index) => (
            <QuestionEditor
              key={index}
              question={question}
              index={index}
              onChange={updateQuestion}
              onRemove={removeQuestion}
              onMoveUp={() => moveQuestion(index, 'up')}
              onMoveDown={() => moveQuestion(index, 'down')}
              isFirst={index === 0}
              isLast={index === questions.length - 1}
            />
          ))}

          {questions.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-zinc-500 text-sm">Nenhuma pergunta adicionada</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addQuestion}
                className="mt-2"
              >
                Adicionar primeira pergunta
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {template ? 'Salvar Alterações' : 'Criar Briefing'}
        </Button>
      </div>
    </form>
  );
}

// =============================================
// BriefingTemplateCard Component
// =============================================

interface BriefingTemplateCardProps {
  template: BriefingTemplateWithQuestions;
  onEdit: (template: BriefingTemplateWithQuestions) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

function BriefingTemplateCard({
  template,
  onEdit,
  onDelete,
  onToggleActive,
}: BriefingTemplateCardProps) {
  const segmentInfo = COMMON_SEGMENTS.find((s) => s.value === template.segment);
  const questionCount = template.questions?.length || 0;
  const isSystemTemplate = template.user_id === null;

  return (
    <div
      className={`p-4 rounded-xl border transition-colors ${
        template.is_active
          ? 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]'
          : 'bg-zinc-900/50 border-zinc-800/50 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-white">{template.name}</h3>
          {!template.is_active && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-700 text-zinc-400">
              Inativo
            </span>
          )}
          {isSystemTemplate && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400">
              Sistema
            </span>
          )}
        </div>
      </div>

      {template.description && (
        <p className="text-sm text-zinc-400 mb-3">{template.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
        {segmentInfo && (
          <span className="px-2 py-1 rounded-full bg-violet-500/10 text-violet-400">
            {segmentInfo.icon} {segmentInfo.label}
          </span>
        )}
        {!segmentInfo && template.segment && (
          <span className="px-2 py-1 rounded-full bg-zinc-500/10 text-zinc-400">
            {template.segment}
          </span>
        )}
        <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
          {questionCount} {questionCount === 1 ? 'pergunta' : 'perguntas'}
        </span>
      </div>

      {/* Preview de perguntas */}
      {template.questions && template.questions.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
          <p className="text-xs text-zinc-500 mb-2">Perguntas:</p>
          <ul className="space-y-1">
            {template.questions.slice(0, 3).map((q, i) => (
              <li key={q.id || i} className="text-xs text-zinc-400 truncate">
                {i + 1}. {q.question}
                {q.is_required && <span className="text-red-400 ml-1">*</span>}
              </li>
            ))}
            {template.questions.length > 3 && (
              <li className="text-xs text-zinc-500">
                +{template.questions.length - 3} mais...
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        {!isSystemTemplate ? (
          <>
            <button
              type="button"
              onClick={() => onToggleActive(template.id, !template.is_active)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {template.is_active ? 'Desativar' : 'Ativar'}
            </button>
            <div className="flex items-center gap-2">
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
          </>
        ) : (
          <span className="text-xs text-zinc-600">
            Templates do sistema não podem ser editados
          </span>
        )}
      </div>
    </div>
  );
}

// =============================================
// BriefingsPageContent Component
// =============================================

/**
 * Componente principal da página de briefings
 */
export function BriefingsPageContent() {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } =
    useBriefingTemplates();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BriefingTemplateWithQuestions | null>(
    null
  );
  const [formLoading, setFormLoading] = useState(false);
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);

  /**
   * Filtra templates
   */
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    if (!showInactive) {
      filtered = filtered.filter((t) => t.is_active);
    }

    if (filterSegment !== 'all') {
      filtered = filtered.filter((t) => t.segment === filterSegment);
    }

    return filtered;
  }, [templates, filterSegment, showInactive]);

  /**
   * Agrupa templates por segmento
   */
  const templatesBySegment = useMemo(() => {
    const groups: Record<string, BriefingTemplateWithQuestions[]> = {};

    filteredTemplates.forEach((template) => {
      const segment = template.segment;
      (groups[segment] ??= []).push(template);
    });

    return groups;
  }, [filteredTemplates]);

  const handleCreateTemplate = useCallback(
    async (data: CreateBriefingTemplateDTO) => {
      setFormLoading(true);
      try {
        await createTemplate(data);
        setShowCreateModal(false);
      } catch (err) {
        console.error('[BriefingsPageContent] Error creating template:', err);
      } finally {
        setFormLoading(false);
      }
    },
    [createTemplate]
  );

  const handleUpdateTemplate = useCallback(
    async (data: CreateBriefingTemplateDTO) => {
      if (!editingTemplate) {
        return;
      }

      setFormLoading(true);
      try {
        await updateTemplate(editingTemplate.id, data);
        setEditingTemplate(null);
      } catch (err) {
        console.error('[BriefingsPageContent] Error updating template:', err);
      } finally {
        setFormLoading(false);
      }
    },
    [editingTemplate, updateTemplate]
  );

  const handleDeleteTemplate = useCallback(
    async (id: string) => {
      if (!confirm('Tem certeza que deseja excluir este briefing?')) {
        return;
      }

      try {
        await deleteTemplate(id);
      } catch (err) {
        console.error('[BriefingsPageContent] Error deleting template:', err);
      }
    },
    [deleteTemplate]
  );

  const handleToggleActive = useCallback(
    async (id: string, isActive: boolean) => {
      try {
        await updateTemplate(id, { is_active: isActive });
      } catch (err) {
        console.error('[BriefingsPageContent] Error toggling template:', err);
      }
    },
    [updateTemplate]
  );

  // Loading state
  if (loading) {
    return (
      <DashboardLayout
        title="Briefings"
        subtitle="Crie questionários personalizados para cada nicho de cliente"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton.Card key={i} />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Briefings"
      subtitle="Crie questionários personalizados para cada nicho de cliente"
      headerActions={
        <Button onClick={() => setShowCreateModal(true)}>Novo Briefing</Button>
      }
    >
      {/* Info Card */}
      <GlassCard className="mb-6 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📋</span>
          <div>
            <h3 className="font-medium text-white mb-1">Como funciona?</h3>
            <p className="text-sm text-zinc-400">
              Os briefings são questionários personalizados para cada nicho de cliente.
              Quando você criar um cliente de um determinado segmento (ex: Delivery),
              o briefing correspondente aparecerá automaticamente durante o cadastro.
              As respostas ficam salvas no perfil do cliente para consulta futura.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Segmento:</span>
          <select
            value={filterSegment}
            onChange={(e) => setFilterSegment(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-violet-500/50"
          >
            <option value="all">Todos</option>
            {COMMON_SEGMENTS.map((seg) => (
              <option key={seg.value} value={seg.value}>
                {seg.icon} {seg.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50"
          />
          Mostrar inativos
        </label>

        <span className="text-xs text-zinc-600 ml-auto">
          {filteredTemplates.length} briefing(s)
        </span>
      </div>

      {/* Lista de templates */}
      {filteredTemplates.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon="📋"
            title="Nenhum briefing encontrado"
            description="Crie briefings personalizados para automatizar a coleta de informações dos clientes"
            action={{
              label: 'Criar Briefing',
              onClick: () => setShowCreateModal(true),
            }}
          />
        </GlassCard>
      ) : (
        <div className="space-y-8">
          {Object.entries(templatesBySegment).map(([segment, segmentTemplates]) => {
            const segmentInfo = COMMON_SEGMENTS.find((s) => s.value === segment);
            return (
              <div key={segment}>
                <h2 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                  {segmentInfo && <span>{segmentInfo.icon}</span>}
                  {segmentInfo?.label || segment} ({segmentTemplates.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {segmentTemplates.map((template) => (
                    <BriefingTemplateCard
                      key={template.id}
                      template={template}
                      onEdit={setEditingTemplate}
                      onDelete={handleDeleteTemplate}
                      onToggleActive={handleToggleActive}
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
        title="Novo Briefing"
        size="xl"
      >
        <BriefingTemplateForm
          onSubmit={handleCreateTemplate}
          onCancel={() => setShowCreateModal(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Modal de edição */}
      <Modal
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        title="Editar Briefing"
        size="xl"
      >
        {editingTemplate && (
          <BriefingTemplateForm
            template={editingTemplate}
            onSubmit={handleUpdateTemplate}
            onCancel={() => setEditingTemplate(null)}
            loading={formLoading}
          />
        )}
      </Modal>
    </DashboardLayout>
  );
}
