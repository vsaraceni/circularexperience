

## FAQ Upgrade v2 — Plano de Implementação

### O que será feito

1. **Novo componente `FAQSection.tsx`** com:
   - 8 perguntas/respostas em acordeão (Radix Accordion já existente)
   - Primeiro item aberto por padrão (`defaultValue="item-0"`)
   - Item aberto com `bg-primary/5` e `border-l-3 border-primary`
   - **Bloco de fechamento CTA** pós-FAQ: fundo roxo (`bg-primary`), título "Ainda tem dúvidas?", botão teal com scroll suave para `#contato`

2. **`Index.tsx`** — inserir `<FAQSection />` entre `<CTA />` e `</main>` (antes do Footer)

3. **`index.html`** — adicionar `<script type="application/ld+json">` com schema FAQPage (8 Q&As)

### Arquivos impactados

| Arquivo | Ação |
|---------|------|
| `src/components/landing/FAQSection.tsx` | Criar |
| `src/pages/Index.tsx` | 1 import + 1 linha |
| `index.html` | JSON-LD no `<head>` |

### Detalhes técnicos

- Usa `Accordion` de `@/components/ui/accordion.tsx` (já existe)
- Cores mapeadas para variáveis Tailwind existentes (sem hex hardcoded)
- Scroll suave via `document.getElementById("contato").scrollIntoView()`
- JSON-LD estático direto no HTML (zero dependências extras)

