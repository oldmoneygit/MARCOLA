/**
 * @file middleware.ts
 * @description Middleware de proteção de rotas
 * @module middleware
 *
 * Protege rotas que requerem autenticação e redireciona
 * usuários não autenticados para login.
 */

import { NextResponse } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

import type { NextRequest } from 'next/server';

/**
 * Rotas que requerem autenticação
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/clients',
  '/reports',
  '/analysis',
  '/financial',
];

/**
 * Rotas públicas (acessíveis apenas sem autenticação)
 */
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Verifica se a rota é protegida
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Verifica se a rota é de autenticação
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Se a rota é protegida e o usuário não está autenticado
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se o usuário está autenticado e tenta acessar rotas de auth
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
