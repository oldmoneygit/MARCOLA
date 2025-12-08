# Lead Sniper - Mapeamento de Endpoints e Fluxos

> **Documento de referência** para entender quais webhooks n8n são usados em cada funcionalidade.

---

## 📡 Webhooks N8N Disponíveis

| Webhook | Descrição | Status |
|---------|-----------|--------|
| `POST /webhook/lead-sniper` | Lead Sniper v2 (antigo) | ⚠️ LEGADO |
| `POST /webhook/verificar-ads` | Verificação de Ads | ✅ ATIVO |
| `POST /webhook/analisar-lead` | Análise IA rápida | ⚠️ LEGADO |
| `POST /webhook/diagnostico` | Diagnóstico Profundo v2 (Apify) | ✅ ATIVO |
| `POST /webhook/lead-sniper/v3` | Lead Sniper v3 Rápido (Apify) | ⚠️ NÃO USADO |
| `POST /webhook/lead-sniper/v3/ai` | Lead Sniper v3 AI (Apify + OpenAI) | ⭐ RECOMENDADO |
| `POST /webhook/lead-sniper/v3/full` | Lead Sniper v3 Full (Apify + Scraping) | ⚠️ NÃO USADO |

---

## 🎯 Mapeamento: Ação UI → API → Webhook

### 1. Nova Pesquisa (Formulário Antigo)
```
📍 UI: NovaPesquisaForm.tsx → Botão "Iniciar Pesquisa"
   ↓
📡 API: POST /api/pesquisa-mercado
   ↓
🔗 Webhook: POST /webhook/lead-sniper (v2 LEGADO)
   ↓
📁 Arquivo: src/lib/lead-sniper/service.ts (linha 25)
```

**Parâmetros:**
```json
{
  "tipo": "restaurante",
  "cidades": [{ "nome": "Campinas", "lat": -22.9, "lng": -47.0, "raio": 5000 }],
  "scoreMinimo": 40,
  "maxPorCidade": 10
}
```

---

### 2. Analisar com IA (Análise Rápida)
```
📍 UI: LeadsList.tsx → Botão "Analisar" (ícone cérebro)
   ↓
📡 API: POST /api/leads/[id]/analisar-ia
   ↓
🔗 Webhook: POST /webhook/analisar-lead (LEGADO)
   ↓
📁 Arquivo: src/lib/lead-sniper/service.ts (linha 27)
```

**O que faz:**
- Busca dados do Google Places
- Analisa marketing digital
- Gera score IA e classificação
- Sugere mensagem WhatsApp

---

### 3. Diagnóstico Profundo
```
📍 UI: ModalDiagnostico.tsx → Botão "Gerar Diagnóstico"
   ↓
📡 API: POST /api/leads/[id]/diagnostico
   ↓
🔗 Webhook: POST /webhook/diagnostico (ATIVO)
   ↓
📁 Arquivo: src/lib/diagnostico/service.ts (linha 18)
```

**O que faz:**
- Análise completa via Apify
- Detecta nicho automaticamente
- Gera estratégia de abordagem
- Cria mensagens prontas para contato
- Retorna pontos fortes/fracos/oportunidades

---

### 4. Verificar Ads
```
📍 UI: LeadDetailModal.tsx → Botão "Verificar Ads"
   ↓
📡 API: POST /api/leads/[id]/verificar-ads
   ↓
🔗 Webhook: POST /webhook/verificar-ads (ATIVO)
   ↓
📁 Arquivo: src/lib/lead-sniper/service.ts (linha 26)
```

**O que faz:**
- Verifica se tem Google Ads
- Verifica se tem Facebook Ads
- Detecta Google Analytics/Tag Manager
- Retorna nível de marketing digital

---

### 5. Lead Sniper v3 AI ⭐ (NOVO - RECOMENDADO)
```
📍 UI: [A IMPLEMENTAR]
   ↓
📡 API: POST /api/lead-sniper/v3
   ↓
🔗 Webhook: POST /webhook/lead-sniper/v3/ai (RECOMENDADO)
   ↓
📁 Arquivo: src/lib/lead-sniper/service-v3.ts (linha 29)
```

**O que faz:**
- Busca leads via Apify (Google Maps)
- Scraping de sites
- Gera icebreakers personalizados via OpenAI
- Retorna leads classificados (HOT/WARM/COOL)

**Parâmetros:**
```json
{
  "tipo_negocio": "restaurante",
  "cidade": "Campinas",
  "estado": "SP",
  "quantidade": 10,
  "tom_voz": "profissional"
}
```

---

## 📊 Comparativo dos Fluxos

| Funcionalidade | Webhook | Tempo | IA | Icebreaker |
|----------------|---------|-------|----|----|
| Nova Pesquisa (v2) | `/webhook/lead-sniper` | ~30s | ❌ | ❌ |
| Analisar IA | `/webhook/analisar-lead` | ~15s | ✅ | ❌ |
| Diagnóstico Profundo | `/webhook/diagnostico` | ~60s | ✅ | ✅ |
| Verificar Ads | `/webhook/verificar-ads` | ~10s | ❌ | ❌ |
| **Lead Sniper v3 AI** | `/webhook/lead-sniper/v3/ai` | ~120s | ✅ | ✅ |

---

## 🔧 Arquivos de Configuração

### URLs dos Webhooks

```typescript
// src/lib/lead-sniper/service.ts
const WEBHOOK_URL = 'https://n8n.srv1180872.hstgr.cloud/webhook/lead-sniper';
const ADS_VERIFICATION_URL = 'https://n8n.srv1180872.hstgr.cloud/webhook/verificar-ads';
const ANALISE_IA_URL = 'https://n8n.srv1180872.hstgr.cloud/webhook/analisar-lead';

// src/lib/lead-sniper/service-v3.ts
const WEBHOOK_URL_V3 = 'https://n8n.srv1180872.hstgr.cloud/webhook/lead-sniper/v3/ai';

// src/lib/diagnostico/service.ts
const DIAGNOSTICO_WEBHOOK_URL = 'https://n8n.srv1180872.hstgr.cloud/webhook/diagnostico';
```

---

## ✅ Recomendação

Para **novas pesquisas de leads**, usar o **Lead Sniper v3 AI** que:
1. Busca leads automaticamente
2. Já inclui icebreakers personalizados
3. Classifica leads por temperatura (HOT/WARM/COOL)
4. Inclui informações do site scrapeado

Para **análise de leads existentes**, usar:
- **Diagnóstico Profundo** → Para análise completa com estratégia
- **Verificar Ads** → Para verificação rápida de marketing digital

---

## 🗑️ Fluxos que podem ser descontinuados

1. `/webhook/lead-sniper` (v2) → Substituir por v3 AI
2. `/webhook/analisar-lead` → O diagnóstico profundo é mais completo

---

*Última atualização: Dezembro 2024*
