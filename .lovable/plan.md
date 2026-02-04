
# Plano: Aumentar Area do Circulo dos 7 Rs

## Resumo
Aumentar o tamanho do container do circulo e dobrar o raio de posicionamento dos icones para diminuir o espacamento entre os textos e criar um visual mais impactante.

---

## Alteracoes no Arquivo

### `src/components/landing/About.tsx`

**Valores Atuais:**
- Container: `w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80`
- Raio: `110px` (mobile), `120px` (tablet), `130px` (desktop) - apenas 110 esta sendo usado

**Novos Valores (dobrando):**
- Container: `w-[480px] h-[480px] sm:w-[520px] sm:h-[520px] md:w-[560px] md:h-[560px]`
- Raio: `180px` (mobile), `200px` (tablet), `220px` (desktop)

### Alteracoes Especificas

1. **Linha 63** - Aumentar container principal:
```tsx
// De:
<div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80">

// Para:
<div className="relative w-[400px] h-[400px] sm:w-[480px] sm:h-[480px] md:w-[560px] md:h-[560px]">
```

2. **Linha 65** - Aumentar circulo central:
```tsx
// De:
w-20 h-20 sm:w-24 sm:h-24

// Para:
w-28 h-28 sm:w-32 sm:h-32
```

3. **Linha 72** - Ajustar inset do circulo tracejado:
```tsx
// De:
inset-8 sm:inset-10

// Para:
inset-16 sm:inset-20
```

4. **Linha 77** - Dobrar o raio:
```tsx
// De:
const radius = 110;

// Para:
const radius = 180; // Dobrado para mobile
```

5. **Linhas 91-92** - Aumentar tamanho dos icones:
```tsx
// De:
w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14
w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7

// Para:
w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18
w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9
```

6. **Linha 94** - Aumentar tamanho do texto:
```tsx
// De:
text-[10px] sm:text-xs

// Para:
text-xs sm:text-sm
```

---

## Resumo das Alteracoes

| Elemento | Valor Atual | Novo Valor |
|----------|-------------|------------|
| Container | 256-320px | 400-560px |
| Raio | 110px | 180px |
| Circulo central | 80-96px | 112-128px |
| Icones | 44-56px | 56-72px |
| Texto | 10-12px | 12-14px |

---

## Resultado Esperado

O circulo dos 7 Rs ficara significativamente maior, com os icones mais espacados do centro mas com os textos dos labels mais proximos uns dos outros devido ao maior arco do circulo. Isso criara um visual mais impactante e legivel.
