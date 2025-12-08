# 🤖 MARCOLA ASSISTANT - Parte 4: Tool Executor e APIs

---

## 7. TOOL EXECUTOR

```typescript
// src/lib/assistant/tool-executor.ts

import { createClient } from '@/lib/supabase/server';
import { ToolCall, ToolResult, ConfirmationData } from './types';
import { toolRequiresConfirmation, getConfirmationType } from './tools';

export class ToolExecutor {
  private supabase;
  private userId: string;

  constructor(userId: string) {
    this.supabase = createClient();
    this.userId = userId;
  }

  async execute(toolCall: ToolCall): Promise<{ result?: ToolResult; confirmation?: ConfirmationData }> {
    const { name } = toolCall;

    if (toolRequiresConfirmation(name)) {
      const confirmation = await this.prepareConfirmation(toolCall);
      return { confirmation };
    }

    const result = await this.executeTool(toolCall);
    return { result };
  }

  async executeConfirmed(toolCall: ToolCall): Promise<ToolResult> {
    return this.executeTool(toolCall);
  }

  private async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    const { name, parameters } = toolCall;

    try {
      switch (name) {
        case 'buscar_cliente': return this.buscarCliente(parameters.query);
        case 'listar_clientes': return this.listarClientes(parameters);
        case 'criar_reuniao': return this.criarReuniao(parameters);
        case 'listar_reunioes': return this.listarReunioes(parameters);
        case 'criar_tarefa': return this.criarTarefa(parameters);
        case 'listar_tarefas': return this.listarTarefas(parameters);
        case 'concluir_tarefa': return this.concluirTarefa(parameters.taskId);
        case 'criar_cobranca': return this.criarCobranca(parameters);
        case 'listar_pagamentos': return this.listarPagamentos(parameters);
        case 'marcar_pago': return this.marcarPago(parameters);
        case 'enviar_whatsapp': return this.enviarWhatsApp(parameters);
        case 'gerar_mensagem': return this.gerarMensagem(parameters);
        case 'criar_lembrete': return this.criarLembrete(parameters);
        case 'resumo_dia': return this.resumoDia();
        case 'resumo_cliente': return this.resumoCliente(parameters.clientId);
        default: return { success: false, error: `Tool '${name}' não implementado` };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async prepareConfirmation(toolCall: ToolCall): Promise<ConfirmationData> {
    const { name, parameters } = toolCall;
    const type = getConfirmationType(name)!;
    let data: any;

    switch (type) {
      case 'meeting':
        const meetingClient = await this.getClientById(parameters.clientId);
        data = {
          clientId: parameters.clientId,
          clientName: meetingClient?.name || 'Cliente',
          contactName: meetingClient?.contact_name,
          date: parameters.date,
          time: parameters.time,
          type: parameters.type,
          notes: parameters.notes
        };
        break;

      case 'task':
        const taskClient = parameters.clientId ? await this.getClientById(parameters.clientId) : null;
        data = {
          clientId: parameters.clientId,
          clientName: taskClient?.name,
          title: parameters.title,
          description: parameters.description,
          dueDate: parameters.dueDate,
          priority: parameters.priority || 'medium',
          category: parameters.category
        };
        break;

      case 'whatsapp':
        const whatsappClient = await this.getClientById(parameters.clientId);
        data = {
          clientId: parameters.clientId,
          clientName: whatsappClient?.name || 'Cliente',
          contactName: whatsappClient?.contact_name || whatsappClient?.name,
          phone: whatsappClient?.phone || '',
          message: parameters.message
        };
        break;

      case 'payment':
        const paymentClient = await this.getClientById(parameters.clientId);
        data = {
          clientId: parameters.clientId,
          clientName: paymentClient?.name || 'Cliente',
          amount: parameters.amount,
          dueDate: parameters.dueDate,
          description: parameters.description
        };
        break;

      default:
        data = { title: `Confirmar ${name}`, details: parameters };
    }

    return {
      id: `conf_${Date.now()}`,
      type,
      status: 'pending',
      data,
      toolToExecute: toolCall,
      createdAt: new Date()
    };
  }

  // ============ IMPLEMENTAÇÕES ============

  private async buscarCliente(query: string): Promise<ToolResult> {
    const { data: clients, error } = await this.supabase
      .from('clients')
      .select('id, name, contact_name, phone, niche, status')
      .eq('user_id', this.userId)
      .or(`name.ilike.%${query}%,contact_name.ilike.%${query}%,niche.ilike.%${query}%`)
      .limit(5);

    if (error) return { success: false, error: error.message };

    if (!clients?.length) {
      return { success: true, data: { found: false, message: `Nenhum cliente "${query}"` } };
    }

    if (clients.length === 1) {
      return { success: true, data: { found: true, client: clients[0] } };
    }

    return { success: true, data: { found: true, multiple: true, clients } };
  }

  private async listarClientes(params: any): Promise<ToolResult> {
    let query = this.supabase.from('clients')
      .select('id, name, contact_name, phone, niche, status')
      .eq('user_id', this.userId);

    if (params.status && params.status !== 'all') query = query.eq('status', params.status);
    query = query.order('name').limit(params.limit || 20);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: { clients: data } };
  }

  private async criarReuniao(params: any): Promise<ToolResult> {
    const { data, error } = await this.supabase
      .from('meetings')
      .insert({
        user_id: this.userId,
        client_id: params.clientId,
        date: params.date,
        time: params.time,
        type: params.type || 'online',
        notes: params.notes,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // Criar lembrete 2 dias antes
    const meetingDate = new Date(params.date);
    const reminderDate = new Date(meetingDate);
    reminderDate.setDate(reminderDate.getDate() - 2);

    if (reminderDate > new Date()) {
      await this.supabase.from('reminders').insert({
        user_id: this.userId,
        client_id: params.clientId,
        meeting_id: data.id,
        message: 'Reunião em 2 dias',
        remind_at: reminderDate.toISOString(),
        type: 'meeting_reminder'
      });
    }

    return { success: true, data: { meeting: data, message: 'Reunião agendada com sucesso!' } };
  }

  private async listarReunioes(params: any): Promise<ToolResult> {
    const today = new Date().toISOString().split('T')[0];
    let query = this.supabase
      .from('meetings')
      .select(`id, date, time, type, client:clients(id, name)`)
      .eq('user_id', this.userId)
      .eq('status', 'scheduled');

    if (params.periodo === 'hoje') query = query.eq('date', today);
    else if (params.periodo === 'semana') {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);
      query = query.gte('date', today).lte('date', weekEnd.toISOString().split('T')[0]);
    } else {
      query = query.gte('date', today);
    }

    if (params.clientId) query = query.eq('client_id', params.clientId);
    query = query.order('date').order('time').limit(20);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: { meetings: data } };
  }

  private async criarTarefa(params: any): Promise<ToolResult> {
    const { data, error } = await this.supabase
      .from('tasks')
      .insert({
        user_id: this.userId,
        client_id: params.clientId || null,
        title: params.title,
        description: params.description,
        due_date: params.dueDate,
        priority: params.priority || 'medium',
        category: params.category || 'other',
        status: 'pending'
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: { task: data, message: 'Tarefa criada!' } };
  }

  private async listarTarefas(params: any): Promise<ToolResult> {
    const today = new Date().toISOString().split('T')[0];
    let query = this.supabase
      .from('tasks')
      .select(`id, title, due_date, priority, status, client:clients(id, name)`)
      .eq('user_id', this.userId);

    if (params.status !== 'all') query = query.eq('status', params.status || 'pending');
    if (params.clientId) query = query.eq('client_id', params.clientId);
    if (params.priority) query = query.eq('priority', params.priority);

    if (params.periodo === 'hoje') query = query.eq('due_date', today);
    else if (params.periodo === 'atrasadas') query = query.lt('due_date', today);

    query = query.order('due_date', { nullsFirst: false }).limit(20);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: { tasks: data } };
  }

  private async concluirTarefa(taskId: string): Promise<ToolResult> {
    const { error } = await this.supabase
      .from('tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('user_id', this.userId);

    if (error) return { success: false, error: error.message };
    return { success: true, data: { message: 'Tarefa concluída!' } };
  }

  private async criarCobranca(params: any): Promise<ToolResult> {
    const { data, error } = await this.supabase
      .from('payments')
      .insert({
        user_id: this.userId,
        client_id: params.clientId,
        amount: params.amount,
        due_date: params.dueDate,
        description: params.description,
        status: 'pending'
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: { payment: data, message: 'Cobrança criada!' } };
  }

  private async listarPagamentos(params: any): Promise<ToolResult> {
    const today = new Date().toISOString().split('T')[0];
    let query = this.supabase
      .from('payments')
      .select(`id, amount, due_date, status, client:clients(id, name)`)
      .eq('user_id', this.userId);

    if (params.status === 'overdue') query = query.eq('status', 'pending').lt('due_date', today);
    else if (params.status === 'pending') query = query.eq('status', 'pending').gte('due_date', today);
    else if (params.status === 'paid') query = query.eq('status', 'paid');
    else query = query.in('status', ['pending', 'overdue']);

    if (params.clientId) query = query.eq('client_id', params.clientId);
    query = query.order('due_date').limit(20);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: { payments: data } };
  }

  private async marcarPago(params: any): Promise<ToolResult> {
    const { error } = await this.supabase
      .from('payments')
      .update({ status: 'paid', paid_at: params.paidAt || new Date().toISOString() })
      .eq('id', params.paymentId)
      .eq('user_id', this.userId);

    if (error) return { success: false, error: error.message };
    return { success: true, data: { message: 'Marcado como pago!' } };
  }

  private async enviarWhatsApp(params: any): Promise<ToolResult> {
    const client = await this.getClientById(params.clientId);
    if (!client?.phone) return { success: false, error: 'Cliente sem telefone' };

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: client.phone,
        message: params.message,
        clientId: params.clientId
      })
    });

    const result = await response.json();
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: { message: 'Mensagem enviada!' } };
  }

  private async gerarMensagem(params: any): Promise<ToolResult> {
    const client = await this.getClientById(params.clientId);
    if (!client) return { success: false, error: 'Cliente não encontrado' };

    const templates: Record<string, string> = {
      lembrete_pagamento: `Olá ${client.contact_name || client.name}! 👋\n\nPassando para lembrar sobre o pagamento pendente.\n\nSe já efetuou, desconsidere. Qualquer dúvida, estamos à disposição!`,
      confirmacao_reuniao: `Olá ${client.contact_name || client.name}! 👋\n\nConfirmando nossa reunião agendada.\n\nPodemos manter o horário combinado?\n\nAguardo sua confirmação! 🙏`,
      followup: `Olá ${client.contact_name || client.name}! 👋\n\nPassando para saber como estão as coisas por aí.\n\nPrecisando de algo, é só chamar!\n\nAbraço! 🚀`,
      cobranca: `Olá ${client.contact_name || client.name}!\n\nIdentificamos um pagamento pendente.\n\nPor favor, regularize o quanto antes.\n\nDúvidas, estamos à disposição! 🤝`
    };

    const message = templates[params.tipo] || params.contexto || 'Olá!';
    return { success: true, data: { message, clientName: client.name, phone: client.phone } };
  }

  private async criarLembrete(params: any): Promise<ToolResult> {
    const remindAt = params.time ? `${params.date}T${params.time}:00` : `${params.date}T09:00:00`;

    const { data, error } = await this.supabase
      .from('reminders')
      .insert({
        user_id: this.userId,
        client_id: params.clientId || null,
        message: params.message,
        remind_at: remindAt,
        type: 'custom'
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: { reminder: data, message: 'Lembrete criado!' } };
  }

  private async resumoDia(): Promise<ToolResult> {
    const today = new Date().toISOString().split('T')[0];

    const [{ data: meetings }, { data: tasks }, { data: payments }] = await Promise.all([
      this.supabase.from('meetings').select('id, time, client:clients(name)')
        .eq('user_id', this.userId).eq('date', today).eq('status', 'scheduled'),
      this.supabase.from('tasks').select('id, title, priority, client:clients(name)')
        .eq('user_id', this.userId).eq('status', 'pending').lte('due_date', today),
      this.supabase.from('payments').select('id, amount, client:clients(name)')
        .eq('user_id', this.userId).eq('status', 'pending').lte('due_date', today)
    ]);

    return {
      success: true,
      data: {
        date: today,
        meetings: meetings || [],
        tasks: tasks || [],
        payments: payments || [],
        summary: {
          totalMeetings: meetings?.length || 0,
          totalTasks: tasks?.length || 0,
          totalPayments: payments?.length || 0
        }
      }
    };
  }

  private async resumoCliente(clientId: string): Promise<ToolResult> {
    const client = await this.getClientById(clientId);
    if (!client) return { success: false, error: 'Cliente não encontrado' };

    const today = new Date().toISOString().split('T')[0];

    const [{ data: meetings }, { data: tasks }, { data: payments }] = await Promise.all([
      this.supabase.from('meetings').select('id, date, time')
        .eq('client_id', clientId).eq('status', 'scheduled').gte('date', today).limit(5),
      this.supabase.from('tasks').select('id, title, due_date, priority')
        .eq('client_id', clientId).eq('status', 'pending').limit(5),
      this.supabase.from('payments').select('id, amount, due_date, status')
        .eq('client_id', clientId).in('status', ['pending', 'overdue']).limit(5)
    ]);

    return {
      success: true,
      data: { client, meetings: meetings || [], tasks: tasks || [], payments: payments || [] }
    };
  }

  private async getClientById(clientId: string) {
    const { data } = await this.supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', this.userId)
      .single();
    return data;
  }
}
```

---

## 8. APIs

### 8.1 API Principal do Chat

```typescript
// src/app/api/assistant/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processMessage } from '@/lib/assistant/claude-client';
import { buildUserContext } from '@/lib/assistant/context-builder';
import { ToolExecutor } from '@/lib/assistant/tool-executor';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { message, history, forceTool } = await request.json();
    const context = await buildUserContext(user.id);

    // Tool forçado (após seleção de cliente)
    if (forceTool) {
      const executor = new ToolExecutor(user.id);
      const { result, confirmation } = await executor.execute(forceTool);
      if (confirmation) return NextResponse.json({ confirmation, message: 'Confirme os dados:' });
      return NextResponse.json({ result, message: result?.data?.message || 'Pronto!' });
    }

    // Processar com Claude
    const claudeResponse = await processMessage(message, context, history || []);

    if (claudeResponse.toolCalls.length === 0) {
      return NextResponse.json({ message: claudeResponse.message });
    }

    // Executar tools
    const executor = new ToolExecutor(user.id);
    
    for (const toolCall of claudeResponse.toolCalls) {
      const { result, confirmation } = await executor.execute(toolCall);

      if (confirmation) {
        return NextResponse.json({
          confirmation,
          message: claudeResponse.message || 'Confirme os dados:'
        });
      }

      if (result) {
        // Múltiplos clientes encontrados
        if (result.data?.multiple && result.data?.clients) {
          return NextResponse.json({
            confirmation: {
              id: `conf_${Date.now()}`,
              type: 'client_select',
              status: 'pending',
              data: {
                query: toolCall.parameters.query,
                candidates: result.data.clients,
                originalRequest: message,
                pendingTool: toolCall
              },
              toolToExecute: toolCall,
              createdAt: new Date()
            },
            message: `Encontrei ${result.data.clients.length} clientes. Qual?`
          });
        }

        return NextResponse.json({
          result,
          message: claudeResponse.message || result.data?.message || 'Pronto!'
        });
      }
    }

    return NextResponse.json({ message: claudeResponse.message || 'Processado!' });

  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 8.2 API de Execução

```typescript
// src/app/api/assistant/execute/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ToolExecutor } from '@/lib/assistant/tool-executor';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { toolCall, confirmationData } = await request.json();

    const finalToolCall = {
      ...toolCall,
      parameters: { ...toolCall.parameters, ...confirmationData }
    };

    const executor = new ToolExecutor(user.id);
    const result = await executor.executeConfirmed(finalToolCall);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error });
    }

    // Sugestões de próximas ações
    const suggestedActions = getSuggestedActions(toolCall.name, confirmationData);

    return NextResponse.json({
      success: true,
      result,
      message: result.data?.message || 'Ação executada!',
      suggestedActions
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getSuggestedActions(toolName: string, data: any) {
  const actions = [];

  if (toolName === 'criar_reuniao') {
    actions.push({
      id: 'send_confirmation',
      label: 'Enviar confirmação',
      icon: 'MessageSquare',
      action: { type: 'tool', toolCall: { name: 'enviar_whatsapp', parameters: { clientId: data.clientId, tipo: 'confirmacao_reuniao' } } }
    });
    actions.push({ id: 'view_calendar', label: 'Ver calendário', icon: 'Calendar', action: { type: 'navigate', path: '/calendar' } });
  }

  if (toolName === 'criar_tarefa') {
    actions.push({ id: 'view_tasks', label: 'Ver tarefas', icon: 'CheckSquare', action: { type: 'navigate', path: '/tasks' } });
  }

  if (toolName === 'enviar_whatsapp') {
    actions.push({ id: 'view_history', label: 'Ver histórico', icon: 'History', action: { type: 'navigate', path: '/whatsapp' } });
  }

  return actions;
}
```

### 8.3 API de Contexto

```typescript
// src/app/api/assistant/context/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildUserContext } from '@/lib/assistant/context-builder';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const context = await buildUserContext(user.id);
    return NextResponse.json({ context });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

**Continua na Parte 5 (Final)...**
