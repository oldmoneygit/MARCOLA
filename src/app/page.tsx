/**
 * @file page.tsx
 * @description Página inicial - redireciona para dashboard ou login
 * @module app
 */

import { redirect } from 'next/navigation';

import { ROUTES } from '@/lib/constants';

/**
 * Página inicial da aplicação
 * Redireciona para o dashboard (que verificará autenticação)
 */
export default function HomePage() {
  redirect(ROUTES.DASHBOARD);
}
