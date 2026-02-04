
# Plano: Mover Logo Circular Experience para Metodologia

## Resumo

Mover o logo "Circular Experience" da secao Hero para acima do titulo "Nossa Metodologia", e substituir por um badge de texto na Hero.

---

## Alteracoes

### 1. Hero.tsx

**Remover:** O logo Circular Experience (linhas 23-30)

**Adicionar:** Badge de texto "Metodologia Circular Experience" no mesmo local

```tsx
// De (logo):
<div className="mb-6 animate-fade-up">
  <img 
    src={circularExperienceLogo} 
    alt="Circular Experience" 
    className="h-16 md:h-20 w-auto"
  />
</div>

// Para (badge de texto):
<div className="mb-6 animate-fade-up">
  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
    <span className="text-sm font-medium text-primary">Metodologia Circular Experience</span>
  </span>
</div>
```

**Remover:** Import do logo (linha 4)
```tsx
// Remover esta linha:
import circularExperienceLogo from "@/assets/circular-experience-logo.png";
```

---

### 2. Methodology.tsx

**Adicionar:** Import do logo no topo do arquivo

```tsx
import circularExperienceLogo from "@/assets/circular-experience-logo.png";
```

**Adicionar:** Logo centralizado acima do titulo (linha 47-48)

```tsx
// Antes do h2 "Nossa Metodologia":
<div className="flex justify-center mb-6">
  <img 
    src={circularExperienceLogo} 
    alt="Circular Experience" 
    className="h-16 md:h-20 w-auto"
  />
</div>
```

---

## Estrutura Final

### Hero.tsx (Badge de texto)
```
[Badge: Metodologia Circular Experience]
Seu negócio saindo na frente...
```

### Methodology.tsx (Logo centralizado)
```
        [Logo Circular Experience]
     Nossa Metodologia
Uma jornada de aprendizado...
```

---

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/components/landing/Hero.tsx` | Substituir logo por badge de texto |
| `src/components/landing/Methodology.tsx` | Adicionar logo centralizado acima do titulo |

