

# Plano: Substituir Logos e Mover Logo Atual para Hero

## Resumo
Substituir o logo "Circular Experience" no header e footer pelo novo logo "Movimento Circular" enviado, e mover o logo atual para a secao Hero, substituindo o badge de texto "Metodologia Movimento Circular".

---

## Passo 1: Copiar Nova Imagem

Copiar o arquivo enviado para o projeto:
- **Origem:** `user-uploads://Movimento-Circular_logotipo_horizontal.png`
- **Destino:** `src/assets/movimento-circular-logo.png`

---

## Alteracoes nos Arquivos

### 1. `src/components/landing/Header.tsx`

**Alterar import do logo:**
```tsx
// De:
import logo from "@/assets/circular-experience-logo.png";

// Para:
import logo from "@/assets/movimento-circular-logo.png";
```

**Atualizar alt text:**
```tsx
// De:
alt="Circular Experience"

// Para:
alt="Movimento Circular"
```

---

### 2. `src/components/landing/Footer.tsx`

**Alterar import do logo:**
```tsx
// De:
import logo from "@/assets/circular-experience-logo.png";

// Para:
import logo from "@/assets/movimento-circular-logo.png";
```

**Atualizar alt text e remover texto "Uma iniciativa do...":**
```tsx
// De:
<div className="flex flex-col items-center md:items-start gap-2">
  <LogoImage src={logo} alt="Circular Experience" ... />
  <span className="text-xs">Uma iniciativa do Movimento Circular</span>
</div>

// Para:
<div className="flex flex-col items-center md:items-start gap-2">
  <LogoImage src={logo} alt="Movimento Circular" ... />
</div>
```

O texto "Uma iniciativa do Movimento Circular" sera removido pois o logo ja e do Movimento Circular.

---

### 3. `src/components/landing/Hero.tsx`

**Adicionar import do logo Circular Experience:**
```tsx
import circularExperienceLogo from "@/assets/circular-experience-logo.png";
```

**Substituir o badge de texto pelo logo:**
```tsx
// De (linhas 23-26):
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-secondary/30 mb-6 animate-fade-up">
  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
  <span className="text-sm font-medium text-secondary">Metodologia Movimento Circular</span>
</div>

// Para:
<div className="mb-6 animate-fade-up">
  <img 
    src={circularExperienceLogo} 
    alt="Circular Experience" 
    className="h-16 md:h-20 w-auto"
  />
</div>
```

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/assets/movimento-circular-logo.png` | Novo arquivo (copia do upload) |
| `src/components/landing/Header.tsx` | Trocar logo para Movimento Circular |
| `src/components/landing/Footer.tsx` | Trocar logo para Movimento Circular, remover texto redundante |
| `src/components/landing/Hero.tsx` | Substituir badge de texto pelo logo Circular Experience |

---

## Resultado Esperado

- **Header/Footer:** Exibirao o logo "Movimento Circular" (novo)
- **Hero:** Exibira o logo "Circular Experience" (atual) no lugar do badge de texto, antes do titulo principal

