/**
 * @file route.ts
 * @description API Route para verificação em massa de ads dos leads
 * @module api/leads/verificar-ads-massa
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { verificarAdsWebhook, mapAdsResultToDb } from '@/lib/lead-sniper';

/**
 * POST /api/leads/verificar-ads-massa
 * Executa verificação de ads em massa para todos os leads com site não verificados
 */
export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar todos os leads com site que ainda não foram verificados
    const { data: leads, error: leadsError } = await supabase
      .from('leads_prospectados')
      .select('id, site, nome')
      .eq('user_id', user.id)
      .eq('tem_site', true)
      .or('ads_verificado.is.null,ads_verificado.eq.false')
      .not('site', 'is', null)
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error('[verificar-ads-massa] Erro ao buscar leads:', leadsError);
      return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum lead pendente de verificação',
        resultados: {
          total: 0,
          sucesso: 0,
          erro: 0,
          verificados: [],
        },
      });
    }

    console.log('\n');
    console.log('='.repeat(80));
    console.log(`[verificar-ads-massa] Iniciando verificação de ${leads.length} leads...`);
    console.log('='.repeat(80));

    const resultados = {
      total: leads.length,
      sucesso: 0,
      erro: 0,
      comGoogleAds: 0,
      comFacebookAds: 0,
      semMarketing: 0,
      verificados: [] as { id: string; nome: string; status: string; nivel?: string }[],
    };

    // Processar leads sequencialmente (1 por vez para não sobrecarregar o n8n)
    for (const lead of leads) {
      try {
        console.log(`[verificar-ads-massa] Verificando: ${lead.nome} (${lead.site})...`);

        // Chamar webhook de verificação
        const webhookResponse = await verificarAdsWebhook(lead.site, lead.id);

        if (!webhookResponse.success) {
          console.error(`[verificar-ads-massa] Falha em ${lead.nome}:`, webhookResponse.error);
          resultados.erro++;
          resultados.verificados.push({
            id: lead.id,
            nome: lead.nome,
            status: 'erro',
          });
          continue;
        }

        // Mapear resultado para formato do banco
        const updateData = mapAdsResultToDb({
          fazGoogleAds: webhookResponse.fazGoogleAds,
          fazFacebookAds: webhookResponse.fazFacebookAds,
          usaGoogleAnalytics: webhookResponse.usaGoogleAnalytics,
          usaGoogleTagManager: webhookResponse.usaGoogleTagManager,
          usaHotjar: webhookResponse.usaHotjar,
          usaRdStation: webhookResponse.usaRDStation,
          usaTiktokAds: webhookResponse.usaTikTokAds,
          usaLinkedinAds: webhookResponse.usaLinkedInAds,
          adsDetalhes: webhookResponse.adsDetalhes,
          nivelMarketingDigital: webhookResponse.nivelMarketingDigital,
          scoreBonus: webhookResponse.scoreBonus,
          oportunidade: webhookResponse.oportunidade,
        });

        // Atualizar lead no banco
        const { error: updateError } = await supabase
          .from('leads_prospectados')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error(`[verificar-ads-massa] Erro ao atualizar ${lead.nome}:`, updateError);
          resultados.erro++;
          resultados.verificados.push({
            id: lead.id,
            nome: lead.nome,
            status: 'erro',
          });
          continue;
        }

        // Contabilizar resultados
        resultados.sucesso++;
        if (webhookResponse.fazGoogleAds) {
          resultados.comGoogleAds++;
        }
        if (webhookResponse.fazFacebookAds) {
          resultados.comFacebookAds++;
        }
        if (!webhookResponse.fazGoogleAds && !webhookResponse.fazFacebookAds &&
            !webhookResponse.usaGoogleAnalytics && !webhookResponse.usaGoogleTagManager) {
          resultados.semMarketing++;
        }

        resultados.verificados.push({
          id: lead.id,
          nome: lead.nome,
          status: 'sucesso',
          nivel: webhookResponse.nivelMarketingDigital,
        });

        console.log(`[verificar-ads-massa] ${lead.nome}: ${webhookResponse.nivelMarketingDigital || 'NENHUM'}`);

        // Pequeno delay entre requisições para não sobrecarregar
        await new Promise((resolve) => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`[verificar-ads-massa] Erro em ${lead.nome}:`, error);
        resultados.erro++;
        resultados.verificados.push({
          id: lead.id,
          nome: lead.nome,
          status: 'erro',
        });
      }
    }

    console.log('\n');
    console.log('='.repeat(80));
    console.log('[verificar-ads-massa] RESULTADO FINAL');
    console.log('='.repeat(80));
    console.log(`Total: ${resultados.total}`);
    console.log(`Sucesso: ${resultados.sucesso}`);
    console.log(`Erro: ${resultados.erro}`);
    console.log(`Com Google Ads: ${resultados.comGoogleAds}`);
    console.log(`Com Facebook Ads: ${resultados.comFacebookAds}`);
    console.log(`Sem Marketing: ${resultados.semMarketing}`);
    console.log('='.repeat(80));
    console.log('\n');

    return NextResponse.json({
      success: true,
      message: `Verificação concluída: ${resultados.sucesso} de ${resultados.total} leads`,
      resultados,
    });

  } catch (error) {
    console.error('[verificar-ads-massa] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads/verificar-ads-massa
 * Retorna o número de leads pendentes de verificação
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Contar leads pendentes de verificação
    const { count, error } = await supabase
      .from('leads_prospectados')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tem_site', true)
      .or('ads_verificado.is.null,ads_verificado.eq.false')
      .not('site', 'is', null);

    if (error) {
      console.error('[verificar-ads-massa] Erro ao contar:', error);
      return NextResponse.json({ error: 'Erro ao contar leads' }, { status: 500 });
    }

    return NextResponse.json({
      pendentes: count || 0,
    });

  } catch (error) {
    console.error('[verificar-ads-massa] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
