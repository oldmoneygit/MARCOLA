/**
 * @file route.ts
 * @description API route para gerar sugestões baseadas em análise
 * @module api/suggestions/generate
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { Ad } from '@/types';

/**
 * Analisa anúncios e gera sugestões automáticas
 */
function analyzeAdsAndGenerateSuggestions(
  clientId: string,
  clientName: string,
  ads: Ad[]
): Array<{
  client_id: string;
  type: string;
  severity: 'urgent' | 'warning' | 'info';
  title: string;
  description: string;
  actions: string[];
}> {
  const suggestions: Array<{
    client_id: string;
    type: string;
    severity: 'urgent' | 'warning' | 'info';
    title: string;
    description: string;
    actions: string[];
  }> = [];

  // Análise de diversidade de criativos
  const activeAds = ads.filter(ad => ad.status !== 'paused');
  if (activeAds.length < 5) {
    suggestions.push({
      client_id: clientId,
      type: 'low_diversity',
      severity: activeAds.length < 3 ? 'urgent' : 'warning',
      title: 'Poucos Criativos Ativos',
      description: `${clientName} tem apenas ${activeAds.length} criativos ativos. Recomendado: 8-15 criativos.`,
      actions: [
        'Criar novos criativos com diferentes abordagens',
        'Testar novos formatos (carrossel, vídeo, estático)',
        'Diversificar copies e CTAs',
      ],
    });
  }

  // Análise de fadiga de criativo
  const fatigueAds = ads.filter(ad => ad.status === 'fatigue');
  if (fatigueAds.length > 0) {
    fatigueAds.forEach(ad => {
      suggestions.push({
        client_id: clientId,
        type: 'creative_fatigue',
        severity: fatigueAds.length > 3 ? 'urgent' : 'warning',
        title: 'Fadiga de Criativo Detectada',
        description: `O anúncio "${ad.ad_name}" está mostrando sinais de fadiga. CTR: ${ad.ctr?.toFixed(2)}%`,
        actions: [
          'Pausar ou substituir o criativo',
          'Criar variações com novos elementos visuais',
          'Testar novo copy ou CTA',
        ],
      });
    });
  }

  // Análise de CPA alto
  const highCpaAds = ads.filter(ad => ad.cpa && ad.cpa > 100);
  if (highCpaAds.length > 0) {
    suggestions.push({
      client_id: clientId,
      type: 'high_cpa',
      severity: highCpaAds.some(ad => ad.cpa && ad.cpa > 200) ? 'urgent' : 'warning',
      title: 'CPA Elevado em Anúncios',
      description: `${highCpaAds.length} anúncio(s) de ${clientName} com CPA acima do ideal.`,
      actions: [
        'Revisar segmentação de público',
        'Otimizar landing page',
        'Testar novas ofertas ou ganchos',
      ],
    });
  }

  // Análise de CTR baixo
  const lowCtrAds = ads.filter(ad => ad.ctr && ad.ctr < 0.5);
  if (lowCtrAds.length > 0) {
    suggestions.push({
      client_id: clientId,
      type: 'low_ctr',
      severity: 'warning',
      title: 'CTR Baixo Detectado',
      description: `${lowCtrAds.length} anúncio(s) de ${clientName} com CTR abaixo de 0.5%.`,
      actions: [
        'Melhorar copy e headline',
        'Testar diferentes imagens/vídeos',
        'Revisar chamada para ação',
      ],
    });
  }

  // Oportunidade de escala (Winners)
  const winnerAds = ads.filter(ad => ad.status === 'winner');
  if (winnerAds.length > 0) {
    suggestions.push({
      client_id: clientId,
      type: 'scale_opportunity',
      severity: 'info',
      title: 'Oportunidade de Escala',
      description: `${clientName} tem ${winnerAds.length} anúncio(s) winner. Considere aumentar o orçamento.`,
      actions: [
        'Aumentar orçamento gradualmente (20-30%)',
        'Criar variações dos anúncios vencedores',
        'Expandir para novos públicos semelhantes',
      ],
    });
  }

  return suggestions;
}

/**
 * POST /api/suggestions/generate
 * Gera sugestões automáticas baseadas nos relatórios
 */
export async function POST() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Busca clientes ativos do usuário
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (clientsError) {
      console.error('[API] POST /api/suggestions/generate clients error:', clientsError);
      return NextResponse.json(
        { error: 'Erro ao buscar clientes' },
        { status: 500 }
      );
    }

    if (!clients || clients.length === 0) {
      return NextResponse.json({ generated: 0, suggestions: [] });
    }

    const allSuggestions: Array<{
      client_id: string;
      type: string;
      severity: 'urgent' | 'warning' | 'info';
      title: string;
      description: string;
      actions: string[];
    }> = [];

    // Para cada cliente, busca os relatórios mais recentes e analisa
    for (const client of clients) {
      // Busca os anúncios do último relatório
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('id')
        .eq('client_id', client.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (reportsError || !reports || reports.length === 0) {
        continue;
      }

      const latestReport = reports[0];
      if (!latestReport) {
        continue;
      }

      const { data: ads, error: adsError } = await supabase
        .from('ads')
        .select('*')
        .eq('report_id', latestReport.id);

      if (adsError || !ads || ads.length === 0) {
        continue;
      }

      const clientSuggestions = analyzeAdsAndGenerateSuggestions(
        client.id,
        client.name,
        ads as Ad[]
      );

      allSuggestions.push(...clientSuggestions);
    }

    if (allSuggestions.length === 0) {
      return NextResponse.json({ generated: 0, suggestions: [] });
    }

    // Insere as sugestões no banco
    const suggestionsToInsert = allSuggestions.map(suggestion => ({
      ...suggestion,
      user_id: user.id,
      status: 'pending',
    }));

    const { data: insertedSuggestions, error: insertError } = await supabase
      .from('suggestions')
      .insert(suggestionsToInsert)
      .select();

    if (insertError) {
      console.error('[API] POST /api/suggestions/generate insert error:', insertError);
      return NextResponse.json(
        { error: 'Erro ao salvar sugestões' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      generated: insertedSuggestions?.length || 0,
      suggestions: insertedSuggestions,
    });
  } catch (error) {
    console.error('[API] POST /api/suggestions/generate unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
