/**
 * @file useFinancial.ts
 * @description Hook para gerenciamento do módulo financeiro
 * @module hooks
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import type {
  FinancialOverview,
  PaymentWithClient,
  PaymentStatus,
} from '@/types';

interface GeneratePaymentsResult {
  created: number;
  skipped: number;
  message: string;
}

interface UseFinancialReturn {
  payments: PaymentWithClient[];
  overview: FinancialOverview | null;
  loading: boolean;
  error: string | null;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  loadPayments: () => Promise<void>;
  loadOverview: () => Promise<void>;
  createPayment: (data: CreatePaymentData) => Promise<PaymentWithClient | null>;
  markAsPaid: (id: string, paidDate?: string, notes?: string) => Promise<boolean>;
  updatePayment: (id: string, data: UpdatePaymentData) => Promise<boolean>;
  deletePayment: (id: string) => Promise<boolean>;
  generateReminder: (paymentId: string, templateType: 'pre_due' | 'overdue' | 'reminder') => string;
  generateMonthlyPayments: (month: string) => Promise<GeneratePaymentsResult | null>;
}

interface CreatePaymentData {
  client_id: string;
  amount: number;
  due_date: string;
  description?: string;
  payment_method?: string;
  notes?: string;
}

interface UpdatePaymentData {
  amount?: number;
  due_date?: string;
  description?: string;
  payment_method?: string;
  notes?: string;
  status?: PaymentStatus;
}

/**
 * Templates de mensagem para WhatsApp
 */
const MESSAGE_TEMPLATES = {
  pre_due: `Olá {clientName}! 👋

Passando para lembrar que a mensalidade de {month} vence no dia {dueDate}.

💰 Valor: R$ {amount}

Se já realizou o pagamento, pode desconsiderar esta mensagem!

Qualquer dúvida, estou à disposição. 😊`,

  overdue: `Olá {clientName}! 👋

Notei que o pagamento referente a {month} ainda não foi identificado.

📅 Vencimento: {dueDate}
💰 Valor: R$ {amount}
⏰ Dias em atraso: {daysOverdue}

Por favor, regularize o quanto antes para evitar a suspensão dos serviços.

Qualquer problema, me avise! 🙏`,

  reminder: `Oi {clientName}! Tudo bem? 😊

Só passando para lembrar do pagamento de {month}.

💰 Valor: R$ {amount}
📅 Vencimento: {dueDate}

Agradeço a atenção! 🙏`,
};

/**
 * Hook para gerenciamento financeiro
 */
export function useFinancial(): UseFinancialReturn {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [payments, setPayments] = useState<PaymentWithClient[]>([]);
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  /**
   * Carrega pagamentos
   */
  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payments?month=${selectedMonth}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao carregar pagamentos');
      }

      const data = await response.json();
      setPayments(data);
    } catch (err) {
      console.error('[useFinancial] Error loading payments:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  /**
   * Carrega overview financeiro
   */
  const loadOverview = useCallback(async () => {
    try {
      const response = await fetch(`/api/payments/overview?month=${selectedMonth}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao carregar overview');
      }

      const data = await response.json();
      setOverview(data);
    } catch (err) {
      console.error('[useFinancial] Error loading overview:', err);
    }
  }, [selectedMonth]);

  /**
   * Cria novo pagamento
   */
  const createPayment = useCallback(async (data: CreatePaymentData): Promise<PaymentWithClient | null> => {
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erro ao criar pagamento');
      }

      const payment = await response.json();
      await loadPayments();
      await loadOverview();
      return payment;
    } catch (err) {
      console.error('[useFinancial] Error creating payment:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar pagamento');
      return null;
    }
  }, [loadPayments, loadOverview]);

  /**
   * Marca pagamento como pago
   */
  const markAsPaid = useCallback(async (
    id: string,
    paidDate?: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid_date: paidDate, notes }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao marcar como pago');
      }

      await loadPayments();
      await loadOverview();
      return true;
    } catch (err) {
      console.error('[useFinancial] Error marking as paid:', err);
      setError(err instanceof Error ? err.message : 'Erro ao marcar como pago');
      return false;
    }
  }, [loadPayments, loadOverview]);

  /**
   * Atualiza pagamento
   */
  const updatePayment = useCallback(async (
    id: string,
    data: UpdatePaymentData
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erro ao atualizar pagamento');
      }

      await loadPayments();
      await loadOverview();
      return true;
    } catch (err) {
      console.error('[useFinancial] Error updating payment:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar pagamento');
      return false;
    }
  }, [loadPayments, loadOverview]);

  /**
   * Remove pagamento
   */
  const deletePayment = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/payments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao remover pagamento');
      }

      await loadPayments();
      await loadOverview();
      return true;
    } catch (err) {
      console.error('[useFinancial] Error deleting payment:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover pagamento');
      return false;
    }
  }, [loadPayments, loadOverview]);

  /**
   * Gera cobranças mensais para todos os clientes ativos
   */
  const generateMonthlyPayments = useCallback(async (
    month: string
  ): Promise<GeneratePaymentsResult | null> => {
    try {
      const response = await fetch('/api/payments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao gerar cobranças');
      }

      const result = await response.json();
      await loadPayments();
      await loadOverview();
      return result;
    } catch (err) {
      console.error('[useFinancial] Error generating payments:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar cobranças');
      return null;
    }
  }, [loadPayments, loadOverview]);

  /**
   * Gera mensagem de lembrete para WhatsApp
   */
  const generateReminder = useCallback((
    paymentId: string,
    templateType: 'pre_due' | 'overdue' | 'reminder'
  ): string => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
      return '';
    }

    const template = MESSAGE_TEMPLATES[templateType];
    const dueDate = new Date(payment.due_date);
    const today = new Date();
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    // Extrai mês/ano do due_date
    const dueDateParts = payment.due_date.split('-');
    const year = dueDateParts[0] || '';
    const monthNum = dueDateParts[1] || '01';
    const monthIndex = parseInt(monthNum, 10) - 1;
    const monthName = `${monthNames[monthIndex] || 'Janeiro'}/${year}`;

    const message = template
      .replace('{clientName}', payment.client?.name || 'Cliente')
      .replace('{month}', monthName)
      .replace('{dueDate}', dueDate.toLocaleDateString('pt-BR'))
      .replace('{amount}', payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
      .replace('{daysOverdue}', String(Math.max(0, daysOverdue)));

    return message;
  }, [payments]);

  // Carrega dados quando o mês muda
  useEffect(() => {
    loadPayments();
    loadOverview();
  }, [loadPayments, loadOverview]);

  return {
    payments,
    overview,
    loading,
    error,
    selectedMonth,
    setSelectedMonth,
    loadPayments,
    loadOverview,
    createPayment,
    markAsPaid,
    updatePayment,
    deletePayment,
    generateReminder,
    generateMonthlyPayments,
  };
}
