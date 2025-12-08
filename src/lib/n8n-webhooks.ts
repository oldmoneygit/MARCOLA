/**
 * @file n8n-webhooks.ts
 * @description Configuração centralizada de todos os webhooks n8n
 * @module lib/n8n-webhooks
 *
 * MAPEAMENTO COMPLETO:
 *
 * | Webhook                      | Descrição                        | Status        |
 * |------------------------------|----------------------------------|---------------|
 * | /webhook/lead-sniper         | Lead Sniper v2 (antigo)          | ⚠️ LEGADO     |
 * | /webhook/verificar-ads       | Verificação de Ads               | ✅ ATIVO      |
 * | /webhook/analisar-lead       | Análise IA rápida                | ⚠️ LEGADO     |
 * | /webhook/diagnostico         | Diagnóstico Profundo v2 (Apify)  | ✅ ATIVO      |
 * | /webhook/lead-sniper/v3      | Lead Sniper v3 Rápido (Apify)    | ⚠️ NÃO USADO  |
 * | /webhook/lead-sniper/v3/ai   | Lead Sniper v3 AI (Apify+OpenAI) | ⭐ RECOMENDADO |
 * | /webhook/lead-sniper/v3/full | Lead Sniper v3 Full (Scraping)   | ⚠️ NÃO USADO  |
 */

// Base URL do servidor n8n
const N8N_BASE_URL = process.env.N8N_WEBHOOK_BASE_URL || 'https://n8n.srv1180872.hstgr.cloud';

/**
 * Webhooks do Lead Sniper
 */
export const LEAD_SNIPER_WEBHOOKS = {
  /** Lead Sniper v2 - LEGADO (usar v3 AI para novas pesquisas) */
  V2: `${N8N_BASE_URL}/webhook/lead-sniper`,

  /** Lead Sniper v3 Rápido - Apenas Apify sem IA */
  V3_RAPIDO: `${N8N_BASE_URL}/webhook/lead-sniper/v3`,

  /** Lead Sniper v3 AI - ⭐ RECOMENDADO (Apify + OpenAI) */
  V3_AI: `${N8N_BASE_URL}/webhook/lead-sniper/v3/ai`,

  /** Lead Sniper v3 Full - Com scraping completo de sites */
  V3_FULL: `${N8N_BASE_URL}/webhook/lead-sniper/v3/full`,
} as const;

/**
 * Webhooks de Análise de Leads
 */
export const ANALISE_WEBHOOKS = {
  /** Verificação de Ads (Google Ads, Facebook Ads, etc) */
  VERIFICAR_ADS: `${N8N_BASE_URL}/webhook/verificar-ads`,

  /** Análise IA rápida - LEGADO (usar DIAGNOSTICO para análise completa) */
  ANALISAR_LEAD: `${N8N_BASE_URL}/webhook/analisar-lead`,

  /** Diagnóstico Profundo v2 - Análise completa via Apify */
  DIAGNOSTICO: `${N8N_BASE_URL}/webhook/diagnostico`,
} as const;

/**
 * Webhooks do WhatsApp Evolution
 */
export const WHATSAPP_WEBHOOKS = {
  CRIAR_INSTANCIA: `${N8N_BASE_URL}/webhook/wa/criar`,
  QRCODE: `${N8N_BASE_URL}/webhook/wa/qrcode`,
  STATUS: `${N8N_BASE_URL}/webhook/wa/status`,
  ENVIAR: `${N8N_BASE_URL}/webhook/wa/enviar`,
  DESCONECTAR: `${N8N_BASE_URL}/webhook/wa/desconectar`,
} as const;

/**
 * Todos os webhooks em um único objeto
 */
export const N8N_WEBHOOKS = {
  leadSniper: LEAD_SNIPER_WEBHOOKS,
  analise: ANALISE_WEBHOOKS,
  whatsapp: WHATSAPP_WEBHOOKS,
} as const;

/**
 * Retorna a URL do webhook recomendado para cada funcionalidade
 */
export const WEBHOOK_RECOMENDADO = {
  /** Para novas pesquisas de leads, use v3 AI */
  NOVA_PESQUISA: LEAD_SNIPER_WEBHOOKS.V3_AI,

  /** Para diagnóstico completo de um lead */
  DIAGNOSTICO: ANALISE_WEBHOOKS.DIAGNOSTICO,

  /** Para verificar se o lead faz ads */
  VERIFICAR_ADS: ANALISE_WEBHOOKS.VERIFICAR_ADS,
} as const;

export default N8N_WEBHOOKS;
