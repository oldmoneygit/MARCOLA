/**
 * @file page.tsx
 * @description Página de detalhe do relatório
 * @module app/(dashboard)/reports/[id]
 */

import { ReportDetailPageContent } from '@/components/reports';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function ReportDetailPage() {
  return <ReportDetailPageContent />;
}
