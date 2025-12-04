/**
 * @file PaymentsTable.tsx
 * @description Tabela de pagamentos com integração WhatsApp
 * @module components/financial
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import { MessageCircle, Check, Trash2, CheckSquare, Square, Users } from 'lucide-react';

import { Button, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/utils';

import type { BadgeStatus } from '@/components/ui';
import type { PaymentStatus, PaymentWithClient } from '@/types';

interface PaymentsTableProps {
  payments: PaymentWithClient[];
  onMarkAsPaid: (id: string) => Promise<void>;
  onSendReminder: (payment: PaymentWithClient) => void;
  onDelete?: (id: string) => Promise<void>;
  selectedPayments?: Set<string>;
  onToggleSelection?: (paymentId: string) => void;
  onToggleSelectAll?: () => void;
  onBulkWhatsApp?: () => void;
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
  onDelete,
  selectedPayments = new Set(),
  onToggleSelection,
  onToggleSelectAll,
  onBulkWhatsApp,
}: PaymentsTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleMarkAsPaid = useCallback(async (id: string) => {
    setLoadingId(id);
    try {
      await onMarkAsPaid(id);
    } finally {
      setLoadingId(null);
    }
  }, [onMarkAsPaid]);

  const handleDelete = useCallback(async (id: string, clientName?: string) => {
    if (!onDelete) {
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o pagamento${clientName ? ` de ${clientName}` : ''}?\n\nEsta ação não pode ser desfeita.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  }, [onDelete]);

  // Pagamentos pendentes (não pagos)
  const pendingPayments = useMemo(
    () => payments.filter((p) => p.status !== 'paid'),
    [payments]
  );

  // Verifica se todos pendentes estão selecionados
  const allPendingSelected = useMemo(
    () => pendingPayments.length > 0 && pendingPayments.every((p) => selectedPayments.has(p.id)),
    [pendingPayments, selectedPayments]
  );

  // Verifica se há algum selecionado
  const hasSelection = selectedPayments.size > 0;

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
    <div className="space-y-4">
      {/* Bulk Action Bar */}
      {hasSelection && onBulkWhatsApp && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/20">
              <Users className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {selectedPayments.size} cliente{selectedPayments.size > 1 ? 's' : ''} selecionado{selectedPayments.size > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-zinc-400">Enviar lembretes em lote via WhatsApp</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSelectAll}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Limpar seleção
            </button>
            <button
              onClick={onBulkWhatsApp}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Enviar para {selectedPayments.size}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.08]">
              {/* Checkbox column */}
              {onToggleSelectAll && (
                <th className="w-10 py-3 px-2">
                  <button
                    onClick={onToggleSelectAll}
                    className="flex items-center justify-center w-5 h-5 rounded border border-white/20 hover:border-green-500 transition-colors"
                    title={allPendingSelected ? 'Desmarcar todos' : 'Selecionar todos pendentes'}
                  >
                    {allPendingSelected ? (
                      <CheckSquare className="w-4 h-4 text-green-400" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-500" />
                    )}
                  </button>
                </th>
              )}
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
              const isSelected = selectedPayments.has(payment.id);
              const canSelect = payment.status !== 'paid';

              return (
                <tr
                  key={payment.id}
                  className={cn(
                    'transition-colors',
                    isSelected ? 'bg-green-500/5' : 'hover:bg-white/[0.02]'
                  )}
                >
                  {/* Checkbox */}
                  {onToggleSelection && (
                    <td className="py-4 px-2">
                      {canSelect ? (
                        <button
                          onClick={() => onToggleSelection(payment.id)}
                          className={cn(
                            'flex items-center justify-center w-5 h-5 rounded border transition-colors',
                            isSelected
                              ? 'bg-green-500 border-green-500'
                              : 'border-white/20 hover:border-green-500'
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </button>
                      ) : (
                        <div className="w-5 h-5" />
                      )}
                    </td>
                  )}
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
                          {/* WhatsApp Button */}
                          <button
                            onClick={() => onSendReminder(payment)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm hover:bg-green-500/20 hover:border-green-500/40 transition-colors"
                            title="Enviar lembrete via WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>
                          {/* Mark as Paid Button */}
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsPaid(payment.id)}
                            loading={loadingId === payment.id}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Pago
                          </Button>
                        </>
                      )}
                      {payment.status === 'paid' && payment.paid_date && (
                        <span className="text-xs text-emerald-400">
                          Pago em {formatDate(payment.paid_date)}
                        </span>
                      )}
                      {onDelete && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(payment.id, payment.client?.name)}
                          loading={deletingId === payment.id}
                          className="ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
