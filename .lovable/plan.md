
# Plano: Corrigir Margens Laterais - Diagnostico e Solucao

## Problema Identificado

Apos investigacao detalhada, identifiquei que o padding `!px-[36px]` **esta sendo aplicado corretamente** no codigo, porem o valor de 36px (cerca de 2.25rem) e muito proximo ao valor padrao de 32px (2rem) do container, tornando a diferenca visual imperceptivel em telas grandes.

Alem disso, a melhor pratica e usar padding responsivo: menor no mobile e maior no desktop.

---

## Solucao: Padding Responsivo

Ao inves de usar um valor fixo de 36px, vamos aplicar:
- **Mobile (padrao):** `px-4` (16px) - mantem a legibilidade em telas pequenas
- **Tablet e Desktop (md:):** `md:px-[46px]` (46px) - aumenta 10px sobre os 36px desejados

Isso garante que:
1. A diferenca visual seja perceptivel em telas maiores
2. O conteudo nao fique apertado no mobile
3. O efeito de margem maior seja claro no desktop

---

## Arquivos a Alterar

| Arquivo | De | Para |
|---------|----|----|
| `Hero.tsx` | `!px-[36px]` | `px-4 md:!px-[46px]` |
| `Stats.tsx` | `!px-[36px]` | `px-4 md:!px-[46px]` |
| `About.tsx` | `!px-[36px]` | `px-4 md:!px-[46px]` |
| `Methodology.tsx` | `!px-[36px]` | `px-4 md:!px-[46px]` |
| `Agenda.tsx` | `!px-[36px]` | `px-4 md:!px-[46px]` |
| `Video.tsx` | `!px-[36px]` | `px-4 md:!px-[46px]` |
| `Experts.tsx` | `!px-[36px]` | `px-4 md:!px-[46px]` |
| `SDGs.tsx` | `!px-[36px]` | `px-4 md:!px-[46px]` |
| `CTA.tsx` | `!px-[36px]` | `px-4 md:!px-[46px]` |

**Nao alterar:**
- `Header.tsx` - permanece com `px-4`
- `Footer.tsx` - permanece com `!px-[26px]`

---

## Exemplo de Alteracao

```tsx
// De:
<div className="container mx-auto !px-[36px]">

// Para:
<div className="container mx-auto px-4 md:!px-[46px]">
```

---

## Detalhes Tecnicos

### Por que o padding anterior nao funcionava visivelmente?

1. O valor `36px` e apenas 4px maior que o padrao `32px` do container, uma diferenca dificil de notar
2. Em telas menores, o padding de 36px ocupa muito espaco horizontal, comprimindo o conteudo
3. O modificador `!important` estava correto, mas o valor era muito proximo ao original

### Por que esta solucao funcionara?

1. **Padding base menor (16px):** Garante que o mobile tenha espaco adequado para conteudo
2. **Padding aumentado no desktop (46px):** Uma diferenca de 14px sobre o padrao (32px) sera claramente visivel
3. **Breakpoint md:** Aplica o padding maior a partir de 768px de largura
4. **!important no md:** Garante que o valor sobrescreva o padding padrao do container

---

## Resultado Esperado

- **Mobile (< 768px):** Padding de 16px por lado (mais respiracao para o conteudo)
- **Tablet/Desktop (>= 768px):** Padding de 46px por lado (margens visivelmente maiores que o header)
- **Header:** Mantem `px-4` (16px) em todas as telas
- **Footer:** Mantem o valor atual

