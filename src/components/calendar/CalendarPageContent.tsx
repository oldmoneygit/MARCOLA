/**
 * @file CalendarPageContent.tsx
 * @description Conteúdo da página de calendário de conteúdo
 * @module components/calendar
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, GlassCard, Modal, Skeleton } from '@/components/ui';
import { CalendarGrid } from './CalendarGrid';
import { CalendarEventForm } from './CalendarEventForm';

import { useCalendar, useClients } from '@/hooks';

import type { CalendarEvent, CreateCalendarEventDTO, ContentType, ContentStatus } from '@/types';

interface ClientOption {
  id: string;
  name: string;
}

const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; icon: string; color: string }> = {
  post: { label: 'Post', icon: '📱', color: 'bg-blue-500' },
  video: { label: 'Vídeo', icon: '🎥', color: 'bg-red-500' },
  reels: { label: 'Reels', icon: '🎬', color: 'bg-purple-500' },
  stories: { label: 'Stories', icon: '📷', color: 'bg-pink-500' },
  promo: { label: 'Promoção', icon: '🏷️', color: 'bg-amber-500' },
  campaign: { label: 'Campanha', icon: '📢', color: 'bg-green-500' },
  event: { label: 'Evento', icon: '🗓️', color: 'bg-cyan-500' },
  other: { label: 'Outro', icon: '📌', color: 'bg-zinc-500' },
};

const STATUS_CONFIG: Record<ContentStatus, { label: string; color: string }> = {
  planned: { label: 'Planejado', color: 'text-zinc-400' },
  creating: { label: 'Criando', color: 'text-yellow-400' },
  review: { label: 'Em revisão', color: 'text-blue-400' },
  approved: { label: 'Aprovado', color: 'text-emerald-400' },
  published: { label: 'Publicado', color: 'text-green-400' },
  cancelled: { label: 'Cancelado', color: 'text-red-400' },
};

/**
 * Componente principal da página de calendário
 */
export function CalendarPageContent() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { events, loading, createEvent, updateEvent, deleteEvent } = useCalendar({
    startDate: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
  });
  const { clients } = useClients();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [formLoading, setFormLoading] = useState(false);
  const [filterType, setFilterType] = useState<ContentType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ContentStatus | 'all'>('all');

  const clientOptions: ClientOption[] = useMemo(() => {
    return clients.map(c => ({ id: c.id, name: c.name }));
  }, [clients]);

  /**
   * Filtra eventos
   */
  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => e.status === filterStatus);
    }

    return filtered;
  }, [events, filterType, filterStatus]);

  /**
   * Estatísticas do mês
   */
  const monthStats = useMemo(() => {
    const byType: Record<ContentType, number> = {
      post: 0, video: 0, reels: 0, stories: 0,
      promo: 0, campaign: 0, event: 0, other: 0,
    };

    const byStatus: Record<ContentStatus, number> = {
      planned: 0, creating: 0, review: 0, approved: 0, published: 0, cancelled: 0,
    };

    events.forEach(e => {
      byType[e.type]++;
      byStatus[e.status]++;
    });

    return { byType, byStatus, total: events.length };
  }, [events]);

  const handleMonthChange = useCallback((date: Date) => {
    setCurrentMonth(date);
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    setShowCreateModal(true);
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
  }, []);

  const handleCreateEvent = useCallback(async (data: CreateCalendarEventDTO) => {
    setFormLoading(true);
    try {
      await createEvent(data);
      setShowCreateModal(false);
      setSelectedClientId('');
      setSelectedDate('');
    } catch (err) {
      console.error('[CalendarPageContent] Error creating event:', err);
    } finally {
      setFormLoading(false);
    }
  }, [createEvent]);

  const handleUpdateEvent = useCallback(async (data: CreateCalendarEventDTO) => {
    if (!editingEvent) { return; }

    setFormLoading(true);
    try {
      await updateEvent(editingEvent.id, data);
      setEditingEvent(null);
    } catch (err) {
      console.error('[CalendarPageContent] Error updating event:', err);
    } finally {
      setFormLoading(false);
    }
  }, [editingEvent, updateEvent]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setEditingEvent(null);
    } catch (err) {
      console.error('[CalendarPageContent] Error deleting event:', err);
    }
  }, [deleteEvent]);

  const handleStatusChange = useCallback(async (eventId: string, newStatus: ContentStatus) => {
    try {
      await updateEvent(eventId, { status: newStatus });
    } catch (err) {
      console.error('[CalendarPageContent] Error updating event status:', err);
    }
  }, [updateEvent]);

  // Loading state
  if (loading) {
    return (
      <DashboardLayout title="Calendário" subtitle="Planeje e gerencie seu conteúdo">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <GlassCard>
              <div className="h-96 animate-pulse bg-white/[0.03] rounded-lg" />
            </GlassCard>
          </div>
          <div>
            <Skeleton.Card />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Calendário"
      subtitle="Planeje e gerencie seu conteúdo"
      headerActions={
        <Button onClick={() => setShowCreateModal(true)}>
          Novo Conteúdo
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendário Principal */}
        <div className="lg:col-span-3">
          <GlassCard>
            <CalendarGrid
              events={filteredEvents}
              initialDate={currentMonth}
              onMonthChange={handleMonthChange}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
              onStatusChange={handleStatusChange}
            />
          </GlassCard>
        </div>

        {/* Sidebar - Filtros e Estatísticas */}
        <div className="space-y-6">
          {/* Filtros */}
          <GlassCard>
            <h3 className="text-sm font-medium text-white mb-4">Filtros</h3>

            {/* Filtro por tipo */}
            <div className="mb-4">
              <label className="block text-xs text-zinc-500 mb-2">Tipo de Conteúdo</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as ContentType | 'all')}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-violet-500/50"
              >
                <option value="all">Todos</option>
                {Object.entries(CONTENT_TYPE_CONFIG).map(([type, config]) => (
                  <option key={type} value={type}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por status */}
            <div>
              <label className="block text-xs text-zinc-500 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as ContentStatus | 'all')}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-violet-500/50"
              >
                <option value="all">Todos</option>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <option key={status} value={status}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </GlassCard>

          {/* Estatísticas do mês */}
          <GlassCard>
            <h3 className="text-sm font-medium text-white mb-4">
              {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </h3>

            <div className="text-center py-2 mb-4">
              <span className="text-3xl font-bold text-white">{monthStats.total}</span>
              <p className="text-xs text-zinc-500">conteúdos planejados</p>
            </div>

            {/* Por status */}
            <div className="space-y-2 mb-4">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const count = monthStats.byStatus[status as ContentStatus];
                if (count === 0) { return null; }
                return (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className={config.color}>{config.label}</span>
                    <span className="text-zinc-400">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Por tipo */}
            <div className="pt-4 border-t border-white/[0.06]">
              <p className="text-xs text-zinc-500 mb-2">Por tipo</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(CONTENT_TYPE_CONFIG).map(([type, config]) => {
                  const count = monthStats.byType[type as ContentType];
                  if (count === 0) { return null; }
                  return (
                    <span
                      key={type}
                      className={`px-2 py-1 text-xs rounded-full ${config.color} bg-opacity-20 text-white`}
                      title={config.label}
                    >
                      {config.icon} {count}
                    </span>
                  );
                })}
              </div>
            </div>
          </GlassCard>

          {/* Legenda */}
          <GlassCard>
            <h3 className="text-sm font-medium text-white mb-3">Legenda</h3>
            <div className="space-y-2">
              {Object.entries(CONTENT_TYPE_CONFIG).slice(0, 6).map(([type, config]) => (
                <div key={type} className="flex items-center gap-2 text-xs">
                  <span className={`w-3 h-3 rounded ${config.color}`} />
                  <span className="text-zinc-400">{config.label}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Modal de criação */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedClientId('');
          setSelectedDate('');
        }}
        title="Novo Conteúdo"
        size="lg"
      >
        {/* Seleção de cliente */}
        {!selectedClientId ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">Selecione o cliente:</p>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {clientOptions.length === 0 ? (
                <p className="text-center text-zinc-500 py-8">
                  Nenhum cliente encontrado. Cadastre um cliente primeiro.
                </p>
              ) : (
                clientOptions.map(client => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setSelectedClientId(client.id)}
                    className="w-full p-3 text-left rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-violet-500/30 transition-colors"
                  >
                    <span className="text-white">{client.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <CalendarEventForm
            clientId={selectedClientId}
            selectedDate={selectedDate || undefined}
            onSubmit={handleCreateEvent}
            onCancel={() => {
              setShowCreateModal(false);
              setSelectedClientId('');
              setSelectedDate('');
            }}
            loading={formLoading}
          />
        )}
      </Modal>

      {/* Modal de edição */}
      <Modal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        title="Editar Conteúdo"
        size="lg"
      >
        {editingEvent && (
          <div>
            <CalendarEventForm
              event={editingEvent}
              onSubmit={handleUpdateEvent}
              onCancel={() => setEditingEvent(null)}
              loading={formLoading}
            />
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <Button
                variant="danger"
                onClick={() => handleDeleteEvent(editingEvent.id)}
                className="w-full"
              >
                Excluir Conteúdo
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
