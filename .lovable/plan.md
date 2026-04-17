
## Fix: Regras do Email de Balanço Diário (18:00)

### Problema raiz
O email conta tipos de atividade que **não existem** na tabela `lead_activities`:
- `call_agendada` → não existe (correto: `stage_mudou` com `metadata.to = 'call_agendada'`)
- `fechado` → não existe (correto: `stage_mudou` com `metadata.to = 'fechado'`)
- `proposta_enviada` existe mas só teve **3 ocorrências em 7 dias** — o real é `proposta_gerada` (e ainda assim, propostas geradas ≠ enviadas)

Por isso "Agendamentos: 0" e "Deals: 0" em todos os relatórios.

### Atividades reais no banco (últimos 7 dias)
`stage_mudou` (61), `follow_up_agendado` (231), `proposta_gerada` (5), `proposta_enviada` (3), `perdido` (31), `welcome_enviado` (44), `whatsapp_enviado` (47), etc.

### Novas regras propostas

| Métrica do email | Regra atual (quebrada) | Regra correta |
|---|---|---|
| **Avanços** | `activity_type = 'stage_mudou'` (conta retrocessos também) | `stage_mudou` onde `metadata.to` é avanço (ordem do funil: `boas_vindas → em_contato → call_agendada → proposta → fechado`). Ignora retrocessos. |
| **Agendamentos** | `activity_type = 'call_agendada'` (não existe) | `stage_mudou` onde `metadata.to = 'call_agendada'` |
| **Propostas** | `activity_type = 'proposta_enviada'` (subutilizado) | `proposta_gerada` (5 em 7d) — é o evento que marca o envio real da proposta no CRM |
| **Deals** | `activity_type = 'fechado'` (não existe) | `stage_mudou` onde `metadata.to = 'fechado'` |

### Mudança no código

Em `supabase/functions/check-notifications/index.ts` (linhas ~268-285), trocar:

```ts
.select("user_id, activity_type")
```
por:
```ts
.select("user_id, activity_type, metadata")
```

E reescrever o agregador:
```ts
const STAGE_ORDER = ['novo','boas_vindas','em_contato','call_agendada','proposta','fechado'];
for (const a of (activities || [])) {
  if (!a.user_id) continue;
  if (!userStats[a.user_id]) userStats[a.user_id] = { stageChanges:0, appointments:0, proposals:0, deals:0 };
  
  if (a.activity_type === "stage_mudou") {
    const to = a.metadata?.to, from = a.metadata?.from;
    const fwd = STAGE_ORDER.indexOf(to) > STAGE_ORDER.indexOf(from);
    if (fwd) userStats[a.user_id].stageChanges++;
    if (to === "call_agendada") userStats[a.user_id].appointments++;
    if (to === "fechado") userStats[a.user_id].deals++;
  }
  if (a.activity_type === "proposta_gerada") userStats[a.user_id].proposals++;
}
```

### Decisão a confirmar
Sobre "Propostas": usar `proposta_gerada` (5) ou somar `proposta_gerada + proposta_enviada` (8)?
- **Recomendação**: `proposta_gerada` apenas — é o evento criado quando a proposta é gerada no CRM (a maioria dos envios). `proposta_enviada` parece ser um evento legado/raro.

### Arquivo impactado
| Arquivo | Mudança |
|---|---|
| `supabase/functions/check-notifications/index.ts` | Reescrever lógica de agregação no bloco `daily-performance` (linhas ~268-285) + redeploy |

Sem migrações.
