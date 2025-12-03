/**
 * @file csv-parser.ts
 * @description Parser de arquivos CSV para importação de relatórios
 * @module lib
 */

import type { Ad, CSVImportData, CSVParseResult, AdStatus } from '@/types';

/**
 * Mapeamento de colunas do CSV para campos do sistema
 * Suporta formato Meta Ads (português) e Google Ads (inglês)
 */
const COLUMN_MAPPINGS: Record<string, string> = {
  // Nome do anúncio
  'ad name': 'ad_name',
  'nome do anúncio': 'ad_name',
  'nome do anuncio': 'ad_name',
  'creative name': 'ad_name',
  'anúncio': 'ad_name',
  'anuncio': 'ad_name',

  // Conjunto de anúncios
  'ad set name': 'ad_set_name',
  'adset': 'ad_set_name',
  'conjunto de anúncios': 'ad_set_name',
  'conjunto de anuncios': 'ad_set_name',
  'nome do conjunto de anúncios': 'ad_set_name',

  // Campanha
  'campaign name': 'campaign_name',
  'campanha': 'campaign_name',
  'nome da campanha': 'campaign_name',

  // Gasto / Valor usado (Meta Ads)
  'amount spent': 'spend',
  'spend': 'spend',
  'cost': 'spend',
  'gasto': 'spend',
  'valor gasto': 'spend',
  'valor usado': 'spend',
  'valor usado (brl)': 'spend',

  // Impressões
  'impressions': 'impressions',
  'impressões': 'impressions',
  'impressoes': 'impressions',
  'impr': 'impressions',

  // Alcance (Meta Ads)
  'reach': 'reach',
  'alcance': 'reach',

  // Cliques (Meta Ads usa "Cliques no link")
  'clicks': 'clicks',
  'cliques': 'clicks',
  'link clicks': 'clicks',
  'cliques no link': 'clicks',

  // Conversões / Resultados / Compras (Meta Ads)
  'conversions': 'conversions',
  'conversões': 'conversions',
  'conversoes': 'conversions',
  'results': 'conversions',
  'resultados': 'conversions',
  'purchases': 'conversions',
  'compras': 'conversions',

  // CTR (Meta Ads: "CTR (taxa de cliques no link)")
  'ctr': 'ctr',
  'click-through rate': 'ctr',
  'taxa de cliques': 'ctr',
  'ctr (taxa de cliques no link)': 'ctr',

  // CPC (Meta Ads: "CPC (custo por clique no link) (BRL)")
  'cpc': 'cpc',
  'cost per click': 'cpc',
  'custo por clique': 'cpc',
  'cpc (custo por clique no link)': 'cpc',
  'cpc (custo por clique no link) (brl)': 'cpc',

  // CPM (Meta Ads: "CPM (custo por 1.000 impressões) (BRL)")
  'cpm': 'cpm',
  'cost per 1,000 impressions': 'cpm',
  'custo por mil': 'cpm',
  'cpm (custo por 1.000 impressões)': 'cpm',
  'cpm (custo por 1.000 impressões) (brl)': 'cpm',
  'cpm (custo por 1.000 impressoes) (brl)': 'cpm',

  // CPA (Meta Ads: "Custo por resultados" ou "Custo por compra")
  'cpa': 'cpa',
  'cost per result': 'cpa',
  'cost per conversion': 'cpa',
  'custo por resultado': 'cpa',
  'custo por resultados': 'cpa',
  'custo por conversão': 'cpa',
  'custo por conversao': 'cpa',
  'custo por compra': 'cpa',
  'custo por compra (brl)': 'cpa',

  // ROAS (Meta Ads)
  'roas': 'roas',
  'return on ad spend': 'roas',
  'retorno sobre o investimento em publicidade (roas) das compras': 'roas',

  // Adições ao carrinho (Meta Ads)
  'add to cart': 'add_to_cart',
  'adições ao carrinho': 'add_to_cart',
  'adicoes ao carrinho': 'add_to_cart',

  // Checkouts iniciados (Meta Ads)
  'checkouts initiated': 'checkouts_initiated',
  'finalizações de compra iniciadas': 'checkouts_initiated',
  'finalizacoes de compra iniciadas': 'checkouts_initiated',

  // Frequência (Meta Ads)
  'frequency': 'frequency',
  'frequência': 'frequency',
  'frequencia': 'frequency',

  // Visualizações de página de destino (Meta Ads)
  'landing page views': 'landing_page_views',
  'visualizações da página de destino': 'landing_page_views',
  'visualizacoes da pagina de destino': 'landing_page_views',
  'exibições da página de destino': 'landing_page_views',
  'exibicoes da pagina de destino': 'landing_page_views',

  // Valor de compra / Valor de conversão (Meta Ads)
  'purchase value': 'purchase_value',
  'conversion value': 'purchase_value',
  'valor de compra': 'purchase_value',
  'valor da compra': 'purchase_value',
  'valor de conversão': 'purchase_value',
  'valor de conversão de compras': 'purchase_value',
  'valor de conversao de compras': 'purchase_value',
  'valor de conversão das compras': 'purchase_value',
};

/**
 * Parse de valor monetário para número
 * Detecta automaticamente formato brasileiro (1.234,56) vs internacional (1,234.56)
 */
function parseMoneyValue(value: string): number {
  if (!value) {
    return 0;
  }

  // Remove símbolos de moeda e espaços
  let cleaned = value
    .replace(/[R$€$£¥]/g, '')
    .replace(/\s/g, '')
    .trim();

  // Se estiver vazio após limpeza
  if (!cleaned) {
    return 0;
  }

  // Detecta formato: se tem vírgula seguida de 2 dígitos no final, é formato brasileiro
  // Exemplo brasileiro: "1.234,56" → vírgula antes de 2 dígitos finais
  // Exemplo internacional: "1,234.56" → ponto antes de 2 dígitos finais
  const brFormat = /,\d{1,2}$/.test(cleaned); // termina com ,XX ou ,X
  const intFormat = /\.\d{1,2}$/.test(cleaned); // termina com .XX ou .X

  if (brFormat && !intFormat) {
    // Formato brasileiro: 1.234,56 → remove pontos, troca vírgula por ponto
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (intFormat && !brFormat) {
    // Formato internacional: 1,234.56 → apenas remove vírgulas de milhar
    cleaned = cleaned.replace(/,/g, '');
  } else if (cleaned.includes(',') && cleaned.includes('.')) {
    // Ambos presentes: verifica qual vem por último
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Vírgula é decimal (BR): 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Ponto é decimal (INT): 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    }
  }
  // Se só tem ponto ou só tem vírgula, ponto é decimal, vírgula vira ponto
  else if (cleaned.includes(',') && !cleaned.includes('.')) {
    cleaned = cleaned.replace(',', '.');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse de valor percentual para número
 */
function parsePercentValue(value: string): number {
  if (!value) {
    return 0;
  }
  const cleaned = value.replace('%', '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse de valor numérico genérico
 */
function parseNumericValue(value: string): number {
  if (!value) {
    return 0;
  }
  const cleaned = value.replace(/\s/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Determina o status do anúncio baseado nas métricas
 */
function determineAdStatus(ad: Partial<Ad>): AdStatus {
  const ctr = ad.ctr || 0;
  const cpa = ad.cpa || 0;
  const conversions = ad.conversions || 0;

  // Winner: CTR alto e CPA baixo com conversões
  if (ctr > 2 && cpa < 50 && conversions > 5) {
    return 'winner';
  }

  // Fadiga: CTR baixo demais
  if (ctr < 0.5) {
    return 'fatigue';
  }

  // Pausar: Sem conversões ou CPA muito alto
  if (conversions === 0 || cpa > 200) {
    return 'paused';
  }

  return 'active';
}

/**
 * Corrige problemas de encoding UTF-8 comum em CSVs do Meta Ads
 */
function fixEncoding(text: string): string {
  return text
    // Correções comuns de encoding UTF-8 mal interpretado
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã£/g, 'ã')
    .replace(/Ãµ/g, 'õ')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã€/g, 'À')
    .replace(/Ãƒ/g, 'Ã')
    .replace(/Ã¢/g, 'â')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã®/g, 'î')
    .replace(/Ã´/g, 'ô')
    .replace(/Ã»/g, 'û');
}

/**
 * Normaliza nome da coluna para mapeamento
 * Remove acentos, converte para minúsculas, corrige encoding
 */
function normalizeColumnName(name: string): string {
  // Primeiro corrige encoding
  let normalized = fixEncoding(name);

  // Converte para minúsculas e remove espaços extras
  normalized = normalized.toLowerCase().trim();

  // Remove aspas
  normalized = normalized.replace(/["']/g, '');

  return normalized;
}

/**
 * Remove acentos de uma string para comparação
 */
function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Encontra o campo mapeado para uma coluna
 * Usa matching exato primeiro, depois parcial
 */
function findMappedField(columnName: string): string | null {
  const normalized = normalizeColumnName(columnName);

  // Tentativa 1: Match exato
  if (COLUMN_MAPPINGS[normalized]) {
    return COLUMN_MAPPINGS[normalized];
  }

  // Tentativa 2: Match exato sem acentos
  const noAccents = removeAccents(normalized);
  for (const [key, value] of Object.entries(COLUMN_MAPPINGS)) {
    if (removeAccents(key) === noAccents) {
      return value;
    }
  }

  // Tentativa 3: Match parcial (se a coluna contém o termo mapeado)
  for (const [key, value] of Object.entries(COLUMN_MAPPINGS)) {
    const keyNoAccents = removeAccents(key);
    // Verifica se o nome da coluna começa com o termo mapeado
    if (noAccents.startsWith(keyNoAccents) || keyNoAccents.startsWith(noAccents)) {
      return value;
    }
  }

  // Tentativa 4: Match por palavras-chave específicas
  if (noAccents.includes('valor usado') || noAccents.includes('amount spent')) {
    return 'spend';
  }
  if (noAccents.includes('cliques no link') || noAccents.includes('link clicks')) {
    return 'clicks';
  }
  if (noAccents.includes('custo por compra') || noAccents.includes('cost per purchase')) {
    return 'cpa';
  }
  if (noAccents.includes('cpm') && noAccents.includes('1.000')) {
    return 'cpm';
  }
  if (noAccents.includes('cpc') && noAccents.includes('clique')) {
    return 'cpc';
  }
  if (noAccents.includes('ctr') && noAccents.includes('taxa')) {
    return 'ctr';
  }

  return null;
}

/**
 * Parse de arquivo CSV para texto
 * Tenta UTF-8 primeiro, depois ISO-8859-1 (comum em exports do Meta Ads)
 */
export async function parseCSVFile(file: File): Promise<string> {
  // Primeiro tenta ler como UTF-8
  const utf8Result = await readFileAsText(file, 'UTF-8');

  // Verifica se há caracteres de encoding quebrado
  if (utf8Result.includes('Ã') || utf8Result.includes('Â')) {
    // Tenta ler como ISO-8859-1 (Latin-1)
    try {
      const latin1Result = await readFileAsText(file, 'ISO-8859-1');
      // Se não tiver caracteres quebrados, usa Latin-1
      if (!latin1Result.includes('Ã')) {
        return latin1Result;
      }
    } catch {
      // Se falhar, continua com UTF-8
    }
  }

  return utf8Result;
}

/**
 * Lê arquivo como texto com encoding específico
 */
function readFileAsText(file: File, encoding: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Falha ao ler arquivo'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file, encoding);
  });
}

/**
 * Parse de texto CSV para linhas e colunas
 */
export function parseCSVText(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(line => line.trim());

  return lines.map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === ';') && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  });
}

/**
 * Mapeia linhas do CSV para dados de anúncios
 */
export function mapCSVToAds(
  rows: string[][],
  headers: string[]
): Omit<Ad, 'id' | 'report_id' | 'created_at'>[] {
  const columnMap = new Map<number, string>();
  const mappedColumns: string[] = [];
  const unmappedColumns: string[] = [];

  // Mapeia índices das colunas para campos
  headers.forEach((header, index) => {
    const field = findMappedField(header);
    if (field) {
      columnMap.set(index, field);
      mappedColumns.push(`${header} → ${field}`);
    } else {
      unmappedColumns.push(header);
    }
  });

  // Log para debug (remover em produção se necessário)
  // eslint-disable-next-line no-console
  console.log('[csv-parser] Colunas mapeadas:', mappedColumns);
  if (unmappedColumns.length > 0) {
    // eslint-disable-next-line no-console
    console.log('[csv-parser] Colunas não mapeadas:', unmappedColumns);
  }

  // Processa cada linha
  return rows.map(row => {
    const ad: Record<string, unknown> = {
      ad_name: '',
      ad_set_name: null,
      campaign_name: null,
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
      cpa: 0,
      cpm: 0,
      // Campos expandidos do Meta Ads
      reach: null,
      frequency: null,
      roas: null,
      purchase_value: null,
      landing_page_views: null,
      add_to_cart: null,
      checkouts_initiated: null,
      status: 'active' as AdStatus,
    };

    row.forEach((value, index) => {
      const field = columnMap.get(index);
      if (!field || !value) {
        return;
      }

      switch (field) {
        // Campos de texto
        case 'ad_name':
        case 'ad_set_name':
        case 'campaign_name':
          ad[field] = value || null;
          break;

        // Campos monetários
        case 'spend':
        case 'cpc':
        case 'cpa':
        case 'cpm':
        case 'purchase_value':
          ad[field] = parseMoneyValue(value);
          break;

        // Campos percentuais
        case 'ctr':
          ad[field] = parsePercentValue(value);
          break;

        // Campos numéricos inteiros
        case 'impressions':
        case 'clicks':
        case 'conversions':
        case 'reach':
        case 'landing_page_views':
        case 'add_to_cart':
        case 'checkouts_initiated':
          ad[field] = parseNumericValue(value);
          break;

        // Campos decimais
        case 'frequency':
        case 'roas':
          ad[field] = parseNumericValue(value);
          break;
      }
    });

    // Calcula métricas se não foram fornecidas
    const spend = ad.spend as number;
    const impressions = ad.impressions as number;
    const clicks = ad.clicks as number;
    const conversions = ad.conversions as number;

    if (!ad.ctr && impressions > 0) {
      ad.ctr = (clicks / impressions) * 100;
    }

    if (!ad.cpc && clicks > 0) {
      ad.cpc = spend / clicks;
    }

    if (!ad.cpa && conversions > 0) {
      ad.cpa = spend / conversions;
    }

    if (!ad.cpm && impressions > 0) {
      ad.cpm = (spend / impressions) * 1000;
    }

    // Determina status
    ad.status = determineAdStatus(ad as Partial<Ad>);

    return ad as Omit<Ad, 'id' | 'report_id' | 'created_at'>;
  });
}

/**
 * Função principal de parse de CSV
 */
export async function parseCSV(
  file: File,
  clientId: string,
  periodStart: string,
  periodEnd: string
): Promise<CSVParseResult> {
  try {
    const text = await parseCSVFile(file);
    const rows = parseCSVText(text);

    if (rows.length < 2) {
      return {
        success: false,
        errors: ['Arquivo CSV vazio ou com apenas cabeçalho'],
      };
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Type guard para garantir que headers existe
    if (!headers || headers.length === 0) {
      return {
        success: false,
        errors: ['Cabeçalho do CSV não encontrado'],
      };
    }

    // Verifica se tem coluna de nome de anúncio
    const hasAdName = headers.some(h => {
      const field = findMappedField(h);
      return field === 'ad_name';
    });

    if (!hasAdName) {
      return {
        success: false,
        errors: ['Coluna de nome do anúncio não encontrada'],
      };
    }

    const ads = mapCSVToAds(dataRows, headers);

    // Filtra anúncios vazios
    const validAds = ads.filter(ad => ad.ad_name && ad.ad_name.trim());

    if (validAds.length === 0) {
      return {
        success: false,
        errors: ['Nenhum anúncio válido encontrado no CSV'],
      };
    }

    const data: CSVImportData = {
      clientId,
      periodStart,
      periodEnd,
      ads: validAds,
    };

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[csv-parser] Error:', error);
    return {
      success: false,
      errors: ['Erro ao processar arquivo CSV'],
    };
  }
}

/**
 * Valida dados do CSV antes de importar
 */
export function validateCSVData(data: CSVImportData): string[] {
  const errors: string[] = [];

  if (!data.clientId) {
    errors.push('Cliente não selecionado');
  }

  if (!data.periodStart) {
    errors.push('Data de início não informada');
  }

  if (!data.periodEnd) {
    errors.push('Data de fim não informada');
  }

  if (data.ads.length === 0) {
    errors.push('Nenhum anúncio para importar');
  }

  return errors;
}
