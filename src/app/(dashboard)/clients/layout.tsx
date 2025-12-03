/**
 * @file layout.tsx
 * @description Layout da página de clientes com metadata
 * @module app/(dashboard)/clients
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clientes',
  description: 'Gerencie seus clientes de tráfego pago',
};

export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
