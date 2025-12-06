/**
 * @file PaymentsWidget.tsx
 * @description Widget de pagamentos pendentes/atrasados para o dashboard
 * @module components/dashboard
 */

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, DollarSign, TrendingUp } from 'lucide-react';

import { GlassCard } from '@/components/ui';

interface PaymentOverview {
  pending: number;
  overdue: number;
  totalPending: number;
  totalOverdue: number;
  payments: Array<{
    id: string;
    client_id: string;
    amount: number;
    due_date: string;
    status: string;
    client?: {
      id: string;
      name: string;
    };
  }>;
}

/**
 * Formata valor em reais
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Widget de pagamentos pendentes/atrasados
 */
export function PaymentsWidget() {
  const [data, setData] = useState<PaymentOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    try {
      const response = await fetch('/api/payments/overview');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (err) {
      console.error('[PaymentsWidget] Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  if (loading) {
    return (
      <GlassCard className="h-full flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-base font-semibold text-white whitespace-nowrap">Pagamentos</h2>
        </div>
        <div className="space-y-3 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      </GlassCard>
    );
  }

  const overdueCount = data?.overdue || 0;
  const pendingCount = data?.pending || 0;
  const recentPayments = data?.payments?.slice(0, 4) || [];

  return (
    <GlassCard className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-base font-semibold text-white whitespace-nowrap">Pagamentos</h2>
          {overdueCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#E57373]/10 text-[#E57373] flex items-center gap-1 whitespace-nowrap flex-shrink-0">
              <AlertCircle className="w-3 h-3" />
              {overdueCount}
            </span>
          )}
        </div>
        <Link
          href="/financial"
          className="text-xs text-[#BDCDCF] hover:text-white transition-colors whitespace-nowrap flex-shrink-0"
        >
          Ver todos
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-[#E3B8B8]" />
            <span className="text-xs text-[#8FAAAD]">Pendente</span>
          </div>
          <p className="text-lg font-semibold text-white">
            {formatCurrency(data?.totalPending || 0)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-[#7ED4A6]" />
            <span className="text-xs text-[#8FAAAD]">A receber</span>
          </div>
          <p className="text-lg font-semibold text-white">
            {pendingCount} cliente{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Payment list */}
      {recentPayments.length === 0 ? (
        <div className="text-center py-6 text-[#8FAAAD]">
          <DollarSign className="w-8 h-8 mx-auto text-[#7ED4A6]" />
          <p className="mt-2 text-sm">Nenhum pagamento pendente</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentPayments.map((payment) => {
            const dueDate = parseISO(payment.due_date);
            const isOverdue = isPast(dueDate) && payment.status === 'pending';
            const daysOverdue = isOverdue ? differenceInDays(new Date(), dueDate) : 0;

            return (
              <div
                key={payment.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isOverdue
                    ? 'bg-[#E57373]/5 border border-[#E57373]/20'
                    : 'bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                {/* Avatar/Initial */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#BDCDCF]/20 to-[#8FAAAD]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-[#BDCDCF]">
                    {payment.client?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {payment.client?.name || 'Cliente'}
                  </p>
                  <p className="text-xs text-[#6B8A8D]">
                    {isOverdue ? (
                      <span className="text-[#E57373]">
                        {daysOverdue} dia{daysOverdue > 1 ? 's' : ''} atrasado
                      </span>
                    ) : (
                      format(dueDate, "d 'de' MMM", { locale: ptBR })
                    )}
                  </p>
                </div>

                {/* Amount */}
                <span className={`text-sm font-semibold ${isOverdue ? 'text-[#E57373]' : 'text-white'}`}>
                  {formatCurrency(payment.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#6B8A8D]">
        <span>Vencimentos do mês</span>
        <span>{pendingCount + overdueCount} pendente{pendingCount + overdueCount !== 1 ? 's' : ''}</span>
      </div>
    </GlassCard>
  );
}
