/**
 * @file tools-advanced.ts
 * @description Tools avançados para o MARCOLA Assistant incluindo Lead Sniper
 * @module lib/assistant
 */

import type { ToolDefinition, ConfirmationData, ConfirmationType } from './types';

/**
 * Tools do Lead Sniper - Prospecção de Mercado
 */
export const LEAD_SNIPER_TOOLS: ToolDefinition[] = [
  // ==================== PESQUISA DE MERCADO ====================
  {
    name: 'executar_pesquisa_mercado',
    description: 'Executa uma pesquisa de mercado para prospectar leads usando Google Places API. Busca negócios por tipo e cidade, calcula score e classifica leads. Use quando pedirem para buscar leads, prospectar clientes, ou fazer pesquisa de mercado.',
    parameters: {
      type: 'object',
      properties: {
        tipo: {
          type: 'string',
          enum: [
            'gym', 'restaurant', 'beauty_salon', 'dentist', 'doctor', 'lawyer',
            'real_estate_agency', 'car_dealer', 'pet_store', 'veterinary_care',
            'pharmacy', 'bakery', 'cafe', 'bar', 'clothing_store', 'electronics_store',
            'furniture_store', 'supermarket'
          ],
          description: 'Tipo de negócio a pesquisar (ex: gym, restaurant, beauty_salon)'
        },
        cidades: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nome: { type: 'string', description: 'Nome da cidade' },
              lat: { type: 'number', description: 'Latitude' },
              lng: { type: 'number', description: 'Longitude' },
              raio: { type: 'number', description: 'Raio em metros (padrão: 5000)' }
            },
            required: ['nome', 'lat', 'lng']
          },
          description: 'Lista de cidades para pesquisar'
        },
        scoreMinimo: {
          type: 'number',
          description: 'Score mínimo para incluir leads (0-100, padrão: 40)'
        },
        maxPorCidade: {
          type: 'number',
          description: 'Máximo de leads por cidade (padrão: 20)'
        },
        clienteId: {
          type: 'string',
          description: 'ID do cliente para associar os leads (opcional)'
        }
      },
      required: ['tipo', 'cidades']
    },
    requiresConfirmation: true,
    confirmationType: 'generic'
  },

  // ==================== LEADS PROSPECTADOS ====================
  {
    name: 'listar_leads',
    description: 'Lista leads prospectados com filtros. Use para ver leads encontrados, filtrar por classificação (HOT, WARM, COOL, COLD), status ou cidade.',
    parameters: {
      type: 'object',
      properties: {
        classificacao: {
          type: 'string',
          enum: ['HOT', 'WARM', 'COOL', 'COLD'],
          description: 'Filtrar por classificação do lead'
        },
        status: {
          type: 'string',
          enum: ['NOVO', 'CONTATADO', 'RESPONDEU', 'INTERESSADO', 'FECHADO', 'PERDIDO'],
          description: 'Filtrar por status do lead'
        },
        cidade: {
          type: 'string',
          description: 'Filtrar por cidade'
        },
        temWhatsapp: {
          type: 'boolean',
          description: 'Filtrar apenas leads com WhatsApp'
        },
        temSite: {
          type: 'boolean',
          description: 'Filtrar por presença de site'
        },
        tipoNegocio: {
          type: 'string',
          description: 'Filtrar por tipo de negócio'
        },
        pesquisaId: {
          type: 'string',
          description: 'Filtrar por pesquisa específica'
        },
        limit: {
          type: 'number',
          description: 'Limite de resultados (padrão: 20)'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },
  {
    name: 'buscar_lead',
    description: 'Busca um lead específico por nome ou ID. Use para obter detalhes completos de um lead prospectado.',
    parameters: {
      type: 'object',
      properties: {
        leadId: {
          type: 'string',
          description: 'ID do lead (se conhecido)'
        },
        nome: {
          type: 'string',
          description: 'Nome do lead para buscar'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },
  {
    name: 'atualizar_status_lead',
    description: 'Atualiza o status de um lead prospectado. Use para marcar lead como contatado, interessado, fechado, etc.',
    parameters: {
      type: 'object',
      properties: {
        leadId: {
          type: 'string',
          description: 'ID do lead'
        },
        status: {
          type: 'string',
          enum: ['NOVO', 'CONTATADO', 'RESPONDEU', 'INTERESSADO', 'FECHADO', 'PERDIDO'],
          description: 'Novo status do lead'
        },
        notas: {
          type: 'string',
          description: 'Observações sobre a atualização'
        }
      },
      required: ['leadId', 'status']
    },
    requiresConfirmation: true,
    confirmationType: 'generic'
  },
  {
    name: 'registrar_interacao_lead',
    description: 'Registra uma interação com um lead (WhatsApp, ligação, email, reunião). Use para documentar contatos realizados.',
    parameters: {
      type: 'object',
      properties: {
        leadId: {
          type: 'string',
          description: 'ID do lead'
        },
        tipo: {
          type: 'string',
          enum: ['WHATSAPP', 'EMAIL', 'LIGACAO', 'REUNIAO', 'NOTA'],
          description: 'Tipo da interação'
        },
        direcao: {
          type: 'string',
          enum: ['ENVIADO', 'RECEBIDO'],
          description: 'Direção da comunicação'
        },
        conteudo: {
          type: 'string',
          description: 'Conteúdo ou descrição da interação'
        },
        resultado: {
          type: 'string',
          enum: ['ENVIADO', 'ENTREGUE', 'LIDO', 'RESPONDEU', 'SEM_RESPOSTA', 'AGENDADO', 'REALIZADO'],
          description: 'Resultado da interação'
        }
      },
      required: ['leadId', 'tipo', 'conteudo']
    },
    requiresConfirmation: true,
    confirmationType: 'generic'
  },

  // ==================== ESTATÍSTICAS ====================
  {
    name: 'estatisticas_leads',
    description: 'Obtém estatísticas dos leads prospectados. Use para ver totais por classificação, status, cidades, taxa de conversão, etc.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    requiresConfirmation: false
  },
  {
    name: 'listar_pesquisas_mercado',
    description: 'Lista pesquisas de mercado realizadas. Use para ver histórico de prospecções.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['processing', 'completed', 'failed'],
          description: 'Filtrar por status da pesquisa'
        },
        limit: {
          type: 'number',
          description: 'Limite de resultados'
        }
      },
      required: []
    },
    requiresConfirmation: false
  }
];

/**
 * Todos os tools avançados combinados
 */
export const ALL_ADVANCED_TOOLS: ToolDefinition[] = [
  ...LEAD_SNIPER_TOOLS,
];

/**
 * Verifica se um tool avançado requer confirmação
 * @param toolName - Nome do tool
 * @returns true se requer confirmação
 */
export function requiresConfirmation(toolName: string): boolean {
  const tool = ALL_ADVANCED_TOOLS.find((t) => t.name === toolName);
  return tool?.requiresConfirmation ?? false;
}

/**
 * Verifica se um tool é avançado (não básico)
 * @param toolName - Nome do tool
 * @returns true se for um tool avançado
 */
export function isAdvancedTool(toolName: string): boolean {
  return ALL_ADVANCED_TOOLS.some((t) => t.name === toolName);
}

// ==================== EXECUTOR CLASSES ====================
// Classes stub para manter compatibilidade com tool-executor.ts
// Implementações futuras podem expandir estas classes

/**
 * Helper para criar uma confirmação stub
 */
function createStubConfirmation(type: ConfirmationType): { confirmation: ConfirmationData } {
  return {
    confirmation: {
      id: `stub_${Date.now()}`,
      type,
      status: 'pending',
      data: {
        title: 'Funcionalidade em desenvolvimento',
        description: 'Esta funcionalidade ainda não foi implementada.',
        details: {},
      },
      toolToExecute: { id: 'stub', name: 'stub', parameters: {} },
      createdAt: new Date(),
    }
  };
}

/**
 * Executor de ações em lote
 */
export class BatchActionsExecutor {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_userId: string) {}

  async prepararCobrancaLote(_params: unknown) {
    return createStubConfirmation('generic');
  }

  async executarCobrancaLote(_data: unknown) {
    return { success: true, message: 'Cobrança em lote não implementada' };
  }

  async prepararConfirmacaoReunioes(_params: unknown) {
    return createStubConfirmation('generic');
  }

  async executarConfirmacaoReunioes(_data: unknown) {
    return { success: true, message: 'Confirmação de reuniões não implementada' };
  }

  async prepararGeracaoFaturas(_params: unknown) {
    return createStubConfirmation('generic');
  }

  async executarGeracaoFaturas(_data: unknown) {
    return { success: true, message: 'Geração de faturas não implementada' };
  }

  async prepararFollowupLote(_params: unknown) {
    return createStubConfirmation('generic');
  }

  async executarFollowupLote(_data: unknown) {
    return { success: true, message: 'Followup em lote não implementado' };
  }
}

/**
 * Executor de ações de inteligência
 */
export class IntelligenceExecutor {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_userId: string) {}

  async sugerirAcoesDia(_params: unknown) {
    return { sugestoes: [], message: 'Sugestões não implementadas' };
  }

  async diagnosticarCliente(_params: unknown) {
    return { diagnostico: {}, message: 'Diagnóstico não implementado' };
  }

  async identificarClientesRisco(_params: unknown) {
    return { clientesRisco: [], message: 'Identificação de risco não implementada' };
  }

  async preverFaturamento(_params: unknown) {
    return { previsao: {}, message: 'Previsão não implementada' };
  }
}

/**
 * Executor de ações de comunicação
 */
export class CommunicationExecutor {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_userId: string) {}

  async prepararReuniao(_params: unknown) {
    return { preparacao: {}, message: 'Preparação não implementada' };
  }

  async prepararPosReuniao(_params: unknown) {
    return createStubConfirmation('generic');
  }

  async executarPosReuniao(_data: unknown) {
    return { success: true, message: 'Pós-reunião não implementado' };
  }

  async prepararAgendamentoRecorrente(_params: unknown) {
    return createStubConfirmation('generic');
  }

  async executarAgendamentoRecorrente(_data: unknown) {
    return { success: true, message: 'Agendamento recorrente não implementado' };
  }

  async gerarRelatorioCliente(_params: unknown) {
    return { relatorio: {}, message: 'Relatório não implementado' };
  }
}

/**
 * Executor de meta ações
 */
export class MetaActionsExecutor {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_userId: string) {}

  async executarRotinaMatinal(_params: unknown) {
    return { rotina: {}, message: 'Rotina matinal não implementada' };
  }

  async encerrarDia(_params: unknown) {
    return { resumo: {}, message: 'Encerramento não implementado' };
  }

  async prepararOnboarding(_params: unknown) {
    return createStubConfirmation('generic');
  }

  async executarOnboarding(_data: unknown) {
    return { success: true, message: 'Onboarding não implementado' };
  }

  async executarHealthCheck(_params: unknown) {
    return { healthCheck: {}, message: 'Health check não implementado' };
  }
}
