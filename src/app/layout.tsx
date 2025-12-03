/**
 * @file layout.tsx
 * @description Root layout da aplicação TrafficHub
 * @module app
 *
 * @example
 * Este é o layout raiz que envolve todas as páginas da aplicação.
 * Configura fonte, metadata, e providers globais.
 */

import { Inter } from 'next/font/google';

import { Providers } from '@/components/Providers';

import type { Metadata, Viewport } from 'next';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'TrafficHub - Gestão de Tráfego Pago',
    template: '%s | TrafficHub',
  },
  description:
    'Sistema de gestão para agências de tráfego pago. Gerencie clientes, relatórios, cobranças e análises em um só lugar.',
  keywords: [
    'tráfego pago',
    'gestão de anúncios',
    'meta ads',
    'facebook ads',
    'agência digital',
    'dashboard',
  ],
  authors: [{ name: 'TrafficHub Team' }],
  creator: 'TrafficHub',
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0f',
};

// Force dynamic rendering for all pages to prevent static generation issues
export const dynamic = 'force-dynamic';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" data-theme="dark" className={inter.variable}>
      <body className={inter.className}>
        {/* Background decorativo global */}
        <div className="fixed inset-0 bg-mesh pointer-events-none" />

        {/* Orbs flutuantes decorativos */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-20 left-1/4 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl animate-float"
          />
          <div
            className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-float"
            style={{ animationDelay: '-2s' }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: '-4s' }}
          />
        </div>

        {/* Conteúdo da aplicação */}
        <div className="relative z-10">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
