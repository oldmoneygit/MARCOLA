/**
 * @file page.tsx
 * @description Página de aceite de convite
 * @module app/invite/[token]
 */

import { AcceptInvitePage } from '@/components/invite/AcceptInvitePage';

export const metadata = {
  title: 'Aceitar Convite | MARCOLA',
  description: 'Aceite seu convite para acessar o MARCOLA',
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  return <AcceptInvitePage token={token} />;
}
