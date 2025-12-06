/**
 * @file index.ts
 * @description Export central dos Tools Avançados do MARCOLA Assistant
 * @module lib/assistant/tools-advanced
 */

// Definições de Tools
export { BATCH_ACTION_TOOLS } from './batch-actions';
export { INTELLIGENCE_TOOLS } from './intelligence';
export { COMMUNICATION_TOOLS } from './communication';
export { META_ACTION_TOOLS } from './meta-actions';

// Executors
export { BatchActionsExecutor } from './batch-actions-executor';
export { IntelligenceExecutor } from './intelligence-executor';
export { CommunicationExecutor } from './communication-executor';
export { MetaActionsExecutor } from './meta-actions-executor';

// Importar para combinar
import { BATCH_ACTION_TOOLS } from './batch-actions';
import { INTELLIGENCE_TOOLS } from './intelligence';
import { COMMUNICATION_TOOLS } from './communication';
import { META_ACTION_TOOLS } from './meta-actions';

/**
 * Todos os tools avançados combinados
 */
export const ALL_ADVANCED_TOOLS = [
  ...BATCH_ACTION_TOOLS,
  ...INTELLIGENCE_TOOLS,
  ...COMMUNICATION_TOOLS,
  ...META_ACTION_TOOLS
];

/**
 * Lista de tools que requerem confirmação
 */
export const TOOLS_REQUIRING_CONFIRMATION = [
  'cobrar_todos_vencidos',
  'confirmar_reunioes_amanha',
  'gerar_faturas_mes',
  'enviar_followup_lote',
  'registrar_pos_reuniao',
  'agendar_recorrente',
  'onboarding_cliente'
];

/**
 * Helper para verificar se tool requer confirmação
 */
export function requiresConfirmation(toolName: string): boolean {
  return TOOLS_REQUIRING_CONFIRMATION.includes(toolName);
}

/**
 * Helper para verificar se é um tool avançado
 */
export function isAdvancedTool(toolName: string): boolean {
  return ALL_ADVANCED_TOOLS.some(tool => tool.name === toolName);
}
