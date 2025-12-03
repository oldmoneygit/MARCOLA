/**
 * @file layout.tsx
 * @description Layout da página de análise com metadata
 * @module app/(dashboard)/analysis
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Análise & Sugestões',
  description: 'Análises inteligentes do algoritmo Andromeda',
};

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
