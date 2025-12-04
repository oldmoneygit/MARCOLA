/**
 * @file route.ts
 * @description API Route para listar templates de mensagens WhatsApp
 * @module api/whatsapp/templates
 */

import { NextResponse } from 'next/server';

import { getAvailableTemplates, getTemplatePreview } from '@/lib/whatsapp/message-templates';

import type { MessageTemplateType } from '@/types/whatsapp';

/**
 * GET /api/whatsapp/templates
 * Retorna lista de templates disponíveis
 *
 * Query params:
 * - preview: Se true, inclui preview com dados de exemplo
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includePreview = searchParams.get('preview') === 'true';

    const templates = getAvailableTemplates();

    if (includePreview) {
      const templatesWithPreview = templates.map((template) => ({
        ...template,
        preview: getTemplatePreview(template.type as MessageTemplateType),
      }));

      return NextResponse.json(templatesWithPreview);
    }

    return NextResponse.json(templates);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar templates';
    console.error('[WhatsApp Templates] Erro:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
