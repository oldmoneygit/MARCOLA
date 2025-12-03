/**
 * @file layout.tsx
 * @description Layout para páginas de autenticação
 * @module app/(auth)
 */

import { APP_NAME } from '@/lib/constants';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-violet-600/20 to-indigo-600/20">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-mesh opacity-50" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">{APP_NAME}</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Gestão inteligente de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              tráfego pago
            </span>
          </h1>

          <p className="text-lg text-zinc-300 mb-12 max-w-md">
            Gerencie clientes, analise relatórios e receba sugestões inteligentes
            para otimizar suas campanhas.
          </p>

          {/* Features list */}
          <div className="space-y-4">
            {[
              'Importação automática de relatórios',
              'Análise inteligente com algoritmo Andromeda',
              'Controle financeiro integrado',
              'Lembretes de cobrança via WhatsApp',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-violet-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-zinc-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative orbs */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-violet-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-indigo-500/30 rounded-full blur-3xl" />
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
