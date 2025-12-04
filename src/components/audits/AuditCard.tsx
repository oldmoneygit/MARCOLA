/**
 * @file AuditCard.tsx
 * @description Card de resumo de auditoria
 * @module components/audits
 */

'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { GlassCard, Icon } from '@/components/ui';

import type { Audit } from '@/types';
import { AUDIT_TYPE_CONFIG, AUDIT_STATUS_CONFIG } from '@/types';

interface AuditCardProps {
  /** Dados da auditoria */
  audit: Audit;
  /** Callback ao clicar */
  onClick?: (audit: Audit) => void;
  /** Classes adicionais */
  className?: string;
}

/**
 * Card para exibição resumida de uma auditoria
 */
function AuditCard({ audit, onClick, className }: AuditCardProps) {
  const typeConfig = AUDIT_TYPE_CONFIG[audit.type];
  const statusConfig = AUDIT_STATUS_CONFIG[audit.status];

  return (
    <GlassCard
      className={cn(
        'p-4 cursor-pointer hover:border-white/20 transition-all',
        className
      )}
      onClick={() => onClick?.(audit)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              typeConfig.bgColor
            )}
          >
            <Icon name={typeConfig.icon} className={typeConfig.textColor} />
          </div>

          {/* Info */}
          <div>
            <h3 className="font-medium text-white">{audit.title}</h3>
            <p className="text-sm text-zinc-400">{typeConfig.label}</p>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={cn(
            'px-2.5 py-1 rounded-lg text-xs font-medium',
            statusConfig.bgColor,
            statusConfig.textColor
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Score (if completed) */}
      {audit.overall_score !== null && (
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-400">Score Geral</span>
              <span className="text-sm font-bold text-white">
                {audit.overall_score}/10
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  audit.overall_score >= 8
                    ? 'bg-emerald-500'
                    : audit.overall_score >= 6
                    ? 'bg-blue-500'
                    : audit.overall_score >= 4
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                )}
                style={{ width: `${(audit.overall_score / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
        {audit.critical_issues.length > 0 && (
          <span className="flex items-center gap-1 text-red-400">
            <Icon name="alert-circle" size="xs" />
            {audit.critical_issues.length} crítico(s)
          </span>
        )}
        {audit.quick_wins.length > 0 && (
          <span className="flex items-center gap-1 text-emerald-400">
            <Icon name="zap" size="xs" />
            {audit.quick_wins.length} quick win(s)
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
        {audit.client && (
          <span className="text-sm text-zinc-400">{audit.client.name}</span>
        )}
        <span className="text-xs text-zinc-500">
          {format(new Date(audit.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
        </span>
      </div>
    </GlassCard>
  );
}

export { AuditCard };
export type { AuditCardProps };
