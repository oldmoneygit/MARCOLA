/**
 * @file PaymentsTable.tsx
 * @description Tabela de pagamentos
 * @module components/financial
 */

'use client';

import { useCallback, useState } from 'react';

import { Button, StatusBadge } from '@/components/ui';

import type { BadgeStatus } from '@/components/ui';
import type { PaymentStatus, PaymentWithClient } from '@/types';

interface PaymentsTableProps {
  payments: PaymentWithClient[];
  onMarkAsPaid: (id: string) => Promise<void>;
  onSendReminder: (payment: PaymentWithClient) => void;
}

/**
 * Configuração de status
 */
const STATUS_CONFIG: Record<PaymentStatus, { label: string; badgeStatus: BadgeStatus }> = {
  paid: { label: 'Pago', badgeStatus: 'success' },
  pending: { label: 'Pendente', badgeStatus: 'warning' },
  overdue: { label: 'Atrasado', badgeStatus: 'danger' },
  cancelled: { label: 'Cancelado', badgeStatus: 'inactive' },
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
 * Formata data
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
}

/**
 * Calcula dias de atraso
 */
function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/**
 * Componente de tabela de pagamentos
 */
export function PaymentsTable({
  payments,
  onMarkAsPaid,
  onSendReminder,
}: PaymentsTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleMarkAsPaid = useCallback(async (id: string) => {
    setLoadingId(id);
    try {
      await onMarkAsPaid(id);
    } finally {
      setLoadingId(null);
    }
  }, [onMarkAsPaid]);

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-400">
        <svg className="w-12 h-12 mx-auto mb-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>Nenhum pagamento encontrado neste mês</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.08]">
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Cliente
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Valor
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Vencimento
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Status
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {payments.map((payment) => {
            const statusConfig = STATUS_CONFIG[payment.status];
            const daysOverdue = payment.status === 'overdue' ? getDaysOverdue(payment.due_date) : 0;

            return (
              <tr key={payment.id} className="hover:bg-white/[0.02]">
                <td className="py-4 px-4">
                  <div>
                    <span className="text-sm text-white font-medium">
                      {payment.client?.name || 'Cliente Desconhecido'}
                    </span>
                    {payment.client?.segment && (
                      <p className="text-xs text-zinc-500">{payment.client.segment}</p>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-white font-medium">
                    {formatCurrency(payment.amount)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`text-sm ${payment.status === 'overdue' ? 'text-red-400' : 'text-zinc-400'}`}>
                    {formatDate(payment.due_date)}
                    {daysOverdue > 0 && (
                      <span className="block text-xs text-red-400">
                        {daysOverdue} dia{daysOverdue > 1 ? 's' : ''} de atraso
                      </span>
                    )}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <StatusBadge status={statusConfig.badgeStatus} label={statusConfig.label} />
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    {payment.status !== 'paid' && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onSendReminder(payment)}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Lembrete
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsPaid(payment.id)}
                          loading={loadingId === payment.id}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Pago
                        </Button>
                      </>
                    )}
                    {payment.status === 'paid' && payment.paid_date && (
                      <span className="text-xs text-emerald-400">
                        Pago em {formatDate(payment.paid_date)}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
