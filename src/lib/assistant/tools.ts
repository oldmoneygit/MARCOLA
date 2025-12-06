/**
 * @file tools.ts
 * @description Definição dos tools disponíveis para o MARCOLA Assistant
 * @module lib/assistant
 */

import type { ToolDefinition, ConfirmationType } from './types';
import { ALL_ADVANCED_TOOLS, requiresConfirmation as advancedRequiresConfirmation } from './tools-advanced';

/**
 * Lista completa de tools disponíveis para o assistente
 * Cada tool define seu nome, descrição, parâmetros e se requer confirmação
 */
export const ASSISTANT_TOOLS: ToolDefinition[] = [
  // ==================== CLIENTES ====================
  {
    name: 'buscar_cliente',
    description: 'Busca um cliente pelo nome ou características e retorna dados completos incluindo: ID, nome, nome do contato, TELEFONE, segmento e status. Use para encontrar clientes e obter informações de contato como telefone, email, etc.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Nome, apelido ou característica do cliente (ex: "João", "hamburgueria", "cliente do restaurante", "TechStore")'
        }
      },
      required: ['query']
    },
    requiresConfirmation: false
  },
  {
    name: 'listar_clientes',
    description: 'Lista todos os clientes do usuário com dados completos: ID, nome, contato, TELEFONE, segmento, status e valor mensal. Use quando pedirem para ver clientes, quantos clientes tem ou listar informações de contato.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'paused', 'all'],
          description: 'Filtrar por status do cliente'
        },
        limit: {
          type: 'number',
          description: 'Número máximo de clientes a retornar'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },

  // ==================== REUNIÕES ====================
  {
    name: 'criar_reuniao',
    description: 'Agenda uma reunião com um cliente. Use quando pedirem para marcar, agendar ou criar reunião.',
    parameters: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'ID do cliente (obrigatório)'
        },
        date: {
          type: 'string',
          description: 'Data da reunião no formato YYYY-MM-DD'
        },
        time: {
          type: 'string',
          description: 'Horário da reunião no formato HH:mm'
        },
        type: {
          type: 'string',
          enum: ['online', 'presencial'],
          description: 'Tipo da reunião'
        },
        notes: {
          type: 'string',
          description: 'Notas ou observações opcionais'
        }
      },
      required: ['clientId', 'date', 'time']
    },
    requiresConfirmation: true,
    confirmationType: 'meeting'
  },
  {
    name: 'listar_reunioes',
    description: 'Lista reuniões agendadas. Use quando pedirem para ver agenda, reuniões ou compromissos.',
    parameters: {
      type: 'object',
      properties: {
        periodo: {
          type: 'string',
          enum: ['hoje', 'amanha', 'semana', 'mes'],
          description: 'Período para filtrar reuniões'
        },
        clientId: {
          type: 'string',
          description: 'Filtrar por cliente específico'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },
  {
    name: 'excluir_reuniao',
    description: 'Exclui/cancela uma reunião existente. Use quando pedirem para excluir, cancelar, desmarcar ou remover uma reunião.',
    parameters: {
      type: 'object',
      properties: {
        meetingId: {
          type: 'string',
          description: 'ID da reunião a ser excluída (se conhecido)'
        },
        clientId: {
          type: 'string',
          description: 'ID do cliente (se meetingId não for fornecido)'
        },
        date: {
          type: 'string',
          description: 'Data da reunião no formato YYYY-MM-DD (se meetingId não for fornecido)'
        }
      },
      required: []
    },
    requiresConfirmation: true,
    confirmationType: 'meeting_delete'
  },
  {
    name: 'atualizar_reuniao',
    description: 'Atualiza/remarca uma reunião existente. Use quando pedirem para remarcar, alterar data/horário, ou modificar uma reunião.',
    parameters: {
      type: 'object',
      properties: {
        meetingId: {
          type: 'string',
          description: 'ID da reunião a ser atualizada (se conhecido)'
        },
        clientId: {
          type: 'string',
          description: 'ID do cliente (se meetingId não for fornecido)'
        },
        currentDate: {
          type: 'string',
          description: 'Data atual da reunião no formato YYYY-MM-DD (se meetingId não for fornecido)'
        },
        newDate: {
          type: 'string',
          description: 'Nova data da reunião no formato YYYY-MM-DD'
        },
        newTime: {
          type: 'string',
          description: 'Novo horário da reunião no formato HH:mm'
        },
        newType: {
          type: 'string',
          enum: ['online', 'presencial'],
          description: 'Novo tipo da reunião'
        },
        newNotes: {
          type: 'string',
          description: 'Novas observações da reunião'
        }
      },
      required: []
    },
    requiresConfirmation: true,
    confirmationType: 'meeting_update'
  },

  // ==================== TAREFAS ====================
  {
    name: 'criar_tarefa',
    description: 'Cria uma nova tarefa. Use quando pedirem para adicionar tarefa, to-do, lembrete de ação ou coisa pra fazer.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Título ou descrição curta da tarefa'
        },
        description: {
          type: 'string',
          description: 'Descrição detalhada opcional'
        },
        clientId: {
          type: 'string',
          description: 'ID do cliente relacionado (opcional)'
        },
        dueDate: {
          type: 'string',
          description: 'Data limite no formato YYYY-MM-DD'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Prioridade da tarefa'
        },
        category: {
          type: 'string',
          enum: ['optimization', 'creative', 'report', 'meeting', 'payment', 'other'],
          description: 'Categoria da tarefa'
        }
      },
      required: ['title']
    },
    requiresConfirmation: true,
    confirmationType: 'task'
  },
  {
    name: 'listar_tarefas',
    description: 'Lista tarefas pendentes. Use quando pedirem para ver tarefas, pendências ou o que tem pra fazer.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['todo', 'doing', 'done', 'all'],
          description: 'Filtrar por status'
        },
        clientId: {
          type: 'string',
          description: 'Filtrar por cliente'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Filtrar por prioridade'
        },
        periodo: {
          type: 'string',
          enum: ['hoje', 'semana', 'atrasadas', 'todas'],
          description: 'Filtrar por período'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },
  {
    name: 'concluir_tarefa',
    description: 'Marca uma tarefa como concluída. Use quando pedirem para finalizar, concluir ou marcar tarefa como feita. Pode usar o ID ou o título/nome da tarefa.',
    parameters: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'ID (UUID) da tarefa a ser concluída'
        },
        taskTitle: {
          type: 'string',
          description: 'Título/nome da tarefa a ser concluída. Use quando o usuário mencionar o nome da tarefa ao invés do ID.'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },

  // ==================== PAGAMENTOS ====================
  {
    name: 'criar_cobranca',
    description: 'Cria uma nova cobrança para um cliente. Use quando pedirem para criar cobrança, fatura ou registrar pagamento pendente.',
    parameters: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'ID do cliente'
        },
        amount: {
          type: 'number',
          description: 'Valor da cobrança em reais'
        },
        dueDate: {
          type: 'string',
          description: 'Data de vencimento no formato YYYY-MM-DD'
        },
        description: {
          type: 'string',
          description: 'Descrição da cobrança'
        }
      },
      required: ['clientId', 'amount', 'dueDate']
    },
    requiresConfirmation: true,
    confirmationType: 'payment'
  },
  {
    name: 'listar_pagamentos',
    description: 'Lista pagamentos pendentes ou vencidos. Use quando pedirem para ver cobranças, pagamentos ou quem deve.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'paid', 'overdue', 'all'],
          description: 'Filtrar por status do pagamento'
        },
        clientId: {
          type: 'string',
          description: 'Filtrar por cliente'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },
  {
    name: 'marcar_pago',
    description: 'Marca um pagamento como pago. Use quando confirmarem que um cliente pagou.',
    parameters: {
      type: 'object',
      properties: {
        paymentId: {
          type: 'string',
          description: 'ID do pagamento'
        },
        paidAt: {
          type: 'string',
          description: 'Data do pagamento (opcional, padrão é hoje)'
        }
      },
      required: ['paymentId']
    },
    requiresConfirmation: true,
    confirmationType: 'generic'
  },

  // ==================== WHATSAPP ====================
  {
    name: 'enviar_whatsapp',
    description: 'Envia mensagem WhatsApp para um cliente. Use quando pedirem para mandar mensagem, avisar cliente ou enviar WhatsApp.',
    parameters: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'ID do cliente'
        },
        message: {
          type: 'string',
          description: 'Texto da mensagem a ser enviada'
        }
      },
      required: ['clientId', 'message']
    },
    requiresConfirmation: true,
    confirmationType: 'whatsapp'
  },
  {
    name: 'gerar_mensagem',
    description: 'Gera uma mensagem personalizada para um cliente. Use para criar textos de cobrança, follow-up, etc.',
    parameters: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'ID do cliente'
        },
        tipo: {
          type: 'string',
          enum: ['lembrete_pagamento', 'confirmacao_reuniao', 'followup', 'boas_vindas', 'cobranca', 'custom'],
          description: 'Tipo de mensagem a gerar'
        },
        contexto: {
          type: 'string',
          description: 'Contexto adicional para personalização'
        }
      },
      required: ['clientId', 'tipo']
    },
    requiresConfirmation: false
  },

  // ==================== LEMBRETES ====================
  {
    name: 'criar_lembrete',
    description: 'Cria um lembrete pessoal. Use quando pedirem para lembrar de algo em uma data específica.',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Texto do lembrete'
        },
        date: {
          type: 'string',
          description: 'Data do lembrete no formato YYYY-MM-DD'
        },
        time: {
          type: 'string',
          description: 'Horário opcional no formato HH:mm'
        },
        clientId: {
          type: 'string',
          description: 'Cliente relacionado (opcional)'
        }
      },
      required: ['message', 'date']
    },
    requiresConfirmation: true,
    confirmationType: 'reminder'
  },

  // ==================== RESUMOS ====================
  {
    name: 'resumo_dia',
    description: 'Gera um resumo do dia atual. Use quando pedirem "o que tenho hoje", "meu dia", "resumo" ou "agenda do dia".',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    requiresConfirmation: false
  },
  {
    name: 'resumo_cliente',
    description: 'Gera um resumo completo de um cliente específico. Use quando pedirem informações gerais de um cliente.',
    parameters: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'ID do cliente'
        }
      },
      required: ['clientId']
    },
    requiresConfirmation: false
  },

  // ==================== ANÁLISE ====================
  {
    name: 'analisar_performance',
    description: 'Analisa a performance de anúncios de um cliente. Use quando pedirem análise, métricas ou resultados.',
    parameters: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'ID do cliente'
        },
        periodo: {
          type: 'string',
          enum: ['7d', '14d', '30d', '90d'],
          description: 'Período da análise'
        }
      },
      required: ['clientId']
    },
    requiresConfirmation: false
  }
];

/**
 * Todos os tools combinados (básicos + avançados)
 */
export const ALL_TOOLS: ToolDefinition[] = [
  ...ASSISTANT_TOOLS,
  ...ALL_ADVANCED_TOOLS
];

/**
 * Converte os tools para o formato esperado pela API Claude
 * @returns Array de tools no formato Claude
 */
export function getToolsForClaude() {
  return ALL_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters
  }));
}

/**
 * Verifica se um tool requer confirmação do usuário
 * @param toolName - Nome do tool
 * @returns true se requer confirmação
 */
export function toolRequiresConfirmation(toolName: string): boolean {
  // Verificar nos tools básicos
  const basicTool = ASSISTANT_TOOLS.find((t) => t.name === toolName);
  if (basicTool) {
    return basicTool.requiresConfirmation ?? false;
  }

  // Verificar nos tools avançados
  return advancedRequiresConfirmation(toolName);
}

/**
 * Obtém o tipo de confirmação para um tool
 * @param toolName - Nome do tool
 * @returns Tipo de confirmação ou undefined
 */
export function getConfirmationType(toolName: string): ConfirmationType | undefined {
  const tool = ALL_TOOLS.find((t) => t.name === toolName);
  return tool?.confirmationType;
}

/**
 * Obtém a definição completa de um tool pelo nome
 * @param toolName - Nome do tool
 * @returns Definição do tool ou undefined
 */
export function getToolDefinition(toolName: string): ToolDefinition | undefined {
  return ALL_TOOLS.find((t) => t.name === toolName);
}

/**
 * Lista todos os nomes de tools disponíveis
 * @returns Array com os nomes dos tools
 */
export function getToolNames(): string[] {
  return ALL_TOOLS.map((t) => t.name);
}

/**
 * Verifica se um tool é avançado (não básico)
 * @param toolName - Nome do tool
 * @returns true se for um tool avançado
 */
export function isAdvancedTool(toolName: string): boolean {
  return ALL_ADVANCED_TOOLS.some((t) => t.name === toolName);
}
