

## Reordenar ações do card de Proposta (jornada correta)

### Ordem nova (esquerda → direita)

1. **Editar proposta** (lápis) — ajustar antes de qualquer envio
2. **Baixar proposta** (PDF) — gerar artefato
3. **Enviar proposta** (Gmail com template) — disparar e-mail
4. **Marcar como enviada** (check verde) — confirmar que saiu
5. **⋯ Menu kebab** — apenas Excluir (destrutivo, fora do fluxo)

Separadores verticais sutis entre os grupos:
`[editar] | [baixar + enviar + marcar enviada] | [⋯]`

### Comportamento do check "Marcar como enviada"

- **Status `rascunho`** → mostra ✓ verde com tooltip "Marcar como Enviada" → chama `onStatusChange(id, "enviada")`.
- **Status `enviada`** → o check vira dois botões pequenos: ✓ verde "Marcar como Fechada" e ✗ vermelho "Marcar como Perdida" (mantém a transição que já existe hoje).
- **Status `fechada`/`perdida`** → ícone de reverter (↻) com tooltip "Reverter para Enviada".

Assim o "check" sempre representa o **próximo passo positivo da jornada**, sem inflar o card.

### Ajustes em `src/components/admin/ProposalList.tsx`

- Reordenar o JSX dos botões na sequência acima.
- Mover **Editar** do `DropdownMenu` de volta para botão visível (primeiro da fila).
- Manter **Excluir** como única ação dentro do `DropdownMenu` (kebab `⋯`), em vermelho.
- Ajustar separadores verticais para refletir os 3 grupos novos.
- Tooltips atualizadas para refletir cada estado.

### O que NÃO muda

- `SendProposalButton`, `PdfExporter`, `onStatusChange`, `onEdit`, `onDelete` — todas as props e handlers permanecem iguais.
- Schema, RLS, edge functions, fluxo de templates — intactos.

### Arquivo impactado

- `src/components/admin/ProposalList.tsx` (somente reordenação JSX + ajuste do DropdownMenu)

### Critério de aceite

- Card exibe na ordem: **editar → baixar → enviar → ✓ marcar enviada → ⋯ (excluir)**.
- Em rascunho, o check verde aparece como próxima ação clara.
- Em enviada, aparecem os dois botões de desfecho (fechada/perdida).
- Em fechada/perdida, aparece o botão de reverter.
- Excluir continua isolado no kebab, em vermelho.

