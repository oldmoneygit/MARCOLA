/**
 * @file ClientDetailContent.tsx
 * @description Conteúdo da página de detalhes do cliente com abas
 * @module components/clients
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button, GlassCard, StatusBadge, Modal, Icon } from '@/components/ui';
import { CLIENT_STATUS, MEETING_FREQUENCIES, ROUTES, SEGMENTS, CAPTATION_FREQUENCIES, VIDEO_QUANTITY_RANGES, WEEK_DAYS } from '@/lib/constants';
import { cn, formatCurrency, formatPhone } from '@/lib/utils';

import { TaskList, TaskForm, NoteCard, NoteForm } from '@/components/tasks';
import { CalendarGrid, CalendarEventForm } from '@/components/calendar';
import { BriefingDisplay } from '@/components/clients/BriefingDisplay';
import {
  IntelligenceCard,
  ExecutiveSummaryCard,
  ContentSuggestionsGrid,
  SeasonalOffersCarousel,
  IntelligenceLoadingSkeleton,
} from '@/components/intelligence';

import { useTasks, useClientNotes, useCalendar, useClientIntelligence } from '@/hooks';

import type { Client, Report, Payment, Task, ClientNote, CalendarEvent, CreateTaskDTO, CreateCalendarEventDTO, TaskStatus } from '@/types';

interface ClientDetailContentProps {
  clientId: string;
}

type Tab = 'overview' | 'briefing' | 'intelligence' | 'tasks' | 'calendar' | 'notes';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Visão Geral', icon: 'dashboard' },
  { id: 'briefing', label: 'Briefing', icon: 'filetext' },
  { id: 'intelligence', label: 'Inteligência', icon: 'bot' },
  { id: 'tasks', label: 'Tarefas', icon: 'checksquare' },
  { id: 'calendar', label: 'Cronograma', icon: 'calendar' },
  { id: 'notes', label: 'Notas', icon: 'filetext' },
];

/**
 * Conteúdo da página de detalhes do cliente com abas
 */
export function ClientDetailContent({ clientId }: ClientDetailContentProps) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Estados para modais
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [editingNote, setEditingNote] = useState<ClientNote | undefined>();
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>();
  const [selectedDate, setSelectedDate] = useState<string | undefined>();

  // Hooks para dados
  const {
    tasks,
    loading: tasksLoading,
    createTask,
    updateTask,
    deleteTask,
  } = useTasks({ clientId, autoFetch: activeTab === 'tasks' });

  const {
    notes,
    loading: notesLoading,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
  } = useClientNotes({ clientId, autoFetch: activeTab === 'notes' });

  const {
    events,
    loading: eventsLoading,
    createEvent,
    updateEvent,
    deleteEvent: _deleteEvent,
  } = useCalendar({ clientId, autoFetch: activeTab === 'calendar' });

  const {
    intelligence,
    loading: intelligenceLoading,
    generating: intelligenceGenerating,
    isStale: intelligenceIsStale,
    generate: generateIntelligence,
    regenerate: regenerateIntelligence,
  } = useClientIntelligence({ clientId, autoFetch: activeTab === 'intelligence' || activeTab === 'overview' });

  // Carregar dados do cliente
  useEffect(() => {
    async function loadClient() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/clients/${clientId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Cliente não encontrado');
            return;
          }
          throw new Error('Erro ao carregar cliente');
        }

        const data = await response.json();
        setClient(data);
      } catch (err) {
        console.error('[ClientDetail] Error loading client:', err);
        setError('Erro ao carregar dados do cliente');
      } finally {
        setLoading(false);
      }
    }

    loadClient();
  }, [clientId]);

  // Carregar relatórios do cliente
  useEffect(() => {
    async function loadReports() {
      try {
        const response = await fetch(`/api/reports?client_id=${clientId}`);
        if (response.ok) {
          const data = await response.json();
          setReports(data);
        }
      } catch (err) {
        console.error('[ClientDetail] Error loading reports:', err);
      }
    }

    if (clientId) {
      loadReports();
    }
  }, [clientId]);

  // Carregar pagamentos do cliente
  useEffect(() => {
    async function loadPayments() {
      try {
        const response = await fetch(`/api/payments?client_id=${clientId}`);
        if (response.ok) {
          const data = await response.json();
          setPayments(data);
        }
      } catch (err) {
        console.error('[ClientDetail] Error loading payments:', err);
      }
    }

    if (clientId) {
      loadPayments();
    }
  }, [clientId]);

  const handleBack = useCallback(() => {
    router.push(ROUTES.CLIENTS);
  }, [router]);

  // === Handlers de Tasks ===
  const handleCreateTask = useCallback(async (data: CreateTaskDTO) => {
    await createTask(data);
    setShowTaskModal(false);
    setEditingTask(undefined);
  }, [createTask]);

  const handleTaskClick = useCallback((task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  }, []);

  const handleTaskStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus });
  }, [updateTask]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await deleteTask(taskId);
  }, [deleteTask]);

  // === Handlers de Notes ===
  const handleCreateNote = useCallback(async (content: string, isPinned: boolean) => {
    if (editingNote) {
      await updateNote(editingNote.id, { content, is_pinned: isPinned });
    } else {
      await createNote(content, isPinned);
    }
    setShowNoteModal(false);
    setEditingNote(undefined);
  }, [createNote, updateNote, editingNote]);

  const handleEditNote = useCallback((note: ClientNote) => {
    setEditingNote(note);
    setShowNoteModal(true);
  }, []);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    await deleteNote(noteId);
  }, [deleteNote]);

  const handleTogglePin = useCallback(async (noteId: string, isPinned: boolean) => {
    await togglePin(noteId, isPinned);
  }, [togglePin]);

  // === Handlers de Calendar ===
  const handleCreateEvent = useCallback(async (data: CreateCalendarEventDTO) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
    } else {
      await createEvent(data);
    }
    setShowEventModal(false);
    setEditingEvent(undefined);
    setSelectedDate(undefined);
  }, [createEvent, updateEvent, editingEvent]);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setShowEventModal(true);
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    const dateStr = date.toISOString().substring(0, 10);
    setSelectedDate(dateStr);
    setEditingEvent(undefined);
    setShowEventModal(true);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-zinc-400">{error || 'Cliente não encontrado'}</p>
        <Button onClick={handleBack}>Voltar para Clientes</Button>
      </div>
    );
  }

  const statusConfig = CLIENT_STATUS[client.status];
  const segmentLabel = SEGMENTS.find((s) => s.value === client.segment)?.label || client.segment;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{client.name}</h1>
            <p className="text-zinc-400">{segmentLabel}</p>
          </div>
        </div>
        <StatusBadge status={client.status} label={statusConfig.label} />
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-violet-500/20 text-violet-400'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            <Icon name={tab.icon} size="sm" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === 'overview' && (
        <>
          {/* Briefing Completado - Destaque no topo */}
          {client.briefing_data && client.briefing_data.answers && client.briefing_data.answers.length > 0 && (
            <GlassCard className="border-violet-500/40 bg-violet-500/5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/20">
                    <Icon name="filetext" size="md" className="text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Briefing Completado</h3>
                    <p className="text-xs text-zinc-400">
                      {client.briefing_data.template_name}
                      {client.briefing_data.answered_at && (
                        <> • Preenchido em {new Date(client.briefing_data.answered_at).toLocaleDateString('pt-BR')}</>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('briefing')}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Ver completo →
                </button>
              </div>
              <BriefingDisplay briefingData={client.briefing_data} />
            </GlassCard>
          )}

          {/* Grid de informações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações principais */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="users" size="md" className="text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Informações do Cliente</h2>
          </div>

          {/* Seção de Contato */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
              <Icon name="users" size="xs" />
              Contato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs text-zinc-500 mb-1">Nome</p>
                <p className="text-sm text-white font-medium">{client.contact_name || '-'}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs text-zinc-500 mb-1">Email</p>
                <p className="text-sm text-white">{client.contact_email || '-'}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs text-zinc-500 mb-1">Telefone</p>
                <p className="text-sm text-white">{client.contact_phone ? formatPhone(client.contact_phone) : '-'}</p>
              </div>
            </div>
          </div>

          {/* Seção Financeiro */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
              <Icon name="wallet" size="xs" />
              Financeiro
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-emerald-400 mb-1">Valor Mensal</p>
                <p className="text-base text-white font-semibold">{formatCurrency(client.monthly_value)}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs text-zinc-500 mb-1">Ticket Médio</p>
                <p className="text-sm text-white">{client.average_ticket ? formatCurrency(client.average_ticket) : '-'}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs text-zinc-500 mb-1">Vencimento</p>
                <p className="text-sm text-white font-medium">Dia {client.due_day}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs text-zinc-500 mb-1">Cidade</p>
                <p className="text-sm text-white">{client.city || '-'}</p>
              </div>
            </div>
          </div>

          {/* Seção de Informações Gerais */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
              <Icon name="info" size="xs" />
              Informações Gerais
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs text-zinc-500 mb-1">Segmento</p>
                <p className="text-sm text-white">{segmentLabel}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs text-zinc-500 mb-1">Frequência de Reuniões</p>
                <p className="text-sm text-white">
                  {client.meeting_frequency
                    ? MEETING_FREQUENCIES.find((f) => f.value === client.meeting_frequency)?.label || '-'
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Redes Sociais */}
          {(client.instagram_url || client.facebook_page_id) && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <Icon name="instagram" size="xs" />
                Redes Sociais
              </h3>
              <div className="flex gap-3">
                {client.instagram_url && (
                  <a
                    href={client.instagram_url.startsWith('http') ? client.instagram_url : `https://instagram.com/${client.instagram_url.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-purple-400 hover:from-purple-500/20 hover:to-pink-500/20 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    {client.instagram_url.replace('https://instagram.com/', '@').replace('https://www.instagram.com/', '@')}
                  </a>
                )}
                {client.facebook_page_id && (
                  <span className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    FB: {client.facebook_page_id}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Estratégia */}
          {(client.peak_hours || client.differentials || client.ideal_customer || client.goals_short_term || client.goals_long_term) && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <Icon name="lightbulb" size="xs" />
                Estratégia & Metas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.peak_hours && (
                  <div className="p-3 rounded-lg bg-white/[0.02]">
                    <p className="text-xs text-zinc-500 mb-1">Horários de Pico</p>
                    <p className="text-sm text-white">{client.peak_hours}</p>
                  </div>
                )}
                {client.differentials && (
                  <div className="p-3 rounded-lg bg-white/[0.02]">
                    <p className="text-xs text-zinc-500 mb-1">Diferenciais</p>
                    <p className="text-sm text-white">{client.differentials}</p>
                  </div>
                )}
                {client.ideal_customer && (
                  <div className="p-3 rounded-lg bg-white/[0.02] md:col-span-2">
                    <p className="text-xs text-zinc-500 mb-1">Cliente Ideal (ICP)</p>
                    <p className="text-sm text-white">{client.ideal_customer}</p>
                  </div>
                )}
                {client.goals_short_term && (
                  <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                    <p className="text-xs text-violet-400 mb-1">Metas Curto Prazo</p>
                    <p className="text-sm text-white">{client.goals_short_term}</p>
                  </div>
                )}
                {client.goals_long_term && (
                  <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                    <p className="text-xs text-indigo-400 mb-1">Metas Longo Prazo</p>
                    <p className="text-sm text-white">{client.goals_long_term}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estratégia de Produção de Conteúdo Paga */}
          {client.content_request && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                <Icon name="filetext" size="xs" />
                Estratégia de Produção de Conteúdo Paga
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{client.content_request}</p>
            </div>
          )}

          {/* Estratégia de Produção de Conteúdo Orgânica */}
          {client.organic_content_strategy && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                <Icon name="filetext" size="xs" />
                Estratégia de Produção de Conteúdo Orgânica
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{client.organic_content_strategy}</p>
            </div>
          )}

          {/* Links */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
              <Icon name="search" size="xs" />
              Links Rápidos
            </h3>
            <div className="flex flex-wrap gap-3">
              {client.ads_account_url && (
                <a
                  href={client.ads_account_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Conta de Anúncios
                </a>
              )}
              {client.website_url && (
                <a
                  href={client.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Website
                </a>
              )}
              {client.menu_url && (
                <a
                  href={client.menu_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Cardápio/Catálogo
                </a>
              )}
              {client.drive_url && (
                <a
                  href={client.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Google Drive
                </a>
              )}
              {!client.ads_account_url && !client.website_url && !client.drive_url && !client.menu_url && (
                <span className="text-zinc-500 text-sm">Nenhum link cadastrado</span>
              )}
            </div>
          </div>

          {/* Autorização de Imagem */}
          {client.image_authorization !== null && (
            <div className="mt-4 flex items-center gap-2">
              {client.image_authorization ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 px-2 py-1 rounded-full bg-emerald-500/10">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Autorização de imagem concedida
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber-400 px-2 py-1 rounded-full bg-amber-500/10">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                  </svg>
                  Sem autorização de imagem
                </span>
              )}
            </div>
          )}
        </GlassCard>

        {/* Métricas rápidas */}
        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="barchart3" size="sm" className="text-blue-400" />
              <h3 className="text-sm font-medium text-zinc-400">Relatórios</h3>
            </div>
            <p className="text-3xl font-bold text-white">{reports.length}</p>
            <p className="text-xs text-zinc-500 mt-1">relatórios importados</p>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="wallet" size="sm" className="text-emerald-400" />
              <h3 className="text-sm font-medium text-zinc-400">Pagamentos</h3>
            </div>
            <p className="text-3xl font-bold text-white">{payments.filter(p => p.status === 'paid').length}</p>
            <p className="text-xs text-zinc-500 mt-1">de {payments.length} pagamentos</p>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="check-circle" size="sm" className="text-emerald-400" />
              <h3 className="text-sm font-medium text-zinc-400">Total Recebido</h3>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {formatCurrency(payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0))}
            </p>
          </GlassCard>
        </div>
      </div>

      {/* Relatórios recentes */}
      {reports.length > 0 && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Relatórios Recentes</h2>
            <Link href={ROUTES.REPORTS} className="text-sm text-violet-400 hover:text-violet-300">
              Ver todos
            </Link>
          </div>

          <div className="space-y-3">
            {reports.slice(0, 5).map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
              >
                <div>
                  <p className="text-sm text-white">
                    {new Date(report.period_start).toLocaleDateString('pt-BR')} -{' '}
                    {new Date(report.period_end).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-zinc-500">{report.source || 'Manual'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{formatCurrency(Number(report.total_spend))}</p>
                  <p className="text-xs text-zinc-500">{report.total_conversions} conversões</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Histórico de pagamentos */}
      {payments.length > 0 && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Histórico de Pagamentos</h2>
            <Link href={ROUTES.FINANCIAL} className="text-sm text-violet-400 hover:text-violet-300">
              Ver todos
            </Link>
          </div>

          <div className="space-y-3">
            {payments.slice(0, 5).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
              >
                <div>
                  <p className="text-sm text-white">{payment.description}</p>
                  <p className="text-xs text-zinc-500">
                    Vencimento: {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{formatCurrency(Number(payment.amount))}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      payment.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : payment.status === 'overdue'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {payment.status === 'paid' ? 'Pago' : payment.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
        </>
      )}

      {/* Aba de Briefing */}
      {activeTab === 'briefing' && (
        <div className="space-y-6">
          <GlassCard>
            <BriefingDisplay briefingData={client.briefing_data} />
          </GlassCard>

          {/* Informações de Gestão */}
          <GlassCard>
            <h3 className="text-lg font-semibold text-white mb-4">Gestão & Produção</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-xs text-zinc-500 mb-1">Frequência de Reuniões</p>
                <p className="text-sm text-white">
                  {client.meeting_frequency
                    ? MEETING_FREQUENCIES.find((f) => f.value === client.meeting_frequency)?.label
                    : '-'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-xs text-zinc-500 mb-1">Frequência de Captações</p>
                <p className="text-sm text-white">
                  {client.captation_frequency
                    ? CAPTATION_FREQUENCIES.find((f) => f.value === client.captation_frequency)?.label
                    : '-'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-xs text-zinc-500 mb-1">Vídeos p/ Vendas</p>
                <p className="text-sm text-white">
                  {client.videos_sales
                    ? VIDEO_QUANTITY_RANGES.find((f) => f.value === client.videos_sales)?.label
                    : '-'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-xs text-zinc-500 mb-1">Vídeos p/ Reconhecimento</p>
                <p className="text-sm text-white">
                  {client.videos_awareness
                    ? VIDEO_QUANTITY_RANGES.find((f) => f.value === client.videos_awareness)?.label
                    : '-'}
                </p>
              </div>
              {client.fixed_meeting_enabled && client.fixed_meeting_day && (
                <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 md:col-span-2">
                  <p className="text-xs text-violet-400 mb-1">Reunião Fixa</p>
                  <p className="text-sm text-white">
                    {WEEK_DAYS.find((d) => d.value === client.fixed_meeting_day)?.label}
                    {client.fixed_meeting_time && ` às ${client.fixed_meeting_time}`}
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Aba de Inteligência */}
      {activeTab === 'intelligence' && (
        <div className="space-y-6">
          {intelligenceGenerating ? (
            <IntelligenceLoadingSkeleton
              message={`Analisando dados de ${client.name}...`}
            />
          ) : (
            <>
              {/* Card principal de inteligência */}
              <IntelligenceCard
                intelligence={intelligence}
                loading={intelligenceLoading}
                generating={intelligenceGenerating}
                isStale={intelligenceIsStale}
                onGenerate={intelligence ? regenerateIntelligence : generateIntelligence}
              />

              {/* Conteúdo da inteligência */}
              {intelligence && (
                <>
                  {/* Resumo Executivo */}
                  <ExecutiveSummaryCard
                    summary={intelligence.executive_summary}
                    lastUpdated={intelligence.last_generated_at}
                  />

                  {/* Sugestões de Conteúdo */}
                  <ContentSuggestionsGrid
                    suggestions={intelligence.content_suggestions || []}
                  />

                  {/* Ofertas Sazonais */}
                  <SeasonalOffersCarousel
                    offers={intelligence.seasonal_offers || []}
                  />
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Aba de Tarefas */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Tarefas do Cliente</h2>
            <Button
              onClick={() => {
                setEditingTask(undefined);
                setShowTaskModal(true);
              }}
            >
              Nova Tarefa
            </Button>
          </div>

          <TaskList
            tasks={tasks}
            onStatusChange={handleTaskStatusChange}
            onTaskClick={handleTaskClick}
            onDelete={handleDeleteTask}
            showClient={false}
            loading={tasksLoading}
            emptyMessage="Nenhuma tarefa cadastrada para este cliente"
          />
        </div>
      )}

      {/* Aba de Cronograma */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Cronograma de Conteúdo</h2>
            <Button
              onClick={() => {
                setEditingEvent(undefined);
                setSelectedDate(undefined);
                setShowEventModal(true);
              }}
            >
              Novo Conteúdo
            </Button>
          </div>

          {eventsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
            </div>
          ) : (
            <CalendarGrid
              events={events}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          )}
        </div>
      )}

      {/* Aba de Notas */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Notas do Cliente</h2>
          </div>

          {/* Formulário inline para criar nova nota */}
          <GlassCard>
            <NoteForm
              onSubmit={handleCreateNote}
              inline
              placeholder="Adicione uma nota sobre este cliente..."
            />
          </GlassCard>

          {/* Lista de notas */}
          {notesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <p>📝</p>
              <p className="mt-2">Nenhuma nota cadastrada</p>
              <p className="text-sm">Adicione notas para registrar informações importantes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onTogglePin={handleTogglePin}
                  onEdit={handleEditNote}
                  onDelete={handleDeleteNote}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Tarefa */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(undefined);
        }}
        title={editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
      >
        <TaskForm
          clientId={clientId}
          task={editingTask}
          onSubmit={handleCreateTask}
          onCancel={() => {
            setShowTaskModal(false);
            setEditingTask(undefined);
          }}
        />
      </Modal>

      {/* Modal de Evento do Calendário */}
      <Modal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(undefined);
          setSelectedDate(undefined);
        }}
        title={editingEvent ? 'Editar Conteúdo' : 'Novo Conteúdo'}
      >
        <CalendarEventForm
          clientId={clientId}
          event={editingEvent}
          selectedDate={selectedDate}
          onSubmit={handleCreateEvent}
          onCancel={() => {
            setShowEventModal(false);
            setEditingEvent(undefined);
            setSelectedDate(undefined);
          }}
        />
      </Modal>

      {/* Modal de Nota */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => {
          setShowNoteModal(false);
          setEditingNote(undefined);
        }}
        title={editingNote ? 'Editar Nota' : 'Nova Nota'}
      >
        <NoteForm
          note={editingNote}
          onSubmit={handleCreateNote}
          onCancel={() => {
            setShowNoteModal(false);
            setEditingNote(undefined);
          }}
        />
      </Modal>
    </div>
  );
}
