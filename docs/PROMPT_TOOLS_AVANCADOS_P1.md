# 🚀 MARCOLA ASSISTANT - Tools Avançados v2.0

> **Versão:** 2.0
> **Pré-requisito:** MARCOLA v1.0 implementado (16 tools básicos funcionando)
> **Total de novos tools:** 16 tools avançados
> **Objetivo:** Transformar o agente de REATIVO para PROATIVO

---

## 📋 ÍNDICE DAS PARTES

1. **Parte 1:** Visão Geral e Tipos TypeScript (este arquivo)
2. **Parte 2:** Tools de Ações em Lote (4 tools)
3. **Parte 3:** Tools de Inteligência e Sugestões (4 tools)
4. **Parte 4:** Tools de Comunicação Inteligente (4 tools)
5. **Parte 5:** Tools de Meta-Ação e Rotinas (4 tools)
6. **Parte 6:** Cards de Confirmação e Integração Final

---

## 🎯 VISÃO GERAL

### O Que Muda com Tools Avançados?

**ANTES (v1.0 - 16 tools básicos):**
```
Gestor: "Cobra o João"
Marcola: [Envia cobrança para João]

Gestor: "Cobra a Maria"
Marcola: [Envia cobrança para Maria]

Gestor: "Cobra o Pedro"
Marcola: [Envia cobrança para Pedro]
```

**DEPOIS (v2.0 - 32 tools):**
```
Gestor: "Cobra todo mundo que tá devendo"
Marcola: [Mostra lista de 5 clientes vencidos]
         [Gestor confirma]
         [Envia 5 cobranças de uma vez]

Gestor: "Bom dia"
Marcola: "Bom dia Jeferson! Aqui está seu dia:
         📅 3 reuniões (10h, 14h, 16h)
         💰 2 pagamentos vencem hoje (R$ 3.500)
         ⚠️ Cliente X com ROAS caindo há 3 dias
         Quer que eu envie os lembretes de pagamento?"
```

### Lista Completa dos 16 Novos Tools

```
┌─────────────────────────────────────────────────────────────┐
│                    TOOLS AVANÇADOS (16)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔄 AÇÕES EM LOTE (4)                                      │
│  ├── cobrar_todos_vencidos      ✅ confirmação             │
│  ├── confirmar_reunioes_amanha  ✅ confirmação             │
│  ├── gerar_faturas_mes          ✅ confirmação             │
│  └── enviar_followup_lote       ✅ confirmação             │
│                                                             │
│  🧠 INTELIGÊNCIA (4)                                       │
│  ├── sugerir_acoes_dia                                     │
│  ├── diagnosticar_cliente                                  │
│  ├── identificar_clientes_risco                            │
│  └── prever_faturamento                                    │
│                                                             │
│  💬 COMUNICAÇÃO (4)                                        │
│  ├── preparar_reuniao                                      │
│  ├── registrar_pos_reuniao      ✅ confirmação             │
│  ├── agendar_recorrente         ✅ confirmação             │
│  └── gerar_relatorio_cliente                               │
│                                                             │
│  ⚡ META-AÇÃO (4)                                          │
│  ├── executar_rotina_matinal                               │
│  ├── encerrar_dia                                          │
│  ├── onboarding_cliente         ✅ confirmação             │
│  └── health_check_geral                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 TIPOS TYPESCRIPT

### Arquivo: `src/lib/assistant/types-advanced.ts`

```typescript
// ============================================================
// MARCOLA ASSISTANT - TIPOS PARA TOOLS AVANÇADOS v2.0
// ============================================================

import { ConfirmationData, ToolCall } from './types';

// ==================== AÇÕES EM LOTE ====================

/**
 * Resultado de uma ação executada em lote
 */
export interface BatchActionResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  results: BatchItemResult[];
  summary: string;
}

export interface BatchItemResult {
  clientId: string;
  clientName: string;
  success: boolean;
  error?: string;
  messageId?: string;  // ID da mensagem WhatsApp se enviada
  details?: Record<string, any>;
}

/**
 * Dados para cobrança em lote
 */
export interface BatchCobrancaData {
  clientes: Array<{
    clientId: string;
    clientName: string;
    contactName: string;
    phone: string;
    amount: number;
    daysOverdue: number;
    paymentId: string;
    dueDate: string;
  }>;
  totalAmount: number;
  totalClientes: number;
  messageTemplate: string;
}

/**
 * Dados para confirmação de reuniões em lote
 */
export interface BatchConfirmacaoReuniaoData {
  data: string; // Data das reuniões (amanhã)
  reunioes: Array<{
    meetingId: string;
    clientId: string;
    clientName: string;
    contactName: string;
    phone: string;
    time: string;
    type: 'online' | 'presencial';
  }>;
  totalReunioes: number;
  messageTemplate: string;
}

/**
 * Dados para follow-up em lote
 */
export interface BatchFollowupData {
  clientes: Array<{
    clientId: string;
    clientName: string;
    contactName: string;
    phone: string;
    diasSemContato: number;
    ultimoContato: string;
    ultimoContatoTipo: string; // 'reunião', 'whatsapp', etc
  }>;
  totalClientes: number;
  diasMinimo: number; // Filtro usado (ex: 7 dias)
  messageTemplate: string;
}

/**
 * Dados para geração de faturas mensais
 */
export interface GerarFaturasData {
  mes: string; // "2025-01"
  mesLabel: string; // "Janeiro 2025"
  clientes: Array<{
    clientId: string;
    clientName: string;
    monthlyValue: number;
    dueDay: number;
    dueDate: string;
    jaExiste: boolean; // Se já tem fatura pro mês
  }>;
  totalFaturamento: number;
  clientesNovos: number; // Faturas a criar
  clientesJaFaturados: number; // Já tem fatura
}

// ==================== INTELIGÊNCIA ====================

/**
 * Sugestão de ação individual
 */
export interface SugestaoAcao {
  id: string;
  prioridade: number; // 1-10 (10 = mais urgente)
  tipo: 'urgente' | 'importante' | 'normal';
  categoria: 'pagamento' | 'reuniao' | 'tarefa' | 'cliente' | 'campanha';
  icone: string; // emoji
  titulo: string;
  descricao: string;
  clientId?: string;
  clientName?: string;
  
  // Ação para executar se usuário aceitar
  acao?: {
    tool: string;
    parameters: Record<string, any>;
    label: string; // "Enviar cobrança"
  };
  
  // Metadados
  valor?: number; // Valor envolvido (para ordenação)
  diasAtraso?: number;
}

/**
 * Resultado do sugerir_acoes_dia
 */
export interface SugestoesDoDia {
  data: string;
  diaSemana: string;
  saudacao: string;
  
  // Métricas do dia
  metricas: {
    reunioesHoje: number;
    tarefasPendentes: number;
    tarefasUrgentes: number;
    pagamentosVencemHoje: number;
    pagamentosVencidos: number;
    valorVencido: number;
    clientesSemContato: number;
  };
  
  // Sugestões ordenadas por prioridade
  sugestoes: SugestaoAcao[];
  totalSugestoes: number;
  
  // Resumo em texto
  resumoExecutivo: string;
}

/**
 * Diagnóstico completo de um cliente
 */
export interface DiagnosticoCliente {
  clientId: string;
  clientName: string;
  segment: string;
  dataAnalise: string;
  
  // Score de Saúde (0-100)
  healthScore: number;
  statusGeral: 'saudavel' | 'atencao' | 'critico';
  
  // Análise Financeira
  financeiro: {
    status: 'em_dia' | 'pendente' | 'atrasado' | 'critico';
    valorContrato: number;
    pagamentosEmDia: number;
    pagamentosPendentes: number;
    valorPendente: number;
    diasMaiorAtraso: number;
    historicoAdimplencia: number; // % últimos 6 meses
  };
  
  // Análise de Engajamento
  engajamento: {
    status: 'ativo' | 'moderado' | 'baixo' | 'inativo';
    ultimoContato: string;
    diasSemContato: number;
    tipoUltimoContato: string;
    reunioesUltimos30Dias: number;
    reunioesUltimos90Dias: number;
    frequenciaIdeal: string; // 'semanal', 'quinzenal', etc
  };
  
  // Análise de Tarefas
  tarefas: {
    pendentes: number;
    concluidas: number;
    atrasadas: number;
    taxaConclusao: number; // %
  };
  
  // Análise de Performance (se tiver dados de ads)
  performance?: {
    temDados: boolean;
    roas: number;
    roasAnterior: number;
    tendencia: 'subindo' | 'estavel' | 'caindo';
    gastoMes: number;
    conversoesMes: number;
    alertas: string[];
  };
  
  // Recomendações Acionáveis
  recomendacoes: Array<{
    prioridade: 'alta' | 'media' | 'baixa';
    categoria: string;
    acao: string;
    motivo: string;
    impacto: string;
    tool?: string;
    toolParams?: Record<string, any>;
  }>;
  
  // Timeline Recente
  historicoRecente: Array<{
    data: string;
    tipo: 'reuniao' | 'pagamento' | 'tarefa' | 'mensagem';
    descricao: string;
    status: 'positivo' | 'neutro' | 'negativo';
  }>;
  
  // Resumo
  resumoExecutivo: string;
  pontosFortes: string[];
  pontosFracos: string[];
}

/**
 * Cliente identificado como em risco
 */
export interface ClienteRisco {
  clientId: string;
  clientName: string;
  segment: string;
  
  // Classificação de Risco
  nivelRisco: 'critico' | 'alto' | 'medio';
  scoreRisco: number; // 0-100 (100 = maior risco)
  
  // Motivos do Risco
  motivos: string[];
  
  // Indicadores Detalhados
  indicadores: {
    financeiro: {
      emRisco: boolean;
      pagamentoAtrasado: boolean;
      diasAtraso: number;
      valorAtrasado: number;
    };
    engajamento: {
      emRisco: boolean;
      diasSemContato: number;
      reunioesCanceladas: number;
      tendenciaContato: 'diminuindo' | 'estavel' | 'aumentando';
    };
    performance: {
      emRisco: boolean;
      roasBaixo: boolean;
      roasAtual: number;
      quedaPerformance: boolean;
    };
    operacional: {
      emRisco: boolean;
      tarefasAtrasadas: number;
      reclamacoes: number;
    };
  };
  
  // Ação Sugerida
  acaoPrioritaria: {
    descricao: string;
    urgencia: 'imediata' | 'hoje' | 'esta_semana';
    tool?: string;
    toolParams?: Record<string, any>;
  };
  
  // Valor em risco
  valorContrato: number;
  tempoComoCliente: string;
}

/**
 * Relatório de clientes em risco
 */
export interface RelatorioClientesRisco {
  dataAnalise: string;
  
  // Totais
  totalAnalisados: number;
  totalEmRisco: number;
  valorTotalEmRisco: number;
  
  // Distribuição
  distribuicao: {
    critico: number;
    alto: number;
    medio: number;
    saudavel: number;
  };
  
  // Lista de clientes em risco (ordenada por score)
  clientesEmRisco: ClienteRisco[];
  
  // Top 3 ações prioritárias
  acoesPrioritarias: Array<{
    clientName: string;
    acao: string;
    impacto: string;
  }>;
  
  resumoExecutivo: string;
}

/**
 * Previsão de faturamento
 */
export interface PrevisaoFaturamento {
  mes: string;
  mesLabel: string;
  dataAnalise: string;
  
  // Valores Principais
  previsaoTotal: number;
  recebidoAteAgora: number;
  aReceber: number;
  vencidoNaoRecebido: number;
  
  // Probabilidade
  previsaoOtimista: number;
  previsaoPessimista: number;
  previsaoRealista: number;
  
  // Detalhamento por Cliente
  detalhamento: Array<{
    clientId: string;
    clientName: string;
    valor: number;
    status: 'recebido' | 'a_vencer' | 'vence_hoje' | 'vencido';
    dataVencimento: string;
    probabilidadeRecebimento: number; // % baseado em histórico
    diasAtraso?: number;
  }>;
  
  // Comparativo
  comparativoMesAnterior: {
    mesAnterior: string;
    valorMesAnterior: number;
    variacao: number; // %
    tendencia: 'crescimento' | 'estavel' | 'queda';
  };
  
  // Por Status
  porStatus: {
    recebido: { quantidade: number; valor: number };
    aVencer: { quantidade: number; valor: number };
    vencido: { quantidade: number; valor: number };
  };
  
  resumoExecutivo: string;
  alertas: string[];
}

// ==================== COMUNICAÇÃO ====================

/**
 * Briefing preparatório para reunião
 */
export interface BriefingReuniao {
  meetingId: string;
  clientId: string;
  clientName: string;
  
  // Dados da Reunião
  reuniao: {
    data: string;
    dataFormatada: string;
    horario: string;
    tipo: 'online' | 'presencial';
    notas?: string;
  };
  
  // Contexto do Cliente
  contextoCliente: {
    segment: string;
    tempoComoCliente: string;
    valorContrato: number;
    ultimaReuniao?: string;
    frequenciaReunioes: string;
  };
  
  // Situação Atual
  situacaoAtual: {
    // Financeiro
    pagamentos: {
      status: 'em_dia' | 'pendente' | 'atrasado';
      pendencias: Array<{
        valor: number;
        vencimento: string;
        diasAtraso: number;
      }>;
    };
    
    // Tarefas
    tarefas: {
      pendentes: number;
      concluidas: number;
      atrasadas: number;
      proximasPendentes: Array<{
        titulo: string;
        prazo: string;
      }>;
    };
    
    // Performance
    campanhas?: {
      temDados: boolean;
      roas: number;
      tendencia: string;
      gastoMes: number;
      conversoes: number;
      alertas: string[];
    };
  };
  
  // Histórico Recente (últimas interações)
  historicoRecente: Array<{
    data: string;
    tipo: string;
    descricao: string;
  }>;
  
  // Pauta Sugerida
  pautaSugerida: Array<{
    topico: string;
    prioridade: 'alta' | 'media' | 'baixa';
    notas?: string;
  }>;
  
  // Pontos de Atenção
  pontosAtencao: Array<{
    tipo: 'alerta' | 'oportunidade' | 'info';
    descricao: string;
  }>;
  
  // Perguntas para Fazer
  perguntasSugeridas: string[];
  
  // Resumo
  resumoExecutivo: string;
}

/**
 * Registro pós-reunião
 */
export interface RegistroPosReuniao {
  meetingId: string;
  clientId: string;
  clientName: string;
  dataReuniao: string;
  
  // Anotações gerais
  anotacoes: string;
  
  // Decisões tomadas
  decisoes: Array<{
    descricao: string;
    responsavel: 'gestor' | 'cliente' | 'ambos';
  }>;
  
  // Próximos passos (viram tarefas)
  proximosPassos: Array<{
    descricao: string;
    responsavel: 'gestor' | 'cliente';
    prazo?: string;
    prioridade: 'alta' | 'media' | 'baixa';
    criarTarefa: boolean;
  }>;
  
  // Feedback do cliente (opcional)
  feedbackCliente?: {
    satisfacao: 'muito_satisfeito' | 'satisfeito' | 'neutro' | 'insatisfeito';
    comentarios?: string;
  };
  
  // Próxima reunião (opcional)
  proximaReuniao?: {
    agendar: boolean;
    data?: string;
    horario?: string;
    pauta?: string;
  };
  
  // Resumo da reunião
  resumo: string;
}

/**
 * Configuração de agendamento recorrente
 */
export interface AgendamentoRecorrente {
  clientId: string;
  clientName: string;
  
  // Tipo de recorrência
  tipo: 'reuniao' | 'tarefa' | 'lembrete';
  
  // Configuração
  frequencia: 'semanal' | 'quinzenal' | 'mensal';
  diaSemana?: string; // 'segunda', 'terça', etc
  diaDoMes?: number; // 1-31 (para mensal)
  horario?: string; // HH:mm
  
  // Detalhes do item
  detalhes: {
    titulo?: string;
    descricao?: string;
    tipoReuniao?: 'online' | 'presencial';
    prioridade?: 'alta' | 'media' | 'baixa';
  };
  
  // Período de vigência
  dataInicio: string;
  dataFim?: string; // null = indefinido
  quantidadeOcorrencias?: number; // ou definir por quantidade
  
  // Preview das próximas ocorrências
  proximasOcorrencias: Array<{
    data: string;
    dataFormatada: string;
    horario?: string;
  }>;
  
  resumo: string;
}

/**
 * Relatório de performance para enviar ao cliente
 */
export interface RelatorioCliente {
  clientId: string;
  clientName: string;
  
  // Período
  periodo: {
    inicio: string;
    fim: string;
    label: string; // "Novembro 2025"
  };
  
  // Métricas de Campanha
  campanhas?: {
    temDados: boolean;
    investimento: number;
    impressoes: number;
    cliques: number;
    conversoes: number;
    roas: number;
    cpa: number;
    ctr: number;
    
    // Comparativo
    comparativoAnterior: {
      investimento: { atual: number; anterior: number; variacao: number };
      conversoes: { atual: number; anterior: number; variacao: number };
      roas: { atual: number; anterior: number; variacao: number };
    };
    
    // Top campanhas
    topCampanhas: Array<{
      nome: string;
      investimento: number;
      conversoes: number;
      roas: number;
    }>;
  };
  
  // Atividades Realizadas
  atividades: {
    reunioesRealizadas: number;
    tarefasConcluidas: number;
    mensagensEnviadas: number;
    ajustesRealizados: string[];
  };
  
  // Destaques (pontos positivos)
  destaques: string[];
  
  // Pontos de Melhoria
  pontosMelhoria: string[];
  
  // Plano para Próximo Período
  planoProximoPeriodo: string[];
  
  // Resumo Executivo
  resumoExecutivo: string;
  
  // Mensagem personalizada (para WhatsApp)
  mensagemResumo: string;
}

// ==================== META-AÇÃO ====================

/**
 * Resultado da rotina matinal
 */
export interface RotinaMatinal {
  data: string;
  dataFormatada: string;
  diaSemana: string;
  horaExecucao: string;
  
  // Saudação personalizada
  saudacao: string;
  
  // Agenda do Dia
  agenda: {
    reunioes: Array<{
      id: string;
      horario: string;
      clientName: string;
      tipo: 'online' | 'presencial';
      preparado: boolean; // se tem briefing
    }>;
    totalReunioes: number;
    
    tarefas: Array<{
      id: string;
      titulo: string;
      clientName?: string;
      prioridade: string;
      atrasada: boolean;
    }>;
    totalTarefas: number;
    tarefasUrgentes: number;
  };
  
  // Situação Financeira
  financeiro: {
    vencemHoje: Array<{
      clientId: string;
      clientName: string;
      valor: number;
    }>;
    vencidos: Array<{
      clientId: string;
      clientName: string;
      valor: number;
      diasAtraso: number;
    }>;
    totalVenceHoje: number;
    totalVencido: number;
    valorVenceHoje: number;
    valorVencido: number;
  };
  
  // Alertas
  alertas: Array<{
    tipo: 'critico' | 'atencao' | 'info';
    icone: string;
    mensagem: string;
    clientId?: string;
    clientName?: string;
    acao?: {
      label: string;
      tool: string;
      params: Record<string, any>;
    };
  }>;
  
  // Sugestões Prioritárias do Dia
  sugestoesPrioritarias: SugestaoAcao[];
  
  // Métricas Gerais
  metricas: {
    totalClientes: number;
    clientesAtivos: number;
    faturamentoPrevisto: number;
    taxaAdimplencia: number;
  };
  
  // Resumo do Dia
  resumoDia: string;
}

/**
 * Resultado do encerramento do dia
 */
export interface EncerramentoDia {
  data: string;
  dataFormatada: string;
  horaExecucao: string;
  
  // O que foi realizado
  realizacoes: {
    reunioesRealizadas: number;
    reunioesTotal: number;
    tarefasConcluidas: number;
    tarefasTotal: number;
    mensagensEnviadas: number;
    pagamentosRecebidos: number;
    valorRecebido: number;
  };
  
  // O que ficou pendente
  pendencias: {
    reunioesNaoRealizadas: Array<{
      clientName: string;
      horario: string;
      motivo?: string;
    }>;
    tarefasNaoConcluidas: Array<{
      titulo: string;
      clientName?: string;
      prioridade: string;
    }>;
    cobrancasNaoEnviadas: Array<{
      clientName: string;
      valor: number;
    }>;
  };
  
  // Preview de Amanhã
  previsaoAmanha: {
    reunioes: number;
    tarefas: number;
    pagamentosVencendo: number;
    valorVencendo: number;
  };
  
  // Destaques do Dia
  destaques: Array<{
    tipo: 'positivo' | 'neutro' | 'atencao';
    descricao: string;
  }>;
  
  // Resumo
  resumoDia: string;
  mensagemFinal: string;
  
  // Comparativo com meta
  produtividade: {
    score: number; // 0-100
    nivel: 'excelente' | 'bom' | 'regular' | 'abaixo';
  };
}

/**
 * Dados do onboarding de cliente
 */
export interface OnboardingCliente {
  clientId: string;
  clientName: string;
  segment: string;
  dataOnboarding: string;
  
  // Passos do Onboarding
  passos: Array<{
    ordem: number;
    nome: string;
    descricao: string;
    status: 'pendente' | 'em_andamento' | 'concluido';
    obrigatorio: boolean;
  }>;
  
  // Itens que serão criados
  itensCriar: {
    tarefasIniciais: Array<{
      titulo: string;
      descricao: string;
      prazo: string;
      prioridade: 'alta' | 'media' | 'baixa';
    }>;
    
    primeiraReuniao: {
      criar: boolean;
      sugestaoData: string;
      sugestaoHorario: string;
      pauta: string;
    };
    
    primeiraCobranca?: {
      criar: boolean;
      valor: number;
      vencimento: string;
      descricao: string;
    };
    
    lembretes: Array<{
      mensagem: string;
      data: string;
    }>;
  };
  
  // Checklist de informações necessárias
  checklistInfo: Array<{
    item: string;
    preenchido: boolean;
    valor?: string;
  }>;
  
  // Próximos passos sugeridos
  proximosPassos: string[];
  
  resumo: string;
}

/**
 * Health Check geral da operação
 */
export interface HealthCheckGeral {
  dataAnalise: string;
  periodo: string; // "Últimos 30 dias"
  
  // Visão Geral
  visaoGeral: {
    totalClientes: number;
    clientesAtivos: number;
    clientesPausados: number;
    clientesInativos: number;
    novosClientesMes: number;
    churnMes: number;
  };
  
  // Saúde Financeira
  saudeFinanceira: {
    score: number; // 0-100
    status: 'excelente' | 'bom' | 'atencao' | 'critico';
    faturamentoMes: number;
    recebidoMes: number;
    inadimplencia: number; // %
    ticketMedio: number;
    mrr: number; // Monthly Recurring Revenue
    
    topClientes: Array<{
      clientName: string;
      valor: number;
      percentual: number;
    }>;
    
    concentracaoRisco: number; // % do maior cliente
  };
  
  // Saúde Operacional
  saudeOperacional: {
    score: number;
    status: 'excelente' | 'bom' | 'atencao' | 'critico';
    
    tarefas: {
      totais: number;
      concluidas: number;
      atrasadas: number;
      taxaConclusao: number;
    };
    
    reunioes: {
      realizadas: number;
      canceladas: number;
      taxaRealizacao: number;
    };
    
    comunicacao: {
      mensagensEnviadas: number;
      mediaContatoCliente: number; // dias
      clientesSemContato30Dias: number;
    };
  };
  
  // Distribuição de Saúde dos Clientes
  distribuicaoClientes: {
    saudaveis: { quantidade: number; percentual: number };
    atencao: { quantidade: number; percentual: number };
    criticos: { quantidade: number; percentual: number };
  };
  
  // Top Alertas
  topAlertas: Array<{
    prioridade: 'critica' | 'alta' | 'media';
    categoria: 'financeiro' | 'operacional' | 'cliente' | 'campanha';
    titulo: string;
    descricao: string;
    impacto: string;
    clientId?: string;
    clientName?: string;
    acaoSugerida: string;
  }>;
  
  // Comparativo com Período Anterior
  comparativo: {
    faturamento: { atual: number; anterior: number; variacao: number };
    clientes: { atual: number; anterior: number; variacao: number };
    inadimplencia: { atual: number; anterior: number; variacao: number };
    produtividade: { atual: number; anterior: number; variacao: number };
  };
  
  // Recomendações Estratégicas
  recomendacoes: Array<{
    prioridade: 'alta' | 'media' | 'baixa';
    area: string;
    recomendacao: string;
    impactoEsperado: string;
    prazoSugerido: string;
  }>;
  
  // Resumo
  resumoExecutivo: string;
  scoreGeral: number; // 0-100
  statusGeral: 'excelente' | 'bom' | 'atencao' | 'critico';
}

// ==================== TIPOS DE CONFIRMAÇÃO ====================

export type ConfirmationTypeAdvanced =
  | 'batch_cobranca'
  | 'batch_confirmacao_reuniao'
  | 'batch_followup'
  | 'gerar_faturas'
  | 'pos_reuniao'
  | 'agendamento_recorrente'
  | 'onboarding_cliente';

// ==================== EXPORTS ====================

export type {
  BatchActionResult,
  BatchItemResult,
  BatchCobrancaData,
  BatchConfirmacaoReuniaoData,
  BatchFollowupData,
  GerarFaturasData,
  SugestaoAcao,
  SugestoesDoDia,
  DiagnosticoCliente,
  ClienteRisco,
  RelatorioClientesRisco,
  PrevisaoFaturamento,
  BriefingReuniao,
  RegistroPosReuniao,
  AgendamentoRecorrente,
  RelatorioCliente,
  RotinaMatinal,
  EncerramentoDia,
  OnboardingCliente,
  HealthCheckGeral,
};
```

---

**Continua na Parte 2: Tools de Ações em Lote...**
