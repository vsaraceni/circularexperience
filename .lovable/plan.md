

## Correção do Espaço em Branco e Ações no Bottom Bar

### Problema

1. **Espaço em branco gigante** na aba Atividades — o conteúdo (nota + timeline) fica empurrado para baixo porque o flex layout reserva espaço sem preenchê-lo corretamente
2. **Ações rápidas** só existem na aba "Resumo" — ao trocar de aba, perde-se acesso às ações do lead
3. Aba Follow-ups também tem espaço desperdiçado quando há poucos itens

### Solução

Mover os **botões de ação rápida para um footer fixo no bottom do drawer**, **fora** das Tabs. Assim ficam visíveis em qualquer aba.

#### Estrutura do drawer (de cima pra baixo)

```text
┌─ SheetHeader (empresa + badges) ─────────┐
├─ TabsList (Resumo | Follow-ups | Atividades) ─┤
├─ TabsContent (scroll interno, flex-1) ────┤
│   conteúdo da aba ativa ocupa todo espaço │
├─ Footer fixo (border-top) ────────────────┤
│   botões de ação rápida do estágio atual  │
└───────────────────────────────────────────┘
```

#### Mudanças por aba

| Aba | O que muda |
|-----|-----------|
| **Resumo** | Remove o bloco de ações do final do TabsContent. Accordion preenche todo o espaço. |
| **Follow-ups** | Conteúdo alinhado ao topo, sem gap. Sem mudança funcional. |
| **Atividades** | Nota + botão "Salvar nota" no topo, timeline logo abaixo com scroll. Sem espaço vazio. |

#### Footer fixo (novo)

- Posicionado **depois** do `</Tabs>`, dentro do `SheetContent`
- `shrink-0`, `border-t`, `pt-3`, `pb-2`
- Mesma grid 2 colunas com os ActionBtn existentes
- Lógica por estágio idêntica à atual (só muda de lugar)

### Arquivo impactado

| Arquivo | Mudança |
|---------|---------|
| `LeadDrawer.tsx` | Extrair bloco de ações de dentro de `TabsContent[resumo]` para footer fixo fora das Tabs. Ajustar classes CSS das 3 abas para eliminar whitespace. |

