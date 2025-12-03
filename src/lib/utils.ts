/**
 * @file utils.ts
 * @description Funções utilitárias gerais da aplicação
 * @module lib
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes Tailwind de forma inteligente, resolvendo conflitos
 * @param inputs - Classes CSS a serem combinadas
 * @returns String de classes combinadas
 *
 * @example
 * cn('px-4 py-2', 'px-6') // retorna 'py-2 px-6'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formata valor numérico para moeda brasileira (BRL)
 * @param value - Valor a ser formatado
 * @returns String formatada em BRL
 *
 * @example
 * formatCurrency(1500) // 'R$ 1.500,00'
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata número com separador de milhar
 * @param value - Valor a ser formatado
 * @returns String formatada com separadores
 *
 * @example
 * formatNumber(1500) // '1.500'
 * formatNumber(1500000) // '1.500.000'
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

/**
 * Formata valor para exibição compacta (k, M)
 * @param value - Valor a ser formatado
 * @returns String formatada de forma compacta
 *
 * @example
 * formatCompactNumber(1500) // '1.5k'
 * formatCompactNumber(1500000) // '1.5M'
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toLocaleString('pt-BR');
}

/**
 * Formata porcentagem com casas decimais
 * @param value - Valor percentual
 * @param decimals - Número de casas decimais (default: 2)
 * @returns String formatada com símbolo %
 *
 * @example
 * formatPercent(3.456) // '3.46%'
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calcula CPA (Custo por Aquisição)
 * @param spend - Valor total gasto
 * @param conversions - Número de conversões
 * @returns CPA calculado ou 0 se não houver conversões
 *
 * @example
 * calculateCPA(1000, 50) // 20
 */
export function calculateCPA(spend: number, conversions: number): number {
  if (conversions === 0) {
    return 0;
  }
  return spend / conversions;
}

/**
 * Calcula CTR (Click-Through Rate)
 * @param clicks - Número de cliques
 * @param impressions - Número de impressões
 * @returns CTR em porcentagem ou 0 se não houver impressões
 *
 * @example
 * calculateCTR(100, 5000) // 2
 */
export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) {
    return 0;
  }
  return (clicks / impressions) * 100;
}

/**
 * Calcula CPC (Custo por Clique)
 * @param spend - Valor total gasto
 * @param clicks - Número de cliques
 * @returns CPC calculado ou 0 se não houver cliques
 */
export function calculateCPC(spend: number, clicks: number): number {
  if (clicks === 0) {
    return 0;
  }
  return spend / clicks;
}

/**
 * Calcula CPM (Custo por Mil Impressões)
 * @param spend - Valor total gasto
 * @param impressions - Número de impressões
 * @returns CPM calculado ou 0 se não houver impressões
 */
export function calculateCPM(spend: number, impressions: number): number {
  if (impressions === 0) {
    return 0;
  }
  return (spend / impressions) * 1000;
}

/**
 * Formata data para exibição no formato brasileiro
 * @param date - Data como string ISO ou Date
 * @returns String formatada dd/mm/yyyy
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora para exibição
 * @param date - Data como string ISO ou Date
 * @returns String formatada dd/mm/yyyy HH:mm
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calcula dias de diferença entre duas datas
 * @param date1 - Primeira data
 * @param date2 - Segunda data (default: hoje)
 * @returns Número de dias de diferença
 */
export function daysDifference(date1: string | Date, date2: string | Date = new Date()): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Gera as iniciais de um nome
 * @param name - Nome completo
 * @returns Iniciais (máximo 2 caracteres)
 *
 * @example
 * getInitials('João Silva') // 'JS'
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Gera cor de gradiente baseada em um índice
 * @param index - Índice para gerar cor consistente
 * @returns Classes Tailwind de gradiente
 */
export function getGradientByIndex(index: number): string {
  const gradients = [
    'from-orange-400 to-red-500',
    'from-blue-400 to-indigo-500',
    'from-pink-400 to-purple-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-cyan-400 to-blue-500',
  ] as const;
  return gradients[index % gradients.length] ?? gradients[0];
}

/**
 * Trunca texto com ellipsis
 * @param text - Texto a ser truncado
 * @param maxLength - Comprimento máximo
 * @returns Texto truncado com ... se necessário
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Debounce para funções
 * @param fn - Função a ser debounced
 * @param delay - Delay em ms
 * @returns Função debounced
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Gera URL para WhatsApp com mensagem
 * @param phone - Número de telefone (com código do país)
 * @param message - Mensagem a ser enviada
 * @returns URL do WhatsApp
 */
export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Valida se um email é válido
 * @param email - Email a ser validado
 * @returns true se válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formata número de telefone brasileiro
 * @param phone - Número de telefone
 * @returns Telefone formatado
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}
