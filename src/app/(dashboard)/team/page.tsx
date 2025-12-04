/**
 * @file page.tsx
 * @description Página de gestão de equipe
 * @module app/team
 */

import { TeamPageContent } from '@/components/team';

export const metadata = {
  title: 'Equipe | MARCOLA',
  description: 'Gerencie sua equipe e atribua tarefas',
};

export default function TeamPage() {
  return <TeamPageContent />;
}
