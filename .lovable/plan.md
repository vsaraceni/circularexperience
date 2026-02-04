

# Plano: Aumentar Margem Lateral do Corpo

## Resumo
Aumentar as margens esquerda e direita de todas as secoes do corpo da pagina em 10 pixels, mantendo o header com o padding atual.

---

## Analise Atual

Todas as secoes usam o padrao:
```tsx
<div className="container mx-auto px-4">
```

O valor `px-4` equivale a `1rem` = `16px`. 
Para adicionar mais 10px, o novo valor sera `26px` = `px-[26px]`.

---

## Arquivos a Alterar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/landing/Hero.tsx` | `px-4` → `px-[26px]` |
| `src/components/landing/Stats.tsx` | `px-4` → `px-[26px]` |
| `src/components/landing/About.tsx` | `px-4` → `px-[26px]` |
| `src/components/landing/Methodology.tsx` | `px-4` → `px-[26px]` |
| `src/components/landing/Agenda.tsx` | `px-4` → `px-[26px]` |
| `src/components/landing/Video.tsx` | `px-4` → `px-[26px]` |
| `src/components/landing/Experts.tsx` | `px-4` → `px-[26px]` |
| `src/components/landing/SDGs.tsx` | `px-4` → `px-[26px]` |
| `src/components/landing/CTA.tsx` | `px-4` → `px-[26px]` |
| `src/components/landing/Footer.tsx` | `px-4` → `px-[26px]` |

**NAO ALTERAR:**
- `src/components/landing/Header.tsx` - permanece com `px-4`

---

## Exemplo de Alteracao

```tsx
// De:
<div className="container mx-auto px-4">

// Para:
<div className="container mx-auto px-[26px]">
```

---

## Resultado Esperado

Todas as secoes do corpo da pagina (Hero, Stats, About, Methodology, Agenda, Video, Experts, SDGs, CTA e Footer) terao 26px de padding lateral, enquanto o header mantera 16px, preservando sua aparencia atual.

