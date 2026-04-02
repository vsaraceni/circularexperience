## Campos de Qualificação — Implementação

### Análise do PRD vs estado atual

O PRD pede 2 colunas novas: `cargo` e `colaboradores`. Porém **`cargo` já existe** na tabela `leads` e já é exibido no Drawer. A única mudança real é:

1. **Nova coluna `colaboradores`** (porte da empresa)
2. **Exibir `colaboradores` no CRM** com formatação adequada
3. **Sempre exibir cargo e colaboradores** (hoje cargo é condicional — só aparece se preenchido; o PRD pede exibir `—` quando vazio)

O PRD também menciona que leads de Meta Ads trazem cargo/colaboradores colapsados no campo `mensagem`. Isso implica que o fluxo de ingestão de leads do Meta Ads (que não passa pela LP) precisará parsear esses campos. Porém o PRD diz que isso fica fora do escopo — os campos chegam preenchidos separadamente.

### Mudanças

**1. Migration SQL**
- `ALTER TABLE leads ADD COLUMN IF NOT EXISTS colaboradores TEXT;`
- `CREATE INDEX IF NOT EXISTS idx_leads_colaboradores ON leads (colaboradores);`

**2. Interface Lead (LeadList.tsx)**
- Adicionar `colaboradores?: string | null` à interface `Lead`

**3. LeadDrawer.tsx — Seção "Dados do Lead"**
- Cargo: mudar de condicional (`{lead.cargo && ...}`) para sempre visível, com `—` quando vazio
- Colaboradores: nova `InfoRow` com ícone `Building2`, label "Porte", valor formatado
- Posição: após Origem, antes de Responsável (conforme PRD)
- Helper de formatação inline para `colaboradores`:

| Valor bruto | Exibido |
|---|---|
| `1_a_10` | 1 a 10 |
| `501_a_2000` | 501 a 2.000 |
| `mais_de_2000` | Mais de 2.000 |
| `null` | — |

**4. send-lead-email (Edge Function)** — Sem mudança necessária agora. Leads da LP já enviam `cargo` separado. Quando Meta Ads for integrado, o parsing será feito nessa função.

### O que NÃO muda
- Lógica de status, follow-ups, atividades
- Campo `mensagem`
- Fluxo de email de boas-vindas
- RLS (novas colunas herdam políticas existentes)

### Arquivos impactados

| Arquivo | Mudança |
|---|---|
| Migration SQL | Nova coluna `colaboradores` + índice |
| `LeadList.tsx` | Interface `Lead` += `colaboradores` |
| `LeadDrawer.tsx` | Exibir Cargo (sempre) + Porte (novo) na seção Dados do Lead |
