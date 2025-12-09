/**
 * @file context-builder.ts
 * @description Monta o contexto do usuário para o MARCOLA Assistant
 * @module lib/assistant
 */

import { createClient } from '@/lib/supabase/server';

import type { UserContext, ClientContext, MeetingContext, CalendarEventContext, TaskContext, PaymentContext, ExecutionContext } from './types';

/**
 * Obtém o dia da semana em português
 * @param date - Data para extrair o dia
 * @returns Nome do dia da semana
 */
function getDayOfWeek(date: Date): string {
  const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  return days[date.getDay()] ?? 'dia';
}

/**
 * Formata data para ISO (YYYY-MM-DD)
 * @param date - Data a ser formatada
 * @returns String no formato YYYY-MM-DD
 */
function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

/**
 * Formata hora para HH:mm
 * @param date - Data a ser formatada
 * @returns String no formato HH:mm
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Calcula dias de atraso de um pagamento
 * @param dueDate - Data de vencimento
 * @returns Número de dias de atraso (positivo) ou 0 se não atrasado
 */
function calculateDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Busca dados do perfil do usuário
 * @param supabase - Cliente Supabase
 * @param _userId - ID do usuário (para compatibilidade futura)
 * @returns Nome do usuário
 */
async function fetchUserProfile(supabase: ReturnType<typeof createClient>, _userId: string): Promise<string> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.user_metadata?.name || data.user?.email?.split('@')[0] || 'Usuário';
  } catch {
    return 'Usuário';
  }
}

/**
 * Busca clientes do usuário
 * @param supabase - Cliente Supabase
 * @param userId - ID do usuário
 * @returns Lista de clientes formatados
 */
async function fetchClients(supabase: ReturnType<typeof createClient>, userId: string): Promise<ClientContext[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, contact_name, contact_phone, segment, status')
    .eq('user_id', userId)
    .order('name')
    .limit(50);

  if (error) {
    console.error('[context-builder] Erro ao buscar clientes:', error);
    return [];
  }

  return (data || []).map((client) => ({
    id: client.id,
    name: client.name,
    contactName: client.contact_name || undefined,
    phone: client.contact_phone || undefined,
    segment: client.segment || undefined,
    status: client.status || 'active'
  }));
}

/**
 * Busca reuniões futuras do usuário
 * @param supabase - Cliente Supabase
 * @param userId - ID do usuário
 * @returns Lista de reuniões formatadas
 */
async function fetchUpcomingMeetings(supabase: ReturnType<typeof createClient>, userId: string): Promise<MeetingContext[]> {
  const today = formatDateISO(new Date());

  const { data, error } = await supabase
    .from('meetings')
    .select(`
      id,
      title,
      date,
      time,
      type,
      priority,
      duration_minutes,
      client:clients(id, name)
    `)
    .eq('user_id', userId)
    .in('status', ['scheduled', 'confirmed'])
    .gte('date', today)
    .order('date')
    .order('time')
    .limit(15);

  if (error) {
    console.error('[context-builder] Erro ao buscar reuniões:', error);
    return [];
  }

  return (data || []).map((meeting) => {
    const client = meeting.client as unknown as { id: string; name: string } | null;
    return {
      id: meeting.id,
      clientId: client?.id || undefined,
      clientName: client?.name || undefined,
      title: meeting.title || 'Reunião',
      date: meeting.date,
      time: meeting.time,
      type: meeting.type || 'online',
      priority: meeting.priority || undefined,
      durationMinutes: meeting.duration_minutes || undefined
    };
  });
}

/**
 * Busca eventos do calendário de conteúdo nos próximos 14 dias
 * @param supabase - Cliente Supabase
 * @param userId - ID do usuário
 * @returns Lista de eventos do calendário formatados
 */
async function fetchCalendarEvents(supabase: ReturnType<typeof createClient>, userId: string): Promise<CalendarEventContext[]> {
  const today = formatDateISO(new Date());
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14);
  const endDate = formatDateISO(futureDate);

  const { data, error } = await supabase
    .from('content_calendar')
    .select(`
      id,
      title,
      scheduled_date,
      type,
      status,
      platform,
      client:clients(id, name)
    `)
    .eq('user_id', userId)
    .gte('scheduled_date', today)
    .lte('scheduled_date', endDate)
    .neq('status', 'published')
    .order('scheduled_date')
    .limit(20);

  if (error) {
    console.error('[context-builder] Erro ao buscar eventos do calendário:', error);
    return [];
  }

  return (data || []).map((event) => {
    const client = event.client as unknown as { id: string; name: string } | null;
    return {
      id: event.id,
      title: event.title,
      scheduledDate: event.scheduled_date,
      type: event.type || 'other',
      status: event.status || 'planned',
      clientId: client?.id,
      clientName: client?.name,
      platform: event.platform || undefined
    };
  });
}

/**
 * Busca tarefas pendentes do usuário
 * @param supabase - Cliente Supabase
 * @param userId - ID do usuário
 * @returns Lista de tarefas formatadas
 */
async function fetchPendingTasks(supabase: ReturnType<typeof createClient>, userId: string): Promise<TaskContext[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      due_date,
      priority,
      client:clients(id, name)
    `)
    .eq('user_id', userId)
    .in('status', ['todo', 'doing'])
    .order('due_date', { nullsFirst: false })
    .limit(20);

  if (error) {
    console.error('[context-builder] Erro ao buscar tarefas:', error);
    return [];
  }

  return (data || []).map((task) => {
    const client = task.client as unknown as { id: string; name: string } | null;
    return {
      id: task.id,
      clientId: client?.id,
      clientName: client?.name,
      title: task.title,
      dueDate: task.due_date || undefined,
      priority: task.priority || 'medium'
    };
  });
}

/**
 * Busca pagamentos pendentes do usuário
 * @param supabase - Cliente Supabase
 * @param userId - ID do usuário
 * @returns Lista de pagamentos formatados
 */
async function fetchPendingPayments(supabase: ReturnType<typeof createClient>, userId: string): Promise<PaymentContext[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      due_date,
      status,
      client:clients!inner(id, name)
    `)
    .eq('user_id', userId)
    .in('status', ['pending', 'overdue'])
    .order('due_date')
    .limit(20);

  if (error) {
    console.error('[context-builder] Erro ao buscar pagamentos:', error);
    return [];
  }

  return (data || []).map((payment) => {
    const client = payment.client as unknown as { id: string; name: string };
    const daysOverdue = calculateDaysOverdue(payment.due_date);
    return {
      id: payment.id,
      clientId: client?.id || '',
      clientName: client?.name || 'Cliente',
      amount: Number(payment.amount) || 0,
      dueDate: payment.due_date,
      status: payment.status || 'pending',
      daysOverdue: daysOverdue > 0 ? daysOverdue : undefined
    };
  });
}

/**
 * Busca execuções recentes bem-sucedidas do usuário
 * @param supabase - Cliente Supabase
 * @param userId - ID do usuário
 * @returns Lista de execuções formatadas
 */
async function fetchRecentExecutions(supabase: ReturnType<typeof createClient>, userId: string): Promise<ExecutionContext[]> {
  console.log('[context-builder] Buscando execuções recentes para userId:', userId);
  // Buscar execuções dos últimos 30 dias
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  console.log('[context-builder] Data inicial para busca:', startDate.toISOString());

  const { data, error } = await supabase
    .from('task_executions')
    .select(`
      id,
      client_id,
      action_type,
      title,
      optimization_type,
      optimization_details,
      result,
      executed_at,
      client:clients(id, name)
    `)
    .eq('user_id', userId)
    .gte('executed_at', startDate.toISOString())
    .order('executed_at', { ascending: false })
    .limit(30);

  console.log('[context-builder] Resultado busca execuções:', { count: data?.length, error: error?.message });

  if (error) {
    console.error('[context-builder] Erro ao buscar execuções:', error);
    return [];
  }

  return (data || []).map((execution) => {
    const client = execution.client as unknown as { id: string; name: string } | null;
    return {
      id: execution.id,
      clientId: client?.id || undefined,
      clientName: client?.name || undefined,
      actionType: execution.action_type,
      title: execution.title,
      optimizationType: execution.optimization_type || undefined,
      optimizationDetails: execution.optimization_details || undefined,
      result: execution.result || undefined,
      executedAt: execution.executed_at
    };
  });
}

/**
 * Monta o contexto completo do usuário para o assistente
 * @param userId - ID do usuário
 * @returns Contexto do usuário com clientes, reuniões, tarefas e pagamentos
 *
 * @example
 * const context = await buildUserContext(user.id);
 * // context contém todas as informações necessárias para o assistente
 */
export async function buildUserContext(userId: string): Promise<UserContext> {
  const supabase = createClient();
  const now = new Date();

  // Buscar dados em paralelo para melhor performance
  const [userName, clients, upcomingMeetings, calendarEvents, pendingTasks, pendingPayments, recentExecutions] = await Promise.all([
    fetchUserProfile(supabase, userId),
    fetchClients(supabase, userId),
    fetchUpcomingMeetings(supabase, userId),
    fetchCalendarEvents(supabase, userId),
    fetchPendingTasks(supabase, userId),
    fetchPendingPayments(supabase, userId),
    fetchRecentExecutions(supabase, userId)
  ]);

  const activeClients = clients.filter((c) => c.status === 'active').length;

  return {
    userId,
    userName,
    totalClients: clients.length,
    activeClients,
    clients,
    upcomingMeetings,
    calendarEvents,
    pendingTasks,
    pendingPayments,
    recentExecutions,
    currentDate: formatDateISO(now),
    currentTime: formatTime(now),
    currentDayOfWeek: getDayOfWeek(now)
  };
}

/**
 * Busca um cliente por ID (para usar em tools)
 * @param userId - ID do usuário
 * @param clientId - ID do cliente
 * @returns Dados do cliente ou null
 */
export async function getClientById(userId: string, clientId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[context-builder] Erro ao buscar cliente:', error);
    return null;
  }

  return data;
}

/**
 * Busca clientes por query de texto (nome, contato, segmento)
 * @param userId - ID do usuário
 * @param query - Texto de busca
 * @returns Lista de clientes encontrados
 */
export async function searchClients(userId: string, query: string) {
  const supabase = createClient();
  const searchTerm = `%${query}%`;

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, contact_name, contact_phone, segment, status')
    .eq('user_id', userId)
    .or(`name.ilike.${searchTerm},contact_name.ilike.${searchTerm},segment.ilike.${searchTerm}`)
    .limit(5);

  if (error) {
    console.error('[context-builder] Erro ao buscar clientes:', error);
    return [];
  }

  return data || [];
}
