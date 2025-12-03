/**
 * @file layout.tsx
 * @description Layout wrapper para rotas do dashboard
 * @module app/(dashboard)
 *
 * Este layout envolve todas as páginas dentro do grupo (dashboard)
 * e não adiciona segmentos à URL.
 */

// Force dynamic rendering to prevent static generation issues with event handlers
export const dynamic = 'force-dynamic';

interface DashboardGroupLayoutProps {
  children: React.ReactNode;
}

export default function DashboardGroupLayout({ children }: DashboardGroupLayoutProps) {
  return <>{children}</>;
}
