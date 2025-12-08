/**
 * @file layout.tsx
 * @description Layout da seção de Leads com sidebar fixa
 * @module app/(dashboard)/leads
 */

'use client';

import { DashboardLayout } from '@/components/layout';
import { Target } from 'lucide-react';

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout
      title={
        <span className="flex items-center gap-2">
          <Target className="w-6 h-6 text-violet-400" />
          Lead Sniper
        </span>
      }
      subtitle="Prospecte leads qualificados para seus clientes"
    >
      {children}
    </DashboardLayout>
  );
}
