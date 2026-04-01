

## Nomes completos nas missões

Trocar os labels abreviados pelos nomes por extenso no array de missões em `MissionsBanner.tsx`:

| Atual | Novo |
|-------|------|
| `"FU"` | `"Follow-up"` |
| `"Agend."` | `"Agendamento"` |
| `"Calls"` | `"Calls"` (já está completo) |
| `"Brief."` | `"Briefing"` |
| `"Novos"` | `"Novos"` (já está completo) |

Também atualizar os headers correspondentes na tabela do popover de time (linhas ~167-171) de `"FU"`, `"Agend."`, `"Brief."` para os nomes completos.

**Arquivo**: `MissionsBanner.tsx` — 5 linhas de label no array de missões + 3 headers na tabela do popover.

