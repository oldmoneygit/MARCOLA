/**
 * @file batch-actions.ts
 * @description Definições dos Tools de Ações em Lote do MARCOLA Assistant
 * @module lib/assistant/tools-advanced
 */

import type { ToolDefinition } from '../types';

export const BATCH_ACTION_TOOLS: ToolDefinition[] = [
  // ==================== COBRAR TODOS VENCIDOS ====================
  {
    name: 'cobrar_todos_vencidos',
    description: `Envia cobrança via WhatsApp para TODOS os clientes com pagamentos vencidos.
Use quando o gestor:
- Disser "Cobra todo mundo que tá devendo"
- Pedir "Envia cobrança pra todos os atrasados"
- Quiser "Cobrar todos os pagamentos vencidos"
- Falar "Manda mensagem de cobrança em massa"

IMPORTANTE: Este tool requer confirmação antes de executar.
Mostra lista dos clientes que serão cobrados com:
- Nome do cliente
- Valor em aberto
- Dias de atraso
- Preview da mensagem

Após confirmação, envia WhatsApp para cada cliente.`,
    parameters: {
      type: 'object',
      properties: {
        diasMinimo: {
          type: 'number',
          description: 'Dias mínimos de atraso para incluir. Default: 1'
        },
        diasMaximo: {
          type: 'number',
          description: 'Dias máximos de atraso para incluir. Default: sem limite'
        },
        limite: {
          type: 'number',
          description: 'Quantidade máxima de clientes para cobrar. Default: 20'
        },
        templateMensagem: {
          type: 'string',
          enum: ['padrao', 'leve', 'firme'],
          description: 'Tom da mensagem de cobrança. Default: padrao'
        }
      },
      required: []
    },
    requiresConfirmation: true,
    confirmationType: 'generic'
  },

  // ==================== CONFIRMAR REUNIÕES DE AMANHÃ ====================
  {
    name: 'confirmar_reunioes_amanha',
    description: `Envia mensagem de confirmação via WhatsApp para TODAS as reuniões de amanhã.
Use quando o gestor:
- Pedir "Confirma as reuniões de amanhã"
- Disser "Envia confirmação das reuniões"
- Quiser confirmar agenda do dia seguinte
- Falar "Avisa os clientes sobre as reuniões"

IMPORTANTE: Este tool requer confirmação antes de executar.
Mostra lista das reuniões que serão confirmadas:
- Nome do cliente
- Horário da reunião
- Tipo (online/presencial)
- Preview da mensagem

Ideal para executar no final do dia anterior.`,
    parameters: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          description: 'Data das reuniões (YYYY-MM-DD). Default: amanhã'
        },
        templateMensagem: {
          type: 'string',
          enum: ['formal', 'casual'],
          description: 'Tom da mensagem. Default: casual'
        }
      },
      required: []
    },
    requiresConfirmation: true,
    confirmationType: 'generic'
  },

  // ==================== GERAR FATURAS DO MÊS ====================
  {
    name: 'gerar_faturas_mes',
    description: `Gera cobranças mensais para todos os clientes ativos.
Use quando o gestor:
- Pedir "Gera as faturas do mês"
- Disser "Cria as cobranças mensais"
- Quiser "Faturar todos os clientes"
- No início do mês para gerar cobranças

IMPORTANTE: Este tool requer confirmação antes de executar.
Baseado no valor mensal de cada cliente, gera cobranças com:
- Valor do contrato
- Data de vencimento (dia configurado ou padrão)
- Descrição padrão

Não duplica cobranças já existentes no mês.`,
    parameters: {
      type: 'object',
      properties: {
        mes: {
          type: 'string',
          description: 'Mês para gerar faturas (YYYY-MM). Default: mês atual'
        },
        diaVencimentoPadrao: {
          type: 'number',
          description: 'Dia de vencimento padrão se cliente não tiver configurado. Default: 10'
        },
        apenasClientesAtivos: {
          type: 'boolean',
          description: 'Gerar apenas para clientes com status ativo. Default: true'
        }
      },
      required: []
    },
    requiresConfirmation: true,
    confirmationType: 'generic'
  },

  // ==================== ENVIAR FOLLOW-UP EM LOTE ====================
  {
    name: 'enviar_followup_lote',
    description: `Envia mensagem de follow-up para clientes sem contato recente.
Use quando o gestor:
- Pedir "Faz follow-up dos clientes parados"
- Disser "Entra em contato com quem não falo há tempo"
- Quiser "Reativar clientes inativos"
- Falar "Manda mensagem pros clientes sumidos"

IMPORTANTE: Este tool requer confirmação antes de executar.
Identifica clientes sem contato há X dias e mostra:
- Nome do cliente
- Dias desde último contato
- Tipo do último contato
- Preview da mensagem

Útil para manter relacionamento ativo.`,
    parameters: {
      type: 'object',
      properties: {
        diasMinimo: {
          type: 'number',
          description: 'Dias mínimos sem contato. Default: 14'
        },
        diasMaximo: {
          type: 'number',
          description: 'Dias máximos sem contato. Default: 60'
        },
        limite: {
          type: 'number',
          description: 'Quantidade máxima de clientes. Default: 10'
        },
        templateMensagem: {
          type: 'string',
          enum: ['checkup', 'novidades', 'valor'],
          description: 'Tipo de mensagem. Default: checkup'
        }
      },
      required: []
    },
    requiresConfirmation: true,
    confirmationType: 'generic'
  }
];

export default BATCH_ACTION_TOOLS;
