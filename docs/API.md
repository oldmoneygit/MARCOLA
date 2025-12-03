# API.md - Documentação da API

---

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Endpoints](#endpoints)
4. [Tipos de Resposta](#tipos-de-resposta)
5. [Tratamento de Erros](#tratamento-de-erros)
6. [Rate Limiting](#rate-limiting)

---

## 🌐 Visão Geral

A API do TrafficHub utiliza **Next.js API Routes** com o App Router.

### Base URL

```
Development: http://localhost:3000/api
Production: https://traffichub.vercel.app/api
```

### Convenções

- **REST**: Seguimos padrões REST
- **JSON**: Todas as requisições e respostas são JSON
- **Auth**: JWT via cookies (Supabase Auth)
- **Errors**: Formato padronizado

### Headers

```http
Content-Type: application/json
Cookie: sb-access-token=<token>; sb-refresh-token=<token>
```

---

## 🔐 Autenticação

A autenticação é gerenciada pelo **Supabase Auth**. Os tokens são armazenados em cookies httpOnly.

### Login

```http
POST /api/auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### Logout

```http
POST /api/auth/logout
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### Get Current User

```http
GET /api/auth/me
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatar_url": null
  }
}
```

---

## 📡 Endpoints

### Clients

#### List Clients

```http
GET /api/clients
```

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status (active, paused, inactive) |
| `segment` | string | Filter by segment |
| `search` | string | Search by name |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Academia FitMax",
      "segment": "Fitness",
      "status": "active",
      "contact_phone": "+5511999999999",
      "contact_email": "contact@fitmax.com",
      "monthly_value": 2000.00,
      "due_day": 10,
      "ads_account_url": "https://...",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

#### Get Client

```http
GET /api/clients/:id
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Academia FitMax",
    "segment": "Fitness",
    "status": "active",
    "contact_phone": "+5511999999999",
    "contact_email": "contact@fitmax.com",
    "monthly_value": 2000.00,
    "due_day": 10,
    "ads_account_url": "https://...",
    "website_url": "https://...",
    "drive_url": "https://...",
    "notes": "Notas sobre o cliente",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z",
    "metrics": {
      "current_cpa": 52.00,
      "current_ctr": 2.6,
      "monthly_leads": 89,
      "total_spend_month": 4200.00
    }
  }
}
```

#### Create Client

```http
POST /api/clients
```

**Request:**
```json
{
  "name": "Academia FitMax",
  "segment": "Fitness",
  "monthly_value": 2000.00,
  "due_day": 10,
  "contact_phone": "+5511999999999",
  "contact_email": "contact@fitmax.com",
  "ads_account_url": "https://..."
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Academia FitMax",
    ...
  },
  "message": "Client created successfully"
}
```

#### Update Client

```http
PUT /api/clients/:id
```

**Request:**
```json
{
  "name": "Academia FitMax Updated",
  "monthly_value": 2500.00
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Academia FitMax Updated",
    ...
  },
  "message": "Client updated successfully"
}
```

#### Delete Client

```http
DELETE /api/clients/:id
```

**Response (200):**
```json
{
  "message": "Client deleted successfully"
}
```

---

### Reports

#### List Reports

```http
GET /api/reports
```

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `client_id` | uuid | Filter by client |
| `start_date` | date | Period start |
| `end_date` | date | Period end |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "period_start": "2025-11-25",
      "period_end": "2025-12-01",
      "total_spend": 4200.00,
      "total_impressions": 124000,
      "total_clicks": 3200,
      "total_conversions": 81,
      "ctr": 2.58,
      "cpa": 51.85,
      "cpm": 33.87,
      "created_at": "2025-12-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

#### Get Report with Ads

```http
GET /api/reports/:id
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "client_id": "uuid",
    "period_start": "2025-11-25",
    "period_end": "2025-12-01",
    "total_spend": 4200.00,
    "total_impressions": 124000,
    "total_clicks": 3200,
    "total_conversions": 81,
    "ctr": 2.58,
    "cpa": 51.85,
    "cpm": 33.87,
    "ads": [
      {
        "id": "uuid",
        "ad_name": "Promo Verão - Carrossel",
        "campaign_name": "Verão 2025",
        "spend": 1200.00,
        "impressions": 42000,
        "clicks": 1400,
        "conversions": 38,
        "ctr": 3.33,
        "cpa": 31.58,
        "status": "winner"
      }
    ]
  }
}
```

#### Import Report (CSV)

```http
POST /api/reports/import
```

**Request (multipart/form-data):**
```
client_id: uuid
period_start: 2025-11-25
period_end: 2025-12-01
file: <csv_file>
```

**Response (201):**
```json
{
  "data": {
    "report_id": "uuid",
    "ads_imported": 15,
    "total_spend": 4200.00
  },
  "message": "Report imported successfully"
}
```

---

### Analysis

#### Get Suggestions

```http
GET /api/analysis/suggestions
```

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `client_id` | uuid | Filter by client |
| `severity` | string | urgent, warning, info |
| `type` | string | fatigue, opportunity, suggestion, andromeda |
| `status` | string | active, dismissed, completed |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "client_name": "Academia FitMax",
      "type": "fatigue",
      "severity": "urgent",
      "title": "Fadiga Criativa Crítica",
      "description": "O CTR caiu 24% nos últimos 7 dias...",
      "actions": [
        "Pausar o anúncio 'Crossfit - Imagem'",
        "Criar 5-8 novas variações"
      ],
      "related_data": {
        "ctr_change": -24,
        "cpa_change": 18,
        "affected_ads": ["uuid1", "uuid2"]
      },
      "status": "active",
      "created_at": "2025-12-01T00:00:00Z"
    }
  ]
}
```

#### Dismiss Suggestion

```http
PUT /api/analysis/suggestions/:id/dismiss
```

**Response (200):**
```json
{
  "message": "Suggestion dismissed"
}
```

#### Complete Suggestion

```http
PUT /api/analysis/suggestions/:id/complete
```

**Response (200):**
```json
{
  "message": "Suggestion marked as completed"
}
```

#### Get Creative Diversity (Andromeda)

```http
GET /api/analysis/creative-diversity
```

**Response (200):**
```json
{
  "data": [
    {
      "client_id": "uuid",
      "client_name": "Academia FitMax",
      "creative_count": 3,
      "recommended_count": 10,
      "status": "below_recommended"
    }
  ]
}
```

---

### Financial

#### List Payments

```http
GET /api/financial/payments
```

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `client_id` | uuid | Filter by client |
| `status` | string | pending, paid, overdue |
| `month` | string | YYYY-MM format |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "client_name": "Academia FitMax",
      "amount": 2000.00,
      "due_date": "2025-12-10",
      "paid_date": null,
      "status": "pending",
      "reference_month": "2025-12-01",
      "days_until_due": 8
    }
  ],
  "summary": {
    "total": 4700.00,
    "received": 3500.00,
    "pending": 0,
    "overdue": 1200.00
  }
}
```

#### Mark as Paid

```http
PUT /api/financial/payments/:id/pay
```

**Request:**
```json
{
  "paid_date": "2025-12-01",
  "notes": "Pago via PIX"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "paid",
    "paid_date": "2025-12-01"
  },
  "message": "Payment marked as paid"
}
```

#### Generate Payment Reminder

```http
POST /api/financial/payments/:id/reminder
```

**Response (200):**
```json
{
  "data": {
    "client_name": "Casa Show Eventos",
    "phone": "+5511777777777",
    "amount": 1200.00,
    "due_date": "2025-11-29",
    "days_overdue": 3,
    "message": "Olá! 👋 Notei que o pagamento da mensalidade de Novembro (R$ 1.200) ainda não foi efetuado...",
    "whatsapp_url": "https://wa.me/5511777777777?text=..."
  }
}
```

---

### Dashboard

#### Get Overview

```http
GET /api/dashboard/overview
```

**Response (200):**
```json
{
  "data": {
    "metrics": {
      "active_clients": 3,
      "total_clients": 3,
      "total_spend": 12400.00,
      "total_conversions": 287,
      "avg_cpa": 43.21,
      "avg_ctr": 2.8
    },
    "changes": {
      "spend": 8,
      "conversions": 23,
      "cpa": -12,
      "ctr": -5
    },
    "period": {
      "start": "2025-11-25",
      "end": "2025-12-01"
    }
  }
}
```

#### Get Alerts

```http
GET /api/dashboard/alerts
```

**Response (200):**
```json
{
  "data": [
    {
      "type": "warning",
      "icon": "📉",
      "title": "Fadiga Criativa Detectada",
      "description": "Cliente: Academia FitMax — CTR caiu 24%",
      "action_url": "/analysis",
      "action_label": "Ver sugestões"
    },
    {
      "type": "danger",
      "icon": "💸",
      "title": "Cobrança Pendente",
      "description": "Cliente: Casa Show — Venceu há 3 dias",
      "action_url": "/financial",
      "action_label": "Enviar lembrete"
    }
  ]
}
```

#### Get Weekly Chart Data

```http
GET /api/dashboard/weekly
```

**Response (200):**
```json
{
  "data": [
    { "day": "Seg", "conversions": 42, "spend": 1800 },
    { "day": "Ter", "conversions": 38, "spend": 1650 },
    { "day": "Qua", "conversions": 45, "spend": 1900 },
    { "day": "Qui", "conversions": 52, "spend": 2100 },
    { "day": "Sex", "conversions": 48, "spend": 1950 },
    { "day": "Sáb", "conversions": 35, "spend": 1400 },
    { "day": "Dom", "conversions": 27, "spend": 1100 }
  ]
}
```

---

## 📦 Tipos de Resposta

### Sucesso

```typescript
// Single item
interface SuccessResponse<T> {
  data: T;
  message?: string;
}

// List
interface ListResponse<T> {
  data: T[];
  count: number;
  page?: number;
  limit?: number;
}
```

### Erro

```typescript
interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}
```

---

## ❌ Tratamento de Erros

### Códigos de Status

| Status | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validação) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Unprocessable Entity |
| 500 | Internal Server Error |

### Formato de Erro

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": ["Name is required"],
    "monthly_value": ["Must be a positive number"]
  }
}
```

### Implementação

```typescript
// app/api/clients/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validação
    const result = clientSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // ... lógica
    
    return NextResponse.json({ data, message: 'Created' }, { status: 201 });
  } catch (error) {
    console.error('[API /clients POST]', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

---

## 🚦 Rate Limiting

> Nota: Implementar se necessário em produção.

### Limites Sugeridos

| Endpoint | Limite |
|----------|--------|
| Auth | 5 req/min |
| Read | 100 req/min |
| Write | 30 req/min |
| Import | 5 req/min |

### Headers de Resposta

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638316800
```

---

*Este documento deve ser atualizado sempre que novos endpoints forem adicionados.*
