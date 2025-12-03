/**
 * @file FinancialPageContent.tsx
 * @description Conteúdo da página financeira
 * @module components/financial
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, GlassCard, MetricCard, Skeleton } from '@/components/ui';
import { useFinancial } from '@/hooks';

import { PaymentFormModal } from './PaymentFormModal';
import { PaymentsTable } from './PaymentsTable';
import { ReminderModal } from './ReminderModal';

import type { PaymentFormData } from './PaymentFormModal';
import type { PaymentWithClient } from '@/types';

interface ClientOption {
  id: string;
  name: string;
  monthly_value: number;
  due_day: number;
}

/**
 * Ícones para os cards de métricas
 */
const MetricIcons = {
  revenue: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  received: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pending: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  overdue: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

/**
 * Formata valor monetário
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Gera opções de mês
 */
function generateMonthOptions(): { value: string; label: string }[] {
  const options = [];
  const now = new Date();

  for (let i = -3; i <= 3; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }

  return options;
}

/**
 * Conteúdo da página financeira
 */
export function FinancialPageContent() {
  const {
    payments,
    overview,
    loading,
    selectedMonth,
    setSelectedMonth,
    markAsPaid,
    createPayment,
    deletePayment,
    generateReminder,
    generateMonthlyPayments,
  } = useFinancial();

  const [reminderPayment, setReminderPayment] = useState<PaymentWithClient | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const monthOptions = generateMonthOptions();

  // Carrega clientes ativos
  useEffect(() => {
    async function loadClients() {
      try {
        const response = await fetch('/api/clients?status=active');
        if (response.ok) {
          const data = await response.json();
          setClients(data.map((c: { id: string; name: string; monthly_value: number; due_day: number }) => ({
            id: c.id,
            name: c.name,
            monthly_value: c.monthly_value,
            due_day: c.due_day,
          })));
        }
      } catch (err) {
        console.error('[FinancialPageContent] Error loading clients:', err);
      }
    }
    loadClients();
  }, []);

  /**
   * Handler para marcar como pago
   */
  const handleMarkAsPaid = useCallback(async (id: string) => {
    await markAsPaid(id);
  }, [markAsPaid]);

  /**
   * Handler para abrir modal de lembrete
   */
  const handleOpenReminder = useCallback((payment: PaymentWithClient) => {
    setReminderPayment(payment);
    setIsReminderModalOpen(true);
  }, []);

  /**
   * Handler para fechar modal de lembrete
   */
  const handleCloseReminder = useCallback(() => {
    setReminderPayment(null);
    setIsReminderModalOpen(false);
  }, []);

  /**
   * Handler para criar pagamento
   */
  const handleCreatePayment = useCallback(async (data: PaymentFormData) => {
    setIsCreating(true);
    try {
      await createPayment(data);
      setIsPaymentModalOpen(false);
      setSuccessMessage('Pagamento criado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setIsCreating(false);
    }
  }, [createPayment]);

  /**
   * Handler para excluir pagamento
   */
  const handleDeletePayment = useCallback(async (id: string) => {
    try {
      const success = await deletePayment(id);
      if (success) {
        setSuccessMessage('Pagamento excluído com sucesso!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('[FinancialPageContent] Error deleting payment:', err);
    }
  }, [deletePayment]);

  /**
   * Handler para gerar cobranças do mês
   */
  const handleGeneratePayments = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await generateMonthlyPayments(selectedMonth);
      if (result) {
        if (result.created > 0) {
          setSuccessMessage(`${result.created} cobranças geradas com sucesso!`);
        } else {
          setSuccessMessage(result.message);
        }
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [generateMonthlyPayments, selectedMonth]);

  // Loading state
  if (loading && !overview) {
    return (
      <DashboardLayout
        title="Financeiro"
        subtitle="Controle de cobranças e pagamentos"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton.Card key={i} />
            ))}
          </div>
          <GlassCard>
            <Skeleton.Table rows={5} columns={5} />
          </GlassCard>
        </div>
      </DashboardLayout>
    );
  }

  // Calcula variação (mock para demonstração)
  const receivedPercent = overview && overview.totalRevenue > 0
    ? (overview.received / overview.totalRevenue) * 100
    : 0;

  return (
    <DashboardLayout
      title="Financeiro"
      subtitle="Controle de cobranças e pagamentos"
      headerActions={
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 bg-zinc-900/80 border border-zinc-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors cursor-pointer hover:border-zinc-600/70"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-zinc-900 text-white">
                {option.label}
              </option>
            ))}
          </select>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleGeneratePayments}
            loading={isGenerating}
            disabled={clients.length === 0}
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Gerar Cobranças
          </Button>

          <Button
            size="sm"
            onClick={() => setIsPaymentModalOpen(true)}
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Pagamento
          </Button>
        </div>
      }
    >
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Receita do Mês"
          value={formatCurrency(overview?.totalRevenue || 0)}
          icon={MetricIcons.revenue}
          trendLabel={`${overview?.clientsPaid || 0} + ${overview?.clientsPending || 0} + ${overview?.clientsOverdue || 0} clientes`}
          className="bg-gradient-to-br from-violet-500/10 via-purple-500/6 to-indigo-500/10 border-violet-500/20"
        />

        <MetricCard
          title="Recebido"
          value={formatCurrency(overview?.received || 0)}
          icon={MetricIcons.received}
          change={receivedPercent}
          trendLabel={`${overview?.clientsPaid || 0} cliente${(overview?.clientsPaid || 0) !== 1 ? 's' : ''}`}
          className="bg-gradient-to-br from-emerald-500/10 via-green-500/6 to-teal-500/10 border-emerald-500/20"
        />

        <MetricCard
          title="Pendente"
          value={formatCurrency(overview?.pending || 0)}
          icon={MetricIcons.pending}
          trendLabel={`${overview?.clientsPending || 0} cobrança${(overview?.clientsPending || 0) !== 1 ? 's' : ''}`}
          className="bg-gradient-to-br from-amber-500/10 via-orange-500/6 to-yellow-500/10 border-amber-500/20"
        />

        <MetricCard
          title="Atrasado"
          value={formatCurrency(overview?.overdue || 0)}
          icon={MetricIcons.overdue}
          change={(overview?.overdue || 0) > 0 ? 100 : 0}
          positiveIsGood={false}
          trendLabel={`${overview?.clientsOverdue || 0} cobrança${(overview?.clientsOverdue || 0) !== 1 ? 's' : ''}`}
          className="bg-gradient-to-br from-red-500/10 via-rose-500/6 to-pink-500/10 border-red-500/20"
        />
      </div>

      {/* Tabela de Pagamentos */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            Pagamentos
          </h2>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {overview?.clientsPaid || 0} pagos
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {overview?.clientsPending || 0} pendentes
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {overview?.clientsOverdue || 0} atrasados
            </span>
          </div>
        </div>

        <PaymentsTable
          payments={payments}
          onMarkAsPaid={handleMarkAsPaid}
          onSendReminder={handleOpenReminder}
          onDelete={handleDeletePayment}
        />
      </GlassCard>

      {/* Modal de Lembrete */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={handleCloseReminder}
        payment={reminderPayment}
        onGenerateMessage={generateReminder}
      />

      {/* Modal de Novo Pagamento */}
      <PaymentFormModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handleCreatePayment}
        clients={clients}
        loading={isCreating}
      />

      {/* Toast de sucesso */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-emerald-300">{successMessage}</span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
