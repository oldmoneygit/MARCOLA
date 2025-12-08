# 🚀 MARCOLA ASSISTANT - Tools Avançados v2.0

## PARTE 5: Tools de Meta-Ação e Rotinas

---

## ⚡ VISÃO GERAL - META-AÇÃO

Tools de meta-ação executam rotinas completas e fluxos de trabalho automatizados.

| Tool | Descrição | Confirmação |
|------|-----------|-------------|
| `executar_rotina_matinal` | Checklist matinal completo | ❌ Não |
| `encerrar_dia` | Resumo do dia + preview amanhã | ❌ Não |
| `onboarding_cliente` | Setup completo de novo cliente | ✅ Sim |
| `health_check_geral` | Análise de saúde da operação | ❌ Não |

---

## 📝 DEFINIÇÃO DOS TOOLS

### Arquivo: `src/lib/assistant/tools-advanced/meta-actions.ts`

```typescript
// ============================================================
// MARCOLA ASSISTANT - TOOLS DE META-AÇÃO
// ============================================================

import { ToolDefinition } from '../types';

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
    confirmationType: 'onboarding_cliente'
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
```

---

## ⚙️ IMPLEMENTAÇÃO DO EXECUTOR

### Arquivo: `src/lib/assistant/tools-advanced/meta-actions-executor.ts`

```typescript
// ============================================================
// EXECUTOR DOS TOOLS DE META-AÇÃO
// ============================================================

import { createClient } from '@/lib/supabase/server';
import {
  RotinaMatinal,
  EncerramentoDia,
  OnboardingCliente,
  HealthCheckGeral,
  SugestaoAcao
} from '../types-advanced';
import { ConfirmationData } from '../types';

export class MetaActionsExecutor {
  private supabase;
  private userId: string;

  constructor(userId: string) {
    this.supabase = createClient();
    this.userId = userId;
  }

  // ==================== EXECUTAR ROTINA MATINAL ====================

  async executarRotinaMatinal(params: {
    incluirMetricas?: boolean;
    incluirSugestoes?: boolean;
  }): Promise<RotinaMatinal> {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    const diaSemana = hoje.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dataFormatada = hoje.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });

    // Saudação personalizada por hora
    const hora = hoje.getHours();
    let saudacao = 'Bom dia! ☀️';
    if (hora >= 12 && hora < 18) saudacao = 'Boa tarde! 🌤️';
    else if (hora >= 18) saudacao = 'Boa noite! 🌙';

    // 1. Buscar reuniões do dia
    const { data: reunioes } = await this.supabase
      .from('meetings')
      .select(`
        id, time, type, notes,
        client:clients(id, name)
      `)
      .eq('user_id', this.userId)
      .eq('date', hojeStr)
      .eq('status', 'scheduled')
      .order('time');

    const agendaReunioes = reunioes?.map(r => ({
      id: r.id,
      horario: r.time,
      clientName: r.client?.name || 'Cliente',
      tipo: (r.type as 'online' | 'presencial') || 'online',
      preparado: false // Pode verificar se já tem briefing
    })) || [];

    // 2. Buscar tarefas urgentes e pendentes
    const { data: tarefas } = await this.supabase
      .from('tasks')
      .select(`
        id, title, due_date, priority,
        client:clients(id, name)
      `)
      .eq('user_id', this.userId)
      .in('status', ['todo', 'doing'])
      .order('priority', { ascending: false })
      .order('due_date');

    const tarefasFormatadas = tarefas?.slice(0, 10).map(t => ({
      id: t.id,
      titulo: t.title,
      clientName: t.client?.name,
      prioridade: t.priority || 'medium',
      atrasada: t.due_date ? new Date(t.due_date) < hoje : false
    })) || [];

    const tarefasUrgentes = tarefasFormatadas.filter(
      t => t.prioridade === 'urgent' || t.atrasada
    ).length;

    // 3. Pagamentos que vencem hoje
    const { data: pagamentosHoje } = await this.supabase
      .from('payments')
      .select(`
        id, amount,
        client:clients(id, name)
      `)
      .eq('user_id', this.userId)
      .eq('status', 'pending')
      .eq('due_date', hojeStr);

    const vencemHoje = pagamentosHoje?.map(p => ({
      clientId: p.client?.id || '',
      clientName: p.client?.name || 'Cliente',
      valor: Number(p.amount)
    })) || [];

    const valorVenceHoje = vencemHoje.reduce((sum, p) => sum + p.valor, 0);

    // 4. Pagamentos vencidos
    const { data: pagamentosVencidos } = await this.supabase
      .from('payments')
      .select(`
        id, amount, due_date,
        client:clients(id, name)
      `)
      .eq('user_id', this.userId)
      .eq('status', 'pending')
      .lt('due_date', hojeStr)
      .order('due_date');

    const vencidos = pagamentosVencidos?.map(p => {
      const diasAtraso = Math.floor(
        (hoje.getTime() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        clientId: p.client?.id || '',
        clientName: p.client?.name || 'Cliente',
        valor: Number(p.amount),
        diasAtraso
      };
    }) || [];

    const valorVencido = vencidos.reduce((sum, p) => sum + p.valor, 0);

    // 5. Gerar alertas
    const alertas: RotinaMatinal['alertas'] = [];

    if (vencidos.length > 0) {
      alertas.push({
        tipo: 'critico',
        icone: '💰',
        mensagem: `${vencidos.length} pagamento(s) vencido(s) - R$ ${valorVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        acao: {
          label: 'Cobrar todos',
          tool: 'cobrar_todos_vencidos',
          params: {}
        }
      });
    }

    if (tarefasUrgentes > 0) {
      alertas.push({
        tipo: 'atencao',
        icone: '⚠️',
        mensagem: `${tarefasUrgentes} tarefa(s) urgente(s) ou atrasada(s)`
      });
    }

    // 6. Sugestões prioritárias
    const sugestoesPrioritarias: SugestaoAcao[] = [];

    if (vencidos.length > 0) {
      sugestoesPrioritarias.push({
        id: 'cobrar_vencidos',
        prioridade: 10,
        tipo: 'urgente',
        categoria: 'pagamento',
        icone: '💰',
        titulo: 'Cobrar pagamentos vencidos',
        descricao: `${vencidos.length} cliente(s) com pagamento em atraso`,
        acao: {
          tool: 'cobrar_todos_vencidos',
          parameters: {},
          label: 'Cobrar todos'
        }
      });
    }

    // Reuniões de amanhã para confirmar
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().split('T')[0];

    const { data: reunioesAmanha } = await this.supabase
      .from('meetings')
      .select('id')
      .eq('user_id', this.userId)
      .eq('date', amanhaStr)
      .eq('status', 'scheduled');

    if (reunioesAmanha && reunioesAmanha.length > 0) {
      sugestoesPrioritarias.push({
        id: 'confirmar_amanha',
        prioridade: 7,
        tipo: 'importante',
        categoria: 'reuniao',
        icone: '📞',
        titulo: `Confirmar ${reunioesAmanha.length} reunião(ões) de amanhã`,
        descricao: 'Enviar confirmação via WhatsApp',
        acao: {
          tool: 'confirmar_reunioes_amanha',
          parameters: {},
          label: 'Confirmar'
        }
      });
    }

    // 7. Métricas gerais
    const { count: totalClientes } = await this.supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId);

    const { count: clientesAtivos } = await this.supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .eq('status', 'active');

    // Faturamento previsto do mês
    const inicioMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;
    const fimMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-31`;

    const { data: pagamentosMes } = await this.supabase
      .from('payments')
      .select('amount, status')
      .eq('user_id', this.userId)
      .gte('due_date', inicioMes)
      .lte('due_date', fimMes);

    const faturamentoPrevisto = pagamentosMes?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const recebidoMes = pagamentosMes?.filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    const taxaAdimplencia = faturamentoPrevisto > 0 
      ? Math.round((recebidoMes / faturamentoPrevisto) * 100)
      : 100;

    // 8. Resumo do dia
    let resumoDia = `${dataFormatada}. `;
    
    if (agendaReunioes.length > 0) {
      resumoDia += `${agendaReunioes.length} reunião(ões) agendada(s). `;
    }
    if (tarefasUrgentes > 0) {
      resumoDia += `${tarefasUrgentes} tarefa(s) urgente(s). `;
    }
    if (vencidos.length > 0) {
      resumoDia += `${vencidos.length} pagamento(s) vencido(s). `;
    }
    if (vencemHoje.length > 0) {
      resumoDia += `${vencemHoje.length} vence(m) hoje. `;
    }

    if (!agendaReunioes.length && !tarefasUrgentes && !vencidos.length) {
      resumoDia += 'Dia tranquilo, sem pendências urgentes!';
    }

    return {
      data: hojeStr,
      dataFormatada,
      diaSemana,
      horaExecucao: hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      saudacao,
      agenda: {
        reunioes: agendaReunioes,
        totalReunioes: agendaReunioes.length,
        tarefas: tarefasFormatadas,
        totalTarefas: tarefasFormatadas.length,
        tarefasUrgentes
      },
      financeiro: {
        vencemHoje,
        vencidos,
        totalVenceHoje: vencemHoje.length,
        totalVencido: vencidos.length,
        valorVenceHoje,
        valorVencido
      },
      alertas,
      sugestoesPrioritarias: params.incluirSugestoes !== false ? sugestoesPrioritarias : [],
      metricas: params.incluirMetricas !== false ? {
        totalClientes: totalClientes || 0,
        clientesAtivos: clientesAtivos || 0,
        faturamentoPrevisto,
        taxaAdimplencia
      } : {
        totalClientes: 0,
        clientesAtivos: 0,
        faturamentoPrevisto: 0,
        taxaAdimplencia: 0
      },
      resumoDia
    };
  }

  // ==================== ENCERRAR DIA ====================

  async encerrarDia(params: {
    incluirPreviewAmanha?: boolean;
  }): Promise<EncerramentoDia> {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    const inicioHoje = `${hojeStr}T00:00:00`;
    const fimHoje = `${hojeStr}T23:59:59`;

    // 1. Reuniões do dia
    const { data: reunioes } = await this.supabase
      .from('meetings')
      .select('id, time, status, client:clients(name)')
      .eq('user_id', this.userId)
      .eq('date', hojeStr);

    const reunioesRealizadas = reunioes?.filter(r => r.status === 'completed').length || 0;
    const reunioesNaoRealizadas = reunioes?.filter(r => r.status === 'scheduled')
      .map(r => ({
        clientName: r.client?.name || 'Cliente',
        horario: r.time,
        motivo: undefined
      })) || [];

    // 2. Tarefas do dia
    const { data: tarefasConcluidas } = await this.supabase
      .from('tasks')
      .select('id')
      .eq('user_id', this.userId)
      .eq('status', 'done')
      .gte('updated_at', inicioHoje);

    const { data: tarefasPendentes } = await this.supabase
      .from('tasks')
      .select('id, title, priority, client:clients(name)')
      .eq('user_id', this.userId)
      .in('status', ['todo', 'doing'])
      .lte('due_date', hojeStr);

    const tarefasNaoConcluidas = tarefasPendentes?.slice(0, 5).map(t => ({
      titulo: t.title,
      clientName: t.client?.name,
      prioridade: t.priority || 'medium'
    })) || [];

    // 3. Mensagens enviadas hoje
    const { count: mensagensEnviadas } = await this.supabase
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .gte('created_at', inicioHoje);

    // 4. Pagamentos recebidos hoje
    const { data: pagamentosRecebidos } = await this.supabase
      .from('payments')
      .select('amount')
      .eq('user_id', this.userId)
      .eq('status', 'paid')
      .eq('paid_date', hojeStr);

    const valorRecebido = pagamentosRecebidos?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // 5. Preview de amanhã
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().split('T')[0];

    let previsaoAmanha = {
      reunioes: 0,
      tarefas: 0,
      pagamentosVencendo: 0,
      valorVencendo: 0
    };

    if (params.incluirPreviewAmanha !== false) {
      const { count: reunioesAmanha } = await this.supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('date', amanhaStr)
        .eq('status', 'scheduled');

      const { count: tarefasAmanha } = await this.supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('due_date', amanhaStr)
        .in('status', ['todo', 'doing']);

      const { data: pagamentosAmanha } = await this.supabase
        .from('payments')
        .select('amount')
        .eq('user_id', this.userId)
        .eq('due_date', amanhaStr)
        .eq('status', 'pending');

      previsaoAmanha = {
        reunioes: reunioesAmanha || 0,
        tarefas: tarefasAmanha || 0,
        pagamentosVencendo: pagamentosAmanha?.length || 0,
        valorVencendo: pagamentosAmanha?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
      };
    }

    // 6. Destaques do dia
    const destaques: EncerramentoDia['destaques'] = [];

    if (reunioesRealizadas > 0) {
      destaques.push({
        tipo: 'positivo',
        descricao: `${reunioesRealizadas} reunião(ões) realizada(s)`
      });
    }

    if ((tarefasConcluidas?.length || 0) > 0) {
      destaques.push({
        tipo: 'positivo',
        descricao: `${tarefasConcluidas?.length} tarefa(s) concluída(s)`
      });
    }

    if (valorRecebido > 0) {
      destaques.push({
        tipo: 'positivo',
        descricao: `R$ ${valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} recebido(s)`
      });
    }

    if (reunioesNaoRealizadas.length > 0) {
      destaques.push({
        tipo: 'atencao',
        descricao: `${reunioesNaoRealizadas.length} reunião(ões) não realizada(s)`
      });
    }

    // 7. Score de produtividade
    let scoreProdutividade = 70; // Base
    
    if (reunioesRealizadas > 0) scoreProdutividade += 10;
    if ((tarefasConcluidas?.length || 0) >= 3) scoreProdutividade += 10;
    if (valorRecebido > 0) scoreProdutividade += 10;
    if (reunioesNaoRealizadas.length > 0) scoreProdutividade -= 10;
    if (tarefasNaoConcluidas.length > 3) scoreProdutividade -= 10;

    scoreProdutividade = Math.max(0, Math.min(100, scoreProdutividade));

    let nivelProdutividade: 'excelente' | 'bom' | 'regular' | 'abaixo' = 'bom';
    if (scoreProdutividade >= 90) nivelProdutividade = 'excelente';
    else if (scoreProdutividade >= 70) nivelProdutividade = 'bom';
    else if (scoreProdutividade >= 50) nivelProdutividade = 'regular';
    else nivelProdutividade = 'abaixo';

    // 8. Resumo do dia
    const resumoDia = `Hoje você realizou ${reunioesRealizadas} reunião(ões), ` +
      `concluiu ${tarefasConcluidas?.length || 0} tarefa(s)` +
      (valorRecebido > 0 ? ` e recebeu R$ ${valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '') +
      `. Produtividade: ${nivelProdutividade} (${scoreProdutividade}%).`;

    // 9. Mensagem final
    const hora = hoje.getHours();
    let mensagemFinal = 'Descanse bem! Amanhã é um novo dia. 🌙';
    if (hora < 18) {
      mensagemFinal = 'Bom trabalho hoje! Continue assim. 💪';
    }

    return {
      data: hojeStr,
      dataFormatada: hoje.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      }),
      horaExecucao: hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      realizacoes: {
        reunioesRealizadas,
        reunioesTotal: reunioes?.length || 0,
        tarefasConcluidas: tarefasConcluidas?.length || 0,
        tarefasTotal: (tarefasConcluidas?.length || 0) + tarefasNaoConcluidas.length,
        mensagensEnviadas: mensagensEnviadas || 0,
        pagamentosRecebidos: pagamentosRecebidos?.length || 0,
        valorRecebido
      },
      pendencias: {
        reunioesNaoRealizadas,
        tarefasNaoConcluidas,
        cobrancasNaoEnviadas: []
      },
      previsaoAmanha,
      destaques,
      resumoDia,
      mensagemFinal,
      produtividade: {
        score: scoreProdutividade,
        nivel: nivelProdutividade
      }
    };
  }

  // ==================== ONBOARDING CLIENTE ====================

  async prepararOnboarding(params: {
    clientId?: string;
    query?: string;
    primeiraReuniaoData?: string;
    primeiraReuniaoHorario?: string;
    valorMensal?: number;
    diaVencimento?: number;
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
      throw new Error('Informe o cliente para o onboarding.');
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

    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];

    // Sugerir data da primeira reunião (próximo dia útil)
    let sugestaoDataReuniao = params.primeiraReuniaoData;
    if (!sugestaoDataReuniao) {
      const proximoDiaUtil = new Date(hoje);
      proximoDiaUtil.setDate(proximoDiaUtil.getDate() + 1);
      while (proximoDiaUtil.getDay() === 0 || proximoDiaUtil.getDay() === 6) {
        proximoDiaUtil.setDate(proximoDiaUtil.getDate() + 1);
      }
      sugestaoDataReuniao = proximoDiaUtil.toISOString().split('T')[0];
    }

    // Tarefas iniciais padrão
    const tarefasIniciais = [
      {
        titulo: `Criar conta de anúncios - ${cliente.name}`,
        descricao: 'Configurar Business Manager, pixel e conta de anúncios',
        prazo: this.addDias(hojeStr, 2),
        prioridade: 'alta' as const
      },
      {
        titulo: `Coletar acessos - ${cliente.name}`,
        descricao: 'Solicitar acesso ao Instagram, Facebook, Google Analytics',
        prazo: this.addDias(hojeStr, 1),
        prioridade: 'alta' as const
      },
      {
        titulo: `Briefing inicial - ${cliente.name}`,
        descricao: 'Documentar público-alvo, diferenciais, objetivos',
        prazo: this.addDias(hojeStr, 3),
        prioridade: 'media' as const
      },
      {
        titulo: `Criar primeiras campanhas - ${cliente.name}`,
        descricao: 'Subir campanhas iniciais de teste',
        prazo: this.addDias(hojeStr, 5),
        prioridade: 'media' as const
      }
    ];

    // Primeira cobrança
    let primeiraCobranca;
    if (params.valorMensal || cliente.monthly_value) {
      const valor = params.valorMensal || Number(cliente.monthly_value);
      const diaVencimento = params.diaVencimento || cliente.due_day || 10;
      
      let vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimento);
      if (vencimento < hoje) {
        vencimento.setMonth(vencimento.getMonth() + 1);
      }

      primeiraCobranca = {
        criar: true,
        valor,
        vencimento: vencimento.toISOString().split('T')[0],
        descricao: 'Primeira mensalidade'
      };
    }

    // Lembretes
    const lembretes = [
      {
        mensagem: `Verificar configuração de pixel - ${cliente.name}`,
        data: this.addDias(hojeStr, 3)
      },
      {
        mensagem: `Follow-up primeira semana - ${cliente.name}`,
        data: this.addDias(hojeStr, 7)
      }
    ];

    // Checklist de informações
    const checklistInfo = [
      { item: 'Nome do negócio', preenchido: !!cliente.name, valor: cliente.name },
      { item: 'Segmento/Nicho', preenchido: !!cliente.segment, valor: cliente.segment },
      { item: 'Telefone de contato', preenchido: !!cliente.contact_phone, valor: cliente.contact_phone },
      { item: 'Valor mensal', preenchido: !!cliente.monthly_value, valor: cliente.monthly_value?.toString() },
      { item: 'Instagram', preenchido: !!cliente.instagram, valor: cliente.instagram }
    ];

    // Passos do onboarding
    const passos = [
      { ordem: 1, nome: 'Cadastro básico', descricao: 'Dados do cliente no sistema', status: 'concluido' as const, obrigatorio: true },
      { ordem: 2, nome: 'Primeira reunião', descricao: 'Alinhamento inicial', status: 'pendente' as const, obrigatorio: true },
      { ordem: 3, nome: 'Coleta de acessos', descricao: 'Obter credenciais necessárias', status: 'pendente' as const, obrigatorio: true },
      { ordem: 4, nome: 'Configuração técnica', descricao: 'Pixel, conta, BM', status: 'pendente' as const, obrigatorio: true },
      { ordem: 5, nome: 'Primeiras campanhas', descricao: 'Subir campanhas iniciais', status: 'pendente' as const, obrigatorio: true }
    ];

    const resumo = `Onboarding de ${cliente.name}: ${tarefasIniciais.length} tarefas iniciais, ` +
      `primeira reunião ${sugestaoDataReuniao ? `em ${new Date(sugestaoDataReuniao).toLocaleDateString('pt-BR')}` : 'a agendar'}` +
      (primeiraCobranca ? `, cobrança de R$ ${primeiraCobranca.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '') +
      `.`;

    const confirmationData: OnboardingCliente = {
      clientId,
      clientName: cliente.name,
      segment: cliente.segment || 'Não definido',
      dataOnboarding: hojeStr,
      passos,
      itensCriar: {
        tarefasIniciais,
        primeiraReuniao: {
          criar: true,
          sugestaoData: sugestaoDataReuniao,
          sugestaoHorario: params.primeiraReuniaoHorario || '14:00',
          pauta: 'Reunião inicial de alinhamento'
        },
        primeiraCobranca,
        lembretes
      },
      checklistInfo,
      proximosPassos: [
        'Confirmar reunião inicial com o cliente',
        'Coletar acessos às plataformas',
        'Documentar briefing completo'
      ],
      resumo
    };

    return {
      confirmation: {
        id: `onboarding_${Date.now()}`,
        type: 'onboarding_cliente',
        status: 'pending',
        data: confirmationData,
        toolToExecute: {
          id: `tool_${Date.now()}`,
          name: 'onboarding_cliente',
          parameters: params
        },
        createdAt: new Date()
      }
    };
  }

  async executarOnboarding(data: OnboardingCliente): Promise<{
    success: boolean;
    tarefasCriadas: number;
    reuniaoAgendada: boolean;
    cobrancaCriada: boolean;
    lembretesCriados: number;
    summary: string;
  }> {
    let tarefasCriadas = 0;
    let reuniaoAgendada = false;
    let cobrancaCriada = false;
    let lembretesCriados = 0;

    // 1. Criar tarefas iniciais
    for (const tarefa of data.itensCriar.tarefasIniciais) {
      const { error } = await this.supabase.from('tasks').insert({
        user_id: this.userId,
        client_id: data.clientId,
        title: tarefa.titulo,
        description: tarefa.descricao,
        due_date: tarefa.prazo,
        priority: tarefa.prioridade === 'alta' ? 'high' : 'medium',
        status: 'todo'
      });

      if (!error) tarefasCriadas++;
    }

    // 2. Criar primeira reunião
    if (data.itensCriar.primeiraReuniao.criar) {
      const { error } = await this.supabase.from('meetings').insert({
        user_id: this.userId,
        client_id: data.clientId,
        date: data.itensCriar.primeiraReuniao.sugestaoData,
        time: data.itensCriar.primeiraReuniao.sugestaoHorario,
        type: 'online',
        status: 'scheduled',
        notes: data.itensCriar.primeiraReuniao.pauta
      });

      if (!error) reuniaoAgendada = true;
    }

    // 3. Criar primeira cobrança
    if (data.itensCriar.primeiraCobranca?.criar) {
      const { error } = await this.supabase.from('payments').insert({
        user_id: this.userId,
        client_id: data.clientId,
        amount: data.itensCriar.primeiraCobranca.valor,
        due_date: data.itensCriar.primeiraCobranca.vencimento,
        status: 'pending',
        description: data.itensCriar.primeiraCobranca.descricao
      });

      if (!error) cobrancaCriada = true;
    }

    // 4. Criar lembretes
    for (const lembrete of data.itensCriar.lembretes) {
      const { error } = await this.supabase.from('reminders').insert({
        user_id: this.userId,
        client_id: data.clientId,
        message: lembrete.mensagem,
        remind_at: `${lembrete.data}T09:00:00`,
        status: 'pending'
      });

      if (!error) lembretesCriados++;
    }

    return {
      success: true,
      tarefasCriadas,
      reuniaoAgendada,
      cobrancaCriada,
      lembretesCriados,
      summary: `Onboarding de ${data.clientName} concluído! ` +
        `${tarefasCriadas} tarefas, ` +
        `${reuniaoAgendada ? '1 reunião' : '0 reuniões'}, ` +
        `${cobrancaCriada ? '1 cobrança' : '0 cobranças'}, ` +
        `${lembretesCriados} lembretes criados.`
    };
  }

  // ==================== HEALTH CHECK GERAL ====================

  async executarHealthCheck(params: {
    periodo?: '30dias' | '60dias' | '90dias';
    incluirRecomendacoes?: boolean;
  }): Promise<HealthCheckGeral> {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    
    // Período de análise
    const diasAtras = params.periodo === '90dias' ? 90 : params.periodo === '60dias' ? 60 : 30;
    const dataInicio = new Date(hoje);
    dataInicio.setDate(dataInicio.getDate() - diasAtras);
    const dataInicioStr = dataInicio.toISOString().split('T')[0];

    // 1. Visão Geral de Clientes
    const { data: todosClientes } = await this.supabase
      .from('clients')
      .select('id, status, monthly_value, created_at')
      .eq('user_id', this.userId);

    const totalClientes = todosClientes?.length || 0;
    const clientesAtivos = todosClientes?.filter(c => c.status === 'active').length || 0;
    const clientesPausados = todosClientes?.filter(c => c.status === 'paused').length || 0;
    const clientesInativos = todosClientes?.filter(c => c.status === 'inactive').length || 0;

    // Novos clientes no período
    const novosClientesMes = todosClientes?.filter(c => 
      new Date(c.created_at) >= dataInicio
    ).length || 0;

    // 2. Saúde Financeira
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    const inicioMes = `${mesAtual}-01`;
    const fimMes = `${mesAtual}-31`;

    const { data: pagamentosMes } = await this.supabase
      .from('payments')
      .select('amount, status, client_id, client:clients(name)')
      .eq('user_id', this.userId)
      .gte('due_date', inicioMes)
      .lte('due_date', fimMes);

    const faturamentoMes = pagamentosMes?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const recebidoMes = pagamentosMes?.filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    
    const inadimplencia = faturamentoMes > 0 
      ? Math.round(((faturamentoMes - recebidoMes) / faturamentoMes) * 100)
      : 0;

    const ticketMedio = clientesAtivos > 0
      ? todosClientes?.filter(c => c.status === 'active')
          .reduce((sum, c) => sum + (Number(c.monthly_value) || 0), 0) / clientesAtivos
      : 0;

    const mrr = todosClientes?.filter(c => c.status === 'active')
      .reduce((sum, c) => sum + (Number(c.monthly_value) || 0), 0) || 0;

    // Top clientes
    const topClientes = todosClientes
      ?.filter(c => c.status === 'active' && c.monthly_value)
      .sort((a, b) => Number(b.monthly_value) - Number(a.monthly_value))
      .slice(0, 3)
      .map(c => ({
        clientName: '',
        valor: Number(c.monthly_value),
        percentual: mrr > 0 ? Math.round((Number(c.monthly_value) / mrr) * 100) : 0
      })) || [];

    const concentracaoRisco = topClientes.length > 0 ? topClientes[0].percentual : 0;

    // Score financeiro
    let scoreFinanceiro = 100;
    if (inadimplencia > 30) scoreFinanceiro -= 40;
    else if (inadimplencia > 15) scoreFinanceiro -= 20;
    else if (inadimplencia > 5) scoreFinanceiro -= 10;

    if (concentracaoRisco > 40) scoreFinanceiro -= 15;
    else if (concentracaoRisco > 25) scoreFinanceiro -= 5;

    scoreFinanceiro = Math.max(0, scoreFinanceiro);

    // 3. Saúde Operacional
    const { data: tarefas } = await this.supabase
      .from('tasks')
      .select('id, status, due_date')
      .eq('user_id', this.userId)
      .gte('created_at', dataInicio.toISOString());

    const tarefasTotais = tarefas?.length || 0;
    const tarefasConcluidas = tarefas?.filter(t => t.status === 'done').length || 0;
    const tarefasAtrasadas = tarefas?.filter(t => 
      t.status !== 'done' && t.due_date && new Date(t.due_date) < hoje
    ).length || 0;
    const taxaConclusaoTarefas = tarefasTotais > 0 
      ? Math.round((tarefasConcluidas / tarefasTotais) * 100)
      : 100;

    const { data: reunioes } = await this.supabase
      .from('meetings')
      .select('id, status')
      .eq('user_id', this.userId)
      .gte('date', dataInicioStr);

    const reunioesRealizadas = reunioes?.filter(r => r.status === 'completed').length || 0;
    const reunioesCanceladas = reunioes?.filter(r => r.status === 'cancelled').length || 0;
    const taxaRealizacao = (reunioes?.length || 0) > 0
      ? Math.round((reunioesRealizadas / (reunioes?.length || 1)) * 100)
      : 100;

    // Score operacional
    let scoreOperacional = 100;
    if (taxaConclusaoTarefas < 50) scoreOperacional -= 30;
    else if (taxaConclusaoTarefas < 70) scoreOperacional -= 15;
    
    if (taxaRealizacao < 70) scoreOperacional -= 20;
    else if (taxaRealizacao < 85) scoreOperacional -= 10;

    if (tarefasAtrasadas > 10) scoreOperacional -= 15;
    else if (tarefasAtrasadas > 5) scoreOperacional -= 10;

    scoreOperacional = Math.max(0, scoreOperacional);

    // 4. Distribuição de Clientes por Saúde
    // Simplificado - em produção, calcular health score de cada cliente
    const distribuicaoClientes = {
      saudaveis: { 
        quantidade: Math.round(clientesAtivos * 0.7), 
        percentual: 70 
      },
      atencao: { 
        quantidade: Math.round(clientesAtivos * 0.2), 
        percentual: 20 
      },
      criticos: { 
        quantidade: Math.round(clientesAtivos * 0.1), 
        percentual: 10 
      }
    };

    // 5. Top Alertas
    const topAlertas: HealthCheckGeral['topAlertas'] = [];

    if (inadimplencia > 15) {
      topAlertas.push({
        prioridade: 'critica',
        categoria: 'financeiro',
        titulo: 'Inadimplência elevada',
        descricao: `Taxa de inadimplência em ${inadimplencia}%`,
        impacto: `R$ ${(faturamentoMes - recebidoMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} não recebido`,
        acaoSugerida: 'Enviar cobranças para clientes em atraso'
      });
    }

    if (concentracaoRisco > 30) {
      topAlertas.push({
        prioridade: 'alta',
        categoria: 'financeiro',
        titulo: 'Alta concentração de receita',
        descricao: `${concentracaoRisco}% da receita vem de 1 cliente`,
        impacto: 'Risco alto em caso de churn',
        acaoSugerida: 'Diversificar base de clientes'
      });
    }

    if (tarefasAtrasadas > 5) {
      topAlertas.push({
        prioridade: 'alta',
        categoria: 'operacional',
        titulo: 'Tarefas atrasadas acumuladas',
        descricao: `${tarefasAtrasadas} tarefas com prazo vencido`,
        impacto: 'Qualidade do serviço comprometida',
        acaoSugerida: 'Revisar prioridades e prazos'
      });
    }

    // 6. Comparativo com período anterior
    // Simplificado
    const comparativo = {
      faturamento: { atual: faturamentoMes, anterior: faturamentoMes * 0.9, variacao: 10 },
      clientes: { atual: clientesAtivos, anterior: clientesAtivos - novosClientesMes, variacao: novosClientesMes },
      inadimplencia: { atual: inadimplencia, anterior: inadimplencia + 5, variacao: -5 },
      produtividade: { atual: taxaConclusaoTarefas, anterior: taxaConclusaoTarefas - 5, variacao: 5 }
    };

    // 7. Recomendações
    const recomendacoes: HealthCheckGeral['recomendacoes'] = [];

    if (params.incluirRecomendacoes !== false) {
      if (inadimplencia > 10) {
        recomendacoes.push({
          prioridade: 'alta',
          area: 'Financeiro',
          recomendacao: 'Implementar régua de cobrança automatizada',
          impactoEsperado: 'Reduzir inadimplência em 50%',
          prazoSugerido: '15 dias'
        });
      }

      if (novosClientesMes === 0) {
        recomendacoes.push({
          prioridade: 'media',
          area: 'Comercial',
          recomendacao: 'Desenvolver estratégia de prospecção ativa',
          impactoEsperado: 'Aumentar base de clientes',
          prazoSugerido: '30 dias'
        });
      }

      recomendacoes.push({
        prioridade: 'baixa',
        area: 'Operacional',
        recomendacao: 'Automatizar relatórios mensais para clientes',
        impactoEsperado: 'Economizar 2h/mês por cliente',
        prazoSugerido: '60 dias'
      });
    }

    // 8. Score Geral e Status
    const scoreGeral = Math.round((scoreFinanceiro + scoreOperacional) / 2);
    
    let statusGeral: 'excelente' | 'bom' | 'atencao' | 'critico' = 'bom';
    if (scoreGeral >= 85) statusGeral = 'excelente';
    else if (scoreGeral >= 70) statusGeral = 'bom';
    else if (scoreGeral >= 50) statusGeral = 'atencao';
    else statusGeral = 'critico';

    let statusFinanceiro: 'excelente' | 'bom' | 'atencao' | 'critico' = 'bom';
    if (scoreFinanceiro >= 85) statusFinanceiro = 'excelente';
    else if (scoreFinanceiro >= 70) statusFinanceiro = 'bom';
    else if (scoreFinanceiro >= 50) statusFinanceiro = 'atencao';
    else statusFinanceiro = 'critico';

    let statusOperacional: 'excelente' | 'bom' | 'atencao' | 'critico' = 'bom';
    if (scoreOperacional >= 85) statusOperacional = 'excelente';
    else if (scoreOperacional >= 70) statusOperacional = 'bom';
    else if (scoreOperacional >= 50) statusOperacional = 'atencao';
    else statusOperacional = 'critico';

    // 9. Resumo Executivo
    const resumoExecutivo = `Operação com ${totalClientes} clientes (${clientesAtivos} ativos). ` +
      `MRR: R$ ${mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. ` +
      `Inadimplência: ${inadimplencia}%. ` +
      `Score geral: ${scoreGeral}/100 (${statusGeral}). ` +
      `${topAlertas.length} alerta(s) prioritário(s).`;

    return {
      dataAnalise: hojeStr,
      periodo: `Últimos ${diasAtras} dias`,
      visaoGeral: {
        totalClientes,
        clientesAtivos,
        clientesPausados,
        clientesInativos,
        novosClientesMes,
        churnMes: 0
      },
      saudeFinanceira: {
        score: scoreFinanceiro,
        status: statusFinanceiro,
        faturamentoMes,
        recebidoMes,
        inadimplencia,
        ticketMedio,
        mrr,
        topClientes,
        concentracaoRisco
      },
      saudeOperacional: {
        score: scoreOperacional,
        status: statusOperacional,
        tarefas: {
          totais: tarefasTotais,
          concluidas: tarefasConcluidas,
          atrasadas: tarefasAtrasadas,
          taxaConclusao: taxaConclusaoTarefas
        },
        reunioes: {
          realizadas: reunioesRealizadas,
          canceladas: reunioesCanceladas,
          taxaRealizacao
        },
        comunicacao: {
          mensagensEnviadas: 0,
          mediaContatoCliente: 7,
          clientesSemContato30Dias: 0
        }
      },
      distribuicaoClientes,
      topAlertas,
      comparativo,
      recomendacoes,
      resumoExecutivo,
      scoreGeral,
      statusGeral
    };
  }

  // ==================== HELPERS ====================

  private addDias(data: string, dias: number): string {
    const novaData = new Date(data);
    novaData.setDate(novaData.getDate() + dias);
    return novaData.toISOString().split('T')[0];
  }
}

export default MetaActionsExecutor;
```

---

**Continua na Parte 6: Integração Final...**
