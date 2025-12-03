/**
 * @file layout.tsx
 * @description Layout da página financeira com metadata
 * @module app/(dashboard)/financial
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Financeiro',
  description: 'Controle de cobranças e pagamentos',
};

export default function FinancialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
