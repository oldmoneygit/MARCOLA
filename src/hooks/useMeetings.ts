/**
 * @file useMeetings.ts
 * @description Hook para gerenciamento de reuniões
 * @module hooks
 *
 * @example
 * const { meetings, stats, loading, createMeeting, updateMeeting } = useMeetings();
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

import type {
  Meeting,
  MeetingWithDisplay,
  CreateMeetingDTO,
  UpdateMeetingDTO,
  MeetingFilters,
  MeetingStats,
} from '@/types/meetings';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Formata reunião com campos de display
 */
function formatMeetingForDisplay(meeting: Meeting): MeetingWithDisplay {
  const meetingDate = new Date(meeting.date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const daysUntil = Math.ceil((meetingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const displayDate = meetingDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const displayTime = meeting.time.substring(0, 5); // HH:MM

  return {
    ...meeting,
    displayDate,
    displayTime,
    displayDateTime: `${displayDate} às ${displayTime}`,
    isToday: meetingDate.getTime() === today.getTime(),
    isTomorrow: meetingDate.getTime() === tomorrow.getTime(),
    isPast: meetingDate < today,
    isUpcoming: meetingDate >= today,
    daysUntil,
  };
}

// ═══════════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════════

interface UseMeetingsOptions {
  /** Carregar automaticamente ao montar (default: true) */
  autoLoad?: boolean;
  /** Filtros iniciais */
  initialFilters?: MeetingFilters;
}

export function useMeetings(options: UseMeetingsOptions = {}) {
  const { autoLoad = true, initialFilters = {} } = options;

  // Estados
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MeetingFilters>(initialFilters);

  // ═══════════════════════════════════════════════════════════════
  // FETCH FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Busca reuniões com filtros
   */
  const fetchMeetings = useCallback(async (customFilters?: MeetingFilters) => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters = customFilters || filters;
      const params = new URLSearchParams();

      if (currentFilters.client_id) { params.set('client_id', currentFilters.client_id); }
      if (currentFilters.status) { params.set('status', currentFilters.status); }
      if (currentFilters.type) { params.set('type', currentFilters.type); }
      if (currentFilters.start_date) { params.set('start_date', currentFilters.start_date); }
      if (currentFilters.end_date) { params.set('end_date', currentFilters.end_date); }
      if (currentFilters.upcoming_only) { params.set('upcoming_only', 'true'); }
      if (currentFilters.search) { params.set('search', currentFilters.search); }

      const url = `/api/meetings${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar reuniões');
      }

      setMeetings(data.meetings);
      return data.meetings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('[useMeetings] Erro ao buscar:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Busca estatísticas
   */
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);

      const response = await fetch('/api/meetings/stats');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar estatísticas');
      }

      setStats(data.stats);
      return data.stats;
    } catch (err) {
      console.error('[useMeetings] Erro ao buscar stats:', err);
      return null;
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Cria nova reunião
   */
  const createMeeting = useCallback(async (data: CreateMeetingDTO): Promise<Meeting | null> => {
    try {
      setError(null);

      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar reunião');
      }

      // Atualizar lista localmente
      setMeetings(prev => [...prev, result.meeting].sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateA.getTime() - dateB.getTime();
      }));

      // Atualizar stats
      fetchStats();

      return result.meeting;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar reunião';
      setError(message);
      console.error('[useMeetings] Erro ao criar:', err);
      return null;
    }
  }, [fetchStats]);

  /**
   * Atualiza reunião
   */
  const updateMeeting = useCallback(async (
    id: string,
    data: UpdateMeetingDTO
  ): Promise<Meeting | null> => {
    try {
      setError(null);

      const response = await fetch(`/api/meetings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar reunião');
      }

      // Atualizar lista localmente
      setMeetings(prev => prev.map(m => (m.id === id ? result.meeting : m)));

      // Atualizar stats se mudou o status
      if (data.status) {
        fetchStats();
      }

      return result.meeting;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar reunião';
      setError(message);
      console.error('[useMeetings] Erro ao atualizar:', err);
      return null;
    }
  }, [fetchStats]);

  /**
   * Deleta reunião
   */
  const deleteMeeting = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erro ao deletar reunião');
      }

      // Remover da lista localmente
      setMeetings(prev => prev.filter(m => m.id !== id));

      // Atualizar stats
      fetchStats();

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar reunião';
      setError(message);
      console.error('[useMeetings] Erro ao deletar:', err);
      return false;
    }
  }, [fetchStats]);

  /**
   * Atualiza status da reunião
   */
  const updateStatus = useCallback(async (
    id: string,
    status: Meeting['status']
  ): Promise<boolean> => {
    const result = await updateMeeting(id, { status });
    return result !== null;
  }, [updateMeeting]);

  // ═══════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════

  /** Reuniões com campos formatados para display */
  const meetingsWithDisplay = useMemo(() =>
    meetings.map(formatMeetingForDisplay),
    [meetings]
  );

  /** Próximas reuniões (hoje e futuras) */
  const upcomingMeetings = useMemo(() =>
    meetingsWithDisplay.filter(m =>
      m.isUpcoming &&
      m.status !== 'cancelled' &&
      m.status !== 'completed'
    ),
    [meetingsWithDisplay]
  );

  /** Reuniões de hoje */
  const todayMeetings = useMemo(() =>
    meetingsWithDisplay.filter(m => m.isToday),
    [meetingsWithDisplay]
  );

  /** Reuniões agrupadas por data */
  const meetingsByDate = useMemo(() => {
    const grouped: Record<string, MeetingWithDisplay[]> = {};
    meetingsWithDisplay.forEach(meeting => {
      if (!grouped[meeting.date]) {
        grouped[meeting.date] = [];
      }
      grouped[meeting.date]!.push(meeting);
    });
    return grouped;
  }, [meetingsWithDisplay]);

  // ═══════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════

  // Carregar dados iniciais
  useEffect(() => {
    if (autoLoad) {
      fetchMeetings();
      fetchStats();
    }
  }, [autoLoad, fetchMeetings, fetchStats]);

  // ═══════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════

  return {
    // Estado
    meetings,
    meetingsWithDisplay,
    stats,
    loading,
    statsLoading,
    error,
    filters,

    // Computed
    upcomingMeetings,
    todayMeetings,
    meetingsByDate,

    // Ações
    fetchMeetings,
    fetchStats,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    updateStatus,
    setFilters,

    // Helpers
    refresh: () => {
      fetchMeetings();
      fetchStats();
    },
    clearError: () => setError(null),
  };
}

// ═══════════════════════════════════════════════════════════════
// HOOK SIMPLIFICADO - Apenas próximas reuniões
// ═══════════════════════════════════════════════════════════════

/**
 * Hook simplificado para exibir próximas reuniões
 * Útil para widgets e dashboards
 */
export function useUpcomingMeetings(limit = 5) {
  const { upcomingMeetings, loading, error, refresh } = useMeetings({
    initialFilters: { upcoming_only: true },
  });

  const limitedMeetings = useMemo(() =>
    upcomingMeetings.slice(0, limit),
    [upcomingMeetings, limit]
  );

  return {
    meetings: limitedMeetings,
    loading,
    error,
    refresh,
  };
}

export default useMeetings;
