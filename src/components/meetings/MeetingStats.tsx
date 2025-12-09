/**
 * @file MeetingStats.tsx
 * @description Componente de estatísticas de reuniões
 * @module components/meetings
 */

'use client';

import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  CalendarDays,
  CalendarCheck,
} from 'lucide-react';

import type { MeetingStats as MeetingStatsType } from '@/types/meetings';

interface MeetingStatsProps {
  stats: MeetingStatsType | null;
  loading?: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  loading?: boolean;
}

function StatCard({ icon, label, value, color, bgColor, loading }: StatCardProps) {
  return (
    <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:bg-white/[0.06] transition-all">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${bgColor} border border-white/10`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          {loading ? (
            <div className="h-7 w-12 bg-white/[0.05] rounded animate-pulse mt-1" />
          ) : (
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function MeetingStats({ stats, loading = false }: MeetingStatsProps) {
  const statCards = [
    {
      icon: <Clock className="w-5 h-5 text-cyan-400" />,
      label: 'Hoje',
      value: stats?.upcomingToday ?? 0,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
    },
    {
      icon: <CalendarDays className="w-5 h-5 text-blue-400" />,
      label: 'Esta Semana',
      value: stats?.thisWeek ?? 0,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      icon: <Calendar className="w-5 h-5 text-violet-400" />,
      label: 'Este Mês',
      value: stats?.thisMonth ?? 0,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/20',
    },
    {
      icon: <CalendarCheck className="w-5 h-5 text-amber-400" />,
      label: 'Agendadas',
      value: stats?.scheduled ?? 0,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      label: 'Confirmadas',
      value: stats?.confirmed ?? 0,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
    },
    {
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      label: 'Canceladas',
      value: stats?.cancelled ?? 0,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {statCards.map((card) => (
        <StatCard key={card.label} {...card} loading={loading} />
      ))}
    </div>
  );
}
