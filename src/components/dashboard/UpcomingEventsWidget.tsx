/**
 * @file UpcomingEventsWidget.tsx
 * @description Widget de próximos eventos do calendário para o dashboard
 * @module components/dashboard
 */

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { format, parseISO, isToday, isTomorrow, addDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { GlassCard } from '@/components/ui';

import type { CalendarEvent, ContentStatus } from '@/types';

interface UpcomingEventsWidgetProps {
  /** Número máximo de eventos a exibir */
  maxEvents?: number;
}

const STATUS_CONFIG: Record<ContentStatus, { label: string; color: string }> = {
  planned: { label: 'Planejado', color: 'bg-zinc-500' },
  creating: { label: 'Criando', color: 'bg-yellow-500' },
  review: { label: 'Revisão', color: 'bg-blue-500' },
  approved: { label: 'Aprovado', color: 'bg-emerald-500' },
  published: { label: 'Publicado', color: 'bg-green-500' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500' },
};

const TYPE_ICONS: Record<string, string> = {
  post: '📱',
  story: '📷',
  reel: '🎬',
  video: '🎥',
  carousel: '🎠',
  live: '🔴',
  ad: '📢',
  blog: '📝',
  email: '📧',
  other: '📌',
};

/**
 * Formata a data do evento de forma amigável
 */
function formatEventDate(dateString: string): string {
  const date = parseISO(dateString);

  if (isToday(date)) {
    return 'Hoje';
  }

  if (isTomorrow(date)) {
    return 'Amanhã';
  }

  // Se for nos próximos 7 dias, mostra o dia da semana
  const nextWeek = addDays(new Date(), 7);
  if (isBefore(date, nextWeek)) {
    return format(date, "EEEE", { locale: ptBR });
  }

  return format(date, "d 'de' MMM", { locale: ptBR });
}

/**
 * Widget de próximos eventos do calendário para o dashboard
 */
export function UpcomingEventsWidget({ maxEvents = 5 }: UpcomingEventsWidgetProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      // Buscar eventos dos próximos 14 dias
      const startDate = format(new Date(), 'yyyy-MM-dd');
      const endDate = format(addDays(new Date(), 14), 'yyyy-MM-dd');

      const response = await fetch(`/api/calendar?start_date=${startDate}&end_date=${endDate}`);
      if (response.ok) {
        const result = await response.json();
        // Filtrar apenas eventos não publicados e ordenar por data
        const filteredEvents = result
          .filter((e: CalendarEvent) => e.status !== 'published')
          .sort((a: CalendarEvent, b: CalendarEvent) =>
            new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
          )
          .slice(0, maxEvents);
        setEvents(filteredEvents);
      }
    } catch (err) {
      console.error('[UpcomingEventsWidget] Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [maxEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (loading) {
    return (
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Próximos Conteúdos</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Próximos Conteúdos</h2>
        <Link
          href="/calendar"
          className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          Ver calendário
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-zinc-400">
          <span className="text-3xl">📅</span>
          <p className="mt-2">Nenhum conteúdo agendado</p>
          <p className="text-sm text-zinc-500">Agende conteúdos para seus clientes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const statusConfig = STATUS_CONFIG[event.status];
            const typeIcon = TYPE_ICONS[event.type] || TYPE_ICONS.other;

            return (
              <div
                key={event.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
              >
                {/* Ícone do tipo */}
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">{typeIcon}</span>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {event.client && (
                      <span className="text-xs text-zinc-500 truncate">
                        {event.client.name}
                      </span>
                    )}
                    {event.platform && (
                      <span className="text-xs text-zinc-600">
                        • {event.platform}
                      </span>
                    )}
                  </div>
                </div>

                {/* Data e Status */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs text-zinc-400">
                    {formatEventDate(event.scheduled_date)}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.color}`} />
                    <span className="text-xs text-zinc-500">{statusConfig.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500">
        <span>Próximos 14 dias</span>
        <span>{events.length} conteúdo{events.length !== 1 ? 's' : ''} pendente{events.length !== 1 ? 's' : ''}</span>
      </div>
    </GlassCard>
  );
}
