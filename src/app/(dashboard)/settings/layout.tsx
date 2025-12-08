/**
 * @file layout.tsx
 * @description Layout da seção de Configurações com sidebar fixa
 * @module app/(dashboard)/settings
 */

'use client';

import { DashboardLayout } from '@/components/layout';
import { Settings } from 'lucide-react';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout
      title={
        <span className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-violet-400" />
          Configurações
        </span>
      }
      subtitle="Personalize sua experiência no MARCOLA"
    >
      {children}
    </DashboardLayout>
  );
}
