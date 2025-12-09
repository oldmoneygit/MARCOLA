/**
 * @file financial.ts
 * @description Tipos relacionados ao módulo financeiro
 * @module types
 */

/**
 * Status de pagamento
 */
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'inactive';

/**
 * Interface de pagamento
 */
export interface Payment {
  id: string;
  client_id: string;
  user_id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: PaymentStatus;
  description: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * DTO para marcar pagamento como pago
 */
export interface MarkAsPaidDTO {
  paid_date?: string;
  notes?: string;
}

/**
 * Overview financeiro do mês
 */
export interface FinancialOverview {
  totalRevenue: number;
  received: number;
  pending: number;
  overdue: number;
  inactive: number;
  clientsPaid: number;
  clientsPending: number;
  clientsOverdue: number;
  clientsInactive: number;
}

/**
 * Pagamento com informações do cliente
 */
export interface PaymentWithClient extends Payment {
  client: {
    id: string;
    name: string;
    segment: string;
    contact_phone: string | null;
  };
}

/**
 * Template de mensagem para cobrança
 */
export interface MessageTemplate {
  id: string;
  name: string;
  type: 'pre_due' | 'overdue' | 'reminder';
  template: string;
}

/**
 * Dados para gerar lembrete
 */
export interface ReminderData {
  clientName: string;
  contactName: string;
  amount: number;
  dueDate: string;
  daysOverdue?: number;
  month: string;
}
