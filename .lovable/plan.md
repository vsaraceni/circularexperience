

## Avaliação do PRD e Plano de Implementação: Visão "Prioridades"

### Avaliação do PRD

O PRD é sólido e bem estruturado. Algumas adaptações para alinhar com o que já existe no projeto:

**O que já existe e podemos reaproveitar:**
- SLA por estágio já existe em `UrgencyBadge.tsx` (com cálculos de urgência critical/warning/normal)
- Drawer lateral do lead já existe (`LeadDrawer.tsx`) com abas completas
- Filtros de Origem, Responsável, Período e Status já existem no Pipeline
- Sistema de stages e labels já mapeado no Kanban

**Ajustes ao PRD:**
- Os nomes de estágio no banco são diferentes dos do PRD (ex: `boas_vindas`, `em_contato`, `call_agendada`). Vamos usar os existentes.
- O SLA já é calculado em horas/dias pelo `UrgencyBadge` — vamos reaproveitar essa lógica em vez de criar outra.
- O campo `stage_updated_at` já existe na tabela `leads` e já é atualizado quando o lead muda de estágio, então **não precisamos** de `ultima_movimentacao_em`.
- Precisamos adicionar apenas 2 colunas novas: `valor_proposta` e `proxima_acao`.

---

### Plano de Implementação

#### 1. Migração SQL — adicionar 2 campos ao leads

```sql
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS valor_proposta numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS proxima_acao text DEFAULT NULL;
```

#### 2. Novo componente: `PriorityListView`

Lista vertical de leads agrupados por faixa de urgência (Vencidos / Hoje / Próximos), usando a lógica de `getUrgencyLevel` já existente:
- `critical` → Vencidos (fundo vermelho suave)
- `warning` → Hoje (fundo amarelo suave)
- `normal` → Próximos (fundo verde suave)

Cada grupo é colapsável. Grupos vazios ficam ocultos.

**Card horizontal** com: badge da etapa, empresa em destaque, tempo na etapa com cor de urgência, contato + cargo + porte, valor da proposta (quando preenchido e etapa >= proposta), próxima ação em itálico. Clique abre o Drawer lateral existente.

**Ordenação dentro do grupo:** empresa maior (campo `colaboradores` mapeado para peso numérico), depois maior `valor_proposta`, depois mais antigo na etapa.

#### 3. Filtros na visão Prioridades

Reaproveitar os filtros existentes do Pipeline (Origem, Responsável, Período, Status de urgência) e **adicionar um filtro por Etapa do funil** (ex: ver só `call_agendada`, `proposta`, `nutricao`). O filtro de etapa é um multi-select com as opções: Novo, Boas-Vindas, Em Contato, Call Agendada, Proposta, Nutrição.

Busca textual por nome, empresa ou email (já existe).

Ordenação: SLA (padrão), mais antigo, mais recente, maior valor, maior empresa.

#### 4. Toggle Kanban ↔ Prioridades no Pipeline

Adicionar um toggle no topo da página Pipeline que alterna entre a visão Kanban (atual) e a visão Prioridades. A escolha persiste via `localStorage`.

Não será uma rota separada — é um modo de visualização dentro da mesma página `/admin/pipeline`.

#### 5. Campos novos no Drawer lateral

No `LeadDrawer.tsx`, adicionar ao topo da aba Resumo:
- **Próxima ação** — campo de texto livre, salva no `leads.proxima_acao`
- **Valor da proposta** — campo numérico R$, salva em `leads.valor_proposta`
- **Botão "Avançar Etapa"** — move para a próxima etapa do pipeline, reseta `stage_updated_at`. Na última etapa ativa, vira "Marcar como Ganho" / "Marcar como Perdido".

#### 6. Atualização em tempo real

Quando o lead avança de etapa ou tem dados alterados, a lista Prioridades se reordena sem reload.

---

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| Migração SQL | `ADD COLUMN valor_proposta, proxima_acao` |
| `src/pages/admin/Pipeline.tsx` | Toggle Kanban/Prioridades, filtro por etapa |
| `src/components/admin/PriorityListView.tsx` | **Novo** — componente da lista de prioridades |
| `src/components/admin/PriorityCard.tsx` | **Novo** — card horizontal do lead |
| `src/components/admin/LeadDrawer.tsx` | Campos próxima ação, valor proposta, botão avançar etapa |
| `src/components/admin/LeadList.ts` (type) | Adicionar `valor_proposta` e `proxima_acao` à interface Lead |

### Não será feito (fora de escopo)
- Rota `/admin/prioridades` separada — fica como toggle dentro do Pipeline
- Coluna `ultima_movimentacao_em` — já existe `stage_updated_at`

