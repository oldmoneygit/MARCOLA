/**
 * @file ExecutionStats.tsx
 * @description Cards de estatísticas de execuções
 * @module components/execution-history
 */

'use client';

import { Activity, CheckCircle, Sparkles, TrendingUp } from 'lucide-react';
import type { ExecutionStats } from '@/types/execution-history';

interface ExecutionStatsProps {
  stats: ExecutionStats | null;
  loading?: boolean;
}

export function ExecutionStatsCards({ stats, loading }: ExecutionStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse"
          >
            <div className="h-8 w-16 bg-white/[0.05] rounded mb-2" />
            <div className="h-4 w-24 bg-white/[0.05] rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total de Execuções',
      value: stats?.total || 0,
      icon: Activity,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
    },
    {
      label: 'Tarefas Concluídas',
      value: stats?.byActionType?.task_completed || 0,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Otimizações',
      value: stats?.optimizationsCount || 0,
      icon: Sparkles,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Taxa de Sucesso',
      value: `${stats?.successRate || 0}%`,
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-sm text-zinc-400">{card.label}</div>
          </div>
        );
      })}
    </div>
  );
}
