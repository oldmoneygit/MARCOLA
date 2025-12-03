# Plano: Criação de Cliente via Texto/Áudio com IA

## Visão Geral

Implementar uma nova forma de criar clientes usando **texto livre** ou **áudio** (via Whisper), onde a IA extrai automaticamente os dados estruturados do cliente.

### Fluxo do Usuário
1. Usuário escolhe entre "Formulário Tradicional" ou "Modo Inteligente"
2. No modo inteligente, pode:
   - Digitar/colar texto descrevendo o cliente
   - Gravar áudio pelo microfone (transcrição via Whisper)
   - Enviar arquivo de áudio
3. IA processa e extrai os dados estruturados
4. Usuário revisa e confirma/edita os dados antes de criar

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    ClientsPageContent                        │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │ Novo Cliente ▼  │  │  Toggle: Formulário | Inteligente │  │
│  └─────────────────┘  └──────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ClientFormStepper (existente)                        │   │
│  │  OU                                                   │   │
│  │  SmartClientCreator (novo)                            │   │
│  │  ├─ AudioRecorder (gravar/parar)                      │   │
│  │  ├─ Textarea (texto livre)                            │   │
│  │  ├─ ProcessButton → API /api/clients/parse            │   │
│  │  └─ PreviewCard (dados extraídos, editáveis)          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

API Flow:
[Áudio] → /api/transcribe (Whisper) → [Texto]
[Texto] → /api/clients/parse (OpenRouter) → [CreateClientDTO]
[CreateClientDTO] → /api/clients (existente) → [Cliente criado]
```

---

## Implementação

### 1. Tipos e Interfaces

**Arquivo:** `src/types/ai.ts` (adicionar)

```typescript
/** Resposta da extração de dados do cliente via IA */
export interface ParsedClientData {
  extracted: CreateClientDTO;
  confidence: number; // 0-1
  missing_fields: string[];
  suggestions: string[];
}

/** Status da transcrição de áudio */
export type TranscriptionStatus = 'idle' | 'recording' | 'transcribing' | 'done' | 'error';
```

### 2. API de Transcrição (Whisper)

**Arquivo:** `src/app/api/transcribe/route.ts`

- Recebe arquivo de áudio (webm/mp3/wav)
- Usa OpenAI Whisper API via OpenRouter ou diretamente
- Retorna texto transcrito

**Dependência:** Precisa adicionar `OPENAI_API_KEY` no .env para Whisper (ou usar OpenRouter se disponível)

### 3. API de Parsing com IA

**Arquivo:** `src/app/api/clients/parse/route.ts`

- Recebe texto livre
- Usa OpenRouter (GPT-4o-mini ou Claude) com prompt estruturado
- Extrai dados no formato `CreateClientDTO`
- Retorna dados + confidence + campos faltantes

**Prompt da IA:**
```
Você é um assistente que extrai dados de clientes a partir de texto livre.
Extraia as seguintes informações:
- name: Nome do cliente/empresa
- segment: Segmento (academia, restaurante, ecommerce, etc)
- monthly_value: Valor mensal do serviço
- due_day: Dia de vencimento
- contact_name: Nome do contato
- contact_phone: Telefone/WhatsApp
- contact_email: Email
- notes: Observações adicionais

Responda APENAS em JSON válido no formato especificado.
```

### 4. Componentes de UI

#### 4.1 SmartClientCreator
**Arquivo:** `src/components/clients/SmartClientCreator.tsx`

Modal/componente principal com:
- Tabs: "Digitar Texto" | "Gravar Áudio"
- Textarea para texto livre
- Botão de processar
- Preview dos dados extraídos
- Botões de confirmar/editar/cancelar

#### 4.2 AudioRecorder
**Arquivo:** `src/components/ui/AudioRecorder.tsx`

Componente de gravação de áudio:
- Usa MediaRecorder API (nativo do browser)
- Botão gravar/parar com animação de ondas
- Preview de tempo de gravação
- Opção de upload de arquivo de áudio

#### 4.3 ClientPreviewCard
**Arquivo:** `src/components/clients/ClientPreviewCard.tsx`

Card de preview dos dados extraídos:
- Mostra todos os campos extraídos
- Indica campos faltantes com destaque
- Campos inline-editáveis
- Score de confiança da extração

### 5. Atualização do ClientsPageContent

Adicionar toggle para escolher modo de criação:
- "Formulário Tradicional" → ClientFormStepper (atual)
- "Modo Inteligente" → SmartClientCreator (novo)

---

## Arquivos a Criar/Modificar

### Novos Arquivos:
1. `src/app/api/transcribe/route.ts` - API de transcrição Whisper
2. `src/app/api/clients/parse/route.ts` - API de parsing com IA
3. `src/components/clients/SmartClientCreator.tsx` - Componente principal
4. `src/components/ui/AudioRecorder.tsx` - Gravação de áudio
5. `src/components/clients/ClientPreviewCard.tsx` - Preview editável
6. `src/lib/openrouter/parseClient.ts` - Função de parsing

### Arquivos a Modificar:
1. `src/types/ai.ts` - Adicionar novos tipos
2. `src/components/clients/ClientsPageContent.tsx` - Toggle de modo
3. `.env.example` - Adicionar OPENAI_API_KEY (para Whisper)

---

## Ordem de Implementação

1. **Fase 1: Backend**
   - Criar tipos em `ai.ts`
   - Implementar `/api/clients/parse` (parsing com IA)
   - Implementar `/api/transcribe` (Whisper)

2. **Fase 2: Componentes UI**
   - Criar `AudioRecorder`
   - Criar `ClientPreviewCard`
   - Criar `SmartClientCreator`

3. **Fase 3: Integração**
   - Atualizar `ClientsPageContent` com toggle
   - Testar fluxo completo
   - Validações e tratamento de erros

4. **Fase 4: Polish**
   - Animações e feedback visual
   - Loading states
   - Tratamento de erros amigável

---

## Considerações Técnicas

### Whisper API
- **Opção 1:** OpenAI direta (precisa OPENAI_API_KEY)
- **Opção 2:** OpenRouter (se suportar Whisper)
- **Formatos:** webm, mp3, wav, m4a
- **Limite:** 25MB por arquivo

### Browser Support
- MediaRecorder: Chrome 49+, Firefox 25+, Safari 14.1+
- Precisa de HTTPS em produção (requisito de getUserMedia)

### Custos
- Whisper: ~$0.006/minuto
- GPT-4o-mini: ~$0.15/1M tokens (muito barato)
- Estimativa por cliente: < $0.01

---

## UX Esperada

1. **Tela inicial:**
   - Botão "Novo Cliente" abre modal com tabs
   - Tab "Formulário" (atual) | Tab "Inteligente" (novo)

2. **Modo Inteligente - Texto:**
   - Textarea grande com placeholder explicativo
   - Exemplo: "Cole aqui as informações do cliente..."
   - Botão "Processar com IA"

3. **Modo Inteligente - Áudio:**
   - Botão grande de microfone
   - Animação de ondas durante gravação
   - Timer mostrando duração
   - "Ou arraste um arquivo de áudio aqui"

4. **Preview/Confirmação:**
   - Card com dados extraídos
   - Campos editáveis inline
   - Indicador de confiança
   - Botões: "Criar Cliente" | "Editar no Formulário" | "Cancelar"

---

## Perguntas para o Usuário

1. **Whisper API:** Você tem uma chave da OpenAI para usar o Whisper, ou prefere que eu implemente usando outro serviço?

2. **Limite de áudio:** Qual o tempo máximo de gravação desejado? (Sugestão: 2 minutos)

3. **Prioridade:** Quer que eu implemente primeiro o texto livre (mais simples) e depois o áudio, ou ambos juntos?
