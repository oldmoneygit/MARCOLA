/**
 * @file page.tsx
 * @description Página de controle financeiro
 * @module app/(dashboard)/financial
 */

import { FinancialPageContent } from '@/components/financial';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function FinancialPage() {
  return <FinancialPageContent />;
}
