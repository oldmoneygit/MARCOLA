/**
 * @file ChatDashboard.tsx
 * @description Dashboard principal com chat centralizado e widgets informativos
 * @module components/dashboard
 */

'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ChatInterface } from '@/components/assistant';
import { TodayTasksWidget } from './TodayTasksWidget';
import { UpcomingEventsWidget } from './UpcomingEventsWidget';
import { PaymentsWidget } from './PaymentsWidget';
import { ClientsWidget } from './ClientsWidget';

/**
 * Dashboard com chat centralizado e widgets informativos
 */
export function ChatDashboard() {
  return (
    <DashboardLayout
      title="Marcola"
      subtitle="Seu assistente de tráfego pago"
      className="!p-0"
    >
      {/* Chat section */}
      <div className="border-b border-white/[0.06]">
        <ChatInterface />
      </div>

      {/* Widgets section */}
      <div className="p-4 sm:p-6 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-white">Visão Geral</h2>
            <p className="text-xs sm:text-sm text-[#6B8A8D]">Acompanhe suas métricas em tempo real</p>
          </div>

          {/* Widgets grid - responsivo e fluido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr">
            <TodayTasksWidget />
            <UpcomingEventsWidget maxEvents={4} />
            <PaymentsWidget />
            <ClientsWidget />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
