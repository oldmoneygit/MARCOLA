/**
 * @file MeetingsPageContent.tsx
 * @description Componente principal da página de reuniões
 * @module components/meetings
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Calendar,
  RefreshCw,
} from 'lucide-react';

import { useMeetings } from '@/hooks/useMeetings';
import { MeetingCard } from './MeetingCard';
import { MeetingModal } from './MeetingModal';
import { MeetingStats } from './MeetingStats';
import type { Meeting, MeetingWithDisplay, MeetingStatus, MeetingType, CreateMeetingDTO } from '@/types/meetings';
import { MEETING_STATUS_CONFIG, MEETING_TYPE_CONFIG } from '@/types/meetings';

interface Client {
  id: string;
  name: string;
}

interface MeetingsPageContentProps {
  clients?: Client[];
}

export function MeetingsPageContent({ clients = [] }: MeetingsPageContentProps) {
  // Estado do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingWithDisplay | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<MeetingType | ''>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Hook de reuniões
  const {
    meetingsWithDisplay,
    stats,
    loading,
    error,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    refresh,
  } = useMeetings();

  // Filtrar reuniões
  const filteredMeetings = useMemo(() => {
    let result = [...meetingsWithDisplay];

    // Busca por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title?.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query) ||
          m.client?.name?.toLowerCase().includes(query)
      );
    }

    // Filtro por status
    if (statusFilter) {
      result = result.filter((m) => m.status === statusFilter);
    }

    // Filtro por tipo
    if (typeFilter) {
      result = result.filter((m) => m.type === typeFilter);
    }

    // Filtro por data
    if (selectedDate) {
      result = result.filter((m) => m.date === selectedDate);
    }

    return result;
  }, [meetingsWithDisplay, searchQuery, statusFilter, typeFilter, selectedDate]);

  // Agrupar por data
  const meetingsByDate = useMemo(() => {
    const groups: Record<string, MeetingWithDisplay[]> = {};

    filteredMeetings.forEach((meeting) => {
      if (!groups[meeting.date]) {
        groups[meeting.date] = [];
      }
      groups[meeting.date]!.push(meeting);
    });

    // Ordenar cada grupo por horário
    Object.keys(groups).forEach((date) => {
      groups[date]!.sort((a, b) => a.time.localeCompare(b.time));
    });

    // Ordenar datas
    const sortedDates = Object.keys(groups).sort();
    const sortedGroups: Record<string, MeetingWithDisplay[]> = {};
    sortedDates.forEach((date) => {
      sortedGroups[date] = groups[date]!;
    });

    return sortedGroups;
  }, [filteredMeetings]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingMeeting(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (meeting: MeetingWithDisplay) => {
    setEditingMeeting(meeting);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMeeting(null);
  };

  const handleSave = async (data: CreateMeetingDTO): Promise<Meeting | null> => {
    if (editingMeeting) {
      return updateMeeting(editingMeeting.id, data);
    }
    return createMeeting(data);
  };

  const handleStatusChange = async (meeting: MeetingWithDisplay, status: MeetingStatus) => {
    await updateMeeting(meeting.id, { status });
  };

  const handleDelete = async (meeting: MeetingWithDisplay) => {
    if (confirm('Tem certeza que deseja excluir esta reunião?')) {
      await deleteMeeting(meeting.id);
    }
  };

  const formatDateHeader = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) {
      return 'Hoje';
    }
    if (date.getTime() === tomorrow.getTime()) {
      return 'Amanhã';
    }

    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setTypeFilter('');
    setSelectedDate('');
  };

  const hasActiveFilters = searchQuery || statusFilter || typeFilter || selectedDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
              <Calendar className="w-6 h-6 text-cyan-400" />
            </div>
            Reuniões
          </h1>
          <p className="text-zinc-400 mt-1">
            Gerencie suas reuniões e alinhamentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2.5 backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            title="Atualizar"
          >
            <RefreshCw className={`w-5 h-5 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nova Reunião</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <MeetingStats stats={stats} loading={loading} />

      {/* Filtros */}
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar reuniões..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
            />
          </div>

          {/* Filtros em linha */}
          <div className="flex flex-wrap gap-2">
            {/* Data */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
            />

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MeetingStatus | '')}
              className="px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
            >
              <option value="">Todos os status</option>
              {Object.entries(MEETING_STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>

            {/* Tipo */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as MeetingType | '')}
              className="px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
            >
              <option value="">Todos os tipos</option>
              {Object.entries(MEETING_TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>

            {/* Limpar filtros */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2.5 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Lista de Reuniões */}
      {loading && meetingsWithDisplay.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 animate-pulse"
            >
              <div className="h-6 w-48 bg-white/[0.05] rounded mb-3" />
              <div className="h-4 w-32 bg-white/[0.05] rounded mb-2" />
              <div className="h-4 w-64 bg-white/[0.05] rounded" />
            </div>
          ))}
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.03] flex items-center justify-center">
            <Calendar className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-medium text-zinc-400 mb-2">
            {hasActiveFilters ? 'Nenhuma reunião encontrada' : 'Nenhuma reunião agendada'}
          </h3>
          <p className="text-zinc-500 mb-4">
            {hasActiveFilters
              ? 'Tente ajustar os filtros'
              : 'Comece agendando sua primeira reunião'}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agendar Reunião
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(meetingsByDate).map(([date, dateMeetings]) => (
            <div key={date}>
              {/* Header da data */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span className="text-sm font-medium text-zinc-400 capitalize">
                  {formatDateHeader(date)}
                </span>
                <span className="text-xs text-zinc-600">
                  {dateMeetings.length} reunião(ões)
                </span>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>

              {/* Cards das reuniões */}
              <div className="space-y-3">
                {dateMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <MeetingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        meeting={editingMeeting}
        clients={clients}
      />
    </div>
  );
}
