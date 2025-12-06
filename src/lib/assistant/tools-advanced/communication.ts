/**
 * @file communication.ts
 * @description Definições dos Tools de Comunicação do MARCOLA Assistant
 * @module lib/assistant/tools-advanced
 */

import type { ToolDefinition } from '../types';

export const COMMUNICATION_TOOLS: ToolDefinition[] = [
  // ==================== PREPARAR REUNIÃO ====================
  {
    name: 'preparar_reuniao',
    description: `Gera um briefing preparatório completo para uma reunião.
Use quando o gestor:
- Pedir "Prepara a reunião com cliente X"
- Disser "Me passa o briefing da reunião"
- Quiser se preparar antes de uma reunião
- Perguntar "O que preciso saber pra reunião?"

O briefing inclui:
1. Contexto do cliente (tempo como cliente, valor, segmento)
2. Situação atual (pagamentos, tarefas, performance)
3. Histórico recente de interações
4. Pontos de atenção (problemas, oportunidades)
5. Pauta sugerida para reunião
6. Perguntas recomendadas

Ideal para se preparar 30 minutos antes.`,
    parameters: {
      type: 'object',
      properties: {
        meetingId: {
          type: 'string',
          description: 'ID da reunião para preparar.'
        },
        clientId: {
          type: 'string',
          description: 'ID do cliente. Use se não souber o meetingId.'
        },
        query: {
          type: 'string',
          description: 'Nome do cliente para buscar próxima reunião.'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },

  // ==================== REGISTRAR PÓS-REUNIÃO ====================
  {
    name: 'registrar_pos_reuniao',
    description: `Registra anotações e cria follow-ups após uma reunião.
Use quando o gestor:
- Disser "Registra a reunião que acabou"
- Pedir "Anota o que discutimos na reunião"
- Quiser registrar decisões e próximos passos
- Falar "Cria as tarefas da reunião"

IMPORTANTE: Este tool requer confirmação antes de executar.
O registro inclui:
1. Anotações gerais da reunião
2. Decisões tomadas
3. Próximos passos (com responsável e prazo)
4. Feedback do cliente (opcional)
5. Data da próxima reunião (opcional)

Cria tarefas automaticamente baseado nos próximos passos.`,
    parameters: {
      type: 'object',
      properties: {
        meetingId: {
          type: 'string',
          description: 'ID da reunião para registrar.'
        },
        clientId: {
          type: 'string',
          description: 'ID do cliente. Use se não souber o meetingId.'
        },
        query: {
          type: 'string',
          description: 'Nome do cliente para buscar reunião recente.'
        },
        anotacoes: {
          type: 'string',
          description: 'Anotações gerais da reunião.'
        },
        decisoes: {
          type: 'string',
          description: 'Decisões tomadas durante a reunião.'
        },
        proximosPassos: {
          type: 'string',
          description: 'Próximos passos acordados.'
        },
        feedbackCliente: {
          type: 'string',
          description: 'Como o cliente se mostrou (satisfeito, neutro, insatisfeito).'
        },
        agendarProxima: {
          type: 'boolean',
          description: 'Se deve agendar próxima reunião. Default: false'
        }
      },
      required: []
    },
    requiresConfirmation: true,
    confirmationType: 'generic'
  },

  // ==================== AGENDAR RECORRENTE ====================
  {
    name: 'agendar_recorrente',
    description: `Agenda reuniões ou tarefas recorrentes para um cliente.
Use quando o gestor:
- Pedir "Agenda reunião semanal com cliente X"
- Disser "Cria uma rotina de tarefas mensal"
- Quiser automatizar agendamentos periódicos
- Falar "Marca reunião quinzenal com o cliente"

IMPORTANTE: Este tool requer confirmação antes de executar.
Tipos de recorrência:
- Semanal: mesmo dia da semana
- Quinzenal: a cada 14 dias
- Mensal: mesmo dia do mês

Mostra preview das próximas ocorrências antes de criar.`,
    parameters: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'ID do cliente.'
        },
        query: {
          type: 'string',
          description: 'Nome do cliente para buscar.'
        },
        tipo: {
          type: 'string',
          enum: ['reuniao', 'tarefa', 'lembrete'],
          description: 'Tipo de agendamento. Default: reuniao'
        },
        frequencia: {
          type: 'string',
          enum: ['semanal', 'quinzenal', 'mensal'],
          description: 'Frequência da recorrência. Default: quinzenal'
        },
        diaSemana: {
          type: 'string',
          enum: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
          description: 'Dia da semana para recorrência semanal/quinzenal.'
        },
        diaDoMes: {
          type: 'number',
          description: 'Dia do mês para recorrência mensal.'
        },
        horario: {
          type: 'string',
          description: 'Horário (HH:mm) para reuniões.'
        },
        titulo: {
          type: 'string',
          description: 'Título para tarefas/lembretes.'
        },
        quantidadeOcorrencias: {
          type: 'number',
          description: 'Quantas ocorrências criar. Default: 4'
        }
      },
      required: []
    },
    requiresConfirmation: true,
    confirmationType: 'generic'
  },

  // ==================== GERAR RELATÓRIO DO CLIENTE ====================
  {
    name: 'gerar_relatorio_cliente',
    description: `Gera um relatório de performance para enviar ao cliente.
Use quando o gestor:
- Pedir "Gera relatório do cliente X"
- Disser "Preciso de um report pro cliente"
- Quiser enviar um resumo de performance
- Falar "Monta o relatório mensal"

O relatório inclui:
1. Métricas de campanhas (se houver dados)
2. Investimento e resultados
3. Comparativo com período anterior
4. Atividades realizadas no período
5. Destaques e pontos de melhoria
6. Plano para próximo período

Formato adequado para enviar via WhatsApp ou email.`,
    parameters: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'ID do cliente.'
        },
        query: {
          type: 'string',
          description: 'Nome do cliente para buscar.'
        },
        periodo: {
          type: 'string',
          enum: ['7d', '15d', '30d', '60d', '90d'],
          description: 'Período do relatório. Default: 30d'
        },
        incluirComparativo: {
          type: 'boolean',
          description: 'Incluir comparativo com período anterior. Default: true'
        },
        formato: {
          type: 'string',
          enum: ['resumido', 'completo'],
          description: 'Nível de detalhe. Default: resumido'
        }
      },
      required: []
    },
    requiresConfirmation: false
  }
];

export default COMMUNICATION_TOOLS;
