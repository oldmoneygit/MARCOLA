/**
 * @file meta-actions.ts
 * @description Definições dos Tools de Meta-Ação do MARCOLA Assistant
 * @module lib/assistant/tools-advanced
 */

import type { ToolDefinition } from '../types';

export const META_ACTION_TOOLS: ToolDefinition[] = [
  // ==================== EXECUTAR ROTINA MATINAL ====================
  {
    name: 'executar_rotina_matinal',
    description: `Executa a rotina matinal completa do gestor, trazendo tudo que precisa saber para o dia.
Use quando o gestor:
- Disser "Bom dia" ou "Bom dia Marcola"
- Pedir "Qual minha rotina de hoje?"
- Perguntar "O que tenho pra fazer hoje?"
- Solicitar "Me atualiza sobre o dia"
- Iniciar o dia de trabalho

A rotina matinal inclui:
1. Saudação personalizada
2. Agenda do dia (reuniões e horários)
3. Tarefas urgentes e pendentes
4. Pagamentos que vencem hoje
5. Pagamentos vencidos (alerta)
6. Alertas importantes (clientes em risco, problemas)
7. Sugestões de ações prioritárias
8. Métricas gerais

É o "dashboard falado" para começar o dia informado.`,
    parameters: {
      type: 'object',
      properties: {
        incluirMetricas: {
          type: 'boolean',
          description: 'Se deve incluir métricas gerais. Default: true'
        },
        incluirSugestoes: {
          type: 'boolean',
          description: 'Se deve incluir sugestões de ação. Default: true'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },

  // ==================== ENCERRAR DIA ====================
  {
    name: 'encerrar_dia',
    description: `Gera um resumo do dia de trabalho e prepara o preview do dia seguinte.
Use quando o gestor:
- Disser "Boa noite" ou "Fim de expediente"
- Pedir "Fecha o dia"
- Perguntar "Como foi meu dia?"
- Solicitar "Resume o que fiz hoje"
- Encerrar o expediente

O encerramento inclui:
1. O que foi realizado (reuniões, tarefas, mensagens)
2. O que ficou pendente
3. Pagamentos recebidos
4. Destaques do dia (positivos e atenção)
5. Preview do dia seguinte
6. Score de produtividade
7. Mensagem de encerramento

Ajuda a fechar o dia com clareza e preparar o próximo.`,
    parameters: {
      type: 'object',
      properties: {
        incluirPreviewAmanha: {
          type: 'boolean',
          description: 'Se deve incluir preview do dia seguinte. Default: true'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },

  // ==================== ONBOARDING CLIENTE ====================
  {
    name: 'onboarding_cliente',
    description: `Executa o fluxo completo de onboarding de um novo cliente.
Use quando o gestor:
- Disser "Novo cliente: [nome]"
- Pedir "Faz o onboarding do [cliente]"
- Solicitar "Prepara tudo pro cliente novo"
- Adicionar um novo cliente

IMPORTANTE: Este tool requer confirmação antes de executar.
O onboarding cria automaticamente:
1. Tarefas iniciais padrão (configuração de conta, etc)
2. Primeira reunião de alinhamento
3. Primeira cobrança (se aplicável)
4. Lembretes de acompanhamento
5. Checklist de informações a coletar

Tudo é mostrado para confirmação antes de criar.`,
    parameters: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'ID do cliente recém criado.'
        },
        query: {
          type: 'string',
          description: 'Nome do cliente para buscar.'
        },
        primeiraReuniaoData: {
          type: 'string',
          description: 'Data sugerida para primeira reunião (YYYY-MM-DD).'
        },
        primeiraReuniaoHorario: {
          type: 'string',
          description: 'Horário sugerido para primeira reunião (HH:mm).'
        },
        valorMensal: {
          type: 'number',
          description: 'Valor mensal do contrato para criar cobrança.'
        },
        diaVencimento: {
          type: 'number',
          description: 'Dia do mês para vencimento das faturas.'
        }
      },
      required: []
    },
    requiresConfirmation: true,
    confirmationType: 'generic'
  },

  // ==================== HEALTH CHECK GERAL ====================
  {
    name: 'health_check_geral',
    description: `Analisa a saúde geral de toda a operação de gestão de tráfego.
Use quando o gestor:
- Perguntar "Como está minha operação?"
- Solicitar "Faz um check-up geral"
- Querer "Relatório de saúde dos clientes"
- Pedir "Análise geral do negócio"

O health check analisa:
1. Visão geral de clientes (ativos, pausados, inativos)
2. Saúde financeira (faturamento, inadimplência, MRR)
3. Saúde operacional (tarefas, reuniões, comunicação)
4. Distribuição de clientes por saúde
5. Top alertas prioritários
6. Comparativo com período anterior
7. Recomendações estratégicas

Retorna um diagnóstico completo da operação.`,
    parameters: {
      type: 'object',
      properties: {
        periodo: {
          type: 'string',
          enum: ['30dias', '60dias', '90dias'],
          description: 'Período para análise. Default: 30dias'
        },
        incluirRecomendacoes: {
          type: 'boolean',
          description: 'Se deve incluir recomendações estratégicas. Default: true'
        }
      },
      required: []
    },
    requiresConfirmation: false
  }
];

export default META_ACTION_TOOLS;
