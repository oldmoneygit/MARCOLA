/**
 * @file page.tsx
 * @description Página de configurações do sistema
 * @module app/settings
 */

import { SettingsPageContent } from '@/components/settings';

export const metadata = {
  title: 'Configurações | MARCOLA',
  description: 'Configure suas preferências no MARCOLA',
};

export default function SettingsPage() {
  return <SettingsPageContent />;
}
