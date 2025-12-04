# 🚀 PROMPT: Implementar Integração Z-API (WhatsApp)

> **IMPORTANTE**: Leia este documento INTEIRO antes de começar. Não pule nenhuma seção.
> **DOCUMENTAÇÃO OFICIAL**: https://developer.z-api.io/en/

---

## 📋 CONTEXTO

O MARCOLA precisa enviar mensagens WhatsApp automatizadas para:
- Lembretes de pagamento
- Notificações de tarefas concluídas
- Follow-up com clientes
- Alertas importantes

Vamos usar a **Z-API** que é uma API REST simples que conecta via QR Code (sem precisar aprovação do Meta).

### Arquitetura Multi-tenant (Futura)

No futuro, cada usuário do MARCOLA poderá conectar sua própria conta Z-API:
1. Usuário cria conta no Z-API (z-api.io)
2. Conecta WhatsApp via QR Code no painel Z-API
3. Cola Instance ID + Token no MARCOLA
4. MARCOLA salva credenciais criptografadas por usuário

**FASE 1 (Agora):** Usar credenciais fixas para testar
**FASE 2 (Depois):** UI para cada usuário inserir suas credenciais

---

## 🔑 CREDENCIAIS PARA TESTE (Fase 1)

```env
# Adicionar no .env.local
ZAPI_INSTANCE_ID=3EB3592FA75F61F63FA4D2A2D3856553
ZAPI_TOKEN=CC6EE367274AA41BB818B649
ZAPI_BASE_URL=https://api.z-api.io/instances/3EB3592FA75F61F63FA4D2A2D3856553/token/CC6EE367274AA41BB818B649
```

---

## 📚 REFERÊNCIA DA API Z-API

### Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/send-text` | Enviar mensagem de texto |
| POST | `/send-image` | Enviar imagem |
| POST | `/send-document/{extension}` | Enviar documento |
| GET | `/status` | Status da instância (connected, error) |
| GET | `/qr-code` | QR Code em bytes |
| GET | `/qr-code/image` | QR Code em base64 |

### Headers Obrigatórios

```
Content-Type: application/json
```

### Header Opcional (Se ativado na conta)

```
Client-Token: {ACCOUNT_SECURITY_TOKEN}
```

### Parâmetros do /send-text

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| phone | string | ✅ | Número DDI+DDD+Número (ex: 551199999999) |
| message | string | ✅ | Texto da mensagem |
| delayMessage | number | ❌ | Delay 1-15 segundos entre mensagens |
| delayTyping | number | ❌ | Tempo em "Digitando..." (1-15 segundos) |

### Resposta do /send-text

```json
{
  "zaapId": "3999984263738042930CD6ECDE9VDWSA",
  "messageId": "D241XXXX732339502B68",
  "id": "D241XXXX732339502B68"
}
```

### Resposta do /status

```json
{
  "connected": true,
  "smartphoneConnected": true,
  "error": null
}
```

### Webhooks Disponíveis

| Webhook | Descrição |
|---------|-----------|
| delivery | Mensagem entregue ao WhatsApp |
| receive | Mensagem recebida |
| message-status | Mudança de status (RECEIVED, READ, DELETED) |
| connected | WhatsApp conectou |
| disconnected | WhatsApp desconectou |

---

## 🔍 FASE 0: ANÁLISE (OBRIGATÓRIO)

Antes de implementar, verificar:

### 0.1 Estrutura atual

```bash
# Verificar se já existe algo de WhatsApp
grep -r "whatsapp" src/ --include="*.ts" --include="*.tsx"
grep -r "zapi" src/ --include="*.ts" --include="*.tsx"

# Verificar estrutura de clientes (tem campo phone?)
grep -r "phone" src/types/client.ts
```

### 0.2 Testar API da Z-API

```bash
# Testar envio de mensagem (substitua o número)
curl -X POST "https://api.z-api.io/instances/3EB3592FA75F61F63FA4D2A2D3856553/token/CC6EE367274AA41BB818B649/send-text" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "message": "Teste de integração MARCOLA 🚀"
  }'
```

**Resposta esperada:**
```json
{
  "zapiId": "...",
  "messageId": "...",
  "id": "..."
}
```

---

## 📁 FASE 1: SERVIÇO DE WHATSAPP

### 1.1 Criar tipos

Arquivo: `src/types/whatsapp.ts`

```typescript
// ═══════════════════════════════════════════════════════════════
// TIPOS - Z-API WhatsApp
// ═══════════════════════════════════════════════════════════════

export interface ZAPIConfig {
  instanceId: string;
  token: string;
  baseUrl: string;
}

export interface SendTextParams {
  phone: string;
  message: string;
}

export interface SendTextResponse {
  zapiId: string;
  messageId: string;
  id: string;
}

export interface SendButtonsParams {
  phone: string;
  message: string;
  buttons: Array<{
    id: string;
    label: string;
  }>;
}

export interface SendImageParams {
  phone: string;
  image: string; // URL da imagem
  caption?: string;
}

export interface SendDocumentParams {
  phone: string;
  document: string; // URL do documento
  fileName?: string;
}

export interface WebhookEvent {
  type: 'Send' | 'Receive' | 'Connect' | 'Disconnect' | 'Present';
  phone?: string;
  messageId?: string;
  text?: string;
  timestamp?: number;
  status?: string;
}

export interface MessageLog {
  id: string;
  client_id?: string;
  phone: string;
  message: string;
  type: 'sent' | 'received';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  zapi_message_id?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

// Templates de mensagem
export type MessageTemplateType = 
  | 'payment_reminder'
  | 'payment_overdue'
  | 'task_completed'
  | 'task_assigned'
  | 'report_ready'
  | 'custom';

export interface MessageTemplate {
  type: MessageTemplateType;
  title: string;
  template: string; // Com placeholders: {nome}, {valor}, {data}, etc.
}
```

### 1.2 Criar serviço Z-API

Arquivo: `src/lib/whatsapp/zapi-service.ts`

```typescript
// ═══════════════════════════════════════════════════════════════
// SERVIÇO Z-API - WhatsApp
// ═══════════════════════════════════════════════════════════════

import {
  ZAPIConfig,
  SendTextParams,
  SendTextResponse,
  SendButtonsParams,
  SendImageParams,
  SendDocumentParams,
} from '@/types/whatsapp';

class ZAPIService {
  private config: ZAPIConfig;

  constructor() {
    this.config = {
      instanceId: process.env.ZAPI_INSTANCE_ID || '',
      token: process.env.ZAPI_TOKEN || '',
      baseUrl: process.env.ZAPI_BASE_URL || '',
    };

    if (!this.config.instanceId || !this.config.token) {
      console.warn('⚠️ Z-API não configurada. Verifique as variáveis de ambiente.');
    }
  }

  private getUrl(endpoint: string): string {
    return `${this.config.baseUrl}/${endpoint}`;
  }

  private formatPhone(phone: string): string {
    // Remove tudo que não é número
    let cleaned = phone.replace(/\D/g, '');
    
    // Se começar com 0, remove
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Se não tiver código do país, adiciona 55 (Brasil)
    if (cleaned.length <= 11) {
      cleaned = '55' + cleaned;
    }
    
    return cleaned;
  }

  async sendText(params: SendTextParams): Promise<SendTextResponse> {
    const url = this.getUrl('send-text');
    const phone = this.formatPhone(params.phone);

    console.log(`📱 Enviando mensagem para ${phone}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        message: params.message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro Z-API:', error);
      throw new Error(`Erro ao enviar mensagem: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Mensagem enviada:', data.messageId);
    return data;
  }

  async sendButtons(params: SendButtonsParams): Promise<SendTextResponse> {
    const url = this.getUrl('send-button-list');
    const phone = this.formatPhone(params.phone);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        message: params.message,
        buttonList: {
          buttons: params.buttons.map(btn => ({
            id: btn.id,
            label: btn.label,
          })),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao enviar botões: ${error}`);
    }

    return response.json();
  }

  async sendImage(params: SendImageParams): Promise<SendTextResponse> {
    const url = this.getUrl('send-image');
    const phone = this.formatPhone(params.phone);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        image: params.image,
        caption: params.caption || '',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao enviar imagem: ${error}`);
    }

    return response.json();
  }

  async sendDocument(params: SendDocumentParams): Promise<SendTextResponse> {
    const url = this.getUrl('send-document');
    const phone = this.formatPhone(params.phone);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        document: params.document,
        fileName: params.fileName || 'documento.pdf',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao enviar documento: ${error}`);
    }

    return response.json();
  }

  async getStatus(): Promise<{ connected: boolean; smartphoneConnected: boolean; error: string | null }> {
    const url = this.getUrl('status');

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });
      const data = await response.json();
      return {
        connected: data.connected || false,
        smartphoneConnected: data.smartphoneConnected || false,
        error: data.error || null,
      };
    } catch (error) {
      return { connected: false, smartphoneConnected: false, error: 'Erro ao verificar status' };
    }
  }

  async getQRCode(): Promise<{ value: string; base64?: string } | null> {
    // Primeiro tenta pegar o QR code em base64 (mais fácil de renderizar)
    const urlImage = this.getUrl('qr-code/image');

    try {
      const response = await fetch(urlImage, {
        headers: this.getHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return null;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Client-Token é opcional - só adiciona se configurado
    const clientToken = process.env.ZAPI_CLIENT_TOKEN;
    if (clientToken) {
      headers['Client-Token'] = clientToken;
    }
    
    return headers;
  }
}

// Exporta instância única (singleton)
export const zapiService = new ZAPIService();
```

### 1.3 Criar templates de mensagem

Arquivo: `src/lib/whatsapp/message-templates.ts`

```typescript
// ═══════════════════════════════════════════════════════════════
// TEMPLATES DE MENSAGEM - WhatsApp
// ═══════════════════════════════════════════════════════════════

import { MessageTemplate, MessageTemplateType } from '@/types/whatsapp';

export const MESSAGE_TEMPLATES: Record<MessageTemplateType, MessageTemplate> = {
  payment_reminder: {
    type: 'payment_reminder',
    title: 'Lembrete de Pagamento',
    template: `💰 *Lembrete de Pagamento*

Olá {nome}! 👋

Este é um lembrete amigável sobre o pagamento da gestão de tráfego.

📅 *Vencimento:* {data_vencimento}
💵 *Valor:* R$ {valor}

Se já realizou o pagamento, por favor desconsidere esta mensagem.

Qualquer dúvida, estou à disposição! 🚀

---
_MARCOLA Gestor de Tráfegos_`,
  },

  payment_overdue: {
    type: 'payment_overdue',
    title: 'Pagamento em Atraso',
    template: `⚠️ *Pagamento em Atraso*

Olá {nome}!

Identificamos que o pagamento referente à gestão de tráfego está em atraso.

📅 *Vencimento:* {data_vencimento}
💵 *Valor:* R$ {valor}
⏰ *Dias em atraso:* {dias_atraso}

Por favor, regularize o quanto antes para evitar a suspensão dos serviços.

Precisa de ajuda? Me chama! 💬

---
_MARCOLA Gestor de Tráfegos_`,
  },

  task_completed: {
    type: 'task_completed',
    title: 'Tarefa Concluída',
    template: `✅ *Tarefa Concluída!*

Olá {nome}! 👋

Acabei de finalizar uma tarefa importante:

📋 *Tarefa:* {tarefa}
📅 *Concluída em:* {data_conclusao}

{observacao}

Qualquer dúvida, estou à disposição! 🚀

---
_MARCOLA Gestor de Tráfegos_`,
  },

  task_assigned: {
    type: 'task_assigned',
    title: 'Nova Tarefa Atribuída',
    template: `🔔 *Nova Tarefa Atribuída*

Olá {nome}!

Você tem uma nova tarefa:

📋 *Tarefa:* {tarefa}
🏢 *Cliente:* {cliente}
📅 *Prazo:* {prazo}
⚡ *Prioridade:* {prioridade}

Acesse a plataforma para mais detalhes.

---
_MARCOLA Gestor de Tráfegos_`,
  },

  report_ready: {
    type: 'report_ready',
    title: 'Relatório Disponível',
    template: `📊 *Relatório Pronto!*

Olá {nome}! 👋

O relatório de performance está disponível:

📅 *Período:* {periodo}
📈 *Principais métricas:*
• Investimento: R$ {investimento}
• Resultados: {resultados}
• CPA: R$ {cpa}

{observacao}

Quer agendar uma call para discutir os resultados? 📞

---
_MARCOLA Gestor de Tráfegos_`,
  },

  custom: {
    type: 'custom',
    title: 'Mensagem Personalizada',
    template: `{mensagem}`,
  },
};

// Função para processar template com variáveis
export function processTemplate(
  templateType: MessageTemplateType,
  variables: Record<string, string>
): string {
  const template = MESSAGE_TEMPLATES[templateType];
  let message = template.template;

  // Substitui todas as variáveis
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    message = message.replace(regex, value);
  });

  // Remove variáveis não substituídas
  message = message.replace(/{[^}]+}/g, '');

  return message.trim();
}

// Função para listar templates disponíveis
export function getAvailableTemplates(): MessageTemplate[] {
  return Object.values(MESSAGE_TEMPLATES);
}
```

### 1.4 Criar index de exports

Arquivo: `src/lib/whatsapp/index.ts`

```typescript
export * from './zapi-service';
export * from './message-templates';
```

---

## 🗄️ FASE 2: BANCO DE DADOS

### 2.1 Criar tabela de logs de mensagens

```sql
-- ═══════════════════════════════════════════════════════════════
-- TABELA: message_logs
-- Histórico de mensagens WhatsApp enviadas/recebidas
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Dados da mensagem
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  template_type TEXT, -- payment_reminder, task_completed, etc.
  
  -- Tipo e status
  type TEXT NOT NULL CHECK (type IN ('sent', 'received')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  
  -- Referência Z-API
  zapi_message_id TEXT,
  
  -- Erro (se houver)
  error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_message_logs_user ON message_logs(user_id);
CREATE INDEX idx_message_logs_client ON message_logs(client_id);
CREATE INDEX idx_message_logs_phone ON message_logs(phone);
CREATE INDEX idx_message_logs_status ON message_logs(status);
CREATE INDEX idx_message_logs_created ON message_logs(created_at DESC);

-- RLS
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own message logs"
ON message_logs FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_message_logs_updated_at
  BEFORE UPDATE ON message_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 Criar tabela de configurações de WhatsApp

```sql
-- ═══════════════════════════════════════════════════════════════
-- TABELA: whatsapp_settings
-- Configurações de WhatsApp por usuário
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Status da conexão
  is_connected BOOLEAN DEFAULT false,
  connected_phone TEXT,
  connected_at TIMESTAMPTZ,
  
  -- Configurações de notificação automática
  auto_payment_reminder BOOLEAN DEFAULT true,
  reminder_days_before INTEGER DEFAULT 3, -- Dias antes do vencimento
  auto_overdue_notification BOOLEAN DEFAULT true,
  auto_task_notification BOOLEAN DEFAULT false,
  
  -- Horário permitido para envio (evitar mensagens de madrugada)
  send_start_hour INTEGER DEFAULT 8, -- 08:00
  send_end_hour INTEGER DEFAULT 20, -- 20:00
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own whatsapp settings"
ON whatsapp_settings FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

---

## 🔌 FASE 3: API ROUTES

### 3.1 Enviar mensagem

Arquivo: `src/app/api/whatsapp/send/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { zapiService } from '@/lib/whatsapp';
import { processTemplate } from '@/lib/whatsapp/message-templates';
import { MessageTemplateType } from '@/types/whatsapp';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      phone, 
      message, 
      templateType, 
      variables, 
      clientId 
    } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 });
    }

    // Processar mensagem (template ou custom)
    let finalMessage = message;
    if (templateType && templateType !== 'custom') {
      finalMessage = processTemplate(templateType as MessageTemplateType, variables || {});
    }

    if (!finalMessage) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    // Criar log antes de enviar
    const { data: log, error: logError } = await supabase
      .from('message_logs')
      .insert({
        user_id: user.id,
        client_id: clientId || null,
        phone,
        message: finalMessage,
        template_type: templateType || null,
        type: 'sent',
        status: 'pending',
      })
      .select()
      .single();

    if (logError) {
      console.error('Erro ao criar log:', logError);
    }

    // Enviar via Z-API
    try {
      const result = await zapiService.sendText({
        phone,
        message: finalMessage,
      });

      // Atualizar log com sucesso
      if (log) {
        await supabase
          .from('message_logs')
          .update({
            status: 'sent',
            zapi_message_id: result.messageId,
            sent_at: new Date().toISOString(),
          })
          .eq('id', log.id);
      }

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        logId: log?.id,
      });
    } catch (sendError: any) {
      // Atualizar log com erro
      if (log) {
        await supabase
          .from('message_logs')
          .update({
            status: 'failed',
            error: sendError.message,
          })
          .eq('id', log.id);
      }

      throw sendError;
    }
  } catch (error: any) {
    console.error('Erro ao enviar WhatsApp:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar mensagem' },
      { status: 500 }
    );
  }
}
```

### 3.2 Webhook para receber eventos

Arquivo: `src/app/api/whatsapp/webhook/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { WebhookEvent } from '@/types/whatsapp';

// Cliente Supabase com service role para webhooks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const event: WebhookEvent = await request.json();
    
    console.log('📩 Webhook Z-API:', event.type, event);

    switch (event.type) {
      case 'Send':
        // Mensagem enviada com sucesso
        if (event.messageId) {
          await supabase
            .from('message_logs')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString() 
            })
            .eq('zapi_message_id', event.messageId);
        }
        break;

      case 'Receive':
        // Mensagem recebida
        console.log('📨 Mensagem recebida de:', event.phone);
        // TODO: Implementar lógica de respostas automáticas se necessário
        break;

      case 'Connect':
        // WhatsApp conectado
        console.log('✅ WhatsApp conectado');
        // TODO: Atualizar status na tabela whatsapp_settings
        break;

      case 'Disconnect':
        // WhatsApp desconectado
        console.log('❌ WhatsApp desconectado');
        // TODO: Atualizar status e notificar usuário
        break;

      case 'Present':
        // Presença no chat
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// Aceitar GET para verificação do webhook
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'z-api-webhook' });
}
```

### 3.3 Status da conexão

Arquivo: `src/app/api/whatsapp/status/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { zapiService } from '@/lib/whatsapp';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar status na Z-API
    const status = await zapiService.getStatus();

    // Buscar configurações do usuário
    const { data: settings } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      connected: status.connected,
      phone: status.phone,
      settings: settings || null,
    });
  } catch (error: any) {
    console.error('Erro ao verificar status:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar status' },
      { status: 500 }
    );
  }
}
```

### 3.4 Histórico de mensagens

Arquivo: `src/app/api/whatsapp/history/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('message_logs')
      .select(`
        *,
        client:clients(id, name, business_name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar histórico' },
      { status: 500 }
    );
  }
}
```

### 3.5 Templates disponíveis

Arquivo: `src/app/api/whatsapp/templates/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getAvailableTemplates } from '@/lib/whatsapp/message-templates';

export async function GET() {
  const templates = getAvailableTemplates();
  return NextResponse.json(templates);
}
```

---

## 🎨 FASE 4: COMPONENTES DE UI

### 4.1 Hook useWhatsApp

Arquivo: `src/hooks/useWhatsApp.ts`

```typescript
'use client';

import { useState, useCallback } from 'react';
import { MessageTemplateType, MessageLog, MessageTemplate } from '@/types/whatsapp';

interface SendMessageParams {
  phone: string;
  message?: string;
  templateType?: MessageTemplateType;
  variables?: Record<string, string>;
  clientId?: string;
}

interface WhatsAppStatus {
  connected: boolean;
  phone?: string;
}

export function useWhatsApp() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (params: SendMessageParams) => {
    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setSending(false);
    }
  }, []);

  const getStatus = useCallback(async (): Promise<WhatsAppStatus> => {
    const response = await fetch('/api/whatsapp/status');
    const data = await response.json();
    return data;
  }, []);

  const getHistory = useCallback(async (clientId?: string): Promise<MessageLog[]> => {
    const url = clientId 
      ? `/api/whatsapp/history?clientId=${clientId}`
      : '/api/whatsapp/history';
    
    const response = await fetch(url);
    const data = await response.json();
    return data;
  }, []);

  const getTemplates = useCallback(async (): Promise<MessageTemplate[]> => {
    const response = await fetch('/api/whatsapp/templates');
    const data = await response.json();
    return data;
  }, []);

  return {
    sendMessage,
    getStatus,
    getHistory,
    getTemplates,
    sending,
    error,
  };
}
```

### 4.2 Modal de envio de WhatsApp

Arquivo: `src/components/whatsapp/SendWhatsAppModal.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { MessageTemplate, MessageTemplateType } from '@/types/whatsapp';
import { processTemplate } from '@/lib/whatsapp/message-templates';
import { 
  X, 
  Send, 
  MessageSquare, 
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface SendWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  defaultTemplate?: MessageTemplateType;
  defaultVariables?: Record<string, string>;
}

export function SendWhatsAppModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientPhone,
  defaultTemplate,
  defaultVariables = {},
}: SendWhatsAppModalProps) {
  const { sendMessage, getTemplates, sending, error } = useWhatsApp();
  
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplateType>(defaultTemplate || 'custom');
  const [phone, setPhone] = useState(clientPhone || '');
  const [message, setMessage] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>(defaultVariables);
  const [success, setSuccess] = useState(false);

  // Carregar templates
  useEffect(() => {
    getTemplates().then(setTemplates);
  }, [getTemplates]);

  // Atualizar preview quando template ou variáveis mudam
  useEffect(() => {
    if (selectedTemplate && selectedTemplate !== 'custom') {
      const preview = processTemplate(selectedTemplate, {
        nome: clientName || variables.nome || '[Nome]',
        ...variables,
      });
      setMessage(preview);
    }
  }, [selectedTemplate, variables, clientName]);

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setPhone(clientPhone || '');
      setSelectedTemplate(defaultTemplate || 'custom');
      setVariables({ nome: clientName || '', ...defaultVariables });
      setSuccess(false);
    }
  }, [isOpen, clientPhone, clientName, defaultTemplate, defaultVariables]);

  const handleSend = async () => {
    try {
      await sendMessage({
        phone,
        message: selectedTemplate === 'custom' ? message : undefined,
        templateType: selectedTemplate,
        variables: { nome: clientName || '', ...variables },
        clientId,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      // Erro já tratado pelo hook
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <GlassCard className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Enviar WhatsApp</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Sucesso */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/20 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span>Mensagem enviada com sucesso!</span>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11999999999"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Digite apenas números (DDD + número)
            </p>
          </div>

          {/* Seletor de Template */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as MessageTemplateType)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
            >
              {templates.map((template) => (
                <option key={template.type} value={template.type}>
                  {template.title}
                </option>
              ))}
            </select>
          </div>

          {/* Variáveis do Template */}
          {selectedTemplate === 'payment_reminder' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Data Vencimento</label>
                <input
                  type="text"
                  value={variables.data_vencimento || ''}
                  onChange={(e) => setVariables({ ...variables, data_vencimento: e.target.value })}
                  placeholder="10/01/2025"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Valor</label>
                <input
                  type="text"
                  value={variables.valor || ''}
                  onChange={(e) => setVariables({ ...variables, valor: e.target.value })}
                  placeholder="1.500,00"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                />
              </div>
            </div>
          )}

          {selectedTemplate === 'task_completed' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Tarefa</label>
                <input
                  type="text"
                  value={variables.tarefa || ''}
                  onChange={(e) => setVariables({ ...variables, tarefa: e.target.value })}
                  placeholder="Criar novos criativos"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Observação (opcional)</label>
                <input
                  type="text"
                  value={variables.observacao || ''}
                  onChange={(e) => setVariables({ ...variables, observacao: e.target.value })}
                  placeholder="Os criativos estão no Drive"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                />
              </div>
            </div>
          )}

          {/* Mensagem / Preview */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              {selectedTemplate === 'custom' ? 'Mensagem' : 'Preview'}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              readOnly={selectedTemplate !== 'custom'}
              className={`w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none font-mono text-sm ${
                selectedTemplate !== 'custom' ? 'opacity-70' : ''
              }`}
              placeholder="Digite sua mensagem..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 text-zinc-300 hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !phone || !message || success}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
```

### 4.3 Botão de WhatsApp no ClientCard

Adicionar no `src/components/clients/ClientCard.tsx`:

```typescript
// Importar no topo
import { SendWhatsAppModal } from '@/components/whatsapp/SendWhatsAppModal';
import { MessageSquare } from 'lucide-react';

// Dentro do componente, adicionar state
const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

// Adicionar botão na área de ações do card
<button
  onClick={() => setShowWhatsAppModal(true)}
  className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
  title="Enviar WhatsApp"
>
  <MessageSquare className="w-4 h-4" />
</button>

// Adicionar modal no final do componente
<SendWhatsAppModal
  isOpen={showWhatsAppModal}
  onClose={() => setShowWhatsAppModal(false)}
  clientId={client.id}
  clientName={client.name}
  clientPhone={client.phone || client.owner_phone}
/>
```

### 4.4 Index de exports

Arquivo: `src/components/whatsapp/index.ts`

```typescript
export * from './SendWhatsAppModal';
```

---

## 🧪 FASE 5: TESTES

### 5.1 Adicionar variáveis de ambiente

```bash
# .env.local
ZAPI_INSTANCE_ID=3EB3592FA75F61F63FA4D2A2D3856553
ZAPI_TOKEN=CC6EE367274AA41BB818B649
ZAPI_BASE_URL=https://api.z-api.io/instances/3EB3592FA75F61F63FA4D2A2D3856553/token/CC6EE367274AA41BB818B649
```

### 5.2 Executar migrations no Supabase

1. Abrir Supabase Dashboard
2. SQL Editor
3. Executar as queries da FASE 2

### 5.3 Testar localmente

```bash
npm run dev
```

1. Abrir um cliente
2. Clicar no botão de WhatsApp (ícone verde)
3. Selecionar um template
4. Preencher o telefone
5. Enviar

### 5.4 Verificar logs

```sql
SELECT * FROM message_logs ORDER BY created_at DESC LIMIT 10;
```

### 5.5 Build

```bash
npm run build
```

Não pode dar erro!

---

## ✅ FASE 6: CONFIRMAÇÃO

Após implementar, responda:

```
## ✅ INTEGRAÇÃO Z-API CONCLUÍDA

### Banco de Dados
- [ ] Tabela message_logs criada
- [ ] Tabela whatsapp_settings criada
- [ ] RLS policies aplicadas

### Serviço
- [ ] ZAPIService implementado
- [ ] Templates de mensagem criados

### API Routes
- [ ] POST /api/whatsapp/send funcionando
- [ ] POST /api/whatsapp/webhook funcionando
- [ ] GET /api/whatsapp/status funcionando
- [ ] GET /api/whatsapp/history funcionando
- [ ] GET /api/whatsapp/templates funcionando

### Front-end
- [ ] Hook useWhatsApp criado
- [ ] SendWhatsAppModal criado
- [ ] Botão de WhatsApp no ClientCard
- [ ] Modal abre e fecha corretamente

### Testes
- [ ] Envio de mensagem funcionando
- [ ] Log salvo no banco
- [ ] npm run build sem erros

### Screenshots
[Anexar screenshots do modal e mensagem enviada]
```

---

## 🚨 REGRAS CRÍTICAS

1. **NUNCA commitar credenciais** - Use .env.local
2. **SEMPRE testar localmente** antes de reportar
3. **SEMPRE verificar build** - npm run build sem erros
4. **Formatar telefone corretamente** - Só números, com 55 na frente

---

## 📝 PRÓXIMOS PASSOS (após implementação)

1. **Automação de lembretes** - Cron job para enviar lembretes de pagamento
2. **Página de configurações** - UI para configurar automações
3. **Histórico de mensagens** - Página dedicada para ver todas mensagens

---

## 🔄 FASE 7: MULTI-TENANT (Cada usuário com sua conexão Z-API)

> **IMPORTANTE**: Esta fase permite que cada usuário do MARCOLA conecte sua própria conta Z-API.
> Implementar DEPOIS que a Fase 1-6 estiver funcionando!

### 7.1 Conceito

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO MULTI-TENANT                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1. Usuário acessa Configurações > WhatsApp no MARCOLA                    │
│   2. Vê instruções para criar conta no Z-API (z-api.io)                    │
│   3. Usuário cria conta e conecta WhatsApp via QR Code no painel Z-API     │
│   4. Usuário copia Instance ID + Token do painel Z-API                     │
│   5. Cola as credenciais no MARCOLA                                         │
│   6. MARCOLA valida conexão (GET /status)                                   │
│   7. MARCOLA salva credenciais CRIPTOGRAFADAS no banco                      │
│   8. Usuário pode enviar mensagens via sua própria conta                   │
│                                                                             │
│   Benefícios:                                                               │
│   ├── Sem necessidade de parceria com Z-API                                │
│   ├── Cada usuário gerencia sua própria assinatura (~R$60/mês)             │
│   ├── Implementação simples                                                 │
│   ├── Mais seguro (cada um com sua conta)                                   │
│   └── Escalável para N usuários                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Atualizar tabela whatsapp_settings

```sql
-- Adicionar campos para credenciais do usuário
ALTER TABLE whatsapp_settings
ADD COLUMN IF NOT EXISTS zapi_instance_id TEXT,
ADD COLUMN IF NOT EXISTS zapi_token TEXT,
ADD COLUMN IF NOT EXISTS zapi_client_token TEXT, -- Opcional (security token)
ADD COLUMN IF NOT EXISTS credentials_validated_at TIMESTAMPTZ;

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_user 
ON whatsapp_settings(user_id);
```

### 7.3 Serviço Z-API Multi-tenant

Arquivo: `src/lib/whatsapp/zapi-service.ts` (ATUALIZADO)

```typescript
import { createClient } from '@supabase/supabase-js';

export interface ZAPIConfig {
  instanceId: string;
  token: string;
  clientToken?: string; // Opcional
}

export interface SendTextParams {
  phone: string;
  message: string;
  delayMessage?: number; // 1-15 segundos
  delayTyping?: number;  // 1-15 segundos
}

export interface SendTextResponse {
  zaapId: string;
  messageId: string;
  id: string;
}

export interface ZAPIStatus {
  connected: boolean;
  smartphoneConnected: boolean;
  error: string | null;
}

export class ZAPIService {
  private config: ZAPIConfig;

  constructor(config: ZAPIConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return `https://api.z-api.io/instances/${this.config.instanceId}/token/${this.config.token}`;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.config.clientToken) {
      headers['Client-Token'] = this.config.clientToken;
    }
    
    return headers;
  }

  async sendText(params: SendTextParams): Promise<SendTextResponse> {
    const url = `${this.getBaseUrl()}/send-text`;

    // Formatar telefone (garantir que tenha 55 na frente)
    let phone = params.phone.replace(/\D/g, '');
    if (!phone.startsWith('55')) {
      phone = '55' + phone;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        phone,
        message: params.message,
        delayMessage: params.delayMessage,
        delayTyping: params.delayTyping,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro Z-API: ${response.status}`);
    }

    return response.json();
  }

  async getStatus(): Promise<ZAPIStatus> {
    const url = `${this.getBaseUrl()}/status`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        return { connected: false, smartphoneConnected: false, error: 'Erro ao conectar' };
      }
      
      const data = await response.json();
      return {
        connected: data.connected || false,
        smartphoneConnected: data.smartphoneConnected || false,
        error: data.error || null,
      };
    } catch (error) {
      return { connected: false, smartphoneConnected: false, error: 'Erro de conexão' };
    }
  }

  async getQRCode(): Promise<{ value?: string; base64?: string } | null> {
    const url = `${this.getBaseUrl()}/qr-code/image`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) return null;
      
      return response.json();
    } catch (error) {
      return null;
    }
  }
}

// ============================================
// FUNÇÕES HELPER PARA MULTI-TENANT
// ============================================

/**
 * Obtém as credenciais Z-API do usuário do banco de dados
 */
export async function getUserZAPIConfig(userId: string): Promise<ZAPIConfig | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('whatsapp_settings')
    .select('zapi_instance_id, zapi_token, zapi_client_token')
    .eq('user_id', userId)
    .single();

  if (error || !data?.zapi_instance_id || !data?.zapi_token) {
    return null;
  }

  return {
    instanceId: data.zapi_instance_id,
    token: data.zapi_token,
    clientToken: data.zapi_client_token || undefined,
  };
}

/**
 * Cria instância do serviço Z-API para um usuário específico
 */
export async function getZAPIServiceForUser(userId: string): Promise<ZAPIService | null> {
  const config = await getUserZAPIConfig(userId);
  
  if (!config) {
    return null;
  }

  return new ZAPIService(config);
}

/**
 * Fallback: usa credenciais do .env se usuário não tem configuração própria
 */
export function getDefaultZAPIService(): ZAPIService | null {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;

  if (!instanceId || !token) {
    return null;
  }

  return new ZAPIService({
    instanceId,
    token,
    clientToken: process.env.ZAPI_CLIENT_TOKEN,
  });
}

/**
 * Obtém serviço Z-API: primeiro tenta do usuário, depois fallback para .env
 */
export async function getZAPIService(userId?: string): Promise<ZAPIService | null> {
  // Se tem userId, tenta pegar credenciais do usuário
  if (userId) {
    const userService = await getZAPIServiceForUser(userId);
    if (userService) return userService;
  }

  // Fallback para credenciais do .env
  return getDefaultZAPIService();
}
```

### 7.4 API Route para salvar credenciais

Arquivo: `src/app/api/whatsapp/settings/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ZAPIService } from '@/lib/whatsapp/zapi-service';

// GET - Buscar configurações do usuário
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    // Não retornar tokens completos por segurança
    if (data) {
      return NextResponse.json({
        ...data,
        zapi_token: data.zapi_token ? '••••••' + data.zapi_token.slice(-4) : null,
        zapi_client_token: data.zapi_client_token ? '••••••' : null,
      });
    }

    return NextResponse.json(null);
  } catch (error: any) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Salvar credenciais Z-API
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { instanceId, token, clientToken } = body;

    if (!instanceId || !token) {
      return NextResponse.json(
        { error: 'Instance ID e Token são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar credenciais fazendo uma chamada de teste
    const testService = new ZAPIService({
      instanceId,
      token,
      clientToken,
    });

    const status = await testService.getStatus();

    if (!status.connected && status.error) {
      return NextResponse.json(
        { 
          error: 'Credenciais inválidas ou WhatsApp desconectado',
          details: status.error 
        },
        { status: 400 }
      );
    }

    // Salvar/Atualizar credenciais
    const { data, error } = await supabase
      .from('whatsapp_settings')
      .upsert({
        user_id: user.id,
        zapi_instance_id: instanceId,
        zapi_token: token,
        zapi_client_token: clientToken || null,
        is_connected: status.connected,
        credentials_validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      connected: status.connected,
      smartphoneConnected: status.smartphoneConnected,
    });
  } catch (error: any) {
    console.error('Erro ao salvar credenciais:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remover credenciais
export async function DELETE() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { error } = await supabase
      .from('whatsapp_settings')
      .update({
        zapi_instance_id: null,
        zapi_token: null,
        zapi_client_token: null,
        is_connected: false,
        credentials_validated_at: null,
      })
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao remover credenciais:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 7.5 Página de Configurações WhatsApp

Arquivo: `src/app/(dashboard)/settings/whatsapp/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  MessageSquare, 
  Check, 
  X, 
  Loader2, 
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface WhatsAppSettings {
  zapi_instance_id: string | null;
  zapi_token: string | null;
  zapi_client_token: string | null;
  is_connected: boolean;
  credentials_validated_at: string | null;
}

export default function WhatsAppSettingsPage() {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [instanceId, setInstanceId] = useState('');
  const [token, setToken] = useState('');
  const [clientToken, setClientToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/whatsapp/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        if (data?.zapi_instance_id) {
          setInstanceId(data.zapi_instance_id);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!instanceId || !token) {
      setError('Instance ID e Token são obrigatórios');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId,
          token,
          clientToken: clientToken || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar');
      }

      setSuccess('Credenciais salvas com sucesso!');
      setToken(''); // Limpar token do form por segurança
      fetchSettings(); // Recarregar settings
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar o WhatsApp?')) return;

    setSaving(true);
    try {
      const response = await fetch('/api/whatsapp/settings', {
        method: 'DELETE',
      });

      if (response.ok) {
        setSettings(null);
        setInstanceId('');
        setToken('');
        setClientToken('');
        setSuccess('WhatsApp desconectado');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-green-500/20">
          <MessageSquare className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">WhatsApp</h1>
          <p className="text-zinc-400">Configure sua integração com Z-API</p>
        </div>
      </div>

      {/* Status Card */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              settings?.is_connected ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'
            }`} />
            <span className="text-white font-medium">
              {settings?.is_connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          {settings?.credentials_validated_at && (
            <span className="text-xs text-zinc-500">
              Última validação: {new Date(settings.credentials_validated_at).toLocaleString('pt-BR')}
            </span>
          )}
        </div>
      </GlassCard>

      {/* Instructions */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Como conectar seu WhatsApp
        </h2>
        <ol className="space-y-3 text-zinc-300">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm font-medium">1</span>
            <span>
              Crie uma conta no{' '}
              <a 
                href="https://z-api.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-400 hover:underline inline-flex items-center gap-1"
              >
                Z-API <ExternalLink className="w-3 h-3" />
              </a>
              {' '}(~R$60/mês)
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm font-medium">2</span>
            <span>Crie uma instância e conecte seu WhatsApp via QR Code</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm font-medium">3</span>
            <span>Copie o <strong>Instance ID</strong> e <strong>Token</strong> do painel Z-API</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm font-medium">4</span>
            <span>Cole as credenciais abaixo e salve</span>
          </li>
        </ol>
      </GlassCard>

      {/* Credentials Form */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Credenciais Z-API
        </h2>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center gap-2 text-green-400">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Instance ID */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Instance ID
            </label>
            <input
              type="text"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="3EB3592FA75F61F63FA4D2A2D3856553"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 font-mono text-sm"
            />
          </div>

          {/* Token */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={settings?.zapi_token || 'CC6EE367274AA41BB818B649'}
                className="w-full px-3 py-2 pr-10 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {settings?.zapi_token && (
              <p className="text-xs text-zinc-500 mt-1">
                Token atual: {settings.zapi_token}
              </p>
            )}
          </div>

          {/* Client Token (Opcional) */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Client Token <span className="text-zinc-500">(opcional)</span>
            </label>
            <input
              type="password"
              value={clientToken}
              onChange={(e) => setClientToken(e.target.value)}
              placeholder="Token de segurança adicional"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 font-mono text-sm"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Só preencha se você ativou o Account Security Token no Z-API
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          {settings?.is_connected && (
            <button
              onClick={handleDisconnect}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              Desconectar
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !instanceId || !token}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {saving ? 'Validando...' : 'Salvar Credenciais'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
```

### 7.6 Atualizar API de envio para Multi-tenant

Arquivo: `src/app/api/whatsapp/send/route.ts` (ATUALIZADO)

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getZAPIService } from '@/lib/whatsapp/zapi-service';
import { processTemplate } from '@/lib/whatsapp/message-templates';
import { MessageTemplateType } from '@/types/whatsapp';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, message, templateType, variables, clientId } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 });
    }

    // ⭐ MULTI-TENANT: Buscar serviço Z-API do usuário ou fallback
    const zapiService = await getZAPIService(user.id);

    if (!zapiService) {
      return NextResponse.json(
        { error: 'WhatsApp não configurado. Vá em Configurações > WhatsApp' },
        { status: 400 }
      );
    }

    // Processar mensagem
    let finalMessage = message;
    if (templateType && templateType !== 'custom') {
      finalMessage = processTemplate(templateType as MessageTemplateType, variables || {});
    }

    if (!finalMessage) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    // Criar log
    const { data: log } = await supabase
      .from('message_logs')
      .insert({
        user_id: user.id,
        client_id: clientId || null,
        phone,
        message: finalMessage,
        template_type: templateType || null,
        type: 'sent',
        status: 'pending',
      })
      .select()
      .single();

    // Enviar via Z-API
    try {
      const result = await zapiService.sendText({
        phone,
        message: finalMessage,
        delayTyping: 2, // 2 segundos de "digitando..."
      });

      if (log) {
        await supabase
          .from('message_logs')
          .update({
            status: 'sent',
            zapi_message_id: result.messageId,
            sent_at: new Date().toISOString(),
          })
          .eq('id', log.id);
      }

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    } catch (sendError: any) {
      if (log) {
        await supabase
          .from('message_logs')
          .update({ status: 'failed', error: sendError.message })
          .eq('id', log.id);
      }
      throw sendError;
    }
  } catch (error: any) {
    console.error('Erro ao enviar WhatsApp:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar mensagem' },
      { status: 500 }
    );
  }
}
```

### 7.7 Adicionar link no Sidebar

No arquivo de navegação, adicionar:

```typescript
{
  name: 'WhatsApp',
  href: '/settings/whatsapp',
  icon: MessageSquare,
  parent: 'settings', // Se usar submenus
}
```

---

## ✅ RESUMO FINAL

### FASE 1-6: Integração Básica
- Usar credenciais fixas do `.env`
- Testar se tudo funciona
- Enviar mensagens de qualquer cliente

### FASE 7: Multi-tenant
- Cada usuário configura suas próprias credenciais
- Página de configurações para inserir Instance ID + Token
- Validação automática da conexão
- Fallback para credenciais do `.env` se usuário não configurou

### Fluxo de Implementação

```
1️⃣ Implementar FASE 1-6 primeiro
   ↓
2️⃣ Testar com suas credenciais
   ↓
3️⃣ Confirmar que funciona
   ↓
4️⃣ Implementar FASE 7 (Multi-tenant)
   ↓
5️⃣ Testar página de configurações
   ↓
✅ Pronto para múltiplos usuários!
```

---

*Prompt criado em Dezembro 2025 para o projeto MARCOLA Gestor de Tráfegos*
