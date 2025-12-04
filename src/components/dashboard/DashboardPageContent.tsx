/**
 * @file DashboardPageContent.tsx
 * @description Conteúdo da página principal do Dashboard
 * @module components/dashboard
 */

'use client';

import Link from 'next/link';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard, MetricCard, Skeleton } from '@/components/ui';
import { formatCurrency, useDashboard } from '@/hooks';

import { TodayTasksWidget } from './TodayTasksWidget';
import { UpcomingEventsWidget } from './UpcomingEventsWidget';

/**
 * Ícones para os cards de métricas
 */
const MetricIcons = {
  investment: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  clients: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
  cpa: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  alerts: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
};

/**
 * Configuração de severidade para sugestões
 */
const SEVERITY_CONFIG = {
  urgent: {
    bgColor: 'bg-red-500/5',
    borderColor: 'border-red-500',
    iconBgColor: 'bg-red-500/10',
    iconColor: 'text-red-400',
    labelBgColor: 'bg-red-500/10',
    labelColor: 'text-red-400',
    label: 'URGENTE',
  },
  warning: {
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-amber-500',
    iconBgColor: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    labelBgColor: 'bg-amber-500/10',
    labelColor: 'text-amber-400',
    label: 'ATENÇÃO',
  },
  info: {
    bgColor: 'bg-blue-500/5',
    borderColor: 'border-blue-500',
    iconBgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    labelBgColor: 'bg-blue-500/10',
    labelColor: 'text-blue-400',
    label: 'SUGESTÃO',
  },
};

/**
 * Ícone de severidade
 */
function SeverityIcon({ severity }: { severity: 'urgent' | 'warning' | 'info' }) {
  const config = SEVERITY_CONFIG[severity];

  if (severity === 'urgent') {
    return (
      <svg className={`w-5 h-5 ${config.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }

  if (severity === 'warning') {
    return (
      <svg className={`w-5 h-5 ${config.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  }

  return (
    <svg className={`w-5 h-5 ${config.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

/**
 * Conteúdo da página do Dashboard
 */
export function DashboardPageContent() {
  const { data, loading, error } = useDashboard();

  // Loading state
  if (loading) {
    return (
      <DashboardLayout
        title="Dashboard"
        subtitle="Visão geral do desempenho das campanhas"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton.Card key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GlassCard>
              <Skeleton.Table rows={3} columns={2} />
            </GlassCard>
          </div>
          <div>
            <Skeleton.Card />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout
        title="Dashboard"
        subtitle="Visão geral do desempenho das campanhas"
      >
        <GlassCard>
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-zinc-400">{error}</p>
          </div>
        </GlassCard>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Visão geral do desempenho das campanhas"
    >
      {/* Métricas principais - com cores distintas e borda 3D */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Investimento Total"
          value={formatCurrency(data?.totalInvestment || 0)}
          icon={MetricIcons.investment}
          change={data?.investmentChange || 0}
          trendLabel="vs. mês anterior"
          accent="emerald"
        />

        <MetricCard
          title="Clientes Ativos"
          value={String(data?.activeClients || 0)}
          icon={MetricIcons.clients}
          change={data?.clientsChange || 0}
          trendLabel="vs. mês anterior"
          accent="blue"
        />

        <MetricCard
          title="CPA Médio"
          value={formatCurrency(data?.averageCPA || 0)}
          icon={MetricIcons.cpa}
          change={data?.cpaChange || 0}
          positiveIsGood={false}
          trendLabel="vs. mês anterior"
          accent="violet"
        />

        <MetricCard
          title="Alertas Pendentes"
          value={String(data?.pendingAlerts || 0)}
          icon={MetricIcons.alerts}
          change={data?.alertsChange || 0}
          positiveIsGood={false}
          trendLabel="pendentes"
          accent="amber"
        />
      </div>

      {/* Seção Principal - Tarefas e Calendário (mais importante para rotina) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Tarefas de Hoje - Prioridade máxima */}
        <TodayTasksWidget />

        {/* Próximos Conteúdos */}
        <UpcomingEventsWidget />
      </div>

      {/* Seção Secundária - Alertas e Clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas e Sugestões */}
        <div className="lg:col-span-2">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                Alertas & Sugestões
              </h2>
              <Link
                href="/analysis"
                className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                Ver todas
              </Link>
            </div>

            {(!data?.recentSuggestions || data.recentSuggestions.length === 0) ? (
              <div className="text-center py-12 text-zinc-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Nenhum alerta pendente</p>
                <p className="text-sm text-zinc-500 mt-1">Tudo sob controle!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recentSuggestions.map((suggestion) => {
                  const config = SEVERITY_CONFIG[suggestion.severity];
                  return (
                    <div
                      key={suggestion.id}
                      className={`flex items-start gap-4 p-4 rounded-xl ${config.bgColor} border-l-2 ${config.borderColor}`}
                    >
                      <div className={`p-2 rounded-lg ${config.iconBgColor}`}>
                        <SeverityIcon severity={suggestion.severity} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">{suggestion.title}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.labelBgColor} ${config.labelColor}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400">
                          {suggestion.clientName} - {suggestion.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Clientes que precisam de atenção */}
        <div>
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                Precisam de Atenção
              </h2>
            </div>

            {(!data?.clientsNeedingAttention || data.clientsNeedingAttention.length === 0) ? (
              <div className="text-center py-8 text-zinc-400">
                <svg className="w-10 h-10 mx-auto mb-3 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">Todos os clientes em dia!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.clientsNeedingAttention.map((client) => (
                  <Link
                    key={client.id}
                    href={`/clients?id=${client.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        client.severity === 'danger' ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {client.name}
                      </div>
                      <div className="text-xs text-zinc-500">{client.issue}</div>
                    </div>
                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}

            <Link
              href="/clients"
              className="block w-full mt-4 py-2 text-sm text-center text-violet-400 hover:text-violet-300 transition-colors"
            >
              Ver todos os clientes
            </Link>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
