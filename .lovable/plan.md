

## Drawer com Blocos Expansíveis (Accordion)

### O que muda

Substituir o layout linear do tab "Resumo" por 3 blocos accordion (usando `@radix-ui/react-accordion` já disponível). Ao expandir um bloco, os outros recolhem automaticamente (`type="single"`).

### Blocos

| # | Título | Conteúdo | Estado inicial |
|---|--------|----------|----------------|
| 1 | Dados do Lead | Contato, e-mail, telefone, cargo, origem, responsável, criado em, mensagem | **Aberto** |
| 2 | Empresa | Seção de enrichment (site, descrição, botão enriquecer) | Fechado |
| 3 | Mensagens | `MessageTemplatesSection` expandida inline (todas as mensagens visíveis com scroll) | Fechado |

### Comportamento

- `Accordion type="single" collapsible` — ao abrir um bloco, os demais recolhem.
- Ao clicar em "Mensagens", o bloco expande mostrando **todos os templates** do estágio diretamente (sem o botão "Ver todas" intermediário). O conteúdo tem `max-h-[50vh] overflow-y-auto` para scroll interno.
- Os botões de ação (Enviar Boas-Vindas, Perdido etc.) ficam **fora do accordion**, fixos na parte inferior — sempre visíveis independente do bloco aberto.
- Header de cada bloco mostra um contador relevante: Dados (nenhum), Empresa (badge se enriquecida), Mensagens (contagem de templates disponíveis).

### Melhorias sobre a ideia original

1. **Ações sempre visíveis** — não ficam escondidas dentro de um bloco.
2. **Mensagens inline com scroll** — evita abrir dialog separado para ver templates; tudo fica no drawer.
3. **Contador no header** — "Mensagens (3)" dá contexto sem precisar abrir.

### Arquivo impactado

| Arquivo | Mudança |
|---------|---------|
| `LeadDrawer.tsx` | Substituir layout do tab "resumo" por Accordion com 3 blocos. Mover ações para fora. Renderizar templates inline no bloco 3. |

### Detalhes técnicos

- Usar `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` de `@/components/ui/accordion`.
- No bloco Mensagens, renderizar diretamente a lista de templates (reutilizando lógica de `MessageTemplatesSection` / `messageTemplates.ts`) em vez de apenas o preview.
- `defaultValue="lead-data"` para abrir o primeiro bloco por padrão.

