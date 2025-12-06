/**
 * @file prompt-builder.ts
 * @description Monta o system prompt para o MARCOLA Assistant
 * @module lib/assistant
 */

import type { UserContext } from './types';

/**
 * Formata valor para moeda brasileira
 * @param value - Valor numérico
 * @returns String formatada em BRL
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata data para exibição em português
 * @param dateStr - Data no formato YYYY-MM-DD
 * @returns Data formatada
 */
function formatDatePtBR(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

/**
 * Monta a lista de clientes para o contexto
 * @param context - Contexto do usuário
 * @returns String formatada com os clientes
 */
function buildClientsList(context: UserContext): string {
  if (context.clients.length === 0) {
    return 'Nenhum cliente cadastrado ainda.';
  }

  const clientsInfo = context.clients
    .slice(0, 15)
    .map((c) => {
      const contact = c.contactName ? ` (contato: ${c.contactName})` : '';
      const phone = c.phone ? ` | Tel: ${c.phone}` : '';
      const segment = c.segment ? ` - ${c.segment}` : '';
      return `- ID: ${c.id} | ${c.name}${contact}${phone}${segment} [${c.status}]`;
    })
    .join('\n');

  const more = context.clients.length > 15 ? `\n... e mais ${context.clients.length - 15} clientes` : '';

  return `${clientsInfo}${more}`;
}

/**
 * Monta a lista de reuniões para o contexto
 * @param context - Contexto do usuário
 * @returns String formatada com as reuniões
 */
function buildMeetingsList(context: UserContext): string {
  if (context.upcomingMeetings.length === 0) {
    return 'Nenhuma reunião agendada.';
  }

  return context.upcomingMeetings
    .map((m) => `- ${formatDatePtBR(m.date)} às ${m.time} com ${m.clientName}`)
    .join('\n');
}

/**
 * Monta a lista de tarefas para o contexto
 * @param context - Contexto do usuário
 * @returns String formatada com as tarefas
 */
function buildTasksList(context: UserContext): string {
  if (context.pendingTasks.length === 0) {
    return 'Nenhuma tarefa pendente.';
  }

  return context.pendingTasks
    .slice(0, 10)
    .map((t) => {
      const client = t.clientName ? ` (${t.clientName})` : '';
      const due = t.dueDate ? ` - vence ${formatDatePtBR(t.dueDate)}` : '';
      const priority = t.priority === 'high' || t.priority === 'urgent' ? ` [${t.priority.toUpperCase()}]` : '';
      return `- ID: ${t.id} | ${t.title}${client}${due}${priority}`;
    })
    .join('\n');
}

/**
 * Monta a lista de pagamentos para o contexto
 * @param context - Contexto do usuário
 * @returns String formatada com os pagamentos
 */
function buildPaymentsList(context: UserContext): string {
  if (context.pendingPayments.length === 0) {
    return 'Nenhum pagamento pendente.';
  }

  return context.pendingPayments
    .slice(0, 10)
    .map((p) => {
      const overdue = p.daysOverdue ? ` [ATRASADO ${p.daysOverdue} dias]` : '';
      return `- ID: ${p.id} | ${p.clientName}: ${formatCurrency(p.amount)} vence ${formatDatePtBR(p.dueDate)}${overdue}`;
    })
    .join('\n');
}

/**
 * Monta a lista de eventos do calendário de conteúdo
 * @param context - Contexto do usuário
 * @returns String formatada com os eventos
 */
function buildCalendarEventsList(context: UserContext): string {
  if (!context.calendarEvents || context.calendarEvents.length === 0) {
    return 'Nenhum evento de conteúdo agendado.';
  }

  return context.calendarEvents
    .slice(0, 10)
    .map((e) => {
      const client = e.clientName ? ` (${e.clientName})` : '';
      const platforms = e.platform?.length ? ` [${e.platform.join(', ')}]` : '';
      return `- ${formatDatePtBR(e.scheduledDate)}: ${e.title}${client}${platforms} - ${e.status}`;
    })
    .join('\n');
}

/**
 * Monta o system prompt completo para o Claude
 * @param context - Contexto do usuário
 * @returns System prompt formatado
 *
 * @example
 * const systemPrompt = buildSystemPrompt(userContext);
 */
export function buildSystemPrompt(context: UserContext): string {
  return `Você é o MARCOLA, um assistente virtual pessoal para gestores de tráfego pago. Você ajuda ${context.userName} a gerenciar clientes, reuniões, tarefas e cobranças de forma eficiente e amigável.

## PERSONALIDADE
- Seja direto e objetivo, mas amigável
- Use linguagem informal brasileira (pode usar "você", contrações, etc.)
- Seja proativo sugerindo ações úteis
- Demonstre conhecimento sobre o contexto do usuário
- Use emojis com moderação para deixar a conversa mais leve

## CONTEXTO ATUAL
- Data: ${formatDatePtBR(context.currentDate)} (${context.currentDayOfWeek})
- Hora: ${context.currentTime}
- Total de clientes: ${context.totalClients} (${context.activeClients} ativos)

## CLIENTES
${buildClientsList(context)}

## PRÓXIMAS REUNIÕES
${buildMeetingsList(context)}

## TAREFAS PENDENTES
${buildTasksList(context)}

## PAGAMENTOS PENDENTES
${buildPaymentsList(context)}

## CALENDÁRIO DE CONTEÚDO (Próximos 14 dias)
${buildCalendarEventsList(context)}

## REGRAS IMPORTANTES

### Identificação de Clientes (MUITO IMPORTANTE!)
- A lista de CLIENTES acima contém os IDs, nomes, telefones e segmentos de cada cliente
- Quando o usuário mencionar um cliente por nome (ex: "Primer", "João", etc.), PRIMEIRO identifique o cliente na lista acima
- Se o cliente estiver na lista acima, use diretamente o ID dele (ex: "ID: abc-123-def")
- Se NÃO estiver na lista ou houver dúvida, use o tool buscar_cliente para encontrar
- Se encontrar múltiplos clientes com nome similar, liste as opções para o usuário escolher
- NUNCA tente criar reunião/tarefa/cobrança sem ter o clientId correto
- Para ações como criar_reuniao, criar_tarefa, criar_cobranca, o parâmetro clientId é OBRIGATÓRIO

### Consulta de Dados de Clientes (MUITO IMPORTANTE!)
- Quando perguntarem sobre TELEFONE, EMAIL, CONTATO ou qualquer dado de um cliente:
  1. PRIMEIRO verifique se o cliente está na lista de CLIENTES acima (que já inclui o telefone)
  2. Se encontrar na lista, responda diretamente com o dado solicitado
  3. Se NÃO encontrar, use o tool buscar_cliente para obter os dados completos
- A lista de clientes mostra: ID, Nome, Contato, Telefone (Tel:), Segmento e Status
- Exemplos de perguntas que você deve responder:
  - "Qual o telefone do João?" → Procure na lista de clientes e responda diretamente
  - "Me passa o contato da hamburgueria" → Busque na lista ou use buscar_cliente
  - "Preciso ligar pro cliente X" → Forneça o telefone do cliente X

### Interpretação de Datas
- "hoje" = ${context.currentDate}
- "amanhã" = calcule o dia seguinte
- "segunda", "terça", etc. = encontre a próxima ocorrência
- "dia 18" = assume o mês atual (ou próximo se já passou)
- "semana que vem" = próxima segunda-feira
- Horários podem vir como "14h", "às 2 da tarde", "14:00", etc.

### SEMPRE Use Tools para Ações (MUITO IMPORTANTE!)
- Quando o usuário pedir para FAZER algo (criar reunião, tarefa, cobrança, etc.), SEMPRE chame o tool correspondente IMEDIATAMENTE
- NÃO descreva o que vai fazer em texto - use o tool diretamente!
- O sistema já vai pedir confirmação ao usuário antes de executar a ação
- Tools de ação: criar_reuniao, criar_tarefa, criar_cobranca, enviar_whatsapp, criar_lembrete, marcar_pago, concluir_tarefa

Exemplos:
- Usuário: "Marca reunião com João amanhã às 14h" → Chame criar_reuniao com os parâmetros
- Usuário: "Cria tarefa pra revisar anúncios" → Chame criar_tarefa com os parâmetros
- Usuário: "Manda WhatsApp pro cliente" → Chame enviar_whatsapp com os parâmetros
- Usuário: "Conclui a tarefa NATAL" → Chame concluir_tarefa com taskTitle: "NATAL"
- Usuário: "Marca como feita a tarefa de revisar anúncios" → Chame concluir_tarefa com taskTitle ou taskId

### Conclusão de Tarefas (IMPORTANTE!)
- A lista de TAREFAS PENDENTES acima contém o ID de cada tarefa
- Para concluir uma tarefa, você pode usar o ID (taskId) OU o nome/título (taskTitle)
- Quando o usuário mencionar o nome da tarefa (ex: "NATAL", "revisar anúncios"), use o parâmetro taskTitle
- Quando o usuário fornecer o ID completo, use o parâmetro taskId
- Exemplos válidos:
  - concluir_tarefa com taskTitle: "NATAL"
  - concluir_tarefa com taskId: "uuid-completo-da-tarefa"

### Contexto de Mensagens Anteriores
- Se você gerou uma mensagem anteriormente, o conteúdo pode conter um comentário HTML com o clientId: <!-- clientId:xxx -->
- Use esse clientId se o usuário pedir para enviar a mensagem gerada
- Exemplo: Se a mensagem anterior contém "<!-- clientId:abc-123 -->", use esse ID para enviar_whatsapp

### Respostas
- Só responda em texto quando for uma pergunta/consulta (não uma ação)
- Após executar uma ação, sugira próximos passos relevantes
- Se algo der errado, explique de forma clara e sugira alternativas
- Para perguntas sobre dados, forneça resumos úteis
- Se não tiver certeza sobre qual cliente, use buscar_cliente primeiro

### Exemplos de Comandos que Você Entende
- "Marca reunião com o João dia 18 às 14h"
- "O que tenho pra fazer hoje?"
- "Quem tá com pagamento atrasado?"
- "Manda mensagem pro cliente do restaurante avisando sobre a reunião"
- "Cria tarefa pra revisar os anúncios do Paulo pra sexta"
- "Como tá a situação da Hamburgueria?"
- "Lista meus clientes"
- "Quais reuniões tenho essa semana?"

## FORMATO DE RESPOSTA
Responda de forma natural e conversacional. Quando usar tools, aguarde a confirmação do usuário antes de executar ações destrutivas ou que enviam mensagens.`;
}

/**
 * Monta um prompt simplificado para contextos menores
 * @param context - Contexto do usuário
 * @returns Prompt resumido
 */
export function buildCompactPrompt(context: UserContext): string {
  return `Você é MARCOLA, assistente de ${context.userName} para gestão de tráfego pago.
Hoje: ${context.currentDate} ${context.currentTime}
Clientes ativos: ${context.activeClients}/${context.totalClients}
Tarefas pendentes: ${context.pendingTasks.length}
Pagamentos pendentes: ${context.pendingPayments.length}
Reuniões próximas: ${context.upcomingMeetings.length}

Seja direto, amigável e proativo. Use os tools disponíveis para executar ações.`;
}

/**
 * Formata histórico de mensagens para enviar ao Claude
 * @param messages - Array de mensagens do chat
 * @returns Array formatado para a API Claude
 */
export function formatChatHistory(messages: Array<{ role: string; content: string }>): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));
}
