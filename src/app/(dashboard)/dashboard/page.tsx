/**
 * @file page.tsx
 * @description Página principal do Dashboard com chat centralizado
 * @module app/(dashboard)/dashboard
 *
 * Interface de chat estilo ChatGPT/Claude como elemento principal.
 */

import { ChatDashboard } from '@/components/dashboard';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return <ChatDashboard />;
}
