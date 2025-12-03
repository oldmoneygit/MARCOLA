/**
 * @file index.ts
 * @description Exportações do módulo OpenRouter
 * @module lib/openrouter
 */

export {
  createOpenRouterClient,
  getOpenRouterClient,
  isOpenRouterAvailable,
  resetOpenRouterClient,
  OPENROUTER_MODELS,
  DEFAULT_MODEL,
  DEFAULT_CONFIG,
} from './client';

export {
  generateAdSuggestions,
  analyzePerformance,
  generateReportSummary,
} from './suggestions';

export { parseClientFromText } from './parseClient';
