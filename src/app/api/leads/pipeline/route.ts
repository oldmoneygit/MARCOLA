/**
 * @file route.ts
 * @description API Route para Pipeline Completo do Lead Sniper
 * @module api/leads/pipeline
 *
 * Executa o fluxo completo automaticamente:
 * 1. Pesquisa leads via Google Places
 * 2. Verifica anúncios (Google Ads, Facebook Ads)
 * 3. Analisa leads com IA (apenas HOT e WARM)
 * 4. Opcionalmente executa diagnóstico profundo
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import {
  executarPesquisaWebhook,
  verificarAdsWebhook,
  analisarLeadIAWebhook,
  mapWebhookLeadToDb,
  mapDbPesquisaToTs,
  LEAD_SNIPER_LIMITS,
} from '@/lib/lead-sniper';
import { executarDiagnostico } from '@/lib/diagnostico';
import type { CreatePesquisaDTO, LeadClassificacao } from '@/types/lead-sniper';
import type { DiagnosticoRequest } from '@/types/diagnostico';

interface PipelineRequest extends CreatePesquisaDTO {
  /** Se deve executar verificação de anúncios */
  verificarAds?: boolean;
  /** Se deve executar análise IA (apenas HOT/WARM) */
  analisarIA?: boolean;
  /** Se deve executar diagnóstico profundo (apenas HOT) */
  executarDiagnostico?: boolean;
  /** Score mínimo para incluir no pipeline */
  scoreMinimo?: number;
}

interface PipelineStats {
  pesquisa: {
    total: number;
    novos: number;
    duplicados: number;
    porCidade: Record<string, number>;
  };
  adsVerificados: number;
  analisadosIA: number;
  diagnosticosExecutados: number;
  erros: string[];
}

/**
 * POST /api/leads/pipeline
 * Executa pipeline completo de prospecção
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body: PipelineRequest = await request.json();

    // Validar campos obrigatórios
    if (!body.tipo || !body.cidades || body.cidades.length === 0) {
      return NextResponse.json(
        { error: 'Tipo de negócio e pelo menos uma cidade são obrigatórios' },
        { status: 400 }
      );
    }

    // Configurações padrão
    const config = {
      verificarAds: body.verificarAds ?? true,
      analisarIA: body.analisarIA ?? true,
      executarDiagnostico: body.executarDiagnostico ?? false,
      scoreMinimo: body.scoreMinimo ?? LEAD_SNIPER_LIMITS.DEFAULT_SCORE_MINIMO,
    };

    const stats: PipelineStats = {
      pesquisa: { total: 0, novos: 0, duplicados: 0, porCidade: {} },
      adsVerificados: 0,
      analisadosIA: 0,
      diagnosticosExecutados: 0,
      erros: [],
    };

    const requestId = `pipeline_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // ============================================
    // ETAPA 1: PESQUISA DE LEADS
    // ============================================

    // Criar registro da pesquisa
    const { data: pesquisa, error: createError } = await supabase
      .from('pesquisas_mercado')
      .insert({
        user_id: user.id,
        cliente_id: body.clienteId || null,
        request_id: requestId,
        tipo_negocio: body.tipo,
        cidades_buscadas: body.cidades,
        score_minimo: config.scoreMinimo,
        max_por_cidade: body.maxPorCidade || LEAD_SNIPER_LIMITS.DEFAULT_MAX_POR_CIDADE,
        status: 'processing',
      })
      .select()
      .single();

    if (createError || !pesquisa) {
      console.error('[pipeline] Erro ao criar pesquisa:', createError);
      return NextResponse.json({ error: 'Erro ao criar pesquisa' }, { status: 500 });
    }

    const leadsIds: string[] = [];

    try {
      // Executar pesquisa via webhook
      const webhookResponse = await executarPesquisaWebhook({
        tipo: body.tipo,
        cidades: body.cidades,
        scoreMinimo: config.scoreMinimo,
        maxPorCidade: body.maxPorCidade,
        clienteId: body.clienteId,
      });

      stats.pesquisa.total = webhookResponse.leads.length;

      // Salvar leads no banco
      for (const lead of webhookResponse.leads) {
        const leadData = mapWebhookLeadToDb(lead, user.id, pesquisa.id);

        const { data: savedLead, error: insertError } = await supabase
          .from('leads_prospectados')
          .upsert(leadData, {
            onConflict: 'user_id,google_place_id',
            ignoreDuplicates: false, // Queremos atualizar se existir
          })
          .select('id')
          .single();

        if (insertError) {
          stats.pesquisa.duplicados++;
        } else if (savedLead) {
          stats.pesquisa.novos++;
          leadsIds.push(savedLead.id);
          const cidade = lead.cidade || 'Desconhecida';
          stats.pesquisa.porCidade[cidade] = (stats.pesquisa.porCidade[cidade] || 0) + 1;
        }
      }

      // Atualizar pesquisa com estatísticas
      await supabase
        .from('pesquisas_mercado')
        .update({
          status: 'completed',
          total_leads: webhookResponse.estatisticas.total,
          leads_hot: webhookResponse.estatisticas.hot,
          leads_warm: webhookResponse.estatisticas.warm,
          leads_cool: webhookResponse.estatisticas.cool,
          leads_cold: webhookResponse.estatisticas.cold,
          com_whatsapp: webhookResponse.estatisticas.comWhatsapp,
          sem_site: webhookResponse.estatisticas.semSite,
          executado_em: webhookResponse.meta.executadoEm,
        })
        .eq('id', pesquisa.id);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro na pesquisa';
      stats.erros.push(`Pesquisa: ${errorMsg}`);

      await supabase
        .from('pesquisas_mercado')
        .update({ status: 'failed', error_message: errorMsg })
        .eq('id', pesquisa.id);

      // Retornar erro se pesquisa falhar completamente
      return NextResponse.json({
        success: false,
        error: 'Falha na etapa de pesquisa',
        stats,
      }, { status: 500 });
    }

    // ============================================
    // ETAPA 2: VERIFICAÇÃO DE ANÚNCIOS
    // ============================================

    if (config.verificarAds && leadsIds.length > 0) {
      // Buscar leads com site para verificar ads
      const { data: leadsComSite } = await supabase
        .from('leads_prospectados')
        .select('id, site, nome')
        .in('id', leadsIds)
        .not('site', 'is', null)
        .eq('nivel_marketing_digital', 'NAO_VERIFICADO');

      if (leadsComSite && leadsComSite.length > 0) {
        for (const lead of leadsComSite) {
          try {
            // Delay para não sobrecarregar n8n
            await new Promise(resolve => setTimeout(resolve, 500));

            const adsResult = await verificarAdsWebhook(lead.site!, lead.id);

            if (adsResult.success) {
              // Calcular nível de marketing baseado nos resultados
              let nivelMarketing: 'NENHUM' | 'BASICO' | 'AVANCADO' = 'NENHUM';
              const fazAds = adsResult.fazGoogleAds || adsResult.fazFacebookAds;
              const temAnalytics = adsResult.usaGoogleAnalytics || adsResult.usaGoogleTagManager;

              if (fazAds && temAnalytics) {
                nivelMarketing = 'AVANCADO';
              } else if (fazAds || temAnalytics) {
                nivelMarketing = 'BASICO';
              }

              await supabase
                .from('leads_prospectados')
                .update({
                  faz_google_ads: adsResult.fazGoogleAds || false,
                  faz_facebook_ads: adsResult.fazFacebookAds || false,
                  usa_google_analytics: adsResult.usaGoogleAnalytics || false,
                  usa_google_tag_manager: adsResult.usaGoogleTagManager || false,
                  nivel_marketing_digital: nivelMarketing,
                  ads_verificado: true,
                  ads_verificado_em: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', lead.id);

              stats.adsVerificados++;
            }
          } catch (err) {
            const errorMsg = `Ads ${lead.nome}: ${err instanceof Error ? err.message : 'erro'}`;
            stats.erros.push(errorMsg);
          }
        }
      }
    }

    // ============================================
    // ETAPA 3: ANÁLISE IA (apenas HOT e WARM)
    // ============================================

    if (config.analisarIA && leadsIds.length > 0) {
      // Buscar leads HOT e WARM para análise
      const { data: leadsParaAnalise } = await supabase
        .from('leads_prospectados')
        .select('id, nome, google_place_id, classificacao')
        .in('id', leadsIds)
        .in('classificacao', ['HOT', 'WARM'] as LeadClassificacao[])
        .is('analisado_ia_em', null)
        .not('google_place_id', 'is', null);

      if (leadsParaAnalise && leadsParaAnalise.length > 0) {
        for (const lead of leadsParaAnalise) {
          try {
            // Delay para não sobrecarregar n8n
            await new Promise(resolve => setTimeout(resolve, 1000));

            const analiseResult = await analisarLeadIAWebhook(
              lead.google_place_id!,
              lead.id
            );

            if (analiseResult.success && analiseResult.analiseIA) {
              await supabase
                .from('leads_prospectados')
                .update({
                  score_base: analiseResult.analiseIA.scoreBase,
                  bonus_marketing: analiseResult.analiseIA.bonusMarketing,
                  score_final: analiseResult.analiseIA.scoreFinal,
                  classificacao_ia: analiseResult.analiseIA.classificacao,
                  nivel_oportunidade: analiseResult.marketingDigital?.nivelOportunidade,
                  analise_ia: analiseResult.analiseIA,
                  analisado_ia_em: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', lead.id);

              stats.analisadosIA++;
            }
          } catch (err) {
            const errorMsg = `IA ${lead.nome}: ${err instanceof Error ? err.message : 'erro'}`;
            stats.erros.push(errorMsg);
          }
        }
      }
    }

    // ============================================
    // ETAPA 4: DIAGNÓSTICO PROFUNDO (apenas HOT)
    // ============================================

    if (config.executarDiagnostico && leadsIds.length > 0) {
      // Buscar leads HOT para diagnóstico
      const { data: leadsParaDiagnostico } = await supabase
        .from('leads_prospectados')
        .select('id, nome, telefone, email, site, instagram, observacoes')
        .in('id', leadsIds)
        .eq('classificacao', 'HOT')
        .is('diagnostico_profundo', null);

      if (leadsParaDiagnostico && leadsParaDiagnostico.length > 0) {
        for (const lead of leadsParaDiagnostico) {
          try {
            // Delay maior para diagnóstico (mais pesado)
            await new Promise(resolve => setTimeout(resolve, 2000));

            const diagnosticoRequest: DiagnosticoRequest = {
              leadId: lead.id,
              nome: lead.nome || 'Sem nome',
              telefone: lead.telefone || undefined,
              email: lead.email || undefined,
              empresa: lead.nome || undefined,
              site: lead.site || undefined,
              instagram: lead.instagram || undefined,
              observacoes: lead.observacoes || undefined,
              fonte: 'pipeline',
            };

            const resultado = await executarDiagnostico(diagnosticoRequest);

            if (resultado.success && resultado.data) {
              await supabase
                .from('leads_prospectados')
                .update({
                  diagnostico_profundo: resultado.data,
                  temperatura_lead: resultado.data.classificacao?.temperatura || null,
                  score_lead: resultado.data.classificacao?.score || null,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', lead.id);

              stats.diagnosticosExecutados++;
            }
          } catch (err) {
            const errorMsg = `Diagnóstico ${lead.nome}: ${err instanceof Error ? err.message : 'erro'}`;
            stats.erros.push(errorMsg);
          }
        }
      }
    }

    // ============================================
    // RESULTADO FINAL
    // ============================================

    // Buscar leads processados para retornar
    const { data: leadsProcessados } = await supabase
      .from('leads_prospectados')
      .select('*')
      .in('id', leadsIds)
      .order('score_final', { ascending: false, nullsFirst: false });

    return NextResponse.json({
      success: true,
      message: 'Pipeline executado com sucesso',
      pesquisa: mapDbPesquisaToTs(pesquisa),
      stats,
      leads: leadsProcessados || [],
      resumo: {
        totalLeads: stats.pesquisa.total,
        novos: stats.pesquisa.novos,
        adsVerificados: stats.adsVerificados,
        analisadosIA: stats.analisadosIA,
        diagnosticos: stats.diagnosticosExecutados,
        erros: stats.erros.length,
      },
    });

  } catch (error) {
    console.error('[pipeline] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads/pipeline
 * Retorna status de pipelines em execução
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Buscar pesquisas recentes (que representam pipelines)
    const { data: pesquisas, error } = await supabase
      .from('pesquisas_mercado')
      .select('*')
      .eq('user_id', user.id)
      .like('request_id', 'pipeline_%')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[pipeline] Erro ao listar:', error);
      return NextResponse.json({ error: 'Erro ao listar pipelines' }, { status: 500 });
    }

    return NextResponse.json({
      pipelines: (pesquisas || []).map(mapDbPesquisaToTs),
      total: pesquisas?.length || 0,
    });

  } catch (error) {
    console.error('[pipeline] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
