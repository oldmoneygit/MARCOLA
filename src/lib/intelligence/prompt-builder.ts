/**
 * @file prompt-builder.ts
 * @description Construtor de prompts para o sistema Client Intelligence
 * @module lib/intelligence
 */

import type { Client, BriefingData } from '@/types';

/**
 * Formata valor em Real brasileiro
 */
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Não informado';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata porcentagem
 */
function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Não informado';
  }
  return `${value}%`;
}

/**
 * Extrai dados relevantes do briefing de forma legível
 */
function formatBriefingData(briefing: BriefingData | null): string {
  if (!briefing) {
    return 'Nenhum briefing preenchido.';
  }

  const lines: string[] = [];

  Object.entries(briefing).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return;
    }

    // Formatar chave para legível
    const label = key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());

    if (Array.isArray(value)) {
      if (value.length > 0) {
        lines.push(`- ${label}: ${value.join(', ')}`);
      }
    } else if (typeof value === 'boolean') {
      lines.push(`- ${label}: ${value ? 'Sim' : 'Não'}`);
    } else {
      lines.push(`- ${label}: ${value}`);
    }
  });

  return lines.length > 0 ? lines.join('\n') : 'Briefing sem informações relevantes.';
}

/**
 * Obtém datas sazonais relevantes para os próximos 90 dias
 */
function getUpcomingSeasonalDates(): string[] {
  const now = new Date();
  const dates: string[] = [];

  // Mapeamento de datas comemorativas brasileiras
  const seasonalDates = [
    { month: 1, day: 1, name: 'Ano Novo' },
    { month: 2, day: 14, name: 'Carnaval (aproximado)' },
    { month: 3, day: 8, name: 'Dia Internacional da Mulher' },
    { month: 3, day: 15, name: 'Dia do Consumidor' },
    { month: 4, day: 21, name: 'Páscoa (aproximado)' },
    { month: 5, day: 1, name: 'Dia do Trabalho' },
    { month: 5, day: 11, name: 'Dia das Mães (segundo domingo)' },
    { month: 6, day: 12, name: 'Dia dos Namorados' },
    { month: 6, day: 24, name: 'São João' },
    { month: 7, day: 20, name: 'Dia do Amigo' },
    { month: 8, day: 11, name: 'Dia dos Pais (segundo domingo)' },
    { month: 9, day: 7, name: 'Independência do Brasil' },
    { month: 10, day: 12, name: 'Dia das Crianças' },
    { month: 10, day: 15, name: 'Dia do Professor' },
    { month: 10, day: 31, name: 'Halloween' },
    { month: 11, day: 25, name: 'Black Friday (aproximado)' },
    { month: 12, day: 25, name: 'Natal' },
    { month: 12, day: 31, name: 'Réveillon' },
  ];

  const in90Days = new Date(now);
  in90Days.setDate(in90Days.getDate() + 90);

  seasonalDates.forEach(({ month, day, name }) => {
    const date = new Date(now.getFullYear(), month - 1, day);
    // Se a data já passou este ano, considerar próximo ano
    if (date < now) {
      date.setFullYear(date.getFullYear() + 1);
    }
    if (date <= in90Days) {
      dates.push(`${name} (${date.toLocaleDateString('pt-BR')})`);
    }
  });

  return dates;
}

/**
 * Constrói o contexto do cliente para o prompt
 */
function buildClientContext(client: Client): string {
  return `
## DADOS DO CLIENTE

### Perfil do Negócio
- Nome: ${client.name}
- Segmento: ${client.segment}
- Cidade: ${client.city || 'Não informada'}
- Endereço: ${client.address || 'Não informado'}
- Status: ${client.status}

### Contato
- Responsável: ${client.contact_name || 'Não informado'}
- Telefone: ${client.contact_phone || 'Não informado'}
- Email: ${client.contact_email || 'Não informado'}

### Financeiro
- Valor Mensal do Contrato: ${formatCurrency(client.monthly_value)}
- Ticket Médio: ${formatCurrency(client.average_ticket)}
- Margem de Lucro: ${formatPercentage(client.profit_margin)}
- Orçamento Mensal de Anúncios: ${formatCurrency(client.monthly_ad_budget)}
- Dia de Vencimento: ${client.due_day}

### Presença Digital
- Instagram: ${client.instagram_url || 'Não informado'}
- Website: ${client.website_url || 'Não informado'}
- Conta de Anúncios: ${client.ads_account_url || 'Não informado'}
- Pasta Google Drive: ${client.drive_url || 'Não informado'}
- Cardápio/Catálogo: ${client.menu_url || 'Não informado'}

### Estratégia (se disponível)
- Horários de Pico: ${client.peak_hours || 'Não informado'}
- Diferenciais: ${client.differentials || 'Não informado'}
- Cliente Ideal: ${client.ideal_customer || 'Não informado'}
- Metas Curto Prazo: ${client.goals_short_term || 'Não informado'}
- Metas Longo Prazo: ${client.goals_long_term || 'Não informado'}

### Produção de Conteúdo
- Frequência de Reuniões: ${client.meeting_frequency || 'Não definida'}
- Frequência de Captações: ${client.captation_frequency || 'Não definida'}
- Vídeos para Vendas: ${client.videos_sales || 'Não definido'}
- Vídeos para Reconhecimento: ${client.videos_awareness || 'Não definido'}
- Autorização de Imagem: ${client.image_authorization ? 'Sim' : 'Não/Não informado'}
- Solicitação de Conteúdo: ${client.content_request || 'Nenhuma'}

### Observações
${client.notes || 'Nenhuma observação.'}
`.trim();
}

/**
 * Prompt para gerar a Knowledge Base estruturada
 */
export function buildKnowledgeBasePrompt(client: Client, briefing: BriefingData | null): string {
  const clientContext = buildClientContext(client);
  const briefingContext = formatBriefingData(briefing);

  return `
Você é um analista de negócios especializado em marketing digital para pequenas e médias empresas brasileiras.

Analise os dados do cliente abaixo e gere uma BASE DE CONHECIMENTO estruturada em JSON.

${clientContext}

### Briefing/Questionário do Cliente
${briefingContext}

---

## INSTRUÇÕES

Gere um JSON com a seguinte estrutura. PREENCHA TODOS OS CAMPOS com base nos dados fornecidos.
Se alguma informação não estiver disponível, infira logicamente com base no segmento e contexto.

\`\`\`json
{
  "profile": {
    "business_name": "string - Nome do negócio",
    "segment": "string - Segmento de atuação",
    "niche_details": "string - Detalhes específicos do nicho (ex: 'academia focada em crossfit para público 25-40 anos')",
    "location": "string - Cidade e região de atuação",
    "operating_since": "string - Tempo de operação se conhecido, ou 'Não informado'"
  },
  "contact": {
    "primary_name": "string - Nome do contato principal",
    "phone": "string - Telefone formatado",
    "email": "string - Email de contato",
    "best_contact_time": "string - Melhor horário para contato (inferir se não informado)"
  },
  "financial": {
    "monthly_fee": number - Valor mensal do contrato,
    "payment_day": number - Dia de vencimento,
    "average_ticket": number - Ticket médio (0 se não informado),
    "profit_margin": number - Margem de lucro em % (usar 30 como padrão se não informado),
    "monthly_ad_budget": number - Orçamento de anúncios (0 se não informado),
    "total_received": number - Total já recebido do cliente (0 se não souber)
  },
  "digital_presence": {
    "instagram": "string ou null - URL do Instagram",
    "facebook": "string ou null - URL do Facebook",
    "website": "string ou null - URL do site",
    "google_business": "string ou null - URL do Google Meu Negócio",
    "other_platforms": ["array de outras plataformas mencionadas"]
  },
  "strategy": {
    "main_objectives": ["array de 3-5 objetivos principais inferidos"],
    "target_audience": "string - Descrição do público-alvo ideal",
    "unique_selling_points": ["array de 3-5 diferenciais do negócio"],
    "competitors": ["array de possíveis concorrentes no segmento"],
    "tone_of_voice": "string - Tom de voz recomendado para comunicação",
    "content_pillars": ["array de 4-6 pilares de conteúdo recomendados"]
  },
  "resources": {
    "has_photos": boolean - Se tem fotos disponíveis,
    "has_videos": boolean - Se tem vídeos disponíveis,
    "has_testimonials": boolean - Se tem depoimentos de clientes,
    "brand_assets": "string ou null - Link para assets da marca",
    "drive_folder": "string ou null - Link do Google Drive"
  },
  "niche_analysis": {
    "market_position": "string - Posicionamento no mercado (líder/desafiante/nicho/novo entrante)",
    "growth_opportunities": ["array de 3-5 oportunidades de crescimento"],
    "main_challenges": ["array de 3-5 desafios principais do negócio"],
    "seasonal_peaks": ["array de períodos sazonais importantes para o segmento"]
  }
}
\`\`\`

RESPONDA APENAS COM O JSON, sem explicações adicionais.
`.trim();
}

/**
 * Prompt para gerar o Executive Summary
 */
export function buildExecutiveSummaryPrompt(client: Client, briefing: BriefingData | null): string {
  const clientContext = buildClientContext(client);
  const briefingContext = formatBriefingData(briefing);

  return `
Você é um consultor sênior de marketing digital especializado em estratégias para pequenas e médias empresas brasileiras.

${clientContext}

### Briefing/Questionário do Cliente
${briefingContext}

---

## TAREFA

Escreva um RESUMO EXECUTIVO de 3-4 parágrafos sobre a estratégia de marketing digital para ${client.name}.

O resumo deve:
1. Começar com uma visão geral do negócio e seu posicionamento no mercado
2. Destacar os principais diferenciais e oportunidades identificadas
3. Apresentar os pilares estratégicos recomendados para as campanhas
4. Finalizar com as principais ações prioritárias e expectativas de resultado

Use linguagem profissional mas acessível. Seja específico sobre ${client.name} - não seja genérico.
Mencione dados concretos quando disponíveis (ticket médio, margem, etc).

IMPORTANTE: O resumo deve ser útil para o gestor de tráfego entender rapidamente o cliente e suas necessidades.
`.trim();
}

/**
 * Prompt para gerar sugestões de conteúdo personalizadas
 */
export function buildContentSuggestionsPrompt(client: Client, briefing: BriefingData | null): string {
  const clientContext = buildClientContext(client);
  const briefingContext = formatBriefingData(briefing);

  return `
Você é um especialista em criação de conteúdo para redes sociais, focado em ${client.segment}.

${clientContext}

### Briefing/Questionário do Cliente
${briefingContext}

---

## TAREFA

Gere 8 sugestões de conteúdo PERSONALIZADAS para ${client.name}.

REGRAS CRÍTICAS:
1. Cada sugestão deve mencionar ESPECIFICAMENTE o negócio "${client.name}"
2. NÃO gere sugestões genéricas como "poste mais vídeos" ou "faça promoções"
3. Cada sugestão deve ter um TÍTULO criativo e uma DESCRIÇÃO clara de como executar
4. Considere os diferenciais, público-alvo e objetivos específicos deste cliente
5. Varie os tipos de conteúdo: posts, vídeos, reels, stories, promoções

Responda em JSON com a seguinte estrutura:

\`\`\`json
[
  {
    "id": "uuid gerado",
    "title": "string - Título criativo e específico (ex: 'Bastidores do Treino Funcional da Academia XYZ')",
    "description": "string - Descrição detalhada de como executar o conteúdo (2-3 frases)",
    "content_type": "post" | "video" | "reels" | "stories" | "promo" | "campaign",
    "platform": ["instagram", "facebook", "tiktok"],
    "objective": "awareness" | "engagement" | "conversion" | "retention",
    "priority": "high" | "medium" | "low",
    "estimated_effort": "quick" | "medium" | "complex",
    "suggested_copy": "string - Sugestão de texto/legenda para o post",
    "visual_suggestion": "string - Descrição do visual recomendado",
    "hashtags": ["array de 5-8 hashtags relevantes"],
    "best_time_to_post": "string - Melhor horário (ex: 'Terça e Quinta às 19h')",
    "based_on": "string - Em qual dado do cliente essa sugestão se baseia",
    "reasoning": "string - Por que essa sugestão é relevante para ESTE cliente especificamente"
  }
]
\`\`\`

RESPONDA APENAS COM O JSON, sem explicações adicionais.
`.trim();
}

/**
 * Prompt para gerar ofertas sazonais com cálculo de margem
 */
export function buildSeasonalOffersPrompt(client: Client, briefing: BriefingData | null): string {
  const clientContext = buildClientContext(client);
  const briefingContext = formatBriefingData(briefing);
  const upcomingDates = getUpcomingSeasonalDates();

  // Usar margem padrão de 30% se não informada
  const profitMargin = client.profit_margin ?? 30;
  const averageTicket = client.average_ticket ?? 100;

  return `
Você é um estrategista de marketing promocional especializado em ofertas e campanhas sazonais.

${clientContext}

### Briefing/Questionário do Cliente
${briefingContext}

### Datas Sazonais Próximas (próximos 90 dias)
${upcomingDates.length > 0 ? upcomingDates.join('\n') : 'Nenhuma data especial identificada no período.'}

---

## TAREFA

Gere 3-4 ofertas sazonais PERSONALIZADAS para ${client.name}.

DADOS PARA CÁLCULOS:
- Ticket Médio: ${formatCurrency(averageTicket)}
- Margem de Lucro Base: ${profitMargin}%
- Orçamento de Anúncios: ${formatCurrency(client.monthly_ad_budget)}

REGRAS CRÍTICAS:
1. Cada oferta deve ser ESPECÍFICA para "${client.name}" e seu segmento
2. Calcule o IMPACTO NA MARGEM de cada desconto proposto
3. Para cada oferta, proponha 3 ÂNGULOS CRIATIVOS diferentes (não apenas desconto em %)
4. Inclua timeline realista de execução
5. Considere o orçamento de anúncios disponível

TIPOS DE ÂNGULOS CRIATIVOS (use variados):
- bundle: Combos e pacotes especiais
- gamification: Roleta, raspadinha, desafios
- upsell: Leve X pague Y, upgrades
- partnership: Parcerias com outros negócios
- early_bird: Primeiros a comprar
- referral: Indicação de amigos
- guarantee: Garantia estendida/satisfação
- experience: Experiências exclusivas
- scarcity: Vagas/unidades limitadas
- giveaway: Sorteios e brindes
- percentage: Desconto percentual clássico
- fixed: Desconto em valor fixo

Responda em JSON:

\`\`\`json
[
  {
    "id": "uuid gerado",
    "title": "string - Nome da campanha (ex: 'Operação Verão ${client.name}')",
    "description": "string - Descrição da estratégia da oferta",
    "seasonal_date": "YYYY-MM-DD - Data principal da campanha",
    "seasonal_name": "string - Nome da data sazonal (ex: 'Dia das Mães')",
    "offer_angles": [
      {
        "angle_name": "string - Nome do ângulo (ex: 'Combo Família Fitness')",
        "offer_type": "bundle" | "gamification" | "upsell" | etc,
        "offer_description": "string - Descrição detalhada da mecânica",
        "discount_value": "string - Valor do desconto/benefício (ex: '20%', 'R$ 50', 'Brinde')",
        "original_price": number - Preço original,
        "offer_price": number - Preço com oferta,
        "margin_impact": number - Nova margem em % após desconto,
        "break_even_sales": number - Quantas vendas extras para compensar desconto,
        "target_audience": "string - Público específico para este ângulo",
        "hook": "string - Gancho de copywriting para atrair atenção",
        "why_this_works": "string - Por que este ângulo funciona para ${client.name}"
      }
    ],
    "budget_options": [
      {
        "level": "minimum" | "recommended" | "aggressive",
        "budget": number - Valor em R$,
        "expected_reach": "string - Alcance estimado",
        "expected_leads": "string - Leads estimados",
        "expected_sales": "string - Vendas estimadas",
        "roi_estimate": "string - ROI estimado"
      }
    ],
    "timeline": {
      "teaser_start": "YYYY-MM-DD - Início do teaser/esquenta",
      "promotion_start": "YYYY-MM-DD - Início da promoção",
      "peak_day": "YYYY-MM-DD - Dia de pico",
      "promotion_end": "YYYY-MM-DD - Fim da promoção"
    },
    "relevance_score": number 1-10 - Quão relevante é para este cliente,
    "reasoning": "string - Por que esta oferta é ideal para ${client.name}"
  }
]
\`\`\`

RESPONDA APENAS COM O JSON, sem explicações adicionais.
`.trim();
}

/**
 * Prompt completo para gerar toda a inteligência de uma vez
 */
export function buildFullIntelligencePrompt(client: Client, briefing: BriefingData | null): string {
  const clientContext = buildClientContext(client);
  const briefingContext = formatBriefingData(briefing);
  const upcomingDates = getUpcomingSeasonalDates();
  const profitMargin = client.profit_margin ?? 30;
  const averageTicket = client.average_ticket ?? 100;

  return `
Você é um consultor sênior de marketing digital especializado em estratégias para pequenas e médias empresas brasileiras.

${clientContext}

### Briefing/Questionário do Cliente
${briefingContext}

### Datas Sazonais Próximas (próximos 90 dias)
${upcomingDates.length > 0 ? upcomingDates.join('\n') : 'Nenhuma data especial identificada no período.'}

### Dados para Cálculos Financeiros
- Ticket Médio: ${formatCurrency(averageTicket)}
- Margem de Lucro Base: ${profitMargin}%
- Orçamento de Anúncios: ${formatCurrency(client.monthly_ad_budget)}

---

## TAREFA

Gere uma ANÁLISE COMPLETA para ${client.name} no formato JSON abaixo.

REGRAS CRÍTICAS:
1. TODAS as sugestões devem ser ESPECÍFICAS para "${client.name}" - nunca genéricas
2. Mencione o nome do negócio, diferenciais e dados concretos nas sugestões
3. Calcule impacto real na margem para ofertas promocionais
4. Seja criativo nos ângulos de ofertas (não apenas descontos)

\`\`\`json
{
  "knowledge_base": {
    // ... estrutura completa de knowledge_base conforme documentado
  },
  "executive_summary": "string - Resumo executivo de 3-4 parágrafos",
  "content_suggestions": [
    // ... array de 8 sugestões de conteúdo
  ],
  "seasonal_offers": [
    // ... array de 3-4 ofertas sazonais
  ]
}
\`\`\`

RESPONDA APENAS COM O JSON, sem explicações adicionais.
`.trim();
}
