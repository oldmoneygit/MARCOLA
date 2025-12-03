/**
 * @file ReportCard.tsx
 * @description Card para exibição de relatório
 * @module components/reports
 */

'use client';

import Link from 'next/link';

import { Button, GlassCard } from '@/components/ui';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';

import type { Report } from '@/types';

interface ReportCardProps {
  report: Report & { clients?: { id: string; name: string } };
  onDelete?: (report: Report) => void;
}

/**
 * Formata data para exibição
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

/**
 * Card com resumo do relatório
 */
export function ReportCard({ report, onDelete }: ReportCardProps) {
  const clientName = report.clients?.name || 'Cliente';
  const periodLabel = `${formatDate(report.period_start)} - ${formatDate(report.period_end)}`;

  // Calcula métricas
  const ctr = report.total_impressions > 0
    ? (report.total_clicks / report.total_impressions) * 100
    : 0;
  const cpa = report.total_conversions > 0
    ? report.total_spend / report.total_conversions
    : 0;

  return (
    <GlassCard className="group" hover>
      <div className="flex items-start justify-between mb-4">
        {/* Cliente e período */}
        <div>
          <Link
            href={`/reports/${report.id}`}
            className="text-white font-medium hover:text-violet-400 transition-colors"
          >
            {clientName}
          </Link>
          <p className="text-sm text-zinc-500">{periodLabel}</p>
        </div>

        {/* Ações */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/reports/${report.id}`}>
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Button>
          </Link>
          {onDelete && (
            <Button variant="danger" size="sm" onClick={() => onDelete(report)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Métricas resumidas */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-white/[0.02]">
          <p className="text-xs text-zinc-500 mb-1">Investimento</p>
          <p className="text-lg font-semibold text-white">{formatCurrency(report.total_spend)}</p>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.02]">
          <p className="text-xs text-zinc-500 mb-1">Conversões</p>
          <p className="text-lg font-semibold text-white">{report.total_conversions}</p>
        </div>
      </div>

      {/* Métricas secundárias */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-zinc-500">CTR:</span>
          <span className={`ml-1 ${ctr >= 2 ? 'text-emerald-400' : ctr < 0.5 ? 'text-red-400' : 'text-zinc-300'}`}>
            {ctr.toFixed(2)}%
          </span>
        </div>
        <div>
          <span className="text-zinc-500">CPA:</span>
          <span className={`ml-1 ${cpa <= 50 ? 'text-emerald-400' : cpa > 150 ? 'text-red-400' : 'text-zinc-300'}`}>
            {formatCurrency(cpa)}
          </span>
        </div>
        <div>
          <span className="text-zinc-500">Cliques:</span>
          <span className="ml-1 text-zinc-300">{formatCompactNumber(report.total_clicks)}</span>
        </div>
      </div>
    </GlassCard>
  );
}
