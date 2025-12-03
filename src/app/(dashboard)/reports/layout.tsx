/**
 * @file layout.tsx
 * @description Layout da página de relatórios com metadata
 * @module app/(dashboard)/reports
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Relatórios',
  description: 'Visualize relatórios de performance das campanhas',
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
