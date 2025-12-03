/**
 * @file page.tsx
 * @description Página de relatórios de performance
 * @module app/(dashboard)/reports
 */

import { ReportsPageContent } from '@/components/reports/ReportsPageContent';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function ReportsPage() {
  return <ReportsPageContent />;
}
