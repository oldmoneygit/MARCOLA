/**
 * @file CalendarEventCard.tsx
 * @description Componente de card para evento de calendário
 * @module components/calendar
 *
 * @example
 * <CalendarEventCard event={event} onClick={handleClick} />
 */

'use client';

import { useCallback, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Icon } from '@/components/ui';

import { cn } from '@/lib/utils';

import { ContentTypeBadge } from './ContentTypeBadge';
import { ContentStatusBadge } from './ContentStatusBadge';

import { PLATFORM_CONFIG, CONTENT_TYPE_CONFIG as GLOBAL_CONTENT_CONFIG, type CalendarEvent, type ContentStatus } from '@/types';

interface CalendarEventCardProps {
  /** Dados do evento */
  event: CalendarEvent;
  /** Callback ao clicar no card */
  onClick?: (event: CalendarEvent) => void;
  /** Callback ao mudar status */
  onStatusChange?: (eventId: string, newStatus: ContentStatus) => Promise<void>;
  /** Callback ao deletar */
  onDelete?: (eventId: string) => Promise<void>;
  /** Mostra o nome do cliente */
  showClient?: boolean;
  /** Modo compacto (para exibição no calendário) */
  compact?: boolean;
  /** Classes adicionais */
  className?: string;
}

/**
 * Card para exibição de evento de calendário
 */
function CalendarEventCard({
  event,
  onClick,
  onStatusChange: _onStatusChange,
  onDelete,
  showClient = true,
  compact = false,
  className,
}: CalendarEventCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(event);
    }
  }, [onClick, event]);

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onDelete || isUpdating) {
        return;
      }

      if (!window.confirm('Tem certeza que deseja excluir este evento?')) {
        return;
      }

      setIsUpdating(true);
      try {
        await onDelete(event.id);
      } finally {
        setIsUpdating(false);
      }
    },
    [event.id, onDelete, isUpdating]
  );

  const scheduledDate = parseISO(event.scheduled_date);
  const platforms = event.platform || [];

  // Modo compacto para exibição dentro do calendário
  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'px-2 py-1 rounded text-xs cursor-pointer',
          'hover:opacity-80 transition-opacity',
          'flex items-center gap-1 truncate',
          event.color ? '' : GLOBAL_CONTENT_CONFIG[event.type].className,
          className
        )}
        style={event.color ? { backgroundColor: `${event.color}20`, color: event.color } : undefined}
        title={event.title}
      >
        <Icon name={GLOBAL_CONTENT_CONFIG[event.type].icon} size="xs" />
        <span className="truncate">{event.title}</span>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'p-4 rounded-xl',
        'bg-white/[0.03] hover:bg-white/[0.06]',
        'border border-white/[0.08] hover:border-white/[0.15]',
        'transition-all duration-200',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{event.title}</h4>
          {event.description && (
            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{event.description}</p>
          )}
        </div>

        {/* Ações */}
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isUpdating}
            className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
            aria-label="Excluir evento"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <ContentTypeBadge type={event.type} size="sm" />
        <ContentStatusBadge status={event.status} size="sm" />
      </div>

      {/* Plataformas */}
      {platforms.length > 0 && (
        <div className="flex items-center gap-1.5 mt-3">
          {platforms.map((platform) => {
            const config = PLATFORM_CONFIG[platform];
            return (
              <span
                key={platform}
                title={config.label}
                style={{ color: config.color }}
              >
                <Icon name={config.icon} size="sm" />
              </span>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
        {showClient && event.client && (
          <span className="text-xs text-zinc-400">{event.client.name}</span>
        )}
        <span className="text-xs text-zinc-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {format(scheduledDate, "dd 'de' MMM", { locale: ptBR })}
          {event.scheduled_time && ` às ${event.scheduled_time.substring(0, 5)}`}
        </span>
      </div>
    </div>
  );
}

export { CalendarEventCard };
export type { CalendarEventCardProps };
