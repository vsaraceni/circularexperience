

## Dashboard de Indicadores — Plano de Implementação

### O que será construído

Uma página `/admin/dashboard` com métricas visuais do pipeline comercial, acessível por um botão no header do CRM.

### Componentes do Dashboard

**Cards de métricas (topo)**
- Leads total (ativos, excluindo perdidos/arquivados)
- Em aberto (estágios novo → nutrição)
- Propostas enviadas (count de `proposal_submissions`)
- Taxa de conversão (fechados ÷ total histórico)
- Pipeline total (soma dos investimentos das propostas vinculadas a leads ativos)

**Funil de conversão (centro-esquerda)**
- Gráfico de barras horizontais com contagem por estágio (novo → fechado)
- Usa os 7 estágios do STAGES array

**Leads por fonte (centro-direita)**
- Gráfico de pizza/donut agrupando por campo `origem`

**Taxa de perda por motivo (baixo-esquerda)**
- Gráfico de barras com os 6 motivos de perda

**Leads por responsável (baixo-direita)**
- Gráfico de barras agrupando por `assigned_to` (cruzando com `profiles.full_name`)

### Filtros

Barra de filtros no topo: período (últimos 30/60/90 dias ou tudo), responsável, fonte.

### Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/pages/admin/Dashboard.tsx` | **Novo** — página principal do dashboard |
| `src/App.tsx` | Rota `/admin/dashboard` com ProtectedRoute |
| `src/pages/admin/Proposals.tsx` | Botão "Dashboard" no header, ao lado de "Ver Perdidos" |

### Detalhes técnicos

- Dados lidos via `supabase.from("leads").select("*")` + `supabase.from("proposals").select("*")` + `supabase.from("proposal_submissions").select("*")` + `supabase.from("profiles").select("id, full_name")`
- Cálculos feitos client-side (volume baixo de dados)
- Gráficos usando Recharts (já instalado via shadcn/ui chart)
- Sem migrations necessárias — todos os dados já existem no banco

