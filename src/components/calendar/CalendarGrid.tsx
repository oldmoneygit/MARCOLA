/**
 * @file CalendarGrid.tsx
 * @description Componente de grid de calendário mensal
 * @module components/calendar
 *
 * @example
 * <CalendarGrid events={events} onEventClick={handleClick} />
 */

'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
  addMonths,
  subMonths,
} from 'date-fns';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/Button';
import { CalendarEventCard } from './CalendarEventCard';

import { DAYS_OF_WEEK, MONTHS, type CalendarEvent, type ContentStatus } from '@/types';

interface CalendarGridProps {
  /** Lista de eventos */
  events: CalendarEvent[];
  /** Callback ao clicar em um evento */
  onEventClick?: (event: CalendarEvent) => void;
  /** Callback ao clicar em um dia */
  onDayClick?: (date: Date) => void;
  /** Callback ao mudar status */
  onStatusChange?: (eventId: string, newStatus: ContentStatus) => Promise<void>;
  /** Callback ao mudar o mês (para buscar novos eventos) */
  onMonthChange?: (date: Date) => void;
  /** Data inicial */
  initialDate?: Date;
  /** Classes adicionais */
  className?: string;
}

/**
 * Grid de calendário mensal com eventos
 */
function CalendarGrid({
  events,
  onEventClick,
  onDayClick,
  onStatusChange: _onStatusChange,
  onMonthChange,
  initialDate = new Date(),
  className,
}: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);

  // Calcular dias do mês
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Agrupar eventos por data
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const dateKey = event.scheduled_date;
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, event]);
    });
    return map;
  }, [events]);

  // Navegação
  const goToPreviousMonth = useCallback(() => {
    const newDate = subMonths(currentDate, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  }, [currentDate, onMonthChange]);

  const goToNextMonth = useCallback(() => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  }, [currentDate, onMonthChange]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    onMonthChange?.(today);
  }, [onMonthChange]);

  const handleDayClick = useCallback(
    (day: Date) => {
      if (onDayClick) {
        onDayClick(day);
      }
    },
    [onDayClick]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header com navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Hoje
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Grid do calendário */}
      <div className="rounded-xl border border-white/[0.08] overflow-hidden">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 bg-white/[0.02]">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="px-2 py-3 text-xs font-medium text-zinc-400 text-center border-b border-white/[0.06]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Células do calendário */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = false; // Pode implementar seleção se necessário
            const dayIsToday = isToday(day);

            return (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                className={cn(
                  'min-h-[120px] p-2 border-b border-r border-white/[0.06]',
                  'transition-colors cursor-pointer',
                  !isCurrentMonth && 'bg-white/[0.01]',
                  isCurrentMonth && 'hover:bg-white/[0.03]',
                  isSelected && 'bg-violet-500/10',
                  // Última coluna sem borda direita
                  (index + 1) % 7 === 0 && 'border-r-0'
                )}
              >
                {/* Número do dia */}
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={cn(
                      'w-7 h-7 flex items-center justify-center rounded-full text-sm',
                      !isCurrentMonth && 'text-zinc-600',
                      isCurrentMonth && 'text-zinc-300',
                      dayIsToday && 'bg-violet-500 text-white font-medium'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-xs text-zinc-500">{dayEvents.length}</span>
                  )}
                </div>

                {/* Eventos do dia */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <CalendarEventCard
                      key={event.id}
                      event={event}
                      compact
                      onClick={onEventClick}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-zinc-500 text-center">
                      +{dayEvents.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { CalendarGrid };
export type { CalendarGridProps };
