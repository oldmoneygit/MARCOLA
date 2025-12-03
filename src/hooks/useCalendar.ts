/**
 * @file useCalendar.ts
 * @description Hook para gerenciamento do calendário de conteúdo
 * @module hooks
 *
 * @example
 * const { events, createEvent } = useCalendar({ clientId: '...' });
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  CalendarEvent,
  ContentStatus,
  ContentType,
  CreateCalendarEventDTO,
  UpdateCalendarEventDTO,
} from '@/types';

interface UseCalendarOptions {
  /** ID do cliente para filtrar eventos */
  clientId?: string;
  /** Data inicial do período */
  startDate?: string;
  /** Data final do período */
  endDate?: string;
  /** Busca automática ao montar */
  autoFetch?: boolean;
}

interface UseCalendarState {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
}

interface UseCalendarReturn extends UseCalendarState {
  /** Busca eventos */
  fetchEvents: (options?: { startDate?: string; endDate?: string }) => Promise<void>;
  /** Busca um evento específico */
  getEvent: (id: string) => CalendarEvent | undefined;
  /** Cria um novo evento */
  createEvent: (data: CreateCalendarEventDTO) => Promise<CalendarEvent>;
  /** Atualiza um evento */
  updateEvent: (id: string, data: UpdateCalendarEventDTO) => Promise<CalendarEvent>;
  /** Deleta um evento */
  deleteEvent: (id: string) => Promise<void>;
  /** Atualiza o status de um evento */
  updateStatus: (id: string, status: ContentStatus) => Promise<void>;
  /** Eventos por data */
  eventsByDate: Map<string, CalendarEvent[]>;
  /** Eventos por tipo */
  eventsByType: (type: ContentType) => CalendarEvent[];
  /** Eventos por status */
  eventsByStatus: (status: ContentStatus) => CalendarEvent[];
  /** Total de eventos */
  totalEvents: number;
}

/**
 * Hook para gerenciamento do calendário de conteúdo
 */
export function useCalendar(options: UseCalendarOptions = {}): UseCalendarReturn {
  const { clientId, startDate, endDate, autoFetch = true } = options;

  const [state, setState] = useState<UseCalendarState>({
    events: [],
    loading: true,
    error: null,
  });

  /**
   * Busca eventos da API
   */
  const fetchEvents = useCallback(
    async (fetchOptions?: { startDate?: string; endDate?: string }) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const params = new URLSearchParams();
        if (clientId) {
          params.append('client_id', clientId);
        }
        if (fetchOptions?.startDate || startDate) {
          params.append('start_date', fetchOptions?.startDate || startDate || '');
        }
        if (fetchOptions?.endDate || endDate) {
          params.append('end_date', fetchOptions?.endDate || endDate || '');
        }

        const url = `/api/calendar${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Erro ao buscar eventos');
        }

        const data = await response.json();
        setState({ events: data, loading: false, error: null });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao buscar eventos';
        console.error('[useCalendar] fetchEvents error:', err);
        setState((prev) => ({ ...prev, loading: false, error: message }));
      }
    },
    [clientId, startDate, endDate]
  );

  /**
   * Busca um evento específico pelo ID
   */
  const getEvent = useCallback(
    (id: string) => {
      return state.events.find((event) => event.id === id);
    },
    [state.events]
  );

  /**
   * Cria um novo evento
   */
  const createEvent = useCallback(
    async (data: CreateCalendarEventDTO): Promise<CalendarEvent> => {
      try {
        const response = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar evento');
        }

        const newEvent = await response.json();

        setState((prev) => ({
          ...prev,
          events: [...prev.events, newEvent].sort(
            (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
          ),
        }));

        return newEvent;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao criar evento';
        console.error('[useCalendar] createEvent error:', err);
        throw new Error(message);
      }
    },
    []
  );

  /**
   * Atualiza um evento
   */
  const updateEvent = useCallback(
    async (id: string, data: UpdateCalendarEventDTO): Promise<CalendarEvent> => {
      try {
        const response = await fetch(`/api/calendar/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar evento');
        }

        const updatedEvent = await response.json();

        setState((prev) => ({
          ...prev,
          events: prev.events
            .map((e) => (e.id === id ? updatedEvent : e))
            .sort(
              (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
            ),
        }));

        return updatedEvent;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar evento';
        console.error('[useCalendar] updateEvent error:', err);
        throw new Error(message);
      }
    },
    []
  );

  /**
   * Deleta um evento
   */
  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/calendar/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar evento');
      }

      setState((prev) => ({
        ...prev,
        events: prev.events.filter((e) => e.id !== id),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar evento';
      console.error('[useCalendar] deleteEvent error:', err);
      throw new Error(message);
    }
  }, []);

  /**
   * Atualiza o status de um evento
   */
  const updateStatus = useCallback(
    async (id: string, status: ContentStatus): Promise<void> => {
      await updateEvent(id, { status });
    },
    [updateEvent]
  );

  // Computed values
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    state.events.forEach((event) => {
      const date = event.scheduled_date;
      const existing = map.get(date) || [];
      map.set(date, [...existing, event]);
    });
    return map;
  }, [state.events]);

  const eventsByType = useCallback(
    (type: ContentType) => {
      return state.events.filter((e) => e.type === type);
    },
    [state.events]
  );

  const eventsByStatus = useCallback(
    (status: ContentStatus) => {
      return state.events.filter((e) => e.status === status);
    },
    [state.events]
  );

  const totalEvents = state.events.length;

  // Fetch inicial
  useEffect(() => {
    if (autoFetch) {
      fetchEvents();
    }
  }, [fetchEvents, autoFetch]);

  return {
    ...state,
    fetchEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    updateStatus,
    eventsByDate,
    eventsByType,
    eventsByStatus,
    totalEvents,
  };
}
