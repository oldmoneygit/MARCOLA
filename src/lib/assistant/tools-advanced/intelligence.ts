/**
 * @file intelligence.ts
 * @description Definições dos Tools de Inteligência do MARCOLA Assistant
 * @module lib/assistant/tools-advanced
 */

import type { ToolDefinition } from '../types';

export const INTELLIGENCE_TOOLS: ToolDefinition[] = [
  // ==================== SUGERIR AÇÕES DO DIA ====================
  {
    name: 'sugerir_acoes_dia',
    description: `Analisa o contexto atual e sugere as ações prioritárias para o dia.
Use quando o gestor:
- Perguntar "O que devo fazer hoje?"
- Pedir sugestões de prioridade
- Querer saber as ações mais importantes
- Iniciar o dia querendo orientação
- Perguntar "Qual minha prioridade?"

Analisa:
- Pagamentos vencidos e a vencer
- Reuniões do dia
- Tarefas pendentes e atrasadas
- Clientes sem contato recente
- Campanhas com problemas
- Oportunidades de upsell/follow-up

Retorna lista priorizada de ações com botões de ação rápida.`,
    parameters: {
      type: 'object',
      properties: {
        limite: {
          type: 'number',
          description: 'Quantidade máxima de sugestões. Default: 10'
        },
        incluirFinanceiro: {
          type: 'boolean',
          description: 'Incluir sugestões financeiras (cobranças). Default: true'
        },
        incluirOperacional: {
          type: 'boolean',
          description: 'Incluir sugestões operacionais (tarefas). Default: true'
        },
        incluirRelacionamento: {
          type: 'boolean',
          description: 'Incluir sugestões de relacionamento (follow-ups). Default: true'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },

  // ==================== DIAGNOSTICAR CLIENTE ====================
  {
    name: 'diagnosticar_cliente',
    description: `Gera um diagnóstico completo de um cliente específico.
Use quando o gestor:
- Perguntar "Como está o cliente X?"
- Quiser uma análise detalhada de um cliente
- Precisar preparar uma conversa difícil
- Pedir "Faz um diagnóstico do cliente"
- Perguntar sobre a situação de um cliente específico

O diagnóstico inclui:
- Health Score geral do cliente
- Situação financeira (pagamentos, histórico)
- Engajamento (frequência de contato, reuniões)
- Performance de campanhas (se houver dados)
- Tarefas pendentes relacionadas
- Histórico recente de interações
- Pontos fortes e fracos
- Recomendações de ação

Ideal para antes de reuniões ou para entender problemas.`,
    parameters: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'ID do cliente para diagnóstico.'
        },
        query: {
          type: 'string',
          description: 'Nome do cliente para buscar. Use se não souber o ID.'
        },
        incluirPerformance: {
          type: 'boolean',
          description: 'Incluir dados de performance de ads. Default: true'
        },
        incluirHistorico: {
          type: 'boolean',
          description: 'Incluir histórico de interações. Default: true'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },

  // ==================== IDENTIFICAR CLIENTES EM RISCO ====================
  {
    name: 'identificar_clientes_risco',
    description: `Analisa toda a base e identifica clientes em risco de churn.
Use quando o gestor:
- Perguntar "Quais clientes estão em risco?"
- Quiser prevenir cancelamentos
- Pedir para identificar problemas na base
- Perguntar "Quem pode cancelar?"
- Solicitar análise de retenção

Analisa os seguintes indicadores de risco:
1. Financeiro: Pagamentos atrasados, histórico de atrasos
2. Engajamento: Tempo sem contato, reuniões canceladas
3. Performance: ROAS em queda, resultados ruins
4. Operacional: Reclamações, tarefas acumuladas

Classifica em níveis:
- Crítico: Risco imediato de churn
- Alto: Precisa de ação urgente
- Médio: Requer atenção nas próximas semanas

Retorna lista priorizada com ações recomendadas.`,
    parameters: {
      type: 'object',
      properties: {
        nivelMinimo: {
          type: 'string',
          enum: ['critico', 'alto', 'medio'],
          description: 'Nível mínimo de risco para filtrar. Default: medio'
        },
        limite: {
          type: 'number',
          description: 'Quantidade máxima de clientes. Default: 10'
        },
        incluirIndicadores: {
          type: 'boolean',
          description: 'Incluir detalhes dos indicadores. Default: true'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },

  // ==================== PREVER FATURAMENTO ====================
  {
    name: 'prever_faturamento',
    description: `Faz uma previsão de faturamento para o mês atual ou futuro.
Use quando o gestor:
- Perguntar "Quanto vou receber esse mês?"
- Quiser previsão financeira
- Perguntar "Como está meu faturamento?"
- Solicitar projeção de receita
- Perguntar sobre recebíveis

A previsão inclui:
1. Total previsto para o mês
2. Quanto já foi recebido
3. Quanto ainda vai entrar (com probabilidades)
4. Quanto está vencido e não pago
5. Comparativo com mês anterior
6. Cenários otimista/pessimista/realista

Detalhamento por cliente com status de cada pagamento.`,
    parameters: {
      type: 'object',
      properties: {
        mes: {
          type: 'string',
          description: 'Mês para previsão (YYYY-MM). Default: mês atual'
        },
        incluirDetalhamento: {
          type: 'boolean',
          description: 'Incluir detalhamento por cliente. Default: true'
        },
        incluirComparativo: {
          type: 'boolean',
          description: 'Incluir comparativo com mês anterior. Default: true'
        }
      },
      required: []
    },
    requiresConfirmation: false
  }
];

export default INTELLIGENCE_TOOLS;
