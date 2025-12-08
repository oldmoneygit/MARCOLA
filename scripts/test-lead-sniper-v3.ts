/**
 * Script de teste para Lead Sniper v3 AI
 * Execute com: npx ts-node scripts/test-lead-sniper-v3.ts
 */

const WEBHOOK_URL = 'https://n8n.srv1180872.hstgr.cloud/webhook/lead-sniper/v3/ai';

interface TestParams {
  tipo_negocio: string;
  cidade: string;
  estado?: string;
  quantidade?: number;
  tom_voz?: string;
}

async function testarLeadSniperV3(params: TestParams) {
  console.log('\n🚀 Iniciando teste do Lead Sniper v3 AI...\n');
  console.log('📍 Parâmetros:', JSON.stringify(params, null, 2));
  console.log('\n⏳ Aguarde 60-120 segundos (a API está buscando e gerando icebreakers)...\n');

  const startTime = Date.now();

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`✅ Resposta recebida em ${elapsed}s\n`);
    console.log('📊 Estatísticas:');
    console.log(`   Total: ${data.estatisticas.total} leads`);
    console.log(`   🔥 HOT: ${data.estatisticas.hot}`);
    console.log(`   🟡 WARM: ${data.estatisticas.warm}`);
    console.log(`   🔵 COOL: ${data.estatisticas.cool}`);
    console.log(`   📱 Com WhatsApp: ${data.estatisticas.comWhatsapp}`);
    console.log(`   🤖 Icebreakers por IA: ${data.estatisticas.icebreakersPorIA}\n`);

    console.log('📋 Leads encontrados:\n');
    for (const lead of data.leads) {
      const emoji = lead.classificacao === 'HOT' ? '🔥' : lead.classificacao === 'WARM' ? '🟡' : '🔵';
      console.log(`${emoji} ${lead.nome} (Score: ${lead.score})`);
      console.log(`   📍 ${lead.bairro}, ${lead.cidade}`);
      console.log(`   ⭐ ${lead.rating} (${lead.totalAvaliacoes} avaliações)`);
      console.log(`   💬 Icebreaker: "${lead.icebreaker.substring(0, 80)}..."`);
      if (lead.linkWhatsapp) {
        console.log(`   📱 WhatsApp: ${lead.linkWhatsapp}`);
      }
      console.log('');
    }

    return data;
  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  }
}

// Executar teste
testarLeadSniperV3({
  tipo_negocio: 'restaurante',
  cidade: 'Campinas',
  estado: 'SP',
  quantidade: 5,
  tom_voz: 'profissional',
});
