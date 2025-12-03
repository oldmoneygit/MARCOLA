/**
 * @file BriefingsPageContent.tsx
 * @description Conteúdo da página de gerenciamento de briefings (questionários por nicho)
 * @module components/templates
 */

'use client';

import { useCallback, useMemo, useState } from 'react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, GlassCard, Modal, Skeleton, EmptyState, Input, Select, Icon } from '@/components/ui';
import { cn } from '@/lib/utils';

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
  { value: 'delivery', label: 'Delivery', icon: 'pizza' },
  { value: 'restaurante', label: 'Restaurante', icon: 'pizza' },
  { value: 'academia', label: 'Academia', icon: 'fitness' },
  { value: 'ecommerce', label: 'E-commerce', icon: 'cart' },
  { value: 'clinica', label: 'Clínica', icon: 'hospital' },
  { value: 'imobiliaria', label: 'Imobiliária', icon: 'map-pin' },
  { value: 'educacao', label: 'Educação', icon: 'graduation' },
  { value: 'servicos', label: 'Serviços', icon: 'wrench' },
  { value: 'varejo', label: 'Varejo', icon: 'cart' },
  { value: 'saude', label: 'Saúde', icon: 'hospital' },
  { value: 'beleza', label: 'Beleza', icon: 'sparkles' },
  { value: 'pet', label: 'Pet Shop', icon: 'heart' },
];

/** Tipos de campo disponíveis */
const FIELD_TYPES: { value: BriefingFieldType; label: string; icon: string }[] = [
  { value: 'text', label: 'Texto curto', icon: 'filetext' },
  { value: 'textarea', label: 'Texto longo', icon: 'filetext' },
  { value: 'select', label: 'Seleção única', icon: 'filetext' },
  { value: 'multiselect', label: 'Seleção múltipla', icon: 'checksquare' },
  { value: 'checkbox', label: 'Sim/Não', icon: 'check' },
  { value: 'number', label: 'Número', icon: 'barchart3' },
  { value: 'date', label: 'Data', icon: 'calendar' },
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
          options={FIELD_TYPES.map((t) => ({ value: t.value, label: t.label }))}
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
            <label className="block text-xs text-zinc-400 mb-1.5">Segmento *</label>
            <select
              name="segment"
              value={formData.segment}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-700/50 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors cursor-pointer hover:border-zinc-600/70"
            >
              <option value="" className="bg-zinc-900 text-white">Selecione...</option>
              {COMMON_SEGMENTS.map((seg) => (
                <option key={seg.value} value={seg.value} className="bg-zinc-900 text-white">
                  {seg.label}
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

  // Gradiente baseado no segmento para diferenciação visual (sutil mas visível)
  const getSegmentGradient = (segment: string) => {
    const gradients: Record<string, string> = {
      delivery: 'bg-gradient-to-br from-yellow-500/8 via-amber-500/5 to-yellow-400/8 border-yellow-500/15',
      restaurante: 'bg-gradient-to-br from-red-500/8 via-rose-500/5 to-pink-500/8 border-red-500/15',
      academia: 'bg-gradient-to-br from-blue-500/8 via-cyan-500/5 to-teal-500/8 border-blue-500/15',
      ecommerce: 'bg-gradient-to-br from-purple-500/8 via-violet-500/5 to-indigo-500/8 border-purple-500/15',
      clinica: 'bg-gradient-to-br from-emerald-500/8 via-green-500/5 to-teal-500/8 border-emerald-500/15',
      imobiliaria: 'bg-gradient-to-br from-amber-500/8 via-orange-500/5 to-red-500/8 border-amber-500/15',
      educacao: 'bg-gradient-to-br from-indigo-500/8 via-blue-500/5 to-cyan-500/8 border-indigo-500/15',
      servicos: 'bg-gradient-to-br from-zinc-500/8 via-slate-500/5 to-gray-500/8 border-zinc-500/15',
      varejo: 'bg-gradient-to-br from-pink-500/8 via-rose-500/5 to-red-500/8 border-pink-500/15',
      saude: 'bg-gradient-to-br from-emerald-500/8 via-green-500/5 to-lime-500/8 border-emerald-500/15',
      beleza: 'bg-gradient-to-br from-fuchsia-500/8 via-pink-500/5 to-rose-500/8 border-fuchsia-500/15',
      pet: 'bg-gradient-to-br from-purple-500/8 via-pink-500/5 to-rose-500/8 border-purple-500/15',
    };
    return gradients[segment] || 'bg-gradient-to-br from-violet-500/8 via-purple-500/5 to-indigo-500/8 border-violet-500/15';
  };

  return (
    <GlassCard
      className={cn(
        'p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/10',
        template.is_active
          ? getSegmentGradient(template.segment)
          : 'bg-zinc-900/50 border-zinc-800/50 opacity-60'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {segmentInfo && (
            <div className="p-2 rounded-lg bg-white/[0.05] flex-shrink-0">
              <Icon name={segmentInfo.icon} size="sm" className="text-violet-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate mb-1">{template.name}</h3>
            {template.description && (
              <p className="text-xs text-zinc-400 line-clamp-2">{template.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!template.is_active && (
            <span className="px-2 py-1 text-xs rounded-lg bg-zinc-700/50 text-zinc-400 border border-zinc-600/50">
              Inativo
            </span>
          )}
          {isSystemTemplate && (
            <span className="px-2 py-1 text-xs rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
              Sistema
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {segmentInfo && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/20">
            <Icon name={segmentInfo.icon} size="xs" />
            {segmentInfo.label}
          </span>
        )}
        {!segmentInfo && template.segment && (
          <span className="px-2.5 py-1 text-xs rounded-lg bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            {template.segment}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          <Icon name="filetext" size="xs" />
          {questionCount} {questionCount === 1 ? 'pergunta' : 'perguntas'}
        </span>
      </div>

      {/* Preview de perguntas */}
      {template.questions && template.questions.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="filetext" size="xs" className="text-zinc-500" />
            <p className="text-xs font-medium text-zinc-400">Perguntas:</p>
          </div>
          <ul className="space-y-1.5">
            {template.questions.slice(0, 3).map((q, i) => (
              <li key={q.id || i} className="flex items-start gap-2 text-xs text-zinc-300">
                <span className="text-zinc-500 font-medium flex-shrink-0">{i + 1}.</span>
                <span className="flex-1 min-w-0">
                  <span className="truncate block">{q.question}</span>
                  {q.is_required && (
                    <span className="inline-flex items-center gap-1 mt-0.5 text-red-400">
                      <Icon name="alert" size="xs" />
                      Obrigatória
                    </span>
                  )}
                </span>
              </li>
            ))}
            {template.questions.length > 3 && (
              <li className="text-xs text-zinc-500 pt-1">
                +{template.questions.length - 3} mais perguntas...
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleActive(template.id, !template.is_active)}
          className="text-xs"
        >
          {template.is_active ? 'Desativar' : 'Ativar'}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(template)}
            className="text-xs"
          >
            <Icon name="filetext" size="xs" className="mr-1" />
            Editar
          </Button>
          {!isSystemTemplate && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(template.id)}
              className="text-xs"
            >
              <Icon name="x-circle" size="xs" className="mr-1" />
              Excluir
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
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
      <GlassCard className="mb-6 p-4 bg-gradient-to-br from-violet-500/8 via-purple-500/5 to-indigo-500/8 border-violet-500/15">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-violet-500/20">
            <Icon name="filetext" size="md" className="text-violet-400" />
          </div>
          <div>
            <h3 className="font-medium text-white mb-1">Como funciona?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
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
          <span className="text-xs text-zinc-400">Segmento:</span>
          <select
            value={filterSegment}
            onChange={(e) => setFilterSegment(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-zinc-900/80 border border-zinc-700/50 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors cursor-pointer hover:border-zinc-600/70"
          >
            <option value="all" className="bg-zinc-900 text-white">Todos</option>
            {COMMON_SEGMENTS.map((seg) => (
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
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  {segmentInfo && (
                    <div className="p-1.5 rounded-lg bg-violet-500/10">
                      <Icon name={segmentInfo.icon} size="sm" className="text-violet-400" />
                    </div>
                  )}
                  <span>{segmentInfo?.label || segment}</span>
                  <span className="text-sm text-zinc-500 font-normal">({segmentTemplates.length})</span>
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
