/**
 * @file validations.ts
 * @description Schemas de validação Zod para formulários
 * @module lib
 */

import { z } from 'zod';

/**
 * Schema de validação para login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema de validação para criação/edição de cliente
 */
export const clientSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  segment: z
    .string()
    .min(1, 'Selecione um segmento'),
  monthly_value: z
    .number({ invalid_type_error: 'Valor inválido' })
    .positive('Valor deve ser positivo')
    .max(1000000, 'Valor máximo excedido'),
  due_day: z
    .number({ invalid_type_error: 'Dia inválido' })
    .int('Dia deve ser um número inteiro')
    .min(1, 'Dia deve estar entre 1 e 31')
    .max(31, 'Dia deve estar entre 1 e 31'),
  contact_name: z
    .string()
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  contact_phone: z
    .string()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional()
    .or(z.literal('')),
  contact_email: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  ads_account_url: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
  website_url: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
  drive_url: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notas devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
});

export type ClientFormData = z.infer<typeof clientSchema>;

/**
 * Schema para atualização de status do cliente
 */
export const clientStatusSchema = z.object({
  status: z.enum(['active', 'paused', 'inactive'], {
    errorMap: () => ({ message: 'Status inválido' }),
  }),
});

export type ClientStatusFormData = z.infer<typeof clientStatusSchema>;

/**
 * Schema para importação de CSV
 */
export const csvImportSchema = z.object({
  client_id: z
    .string()
    .uuid('ID do cliente inválido'),
  period_start: z
    .string()
    .min(1, 'Data inicial é obrigatória'),
  period_end: z
    .string()
    .min(1, 'Data final é obrigatória'),
});

export type CSVImportFormData = z.infer<typeof csvImportSchema>;

/**
 * Schema para marcar pagamento como pago
 */
export const markAsPaidSchema = z.object({
  paid_date: z
    .string()
    .optional(),
  notes: z
    .string()
    .max(500, 'Notas devem ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
});

export type MarkAsPaidFormData = z.infer<typeof markAsPaidSchema>;

/**
 * Schema para envio de lembrete
 */
export const reminderSchema = z.object({
  message: z
    .string()
    .min(10, 'Mensagem deve ter pelo menos 10 caracteres')
    .max(1000, 'Mensagem deve ter no máximo 1000 caracteres'),
});

export type ReminderFormData = z.infer<typeof reminderSchema>;

/**
 * Schema para filtros de relatório
 */
export const reportFilterSchema = z.object({
  client_id: z
    .string()
    .uuid('ID do cliente inválido')
    .optional()
    .or(z.literal('')),
  period: z
    .enum(['7', '14', '30', '60', '90'])
    .default('7'),
});

export type ReportFilterFormData = z.infer<typeof reportFilterSchema>;

/**
 * Schema para busca/filtros gerais
 */
export const searchSchema = z.object({
  query: z
    .string()
    .max(100, 'Busca deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  status: z
    .enum(['all', 'active', 'paused', 'inactive'])
    .default('all'),
  segment: z
    .string()
    .optional()
    .or(z.literal('')),
});

export type SearchFormData = z.infer<typeof searchSchema>;

/**
 * Schema para configurações do usuário
 */
export const userSettingsSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z
    .string()
    .email('Email inválido'),
  phone: z
    .string()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional()
    .or(z.literal('')),
});

export type UserSettingsFormData = z.infer<typeof userSettingsSchema>;

/**
 * Helper para transformar string vazia em undefined
 * Útil para campos opcionais
 */
export function emptyToUndefined<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() === '') {
      return undefined;
    }
    return val;
  }, schema);
}

/**
 * Helper para transformar string em número
 * Útil para inputs numéricos
 */
export function stringToNumber(schema: z.ZodNumber) {
  return z.preprocess((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(',', '.'));
      return isNaN(parsed) ? undefined : parsed;
    }
    return val;
  }, schema);
}
