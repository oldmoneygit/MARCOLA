/**
 * @file index.ts
 * @description Barrel export para componentes de layout
 * @module components/layout
 *
 * @example
 * import { DashboardLayout, Sidebar, Header } from '@/components/layout';
 */

export { DashboardLayout, useSidebarState } from './DashboardLayout';
export { Header, UserMenu } from './Header';
export { Sidebar } from './Sidebar';

// Types
export type { DashboardLayoutProps } from './DashboardLayout';
export type { HeaderProps, UserMenuProps } from './Header';
export type { SidebarProps } from './Sidebar';
