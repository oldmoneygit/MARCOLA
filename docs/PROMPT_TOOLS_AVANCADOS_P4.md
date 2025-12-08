# 🚀 MARCOLA ASSISTANT - Tools Avançados v2.0

## PARTE 4: Tools de Comunicação Inteligente

---

## 💬 VISÃO GERAL - COMUNICAÇÃO

Tools de comunicação ajudam a preparar, registrar e automatizar interações com clientes.

| Tool | Descrição | Confirmação |
|------|-----------|-------------|
| `preparar_reuniao` | Gera briefing preparatório para reunião | ❌ Não |
| `registrar_pos_reuniao` | Registra anotações e cria tarefas | ✅ Sim |
| `agendar_recorrente` | Agenda reuniões/tarefas recorrentes | ✅ Sim |
| `gerar_relatorio_cliente` | Gera relatório de performance | ❌ Não |

---

## 📝 DEFINIÇÃO DOS TOOLS

### Arquivo: `src/lib/assistant/tools-advanced/communication.ts`

```typescript
// ============================================================
// MARCOLA ASSISTANT - TOOLS DE COMUNICAÇÃO
// ============================================================

import { ToolDefinition } from '../types';

export const COMMUNICATION_TOOLS: ToolDefinition[] = [
  // ==================== PREPARAR REUNIÃO ====================
  {
    name: 'preparar_reuniao',
    description: `Gera um briefing completo para preparar o gestor para uma reunião.
Use quando o gestor pedir:
- "Prepara a reunião das 14h"
- "Me dá um briefing pro João"
- "O que preciso saber pra reunião?"
- "Prepara a pauta da reunião"

O sistema analisa e prepara:
1. Contexto do cliente (tempo, valor, histórico)
2. Situação financeira (pagamentos pendentes)
3. Tarefas abertas e atrasadas
4. Performance de campanhas (se houver)
5. Histórico de interações recentes
6. Pauta sugerida com pontos de atenção
7. Perguntas recomendadas para fazer

Retorna briefing estruturado pronto para usar.`,
    parameters: {
      type: 'object',
      properties: {
        meetingId: {
          type: 'string',
          description: 'ID da reunião. Se não informado, busca próxima reunião.'
        },
        clientId: {
          type: 'string',
          description: 'ID do cliente. Usado se não tiver meetingId.'
        },
        query: {
          type: 'string',
          description: 'Nome do cliente para buscar.'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },

  // ==================== REGISTRAR PÓS-REUNIÃO ====================
  {
    name: 'registrar_pos_reuniao',
    description: `Registra as anotações de uma reunião realizada e cria tarefas decorrentes.
Use quando o gestor pedir:
- "Registra a reunião que acabou"
- "Anota: decidimos aumentar o budget"
- "Cria as tarefas da reunião"
- "Pós-reunião com João"

O gestor pode ditar:
1. Anotações gerais da reunião
2. Decisões tomadas
3. Próximos passos (viram tarefas automaticamente)
4. Feedback do cliente
5. Próxima reunião sugerida

O sistema cria tarefas automaticamente para cada próximo passo.`,
    parameters: {
      type: 'object',
      properties: {
        meetingId: {
          type: 'string',
          description: 'ID da reunião. Se não informado, busca última reunião.'
        },
        clientId: {
          type: 'string',
          description: 'ID do cliente.'
        },
        anotacoes: {
          type: 'string',
          description: 'Anotações gerais da reunião.'
        },
        decisoes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de decisões tomadas.'
        },
        proximosPassos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              descricao: { type: 'string' },
              responsavel: { type: 'string', enum: ['gestor', 'cliente'] },
              prazo: { type: 'string' }
            }
          },
          description: 'Lista de próximos passos que virarão tarefas.'
        },
        satisfacaoCliente: {
          type: 'string',
          enum: ['muito_satisfeito', 'satisfeito', 'neutro', 'insatisfeito'],
          description: 'Nível de satisfação do cliente na reunião.'
        },
        proximaReuniao: {
          type: 'object',
          properties: {
            data: { type: 'string' },
            horario: { type: 'string' }
          },
          description: 'Data/hora sugerida para próxima reunião.'
        }
      },
      required: ['anotacoes']
    },
    requiresConfirmation: true,
    confirmationType: 'pos_reuniao'
  },

  // ==================== AGENDAR RECORRENTE ====================
  {
    name: 'agendar_recorrente',
    description: `Agenda reuniões ou tarefas que se repetem periodicamente.
Use quando o gestor pedir:
- "Agenda reunião com João toda terça às 14h"
- "Cria tarefa recorrente de relatório mensal"
- "Reunião quinzenal com a Maria"
- "Todo mês dia 5, cobrar o Pedro"

Tipos de recorrência:
- Semanal: escolhe dia da semana e horário
- Quinzenal: a cada 2 semanas
- Mensal: escolhe dia do mês

O sistema mostra preview das próximas ocorrências antes de criar.`,
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
          description: 'Tipo de item recorrente.'
        },
        frequencia: {
          type: 'string',
          enum: ['semanal', 'quinzenal', 'mensal'],
          description: 'Frequência da recorrência.'
        },
        diaSemana: {
          type: 'string',
          enum: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
          description: 'Dia da semana (para semanal/quinzenal).'
        },
        diaDoMes: {
          type: 'number',
          description: 'Dia do mês (para mensal). 1-31.'
        },
        horario: {
          type: 'string',
          description: 'Horário no formato HH:mm.'
        },
        titulo: {
          type: 'string',
          description: 'Título da reunião/tarefa.'
        },
        tipoReuniao: {
          type: 'string',
          enum: ['online', 'presencial'],
          description: 'Tipo de reunião (se aplicável).'
        },
        quantidadeOcorrencias: {
          type: 'number',
          description: 'Número de ocorrências a criar. Default: 12.'
        }
      },
      required: ['tipo', 'frequencia']
    },
    requiresConfirmation: true,
    confirmationType: 'agendamento_recorrente'
  },

  // ==================== GERAR RELATÓRIO CLIENTE ====================
  {
    name: 'gerar_relatorio_cliente',
    description: `Gera um relatório de performance/atividades para enviar ao cliente.
Use quando o gestor pedir:
- "Gera relatório do João"
- "Faz o report mensal da Hamburgueria"
- "Monta o relatório de novembro"
- "Prepara o resumo pro cliente"

O relatório inclui:
1. Métricas de campanhas (se houver)
2. Atividades realizadas no período
3. Tarefas concluídas
4. Destaques positivos
5. Pontos de melhoria
6. Plano para próximo período

Retorna relatório formatado + mensagem resumida para WhatsApp.`,
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
          enum: ['semana', 'mes', 'trimestre'],
          description: 'Período do relatório. Default: mes.'
        },
        mesEspecifico: {
          type: 'string',
          description: 'Mês específico no formato YYYY-MM.'
        },
        incluirCampanhas: {
          type: 'boolean',
          description: 'Se deve incluir métricas de campanhas. Default: true.'
        }
      },
      required: []
    },
    requiresConfirmation: false
  }
];

export default COMMUNICATION_TOOLS;
```

---

## ⚙️ IMPLEMENTAÇÃO DO EXECUTOR

### Arquivo: `src/lib/assistant/tools-advanced/communication-executor.ts`

```typescript
// ============================================================
// EXECUTOR DOS TOOLS DE COMUNICAÇÃO
// ============================================================

import { createClient } from '@/lib/supabase/server';
import {
  BriefingReuniao,
  RegistroPosReuniao,
  AgendamentoRecorrente,
  RelatorioCliente
} from '../types-advanced';
import { ConfirmationData } from '../types';

export class CommunicationExecutor {
  private supabase;
  private userId: string;

  constructor(userId: string) {
    this.supabase = createClient();
    this.userId = userId;
  }

  // ==================== PREPARAR REUNIÃO ====================

  async prepararReuniao(params: {
    meetingId?: string;
    clientId?: string;
    query?: string;
  }): Promise<BriefingReuniao> {
    let meetingId = params.meetingId;
    let clientId = params.clientId;

    // Buscar reunião se não tiver ID
    if (!meetingId) {
      const hoje = new Date().toISOString().split('T')[0];
      
      let query = this.supabase
        .from('meetings')
        .select('id, client_id')
        .eq('user_id', this.userId)
        .eq('status', 'scheduled')
        .gte('date', hoje)
        .order('date')
        .order('time');

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data: reunioes } = await query.limit(1);

      if (!reunioes || reunioes.length === 0) {
        throw new Error('Nenhuma reunião agendada encontrada.');
      }

      meetingId = reunioes[0].id;
      clientId = reunioes[0].client_id;
    }

    // Buscar cliente pelo nome se necessário
    if (!clientId && params.query) {
      const { data: clientes } = await this.supabase
        .from('clients')
        .select('id')
        .eq('user_id', this.userId)
        .ilike('name', `%${params.query}%`)
        .limit(1);

      if (clientes && clientes.length > 0) {
        clientId = clientes[0].id;
      }
    }

    // Buscar dados da reunião
    const { data: reuniao, error } = await this.supabase
      .from('meetings')
      .select(`
        id, date, time, type, notes, status,
        client:clients(*)
      `)
      .eq('id', meetingId)
      .single();

    if (error || !reuniao) {
      throw new Error('Reunião não encontrada.');
    }

    const cliente = reuniao.client;
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];

    // Formatar data
    const dataReuniao = new Date(reuniao.date);
    const dataFormatada = dataReuniao.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    // Calcular tempo como cliente
    const dataCriacao = new Date(cliente.created_at);
    const mesesCliente = Math.floor(
      (hoje.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const tempoComoCliente = mesesCliente < 1 ? 'menos de 1 mês' : `${mesesCliente} meses`;

    // Buscar última reunião realizada
    const { data: ultimaReuniao } = await this.supabase
      .from('meetings')
      .select('date')
      .eq('client_id', cliente.id)
      .eq('status', 'completed')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    // Buscar pagamentos pendentes
    const { data: pagamentosPendentes } = await this.supabase
      .from('payments')
      .select('amount, due_date')
      .eq('client_id', cliente.id)
      .eq('status', 'pending')
      .order('due_date');

    const pendencias = pagamentosPendentes?.map(p => {
      const diasAtraso = new Date(p.due_date) < hoje
        ? Math.floor((hoje.getTime() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      return {
        valor: Number(p.amount),
        vencimento: p.due_date,
        diasAtraso
      };
    }) || [];

    const statusPagamento = pendencias.some(p => p.diasAtraso > 7)
      ? 'atrasado'
      : pendencias.length > 0
        ? 'pendente'
        : 'em_dia';

    // Buscar tarefas
    const { data: tarefas } = await this.supabase
      .from('tasks')
      .select('id, title, status, due_date, priority')
      .eq('client_id', cliente.id)
      .in('status', ['todo', 'doing']);

    const tarefasPendentes = tarefas?.length || 0;
    const tarefasConcluidas = 0; // Buscar separado se necessário
    const tarefasAtrasadas = tarefas?.filter(t => 
      t.due_date && new Date(t.due_date) < hoje
    ).length || 0;

    const proximasTarefas = tarefas?.slice(0, 3).map(t => ({
      titulo: t.title,
      prazo: t.due_date || 'Sem prazo'
    })) || [];

    // Histórico recente (últimas 5 interações)
    const historicoRecente: BriefingReuniao['historicoRecente'] = [];

    // Últimas reuniões
    const { data: reunioesRecentes } = await this.supabase
      .from('meetings')
      .select('date, status')
      .eq('client_id', cliente.id)
      .eq('status', 'completed')
      .order('date', { ascending: false })
      .limit(3);

    reunioesRecentes?.forEach(r => {
      historicoRecente.push({
        data: r.date,
        tipo: 'Reunião',
        descricao: 'Reunião realizada'
      });
    });

    // Últimas mensagens
    const { data: mensagensRecentes } = await this.supabase
      .from('message_logs')
      .select('created_at, template_type')
      .eq('client_id', cliente.id)
      .order('created_at', { ascending: false })
      .limit(3);

    mensagensRecentes?.forEach(m => {
      historicoRecente.push({
        data: new Date(m.created_at).toISOString().split('T')[0],
        tipo: 'Mensagem',
        descricao: m.template_type || 'WhatsApp enviado'
      });
    });

    // Ordenar por data
    historicoRecente.sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    );

    // Gerar pauta sugerida
    const pautaSugerida: BriefingReuniao['pautaSugerida'] = [];

    if (statusPagamento !== 'em_dia') {
      pautaSugerida.push({
        topico: 'Regularização financeira',
        prioridade: 'alta',
        notas: `${pendencias.length} pagamento(s) pendente(s)`
      });
    }

    pautaSugerida.push({
      topico: 'Alinhamento de resultados',
      prioridade: 'alta',
      notas: 'Apresentar métricas e resultados recentes'
    });

    if (tarefasAtrasadas > 0) {
      pautaSugerida.push({
        topico: 'Pendências operacionais',
        prioridade: 'media',
        notas: `${tarefasAtrasadas} tarefa(s) atrasada(s)`
      });
    }

    pautaSugerida.push({
      topico: 'Próximos passos',
      prioridade: 'media',
      notas: 'Definir ações e prazos'
    });

    pautaSugerida.push({
      topico: 'Feedback e dúvidas',
      prioridade: 'baixa',
      notas: 'Abrir espaço para cliente'
    });

    // Pontos de atenção
    const pontosAtencao: BriefingReuniao['pontosAtencao'] = [];

    if (statusPagamento === 'atrasado') {
      pontosAtencao.push({
        tipo: 'alerta',
        descricao: `Pagamento atrasado há ${Math.max(...pendencias.map(p => p.diasAtraso))} dias`
      });
    }

    if (tarefasAtrasadas > 2) {
      pontosAtencao.push({
        tipo: 'alerta',
        descricao: `${tarefasAtrasadas} tarefas atrasadas - verificar gargalos`
      });
    }

    // Perguntas sugeridas
    const perguntasSugeridas = [
      'Como está a satisfação com os resultados atuais?',
      'Há algum ajuste que gostaria de fazer nas campanhas?',
      'Quais são as prioridades para o próximo período?',
      'Tem alguma dúvida ou preocupação que gostaria de discutir?'
    ];

    if (statusPagamento !== 'em_dia') {
      perguntasSugeridas.unshift('Podemos regularizar as pendências financeiras?');
    }

    // Resumo executivo
    const resumoExecutivo = `Reunião com ${cliente.name} (${cliente.segment || 'cliente'}) ` +
      `${dataFormatada} às ${reuniao.time}. ` +
      `Cliente há ${tempoComoCliente}. ` +
      `${statusPagamento === 'em_dia' ? 'Financeiro em dia.' : `Pendências financeiras: R$ ${pendencias.reduce((s, p) => s + p.valor, 0).toLocaleString('pt-BR')}.`} ` +
      `${tarefasPendentes} tarefa(s) pendente(s).`;

    return {
      meetingId: reuniao.id,
      clientId: cliente.id,
      clientName: cliente.name,
      reuniao: {
        data: reuniao.date,
        dataFormatada,
        horario: reuniao.time,
        tipo: reuniao.type || 'online',
        notas: reuniao.notes
      },
      contextoCliente: {
        segment: cliente.segment || 'Não definido',
        tempoComoCliente,
        valorContrato: Number(cliente.monthly_value) || 0,
        ultimaReuniao: ultimaReuniao?.date,
        frequenciaReunioes: cliente.meeting_frequency || 'quinzenal'
      },
      situacaoAtual: {
        pagamentos: {
          status: statusPagamento as any,
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
    anotacoes: string;
    decisoes?: string[];
    proximosPassos?: Array<{
      descricao: string;
      responsavel: 'gestor' | 'cliente';
      prazo?: string;
    }>;
    satisfacaoCliente?: 'muito_satisfeito' | 'satisfeito' | 'neutro' | 'insatisfeito';
    proximaReuniao?: {
      data: string;
      horario: string;
    };
  }): Promise<{ confirmation: ConfirmationData }> {
    let meetingId = params.meetingId;
    let clientId = params.clientId;

    // Buscar última reunião se não tiver ID
    if (!meetingId) {
      const { data: reunioes } = await this.supabase
        .from('meetings')
        .select('id, client_id, date, client:clients(name)')
        .eq('user_id', this.userId)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .limit(1);

      if (!reunioes || reunioes.length === 0) {
        throw new Error('Nenhuma reunião encontrada.');
      }

      meetingId = reunioes[0].id;
      clientId = reunioes[0].client_id;
    }

    // Buscar dados da reunião
    const { data: reuniao } = await this.supabase
      .from('meetings')
      .select('id, date, client:clients(id, name)')
      .eq('id', meetingId)
      .single();

    if (!reuniao) {
      throw new Error('Reunião não encontrada.');
    }

    // Preparar próximos passos com prioridade
    const proximosPassosFormatados = (params.proximosPassos || []).map(p => ({
      descricao: p.descricao,
      responsavel: p.responsavel,
      prazo: p.prazo || this.calcularPrazoSugerido(),
      prioridade: 'media' as const,
      criarTarefa: p.responsavel === 'gestor'
    }));

    const confirmationData: RegistroPosReuniao = {
      meetingId,
      clientId: reuniao.client?.id || clientId || '',
      clientName: reuniao.client?.name || '',
      dataReuniao: reuniao.date,
      anotacoes: params.anotacoes,
      decisoes: (params.decisoes || []).map(d => ({
        descricao: d,
        responsavel: 'ambos' as const
      })),
      proximosPassos: proximosPassosFormatados,
      feedbackCliente: params.satisfacaoCliente ? {
        satisfacao: params.satisfacaoCliente,
        comentarios: undefined
      } : undefined,
      proximaReuniao: params.proximaReuniao ? {
        agendar: true,
        data: params.proximaReuniao.data,
        horario: params.proximaReuniao.horario
      } : undefined,
      resumo: this.gerarResumoReuniao(params)
    };

    return {
      confirmation: {
        id: `pos_reuniao_${Date.now()}`,
        type: 'pos_reuniao',
        status: 'pending',
        data: confirmationData,
        toolToExecute: {
          id: `tool_${Date.now()}`,
          name: 'registrar_pos_reuniao',
          parameters: params
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
    let tarefasCriadas = 0;
    let reuniaoAgendada = false;

    // 1. Atualizar reunião como completa com notas
    await this.supabase
      .from('meetings')
      .update({
        status: 'completed',
        notes: data.anotacoes
      })
      .eq('id', data.meetingId);

    // 2. Criar tarefas para próximos passos do gestor
    for (const passo of data.proximosPassos) {
      if (passo.criarTarefa) {
        const { error } = await this.supabase
          .from('tasks')
          .insert({
            user_id: this.userId,
            client_id: data.clientId,
            title: passo.descricao,
            due_date: passo.prazo,
            priority: passo.prioridade === 'alta' ? 'high' : 'medium',
            status: 'todo',
            description: `Tarefa criada a partir da reunião de ${data.dataReuniao}`
          });

        if (!error) tarefasCriadas++;
      }
    }

    // 3. Agendar próxima reunião se solicitado
    if (data.proximaReuniao?.agendar && data.proximaReuniao.data) {
      const { error } = await this.supabase
        .from('meetings')
        .insert({
          user_id: this.userId,
          client_id: data.clientId,
          date: data.proximaReuniao.data,
          time: data.proximaReuniao.horario || '14:00',
          type: 'online',
          status: 'scheduled',
          notes: data.proximaReuniao.pauta || 'Follow-up da reunião anterior'
        });

      if (!error) reuniaoAgendada = true;
    }

    // 4. Registrar log da reunião (opcional)
    // Pode salvar em uma tabela meeting_notes se quiser histórico

    return {
      success: true,
      tarefasCriadas,
      reuniaoAgendada,
      summary: `Reunião registrada! ${tarefasCriadas} tarefa(s) criada(s)${reuniaoAgendada ? ', próxima reunião agendada' : ''}.`
    };
  }

  // ==================== AGENDAR RECORRENTE ====================

  async prepararAgendamentoRecorrente(params: {
    clientId?: string;
    query?: string;
    tipo: 'reuniao' | 'tarefa' | 'lembrete';
    frequencia: 'semanal' | 'quinzenal' | 'mensal';
    diaSemana?: string;
    diaDoMes?: number;
    horario?: string;
    titulo?: string;
    tipoReuniao?: 'online' | 'presencial';
    quantidadeOcorrencias?: number;
  }): Promise<{ confirmation: ConfirmationData }> {
    let clientId = params.clientId;

    // Buscar cliente pelo nome
    if (!clientId && params.query) {
      const { data: clientes } = await this.supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', this.userId)
        .ilike('name', `%${params.query}%`)
        .limit(1);

      if (!clientes || clientes.length === 0) {
        throw new Error(`Cliente "${params.query}" não encontrado.`);
      }

      clientId = clientes[0].id;
    }

    if (!clientId) {
      throw new Error('Informe o cliente para o agendamento recorrente.');
    }

    // Buscar nome do cliente
    const { data: cliente } = await this.supabase
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .single();

    // Calcular próximas ocorrências
    const quantidade = params.quantidadeOcorrencias || 12;
    const proximasOcorrencias = this.calcularProximasOcorrencias(
      params.frequencia,
      params.diaSemana,
      params.diaDoMes,
      quantidade
    );

    // Gerar título default
    const titulo = params.titulo || 
      `${params.tipo === 'reuniao' ? 'Reunião' : params.tipo === 'tarefa' ? 'Tarefa' : 'Lembrete'} ${params.frequencia}`;

    const resumo = `${titulo} com ${cliente?.name || 'cliente'} - ` +
      `${params.frequencia}${params.diaSemana ? ` (${params.diaSemana})` : ''}` +
      `${params.horario ? ` às ${params.horario}` : ''}. ` +
      `${quantidade} ocorrências.`;

    const confirmationData: AgendamentoRecorrente = {
      clientId,
      clientName: cliente?.name || '',
      tipo: params.tipo,
      frequencia: params.frequencia,
      diaSemana: params.diaSemana,
      diaDoMes: params.diaDoMes,
      horario: params.horario || '14:00',
      detalhes: {
        titulo,
        descricao: `Agendamento recorrente ${params.frequencia}`,
        tipoReuniao: params.tipoReuniao || 'online'
      },
      dataInicio: proximasOcorrencias[0]?.data || new Date().toISOString().split('T')[0],
      proximasOcorrencias,
      resumo
    };

    return {
      confirmation: {
        id: `agendamento_recorrente_${Date.now()}`,
        type: 'agendamento_recorrente',
        status: 'pending',
        data: confirmationData,
        toolToExecute: {
          id: `tool_${Date.now()}`,
          name: 'agendar_recorrente',
          parameters: params
        },
        createdAt: new Date()
      }
    };
  }

  async executarAgendamentoRecorrente(data: AgendamentoRecorrente): Promise<{
    success: boolean;
    itensCriados: number;
    summary: string;
  }> {
    let itensCriados = 0;

    for (const ocorrencia of data.proximasOcorrencias) {
      try {
        if (data.tipo === 'reuniao') {
          await this.supabase.from('meetings').insert({
            user_id: this.userId,
            client_id: data.clientId,
            date: ocorrencia.data,
            time: data.horario || '14:00',
            type: data.detalhes.tipoReuniao || 'online',
            status: 'scheduled',
            notes: `${data.detalhes.titulo} - Agendamento recorrente`
          });
        } else if (data.tipo === 'tarefa') {
          await this.supabase.from('tasks').insert({
            user_id: this.userId,
            client_id: data.clientId,
            title: data.detalhes.titulo,
            due_date: ocorrencia.data,
            priority: 'medium',
            status: 'todo',
            description: `Tarefa recorrente ${data.frequencia}`
          });
        } else if (data.tipo === 'lembrete') {
          await this.supabase.from('reminders').insert({
            user_id: this.userId,
            client_id: data.clientId,
            message: data.detalhes.titulo,
            remind_at: `${ocorrencia.data}T${data.horario || '09:00'}:00`,
            status: 'pending'
          });
        }
        itensCriados++;
      } catch (err) {
        console.error('Erro ao criar item recorrente:', err);
      }
    }

    const tipoLabel = data.tipo === 'reuniao' ? 'reuniões' : 
                      data.tipo === 'tarefa' ? 'tarefas' : 'lembretes';

    return {
      success: true,
      itensCriados,
      summary: `${itensCriados} ${tipoLabel} ${data.frequencia}(s) criada(s) para ${data.clientName}.`
    };
  }

  // ==================== GERAR RELATÓRIO CLIENTE ====================

  async gerarRelatorioCliente(params: {
    clientId?: string;
    query?: string;
    periodo?: 'semana' | 'mes' | 'trimestre';
    mesEspecifico?: string;
    incluirCampanhas?: boolean;
  }): Promise<RelatorioCliente> {
    let clientId = params.clientId;

    // Buscar cliente pelo nome
    if (!clientId && params.query) {
      const { data: clientes } = await this.supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', this.userId)
        .ilike('name', `%${params.query}%`)
        .limit(1);

      if (!clientes || clientes.length === 0) {
        throw new Error(`Cliente "${params.query}" não encontrado.`);
      }

      clientId = clientes[0].id;
    }

    if (!clientId) {
      throw new Error('Informe o cliente para gerar o relatório.');
    }

    // Buscar dados do cliente
    const { data: cliente } = await this.supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (!cliente) {
      throw new Error('Cliente não encontrado.');
    }

    // Calcular período
    const hoje = new Date();
    let inicio: Date;
    let fim: Date = hoje;
    let label: string;

    if (params.mesEspecifico) {
      const [ano, mes] = params.mesEspecifico.split('-').map(Number);
      inicio = new Date(ano, mes - 1, 1);
      fim = new Date(ano, mes, 0);
      label = inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    } else {
      switch (params.periodo) {
        case 'semana':
          inicio = new Date(hoje);
          inicio.setDate(hoje.getDate() - 7);
          label = 'Última semana';
          break;
        case 'trimestre':
          inicio = new Date(hoje);
          inicio.setMonth(hoje.getMonth() - 3);
          label = 'Último trimestre';
          break;
        default: // mes
          inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
          label = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      }
    }

    const inicioStr = inicio.toISOString().split('T')[0];
    const fimStr = fim.toISOString().split('T')[0];

    // Buscar reuniões realizadas
    const { data: reunioes } = await this.supabase
      .from('meetings')
      .select('id')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .gte('date', inicioStr)
      .lte('date', fimStr);

    // Buscar tarefas concluídas
    const { data: tarefas } = await this.supabase
      .from('tasks')
      .select('id, title')
      .eq('client_id', clientId)
      .eq('status', 'done')
      .gte('updated_at', inicio.toISOString());

    // Buscar mensagens enviadas
    const { data: mensagens } = await this.supabase
      .from('message_logs')
      .select('id')
      .eq('client_id', clientId)
      .gte('created_at', inicio.toISOString());

    // Gerar destaques
    const destaques: string[] = [];
    if ((reunioes?.length || 0) >= 2) {
      destaques.push(`${reunioes?.length} reuniões de acompanhamento realizadas`);
    }
    if ((tarefas?.length || 0) >= 3) {
      destaques.push(`${tarefas?.length} entregas concluídas no período`);
    }
    destaques.push('Acompanhamento contínuo e suporte ativo');

    // Pontos de melhoria
    const pontosMelhoria: string[] = [];
    pontosMelhoria.push('Avaliar oportunidades de expansão');
    pontosMelhoria.push('Testar novos formatos de anúncio');

    // Plano próximo período
    const planoProximoPeriodo: string[] = [];
    planoProximoPeriodo.push('Manter frequência de reuniões');
    planoProximoPeriodo.push('Otimizar campanhas com melhor performance');
    planoProximoPeriodo.push('Explorar novos públicos');

    // Ajustes realizados (simplificado)
    const ajustesRealizados = tarefas?.map(t => t.title).slice(0, 5) || [];

    // Resumo executivo
    const resumoExecutivo = `No período de ${label}, realizamos ${reunioes?.length || 0} reunião(ões) ` +
      `e concluímos ${tarefas?.length || 0} tarefa(s). ` +
      `O acompanhamento foi realizado de forma contínua, ` +
      `garantindo alinhamento e suporte às necessidades do cliente.`;

    // Mensagem para WhatsApp
    const mensagemResumo = `Olá ${cliente.contact_name || cliente.name}! 👋\n\n` +
      `Preparei um resumo das atividades de ${label}:\n\n` +
      `📅 ${reunioes?.length || 0} reunião(ões) realizada(s)\n` +
      `✅ ${tarefas?.length || 0} entrega(s) concluída(s)\n` +
      `💬 ${mensagens?.length || 0} comunicação(ões)\n\n` +
      `Seguimos trabalhando para entregar os melhores resultados!\n\n` +
      `Qualquer dúvida, estou à disposição. 🚀`;

    return {
      clientId,
      clientName: cliente.name,
      periodo: {
        inicio: inicioStr,
        fim: fimStr,
        label
      },
      atividades: {
        reunioesRealizadas: reunioes?.length || 0,
        tarefasConcluidas: tarefas?.length || 0,
        mensagensEnviadas: mensagens?.length || 0,
        ajustesRealizados
      },
      destaques,
      pontosMelhoria,
      planoProximoPeriodo,
      resumoExecutivo,
      mensagemResumo
    };
  }

  // ==================== HELPERS ====================

  private calcularPrazoSugerido(): string {
    const prazo = new Date();
    prazo.setDate(prazo.getDate() + 7);
    return prazo.toISOString().split('T')[0];
  }

  private gerarResumoReuniao(params: any): string {
    const decisoes = params.decisoes?.length || 0;
    const passos = params.proximosPassos?.length || 0;
    
    return `Reunião registrada. ${decisoes} decisão(ões), ${passos} próximo(s) passo(s) definido(s).`;
  }

  private calcularProximasOcorrencias(
    frequencia: 'semanal' | 'quinzenal' | 'mensal',
    diaSemana?: string,
    diaDoMes?: number,
    quantidade: number = 12
  ): Array<{ data: string; dataFormatada: string; horario?: string }> {
    const ocorrencias: Array<{ data: string; dataFormatada: string }> = [];
    const hoje = new Date();
    let dataAtual = new Date(hoje);

    // Mapear dia da semana
    const diasSemanaMap: Record<string, number> = {
      domingo: 0, segunda: 1, terca: 2, quarta: 3,
      quinta: 4, sexta: 5, sabado: 6
    };

    // Ajustar para o primeiro dia correto
    if (frequencia === 'semanal' || frequencia === 'quinzenal') {
      if (diaSemana && diasSemanaMap[diaSemana] !== undefined) {
        const diaAlvo = diasSemanaMap[diaSemana];
        while (dataAtual.getDay() !== diaAlvo) {
          dataAtual.setDate(dataAtual.getDate() + 1);
        }
      }
    } else if (frequencia === 'mensal' && diaDoMes) {
      dataAtual.setDate(diaDoMes);
      if (dataAtual < hoje) {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
      }
    }

    // Gerar ocorrências
    for (let i = 0; i < quantidade; i++) {
      ocorrencias.push({
        data: dataAtual.toISOString().split('T')[0],
        dataFormatada: dataAtual.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        })
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

    return ocorrencias;
  }
}

export default CommunicationExecutor;
```

---

**Continua na Parte 5: Tools de Meta-Ação...**
