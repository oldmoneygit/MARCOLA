/**
 * @file page.tsx
 * @description Página principal do Dashboard
 * @module app/(dashboard)/dashboard
 *
 * Exibe visão geral com métricas, alertas e resumos.
 */

import { DashboardPageContent } from '@/components/dashboard';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return <DashboardPageContent />;
}
