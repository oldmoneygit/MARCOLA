/**
 * @file tool-executor.ts
 * @description Executor de tools do MARCOLA Assistant
 * @module lib/assistant
 */

import { createClient } from '@/lib/supabase/server';
import { getZAPIService } from '@/lib/whatsapp';
import type { ToolCall, ToolResult, ConfirmationData } from './types';
import { executarPesquisaWebhook, mapDbLeadToTs, calculateLeadStats } from '@/lib/lead-sniper';
import type { TipoNegocio } from '@/types/lead-sniper';

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

      // ==================== GESTÃO DE CLIENTES (AUTONOMIA IA) ====================
      case 'atualizar_cliente':
        return await atualizarCliente(userId, parameters);

      case 'criar_cliente':
        return await criarCliente(userId, parameters);

      case 'criar_nota':
        return await criarNota(userId, parameters);

      case 'registrar_execucao':
        return await registrarExecucao(userId, parameters);

      // ==================== INTELIGÊNCIA PROATIVA ====================
      case 'sugerir_acoes_prioritarias':
        return await sugerirAcoesPrioritarias(userId, parameters);

      case 'diagnostico_operacao':
        return await diagnosticoOperacao(userId, parameters);

      case 'pipeline_overview':
        return await pipelineOverview(userId);

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

      // === LEAD SNIPER ===
      case 'executar_pesquisa_mercado':
        result = await executeLeadSniperPesquisa(userId, parameters);
        break;

      case 'listar_leads':
        result = await executeLeadSniperListarLeads(userId, parameters);
        break;

      case 'buscar_lead':
        result = await executeLeadSniperBuscarLead(userId, parameters);
        break;

      case 'atualizar_status_lead':
        result = await executeLeadSniperAtualizarStatus(userId, parameters);
        break;

      case 'registrar_interacao_lead':
        result = await executeLeadSniperRegistrarInteracao(userId, parameters);
        break;

      case 'estatisticas_leads':
        result = await executeLeadSniperEstatisticas(userId);
        break;

      case 'listar_pesquisas_mercado':
        result = await executeLeadSniperListarPesquisas(userId, parameters);
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

      // === LEAD SNIPER ===
      case 'executar_pesquisa_mercado':
      case 'atualizar_status_lead':
      case 'registrar_interacao_lead':
        // Lead Sniper tools que requerem confirmação
        return {
          success: true,
          data: {
            requiresConfirmation: true,
            confirmation: {
              type: 'generic',
              message: `Confirmar execução de ${name}?`,
              data: parameters
            }
          }
        };

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

// ==================== LEAD SNIPER EXECUTORS ====================

/**
 * Executa pesquisa de mercado via Lead Sniper
 */
async function executeLeadSniperPesquisa(
  _userId: string,
  params: Record<string, unknown>
): Promise<Record<string, unknown>> {
  try {
    // Preparar cidades com raio padrão
    const cidadesRaw = params.cidades as Array<{ nome: string; lat: number; lng: number; raio?: number }>;
    const cidades = cidadesRaw.map((c) => ({
      nome: c.nome,
      lat: c.lat,
      lng: c.lng,
      raio: c.raio ?? 5000,
    }));

    // Chamar o webhook de pesquisa
    const response = await executarPesquisaWebhook({
      tipo: params.tipo as TipoNegocio,
      cidades,
      scoreMinimo: params.scoreMinimo as number | undefined,
      maxPorCidade: params.maxPorCidade as number | undefined,
      clienteId: params.clienteId as string | undefined,
    });

    return {
      success: true,
      leadsEncontrados: response.estatisticas.total,
      estatisticas: response.estatisticas,
      message: `Pesquisa concluída: ${response.estatisticas.total} leads encontrados`
    };
  } catch (error) {
    console.error('[executeLeadSniperPesquisa] Erro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao executar pesquisa'
    };
  }
}

/**
 * Lista leads prospectados
 */
async function executeLeadSniperListarLeads(
  userId: string,
  params: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const supabase = await createClient();

  let query = supabase
    .from('leads_prospectados')
    .select('*')
    .eq('user_id', userId)
    .order('score', { ascending: false });

  // Aplicar filtros
  if (params.classificacao) {
    query = query.eq('classificacao', params.classificacao);
  }
  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.cidade) {
    query = query.ilike('cidade', `%${params.cidade}%`);
  }
  if (params.temWhatsapp !== undefined) {
    query = query.eq('tem_whatsapp', params.temWhatsapp);
  }
  if (params.temSite !== undefined) {
    query = query.eq('tem_site', params.temSite);
  }
  if (params.tipoNegocio) {
    query = query.eq('tipo_negocio', params.tipoNegocio);
  }
  if (params.pesquisaId) {
    query = query.eq('pesquisa_id', params.pesquisaId);
  }

  const limit = (params.limit as number) || 20;
  query = query.limit(limit);

  const { data: leads, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  const mappedLeads = (leads || []).map(mapDbLeadToTs);

  return {
    success: true,
    leads: mappedLeads,
    total: mappedLeads.length,
    message: `${mappedLeads.length} leads encontrados`
  };
}

/**
 * Busca um lead específico
 */
async function executeLeadSniperBuscarLead(
  userId: string,
  params: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const supabase = await createClient();

  let query = supabase
    .from('leads_prospectados')
    .select('*')
    .eq('user_id', userId);

  if (params.leadId) {
    query = query.eq('id', params.leadId);
  } else if (params.nome) {
    query = query.ilike('nome', `%${params.nome}%`);
  } else {
    return { success: false, error: 'Informe o ID ou nome do lead' };
  }

  const { data: leads, error } = await query.limit(1);

  if (error) {
    return { success: false, error: error.message };
  }

  if (!leads || leads.length === 0) {
    return { success: false, error: 'Lead não encontrado' };
  }

  const lead = mapDbLeadToTs(leads[0]);

  return {
    success: true,
    lead,
    message: `Lead encontrado: ${lead.nome}`
  };
}

/**
 * Atualiza status de um lead
 */
async function executeLeadSniperAtualizarStatus(
  userId: string,
  params: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const supabase = await createClient();

  const { leadId, status, notas } = params;

  if (!leadId || !status) {
    return { success: false, error: 'ID do lead e status são obrigatórios' };
  }

  const updateData: Record<string, unknown> = { status };
  if (notas) {
    updateData.notas = notas;
  }
  if (status === 'CONTATADO') {
    updateData.data_contato = new Date().toISOString();
  }
  if (status === 'RESPONDEU') {
    updateData.data_resposta = new Date().toISOString();
  }

  const { data: lead, error } = await supabase
    .from('leads_prospectados')
    .update(updateData)
    .eq('id', leadId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    lead: mapDbLeadToTs(lead),
    message: `Status do lead atualizado para ${status}`
  };
}

/**
 * Registra interação com lead
 */
async function executeLeadSniperRegistrarInteracao(
  userId: string,
  params: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const supabase = await createClient();

  const { leadId, tipo, direcao, conteudo, resultado } = params;

  if (!leadId || !tipo || !conteudo) {
    return { success: false, error: 'ID do lead, tipo e conteúdo são obrigatórios' };
  }

  const { data: interacao, error } = await supabase
    .from('lead_interacoes')
    .insert({
      lead_id: leadId,
      user_id: userId,
      tipo,
      direcao: direcao || 'ENVIADO',
      conteudo,
      resultado: resultado || null
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    interacao,
    message: `Interação ${tipo} registrada com sucesso`
  };
}

/**
 * Obtém estatísticas dos leads
 */
async function executeLeadSniperEstatisticas(
  userId: string
): Promise<Record<string, unknown>> {
  const supabase = await createClient();

  const { data: leads, error } = await supabase
    .from('leads_prospectados')
    .select('classificacao, status, cidade, tem_whatsapp, tem_site, score')
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  const stats = calculateLeadStats(leads || []);

  // Buscar contagem de pesquisas
  const { count: totalPesquisas } = await supabase
    .from('pesquisas_mercado')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  return {
    success: true,
    ...stats,
    totalPesquisas: totalPesquisas || 0,
    message: `${stats.total} leads prospectados no total`
  };
}

/**
 * Lista pesquisas de mercado realizadas
 */
async function executeLeadSniperListarPesquisas(
  userId: string,
  params: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const supabase = await createClient();

  let query = supabase
    .from('pesquisas_mercado')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (params.status) {
    query = query.eq('status', params.status);
  }

  const limit = (params.limit as number) || 10;
  query = query.limit(limit);

  const { data: pesquisas, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    pesquisas: pesquisas || [],
    total: pesquisas?.length || 0,
    message: `${pesquisas?.length || 0} pesquisas encontradas`
  };
}

// ==================== GESTÃO DE CLIENTES (AUTONOMIA IA) ====================

/**
 * Atualiza dados de um cliente existente
 */
async function atualizarCliente(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();
  const clientId = params.clientId as string;

  if (!clientId) {
    return { success: false, error: 'ID do cliente é obrigatório' };
  }

  // Verificar se o cliente pertence ao usuário
  const { data: existingClient, error: checkError } = await supabase
    .from('clients')
    .select('id, name, status')
    .eq('id', clientId)
    .eq('user_id', userId)
    .single();

  if (checkError || !existingClient) {
    return { success: false, error: 'Cliente não encontrado' };
  }

  // Preparar dados para atualização
  const updateData: Record<string, unknown> = {};

  if (params.status) { updateData.status = params.status; }
  if (params.contact_name) { updateData.contact_name = params.contact_name; }
  if (params.contact_phone) { updateData.contact_phone = params.contact_phone; }
  if (params.contact_email) { updateData.contact_email = params.contact_email; }
  if (params.monthly_value) { updateData.monthly_value = params.monthly_value; }
  if (params.due_day) { updateData.due_day = params.due_day; }

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: 'Nenhum dado para atualizar' };
  }

  updateData.updated_at = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', clientId)
    .eq('user_id', userId);

  if (updateError) {
    return { success: false, error: formatDatabaseError(updateError) };
  }

  const statusLabels: Record<string, string> = {
    negotiation: 'Em Negociação',
    proposal: 'Proposta Enviada',
    follow_up: 'Follow-up',
    collection: 'Em Cobrança',
    active: 'Ativo',
    paused: 'Pausado',
    inactive: 'Inativo'
  };

  const statusMsg = params.status
    ? ` Status alterado para: ${statusLabels[params.status as string] || params.status}`
    : '';

  return {
    success: true,
    data: {
      clientId,
      clientName: existingClient.name,
      previousStatus: existingClient.status,
      newStatus: params.status || existingClient.status,
      updatedFields: Object.keys(updateData),
      message: `Cliente "${existingClient.name}" atualizado com sucesso!${statusMsg}`
    }
  };
}

/**
 * Cria um novo cliente no sistema
 */
async function criarCliente(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();

  const name = params.name as string;
  const segment = params.segment as string;

  if (!name || !segment) {
    return { success: false, error: 'Nome e segmento são obrigatórios' };
  }

  const newClient = {
    user_id: userId,
    name,
    segment,
    status: (params.status as string) || 'negotiation',
    contact_name: params.contact_name || null,
    contact_phone: params.contact_phone || null,
    contact_email: params.contact_email || null,
    monthly_value: params.monthly_value || 0,
    due_day: params.due_day || 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: client, error } = await supabase
    .from('clients')
    .insert(newClient)
    .select('id, name, status')
    .single();

  if (error) {
    return { success: false, error: formatDatabaseError(error) };
  }

  return {
    success: true,
    data: {
      clientId: client.id,
      clientName: client.name,
      status: client.status,
      message: `Cliente "${name}" criado com sucesso no status "${client.status}"!`
    }
  };
}

/**
 * Cria uma nota sobre um cliente
 */
async function criarNota(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();

  const clientId = params.clientId as string;
  const content = params.content as string;
  const type = (params.type as string) || 'general';

  if (!clientId || !content) {
    return { success: false, error: 'ID do cliente e conteúdo são obrigatórios' };
  }

  // Verificar se o cliente existe
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .eq('user_id', userId)
    .single();

  if (clientError || !client) {
    return { success: false, error: 'Cliente não encontrado' };
  }

  const { data: note, error } = await supabase
    .from('client_notes')
    .insert({
      user_id: userId,
      client_id: clientId,
      content,
      type,
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: formatDatabaseError(error) };
  }

  return {
    success: true,
    data: {
      noteId: note.id,
      clientId,
      clientName: client.name,
      type,
      message: `Nota adicionada ao cliente "${client.name}"!`
    }
  };
}

/**
 * Registra uma execução/ação no histórico
 */
async function registrarExecucao(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();

  const actionType = params.actionType as string;
  const title = params.title as string;

  if (!actionType || !title) {
    return { success: false, error: 'Tipo de ação e título são obrigatórios' };
  }

  const execution = {
    user_id: userId,
    client_id: params.clientId || null,
    action_type: actionType,
    title,
    description: params.description || null,
    optimization_type: params.optimizationType || null,
    result: params.result || 'success',
    executed_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('task_executions')
    .insert(execution)
    .select('id')
    .single();

  if (error) {
    return { success: false, error: formatDatabaseError(error) };
  }

  return {
    success: true,
    data: {
      executionId: data.id,
      actionType,
      title,
      message: `Execução "${title}" registrada com sucesso!`
    }
  };
}

// ==================== INTELIGÊNCIA PROATIVA ====================

/**
 * Sugere ações prioritárias baseado no pipeline CRM
 */
async function sugerirAcoesPrioritarias(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();
  const foco = (params.foco as string) || 'geral';

  // Buscar dados para análise
  const [clientsResult, tasksResult, paymentsResult, meetingsResult] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, status, monthly_value, contact_phone, contact_name')
      .eq('user_id', userId)
      .neq('status', 'inactive'),
    supabase
      .from('tasks')
      .select('id, title, client_id, due_date, priority, status')
      .eq('user_id', userId)
      .in('status', ['todo', 'doing'])
      .order('due_date', { ascending: true })
      .limit(20),
    supabase
      .from('payments')
      .select('id, client_id, amount, due_date, status')
      .eq('user_id', userId)
      .in('status', ['pending', 'overdue'])
      .order('due_date', { ascending: true })
      .limit(20),
    supabase
      .from('meetings')
      .select('id, client_id, date, time')
      .eq('user_id', userId)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(10)
  ]);

  const clients = clientsResult.data || [];
  const tasks = tasksResult.data || [];
  const payments = paymentsResult.data || [];
  const meetings = meetingsResult.data || [];

  // Criar mapa de clientes para lookup rápido
  const clientMap = new Map(clients.map(c => [c.id, c]));

  // Organizar sugestões por prioridade
  const sugestoes: Array<{
    prioridade: number;
    tipo: string;
    acao: string;
    cliente?: string;
    clienteId?: string;
    detalhe: string;
    urgencia: 'critica' | 'alta' | 'media' | 'baixa';
  }> = [];

  // PRIORIDADE 1: Clientes em negociação (hot leads)
  const emNegociacao = clients.filter(c => c.status === 'negotiation');
  emNegociacao.forEach(c => {
    sugestoes.push({
      prioridade: 1,
      tipo: 'vendas',
      acao: 'Fazer follow-up urgente',
      cliente: c.name,
      clienteId: c.id,
      detalhe: `Lead quente! ${c.contact_name ? `Contato: ${c.contact_name}` : ''} ${c.contact_phone ? `Tel: ${c.contact_phone}` : ''}`,
      urgencia: 'critica'
    });
  });

  // PRIORIDADE 2: Clientes com proposta enviada
  const comProposta = clients.filter(c => c.status === 'proposal');
  comProposta.forEach(c => {
    sugestoes.push({
      prioridade: 2,
      tipo: 'vendas',
      acao: 'Fazer follow-up da proposta',
      cliente: c.name,
      clienteId: c.id,
      detalhe: `Proposta enviada - verificar interesse. ${c.monthly_value ? `Valor: R$ ${c.monthly_value}` : ''}`,
      urgencia: 'alta'
    });
  });

  // PRIORIDADE 3: Pagamentos atrasados
  const pagamentosAtrasados = payments.filter(p => p.status === 'overdue');
  pagamentosAtrasados.forEach(p => {
    const client = clientMap.get(p.client_id);
    sugestoes.push({
      prioridade: 3,
      tipo: 'cobranca',
      acao: 'Cobrar pagamento atrasado',
      cliente: client?.name || 'Cliente',
      clienteId: p.client_id,
      detalhe: `R$ ${p.amount} vencido em ${new Date(p.due_date).toLocaleDateString('pt-BR')}`,
      urgencia: 'alta'
    });
  });

  // PRIORIDADE 4: Clientes em follow-up
  const emFollowUp = clients.filter(c => c.status === 'follow_up');
  emFollowUp.forEach(c => {
    sugestoes.push({
      prioridade: 4,
      tipo: 'vendas',
      acao: 'Entrar em contato',
      cliente: c.name,
      clienteId: c.id,
      detalhe: 'Cliente precisa de acompanhamento',
      urgencia: 'media'
    });
  });

  // PRIORIDADE 5: Tarefas urgentes
  const tarefasUrgentes = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
  tarefasUrgentes.slice(0, 5).forEach(t => {
    const client = t.client_id ? clientMap.get(t.client_id) : null;
    sugestoes.push({
      prioridade: 5,
      tipo: 'entrega',
      acao: t.title,
      cliente: client?.name,
      clienteId: t.client_id || undefined,
      detalhe: `Tarefa ${t.priority === 'urgent' ? 'URGENTE' : 'alta prioridade'}`,
      urgencia: t.priority === 'urgent' ? 'critica' : 'alta'
    });
  });

  // PRIORIDADE 6: Reuniões de hoje
  const hoje = new Date().toISOString().split('T')[0];
  const reunioesHoje = meetings.filter(m => m.date === hoje);
  reunioesHoje.forEach(m => {
    const client = clientMap.get(m.client_id);
    sugestoes.push({
      prioridade: 6,
      tipo: 'entrega',
      acao: 'Reunião agendada',
      cliente: client?.name || 'Cliente',
      clienteId: m.client_id,
      detalhe: `Hoje às ${m.time}`,
      urgencia: 'alta'
    });
  });

  // Filtrar por foco se especificado
  let sugestoesFiltradas = sugestoes;
  if (foco !== 'geral') {
    sugestoesFiltradas = sugestoes.filter(s => s.tipo === foco);
  }

  // Ordenar por prioridade e urgência
  sugestoesFiltradas.sort((a, b) => {
    if (a.prioridade !== b.prioridade) { return a.prioridade - b.prioridade; }
    const urgenciaOrder = { critica: 0, alta: 1, media: 2, baixa: 3 };
    return urgenciaOrder[a.urgencia] - urgenciaOrder[b.urgencia];
  });

  return {
    success: true,
    data: {
      sugestoes: sugestoesFiltradas.slice(0, 10),
      resumo: {
        emNegociacao: emNegociacao.length,
        comProposta: comProposta.length,
        emFollowUp: emFollowUp.length,
        pagamentosAtrasados: pagamentosAtrasados.length,
        tarefasUrgentes: tarefasUrgentes.length,
        reunioesHoje: reunioesHoje.length
      },
      foco,
      message: `${sugestoesFiltradas.length} ações sugeridas. ${emNegociacao.length} leads quentes, ${pagamentosAtrasados.length} pagamentos atrasados.`
    }
  };
}

/**
 * Faz diagnóstico da operação ou de um cliente específico
 */
async function diagnosticoOperacao(
  userId: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = await createClient();
  const clientId = params.clientId as string | undefined;

  if (clientId) {
    // Diagnóstico de cliente específico
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', userId)
      .single();

    if (clientError || !client) {
      return { success: false, error: 'Cliente não encontrado' };
    }

    const [tasksResult, paymentsResult, notesResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, status, priority')
        .eq('client_id', clientId)
        .eq('user_id', userId),
      supabase
        .from('payments')
        .select('id, status, amount')
        .eq('client_id', clientId)
        .eq('user_id', userId),
      supabase
        .from('client_notes')
        .select('id, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    const tasks = tasksResult.data || [];
    const payments = paymentsResult.data || [];
    const notes = notesResult.data || [];

    const tarefasPendentes = tasks.filter(t => t.status !== 'done').length;
    const pagamentosAtrasados = payments.filter(p => p.status === 'overdue').length;
    const totalRecebido = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

    const statusLabels: Record<string, string> = {
      negotiation: 'Em Negociação',
      proposal: 'Proposta Enviada',
      follow_up: 'Follow-up',
      collection: 'Em Cobrança',
      active: 'Ativo',
      paused: 'Pausado',
      inactive: 'Inativo'
    };

    return {
      success: true,
      data: {
        cliente: {
          nome: client.name,
          status: statusLabels[client.status] || client.status,
          segmento: client.segment,
          valorMensal: client.monthly_value,
          contato: client.contact_name,
          telefone: client.contact_phone
        },
        metricas: {
          tarefasPendentes,
          pagamentosAtrasados,
          totalRecebido,
          notasRecentes: notes.length
        },
        alertas: [
          ...(pagamentosAtrasados > 0 ? [`⚠️ ${pagamentosAtrasados} pagamento(s) atrasado(s)`] : []),
          ...(tarefasPendentes > 3 ? [`⚠️ ${tarefasPendentes} tarefas pendentes`] : []),
          ...(client.status === 'collection' ? ['🔴 Cliente em cobrança'] : [])
        ],
        message: `Diagnóstico de "${client.name}": ${tarefasPendentes} tarefas pendentes, ${pagamentosAtrasados} pagamentos atrasados.`
      }
    };
  }

  // Diagnóstico geral da operação
  const [clientsResult, tasksResult, paymentsResult] = await Promise.all([
    supabase
      .from('clients')
      .select('id, status, monthly_value')
      .eq('user_id', userId),
    supabase
      .from('tasks')
      .select('id, status, priority')
      .eq('user_id', userId)
      .in('status', ['todo', 'doing']),
    supabase
      .from('payments')
      .select('id, status, amount')
      .eq('user_id', userId)
      .in('status', ['pending', 'overdue'])
  ]);

  const clients = clientsResult.data || [];
  const tasks = tasksResult.data || [];
  const payments = paymentsResult.data || [];

  // Contagens por status CRM
  const pipeline = {
    negotiation: clients.filter(c => c.status === 'negotiation').length,
    proposal: clients.filter(c => c.status === 'proposal').length,
    follow_up: clients.filter(c => c.status === 'follow_up').length,
    collection: clients.filter(c => c.status === 'collection').length,
    active: clients.filter(c => c.status === 'active').length,
    paused: clients.filter(c => c.status === 'paused').length,
    inactive: clients.filter(c => c.status === 'inactive').length
  };

  const receitaAtivos = clients
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + (c.monthly_value || 0), 0);

  const receitaPotencial = clients
    .filter(c => ['negotiation', 'proposal', 'follow_up'].includes(c.status))
    .reduce((sum, c) => sum + (c.monthly_value || 0), 0);

  const pagamentosAtrasados = payments.filter(p => p.status === 'overdue');
  const valorAtrasado = pagamentosAtrasados.reduce((sum, p) => sum + p.amount, 0);

  const tarefasUrgentes = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;

  const alertas: string[] = [];
  if (pagamentosAtrasados.length > 0) { alertas.push(`🔴 ${pagamentosAtrasados.length} pagamentos atrasados (R$ ${valorAtrasado.toFixed(2)})`); }
  if (tarefasUrgentes > 0) { alertas.push(`⚠️ ${tarefasUrgentes} tarefas urgentes/alta prioridade`); }
  if (pipeline.negotiation > 0) { alertas.push(`🟣 ${pipeline.negotiation} leads quentes aguardando ação!`); }
  if (pipeline.collection > 0) { alertas.push(`🔴 ${pipeline.collection} clientes em cobrança`); }

  return {
    success: true,
    data: {
      pipeline,
      financeiro: {
        receitaMensal: receitaAtivos,
        receitaPotencial,
        valorAtrasado,
        pagamentosPendentes: payments.length
      },
      operacional: {
        tarefasPendentes: tasks.length,
        tarefasUrgentes,
        clientesTotal: clients.length,
        clientesAtivos: pipeline.active
      },
      alertas,
      message: `Operação: ${pipeline.active} clientes ativos (R$ ${receitaAtivos.toFixed(2)}/mês). ${pipeline.negotiation + pipeline.proposal} oportunidades no funil. ${alertas.length} alertas.`
    }
  };
}

/**
 * Retorna visão geral do pipeline CRM
 */
async function pipelineOverview(userId: string): Promise<ToolResult> {
  const supabase = await createClient();

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, status, monthly_value, contact_name, contact_phone')
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: formatDatabaseError(error) };
  }

  const pipeline: Record<string, Array<{ id: string; name: string; value: number; contact?: string }>> = {
    negotiation: [],
    proposal: [],
    follow_up: [],
    collection: [],
    active: [],
    paused: [],
    inactive: []
  };

  const totais: Record<string, { count: number; value: number }> = {
    negotiation: { count: 0, value: 0 },
    proposal: { count: 0, value: 0 },
    follow_up: { count: 0, value: 0 },
    collection: { count: 0, value: 0 },
    active: { count: 0, value: 0 },
    paused: { count: 0, value: 0 },
    inactive: { count: 0, value: 0 }
  };

  (clients || []).forEach(c => {
    const status = c.status as string;
    if (pipeline[status] && totais[status]) {
      pipeline[status].push({
        id: c.id,
        name: c.name,
        value: c.monthly_value || 0,
        contact: c.contact_name || c.contact_phone
      });
      totais[status].count++;
      totais[status].value += c.monthly_value || 0;
    }
  });

  const statusLabels: Record<string, string> = {
    negotiation: '🟣 Em Negociação',
    proposal: '🔵 Proposta Enviada',
    follow_up: '🟠 Follow-up',
    collection: '🔴 Em Cobrança',
    active: '🟢 Ativos',
    paused: '🟡 Pausados',
    inactive: '⚫ Inativos'
  };

  // Formatar resumo legível
  const resumo = Object.entries(totais)
    .filter(([, data]) => data.count > 0)
    .map(([status, data]) => `${statusLabels[status]}: ${data.count} (R$ ${data.value.toFixed(2)})`)
    .join('\n');

  return {
    success: true,
    data: {
      pipeline,
      totais,
      totalClientes: clients?.length || 0,
      receitaPotencial: (totais.negotiation?.value || 0) + (totais.proposal?.value || 0) + (totais.follow_up?.value || 0),
      receitaAtiva: totais.active?.value || 0,
      message: `Pipeline CRM:\n${resumo}`
    }
  };
}
