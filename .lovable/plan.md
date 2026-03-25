

## Simplificar Modo Lista — Manter apenas Rascunhos e Enviadas

### O que muda

Na view "Lista" (toggle ícone de lista), remover as abas **Leads**, **Fechadas** e **Perdidas**, mantendo apenas **Rascunhos** e **Enviadas**. Renomear o título de "Pipeline Comercial" para "Propostas" nesta view.

### Impactos

- **Zero impacto no Kanban** — leads e todos os estágios continuam funcionando normalmente no board.
- **Zero impacto no banco** — nenhuma migration necessária.
- **Funcionalidade mantida** — leads são geridos exclusivamente pelo Kanban; propostas fechadas/perdidas são acessíveis via Kanban (estágios "fechado"/"perdido"). Se precisar editar uma proposta fechada no futuro, o Kanban já permite isso via drawer.
- **LeadList.tsx** — continua existindo no código (usado pelo Kanban internamente), mas não é mais renderizado como aba.

### Alterações

**Arquivo**: `src/pages/admin/Proposals.tsx`

1. Alterar `activeTab` default de `"leads"` para `"rascunhos"`
2. Remover as abas Leads, Fechadas e Perdidas do `<TabsList>` (reduzir grid de 5 para 2 colunas)
3. Remover os `<TabsContent>` correspondentes (leads, fechadas, perdidas)
4. Alterar título "Pipeline Comercial" para "Propostas" quando `viewMode === "list"`

**1 arquivo impactado, ~30 linhas removidas.**

