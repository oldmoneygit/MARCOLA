# WhatsApp Automation - Documentação e Sugestões

> Documentação completa da integração WhatsApp via Z-API e sugestões de automação com Pipedream

---

## 1. Visão Geral do Sistema

### 1.1 Arquitetura Implementada

```
┌─────────────────────────────────────────────────────────────────┐
│                        MARCOLA                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │    │   API Routes │    │   Supabase   │      │
│  │   (React)    │───▶│  (Next.js)   │───▶│  (Database)  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                    │               │
│         │                   ▼                    │               │
│         │           ┌──────────────┐             │               │
│         │           │    Z-API     │             │               │
│         │           │  (WhatsApp)  │             │               │
│         │           └──────────────┘             │               │
│         │                   │                    │               │
│         │                   ▼                    │               │
│         │           ┌──────────────┐             │               │
│         └──────────▶│   Webhook    │─────────────┘               │
│                     │   Receiver   │                             │
│                     └──────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Componentes Implementados

| Componente | Descrição | Arquivo |
|------------|-----------|---------|
| SendWhatsAppModal | Modal para envio de mensagens | `src/components/whatsapp/SendWhatsAppModal.tsx` |
| AudioRecorder | Gravador de áudio | `src/components/whatsapp/AudioRecorder.tsx` |
| WhatsApp Page | Gerenciamento de templates | `src/app/(dashboard)/whatsapp/page.tsx` |
| Z-API Service | Serviço de integração | `src/lib/whatsapp/zapi-service.ts` |

---

## 2. APIs Implementadas

### 2.1 Envio de Mensagens

#### POST `/api/whatsapp/send`
Envia mensagem de texto via WhatsApp.

```typescript
// Request
{
  phone: string;      // Ex: "5511999999999"
  message: string;    // Texto da mensagem
  clientId?: string;  // ID do cliente (opcional)
}

// Response
{
  success: boolean;
  messageId?: string;
  logId?: string;
  error?: string;
}
```

#### POST `/api/whatsapp/send-audio`
Envia áudio via WhatsApp.

```typescript
// Request
{
  phone: string;
  audioUrl: string;   // URL pública do áudio
  clientId?: string;
}

// Response
{
  success: boolean;
  messageId?: string;
  error?: string;
}
```

### 2.2 Templates

#### GET `/api/whatsapp/text-templates?userId={userId}`
Lista templates de texto do usuário.

#### POST `/api/whatsapp/text-templates`
Cria novo template de texto.

```typescript
{
  userId: string;
  name: string;
  description?: string;
  category: 'payment' | 'followup' | 'onboarding' | 'report' | 'custom';
  template: string;   // Ex: "Olá {nome}, sua fatura vence em {dias} dias"
  variables?: string[];
}
```

#### GET `/api/whatsapp/audio-templates?userId={userId}`
Lista templates de áudio do usuário.

### 2.3 Upload de Áudio

#### POST `/api/whatsapp/upload-audio`
Upload de áudio para Supabase Storage.

```typescript
// FormData
{
  userId: string;
  audio: Blob;
  mimeType: string;
  duration?: string;
  saveAsTemplate?: 'true' | 'false';
  templateName?: string;
  templateCategory?: string;
}

// Response
{
  success: boolean;
  audioUrl: string;
  audioPath: string;
  fileSize: number;
  duration: number;
}
```

### 2.4 Webhook

#### POST `/api/whatsapp/webhook`
Recebe eventos do Z-API (mensagens recebidas, status de entrega, etc).

```typescript
// Eventos suportados
type WebhookEventType =
  | 'Send'              // Mensagem enviada
  | 'Receive'           // Mensagem recebida
  | 'Connect'           // Conexão estabelecida
  | 'Disconnect'        // Desconectado
  | 'DeliveryCallback'; // Status de entrega
```

---

## 3. Banco de Dados

### 3.1 Tabelas WhatsApp

```sql
-- Configurações do usuário
whatsapp_settings (
  id, user_id, zapi_instance_id, zapi_token, zapi_client_token,
  is_connected, connected_phone, auto_payment_reminder,
  reminder_days_before, send_start_hour, send_end_hour
)

-- Log de mensagens
whatsapp_message_logs (
  id, user_id, client_id, phone, message, template_type,
  type, status, zapi_message_id, error, sent_at, delivered_at, read_at
)

-- Templates de texto
whatsapp_text_templates (
  id, user_id, name, description, category, template,
  variables, is_ai_generated, usage_count, is_favorite
)

-- Templates de áudio
whatsapp_audio_templates (
  id, user_id, name, category, audio_url, audio_path,
  duration_seconds, file_size_bytes, mime_type, usage_count
)

-- Preferências por cliente
whatsapp_client_preferences (
  id, user_id, client_id, default_text_template_id,
  default_audio_template_id, preferred_contact_time
)
```

---

## 4. Sugestões de Automação com Pipedream

### 4.1 Lembrete Automático de Pagamento

**Trigger:** Cron Schedule (diariamente às 9h)

```javascript
// Workflow: Lembrete de Pagamento Automático

// Step 1: Buscar pagamentos pendentes
export default defineComponent({
  async run({ steps, $ }) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const today = new Date();
    const reminderDate = new Date(today);
    reminderDate.setDate(today.getDate() + 3); // 3 dias antes

    const { data: payments } = await supabase
      .from('payments')
      .select(`
        *,
        client:clients(id, name, phone, contact_name)
      `)
      .eq('status', 'pending')
      .lte('due_date', reminderDate.toISOString().split('T')[0])
      .gte('due_date', today.toISOString().split('T')[0]);

    return payments;
  }
});

// Step 2: Enviar mensagem para cada cliente
export default defineComponent({
  async run({ steps, $ }) {
    const payments = steps.step1.$return_value;

    for (const payment of payments) {
      if (!payment.client?.phone) continue;

      const message = `Olá ${payment.client.contact_name || payment.client.name}! 👋

Passando para lembrar que sua fatura de R$ ${payment.amount.toFixed(2)} vence em ${getDaysUntil(payment.due_date)} dias.

Se já efetuou o pagamento, por favor desconsidere esta mensagem.

Qualquer dúvida, estamos à disposição! 🙏`;

      await $.http.post(`${process.env.MARCOLA_URL}/api/whatsapp/send`, {
        phone: payment.client.phone,
        message,
        clientId: payment.client.id
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.MARCOLA_API_KEY}`
        }
      });

      // Delay entre mensagens (evitar spam)
      await new Promise(r => setTimeout(r, 5000));
    }
  }
});
```

### 4.2 Notificação de Pagamento Atrasado

**Trigger:** Cron Schedule (diariamente às 10h)

```javascript
// Workflow: Cobrança de Pagamentos Atrasados

// Step 1: Buscar pagamentos atrasados
export default defineComponent({
  async run({ steps, $ }) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const today = new Date().toISOString().split('T')[0];

    const { data: overduePayments } = await supabase
      .from('payments')
      .select(`
        *,
        client:clients(id, name, phone, contact_name)
      `)
      .eq('status', 'pending')
      .lt('due_date', today)
      .is('reminder_sent_at', null); // Ainda não enviou lembrete

    return overduePayments;
  }
});

// Step 2: Enviar cobrança
export default defineComponent({
  async run({ steps, $ }) {
    const payments = steps.step1.$return_value;

    for (const payment of payments) {
      if (!payment.client?.phone) continue;

      const daysOverdue = getDaysOverdue(payment.due_date);

      const message = `Olá ${payment.client.contact_name || payment.client.name}!

Identificamos que sua fatura de R$ ${payment.amount.toFixed(2)} está em aberto há ${daysOverdue} dia(s).

📅 Vencimento: ${formatDate(payment.due_date)}
💰 Valor: R$ ${payment.amount.toFixed(2)}

Por favor, regularize o pagamento o quanto antes para evitar a suspensão dos serviços.

Se precisar de ajuda ou tiver alguma dúvida, estamos à disposição! 🤝`;

      await $.http.post(`${process.env.MARCOLA_URL}/api/whatsapp/send`, {
        phone: payment.client.phone,
        message,
        clientId: payment.client.id
      });

      // Marcar como lembrete enviado
      await supabase
        .from('payments')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', payment.id);

      await new Promise(r => setTimeout(r, 5000));
    }
  }
});
```

### 4.3 Relatório Semanal Automático

**Trigger:** Cron Schedule (segundas às 8h)

```javascript
// Workflow: Envio de Relatório Semanal

// Step 1: Gerar relatório
export default defineComponent({
  async run({ steps, $ }) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Buscar clientes ativos com relatórios
    const { data: clients } = await supabase
      .from('clients')
      .select(`
        *,
        reports(*)
      `)
      .eq('status', 'active')
      .not('phone', 'is', null);

    const results = [];

    for (const client of clients) {
      // Buscar último relatório
      const lastReport = client.reports
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (!lastReport) continue;

      results.push({
        client,
        report: lastReport,
        summary: generateWeeklySummary(lastReport)
      });
    }

    return results;
  }
});

// Step 2: Enviar relatórios
export default defineComponent({
  async run({ steps, $ }) {
    const data = steps.step1.$return_value;

    for (const { client, summary } of data) {
      const message = `📊 *Relatório Semanal - ${client.name}*

🎯 *Resumo da Semana:*
• Investimento: R$ ${summary.spend.toFixed(2)}
• Resultados: ${summary.results}
• Custo por Resultado: R$ ${summary.cpr.toFixed(2)}
• Alcance: ${summary.reach.toLocaleString()}

${summary.trend === 'up' ? '📈' : '📉'} Performance: ${summary.trendText}

${summary.suggestion}

Dúvidas? Responda esta mensagem! 💬`;

      await $.http.post(`${process.env.MARCOLA_URL}/api/whatsapp/send`, {
        phone: client.phone,
        message,
        clientId: client.id
      });

      await new Promise(r => setTimeout(r, 10000));
    }
  }
});
```

### 4.4 Resposta Automática a Mensagens

**Trigger:** Webhook (mensagem recebida)

```javascript
// Workflow: Auto-resposta Inteligente

// Step 1: Processar mensagem recebida
export default defineComponent({
  async run({ steps, $ }) {
    const { phone, text, type } = steps.trigger.event.body;

    // Ignorar se não for texto
    if (type !== 'ReceivedCallback' || !text) {
      return { skip: true };
    }

    // Buscar cliente
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', phone)
      .single();

    return {
      phone,
      text,
      client,
      keywords: extractKeywords(text.toLowerCase())
    };
  }
});

// Step 2: Gerar resposta
export default defineComponent({
  async run({ steps, $ }) {
    const { phone, text, client, keywords, skip } = steps.step1.$return_value;

    if (skip) return { skip: true };

    let response = null;

    // Detectar intenção
    if (keywords.includes('boleto') || keywords.includes('pagar') || keywords.includes('fatura')) {
      response = `Olá! 😊

Para consultar suas faturas e boletos, acesse:
🔗 ${process.env.PORTAL_URL}/faturas

Ou me informe qual fatura você precisa que envio o boleto aqui mesmo!`;
    }

    else if (keywords.includes('relatório') || keywords.includes('resultado')) {
      response = `Olá! 📊

Seu relatório mais recente está disponível em:
🔗 ${process.env.PORTAL_URL}/relatorios

Posso também enviar um resumo por aqui. Deseja?`;
    }

    else if (keywords.includes('ajuda') || keywords.includes('suporte')) {
      response = `Olá! 👋

Estou aqui para ajudar!

Como posso te auxiliar?
1️⃣ Faturas e pagamentos
2️⃣ Relatórios e resultados
3️⃣ Dúvidas sobre campanhas
4️⃣ Falar com um atendente

Responda com o número da opção desejada.`;
    }

    return { phone, response, client };
  }
});

// Step 3: Enviar resposta
export default defineComponent({
  async run({ steps, $ }) {
    const { phone, response, client, skip } = steps.step2.$return_value;

    if (skip || !response) return;

    await $.http.post(`${process.env.MARCOLA_URL}/api/whatsapp/send`, {
      phone,
      message: response,
      clientId: client?.id
    });
  }
});
```

### 4.5 Follow-up Pós-Reunião

**Trigger:** Webhook (quando tarefa de reunião é concluída)

```javascript
// Workflow: Follow-up Automático

export default defineComponent({
  async run({ steps, $ }) {
    const task = steps.trigger.event.body;

    // Verificar se é tarefa de reunião
    if (!task.title.toLowerCase().includes('reunião')) return;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Buscar cliente
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', task.client_id)
      .single();

    if (!client?.phone) return;

    // Aguardar 2 horas após a reunião
    await new Promise(r => setTimeout(r, 2 * 60 * 60 * 1000));

    const message = `Olá ${client.contact_name || client.name}! 👋

Muito obrigado pela reunião de hoje! Foi ótimo conversarmos.

📝 *Próximos passos:*
${task.notes || '• Aguardando definição'}

Se tiver qualquer dúvida ou precisar de algo, é só me chamar!

Até breve! 🚀`;

    await $.http.post(`${process.env.MARCOLA_URL}/api/whatsapp/send`, {
      phone: client.phone,
      message,
      clientId: client.id
    });
  }
});
```

### 4.6 Alerta de Queda de Performance

**Trigger:** Cron Schedule (diariamente às 11h)

```javascript
// Workflow: Alerta de Performance

export default defineComponent({
  async run({ steps, $ }) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Buscar relatórios dos últimos 7 dias
    const { data: reports } = await supabase
      .from('reports')
      .select(`
        *,
        client:clients(id, name, phone, contact_name)
      `)
      .gte('date', getDateDaysAgo(7));

    // Agrupar por cliente
    const clientReports = groupBy(reports, 'client_id');

    for (const [clientId, clientData] of Object.entries(clientReports)) {
      const sorted = clientData.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (sorted.length < 2) continue;

      const latest = sorted[0];
      const previous = sorted[1];

      // Verificar queda > 30%
      const cprChange = ((latest.cpr - previous.cpr) / previous.cpr) * 100;

      if (cprChange > 30) {
        const client = latest.client;

        const message = `⚠️ *Alerta de Performance - ${client.name}*

Identificamos uma variação significativa nos resultados:

📈 CPR anterior: R$ ${previous.cpr.toFixed(2)}
📉 CPR atual: R$ ${latest.cpr.toFixed(2)}
🔺 Variação: +${cprChange.toFixed(1)}%

Nossa equipe já está analisando e em breve entraremos em contato com recomendações.

Fique tranquilo, estamos cuidando disso! 🔧`;

        await $.http.post(`${process.env.MARCOLA_URL}/api/whatsapp/send`, {
          phone: client.phone,
          message,
          clientId: client.id
        });
      }
    }
  }
});
```

---

## 5. Configuração do Pipedream

### 5.1 Variáveis de Ambiente Necessárias

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# MARCOLA API
MARCOLA_URL=https://seu-dominio.com
MARCOLA_API_KEY=sua-api-key

# Z-API (opcional - para chamadas diretas)
ZAPI_INSTANCE_ID=xxx
ZAPI_TOKEN=xxx
ZAPI_CLIENT_TOKEN=xxx

# Portal do Cliente (opcional)
PORTAL_URL=https://portal.seu-dominio.com
```

### 5.2 Criando um Workflow

1. Acesse [pipedream.com](https://pipedream.com)
2. Crie um novo Workflow
3. Escolha o Trigger (Cron, Webhook, etc)
4. Adicione os Steps com o código Node.js
5. Configure as variáveis de ambiente
6. Ative o Workflow

### 5.3 Webhook para Receber Eventos

Configure no Pipedream:
1. Crie um novo Workflow com trigger "HTTP / Webhook"
2. Copie a URL gerada
3. Configure no Z-API como webhook de recebimento
4. Adicione os steps de processamento

---

## 6. Boas Práticas

### 6.1 Rate Limiting
- Máximo 1 mensagem a cada 5 segundos por número
- Máximo 200 mensagens por dia por número
- Respeitar horário comercial (8h às 20h)

### 6.2 Opt-out
- Sempre incluir opção de descadastro
- Respeitar solicitações de "PARAR" ou "SAIR"
- Manter lista de números bloqueados

### 6.3 Conteúdo
- Mensagens claras e objetivas
- Identificar-se sempre
- Evitar spam e mensagens repetitivas
- Personalizar com nome do cliente

### 6.4 Monitoramento
- Verificar taxa de entrega
- Monitorar bloqueios
- Analisar respostas recebidas
- Ajustar horários baseado em métricas

---

## 7. Roadmap de Melhorias

### 7.1 Curto Prazo
- [ ] Implementar fila de mensagens (evitar rate limit)
- [ ] Dashboard de métricas de envio
- [ ] Templates com aprovação prévia
- [ ] Agendamento de mensagens

### 7.2 Médio Prazo
- [ ] Chatbot com IA (GPT)
- [ ] Integração com CRM externo
- [ ] Campanhas de marketing
- [ ] A/B testing de mensagens

### 7.3 Longo Prazo
- [ ] WhatsApp Business API oficial
- [ ] Múltiplos números de envio
- [ ] Atendimento humano integrado
- [ ] Analytics avançado

---

## 8. Troubleshooting

### Problema: Mensagem não enviada
1. Verificar se número está no formato correto (5511999999999)
2. Verificar se Z-API está conectado
3. Verificar logs em `/api/whatsapp/send`
4. Verificar saldo Z-API

### Problema: Áudio não reproduz
1. Verificar se URL é pública
2. Verificar formato do áudio (webm, mp3, ogg)
3. Verificar tamanho (máx 16MB)
4. Verificar CORS do Supabase Storage

### Problema: Webhook não recebe eventos
1. Verificar URL configurada no Z-API
2. Verificar se endpoint está público
3. Verificar logs do Pipedream/servidor
4. Testar com ferramenta como webhook.site

---

*Documentação gerada em: Dezembro 2024*
*Versão: 1.0.0*
