

## Exibir Tier do Lead no Card — Ícone colorido + tooltip

### Lógica de tier

```typescript
function getTierInfo(colaboradores?: string | null) {
  if (colaboradores === "500+") return { label: "Tier 1", desc: "500+ colaboradores", color: "#F4A736" };
  if (colaboradores === "101-500") return { label: "Tier 2", desc: "101-500 colaboradores", color: "#2FB2C0" };
  if (colaboradores && colaboradores !== "") return { label: "Tier 3", desc: "Até 100 colaboradores", color: "#9E9E9E" };
  return null;
}
```

### Mudanças em `src/components/admin/LeadCard.tsx`

1. Calcular tier a partir de `lead.colaboradores` (campo já disponível no objeto `Lead`)
2. Envolver o ícone `Building2` existente (linha do nome da empresa) com `Tooltip` + `TooltipTrigger`/`TooltipContent`
3. Aplicar a cor do tier ao ícone via `style={{ color: tierInfo.color }}`
4. Tooltip exibe: "Tier 1 — 500+ colaboradores"
5. Se não houver dados de colaboradores, manter o ícone cinza atual sem tooltip de tier

### Arquivo impactado

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/LeadCard.tsx` | Colorir `Building2` por tier + tooltip |

Sem migração SQL.

