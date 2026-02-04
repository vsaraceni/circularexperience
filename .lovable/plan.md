

# Plano: Corrigir Margens Laterais do Corpo

## Problema Identificado

O `tailwind.config.ts` define um padding padrão para todos os containers:

```typescript
container: {
  center: true,
  padding: '2rem',  // 32px - sobrescreve px-[26px]
  ...
}
```

O padding da configuração do container tem maior prioridade do que a classe `px-[26px]` adicionada inline, por isso a alteração visual não ocorreu.

---

## Solucao

Alterar o padding do container na configuração do Tailwind para refletir os novos valores desejados.

### Alteracao no Arquivo

**`tailwind.config.ts`** - Linha 10

```typescript
// De:
padding: '2rem',

// Para:
padding: {
  DEFAULT: '26px',
  sm: '26px',
  md: '26px',
  lg: '26px',
  xl: '26px',
  '2xl': '26px',
},
```

Isso aplicara 26px de padding lateral em todos os breakpoints para os containers do corpo da pagina.

---

## Ajuste do Header

Para manter o header com padding menor (16px), precisaremos remover a classe `container` do header ou usar classes de padding customizadas.

**`src/components/landing/Header.tsx`** - O header ja usa `px-4` que sera sobrescrito. Vamos usar `!px-4` (important) ou uma abordagem diferente.

**Solucao alternativa mais limpa:** Manter o padding do container como `2rem` (atual) e usar `!px-[26px]` (important) nos componentes do corpo para sobrescrever.

---

## Solucao Final Escolhida

Usar a classe `!px-[26px]` (com importante) em todos os componentes do corpo para garantir que o padding seja aplicado, sobrescrevendo a configuracao padrao do container.

### Arquivos a Alterar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/landing/Hero.tsx` | `px-[26px]` → `!px-[26px]` |
| `src/components/landing/Stats.tsx` | `px-[26px]` → `!px-[26px]` |
| `src/components/landing/About.tsx` | `px-[26px]` → `!px-[26px]` |
| `src/components/landing/Methodology.tsx` | `px-[26px]` → `!px-[26px]` |
| `src/components/landing/Agenda.tsx` | `px-[26px]` → `!px-[26px]` |
| `src/components/landing/Video.tsx` | `px-[26px]` → `!px-[26px]` |
| `src/components/landing/Experts.tsx` | `px-[26px]` → `!px-[26px]` |
| `src/components/landing/SDGs.tsx` | `px-[26px]` → `!px-[26px]` |
| `src/components/landing/CTA.tsx` | `px-[26px]` → `!px-[26px]` |
| `src/components/landing/Footer.tsx` | `px-[26px]` → `!px-[26px]` |

---

## Exemplo de Alteracao

```tsx
// De:
<div className="container mx-auto px-[26px]">

// Para:
<div className="container mx-auto !px-[26px]">
```

O `!` antes da classe adiciona `!important` ao CSS, garantindo que o valor seja aplicado.

---

## Resultado Esperado

Com o uso de `!important`, o padding de 26px sera aplicado a todas as secoes do corpo, sobrescrevendo o padding padrao de 32px definido na configuracao do container Tailwind.

