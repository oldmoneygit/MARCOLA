/**
 * @file page.tsx
 * @description Página de análise e sugestões (Andromeda)
 * @module app/(dashboard)/analysis
 */

import { AnalysisPageContent } from '@/components/analysis';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function AnalysisPage() {
  return <AnalysisPageContent />;
}
