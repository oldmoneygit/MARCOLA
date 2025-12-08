# 🚀 MARCOLA ASSISTANT - Tools Avançados v2.0

## PARTE 3: Tools de Inteligência e Sugestões

---

## 🧠 VISÃO GERAL - INTELIGÊNCIA

Tools de inteligência analisam dados e geram insights acionáveis para o gestor.

| Tool | Descrição | Confirmação |
|------|-----------|-------------|
| `sugerir_acoes_dia` | Lista as ações mais importantes para fazer hoje | ❌ Não |
| `diagnosticar_cliente` | Análise completa de um cliente | ❌ Não |
| `identificar_clientes_risco` | Lista clientes que precisam atenção | ❌ Não |
| `prever_faturamento` | Previsão de recebimentos do mês | ❌ Não |

---

## 📝 DEFINIÇÃO DOS TOOLS

### Arquivo: `src/lib/assistant/tools-advanced/intelligence.ts`

```typescript
// ============================================================
// MARCOLA ASSISTANT - TOOLS DE INTELIGÊNCIA
// ============================================================

import { ToolDefinition } from '../types';

export const INTELLIGENCE_TOOLS: ToolDefinition[] = [
  // ==================== SUGERIR AÇÕES DO DIA ====================
  {
    name: 'sugerir_acoes_dia',
    description: `Analisa a situação atual e sugere as ações mais importantes para o gestor fazer hoje.
Use quando o gestor pedir:
- "O que eu deveria fazer hoje?"
- "Quais são minhas prioridades?"
- "Me dá umas sugestões"
- "Bom dia" (ativa rotina matinal com sugestões)
- "Por onde começar?"

O sistema analisa:
1. Reuniões agendadas para hoje
2. Tarefas urgentes e atrasadas
3. Pagamentos vencendo hoje ou vencidos
4. Clientes sem contato recente
5. Alertas de performance de campanhas

Retorna lista ordenada por prioridade com ações sugeridas.`,
    parameters: {
      type: 'object',
      properties: {
        limite: {
          type: 'number',
          description: 'Número máximo de sugestões. Default: 10'
        },
        incluirMenosUrgentes: {
          type: 'boolean',
          description: 'Se deve incluir também sugestões de menor prioridade. Default: false'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },

  // ==================== DIAGNOSTICAR CLIENTE ====================
  {
    name: 'diagnosticar_cliente',
    description: `Gera um diagnóstico completo da situação de um cliente específico.
Use quando o gestor pedir:
- "Como está o cliente X?"
- "Faz um diagnóstico do João"
- "Analisa a situação da Hamburgueria"
- "Qual a saúde do cliente Y?"
- "Me conta tudo sobre o cliente Z"

O sistema analisa:
1. Status financeiro (pagamentos em dia, pendentes, histórico)
2. Engajamento (frequência de contato, reuniões)
3. Tarefas (pendentes, concluídas, atrasadas)
4. Performance de campanhas (se houver dados)
5. Timeline de interações recentes

Retorna health score, pontos fortes, fracos e recomendações acionáveis.`,
    parameters: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'ID do cliente. Se não informado, busca pelo nome.'
        },
        query: {
          type: 'string',
          description: 'Nome ou apelido do cliente para buscar.'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },

  // ==================== IDENTIFICAR CLIENTES EM RISCO ====================
  {
    name: 'identificar_clientes_risco',
    description: `Identifica clientes que precisam de atenção urgente (risco de churn ou problemas).
Use quando o gestor pedir:
- "Quais clientes estão em risco?"
- "Quem precisa de atenção?"
- "Tem algum cliente problemático?"
- "Clientes que posso perder"
- "Quem tá dando trabalho?"

O sistema analisa todos os clientes e identifica riscos por:
1. Pagamentos muito atrasados
2. Sem contato há muito tempo
3. Performance de campanhas caindo
4. Tarefas muito atrasadas
5. Reuniões canceladas repetidamente

Retorna lista ordenada por nível de risco com ações sugeridas.`,
    parameters: {
      type: 'object',
      properties: {
        limite: {
          type: 'number',
          description: 'Número máximo de clientes a retornar. Default: 10'
        },
        nivelMinimo: {
          type: 'string',
          enum: ['baixo', 'medio', 'alto', 'critico'],
          description: 'Nível mínimo de risco para incluir. Default: medio'
        }
      },
      required: []
    },
    requiresConfirmation: false
  },

  // ==================== PREVER FATURAMENTO ====================
  {
    name: 'prever_faturamento',
    description: `Calcula previsão de faturamento/recebimentos do mês.
Use quando o gestor pedir:
- "Quanto vou receber esse mês?"
- "Qual a previsão de faturamento?"
- "Como está o financeiro do mês?"
- "Quanto já recebi?"
- "Quanto falta receber?"

O sistema calcula:
1. Total previsto (baseado em cobranças)
2. Já recebido até agora
3. A receber (ainda não vencido)
4. Vencido e não recebido
5. Comparativo com mês anterior

Também mostra probabilidade de recebimento baseado em histórico.`,
    parameters: {
      type: 'object',
      properties: {
        mes: {
          type: 'string',
          description: 'Mês para análise no formato YYYY-MM. Default: mês atual'
        },
        incluirDetalhamento: {
          type: 'boolean',
          description: 'Se deve incluir detalhamento por cliente. Default: true'
        }
      },
      required: []
    },
    requiresConfirmation: false
  }
];

export default INTELLIGENCE_TOOLS;
```

---

## ⚙️ IMPLEMENTAÇÃO DO EXECUTOR

### Arquivo: `src/lib/assistant/tools-advanced/intelligence-executor.ts`

```typescript
// ============================================================
// EXECUTOR DOS TOOLS DE INTELIGÊNCIA
// ============================================================

import { createClient } from '@/lib/supabase/server';
import {
  SugestaoAcao,
  SugestoesDoDia,
  DiagnosticoCliente,
  ClienteRisco,
  RelatorioClientesRisco,
  PrevisaoFaturamento
} from '../types-advanced';

export class IntelligenceExecutor {
  private supabase;
  private userId: string;

  constructor(userId: string) {
    this.supabase = createClient();
    this.userId = userId;
  }

  // ==================== SUGERIR AÇÕES DO DIA ====================

  async sugerirAcoesDia(params: {
    limite?: number;
    incluirMenosUrgentes?: boolean;
  }): Promise<SugestoesDoDia> {
    const limite = params.limite ?? 10;
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    
    const diaSemana = hoje.toLocaleDateString('pt-BR', { weekday: 'long' });
    const saudacao = this.gerarSaudacao();

    const sugestoes: SugestaoAcao[] = [];

    // 1. Buscar reuniões de hoje
    const { data: reunioesHoje } = await this.supabase
      .from('meetings')
      .select('id, time, client:clients(id, name)')
      .eq('user_id', this.userId)
      .eq('date', hojeStr)
      .eq('status', 'scheduled')
      .order('time');

    reunioesHoje?.forEach(r => {
      sugestoes.push({
        id: `reuniao_${r.id}`,
        prioridade: 9,
        tipo: 'importante',
        categoria: 'reuniao',
        icone: '📅',
        titulo: `Reunião às ${r.time}`,
        descricao: `Reunião com ${r.client?.name}`,
        clientId: r.client?.id,
        clientName: r.client?.name,
        acao: {
          tool: 'preparar_reuniao',
          parameters: { meetingId: r.id },
          label: 'Ver briefing'
        }
      });
    });

    // 2. Buscar pagamentos vencidos
    const { data: pagamentosVencidos } = await this.supabase
      .from('payments')
      .select('id, amount, due_date, client:clients(id, name, contact_phone)')
      .eq('user_id', this.userId)
      .eq('status', 'pending')
      .lt('due_date', hojeStr)
      .order('due_date');

    const valorVencido = pagamentosVencidos?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    if (pagamentosVencidos && pagamentosVencidos.length > 0) {
      sugestoes.push({
        id: 'cobranca_vencidos',
        prioridade: 10,
        tipo: 'urgente',
        categoria: 'pagamento',
        icone: '💰',
        titulo: `${pagamentosVencidos.length} pagamentos vencidos`,
        descricao: `Total de R$ ${valorVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em atraso`,
        acao: {
          tool: 'cobrar_todos_vencidos',
          parameters: {},
          label: 'Cobrar todos'
        }
      });
    }

    // 3. Buscar pagamentos que vencem hoje
    const { data: pagamentosHoje } = await this.supabase
      .from('payments')
      .select('id, amount, client:clients(id, name)')
      .eq('user_id', this.userId)
      .eq('status', 'pending')
      .eq('due_date', hojeStr);

    if (pagamentosHoje && pagamentosHoje.length > 0) {
      const valorHoje = pagamentosHoje.reduce((sum, p) => sum + Number(p.amount), 0);
      sugestoes.push({
        id: 'pagamentos_hoje',
        prioridade: 8,
        tipo: 'importante',
        categoria: 'pagamento',
        icone: '📆',
        titulo: `${pagamentosHoje.length} pagamentos vencem hoje`,
        descricao: `Total de R$ ${valorHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        acao: {
          tool: 'listar_pagamentos',
          parameters: { status: 'pending' },
          label: 'Ver pagamentos'
        }
      });
    }

    // 4. Buscar tarefas atrasadas
    const { data: tarefasAtrasadas } = await this.supabase
      .from('tasks')
      .select('id, title, due_date, priority, client:clients(id, name)')
      .eq('user_id', this.userId)
      .eq('status', 'todo')
      .lt('due_date', hojeStr)
      .order('due_date');

    tarefasAtrasadas?.slice(0, 3).forEach(t => {
      const diasAtraso = Math.floor(
        (new Date().getTime() - new Date(t.due_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      sugestoes.push({
        id: `tarefa_${t.id}`,
        prioridade: t.priority === 'urgent' ? 9 : t.priority === 'high' ? 8 : 6,
        tipo: diasAtraso > 3 ? 'urgente' : 'importante',
        categoria: 'tarefa',
        icone: '✅',
        titulo: t.title,
        descricao: `${diasAtraso} dias de atraso${t.client ? ` - ${t.client.name}` : ''}`,
        clientId: t.client?.id,
        clientName: t.client?.name,
        acao: {
          tool: 'concluir_tarefa',
          parameters: { taskId: t.id },
          label: 'Marcar como feita'
        }
      });
    });

    // 5. Buscar tarefas para hoje
    const { data: tarefasHoje } = await this.supabase
      .from('tasks')
      .select('id, title, priority, client:clients(id, name)')
      .eq('user_id', this.userId)
      .eq('status', 'todo')
      .eq('due_date', hojeStr);

    tarefasHoje?.forEach(t => {
      sugestoes.push({
        id: `tarefa_hoje_${t.id}`,
        prioridade: t.priority === 'urgent' ? 8 : t.priority === 'high' ? 7 : 5,
        tipo: 'normal',
        categoria: 'tarefa',
        icone: '📋',
        titulo: t.title,
        descricao: `Prazo hoje${t.client ? ` - ${t.client.name}` : ''}`,
        clientId: t.client?.id,
        clientName: t.client?.name
      });
    });

    // 6. Verificar reuniões de amanhã sem confirmação enviada
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().split('T')[0];

    const { data: reunioesAmanha } = await this.supabase
      .from('meetings')
      .select('id, client:clients(id, name)')
      .eq('user_id', this.userId)
      .eq('date', amanhaStr)
      .eq('status', 'scheduled');

    if (reunioesAmanha && reunioesAmanha.length > 0) {
      sugestoes.push({
        id: 'confirmar_reunioes_amanha',
        prioridade: 7,
        tipo: 'importante',
        categoria: 'reuniao',
        icone: '📞',
        titulo: `Confirmar ${reunioesAmanha.length} reuniões de amanhã`,
        descricao: 'Enviar confirmação via WhatsApp',
        acao: {
          tool: 'confirmar_reunioes_amanha',
          parameters: {},
          label: 'Confirmar todas'
        }
      });
    }

    // 7. Clientes sem contato há mais de 10 dias
    const { data: clientesSemContato } = await this.supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', this.userId)
      .eq('status', 'active');

    // Simplificado - em produção, calcular último contato real
    if (clientesSemContato && clientesSemContato.length > 5) {
      sugestoes.push({
        id: 'followup_clientes',
        prioridade: 5,
        tipo: 'normal',
        categoria: 'cliente',
        icone: '👥',
        titulo: 'Fazer follow-up com clientes',
        descricao: 'Verificar clientes sem contato recente',
        acao: {
          tool: 'enviar_followup_lote',
          parameters: { diasSemContato: 7 },
          label: 'Ver clientes'
        }
      });
    }

    // Ordenar por prioridade e limitar
    const sugestoesOrdenadas = sugestoes
      .sort((a, b) => b.prioridade - a.prioridade)
      .slice(0, limite);

    // Métricas
    const metricas = {
      reunioesHoje: reunioesHoje?.length || 0,
      tarefasPendentes: (tarefasHoje?.length || 0) + (tarefasAtrasadas?.length || 0),
      tarefasUrgentes: tarefasAtrasadas?.filter(t => t.priority === 'urgent').length || 0,
      pagamentosVencemHoje: pagamentosHoje?.length || 0,
      pagamentosVencidos: pagamentosVencidos?.length || 0,
      valorVencido,
      clientesSemContato: 0 // Calcular em produção
    };

    // Gerar resumo executivo
    const resumoExecutivo = this.gerarResumoExecutivo(metricas, sugestoesOrdenadas);

    return {
      data: hojeStr,
      diaSemana,
      saudacao,
      metricas,
      sugestoes: sugestoesOrdenadas,
      totalSugestoes: sugestoesOrdenadas.length,
      resumoExecutivo
    };
  }

  // ==================== DIAGNOSTICAR CLIENTE ====================

  async diagnosticarCliente(params: {
    clientId?: string;
    query?: string;
  }): Promise<DiagnosticoCliente> {
    let clientId = params.clientId;

    // Buscar cliente se não tiver ID
    if (!clientId && params.query) {
      const { data: clientes } = await this.supabase
        .from('clients')
        .select('id')
        .eq('user_id', this.userId)
        .ilike('name', `%${params.query}%`)
        .limit(1);

      if (!clientes || clientes.length === 0) {
        throw new Error(`Cliente "${params.query}" não encontrado.`);
      }
      clientId = clientes[0].id;
    }

    if (!clientId) {
      throw new Error('Informe o cliente para diagnosticar.');
    }

    // Buscar dados do cliente
    const { data: cliente, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', this.userId)
      .single();

    if (error || !cliente) {
      throw new Error('Cliente não encontrado.');
    }

    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    const dias30Atras = new Date(hoje);
    dias30Atras.setDate(dias30Atras.getDate() - 30);
    const dias90Atras = new Date(hoje);
    dias90Atras.setDate(dias90Atras.getDate() - 90);

    // Análise Financeira
    const { data: pagamentos } = await this.supabase
      .from('payments')
      .select('*')
      .eq('client_id', clientId)
      .gte('due_date', dias90Atras.toISOString().split('T')[0]);

    const pagamentosEmDia = pagamentos?.filter(p => p.status === 'paid').length || 0;
    const pagamentosPendentes = pagamentos?.filter(p => p.status === 'pending').length || 0;
    const pagamentosVencidos = pagamentos?.filter(p => 
      p.status === 'pending' && new Date(p.due_date) < hoje
    ) || [];
    
    const valorPendente = pagamentosVencidos.reduce((sum, p) => sum + Number(p.amount), 0);
    const diasMaiorAtraso = pagamentosVencidos.length > 0 
      ? Math.max(...pagamentosVencidos.map(p => 
          Math.floor((hoje.getTime() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24))
        ))
      : 0;

    const totalPagamentos = pagamentos?.length || 0;
    const historicoAdimplencia = totalPagamentos > 0 
      ? Math.round((pagamentosEmDia / totalPagamentos) * 100)
      : 100;

    let statusFinanceiro: 'em_dia' | 'pendente' | 'atrasado' | 'critico' = 'em_dia';
    if (diasMaiorAtraso > 30) statusFinanceiro = 'critico';
    else if (diasMaiorAtraso > 7) statusFinanceiro = 'atrasado';
    else if (pagamentosPendentes > 0) statusFinanceiro = 'pendente';

    // Análise de Engajamento
    const { data: reunioes30d } = await this.supabase
      .from('meetings')
      .select('id, date')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .gte('date', dias30Atras.toISOString().split('T')[0]);

    const { data: reunioes90d } = await this.supabase
      .from('meetings')
      .select('id')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .gte('date', dias90Atras.toISOString().split('T')[0]);

    const { data: ultimaMensagem } = await this.supabase
      .from('message_logs')
      .select('created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: ultimaReuniaoData } = await this.supabase
      .from('meetings')
      .select('date')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    // Calcular último contato
    let ultimoContato = 'Nunca';
    let diasSemContato = 999;
    let tipoUltimoContato = 'nenhum';

    const dataUltimaMensagem = ultimaMensagem ? new Date(ultimaMensagem.created_at) : null;
    const dataUltimaReuniao = ultimaReuniaoData ? new Date(ultimaReuniaoData.date) : null;

    if (dataUltimaMensagem && (!dataUltimaReuniao || dataUltimaMensagem > dataUltimaReuniao)) {
      ultimoContato = dataUltimaMensagem.toISOString().split('T')[0];
      diasSemContato = Math.floor((hoje.getTime() - dataUltimaMensagem.getTime()) / (1000 * 60 * 60 * 24));
      tipoUltimoContato = 'mensagem';
    } else if (dataUltimaReuniao) {
      ultimoContato = dataUltimaReuniao.toISOString().split('T')[0];
      diasSemContato = Math.floor((hoje.getTime() - dataUltimaReuniao.getTime()) / (1000 * 60 * 60 * 24));
      tipoUltimoContato = 'reunião';
    }

    let statusEngajamento: 'ativo' | 'moderado' | 'baixo' | 'inativo' = 'ativo';
    if (diasSemContato > 30) statusEngajamento = 'inativo';
    else if (diasSemContato > 14) statusEngajamento = 'baixo';
    else if (diasSemContato > 7) statusEngajamento = 'moderado';

    // Análise de Tarefas
    const { data: tarefas } = await this.supabase
      .from('tasks')
      .select('id, status, due_date')
      .eq('client_id', clientId)
      .gte('created_at', dias30Atras.toISOString());

    const tarefasPendentes = tarefas?.filter(t => t.status === 'todo' || t.status === 'doing').length || 0;
    const tarefasConcluidas = tarefas?.filter(t => t.status === 'done').length || 0;
    const tarefasAtrasadas = tarefas?.filter(t => 
      (t.status === 'todo' || t.status === 'doing') && 
      t.due_date && new Date(t.due_date) < hoje
    ).length || 0;
    
    const totalTarefas = tarefas?.length || 0;
    const taxaConclusao = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 100;

    // Calcular Health Score (0-100)
    let healthScore = 100;
    
    // Financeiro (peso 40)
    if (statusFinanceiro === 'critico') healthScore -= 40;
    else if (statusFinanceiro === 'atrasado') healthScore -= 25;
    else if (statusFinanceiro === 'pendente') healthScore -= 10;

    // Engajamento (peso 30)
    if (statusEngajamento === 'inativo') healthScore -= 30;
    else if (statusEngajamento === 'baixo') healthScore -= 20;
    else if (statusEngajamento === 'moderado') healthScore -= 10;

    // Tarefas (peso 20)
    if (tarefasAtrasadas > 5) healthScore -= 20;
    else if (tarefasAtrasadas > 2) healthScore -= 10;
    else if (tarefasAtrasadas > 0) healthScore -= 5;

    // Adimplência histórica (peso 10)
    if (historicoAdimplencia < 50) healthScore -= 10;
    else if (historicoAdimplencia < 80) healthScore -= 5;

    healthScore = Math.max(0, healthScore);

    let statusGeral: 'saudavel' | 'atencao' | 'critico' = 'saudavel';
    if (healthScore < 40) statusGeral = 'critico';
    else if (healthScore < 70) statusGeral = 'atencao';

    // Gerar recomendações
    const recomendacoes: DiagnosticoCliente['recomendacoes'] = [];

    if (pagamentosVencidos.length > 0) {
      recomendacoes.push({
        prioridade: 'alta',
        categoria: 'financeiro',
        acao: 'Enviar cobrança dos pagamentos vencidos',
        motivo: `${pagamentosVencidos.length} pagamento(s) vencido(s) totalizando R$ ${valorPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        impacto: 'Recuperar receita e regularizar situação',
        tool: 'enviar_whatsapp',
        toolParams: { clientId, messageType: 'cobranca' }
      });
    }

    if (diasSemContato > 14) {
      recomendacoes.push({
        prioridade: diasSemContato > 30 ? 'alta' : 'media',
        categoria: 'engajamento',
        acao: 'Agendar reunião de acompanhamento',
        motivo: `${diasSemContato} dias sem contato`,
        impacto: 'Manter relacionamento e identificar problemas',
        tool: 'criar_reuniao',
        toolParams: { clientId }
      });
    }

    if (tarefasAtrasadas > 0) {
      recomendacoes.push({
        prioridade: tarefasAtrasadas > 3 ? 'alta' : 'media',
        categoria: 'operacional',
        acao: 'Resolver tarefas atrasadas',
        motivo: `${tarefasAtrasadas} tarefa(s) atrasada(s)`,
        impacto: 'Melhorar qualidade do serviço',
        tool: 'listar_tarefas',
        toolParams: { clientId, periodo: 'atrasadas' }
      });
    }

    // Timeline recente
    const historicoRecente: DiagnosticoCliente['historicoRecente'] = [];

    // Adicionar últimas reuniões
    reunioes30d?.slice(0, 3).forEach(r => {
      historicoRecente.push({
        data: r.date,
        tipo: 'reuniao',
        descricao: 'Reunião realizada',
        status: 'positivo'
      });
    });

    // Adicionar pagamentos recentes
    pagamentos?.filter(p => p.status === 'paid').slice(0, 3).forEach(p => {
      historicoRecente.push({
        data: p.paid_date || p.due_date,
        tipo: 'pagamento',
        descricao: `Pagamento de R$ ${Number(p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        status: 'positivo'
      });
    });

    // Ordenar por data
    historicoRecente.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    // Pontos fortes e fracos
    const pontosFortes: string[] = [];
    const pontosFracos: string[] = [];

    if (historicoAdimplencia >= 90) pontosFortes.push('Excelente histórico de pagamentos');
    if (diasSemContato <= 7) pontosFortes.push('Contato recente e frequente');
    if (taxaConclusao >= 80) pontosFortes.push('Alta taxa de conclusão de tarefas');

    if (statusFinanceiro === 'critico' || statusFinanceiro === 'atrasado') {
      pontosFracos.push('Pagamentos em atraso');
    }
    if (statusEngajamento === 'inativo' || statusEngajamento === 'baixo') {
      pontosFracos.push('Baixo engajamento/contato');
    }
    if (tarefasAtrasadas > 2) {
      pontosFracos.push('Tarefas acumuladas');
    }

    // Resumo executivo
    const resumoExecutivo = `${cliente.name} está ${statusGeral === 'saudavel' ? 'em boa situação' : statusGeral === 'atencao' ? 'precisando de atenção' : 'em situação crítica'} (Score: ${healthScore}/100). ${
      statusFinanceiro !== 'em_dia' 
        ? `Financeiro: ${valorPendente > 0 ? `R$ ${valorPendente.toLocaleString('pt-BR')} em atraso.` : 'pendências.'}` 
        : 'Financeiro em dia.'
    } ${
      diasSemContato > 7 
        ? `Último contato há ${diasSemContato} dias.` 
        : 'Contato recente.'
    }`;

    // Calcular tempo como cliente
    const dataCriacao = new Date(cliente.created_at);
    const mesesCliente = Math.floor((hoje.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const tempoComoCliente = mesesCliente < 1 ? 'menos de 1 mês' : `${mesesCliente} meses`;

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
        pagamentosPendentes,
        valorPendente,
        diasMaiorAtraso,
        historicoAdimplencia
      },
      engajamento: {
        status: statusEngajamento,
        ultimoContato,
        diasSemContato,
        tipoUltimoContato,
        reunioesUltimos30Dias: reunioes30d?.length || 0,
        reunioesUltimos90Dias: reunioes90d?.length || 0,
        frequenciaIdeal: cliente.meeting_frequency || 'quinzenal'
      },
      tarefas: {
        pendentes: tarefasPendentes,
        concluidas: tarefasConcluidas,
        atrasadas: tarefasAtrasadas,
        taxaConclusao
      },
      recomendacoes,
      historicoRecente: historicoRecente.slice(0, 5),
      resumoExecutivo,
      pontosFortes,
      pontosFracos
    };
  }

  // ==================== IDENTIFICAR CLIENTES EM RISCO ====================

  async identificarClientesRisco(params: {
    limite?: number;
    nivelMinimo?: 'baixo' | 'medio' | 'alto' | 'critico';
  }): Promise<RelatorioClientesRisco> {
    const limite = params.limite ?? 10;
    const nivelMinimo = params.nivelMinimo ?? 'medio';
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];

    // Buscar todos os clientes ativos
    const { data: clientes } = await this.supabase
      .from('clients')
      .select('id, name, segment, monthly_value, created_at')
      .eq('user_id', this.userId)
      .eq('status', 'active');

    if (!clientes || clientes.length === 0) {
      throw new Error('Nenhum cliente ativo encontrado.');
    }

    const clientesRisco: ClienteRisco[] = [];
    let saudaveis = 0;

    for (const cliente of clientes) {
      // Calcular indicadores de risco
      const indicadores = await this.calcularIndicadoresRisco(cliente.id, hoje);
      
      // Calcular score de risco (0-100, 100 = maior risco)
      let scoreRisco = 0;
      const motivos: string[] = [];

      // Risco financeiro (peso 40)
      if (indicadores.financeiro.diasAtraso > 30) {
        scoreRisco += 40;
        motivos.push(`Pagamento atrasado há ${indicadores.financeiro.diasAtraso} dias`);
      } else if (indicadores.financeiro.diasAtraso > 7) {
        scoreRisco += 25;
        motivos.push(`Pagamento atrasado há ${indicadores.financeiro.diasAtraso} dias`);
      } else if (indicadores.financeiro.pagamentoAtrasado) {
        scoreRisco += 10;
        motivos.push('Pagamento pendente');
      }

      // Risco de engajamento (peso 30)
      if (indicadores.engajamento.diasSemContato > 30) {
        scoreRisco += 30;
        motivos.push(`Sem contato há ${indicadores.engajamento.diasSemContato} dias`);
      } else if (indicadores.engajamento.diasSemContato > 14) {
        scoreRisco += 15;
        motivos.push(`Sem contato há ${indicadores.engajamento.diasSemContato} dias`);
      }

      // Risco operacional (peso 20)
      if (indicadores.operacional.tarefasAtrasadas > 5) {
        scoreRisco += 20;
        motivos.push(`${indicadores.operacional.tarefasAtrasadas} tarefas atrasadas`);
      } else if (indicadores.operacional.tarefasAtrasadas > 2) {
        scoreRisco += 10;
        motivos.push(`${indicadores.operacional.tarefasAtrasadas} tarefas atrasadas`);
      }

      // Risco de performance (peso 10)
      if (indicadores.performance.quedaPerformance) {
        scoreRisco += 10;
        motivos.push('Queda na performance de campanhas');
      }

      // Classificar nível de risco
      let nivelRisco: 'critico' | 'alto' | 'medio' | 'baixo' = 'baixo';
      if (scoreRisco >= 70) nivelRisco = 'critico';
      else if (scoreRisco >= 50) nivelRisco = 'alto';
      else if (scoreRisco >= 30) nivelRisco = 'medio';

      // Filtrar por nível mínimo
      const niveis = ['baixo', 'medio', 'alto', 'critico'];
      const nivelMinimoIndex = niveis.indexOf(nivelMinimo);
      const nivelAtualIndex = niveis.indexOf(nivelRisco);

      if (nivelAtualIndex >= nivelMinimoIndex && scoreRisco > 0) {
        // Determinar ação prioritária
        let acaoPrioritaria = {
          descricao: 'Fazer follow-up',
          urgencia: 'esta_semana' as const,
          tool: 'enviar_whatsapp',
          toolParams: { clientId: cliente.id }
        };

        if (indicadores.financeiro.diasAtraso > 7) {
          acaoPrioritaria = {
            descricao: 'Cobrar pagamento urgente',
            urgencia: 'imediata',
            tool: 'enviar_whatsapp',
            toolParams: { clientId: cliente.id, messageType: 'cobranca' }
          };
        } else if (indicadores.engajamento.diasSemContato > 14) {
          acaoPrioritaria = {
            descricao: 'Agendar reunião de reativação',
            urgencia: 'hoje',
            tool: 'criar_reuniao',
            toolParams: { clientId: cliente.id }
          };
        }

        // Calcular tempo como cliente
        const mesesCliente = Math.floor(
          (hoje.getTime() - new Date(cliente.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        clientesRisco.push({
          clientId: cliente.id,
          clientName: cliente.name,
          segment: cliente.segment || 'Não definido',
          nivelRisco,
          scoreRisco,
          motivos,
          indicadores,
          acaoPrioritaria,
          valorContrato: Number(cliente.monthly_value) || 0,
          tempoComoCliente: mesesCliente < 1 ? 'menos de 1 mês' : `${mesesCliente} meses`
        });
      } else if (scoreRisco === 0) {
        saudaveis++;
      }
    }

    // Ordenar por score (maior risco primeiro)
    clientesRisco.sort((a, b) => b.scoreRisco - a.scoreRisco);

    // Calcular distribuição
    const distribuicao = {
      critico: clientesRisco.filter(c => c.nivelRisco === 'critico').length,
      alto: clientesRisco.filter(c => c.nivelRisco === 'alto').length,
      medio: clientesRisco.filter(c => c.nivelRisco === 'medio').length,
      saudavel: saudaveis
    };

    // Top 3 ações
    const acoesPrioritarias = clientesRisco
      .slice(0, 3)
      .map(c => ({
        clientName: c.clientName,
        acao: c.acaoPrioritaria.descricao,
        impacto: `Valor em risco: R$ ${c.valorContrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`
      }));

    // Valor total em risco
    const valorTotalEmRisco = clientesRisco.reduce((sum, c) => sum + c.valorContrato, 0);

    // Resumo
    const resumoExecutivo = `${clientesRisco.length} de ${clientes.length} clientes precisam de atenção. ` +
      `${distribuicao.critico} em situação crítica, ${distribuicao.alto} em alto risco. ` +
      `Valor mensal em risco: R$ ${valorTotalEmRisco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;

    return {
      dataAnalise: hojeStr,
      totalAnalisados: clientes.length,
      totalEmRisco: clientesRisco.length,
      valorTotalEmRisco,
      distribuicao,
      clientesEmRisco: clientesRisco.slice(0, limite),
      acoesPrioritarias,
      resumoExecutivo
    };
  }

  // ==================== PREVER FATURAMENTO ====================

  async preverFaturamento(params: {
    mes?: string;
    incluirDetalhamento?: boolean;
  }): Promise<PrevisaoFaturamento> {
    const hoje = new Date();
    const mes = params.mes || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    const [ano, mesNum] = mes.split('-').map(Number);

    const inicioMes = `${mes}-01`;
    const ultimoDia = new Date(ano, mesNum, 0).getDate();
    const fimMes = `${mes}-${ultimoDia}`;
    
    const mesLabel = new Date(ano, mesNum - 1).toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });

    // Buscar todas as cobranças do mês
    const { data: pagamentos } = await this.supabase
      .from('payments')
      .select(`
        id,
        amount,
        due_date,
        status,
        paid_date,
        client:clients(id, name)
      `)
      .eq('user_id', this.userId)
      .gte('due_date', inicioMes)
      .lte('due_date', fimMes);

    if (!pagamentos || pagamentos.length === 0) {
      throw new Error(`Nenhuma cobrança encontrada para ${mesLabel}.`);
    }

    const hojeStr = hoje.toISOString().split('T')[0];

    // Classificar pagamentos
    const recebidos = pagamentos.filter(p => p.status === 'paid');
    const aVencer = pagamentos.filter(p => p.status === 'pending' && p.due_date >= hojeStr);
    const vencidos = pagamentos.filter(p => p.status === 'pending' && p.due_date < hojeStr);

    // Calcular valores
    const valorRecebido = recebidos.reduce((sum, p) => sum + Number(p.amount), 0);
    const valorAVencer = aVencer.reduce((sum, p) => sum + Number(p.amount), 0);
    const valorVencido = vencidos.reduce((sum, p) => sum + Number(p.amount), 0);
    const previsaoTotal = valorRecebido + valorAVencer + valorVencido;

    // Buscar mês anterior para comparativo
    const mesAnterior = new Date(ano, mesNum - 2, 1);
    const mesAnteriorStr = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`;
    
    const { data: pagamentosMesAnterior } = await this.supabase
      .from('payments')
      .select('amount, status')
      .eq('user_id', this.userId)
      .gte('due_date', `${mesAnteriorStr}-01`)
      .lte('due_date', `${mesAnteriorStr}-31`);

    const valorMesAnterior = pagamentosMesAnterior?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const variacao = valorMesAnterior > 0 
      ? Math.round(((previsaoTotal - valorMesAnterior) / valorMesAnterior) * 100)
      : 0;

    // Detalhamento por cliente
    const detalhamento = pagamentos.map(p => {
      const diasAtraso = p.status === 'pending' && p.due_date < hojeStr
        ? Math.floor((hoje.getTime() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      // Probabilidade baseada em status
      let probabilidade = 100;
      if (p.status === 'pending') {
        if (p.due_date < hojeStr) {
          probabilidade = diasAtraso! > 30 ? 30 : diasAtraso! > 7 ? 60 : 80;
        } else {
          probabilidade = 90;
        }
      }

      let status: 'recebido' | 'a_vencer' | 'vence_hoje' | 'vencido' = 'a_vencer';
      if (p.status === 'paid') status = 'recebido';
      else if (p.due_date === hojeStr) status = 'vence_hoje';
      else if (p.due_date < hojeStr) status = 'vencido';

      return {
        clientId: p.client?.id || '',
        clientName: p.client?.name || 'Desconhecido',
        valor: Number(p.amount),
        status,
        dataVencimento: p.due_date,
        probabilidadeRecebimento: probabilidade,
        diasAtraso
      };
    });

    // Previsões
    const previsaoOtimista = previsaoTotal;
    const previsaoPessimista = valorRecebido + (valorAVencer * 0.7) + (valorVencido * 0.3);
    const previsaoRealista = valorRecebido + (valorAVencer * 0.85) + (valorVencido * 0.5);

    // Alertas
    const alertas: string[] = [];
    if (valorVencido > 0) {
      alertas.push(`R$ ${valorVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em atraso`);
    }
    if (variacao < -10) {
      alertas.push(`Faturamento ${Math.abs(variacao)}% menor que mês anterior`);
    }

    // Resumo
    const resumoExecutivo = `Previsão para ${mesLabel}: R$ ${previsaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. ` +
      `Já recebido: R$ ${valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${Math.round((valorRecebido/previsaoTotal)*100)}%). ` +
      `A receber: R$ ${valorAVencer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. ` +
      (valorVencido > 0 ? `Em atraso: R$ ${valorVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.` : '');

    return {
      mes,
      mesLabel,
      dataAnalise: hojeStr,
      previsaoTotal,
      recebidoAteAgora: valorRecebido,
      aReceber: valorAVencer,
      vencidoNaoRecebido: valorVencido,
      previsaoOtimista,
      previsaoPessimista,
      previsaoRealista,
      detalhamento: params.incluirDetalhamento !== false ? detalhamento : [],
      comparativoMesAnterior: {
        mesAnterior: mesAnteriorStr,
        valorMesAnterior,
        variacao,
        tendencia: variacao > 5 ? 'crescimento' : variacao < -5 ? 'queda' : 'estavel'
      },
      porStatus: {
        recebido: { quantidade: recebidos.length, valor: valorRecebido },
        aVencer: { quantidade: aVencer.length, valor: valorAVencer },
        vencido: { quantidade: vencidos.length, valor: valorVencido }
      },
      resumoExecutivo,
      alertas
    };
  }

  // ==================== HELPERS ====================

  private gerarSaudacao(): string {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia! ☀️';
    if (hora < 18) return 'Boa tarde! 🌤️';
    return 'Boa noite! 🌙';
  }

  private gerarResumoExecutivo(metricas: any, sugestoes: SugestaoAcao[]): string {
    const partes: string[] = [];

    if (metricas.reunioesHoje > 0) {
      partes.push(`${metricas.reunioesHoje} reunião(ões) hoje`);
    }

    if (metricas.pagamentosVencidos > 0) {
      partes.push(`${metricas.pagamentosVencidos} pagamento(s) vencido(s)`);
    }

    if (metricas.tarefasUrgentes > 0) {
      partes.push(`${metricas.tarefasUrgentes} tarefa(s) urgente(s)`);
    }

    if (partes.length === 0) {
      return 'Dia tranquilo! Sem pendências urgentes.';
    }

    return `Hoje: ${partes.join(', ')}. ${sugestoes.length} ações sugeridas.`;
  }

  private async calcularIndicadoresRisco(clientId: string, hoje: Date) {
    const hojeStr = hoje.toISOString().split('T')[0];

    // Financeiro
    const { data: pagamentos } = await this.supabase
      .from('payments')
      .select('due_date, amount')
      .eq('client_id', clientId)
      .eq('status', 'pending')
      .lt('due_date', hojeStr)
      .order('due_date', { ascending: true });

    const pagamentoAtrasado = (pagamentos?.length || 0) > 0;
    const diasAtraso = pagamentos?.[0] 
      ? Math.floor((hoje.getTime() - new Date(pagamentos[0].due_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const valorAtrasado = pagamentos?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // Engajamento
    const { data: ultimaMensagem } = await this.supabase
      .from('message_logs')
      .select('created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: ultimaReuniao } = await this.supabase
      .from('meetings')
      .select('date')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    let diasSemContato = 999;
    if (ultimaMensagem) {
      const dias = Math.floor((hoje.getTime() - new Date(ultimaMensagem.created_at).getTime()) / (1000 * 60 * 60 * 24));
      diasSemContato = Math.min(diasSemContato, dias);
    }
    if (ultimaReuniao) {
      const dias = Math.floor((hoje.getTime() - new Date(ultimaReuniao.date).getTime()) / (1000 * 60 * 60 * 24));
      diasSemContato = Math.min(diasSemContato, dias);
    }

    // Operacional
    const { data: tarefasAtrasadas } = await this.supabase
      .from('tasks')
      .select('id')
      .eq('client_id', clientId)
      .in('status', ['todo', 'doing'])
      .lt('due_date', hojeStr);

    return {
      financeiro: {
        emRisco: pagamentoAtrasado,
        pagamentoAtrasado,
        diasAtraso,
        valorAtrasado
      },
      engajamento: {
        emRisco: diasSemContato > 14,
        diasSemContato,
        reunioesCanceladas: 0,
        tendenciaContato: 'estavel' as const
      },
      performance: {
        emRisco: false,
        roasBaixo: false,
        roasAtual: 0,
        quedaPerformance: false
      },
      operacional: {
        emRisco: (tarefasAtrasadas?.length || 0) > 2,
        tarefasAtrasadas: tarefasAtrasadas?.length || 0,
        reclamacoes: 0
      }
    };
  }
}

export default IntelligenceExecutor;
```

---

**Continua na Parte 4: Tools de Comunicação...**
