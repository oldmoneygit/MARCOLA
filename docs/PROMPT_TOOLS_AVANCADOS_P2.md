# 🚀 MARCOLA ASSISTANT - Tools Avançados v2.0

## PARTE 2: Tools de Ações em Lote

---

## 🔄 VISÃO GERAL - AÇÕES EM LOTE

Ações em lote permitem executar a mesma operação para múltiplos clientes de uma vez, economizando tempo do gestor.

| Tool | Descrição | Confirmação |
|------|-----------|-------------|
| `cobrar_todos_vencidos` | Envia cobrança para todos com pagamento vencido | ✅ Sim |
| `confirmar_reunioes_amanha` | Envia confirmação para reuniões de amanhã | ✅ Sim |
| `gerar_faturas_mes` | Gera cobranças mensais para todos os clientes | ✅ Sim |
| `enviar_followup_lote` | Envia follow-up para clientes sem contato | ✅ Sim |

---

## 📝 DEFINIÇÃO DOS TOOLS

### Arquivo: `src/lib/assistant/tools-advanced/batch-actions.ts`

```typescript
// ============================================================
// MARCOLA ASSISTANT - TOOLS DE AÇÕES EM LOTE
// ============================================================

import { ToolDefinition } from '../types';

export const BATCH_ACTION_TOOLS: ToolDefinition[] = [
  // ==================== COBRAR TODOS VENCIDOS ====================
  {
    name: 'cobrar_todos_vencidos',
    description: `Envia mensagem de cobrança via WhatsApp para TODOS os clientes que têm pagamentos vencidos.
Use quando o gestor pedir para:
- "Cobra todo mundo que tá devendo"
- "Envia cobrança pra todos os vencidos"
- "Manda mensagem de cobrança geral"
- "Cobra os inadimplentes"

O sistema vai:
1. Buscar todos os pagamentos com status 'overdue' ou vencidos
2. Agrupar por cliente
3. Gerar mensagem personalizada para cada um
4. Mostrar lista para confirmação
5. Após confirmação, enviar todas as mensagens

IMPORTANTE: Sempre mostrar a lista antes de enviar. Nunca enviar automaticamente.`,
    parameters: {
      type: 'object',
      properties: {
        diasMinimoAtraso: {
          type: 'number',
          description: 'Filtrar apenas pagamentos vencidos há X dias ou mais. Default: 1'
        },
        tipoMensagem: {
          type: 'string',
          enum: ['lembrete', 'cobranca', 'urgente'],
          description: 'Tom da mensagem: lembrete (amigável), cobranca (formal), urgente (enfático)'
        },
        incluirValor: {
          type: 'boolean',
          description: 'Se deve incluir o valor na mensagem. Default: true'
        }
      },
      required: []
    },
    requiresConfirmation: true,
    confirmationType: 'batch_cobranca'
  },

  // ==================== CONFIRMAR REUNIÕES AMANHÃ ====================
  {
    name: 'confirmar_reunioes_amanha',
    description: `Envia mensagem de confirmação via WhatsApp para TODOS os clientes que têm reunião amanhã.
Use quando o gestor pedir para:
- "Confirma as reuniões de amanhã"
- "Manda confirmação pras reuniões"
- "Avisa os clientes das reuniões de amanhã"

O sistema vai:
1. Buscar todas as reuniões agendadas para amanhã
2. Filtrar apenas status 'scheduled'
3. Gerar mensagem de confirmação para cada cliente
4. Mostrar lista para confirmação
5. Após confirmação, enviar todas as mensagens

IMPORTANTE: Sempre mostrar a lista antes de enviar.`,
    parameters: {
      type: 'object',
      properties: {
        incluirHorario: {
          type: 'boolean',
          description: 'Se deve incluir o horário na mensagem. Default: true'
        },
        incluirTipo: {
          type: 'boolean',
          description: 'Se deve mencionar se é online ou presencial. Default: true'
        },
        pedirConfirmacao: {
          type: 'boolean',
          description: 'Se a mensagem deve pedir resposta do cliente. Default: true'
        }
      },
      required: []
    },
    requiresConfirmation: true,
    confirmationType: 'batch_confirmacao_reuniao'
  },

  // ==================== GERAR FATURAS DO MÊS ====================
  {
    name: 'gerar_faturas_mes',
    description: `Gera cobranças mensais para todos os clientes ativos baseado no valor mensal (monthly_value) de cada um.
Use quando o gestor pedir para:
- "Gera as faturas do mês"
- "Cria as cobranças de janeiro"
- "Fatura todo mundo esse mês"
- "Gera os boletos do mês"

O sistema vai:
1. Buscar todos os clientes ativos com monthly_value > 0
2. Verificar se já existe cobrança para o mês
3. Calcular data de vencimento baseado no due_day de cada cliente
4. Mostrar lista de faturas a criar
5. Após confirmação, criar todas as cobranças no banco

IMPORTANTE: Não cria cobrança se já existir uma para o mês. Usa o due_day do cliente para vencimento.`,
    parameters: {
      type: 'object',
      properties: {
        mes: {
          type: 'string',
          description: 'Mês para gerar faturas no formato YYYY-MM. Default: mês atual'
        },
        apenasClientesSem: {
          type: 'boolean',
          description: 'Se true, gera apenas para clientes que ainda não tem fatura no mês. Default: true'
        }
      },
      required: []
    },
    requiresConfirmation: true,
    confirmationType: 'gerar_faturas'
  },

  // ==================== ENVIAR FOLLOW-UP EM LOTE ====================
  {
    name: 'enviar_followup_lote',
    description: `Envia mensagem de follow-up via WhatsApp para clientes que estão sem contato há X dias.
Use quando o gestor pedir para:
- "Manda follow-up pros clientes esquecidos"
- "Faz contato com quem tá sumido"
- "Envia mensagem pra quem não falo há mais de 7 dias"
- "Follow-up geral"

O sistema vai:
1. Identificar clientes sem contato (reunião ou mensagem) há X dias
2. Gerar mensagem personalizada de follow-up
3. Mostrar lista para confirmação
4. Após confirmação, enviar todas as mensagens

IMPORTANTE: O padrão é 7 dias sem contato. Pode ser ajustado pelo parâmetro.`,
    parameters: {
      type: 'object',
      properties: {
        diasSemContato: {
          type: 'number',
          description: 'Mínimo de dias sem contato para incluir na lista. Default: 7'
        },
        limite: {
          type: 'number',
          description: 'Máximo de clientes para incluir na lista. Default: 20'
        },
        excluirInadimplentes: {
          type: 'boolean',
          description: 'Se deve excluir clientes com pagamento em atraso. Default: false'
        }
      },
      required: []
    },
    requiresConfirmation: true,
    confirmationType: 'batch_followup'
  }
];

export default BATCH_ACTION_TOOLS;
```

---

## ⚙️ IMPLEMENTAÇÃO DO EXECUTOR

### Arquivo: `src/lib/assistant/tools-advanced/batch-actions-executor.ts`

```typescript
// ============================================================
// EXECUTOR DOS TOOLS DE AÇÕES EM LOTE
// ============================================================

import { createClient } from '@/lib/supabase/server';
import { 
  BatchCobrancaData, 
  BatchConfirmacaoReuniaoData,
  BatchFollowupData,
  GerarFaturasData,
  BatchActionResult 
} from '../types-advanced';
import { ConfirmationData, ToolCall, ToolResult } from '../types';

export class BatchActionsExecutor {
  private supabase;
  private userId: string;

  constructor(userId: string) {
    this.supabase = createClient();
    this.userId = userId;
  }

  // ==================== COBRAR TODOS VENCIDOS ====================

  async prepararCobrancaLote(params: {
    diasMinimoAtraso?: number;
    tipoMensagem?: 'lembrete' | 'cobranca' | 'urgente';
    incluirValor?: boolean;
  }): Promise<{ confirmation: ConfirmationData }> {
    const diasMinimo = params.diasMinimoAtraso ?? 1;
    const tipoMensagem = params.tipoMensagem ?? 'cobranca';
    const incluirValor = params.incluirValor ?? true;

    const hoje = new Date().toISOString().split('T')[0];

    // Buscar pagamentos vencidos
    const { data: pagamentos, error } = await this.supabase
      .from('payments')
      .select(`
        id,
        amount,
        due_date,
        description,
        client:clients (
          id,
          name,
          contact_name,
          contact_phone
        )
      `)
      .eq('user_id', this.userId)
      .eq('status', 'pending')
      .lt('due_date', hoje)
      .order('due_date', { ascending: true });

    if (error) throw new Error(`Erro ao buscar pagamentos: ${error.message}`);

    // Filtrar por dias de atraso e agrupar por cliente
    const clientesMap = new Map<string, any>();
    
    pagamentos?.forEach(pag => {
      const diasAtraso = Math.floor(
        (new Date().getTime() - new Date(pag.due_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diasAtraso >= diasMinimo && pag.client?.contact_phone) {
        const clientId = pag.client.id;
        
        if (!clientesMap.has(clientId)) {
          clientesMap.set(clientId, {
            clientId,
            clientName: pag.client.name,
            contactName: pag.client.contact_name || pag.client.name,
            phone: pag.client.contact_phone,
            amount: 0,
            daysOverdue: diasAtraso,
            paymentId: pag.id,
            dueDate: pag.due_date
          });
        }
        
        // Soma valores se tiver múltiplos vencidos
        const cliente = clientesMap.get(clientId);
        cliente.amount += Number(pag.amount);
        if (diasAtraso > cliente.daysOverdue) {
          cliente.daysOverdue = diasAtraso;
        }
      }
    });

    const clientes = Array.from(clientesMap.values());

    if (clientes.length === 0) {
      throw new Error('Nenhum cliente com pagamento vencido encontrado.');
    }

    // Gerar template de mensagem
    const messageTemplate = this.gerarTemplateMensagem(tipoMensagem, incluirValor);

    // Calcular total
    const totalAmount = clientes.reduce((sum, c) => sum + c.amount, 0);

    const confirmationData: BatchCobrancaData = {
      clientes,
      totalAmount,
      totalClientes: clientes.length,
      messageTemplate
    };

    return {
      confirmation: {
        id: `batch_cobranca_${Date.now()}`,
        type: 'batch_cobranca',
        status: 'pending',
        data: confirmationData,
        toolToExecute: {
          id: `tool_${Date.now()}`,
          name: 'cobrar_todos_vencidos',
          parameters: params
        },
        createdAt: new Date()
      }
    };
  }

  async executarCobrancaLote(data: BatchCobrancaData): Promise<BatchActionResult> {
    const results: BatchActionResult['results'] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const cliente of data.clientes) {
      try {
        // Personalizar mensagem
        const mensagem = this.personalizarMensagem(data.messageTemplate, {
          nome: cliente.contactName,
          valor: cliente.amount,
          dias: cliente.daysOverdue
        });

        // Enviar via WhatsApp
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cliente.phone,
            message: mensagem,
            clientId: cliente.clientId,
            templateType: 'payment_overdue'
          })
        });

        const result = await response.json();

        if (result.success) {
          successCount++;
          results.push({
            clientId: cliente.clientId,
            clientName: cliente.clientName,
            success: true,
            messageId: result.messageId
          });
        } else {
          failedCount++;
          results.push({
            clientId: cliente.clientId,
            clientName: cliente.clientName,
            success: false,
            error: result.error
          });
        }

        // Delay entre mensagens para evitar bloqueio
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (err: any) {
        failedCount++;
        results.push({
          clientId: cliente.clientId,
          clientName: cliente.clientName,
          success: false,
          error: err.message
        });
      }
    }

    return {
      success: failedCount === 0,
      totalProcessed: data.clientes.length,
      successCount,
      failedCount,
      results,
      summary: `Cobranças enviadas: ${successCount}/${data.clientes.length}. ` +
               `Total cobrado: R$ ${data.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    };
  }

  // ==================== CONFIRMAR REUNIÕES AMANHÃ ====================

  async prepararConfirmacaoReunioes(params: {
    incluirHorario?: boolean;
    incluirTipo?: boolean;
    pedirConfirmacao?: boolean;
  }): Promise<{ confirmation: ConfirmationData }> {
    // Calcular data de amanhã
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataAmanha = amanha.toISOString().split('T')[0];

    // Buscar reuniões de amanhã
    const { data: reunioes, error } = await this.supabase
      .from('meetings')
      .select(`
        id,
        date,
        time,
        type,
        client:clients (
          id,
          name,
          contact_name,
          contact_phone
        )
      `)
      .eq('user_id', this.userId)
      .eq('date', dataAmanha)
      .eq('status', 'scheduled')
      .order('time', { ascending: true });

    if (error) throw new Error(`Erro ao buscar reuniões: ${error.message}`);

    // Filtrar apenas clientes com telefone
    const reunioesValidas = reunioes?.filter(r => r.client?.contact_phone) || [];

    if (reunioesValidas.length === 0) {
      throw new Error('Nenhuma reunião encontrada para amanhã ou clientes sem telefone cadastrado.');
    }

    // Gerar template de mensagem
    const messageTemplate = this.gerarTemplateConfirmacao(params);

    const confirmationData: BatchConfirmacaoReuniaoData = {
      data: dataAmanha,
      reunioes: reunioesValidas.map(r => ({
        meetingId: r.id,
        clientId: r.client.id,
        clientName: r.client.name,
        contactName: r.client.contact_name || r.client.name,
        phone: r.client.contact_phone,
        time: r.time,
        type: r.type || 'online'
      })),
      totalReunioes: reunioesValidas.length,
      messageTemplate
    };

    return {
      confirmation: {
        id: `batch_confirmacao_${Date.now()}`,
        type: 'batch_confirmacao_reuniao',
        status: 'pending',
        data: confirmationData,
        toolToExecute: {
          id: `tool_${Date.now()}`,
          name: 'confirmar_reunioes_amanha',
          parameters: params
        },
        createdAt: new Date()
      }
    };
  }

  async executarConfirmacaoReunioes(data: BatchConfirmacaoReuniaoData): Promise<BatchActionResult> {
    const results: BatchActionResult['results'] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const reuniao of data.reunioes) {
      try {
        const mensagem = this.personalizarMensagem(data.messageTemplate, {
          nome: reuniao.contactName,
          horario: reuniao.time,
          tipo: reuniao.type === 'online' ? 'online' : 'presencial'
        });

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: reuniao.phone,
            message: mensagem,
            clientId: reuniao.clientId,
            templateType: 'meeting_confirmation'
          })
        });

        const result = await response.json();

        if (result.success) {
          successCount++;
          results.push({
            clientId: reuniao.clientId,
            clientName: reuniao.clientName,
            success: true,
            messageId: result.messageId
          });
        } else {
          failedCount++;
          results.push({
            clientId: reuniao.clientId,
            clientName: reuniao.clientName,
            success: false,
            error: result.error
          });
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (err: any) {
        failedCount++;
        results.push({
          clientId: reuniao.clientId,
          clientName: reuniao.clientName,
          success: false,
          error: err.message
        });
      }
    }

    return {
      success: failedCount === 0,
      totalProcessed: data.reunioes.length,
      successCount,
      failedCount,
      results,
      summary: `Confirmações enviadas: ${successCount}/${data.reunioes.length} reuniões de amanhã.`
    };
  }

  // ==================== GERAR FATURAS DO MÊS ====================

  async prepararGeracaoFaturas(params: {
    mes?: string;
    apenasClientesSem?: boolean;
  }): Promise<{ confirmation: ConfirmationData }> {
    // Determinar mês
    const hoje = new Date();
    const mes = params.mes || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    const [ano, mesNum] = mes.split('-').map(Number);
    
    const mesLabel = new Date(ano, mesNum - 1).toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });

    // Buscar clientes ativos com valor mensal
    const { data: clientes, error } = await this.supabase
      .from('clients')
      .select('id, name, monthly_value, due_day')
      .eq('user_id', this.userId)
      .eq('status', 'active')
      .gt('monthly_value', 0);

    if (error) throw new Error(`Erro ao buscar clientes: ${error.message}`);

    if (!clientes || clientes.length === 0) {
      throw new Error('Nenhum cliente ativo com valor mensal cadastrado.');
    }

    // Verificar faturas existentes no mês
    const inicioMes = `${mes}-01`;
    const fimMes = `${mes}-31`;

    const { data: faturasExistentes } = await this.supabase
      .from('payments')
      .select('client_id')
      .eq('user_id', this.userId)
      .gte('due_date', inicioMes)
      .lte('due_date', fimMes);

    const clientesComFatura = new Set(faturasExistentes?.map(f => f.client_id) || []);

    // Preparar lista
    const clientesParaFaturar = clientes.map(c => {
      const dueDay = c.due_day || 10;
      const dueDate = `${mes}-${String(dueDay).padStart(2, '0')}`;
      
      return {
        clientId: c.id,
        clientName: c.name,
        monthlyValue: Number(c.monthly_value),
        dueDay,
        dueDate,
        jaExiste: clientesComFatura.has(c.id)
      };
    });

    // Filtrar se necessário
    const clientesFiltrados = params.apenasClientesSem !== false
      ? clientesParaFaturar.filter(c => !c.jaExiste)
      : clientesParaFaturar;

    if (clientesFiltrados.length === 0) {
      throw new Error(`Todos os clientes já possuem fatura para ${mesLabel}.`);
    }

    const totalFaturamento = clientesFiltrados
      .filter(c => !c.jaExiste)
      .reduce((sum, c) => sum + c.monthlyValue, 0);

    const confirmationData: GerarFaturasData = {
      mes,
      mesLabel,
      clientes: clientesFiltrados,
      totalFaturamento,
      clientesNovos: clientesFiltrados.filter(c => !c.jaExiste).length,
      clientesJaFaturados: clientesFiltrados.filter(c => c.jaExiste).length
    };

    return {
      confirmation: {
        id: `gerar_faturas_${Date.now()}`,
        type: 'gerar_faturas',
        status: 'pending',
        data: confirmationData,
        toolToExecute: {
          id: `tool_${Date.now()}`,
          name: 'gerar_faturas_mes',
          parameters: params
        },
        createdAt: new Date()
      }
    };
  }

  async executarGeracaoFaturas(data: GerarFaturasData): Promise<BatchActionResult> {
    const results: BatchActionResult['results'] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const cliente of data.clientes) {
      // Pular se já existe
      if (cliente.jaExiste) {
        results.push({
          clientId: cliente.clientId,
          clientName: cliente.clientName,
          success: true,
          details: { skipped: true, reason: 'Fatura já existe' }
        });
        continue;
      }

      try {
        const { data: payment, error } = await this.supabase
          .from('payments')
          .insert({
            user_id: this.userId,
            client_id: cliente.clientId,
            amount: cliente.monthlyValue,
            due_date: cliente.dueDate,
            status: 'pending',
            description: `Mensalidade ${data.mesLabel}`
          })
          .select()
          .single();

        if (error) throw error;

        successCount++;
        results.push({
          clientId: cliente.clientId,
          clientName: cliente.clientName,
          success: true,
          details: { paymentId: payment.id, dueDate: cliente.dueDate }
        });

      } catch (err: any) {
        failedCount++;
        results.push({
          clientId: cliente.clientId,
          clientName: cliente.clientName,
          success: false,
          error: err.message
        });
      }
    }

    return {
      success: failedCount === 0,
      totalProcessed: data.clientes.length,
      successCount,
      failedCount,
      results,
      summary: `Faturas criadas: ${successCount}/${data.clientesNovos} para ${data.mesLabel}. ` +
               `Total: R$ ${data.totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    };
  }

  // ==================== FOLLOW-UP EM LOTE ====================

  async prepararFollowupLote(params: {
    diasSemContato?: number;
    limite?: number;
    excluirInadimplentes?: boolean;
  }): Promise<{ confirmation: ConfirmationData }> {
    const diasMinimo = params.diasSemContato ?? 7;
    const limite = params.limite ?? 20;

    // Buscar último contato de cada cliente
    // Considera: message_logs (mensagens) e meetings (reuniões realizadas)
    
    const { data: clientes, error } = await this.supabase
      .from('clients')
      .select(`
        id,
        name,
        contact_name,
        contact_phone,
        status
      `)
      .eq('user_id', this.userId)
      .eq('status', 'active')
      .not('contact_phone', 'is', null);

    if (error) throw new Error(`Erro ao buscar clientes: ${error.message}`);

    // Buscar último contato de cada cliente
    const clientesComContato: BatchFollowupData['clientes'] = [];
    
    for (const cliente of clientes || []) {
      // Buscar última mensagem
      const { data: ultimaMensagem } = await this.supabase
        .from('message_logs')
        .select('created_at')
        .eq('client_id', cliente.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Buscar última reunião realizada
      const { data: ultimaReuniao } = await this.supabase
        .from('meetings')
        .select('date')
        .eq('client_id', cliente.id)
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      // Determinar último contato
      let ultimoContato: Date | null = null;
      let tipoUltimoContato = '';

      if (ultimaMensagem) {
        ultimoContato = new Date(ultimaMensagem.created_at);
        tipoUltimoContato = 'mensagem';
      }

      if (ultimaReuniao) {
        const dataReuniao = new Date(ultimaReuniao.date);
        if (!ultimoContato || dataReuniao > ultimoContato) {
          ultimoContato = dataReuniao;
          tipoUltimoContato = 'reunião';
        }
      }

      // Calcular dias sem contato
      if (ultimoContato) {
        const diasSemContato = Math.floor(
          (new Date().getTime() - ultimoContato.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diasSemContato >= diasMinimo) {
          clientesComContato.push({
            clientId: cliente.id,
            clientName: cliente.name,
            contactName: cliente.contact_name || cliente.name,
            phone: cliente.contact_phone,
            diasSemContato,
            ultimoContato: ultimoContato.toISOString().split('T')[0],
            ultimoContatoTipo: tipoUltimoContato
          });
        }
      } else {
        // Nunca teve contato
        clientesComContato.push({
          clientId: cliente.id,
          clientName: cliente.name,
          contactName: cliente.contact_name || cliente.name,
          phone: cliente.contact_phone,
          diasSemContato: 999,
          ultimoContato: 'Nunca',
          ultimoContatoTipo: 'nenhum'
        });
      }
    }

    // Ordenar por dias sem contato (mais tempo primeiro) e limitar
    const clientesOrdenados = clientesComContato
      .sort((a, b) => b.diasSemContato - a.diasSemContato)
      .slice(0, limite);

    if (clientesOrdenados.length === 0) {
      throw new Error(`Nenhum cliente está há mais de ${diasMinimo} dias sem contato.`);
    }

    // Template de follow-up
    const messageTemplate = `Olá {nome}! 👋

Passando para saber como estão as coisas por aí!

Faz um tempinho que não conversamos e queria verificar se está tudo bem com as campanhas e se precisa de algum ajuste.

Tem algum horário essa semana para fazermos uma call rápida?

Abraço! 🚀`;

    const confirmationData: BatchFollowupData = {
      clientes: clientesOrdenados,
      totalClientes: clientesOrdenados.length,
      diasMinimo,
      messageTemplate
    };

    return {
      confirmation: {
        id: `batch_followup_${Date.now()}`,
        type: 'batch_followup',
        status: 'pending',
        data: confirmationData,
        toolToExecute: {
          id: `tool_${Date.now()}`,
          name: 'enviar_followup_lote',
          parameters: params
        },
        createdAt: new Date()
      }
    };
  }

  async executarFollowupLote(data: BatchFollowupData): Promise<BatchActionResult> {
    const results: BatchActionResult['results'] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const cliente of data.clientes) {
      try {
        const mensagem = this.personalizarMensagem(data.messageTemplate, {
          nome: cliente.contactName
        });

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cliente.phone,
            message: mensagem,
            clientId: cliente.clientId,
            templateType: 'followup'
          })
        });

        const result = await response.json();

        if (result.success) {
          successCount++;
          results.push({
            clientId: cliente.clientId,
            clientName: cliente.clientName,
            success: true,
            messageId: result.messageId
          });
        } else {
          failedCount++;
          results.push({
            clientId: cliente.clientId,
            clientName: cliente.clientName,
            success: false,
            error: result.error
          });
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (err: any) {
        failedCount++;
        results.push({
          clientId: cliente.clientId,
          clientName: cliente.clientName,
          success: false,
          error: err.message
        });
      }
    }

    return {
      success: failedCount === 0,
      totalProcessed: data.clientes.length,
      successCount,
      failedCount,
      results,
      summary: `Follow-ups enviados: ${successCount}/${data.clientes.length} clientes.`
    };
  }

  // ==================== HELPERS ====================

  private gerarTemplateMensagem(
    tipo: 'lembrete' | 'cobranca' | 'urgente',
    incluirValor: boolean
  ): string {
    const templates = {
      lembrete: `Olá {nome}! 👋

Passando para lembrar sobre o pagamento${incluirValor ? ' de R$ {valor}' : ''} que está pendente há {dias} dia(s).

Se já efetuou o pagamento, por favor desconsidere esta mensagem.

Qualquer dúvida, estou à disposição! 🙏`,

      cobranca: `Olá {nome}!

Identificamos que há um pagamento${incluirValor ? ' no valor de R$ {valor}' : ''} pendente há {dias} dia(s).

Por favor, regularize o quanto antes para evitar a suspensão dos serviços.

Qualquer dúvida sobre formas de pagamento, estamos à disposição.

Atenciosamente.`,

      urgente: `⚠️ ATENÇÃO {nome}!

Seu pagamento${incluirValor ? ' de R$ {valor}' : ''} está vencido há {dias} DIAS.

É URGENTE a regularização para evitar a SUSPENSÃO IMEDIATA dos serviços.

Entre em contato HOJE para resolver esta pendência.`
    };

    return templates[tipo];
  }

  private gerarTemplateConfirmacao(params: {
    incluirHorario?: boolean;
    incluirTipo?: boolean;
    pedirConfirmacao?: boolean;
  }): string {
    let template = `Olá {nome}! 👋

Passando para confirmar nossa reunião de AMANHÃ`;

    if (params.incluirHorario !== false) {
      template += ` às {horario}`;
    }

    if (params.incluirTipo !== false) {
      template += ` ({tipo})`;
    }

    template += `.`;

    if (params.pedirConfirmacao !== false) {
      template += `

Podemos manter o horário combinado? Por favor, confirme! 🙏`;
    }

    template += `

Abraço! 🚀`;

    return template;
  }

  private personalizarMensagem(template: string, vars: Record<string, any>): string {
    let mensagem = template;
    
    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      
      if (key === 'valor' && typeof value === 'number') {
        mensagem = mensagem.replace(regex, value.toLocaleString('pt-BR', { 
          minimumFractionDigits: 2 
        }));
      } else {
        mensagem = mensagem.replace(regex, String(value));
      }
    }
    
    return mensagem;
  }
}

export default BatchActionsExecutor;
```

---

## 🎨 CARDS DE CONFIRMAÇÃO

### Card para Cobrança em Lote

```typescript
// src/components/assistant/cards/BatchCobrancaConfirmation.tsx

'use client';

import { useState } from 'react';
import { 
  DollarSign, User, Calendar, Check, X, 
  AlertTriangle, ChevronDown, ChevronUp 
} from 'lucide-react';
import { BatchCobrancaData } from '@/lib/assistant/types-advanced';
import { cn } from '@/lib/utils';

interface Props {
  data: BatchCobrancaData;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit?: (data: BatchCobrancaData) => void;
  isExecuting?: boolean;
}

export function BatchCobrancaConfirmation({
  data,
  onConfirm,
  onCancel,
  isExecuting = false
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="font-semibold text-red-800">
            Cobrança em Lote
          </h3>
          <p className="text-sm text-red-600">
            {data.totalClientes} clientes • R$ {data.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Aviso */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-800">
          Serão enviadas <strong>{data.totalClientes} mensagens</strong> de cobrança via WhatsApp.
          Verifique a lista antes de confirmar.
        </p>
      </div>

      {/* Lista de Clientes */}
      <div className="mb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? 'Ocultar lista' : 'Ver lista de clientes'}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
            {data.clientes.map((cliente) => (
              <div 
                key={cliente.clientId}
                className="bg-white rounded-lg p-3 border flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-800">{cliente.clientName}</p>
                  <p className="text-sm text-gray-500">
                    {cliente.daysOverdue} dias de atraso
                  </p>
                </div>
                <p className="font-semibold text-red-600">
                  R$ {cliente.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview da Mensagem */}
      <div className="bg-white rounded-lg p-3 border mb-4">
        <p className="text-xs text-gray-500 mb-1">Preview da mensagem:</p>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {data.messageTemplate.substring(0, 150)}...
        </p>
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={isExecuting}
          className={cn(
            'flex-1 py-2 rounded-md font-medium flex items-center justify-center gap-2',
            isExecuting 
              ? 'bg-red-300 cursor-wait' 
              : 'bg-red-500 text-white hover:bg-red-600'
          )}
        >
          {isExecuting ? (
            <>Enviando...</>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Enviar {data.totalClientes} Cobranças
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={isExecuting}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

---

**Continua na Parte 3: Tools de Inteligência...**
