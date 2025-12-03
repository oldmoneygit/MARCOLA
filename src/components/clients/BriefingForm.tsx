/**
 * @file BriefingForm.tsx
 * @description Formulário de briefing dinâmico baseado em template
 * @module components/clients
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { Input, Select, Skeleton } from '@/components/ui';

import type {
  BriefingAnswer,
  BriefingData,
  BriefingQuestion,
  BriefingTemplateWithQuestions,
} from '@/types';

interface BriefingFormProps {
  /** Segmento para buscar o template */
  segment: string;
  /** Dados de briefing existentes (para edição) */
  existingData?: BriefingData | null;
  /** Callback quando os dados mudam */
  onChange: (data: BriefingData | null) => void;
  /** Se está em modo de visualização apenas */
  readOnly?: boolean;
}

/**
 * Formulário de briefing dinâmico baseado em template do segmento
 */
export function BriefingForm({
  segment,
  existingData,
  onChange,
  readOnly = false,
}: BriefingFormProps) {
  const [template, setTemplate] = useState<BriefingTemplateWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, BriefingAnswer>>({});

  /**
   * Busca template de briefing do segmento
   */
  useEffect(() => {
    if (!segment) {
      setTemplate(null);
      setLoading(false);
      return;
    }

    const fetchTemplate = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/briefings/by-segment/${encodeURIComponent(segment)}`);

        if (!response.ok) {
          throw new Error('Erro ao buscar briefing');
        }

        const data = await response.json();

        if (data && data.length > 0) {
          setTemplate(data[0]);

          // Inicializar respostas existentes ou vazias
          const initialAnswers: Record<string, BriefingAnswer> = {};

          if (existingData?.answers) {
            existingData.answers.forEach((a) => {
              initialAnswers[a.question_id] = a;
            });
          } else {
            // Inicializar respostas vazias para cada pergunta
            data[0].questions?.forEach((q: BriefingQuestion) => {
              initialAnswers[q.id] = {
                question_id: q.id,
                question_text: q.question,
                field_type: q.field_type,
                value: getDefaultValue(q.field_type),
              };
            });
          }

          setAnswers(initialAnswers);
        } else {
          setTemplate(null);
        }
      } catch (err) {
        console.error('[BriefingForm] Error:', err);
        setError('Não foi possível carregar o briefing');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [segment]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Retorna valor padrão baseado no tipo de campo
   */
  function getDefaultValue(
    fieldType: string
  ): string | string[] | number | boolean | null {
    switch (fieldType) {
      case 'checkbox':
        return false;
      case 'number':
        return null;
      case 'multiselect':
        return [];
      default:
        return '';
    }
  }

  /**
   * Atualiza resposta de uma pergunta
   */
  const handleAnswerChange = useCallback(
    (questionId: string, value: string | string[] | number | boolean | null) => {
      if (readOnly || !template) {
        return;
      }

      const question = template.questions?.find((q) => q.id === questionId);
      if (!question) {
        return;
      }

      const updatedAnswers = {
        ...answers,
        [questionId]: {
          question_id: questionId,
          question_text: question.question,
          field_type: question.field_type,
          value,
        },
      };

      setAnswers(updatedAnswers);

      // Notificar parent com dados completos
      const briefingData: BriefingData = {
        template_id: template.id,
        template_name: template.name,
        answered_at: new Date().toISOString(),
        answers: Object.values(updatedAnswers),
      };

      onChange(briefingData);
    },
    [answers, template, onChange, readOnly]
  );

  /**
   * Renderiza campo baseado no tipo
   */
  const renderField = useCallback(
    (question: BriefingQuestion) => {
      const answer = answers[question.id];
      const value = answer?.value;

      switch (question.field_type) {
        case 'textarea':
          return (
            <textarea
              value={(value as string) || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder={question.placeholder || ''}
              disabled={readOnly}
              rows={3}
              className="w-full rounded-xl border bg-white/[0.03] backdrop-blur-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] border-white/[0.08] focus:ring-violet-500/50 focus:border-violet-500/50 hover:border-white/[0.15] hover:bg-white/[0.05] py-3 px-4 text-sm disabled:opacity-50"
            />
          );

        case 'select':
          return (
            <Select
              value={(value as string) || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              disabled={readOnly}
              options={
                question.options?.map((opt) => ({ value: opt, label: opt })) || []
              }
              placeholder={question.placeholder || 'Selecione...'}
            />
          );

        case 'multiselect':
          return (
            <div className="space-y-2">
              {question.options?.map((option) => {
                const selected = Array.isArray(value) && value.includes(option);
                return (
                  <label
                    key={option}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selected
                        ? 'bg-violet-500/10 border-violet-500/30'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                    } ${readOnly ? 'cursor-default' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        if (readOnly) {
                          return;
                        }
                        const currentValues = Array.isArray(value) ? value : [];
                        const newValues = selected
                          ? currentValues.filter((v) => v !== option)
                          : [...currentValues, option];
                        handleAnswerChange(question.id, newValues);
                      }}
                      disabled={readOnly}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50"
                    />
                    <span className="text-sm text-white">{option}</span>
                  </label>
                );
              })}
            </div>
          );

        case 'checkbox':
          return (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => handleAnswerChange(question.id, e.target.checked)}
                disabled={readOnly}
                className="w-5 h-5 rounded border-white/[0.2] bg-white/[0.05] text-violet-500 focus:ring-violet-500/50 focus:ring-offset-0"
              />
              <span className="text-sm text-zinc-300">Sim</span>
            </label>
          );

        case 'number':
          return (
            <Input
              type="number"
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) =>
                handleAnswerChange(
                  question.id,
                  e.target.value ? Number(e.target.value) : null
                )
              }
              placeholder={question.placeholder || '0'}
              disabled={readOnly}
            />
          );

        case 'date':
          return (
            <Input
              type="date"
              value={(value as string) || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              disabled={readOnly}
            />
          );

        default: // text
          return (
            <Input
              value={(value as string) || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder={question.placeholder || ''}
              disabled={readOnly}
            />
          );
      }
    },
    [answers, handleAnswerChange, readOnly]
  );

  if (!segment) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500">
          Selecione um segmento primeiro para ver o briefing.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-10 w-full" />
            </div>
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

  if (!template || !template.questions || template.questions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">📝</div>
        <p className="text-zinc-400">
          Nenhum briefing disponível para este segmento.
        </p>
        <p className="text-sm text-zinc-600 mt-2">
          Você pode criar um briefing personalizado em Configurações {'>'} Templates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-white flex items-center gap-2">
            <span className="text-lg">📋</span>
            {template.name}
          </h4>
          {template.description && (
            <p className="text-xs text-zinc-500 mt-0.5">{template.description}</p>
          )}
        </div>
        <span className="text-xs text-zinc-600">
          {template.questions.length} perguntas
        </span>
      </div>

      {/* Questions */}
      <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2">
        {template.questions.map((question, index) => (
          <div key={question.id} className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              <span className="text-zinc-500 mr-2">{index + 1}.</span>
              {question.question}
              {question.is_required && (
                <span className="text-red-400 ml-1">*</span>
              )}
            </label>
            {renderField(question)}
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
        <p className="text-xs text-violet-300">
          <strong>Dica:</strong> As respostas do briefing ficam salvas no perfil do
          cliente e podem ser consultadas a qualquer momento.
        </p>
      </div>
    </div>
  );
}
