

## Reorganizar ações do card de Proposta + visão de evolução

### Parte 1 — Reordenar ícones (jornada natural)

No card de proposta em `/admin/propostas`, os botões de ação seguem hoje uma ordem técnica. Vou reorganizar para refletir a **jornada da proposta**:

**Nova ordem (esquerda → direita):**
1. **Aviso de status** (status transitions: marcar como Enviada / Fechada / Perdida / Reverter) — *o "próximo passo"*
2. **Baixar proposta** (PDF) — *artefato pronto*
3. **Enviar proposta** (Gmail com template) — *ação de envio*
4. **Editar proposta** — *ajuste*
5. **Deletar proposta** — *destrutivo, sempre por último*

Além da reordenação, para clareza visual:
- Adicionar um **separador vertical sutil** (`<div className="w-px h-5 bg-border mx-1" />`) entre os grupos: `[status] | [baixar + enviar] | [editar] | [deletar]`. Isso agrupa visualmente sem poluir.
- Padronizar a cor do ícone "Enviar proposta" (hoje usa `--color-brand` inline, fora do padrão dos demais) para `text-foreground` / `text-muted-foreground` como os outros — só o destrutivo (deletar) e os de status (verde/azul/vermelho) ficam coloridos.
- Tooltips já existentes via `title=` mantidos.

**Arquivo impactado:** `src/components/admin/ProposalList.tsx` (somente reordenação JSX + separadores + cor do ícone).

---

### Parte 2 — Proposta de evolução para algo mais robusto

Para não inflar o card (já tem 5–6 ícones), e dar uma experiência de "centro de controle da proposta", proponho evoluir em **três camadas opcionais**, cada uma plugável sem reescrever o que existe:

#### A. Menu de ações secundárias (curto prazo, baixo impacto)
- Manter **3 ações primárias visíveis**: `Avançar status`, `Baixar PDF`, `Enviar`.
- Mover `Editar` e `Excluir` para um menu **"⋯" (More)** usando `DropdownMenu` do shadcn.
- Ganho: card mais limpo, foco nas ações da jornada, ações destrutivas/menos frequentes ficam um clique mais "protegidas".

#### B. Linha do tempo da proposta (médio prazo)
Adicionar um indicador discreto abaixo do título mostrando o estágio atual da jornada:

```text
● Criada ──── ● Enviada ──── ○ Fechada
```

- 3 bolinhas (Rascunho → Enviada → Fechada/Perdida), preenchidas conforme o status.
- Ao clicar numa bolinha não-preenchida, dispara o mesmo `onStatusChange`. Substitui ícones de status por uma metáfora visual mais intuitiva.
- Reusa o componente `Badge` + uns `<Circle />` do lucide. Sem nova tabela.

#### C. Painel lateral de detalhes (longo prazo, opcional)
Hoje, clicar no card só leva para edição. Proposta:
- Click no título abre um **Sheet** lateral (mesma metáfora do `LeadDrawer`) com:
  - Histórico de envios (já temos `lead_activities` com `proposta_enviada_email`).
  - Templates usados, datas, quem enviou.
  - Atalho para o lead vinculado.
  - Botão grande "Enviar nova versão" (reabre seletor de template).
- Vira o "centro de controle" da proposta sem inflar a listagem.

#### D. (Bônus) Indicador de "envio pendente"
Hoje, um rascunho que ainda não virou "Enviada" não tem sinal visual de urgência. Proposta:
- Badge sutil `Aguardando envio há 3 dias` em rascunhos antigos (>2 dias), usando `created_at`. 
- Mesmo padrão das missões diárias do Pipeline, sem nova tabela.

---

### Recomendação de execução

**Fazer agora (este turn quando aprovado):**
- Parte 1 completa (reordenação + separadores + cor padronizada).
- Item **A** da Parte 2 (mover Editar/Excluir para menu "⋯") — é barato e já entrega a "robustez" pedida sem nova arquitetura.

**Deixar pra ondas seguintes (mediante interesse):**
- B (timeline visual), C (Sheet lateral de proposta), D (badge de envio pendente).

### Arquivos impactados (execução imediata)
- `src/components/admin/ProposalList.tsx` — reordenação, separadores, DropdownMenu para Editar/Excluir, cor do botão Enviar.

### Critério de aceite
- Ordem visível no card: **status → baixar → enviar → ⋯ (editar/excluir)**.
- Separadores verticais sutis entre os grupos.
- Ícone "Enviar" com cor padronizada (sem mais o roxo inline).
- "Editar" e "Excluir" agrupados num menu kebab, "Excluir" em vermelho com confirmação visual já no label.
- Nenhum impacto em PDF, templates, status flow, RLS ou edge functions.

