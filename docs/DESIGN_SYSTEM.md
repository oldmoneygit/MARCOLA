# DESIGN_SYSTEM.md - Sistema de Design do TrafficHub

---

## 📋 Sumário

1. [Filosofia de Design](#filosofia-de-design)
2. [Cores](#cores)
3. [Tipografia](#tipografia)
4. [Espaçamento](#espaçamento)
5. [Glassmorphism](#glassmorphism)
6. [Componentes Visuais](#componentes-visuais)
7. [Animações](#animações)
8. [Responsividade](#responsividade)
9. [Dark Mode](#dark-mode)
10. [Iconografia](#iconografia)

---

## 🎨 Filosofia de Design

O TrafficHub segue uma estética **dark mode premium** com efeitos de **glassmorphism**. O objetivo é criar uma interface moderna, sofisticada e profissional que transmita confiança.

### Princípios

1. **Clareza**: Informações hierarquizadas e fáceis de ler
2. **Elegância**: Visual premium sem ser excessivo
3. **Consistência**: Padrões repetidos em toda a interface
4. **Performance**: Efeitos otimizados para não impactar UX
5. **Acessibilidade**: Contraste adequado para leitura

---

## 🎨 Cores

### Paleta Principal

```css
:root {
  /* ===== BACKGROUNDS ===== */
  --bg-primary: #0a0a0f;           /* Fundo principal */
  --bg-secondary: #111118;          /* Fundo secundário */
  --bg-tertiary: #1a1a24;           /* Fundo de cards */
  
  /* Glassmorphism */
  --bg-glass: rgba(255, 255, 255, 0.03);
  --bg-glass-hover: rgba(255, 255, 255, 0.06);
  --bg-glass-active: rgba(255, 255, 255, 0.08);
  
  /* ===== BORDERS ===== */
  --border-primary: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.15);
  --border-active: rgba(255, 255, 255, 0.20);
  
  /* ===== TEXT ===== */
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;        /* zinc-400 */
  --text-muted: #71717a;            /* zinc-500 */
  --text-disabled: #52525b;         /* zinc-600 */
  
  /* ===== ACCENT (Purple/Violet) ===== */
  --accent-50: #faf5ff;
  --accent-100: #f3e8ff;
  --accent-200: #e9d5ff;
  --accent-300: #d8b4fe;
  --accent-400: #c084fc;
  --accent-500: #a855f7;            /* Primary accent */
  --accent-600: #9333ea;
  --accent-700: #7c3aed;
  --accent-800: #6b21a8;
  --accent-900: #581c87;
  
  /* Glow */
  --accent-glow: rgba(139, 92, 246, 0.25);
  
  /* ===== STATUS COLORS ===== */
  /* Success (Green) */
  --success-light: #d1fae5;
  --success: #10b981;               /* emerald-500 */
  --success-dark: #059669;
  --success-bg: rgba(16, 185, 129, 0.1);
  --success-glow: rgba(16, 185, 129, 0.25);
  
  /* Warning (Amber) */
  --warning-light: #fef3c7;
  --warning: #f59e0b;               /* amber-500 */
  --warning-dark: #d97706;
  --warning-bg: rgba(245, 158, 11, 0.1);
  --warning-glow: rgba(245, 158, 11, 0.25);
  
  /* Danger (Red) */
  --danger-light: #fee2e2;
  --danger: #ef4444;                /* red-500 */
  --danger-dark: #dc2626;
  --danger-bg: rgba(239, 68, 68, 0.1);
  --danger-glow: rgba(239, 68, 68, 0.25);
  
  /* Info (Blue) */
  --info-light: #dbeafe;
  --info: #3b82f6;                  /* blue-500 */
  --info-dark: #2563eb;
  --info-bg: rgba(59, 130, 246, 0.1);
  --info-glow: rgba(59, 130, 246, 0.25);
  
  /* ===== GRADIENTS ===== */
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-success: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  --gradient-warning: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  --gradient-danger: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  
  /* Client gradients */
  --gradient-orange: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
  --gradient-blue: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  --gradient-pink: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
  --gradient-green: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
}
```

### Uso no Tailwind

```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        // Use CSS variables ou defina diretamente
        glass: 'rgba(255, 255, 255, 0.03)',
        'glass-hover': 'rgba(255, 255, 255, 0.06)',
      },
      borderColor: {
        glass: 'rgba(255, 255, 255, 0.08)',
        'glass-hover': 'rgba(255, 255, 255, 0.15)',
      },
    },
  },
};
```

---

## 📝 Tipografia

### Font Family

```css
/* Principal: Inter */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Escala Tipográfica

| Nome | Size | Weight | Line Height | Uso |
|------|------|--------|-------------|-----|
| `display` | 36px | 800 | 1.1 | Títulos principais |
| `h1` | 30px | 700 | 1.2 | Títulos de página |
| `h2` | 24px | 700 | 1.3 | Títulos de seção |
| `h3` | 20px | 600 | 1.4 | Subtítulos |
| `h4` | 16px | 600 | 1.4 | Títulos de card |
| `body` | 14px | 400 | 1.5 | Texto padrão |
| `body-sm` | 13px | 400 | 1.5 | Texto secundário |
| `caption` | 12px | 400 | 1.4 | Captions |
| `overline` | 10px | 600 | 1.2 | Labels, badges |

### Classes Tailwind

```html
<!-- Display -->
<h1 class="text-4xl font-extrabold">

<!-- H1 -->
<h1 class="text-2xl font-bold">

<!-- H2 -->
<h2 class="text-xl font-bold">

<!-- H3 -->
<h3 class="text-lg font-semibold">

<!-- Body -->
<p class="text-sm">

<!-- Caption -->
<span class="text-xs text-gray-500">

<!-- Overline (labels) -->
<span class="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
```

---

## 📐 Espaçamento

### Escala Base

Usamos múltiplos de 4px (Tailwind padrão).

| Token | Value | Uso |
|-------|-------|-----|
| `space-1` | 4px | Micro espaçamentos |
| `space-2` | 8px | Entre elementos inline |
| `space-3` | 12px | Padding interno pequeno |
| `space-4` | 16px | Padding padrão |
| `space-5` | 20px | Padding cards |
| `space-6` | 24px | Gap entre cards |
| `space-8` | 32px | Padding de seção |
| `space-10` | 40px | Margem entre seções |

### Padding de Componentes

| Componente | Padding |
|------------|---------|
| Page | `p-8` (32px) |
| Card | `p-5` ou `p-6` |
| Button sm | `px-3 py-1.5` |
| Button md | `px-4 py-2` |
| Input | `px-4 py-3` |
| Modal | `p-8` |
| Sidebar | `p-6` (logo), `px-6 py-3` (nav items) |

### Gap entre Elementos

| Contexto | Gap |
|----------|-----|
| Grid de cards | `gap-6` |
| Grid de métricas | `gap-4` |
| Stack de items | `space-y-3` ou `space-y-4` |
| Inline items | `gap-2` ou `gap-3` |

---

## 🔮 Glassmorphism

### Estrutura Base

```css
.glass-card {
  /* Blur effect */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  
  /* Semi-transparent background */
  background: rgba(255, 255, 255, 0.03);
  
  /* Subtle border */
  border: 1px solid rgba(255, 255, 255, 0.08);
  
  /* Rounded corners */
  border-radius: 16px; /* rounded-2xl */
  
  /* Smooth transitions */
  transition: all 0.3s ease;
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
}
```

### Classes Tailwind

```html
<!-- Glass Card Base -->
<div class="
  backdrop-blur-xl 
  bg-white/[0.03] 
  border border-white/[0.08] 
  rounded-2xl
  transition-all duration-300
  hover:bg-white/[0.06] 
  hover:border-white/[0.15]
">

<!-- Glass Card Static (sem hover) -->
<div class="
  backdrop-blur-xl 
  bg-white/[0.03] 
  border border-white/[0.08] 
  rounded-2xl
">

<!-- Sidebar Glass -->
<aside class="
  backdrop-blur-2xl 
  bg-black/40 
  border-r border-white/[0.05]
">

<!-- Modal Glass -->
<div class="
  backdrop-blur-2xl 
  bg-black/60 
  border border-white/[0.1] 
  rounded-2xl
">
```

### Background Mesh

Para efeitos de profundidade no fundo:

```css
.bg-mesh {
  background: 
    radial-gradient(at 20% 30%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
    radial-gradient(at 80% 70%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(236, 72, 153, 0.08) 0px, transparent 50%);
}
```

---

## 🧩 Componentes Visuais

### Cards

```html
<!-- Metric Card -->
<div class="glass-card p-5">
  <div class="flex items-center justify-between mb-3">
    <span class="text-gray-400 text-sm">Label</span>
    <div class="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
      <span class="text-lg">📊</span>
    </div>
  </div>
  <p class="text-3xl font-bold">Value</p>
  <p class="text-xs text-emerald-400 mt-1">↑ Change</p>
</div>
```

### Badges

```html
<!-- Status Badge -->
<span class="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400">
  Ativo
</span>

<!-- Severity Badge -->
<span class="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
  URGENTE
</span>
```

### Buttons

```html
<!-- Primary -->
<button class="
  btn btn-primary btn-sm 
  rounded-xl 
  shadow-lg shadow-violet-500/25
  gap-2
">
  <span>➕</span> Novo
</button>

<!-- Ghost -->
<button class="
  btn btn-ghost btn-sm 
  rounded-xl
">
  Cancelar
</button>

<!-- Danger -->
<button class="
  btn btn-error btn-sm 
  rounded-xl
">
  Excluir
</button>
```

### Inputs

```html
<!-- Input -->
<input class="
  input input-bordered 
  bg-white/5 
  border-white/10 
  rounded-xl
  focus:border-violet-500
  placeholder:text-gray-500
"/>

<!-- Select -->
<select class="
  select select-bordered select-sm 
  bg-white/5 
  border-white/10 
  rounded-xl
">
```

### Tables

```html
<table class="table table-sm w-full">
  <thead>
    <tr class="text-gray-500 border-b border-white/5">
      <th class="text-left font-medium">Header</th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-b border-white/5 hover:bg-white/5">
      <td class="text-sm">Cell</td>
    </tr>
  </tbody>
</table>
```

---

## ✨ Animações

### Transitions

```css
/* Padrão para hover */
transition: all 0.3s ease;

/* Rápido (buttons) */
transition: all 0.2s ease;

/* Lento (modals) */
transition: all 0.4s ease;
```

### Keyframes

```css
/* Float (orbs de fundo) */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}
.animate-float {
  animation: float 6s ease-in-out infinite;
}

/* Pulse Glow (status indicators) */
@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

### Status Indicators

```html
<!-- Active (pulsing) -->
<div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50">

<!-- Warning (pulsing) -->
<div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-lg shadow-amber-500/50">
```

---

## 📱 Responsividade

### Breakpoints

| Nome | Width | Uso |
|------|-------|-----|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop pequeno |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Desktop grande |

### Layout

```html
<!-- Sidebar: fixo em desktop, drawer em mobile -->
<aside class="
  fixed left-0 top-0
  w-64
  lg:block hidden
">

<!-- Main: margem para sidebar em desktop -->
<main class="
  lg:ml-64
  p-4 lg:p-8
">

<!-- Grid responsivo -->
<div class="
  grid
  grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4
  gap-4 lg:gap-6
">
```

### Sidebar Mobile

```html
<!-- Hamburger button (mobile only) -->
<button class="lg:hidden fixed top-4 left-4 z-50">
  ☰
</button>

<!-- Overlay (mobile) -->
<div class="lg:hidden fixed inset-0 bg-black/50 z-40">

<!-- Drawer sidebar (mobile) -->
<aside class="
  fixed left-0 top-0
  w-64 h-full
  transform -translate-x-full lg:translate-x-0
  transition-transform duration-300
  z-50
">
```

---

## 🌙 Dark Mode

O TrafficHub é **dark mode only**. Não há versão light.

### DaisyUI Theme

```javascript
// tailwind.config.ts
module.exports = {
  daisyui: {
    themes: [
      {
        dark: {
          "primary": "#8b5cf6",
          "secondary": "#6366f1",
          "accent": "#a855f7",
          "neutral": "#1a1a2e",
          "base-100": "#0a0a0f",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
    ],
    darkTheme: "dark",
  },
};
```

### HTML

```html
<html lang="pt-BR" data-theme="dark">
```

---

## 🎯 Iconografia

### Emojis (Preferido)

Usamos emojis para ícones simples e rápidos:

| Contexto | Emoji |
|----------|-------|
| Dashboard | 📊 |
| Clientes | 👥 |
| Relatórios | 📈 |
| Análise | 🧠 |
| Financeiro | 💰 |
| Importar | 📥 |
| Adicionar | ➕ |
| Configurações | ⚙️ |
| Sucesso | ✅ |
| Warning | ⚠️ |
| Erro | ❌ |
| Fogo | 🔥 |
| Foguete | 🚀 |
| Alvo | 🎯 |
| Troféu | 🏆 |
| Calendário | 📅 |
| Telefone | 📱 |
| Email | 📧 |
| Link | 🔗 |
| Documento | 📄 |
| Lixeira | 🗑️ |
| Editar | ✏️ |
| Copiar | 📋 |

### Lucide Icons (Quando necessário)

Para ícones mais específicos:

```typescript
import { 
  ChevronRight, 
  Settings, 
  LogOut,
  RefreshCw,
  ExternalLink 
} from 'lucide-react';

<ChevronRight className="w-4 h-4" />
```

### Avatar com Gradient

```html
<div class="
  w-12 h-12 
  rounded-xl 
  bg-gradient-to-br from-orange-400 to-red-500 
  flex items-center justify-center 
  text-xl 
  shadow-lg
">
  🏗️
</div>
```

---

## ✅ Checklist de Design

Antes de entregar, verifique:

- [ ] Usa cores da paleta definida
- [ ] Tipografia segue a escala
- [ ] Espaçamentos consistentes
- [ ] Glassmorphism aplicado corretamente
- [ ] Bordas com opacidade correta
- [ ] Hover states implementados
- [ ] Animações suaves (0.3s)
- [ ] Responsivo (testado em lg e md)
- [ ] Contraste adequado para texto
- [ ] Status badges com cores certas
- [ ] Cards com padding correto

---

*Este documento define o sistema visual do TrafficHub. Qualquer desvio deve ser justificado e documentado.*
