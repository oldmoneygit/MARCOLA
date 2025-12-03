/**
 * @file parseClient.ts
 * @description Extrai dados estruturados de cliente a partir de texto livre usando IA
 * @module lib/openrouter
 *
 * @example
 * const result = await parseClientFromText("Academia XYZ, João 11999999999, paga 2000 dia 10");
 * console.log(result.extracted); // { name: "Academia XYZ", contact_name: "João", ... }
 */

import { getOpenRouterClient, OPENROUTER_MODELS, DEFAULT_CONFIG } from './client';

import type { ParsedClientData } from '@/types';

/**
 * Lista de segmentos válidos para matching
 */
const VALID_SEGMENTS = [
  { value: 'fitness', keywords: ['academia', 'fitness', 'crossfit', 'pilates', 'yoga', 'musculação', 'personal'] },
  { value: 'delivery', keywords: ['delivery', 'restaurante', 'pizzaria', 'lanchonete', 'hamburgueria', 'comida', 'gastronomia', 'food'] },
  { value: 'ecommerce', keywords: ['ecommerce', 'e-commerce', 'loja virtual', 'loja online', 'marketplace', 'dropshipping'] },
  { value: 'services', keywords: ['serviço', 'serviços', 'consultoria', 'assessoria', 'agência', 'freelancer'] },
  { value: 'education', keywords: ['educação', 'escola', 'curso', 'cursos', 'ensino', 'faculdade', 'universidade', 'professor', 'mentor', 'coaching'] },
  { value: 'health', keywords: ['saúde', 'clínica', 'consultório', 'médico', 'dentista', 'fisioterapia', 'psicólogo', 'nutricionista', 'hospital'] },
  { value: 'construction', keywords: ['construção', 'construtora', 'imobiliária', 'imóveis', 'arquitetura', 'engenharia', 'reforma'] },
  { value: 'events', keywords: ['evento', 'eventos', 'festas', 'casamento', 'buffet', 'decoração', 'dj', 'fotografia'] },
  { value: 'beauty', keywords: ['beleza', 'estética', 'salão', 'barbearia', 'maquiagem', 'spa', 'skincare', 'cabelo', 'unha'] },
  { value: 'automotive', keywords: ['automotivo', 'carro', 'veículo', 'mecânica', 'auto', 'concessionária', 'funilaria', 'lavajato'] },
  { value: 'other', keywords: [] },
];

/**
 * Prompt do sistema para extração de dados
 */
const SYSTEM_PROMPT = `Você é um assistente especializado em extrair dados estruturados de clientes para uma agência de tráfego pago.

IMPORTANTE: Sua resposta deve ser APENAS um JSON válido, sem explicações adicionais.

Campos a extrair:

DADOS BÁSICOS (obrigatórios marcados com *):
- name*: Nome do cliente/empresa
- segment*: Segmento do negócio (valores válidos: fitness, delivery, ecommerce, services, education, health, construction, events, beauty, automotive, other)
- city: Cidade/região do cliente
- monthly_value*: Valor mensal do serviço em reais (número, sem R$ ou formatação)
- due_day*: Dia do vencimento (1-31)
- average_ticket: Ticket médio em reais (número)

CONTATO:
- contact_name: Nome da pessoa de contato
- contact_phone: Telefone/WhatsApp (normalizar para formato brasileiro)
- contact_email: Email de contato

REDES SOCIAIS:
- instagram_url: @ ou URL do Instagram (normalizar para URL completa)
- facebook_page_id: ID ou URL da página do Facebook

LINKS E RECURSOS:
- ads_account_url: URL da conta de anúncios
- website_url: Site do cliente
- drive_url: URL do Google Drive
- menu_url: URL do cardápio/catálogo
- assets_links: Links de fotos, vídeos ou outros ativos

ESTRATÉGIA:
- peak_hours: Horários de pico do negócio
- differentials: Diferenciais competitivos
- ideal_customer: Perfil do cliente ideal (ICP)
- goals_short_term: Metas de curto prazo (30-60 dias)
- goals_long_term: Metas de longo prazo (6-12 meses)

GESTÃO:
- meeting_frequency: Frequência de reuniões (valores: weekly, biweekly, monthly, on_demand)
- image_authorization: Se tem autorização de uso de imagem (boolean: true/false)
- content_request: Solicitação de produção de conteúdo (quantidade e objetivo de criativos)
- notes: Observações adicionais

Formato de resposta JSON:
{
  "extracted": {
    "name": "string ou null",
    "segment": "string ou null",
    "city": "string ou null",
    "monthly_value": number ou null,
    "due_day": number ou null,
    "average_ticket": number ou null,
    "contact_name": "string ou null",
    "contact_phone": "string ou null",
    "contact_email": "string ou null",
    "instagram_url": "string ou null",
    "facebook_page_id": "string ou null",
    "ads_account_url": "string ou null",
    "website_url": "string ou null",
    "drive_url": "string ou null",
    "menu_url": "string ou null",
    "assets_links": "string ou null",
    "peak_hours": "string ou null",
    "differentials": "string ou null",
    "ideal_customer": "string ou null",
    "goals_short_term": "string ou null",
    "goals_long_term": "string ou null",
    "meeting_frequency": "string ou null",
    "image_authorization": boolean ou null,
    "content_request": "string ou null",
    "notes": "string ou null"
  },
  "confidence": number (0-1),
  "missing_fields": ["lista de campos obrigatórios não encontrados"],
  "suggestions": ["sugestões para o usuário completar dados"]
}

Regras:
1. Se um campo não estiver no texto, retorne null para ele
2. Campos obrigatórios são: name, segment, monthly_value, due_day
3. Normalize telefones para formato (XX) XXXXX-XXXX
4. Se o segmento não for claro, infira pelo contexto ou use "other"
5. Extraia valores monetários ignorando R$, mil, etc. (ex: "2k" = 2000, "1.5k" = 1500)
6. Instagram: normalize @ para URL (ex: @academia -> https://instagram.com/academia)
7. meeting_frequency aceita apenas: weekly, biweekly, monthly, on_demand
8. confidence deve refletir a qualidade da extração (1.0 = todos campos claros, 0.5 = muitos inferidos)`;

/**
 * Extrai dados estruturados de cliente a partir de texto livre
 *
 * @param text - Texto livre descrevendo o cliente
 * @returns Dados parseados do cliente
 * @throws Error se o cliente OpenRouter não estiver disponível ou parsing falhar
 *
 * @example
 * const result = await parseClientFromText(`
 *   Novo cliente: Academia Power Gym
 *   Contato: Carlos, (11) 98765-4321
 *   Valor mensal: R$ 2.500
 *   Vencimento dia 10
 * `);
 */
export async function parseClientFromText(text: string): Promise<ParsedClientData> {
  const client = getOpenRouterClient();

  if (!client) {
    throw new Error('OpenRouter não configurado. Verifique a variável OPENROUTER_API_KEY.');
  }

  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error('Texto vazio fornecido.');
  }

  try {
    const response = await client.chat.send({
      model: OPENROUTER_MODELS.balanced.gpt4oMini,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Extraia os dados do cliente a partir do seguinte texto:\n\n${trimmedText}` },
      ],
      temperature: DEFAULT_CONFIG.temperature,
      maxTokens: DEFAULT_CONFIG.maxTokens,
    });

    const content = response.choices[0]?.message?.content;

    if (!content || typeof content !== 'string') {
      throw new Error('Resposta vazia da IA.');
    }

    const parsed = JSON.parse(content) as Omit<ParsedClientData, 'original_text'>;

    // Validar e normalizar o resultado
    const result: ParsedClientData = {
      extracted: normalizeExtracted(parsed.extracted),
      confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
      missing_fields: parsed.missing_fields || [],
      suggestions: parsed.suggestions || [],
      original_text: trimmedText,
    };

    // Adicionar campos obrigatórios faltantes se não estiverem na lista
    const requiredFields = ['name', 'segment', 'monthly_value', 'due_day'];
    for (const field of requiredFields) {
      const extracted = result.extracted as Record<string, unknown>;
      if (!extracted[field] && !result.missing_fields.includes(field)) {
        result.missing_fields.push(field);
      }
    }

    return result;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Erro ao processar resposta da IA. Tente novamente.');
    }
    throw error;
  }
}

/**
 * Normaliza os dados extraídos
 */
function normalizeExtracted(extracted: Record<string, unknown>): ParsedClientData['extracted'] {
  return {
    // Dados básicos
    name: typeof extracted.name === 'string' ? extracted.name.trim() : undefined,
    segment: normalizeSegment(extracted.segment),
    city: typeof extracted.city === 'string' ? extracted.city.trim() : undefined,
    monthly_value: normalizeNumber(extracted.monthly_value),
    due_day: normalizeDueDay(extracted.due_day),
    average_ticket: normalizeNumber(extracted.average_ticket),

    // Contato
    contact_name: typeof extracted.contact_name === 'string' ? extracted.contact_name.trim() : undefined,
    contact_phone: normalizePhone(extracted.contact_phone),
    contact_email: typeof extracted.contact_email === 'string' ? extracted.contact_email.trim().toLowerCase() : undefined,

    // Redes sociais
    instagram_url: normalizeInstagramUrl(extracted.instagram_url),
    facebook_page_id: typeof extracted.facebook_page_id === 'string' ? extracted.facebook_page_id.trim() : undefined,

    // Links e recursos
    ads_account_url: normalizeUrl(extracted.ads_account_url),
    website_url: normalizeUrl(extracted.website_url),
    drive_url: normalizeUrl(extracted.drive_url),
    menu_url: normalizeUrl(extracted.menu_url),
    assets_links: typeof extracted.assets_links === 'string' ? extracted.assets_links.trim() : undefined,

    // Estratégia
    peak_hours: typeof extracted.peak_hours === 'string' ? extracted.peak_hours.trim() : undefined,
    differentials: typeof extracted.differentials === 'string' ? extracted.differentials.trim() : undefined,
    ideal_customer: typeof extracted.ideal_customer === 'string' ? extracted.ideal_customer.trim() : undefined,
    goals_short_term: typeof extracted.goals_short_term === 'string' ? extracted.goals_short_term.trim() : undefined,
    goals_long_term: typeof extracted.goals_long_term === 'string' ? extracted.goals_long_term.trim() : undefined,

    // Gestão e produção
    meeting_frequency: normalizeMeetingFrequency(extracted.meeting_frequency),
    image_authorization: typeof extracted.image_authorization === 'boolean' ? extracted.image_authorization : undefined,
    content_request: typeof extracted.content_request === 'string' ? extracted.content_request.trim() : undefined,

    // Observações
    notes: typeof extracted.notes === 'string' ? extracted.notes.trim() : undefined,
  };
}

/**
 * Normaliza o segmento para um valor válido
 */
function normalizeSegment(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.toLowerCase().trim();

  // Verifica se é um valor direto válido
  const validValues = VALID_SEGMENTS.map(s => s.value);
  if (validValues.includes(normalized)) {
    return normalized;
  }

  // Tenta encontrar por keywords
  for (const segment of VALID_SEGMENTS) {
    if (segment.keywords.some(kw => normalized.includes(kw))) {
      return segment.value;
    }
  }

  return 'other';
}

/**
 * Normaliza um número
 */
function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

/**
 * Normaliza o dia de vencimento (1-31)
 */
function normalizeDueDay(value: unknown): number | undefined {
  const num = normalizeNumber(value);
  if (num !== undefined && num >= 1 && num <= 31) {
    return Math.floor(num);
  }
  return undefined;
}

/**
 * Normaliza telefone para formato brasileiro
 */
function normalizePhone(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  // Remove tudo exceto números
  const digits = value.replace(/\D/g, '');

  if (digits.length < 10) {
    return undefined;
  }

  // Remove código do país se presente
  const cleanDigits = digits.startsWith('55') && digits.length > 11
    ? digits.slice(2)
    : digits;

  if (cleanDigits.length === 11) {
    return `(${cleanDigits.slice(0, 2)}) ${cleanDigits.slice(2, 7)}-${cleanDigits.slice(7)}`;
  }

  if (cleanDigits.length === 10) {
    return `(${cleanDigits.slice(0, 2)}) ${cleanDigits.slice(2, 6)}-${cleanDigits.slice(6)}`;
  }

  return value.trim();
}

/**
 * Normaliza URL
 */
function normalizeUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  let url = value.trim();

  // Adiciona https:// se não tiver protocolo
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    new URL(url);
    return url;
  } catch {
    return undefined;
  }
}

/**
 * Normaliza URL do Instagram (converte @ para URL completa)
 */
function normalizeInstagramUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  const instagram = value.trim();

  // Se for apenas @username, converte para URL
  if (instagram.startsWith('@')) {
    return `https://instagram.com/${instagram.slice(1)}`;
  }

  // Se for apenas username (sem @), converte para URL
  if (!instagram.includes('/') && !instagram.includes('.')) {
    return `https://instagram.com/${instagram}`;
  }

  // Se já for URL, normaliza
  return normalizeUrl(instagram);
}

/**
 * Normaliza a frequência de reuniões
 */
function normalizeMeetingFrequency(value: unknown): 'weekly' | 'biweekly' | 'monthly' | 'on_demand' | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.toLowerCase().trim();
  const validValues = ['weekly', 'biweekly', 'monthly', 'on_demand'];

  if (validValues.includes(normalized)) {
    return normalized as 'weekly' | 'biweekly' | 'monthly' | 'on_demand';
  }

  // Tenta mapear variações em português
  const mappings: Record<string, 'weekly' | 'biweekly' | 'monthly' | 'on_demand'> = {
    'semanal': 'weekly',
    'quinzenal': 'biweekly',
    'mensal': 'monthly',
    'sob demanda': 'on_demand',
    'quando necessário': 'on_demand',
    'esporádico': 'on_demand',
  };

  return mappings[normalized];
}
