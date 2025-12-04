/**
 * @file TaskQuickActions.tsx
 * @description Ações rápidas contextuais para tarefas baseadas no tipo
 * @module components/tasks
 */

'use client';

import { useMemo, useCallback } from 'react';

import { Icon } from '@/components/ui';
import { cn } from '@/lib/utils';

import type { Task } from '@/types';

/** Credencial do cliente */
interface ClientCredential {
  id: string;
  platform: string;
  url: string | null;
  login?: string;
}

/** Dados do cliente para ações rápidas */
interface ClientData {
  id: string;
  name: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  contact_name?: string | null;
  /** URL do Google Drive (campo drive_url no DB) */
  drive_url?: string | null;
  /** URL do Gerenciador de Anúncios Meta */
  ads_account_url?: string | null;
  /** URL do Google Ads */
  google_ads_account_url?: string | null;
  /** URL do Instagram */
  instagram_url?: string | null;
  credentials?: ClientCredential[];
}

interface TaskQuickActionsProps {
  /** Dados da tarefa */
  task: Task;
  /** Dados do cliente (se disponível) */
  clientData?: ClientData | null;
  /** Callback para criar evento no calendário */
  onCreateCalendarEvent?: (task: Task) => void;
  /** Tamanho dos botões */
  size?: 'sm' | 'md';
  /** Classes adicionais */
  className?: string;
}

/** Tipos de ação rápida */
type QuickActionType =
  | 'ads_manager'      // Abrir Gerenciador de Anúncios
  | 'google_drive'     // Abrir Google Drive
  | 'whatsapp'         // Enviar WhatsApp
  | 'email'            // Enviar Email
  | 'calendar'         // Marcar no Calendário
  | 'instagram'        // Abrir Instagram
  | 'analytics';       // Abrir Analytics

interface QuickAction {
  type: QuickActionType;
  label: string;
  icon: string;
  color: string;
  url?: string;
  onClick?: () => void;
}

/** Keywords para detectar tipo de tarefa */
const TASK_KEYWORDS = {
  criativos: [
    'criativo', 'criativos', 'captação', 'captacao', 'gravação', 'gravacao',
    'foto', 'video', 'vídeo', 'imagem', 'design', 'arte', 'banner', 'story',
    'reels', 'carrossel', 'conteúdo', 'conteudo', 'produção', 'producao'
  ],
  anuncios: [
    'anúncio', 'anuncio', 'campanha', 'ads', 'tráfego', 'trafego',
    'performance', 'conversão', 'conversao', 'lance', 'orçamento', 'orcamento',
    'segmentação', 'segmentacao', 'público', 'publico', 'audiência', 'audiencia',
    'pixel', 'remarketing', 'lookalike', 'saturados', 'pausar', 'duplicar',
    'vencedores', 'perdedores', 'microajustes'
  ],
  reuniao: [
    'reunião', 'reuniao', 'alinhamento', 'call', 'chamada', 'meeting',
    'kickoff', 'onboarding', 'feedback', 'apresentação', 'apresentacao'
  ],
  analise: [
    'análise', 'analise', 'auditoria', 'relatório', 'relatorio', 'métricas',
    'metricas', 'funil', 'churn', 'cac', 'ltv', 'roas', 'cpa', 'ctr',
    'concorrência', 'concorrencia', 'benchmark'
  ],
  social: [
    'instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'social',
    'stories', 'feed', 'post', 'publicação', 'publicacao', 'engajamento'
  ],
  financeiro: [
    'cobrança', 'cobranca', 'pagamento', 'fatura', 'nota fiscal', 'boleto',
    'pix', 'transferência', 'transferencia'
  ],
};

/**
 * Detecta o tipo principal da tarefa baseado em keywords no título
 */
function detectTaskType(title: string): keyof typeof TASK_KEYWORDS | null {
  const normalizedTitle = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Ordem de prioridade (mais específico primeiro)
  const typeOrder: (keyof typeof TASK_KEYWORDS)[] = [
    'reuniao', 'criativos', 'anuncios', 'analise', 'social', 'financeiro'
  ];

  for (const type of typeOrder) {
    const keywords = TASK_KEYWORDS[type];
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalizedTitle.includes(normalizedKeyword)) {
        return type;
      }
    }
  }

  return null;
}

/**
 * Gera URL do WhatsApp com mensagem
 */
function generateWhatsAppUrl(phone: string, message: string): string {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  // Adiciona código do Brasil se não tiver
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Gera URL do mailto com assunto
 */
function generateEmailUrl(email: string, subject: string, body?: string): string {
  let url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  if (body) {
    url += `&body=${encodeURIComponent(body)}`;
  }
  return url;
}

/**
 * Componente de ações rápidas para tarefas
 */
function TaskQuickActions({
  task,
  clientData,
  onCreateCalendarEvent,
  size = 'sm',
  className,
}: TaskQuickActionsProps) {
  const taskType = useMemo(() => detectTaskType(task.title), [task.title]);

  // Buscar credenciais relevantes
  const credentials = useMemo(() => {
    if (!clientData?.credentials) { return {}; }

    const creds: Record<string, ClientCredential> = {};
    for (const cred of clientData.credentials) {
      const platform = cred.platform.toLowerCase();
      if (platform.includes('meta') || platform.includes('facebook') || platform.includes('ads')) {
        creds.meta_ads = cred;
      } else if (platform.includes('google') && platform.includes('ads')) {
        creds.google_ads = cred;
      } else if (platform.includes('drive')) {
        creds.google_drive = cred;
      } else if (platform.includes('instagram')) {
        creds.instagram = cred;
      } else if (platform.includes('analytics')) {
        creds.analytics = cred;
      }
    }
    return creds;
  }, [clientData?.credentials]);

  // Gerar ações baseadas no tipo de tarefa
  const actions = useMemo((): QuickAction[] => {
    const result: QuickAction[] = [];

    switch (taskType) {
      case 'criativos':
        // Abrir Gerenciador de Anúncios
        if (clientData?.ads_account_url) {
          result.push({
            type: 'ads_manager',
            label: 'Ads Manager',
            icon: 'target',
            color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
            url: clientData.ads_account_url,
          });
        } else if (credentials.meta_ads?.url) {
          result.push({
            type: 'ads_manager',
            label: 'Ads Manager',
            icon: 'target',
            color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
            url: credentials.meta_ads.url,
          });
        } else {
          // Link genérico do Meta Business Suite
          result.push({
            type: 'ads_manager',
            label: 'Meta Ads',
            icon: 'target',
            color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
            url: 'https://business.facebook.com/latest/ads_manager',
          });
        }
        // Google Drive
        if (clientData?.drive_url || credentials.google_drive?.url) {
          result.push({
            type: 'google_drive',
            label: 'Drive',
            icon: 'folder',
            color: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30',
            url: clientData?.drive_url || credentials.google_drive?.url || undefined,
          });
        }
        break;

      case 'anuncios':
        // Gerenciador de Anúncios
        if (clientData?.ads_account_url) {
          result.push({
            type: 'ads_manager',
            label: 'Ads Manager',
            icon: 'target',
            color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
            url: clientData.ads_account_url,
          });
        } else if (credentials.meta_ads?.url) {
          result.push({
            type: 'ads_manager',
            label: 'Ads Manager',
            icon: 'target',
            color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
            url: credentials.meta_ads.url,
          });
        } else {
          result.push({
            type: 'ads_manager',
            label: 'Meta Ads',
            icon: 'target',
            color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
            url: 'https://business.facebook.com/latest/ads_manager',
          });
        }
        // Google Ads se disponível
        if (clientData?.google_ads_account_url) {
          result.push({
            type: 'analytics',
            label: 'Google Ads',
            icon: 'bar-chart',
            color: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30',
            url: clientData.google_ads_account_url,
          });
        } else if (credentials.analytics?.url) {
          result.push({
            type: 'analytics',
            label: 'Analytics',
            icon: 'bar-chart',
            color: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30',
            url: credentials.analytics.url,
          });
        }
        break;

      case 'reuniao':
        // Marcar no Calendário
        if (onCreateCalendarEvent) {
          result.push({
            type: 'calendar',
            label: 'Agendar',
            icon: 'calendar',
            color: 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30',
          });
        }
        // WhatsApp para confirmar
        if (clientData?.contact_phone) {
          const message = `Olá${clientData.contact_name ? ` ${clientData.contact_name.split(' ')[0]}` : ''}! Gostaria de confirmar nossa reunião de alinhamento. Podemos manter conforme combinado?`;
          result.push({
            type: 'whatsapp',
            label: 'Confirmar',
            icon: 'message-circle',
            color: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30',
            url: generateWhatsAppUrl(clientData.contact_phone, message),
          });
        }
        // Email como alternativa
        if (clientData?.contact_email && !clientData?.contact_phone) {
          result.push({
            type: 'email',
            label: 'Email',
            icon: 'mail',
            color: 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30',
            url: generateEmailUrl(
              clientData.contact_email,
              `Confirmação de Reunião - ${clientData.name}`,
              `Olá!\n\nGostaria de confirmar nossa reunião de alinhamento.\n\nAguardo seu retorno!\n\nAtenciosamente`
            ),
          });
        }
        break;

      case 'analise':
        // Relatórios/Dashboard
        result.push({
          type: 'analytics',
          label: 'Relatórios',
          icon: 'bar-chart',
          color: 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30',
          url: clientData?.id ? `/reports?client_id=${clientData.id}` : '/reports',
        });
        // Ads Manager para dados
        if (credentials.meta_ads?.url) {
          result.push({
            type: 'ads_manager',
            label: 'Ads',
            icon: 'target',
            color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
            url: credentials.meta_ads.url,
          });
        }
        break;

      case 'social':
        // Instagram do cliente
        if (clientData?.instagram_url) {
          result.push({
            type: 'instagram',
            label: 'Instagram',
            icon: 'instagram',
            color: 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30',
            url: clientData.instagram_url,
          });
        } else if (credentials.instagram?.url) {
          result.push({
            type: 'instagram',
            label: 'Instagram',
            icon: 'instagram',
            color: 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30',
            url: credentials.instagram.url,
          });
        }
        // Google Drive para assets
        if (clientData?.drive_url || credentials.google_drive?.url) {
          result.push({
            type: 'google_drive',
            label: 'Drive',
            icon: 'folder',
            color: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30',
            url: clientData?.drive_url || credentials.google_drive?.url || undefined,
          });
        }
        break;

      case 'financeiro':
        // WhatsApp para cobrança
        if (clientData?.contact_phone) {
          const message = `Olá${clientData.contact_name ? ` ${clientData.contact_name.split(' ')[0]}` : ''}! Tudo bem? Passando para lembrar sobre o pagamento da mensalidade. Qualquer dúvida, estou à disposição!`;
          result.push({
            type: 'whatsapp',
            label: 'Lembrete',
            icon: 'message-circle',
            color: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30',
            url: generateWhatsAppUrl(clientData.contact_phone, message),
          });
        }
        // Email
        if (clientData?.contact_email) {
          result.push({
            type: 'email',
            label: 'Email',
            icon: 'mail',
            color: 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30',
            url: generateEmailUrl(
              clientData.contact_email,
              `Lembrete de Pagamento - ${clientData.name}`,
              `Olá!\n\nEste é um lembrete amigável sobre o pagamento da mensalidade.\n\nQualquer dúvida, estamos à disposição!\n\nAtenciosamente`
            ),
          });
        }
        break;
    }

    return result;
  }, [taskType, credentials, clientData, onCreateCalendarEvent]);

  const handleActionClick = useCallback(
    (action: QuickAction, e: React.MouseEvent) => {
      e.stopPropagation();

      if (action.type === 'calendar' && onCreateCalendarEvent) {
        onCreateCalendarEvent(task);
        return;
      }

      if (action.url) {
        window.open(action.url, '_blank', 'noopener,noreferrer');
      }

      if (action.onClick) {
        action.onClick();
      }
    },
    [task, onCreateCalendarEvent]
  );

  // Não mostrar se não houver ações
  if (actions.length === 0) {
    return null;
  }

  const buttonSize = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  const iconSize = size === 'sm' ? 'xs' : 'sm';

  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      {actions.map((action) => (
        <button
          key={action.type}
          type="button"
          onClick={(e) => handleActionClick(action, e)}
          className={cn(
            'inline-flex items-center gap-1 rounded-md font-medium transition-colors',
            buttonSize,
            action.color
          )}
          title={action.label}
        >
          <Icon name={action.icon} size={iconSize} />
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}

export { TaskQuickActions, detectTaskType };
export type { TaskQuickActionsProps, ClientData, ClientCredential };
