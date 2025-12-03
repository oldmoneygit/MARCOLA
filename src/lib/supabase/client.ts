/**
 * @file client.ts
 * @description Cliente Supabase para uso no browser (Client Components)
 * @module lib/supabase
 */

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Cache singleton do cliente Supabase
 */
let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * Cria um cliente Supabase para uso no browser
 * Deve ser usado apenas em Client Components
 *
 * Retorna null se as variáveis de ambiente não estiverem configuradas
 * ou se executado fora do browser (durante build/SSR)
 *
 * @returns Cliente Supabase configurado ou null
 *
 * @example
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 *
 * const supabase = createClient();
 * if (supabase) {
 *   const { data } = await supabase.from('clients').select('*');
 * }
 */
export function createClient(): SupabaseClient<Database> | null {
  // Verifica se estamos no browser
  if (typeof window === 'undefined') {
    return null;
  }

  // Retorna o cliente em cache se existir
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Se as variáveis de ambiente não estão configuradas, retorna null
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Environment variables not configured');
    return null;
  }

  // Cria e cacheia o cliente
  supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}
