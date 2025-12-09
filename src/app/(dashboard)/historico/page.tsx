/**
 * @file page.tsx
 * @description Página de Histórico de Execuções
 * @module app/(dashboard)/historico
 */

import { Metadata } from 'next';
import { ExecutionHistoryPageContent } from '@/components/execution-history';

export const metadata: Metadata = {
  title: 'Histórico de Execuções | TrafficHub',
  description: 'Acompanhe todas as ações e otimizações realizadas',
};

export default function HistoricoPage() {
  return <ExecutionHistoryPageContent />;
}
