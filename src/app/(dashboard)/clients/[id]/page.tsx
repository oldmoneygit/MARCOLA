/**
 * @file page.tsx
 * @description Página de detalhes do cliente
 * @module app/(dashboard)/clients/[id]
 */

import { ClientDetailContent } from '@/components/clients/ClientDetailContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <ClientDetailContent clientId={id} />;
}
