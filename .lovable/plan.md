

## Plano: Dropdown para reutilizar Escopo/Considerações de propostas anteriores

### Impacto
- **Apenas 1 arquivo editado**: `src/components/admin/ProposalForm.tsx`
- **Sem migração de banco** — usa dados já disponíveis na tabela `proposals`
- **Risco baixo** — não altera nenhum fluxo existente, apenas adiciona um botão auxiliar

### O que será feito

1. **Buscar as 5 últimas propostas** ao montar o formulário (query Supabase: `select id, title, company_name, scope, considerations from proposals order by created_at desc limit 5`).

2. **Adicionar um botão "Importar de proposta anterior"** ao lado do label de cada campo (Escopo e Considerações). Ao clicar, abre um Popover/dropdown listando as 5 propostas (exibindo título + empresa).

3. **Ao selecionar uma proposta**, o conteúdo do campo correspondente (`scope` ou `considerations`) é copiado para o campo atual, substituindo o que havia.

### Detalhes técnicos
- Componente auxiliar inline (ou extraído) usando `Popover` + lista simples
- `useEffect` com query ao Supabase no mount do `ProposalForm`
- Estado `recentProposals` armazena as 5 últimas
- Cada campo (escopo/considerações) terá seu próprio botão de importação

