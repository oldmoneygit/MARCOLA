# Sistema de Equipe - MARCOLA

> Documentação completa do sistema de gestão de equipe, convites e permissões.

---

## Visão Geral

O sistema de equipe permite que o **owner** (dono da conta) adicione membros à sua equipe, envie convites por email, e controle o acesso de cada membro através de permissões granulares.

### Tipos de Usuário

| Tipo | Descrição |
|------|-----------|
| **Owner** | Dono da conta. Tem acesso total a todas as funcionalidades. |
| **Team Member** | Membro convidado. Acesso controlado por permissões. |

---

## Arquitetura

### Tabelas do Banco de Dados

```sql
-- Membros da equipe
team_members (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id),      -- Dono da conta
  user_id UUID REFERENCES auth.users(id),       -- Usuário vinculado (após aceitar convite)
  name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  specialties TEXT[],
  color TEXT DEFAULT '#8b5cf6',
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  invite_status TEXT CHECK (invite_status IN ('not_invited', 'pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Convites para membros
team_invitations (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id),
  team_member_id UUID REFERENCES team_members(id),
  email TEXT,
  token TEXT UNIQUE,                            -- Token único para aceitar convite
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Políticas RLS (Row Level Security)

```sql
-- team_members: Owner pode gerenciar, membro pode ver seus dados
"Users can view their own team members" - SELECT: owner_id = auth.uid() OR auth_user_id = auth.uid()
"Public can view team members with pending invitations" - SELECT: id IN (SELECT team_member_id FROM team_invitations WHERE status = 'pending')

-- team_invitations: Owner pode gerenciar, público pode ler por token
"team_invitations_owner_all" - ALL: owner_id = auth.uid()
"team_invitations_view_by_token" - SELECT: true (para aceitar convites)
```

---

## Funções (Roles)

### Configuração de Funções

| Função | Descrição | Permissões Padrão |
|--------|-----------|-------------------|
| **Admin** | Acesso total ao sistema | Todas as permissões |
| **Manager** | Gerencia equipe e clientes | Todas as permissões |
| **Member** | Executa tarefas atribuídas | Visualiza clientes/relatórios, gerencia tarefas |
| **Viewer** | Apenas visualização | Apenas visualização de clientes/relatórios |

### Permissões Granulares

```typescript
interface TeamPermissions {
  can_view_clients: boolean;    // Ver lista de clientes
  can_edit_clients: boolean;    // Editar dados de clientes
  can_view_reports: boolean;    // Ver relatórios
  can_edit_reports: boolean;    // Editar/importar relatórios
  can_view_financial: boolean;  // Ver dados financeiros
  can_manage_tasks: boolean;    // Gerenciar tarefas
  can_assign_tasks: boolean;    // Atribuir tarefas a outros
}
```

### Mapeamento Permissões → Rotas

| Rota | Permissão Necessária |
|------|---------------------|
| `/dashboard` | Sempre acessível |
| `/clients` | `can_view_clients` |
| `/tasks` | `can_manage_tasks` |
| `/calendar` | `can_manage_tasks` |
| `/reports` | `can_view_reports` |
| `/analysis` | `can_view_reports` |
| `/templates` | `can_manage_tasks` |
| `/team` | Apenas owners |
| `/financial` | `can_view_financial` |

---

## Sistema de Convites

### Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FLUXO DE CONVITE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. OWNER CRIA MEMBRO                                                    │
│     └── POST /api/team                                                   │
│         └── Cria registro em team_members (invite_status: 'not_invited') │
│                                                                          │
│  2. OWNER ENVIA CONVITE                                                  │
│     └── POST /api/invitations                                            │
│         ├── Gera token único                                             │
│         ├── Cria registro em team_invitations                            │
│         ├── Atualiza team_members.invite_status para 'pending'           │
│         └── Envia email via Resend com link do convite                   │
│                                                                          │
│  3. MEMBRO RECEBE EMAIL                                                  │
│     └── Link: https://app.com/invite/{token}                             │
│                                                                          │
│  4. MEMBRO ACESSA PÁGINA DE CONVITE                                      │
│     └── GET /api/invitations/{token}                                     │
│         └── Retorna dados do convite e do membro                         │
│                                                                          │
│  5. MEMBRO CRIA CONTA                                                    │
│     └── POST /api/invitations/accept                                     │
│         ├── Cria usuário no Supabase Auth                                │
│         ├── Vincula user_id ao team_member                               │
│         ├── Atualiza invite_status para 'accepted'                       │
│         └── Redireciona para /dashboard                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Estados do Convite

| Status | Descrição | Ação Disponível |
|--------|-----------|-----------------|
| `not_invited` | Membro criado, sem convite | Enviar convite |
| `pending` | Convite enviado, aguardando | Reenviar convite |
| `accepted` | Conta criada com sucesso | - |
| `expired` | Convite expirou (7 dias) | Reenviar convite |

---

## Integração com Email (Resend)

### Configuração

```env
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=convites@seudominio.com
```

### Verificação de Domínio

1. Acesse [Resend Dashboard](https://resend.com/domains)
2. Adicione seu domínio
3. Configure os registros DNS conforme instruções
4. Aguarde verificação (geralmente alguns minutos)

### Template de Email

O email de convite inclui:
- Nome do membro convidado
- Nome do owner (quem convidou)
- Função atribuída
- Botão "Aceitar Convite"
- Link alternativo para copiar
- Aviso de expiração (7 dias)

---

## API Routes

### Equipe

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/team` | Lista membros da equipe |
| POST | `/api/team` | Cria novo membro |
| PUT | `/api/team` | Atualiza membro |
| DELETE | `/api/team?id={id}` | Remove membro |

### Convites

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/invitations` | Lista convites do owner |
| POST | `/api/invitations` | Envia novo convite |
| GET | `/api/invitations/{token}` | Busca convite por token (público) |
| DELETE | `/api/invitations/{token}` | Cancela convite |
| POST | `/api/invitations/resend` | Reenvia convite |
| POST | `/api/invitations/accept` | Aceita convite e cria conta |

---

## Componentes React

### Hooks

#### `useCurrentUser`

Identifica o tipo de usuário atual e suas permissões.

```typescript
import { useCurrentUser } from '@/hooks';

function MyComponent() {
  const {
    data,           // CurrentUserData | null
    loading,        // boolean
    error,          // string | null
    hasPermission,  // (permission: keyof TeamPermissions) => boolean
    canAccessRoute, // (routeId: string) => boolean
    refresh         // () => Promise<void>
  } = useCurrentUser();

  if (data?.isOwner) {
    // Usuário é owner
  }

  if (data?.isTeamMember) {
    // Usuário é membro da equipe
    console.log(data.permissions);
    console.log(data.teamMember);
  }

  // Verificar permissão específica
  if (hasPermission('can_edit_clients')) {
    // Pode editar clientes
  }

  // Verificar acesso a rota
  if (canAccessRoute('financial')) {
    // Pode acessar /financial
  }
}
```

#### `useTeam`

Gerencia membros da equipe.

```typescript
import { useTeam } from '@/hooks';

function TeamManager() {
  const {
    members,           // TeamMember[]
    loading,           // boolean
    error,             // string | null
    createMember,      // (data: CreateTeamMemberDTO) => Promise<TeamMember>
    updateMember,      // (id: string, data: UpdateTeamMemberDTO) => Promise<TeamMember>
    deleteMember,      // (id: string) => Promise<void>
    toggleMemberActive,// (id: string) => Promise<void>
    fetchMembers,      // () => Promise<void>
    activeMembers,     // TeamMember[]
    membersByRole,     // Record<TeamRole, TeamMember[]>
    totalMembers,      // number
  } = useTeam();
}
```

### Componentes de UI

| Componente | Descrição |
|------------|-----------|
| `TeamPageContent` | Página principal de gestão de equipe |
| `TeamMemberCard` | Card individual de membro |
| `TeamMemberModal` | Modal para criar/editar membro |
| `TeamMemberAvatar` | Avatar com iniciais coloridas |
| `AcceptInvitePage` | Página de aceite de convite |

### Sidebar com Permissões

A Sidebar filtra automaticamente os itens de navegação baseado nas permissões do usuário:

```typescript
// src/components/layout/Sidebar.tsx
const filteredNavItems = useMemo(() => {
  if (!currentUser) return NAV_ITEMS;
  if (currentUser.isOwner) return NAV_ITEMS;
  return NAV_ITEMS.filter(item => canAccessRoute(item.id));
}, [currentUser, canAccessRoute]);
```

---

## Tipos TypeScript

### Principais Tipos

```typescript
// Função do membro
type TeamRole = 'admin' | 'manager' | 'member' | 'viewer';

// Status do convite
type InviteStatus = 'not_invited' | 'pending' | 'accepted' | 'expired';

// Membro da equipe
interface TeamMember {
  id: string;
  owner_id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: TeamRole;
  specialties: string[];
  color: string;
  permissions: TeamPermissions;
  is_active: boolean;
  invite_status: InviteStatus;
  created_at: string;
  updated_at: string;
}

// Dados do usuário atual
interface CurrentUserData {
  userId: string;
  email: string;
  name: string;
  userType: 'owner' | 'team_member' | 'unknown';
  isOwner: boolean;
  isTeamMember: boolean;
  ownerId: string | null;
  teamMember: TeamMember | null;
  permissions: TeamPermissions;
}
```

---

## Especialidades

Membros podem ter especialidades para facilitar atribuição de tarefas:

| Valor | Label |
|-------|-------|
| `criativos` | Criativos |
| `copywriting` | Copywriting |
| `gestao_campanhas` | Gestão de Campanhas |
| `analise_dados` | Análise de Dados |
| `atendimento` | Atendimento |
| `estrategia` | Estratégia |
| `design` | Design |
| `video` | Vídeo |
| `social_media` | Social Media |

---

## Segurança

### Proteções Implementadas

1. **RLS no Supabase**: Todas as tabelas têm políticas de segurança
2. **Validação de Token**: Tokens de convite são únicos e expiram em 7 dias
3. **Verificação de Ownership**: APIs verificam se o usuário é owner antes de permitir ações
4. **Permissões Granulares**: Cada ação é verificada contra as permissões do membro

### Boas Práticas

- Nunca expor o token de convite em logs
- Validar permissões tanto no frontend quanto no backend
- Usar `maybeSingle()` ao buscar registros únicos para evitar erros
- Sempre verificar `authError` antes de prosseguir com operações

---

## Troubleshooting

### Convite não aparece no email

1. Verificar se `RESEND_API_KEY` está configurada
2. Verificar se `RESEND_FROM_EMAIL` é um email válido do domínio verificado
3. Checar logs do servidor para erros de envio

### Membro não consegue acessar

1. Verificar se `invite_status` é `'accepted'`
2. Verificar se `user_id` está vinculado ao `team_member`
3. Checar permissões no campo `permissions`

### Página de convite retorna 404

1. Verificar políticas RLS em `team_invitations` e `team_members`
2. Confirmar que existe política para leitura pública por token
3. Verificar se o convite não expirou ou foi cancelado

---

## Arquivos Principais

```
src/
├── app/
│   ├── (dashboard)/team/page.tsx       # Página de equipe
│   ├── api/
│   │   ├── team/route.ts               # CRUD de membros
│   │   └── invitations/
│   │       ├── route.ts                # Lista/cria convites
│   │       ├── [token]/route.ts        # Busca/cancela por token
│   │       ├── resend/route.ts         # Reenvia convite
│   │       └── accept/route.ts         # Aceita convite
│   └── invite/[token]/page.tsx         # Página de aceite
├── components/
│   ├── team/
│   │   ├── index.ts
│   │   ├── TeamPageContent.tsx
│   │   ├── TeamMemberCard.tsx
│   │   ├── TeamMemberModal.tsx
│   │   └── TeamMemberAvatar.tsx
│   ├── invite/
│   │   └── AcceptInvitePage.tsx
│   └── layout/
│       └── Sidebar.tsx                 # Filtro de navegação
├── hooks/
│   ├── useTeam.ts
│   └── useCurrentUser.ts               # Identifica tipo de usuário
├── lib/
│   └── email.ts                        # Serviço de email (Resend)
└── types/
    └── team.ts                         # Tipos e constantes
```

---

*Última atualização: Dezembro 2024*
