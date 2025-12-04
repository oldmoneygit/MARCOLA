# TEAM_INVITATIONS.md - Sistema de Convites de Equipe

---

## 📋 Visão Geral

O sistema de convites permite que o proprietário de uma conta convide membros da equipe para acessar a plataforma MARCOLA. Cada membro convidado recebe um link único de convite que permite criar sua própria conta e ser automaticamente vinculado à equipe.

### Fluxo do Convite

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUXO DE CONVITE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CRIAR MEMBRO                                                 │
│     └── Owner cadastra membro (nome, email, role)               │
│         └── Status: "Não convidado"                              │
│                                                                  │
│  2. ENVIAR CONVITE                                               │
│     └── Owner clica "Enviar Convite"                             │
│         └── Sistema gera token único (expira em 7 dias)         │
│         └── Link é exibido para compartilhamento                 │
│         └── Status: "Convite pendente"                           │
│                                                                  │
│  3. ACEITAR CONVITE                                              │
│     └── Membro acessa /invite/[token]                            │
│         └── Cria senha                                           │
│         └── Conta criada no Supabase Auth                        │
│         └── Vinculado ao team_member                             │
│         └── Status: "Conta ativa"                                │
│                                                                  │
│  4. ACESSO                                                       │
│     └── Membro faz login com email/senha                         │
│         └── Acesso conforme role (admin/manager/member/viewer)   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Schema do Banco de Dados

### Tabela: `team_invitations`

Armazena os convites enviados.

```sql
CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE UNIQUE INDEX idx_team_invitations_token ON team_invitations(token);
CREATE INDEX idx_team_invitations_owner ON team_invitations(owner_id);
CREATE INDEX idx_team_invitations_member ON team_invitations(team_member_id);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);
```

### Alterações em `team_members`

Novos campos adicionados:

```sql
ALTER TABLE team_members
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN invite_status TEXT DEFAULT 'not_invited'
    CHECK (invite_status IN ('not_invited', 'pending', 'accepted', 'expired'));

-- Índice para user_id
CREATE INDEX idx_team_members_user ON team_members(user_id);
```

### Funções PostgreSQL

#### Gerar Token de Convite

```sql
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
DECLARE
    token TEXT;
BEGIN
    token := encode(gen_random_bytes(32), 'hex');
    RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Aceitar Convite

```sql
CREATE OR REPLACE FUNCTION accept_team_invitation(p_token TEXT, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_invitation RECORD;
    v_member RECORD;
BEGIN
    -- Buscar convite válido
    SELECT * INTO v_invitation
    FROM team_invitations
    WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();

    IF v_invitation IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Convite inválido ou expirado');
    END IF;

    -- Atualizar convite
    UPDATE team_invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        updated_at = NOW()
    WHERE id = v_invitation.id;

    -- Vincular user ao team_member
    UPDATE team_members
    SET user_id = p_user_id,
        invite_status = 'accepted',
        updated_at = NOW()
    WHERE id = v_invitation.team_member_id
    RETURNING * INTO v_member;

    RETURN json_build_object(
        'success', true,
        'member', row_to_json(v_member)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS Policies

```sql
-- Policies para team_invitations
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Owner pode ver e gerenciar seus convites
CREATE POLICY "Owner can manage invitations"
    ON team_invitations FOR ALL
    USING (auth.uid() = owner_id);

-- Qualquer um pode verificar convite por token (para aceitar)
CREATE POLICY "Anyone can view invitation by token"
    ON team_invitations FOR SELECT
    USING (true);
```

---

## 📊 Types TypeScript

```typescript
// src/types/team.ts

/**
 * Status do convite no membro
 */
export type InviteStatus = 'not_invited' | 'pending' | 'accepted' | 'expired';

/**
 * Status do convite na tabela de convites
 */
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

/**
 * Interface do membro da equipe (atualizada)
 */
export interface TeamMember {
  id: string;
  owner_id: string;
  user_id: string | null;          // ID do usuário vinculado (após aceitar convite)
  auth_user_id: string | null;     // Legacy
  name: string;
  email: string;
  phone?: string;
  role: TeamRole;
  color: string;
  avatar_url?: string;
  specialties?: string[];
  is_active: boolean;
  invite_status: InviteStatus;     // Status do convite
  created_at: string;
  updated_at: string;
}

/**
 * Interface do convite
 */
export interface TeamInvitation {
  id: string;
  owner_id: string;
  team_member_id: string;
  email: string;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
  team_member?: TeamMember;
}

/**
 * DTO para enviar convite
 */
export interface SendInvitationDTO {
  team_member_id: string;
}

/**
 * DTO para aceitar convite
 */
export interface AcceptInvitationDTO {
  token: string;
  password: string;
  name?: string;
}

/**
 * Resposta ao aceitar convite
 */
export interface AcceptInvitationResponse {
  success: boolean;
  member?: TeamMember;
  error?: string;
  requires_login?: boolean;
}

/**
 * Configuração visual dos status de convite
 */
export const INVITE_STATUS_CONFIG: Record<InviteStatus, {
  label: string;
  bgColor: string;
  textColor: string;
  icon: string;
}> = {
  not_invited: {
    label: 'Não convidado',
    bgColor: 'bg-zinc-500/20',
    textColor: 'text-zinc-400',
    icon: 'user-x',
  },
  pending: {
    label: 'Convite pendente',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    icon: 'clock',
  },
  accepted: {
    label: 'Conta ativa',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    icon: 'check-circle',
  },
  expired: {
    label: 'Convite expirado',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    icon: 'x-circle',
  },
};
```

---

## 🔌 API Routes

### Estrutura

```
src/app/api/invitations/
├── route.ts              # GET (listar), POST (enviar convite)
├── [token]/
│   └── route.ts          # GET (verificar), DELETE (cancelar)
├── accept/
│   └── route.ts          # POST (aceitar convite)
└── resend/
    └── route.ts          # POST (reenviar convite)
```

### Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/invitations` | Lista convites do owner |
| POST | `/api/invitations` | Envia convite para membro |
| GET | `/api/invitations/[token]` | Verifica convite (público) |
| DELETE | `/api/invitations/[token]` | Cancela convite |
| POST | `/api/invitations/accept` | Aceita convite e cria conta |
| POST | `/api/invitations/resend` | Reenvia convite (gera novo token) |

### Detalhes das APIs

#### POST `/api/invitations`

Envia um convite para um membro da equipe.

**Request:**
```json
{
  "team_member_id": "uuid-do-membro"
}
```

**Response (200):**
```json
{
  "invitation": {
    "id": "uuid",
    "owner_id": "uuid",
    "team_member_id": "uuid",
    "email": "membro@email.com",
    "token": "token-unico-64-chars",
    "status": "pending",
    "expires_at": "2024-01-07T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "invite_link": "https://app.marcola.com/invite/token-unico-64-chars"
}
```

#### GET `/api/invitations/[token]`

Verifica se um convite é válido.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "membro@email.com",
  "status": "pending",
  "expires_at": "2024-01-07T00:00:00Z",
  "is_valid": true,
  "team_member": {
    "id": "uuid",
    "name": "Nome do Membro",
    "role": "manager"
  }
}
```

**Response (404 - Inválido):**
```json
{
  "is_valid": false,
  "message": "Convite expirado ou já utilizado",
  "status": "expired"
}
```

#### POST `/api/invitations/accept`

Aceita o convite e cria a conta do usuário.

**Request:**
```json
{
  "token": "token-do-convite",
  "password": "senha-do-usuario",
  "name": "Nome Completo"
}
```

**Response (200):**
```json
{
  "success": true,
  "member": {
    "id": "uuid",
    "name": "Nome Completo",
    "email": "membro@email.com",
    "role": "manager",
    "invite_status": "accepted"
  }
}
```

**Response (400 - Email já existe):**
```json
{
  "error": "Já existe uma conta com este email",
  "requires_login": true
}
```

---

## 🎨 Componentes

### Estrutura de Pastas

```
src/components/
├── invite/
│   ├── AcceptInvitePage.tsx    # Página completa de aceite
│   └── index.ts                # Barrel export
└── team/
    ├── TeamMemberCard.tsx      # Card com ações de convite
    └── TeamPageContent.tsx     # Página com handlers de convite
```

### AcceptInvitePage

Página exibida quando o membro acessa `/invite/[token]`.

**Estados:**
1. **Loading** - Verificando convite
2. **Inválido** - Token não existe
3. **Expirado** - Convite expirou (pode solicitar novo)
4. **Válido** - Formulário de criação de conta
5. **Sucesso** - Conta criada, redirecionando

**Campos do formulário:**
- Email (readonly, vindo do convite)
- Nome completo (pré-preenchido)
- Senha (mínimo 6 caracteres)
- Confirmar senha

### TeamMemberCard

Card atualizado com indicadores de status de convite.

**Props adicionadas:**
```typescript
interface TeamMemberCardProps {
  member: TeamMember;
  onEdit?: (member: TeamMember) => void;
  onDelete?: (member: TeamMember) => void;
  onToggleActive?: (member: TeamMember) => void;
  onSendInvite?: (member: TeamMember) => Promise<{ invite_link: string } | null>;
  onResendInvite?: (member: TeamMember) => Promise<{ invite_link: string } | null>;
  compact?: boolean;
}
```

**Badges de status exibidos:**
- "Conta ativa" (verde) - Membro com acesso
- "Convite pendente" (amarelo) - Aguardando aceite
- "Convite expirado" (vermelho) - Precisa reenviar
- "Sem acesso" (cinza) - Nunca convidado

**Ações no menu:**
- "Enviar Convite" - Para membros não convidados
- "Reenviar Convite" - Para pendentes/expirados

---

## 📱 Página de Convite

### Rota

```
src/app/invite/[token]/page.tsx
```

### URL de Exemplo

```
https://app.marcola.com/invite/a1b2c3d4e5f6...
```

### Fluxo de Telas

```
┌─────────────────────────────────────────┐
│           MARCOLA                        │
│     Você foi convidado para              │
│     fazer parte da equipe                │
├─────────────────────────────────────────┤
│                                          │
│  Bem-vindo, João Silva!                  │
│  Crie sua senha para acessar como        │
│  Gerente.                                │
│                                          │
│  Email                                   │
│  ┌─────────────────────────────────┐    │
│  │ joao@empresa.com (readonly)     │    │
│  └─────────────────────────────────┘    │
│                                          │
│  Nome completo                           │
│  ┌─────────────────────────────────┐    │
│  │ João Silva                      │    │
│  └─────────────────────────────────┘    │
│                                          │
│  Criar senha                             │
│  ┌─────────────────────────────────┐    │
│  │ ********                    👁 │    │
│  └─────────────────────────────────┘    │
│                                          │
│  Confirmar senha                         │
│  ┌─────────────────────────────────┐    │
│  │ ********                        │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │    Criar conta e acessar        │    │
│  └─────────────────────────────────┘    │
│                                          │
│  Já tem uma conta? Faça login            │
│                                          │
└─────────────────────────────────────────┘
```

---

## 🔐 Segurança

### Tokens

- Gerados com `gen_random_bytes(32)` + `encode(..., 'hex')`
- 64 caracteres hexadecimais
- Únicos por constraint do banco
- Expiram em 7 dias

### Validações

1. **Ao enviar convite:**
   - Verifica se membro pertence ao owner
   - Verifica se membro não tem user_id
   - Verifica se não existe convite pendente

2. **Ao aceitar convite:**
   - Verifica se token é válido
   - Verifica se não expirou
   - Verifica se email não existe no Auth
   - Se email existe, retorna `requires_login: true`

3. **RLS Policies:**
   - Owner só vê/gerencia seus convites
   - Qualquer um pode verificar token (GET por token)
   - Apenas owner pode cancelar

---

## ✅ Validações Executadas

### TypeScript
```bash
npm run type-check
# ✅ Sem erros
```

### ESLint
```bash
npm run lint
# ✅ Sem warnings ou erros
```

### Build
```bash
npm run build
# ✅ Compiled successfully
# ✅ Generating static pages (34/34)
```

---

## 📝 Arquivos Criados/Modificados

### Database (via MCP)
- `006_create_team_invitations_system.sql` - Migration completa

### Types
- `src/types/team.ts` - Tipos de convite adicionados

### API Routes
- `src/app/api/invitations/route.ts` - GET, POST
- `src/app/api/invitations/[token]/route.ts` - GET, DELETE
- `src/app/api/invitations/accept/route.ts` - POST
- `src/app/api/invitations/resend/route.ts` - POST

### Pages
- `src/app/invite/[token]/page.tsx` - Página de aceite

### Components
- `src/components/invite/AcceptInvitePage.tsx` - UI de aceite
- `src/components/invite/index.ts` - Barrel export
- `src/components/team/TeamMemberCard.tsx` - Ações de convite
- `src/components/team/TeamPageContent.tsx` - Handlers de convite

### Constants
- `src/lib/constants.ts` - Rotas REGISTER e INVITE

---

## 🚀 Como Usar

### 1. Criar um Membro

Na página de Equipe, clique em "Novo Membro" e preencha:
- Nome
- Email
- Função (Admin, Gerente, Membro, Visualizador)

### 2. Enviar Convite

No card do membro criado:
1. Clique no menu (⋮)
2. Selecione "Enviar Convite"
3. O link será gerado e exibido
4. Copie e envie para o membro

### 3. Aceitar Convite

O membro:
1. Acessa o link recebido
2. Define uma senha
3. Confirma a senha
4. Clica em "Criar conta e acessar"
5. É redirecionado para o login

### 4. Login

O membro faz login com:
- Email cadastrado
- Senha definida no aceite

---

## 🔄 Status do Convite

| Status | Descrição | Ação Possível |
|--------|-----------|---------------|
| not_invited | Membro sem convite enviado | Enviar Convite |
| pending | Convite enviado, aguardando | Reenviar Convite |
| accepted | Conta criada, acesso ativo | - |
| expired | Convite expirado (7+ dias) | Reenviar Convite |

---

*Última atualização: Dezembro 2024*
