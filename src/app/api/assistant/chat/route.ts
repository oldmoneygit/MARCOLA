/**
 * @file route.ts
 * @description API principal do MARCOLA Assistant - processa mensagens do usuário
 * @module app/api/assistant/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  processMessage,
  buildUserContext,
  toolRequiresConfirmation,
  getConfirmationType,
  hasAvailableProvider,
  executeTool
} from '@/lib/assistant';
import type {
  ChatApiResponse,
  ConfirmationData,
  ConfirmationType,
  MeetingConfirmationData,
  MeetingDeleteConfirmationData,
  MeetingUpdateConfirmationData,
  TaskConfirmationData,
  WhatsAppConfirmationData,
  PaymentConfirmationData,
  ReminderConfirmationData,
  ClientSelectData,
  GenericConfirmationData,
  ToolCall,
  SuggestedAction
} from '@/lib/assistant/types';

/**
 * POST /api/assistant/chat
 * Processa uma mensagem do usuário e retorna resposta do assistente
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ChatApiResponse>(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Obter dados da requisição
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json<ChatApiResponse>(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    // Verificar se há provedores disponíveis
    if (!hasAvailableProvider()) {
      return NextResponse.json<ChatApiResponse>(
        { error: 'Nenhuma API de IA configurada. Configure ANTHROPIC_API_KEY, OPENAI_API_KEY ou GOOGLE_API_KEY.' },
        { status: 503 }
      );
    }

    // Buscar contexto do usuário
    const context = await buildUserContext(user.id);

    // Processar mensagem com IA (fallback automático entre provedores)
    const aiResponse = await processMessage(
      message,
      context,
      conversationHistory
    );

    // Log do provedor utilizado
    console.log(`[/api/assistant/chat] Provedor usado: ${aiResponse.provider}`);

    // Se IA retornou tool calls
    if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
      const toolCall = aiResponse.toolCalls[0];

      // Verifica se toolCall existe (TypeScript safety)
      if (!toolCall) {
        return NextResponse.json<ChatApiResponse>({
          message: aiResponse.message
        });
      }

      // Verificar se requer confirmação
      if (toolRequiresConfirmation(toolCall.name)) {
        const confirmationType = getConfirmationType(toolCall.name);
        const confirmationData = await buildConfirmationData(
          toolCall,
          confirmationType,
          context,
          user.id
        );

        // Gerar mensagem descritiva se a IA não retornou nenhuma
        const message = aiResponse.message || getActionMessage(toolCall.name, confirmationType);

        return NextResponse.json<ChatApiResponse>({
          message,
          confirmation: confirmationData
        });
      }

      // Se não requer confirmação (consultas), executar diretamente
      try {
        const result = await executeTool(toolCall, user.id);

        if (!result.success) {
          return NextResponse.json<ChatApiResponse>({
            message: aiResponse.message || result.error || 'Erro ao executar consulta',
            error: result.error
          });
        }

        // Formatar resultado da consulta para exibição
        const formattedMessage = formatQueryResult(toolCall.name, result.data, aiResponse.message);
        const suggestions = generateQuerySuggestions(toolCall.name, result.data);

        return NextResponse.json<ChatApiResponse>({
          message: formattedMessage,
          result: result,
          suggestedActions: suggestions
        });
      } catch (execError) {
        console.error('[/api/assistant/chat] Erro ao executar tool:', execError);
        return NextResponse.json<ChatApiResponse>({
          message: aiResponse.message || 'Erro ao processar consulta',
          error: execError instanceof Error ? execError.message : 'Erro desconhecido'
        });
      }
    }

    // Resposta simples sem tool calls
    return NextResponse.json<ChatApiResponse>({
      message: aiResponse.message,
      suggestedActions: generateSuggestedActions(aiResponse.message, context)
    });

  } catch (error) {
    console.error('[/api/assistant/chat] Erro:', error);
    return NextResponse.json<ChatApiResponse>(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Constrói os dados de confirmação baseado no tool call
 */
async function buildConfirmationData(
  toolCall: ToolCall,
  confirmationType: ConfirmationType | undefined,
  context: { clients: Array<{ id: string; name: string; contactName?: string; phone?: string; segment?: string }> },
  userId?: string
): Promise<ConfirmationData> {
  const params = toolCall.parameters;
  const id = crypto.randomUUID();
  const now = new Date();

  // Buscar dados do cliente se fornecido
  let clientData: { id: string; name: string; contactName?: string; phone?: string } | null = null;
  if (params.clientId) {
    const client = context.clients.find(c => c.id === params.clientId);
    if (client) {
      clientData = {
        id: client.id,
        name: client.name,
        contactName: client.contactName,
        phone: client.phone
      };
    }
  }

  // Para ações de delete/update de reunião, buscar dados da reunião existente
  let meetingData: { id: string; date: string; time: string; type?: string; clientId: string; clientName: string; contactName?: string } | null = null;
  if ((confirmationType === 'meeting_delete' || confirmationType === 'meeting_update') && userId) {
    const supabase = await createClient();

    // Se tem meetingId, buscar diretamente
    if (params.meetingId) {
      const { data: meeting } = await supabase
        .from('meetings')
        .select(`
          id, date, time, type, client_id,
          client:clients!client_id(id, name, contact_name)
        `)
        .eq('id', params.meetingId)
        .eq('user_id', userId)
        .single();

      if (meeting) {
        const client = Array.isArray(meeting.client) ? meeting.client[0] : meeting.client;
        meetingData = {
          id: meeting.id,
          date: meeting.date,
          time: meeting.time || '',
          type: meeting.type,
          clientId: meeting.client_id,
          clientName: client?.name || 'Cliente',
          contactName: client?.contact_name
        };
      }
    }
    // Se tem clientId e date, buscar por eles
    else if (params.clientId && (params.date || params.currentDate)) {
      const dateToSearch = (params.date || params.currentDate) as string;
      const { data: meetings } = await supabase
        .from('meetings')
        .select(`
          id, date, time, type, client_id,
          client:clients!client_id(id, name, contact_name)
        `)
        .eq('user_id', userId)
        .eq('client_id', params.clientId)
        .eq('date', dateToSearch)
        .limit(1);

      const meeting = meetings?.[0];
      if (meeting) {
        const client = Array.isArray(meeting.client) ? meeting.client[0] : meeting.client;
        meetingData = {
          id: meeting.id,
          date: meeting.date,
          time: meeting.time || '',
          type: meeting.type,
          clientId: meeting.client_id,
          clientName: client?.name || 'Cliente',
          contactName: client?.contact_name
        };
      }
    }
  }

  switch (confirmationType) {
    case 'meeting':
      return {
        id,
        type: 'meeting',
        status: 'pending',
        data: {
          clientId: params.clientId as string,
          clientName: clientData?.name || 'Cliente',
          contactName: clientData?.contactName,
          date: params.date as string,
          time: params.time as string,
          type: (params.type as 'online' | 'presencial') || 'online',
          notes: params.notes as string | undefined
        } as MeetingConfirmationData,
        toolToExecute: toolCall,
        createdAt: now
      };

    case 'meeting_delete':
      return {
        id,
        type: 'meeting_delete',
        status: 'pending',
        data: {
          meetingId: meetingData?.id || params.meetingId as string || '',
          clientId: meetingData?.clientId || params.clientId as string || '',
          clientName: meetingData?.clientName || clientData?.name || 'Cliente',
          contactName: meetingData?.contactName || clientData?.contactName,
          date: meetingData?.date || params.date as string || '',
          time: meetingData?.time || '',
          type: meetingData?.type as 'online' | 'presencial' | undefined
        } as MeetingDeleteConfirmationData,
        toolToExecute: toolCall,
        createdAt: now
      };

    case 'meeting_update':
      return {
        id,
        type: 'meeting_update',
        status: 'pending',
        data: {
          meetingId: meetingData?.id || params.meetingId as string || '',
          clientId: meetingData?.clientId || params.clientId as string || '',
          clientName: meetingData?.clientName || clientData?.name || 'Cliente',
          contactName: meetingData?.contactName || clientData?.contactName,
          currentDate: meetingData?.date || params.currentDate as string || '',
          currentTime: meetingData?.time || '',
          newDate: params.newDate as string | undefined,
          newTime: params.newTime as string | undefined,
          newType: params.newType as 'online' | 'presencial' | undefined,
          type: meetingData?.type as 'online' | 'presencial' | undefined
        } as MeetingUpdateConfirmationData,
        toolToExecute: toolCall,
        createdAt: now
      };

    case 'task':
      return {
        id,
        type: 'task',
        status: 'pending',
        data: {
          clientId: params.clientId as string | undefined,
          clientName: clientData?.name,
          title: params.title as string,
          description: params.description as string | undefined,
          dueDate: params.dueDate as string | undefined,
          priority: (params.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
          category: params.category as string | undefined
        } as TaskConfirmationData,
        toolToExecute: toolCall,
        createdAt: now
      };

    case 'whatsapp':
      return {
        id,
        type: 'whatsapp',
        status: 'pending',
        data: {
          clientId: params.clientId as string,
          clientName: clientData?.name || 'Cliente',
          contactName: clientData?.contactName || clientData?.name || 'Cliente',
          phone: clientData?.phone || '',
          message: params.message as string
        } as WhatsAppConfirmationData,
        toolToExecute: toolCall,
        createdAt: now
      };

    case 'payment':
      return {
        id,
        type: 'payment',
        status: 'pending',
        data: {
          clientId: params.clientId as string,
          clientName: clientData?.name || 'Cliente',
          amount: params.amount as number,
          dueDate: params.dueDate as string,
          description: params.description as string | undefined
        } as PaymentConfirmationData,
        toolToExecute: toolCall,
        createdAt: now
      };

    case 'reminder':
      return {
        id,
        type: 'reminder',
        status: 'pending',
        data: {
          message: params.message as string,
          date: params.date as string,
          time: params.time as string | undefined,
          clientId: params.clientId as string | undefined,
          clientName: clientData?.name
        } as ReminderConfirmationData,
        toolToExecute: toolCall,
        createdAt: now
      };

    case 'client_select':
      // Caso especial - múltiplos clientes encontrados
      return {
        id,
        type: 'client_select',
        status: 'pending',
        data: {
          query: params.query as string,
          candidates: [],
          originalRequest: '',
          pendingTool: toolCall
        } as ClientSelectData,
        toolToExecute: toolCall,
        createdAt: now
      };

    default:
      return {
        id,
        type: 'generic',
        status: 'pending',
        data: {
          title: `Confirmar: ${toolCall.name}`,
          description: 'Deseja executar esta ação?',
          details: params
        } as GenericConfirmationData,
        toolToExecute: toolCall,
        createdAt: now
      };
  }
}

/**
 * Gera mensagem descritiva para uma ação
 */
function getActionMessage(toolName: string, confirmationType: ConfirmationType | undefined): string {
  switch (confirmationType) {
    case 'meeting':
      return 'Vou agendar essa reunião pra você. Confirme os detalhes abaixo:';
    case 'meeting_delete':
      return 'Você quer excluir essa reunião? Confirme abaixo:';
    case 'meeting_update':
      return 'Vou remarcar essa reunião. Confirme as alterações:';
    case 'task':
      return 'Beleza! Vou criar essa tarefa. Confere se está tudo certo:';
    case 'whatsapp':
      return 'Preparei a mensagem. Dá uma olhada antes de enviar:';
    case 'payment':
      return 'Vou registrar essa cobrança. Confirma os dados:';
    case 'reminder':
      return 'Vou criar esse lembrete pra você. Confere:';
    default:
      return `Confirme a ação "${toolName}" antes de executar:`;
  }
}

/**
 * Gera ações sugeridas baseadas no contexto
 */
function generateSuggestedActions(
  _message: string,
  context: { pendingTasks: unknown[]; pendingPayments: unknown[]; upcomingMeetings: unknown[] }
) {
  const suggestions = [];

  // Sugestões baseadas no contexto
  if (context.pendingTasks.length > 0) {
    suggestions.push({
      id: 'view-tasks',
      label: 'Ver tarefas pendentes',
      icon: 'CheckSquare',
      action: { type: 'navigate' as const, path: '/tasks' }
    });
  }

  if (context.pendingPayments.length > 0) {
    suggestions.push({
      id: 'view-payments',
      label: 'Ver pagamentos pendentes',
      icon: 'DollarSign',
      action: { type: 'navigate' as const, path: '/financial' }
    });
  }

  if (context.upcomingMeetings.length > 0) {
    suggestions.push({
      id: 'view-calendar',
      label: 'Ver agenda',
      icon: 'Calendar',
      action: { type: 'navigate' as const, path: '/calendar' }
    });
  }

  return suggestions.slice(0, 3);
}

/**
 * Formata o resultado de uma consulta para exibição amigável
 */
function formatQueryResult(
  toolName: string,
  data: Record<string, unknown> | undefined,
  aiMessage: string
): string {
  // Se a IA já retornou uma mensagem, usar ela
  if (aiMessage && aiMessage.trim()) {
    return aiMessage;
  }

  // Formatar baseado no tipo de consulta
  switch (toolName) {
    case 'listar_reunioes': {
      const meetings = data?.meetings as Array<{ date: string; time: string; clientName: string; type: string }> | undefined;
      if (!meetings || meetings.length === 0) {
        return 'Você não tem reuniões agendadas no período solicitado.';
      }
      const meetingList = meetings.slice(0, 5).map(m =>
        `• ${m.date} às ${m.time} - ${m.clientName} (${m.type})`
      ).join('\n');
      return `📅 **Suas próximas reuniões:**\n\n${meetingList}${meetings.length > 5 ? `\n\n... e mais ${meetings.length - 5} reuniões` : ''}`;
    }

    case 'listar_clientes': {
      const clients = data?.clients as Array<{ name: string; status: string; segment?: string }> | undefined;
      if (!clients || clients.length === 0) {
        return 'Você ainda não tem clientes cadastrados.';
      }
      const clientList = clients.slice(0, 10).map(c =>
        `• ${c.name}${c.segment ? ` (${c.segment})` : ''} - ${c.status}`
      ).join('\n');
      return `👥 **Seus clientes (${clients.length}):**\n\n${clientList}${clients.length > 10 ? `\n\n... e mais ${clients.length - 10} clientes` : ''}`;
    }

    case 'listar_tarefas': {
      const tasks = data?.tasks as Array<{ title: string; dueDate?: string; priority: string; clientName?: string }> | undefined;
      if (!tasks || tasks.length === 0) {
        return 'Você não tem tarefas pendentes no momento. Ótimo trabalho! 🎉';
      }
      const taskList = tasks.slice(0, 8).map(t => {
        const dueInfo = t.dueDate ? ` (até ${t.dueDate})` : '';
        const clientInfo = t.clientName ? ` - ${t.clientName}` : '';
        const priorityIcon = t.priority === 'urgent' ? '🔴' : t.priority === 'high' ? '🟠' : '⚪';
        return `${priorityIcon} ${t.title}${clientInfo}${dueInfo}`;
      }).join('\n');
      return `✅ **Tarefas pendentes (${tasks.length}):**\n\n${taskList}${tasks.length > 8 ? `\n\n... e mais ${tasks.length - 8} tarefas` : ''}`;
    }

    case 'listar_pagamentos': {
      const payments = data?.payments as Array<{ clientName: string; amount: number; dueDate: string; status: string; daysOverdue?: number }> | undefined;
      if (!payments || payments.length === 0) {
        return 'Não há pagamentos pendentes. Tudo em dia! 💰';
      }
      const paymentList = payments.slice(0, 8).map(p => {
        const overdue = p.daysOverdue && p.daysOverdue > 0 ? ` ⚠️ ${p.daysOverdue} dias atrasado` : '';
        return `• ${p.clientName}: R$ ${p.amount.toFixed(2)} (vence ${p.dueDate})${overdue}`;
      }).join('\n');
      return `💰 **Pagamentos pendentes (${payments.length}):**\n\n${paymentList}${payments.length > 8 ? `\n\n... e mais ${payments.length - 8} pagamentos` : ''}`;
    }

    case 'resumo_dia': {
      return data?.resumo as string || 'Resumo do dia gerado com sucesso.';
    }

    case 'resumo_cliente': {
      return data?.resumo as string || 'Resumo do cliente gerado com sucesso.';
    }

    case 'buscar_cliente': {
      // Suportar tanto 'clients' (array) quanto 'client' (singular) para compatibilidade
      const clients = data?.clients as Array<{
        name: string;
        id: string;
        segment?: string;
        contact_name?: string;
        contact_phone?: string;
        status?: string;
      }> | undefined;

      const singleClient = data?.client as {
        name: string;
        id: string;
        segment?: string;
        contact_name?: string;
        contact_phone?: string;
        status?: string;
      } | undefined;

      // Se não tem clients array mas tem client singular, usar esse
      const clientList = clients && clients.length > 0 ? clients : (singleClient ? [singleClient] : []);

      if (clientList.length === 0) {
        return 'Não encontrei nenhum cliente com esse nome. Verifique se digitou corretamente.';
      }

      if (clientList.length === 1) {
        const c = clientList[0];
        if (!c) {
          return 'Cliente não encontrado.';
        }

        // Montar resposta detalhada com telefone
        const lines: string[] = [];
        lines.push(`📋 **${c.name}**`);
        if (c.contact_name) {
          lines.push(`👤 Contato: ${c.contact_name}`);
        }
        if (c.contact_phone) {
          lines.push(`📱 Telefone: ${c.contact_phone}`);
        }
        if (c.segment) {
          lines.push(`🏷️ Segmento: ${c.segment}`);
        }
        if (c.status) {
          lines.push(`📊 Status: ${c.status}`);
        }

        return lines.join('\n');
      }

      // Múltiplos clientes
      const formattedList = clientList.map(c => {
        const phone = c.contact_phone ? ` - 📱 ${c.contact_phone}` : '';
        return `• **${c.name}**${c.segment ? ` (${c.segment})` : ''}${phone}`;
      }).join('\n');

      return `Encontrei ${clientList.length} clientes:\n\n${formattedList}`;
    }

    case 'analisar_performance': {
      return data?.analise as string || 'Análise de performance concluída.';
    }

    case 'gerar_mensagem': {
      const mensagem = data?.mensagem as string;
      const clientId = data?.clientId as string;
      const clientName = data?.clientName as string;
      if (mensagem) {
        // Incluir contexto oculto para a IA poder usar em chamadas subsequentes
        const contextHint = clientId ? `\n\n<!-- clientId:${clientId} clientName:${clientName || 'cliente'} -->` : '';
        return `📝 **Mensagem gerada para ${clientName || 'o cliente'}:**\n\n"${mensagem}"\n\n_Clique no botão abaixo para enviar pelo WhatsApp._${contextHint}`;
      }
      return 'Mensagem gerada com sucesso.';
    }

    default:
      return data?.message as string || 'Consulta realizada com sucesso.';
  }
}

/**
 * Gera sugestões de ações PROATIVAS após uma consulta
 * Prioriza ações contextuais (tools) sobre navegação simples
 */
function generateQuerySuggestions(
  toolName: string,
  data: Record<string, unknown> | undefined
): SuggestedAction[] {
  const suggestions: SuggestedAction[] = [];

  switch (toolName) {
    case 'listar_reunioes': {
      // Pegar a primeira reunião próxima para sugerir ação
      const meetings = data?.meetings as Array<{
        id: string;
        clientId: string;
        clientName: string;
        date: string;
        time: string;
      }> | undefined;

      if (meetings && meetings.length > 0) {
        const nextMeeting = meetings[0];
        if (nextMeeting) {
          // Sugestão proativa: enviar lembrete de confirmação
          suggestions.push({
            id: 'send-meeting-reminder',
            label: `Enviar lembrete para ${nextMeeting.clientName}`,
            icon: 'MessageSquare',
            action: {
              type: 'tool',
              toolCall: {
                id: `suggest-${Date.now()}`,
                name: 'gerar_mensagem',
                parameters: {
                  clientId: nextMeeting.clientId,
                  tipo: 'confirmacao_reuniao',
                  contexto: `Reunião agendada para ${nextMeeting.date} às ${nextMeeting.time}`
                }
              }
            }
          });
        }
      }

      // Também mostrar opção de ver calendário
      suggestions.push({
        id: 'view-calendar',
        label: 'Ver calendário completo',
        icon: 'Calendar',
        action: { type: 'navigate', path: '/calendar' }
      });
      break;
    }

    case 'listar_clientes': {
      const clients = data?.clients as Array<{ id: string; name: string }> | undefined;

      // Sugestão proativa: agendar reunião com um cliente
      if (clients && clients.length > 0) {
        suggestions.push({
          id: 'schedule-meeting',
          label: 'Agendar reunião',
          icon: 'CalendarPlus',
          action: { type: 'navigate', path: '/calendar' }
        });
      }

      suggestions.push({
        id: 'view-clients',
        label: 'Ver todos os clientes',
        icon: 'Users',
        action: { type: 'navigate', path: '/clients' }
      });
      break;
    }

    case 'listar_tarefas': {
      const tasks = data?.tasks as Array<{ id: string; title: string; clientId?: string }> | undefined;

      // Sugestão proativa: criar nova tarefa
      suggestions.push({
        id: 'create-task',
        label: 'Criar nova tarefa',
        icon: 'Plus',
        action: { type: 'navigate', path: '/tasks' }
      });

      // Se tem tarefas, sugerir concluir a primeira
      if (tasks && tasks.length > 0 && tasks[0]) {
        suggestions.push({
          id: 'complete-task',
          label: `Concluir: ${tasks[0].title.substring(0, 25)}...`,
          icon: 'CheckCircle',
          action: {
            type: 'tool',
            toolCall: {
              id: `suggest-${Date.now()}`,
              name: 'concluir_tarefa',
              parameters: { taskId: tasks[0].id }
            }
          }
        });
      }
      break;
    }

    case 'listar_pagamentos': {
      const payments = data?.payments as Array<{
        id: string;
        clientId: string;
        clientName: string;
        amount: number;
        daysOverdue?: number
      }> | undefined;

      // Se há pagamentos atrasados, sugerir enviar cobrança (prioridade!)
      const overduePayment = payments?.find(p => p.daysOverdue && p.daysOverdue > 0);
      if (overduePayment) {
        suggestions.push({
          id: 'send-payment-reminder',
          label: `Cobrar ${overduePayment.clientName}`,
          icon: 'Send',
          action: {
            type: 'tool',
            toolCall: {
              id: `suggest-${Date.now()}`,
              name: 'gerar_mensagem',
              parameters: {
                clientId: overduePayment.clientId,
                tipo: 'cobranca',
                contexto: `Pagamento de R$ ${overduePayment.amount.toFixed(2)} atrasado ${overduePayment.daysOverdue} dias`
              }
            }
          }
        });
      }

      // Sugestão: criar nova cobrança
      suggestions.push({
        id: 'create-payment',
        label: 'Criar nova cobrança',
        icon: 'Plus',
        action: { type: 'navigate', path: '/financial' }
      });

      suggestions.push({
        id: 'view-financial',
        label: 'Ver financeiro',
        icon: 'DollarSign',
        action: { type: 'navigate', path: '/financial' }
      });
      break;
    }

    case 'resumo_cliente':
    case 'buscar_cliente': {
      // Suportar tanto 'clients' (array) quanto 'client' (singular)
      const clients = data?.clients as Array<{ id: string; name: string; contact_phone?: string }> | undefined;
      const singleClient = data?.client as { id: string; name: string; contact_phone?: string } | undefined;
      const clientList = clients && clients.length > 0 ? clients : (singleClient ? [singleClient] : []);

      if (clientList.length === 1 && clientList[0]) {
        const client = clientList[0];

        // Se tem telefone, sugerir enviar mensagem via WhatsApp
        if (client.contact_phone) {
          suggestions.push({
            id: 'send-client-whatsapp',
            label: `Enviar WhatsApp`,
            icon: 'MessageSquare',
            action: {
              type: 'tool',
              toolCall: {
                id: `suggest-${Date.now()}`,
                name: 'gerar_mensagem',
                parameters: {
                  clientId: client.id,
                  tipo: 'followup',
                  contexto: 'Follow-up geral'
                }
              }
            }
          });
        }

        // Sugestões proativas para o cliente
        suggestions.push({
          id: 'schedule-client-meeting',
          label: `Agendar reunião`,
          icon: 'Calendar',
          action: { type: 'navigate', path: '/calendar' }
        });

        suggestions.push({
          id: 'view-client',
          label: 'Ver detalhes',
          icon: 'User',
          action: { type: 'navigate', path: `/clients/${client.id}` }
        });
      }
      break;
    }

    case 'resumo_dia': {
      // Sugestões para o resumo do dia
      suggestions.push({
        id: 'create-task',
        label: 'Criar tarefa',
        icon: 'Plus',
        action: { type: 'navigate', path: '/tasks' }
      });

      suggestions.push({
        id: 'view-calendar',
        label: 'Ver agenda',
        icon: 'Calendar',
        action: { type: 'navigate', path: '/calendar' }
      });
      break;
    }

    case 'gerar_mensagem': {
      // Quando uma mensagem é gerada, oferecer enviar via WhatsApp
      const mensagem = data?.mensagem as string | undefined;
      const clientId = data?.clientId as string | undefined;
      const clientName = data?.clientName as string | undefined;

      if (mensagem && clientId) {
        // Botão principal: enviar pelo WhatsApp
        suggestions.push({
          id: 'send-whatsapp',
          label: `Enviar pelo WhatsApp${clientName ? ` para ${clientName}` : ''}`,
          icon: 'Send',
          action: {
            type: 'tool',
            toolCall: {
              id: `suggest-${Date.now()}`,
              name: 'enviar_whatsapp',
              parameters: {
                clientId: clientId,
                message: mensagem
              }
            }
          }
        });

        // Copiar mensagem
        suggestions.push({
          id: 'copy-message',
          label: 'Copiar mensagem',
          icon: 'Copy',
          action: {
            type: 'callback',
            callbackId: 'copy-to-clipboard'
          }
        });
      }

      // Ver cliente
      if (clientId) {
        suggestions.push({
          id: 'view-client',
          label: 'Ver cliente',
          icon: 'User',
          action: { type: 'navigate', path: `/clients/${clientId}` }
        });
      }
      break;
    }

    default:
      suggestions.push({
        id: 'go-dashboard',
        label: 'Ir para Dashboard',
        icon: 'Home',
        action: { type: 'navigate', path: '/dashboard' }
      });
  }

  return suggestions.slice(0, 3);
}
