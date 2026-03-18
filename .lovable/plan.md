

## Plano: Destacar nome da empresa na aba Leads

Alterar `LeadList.tsx` para exibir `lead.company` como título principal (h3 bold) e `lead.name` como informação secundária junto aos demais metadados.

### Alteração em `src/components/admin/LeadList.tsx`

- Trocar `lead.name` no `<h3>` por `lead.company` (com fallback "Sem empresa")
- Mover `lead.name` para a linha de metadados (com ícone de usuário)
- Remover a entrada duplicada de company dos metadados

