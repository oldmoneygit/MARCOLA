/**
 * @file intelligence-executor.ts
 * @description Executor dos Tools de Inteligência do MARCOLA Assistant
 * @module lib/assistant/tools-advanced
 */

import { createClient } from '@/lib/supabase/server';
import type {
  SugestoesDoDia,
  SugestaoAcao,
  DiagnosticoCliente,
  RelatorioClientesRisco,
  ClienteRisco,
  PrevisaoFaturamento
} from '../types-advanced';

/**
 * Converte uma data para string no formato YYYY-MM-DD
 */
function toDateString(date: Date): string {
  return date.toISOString().split('T')[0] as string;
}

export class IntelligenceExecutor {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // ==================== SUGERIR AÇÕES DO DIA ====================

  async sugerirAcoesDia(params: {
    limite?: number;
    incluirFinanceiro?: boolean;
    incluirOperacional?: boolean;
    incluirRelacionamento?: boolean;
  }): Promise<SugestoesDoDia> {
    const supabase = await createClient();
    const hoje = new Date();
    const hojeStr = toDateString(hoje);
    const diaSemana = hoje.toLocaleDateString('pt-BR', { weekday: 'long' });

    const sugestoes: SugestaoAcao[] = [];
    let prioridadeBase = 10;

    // Saudação por hora
    const hora = hoje.getHours();
    let saudacao = 'Bom dia! ☀️';
    if (hora >= 12 && hora < 18) {saudacao = 'Boa tarde! 🌤️';}
    else if (hora >= 18) {saudacao = 'Boa noite! 🌙';}

    // 1. Pagamentos vencidos (URGENTE)
    if (params.incluirFinanceiro !== false) {
      const { data: vencidos } = await supabase
        .from('payments')
        .select(`
          id, amount, due_date,
          client:clients!client_id(id, name, contact_phone)
        `)
        .eq('user_id', this.userId)
        .eq('status', 'pending')
        .lt('due_date', hojeStr)
        .order('due_date');

      if (vencidos && vencidos.length > 0) {
        const valorTotal = vencidos.reduce((sum, p) => sum + Number(p.amount), 0);

        sugestoes.push({
          id: 'cobrar_vencidos',
          prioridade: prioridadeBase,
          tipo: 'urgente',
          categoria: 'pagamento',
          icone: '💰',
          titulo: `Cobrar ${vencidos.length} pagamento(s) vencido(s)`,
          descricao: `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em atraso`,
          acao: {
            tool: 'cobrar_todos_vencidos',
            parameters: {},
            label: 'Cobrar todos'
          },
          valor: valorTotal
        });
        prioridadeBase--;

        // Adicionar clientes individuais com maior atraso
        const maioresAtrasos = vencidos.slice(0, 3);
        for (const pagamento of maioresAtrasos) {
          const diasAtraso = Math.floor(
            (hoje.getTime() - new Date(pagamento.due_date).getTime()) / (1000 * 60 * 60 * 24)
          );
          const clientData = pagamento.client;
          const client = Array.isArray(clientData) ? clientData[0] : clientData;

          if (diasAtraso > 7 && client) {
            sugestoes.push({
              id: `cobrar_${pagamento.id}`,
              prioridade: prioridadeBase,
              tipo: 'urgente',
              categoria: 'pagamento',
              icone: '⚠️',
              titulo: `Cobrar ${client.name}`,
              descricao: `R$ ${Number(pagamento.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${diasAtraso} dias de atraso`,
              clientId: client.id,
              clientName: client.name,
              acao: {
                tool: 'enviar_whatsapp',
                parameters: {
                  clientId: client.id,
                  tipo: 'cobranca'
                },
                label: 'Enviar cobrança'
              },
              valor: Number(pagamento.amount),
              diasAtraso
            });
            prioridadeBase--;
          }
        }
      }
    }

    // 2. Reuniões de hoje
    const { data: reunioes } = await supabase
      .from('meetings')
      .select(`
        id, time, type, notes,
        client:clients!client_id(id, name)
      `)
      .eq('user_id', this.userId)
      .eq('date', hojeStr)
      .eq('status', 'scheduled')
      .order('time');

    if (reunioes && reunioes.length > 0) {
      for (const reuniao of reunioes) {
        const clientData = reuniao.client;
        const client = Array.isArray(clientData) ? clientData[0] : clientData;

        sugestoes.push({
          id: `preparar_reuniao_${reuniao.id}`,
          prioridade: prioridadeBase,
          tipo: 'importante',
          categoria: 'reuniao',
          icone: '📅',
          titulo: `Preparar reunião ${reuniao.time} - ${client?.name || 'Cliente'}`,
          descricao: `${reuniao.type || 'online'} às ${reuniao.time}`,
          clientId: client?.id,
          clientName: client?.name,
          acao: {
            tool: 'preparar_reuniao',
            parameters: { meetingId: reuniao.id },
            label: 'Ver briefing'
          }
        });
        prioridadeBase--;
      }
    }

    // 3. Tarefas urgentes/atrasadas
    if (params.incluirOperacional !== false) {
      const { data: tarefas } = await supabase
        .from('tasks')
        .select(`
          id, title, due_date, priority,
          client:clients!client_id(id, name)
        `)
        .eq('user_id', this.userId)
        .in('status', ['todo', 'doing'])
        .or(`due_date.lte.${hojeStr},priority.eq.urgent`)
        .order('priority', { ascending: false })
        .order('due_date')
        .limit(5);

      if (tarefas && tarefas.length > 0) {
        for (const tarefa of tarefas) {
          const atrasada = tarefa.due_date && new Date(tarefa.due_date) < hoje;
          const clientData = tarefa.client;
          const client = Array.isArray(clientData) ? clientData[0] : clientData;

          sugestoes.push({
            id: `tarefa_${tarefa.id}`,
            prioridade: prioridadeBase,
            tipo: atrasada || tarefa.priority === 'urgent' ? 'urgente' : 'importante',
            categoria: 'tarefa',
            icone: atrasada ? '🔴' : '📝',
            titulo: tarefa.title,
            descricao: client?.name
              ? `${client.name}${atrasada ? ' - ATRASADA' : ''}`
              : atrasada ? 'ATRASADA' : 'Pendente',
            clientId: client?.id,
            clientName: client?.name,
            acao: {
              tool: 'concluir_tarefa',
              parameters: { taskId: tarefa.id },
              label: 'Concluir'
            }
          });
          prioridadeBase--;
        }
      }
    }

    // 4. Confirmar reuniões de amanhã
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = toDateString(amanha);

    const { data: reunioesAmanha } = await supabase
      .from('meetings')
      .select('id')
      .eq('user_id', this.userId)
      .eq('date', amanhaStr)
      .eq('status', 'scheduled');

    if (reunioesAmanha && reunioesAmanha.length > 0) {
      sugestoes.push({
        id: 'confirmar_amanha',
        prioridade: prioridadeBase,
        tipo: 'importante',
        categoria: 'reuniao',
        icone: '📞',
        titulo: `Confirmar ${reunioesAmanha.length} reunião(ões) de amanhã`,
        descricao: 'Enviar confirmação via WhatsApp',
        acao: {
          tool: 'confirmar_reunioes_amanha',
          parameters: {},
          label: 'Confirmar todas'
        }
      });
      prioridadeBase--;
    }

    // 5. Clientes sem contato recente
    if (params.incluirRelacionamento !== false) {
      const diasAtras = new Date(hoje);
      diasAtras.setDate(diasAtras.getDate() - 14);

      const { data: clientesSemContato } = await supabase
        .from('clients')
        .select('id, name, last_contact')
        .eq('user_id', this.userId)
        .eq('status', 'active')
        .or(`last_contact.is.null,last_contact.lt.${toDateString(diasAtras)}`)
        .limit(3);

      if (clientesSemContato && clientesSemContato.length > 0) {
        sugestoes.push({
          id: 'followup_lote',
          prioridade: prioridadeBase,
          tipo: 'normal',
          categoria: 'cliente',
          icone: '👋',
          titulo: `Follow-up com ${clientesSemContato.length} cliente(s)`,
          descricao: 'Clientes sem contato há mais de 14 dias',
          acao: {
            tool: 'enviar_followup_lote',
            parameters: { diasMinimo: 14 },
            label: 'Enviar follow-up'
          }
        });
      }
    }

    // Ordenar por prioridade
    sugestoes.sort((a, b) => b.prioridade - a.prioridade);

    // Limitar quantidade
    const limite = params.limite || 10;
    const sugestoesFinal = sugestoes.slice(0, limite);

    // Métricas
    const { data: pagamentosVencemHoje } = await supabase
      .from('payments')
      .select('amount')
      .eq('user_id', this.userId)
      .eq('status', 'pending')
      .eq('due_date', hojeStr);

    const { count: tarefasPendentes } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .in('status', ['todo', 'doing']);

    const { count: tarefasUrgentes } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .in('status', ['todo', 'doing'])
      .or(`priority.eq.urgent,due_date.lt.${hojeStr}`);

    const { data: vencidosTotal } = await supabase
      .from('payments')
      .select('amount')
      .eq('user_id', this.userId)
      .eq('status', 'pending')
      .lt('due_date', hojeStr);

    const valorVencido = vencidosTotal?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // Resumo
    const resumoExecutivo = `${saudacao} Hoje é ${diaSemana}. ` +
      (reunioes?.length ? `Você tem ${reunioes.length} reunião(ões). ` : '') +
      (tarefasUrgentes ? `${tarefasUrgentes} tarefa(s) urgente(s). ` : '') +
      (vencidosTotal?.length ? `${vencidosTotal.length} pagamento(s) vencido(s) (R$ ${valorVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). ` : '') +
      `${sugestoesFinal.length} ações sugeridas para hoje.`;

    return {
      data: hojeStr,
      diaSemana,
      saudacao,
      metricas: {
        reunioesHoje: reunioes?.length || 0,
        tarefasPendentes: tarefasPendentes || 0,
        tarefasUrgentes: tarefasUrgentes || 0,
        pagamentosVencemHoje: pagamentosVencemHoje?.length || 0,
        pagamentosVencidos: vencidosTotal?.length || 0,
        valorVencido,
        clientesSemContato: 0
      },
      sugestoes: sugestoesFinal,
      totalSugestoes: sugestoesFinal.length,
      resumoExecutivo
    };
  }

  // ==================== DIAGNOSTICAR CLIENTE ====================

  async diagnosticarCliente(params: {
    clientId?: string;
    query?: string;
    incluirPerformance?: boolean;
    incluirHistorico?: boolean;
  }): Promise<DiagnosticoCliente> {
    const supabase = await createClient();
    const hoje = new Date();
    const hojeStr = toDateString(hoje);

    let clientId = params.clientId;

    // Buscar cliente pelo nome se necessário
    if (!clientId && params.query) {
      const { data: clientes } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', this.userId)
        .ilike('name', `%${params.query}%`)
        .limit(1);

      const primeiroCliente = clientes?.[0];
      if (!primeiroCliente) {
        throw new Error(`Cliente "${params.query}" não encontrado.`);
      }
      clientId = primeiroCliente.id;
    }

    if (!clientId) {
      throw new Error('Informe o cliente para diagnóstico.');
    }

    // Buscar dados completos do cliente
    const { data: cliente, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', this.userId)
      .single();

    if (error || !cliente) {
      throw new Error('Cliente não encontrado.');
    }

    // 1. Análise Financeira
    const { data: pagamentos } = await supabase
      .from('payments')
      .select('*')
      .eq('client_id', clientId)
      .order('due_date', { ascending: false });

    const pagamentosEmDia = pagamentos?.filter(p => p.status === 'paid').length || 0;
    const pagamentosPendentes = pagamentos?.filter(p => p.status === 'pending') || [];
    const valorPendente = pagamentosPendentes.reduce((sum, p) => sum + Number(p.amount), 0);

    const pagamentosAtrasados = pagamentosPendentes.filter(
      p => new Date(p.due_date) < hoje
    );
    const diasMaiorAtraso = pagamentosAtrasados.length > 0
      ? Math.max(...pagamentosAtrasados.map(p =>
        Math.floor((hoje.getTime() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24))
      ))
      : 0;

    let statusFinanceiro: 'em_dia' | 'pendente' | 'atrasado' | 'critico' = 'em_dia';
    if (diasMaiorAtraso > 30) {statusFinanceiro = 'critico';}
    else if (diasMaiorAtraso > 0) {statusFinanceiro = 'atrasado';}
    else if (pagamentosPendentes.length > 0) {statusFinanceiro = 'pendente';}

    const totalPagamentos = pagamentos?.length || 1;
    const historicoAdimplencia = Math.round((pagamentosEmDia / totalPagamentos) * 100);

    // 2. Análise de Engajamento
    const { data: reunioes30Dias } = await supabase
      .from('meetings')
      .select('id, date, status')
      .eq('client_id', clientId)
      .gte('date', toDateString(new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)));

    const { data: reunioes90Dias } = await supabase
      .from('meetings')
      .select('id')
      .eq('client_id', clientId)
      .gte('date', toDateString(new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000)));

    const ultimoContato = cliente.last_contact || 'Nunca registrado';
    const diasSemContato = cliente.last_contact
      ? Math.floor((hoje.getTime() - new Date(cliente.last_contact).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    let statusEngajamento: 'ativo' | 'moderado' | 'baixo' | 'inativo' = 'ativo';
    if (diasSemContato > 30) {statusEngajamento = 'inativo';}
    else if (diasSemContato > 14) {statusEngajamento = 'baixo';}
    else if (diasSemContato > 7) {statusEngajamento = 'moderado';}

    // 3. Análise de Tarefas
    const { data: tarefas } = await supabase
      .from('tasks')
      .select('id, status, due_date')
      .eq('client_id', clientId);

    const tarefasConcluidas = tarefas?.filter(t => t.status === 'done').length || 0;
    const tarefasPendentes = tarefas?.filter(t => t.status !== 'done').length || 0;
    const tarefasAtrasadas = tarefas?.filter(t =>
      t.status !== 'done' && t.due_date && new Date(t.due_date) < hoje
    ).length || 0;

    const totalTarefas = tarefas?.length || 1;
    const taxaConclusao = Math.round((tarefasConcluidas / totalTarefas) * 100);

    // 4. Calcular Health Score
    let healthScore = 100;

    // Financeiro (peso 40)
    if (statusFinanceiro === 'critico') {healthScore -= 40;}
    else if (statusFinanceiro === 'atrasado') {healthScore -= 25;}
    else if (statusFinanceiro === 'pendente') {healthScore -= 10;}

    // Engajamento (peso 30)
    if (statusEngajamento === 'inativo') {healthScore -= 30;}
    else if (statusEngajamento === 'baixo') {healthScore -= 20;}
    else if (statusEngajamento === 'moderado') {healthScore -= 10;}

    // Operacional (peso 20)
    if (tarefasAtrasadas > 5) {healthScore -= 20;}
    else if (tarefasAtrasadas > 2) {healthScore -= 10;}
    else if (tarefasAtrasadas > 0) {healthScore -= 5;}

    // Performance (peso 10) - simplificado
    if (taxaConclusao < 50) {healthScore -= 10;}
    else if (taxaConclusao < 70) {healthScore -= 5;}

    healthScore = Math.max(0, Math.min(100, healthScore));

    let statusGeral: 'saudavel' | 'atencao' | 'critico' = 'saudavel';
    if (healthScore < 50) {statusGeral = 'critico';}
    else if (healthScore < 70) {statusGeral = 'atencao';}

    // 5. Recomendações
    const recomendacoes: DiagnosticoCliente['recomendacoes'] = [];

    if (diasMaiorAtraso > 0) {
      recomendacoes.push({
        prioridade: diasMaiorAtraso > 30 ? 'alta' : 'media',
        categoria: 'Financeiro',
        acao: 'Enviar cobrança',
        motivo: `Pagamento com ${diasMaiorAtraso} dias de atraso`,
        impacto: `Recuperar R$ ${valorPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        tool: 'enviar_whatsapp',
        toolParams: { clientId, tipo: 'cobranca' }
      });
    }

    if (diasSemContato > 14) {
      recomendacoes.push({
        prioridade: diasSemContato > 30 ? 'alta' : 'media',
        categoria: 'Relacionamento',
        acao: 'Fazer follow-up',
        motivo: `${diasSemContato} dias sem contato`,
        impacto: 'Melhorar engajamento e satisfação',
        tool: 'enviar_whatsapp',
        toolParams: { clientId, tipo: 'followup' }
      });
    }

    if (tarefasAtrasadas > 0) {
      recomendacoes.push({
        prioridade: tarefasAtrasadas > 3 ? 'alta' : 'media',
        categoria: 'Operacional',
        acao: 'Resolver tarefas atrasadas',
        motivo: `${tarefasAtrasadas} tarefa(s) em atraso`,
        impacto: 'Melhorar qualidade do serviço',
        tool: 'listar_tarefas',
        toolParams: { clientId, status: 'pending' }
      });
    }

    // 6. Histórico recente
    const historicoRecente: DiagnosticoCliente['historicoRecente'] = [];

    // Adicionar últimas reuniões
    const { data: ultimasReunioes } = await supabase
      .from('meetings')
      .select('date, status')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .limit(3);

    if (ultimasReunioes) {
      for (const r of ultimasReunioes) {
        historicoRecente.push({
          data: r.date,
          tipo: 'reuniao',
          descricao: `Reunião ${r.status === 'completed' ? 'realizada' : r.status === 'cancelled' ? 'cancelada' : 'agendada'}`,
          status: r.status === 'completed' ? 'positivo' : r.status === 'cancelled' ? 'negativo' : 'neutro'
        });
      }
    }

    // Adicionar últimos pagamentos
    const { data: ultimosPagamentos } = await supabase
      .from('payments')
      .select('due_date, status, amount')
      .eq('client_id', clientId)
      .order('due_date', { ascending: false })
      .limit(3);

    if (ultimosPagamentos) {
      for (const p of ultimosPagamentos) {
        historicoRecente.push({
          data: p.due_date,
          tipo: 'pagamento',
          descricao: `Pagamento R$ ${Number(p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${p.status === 'paid' ? 'Pago' : 'Pendente'}`,
          status: p.status === 'paid' ? 'positivo' : 'negativo'
        });
      }
    }

    // Ordenar histórico por data
    historicoRecente.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    // 7. Pontos fortes e fracos
    const pontosFortes: string[] = [];
    const pontosFracos: string[] = [];

    if (historicoAdimplencia >= 80) {pontosFortes.push('Bom histórico de pagamentos');}
    else if (historicoAdimplencia < 50) {pontosFracos.push('Histórico de inadimplência');}

    if (diasSemContato < 7) {pontosFortes.push('Comunicação frequente');}
    else if (diasSemContato > 30) {pontosFracos.push('Falta de comunicação');}

    if (taxaConclusao >= 80) {pontosFortes.push('Tarefas em dia');}
    else if (taxaConclusao < 50) {pontosFracos.push('Muitas tarefas pendentes');}

    if ((reunioes30Dias?.length || 0) >= 2) {pontosFortes.push('Reuniões regulares');}
    else if ((reunioes90Dias?.length || 0) === 0) {pontosFracos.push('Poucas reuniões');}

    // 8. Resumo executivo
    const tempoCliente = cliente.created_at
      ? Math.floor((hoje.getTime() - new Date(cliente.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 0;

    const resumoExecutivo = `${cliente.name} (${cliente.segment || 'Não definido'}) - ` +
      `Cliente há ${tempoCliente} mês(es). ` +
      `Health Score: ${healthScore}/100 (${statusGeral}). ` +
      (statusFinanceiro !== 'em_dia' ? `Atenção financeira: ${valorPendente > 0 ? `R$ ${valorPendente.toLocaleString('pt-BR')} pendente` : ''}. ` : '') +
      `${recomendacoes.length} ação(ões) recomendada(s).`;

    return {
      clientId: cliente.id,
      clientName: cliente.name,
      segment: cliente.segment || 'Não definido',
      dataAnalise: hojeStr,
      healthScore,
      statusGeral,
      financeiro: {
        status: statusFinanceiro,
        valorContrato: Number(cliente.monthly_value) || 0,
        pagamentosEmDia,
        pagamentosPendentes: pagamentosPendentes.length,
        valorPendente,
        diasMaiorAtraso,
        historicoAdimplencia
      },
      engajamento: {
        status: statusEngajamento,
        ultimoContato,
        diasSemContato,
        tipoUltimoContato: 'Não especificado',
        reunioesUltimos30Dias: reunioes30Dias?.length || 0,
        reunioesUltimos90Dias: reunioes90Dias?.length || 0,
        frequenciaIdeal: 'Quinzenal'
      },
      tarefas: {
        pendentes: tarefasPendentes,
        concluidas: tarefasConcluidas,
        atrasadas: tarefasAtrasadas,
        taxaConclusao
      },
      performance: {
        temDados: false,
        roas: 0,
        roasAnterior: 0,
        tendencia: 'estavel',
        gastoMes: 0,
        conversoesMes: 0,
        alertas: []
      },
      recomendacoes,
      historicoRecente: params.incluirHistorico !== false ? historicoRecente.slice(0, 5) : [],
      resumoExecutivo,
      pontosFortes,
      pontosFracos
    };
  }

  // ==================== IDENTIFICAR CLIENTES EM RISCO ====================

  async identificarClientesRisco(params: {
    nivelMinimo?: 'critico' | 'alto' | 'medio';
    limite?: number;
    incluirIndicadores?: boolean;
  }): Promise<RelatorioClientesRisco> {
    const supabase = await createClient();
    const hoje = new Date();
    const hojeStr = toDateString(hoje);

    // Buscar todos clientes ativos
    const { data: clientes } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', this.userId)
      .eq('status', 'active');

    if (!clientes || clientes.length === 0) {
      return {
        dataAnalise: hojeStr,
        totalAnalisados: 0,
        totalEmRisco: 0,
        valorTotalEmRisco: 0,
        distribuicao: { critico: 0, alto: 0, medio: 0, saudavel: 0 },
        clientesEmRisco: [],
        acoesPrioritarias: [],
        resumoExecutivo: 'Nenhum cliente ativo encontrado para análise.'
      };
    }

    const clientesEmRisco: ClienteRisco[] = [];
    const distribuicao = { critico: 0, alto: 0, medio: 0, saudavel: 0 };

    for (const cliente of clientes) {
      // Buscar pagamentos
      const { data: pagamentos } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', cliente.id)
        .eq('status', 'pending')
        .lt('due_date', hojeStr);

      const valorAtrasado = pagamentos?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const diasAtraso = pagamentos && pagamentos.length > 0
        ? Math.max(...pagamentos.map(p =>
          Math.floor((hoje.getTime() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24))
        ))
        : 0;

      // Buscar engajamento
      const diasSemContato = cliente.last_contact
        ? Math.floor((hoje.getTime() - new Date(cliente.last_contact).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Buscar tarefas atrasadas
      const { data: tarefasAtrasadas } = await supabase
        .from('tasks')
        .select('id')
        .eq('client_id', cliente.id)
        .in('status', ['todo', 'doing'])
        .lt('due_date', hojeStr);

      // Calcular score de risco (0-100, quanto maior pior)
      let scoreRisco = 0;
      const motivos: string[] = [];

      // Risco financeiro
      const riscoFinanceiro = diasAtraso > 0;
      if (diasAtraso > 30) {
        scoreRisco += 40;
        motivos.push(`Pagamento ${diasAtraso} dias atrasado`);
      } else if (diasAtraso > 15) {
        scoreRisco += 25;
        motivos.push(`Pagamento ${diasAtraso} dias atrasado`);
      } else if (diasAtraso > 0) {
        scoreRisco += 15;
        motivos.push(`Pagamento em atraso`);
      }

      // Risco de engajamento
      const riscoEngajamento = diasSemContato > 14;
      if (diasSemContato > 30) {
        scoreRisco += 30;
        motivos.push(`Sem contato há ${diasSemContato} dias`);
      } else if (diasSemContato > 14) {
        scoreRisco += 15;
        motivos.push(`Pouco contato recente`);
      }

      // Risco operacional
      const tarefasAtrasadasCount = tarefasAtrasadas?.length || 0;
      const riscoOperacional = tarefasAtrasadasCount > 2;
      if (tarefasAtrasadasCount > 5) {
        scoreRisco += 20;
        motivos.push(`${tarefasAtrasadasCount} tarefas atrasadas`);
      } else if (tarefasAtrasadasCount > 2) {
        scoreRisco += 10;
        motivos.push(`Tarefas pendentes acumuladas`);
      }

      // Classificar nível de risco
      let nivelRisco: 'critico' | 'alto' | 'medio' | null = null;
      if (scoreRisco >= 60) {
        nivelRisco = 'critico';
        distribuicao.critico++;
      } else if (scoreRisco >= 40) {
        nivelRisco = 'alto';
        distribuicao.alto++;
      } else if (scoreRisco >= 20) {
        nivelRisco = 'medio';
        distribuicao.medio++;
      } else {
        distribuicao.saudavel++;
      }

      // Filtrar pelo nível mínimo
      const nivelMinimo = params.nivelMinimo || 'medio';
      const niveisValidos = {
        critico: ['critico'],
        alto: ['critico', 'alto'],
        medio: ['critico', 'alto', 'medio']
      };

      if (nivelRisco && niveisValidos[nivelMinimo].includes(nivelRisco)) {
        // Determinar ação prioritária
        let acaoPrioritaria: ClienteRisco['acaoPrioritaria'] = {
          descricao: 'Entrar em contato',
          urgencia: 'esta_semana'
        };

        if (diasAtraso > 30) {
          acaoPrioritaria = {
            descricao: 'Cobrar pagamento urgentemente',
            urgencia: 'imediata',
            tool: 'enviar_whatsapp',
            toolParams: { clientId: cliente.id, tipo: 'cobranca' }
          };
        } else if (diasSemContato > 30) {
          acaoPrioritaria = {
            descricao: 'Reativar relacionamento',
            urgencia: 'hoje',
            tool: 'enviar_whatsapp',
            toolParams: { clientId: cliente.id, tipo: 'followup' }
          };
        } else if (diasAtraso > 0) {
          acaoPrioritaria = {
            descricao: 'Enviar lembrete de pagamento',
            urgencia: 'hoje',
            tool: 'enviar_whatsapp',
            toolParams: { clientId: cliente.id, tipo: 'lembrete_pagamento' }
          };
        }

        const tempoCliente = cliente.created_at
          ? `${Math.floor((hoje.getTime() - new Date(cliente.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))} meses`
          : 'Não definido';

        clientesEmRisco.push({
          clientId: cliente.id,
          clientName: cliente.name,
          segment: cliente.segment || 'Não definido',
          nivelRisco,
          scoreRisco,
          motivos,
          indicadores: {
            financeiro: {
              emRisco: riscoFinanceiro,
              pagamentoAtrasado: diasAtraso > 0,
              diasAtraso,
              valorAtrasado
            },
            engajamento: {
              emRisco: riscoEngajamento,
              diasSemContato,
              reunioesCanceladas: 0,
              tendenciaContato: diasSemContato > 14 ? 'diminuindo' : 'estavel'
            },
            performance: {
              emRisco: false,
              roasBaixo: false,
              roasAtual: 0,
              quedaPerformance: false
            },
            operacional: {
              emRisco: riscoOperacional,
              tarefasAtrasadas: tarefasAtrasadasCount,
              reclamacoes: 0
            }
          },
          acaoPrioritaria,
          valorContrato: Number(cliente.monthly_value) || 0,
          tempoComoCliente: tempoCliente
        });
      }
    }

    // Ordenar por score de risco
    clientesEmRisco.sort((a, b) => b.scoreRisco - a.scoreRisco);

    // Limitar
    const limite = params.limite || 10;
    const clientesLimitados = clientesEmRisco.slice(0, limite);

    // Calcular valor total em risco
    const valorTotalEmRisco = clientesEmRisco.reduce((sum, c) => sum + c.valorContrato, 0);

    // Ações prioritárias
    const acoesPrioritarias = clientesLimitados.slice(0, 5).map(c => ({
      clientName: c.clientName,
      acao: c.acaoPrioritaria.descricao,
      impacto: `R$ ${c.valorContrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`
    }));

    // Resumo executivo
    const resumoExecutivo = `Análise de ${clientes.length} clientes ativos. ` +
      `${clientesEmRisco.length} em risco (${distribuicao.critico} crítico, ${distribuicao.alto} alto, ${distribuicao.medio} médio). ` +
      `Valor mensal em risco: R$ ${valorTotalEmRisco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. ` +
      `${distribuicao.saudavel} cliente(s) saudável(is).`;

    return {
      dataAnalise: hojeStr,
      totalAnalisados: clientes.length,
      totalEmRisco: clientesEmRisco.length,
      valorTotalEmRisco,
      distribuicao,
      clientesEmRisco: clientesLimitados,
      acoesPrioritarias,
      resumoExecutivo
    };
  }

  // ==================== PREVER FATURAMENTO ====================

  async preverFaturamento(params: {
    mes?: string;
    incluirDetalhamento?: boolean;
    incluirComparativo?: boolean;
  }): Promise<PrevisaoFaturamento> {
    const supabase = await createClient();
    const hoje = new Date();
    const hojeStr = toDateString(hoje);

    // Determinar mês
    const mes = params.mes || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    const partesMes = mes.split('-').map(Number);
    const ano = partesMes[0] ?? hoje.getFullYear();
    const mesNum = partesMes[1] ?? (hoje.getMonth() + 1);
    const primeiroDia = `${mes}-01`;
    const ultimoDia = `${mes}-${new Date(ano, mesNum, 0).getDate()}`;

    const mesLabel = new Date(ano, mesNum - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Buscar pagamentos do mês
    const { data: pagamentos } = await supabase
      .from('payments')
      .select(`
        id, amount, due_date, status, paid_at,
        client:clients!client_id(id, name)
      `)
      .eq('user_id', this.userId)
      .gte('due_date', primeiroDia)
      .lte('due_date', ultimoDia)
      .order('due_date');

    if (!pagamentos || pagamentos.length === 0) {
      return {
        mes,
        mesLabel,
        dataAnalise: hojeStr,
        previsaoTotal: 0,
        recebidoAteAgora: 0,
        aReceber: 0,
        vencidoNaoRecebido: 0,
        previsaoOtimista: 0,
        previsaoPessimista: 0,
        previsaoRealista: 0,
        detalhamento: [],
        comparativoMesAnterior: {
          mesAnterior: '',
          valorMesAnterior: 0,
          variacao: 0,
          tendencia: 'estavel'
        },
        porStatus: {
          recebido: { quantidade: 0, valor: 0 },
          aVencer: { quantidade: 0, valor: 0 },
          vencido: { quantidade: 0, valor: 0 }
        },
        resumoExecutivo: `Nenhum pagamento encontrado para ${mesLabel}.`,
        alertas: []
      };
    }

    // Processar pagamentos
    const porStatus = {
      recebido: { quantidade: 0, valor: 0 },
      aVencer: { quantidade: 0, valor: 0 },
      vencido: { quantidade: 0, valor: 0 }
    };

    const detalhamento: PrevisaoFaturamento['detalhamento'] = [];

    for (const pagamento of pagamentos) {
      const valor = Number(pagamento.amount);
      const vencimento = new Date(pagamento.due_date);
      const clientData = pagamento.client;
      const client = Array.isArray(clientData) ? clientData[0] : clientData;

      let status: 'recebido' | 'a_vencer' | 'vence_hoje' | 'vencido' = 'a_vencer';
      let probabilidade = 90;
      let diasAtraso: number | undefined;

      if (pagamento.status === 'paid') {
        status = 'recebido';
        probabilidade = 100;
        porStatus.recebido.quantidade++;
        porStatus.recebido.valor += valor;
      } else if (vencimento < hoje) {
        status = 'vencido';
        diasAtraso = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
        probabilidade = diasAtraso > 30 ? 30 : diasAtraso > 15 ? 50 : 70;
        porStatus.vencido.quantidade++;
        porStatus.vencido.valor += valor;
      } else if (toDateString(vencimento) === hojeStr) {
        status = 'vence_hoje';
        probabilidade = 85;
        porStatus.aVencer.quantidade++;
        porStatus.aVencer.valor += valor;
      } else {
        porStatus.aVencer.quantidade++;
        porStatus.aVencer.valor += valor;
      }

      detalhamento.push({
        clientId: client?.id || '',
        clientName: client?.name || 'Cliente',
        valor,
        status,
        dataVencimento: pagamento.due_date,
        probabilidadeRecebimento: probabilidade,
        diasAtraso
      });
    }

    // Calcular totais
    const previsaoTotal = pagamentos.reduce((sum, p) => sum + Number(p.amount), 0);
    const recebidoAteAgora = porStatus.recebido.valor;
    const aReceber = porStatus.aVencer.valor;
    const vencidoNaoRecebido = porStatus.vencido.valor;

    // Cenários
    const previsaoOtimista = previsaoTotal;
    const previsaoPessimista = recebidoAteAgora + (aReceber * 0.7) + (vencidoNaoRecebido * 0.3);
    const previsaoRealista = recebidoAteAgora + (aReceber * 0.85) + (vencidoNaoRecebido * 0.5);

    // Comparativo com mês anterior
    let comparativo: PrevisaoFaturamento['comparativoMesAnterior'] = {
      mesAnterior: '',
      valorMesAnterior: 0,
      variacao: 0,
      tendencia: 'estavel'
    };

    if (params.incluirComparativo !== false) {
      const mesAnterior = new Date(ano, mesNum - 2);
      const mesAnteriorStr = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`;
      const primeiroDiaAnterior = `${mesAnteriorStr}-01`;
      const ultimoDiaAnterior = `${mesAnteriorStr}-${new Date(mesAnterior.getFullYear(), mesAnterior.getMonth() + 1, 0).getDate()}`;

      const { data: pagamentosAnterior } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('user_id', this.userId)
        .gte('due_date', primeiroDiaAnterior)
        .lte('due_date', ultimoDiaAnterior);

      const valorMesAnterior = pagamentosAnterior?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const variacao = valorMesAnterior > 0
        ? Math.round(((previsaoRealista - valorMesAnterior) / valorMesAnterior) * 100)
        : 0;

      comparativo = {
        mesAnterior: mesAnterior.toLocaleDateString('pt-BR', { month: 'long' }),
        valorMesAnterior,
        variacao,
        tendencia: variacao > 5 ? 'crescimento' : variacao < -5 ? 'queda' : 'estavel'
      };
    }

    // Alertas
    const alertas: string[] = [];

    if (porStatus.vencido.quantidade > 0) {
      alertas.push(`${porStatus.vencido.quantidade} pagamento(s) vencido(s) não recebido(s) - R$ ${vencidoNaoRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }

    const taxaRecebimento = previsaoTotal > 0 ? Math.round((recebidoAteAgora / previsaoTotal) * 100) : 0;
    const diasPassados = hoje.getDate();
    const diasMes = new Date(ano, mesNum, 0).getDate();
    const percentualMes = Math.round((diasPassados / diasMes) * 100);

    if (taxaRecebimento < percentualMes - 20) {
      alertas.push(`Recebimentos abaixo do esperado: ${taxaRecebimento}% recebido com ${percentualMes}% do mês`);
    }

    // Resumo
    const resumoExecutivo = `Faturamento ${mesLabel}: ` +
      `Previsto R$ ${previsaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. ` +
      `Recebido R$ ${recebidoAteAgora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${taxaRecebimento}%). ` +
      `A receber R$ ${aReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. ` +
      (vencidoNaoRecebido > 0 ? `Vencido R$ ${vencidoNaoRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. ` : '') +
      `Previsão realista: R$ ${previsaoRealista.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;

    return {
      mes,
      mesLabel,
      dataAnalise: hojeStr,
      previsaoTotal,
      recebidoAteAgora,
      aReceber,
      vencidoNaoRecebido,
      previsaoOtimista,
      previsaoPessimista,
      previsaoRealista,
      detalhamento: params.incluirDetalhamento !== false ? detalhamento : [],
      comparativoMesAnterior: comparativo,
      porStatus,
      resumoExecutivo,
      alertas
    };
  }
}

export default IntelligenceExecutor;
