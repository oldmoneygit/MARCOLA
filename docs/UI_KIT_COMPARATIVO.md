# UI Kit Comparativo - MARCOLA

## Opção 1: GTA VI Sunset (Pink/Purple)

### Paleta de Cores

```css
:root {
  /* === BACKGROUNDS === */
  --bg-primary: #1B181F;           /* Fundo principal - quase preto com tom roxo */
  --bg-secondary: #251F2A;         /* Fundo secundário - roxo muito escuro */
  --bg-tertiary: #3F3146;          /* Fundo cards/elementos */
  --bg-glass: rgba(63, 49, 70, 0.5); /* Glassmorphism */
  --bg-hover: rgba(177, 96, 122, 0.1); /* Hover states */

  /* === ACCENT/BRAND === */
  --accent-primary: #B1607A;       /* Rosa principal - CTA, botões */
  --accent-secondary: #FDB9AE;     /* Rosa claro - destaques, badges */
  --accent-tertiary: #D4899A;      /* Rosa médio - hover states */
  --accent-gradient: linear-gradient(135deg, #FDB9AE 0%, #B1607A 50%, #3F3146 100%);

  /* === TEXT === */
  --text-primary: #FFFFFF;         /* Texto principal */
  --text-secondary: #D4C5D9;       /* Texto secundário - roxo claro */
  --text-muted: #8B7A93;           /* Texto desabilitado */
  --text-accent: #FDB9AE;          /* Texto destaque */

  /* === BORDERS === */
  --border-primary: rgba(177, 96, 122, 0.2);
  --border-secondary: rgba(253, 185, 174, 0.1);
  --border-hover: rgba(177, 96, 122, 0.4);

  /* === STATUS === */
  --status-success: #7ED4A6;       /* Verde suave */
  --status-warning: #F5C26B;       /* Amarelo dourado */
  --status-danger: #E57373;        /* Vermelho suave */
  --status-info: #B1607A;          /* Rosa (accent) */

  /* === SHADOWS === */
  --shadow-sm: 0 2px 8px rgba(177, 96, 122, 0.1);
  --shadow-md: 0 4px 16px rgba(177, 96, 122, 0.15);
  --shadow-lg: 0 8px 32px rgba(177, 96, 122, 0.2);
  --shadow-glow: 0 0 20px rgba(253, 185, 174, 0.3);
}
```

### Componentes

#### Botões
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #B1607A 0%, #8B4A5E 100%);
  color: #FFFFFF;
  border: none;
  box-shadow: 0 4px 16px rgba(177, 96, 122, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #C47089 0%, #B1607A 100%);
  box-shadow: 0 6px 20px rgba(177, 96, 122, 0.4);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #FDB9AE;
  border: 1px solid rgba(253, 185, 174, 0.3);
}

.btn-secondary:hover {
  background: rgba(253, 185, 174, 0.1);
  border-color: #FDB9AE;
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: #D4C5D9;
}

.btn-ghost:hover {
  background: rgba(177, 96, 122, 0.1);
  color: #FDB9AE;
}
```

#### Cards (Glassmorphism)
```css
.card {
  background: rgba(63, 49, 70, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(177, 96, 122, 0.15);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(27, 24, 31, 0.3);
}

.card:hover {
  border-color: rgba(177, 96, 122, 0.3);
  box-shadow: 0 12px 40px rgba(177, 96, 122, 0.15);
}

.card-highlight {
  background: linear-gradient(135deg, rgba(177, 96, 122, 0.2) 0%, rgba(63, 49, 70, 0.4) 100%);
  border: 1px solid rgba(253, 185, 174, 0.2);
}
```

#### Inputs
```css
.input {
  background: rgba(37, 31, 42, 0.8);
  border: 1px solid rgba(177, 96, 122, 0.2);
  color: #FFFFFF;
  border-radius: 12px;
}

.input:focus {
  border-color: #B1607A;
  box-shadow: 0 0 0 3px rgba(177, 96, 122, 0.15);
}

.input::placeholder {
  color: #8B7A93;
}
```

#### Sidebar
```css
.sidebar {
  background: linear-gradient(180deg, #1B181F 0%, #251F2A 100%);
  border-right: 1px solid rgba(177, 96, 122, 0.1);
}

.sidebar-item {
  color: #D4C5D9;
}

.sidebar-item:hover {
  background: rgba(177, 96, 122, 0.1);
  color: #FDB9AE;
}

.sidebar-item.active {
  background: rgba(177, 96, 122, 0.15);
  color: #FDB9AE;
  border-left: 3px solid #B1607A;
}
```

---

## Opção 2: Emerald Teal (Verde Escuro)

### Paleta de Cores

```css
:root {
  /* === BACKGROUNDS === */
  --bg-primary: #003332;           /* Fundo principal - verde muito escuro */
  --bg-secondary: #004442;         /* Fundo secundário */
  --bg-tertiary: #034C36;          /* Fundo cards/elementos */
  --bg-glass: rgba(3, 76, 54, 0.5); /* Glassmorphism */
  --bg-hover: rgba(189, 205, 207, 0.1); /* Hover states */

  /* === ACCENT/BRAND === */
  --accent-primary: #BDCDCF;       /* Cinza azulado - CTA, botões */
  --accent-secondary: #E3B8B8;     /* Rosa claro - destaques, badges */
  --accent-tertiary: #8FAAAD;      /* Teal médio - hover states */
  --accent-gradient: linear-gradient(135deg, #BDCDCF 0%, #034C36 50%, #003332 100%);

  /* === TEXT === */
  --text-primary: #FFFFFF;         /* Texto principal */
  --text-secondary: #BDCDCF;       /* Texto secundário */
  --text-muted: #6B8A8D;           /* Texto desabilitado */
  --text-accent: #E3B8B8;          /* Texto destaque (rosa) */

  /* === BORDERS === */
  --border-primary: rgba(189, 205, 207, 0.2);
  --border-secondary: rgba(227, 184, 184, 0.1);
  --border-hover: rgba(189, 205, 207, 0.4);

  /* === STATUS === */
  --status-success: #7ED4A6;       /* Verde claro */
  --status-warning: #E3B8B8;       /* Rosa (warning suave) */
  --status-danger: #E57373;        /* Vermelho suave */
  --status-info: #BDCDCF;          /* Cinza azulado */

  /* === SHADOWS === */
  --shadow-sm: 0 2px 8px rgba(0, 51, 50, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 51, 50, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 51, 50, 0.5);
  --shadow-glow: 0 0 20px rgba(189, 205, 207, 0.2);
}
```

### Componentes

#### Botões
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #BDCDCF 0%, #8FAAAD 100%);
  color: #003332;
  border: none;
  box-shadow: 0 4px 16px rgba(189, 205, 207, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #D0DCDE 0%, #BDCDCF 100%);
  box-shadow: 0 6px 20px rgba(189, 205, 207, 0.4);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #E3B8B8;
  border: 1px solid rgba(227, 184, 184, 0.3);
}

.btn-secondary:hover {
  background: rgba(227, 184, 184, 0.1);
  border-color: #E3B8B8;
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: #BDCDCF;
}

.btn-ghost:hover {
  background: rgba(189, 205, 207, 0.1);
  color: #FFFFFF;
}
```

#### Cards (Glassmorphism)
```css
.card {
  background: rgba(3, 76, 54, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(189, 205, 207, 0.15);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 51, 50, 0.4);
}

.card:hover {
  border-color: rgba(189, 205, 207, 0.3);
  box-shadow: 0 12px 40px rgba(189, 205, 207, 0.1);
}

.card-highlight {
  background: linear-gradient(135deg, rgba(189, 205, 207, 0.1) 0%, rgba(3, 76, 54, 0.4) 100%);
  border: 1px solid rgba(227, 184, 184, 0.2);
}
```

#### Inputs
```css
.input {
  background: rgba(0, 68, 66, 0.8);
  border: 1px solid rgba(189, 205, 207, 0.2);
  color: #FFFFFF;
  border-radius: 12px;
}

.input:focus {
  border-color: #BDCDCF;
  box-shadow: 0 0 0 3px rgba(189, 205, 207, 0.15);
}

.input::placeholder {
  color: #6B8A8D;
}
```

#### Sidebar
```css
.sidebar {
  background: linear-gradient(180deg, #003332 0%, #004442 100%);
  border-right: 1px solid rgba(189, 205, 207, 0.1);
}

.sidebar-item {
  color: #BDCDCF;
}

.sidebar-item:hover {
  background: rgba(189, 205, 207, 0.1);
  color: #FFFFFF;
}

.sidebar-item.active {
  background: rgba(189, 205, 207, 0.15);
  color: #FFFFFF;
  border-left: 3px solid #BDCDCF;
}
```

---

## Comparativo Visual

| Elemento | GTA VI Sunset | Emerald Teal |
|----------|---------------|--------------|
| **Fundo Principal** | #1B181F (Roxo escuro) | #003332 (Verde escuro) |
| **Accent Principal** | #B1607A (Rosa) | #BDCDCF (Cinza azulado) |
| **Accent Secundário** | #FDB9AE (Salmon) | #E3B8B8 (Rosa claro) |
| **Texto Secundário** | #D4C5D9 (Lavanda) | #BDCDCF (Cinza azulado) |
| **Vibe Geral** | Quente, vibrante, moderno | Sofisticado, calmo, profissional |
| **Associação** | Miami Vice, GTA VI, Sunset | Floresta, Natureza, Elegante |

---

## Recomendações

### GTA VI Sunset (Opção 1)
✅ **Prós:**
- Visual moderno e chamativo
- Excelente para destacar CTAs
- Vibe energética e jovem
- Ótimo contraste para dashboards

❌ **Contras:**
- Pode cansar a vista em uso prolongado
- Rosa pode não agradar todos os públicos

### Emerald Teal (Opção 2)
✅ **Prós:**
- Visual mais profissional e sofisticado
- Cores calmas, bom para uso prolongado
- Excelente para dados e gráficos
- Passa confiança e seriedade

❌ **Contras:**
- Menos vibrante
- Pode parecer mais "corporativo"

---

## Próximos Passos

Escolha uma opção e eu implementarei:
1. Atualização do arquivo `globals.css` com as novas variáveis
2. Ajuste dos componentes existentes
3. Novos gradientes e efeitos
