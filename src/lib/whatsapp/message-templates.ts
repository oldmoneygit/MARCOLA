/**
 * @file message-templates.ts
 * @description Templates de mensagens WhatsApp pré-definidos
 * @module lib/whatsapp
 *
 * @example
 * import { processTemplate, MESSAGE_TEMPLATES } from '@/lib/whatsapp/message-templates';
 * const message = processTemplate('payment_reminder', { nome: 'João', valor: '1.500,00' });
 */

import type { WhatsAppTemplate, MessageTemplateType } from '@/types/whatsapp';

// ═══════════════════════════════════════════════════════════════
// TEMPLATES DE MENSAGEM
// ═══════════════════════════════════════════════════════════════

/**
 * Templates de mensagens pré-definidos
 * Cada template contém placeholders como {nome}, {valor}, etc.
 */
export const MESSAGE_TEMPLATES: Record<MessageTemplateType, WhatsAppTemplate> = {
  payment_reminder: {
    type: 'payment_reminder',
    title: 'Lembrete de Pagamento',
    description: 'Envia lembrete amigável sobre pagamento próximo do vencimento',
    template: `💰 *Lembrete de Pagamento*

Olá {nome}! 👋

Este é um lembrete amigável sobre o pagamento da gestão de tráfego.

📅 *Vencimento:* {data_vencimento}
💵 *Valor:* R$ {valor}

Se já realizou o pagamento, por favor desconsidere esta mensagem.

Qualquer dúvida, estou à disposição! 🚀

---
_MARCOLA Gestor de Tráfegos_`,
    variables: ['nome', 'data_vencimento', 'valor'],
  },

  payment_overdue: {
    type: 'payment_overdue',
    title: 'Pagamento em Atraso',
    description: 'Notifica sobre pagamento vencido',
    template: `⚠️ *Pagamento em Atraso*

Olá {nome}!

Identificamos que o pagamento referente à gestão de tráfego está em atraso.

📅 *Vencimento:* {data_vencimento}
💵 *Valor:* R$ {valor}
⏰ *Dias em atraso:* {dias_atraso}

Por favor, regularize o quanto antes para evitar a suspensão dos serviços.

Precisa de ajuda? Me chama! 💬

---
_MARCOLA Gestor de Tráfegos_`,
    variables: ['nome', 'data_vencimento', 'valor', 'dias_atraso'],
  },

  task_completed: {
    type: 'task_completed',
    title: 'Tarefa Concluída',
    description: 'Notifica cliente sobre tarefa finalizada',
    template: `✅ *Tarefa Concluída!*

Olá {nome}! 👋

Acabei de finalizar uma tarefa importante:

📋 *Tarefa:* {tarefa}
📅 *Concluída em:* {data_conclusao}

{observacao}

Qualquer dúvida, estou à disposição! 🚀

---
_MARCOLA Gestor de Tráfegos_`,
    variables: ['nome', 'tarefa', 'data_conclusao', 'observacao'],
  },

  task_assigned: {
    type: 'task_assigned',
    title: 'Nova Tarefa Atribuída',
    description: 'Notifica membro da equipe sobre nova tarefa',
    template: `🔔 *Nova Tarefa Atribuída*

Olá {nome}!

Você tem uma nova tarefa:

📋 *Tarefa:* {tarefa}
🏢 *Cliente:* {cliente}
📅 *Prazo:* {prazo}
⚡ *Prioridade:* {prioridade}

Acesse a plataforma para mais detalhes.

---
_MARCOLA Gestor de Tráfegos_`,
    variables: ['nome', 'tarefa', 'cliente', 'prazo', 'prioridade'],
  },

  report_ready: {
    type: 'report_ready',
    title: 'Relatório Disponível',
    description: 'Notifica cliente sobre novo relatório de performance',
    template: `📊 *Relatório Pronto!*

Olá {nome}! 👋

O relatório de performance está disponível:

📅 *Período:* {periodo}
📈 *Principais métricas:*
• Investimento: R$ {investimento}
• Resultados: {resultados}
• CPA: R$ {cpa}

{observacao}

Quer agendar uma call para discutir os resultados? 📞

---
_MARCOLA Gestor de Tráfegos_`,
    variables: ['nome', 'periodo', 'investimento', 'resultados', 'cpa', 'observacao'],
  },

  custom: {
    type: 'custom',
    title: 'Mensagem Personalizada',
    description: 'Mensagem livre sem template',
    template: `{mensagem}`,
    variables: ['mensagem'],
  },
};

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES DE PROCESSAMENTO
// ═══════════════════════════════════════════════════════════════

/**
 * Processa um template substituindo variáveis pelos valores fornecidos
 *
 * @param templateType - Tipo do template a ser processado
 * @param variables - Objeto com as variáveis e seus valores
 * @returns Mensagem processada com variáveis substituídas
 *
 * @example
 * const message = processTemplate('payment_reminder', {
 *   nome: 'João Silva',
 *   data_vencimento: '10/01/2025',
 *   valor: '1.500,00'
 * });
 */
export function processTemplate(
  templateType: MessageTemplateType,
  variables: Record<string, string>
): string {
  const template = MESSAGE_TEMPLATES[templateType];

  if (!template) {
    console.warn(`[Templates] Template não encontrado: ${templateType}`);
    return '';
  }

  let message = template.template;

  // Substitui todas as variáveis
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    message = message.replace(regex, value || '');
  });

  // Remove variáveis não substituídas (deixa o placeholder vazio)
  message = message.replace(/{[^}]+}/g, '');

  // Remove linhas vazias consecutivas
  message = message.replace(/\n{3,}/g, '\n\n');

  return message.trim();
}

/**
 * Retorna lista de templates disponíveis
 */
export function getAvailableTemplates(): WhatsAppTemplate[] {
  return Object.values(MESSAGE_TEMPLATES);
}

/**
 * Retorna um template específico pelo tipo
 */
export function getTemplate(type: MessageTemplateType): WhatsAppTemplate | null {
  return MESSAGE_TEMPLATES[type] || null;
}

/**
 * Retorna as variáveis necessárias para um template
 */
export function getTemplateVariables(type: MessageTemplateType): string[] {
  const template = MESSAGE_TEMPLATES[type];
  return template?.variables || [];
}

/**
 * Valida se todas as variáveis obrigatórias foram fornecidas
 *
 * @param templateType - Tipo do template
 * @param variables - Variáveis fornecidas
 * @returns Objeto com status e variáveis faltantes
 */
export function validateTemplateVariables(
  templateType: MessageTemplateType,
  variables: Record<string, string>
): { valid: boolean; missing: string[] } {
  const required = getTemplateVariables(templateType);

  // Para template custom, mensagem é obrigatória
  if (templateType === 'custom') {
    const hasMensagem = Boolean(variables.mensagem && variables.mensagem.trim().length > 0);
    return {
      valid: hasMensagem,
      missing: hasMensagem ? [] : ['mensagem'],
    };
  }

  // Para outros templates, verifica variáveis obrigatórias
  const missing = required.filter((varName) => {
    // observacao é opcional em todos os templates
    if (varName === 'observacao') {
      return false;
    }
    return !variables[varName] || variables[varName].trim().length === 0;
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Preview do template com dados de exemplo
 */
export function getTemplatePreview(templateType: MessageTemplateType): string {
  const exampleData: Record<string, string> = {
    nome: 'Cliente Exemplo',
    data_vencimento: '10/01/2025',
    valor: '1.500,00',
    dias_atraso: '5',
    tarefa: 'Criar novos criativos para campanha',
    data_conclusao: 'Hoje às 15:00',
    observacao: 'Observação adicional aqui',
    cliente: 'Empresa ABC',
    prazo: '15/01/2025',
    prioridade: 'Alta',
    periodo: 'Dezembro 2024',
    investimento: '5.000,00',
    resultados: '150 leads',
    cpa: '33,33',
    mensagem: 'Sua mensagem personalizada aqui...',
  };

  return processTemplate(templateType, exampleData);
}
