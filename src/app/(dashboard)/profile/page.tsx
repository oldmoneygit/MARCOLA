/**
 * @file page.tsx
 * @description Página de perfil do usuário
 * @module app/profile
 */

import { ProfilePageContent } from '@/components/profile';

export const metadata = {
  title: 'Meu Perfil | MARCOLA',
  description: 'Gerencie suas informações pessoais',
};

export default function ProfilePage() {
  return <ProfilePageContent />;
}
