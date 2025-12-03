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
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: ROUTES.DASHBOARD },
  { id: 'clients', label: 'Clientes', icon: 'Users', href: ROUTES.CLIENTS },
  { id: 'tasks', label: 'Tarefas', icon: 'CheckSquare', href: ROUTES.TASKS },
  { id: 'calendar', label: 'Calendário', icon: 'Calendar', href: ROUTES.CALENDAR },
  { id: 'reports', label: 'Relatórios', icon: 'BarChart3', href: ROUTES.REPORTS },
  { id: 'analysis', label: 'Análise', icon: 'Brain', href: ROUTES.ANALYSIS },
  { id: 'templates', label: 'Briefings', icon: 'FileText', href: ROUTES.TEMPLATES },
  { id: 'financial', label: 'Financeiro', icon: 'Wallet', href: ROUTES.FINANCIAL },
] as const;

/**
 * Segmentos de clientes disponíveis
 */
export const SEGMENTS = [
  { value: 'fitness', label: 'Academia / Fitness', icon: 'fitness' },
  { value: 'delivery', label: 'Delivery / Restaurante', icon: 'delivery' },
  { value: 'ecommerce', label: 'E-commerce', icon: 'ecommerce' },
  { value: 'services', label: 'Serviços', icon: 'services' },
  { value: 'education', label: 'Educação', icon: 'education' },
  { value: 'health', label: 'Saúde', icon: 'health' },
  { value: 'construction', label: 'Construção Civil', icon: 'construction' },
  { value: 'events', label: 'Eventos', icon: 'events' },
  { value: 'beauty', label: 'Beleza / Estética', icon: 'beauty' },
  { value: 'automotive', label: 'Automotivo', icon: 'automotive' },
  { value: 'other', label: 'Outro', icon: 'other' },
] as const;

/**
 * Status de cliente com configurações visuais modernas
 */
export const CLIENT_STATUS = {
  active: {
    label: 'Ativo',
    color: 'success',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/40',
    dotClass: 'bg-emerald-400',
  },
  paused: {
    label: 'Pausado',
    color: 'warning',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-500/40',
    dotClass: 'bg-amber-400',
  },
  inactive: {
    label: 'Inativo',
    color: 'error',
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-300',
    borderClass: 'border-red-500/40',
    dotClass: 'bg-red-400',
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
 * Frequências de captação disponíveis
 */
export const CAPTATION_FREQUENCIES = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'on_demand', label: 'Sob demanda' },
] as const;

/**
 * Faixas de quantidade de vídeos para campanhas
 */
export const VIDEO_QUANTITY_RANGES = [
  { value: '2_4', label: '2 a 4 vídeos' },
  { value: '4_6', label: '4 a 6 vídeos' },
  { value: '6_10', label: '6 a 10 vídeos' },
  { value: '10_15', label: '10 a 15 vídeos' },
  { value: '15_plus', label: '15+ vídeos' },
] as const;

/**
 * Dias da semana para reuniões fixas
 */
export const WEEK_DAYS = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
] as const;

/**
 * Status de pagamento com configurações visuais modernas
 */
export const PAYMENT_STATUS = {
  pending: {
    label: 'Pendente',
    color: 'warning',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-500/40',
    dotClass: 'bg-amber-400',
    icon: 'clock',
  },
  paid: {
    label: 'Pago',
    color: 'success',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/40',
    dotClass: 'bg-emerald-400',
    icon: 'check-circle',
  },
  overdue: {
    label: 'Atrasado',
    color: 'error',
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-300',
    borderClass: 'border-red-500/40',
    dotClass: 'bg-red-400',
    icon: 'alert',
  },
} as const;

/**
 * Status de anúncio com configurações visuais modernas
 */
export const AD_STATUS = {
  winner: {
    label: 'Vencedor',
    color: 'success',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/40',
    dotClass: 'bg-emerald-400',
    icon: 'trophy',
  },
  active: {
    label: 'Ativo',
    color: 'info',
    bgClass: 'bg-blue-500/15',
    textClass: 'text-blue-300',
    borderClass: 'border-blue-500/40',
    dotClass: 'bg-blue-400',
    icon: 'check',
  },
  fatigue: {
    label: 'Fadiga',
    color: 'warning',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-500/40',
    dotClass: 'bg-amber-400',
    icon: 'alert-triangle',
  },
  pause: {
    label: 'Pausar',
    color: 'error',
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-300',
    borderClass: 'border-red-500/40',
    dotClass: 'bg-red-400',
    icon: 'x-circle',
  },
} as const;

/**
 * Severidade de sugestões com configurações visuais modernas
 */
export const SUGGESTION_SEVERITY = {
  urgent: {
    label: 'URGENTE',
    color: 'error',
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-300',
    borderClass: 'border-red-500/40',
    dotClass: 'bg-red-400',
    icon: 'circle-red',
    iconColor: 'text-red-400',
  },
  warning: {
    label: 'ATENÇÃO',
    color: 'warning',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-500/40',
    dotClass: 'bg-amber-400',
    icon: 'circle-yellow',
    iconColor: 'text-amber-400',
  },
  info: {
    label: 'SUGESTÃO',
    color: 'info',
    bgClass: 'bg-blue-500/15',
    textClass: 'text-blue-300',
    borderClass: 'border-blue-500/40',
    dotClass: 'bg-blue-400',
    icon: 'circle-blue',
    iconColor: 'text-blue-400',
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
