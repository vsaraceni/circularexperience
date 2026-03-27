

## Enriquecer Lead com Site e Descrição via Firecrawl + IA

### Passo 1 — Conectar Firecrawl

O Firecrawl ainda nao esta conectado ao workspace. Sera necessario conecta-lo antes de implementar.

### Passo 2 — Migration: 2 colunas novas em `leads`

```sql
ALTER TABLE leads ADD COLUMN company_website text DEFAULT '';
ALTER TABLE leads ADD COLUMN company_description text DEFAULT '';
```

### Passo 3 — Edge Function `enrich-lead`

Nova function que:
1. Recebe `lead_id`
2. Busca o lead no banco (email + company)
3. Extrai dominio do email corporativo (ex: `joao@aldenergia.com.br` → `aldenergia.com.br`)
4. Ignora dominios genericos (gmail, hotmail, outlook, yahoo)
5. Usa Firecrawl scrape (`formats: ['summary']`) para obter resumo do site
6. Se Firecrawl falhar ou dominio generico, usa Lovable AI (Gemini Flash) para gerar descricao baseada apenas no nome da empresa
7. Salva `company_website` e `company_description` no lead
8. Registra atividade `empresa_enriquecida` na timeline

### Passo 4 — UI no LeadDrawer

Na aba Resumo, adicionar:
- Linha "Site" com icone Globe + link clicavel (se preenchido)
- Bloco "Sobre a empresa" com texto da descricao (se preenchido)
- Botao "Enriquecer" com icone Sparkles — chama a edge function via `supabase.functions.invoke('enrich-lead')`
- Loading state enquanto processa

### Passo 5 — Atualizar interface Lead

Adicionar `company_website` e `company_description` ao type `Lead` em `LeadList.tsx`.

### Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| migration | 2 colunas em `leads` |
| `supabase/functions/enrich-lead/index.ts` | Nova edge function |
| `src/components/admin/LeadDrawer.tsx` | Exibir site + descricao + botao enriquecer |
| `src/components/admin/LeadList.tsx` | 2 campos no type Lead |

### Prerequisito

Conectar Firecrawl ao projeto antes de implementar. Sera solicitado no inicio da implementacao.

