/**
 * @file index.ts
 * @description Barrel export para clientes Supabase
 * @module lib/supabase
 */

// Re-exporta os clientes com nomes descritivos
export { createClient as createBrowserClient } from './client';
export { updateSession } from './middleware';
export { createClient as createServerClient } from './server';
