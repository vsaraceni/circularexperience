
# Plano: Ajustes de Layout e Configuracao

## Resumo das Alteracoes

1. **Atualizar chave Resend API** - Nova key fornecida pelo usuario
2. **Aumentar logo em 30%** na secao Metodologia
3. **Alterar texto do badge** no Hero para incluir "Mao na Massa"
4. **Adicionar 5o badge** no Hero com "100% pratico"

---

## 1. Atualizar Secret RESEND_API_KEY

A chave do Resend sera atualizada para:
```
re_fh3g9Bz3_BK1Z9i5L4J9AvKUvfDwLoYFX
```

---

## 2. Methodology.tsx - Aumentar Logo em 30%

**Calculo do aumento:**
- Atual: `h-16` (64px) mobile, `h-20` (80px) desktop
- +30%: 64px × 1.3 = 83px, 80px × 1.3 = 104px

**De:**
```tsx
className="h-16 md:h-20 w-auto"
```

**Para:**
```tsx
className="h-[83px] md:h-[104px] w-auto"
```

---

## 3. Hero.tsx - Alterar Texto do Badge

**De:**
```tsx
<span className="text-sm font-medium text-primary">Metodologia Circular Experience</span>
```

**Para:**
```tsx
<span className="text-sm font-medium text-primary">Metodologia Mão na Massa Circular Experience</span>
```

---

## 4. Hero.tsx - Adicionar 5o Badge "100% pratico"

O grid atual tem 4 colunas no desktop (`md:grid-cols-4`). Vamos ajustar para 5 colunas (`md:grid-cols-5`) e adicionar um novo badge com icone de "Hammer" (martelo) representando pratica.

**Estrutura do novo badge:**
```tsx
<div className="flex items-center gap-3 p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border">
  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
    <Hammer className="w-5 h-5 text-primary-foreground" />
  </div>
  <div>
    <p className="font-bold text-foreground">100%</p>
    <p className="text-xs text-muted-foreground">Prático</p>
  </div>
</div>
```

**Ajustes necessarios:**
- Importar icone `Hammer` do lucide-react
- Alterar grid de `md:grid-cols-4` para `md:grid-cols-5`
- Adicionar o 5o badge apos o badge "Presencial"

---

## Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| Secret `RESEND_API_KEY` | Atualizar valor |
| `src/components/landing/Methodology.tsx` | Aumentar altura do logo |
| `src/components/landing/Hero.tsx` | Alterar texto do badge + adicionar 5o badge |

---

## Detalhes Tecnicos

### Import atualizado em Hero.tsx
```tsx
import { Clock, Users, Award, MapPin, Hammer } from "lucide-react";
```

### Grid responsivo atualizado
```tsx
<div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-fade-up">
```

Isso mantera 2 colunas no mobile (os badges vao quebrar em 3 linhas) e 5 colunas no desktop (todos alinhados).
