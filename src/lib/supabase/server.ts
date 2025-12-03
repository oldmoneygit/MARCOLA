/**
 * @file server.ts
 * @description Cliente Supabase para uso no servidor (Server Components, API Routes)
 * @module lib/supabase
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@/types/database';

/**
 * Cria um cliente Supabase para uso no servidor
 * Deve ser usado apenas em Server Components ou API Routes
 *
 * @returns Cliente Supabase configurado com cookies
 *
 * @example
 * // Em um Server Component
 * import { createClient } from '@/lib/supabase/server';
 *
 * export default async function Page() {
 *   const supabase = createClient();
 *   const { data } = await supabase.from('clients').select('*');
 * }
 */
export function createClient() {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Ignora erro em Server Component (cookies são read-only)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // Ignora erro em Server Component (cookies são read-only)
        }
      },
    },
  });
}
