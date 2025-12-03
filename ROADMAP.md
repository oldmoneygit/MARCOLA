# ROADMAP.md - Guia Completo de Implementação do TrafficHub

---

## 📋 Sumário

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Estado Atual](#estado-atual)
3. [Fases de Implementação](#fases-de-implementação)
4. [Fase 0: Setup Inicial](#fase-0-setup-inicial)
5. [Fase 1: Infraestrutura Base](#fase-1-infraestrutura-base)
6. [Fase 2: Autenticação](#fase-2-autenticação)
7. [Fase 3: Layout e Navegação](#fase-3-layout-e-navegação)
8. [Fase 4: Módulo de Clientes](#fase-4-módulo-de-clientes)
9. [Fase 5: Módulo de Relatórios](#fase-5-módulo-de-relatórios)
10. [Fase 6: Módulo Financeiro](#fase-6-módulo-financeiro)
11. [Fase 7: Módulo de Análise](#fase-7-módulo-de-análise)
12. [Fase 8: Dashboard Principal](#fase-8-dashboard-principal)
13. [Fase 9: Refinamentos e Otimização](#fase-9-refinamentos-e-otimização)
14. [Fase 10: Deploy e Produção](#fase-10-deploy-e-produção)
15. [Cronograma de Validações](#cronograma-de-validações)
16. [Checklist por Task](#checklist-por-task)

---

## 🎯 Visão Geral do Projeto

**TrafficHub** é um sistema SaaS de gestão interna para agências de tráfego pago, oferecendo:

| Módulo | Funcionalidade Principal |
|--------|-------------------------|
| Dashboard | Visão geral de métricas, alertas e cobranças |
| Clientes | CRUD completo com status e histórico |
| Relatórios | Importação CSV, métricas de performance |
| Análise | Sugestões automáticas, detecção de fadiga criativa |
| Financeiro | Controle de cobranças, templates WhatsApp |

### Stack Tecnológica

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS + DaisyUI + Glassmorphism
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

---

## 📊 Estado Atual

### O que JÁ existe:
- [x] Documentação completa (8 arquivos .md)
- [x] package.json com dependências definidas
- [x] Configurações: tsconfig.json, tailwind.config.ts, next.config.js
- [x] Mockup visual do dashboard (HTML/JSX)

### O que FALTA implementar:
- [ ] Estrutura de pastas src/
- [ ] Componentes UI base
- [ ] Sistema de autenticação
- [ ] Layout com Sidebar
- [ ] Módulo de Clientes
- [ ] Módulo de Relatórios
- [ ] Módulo Financeiro
- [ ] Módulo de Análise
- [ ] Dashboard principal
- [ ] API Routes
- [ ] Integração Supabase
- [ ] Banco de dados (migrations)

---

## 🗺️ Fases de Implementação

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ROADMAP DE IMPLEMENTAÇÃO                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FASE 0          FASE 1          FASE 2          FASE 3                      │
│  ┌─────┐         ┌─────┐         ┌─────┐         ┌─────┐                     │
│  │Setup│────────▶│Infra│────────▶│Auth │────────▶│Layout│                    │
│  │     │         │Base │         │     │         │     │                     │
│  └─────┘         └─────┘         └─────┘         └─────┘                     │
│                                                       │                      │
│                                                       ▼                      │
│  FASE 8          FASE 7          FASE 6          FASE 5          FASE 4      │
│  ┌─────┐         ┌─────┐         ┌─────┐         ┌─────┐         ┌─────┐     │
│  │Dash │◀────────│Anál │◀────────│Finan│◀────────│Relat│◀────────│Clien│     │
│  │board│         │ise  │         │ceiro│         │órios│         │tes  │     │
│  └─────┘         └─────┘         └─────┘         └─────┘         └─────┘     │
│     │                                                                        │
│     ▼                                                                        │
│  FASE 9          FASE 10                                                     │
│  ┌─────┐         ┌─────┐                                                     │
│  │Refin│────────▶│Deploy│                                                    │
│  │     │         │Prod. │                                                    │
│  └─────┘         └─────┘                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ FASE 0: Setup Inicial

### Objetivo
Preparar o ambiente de desenvolvimento e garantir que todas as dependências estão funcionando.

### Tasks

#### 0.1 - Instalação de Dependências
```bash
npm install
```

#### 0.2 - Criar estrutura de pastas
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── clients/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   ├── analysis/
│   │   │   └── page.tsx
│   │   ├── financial/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   └── health/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   └── index.ts
│   ├── layout/
│   │   └── index.ts
│   ├── clients/
│   │   └── index.ts
│   ├── reports/
│   │   └── index.ts
│   ├── analysis/
│   │   └── index.ts
│   ├── financial/
│   │   └── index.ts
│   └── dashboard/
│       └── index.ts
├── hooks/
│   └── index.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── utils.ts
│   ├── constants.ts
│   └── validations.ts
├── stores/
│   └── index.ts
├── types/
│   └── index.ts
└── styles/
    └── animations.css
```

#### 0.3 - Configurar variáveis de ambiente
```bash
# Criar .env.local
cp .env.example .env.local
```

Conteúdo do `.env.example`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=TrafficHub
```

#### 0.4 - Validação inicial
```bash
npm run dev
# Acessar http://localhost:3000
# Verificar se não há erros no console
```

### Entregáveis Fase 0
- [ ] Dependências instaladas
- [ ] Estrutura de pastas criada
- [ ] .env.example criado
- [ ] App rodando em localhost:3000
- [ ] `npm run type-check` passa
- [ ] `npm run lint` passa

---

## 🏗️ FASE 1: Infraestrutura Base

### Objetivo
Criar a base de código: types, utils, constants, configurações globais.

### Tasks

#### 1.1 - Types Base (src/types/)

**Arquivo: src/types/index.ts**
```typescript
/**
 * @file index.ts
 * @description Tipos centrais da aplicação
 * @module types
 */

export * from './client';
export * from './report';
export * from './analysis';
export * from './financial';
export * from './database';
```

**Arquivo: src/types/client.ts**
```typescript
/**
 * @file client.ts
 * @description Tipos relacionados a clientes
 * @module types
 */

export type ClientStatus = 'active' | 'paused' | 'inactive';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  segment: string;
  status: ClientStatus;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  monthly_value: number;
  due_day: number;
  ads_account_url?: string;
  website_url?: string;
  drive_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientDTO {
  name: string;
  segment: string;
  monthly_value: number;
  due_day: number;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  ads_account_url?: string;
  website_url?: string;
  drive_url?: string;
  notes?: string;
}

export interface UpdateClientDTO extends Partial<CreateClientDTO> {
  status?: ClientStatus;
}
```

**Criar também:**
- `src/types/report.ts` - Types para relatórios e anúncios
- `src/types/analysis.ts` - Types para sugestões
- `src/types/financial.ts` - Types para pagamentos
- `src/types/database.ts` - Types gerados do Supabase

#### 1.2 - Utils (src/lib/utils.ts)

```typescript
/**
 * @file utils.ts
 * @description Funções utilitárias gerais
 * @module lib
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes Tailwind de forma inteligente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata valor para moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata número para exibição compacta
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}

/**
 * Formata porcentagem
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Calcula CPA
 */
export function calculateCPA(spend: number, conversions: number): number {
  if (conversions === 0) return 0;
  return spend / conversions;
}

/**
 * Calcula CTR
 */
export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}
```

#### 1.3 - Constants (src/lib/constants.ts)

```typescript
/**
 * @file constants.ts
 * @description Constantes globais da aplicação
 * @module lib
 */

export const APP_NAME = 'TrafficHub';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CLIENTS: '/clients',
  CLIENT_DETAIL: (id: string) => `/clients/${id}`,
  REPORTS: '/reports',
  ANALYSIS: '/analysis',
  FINANCIAL: '/financial',
} as const;

export const SEGMENTS = [
  { value: 'fitness', label: 'Academia / Fitness' },
  { value: 'delivery', label: 'Delivery / Restaurante' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'services', label: 'Serviços' },
  { value: 'education', label: 'Educação' },
  { value: 'health', label: 'Saúde' },
  { value: 'construction', label: 'Construção Civil' },
  { value: 'events', label: 'Eventos' },
  { value: 'other', label: 'Outro' },
] as const;

export const CLIENT_STATUS = {
  active: { label: 'Ativo', color: 'success' },
  paused: { label: 'Pausado', color: 'warning' },
  inactive: { label: 'Inativo', color: 'error' },
} as const;

export const PAYMENT_STATUS = {
  pending: { label: 'Pendente', color: 'warning' },
  paid: { label: 'Pago', color: 'success' },
  overdue: { label: 'Atrasado', color: 'error' },
} as const;

export const SUGGESTION_SEVERITY = {
  urgent: { label: 'Urgente', color: 'error', icon: '🔴' },
  warning: { label: 'Atenção', color: 'warning', icon: '🟡' },
  info: { label: 'Sugestão', color: 'info', icon: '🔵' },
} as const;
```

#### 1.4 - Validações (src/lib/validations.ts)

```typescript
/**
 * @file validations.ts
 * @description Schemas de validação com Zod
 * @module lib
 */

import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  segment: z.string().min(1, 'Selecione um segmento'),
  monthly_value: z.number().positive('Valor deve ser positivo'),
  due_day: z.number().min(1).max(31, 'Dia deve estar entre 1 e 31'),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Email inválido').optional().or(z.literal('')),
  ads_account_url: z.string().url('URL inválida').optional().or(z.literal('')),
  website_url: z.string().url('URL inválida').optional().or(z.literal('')),
  drive_url: z.string().url('URL inválida').optional().or(z.literal('')),
  notes: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const paymentSchema = z.object({
  paid_date: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
```

#### 1.5 - Estilos Globais (src/app/globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Backgrounds */
  --bg-primary: #0a0a0f;
  --bg-secondary: #111118;
  --bg-tertiary: #1a1a24;
  --bg-glass: rgba(255, 255, 255, 0.03);
  --bg-glass-hover: rgba(255, 255, 255, 0.06);

  /* Borders */
  --border-primary: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.15);

  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;

  /* Accent */
  --accent-primary: #8b5cf6;
  --accent-glow: rgba(139, 92, 246, 0.25);
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Glassmorphism utilities */
@layer utilities {
  .glass-card {
    @apply backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-2xl transition-all duration-300;
  }

  .glass-card-hover {
    @apply glass-card hover:bg-white/[0.06] hover:border-white/[0.15];
  }

  .glass-sidebar {
    @apply backdrop-blur-2xl bg-black/40 border-r border-white/[0.05];
  }
}

/* Animações */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

/* Scrollbar personalizada */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
```

#### 1.6 - Root Layout (src/app/layout.tsx)

```typescript
/**
 * @file layout.tsx
 * @description Root layout da aplicação
 * @module app
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TrafficHub - Gestão de Tráfego Pago',
  description: 'Sistema de gestão para agências de tráfego pago',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

### Entregáveis Fase 1
- [ ] src/types/* - Todos os tipos definidos
- [ ] src/lib/utils.ts - Funções utilitárias
- [ ] src/lib/constants.ts - Constantes
- [ ] src/lib/validations.ts - Schemas Zod
- [ ] src/app/globals.css - Estilos globais
- [ ] src/app/layout.tsx - Root layout
- [ ] `npm run type-check` passa
- [ ] `npm run lint` passa
- [ ] `npm run build` passa

---

## 🔐 FASE 2: Autenticação

### Objetivo
Implementar sistema de autenticação com Supabase Auth.

### Tasks

#### 2.1 - Configurar Supabase Client

**Arquivo: src/lib/supabase/client.ts**
```typescript
/**
 * @file client.ts
 * @description Cliente Supabase para browser
 * @module lib/supabase
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Arquivo: src/lib/supabase/server.ts**
```typescript
/**
 * @file server.ts
 * @description Cliente Supabase para Server Components e API Routes
 * @module lib/supabase
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle error in Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle error in Server Component
          }
        },
      },
    }
  );
}
```

#### 2.2 - Middleware de Autenticação

**Arquivo: src/middleware.ts**
```typescript
/**
 * @file middleware.ts
 * @description Middleware de autenticação Next.js
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Proteger rotas do dashboard
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!session && request.nextUrl.pathname.startsWith('/clients')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!session && request.nextUrl.pathname.startsWith('/reports')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!session && request.nextUrl.pathname.startsWith('/analysis')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!session && request.nextUrl.pathname.startsWith('/financial')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirecionar usuário logado para dashboard
  if (session && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

#### 2.3 - Hook useAuth

**Arquivo: src/hooks/useAuth.ts**
```typescript
/**
 * @file useAuth.ts
 * @description Hook para gerenciamento de autenticação
 * @module hooks
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('[useAuth] Sign in error:', error);
      throw error;
    }
  }, [supabase.auth, router]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('[useAuth] Sign out error:', error);
      throw error;
    }
  }, [supabase.auth, router]);

  return {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };
}
```

#### 2.4 - Página de Login

**Arquivo: src/app/(auth)/layout.tsx**
```typescript
/**
 * @file layout.tsx
 * @description Layout para rotas de autenticação
 * @module app/(auth)
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      {/* Background decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-violet-500/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
```

**Arquivo: src/app/(auth)/login/page.tsx**
```typescript
/**
 * @file page.tsx
 * @description Página de login
 * @module app/(auth)/login
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { Button, Input, GlassCard } from '@/components/ui';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await signIn(data.email, data.password);
    } catch (err) {
      setError('Email ou senha incorretos');
    }
  };

  return (
    <GlassCard className="p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          TrafficHub
        </h1>
        <p className="text-gray-400 text-sm">
          Entre na sua conta para continuar
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={isSubmitting}
        >
          Entrar
        </Button>
      </form>
    </GlassCard>
  );
}
```

### Entregáveis Fase 2
- [ ] src/lib/supabase/client.ts
- [ ] src/lib/supabase/server.ts
- [ ] src/middleware.ts
- [ ] src/hooks/useAuth.ts
- [ ] src/app/(auth)/layout.tsx
- [ ] src/app/(auth)/login/page.tsx
- [ ] Login funcional com Supabase
- [ ] Rotas protegidas
- [ ] `npm run type-check` passa
- [ ] `npm run lint` passa
- [ ] `npm run build` passa

---

## 📐 FASE 3: Layout e Navegação

### Objetivo
Implementar o layout principal com Sidebar, Header e navegação.

### Tasks

#### 3.1 - Componentes UI Base

Implementar os seguintes componentes em `src/components/ui/`:

| Componente | Descrição |
|------------|-----------|
| GlassCard.tsx | Card com glassmorphism |
| Button.tsx | Botão com variantes |
| Input.tsx | Campo de input |
| Select.tsx | Campo de seleção |
| Modal.tsx | Modal dialog |
| StatusBadge.tsx | Badge de status |
| MetricCard.tsx | Card de métrica |
| AlertCard.tsx | Card de alerta |
| Table.tsx | Tabela de dados |
| Chart.tsx | Wrapper para Recharts |
| Skeleton.tsx | Loading skeleton |
| EmptyState.tsx | Estado vazio |

#### 3.2 - Sidebar

**Arquivo: src/components/layout/Sidebar.tsx**
```typescript
/**
 * @file Sidebar.tsx
 * @description Barra lateral de navegação
 * @module components/layout
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: '📊' },
  { name: 'Clientes', href: ROUTES.CLIENTS, icon: '👥' },
  { name: 'Relatórios', href: ROUTES.REPORTS, icon: '📈' },
  { name: 'Análise', href: ROUTES.ANALYSIS, icon: '🧠' },
  { name: 'Financeiro', href: ROUTES.FINANCIAL, icon: '💰' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen glass-sidebar flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.05]">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          TrafficHub
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-violet-500/20 text-white border border-violet-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.email}
            </p>
          </div>
          <button
            onClick={signOut}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Sair"
          >
            🚪
          </button>
        </div>
      </div>
    </aside>
  );
}
```

#### 3.3 - Dashboard Layout

**Arquivo: src/app/(dashboard)/layout.tsx**
```typescript
/**
 * @file layout.tsx
 * @description Layout do dashboard com sidebar
 * @module app/(dashboard)
 */

import { Sidebar } from '@/components/layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
```

### Entregáveis Fase 3
- [ ] src/components/ui/* - Todos os componentes base
- [ ] src/components/layout/Sidebar.tsx
- [ ] src/components/layout/Header.tsx
- [ ] src/app/(dashboard)/layout.tsx
- [ ] Navegação funcional entre páginas
- [ ] Responsive (mobile drawer)
- [ ] `npm run type-check` passa
- [ ] `npm run lint` passa
- [ ] `npm run build` passa

---

## 👥 FASE 4: Módulo de Clientes

### Objetivo
Implementar CRUD completo de clientes.

### Tasks

#### 4.1 - Hook useClients

```typescript
// src/hooks/useClients.ts
- fetchClients()
- getClient(id)
- createClient(data)
- updateClient(id, data)
- deleteClient(id)
- Estado: clients, loading, error
- Computed: activeClients, clientsWithAlerts
```

#### 4.2 - API Routes

```
src/app/api/clients/
├── route.ts          # GET (list), POST (create)
└── [id]/
    └── route.ts      # GET, PUT, DELETE
```

#### 4.3 - Componentes

```
src/components/clients/
├── ClientCard.tsx      # Card com info do cliente
├── ClientForm.tsx      # Formulário de criação/edição
├── ClientList.tsx      # Grid de cards
├── ClientDetail.tsx    # Página de detalhe
├── ClientFilters.tsx   # Filtros (status, segment, search)
└── index.ts
```

#### 4.4 - Páginas

```
src/app/(dashboard)/clients/
├── page.tsx           # Lista de clientes
└── [id]/
    └── page.tsx       # Detalhe do cliente
```

### Entregáveis Fase 4
- [ ] API Routes funcionais
- [ ] CRUD completo via UI
- [ ] Validação com Zod
- [ ] Feedback de loading/error
- [ ] Empty state
- [ ] Filtros e busca
- [ ] Testes manuais OK
- [ ] `npm run validate` passa

---

## 📈 FASE 5: Módulo de Relatórios

### Objetivo
Implementar importação de CSV e visualização de métricas.

### Tasks

#### 5.1 - CSV Parser

```typescript
// src/lib/csv-parser.ts
- parseCSV(file: File): Promise<ParsedData>
- mapColumns(row: Record<string, string>): AdData
- validateData(data: AdData[]): ValidationResult
```

#### 5.2 - Hook useReports

```typescript
// src/hooks/useReports.ts
- fetchReports(clientId?)
- getReport(id)
- importReport(clientId, file, period)
- deleteReport(id)
- Estado: reports, loading, error
- Computed: reportsByClient
```

#### 5.3 - API Routes

```
src/app/api/reports/
├── route.ts          # GET (list)
├── import/
│   └── route.ts      # POST (import CSV)
└── [id]/
    └── route.ts      # GET, DELETE
```

#### 5.4 - Componentes

```
src/components/reports/
├── CSVImporter.tsx       # Modal de importação
├── MetricsGrid.tsx       # Grid de métricas
├── PerformanceChart.tsx  # Gráficos de evolução
├── AdsTable.tsx          # Tabela de anúncios
├── ReportHeader.tsx      # Header com período e cliente
└── index.ts
```

### Entregáveis Fase 5
- [ ] Importação de CSV funcional
- [ ] Parsing correto dos dados
- [ ] Cálculo de métricas (CPA, CTR, CPM)
- [ ] Visualização de gráficos
- [ ] Tabela de anúncios com status
- [ ] `npm run validate` passa

---

## 💰 FASE 6: Módulo Financeiro

### Objetivo
Implementar controle de pagamentos e lembretes.

### Tasks

#### 6.1 - Hook useFinancial

```typescript
// src/hooks/useFinancial.ts
- fetchPayments(filters?)
- markAsPaid(id, data)
- generateReminder(paymentId)
- getOverview(month)
- Estado: payments, overview, loading
- Computed: overduePayments, upcomingPayments
```

#### 6.2 - API Routes

```
src/app/api/financial/
├── payments/
│   ├── route.ts          # GET
│   └── [id]/
│       ├── route.ts      # GET, PUT
│       ├── pay/
│       │   └── route.ts  # PUT (marcar pago)
│       └── reminder/
│           └── route.ts  # POST (gerar lembrete)
└── overview/
    └── route.ts          # GET
```

#### 6.3 - Componentes

```
src/components/financial/
├── FinancialOverview.tsx  # Cards de resumo
├── PaymentsTable.tsx      # Tabela de pagamentos
├── MessageTemplates.tsx   # Templates de mensagem
├── ReminderModal.tsx      # Modal de lembrete
└── index.ts
```

### Entregáveis Fase 6
- [ ] Visualização de pagamentos
- [ ] Marcar como pago
- [ ] Gerar lembrete WhatsApp
- [ ] Templates de mensagem
- [ ] Overview financeiro
- [ ] `npm run validate` passa

---

## 🧠 FASE 7: Módulo de Análise

### Objetivo
Implementar sugestões automáticas e detecção de fadiga criativa.

### Tasks

#### 7.1 - Lógica de Análise

```typescript
// src/lib/analysis.ts
- detectCreativeFatigue(ads: Ad[]): FatigueSuggestion[]
- checkCreativeDiversity(clientId: string): DiversitySuggestion
- generateSuggestions(clientId: string): Suggestion[]
- calculateAndromedaScore(creativesCount: number): Score
```

#### 7.2 - Hook useAnalysis

```typescript
// src/hooks/useAnalysis.ts
- fetchSuggestions(filters?)
- dismissSuggestion(id)
- completeSuggestion(id)
- getCreativeDiversity()
- Estado: suggestions, loading
- Computed: urgentSuggestions, byClient
```

#### 7.3 - Componentes

```
src/components/analysis/
├── AndromedaAlert.tsx    # Alerta de diversidade
├── SuggestionCard.tsx    # Card de sugestão
├── SuggestionList.tsx    # Lista filtrada
├── FatigueIndicator.tsx  # Indicador de fadiga
└── index.ts
```

### Entregáveis Fase 7
- [ ] Detecção de fadiga criativa
- [ ] Sugestões categorizadas (urgente, warning, info)
- [ ] Alerta Andromeda
- [ ] Ações sugeridas
- [ ] Dismiss/Complete sugestões
- [ ] `npm run validate` passa

---

## 📊 FASE 8: Dashboard Principal

### Objetivo
Implementar dashboard com visão consolidada.

### Tasks

#### 8.1 - API Routes

```
src/app/api/dashboard/
├── overview/
│   └── route.ts    # GET métricas gerais
├── alerts/
│   └── route.ts    # GET alertas
└── weekly/
    └── route.ts    # GET dados semanais
```

#### 8.2 - Componentes

```
src/components/dashboard/
├── MetricsOverview.tsx      # 4 cards de métricas
├── AlertsList.tsx           # Lista de alertas
├── UpcomingPayments.tsx     # Próximas cobranças
├── WeeklyChart.tsx          # Gráfico semanal
├── ClientsDistribution.tsx  # Doughnut chart
└── index.ts
```

#### 8.3 - Página Dashboard

```typescript
// src/app/(dashboard)/dashboard/page.tsx
- Server Component para dados iniciais
- Métricas: Clientes, Investimento, CPA, Conversões
- Gráfico de performance semanal
- Alertas importantes
- Próximas cobranças
- Distribuição por cliente
```

### Entregáveis Fase 8
- [ ] Dashboard funcional
- [ ] Métricas em tempo real
- [ ] Gráficos interativos
- [ ] Alertas visíveis
- [ ] Navegação rápida
- [ ] `npm run validate` passa

---

## ✨ FASE 9: Refinamentos e Otimização

### Objetivo
Polir a aplicação e otimizar performance.

### Tasks

#### 9.1 - UX/UI Polish
- [ ] Animações de transição
- [ ] Feedback visual em todas as ações
- [ ] Estados de loading consistentes
- [ ] Tratamento de erros user-friendly
- [ ] Responsividade mobile completa

#### 9.2 - Performance
- [ ] React.memo em componentes pesados
- [ ] useMemo/useCallback onde necessário
- [ ] Lazy loading de componentes
- [ ] Image optimization
- [ ] Bundle size analysis

#### 9.3 - Acessibilidade
- [ ] Labels em todos os inputs
- [ ] ARIA attributes
- [ ] Navegação por teclado
- [ ] Contraste adequado

#### 9.4 - Testes
- [ ] Testes manuais end-to-end
- [ ] Validar todos os fluxos
- [ ] Testar edge cases

### Entregáveis Fase 9
- [ ] App fluido e responsivo
- [ ] Sem bugs conhecidos
- [ ] Bundle < 500KB First Load
- [ ] Lighthouse score > 80
- [ ] `npm run validate` passa

---

## 🚀 FASE 10: Deploy e Produção

### Objetivo
Colocar a aplicação em produção.

### Tasks

#### 10.1 - Supabase Production
- [ ] Criar projeto production
- [ ] Executar migrations
- [ ] Configurar RLS policies
- [ ] Testar conexão

#### 10.2 - Vercel Deploy
- [ ] Conectar repositório
- [ ] Configurar variáveis de ambiente
- [ ] Deploy inicial
- [ ] Configurar domínio (opcional)

#### 10.3 - Monitoramento
- [ ] Verificar logs
- [ ] Testar todos os fluxos em prod
- [ ] Documentar problemas encontrados

### Entregáveis Fase 10
- [ ] App em produção
- [ ] URL pública funcionando
- [ ] Todos os fluxos testados
- [ ] README atualizado com URL

---

## ✅ Cronograma de Validações

Após CADA task, executar:

```bash
# 1. Type check
npm run type-check

# 2. Lint
npm run lint

# 3. Build
npm run build

# 4. Dev server (teste manual)
npm run dev
```

### Se algum comando falhar:

1. **Type error**: Leia a mensagem, corrija o tipo
2. **Lint error**: Execute `npm run lint:fix` ou corrija manualmente
3. **Build error**: Verifique imports, exports, Server/Client components
4. **Runtime error**: Adicione try/catch, verifique logs

---

## 📋 Checklist por Task

Antes de marcar uma task como concluída:

- [ ] Código compila sem erros
- [ ] ESLint passa sem warnings
- [ ] Build passa
- [ ] Funcionalidade testada manualmente
- [ ] Header comments nos arquivos
- [ ] JSDoc em funções complexas
- [ ] Imports ordenados corretamente
- [ ] Sem console.log (apenas console.error)
- [ ] Sem tipos `any`
- [ ] Tratamento de erros implementado
- [ ] Loading states implementados
- [ ] Empty states implementados

---

## 📝 Template de Commit

```bash
git commit -m "feat(scope): descrição breve

- Detalhe 1
- Detalhe 2

🤖 Generated with Claude Code"
```

**Scopes válidos:**
- `setup` - Configuração inicial
- `auth` - Autenticação
- `layout` - Layout e navegação
- `clients` - Módulo de clientes
- `reports` - Módulo de relatórios
- `financial` - Módulo financeiro
- `analysis` - Módulo de análise
- `dashboard` - Dashboard principal
- `ui` - Componentes UI
- `api` - API Routes
- `types` - Types e interfaces
- `lib` - Utilitários

---

## 🎯 Próximo Passo

**Iniciar pela FASE 0: Setup Inicial**

```bash
# 1. Instalar dependências
npm install

# 2. Criar estrutura de pastas
# (seguir a árvore de diretórios da Fase 0.2)

# 3. Criar .env.example
# 4. Validar com npm run dev
```

---

*Este roadmap deve ser seguido sequencialmente. Cada fase depende da anterior estar completa e validada.*

**Última atualização**: Dezembro 2025
