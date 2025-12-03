/**
 * @file report.ts
 * @description Tipos relacionados a relatórios e anúncios
 * @module types
 */

/**
 * Status de performance de um anúncio
 */
export type AdStatus = 'winner' | 'active' | 'fatigue' | 'paused';

/**
 * Interface de um relatório importado
 */
export interface Report {
  id: string;
  client_id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  source?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Interface de um anúncio dentro do relatório
 * Campos expandidos para suportar exportação completa do Meta Ads
 */
export interface Ad {
  id: string;
  report_id: string;
  ad_name: string;
  ad_set_name: string | null;
  campaign_name: string | null;

  // Métricas principais
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;

  // Métricas calculadas
  ctr: number;
  cpc: number;
  cpa: number;
  cpm: number;

  // Métricas expandidas do Meta Ads
  reach: number | null;
  frequency: number | null;
  roas: number | null;
  purchase_value: number | null;

  // Funil de conversão
  landing_page_views: number | null;
  add_to_cart: number | null;
  checkouts_initiated: number | null;

  // Status e metadados
  status: AdStatus;
  created_at: string;
}

/**
 * Métricas computadas de um relatório
 */
export interface ReportMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCTR: number;
  averageCPC: number;
  averageCPA: number;
  averageCPM: number;
  adsCount?: number;
  winnersCount?: number;
  fatigueCount?: number;
}

/**
 * Dados do CSV importado
 */
export interface CSVImportData {
  clientId: string;
  periodStart: string;
  periodEnd: string;
  ads: Omit<Ad, 'id' | 'report_id' | 'created_at'>[];
}

/**
 * Resultado do parse de CSV
 */
export interface CSVParseResult {
  success: boolean;
  data?: CSVImportData;
  errors?: string[];
}

/**
 * Dados para gráficos de evolução
 */
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}
