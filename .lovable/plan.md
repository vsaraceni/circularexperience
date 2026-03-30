

## Ícone ⓘ com Tooltip de SLA no Header da Coluna

### O que muda

Adicionar um ícone `Info` (lucide-react) ao lado do nome de cada etapa no header da coluna Kanban. No hover, exibe um tooltip com os limites de SLA daquele estágio.

### Implementação

**Arquivo**: `src/components/admin/KanbanColumn.tsx`

1. Importar `Info` de `lucide-react` e `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` de `@/components/ui/tooltip`
2. Exportar o `SLA_CONFIG` de `UrgencyBadge.tsx` (já exportável, basta importar)
3. No header, após o `<span>` do nome da etapa, adicionar:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Info className="h-3.5 w-3.5 cursor-help opacity-40 hover:opacity-70" />
  </TooltipTrigger>
  <TooltipContent side="bottom">
    {/* Ex: "⚠️ Atenção: 2h · 🔴 Crítico: 6h" */}
  </TooltipContent>
</Tooltip>
```

4. Criar helper local que lê `SLA_CONFIG[stage.id]` e formata o texto:
   - Se `useHours`: `"⚠️ ${warningH}h · 🔴 ${criticalH}h"`
   - Se dias: `"⚠️ ${warningD}d · 🔴 ${criticalD}d"`
   - Estágios sem SLA (fechado): não renderiza o ícone

5. Envolver o componente `KanbanColumn` (ou o board inteiro) com `<TooltipProvider>` se ainda não estiver presente

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `KanbanColumn.tsx` | Ícone Info + Tooltip com SLA por estágio |
| `UrgencyBadge.tsx` | Exportar `SLA_CONFIG` (adicionar `export` ao const) |

