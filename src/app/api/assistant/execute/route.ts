/**
 * @file route.ts
 * @description API de execução de tools confirmados do MARCOLA Assistant
 * @module app/api/assistant/execute
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeTool } from '@/lib/assistant';
import type { ExecuteApiResponse, ToolCall, SuggestedAction } from '@/lib/assistant/types';

/**
 * POST /api/assistant/execute
 * Executa um tool call após confirmação do usuário
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ExecuteApiResponse>(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Obter dados da requisição
    const body = await request.json();
    const { toolCall, updatedParams } = body as {
      toolCall: ToolCall;
      updatedParams?: Record<string, unknown>;
    };

    if (!toolCall || !toolCall.name) {
      return NextResponse.json<ExecuteApiResponse>(
        { success: false, error: 'Tool call inválido' },
        { status: 400 }
      );
    }

    // Mesclar parâmetros atualizados (se houver edição pelo usuário)
    const finalToolCall: ToolCall = updatedParams
      ? { ...toolCall, parameters: { ...toolCall.parameters, ...updatedParams } }
      : toolCall;

    // Executar o tool
    const result = await executeTool(finalToolCall, user.id);

    if (!result.success) {
      return NextResponse.json<ExecuteApiResponse>({
        success: false,
        error: result.error || 'Falha ao executar ação'
      });
    }

    // Gerar mensagem de sucesso amigável
    const successMessage = generateSuccessMessage(finalToolCall.name, result.data);

    // Gerar ações sugeridas pós-execução
    const suggestedActions = generatePostExecutionSuggestions(
      finalToolCall.name,
      result.data
    );

    return NextResponse.json<ExecuteApiResponse>({
      success: true,
      result,
      message: successMessage,
      suggestedActions
    });

  } catch (error) {
    console.error('[/api/assistant/execute] Erro:', error);
    return NextResponse.json<ExecuteApiResponse>(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Gera uma mensagem de sucesso amigável baseada no tool executado
 */
function generateSuccessMessage(
  toolName: string,
  data?: Record<string, unknown>
): string {
  // Helper para acessar nested properties com segurança
  const getNestedValue = (obj: Record<string, unknown> | undefined, path: string): unknown => {
    if (!obj) {
      return undefined;
    }
    const keys = path.split('.');
    let result: unknown = obj;
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = (result as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }
    return result;
  };

  switch (toolName) {
    case 'criar_reuniao': {
      const meetingDate = getNestedValue(data, 'meeting.date') as string | undefined;
      const meetingTime = getNestedValue(data, 'meeting.time') as string | undefined;
      return `Reunião agendada com ${data?.clientName || 'o cliente'} para ${meetingDate || 'data'} às ${meetingTime || 'horário'}.`;
    }

    case 'criar_tarefa': {
      const taskTitle = getNestedValue(data, 'task.title') as string | undefined;
      return `Tarefa "${taskTitle || data?.title || ''}" criada com sucesso!`;
    }

    case 'criar_cobranca': {
      const paymentAmount = getNestedValue(data, 'payment.amount') as number | undefined;
      return `Cobrança de R$ ${Number(paymentAmount || 0).toFixed(2)} criada para ${data?.clientName || 'o cliente'}.`;
    }

    case 'criar_lembrete': {
      const remindAt = getNestedValue(data, 'reminder.remind_at') as string | undefined;
      return `Lembrete criado para ${remindAt ? new Date(remindAt).toLocaleDateString('pt-BR') : 'a data especificada'}.`;
    }

    case 'enviar_whatsapp':
      // Usar message_result se disponível (diferencia Z-API vs link fallback)
      if (data?.message_result) {
        return data.message_result as string;
      }
      return `Mensagem preparada para ${data?.contactName || data?.clientName || 'o cliente'}. Clique no link para enviar.`;

    case 'concluir_tarefa':
      return `Tarefa "${data?.title || ''}" marcada como concluída!`;

    case 'marcar_pago':
      return `Pagamento de R$ ${Number(data?.amount || 0).toFixed(2)} de ${data?.clientName || 'cliente'} marcado como pago.`;

    case 'gerar_mensagem':
      return `Mensagem "${data?.tipo || 'personalizada'}" gerada para ${data?.contactName || data?.clientName || 'o cliente'}.`;

    default:
      return data?.message as string || 'Ação executada com sucesso!';
  }
}

/**
 * Gera ações sugeridas após a execução de um tool
 */
function generatePostExecutionSuggestions(
  toolName: string,
  data?: Record<string, unknown>
): SuggestedAction[] {
  const suggestions: SuggestedAction[] = [];

  // Helper para acessar nested properties com segurança
  const getNestedValue = (obj: Record<string, unknown> | undefined, path: string): unknown => {
    if (!obj) {
      return undefined;
    }
    const keys = path.split('.');
    let result: unknown = obj;
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = (result as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }
    return result;
  };

  switch (toolName) {
    case 'criar_reuniao': {
      suggestions.push({
        id: 'view-calendar',
        label: 'Ver agenda',
        icon: 'Calendar',
        action: { type: 'navigate', path: '/calendar' }
      });
      if (data?.clientName) {
        const meetingId = getNestedValue(data, 'meeting.id') as string | undefined;
        suggestions.push({
          id: 'notify-client',
          label: 'Avisar cliente',
          icon: 'MessageSquare',
          action: {
            type: 'callback',
            callbackId: `notify-meeting-${meetingId || ''}`
          }
        });
      }
      break;
    }

    case 'criar_tarefa':
      suggestions.push({
        id: 'view-tasks',
        label: 'Ver todas as tarefas',
        icon: 'CheckSquare',
        action: { type: 'navigate', path: '/tasks' }
      });
      break;

    case 'criar_cobranca': {
      const paymentId = getNestedValue(data, 'payment.id') as string | undefined;
      suggestions.push({
        id: 'view-financial',
        label: 'Ver financeiro',
        icon: 'DollarSign',
        action: { type: 'navigate', path: '/financial' }
      });
      suggestions.push({
        id: 'send-reminder',
        label: 'Enviar lembrete',
        icon: 'Bell',
        action: {
          type: 'callback',
          callbackId: `payment-reminder-${paymentId || ''}`
        }
      });
      break;
    }

    case 'criar_lembrete':
      suggestions.push({
        id: 'view-reminders',
        label: 'Ver lembretes',
        icon: 'Bell',
        action: { type: 'navigate', path: '/reminders' }
      });
      break;

    case 'enviar_whatsapp':
      if (data?.whatsappUrl) {
        suggestions.push({
          id: 'open-whatsapp',
          label: 'Abrir WhatsApp',
          icon: 'ExternalLink',
          action: { type: 'navigate', path: data.whatsappUrl as string }
        });
      }
      break;

    case 'gerar_mensagem':
      if (data?.mensagem) {
        suggestions.push({
          id: 'send-message',
          label: 'Enviar mensagem',
          icon: 'Send',
          action: {
            type: 'callback',
            callbackId: `send-generated-${data?.clientId || ''}`
          }
        });
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
      break;

    default:
      // Sugestões genéricas
      suggestions.push({
        id: 'go-home',
        label: 'Ir para Dashboard',
        icon: 'Home',
        action: { type: 'navigate', path: '/dashboard' }
      });
  }

  return suggestions.slice(0, 3);
}
