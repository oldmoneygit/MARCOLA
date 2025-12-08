/**
 * @file service.ts
 * @description Serviço de Diagnóstico Profundo de Leads via n8n
 * @module lib/diagnostico
 */

import type {
  DiagnosticoRequest,
  DiagnosticoResponse,
  DiagnosticoCompleto,
  DiagnosticoN8nResponse,
  NichoType,
  CatalogoNichos,
} from '@/types/diagnostico';

import { ANALISE_WEBHOOKS } from '@/lib/n8n-webhooks';

// n8n Webhook URL para diagnóstico - Centralizado via n8n-webhooks.ts
const DIAGNOSTICO_WEBHOOK_URL =
  process.env.N8N_DIAGNOSTICO_WEBHOOK_URL || ANALISE_WEBHOOKS.DIAGNOSTICO;

// Timeout de 10 minutos (workflow n8n pode demorar)
const DEFAULT_TIMEOUT = 10 * 60 * 1000;

/**
 * Catálogo de nichos para detecção local
 * Usado como fallback e para enriquecer dados
 */
const CATALOGO_NICHOS: Partial<CatalogoNichos> = {
  academia: {
    nome: 'Academia / Fitness',
    keywords: ['academia', 'fitness', 'musculação', 'crossfit', 'pilates', 'personal'],
    dores: ['retenção de alunos', 'sazonalidade', 'concorrência', 'fidelização'],
    metricas: ['taxa de retenção', 'ticket médio', 'LTV', 'CAC'],
    templates: {
      abertura: 'Vi que sua academia tem potencial incrível...',
      followUp: 'Conseguiu analisar a proposta?',
      fechamento: 'Vamos começar a transformação digital da sua academia?',
    },
  },
  restaurante: {
    nome: 'Restaurante / Alimentação',
    keywords: ['restaurante', 'pizzaria', 'hamburgueria', 'delivery', 'lanchonete', 'bar'],
    dores: ['delivery', 'visibilidade', 'fidelização', 'avaliações negativas'],
    metricas: ['ticket médio', 'pedidos/dia', 'taxa de recompra', 'avaliação média'],
    templates: {
      abertura: 'Percebi que seu restaurante pode atrair muito mais clientes...',
      followUp: 'Já pensou em como o tráfego pago pode lotar seu salão?',
      fechamento: 'Pronto para ver seu restaurante cheio todos os dias?',
    },
  },
  clinica_medica: {
    nome: 'Clínica Médica / Saúde',
    keywords: ['clínica', 'médico', 'dentista', 'odonto', 'dermatologia', 'estética'],
    dores: ['agenda vazia', 'no-show', 'captação de pacientes', 'autoridade'],
    metricas: ['consultas/mês', 'taxa de no-show', 'ticket médio', 'retorno pacientes'],
    templates: {
      abertura: 'Sua clínica merece uma agenda sempre cheia...',
      followUp: 'Imagina ter pacientes agendando todos os dias?',
      fechamento: 'Vamos lotar sua agenda com pacientes qualificados?',
    },
  },
  ecommerce: {
    nome: 'E-commerce / Loja Virtual',
    keywords: ['loja virtual', 'ecommerce', 'e-commerce', 'shopify', 'woocommerce'],
    dores: ['carrinho abandonado', 'tráfego qualificado', 'conversão', 'ROAS'],
    metricas: ['taxa de conversão', 'ROAS', 'ticket médio', 'CAC'],
    templates: {
      abertura: 'Vi oportunidades incríveis para escalar suas vendas...',
      followUp: 'Pronto para multiplicar seu faturamento?',
      fechamento: 'Vamos colocar sua loja para vender 24/7?',
    },
  },
  imobiliaria: {
    nome: 'Imobiliária / Corretor',
    keywords: ['imobiliária', 'corretor', 'imóveis', 'apartamento', 'casa', 'aluguel'],
    dores: ['leads qualificados', 'ciclo de venda longo', 'concorrência'],
    metricas: ['leads/mês', 'taxa de conversão', 'tempo médio de venda', 'VGV'],
    templates: {
      abertura: 'Seus imóveis merecem compradores qualificados...',
      followUp: 'Já imaginou ter uma fila de interessados?',
      fechamento: 'Vamos atrair compradores prontos para fechar?',
    },
  },
  advogado: {
    nome: 'Advocacia / Jurídico',
    keywords: ['advogado', 'escritório', 'advocacia', 'jurídico', 'direito'],
    dores: ['captação ética', 'autoridade', 'diferenciação', 'nicho específico'],
    metricas: ['consultas/mês', 'taxa de conversão', 'ticket médio', 'retenção'],
    templates: {
      abertura: 'Sua expertise merece ser conhecida por mais pessoas...',
      followUp: 'Pronto para se tornar referência na sua área?',
      fechamento: 'Vamos posicionar você como autoridade?',
    },
  },
  salao_beleza: {
    nome: 'Salão de Beleza / Estética',
    keywords: ['salão', 'beleza', 'cabelo', 'manicure', 'estética', 'barbearia'],
    dores: ['agenda inconsistente', 'fidelização', 'ticket médio baixo'],
    metricas: ['agendamentos/semana', 'ticket médio', 'taxa de retorno', 'NPS'],
    templates: {
      abertura: 'Seu salão tem potencial para muito mais clientes...',
      followUp: 'Imagina ter agenda lotada toda semana?',
      fechamento: 'Vamos transformar seu salão em referência?',
    },
  },
  pet_shop: {
    nome: 'Pet Shop / Veterinária',
    keywords: ['pet shop', 'petshop', 'veterinária', 'banho e tosa', 'ração'],
    dores: ['fidelização de tutores', 'serviços recorrentes', 'diferenciação'],
    metricas: ['clientes ativos', 'frequência de compra', 'ticket médio', 'LTV'],
    templates: {
      abertura: 'Os pets da região merecem conhecer seu negócio...',
      followUp: 'Pronto para fidelizar mais tutores?',
      fechamento: 'Vamos fazer seu pet shop bombar?',
    },
  },
};

/**
 * Faz requisição com timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Timeout no diagnóstico - tente novamente');
    }
    throw error;
  }
}

/**
 * Detecta o nicho do negócio baseado em keywords
 * @param texto - Texto para análise (nome empresa, site, etc)
 * @returns Nicho detectado ou 'outro'
 */
export function detectarNicho(texto: string): NichoType {
  const textoLower = texto.toLowerCase();

  for (const [nicho, info] of Object.entries(CATALOGO_NICHOS)) {
    if (info?.keywords.some((keyword) => textoLower.includes(keyword))) {
      return nicho as NichoType;
    }
  }

  return 'outro';
}

/**
 * Obtém informações do nicho do catálogo
 * @param nicho - Tipo do nicho
 * @returns Informações do nicho ou undefined
 */
export function obterInfoNicho(nicho: NichoType) {
  return CATALOGO_NICHOS[nicho];
}

/**
 * Transforma a resposta do n8n para o formato DiagnosticoCompleto do frontend
 * @param n8nData - Resposta do webhook n8n (pode ser array ou objeto)
 * @param leadId - ID do lead
 * @returns Diagnóstico no formato esperado pelo frontend
 */
function transformarDiagnosticoN8n(
  n8nData: DiagnosticoN8nResponse | DiagnosticoN8nResponse[],
  leadId: string
): DiagnosticoCompleto {
  // n8n pode retornar array com 1 item ou objeto direto
  const dataRaw = Array.isArray(n8nData) ? n8nData[0] : n8nData;

  // Garante que data existe (fallback para objeto vazio se undefined)
  const data = dataRaw || {} as Partial<DiagnosticoN8nResponse>;

  const now = new Date().toISOString();
  const empresa = data.empresa || {} as Partial<DiagnosticoN8nResponse['empresa']>;
  const diagnosticoIA = data.diagnosticoIA || {} as Partial<NonNullable<DiagnosticoN8nResponse['diagnosticoIA']>>;

  // Pega pontos fortes (n8n tem typo "pontosFOrtes" com O maiúsculo)
  const pontosFortes = diagnosticoIA.pontosFOrtes || diagnosticoIA.pontosFortes || [];
  const pontosAMelhorar = diagnosticoIA.pontosAMelhorar || [];
  const oportunidadesIA = diagnosticoIA.oportunidades || [];

  // Determina temperatura baseado no score
  const score = diagnosticoIA.scoreGeral || data.scoreOportunidade || 0;
  let temperatura: 'HOT' | 'WARM' | 'COOL' = 'COOL';
  if (score >= 80) {
    temperatura = 'HOT';
  } else if (score >= 60) {
    temperatura = 'WARM';
  }

  // Detecta nicho pela categoria
  const categoria = (empresa.categoria || '').toLowerCase();
  let nichoDetectado = 'outro';
  if (categoria.includes('salão') || categoria.includes('beleza') || categoria.includes('estética')) {
    nichoDetectado = 'salao_beleza';
  } else if (categoria.includes('academia') || categoria.includes('fitness')) {
    nichoDetectado = 'academia';
  } else if (categoria.includes('restaurante') || categoria.includes('pizzaria')) {
    nichoDetectado = 'restaurante';
  } else if (categoria.includes('clínica') || categoria.includes('médic')) {
    nichoDetectado = 'clinica_medica';
  } else if (categoria.includes('pet') || categoria.includes('veterin')) {
    nichoDetectado = 'pet_shop';
  }

  // Determina presença digital
  let presencaDigital: 'baixa' | 'media' | 'alta' = 'baixa';
  if (empresa.website && !empresa.website.includes('instagram.com')) {
    presencaDigital = 'media';
    if ((empresa.totalAvaliacoes || 0) > 50) {
      presencaDigital = 'alta';
    }
  }

  return {
    id: `diag_${Date.now()}`,
    leadId,
    criadoEm: data.geradoEm || now,
    atualizadoEm: now,

    empresa: {
      nome: empresa.nome || '',
      nicho: nichoDetectado as NichoType,
      nichoDetectado: empresa.categoria || nichoDetectado,
      confiancaNicho: 0.7,
      tamanhoEstimado: 'pequena',
      presencaDigital,
    },

    diagnostico: {
      resumo: diagnosticoIA.resumoExecutivo || '',
      detalhes: diagnosticoIA.analiseReviews || '',
      nivelMaturidade: presencaDigital === 'alta' ? 'avancado' : presencaDigital === 'media' ? 'intermediario' : 'iniciante',
      urgencia: temperatura === 'HOT' ? 'alta' : temperatura === 'WARM' ? 'media' : 'baixa',
    },

    classificacao: {
      temperatura,
      score,
      motivo: diagnosticoIA.recomendacaoPrioritaria || `Score de oportunidade: ${score}`,
    },

    pontosFortes: pontosFortes.map((ponto: string) => ({
      titulo: ponto,
      descricao: ponto,
      impacto: 'medio' as const,
    })),

    pontosFracos: pontosAMelhorar.map((ponto: string) => ({
      titulo: ponto,
      descricao: ponto,
      impacto: 'medio' as const,
    })),

    oportunidades: oportunidadesIA.map((op) => ({
      titulo: op.titulo || '',
      descricao: op.descricao || '',
      potencialROI: (op.impacto === 'alto' ? 'alto' : op.impacto === 'medio' ? 'medio' : 'baixo') as 'baixo' | 'medio' | 'alto',
      prazoImplementacao: (op.urgencia === 'alta' ? 'curto' : op.urgencia === 'media' ? 'medio' : 'longo') as 'curto' | 'medio' | 'longo',
    })),

    estrategia: {
      objetivo: diagnosticoIA.recomendacaoPrioritaria || 'Melhorar presença digital e captação de clientes',
      acoes: [
        ...pontosAMelhorar.slice(0, 3),
        ...(oportunidadesIA.length > 0 && oportunidadesIA[0] ? [oportunidadesIA[0].titulo] : []),
      ].filter(Boolean),
      investimentoSugerido: {
        min: 1500,
        max: 5000,
        moeda: 'R$',
      },
      resultadosEsperados: [
        'Aumento de visibilidade online',
        'Mais avaliações positivas',
        'Crescimento no número de clientes',
      ],
      prazoResultados: '30-60 dias',
    },

    abordagem: {
      tom: 'consultivo',
      angulo: `Potencializar os pontos fortes já existentes (${pontosFortes[0] || 'boa reputação'}) enquanto trabalha as oportunidades de melhoria.`,
      gatilhos: [
        'Prova social (avaliações positivas)',
        'Autoridade no nicho',
        'Urgência sazonal',
      ],
      objecoesPrevistas: [
        'Já tenho presença nas redes sociais',
        'Não tenho orçamento para marketing',
        'Meu negócio funciona bem sem isso',
      ],
      respostasObjecoes: {
        'Já tenho presença nas redes sociais': 'As redes sociais são ótimas, mas uma estratégia integrada pode multiplicar seus resultados.',
        'Não tenho orçamento para marketing': 'Podemos começar com um investimento menor e escalar conforme os resultados aparecem.',
        'Meu negócio funciona bem sem isso': 'Imagina como seria com uma estratégia de captação ativa trazendo ainda mais clientes qualificados?',
      },
    },

    mensagens: [
      {
        tipo: 'abertura',
        conteudo: `Olá! Vi que o ${empresa.nome || 'seu negócio'} tem excelentes avaliações (${empresa.rating || 5} estrelas). Parabéns pelo trabalho! Trabalho com estratégias digitais para ${empresa.categoria || 'negócios locais'} e percebi algumas oportunidades interessantes que poderiam trazer ainda mais clientes. Posso compartilhar?`,
        canalRecomendado: 'whatsapp',
        melhorHorario: '10h-12h ou 14h-17h',
      },
      {
        tipo: 'followUp',
        conteudo: `Oi! Conseguiu dar uma olhada na proposta que enviei? Estou disponível para uma conversa rápida de 15 minutos para explicar como podemos ${oportunidadesIA[0]?.titulo?.toLowerCase() || 'aumentar sua visibilidade online'}. Qual o melhor horário?`,
        canalRecomendado: 'whatsapp',
        melhorHorario: '10h-12h',
      },
      {
        tipo: 'fechamento',
        conteudo: `${empresa.nome ? empresa.nome + ', ' : ''}tenho algumas vagas para novos clientes este mês e adoraria incluir seu negócio. Que tal agendarmos uma call esta semana para alinhar os próximos passos?`,
        canalRecomendado: 'whatsapp',
        melhorHorario: '14h-17h',
      },
    ],
  };
}

/**
 * Executa diagnóstico profundo de um lead via n8n
 * @param request - Dados do lead para análise
 * @returns Diagnóstico completo
 */
export async function executarDiagnostico(
  request: DiagnosticoRequest
): Promise<DiagnosticoResponse> {
  try {
    console.log('[Diagnóstico] Iniciando análise para:', request.nome);

    // Detecta nicho localmente para enriquecer requisição
    const textoAnalise = [
      request.empresa,
      request.site,
      request.instagram,
      request.observacoes,
    ]
      .filter(Boolean)
      .join(' ');

    const nichoDetectado = detectarNicho(textoAnalise);
    const infoNicho = obterInfoNicho(nichoDetectado);

    // Envia para n8n com dados enriquecidos
    const response = await fetchWithTimeout(
      DIAGNOSTICO_WEBHOOK_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          nichoSugerido: nichoDetectado,
          infoNicho,
          timestamp: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Diagnóstico] Erro da API:', errorData);
      throw new Error(`Erro no diagnóstico: ${response.status}`);
    }

    const rawData = await response.json();
    console.log('[Diagnóstico] Resposta recebida, transformando dados...');

    // Transforma a resposta do n8n para o formato esperado pelo frontend
    const diagnosticoTransformado = transformarDiagnosticoN8n(rawData, request.leadId);
    console.log('[Diagnóstico] Análise concluída com sucesso');

    return {
      success: true,
      data: diagnosticoTransformado,
    };
  } catch (error) {
    console.error('[Diagnóstico] Erro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido no diagnóstico',
    };
  }
}

/**
 * Obtém diagnóstico salvo de um lead
 * @param leadId - ID do lead
 * @returns Diagnóstico salvo ou null
 */
export async function obterDiagnosticoLead(
  leadId: string
): Promise<DiagnosticoCompleto | null> {
  try {
    const response = await fetch(`/api/leads/${leadId}/diagnostico`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Erro ao buscar diagnóstico: ${response.status}`);
    }

    const data = await response.json();
    return data.diagnostico;
  } catch (error) {
    console.error('[obterDiagnosticoLead] Erro:', error);
    return null;
  }
}

/**
 * Salva diagnóstico no banco de dados
 * @param leadId - ID do lead
 * @param diagnostico - Diagnóstico completo
 */
export async function salvarDiagnostico(
  leadId: string,
  diagnostico: DiagnosticoCompleto
): Promise<boolean> {
  try {
    const response = await fetch(`/api/leads/${leadId}/diagnostico`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ diagnostico }),
    });

    return response.ok;
  } catch (error) {
    console.error('[salvarDiagnostico] Erro:', error);
    return false;
  }
}

/**
 * Gera cor baseada na temperatura do lead
 */
export function getCorTemperatura(temperatura: string): string {
  switch (temperatura) {
    case 'HOT':
      return 'text-red-500';
    case 'WARM':
      return 'text-yellow-500';
    case 'COOL':
      return 'text-blue-500';
    default:
      return 'text-zinc-500';
  }
}

/**
 * Gera cor de background baseada na temperatura do lead
 */
export function getBgTemperatura(temperatura: string): string {
  switch (temperatura) {
    case 'HOT':
      return 'bg-red-500/20';
    case 'WARM':
      return 'bg-yellow-500/20';
    case 'COOL':
      return 'bg-blue-500/20';
    default:
      return 'bg-zinc-500/20';
  }
}

/**
 * Gera ícone baseado no nível de impacto
 */
export function getIconeImpacto(impacto: string): string {
  switch (impacto) {
    case 'alto':
      return '🔴';
    case 'medio':
      return '🟡';
    case 'baixo':
      return '🟢';
    default:
      return '⚪';
  }
}
