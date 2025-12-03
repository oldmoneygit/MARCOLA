# ARCHITECTURE.md - Arquitetura Técnica do TrafficHub

---

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Alto Nível](#arquitetura-de-alto-nível)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Camada de Apresentação](#camada-de-apresentação)
5. [Camada de Lógica](#camada-de-lógica)
6. [Camada de Dados](#camada-de-dados)
7. [Fluxos de Dados](#fluxos-de-dados)
8. [Padrões Utilizados](#padrões-utilizados)
9. [Segurança](#segurança)

---

## 🏗 Visão Geral

O TrafficHub utiliza uma arquitetura moderna baseada em:

- **Frontend**: Next.js 14 com App Router (Server Components + Client Components)
- **Backend**: API Routes do Next.js + Supabase
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Deploy**: Vercel

### Princípios Arquiteturais

1. **Separation of Concerns**: Cada módulo tem responsabilidade única
2. **DRY (Don't Repeat Yourself)**: Reutilização de componentes e hooks
3. **KISS (Keep It Simple)**: Simplicidade sobre complexidade
4. **Type Safety**: TypeScript em todo o projeto
5. **Performance First**: Otimizações de renderização e data fetching

---

## 🔷 Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLIENTE                                │
│                      (Browser/Mobile)                            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE                              │
│                    (CDN + Edge Functions)                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    App Router                            │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │    │
│  │  │   Server    │  │   Client    │  │    API      │      │    │
│  │  │ Components  │  │ Components  │  │   Routes    │      │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Shared Layer                          │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │    │
│  │  │  Hooks  │  │ Stores  │  │  Utils  │  │  Types  │     │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  PostgreSQL │  │    Auth     │  │   Storage   │              │
│  │  (Database) │  │   (JWT)     │  │   (Files)   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Pastas

```
traffichub/
│
├── 📁 .github/
│   └── 📁 workflows/
│       └── ci.yml                 # GitHub Actions CI/CD
│
├── 📁 docs/                       # Documentação
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── COMPONENTS.md
│   ├── DATABASE.md
│   ├── DESIGN_SYSTEM.md
│   └── WORKFLOW.md
│
├── 📁 public/                     # Assets estáticos
│   ├── favicon.ico
│   └── 📁 images/
│
├── 📁 src/
│   │
│   ├── 📁 app/                    # Next.js App Router
│   │   │
│   │   ├── 📁 (auth)/             # Grupo de rotas: Auth
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── 📁 (dashboard)/        # Grupo de rotas: Dashboard
│   │   │   ├── 📁 dashboard/
│   │   │   │   └── page.tsx       # /dashboard
│   │   │   ├── 📁 clients/
│   │   │   │   ├── page.tsx       # /clients
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # /clients/[id]
│   │   │   ├── 📁 reports/
│   │   │   │   └── page.tsx       # /reports
│   │   │   ├── 📁 analysis/
│   │   │   │   └── page.tsx       # /analysis
│   │   │   ├── 📁 financial/
│   │   │   │   └── page.tsx       # /financial
│   │   │   └── layout.tsx         # Layout com sidebar
│   │   │
│   │   ├── 📁 api/                # API Routes
│   │   │   ├── 📁 clients/
│   │   │   │   ├── route.ts       # GET, POST /api/clients
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts   # GET, PUT, DELETE /api/clients/[id]
│   │   │   ├── 📁 reports/
│   │   │   │   ├── route.ts
│   │   │   │   └── import/
│   │   │   │       └── route.ts   # POST /api/reports/import
│   │   │   ├── 📁 analysis/
│   │   │   │   └── route.ts
│   │   │   └── 📁 financial/
│   │   │       └── route.ts
│   │   │
│   │   ├── globals.css            # Estilos globais
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Home (redirect)
│   │
│   ├── 📁 components/
│   │   │
│   │   ├── 📁 ui/                 # Componentes base
│   │   │   ├── GlassCard.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── AlertCard.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Chart.tsx
│   │   │   └── index.ts           # Re-exports
│   │   │
│   │   ├── 📁 layout/             # Componentes de layout
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── 📁 clients/            # Componentes de clientes
│   │   │   ├── ClientCard.tsx
│   │   │   ├── ClientForm.tsx
│   │   │   ├── ClientList.tsx
│   │   │   ├── ClientDetail.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── 📁 reports/            # Componentes de relatórios
│   │   │   ├── ReportHeader.tsx
│   │   │   ├── MetricsGrid.tsx
│   │   │   ├── PerformanceChart.tsx
│   │   │   ├── AdsTable.tsx
│   │   │   ├── CSVImporter.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── 📁 analysis/           # Componentes de análise
│   │   │   ├── AndromedaAlert.tsx
│   │   │   ├── SuggestionCard.tsx
│   │   │   ├── SuggestionList.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── 📁 financial/          # Componentes financeiros
│   │   │   ├── FinancialOverview.tsx
│   │   │   ├── PaymentsTable.tsx
│   │   │   ├── MessageTemplates.tsx
│   │   │   ├── ReminderModal.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── 📁 dashboard/          # Componentes do dashboard
│   │       ├── AlertsList.tsx
│   │       ├── UpcomingPayments.tsx
│   │       ├── WeeklyChart.tsx
│   │       ├── ClientsDistribution.tsx
│   │       └── index.ts
│   │
│   ├── 📁 hooks/                  # Custom hooks
│   │   ├── useClients.ts
│   │   ├── useReports.ts
│   │   ├── useAnalysis.ts
│   │   ├── useFinancial.ts
│   │   ├── useAuth.ts
│   │   ├── useModal.ts
│   │   └── index.ts
│   │
│   ├── 📁 lib/                    # Utilitários e configurações
│   │   ├── 📁 supabase/
│   │   │   ├── client.ts          # Cliente browser
│   │   │   ├── server.ts          # Cliente server
│   │   │   └── middleware.ts      # Auth middleware
│   │   ├── utils.ts               # Funções utilitárias
│   │   ├── constants.ts           # Constantes
│   │   ├── validations.ts         # Schemas Zod
│   │   └── csv-parser.ts          # Parser de CSV
│   │
│   ├── 📁 stores/                 # Zustand stores
│   │   ├── useClientStore.ts
│   │   ├── useUIStore.ts
│   │   └── index.ts
│   │
│   ├── 📁 types/                  # TypeScript types
│   │   ├── client.ts
│   │   ├── report.ts
│   │   ├── analysis.ts
│   │   ├── financial.ts
│   │   ├── database.ts            # Types gerados do Supabase
│   │   └── index.ts
│   │
│   └── 📁 styles/                 # Estilos adicionais
│       └── animations.css
│
├── 📁 supabase/
│   ├── 📁 migrations/             # Migrations SQL
│   │   ├── 001_initial_schema.sql
│   │   └── 002_add_reports.sql
│   ├── seed.sql                   # Dados iniciais
│   └── config.toml
│
├── .env.example                   # Template de variáveis
├── .env.local                     # Variáveis locais (gitignore)
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── CLAUDE.md                      # Regras para Claude Code
├── PROJECT.md                     # Visão geral
├── README.md
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🎨 Camada de Apresentação

### Server Components vs Client Components

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVER COMPONENTS                         │
│  (Renderizado no servidor, sem JavaScript no cliente)        │
│                                                              │
│  ✅ Usar para:                                               │
│  • Layouts                                                   │
│  • Páginas que não precisam de interatividade               │
│  • Data fetching inicial                                     │
│  • Componentes estáticos                                     │
│                                                              │
│  📁 Arquivos: page.tsx, layout.tsx (sem 'use client')        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT COMPONENTS                         │
│  (Renderizado no cliente, com interatividade)                │
│                                                              │
│  ✅ Usar para:                                               │
│  • Componentes com useState/useEffect                        │
│  • Event handlers (onClick, onChange)                        │
│  • Browser APIs                                              │
│  • Bibliotecas client-side (Recharts)                        │
│                                                              │
│  📁 Arquivos: Com 'use client' no topo                       │
└─────────────────────────────────────────────────────────────┘
```

### Hierarquia de Componentes

```
Layout (Server)
└── Sidebar (Client - interatividade)
└── Main Content (Server)
    └── Page Header (Server)
    └── Metrics Grid (Client - gráficos)
    └── Data Table (Client - paginação, filtros)
    └── Modals (Client - estado)
```

---

## ⚙️ Camada de Lógica

### Hooks Customizados

Cada módulo tem um hook principal que encapsula toda a lógica:

```typescript
// hooks/useClients.ts
export function useClients() {
  // Estado
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Queries
  const fetchClients = async () => { /* ... */ };
  const getClient = async (id: string) => { /* ... */ };

  // Mutations
  const createClient = async (data: CreateClientDTO) => { /* ... */ };
  const updateClient = async (id: string, data: UpdateClientDTO) => { /* ... */ };
  const deleteClient = async (id: string) => { /* ... */ };

  // Computed
  const activeClients = useMemo(() => 
    clients.filter(c => c.status === 'active'), 
    [clients]
  );

  return {
    clients,
    activeClients,
    loading,
    error,
    fetchClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
  };
}
```

### Stores (Zustand)

Para estado global mínimo:

```typescript
// stores/useUIStore.ts
interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}));
```

---

## 💾 Camada de Dados

### Supabase Client

```typescript
// lib/supabase/client.ts (Browser)
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// lib/supabase/server.ts (Server Components / API Routes)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
};
```

### API Routes Pattern

```typescript
// app/api/clients/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API /clients GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    // Validação com Zod
    const validated = clientSchema.parse(body);

    const { data, error } = await supabase
      .from('clients')
      .insert(validated)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[API /clients POST]', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
```

---

## 🔄 Fluxos de Dados

### Fluxo de Leitura (Query)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│   Hook   │────▶│   API    │────▶│ Supabase │
│Component │     │useClients│     │  Route   │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     ▲                                                   │
     │                                                   │
     └───────────────────────────────────────────────────┘
                    (data via useState)
```

### Fluxo de Escrita (Mutation)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   Form   │────▶│  onSubmit│────▶│   API    │────▶│ Supabase │
│Component │     │ (hook)   │     │  Route   │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     ▲                                                   │
     │           ┌──────────┐                            │
     └───────────│ Revalidate│◀───────────────────────────┘
                 │   Cache   │
                 └──────────┘
```

### Fluxo de Autenticação

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Login   │────▶│ Supabase │────▶│  Session │
│   Form   │     │   Auth   │     │  Cookie  │
└──────────┘     └──────────┘     └──────────┘
                                       │
                                       ▼
                              ┌──────────────┐
                              │  Middleware  │
                              │ (Proteção)   │
                              └──────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
              ┌──────────┐      ┌──────────┐      ┌──────────┐
              │ Dashboard│      │  Clients │      │ Reports  │
              │ (Proteg.)│      │ (Proteg.)│      │ (Proteg.)│
              └──────────┘      └──────────┘      └──────────┘
```

---

## 🎯 Padrões Utilizados

### 1. Container/Presentational Pattern
```
ClientsPage (Container - lógica)
└── ClientList (Presentational - UI)
    └── ClientCard (Presentational - UI)
```

### 2. Custom Hook Pattern
```typescript
// Toda lógica encapsulada em hooks reutilizáveis
const { clients, loading, createClient } = useClients();
```

### 3. Compound Components Pattern
```typescript
<Modal>
  <Modal.Header>Título</Modal.Header>
  <Modal.Body>Conteúdo</Modal.Body>
  <Modal.Footer>Ações</Modal.Footer>
</Modal>
```

### 4. Render Props / Children as Function
```typescript
<DataLoader query={fetchClients}>
  {({ data, loading }) => loading ? <Skeleton /> : <ClientList data={data} />}
</DataLoader>
```

---

## 🔒 Segurança

### Row Level Security (RLS) no Supabase

```sql
-- Usuários só veem seus próprios clientes
CREATE POLICY "Users can view own clients"
  ON clients
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários só podem inserir seus próprios clientes
CREATE POLICY "Users can insert own clients"
  ON clients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Middleware de Autenticação

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Rotas protegidas
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}
```

### Validação de Dados

```typescript
// Sempre validar com Zod antes de salvar
import { z } from 'zod';

const clientSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  monthly_value: z.number().positive(),
  due_day: z.number().min(1).max(31),
});

// Na API Route
const validated = clientSchema.parse(body);
```

---

## 📊 Métricas e Monitoramento

### Logs Estruturados

```typescript
// Padrão de log
console.error('[CONTEXT] Description', { 
  error, 
  userId, 
  timestamp: new Date().toISOString() 
});

// Exemplos
console.error('[API /clients POST] Failed to create client', { error });
console.error('[useClients] Fetch failed', { error, retryCount });
```

### Performance

- Server Components para reduzir JavaScript
- Lazy loading de componentes pesados
- Image optimization com next/image
- Memoização estratégica

---

*Este documento deve ser consultado sempre que houver dúvidas sobre a arquitetura do projeto.*
