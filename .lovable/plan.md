

## Otimizar header do Pipeline — linha única + labels descritivos nos filtros

### Mudanças

**Arquivo**: `src/pages/admin/Proposals.tsx`

#### 1. Remover título "Pipeline Comercial" e unificar numa única linha

Eliminar o bloco `PAGE HEADER` (linhas 491-538) com o `<h1>` e os botões. Mover o botão "Nova Proposta", o dropdown "Ver Leads Perdidos" e os filtros para uma **única linha**. Usar um separador vertical (`border-left` de 24px) entre os filtros e os botões de ação à direita.

Layout final:
```text
[🔍 Buscar...] [Origem ▾] [Responsável ▾] [Período ▾] [Status ▾]  |  [⋮] [+ Nova Proposta]
```

#### 2. Placeholders descritivos nos filtros (resolver "Todos" genérico)

Trocar os `placeholder` e o item `"all"` de cada Select para incluir o nome do campo:

| Filtro | Placeholder (valor "all") | Atual |
|--------|--------------------------|-------|
| Origem | `"Origem"` | `"Todas as origens"` → OK, mas quando selecionado `all` mostra "Todos" |
| Responsável | `"Responsável"` | `"Todos"` |
| Período | `"Período"` | `"Todos"` |
| Status | `"Status"` | `"Todos"` |

Concretamente: trocar o texto do `<SelectItem value="all">` para incluir o contexto:
- Origem: `"Todas as origens"` (já está OK)
- Responsável: `"Todos os responsáveis"`
- Período: `"Todo o período"`
- Status: `"Todos os status"`

Isso garante que mesmo sem clicar, o usuário sabe **o que** cada dropdown filtra.

#### 3. Separador visual

Um `<div>` com `border-left: 1px solid hsl(var(--color-border))` e `height: 24px` entre o último filtro e os botões de ação, criando separação clara entre filtros e ações.

### Impacto

| Arquivo | Mudança |
|---------|---------|
| `Proposals.tsx` | Remover h1, unificar filtros+ações em 1 linha, labels descritivos, separador |

