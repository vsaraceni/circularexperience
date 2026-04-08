

## Exibir Briefing do Lead — Card colapsável acima do formulário

### Mudanças em `src/components/admin/ProposalForm.tsx`

**1. Buscar briefing do lead**
- Usar `useEffect` para buscar `briefing_notes` da tabela `leads` pelo `lead_id` (de `prefill?.lead_id` ou `proposal?.lead_id`)
- Armazenar em estado local `briefingNotes`

**2. Renderizar card colapsável acima do formulário**
- Usar componente `Collapsible` (já existe em `src/components/ui/collapsible.tsx`)
- Exibir apenas quando `briefingNotes` tiver conteúdo
- Título: "Briefing do Lead" com ícone `FileText`
- Inicia expandido por padrão
- Conteúdo renderizado como HTML (via `dangerouslySetInnerHTML`) em modo somente leitura, com estilo suave (bg-muted, border, rounded)
- Botão de toggle (chevron) para expandir/recolher

**3. Imports adicionais**
- `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` de `@/components/ui/collapsible`
- `FileText`, `ChevronDown` de `lucide-react`

### Arquivo impactado

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/ProposalForm.tsx` | Fetch briefing + card colapsável acima do form |

Sem migração SQL necessária.

