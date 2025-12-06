/**
 * @file index.ts
 * @description Exportações do módulo MARCOLA Assistant
 * @module lib/assistant
 */

// Types
export * from './types';

// Tools
export {
  ASSISTANT_TOOLS,
  getToolsForClaude,
  toolRequiresConfirmation,
  getConfirmationType,
  getToolDefinition,
  getToolNames
} from './tools';

// Context Builder
export {
  buildUserContext,
  getClientById,
  searchClients
} from './context-builder';

// Prompt Builder
export {
  buildSystemPrompt,
  buildCompactPrompt,
  formatChatHistory
} from './prompt-builder';

// AI Client (multi-provider com fallback)
export {
  processMessage,
  generateSimpleResponse,
  getAvailableProviders,
  hasAvailableProvider
} from './ai-client';

// Claude Client (legado - mantido para compatibilidade)
export {
  continueWithToolResults,
  validateApiKey
} from './claude-client';

// Tool Executor
export { executeTool } from './tool-executor';
