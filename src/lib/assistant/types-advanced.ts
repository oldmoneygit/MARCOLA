/**
 * @file types-advanced.ts
 * @description Tipos TypeScript para os Tools Avançados do MARCOLA Assistant
 * @module lib/assistant
 */

import type { ConfirmationData } from './types';

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
  messageId?: string;
  details?: Record<string, unknown>;
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
  data: string;
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
    ultimoContatoTipo: string;
  }>;
  totalClientes: number;
  diasMinimo: number;
  messageTemplate: string;
}

/**
 * Dados para geração de faturas mensais
 */
export interface GerarFaturasData {
  mes: string;
  mesLabel: string;
  clientes: Array<{
    clientId: string;
    clientName: string;
    monthlyValue: number;
    dueDay: number;
    dueDate: string;
    jaExiste: boolean;
  }>;
  totalFaturamento: number;
  clientesNovos: number;
  clientesJaFaturados: number;
}

// ==================== INTELIGÊNCIA ====================

/**
 * Sugestão de ação individual
 */
export interface SugestaoAcao {
  id: string;
  prioridade: number;
  tipo: 'urgente' | 'importante' | 'normal';
  categoria: 'pagamento' | 'reuniao' | 'tarefa' | 'cliente' | 'campanha';
  icone: string;
  titulo: string;
  descricao: string;
  clientId?: string;
  clientName?: string;
  acao?: {
    tool: string;
    parameters: Record<string, unknown>;
    label: string;
  };
  valor?: number;
  diasAtraso?: number;
}

/**
 * Resultado do sugerir_acoes_dia
 */
export interface SugestoesDoDia {
  data: string;
  diaSemana: string;
  saudacao: string;
  metricas: {
    reunioesHoje: number;
    tarefasPendentes: number;
    tarefasUrgentes: number;
    pagamentosVencemHoje: number;
    pagamentosVencidos: number;
    valorVencido: number;
    clientesSemContato: number;
  };
  sugestoes: SugestaoAcao[];
  totalSugestoes: number;
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
  healthScore: number;
  statusGeral: 'saudavel' | 'atencao' | 'critico';
  financeiro: {
    status: 'em_dia' | 'pendente' | 'atrasado' | 'critico';
    valorContrato: number;
    pagamentosEmDia: number;
    pagamentosPendentes: number;
    valorPendente: number;
    diasMaiorAtraso: number;
    historicoAdimplencia: number;
  };
  engajamento: {
    status: 'ativo' | 'moderado' | 'baixo' | 'inativo';
    ultimoContato: string;
    diasSemContato: number;
    tipoUltimoContato: string;
    reunioesUltimos30Dias: number;
    reunioesUltimos90Dias: number;
    frequenciaIdeal: string;
  };
  tarefas: {
    pendentes: number;
    concluidas: number;
    atrasadas: number;
    taxaConclusao: number;
  };
  performance?: {
    temDados: boolean;
    roas: number;
    roasAnterior: number;
    tendencia: 'subindo' | 'estavel' | 'caindo';
    gastoMes: number;
    conversoesMes: number;
    alertas: string[];
  };
  recomendacoes: Array<{
    prioridade: 'alta' | 'media' | 'baixa';
    categoria: string;
    acao: string;
    motivo: string;
    impacto: string;
    tool?: string;
    toolParams?: Record<string, unknown>;
  }>;
  historicoRecente: Array<{
    data: string;
    tipo: 'reuniao' | 'pagamento' | 'tarefa' | 'mensagem';
    descricao: string;
    status: 'positivo' | 'neutro' | 'negativo';
  }>;
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
  nivelRisco: 'critico' | 'alto' | 'medio';
  scoreRisco: number;
  motivos: string[];
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
  acaoPrioritaria: {
    descricao: string;
    urgencia: 'imediata' | 'hoje' | 'esta_semana';
    tool?: string;
    toolParams?: Record<string, unknown>;
  };
  valorContrato: number;
  tempoComoCliente: string;
}

/**
 * Relatório de clientes em risco
 */
export interface RelatorioClientesRisco {
  dataAnalise: string;
  totalAnalisados: number;
  totalEmRisco: number;
  valorTotalEmRisco: number;
  distribuicao: {
    critico: number;
    alto: number;
    medio: number;
    saudavel: number;
  };
  clientesEmRisco: ClienteRisco[];
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
  previsaoTotal: number;
  recebidoAteAgora: number;
  aReceber: number;
  vencidoNaoRecebido: number;
  previsaoOtimista: number;
  previsaoPessimista: number;
  previsaoRealista: number;
  detalhamento: Array<{
    clientId: string;
    clientName: string;
    valor: number;
    status: 'recebido' | 'a_vencer' | 'vence_hoje' | 'vencido';
    dataVencimento: string;
    probabilidadeRecebimento: number;
    diasAtraso?: number;
  }>;
  comparativoMesAnterior: {
    mesAnterior: string;
    valorMesAnterior: number;
    variacao: number;
    tendencia: 'crescimento' | 'estavel' | 'queda';
  };
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
  reuniao: {
    data: string;
    dataFormatada: string;
    horario: string;
    tipo: 'online' | 'presencial';
    notas?: string;
  };
  contextoCliente: {
    segment: string;
    tempoComoCliente: string;
    valorContrato: number;
    ultimaReuniao?: string;
    frequenciaReunioes: string;
  };
  situacaoAtual: {
    pagamentos: {
      status: 'em_dia' | 'pendente' | 'atrasado';
      pendencias: Array<{
        valor: number;
        vencimento: string;
        diasAtraso: number;
      }>;
    };
    tarefas: {
      pendentes: number;
      concluidas: number;
      atrasadas: number;
      proximasPendentes: Array<{
        titulo: string;
        prazo: string;
      }>;
    };
    campanhas?: {
      temDados: boolean;
      roas: number;
      tendencia: string;
      gastoMes: number;
      conversoes: number;
      alertas: string[];
    };
  };
  historicoRecente: Array<{
    data: string;
    tipo: string;
    descricao: string;
  }>;
  pautaSugerida: Array<{
    topico: string;
    prioridade: 'alta' | 'media' | 'baixa';
    notas?: string;
  }>;
  pontosAtencao: Array<{
    tipo: 'alerta' | 'oportunidade' | 'info';
    descricao: string;
  }>;
  perguntasSugeridas: string[];
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
  anotacoes: string;
  decisoes: Array<{
    descricao: string;
    responsavel: 'gestor' | 'cliente' | 'ambos';
  }>;
  proximosPassos: Array<{
    descricao: string;
    responsavel: 'gestor' | 'cliente';
    prazo?: string;
    prioridade: 'alta' | 'media' | 'baixa';
    criarTarefa: boolean;
  }>;
  feedbackCliente?: {
    satisfacao: 'muito_satisfeito' | 'satisfeito' | 'neutro' | 'insatisfeito';
    comentarios?: string;
  };
  proximaReuniao?: {
    agendar: boolean;
    data?: string;
    horario?: string;
    pauta?: string;
  };
  resumo: string;
}

/**
 * Configuração de agendamento recorrente
 */
export interface AgendamentoRecorrente {
  clientId: string;
  clientName: string;
  tipo: 'reuniao' | 'tarefa' | 'lembrete';
  frequencia: 'semanal' | 'quinzenal' | 'mensal';
  diaSemana?: string;
  diaDoMes?: number;
  horario?: string;
  detalhes: {
    titulo?: string;
    descricao?: string;
    tipoReuniao?: 'online' | 'presencial';
    prioridade?: 'alta' | 'media' | 'baixa';
  };
  dataInicio: string;
  dataFim?: string;
  quantidadeOcorrencias?: number;
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
  periodo: {
    inicio: string;
    fim: string;
    label: string;
  };
  campanhas?: {
    temDados: boolean;
    investimento: number;
    impressoes: number;
    cliques: number;
    conversoes: number;
    roas: number;
    cpa: number;
    ctr: number;
    comparativoAnterior: {
      investimento: { atual: number; anterior: number; variacao: number };
      conversoes: { atual: number; anterior: number; variacao: number };
      roas: { atual: number; anterior: number; variacao: number };
    };
    topCampanhas: Array<{
      nome: string;
      investimento: number;
      conversoes: number;
      roas: number;
    }>;
  };
  atividades: {
    reunioesRealizadas: number;
    tarefasConcluidas: number;
    mensagensEnviadas: number;
    ajustesRealizados: string[];
  };
  destaques: string[];
  pontosMelhoria: string[];
  planoProximoPeriodo: string[];
  resumoExecutivo: string;
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
  saudacao: string;
  agenda: {
    reunioes: Array<{
      id: string;
      horario: string;
      clientName: string;
      tipo: 'online' | 'presencial';
      preparado: boolean;
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
  alertas: Array<{
    tipo: 'critico' | 'atencao' | 'info';
    icone: string;
    mensagem: string;
    clientId?: string;
    clientName?: string;
    acao?: {
      label: string;
      tool: string;
      params: Record<string, unknown>;
    };
  }>;
  sugestoesPrioritarias: SugestaoAcao[];
  metricas: {
    totalClientes: number;
    clientesAtivos: number;
    faturamentoPrevisto: number;
    taxaAdimplencia: number;
  };
  resumoDia: string;
}

/**
 * Resultado do encerramento do dia
 */
export interface EncerramentoDia {
  data: string;
  dataFormatada: string;
  horaExecucao: string;
  realizacoes: {
    reunioesRealizadas: number;
    reunioesTotal: number;
    tarefasConcluidas: number;
    tarefasTotal: number;
    mensagensEnviadas: number;
    pagamentosRecebidos: number;
    valorRecebido: number;
  };
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
  previsaoAmanha: {
    reunioes: number;
    tarefas: number;
    pagamentosVencendo: number;
    valorVencendo: number;
  };
  destaques: Array<{
    tipo: 'positivo' | 'neutro' | 'atencao';
    descricao: string;
  }>;
  resumoDia: string;
  mensagemFinal: string;
  produtividade: {
    score: number;
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
  passos: Array<{
    ordem: number;
    nome: string;
    descricao: string;
    status: 'pendente' | 'em_andamento' | 'concluido';
    obrigatorio: boolean;
  }>;
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
  checklistInfo: Array<{
    item: string;
    preenchido: boolean;
    valor?: string;
  }>;
  proximosPassos: string[];
  resumo: string;
}

/**
 * Health Check geral da operação
 */
export interface HealthCheckGeral {
  dataAnalise: string;
  periodo: string;
  visaoGeral: {
    totalClientes: number;
    clientesAtivos: number;
    clientesPausados: number;
    clientesInativos: number;
    novosClientesMes: number;
    churnMes: number;
  };
  saudeFinanceira: {
    score: number;
    status: 'excelente' | 'bom' | 'atencao' | 'critico';
    faturamentoMes: number;
    recebidoMes: number;
    inadimplencia: number;
    ticketMedio: number;
    mrr: number;
    topClientes: Array<{
      clientName: string;
      valor: number;
      percentual: number;
    }>;
    concentracaoRisco: number;
  };
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
      mediaContatoCliente: number;
      clientesSemContato30Dias: number;
    };
  };
  distribuicaoClientes: {
    saudaveis: { quantidade: number; percentual: number };
    atencao: { quantidade: number; percentual: number };
    criticos: { quantidade: number; percentual: number };
  };
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
  comparativo: {
    faturamento: { atual: number; anterior: number; variacao: number };
    clientes: { atual: number; anterior: number; variacao: number };
    inadimplencia: { atual: number; anterior: number; variacao: number };
    produtividade: { atual: number; anterior: number; variacao: number };
  };
  recomendacoes: Array<{
    prioridade: 'alta' | 'media' | 'baixa';
    area: string;
    recomendacao: string;
    impactoEsperado: string;
    prazoSugerido: string;
  }>;
  resumoExecutivo: string;
  scoreGeral: number;
  statusGeral: 'excelente' | 'bom' | 'atencao' | 'critico';
}

// ==================== TIPOS DE CONFIRMAÇÃO AVANÇADOS ====================

export type ConfirmationTypeAdvanced =
  | 'batch_cobranca'
  | 'batch_confirmacao_reuniao'
  | 'batch_followup'
  | 'gerar_faturas'
  | 'pos_reuniao'
  | 'agendamento_recorrente'
  | 'onboarding_cliente';

// ==================== TIPOS DE RESULTADO DE TOOLS ====================

export interface AdvancedToolResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  requiresConfirmation?: boolean;
  confirmation?: ConfirmationData;
}
