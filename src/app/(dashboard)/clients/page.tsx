/**
 * @file page.tsx
 * @description Página de listagem de clientes
 * @module app/(dashboard)/clients
 */

import { ClientsPageContent } from '@/components/clients/ClientsPageContent';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function ClientsPage() {
  return <ClientsPageContent />;
}
