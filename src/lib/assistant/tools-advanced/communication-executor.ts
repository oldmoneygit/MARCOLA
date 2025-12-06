/**
 * @file communication-executor.ts
 * @description Executor dos Tools de Comunicação do MARCOLA Assistant
 * @module lib/assistant/tools-advanced
 */

import { createClient } from '@/lib/supabase/server';
import type { ConfirmationData } from '../types';
import type {
  BriefingReuniao,
  RegistroPosReuniao,
  AgendamentoRecorrente,
  RelatorioCliente
} from '../types-advanced';

/**
 * Converte uma data para string no formato YYYY-MM-DD
 */
function toDateString(date: Date): string {
  return date.toISOString().split('T')[0] as string;
}

export class CommunicationExecutor {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // ==================== PREPARAR REUNIÃO ====================

  async prepararReuniao(params: {
    meetingId?: string;
    clientId?: string;
    query?: string;
  }): Promise<BriefingReuniao> {
    const supabase = await createClient();
    const hoje = new Date();
    const hojeStr = toDateString(hoje);

    let meetingId = params.meetingId;
    let clientId = params.clientId;

    // Buscar por nome do cliente se necessário
    if (!meetingId && !clientId && params.query) {
      const { data: clientes } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', this.userId)
        .ilike('name', `%${params.query}%`)
        .limit(1);

      const primeiroCliente = clientes?.[0];
      if (primeiroCliente) {
        clientId = primeiroCliente.id;
      }
    }

    // Buscar próxima reunião do cliente se não tiver meetingId
    if (!meetingId && clientId) {
      const { data: reunioes } = await supabase
        .from('meetings')
        .select('id')
        .eq('user_id', this.userId)
        .eq('client_id', clientId)
        .gte('date', hojeStr)
        .eq('status', 'scheduled')
        .order('date')
        .order('time')
        .limit(1);

      const primeiraReuniao = reunioes?.[0];
      if (primeiraReuniao) {
        meetingId = primeiraReuniao.id;
      }
    }

    if (!meetingId) {
      throw new Error('Reunião não encontrada. Informe o cliente ou ID da reunião.');
    }

    // Buscar dados da reunião
    const { data: reuniao, error } = await supabase
      .from('meetings')
      .select(`
        id, date, time, type, notes,
        client:clients!client_id(*)
      `)
      .eq('id', meetingId)
      .eq('user_id', this.userId)
      .single();

    if (error || !reuniao) {
      throw new Error('Reunião não encontrada.');
    }

    const clientData = reuniao.client;
    const cliente = Array.isArray(clientData) ? clientData[0] : clientData;

    if (!cliente) {
      throw new Error('Cliente da reunião não encontrado.');
    }

    // Calcular tempo como cliente
    const dataCliente = cliente.created_at ? new Date(cliente.created_at) : hoje;
    const mesesComoCliente = Math.floor((hoje.getTime() - dataCliente.getTime()) / (1000 * 60 * 60 * 24 * 30));

    // Buscar pagamentos pendentes
    const { data: pagamentosPendentes } = await supabase
      .from('payments')
      .select('amount, due_date')
      .eq('client_id', cliente.id)
      .eq('status', 'pending')
      .order('due_date');

    const pendencias = pagamentosPendentes?.map(p => {
      const diasAtraso = Math.max(0, Math.floor(
        (hoje.getTime() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24)
      ));
      return {
        valor: Number(p.amount),
        vencimento: p.due_date,
        diasAtraso
      };
    }) || [];

    let statusPagamento: 'em_dia' | 'pendente' | 'atrasado' = 'em_dia';
    if (pendencias.some(p => p.diasAtraso > 0)) {statusPagamento = 'atrasado';}
    else if (pendencias.length > 0) {statusPagamento = 'pendente';}

    // Buscar tarefas
    const { data: tarefas } = await supabase
      .from('tasks')
      .select('id, title, due_date, status')
      .eq('client_id', cliente.id)
      .in('status', ['todo', 'doing'])
      .order('due_date')
      .limit(5);

    const tarefasPendentes = tarefas?.length || 0;
    const tarefasConcluidas = 0; // Simplificado
    const tarefasAtrasadas = tarefas?.filter(t => t.due_date && new Date(t.due_date) < hoje).length || 0;

    const proximasTarefas = tarefas?.slice(0, 3).map(t => ({
      titulo: t.title,
      prazo: t.due_date || 'Sem prazo'
    })) || [];

    // Buscar última reunião
    const { data: ultimaReuniao } = await supabase
      .from('meetings')
      .select('date')
      .eq('client_id', cliente.id)
      .eq('status', 'completed')
      .order('date', { ascending: false })
      .limit(1);

    // Buscar histórico recente
    const historicoRecente: BriefingReuniao['historicoRecente'] = [];

    // Últimas reuniões
    const { data: reunioesRecentes } = await supabase
      .from('meetings')
      .select('date, status')
      .eq('client_id', cliente.id)
      .order('date', { ascending: false })
      .limit(3);

    reunioesRecentes?.forEach(r => {
      historicoRecente.push({
        data: r.date,
        tipo: 'Reunião',
        descricao: r.status === 'completed' ? 'Realizada' : r.status === 'cancelled' ? 'Cancelada' : 'Agendada'
      });
    });

    // Últimos pagamentos
    const { data: pagamentosRecentes } = await supabase
      .from('payments')
      .select('due_date, status, amount')
      .eq('client_id', cliente.id)
      .order('due_date', { ascending: false })
      .limit(3);

    pagamentosRecentes?.forEach(p => {
      historicoRecente.push({
        data: p.due_date,
        tipo: 'Pagamento',
        descricao: `R$ ${Number(p.amount).toLocaleString('pt-BR')} - ${p.status === 'paid' ? 'Pago' : 'Pendente'}`
      });
    });

    // Ordenar histórico
    historicoRecente.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    // Gerar pauta sugerida
    const pautaSugerida: BriefingReuniao['pautaSugerida'] = [];

    pautaSugerida.push({
      topico: 'Abertura e alinhamento',
      prioridade: 'media',
      notas: 'Como está o negócio? Novidades?'
    });

    if (statusPagamento === 'atrasado') {
      pautaSugerida.push({
        topico: 'Situação financeira',
        prioridade: 'alta',
        notas: `Abordar pagamento(s) em atraso - R$ ${pendencias.reduce((sum, p) => sum + p.valor, 0).toLocaleString('pt-BR')}`
      });
    }

    pautaSugerida.push({
      topico: 'Performance das campanhas',
      prioridade: 'alta',
      notas: 'Apresentar resultados e métricas principais'
    });

    if (tarefasAtrasadas > 0) {
      pautaSugerida.push({
        topico: 'Tarefas pendentes',
        prioridade: 'media',
        notas: `${tarefasAtrasadas} tarefa(s) atrasada(s) para resolver`
      });
    }

    pautaSugerida.push({
      topico: 'Próximos passos',
      prioridade: 'media',
      notas: 'Definir ações e responsabilidades'
    });

    // Pontos de atenção
    const pontosAtencao: BriefingReuniao['pontosAtencao'] = [];

    if (statusPagamento === 'atrasado') {
      pontosAtencao.push({
        tipo: 'alerta',
        descricao: `Cliente com pagamento(s) em atraso`
      });
    }

    const diasSemContato = cliente.last_contact
      ? Math.floor((hoje.getTime() - new Date(cliente.last_contact).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (diasSemContato > 30) {
      pontosAtencao.push({
        tipo: 'alerta',
        descricao: `${diasSemContato} dias sem contato registrado`
      });
    }

    if (tarefasAtrasadas > 0) {
      pontosAtencao.push({
        tipo: 'alerta',
        descricao: `${tarefasAtrasadas} tarefa(s) atrasada(s)`
      });
    }

    // Perguntas sugeridas
    const perguntasSugeridas = [
      'Como estão os resultados das campanhas na sua percepção?',
      'Tem alguma novidade no negócio que eu deveria saber?',
      'Quais são as prioridades para o próximo período?',
      'Algum feedback sobre nosso trabalho até aqui?'
    ];

    // Resumo executivo
    const dataReuniaoFormatada = new Date(reuniao.date).toLocaleDateString('pt-BR');
    const resumoExecutivo = `Reunião com ${cliente.name} (${cliente.segment || 'Sem segmento'}) ` +
      `em ${dataReuniaoFormatada} às ${reuniao.time}. ` +
      `Cliente há ${mesesComoCliente} mês(es). ` +
      (statusPagamento !== 'em_dia' ? `Atenção: ${statusPagamento}. ` : '') +
      `${pontosAtencao.length} ponto(s) de atenção.`;

    return {
      meetingId: reuniao.id,
      clientId: cliente.id,
      clientName: cliente.name,
      reuniao: {
        data: reuniao.date,
        dataFormatada: dataReuniaoFormatada,
        horario: reuniao.time,
        tipo: (reuniao.type as 'online' | 'presencial') || 'online',
        notas: reuniao.notes || undefined
      },
      contextoCliente: {
        segment: cliente.segment || 'Não definido',
        tempoComoCliente: `${mesesComoCliente} mês(es)`,
        valorContrato: Number(cliente.monthly_value) || 0,
        ultimaReuniao: ultimaReuniao?.[0]?.date,
        frequenciaReunioes: 'Não definida'
      },
      situacaoAtual: {
        pagamentos: {
          status: statusPagamento,
          pendencias
        },
        tarefas: {
          pendentes: tarefasPendentes,
          concluidas: tarefasConcluidas,
          atrasadas: tarefasAtrasadas,
          proximasPendentes: proximasTarefas
        }
      },
      historicoRecente: historicoRecente.slice(0, 5),
      pautaSugerida,
      pontosAtencao,
      perguntasSugeridas,
      resumoExecutivo
    };
  }

  // ==================== REGISTRAR PÓS-REUNIÃO ====================

  async prepararPosReuniao(params: {
    meetingId?: string;
    clientId?: string;
    query?: string;
    anotacoes?: string;
    decisoes?: string;
    proximosPassos?: string;
    feedbackCliente?: string;
    agendarProxima?: boolean;
  }): Promise<{ confirmation: ConfirmationData }> {
    const supabase = await createClient();
    const hoje = new Date();
    const hojeStr = toDateString(hoje);

    let meetingId = params.meetingId;
    let clientId = params.clientId;

    // Buscar por nome do cliente
    if (!meetingId && !clientId && params.query) {
      const { data: clientes } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', this.userId)
        .ilike('name', `%${params.query}%`)
        .limit(1);

      const primeiroCliente = clientes?.[0];
      if (primeiroCliente) {
        clientId = primeiroCliente.id;
      }
    }

    // Buscar reunião mais recente do cliente
    if (!meetingId && clientId) {
      const { data: reunioes } = await supabase
        .from('meetings')
        .select('id')
        .eq('user_id', this.userId)
        .eq('client_id', clientId)
        .lte('date', hojeStr)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .limit(1);

      const primeiraReuniao = reunioes?.[0];
      if (primeiraReuniao) {
        meetingId = primeiraReuniao.id;
      }
    }

    if (!meetingId) {
      throw new Error('Reunião não encontrada. Informe o cliente ou ID da reunião.');
    }

    // Buscar dados da reunião
    const { data: reuniao } = await supabase
      .from('meetings')
      .select(`
        id, date, time,
        client:clients!client_id(id, name)
      `)
      .eq('id', meetingId)
      .single();

    if (!reuniao) {
      throw new Error('Reunião não encontrada.');
    }

    const clientData = reuniao.client;
    const cliente = Array.isArray(clientData) ? clientData[0] : clientData;

    // Processar próximos passos
    const proximosPassos: RegistroPosReuniao['proximosPassos'] = [];
    if (params.proximosPassos) {
      const passos = params.proximosPassos.split(/[,;\n]/).filter(p => p.trim());
      passos.forEach((passo, index) => {
        proximosPassos.push({
          descricao: passo.trim(),
          responsavel: 'gestor',
          prioridade: index === 0 ? 'alta' : 'media',
          criarTarefa: true
        });
      });
    }

    // Processar decisões
    const decisoes: RegistroPosReuniao['decisoes'] = [];
    if (params.decisoes) {
      const itens = params.decisoes.split(/[,;\n]/).filter(d => d.trim());
      itens.forEach(item => {
        decisoes.push({
          descricao: item.trim(),
          responsavel: 'ambos'
        });
      });
    }

    // Feedback
    let feedbackCliente: RegistroPosReuniao['feedbackCliente'];
    if (params.feedbackCliente) {
      const feedback = params.feedbackCliente.toLowerCase();
      let satisfacao: 'muito_satisfeito' | 'satisfeito' | 'neutro' | 'insatisfeito' = 'neutro';
      if (feedback.includes('muito') || feedback.includes('otimo') || feedback.includes('excelente')) {
        satisfacao = 'muito_satisfeito';
      } else if (feedback.includes('satisfeito') || feedback.includes('bom') || feedback.includes('bem')) {
        satisfacao = 'satisfeito';
      } else if (feedback.includes('insatisfeito') || feedback.includes('ruim') || feedback.includes('problema')) {
        satisfacao = 'insatisfeito';
      }
      feedbackCliente = { satisfacao, comentarios: params.feedbackCliente };
    }

    // Próxima reunião
    let proximaReuniao: RegistroPosReuniao['proximaReuniao'];
    if (params.agendarProxima) {
      const proxima = new Date(hoje);
      proxima.setDate(proxima.getDate() + 14);
      proximaReuniao = {
        agendar: true,
        data: toDateString(proxima),
        horario: reuniao.time,
        pauta: 'Acompanhamento'
      };
    }

    const confirmationData: RegistroPosReuniao = {
      meetingId: reuniao.id,
      clientId: cliente?.id || '',
      clientName: cliente?.name || 'Cliente',
      dataReuniao: reuniao.date,
      anotacoes: params.anotacoes || '',
      decisoes,
      proximosPassos,
      feedbackCliente,
      proximaReuniao,
      resumo: `Registro pós-reunião: ${decisoes.length} decisão(ões), ${proximosPassos.length} próximo(s) passo(s)`
    };

    return {
      confirmation: {
        id: `pos_reuniao_${Date.now()}`,
        type: 'generic',
        status: 'pending',
        data: {
          title: 'Registro Pós-Reunião',
          description: `Registrar reunião com ${cliente?.name || 'Cliente'}`,
          details: confirmationData as unknown as Record<string, unknown>
        },
        toolToExecute: {
          id: `tool_${Date.now()}`,
          name: 'registrar_pos_reuniao',
          parameters: { ...params, _confirmationData: confirmationData }
        },
        createdAt: new Date()
      }
    };
  }

  async executarPosReuniao(data: RegistroPosReuniao): Promise<{
    success: boolean;
    tarefasCriadas: number;
    reuniaoAgendada: boolean;
    summary: string;
  }> {
    const supabase = await createClient();
    let tarefasCriadas = 0;
    let reuniaoAgendada = false;

    // 1. Atualizar status da reunião para completed
    await supabase
      .from('meetings')
      .update({
        status: 'completed',
        notes: data.anotacoes
      })
      .eq('id', data.meetingId);

    // 2. Criar tarefas dos próximos passos
    for (const passo of data.proximosPassos) {
      if (passo.criarTarefa) {
        const prazo = new Date();
        prazo.setDate(prazo.getDate() + (passo.prioridade === 'alta' ? 3 : 7));

        const { error } = await supabase.from('tasks').insert({
          user_id: this.userId,
          client_id: data.clientId,
          title: passo.descricao,
          description: `Definido na reunião de ${new Date(data.dataReuniao).toLocaleDateString('pt-BR')}`,
          due_date: passo.prazo || toDateString(prazo),
          priority: passo.prioridade === 'alta' ? 'high' : 'medium',
          status: 'todo'
        });

        if (!error) {tarefasCriadas++;}
      }
    }

    // 3. Agendar próxima reunião
    if (data.proximaReuniao?.agendar) {
      const { error } = await supabase.from('meetings').insert({
        user_id: this.userId,
        client_id: data.clientId,
        date: data.proximaReuniao.data,
        time: data.proximaReuniao.horario,
        type: 'online',
        status: 'scheduled',
        notes: data.proximaReuniao.pauta
      });

      if (!error) {reuniaoAgendada = true;}
    }

    // 4. Atualizar último contato do cliente
    await supabase
      .from('clients')
      .update({
        last_contact: data.dataReuniao,
        last_contact_type: 'reuniao'
      })
      .eq('id', data.clientId);

    return {
      success: true,
      tarefasCriadas,
      reuniaoAgendada,
      summary: `Reunião com ${data.clientName} registrada. ` +
        `${tarefasCriadas} tarefa(s) criada(s). ` +
        (reuniaoAgendada ? 'Próxima reunião agendada.' : '')
    };
  }

  // ==================== AGENDAR RECORRENTE ====================

  async prepararAgendamentoRecorrente(params: {
    clientId?: string;
    query?: string;
    tipo?: 'reuniao' | 'tarefa' | 'lembrete';
    frequencia?: 'semanal' | 'quinzenal' | 'mensal';
    diaSemana?: string;
    diaDoMes?: number;
    horario?: string;
    titulo?: string;
    quantidadeOcorrencias?: number;
  }): Promise<{ confirmation: ConfirmationData }> {
    const supabase = await createClient();
    const hoje = new Date();

    let clientId = params.clientId;

    // Buscar cliente por nome
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
      throw new Error('Informe o cliente para o agendamento.');
    }

    // Buscar dados do cliente
    const { data: cliente } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .single();

    if (!cliente) {
      throw new Error('Cliente não encontrado.');
    }

    const tipo = params.tipo || 'reuniao';
    const frequencia = params.frequencia || 'quinzenal';
    const quantidade = params.quantidadeOcorrencias || 4;
    const horario = params.horario || '14:00';

    // Mapear dia da semana
    const diasSemanaMap: Record<string, number> = {
      domingo: 0, segunda: 1, terca: 2, quarta: 3,
      quinta: 4, sexta: 5, sabado: 6
    };

    // Calcular próximas ocorrências
    const proximasOcorrencias: AgendamentoRecorrente['proximasOcorrencias'] = [];
    const dataAtual = new Date(hoje);

    // Encontrar próximo dia válido
    if (params.diaSemana) {
      const diaAlvo = diasSemanaMap[params.diaSemana.toLowerCase()];
      while (dataAtual.getDay() !== diaAlvo) {
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
    } else if (params.diaDoMes && frequencia === 'mensal') {
      dataAtual.setDate(params.diaDoMes);
      if (dataAtual < hoje) {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
      }
    } else {
      // Próxima segunda se não especificado
      while (dataAtual.getDay() !== 1) {
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
    }

    // Gerar datas
    for (let i = 0; i < quantidade; i++) {
      proximasOcorrencias.push({
        data: toDateString(dataAtual),
        dataFormatada: dataAtual.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        }),
        horario: tipo === 'reuniao' ? horario : undefined
      });

      // Avançar para próxima ocorrência
      if (frequencia === 'semanal') {
        dataAtual.setDate(dataAtual.getDate() + 7);
      } else if (frequencia === 'quinzenal') {
        dataAtual.setDate(dataAtual.getDate() + 14);
      } else {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
      }
    }

    const resumo = `${quantidade} ${tipo === 'reuniao' ? 'reunião(ões)' : tipo === 'tarefa' ? 'tarefa(s)' : 'lembrete(s)'} ` +
      `${frequencia === 'semanal' ? 'semanais' : frequencia === 'quinzenal' ? 'quinzenais' : 'mensais'} ` +
      `para ${cliente.name}`;

    const confirmationData: AgendamentoRecorrente = {
      clientId: cliente.id,
      clientName: cliente.name,
      tipo,
      frequencia,
      diaSemana: params.diaSemana,
      diaDoMes: params.diaDoMes,
      horario: tipo === 'reuniao' ? horario : undefined,
      detalhes: {
        titulo: params.titulo,
        tipoReuniao: 'online',
        prioridade: 'media'
      },
      dataInicio: proximasOcorrencias[0]?.data || '',
      quantidadeOcorrencias: quantidade,
      proximasOcorrencias,
      resumo
    };

    return {
      confirmation: {
        id: `agendamento_recorrente_${Date.now()}`,
        type: 'generic',
        status: 'pending',
        data: {
          title: 'Agendamento Recorrente',
          description: resumo,
          details: confirmationData as unknown as Record<string, unknown>
        },
        toolToExecute: {
          id: `tool_${Date.now()}`,
          name: 'agendar_recorrente',
          parameters: { ...params, _confirmationData: confirmationData }
        },
        createdAt: new Date()
      }
    };
  }

  async executarAgendamentoRecorrente(data: AgendamentoRecorrente): Promise<{
    success: boolean;
    criados: number;
    summary: string;
  }> {
    const supabase = await createClient();
    let criados = 0;

    for (const ocorrencia of data.proximasOcorrencias) {
      try {
        if (data.tipo === 'reuniao') {
          const { error } = await supabase.from('meetings').insert({
            user_id: this.userId,
            client_id: data.clientId,
            date: ocorrencia.data,
            time: ocorrencia.horario,
            type: data.detalhes.tipoReuniao || 'online',
            status: 'scheduled',
            notes: `Reunião ${data.frequencia}`
          });
          if (!error) {criados++;}
        } else if (data.tipo === 'tarefa') {
          const { error } = await supabase.from('tasks').insert({
            user_id: this.userId,
            client_id: data.clientId,
            title: data.detalhes.titulo || `Tarefa ${data.frequencia}`,
            due_date: ocorrencia.data,
            priority: data.detalhes.prioridade === 'alta' ? 'high' : 'medium',
            status: 'todo'
          });
          if (!error) {criados++;}
        } else if (data.tipo === 'lembrete') {
          const { error } = await supabase.from('reminders').insert({
            user_id: this.userId,
            client_id: data.clientId,
            message: data.detalhes.titulo || `Lembrete ${data.frequencia}`,
            remind_at: `${ocorrencia.data}T09:00:00`,
            status: 'pending'
          });
          if (!error) {criados++;}
        }
      } catch {
        // Continuar com próximas ocorrências
      }
    }

    return {
      success: criados > 0,
      criados,
      summary: `${criados} ${data.tipo === 'reuniao' ? 'reunião(ões)' : data.tipo === 'tarefa' ? 'tarefa(s)' : 'lembrete(s)'} ` +
        `criado(s) para ${data.clientName}`
    };
  }

  // ==================== GERAR RELATÓRIO DO CLIENTE ====================

  async gerarRelatorioCliente(params: {
    clientId?: string;
    query?: string;
    periodo?: '7d' | '15d' | '30d' | '60d' | '90d';
    incluirComparativo?: boolean;
    formato?: 'resumido' | 'completo';
  }): Promise<RelatorioCliente> {
    const supabase = await createClient();
    const hoje = new Date();

    let clientId = params.clientId;

    // Buscar cliente por nome
    if (!clientId && params.query) {
      const { data: clientes } = await supabase
        .from('clients')
        .select('id')
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
      throw new Error('Informe o cliente para gerar o relatório.');
    }

    // Buscar dados do cliente
    const { data: cliente } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (!cliente) {
      throw new Error('Cliente não encontrado.');
    }

    // Calcular período
    const dias = parseInt(params.periodo?.replace('d', '') || '30');
    const dataInicio = new Date(hoje);
    dataInicio.setDate(dataInicio.getDate() - dias);

    const periodoLabel = `Últimos ${dias} dias`;

    // Buscar atividades do período
    const { data: reunioesRealizadas } = await supabase
      .from('meetings')
      .select('id')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .gte('date', toDateString(dataInicio));

    const { data: tarefasConcluidas } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('client_id', clientId)
      .eq('status', 'done')
      .gte('updated_at', dataInicio.toISOString());

    // Destaques
    const destaques: string[] = [];
    if ((reunioesRealizadas?.length || 0) > 0) {
      destaques.push(`${reunioesRealizadas?.length} reunião(ões) realizada(s)`);
    }
    if ((tarefasConcluidas?.length || 0) > 0) {
      destaques.push(`${tarefasConcluidas?.length} tarefa(s) concluída(s)`);
    }

    // Ajustes realizados (baseado em tarefas concluídas)
    const ajustesRealizados = tarefasConcluidas?.slice(0, 5).map(t => t.title) || [];

    // Pontos de melhoria
    const pontosMelhoria: string[] = [];

    const { data: tarefasPendentes } = await supabase
      .from('tasks')
      .select('id')
      .eq('client_id', clientId)
      .in('status', ['todo', 'doing']);

    if ((tarefasPendentes?.length || 0) > 3) {
      pontosMelhoria.push(`${tarefasPendentes?.length} tarefas pendentes para resolver`);
    }

    // Plano próximo período
    const planoProximoPeriodo = [
      'Acompanhar métricas de performance',
      'Otimizar campanhas com base nos resultados',
      'Manter comunicação regular'
    ];

    // Mensagem resumo para WhatsApp
    const mensagemResumo = `📊 *Relatório ${periodoLabel}*\n\n` +
      `*${cliente.name}*\n\n` +
      (destaques.length > 0 ? `✅ *Destaques:*\n${destaques.map(d => `• ${d}`).join('\n')}\n\n` : '') +
      `📋 *Próximos passos:*\n${planoProximoPeriodo.slice(0, 3).map(p => `• ${p}`).join('\n')}\n\n` +
      `Qualquer dúvida, estou à disposição! 🙌`;

    // Resumo executivo
    const resumoExecutivo = `Relatório de ${cliente.name} (${periodoLabel}). ` +
      `${reunioesRealizadas?.length || 0} reuniões, ${tarefasConcluidas?.length || 0} tarefas concluídas. ` +
      `${destaques.length} destaque(s), ${pontosMelhoria.length} ponto(s) de melhoria.`;

    return {
      clientId: cliente.id,
      clientName: cliente.name,
      periodo: {
        inicio: toDateString(dataInicio),
        fim: toDateString(hoje),
        label: periodoLabel
      },
      campanhas: {
        temDados: false,
        investimento: 0,
        impressoes: 0,
        cliques: 0,
        conversoes: 0,
        roas: 0,
        cpa: 0,
        ctr: 0,
        comparativoAnterior: {
          investimento: { atual: 0, anterior: 0, variacao: 0 },
          conversoes: { atual: 0, anterior: 0, variacao: 0 },
          roas: { atual: 0, anterior: 0, variacao: 0 }
        },
        topCampanhas: []
      },
      atividades: {
        reunioesRealizadas: reunioesRealizadas?.length || 0,
        tarefasConcluidas: tarefasConcluidas?.length || 0,
        mensagensEnviadas: 0,
        ajustesRealizados
      },
      destaques,
      pontosMelhoria,
      planoProximoPeriodo,
      resumoExecutivo,
      mensagemResumo
    };
  }
}

export default CommunicationExecutor;
