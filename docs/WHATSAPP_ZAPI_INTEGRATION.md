# Integração WhatsApp via Z-API

> Documentação completa da integração WhatsApp no MARCOLA usando Z-API

## Índice

1. [Visão Geral](#visão-geral)
2. [Configuração](#configuração)
3. [Arquitetura](#arquitetura)
4. [API Endpoints](#api-endpoints)
5. [Componentes](#componentes)
6. [Templates de Mensagem](#templates-de-mensagem)
7. [Uso](#uso)
8. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O MARCOLA integra com o WhatsApp através da [Z-API](https://z-api.io), permitindo:

- Enviar mensagens de texto para clientes
- Usar templates pré-definidos (pagamento, tarefas, relatórios)
- Mensagens personalizadas
- Histórico de mensagens enviadas
- Edição de telefone inline com salvamento no banco

### Fluxo de Envio

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cliente   │────▶│   Modal     │────▶│  API Route  │────▶│   Z-API     │
│   (Card)    │     │  WhatsApp   │     │  /send      │     │  WhatsApp   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## Configuração

### Variáveis de Ambiente

Adicione ao arquivo `.env.local`:

```env
# Z-API WhatsApp Integration
ZAPI_INSTANCE_ID=seu_instance_id_aqui
ZAPI_TOKEN=seu_token_aqui
ZAPI_CLIENT_TOKEN=seu_client_token_aqui
```

### Onde encontrar as credenciais no Z-API

1. **ZAPI_INSTANCE_ID** e **ZAPI_TOKEN**:
   - Acesse [Z-API](https://z-api.io)
   - Vá em "Instâncias" > Sua instância
   - Aba "Dados da instância web"
   - Copie "ID da instância" e "Token da instância"

2. **ZAPI_CLIENT_TOKEN** (Token de Segurança):
   - No painel Z-API, vá em "Segurança" ou "Security"
   - Acesse "Token de Segurança da Conta" / "Account Security Token"
   - Clique em "Configurar agora" para gerar
   - Copie o token gerado

### Verificar Conexão

A instância Z-API deve estar **conectada** (status verde "Conectado" no painel).

---

## Arquitetura

### Estrutura de Arquivos

```
src/
├── app/api/whatsapp/
│   ├── send/route.ts          # POST - Enviar mensagem
│   ├── status/route.ts        # GET - Status da conexão
│   ├── templates/route.ts     # GET - Listar templates
│   ├── history/route.ts       # GET - Histórico de mensagens
│   └── webhook/route.ts       # POST - Receber webhooks Z-API
├── components/whatsapp/
│   ├── SendWhatsAppModal.tsx  # Modal de envio
│   └── index.ts               # Exports
├── hooks/
│   └── useWhatsApp.ts         # Hook para operações WhatsApp
├── lib/whatsapp/
│   ├── zapi-service.ts        # Serviço Z-API (classe principal)
│   ├── message-templates.ts   # Templates de mensagem
│   └── index.ts               # Exports
└── types/
    └── whatsapp.ts            # Tipos TypeScript
```

### Diagrama de Dependências

```
┌─────────────────────────────────────────────────────────────┐
│                        Components                            │
│  ┌──────────────────┐                                       │
│  │ SendWhatsAppModal │                                       │
│  └────────┬─────────┘                                       │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                       │
│  │   useWhatsApp    │ (Hook)                                │
│  └────────┬─────────┘                                       │
└───────────┼─────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Routes                              │
│  /api/whatsapp/send  │  /api/whatsapp/status  │  etc.       │
└───────────┬─────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Services                              │
│  ┌──────────────────┐    ┌────────────────────┐             │
│  │   ZAPIService    │    │  message-templates │             │
│  └──────────────────┘    └────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### POST /api/whatsapp/send

Envia mensagem WhatsApp para um cliente.

**Request:**
```json
{
  "clientId": "uuid-do-cliente",
  "phone": "5511999999999",
  "templateType": "payment_reminder",
  "variables": {
    "nome": "João Silva",
    "valor": "1.500,00",
    "data_vencimento": "10/01/2025"
  }
}
```

**Response (sucesso):**
```json
{
  "success": true,
  "messageId": "86CC1D42947A94B81299",
  "logId": "uuid-do-log"
}
```

**Response (erro):**
```json
{
  "success": false,
  "error": "Mensagem de erro"
}
```

### GET /api/whatsapp/status

Retorna status da conexão WhatsApp.

**Response:**
```json
{
  "connected": true,
  "smartphoneConnected": true,
  "error": null
}
```

### GET /api/whatsapp/templates

Lista templates de mensagem disponíveis.

**Query params:**
- `preview=true` - Inclui preview com dados de exemplo

**Response:**
```json
{
  "templates": [
    {
      "type": "payment_reminder",
      "title": "Lembrete de Pagamento",
      "description": "Envia lembrete amigável...",
      "template": "💰 *Lembrete de Pagamento*...",
      "variables": ["nome", "data_vencimento", "valor"],
      "preview": "💰 *Lembrete de Pagamento*\n\nOlá Cliente Exemplo!..."
    }
  ]
}
```

### GET /api/whatsapp/history

Retorna histórico de mensagens enviadas.

**Query params:**
- `clientId` - Filtrar por cliente
- `limit` - Limite de resultados (default: 50)
- `offset` - Paginação
- `status` - Filtrar por status (sent, delivered, read, failed)

**Response:**
```json
{
  "messages": [...],
  "total": 150,
  "hasMore": true
}
```

### POST /api/whatsapp/webhook

Recebe webhooks do Z-API (status de mensagens, etc).

---

## Componentes

### SendWhatsAppModal

Modal para envio de mensagens WhatsApp.

**Props:**
```typescript
interface SendWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  defaultTemplate?: MessageTemplateType;
  defaultVariables?: Record<string, string>;
  onPhoneUpdate?: (newPhone: string) => Promise<void>;
}
```

**Uso:**
```tsx
import { SendWhatsAppModal } from '@/components/whatsapp';

<SendWhatsAppModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  clientId={client.id}
  clientName={client.name}
  clientPhone={client.contact_phone}
  onPhoneUpdate={handlePhoneUpdate}
/>
```

**Características:**
- Renderiza via Portal (fora da hierarquia DOM)
- Fluxo em etapas: Selecionar template → Compor mensagem → Sucesso
- Edição de telefone inline
- Preview da mensagem em tempo real
- Validação de variáveis obrigatórias

### useWhatsApp Hook

Hook para operações WhatsApp.

**Uso:**
```typescript
import { useWhatsApp } from '@/hooks/useWhatsApp';

const {
  loading,
  error,
  sendMessage,
  getStatus,
  getHistory,
  getTemplates,
  clearError,
} = useWhatsApp();

// Enviar mensagem
const result = await sendMessage({
  clientId: 'uuid',
  phone: '5511999999999',
  templateType: 'payment_reminder',
  variables: { nome: 'João', valor: '100,00' }
});
```

---

## Templates de Mensagem

### Templates Disponíveis

| Tipo | Título | Variáveis |
|------|--------|-----------|
| `payment_reminder` | Lembrete de Pagamento | nome, data_vencimento, valor |
| `payment_overdue` | Pagamento em Atraso | nome, data_vencimento, valor, dias_atraso |
| `task_completed` | Tarefa Concluída | nome, tarefa, data_conclusao, observacao |
| `task_assigned` | Nova Tarefa Atribuída | nome, tarefa, cliente, prazo, prioridade |
| `report_ready` | Relatório Disponível | nome, periodo, investimento, resultados, cpa, observacao |
| `custom` | Mensagem Personalizada | mensagem |

### Exemplo de Template

```typescript
// payment_reminder
💰 *Lembrete de Pagamento*

Olá {nome}! 👋

Este é um lembrete amigável sobre o pagamento da gestão de tráfego.

📅 *Vencimento:* {data_vencimento}
💵 *Valor:* R$ {valor}

Se já realizou o pagamento, por favor desconsidere esta mensagem.

Qualquer dúvida, estou à disposição! 🚀

---
_MARCOLA Gestor de Tráfegos_
```

### Adicionar Novo Template

1. Edite `src/lib/whatsapp/message-templates.ts`
2. Adicione o tipo em `src/types/whatsapp.ts` no `MessageTemplateType`
3. Adicione o template no objeto `MESSAGE_TEMPLATES`

```typescript
// Em src/types/whatsapp.ts
export type MessageTemplateType =
  | 'payment_reminder'
  | 'payment_overdue'
  | 'task_completed'
  | 'task_assigned'
  | 'report_ready'
  | 'custom'
  | 'novo_template'; // Adicione aqui

// Em src/lib/whatsapp/message-templates.ts
export const MESSAGE_TEMPLATES: Record<MessageTemplateType, WhatsAppTemplate> = {
  // ... templates existentes

  novo_template: {
    type: 'novo_template',
    title: 'Título do Template',
    description: 'Descrição do template',
    template: `Conteúdo com {variavel}`,
    variables: ['variavel'],
  },
};
```

---

## Uso

### Enviar Mensagem do Card do Cliente

1. No card do cliente, clique no ícone do WhatsApp (verde)
2. Selecione um template ou "Mensagem Personalizada"
3. Preencha as variáveis necessárias
4. Clique em "Enviar Mensagem"

### Enviar Mensagem Programaticamente

```typescript
import { getZAPIService } from '@/lib/whatsapp';
import { processTemplate } from '@/lib/whatsapp/message-templates';

// Obter serviço
const service = await getZAPIService();

if (service) {
  // Processar template
  const message = processTemplate('payment_reminder', {
    nome: 'João Silva',
    data_vencimento: '10/01/2025',
    valor: '1.500,00'
  });

  // Enviar
  const result = await service.sendText({
    phone: '5511999999999',
    message
  });

  console.log('Mensagem enviada:', result.messageId);
}
```

### Verificar Status da Conexão

```typescript
import { getZAPIService } from '@/lib/whatsapp';

const service = await getZAPIService();
const status = await service?.getStatus();

if (status?.connected) {
  console.log('WhatsApp conectado!');
} else {
  console.log('WhatsApp desconectado:', status?.error);
}
```

---

## Troubleshooting

### Erro: "WhatsApp não configurado"

**Causa:** Variáveis de ambiente não configuradas.

**Solução:**
1. Verifique se `.env.local` contém `ZAPI_INSTANCE_ID` e `ZAPI_TOKEN`
2. Reinicie o servidor Next.js

### Erro: "your client-token is not configured"

**Causa:** Token de segurança da conta Z-API está ativado mas não configurado.

**Solução:**
1. Acesse o painel Z-API
2. Vá em "Segurança" > "Token de Segurança da Conta"
3. Copie o token
4. Adicione `ZAPI_CLIENT_TOKEN=seu_token` no `.env.local`
5. Reinicie o servidor

### Erro: 401 Unauthorized

**Causa:** Credenciais inválidas.

**Solução:**
1. Verifique se `ZAPI_INSTANCE_ID` e `ZAPI_TOKEN` estão corretos
2. Confirme que a instância está ativa no painel Z-API

### Erro: "Número não possui WhatsApp"

**Causa:** O número de telefone não está registrado no WhatsApp.

**Solução:**
1. Verifique se o número está correto
2. Confirme que o número possui WhatsApp ativo

### Modal aparece dentro do card

**Causa:** Bug de renderização (já corrigido).

**Solução:** O modal usa `createPortal` para renderizar no `document.body`.

### Modal "pisca" ao selecionar template

**Causa:** Bug no useEffect (já corrigido).

**Solução:** O modal usa `useRef` para controlar inicialização.

---

## Referências

- [Z-API Documentação](https://developer.z-api.io)
- [Z-API Client-Token](https://developer.z-api.io/en/security/client-token)
- [React Portal](https://react.dev/reference/react-dom/createPortal)

---

## Changelog

### v1.0.0 (Dezembro 2024)
- Implementação inicial da integração Z-API
- Modal de envio com templates
- 6 templates pré-definidos
- Edição de telefone inline
- Histórico de mensagens
- Documentação completa
