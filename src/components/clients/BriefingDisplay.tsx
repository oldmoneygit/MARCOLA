/**
 * @file BriefingDisplay.tsx
 * @description Componente para exibição visual do briefing do cliente
 * @module components/clients
 */

'use client';

import { Icon } from '@/components/ui';

import type { BriefingData, BriefingAnswer } from '@/types';

interface BriefingDisplayProps {
  /** Dados do briefing */
  briefingData: BriefingData | null;
}

/**
 * Formata o valor da resposta para exibição
 */
function formatAnswerValue(answer: BriefingAnswer): string {
  const { value, field_type } = answer;

  if (value === null || value === undefined || value === '') {
    return '-';
  }

  switch (field_type) {
    case 'checkbox':
      return value ? 'Sim' : 'Não';
    case 'multiselect':
      return Array.isArray(value) ? value.join(', ') : String(value);
    case 'number':
      return String(value);
    default:
      return String(value);
  }
}

/**
 * Retorna o nome do ícone baseado no tipo de campo
 */
function getFieldIcon(fieldType: string): string {
  switch (fieldType) {
    case 'text':
      return 'filetext';
    case 'textarea':
      return 'filetext';
    case 'select':
      return 'filetext';
    case 'multiselect':
      return 'checksquare';
    case 'checkbox':
      return 'check';
    case 'number':
      return 'barchart3';
    case 'date':
      return 'calendar';
    default:
      return 'pin';
  }
}

/**
 * Componente para exibição visual do briefing do cliente
 */
export function BriefingDisplay({ briefingData }: BriefingDisplayProps) {
  if (!briefingData || !briefingData.answers || briefingData.answers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-3">
          <Icon name="filetext" size="xl" className="text-zinc-500" />
        </div>
        <p className="text-zinc-400">Nenhum briefing preenchido</p>
        <p className="text-sm text-zinc-600 mt-1">
          O briefing pode ser preenchido ao editar o cliente
        </p>
      </div>
    );
  }

  // Filtra apenas respostas com valor preenchido
  const filledAnswers = briefingData.answers.filter((answer) => {
    const { value } = answer;
    if (value === null || value === undefined || value === '') {
      return false;
    }
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    return true;
  });

  if (filledAnswers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-3">
          <Icon name="filetext" size="xl" className="text-zinc-500" />
        </div>
        <p className="text-zinc-400">Briefing não preenchido</p>
        <p className="text-sm text-zinc-600 mt-1">
          As perguntas ainda não foram respondidas
        </p>
      </div>
    );
  }

  const answeredAt = briefingData.answered_at
    ? new Date(briefingData.answered_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="filetext" size="sm" className="text-violet-400" />
          <h3 className="text-sm font-medium text-white">{briefingData.template_name}</h3>
        </div>
        {answeredAt && (
          <span className="text-xs text-zinc-500">Preenchido em {answeredAt}</span>
        )}
      </div>

      {/* Respostas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filledAnswers.map((answer, index) => {
          const formattedValue = formatAnswerValue(answer);
          const icon = getFieldIcon(answer.field_type);
          const isLongText = answer.field_type === 'textarea' || formattedValue.length > 100;

          return (
            <div
              key={answer.question_id || index}
              className={`p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors ${
                isLongText ? 'md:col-span-2' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                <Icon name={icon} size="sm" className="text-violet-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 mb-1">{answer.question_text}</p>
                  <p className="text-sm text-white break-words">
                    {answer.field_type === 'checkbox' ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${
                          answer.value
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {answer.value ? '✓ Sim' : '✗ Não'}
                      </span>
                    ) : answer.field_type === 'multiselect' && Array.isArray(answer.value) ? (
                      <span className="flex flex-wrap gap-1.5">
                        {answer.value.map((item, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-violet-500/10 text-violet-300 border border-violet-500/20"
                          >
                            {item}
                          </span>
                        ))}
                      </span>
                    ) : (
                      formattedValue
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
        <span className="text-xs text-zinc-500">
          {filledAnswers.length} de {briefingData.answers.length} perguntas respondidas
        </span>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-24 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
              style={{
                width: `${(filledAnswers.length / briefingData.answers.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs text-zinc-500">
            {Math.round((filledAnswers.length / briefingData.answers.length) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
