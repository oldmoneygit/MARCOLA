/**
 * @file constants.ts
 * @description Constantes globais da aplicação TrafficHub
 * @module lib
 */

/**
 * Nome da aplicação
 */
export const APP_NAME = 'TrafficHub';

/**
 * Rotas da aplicação
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CLIENTS: '/clients',
  CLIENT_DETAIL: (id: string) => `/clients/${id}`,
  TASKS: '/tasks',
  CALENDAR: '/calendar',
  TEMPLATES: '/templates',
  REPORTS: '/reports',
  ANALYSIS: '/analysis',
  FINANCIAL: '/financial',
} as const;

/**
 * Itens de navegação do menu
 */
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', href: ROUTES.DASHBOARD },
  { id: 'clients', label: 'Clientes', icon: '👥', href: ROUTES.CLIENTS },
  { id: 'tasks', label: 'Tarefas', icon: '✅', href: ROUTES.TASKS },
  { id: 'calendar', label: 'Calendário', icon: '📅', href: ROUTES.CALENDAR },
  { id: 'reports', label: 'Relatórios', icon: '📈', href: ROUTES.REPORTS },
  { id: 'analysis', label: 'Análise', icon: '🧠', href: ROUTES.ANALYSIS },
  { id: 'templates', label: 'Templates', icon: '📋', href: ROUTES.TEMPLATES },
  { id: 'financial', label: 'Financeiro', icon: '💰', href: ROUTES.FINANCIAL },
] as const;

/**
 * Segmentos de clientes disponíveis
 */
export const SEGMENTS = [
  { value: 'fitness', label: 'Academia / Fitness', icon: '💪' },
  { value: 'delivery', label: 'Delivery / Restaurante', icon: '🍕' },
  { value: 'ecommerce', label: 'E-commerce', icon: '🛒' },
  { value: 'services', label: 'Serviços', icon: '🔧' },
  { value: 'education', label: 'Educação', icon: '📚' },
  { value: 'health', label: 'Saúde', icon: '🏥' },
  { value: 'construction', label: 'Construção Civil', icon: '🏗️' },
  { value: 'events', label: 'Eventos', icon: '🎉' },
  { value: 'beauty', label: 'Beleza / Estética', icon: '💅' },
  { value: 'automotive', label: 'Automotivo', icon: '🚗' },
  { value: 'other', label: 'Outro', icon: '📦' },
] as const;

/**
 * Status de cliente com configurações visuais
 */
export const CLIENT_STATUS = {
  active: {
    label: 'Ativo',
    color: 'success',
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
    dotClass: 'bg-emerald-500',
  },
  paused: {
    label: 'Pausado',
    color: 'warning',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    dotClass: 'bg-amber-500',
  },
  inactive: {
    label: 'Inativo',
    color: 'error',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    dotClass: 'bg-red-500',
  },
} as const;

/**
 * Frequências de reunião disponíveis
 */
export const MEETING_FREQUENCIES = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'on_demand', label: 'Sob demanda' },
] as const;

/**
 * Status de pagamento com configurações visuais
 */
export const PAYMENT_STATUS = {
  pending: {
    label: 'Pendente',
    color: 'warning',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    icon: '⏳',
  },
  paid: {
    label: 'Pago',
    color: 'success',
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
    icon: '✅',
  },
  overdue: {
    label: 'Atrasado',
    color: 'error',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    icon: '🚨',
  },
} as const;

/**
 * Status de anúncio com configurações visuais
 */
export const AD_STATUS = {
  winner: {
    label: 'Vencedor',
    color: 'success',
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
    icon: '🏆',
  },
  active: {
    label: 'Ativo',
    color: 'info',
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-400',
    icon: '✓',
  },
  fatigue: {
    label: 'Fadiga',
    color: 'warning',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    icon: '⚠️',
  },
  pause: {
    label: 'Pausar',
    color: 'error',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    icon: '❌',
  },
} as const;

/**
 * Severidade de sugestões com configurações visuais
 */
export const SUGGESTION_SEVERITY = {
  urgent: {
    label: 'URGENTE',
    color: 'error',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    borderClass: 'border-red-500',
    icon: '🔴',
  },
  warning: {
    label: 'ATENÇÃO',
    color: 'warning',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500',
    icon: '🟡',
  },
  info: {
    label: 'SUGESTÃO',
    color: 'info',
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500',
    icon: '🔵',
  },
} as const;

/**
 * Tipos de alerta com configurações visuais
 */
export const ALERT_TYPES = {
  warning: {
    bgClass: 'bg-amber-500/5',
    borderClass: 'border-l-amber-500',
    textClass: 'text-amber-400',
  },
  danger: {
    bgClass: 'bg-red-500/5',
    borderClass: 'border-l-red-500',
    textClass: 'text-red-400',
  },
  success: {
    bgClass: 'bg-emerald-500/5',
    borderClass: 'border-l-emerald-500',
    textClass: 'text-emerald-400',
  },
  info: {
    bgClass: 'bg-violet-500/5',
    borderClass: 'border-l-violet-500',
    textClass: 'text-violet-400',
  },
} as const;

/**
 * Configurações do algoritmo Andromeda
 */
export const ANDROMEDA_CONFIG = {
  MIN_CREATIVES: 8,
  MAX_CREATIVES: 15,
  OPTIMAL_MIN: 10,
  OPTIMAL_MAX: 12,
} as const;

/**
 * Limiares de performance
 */
export const PERFORMANCE_THRESHOLDS = {
  CTR: {
    good: 3.0,
    warning: 2.0,
  },
  CPA: {
    good: 40,
    warning: 60,
  },
  FATIGUE_CTR_DROP: 20, // % de queda no CTR para detectar fadiga
  FATIGUE_CPA_RISE: 15, // % de aumento no CPA para detectar fadiga
} as const;

/**
 * Períodos disponíveis para relatórios
 */
export const REPORT_PERIODS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '14', label: 'Últimos 14 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '60', label: 'Últimos 60 dias' },
  { value: '90', label: 'Últimos 90 dias' },
] as const;

/**
 * Templates de mensagem para cobrança
 */
export const MESSAGE_TEMPLATES = {
  PRE_DUE: {
    name: 'Lembrete Pré-Vencimento',
    template: `Olá [NOME]! 👋 Passando para lembrar que a mensalidade do serviço de gestão de tráfego vence no dia [DATA]. O valor é R$ [VALOR]. Qualquer dúvida estou à disposição!`,
  },
  OVERDUE: {
    name: 'Cobrança Atrasada',
    template: `Olá [NOME]! Notei que o pagamento da mensalidade de [MÊS] (R$ [VALOR]) ainda não foi efetuado. Houve algum problema? Me avisa que a gente resolve! 🙏`,
  },
  REMINDER: {
    name: 'Lembrete Amigável',
    template: `Oi [NOME]! Tudo bem? 😊 Só passando para lembrar do pagamento da mensalidade. O valor é R$ [VALOR] e vence dia [DATA]. Qualquer dúvida é só chamar!`,
  },
} as const;

/**
 * Dias da semana em português
 */
export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

/**
 * Meses em português
 */
export const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;
