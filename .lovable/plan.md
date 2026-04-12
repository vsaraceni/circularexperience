

## Coluna "Última Atividade" — Exibir tipo da atividade + data

### Problema atual

A célula mostra apenas `last_activity_at` (timestamp do lead), sem indicar **qual** foi a atividade. O tipo/conteúdo está na tabela `lead_activities`, que não é carregada no PriorityListView.

### Solução

**1. Buscar a última atividade de cada lead** — nova query no componente

- Fazer uma query única: `lead_activities` ordenada por `created_at desc`, agrupada por `lead_id` (pegar apenas a mais recente de cada lead)
- Alternativa mais simples e eficiente: buscar todas as atividades mais recentes via query com `distinct on` não disponível no SDK — então buscar as atividades ordenadas por `created_at desc` com limit razoável e montar um map `lead_id → { activity_type, content, created_at }` pegando apenas a primeira ocorrência de cada lead
- Armazenar num `lastActivityMap` via `useMemo`

**2. Exibir na célula**

Formato:
```text
📞 Call agendada
14 Abr 2025
```

- Linha 1: ícone pequeno (reutilizar o ICON_MAP do ActivityTimeline) + label legível do tipo
- Linha 2: data formatada (como já está hoje)
- Se não houver atividade registrada, mostrar só a data como fallback

**3. Mapa de labels legíveis** para os `activity_type`:

```text
lead_recebido → "Lead recebido"
welcome_enviado → "Welcome enviado"  
stage_mudou → "Mudou de etapa"
call_agendada → "Call agendada"
whatsapp_enviado → "WhatsApp enviado"
proposta_gerada → "Proposta gerada"
nota_manual → "Nota adicionada"
contato_registrado → "Contato registrado"
...etc
```

**4. Filtro na coluna** — por tipo de última atividade

- Opções dinâmicas: extrair os tipos únicos presentes nos leads filtrados
- Ex: filtrar para ver "todos os leads cuja última atividade foi WhatsApp enviado"
- Adicionar `filterUltimaAtiv` state + `ColumnFilter` no header

**5. Ordenação** — já funciona (ordena por data), manter como está

---

### Arquivos impactados

| Arquivo | Mudança |
|---|---|
| `src/components/admin/PriorityListView.tsx` | Query de `lead_activities`, montar `lastActivityMap`, atualizar célula, adicionar filtro por tipo |

Nenhuma migração necessária.

