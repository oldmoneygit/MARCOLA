/**
 * @file layout.tsx
 * @description Layout da página do dashboard com metadata
 * @module app/(dashboard)/dashboard
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Visão geral do desempenho das campanhas',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
