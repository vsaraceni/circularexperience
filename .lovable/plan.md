

## Evoluir Painel Estratégico — Campanhas com Metas

### Visão Geral

Substituir o modelo de barras de progresso sem referência por um sistema de **campanhas com metas**. Cada campanha tem nome, datas, e metas por KPI. O painel exibe a campanha ativa em destaque com contagem regressiva.

### 1. Tabela `campaigns` (migração SQL)

```sql
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- "Campanha Mês do Meio Ambiente"
  starts_at date not null,
  ends_at date not null,
  goals jsonb not null default '{}',     -- {"em_contato_pct": 40, "agendamentos_pct": 50, "propostas_pct": 60, "deals_count": 5, "deals_value": 100000}
  is_active boolean not null default true,
  created_at timestamptz default now()
);
alter table campaigns enable row level security;
-- Leitura para todos autenticados, escrita para admin
create policy "Authenticated read campaigns" on campaigns for select to authenticated using (true);
create policy "Admin manage campaigns" on campaigns for all to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
```

Seed com campanha exemplo:
```sql
INSERT INTO campaigns (name, starts_at, ends_at, goals) VALUES (
  'Campanha Mês do Meio Ambiente',
  '2026-04-01', '2026-04-30',
  '{"em_contato_pct": 40, "agendamentos_pct": 50, "propostas_pct": 60, "deals_count": 5, "deals_value": 100000}'
);
```

### 2. Atualizar `role_label` do Vinicius

```sql
UPDATE profiles SET role_label = 'closer' WHERE id = '676d1c91-1610-4478-a637-59445038753b';
```

### 3. Lógica de KPIs baseada na campanha

Filtrar leads pelo período da campanha (`created_at` entre `starts_at` e `ends_at`):

| KPI | Cálculo | Meta (exemplo) |
|-----|---------|----------------|
| Em Contato | leads em_contato+ / total leads do período | 40% |
| Agendamentos | leads call_agendada+ / leads em_contato+ | 50% |
| Propostas | leads proposta+ / leads call_agendada+ | 60% |
| Deals fechados | count de fechados no período | 5 |
| R$ Vendas | soma investment dos fechados | R$ 100k |

Barra de progresso = valor atual / meta. Cores: verde ≥80%, âmbar ≥50%, vermelho <50%.

### 4. Layout do Painel reformulado

```text
┌─────────────────────────────────────────────────────────────────┐
│ 🎯 Campanha Mês do Meio Ambiente          Faltam 27 dias  [⚙️] │
├─────────────────────────────────────────────────────────────────┤
│ [Em Contato ██████ 75%] [Agendamentos ███ 40%] [Propostas ██ 30%] [Deals 2/5] [R$ 45k/100k] │
├─────────────────────────────────────────────────────────────────┤
│ [Pipeline cards: 7 etapas com contagem + SLA]                   │
├────────────────────────────┬────────────────────────────────────┤
│       SDR (Lívia)          │        Closer (Alinye + Vinicius) │
├────────────────────────────┴────────────────────────────────────┤
│ [Funil de Conversão]       │ [Ações do Dia]                    │
└─────────────────────────────────────────────────────────────────┘
```

- **Seção "Alertas" removida** — espaço redistribuído para SDR e Closer (50/50)
- **Banner da campanha** no topo com nome, contagem regressiva e botão de config (admin)
- **Summary bar** reformulada: 5 cards com progresso vs meta da campanha
- Pipeline cards: barra SLA mostra "—" quando total = 0 (ao invés de 100%)

### 5. Dialog de gerenciamento de campanhas (admin)

Botão ⚙️ abre dialog com:
- Lista de campanhas (ativa marcada)
- Formulário: nome, data início/fim, metas por KPI
- Botão criar nova / editar existente / ativar/desativar

### 6. Arquivos afetados

| Arquivo | Ação |
|---------|------|
| Migração SQL | Criar tabela `campaigns`, seed, update role_label Vinicius |
| `src/hooks/useStrategicDashboard.ts` | Buscar campanha ativa, filtrar leads por período, calcular KPIs vs metas, remover `alerts` |
| `src/pages/admin/StrategicDashboard.tsx` | Banner campanha no topo, summary bar com metas, remover seção Alertas, SDR+Closer 50/50, dialog de campanhas, fix barra 0=100% |

