/**
 * @file tool-executor.ts
 * @description Executor de tools do MARCOLA Assistant
 * @module lib/assistant
 */

import { createClient } from '@/lib/supabase/server';
import { getZAPIService } from '@/lib/whatsapp';
import type { ToolCall, ToolResult, ConfirmationData } from './types';

// Importar executors avançados
import {
  BatchActionsExecutor,
  IntelligenceExecutor,
  CommunicationExecutor,
  MetaActionsExecutor,
  requiresConfirmation,
  isAdvancedTool
} from './tools-advanced';

// Importar tipos avançados
import type {
  BatchCobrancaData,
  BatchConfirmacaoReuniaoData,
  BatchFollowupData,
  GerarFaturasData,
  RegistroPosReuniao,
  AgendamentoRecorrente,
  OnboardingCliente
} from './types-advanced';

/**
 * Trata erros de banco de dados e retorna mensagens amigáveis
 * @param error - Erro do Supabase ou string
 * @returns Mensagem de erro amigável
 */
function formatDatabaseError(error: { message?: string; code?: string } | string): string {
  const errorMessage = typeof error === 'string' ? error : error.message || 'Erro desconhecido';

  // Mapear erros técnicos para mensagens amigáveis
  if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
    console.error('[tool-executor] Erro de coluna:', errorMessage);
    return 'Erro ao buscar informações. Por favor, tente novamente.';
  }

  if (errorMessage.includes('permission denied') || errorMessage.includes('RLS')) {
    return 'Você não tem permissão para acessar esses dados.';
  }

  if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
    return 'Este registro já existe no sistema.';
  }

  if (errorMessage.includes('foreign key') || errorMessage.includes('violates')) {
    return 'Não foi possível completar a operação. Verifique se os dados estão corretos.';
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('connection')) {
    return 'Problema de conexão. Por favor, tente novamente.';
  }

  // Para outros erros, retornar mensagem genérica (sem expor detalhes técnicos)
  console.error('[tool-executor] Erro não mapeado:', errorMessage);
  return 'Ocorreu um erro ao processar sua solicitação. Tente novamente.';
}

/**
 * Executa um tool call e retorna o resultado
 * @param toolCall - Tool call a ser executado
 * @param userId - ID do usuário autenticado
 * @returns Resultado da execução
 */
export async function executeTool(
  toolCall: ToolCall,
  userId: string
): Promise<ToolResult> {
  const { name, parameters } = toolCall;

  try {
    switch (name) {
      // ==================== CLIENTES ====================
      case 'buscar_cliente':
        return await buscarCliente(userId, parameters.query as string);

      case 'listar_clientes':
        return await listarClientes(userId, parameters);

      // ==================== REUNIÕES ====================
      case 'criar_reuniao':
        return await criarReuniao(userId, parameters);

      case 'listar_reunioes':
        return await listarReunioes(userId, parameters);

      case 'excluir_reuniao':
        return await excluirReuniao(userId, parameters);

      case 'atualizar_reuniao':
        return await atualizarReuniao(userId, parameters);

      // ==================== TAREFAS ====================
      case 'criar_tarefa':
        return await criarTarefa(userId, parameters);

      case 'listar_tarefas':
        return await listarTarefas(userId, parameters);

      case 'concluir_tarefa':
        return await concluirTarefa(
          userId,
          parameters.taskId as string | undefined,
          parameters.taskTitle as string | undefined
        );

      // ==================== PAGAMENTOS ====================
      case 'criar_cobranca':
        return await criarCobranca(userId, parameters);

      case 'listar_pagamentos':
        return await listarPagamentos(userId, parameters);

      case 'marcar_pago':
        return await marcarPago(
          userId,
          parameters.paymentId as string,
          parameters.paidAt as string | undefined
        );

      // ==================== WHATSAPP ====================
      case 'enviar_whatsapp':
        return await enviarWhatsApp(
          userId,
          parameters.clientId as string,
          parameters.message as string
        );

      case 'gerar_mensagem':
        return await gerarMensagem(userId, parameters);

      // ==================== LEMBRETES ====================
      case 'criar_lembrete':
        return await criarLembrete(userId, parameters);

      // ==================== RESUMOS ====================
      case 'resumo_dia':
        return await resumoDia(userId);

      case 'resumo_cliente':
        return await resumoCliente(userId, parameters.clientId as string);

      // ==================== ANÁLISE ====================
      case 'analisar_performance':
        return await analisarPerformance(userId, parameters);

      // ==================== TOOLS AVANÇADOS ====================
      default: {
        // Verificar se é um tool avançado
        if (isAdvancedTool(name)) {
          return await executeAdvancedTool(name, parameters, userId);
        }

        return {
          success: false,
          error: `Tool não reconhecido: ${name}`
        };
      }
    }
  } catch (error) {
    console.error(`[tool-executor] Erro ao executar ${name}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// ==================== IMPLEMENTAÇÃO DOS TOOLS ====================

/**
 * Busca um cliente pelo nome ou características
 */
async function buscarCliente(userId: string, query: string): Promise<ToolResult> {
  const supabase = await createClient();

  // Sanitizar query - remover caracteres especiais que podem causar problemas
  const sanitizedQuery = query.trim().toLowerCase();

  console.log('[buscarCliente] Buscando cliente:', { userId, query: sanitizedQuery });

  // Usar textSearch ou múltiplas queries para maior robustez
  // Primeiro tentar busca por nome (mais comum)
  const { data: clientsByName, error: errorName } = await supabase
    .from('clients')
    .select('id, name, contact_name, contact_phone, segment, status')
    .eq('user_id', userId)
    .ilike('name', `%${sanitizedQuery}%`)
    .limit(10);

  if (errorName) {
    console.error('[buscarCliente] Erro ao buscar por nome:', errorName);
    return { success: false, error: formatDatabaseError(errorName) };
  }

  // Se não encontrou por nome, tentar por contact_name
  let allClients = clientsByName || [];

  if (allClients.length === 0) {
    const { data: clientsByContact, error: errorContact } = await supabase
      .from('clients')
      .select('id, name, contact_name, contact_phone, segment, status')
      .eq('user_id', userId)
      .ilike('contact_name', `%${sanitizedQuery}%`)
      .limit(10);

    if (!errorContact && clientsByContact) {
      allClients = clientsByContact;
    }
  }

  // Se ainda não encontrou, tentar por segmento
  if (allClients.length === 0) {
    const { data: clientsBySegment, error: errorSegment } = await supabase
      .from('clients')
      .select('id, name, contact_name, contact_phone, segment, status')
      .eq('user_id', userId)
      .ilike('segment', `%${sanitizedQuery}%`)
      .limit(10);

    if (!errorSegment && clientsBySegment) {
      allClients = clientsBySegment;
    }
  }

  console.log('[buscarCliente] Resultados encontrados:', allClients.length);

  if (allClients.length === 0) {
    return {
      success: true,
      data: {
        found: false,
        clients: [], // Sempre retornar array vazio para consistência
        message: `Nenhum cliente encontrado com "${query}"`
      }
    };
  }

  // Sempre retornar como array 'clients' para consistência
  return {
    success: true,
    data: {
      found: true,
      multiple: allClients.length > 1,
      clients: allClients, // Sempre usar 'clients' (plural)
      client: allClients[0], // Também incluir singular para compatibilidade
      message: allClients.length === 1
        ? `Cliente encontrado: ${allClients[0]?.name}`
        : `Encontrados ${allClients.length} clientes correspondentes`
    }
  };
}

/**
 * Lista todos os clientes do usuário
 */
async function listarClientes(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();

  let query = supabase
    .from('clients')
    .select('id, name, contact_name, contact_phone, segment, status, monthly_value')
    .eq('user_id', userId);

  const status = params.status as string | undefined;
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const limit = (params.limit as number) || 50;
  query = query.limit(limit).order('name');

  const { data: clients, error } = await query;

  if (error) {
    return { success: false, error: formatDatabaseError(error) };
  }

  return {
    success: true,
    data: {
      clients: clients || [],
      total: clients?.length || 0,
      message: `${clients?.length || 0} clientes encontrados`
    }
  };
}

/**
 * Cria uma nova reunião
 */
async function criarReuniao(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();

  const { clientId, date, time, type, notes } = params;

  // Validar cliente
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .eq('user_id', userId)
    .single();

  if (clientError || !client) {
    return { success: false, error: 'Cliente não encontrado' };
  }

  // Criar reunião
  const { data: meeting, error } = await supabase
    .from('meetings')
    .insert({
      user_id: userId,
      client_id: clientId,
      date: date,
      time: time,
      type: type || 'online',
      notes: notes || null,
      status: 'scheduled'
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: formatDatabaseError(error) };
  }

  return {
    success: true,
    data: {
      meeting,
      clientName: client.name,
      message: `Reunião agendada com ${client.name} para ${date} às ${time}`
    }
  };
}

/**
 * Lista reuniões agendadas
 */
async function listarReunioes(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();

  const periodo = params.periodo as string | undefined;
  const clientId = params.clientId as string | undefined;

  let query = supabase
    .from('meetings')
    .select(`
      id, date, time, type, notes, status, client_id,
      client:clients!client_id(id, name, contact_name)
    `)
    .eq('user_id', userId)
    .order('date')
    .order('time');

  // Filtro de período
  const today = new Date().toISOString().split('T')[0];
  if (periodo === 'hoje') {
    query = query.eq('date', today);
  } else if (periodo === 'amanha') {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    query = query.eq('date', tomorrow.toISOString().split('T')[0]);
  } else if (periodo === 'semana') {
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    query = query.gte('date', today).lte('date', weekEnd.toISOString().split('T')[0]);
  } else if (periodo === 'mes') {
    const monthEnd = new Date();
    monthEnd.setDate(monthEnd.getDate() + 30);
    query = query.gte('date', today).lte('date', monthEnd.toISOString().split('T')[0]);
  }

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: meetings, error } = await query;

  if (error) {
    return { success: false, error: formatDatabaseError(error) };
  }

  // Formatar reuniões com nome do cliente
  const formattedMeetings = (meetings || []).map((meeting) => {
    // O client pode vir como objeto ou array dependendo da relação
    const clientData = meeting.client;
    const client = Array.isArray(clientData) ? clientData[0] : clientData;
    return {
      ...meeting,
      clientName: client?.name || 'Cliente não especificado',
      clientContactName: client?.contact_name
    };
  });

  return {
    success: true,
    data: {
      meetings: formattedMeetings,
      total: formattedMeetings.length,
      message: `${formattedMeetings.length} reuniões encontradas`
    }
  };
}

/**
 * Exclui uma reunião existente
 */
async function excluirReuniao(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();

  const meetingId = params.meetingId as string | undefined;
  const clientId = params.clientId as string | undefined;
  const date = params.date as string | undefined;

  // Se tem meetingId, excluir diretamente
  if (meetingId) {
    // Buscar reunião para confirmar dados
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select(`
        id, date, time, type,
        client:clients!client_id(id, name)
      `)
      .eq('id', meetingId)
      .eq('user_id', userId)
      .single();

    if (meetingError || !meeting) {
      return { success: false, error: 'Reunião não encontrada' };
    }

    // Excluir a reunião
    const { error: deleteError } = await supabase
      .from('meetings')
      .delete()
      .eq('id', meetingId)
      .eq('user_id', userId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    const clientData = meeting.client;
    const client = Array.isArray(clientData) ? clientData[0] : clientData;
    const clientName = client?.name || 'Cliente';

    return {
      success: true,
      data: {
        meetingId,
        clientName,
        date: meeting.date,
        time: meeting.time,
        message: `Reunião com ${clientName} do dia ${meeting.date} às ${meeting.time} foi excluída com sucesso`
      }
    };
  }

  // Se tem clientId e date, buscar reunião específica
  if (clientId && date) {
    const { data: meetings, error: searchError } = await supabase
      .from('meetings')
      .select(`
        id, date, time, type,
        client:clients!client_id(id, name)
      `)
      .eq('user_id', userId)
      .eq('client_id', clientId)
      .eq('date', date);

    if (searchError) {
      return { success: false, error: searchError.message };
    }

    if (!meetings || meetings.length === 0) {
      return {
        success: false,
        error: 'Nenhuma reunião encontrada para este cliente nesta data'
      };
    }

    // Se encontrou múltiplas reuniões no mesmo dia
    if (meetings.length > 1) {
      const meetingsList = meetings.map((m) => {
        const clientData = m.client;
        const client = Array.isArray(clientData) ? clientData[0] : clientData;
        return {
          id: m.id,
          time: m.time,
          type: m.type,
          clientName: client?.name || 'Cliente'
        };
      });

      return {
        success: true,
        data: {
          multiple: true,
          meetings: meetingsList,
          message: `Encontrei ${meetings.length} reuniões nesta data. Qual você quer excluir?`
        }
      };
    }

    // Uma única reunião - excluir
    const meeting = meetings[0];
    if (!meeting) {
      return { success: false, error: 'Reunião não encontrada' };
    }

    const { error: deleteError } = await supabase
      .from('meetings')
      .delete()
      .eq('id', meeting.id)
      .eq('user_id', userId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    const clientData = meeting.client;
    const client = Array.isArray(clientData) ? clientData[0] : clientData;
    const clientName = client?.name || 'Cliente';

    return {
      success: true,
      data: {
        meetingId: meeting.id,
        clientName,
        date: meeting.date,
        time: meeting.time,
        message: `Reunião com ${clientName} do dia ${meeting.date} às ${meeting.time} foi excluída com sucesso`
      }
    };
  }

  return {
    success: false,
    error: 'É necessário informar o ID da reunião ou o cliente e a data'
  };
}

/**
 * Atualiza/Remarca uma reunião existente
 */
async function atualizarReuniao(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();

  const meetingId = params.meetingId as string | undefined;
  const clientId = params.clientId as string | undefined;
  const currentDate = params.currentDate as string | undefined;
  const newDate = params.newDate as string | undefined;
  const newTime = params.newTime as string | undefined;
  const newType = params.newType as string | undefined;
  const newNotes = params.newNotes as string | undefined;

  let targetMeetingId = meetingId;

  // Se não tem meetingId, tentar buscar por clientId + currentDate
  if (!targetMeetingId && clientId && currentDate) {
    const { data: meetings, error: searchError } = await supabase
      .from('meetings')
      .select('id')
      .eq('user_id', userId)
      .eq('client_id', clientId)
      .eq('date', currentDate);

    if (searchError) {
      return { success: false, error: searchError.message };
    }

    if (!meetings || meetings.length === 0) {
      return {
        success: false,
        error: 'Nenhuma reunião encontrada para este cliente nesta data'
      };
    }

    if (meetings.length > 1) {
      return {
        success: true,
        data: {
          multiple: true,
          meetingsCount: meetings.length,
          message: `Encontrei ${meetings.length} reuniões nesta data. Por favor, seja mais específico sobre qual reunião remarcar.`
        }
      };
    }

    const firstMeeting = meetings[0];
    if (firstMeeting) {
      targetMeetingId = firstMeeting.id;
    }
  }

  if (!targetMeetingId) {
    return {
      success: false,
      error: 'É necessário informar o ID da reunião ou o cliente e a data atual'
    };
  }

  // Buscar reunião atual
  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .select(`
      id, date, time, type, notes,
      client:clients!client_id(id, name)
    `)
    .eq('id', targetMeetingId)
    .eq('user_id', userId)
    .single();

  if (meetingError || !meeting) {
    return { success: false, error: 'Reunião não encontrada' };
  }

  // Preparar dados de atualização
  const updateData: Record<string, unknown> = {};
  if (newDate) {
    updateData.date = newDate;
  }
  if (newTime) {
    updateData.time = newTime;
  }
  if (newType) {
    updateData.type = newType;
  }
  if (newNotes !== undefined) {
    updateData.notes = newNotes;
  }

  if (Object.keys(updateData).length === 0) {
    return {
      success: false,
      error: 'Nenhum dado de atualização fornecido. Informe a nova data, horário, tipo ou observações.'
    };
  }

  // Atualizar reunião
  const { error: updateError } = await supabase
    .from('meetings')
    .update(updateData)
    .eq('id', targetMeetingId)
    .eq('user_id', userId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  const clientData = meeting.client;
  const client = Array.isArray(clientData) ? clientData[0] : clientData;
  const clientName = client?.name || 'Cliente';

  // Montar mensagem de confirmação
  const changes: string[] = [];
  if (newDate) {
    changes.push(`data: ${meeting.date} → ${newDate}`);
  }
  if (newTime) {
    changes.push(`horário: ${meeting.time || 'não definido'} → ${newTime}`);
  }
  if (newType) {
    changes.push(`tipo: ${meeting.type || 'não definido'} → ${newType}`);
  }

  return {
    success: true,
    data: {
      meetingId: targetMeetingId,
      clientName,
      previousDate: meeting.date,
      previousTime: meeting.time,
      newDate: newDate || meeting.date,
      newTime: newTime || meeting.time,
      newType: newType || meeting.type,
      changes,
      message: `Reunião com ${clientName} atualizada: ${changes.join(', ')}`
    }
  };
}

/**
 * Cria uma nova tarefa
 */
async function criarTarefa(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();

  const { title, description, clientId, dueDate, priority, category } = params;

  // Validar cliente se fornecido
  let clientName: string | null = null;
  if (clientId) {
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .eq('user_id', userId)
      .single();

    if (clientError || !client) {
      return { success: false, error: 'Cliente não encontrado' };
    }
    clientName = client.name;
  }

  // Criar tarefa
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      client_id: clientId || null,
      title: title,
      description: description || null,
      due_date: dueDate || null,
      priority: priority || 'medium',
      category: category || 'other',
      status: 'todo'
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: formatDatabaseError(error) };
  }

  return {
    success: true,
    data: {
      task,
      clientName,
      message: `Tarefa "${title}" criada com sucesso`
    }
  };
}

/**
 * Lista tarefas pendentes
 */
async function listarTarefas(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();

  const status = params.status as string | undefined;
  const clientId = params.clientId as string | undefined;
  const priority = params.priority as string | undefined;
  const periodo = params.periodo as string | undefined;

  let query = supabase
    .from('tasks')
    .select(`
      id, title, description, due_date, priority, category, status, created_at,
      clients(id, name)
    `)
    .eq('user_id', userId)
    .order('due_date', { nullsFirst: false })
    .order('priority');

  // Filtros
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  if (priority) {
    query = query.eq('priority', priority);
  }

  // Filtro de período
  const today = new Date().toISOString().split('T')[0];
  if (periodo === 'hoje') {
    query = query.eq('due_date', today);
  } else if (periodo === 'semana') {
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    query = query.lte('due_date', weekEnd.toISOString().split('T')[0]);
  } else if (periodo === 'atrasadas') {
    query = query.lt('due_date', today).neq('status', 'done');
  }

  const { data: tasks, error } = await query;

  if (error) {
    return { success: false, error: formatDatabaseError(error) };
  }

  return {
    success: true,
    data: {
      tasks: tasks || [],
      total: tasks?.length || 0,
      message: `${tasks?.length || 0} tarefas encontradas`
    }
  };
}

/**
 * Verifica se uma string é um UUID válido
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Marca uma tarefa como concluída
 * Aceita taskId (UUID) ou taskTitle (nome da tarefa)
 */
async function concluirTarefa(
  userId: string,
  taskId?: string,
  taskTitle?: string
): Promise<ToolResult> {
  const supabase = await createClient();

  let task: { id: string; title: string } | null = null;

  // Se temos um taskId válido (UUID), buscar por ID
  if (taskId && isValidUUID(taskId)) {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      task = data;
    }
  }

  // Se não encontrou por ID, tentar buscar por título
  if (!task && (taskTitle || (taskId && !isValidUUID(taskId)))) {
    const searchTerm = taskTitle || taskId;
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('user_id', userId)
      .in('status', ['todo', 'doing'])
      .ilike('title', `%${searchTerm}%`)
      .limit(1)
      .single();

    if (!error && data) {
      task = data;
    }
  }

  if (!task) {
    return { success: false, error: 'Tarefa não encontrada. Verifique o nome ou ID da tarefa.' };
  }

  // Atualizar status
  const { error } = await supabase
    .from('tasks')
    .update({
      status: 'done',
      completed_at: new Date().toISOString()
    })
    .eq('id', task.id)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: formatDatabaseError(error) };
  }

  return {
    success: true,
    data: {
      taskId: task.id,
      title: task.title,
      message: `Tarefa "${task.title}" marcada como concluída`
    }
  };
}

/**
 * Cria uma nova cobrança
 */
async function criarCobranca(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();

  const { clientId, amount, dueDate, description } = params;

  // Validar cliente
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .eq('user_id', userId)
    .single();

  if (clientError || !client) {
    return { success: false, error: 'Cliente não encontrado' };
  }

  // Criar cobrança
  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      client_id: clientId,
      amount: amount,
      due_date: dueDate,
      description: description || `Serviço de gestão de tráfego`,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: formatDatabaseError(error) };
  }

  return {
    success: true,
    data: {
      payment,
      clientName: client.name,
      message: `Cobrança de R$ ${Number(amount).toFixed(2)} criada para ${client.name}`
    }
  };
}

/**
 * Lista pagamentos pendentes ou vencidos
 */
async function listarPagamentos(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();

  const status = params.status as string | undefined;
  const clientId = params.clientId as string | undefined;

  let query = supabase
    .from('payments')
    .select(`
      id, amount, due_date, description, status, paid_at,
      clients(id, name, contact_name)
    `)
    .eq('user_id', userId)
    .order('due_date');

  // Filtro de status
  const today = new Date().toISOString().split('T')[0];
  if (status === 'pending') {
    query = query.eq('status', 'pending').gte('due_date', today);
  } else if (status === 'overdue') {
    query = query.eq('status', 'pending').lt('due_date', today);
  } else if (status === 'paid') {
    query = query.eq('status', 'paid');
  } else if (status !== 'all') {
    query = query.eq('status', 'pending');
  }

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: payments, error } = await query;

  if (error) {
    return { success: false, error: formatDatabaseError(error) };
  }

  // Calcular total pendente
  const totalPending = payments?.reduce((sum, p) => {
    if (p.status === 'pending') {
      return sum + Number(p.amount);
    }
    return sum;
  }, 0) || 0;

  return {
    success: true,
    data: {
      payments: payments || [],
      total: payments?.length || 0,
      totalPending,
      message: `${payments?.length || 0} pagamentos encontrados. Total pendente: R$ ${totalPending.toFixed(2)}`
    }
  };
}

/**
 * Marca um pagamento como pago
 */
async function marcarPago(
  userId: string,
  paymentId: string,
  paidAt?: string
): Promise<ToolResult> {
  const supabase = await createClient();

  // Verificar se pagamento existe
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select(`
      id, amount,
      clients(name)
    `)
    .eq('id', paymentId)
    .eq('user_id', userId)
    .single();

  if (paymentError || !payment) {
    return { success: false, error: 'Pagamento não encontrado' };
  }

  // Atualizar status
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'paid',
      paid_at: paidAt || new Date().toISOString().split('T')[0]
    })
    .eq('id', paymentId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: formatDatabaseError(error) };
  }

  // Supabase retorna join como objeto quando é relação many-to-one
  const clientData = payment.clients as unknown as { name: string } | null;
  const clientName = clientData?.name || 'Cliente';

  return {
    success: true,
    data: {
      paymentId,
      amount: payment.amount,
      clientName,
      message: `Pagamento de R$ ${Number(payment.amount).toFixed(2)} de ${clientName} marcado como pago`
    }
  };
}

/**
 * Envia mensagem WhatsApp para um cliente
 */
async function enviarWhatsApp(
  userId: string,
  clientId: string,
  message: string
): Promise<ToolResult> {
  // Validar parâmetros
  if (!clientId || clientId === 'undefined' || clientId === 'null') {
    return {
      success: false,
      error: 'ID do cliente não foi informado. Por favor, especifique para qual cliente deseja enviar a mensagem.'
    };
  }

  if (!message || message.trim() === '') {
    return {
      success: false,
      error: 'Mensagem não foi informada. Por favor, especifique o conteúdo da mensagem.'
    };
  }

  const supabase = await createClient();

  // Buscar dados do cliente
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name, contact_name, contact_phone')
    .eq('id', clientId)
    .eq('user_id', userId)
    .single();

  if (clientError || !client) {
    console.error('[enviarWhatsApp] Cliente não encontrado:', { clientId, userId, error: clientError });
    return {
      success: false,
      error: `Cliente não encontrado. Verifique se o cliente existe e tente novamente.`
    };
  }

  if (!client.contact_phone) {
    return {
      success: false,
      error: `${client.name} não possui telefone cadastrado. Adicione o telefone na página do cliente antes de enviar mensagens.`
    };
  }

  // Formatar número de telefone (remover caracteres não numéricos)
  const phoneNumber = client.contact_phone.replace(/\D/g, '');

  // Tentar enviar via Z-API (se configurado)
  try {
    const zapiService = await getZAPIService(userId);

    if (zapiService) {
      // Enviar diretamente via Z-API
      const result = await zapiService.sendText({
        phone: phoneNumber,
        message: message
      });

      return {
        success: true,
        data: {
          clientName: client.name,
          contactName: client.contact_name,
          phone: client.contact_phone,
          message,
          messageId: result.messageId,
          sentVia: 'zapi',
          message_result: `✅ Mensagem enviada para ${client.contact_name || client.name} via WhatsApp!`
        }
      };
    }
  } catch (zapiError) {
    console.error('[enviarWhatsApp] Erro ao enviar via Z-API:', zapiError);
    // Se falhar com Z-API, oferece o link como fallback
  }

  // Fallback: Gerar URL do WhatsApp Web se Z-API não estiver configurado
  const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;

  return {
    success: true,
    data: {
      clientName: client.name,
      contactName: client.contact_name,
      phone: client.contact_phone,
      message,
      whatsappUrl,
      sentVia: 'link',
      message_result: `Mensagem preparada para ${client.contact_name || client.name}. Clique no link para enviar via WhatsApp.`
    }
  };
}

/**
 * Gera uma mensagem personalizada para um cliente
 */
async function gerarMensagem(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();

  const { clientId, tipo, contexto } = params;

  // Buscar dados do cliente
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name, contact_name')
    .eq('id', clientId)
    .eq('user_id', userId)
    .single();

  if (clientError || !client) {
    return { success: false, error: 'Cliente não encontrado' };
  }

  const contactName = client.contact_name || client.name;
  let mensagem = '';

  switch (tipo) {
    case 'lembrete_pagamento':
      mensagem = `Olá ${contactName}! Tudo bem? 😊\n\nEstou passando para lembrar sobre o pagamento deste mês. Poderia verificar por favor?\n\nQualquer dúvida, estou à disposição!`;
      break;

    case 'confirmacao_reuniao':
      mensagem = `Olá ${contactName}! Tudo bem?\n\nGostaria de confirmar nossa reunião. Podemos manter o horário combinado?\n\nAguardo sua confirmação!`;
      break;

    case 'followup':
      mensagem = `Olá ${contactName}! Tudo bem?\n\nEstou entrando em contato para saber como estão as coisas por aí. Tem alguma demanda ou ajuste que gostaria de fazer nas campanhas?\n\nEstou à disposição!`;
      break;

    case 'boas_vindas':
      mensagem = `Olá ${contactName}! Seja muito bem-vindo(a)! 🎉\n\nEstou muito feliz em tê-lo(a) como cliente. Vamos trabalhar juntos para alcançar excelentes resultados!\n\nQualquer dúvida, pode me chamar. Vamos com tudo!`;
      break;

    case 'cobranca':
      mensagem = `Olá ${contactName}! Tudo bem?\n\nGostaria de falar sobre o pagamento que está em aberto. Houve algum problema? Podemos conversar sobre isso?\n\nAguardo seu retorno!`;
      break;

    case 'custom':
    default:
      mensagem = contexto as string || `Olá ${contactName}! Tudo bem?\n\n[Sua mensagem aqui]`;
      break;
  }

  return {
    success: true,
    data: {
      clientId: client.id,
      clientName: client.name,
      contactName,
      tipo,
      mensagem,
      message: `Mensagem "${tipo}" gerada para ${contactName}`
    }
  };
}

/**
 * Cria um lembrete pessoal
 */
async function criarLembrete(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();

  const { message, date, time, clientId } = params;

  // Montar datetime do lembrete
  const remindAt = time ? `${date}T${time}:00` : `${date}T09:00:00`;

  // Criar lembrete
  const { data: reminder, error } = await supabase
    .from('reminders')
    .insert({
      user_id: userId,
      client_id: clientId || null,
      message: message,
      remind_at: remindAt,
      type: 'personal',
      is_sent: false
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: formatDatabaseError(error) };
  }

  return {
    success: true,
    data: {
      reminder,
      message_result: `Lembrete criado para ${date}${time ? ` às ${time}` : ''}: "${message}"`
    }
  };
}

/**
 * Gera um resumo do dia atual
 */
async function resumoDia(userId: string): Promise<ToolResult> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // Buscar reuniões de hoje
  const { data: meetings } = await supabase
    .from('meetings')
    .select(`
      id, date, time, type, notes,
      clients(name, contact_name)
    `)
    .eq('user_id', userId)
    .eq('date', today)
    .order('time');

  // Buscar tarefas pendentes
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, priority, due_date')
    .eq('user_id', userId)
    .in('status', ['todo', 'doing'])
    .or(`due_date.eq.${today},due_date.lt.${today}`)
    .order('priority')
    .limit(10);

  // Buscar pagamentos atrasados
  const { data: overduePayments } = await supabase
    .from('payments')
    .select(`
      id, amount, due_date,
      clients(name)
    `)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('due_date', today);

  // Buscar total de clientes ativos
  const { count: activeClients } = await supabase
    .from('clients')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'active');

  return {
    success: true,
    data: {
      date: today,
      meetings: meetings || [],
      meetingsCount: meetings?.length || 0,
      tasks: tasks || [],
      tasksCount: tasks?.length || 0,
      overduePayments: overduePayments || [],
      overduePaymentsCount: overduePayments?.length || 0,
      activeClients: activeClients || 0,
      message: `Resumo do dia: ${meetings?.length || 0} reuniões, ${tasks?.length || 0} tarefas pendentes, ${overduePayments?.length || 0} pagamentos atrasados`
    }
  };
}

/**
 * Gera um resumo completo de um cliente específico
 */
async function resumoCliente(userId: string, clientId: string): Promise<ToolResult> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // Buscar dados do cliente
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('user_id', userId)
    .single();

  if (clientError || !client) {
    return { success: false, error: 'Cliente não encontrado' };
  }

  // Buscar reuniões futuras
  const { data: upcomingMeetings } = await supabase
    .from('meetings')
    .select('id, date, time, type')
    .eq('client_id', clientId)
    .gte('date', today)
    .order('date')
    .limit(5);

  // Buscar tarefas pendentes
  const { data: pendingTasks } = await supabase
    .from('tasks')
    .select('id, title, priority, due_date')
    .eq('client_id', clientId)
    .in('status', ['todo', 'doing'])
    .order('due_date')
    .limit(5);

  // Buscar pagamentos pendentes
  const { data: pendingPayments } = await supabase
    .from('payments')
    .select('id, amount, due_date, status')
    .eq('client_id', clientId)
    .eq('status', 'pending')
    .order('due_date');

  // Calcular total pendente
  const totalPending = pendingPayments?.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  ) || 0;

  return {
    success: true,
    data: {
      client,
      upcomingMeetings: upcomingMeetings || [],
      pendingTasks: pendingTasks || [],
      pendingPayments: pendingPayments || [],
      totalPendingAmount: totalPending,
      message: `Resumo de ${client.name}: ${upcomingMeetings?.length || 0} reuniões agendadas, ${pendingTasks?.length || 0} tarefas pendentes, R$ ${totalPending.toFixed(2)} em aberto`
    }
  };
}

/**
 * Analisa a performance de anúncios de um cliente
 */
async function analisarPerformance(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();

  const { clientId, periodo } = params;

  // Buscar dados do cliente
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name, monthly_budget')
    .eq('id', clientId)
    .eq('user_id', userId)
    .single();

  if (clientError || !client) {
    return { success: false, error: 'Cliente não encontrado' };
  }

  // Calcular data inicial baseado no período
  const days = parseInt((periodo as string)?.replace('d', '') || '30');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Buscar relatórios do período
  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .eq('client_id', clientId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (!reports || reports.length === 0) {
    return {
      success: true,
      data: {
        clientName: client.name,
        periodo: `${days} dias`,
        hasData: false,
        message: `Não há dados de relatório para ${client.name} nos últimos ${days} dias`
      }
    };
  }

  // Calcular métricas agregadas
  const metrics = reports.reduce(
    (acc, r) => {
      acc.totalSpend += Number(r.spend || 0);
      acc.totalImpressions += Number(r.impressions || 0);
      acc.totalClicks += Number(r.clicks || 0);
      acc.totalConversions += Number(r.conversions || 0);
      return acc;
    },
    { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0 }
  );

  const ctr = metrics.totalImpressions > 0
    ? (metrics.totalClicks / metrics.totalImpressions) * 100
    : 0;

  const cpc = metrics.totalClicks > 0
    ? metrics.totalSpend / metrics.totalClicks
    : 0;

  const cpa = metrics.totalConversions > 0
    ? metrics.totalSpend / metrics.totalConversions
    : 0;

  return {
    success: true,
    data: {
      clientName: client.name,
      periodo: `${days} dias`,
      hasData: true,
      reportsCount: reports.length,
      metrics: {
        totalSpend: metrics.totalSpend,
        totalImpressions: metrics.totalImpressions,
        totalClicks: metrics.totalClicks,
        totalConversions: metrics.totalConversions,
        ctr: ctr.toFixed(2),
        cpc: cpc.toFixed(2),
        cpa: cpa.toFixed(2)
      },
      message: `Performance de ${client.name} (${days}d): R$ ${metrics.totalSpend.toFixed(2)} investidos, ${metrics.totalConversions} conversões, CPA R$ ${cpa.toFixed(2)}`
    }
  };
}

// ==================== EXECUTOR DE TOOLS AVANÇADOS ====================

/**
 * Executa um tool avançado
 */
async function executeAdvancedTool(
  name: string,
  parameters: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  // Inicializar executors
  const batchExecutor = new BatchActionsExecutor(userId);
  const intelligenceExecutor = new IntelligenceExecutor(userId);
  const communicationExecutor = new CommunicationExecutor(userId);
  const metaExecutor = new MetaActionsExecutor(userId);

  try {
    // Verificar se requer confirmação e ainda não foi confirmado
    if (requiresConfirmation(name) && !parameters._confirmed) {
      return await prepareAdvancedConfirmation(name, parameters, userId);
    }

    // Executar tool
    let result: unknown;

    switch (name) {
      // === BATCH ACTIONS ===
      case 'cobrar_todos_vencidos':
        result = await batchExecutor.executarCobrancaLote(
          parameters._confirmationData as BatchCobrancaData
        );
        break;

      case 'confirmar_reunioes_amanha':
        result = await batchExecutor.executarConfirmacaoReunioes(
          parameters._confirmationData as BatchConfirmacaoReuniaoData
        );
        break;

      case 'gerar_faturas_mes':
        result = await batchExecutor.executarGeracaoFaturas(
          parameters._confirmationData as GerarFaturasData
        );
        break;

      case 'enviar_followup_lote':
        result = await batchExecutor.executarFollowupLote(
          parameters._confirmationData as BatchFollowupData
        );
        break;

      // === INTELLIGENCE ===
      case 'sugerir_acoes_dia':
        result = await intelligenceExecutor.sugerirAcoesDia(parameters as {
          limite?: number;
          incluirFinanceiro?: boolean;
          incluirOperacional?: boolean;
          incluirRelacionamento?: boolean;
        });
        break;

      case 'diagnosticar_cliente':
        result = await intelligenceExecutor.diagnosticarCliente(parameters as {
          clientId?: string;
          query?: string;
          incluirPerformance?: boolean;
          incluirHistorico?: boolean;
        });
        break;

      case 'identificar_clientes_risco':
        result = await intelligenceExecutor.identificarClientesRisco(parameters as {
          nivelMinimo?: 'critico' | 'alto' | 'medio';
          limite?: number;
          incluirIndicadores?: boolean;
        });
        break;

      case 'prever_faturamento':
        result = await intelligenceExecutor.preverFaturamento(parameters as {
          mes?: string;
          incluirDetalhamento?: boolean;
          incluirComparativo?: boolean;
        });
        break;

      // === COMMUNICATION ===
      case 'preparar_reuniao':
        result = await communicationExecutor.prepararReuniao(parameters as {
          meetingId?: string;
          clientId?: string;
          query?: string;
        });
        break;

      case 'registrar_pos_reuniao':
        result = await communicationExecutor.executarPosReuniao(
          parameters._confirmationData as RegistroPosReuniao
        );
        break;

      case 'agendar_recorrente':
        result = await communicationExecutor.executarAgendamentoRecorrente(
          parameters._confirmationData as AgendamentoRecorrente
        );
        break;

      case 'gerar_relatorio_cliente':
        result = await communicationExecutor.gerarRelatorioCliente(parameters as {
          clientId?: string;
          query?: string;
          periodo?: '7d' | '15d' | '30d' | '60d' | '90d';
          incluirComparativo?: boolean;
          formato?: 'resumido' | 'completo';
        });
        break;

      // === META ACTIONS ===
      case 'executar_rotina_matinal':
        result = await metaExecutor.executarRotinaMatinal(parameters as {
          incluirMetricas?: boolean;
          incluirSugestoes?: boolean;
        });
        break;

      case 'encerrar_dia':
        result = await metaExecutor.encerrarDia(parameters as {
          incluirPreviewAmanha?: boolean;
        });
        break;

      case 'onboarding_cliente':
        result = await metaExecutor.executarOnboarding(
          parameters._confirmationData as OnboardingCliente
        );
        break;

      case 'health_check_geral':
        result = await metaExecutor.executarHealthCheck(parameters as {
          periodo?: '30dias' | '60dias' | '90dias';
          incluirRecomendacoes?: boolean;
        });
        break;

      default:
        return {
          success: false,
          error: `Tool avançado não reconhecido: ${name}`
        };
    }

    return {
      success: true,
      data: result as Record<string, unknown>
    };
  } catch (error) {
    console.error(`[tool-executor] Erro ao executar tool avançado ${name}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Prepara confirmação para tools avançados que requerem aprovação
 */
async function prepareAdvancedConfirmation(
  name: string,
  parameters: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const batchExecutor = new BatchActionsExecutor(userId);
  const communicationExecutor = new CommunicationExecutor(userId);
  const metaExecutor = new MetaActionsExecutor(userId);

  try {
    let confirmationResult: { confirmation: ConfirmationData };

    switch (name) {
      // === BATCH ACTIONS ===
      case 'cobrar_todos_vencidos':
        confirmationResult = await batchExecutor.prepararCobrancaLote(parameters as {
          diasMinimo?: number;
          diasMaximo?: number;
          limite?: number;
          templateMensagem?: 'padrao' | 'leve' | 'firme';
        });
        break;

      case 'confirmar_reunioes_amanha':
        confirmationResult = await batchExecutor.prepararConfirmacaoReunioes(parameters as {
          data?: string;
          templateMensagem?: 'formal' | 'casual';
        });
        break;

      case 'gerar_faturas_mes':
        confirmationResult = await batchExecutor.prepararGeracaoFaturas(parameters as {
          mes?: string;
          diaVencimentoPadrao?: number;
          apenasClientesAtivos?: boolean;
        });
        break;

      case 'enviar_followup_lote':
        confirmationResult = await batchExecutor.prepararFollowupLote(parameters as {
          diasMinimo?: number;
          diasMaximo?: number;
          limite?: number;
          templateMensagem?: 'checkup' | 'novidades' | 'valor';
        });
        break;

      // === COMMUNICATION ===
      case 'registrar_pos_reuniao':
        confirmationResult = await communicationExecutor.prepararPosReuniao(parameters as {
          meetingId?: string;
          clientId?: string;
          query?: string;
          anotacoes?: string;
          decisoes?: string;
          proximosPassos?: string;
          feedbackCliente?: string;
          agendarProxima?: boolean;
        });
        break;

      case 'agendar_recorrente':
        confirmationResult = await communicationExecutor.prepararAgendamentoRecorrente(parameters as {
          clientId?: string;
          query?: string;
          tipo?: 'reuniao' | 'tarefa' | 'lembrete';
          frequencia?: 'semanal' | 'quinzenal' | 'mensal';
          diaSemana?: string;
          diaDoMes?: number;
          horario?: string;
          titulo?: string;
          quantidadeOcorrencias?: number;
        });
        break;

      // === META ACTIONS ===
      case 'onboarding_cliente':
        confirmationResult = await metaExecutor.prepararOnboarding(parameters as {
          clientId?: string;
          query?: string;
          primeiraReuniaoData?: string;
          primeiraReuniaoHorario?: string;
          valorMensal?: number;
          diaVencimento?: number;
        });
        break;

      default:
        return {
          success: false,
          error: `Tool ${name} não configurado para confirmação.`
        };
    }

    return {
      success: true,
      data: {
        requiresConfirmation: true,
        confirmation: confirmationResult.confirmation
      }
    };
  } catch (error) {
    console.error(`[tool-executor] Erro ao preparar confirmação ${name}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
