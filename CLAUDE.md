# CLAUDE.md - Regras e Diretrizes para Claude Code

> **LEIA ESTE ARQUIVO PRIMEIRO** - Este documento contém as regras fundamentais que devem ser seguidas em TODAS as interações com este projeto.

---

## 🎯 OBJETIVO DO PROJETO

**TrafficHub** é um sistema de gestão interna para agências de tráfego pago. O sistema permite:
- Gerenciar clientes e suas informações
- Importar e visualizar relatórios de performance de anúncios
- Gerar sugestões inteligentes baseadas em dados
- Controlar cobranças e financeiro
- Enviar lembretes de pagamento via WhatsApp

---

## 🚨 REGRAS OBRIGATÓRIAS

### 1. Validação Contínua
Após CADA modificação de código, você DEVE:

```bash
# 1. Verificar erros de TypeScript
npm run type-check

# 2. Verificar linting
npm run lint

# 3. Fazer build de teste
npm run build

# 4. Se houver testes, executar
npm run test
```

**NUNCA** entregue código sem executar essas validações. Se qualquer comando falhar, corrija ANTES de prosseguir.

### 2. Commits Semânticos
Todos os commits devem seguir o padrão:

```
<type>(<scope>): <description>

[optional body]
```

**Types permitidos:**
- `feat`: Nova feature
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não altera lógica)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Tarefas de manutenção

**Exemplos:**
```
feat(clients): add client creation form
fix(reports): correct CPA calculation
docs(readme): update installation steps
```

### 3. Estrutura de Código

#### 3.1 Imports - Ordem Obrigatória
```typescript
// 1. React e Next.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Bibliotecas externas
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

// 3. Componentes internos
import { GlassCard } from '@/components/ui/GlassCard';
import { MetricCard } from '@/components/ui/MetricCard';

// 4. Hooks customizados
import { useClients } from '@/hooks/useClients';

// 5. Types e interfaces
import type { Client, Report } from '@/types';

// 6. Utils e constants
import { formatCurrency } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

// 7. Styles (se necessário)
import styles from './Component.module.css';
```

#### 3.2 Nomenclatura
| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `ClientCard.tsx` |
| Hooks | camelCase com "use" | `useClients.ts` |
| Utils | camelCase | `formatCurrency.ts` |
| Types | PascalCase | `Client`, `Report` |
| Constants | UPPER_SNAKE_CASE | `API_URL`, `MAX_CLIENTS` |
| Arquivos de página | kebab-case | `client-details/page.tsx` |
| CSS Modules | camelCase | `styles.cardContainer` |

#### 3.3 Comentários Obrigatórios
Todo arquivo deve ter um header comment:

```typescript
/**
 * @file ClientCard.tsx
 * @description Componente de card para exibição de informações do cliente
 * @module components/clients
 * 
 * @example
 * <ClientCard client={clientData} onEdit={handleEdit} />
 */
```

Funções complexas devem ter JSDoc:

```typescript
/**
 * Calcula o CPA (Custo por Aquisição) baseado nos dados do relatório
 * @param spend - Valor total gasto em anúncios
 * @param conversions - Número total de conversões
 * @returns CPA calculado ou 0 se não houver conversões
 */
function calculateCPA(spend: number, conversions: number): number {
  if (conversions === 0) return 0;
  return spend / conversions;
}
```

### 4. Tratamento de Erros

SEMPRE use try-catch em operações assíncronas:

```typescript
// ✅ CORRETO
async function fetchClients() {
  try {
    const { data, error } = await supabase.from('clients').select('*');
    
    if (error) {
      console.error('[fetchClients] Supabase error:', error);
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('[fetchClients] Unexpected error:', error);
    throw error;
  }
}

// ❌ INCORRETO
async function fetchClients() {
  const { data } = await supabase.from('clients').select('*');
  return data;
}
```

### 5. Estado e Performance

#### 5.1 Use estado local quando possível
```typescript
// ✅ Estado local para UI
const [isModalOpen, setIsModalOpen] = useState(false);

// ✅ Estado global apenas para dados compartilhados
// Use Zustand ou Context para: user, clients, settings
```

#### 5.2 Memoização obrigatória para:
- Componentes que recebem objetos/arrays como props
- Callbacks passados para componentes filhos
- Cálculos pesados

```typescript
// ✅ CORRETO
const memoizedClients = useMemo(() => 
  clients.filter(c => c.status === 'active'),
  [clients]
);

const handleSubmit = useCallback((data: FormData) => {
  // lógica
}, [dependency]);

// ❌ INCORRETO - recria a cada render
const filteredClients = clients.filter(c => c.status === 'active');
```

---

## 📁 ESTRUTURA DE PASTAS

```
traffichub/
├── .github/
│   └── workflows/          # CI/CD
├── docs/                   # Documentação
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── COMPONENTS.md
│   └── DATABASE.md
├── public/                 # Assets estáticos
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/        # Rotas de autenticação
│   │   ├── (dashboard)/   # Rotas do dashboard
│   │   ├── api/           # API Routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/            # Componentes base (GlassCard, Button, etc)
│   │   ├── clients/       # Componentes de clientes
│   │   ├── reports/       # Componentes de relatórios
│   │   ├── analysis/      # Componentes de análise
│   │   ├── financial/     # Componentes financeiros
│   │   └── layout/        # Sidebar, Header, etc
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilitários e configurações
│   │   ├── supabase/      # Cliente Supabase
│   │   ├── utils.ts       # Funções utilitárias
│   │   └── constants.ts   # Constantes
│   ├── stores/            # Zustand stores
│   ├── types/             # TypeScript types
│   └── styles/            # Estilos globais
├── supabase/
│   ├── migrations/        # Migrations do banco
│   └── seed.sql           # Dados de seed
├── CLAUDE.md              # Este arquivo
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## 🎨 DESIGN SYSTEM

### Cores (CSS Variables)
```css
:root {
  /* Background */
  --bg-primary: #0a0a0f;
  --bg-secondary: rgba(255, 255, 255, 0.03);
  --bg-glass: rgba(255, 255, 255, 0.05);
  
  /* Borders */
  --border-primary: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.15);
  
  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  
  /* Accent */
  --accent-primary: #8b5cf6;
  --accent-secondary: #6366f1;
  
  /* Status */
  --status-success: #10b981;
  --status-warning: #f59e0b;
  --status-danger: #ef4444;
  --status-info: #3b82f6;
}
```

### Componentes Glassmorphism
```typescript
// Base glass card - SEMPRE usar esta estrutura
<div className="
  backdrop-blur-xl 
  bg-white/[0.03] 
  border border-white/[0.08] 
  rounded-2xl 
  hover:bg-white/[0.06] 
  hover:border-white/[0.15] 
  transition-all duration-300
">
```

### Responsividade
- Mobile first
- Breakpoints: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`
- Sidebar colapsa em < 1024px

---

## 🔄 WORKFLOW DE DESENVOLVIMENTO

### Ao iniciar uma nova feature:

1. **Leia a documentação relevante**
   - `docs/COMPONENTS.md` para componentes
   - `docs/API.md` para endpoints
   - `docs/DATABASE.md` para schema

2. **Crie a estrutura primeiro**
   - Types/interfaces
   - Componentes base
   - Hooks necessários

3. **Implemente incrementalmente**
   - Uma funcionalidade por vez
   - Valide após cada etapa

4. **Documente enquanto desenvolve**
   - Atualize os arquivos de docs
   - Adicione comentários no código

### Checklist pré-entrega:

- [ ] `npm run type-check` passa sem erros
- [ ] `npm run lint` passa sem erros
- [ ] `npm run build` compila com sucesso
- [ ] Componentes têm comentários de header
- [ ] Funções complexas têm JSDoc
- [ ] Imports estão ordenados corretamente
- [ ] Não há `console.log` em produção (use `console.error` para erros)
- [ ] Não há `any` types (use tipos específicos)
- [ ] Tratamento de erro implementado
- [ ] Loading states implementados
- [ ] Empty states implementados

---

## 🚫 PROIBIÇÕES

1. **NUNCA** use `any` - sempre defina tipos
2. **NUNCA** deixe `console.log` no código final
3. **NUNCA** commite código que não compila
4. **NUNCA** ignore erros de TypeScript
5. **NUNCA** use inline styles (use Tailwind)
6. **NUNCA** faça fetch diretamente - use hooks/services
7. **NUNCA** armazene secrets no código
8. **NUNCA** use `!important` no CSS
9. **NUNCA** entregue sem validar build
10. **NUNCA** pule tratamento de erros

---

## 📝 TEMPLATE DE RESPOSTA

Ao completar uma tarefa, sempre responda neste formato:

```markdown
## ✅ Tarefa Concluída: [Nome da Tarefa]

### Arquivos Criados/Modificados:
- `src/components/...` - Descrição
- `src/hooks/...` - Descrição

### Validações Executadas:
- ✅ TypeScript: Sem erros
- ✅ ESLint: Sem warnings
- ✅ Build: Sucesso

### Próximos Passos:
1. [Próxima tarefa sugerida]
2. [Outra tarefa]

### Notas:
- [Qualquer observação importante]
```

---

## 🆘 SE ALGO DER ERRADO

1. **Erro de TypeScript**: Leia a mensagem, corrija o tipo
2. **Erro de Build**: Verifique imports e exports
3. **Erro de Runtime**: Adicione tratamento de erro
4. **Erro de Supabase**: Verifique RLS e schema
5. **Loop de erros**: Pare, analise, refatore

**Lembre-se**: É melhor entregar uma feature funcionando perfeitamente do que várias features com bugs.

---

*Este documento deve ser lido e seguido em TODAS as interações com o projeto TrafficHub.*
