# WORKFLOW.md - Workflow de Desenvolvimento

---

## 📋 Sumário

1. [Setup Inicial](#setup-inicial)
2. [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
3. [Padrões de Código](#padrões-de-código)
4. [Git Workflow](#git-workflow)
5. [Testes e Validação](#testes-e-validação)
6. [Deploy](#deploy)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Setup Inicial

### Pré-requisitos

```bash
# Verificar versões
node -v  # >= 18.x
npm -v   # >= 9.x
git --version
```

### Clone e Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/user/traffichub.git
cd traffichub

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Configure o Supabase
# - Crie um projeto no supabase.com
# - Execute as migrations (supabase/migrations/*.sql)
# - Configure RLS policies

# 5. Rode o projeto
npm run dev

# 6. Abra http://localhost:3000
```

### Estrutura de .env.local

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=TrafficHub

# Optional: Analytics, etc
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 🔄 Fluxo de Desenvolvimento

### Iniciando uma Nova Feature

```bash
# 1. Atualize a branch main
git checkout main
git pull origin main

# 2. Crie uma branch para a feature
git checkout -b feat/nome-da-feature

# 3. Desenvolva...

# 4. Valide
npm run type-check
npm run lint
npm run build

# 5. Commit
git add .
git commit -m "feat(scope): description"

# 6. Push
git push origin feat/nome-da-feature

# 7. Abra um PR
```

### Checklist por Etapa

#### Antes de Começar
- [ ] Ler documentação relevante (COMPONENTS.md, API.md, etc)
- [ ] Entender o escopo da feature
- [ ] Identificar componentes necessários
- [ ] Planejar a estrutura de arquivos

#### Durante o Desenvolvimento
- [ ] Criar types/interfaces primeiro
- [ ] Seguir padrões de nomenclatura
- [ ] Comentar código complexo
- [ ] Implementar tratamento de erros
- [ ] Implementar loading/empty states

#### Antes de Commitar
- [ ] `npm run type-check` passa
- [ ] `npm run lint` passa
- [ ] `npm run build` passa
- [ ] Código formatado (Prettier)
- [ ] Sem console.log (exceto erros)
- [ ] Documentação atualizada se necessário

---

## 📝 Padrões de Código

### Estrutura de Arquivo

```typescript
/**
 * @file NomeArquivo.tsx
 * @description Descrição breve
 * @module components/categoria
 */

'use client'; // Se necessário

// 1. Imports React/Next
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// 2. Imports de bibliotecas
import { format } from 'date-fns';
import { z } from 'zod';

// 3. Imports internos - Componentes
import { GlassCard, Button } from '@/components/ui';

// 4. Imports internos - Hooks
import { useClients } from '@/hooks';

// 5. Imports internos - Types
import type { Client } from '@/types';

// 6. Imports internos - Utils
import { formatCurrency } from '@/lib/utils';

// 7. Types locais
interface Props {
  initialData?: Client;
  onSubmit: (data: Client) => Promise<void>;
}

// 8. Schemas de validação (se necessário)
const schema = z.object({
  name: z.string().min(2),
});

// 9. Constantes locais
const DEFAULT_PAGE_SIZE = 10;

// 10. Componente
export function NomeComponente({ initialData, onSubmit }: Props) {
  // Estados
  const [loading, setLoading] = useState(false);
  
  // Hooks
  const router = useRouter();
  const { clients } = useClients();
  
  // Memos
  const sortedClients = useMemo(() => 
    clients.sort((a, b) => a.name.localeCompare(b.name)),
    [clients]
  );
  
  // Callbacks
  const handleSubmit = useCallback(async () => {
    setLoading(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('[NomeComponente] Submit error:', error);
    } finally {
      setLoading(false);
    }
  }, [onSubmit]);
  
  // Effects
  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, []);
  
  // Early returns
  if (loading) return <Loading />;
  if (!clients.length) return <EmptyState />;
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Nomenclatura

```typescript
// Componentes: PascalCase
export function ClientCard() {}

// Hooks: camelCase com "use"
export function useClients() {}

// Funções: camelCase
function calculateCPA() {}

// Constantes: UPPER_SNAKE_CASE
const MAX_CLIENTS = 100;

// Types/Interfaces: PascalCase
interface ClientFormData {}
type ClientStatus = 'active' | 'inactive';

// Arquivos de componente: PascalCase.tsx
ClientCard.tsx

// Arquivos de hook: camelCase.ts
useClients.ts

// Arquivos de util: camelCase.ts
formatCurrency.ts
```

### JSDoc

```typescript
/**
 * Calcula o CPA (Custo por Aquisição)
 * 
 * @param spend - Valor total gasto
 * @param conversions - Número de conversões
 * @returns CPA calculado ou 0 se não houver conversões
 * 
 * @example
 * const cpa = calculateCPA(1000, 50); // 20
 */
function calculateCPA(spend: number, conversions: number): number {
  if (conversions === 0) return 0;
  return spend / conversions;
}
```

---

## 🌿 Git Workflow

### Branches

```
main                    # Produção
├── develop             # Desenvolvimento (opcional)
├── feat/nova-feature   # Nova funcionalidade
├── fix/bug-description # Correção de bug
├── docs/update-readme  # Documentação
└── refactor/clean-code # Refatoração
```

### Commits Semânticos

```
<type>(<scope>): <description>

[body opcional]

[footer opcional]
```

**Types:**
- `feat`: Nova feature
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não altera lógica)
- `refactor`: Refatoração
- `perf`: Performance
- `test`: Testes
- `chore`: Manutenção

**Exemplos:**
```bash
git commit -m "feat(clients): add client creation form"
git commit -m "fix(reports): correct CPA calculation for zero conversions"
git commit -m "docs(readme): update installation instructions"
git commit -m "refactor(hooks): extract common logic to useQuery"
git commit -m "style: format code with prettier"
git commit -m "chore: update dependencies"
```

### Pull Request

**Título:** `feat(scope): description`

**Descrição:**
```markdown
## O que foi feito
- Adicionado formulário de criação de cliente
- Implementada validação com Zod
- Adicionado feedback visual de loading/error

## Screenshots (se aplicável)
[imagens]

## Checklist
- [x] TypeScript sem erros
- [x] ESLint sem warnings
- [x] Build passa
- [x] Documentação atualizada

## Notas
Qualquer observação adicional.
```

---

## ✅ Testes e Validação

### Scripts Disponíveis

```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Build
npm run build

# Testes (quando implementados)
npm run test
npm run test:watch
npm run test:coverage
```

### ESLint Config

```javascript
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "no-console": ["warn", { "allow": ["error", "warn"] }],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### Prettier Config

```javascript
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### Validação Antes do Commit

```bash
# Script de validação completa
npm run validate

# package.json
{
  "scripts": {
    "validate": "npm run type-check && npm run lint && npm run build"
  }
}
```

---

## 🚢 Deploy

### Vercel (Recomendado)

```bash
# 1. Conecte o repositório na Vercel
# 2. Configure variáveis de ambiente
# 3. Deploy automático em cada push para main
```

**Variáveis no Vercel:**
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=https://traffichub.vercel.app
```

### Manual

```bash
# Build
npm run build

# Start (produção)
npm run start
```

### Preview Deployments

Cada PR gera um deploy de preview automático na Vercel.

---

## 🔧 Troubleshooting

### Erro: TypeScript não encontra módulos

```bash
# Verifique tsconfig.json paths
# Limpe cache
rm -rf .next
npm run dev
```

### Erro: Supabase connection

```bash
# Verifique .env.local
# Verifique se as variáveis estão com NEXT_PUBLIC_
# Verifique RLS policies no Supabase
```

### Erro: Build falha

```bash
# Verifique erros de TypeScript
npm run type-check

# Verifique erros de lint
npm run lint

# Limpe cache e reinstale
rm -rf .next node_modules
npm install
npm run build
```

### Erro: Hydration mismatch

```bash
# Verifique se está usando 'use client' onde necessário
# Verifique se não há diferença entre server e client render
# Evite usar Date/Math.random diretamente no render
```

### Erro: RLS Policy

```sql
-- Verifique se o usuário está autenticado
-- Verifique a policy no Supabase
-- Teste com o SQL Editor

SELECT * FROM clients WHERE user_id = auth.uid();
```

---

## 📋 Comandos Úteis

```bash
# Desenvolvimento
npm run dev               # Inicia dev server
npm run build             # Build de produção
npm run start             # Inicia produção local
npm run lint              # Verifica linting
npm run lint:fix          # Corrige linting
npm run type-check        # Verifica TypeScript

# Supabase
npx supabase login        # Login
npx supabase db push      # Push migrations
npx supabase gen types    # Gera types do DB

# Git
git status                # Status
git log --oneline -10     # Últimos commits
git diff                  # Ver mudanças
git stash                 # Guardar mudanças
git stash pop             # Recuperar mudanças

# NPM
npm outdated              # Pacotes desatualizados
npm update                # Atualizar pacotes
npm audit                 # Verificar vulnerabilidades
npm audit fix             # Corrigir vulnerabilidades
```

---

## 📊 Métricas de Qualidade

### Objetivos

- **TypeScript Coverage**: 100% (sem `any`)
- **ESLint Errors**: 0
- **ESLint Warnings**: < 5
- **Build Time**: < 60s
- **Bundle Size**: < 500KB (First Load JS)

### Monitoramento

```bash
# Bundle analyzer
npm run build
npm run analyze

# Lighthouse
npx lighthouse https://traffichub.vercel.app
```

---

*Siga este workflow para manter a qualidade e consistência do código.*
