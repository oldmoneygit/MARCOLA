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
import {
  Smartphone,
  Camera,
  Film,
  Video,
  LayoutGrid,
  Radio,
  Megaphone,
  FileText,
  Mail,
  Pin,
  Calendar,
} from 'lucide-react';

import { GlassCard, Icon } from '@/components/ui';
import { PLATFORM_CONFIG } from '@/types/calendar';

import type { CalendarEvent, ContentStatus, Platform } from '@/types';

interface UpcomingEventsWidgetProps {
  /** Número máximo de eventos a exibir */
  maxEvents?: number;
}

/** Configuração de status - Emerald Teal Theme */
const STATUS_CONFIG: Record<ContentStatus, { label: string; color: string }> = {
  planned: { label: 'Planejado', color: 'bg-[#6B8A8D]' },
  creating: { label: 'Criando', color: 'bg-[#E3B8B8]' },
  review: { label: 'Revisão', color: 'bg-[#BDCDCF]' },
  approved: { label: 'Aprovado', color: 'bg-[#7ED4A6]' },
  published: { label: 'Publicado', color: 'bg-[#7ED4A6]' },
  cancelled: { label: 'Cancelado', color: 'bg-[#E57373]' },
};

const TYPE_ICONS = {
  post: Smartphone,
  story: Camera,
  reel: Film,
  video: Video,
  carousel: LayoutGrid,
  live: Radio,
  ad: Megaphone,
  blog: FileText,
  email: Mail,
  other: Pin,
} as const;

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
      <GlassCard className="h-full flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-base font-semibold text-white whitespace-nowrap">Próximos Conteúdos</h2>
        </div>
        <div className="space-y-3 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-base font-semibold text-white whitespace-nowrap">Próximos Conteúdos</h2>
        <Link
          href="/calendar"
          className="text-xs text-[#BDCDCF] hover:text-white transition-colors whitespace-nowrap flex-shrink-0"
        >
          Ver calendário
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-[#8FAAAD] flex-1 flex flex-col justify-center">
          <Calendar className="w-10 h-10 mx-auto text-[#BDCDCF]" />
          <p className="mt-2">Nenhum conteúdo agendado</p>
          <p className="text-sm text-[#6B8A8D]">Agende conteúdos para seus clientes</p>
        </div>
      ) : (
        <div className="space-y-2 flex-1">
          {events.map((event) => {
            const statusConfig = STATUS_CONFIG[event.status];
            const TypeIcon = TYPE_ICONS[event.type as keyof typeof TYPE_ICONS] ?? Pin;

            return (
              <div
                key={event.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
              >
                {/* Ícone do tipo */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#BDCDCF]/10 to-[#8FAAAD]/10 flex items-center justify-center flex-shrink-0">
                  <TypeIcon className="w-4 h-4 text-[#BDCDCF]" />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {event.client && (
                      <span className="text-xs text-[#6B8A8D] truncate">
                        {event.client.name}
                      </span>
                    )}
                    {event.platform && event.platform.length > 0 && (
                      <div className="flex items-center gap-1.5 ml-1">
                        {event.platform.map((platform: Platform) => {
                          const platformConfig = PLATFORM_CONFIG[platform];
                          if (!platformConfig) {
                            return null;
                          }
                          
                          return (
                            <div
                              key={platform}
                              className="w-4 h-4 rounded-md flex items-center justify-center backdrop-blur-sm border border-white/[0.08] transition-all hover:scale-110"
                              style={{ 
                                backgroundColor: `${platformConfig.color}20`,
                              }}
                              title={platformConfig.label}
                            >
                              <div style={{ color: platformConfig.color }}>
                                <Icon
                                  name={platformConfig.icon}
                                  size="xs"
                                  className="opacity-95"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Data e Status */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs text-[#8FAAAD]">
                    {formatEventDate(event.scheduled_date)}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.color}`} />
                    <span className="text-xs text-[#6B8A8D]">{statusConfig.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#6B8A8D]">
        <span>Próximos 14 dias</span>
        <span>{events.length} conteúdo{events.length !== 1 ? 's' : ''} pendente{events.length !== 1 ? 's' : ''}</span>
      </div>
    </GlassCard>
  );
}
