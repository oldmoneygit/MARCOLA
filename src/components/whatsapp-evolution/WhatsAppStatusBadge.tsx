/**
 * @file WhatsAppStatusBadge.tsx
 * @description Badge compacto para exibir status do WhatsApp em headers/sidebars
 * @module components/whatsapp-evolution
 *
 * @example
 * <WhatsAppStatusBadge />
 * <WhatsAppStatusBadge showLabel onClick={() => openModal()} />
 */

'use client';

import { Smartphone, Loader2, AlertCircle } from 'lucide-react';

import { useWhatsAppEvolution, type WhatsAppEvolutionStatus } from '@/hooks/useWhatsAppEvolution';

interface WhatsAppStatusBadgeProps {
  /** Mostrar label de texto junto ao ícone */
  showLabel?: boolean;
  /** Callback ao clicar no badge */
  onClick?: () => void;
  /** Tamanho do badge */
  size?: 'sm' | 'md' | 'lg';
  /** Desabilitar heartbeat (útil se já tem outro componente verificando) */
  disableHeartbeat?: boolean;
}

const sizeClasses = {
  sm: {
    container: 'px-2 py-1 gap-1.5',
    icon: 'w-3 h-3',
    dot: 'w-1.5 h-1.5',
    text: 'text-xs',
  },
  md: {
    container: 'px-3 py-1.5 gap-2',
    icon: 'w-4 h-4',
    dot: 'w-2 h-2',
    text: 'text-sm',
  },
  lg: {
    container: 'px-4 py-2 gap-2.5',
    icon: 'w-5 h-5',
    dot: 'w-2.5 h-2.5',
    text: 'text-base',
  },
};

const statusConfig: Record<
  WhatsAppEvolutionStatus,
  { color: string; bgColor: string; label: string }
> = {
  checking: {
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/20 border-zinc-500/30',
    label: 'Verificando...',
  },
  connected: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20 border-emerald-500/30',
    label: 'Conectado',
  },
  disconnected: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20 border-amber-500/30',
    label: 'Desconectado',
  },
  no_instance: {
    color: 'text-zinc-500',
    bgColor: 'bg-zinc-500/20 border-zinc-500/30',
    label: 'Não configurado',
  },
  error: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30',
    label: 'Erro',
  },
};

export function WhatsAppStatusBadge({
  showLabel = false,
  onClick,
  size = 'md',
  disableHeartbeat = true, // Desabilitado por padrão
}: WhatsAppStatusBadgeProps) {
  const { status, isConnected } = useWhatsAppEvolution({
    enableHeartbeat: !disableHeartbeat,
    heartbeatInterval: 5 * 60 * 1000, // 5 minutos se habilitado
  });

  const sizes = sizeClasses[size];
  const config = statusConfig[status];

  const isClickable = !!onClick;
  const Component = isClickable ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`
        inline-flex items-center rounded-full border
        ${sizes.container}
        ${config.bgColor}
        ${isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
      `}
      title={`WhatsApp: ${config.label}`}
    >
      {/* Ícone */}
      {status === 'checking' ? (
        <Loader2 className={`${sizes.icon} ${config.color} animate-spin`} />
      ) : status === 'error' ? (
        <AlertCircle className={`${sizes.icon} ${config.color}`} />
      ) : (
        <Smartphone className={`${sizes.icon} ${config.color}`} />
      )}

      {/* Dot de status (quando não mostra label) */}
      {!showLabel && status !== 'checking' && (
        <div
          className={`
            ${sizes.dot} rounded-full
            ${isConnected ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-zinc-500'}
          `}
        />
      )}

      {/* Label */}
      {showLabel && (
        <span className={`${sizes.text} ${config.color} font-medium`}>
          {config.label}
        </span>
      )}
    </Component>
  );
}

/**
 * Badge minimalista apenas com indicador de cor
 */
export function WhatsAppStatusDot({ className = '' }: { className?: string }) {
  const { isConnected, status } = useWhatsAppEvolution({
    enableHeartbeat: false,
  });

  return (
    <div
      className={`
        w-2 h-2 rounded-full
        ${isConnected ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-zinc-500'}
        ${className}
      `}
      title={`WhatsApp: ${isConnected ? 'Conectado' : 'Desconectado'}`}
    />
  );
}

export default WhatsAppStatusBadge;
