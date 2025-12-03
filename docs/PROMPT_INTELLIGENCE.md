# PROMPT - Implementação Client Intelligence (IA)

Cole este prompt no Claude Code para implementar a feature de IA no TrafficHub.

---

## 🚀 PROMPT PARA COLAR:

```
Você vai implementar a feature "Client Intelligence" - um sistema de IA que analisa todas as informações do cliente e gera insights automaticamente.

Leia a documentação CLIENT_INTELLIGENCE.md antes de começar.

---

## O QUE A FEATURE FAZ

Quando um cliente é criado ou editado, a IA:

1. **Coleta** todas as informações (Informações, Estratégia, Credenciais, etc)
2. **Processa** com Claude API
3. **Gera**:
   - Base de Conhecimento estruturada (JSON)
   - Resumo Executivo (texto)
   - Sugestões de Conteúdo **PERSONALIZADAS para aquele cliente** (5-8)
   - Ofertas Sazonais com **CÁLCULO DE MARGEM** (3-5)
4. **Salva** no banco de dados
5. **Exibe** em uma nova aba "🧠 IA" no card do cliente

### IMPORTANTE - Diferenças desta versão:

1. **Sugestões de Conteúdo**: NÃO são genéricas por nicho. São baseadas na **estratégia de campanha específica** do cliente.

2. **Ofertas Sazonais**: Calculam **impacto na margem de lucro** e sugerem **diferentes ângulos de oferta** (desconto, bônus, combo, etc).

3. **Novo campo**: Adicionar **"Margem de Lucro"** nos dados básicos do cliente.

4. **Remover duplicação**: O campo "Ticket Médio" já existe nos dados básicos, **REMOVER do Briefing** para não duplicar.

---

## FASES DE IMPLEMENTAÇÃO

### FASE 1: Database

1. Criar migration para tabela `client_intelligence`:
   - id, client_id, user_id
   - knowledge_base (JSONB)
   - executive_summary (TEXT)
   - content_suggestions (JSONB)
   - seasonal_offers (JSONB)
   - ai_model, tokens_used, last_generated_at
   - created_at, updated_at

2. Configurar RLS policy
3. Criar índice único em client_id

4. **IMPORTANTE - Alterar tabela clients:**
   - ADICIONAR coluna `profit_margin` (DECIMAL) - Margem de lucro em %
   - ADICIONAR coluna `ad_budget` (DECIMAL) - Orçamento mensal de ads
   - REMOVER campo `average_ticket` do briefing/strategy (se existir duplicado)

**SQL:**
```sql
-- Tabela de Intelligence
CREATE TABLE client_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  knowledge_base JSONB NOT NULL DEFAULT '{}',
  executive_summary TEXT,
  content_suggestions JSONB DEFAULT '[]',
  seasonal_offers JSONB DEFAULT '[]',
  ai_model TEXT DEFAULT 'claude-sonnet-4-20250514',
  tokens_used INTEGER DEFAULT 0,
  last_generated_at TIMESTAMPTZ DEFAULT NOW(),
  generation_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_client_intelligence_client ON client_intelligence(client_id);
ALTER TABLE client_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own intelligence"
  ON client_intelligence FOR ALL
  USING (auth.uid() = user_id);

-- Adicionar campos na tabela clients (se não existirem)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ad_budget DECIMAL(12,2);

-- Comentário para documentar
COMMENT ON COLUMN clients.profit_margin IS 'Margem de lucro do cliente em % (ex: 30.00 = 30%)';
COMMENT ON COLUMN clients.ad_budget IS 'Orçamento mensal de ads do cliente';
```

**Validar:** Testar no Supabase SQL Editor

### FASE 1.5: Atualizar Formulário do Cliente

1. **ADICIONAR campos nos dados básicos do cliente:**
   - Margem de Lucro (%) - Campo numérico
   - Orçamento de Ads (R$) - Campo numérico

2. **REMOVER do Briefing/Estratégia:**
   - Campo "Ticket Médio" (já existe nos dados básicos, evitar duplicação)

3. **Atualizar Types do cliente** para incluir os novos campos

**Validar:** npm run build + testar formulário

### FASE 2: Types TypeScript

Criar src/types/intelligence.ts com:
- KnowledgeBase interface
- ContentSuggestion interface
- SeasonalOffer interface
- ClientIntelligence interface
- DTOs

**Validar:** npm run type-check

### FASE 3: Prompt Builder (IA)

Criar src/lib/ai/intelligence-prompt.ts:

```typescript
export function buildIntelligencePrompt(clientData: ClientWithAllData): string {
  // Monta o prompt com todas as informações do cliente
  // Retorna string formatada para a IA
}
```

O prompt deve:
- Receber TODOS os dados do cliente (informações, estratégia, financeiro, etc)
- Instruir a IA a retornar JSON estruturado
- Pedir sugestões específicas para o nicho
- Considerar orçamento do cliente
- Pedir ofertas sazonais dos próximos 3 meses

**Validar:** npm run type-check

### FASE 4: Serviço de Geração

Criar src/lib/ai/generate-intelligence.ts:

```typescript
export async function generateClientIntelligence(
  clientId: string,
  clientData: ClientWithAllData
): Promise<ClientIntelligence> {
  // 1. Monta o prompt
  const prompt = buildIntelligencePrompt(clientData);
  
  // 2. Chama a API do Claude (usar a que já existe no projeto)
  const response = await callClaudeAPI(prompt);
  
  // 3. Parse do JSON retornado
  const parsed = JSON.parse(response);
  
  // 4. Salva no banco
  const intelligence = await saveIntelligence(clientId, parsed);
  
  return intelligence;
}
```

**Validar:** npm run type-check

### FASE 5: API Routes

Criar em src/app/api/intelligence/:

1. `route.ts` - POST (gerar)
2. `[clientId]/route.ts` - GET (buscar), DELETE (remover)
3. `regenerate/route.ts` - POST (forçar regeneração)

Endpoints:
- GET /api/intelligence/[clientId] - Busca intelligence
- POST /api/intelligence/regenerate - Gera/regenera
- DELETE /api/intelligence/[clientId] - Remove

**Validar:** npm run build + testar endpoints

### FASE 6: Hook

Criar src/hooks/useClientIntelligence.ts:

```typescript
export function useClientIntelligence(clientId: string) {
  // Estados: intelligence, loading, generating, error
  // Funções: fetchIntelligence, generateIntelligence, regenerate
  // Retorna tudo
}
```

**Validar:** npm run type-check

### FASE 7: Componentes

Criar em src/components/intelligence/:

1. **IntelligenceCard.tsx** - Card principal com tabs
2. **ExecutiveSummary.tsx** - Resumo visual
3. **ContentSuggestions.tsx** - Lista de sugestões
4. **SeasonalOffers.tsx** - Ofertas sazonais
5. **SuggestionCard.tsx** - Card individual de sugestão
6. **OfferCard.tsx** - Card individual de oferta
7. **CompletenessScore.tsx** - Indicador de completude (0-100)
8. **index.ts** - Re-exports

Visual:
- Seguir DESIGN_SYSTEM.md (glassmorphism)
- Cards com cores por tipo (violet, emerald, blue, orange)
- Badges de prioridade e esforço
- Ícones por tipo de conteúdo

**Validar:** npm run build

### FASE 8: Integração no Cliente

1. Adicionar nova aba "🧠 IA" no modal/página do cliente
2. Usar o hook useClientIntelligence
3. Renderizar IntelligenceCard na aba

Tabs do cliente ficam:
- Informações
- Estratégia
- Credenciais
- Relatórios (X)
- Pagamentos (X)
- 🧠 IA ← NOVA

**Validar:** npm run build + testar visualmente

### FASE 9: Trigger Automático

Quando cliente é criado ou editado:

1. Após salvar cliente com sucesso
2. Disparar geração de intelligence em background
3. Não bloquear o usuário
4. Mostrar toast informando que IA está processando

```typescript
// Após salvar cliente
toast.info('🧠 IA analisando informações...');

fetch('/api/intelligence/regenerate', {
  method: 'POST',
  body: JSON.stringify({ client_id: client.id }),
}).then(() => {
  toast.success('✨ Análise de IA concluída!');
}).catch(() => {
  toast.error('Erro na análise de IA');
});
```

**Validar:** Testar fluxo completo criar/editar cliente

---

## ESTRUTURA DO PROMPT PARA A IA

Use este template para o prompt que será enviado ao Claude:

```
Você é um especialista em marketing digital e gestão de tráfego pago. 
Analise as informações do cliente e gere insights PERSONALIZADOS para ESTE CLIENTE ESPECÍFICO.

## DADOS DO CLIENTE

**Negócio:**
- Nome: {name}
- Segmento: {segment}
- Cidade: {city}

**Contato:**
- Nome: {contact_name}
- Telefone: {contact_phone}
- Email: {contact_email}

**Financeiro:**
- Valor Mensal (fee): R$ {monthly_value}
- Dia Vencimento: {due_day}
- Ticket Médio: R$ {average_ticket}
- Margem de Lucro: {profit_margin}%
- Orçamento de Ads: R$ {ad_budget}

**Redes Sociais:**
- Instagram: {instagram}
- Facebook: {facebook}
- Website: {website}

**Estratégia de Campanha:**
{campaign_strategy}

**Briefing/Objetivos:**
{strategy_notes}

**Público-Alvo:**
{target_audience}

**Recursos:**
- Drive: {drive_url}
- Conta de Anúncios: {ads_account_url}

## GERE O SEGUINTE JSON

{
  "knowledge_base": {
    "profile": { ... },
    "contact": { ... },
    "financial": { 
      "monthly_fee": number,
      "payment_day": number,
      "average_ticket": number,
      "profit_margin": number,
      "ad_budget": number
    },
    "digital_presence": { ... },
    "strategy": {
      "main_objectives": ["objetivo específico 1", "objetivo específico 2"],
      "target_audience": "descrição detalhada do público DESTE cliente",
      "unique_selling_points": ["diferencial 1", "diferencial 2"],
      "campaign_focus": "foco principal da campanha",
      "content_pillars": ["pilar 1", "pilar 2"]
    },
    "niche_analysis": {
      "market_position": "análise da posição",
      "growth_opportunities": ["oportunidade 1", "oportunidade 2"],
      "main_challenges": ["desafio 1", "desafio 2"],
      "seasonal_peaks": ["mês - motivo"]
    },
    "meta": {
      "completeness_score": 75,
      "last_updated": "2025-12-03",
      "version": 1
    }
  },
  
  "executive_summary": "Resumo executivo em 3-4 parágrafos sobre ESTE cliente específico, sua estratégia de campanha, pontos fortes e oportunidades personalizadas...",
  
  "content_suggestions": [
    {
      "id": "uuid",
      "title": "Título da sugestão",
      "description": "Descrição detalhada",
      "content_type": "post|video|reels|stories|carousel|campaign",
      "platform": ["instagram", "facebook"],
      "objective": "awareness|engagement|conversion|retention",
      "priority": "high|medium|low",
      "estimated_effort": "quick|medium|complex",
      "suggested_copy": "Copy sugerida específica para este cliente...",
      "visual_suggestion": "Sugestão de visual...",
      "hashtags": ["hashtag1", "hashtag2"],
      "based_on": "Qual informação do cliente gerou essa sugestão (ex: 'objetivo de captar leads', 'público jovem', etc)",
      "reasoning": "Por que estou sugerindo isso para ESTE cliente especificamente..."
    }
  ],
  
  "seasonal_offers": [
    {
      "id": "uuid",
      "title": "Promoção Dia X",
      "description": "Descrição da oferta",
      "seasonal_date": "2025-02-14",
      "seasonal_name": "Dia dos Namorados",
      
      "offer_angles": [
        {
          "angle_name": "Compre 1, Leve 2",
          "offer_type": "bundle",
          "offer_description": "Feche plano trimestral e traga um amigo grátis por 1 mês",
          "discount_value": null,
          "original_price": {average_ticket * 3},
          "offer_price": {average_ticket * 3},
          "margin_impact": -11,
          "break_even_sales": 2,
          "target_audience": "Quem já pensou em trazer alguém junto",
          "hook": "Treine com seu parceiro(a) sem pagar a mais!",
          "why_this_works": "Aumenta retenção (treinar junto) e gera lead qualificado (amigo)"
        },
        {
          "angle_name": "Desafio Cashback",
          "offer_type": "gamification",
          "offer_description": "Complete 20 treinos em 30 dias e ganhe 50% do valor de volta",
          "discount_value": "até 50%",
          "original_price": {average_ticket},
          "offer_price": {average_ticket},
          "margin_impact": -15,
          "break_even_sales": 3,
          "target_audience": "Pessoas que precisam de motivação extra",
          "hook": "Seu esforço vale dinheiro de volta!",
          "why_this_works": "Maioria não completa o desafio (você ganha) + quem completa vira cliente fiel"
        },
        {
          "angle_name": "Pacote Experiência VIP",
          "offer_type": "upsell",
          "offer_description": "Plano mensal + avaliação física + plano alimentar personalizado",
          "discount_value": null,
          "original_price": {average_ticket + 150},
          "offer_price": {average_ticket + 80},
          "margin_impact": +5,
          "break_even_sales": 0,
          "target_audience": "Quem quer resultado rápido e está disposto a investir",
          "hook": "Tudo que você precisa pra transformar em 2025",
          "why_this_works": "Aumenta ticket médio, não dá desconto no plano base"
        },
        {
          "angle_name": "Parceria Local",
          "offer_type": "partnership",
          "offer_description": "Matricule-se e ganhe voucher de R$50 na loja de suplementos parceira",
          "discount_value": "R$50 voucher",
          "original_price": {average_ticket},
          "offer_price": {average_ticket},
          "margin_impact": 0,
          "break_even_sales": 0,
          "target_audience": "Quem já consome suplementos",
          "hook": "Comece o ano equipado!",
          "why_this_works": "Custo zero pra academia (parceiro banca) + valor percebido alto"
        }
      ],
      
      "budget_options": [
        {
          "level": "minimum",
          "budget": {ad_budget * 0.5},
          "expected_reach": "5.000-8.000",
          "expected_leads": "30-50",
          "expected_sales": "5-10",
          "roi_estimate": "2x-3x"
        },
        {
          "level": "recommended",
          "budget": {ad_budget},
          "expected_reach": "10.000-15.000",
          "expected_leads": "60-100",
          "expected_sales": "12-20",
          "roi_estimate": "3x-5x"
        }
      ],
      
      "timeline": {
        "teaser_start": "2025-02-07",
        "promotion_start": "2025-02-10",
        "peak_day": "2025-02-14",
        "promotion_end": "2025-02-16"
      },
      
      "relevance_score": 85,
      "reasoning": "Por que essa data é relevante para ESTE cliente..."
    }
  ]
}

## REGRAS IMPORTANTES

1. **PERSONALIZADO para ESTE cliente**: NÃO use sugestões genéricas de nicho. Baseie-se na estratégia de campanha específica.

2. **Sugestões de Conteúdo baseadas na estratégia**: Cada sugestão deve estar conectada a um objetivo ou informação do cliente. Use "based_on" para indicar.

3. **Ofertas com ÂNGULOS CRIATIVOS (NÃO apenas desconto %)**:
   - Ticket Médio: R$ {average_ticket}
   - Margem de Lucro: {profit_margin}%
   
   **IMPORTANTE: NÃO se limite a descontos de porcentagem!**
   Sugira 3-4 ÂNGULOS DIFERENTES e CRIATIVOS para cada data sazonal:
   
   Exemplos de ângulos criativos:
   - "Compre 1, Leve 2" (aumenta ticket, não reduz margem unitária)
   - "Traga um amigo e ambos ganham X" (aquisição viral)
   - "Plano anual = 2 meses grátis" (cash flow upfront)
   - "Kit Especial: produto + brinde exclusivo" (valor percebido)
   - "Desafio 30 dias: complete e ganhe X de volta" (gamificação)
   - "Early Bird: primeiros 20 clientes ganham X" (urgência + escassez)
   - "Indique 3, ganhe 1 mês grátis" (programa de indicação)
   - "Pacote Família/Casal com preço especial" (bundle)
   - "Experiência VIP: produto + consultoria/acompanhamento" (upsell)
   - "Garantia estendida ou resultado garantido" (reduz risco)
   - "Parceria: cliente ganha voucher de parceiro local" (custo zero)
   - "Sorteio: comprando no período, concorre a X" (engajamento)
   
   Para CADA ângulo, calcule:
   - margin_impact (impacto real na margem)
   - break_even_sales (vendas extras necessárias)
   - Por que esse ângulo funciona para ESTE cliente

4. **Orçamento de Ads**: Considere R$ {ad_budget}/mês disponível

5. **Datas Sazonais**: Apenas datas relevantes para O NEGÓCIO DESTE CLIENTE nos próximos 3 meses

6. **completeness_score**: De 0-100, baseado nos campos preenchidos

7. **APENAS JSON válido**, sem markdown ou explicações
```

---

## REGRAS CRÍTICAS

1. **Usar a API Claude que já existe** - Não criar nova integração
2. **Salvar tudo no banco** - Não fazer chamadas desnecessárias
3. **Não bloquear o usuário** - Geração em background
4. **Tratar erros** - Se IA falhar, mostrar mensagem amigável
5. **Seguir design system** - Glassmorphism, cores, animações

---

## FORMATO DE RESPOSTA

Após cada fase:

```
## ✅ FASE X Concluída: [Nome]

### Arquivos Criados:
- path/to/file.ts - Descrição

### Validações:
- ✅ TypeScript: OK
- ✅ Build: OK

### Próxima Fase:
[Nome]
```

---

## COMECE AGORA

1. Confirme que leu CLIENT_INTELLIGENCE.md
2. Verifique como a API do Claude está implementada no projeto
3. Inicie pela FASE 1: Database

Aguardo confirmação.
```

---

## 📝 PROMPTS AUXILIARES

### Se precisar verificar a API Claude existente:

```
Antes de continuar, me mostre como a API do Claude está implementada neste projeto.
Procure por:
- Arquivos em src/lib/ai/ ou similar
- Chamadas para api.anthropic.com
- Variáveis de ambiente relacionadas (ANTHROPIC_API_KEY, CLAUDE_API_KEY)

Me mostre o código existente para eu entender como integrar.
```

### Se a API não existir:

```
A API do Claude não está implementada. Crie a integração:

1. Criar src/lib/ai/claude.ts com função para chamar a API
2. Usar ANTHROPIC_API_KEY do .env
3. Endpoint: https://api.anthropic.com/v1/messages
4. Modelo: claude-sonnet-4-20250514

Depois continue com as outras fases.
```

### Para testar a geração:

```
Teste a geração de intelligence:

1. Pegue um cliente existente do banco
2. Chame a API /api/intelligence/regenerate com o client_id
3. Verifique se salvou no banco
4. Verifique se aparece na aba 🧠 IA do cliente
```

### Se o JSON da IA vier malformado:

```
O JSON retornado pela IA está malformado. Adicione:

1. Validação do JSON antes de salvar
2. Try-catch no parse
3. Se falhar, tentar extrair JSON do texto (regex)
4. Se ainda falhar, retornar erro amigável

Não deixe quebrar a aplicação por erro da IA.
```

---

## 🎯 RESULTADO ESPERADO

Ao final, você terá:

### Banco de Dados:
- ✅ Tabela client_intelligence
- ✅ Campo `profit_margin` na tabela clients
- ✅ Campo `ad_budget` na tabela clients
- ✅ Campo `average_ticket` REMOVIDO do briefing (evitar duplicação)

### Código:
- ✅ Types completos em src/types/intelligence.ts
- ✅ Prompt builder personalizado para cada cliente
- ✅ Serviço de geração com cálculo de margem
- ✅ API routes funcionando
- ✅ Hook useClientIntelligence
- ✅ Componentes visuais (IntelligenceCard, etc)

### Interface:
- ✅ Nova aba "🧠 IA" no card do cliente
- ✅ Campos "Margem de Lucro" e "Orçamento de Ads" nos dados básicos
- ✅ Trigger automático ao criar/editar

### IA gera:
- ✅ Sugestões de conteúdo **PERSONALIZADAS** baseadas na estratégia do cliente
- ✅ Ofertas sazonais com **CÁLCULO DE MARGEM**
- ✅ Múltiplos **ÂNGULOS DE OFERTA** (desconto, bônus, combo)
- ✅ **Break-even** calculado para cada oferta
- ✅ Orçamento baseado no budget real do cliente
