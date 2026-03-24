

## Excluir proposta duplicada + Garantir 1 proposta por lead

### 1. Excluir proposta antiga (via insert tool)

Deletar a proposta `d94df1bb-5efc-4665-9518-dc621763baa2` (slug `prop-549d09c9`, ALD Bioenergia antiga com escopo/considerações vazios).

### 2. Constraint no banco (migration)

```sql
CREATE UNIQUE INDEX unique_lead_proposal ON proposals(lead_id) WHERE lead_id IS NOT NULL;
```

Isso impede mais de uma proposta por lead. Propostas sem lead (manual sem vínculo) não são afetadas.

### 3. Validação no código (`Proposals.tsx`)

Na função `handleSave`, antes de inserir nova proposta, verificar se o `lead_id` já possui proposta:

```typescript
if (finalLeadId) {
  const { data: existing } = await supabase
    .from("proposals")
    .select("id")
    .eq("lead_id", finalLeadId)
    .maybeSingle();
  if (existing) {
    toast.error("Este lead já possui uma proposta.");
    return;
  }
}
```

### 4. Botão "Elaborar Proposta" no Kanban (`KanbanBoard.tsx`)

Na ação `create_proposal`, verificar se já existe proposta para o lead. Se sim, exibir toast de aviso ao invés de abrir o formulário.

### Arquivos impactados

| Arquivo | Ação |
|---------|------|
| — | DELETE proposta antiga (insert tool) |
| migration | Unique index parcial em `proposals.lead_id` |
| `Proposals.tsx` | Validação antes de insert |
| `KanbanBoard.tsx` | Check antes de abrir form de proposta |

