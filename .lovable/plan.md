

## Evolução Visual e UX do CRM Pipeline

### Escopo

Refatoração visual completa da página Pipeline (`Proposals.tsx`) e seus componentes filhos (navbar, filtros, colunas, cards), aplicando design system com tokens de cor, tipografia Inter, espaçamento 4px, e sombras padronizadas. Nenhuma lógica de negócio será alterada.

### Ordem de execução (8 etapas)

#### 1. Design System — CSS tokens (`index.css`)

Adicionar variáveis CSS no `:root` para todas as cores do briefing (brand, urgency, stage, text, bg, border) e sombras dos cards (repouso, hover, dragging). Inter já está importada. Ajustar `body` para usar Inter como font principal em todo o app. Manter as variáveis HSL existentes para não quebrar componentes shadcn.

#### 2. Navbar — 3 zonas (`Proposals.tsx`)

Redesenhar o `<header>` com 3 zonas:

- **Esquerda**: Logo + "CRM" (Inter 14px muted) + toggle grid/lista (fundo `--color-bg-subtle`, ativo com fundo brand)
- **Centro**: Apenas Dashboard (ícone + label)
- **Direita**: NotificationBell + Avatar circular com iniciais do usuário (fundo brand-light, texto brand). Click no avatar abre `DropdownMenu` com: Meu Perfil, Email de Boas-Vindas, Ir para o Site ↗, Sair

Altura 56px, fundo branco, border-bottom `--color-border`, sem sombras.

#### 3. Header da página (`Proposals.tsx`)

- Título "Pipeline Comercial" — Inter 22px Bold `--color-text-primary`
- Direita: "Ver Perdidos" (outlined com cor brand) + "+ Nova Proposta" (filled brand). Border-radius 8px, gap 8px.

#### 4. Barra de filtros (`Proposals.tsx`)

Padronizar todos os controles visuais:
- Search, Origem, Responsável, Período — mesmo estilo (borda `--color-border`, radius 8px)
- Novo dropdown **"Status"** substituindo os botões soltos "Vencidos" e "Atenção": opções Todos / Vencidos / Atenção / No prazo
- Quando filtro ativo: borda brand, texto brand, fundo brand-light
- Mover ordenação para linha separada: label "Ordenar por:" + 3 pills (Urgência/Chegada/Parados) com estilo pill-radius 20px, ativo brand filled

#### 5. Colunas Kanban (`KanbanColumn.tsx`)

- Header: barra colorida 3px topo (usar `--color-stage-*`), nome Inter 13px SemiBold, badge contador em `--color-bg-subtle`, badge atrasados em fundo `#FDEDED` texto `#D32F2F`, valor monetário em verde à direita
- Corpo: fundo `#F7F8FA`, border-radius 12px, padding 12px
- Empty state: ícone + texto cinza centralizado
- Scrollbar customizada (thin, cor `--color-border`)
- Atualizar cores dos estágios em `KanbanBoard.tsx` STAGES para usar os novos tokens

#### 6. LeadCard (`LeadCard.tsx`) — componente principal

Anatomia top-down:
```text
┌──────────────────────────────────┐
│ Empresa (14px SemiBold)  [Badge] │
│ 👤 Contato (13px #555)  [Avatar] │
│ ──────────────────────────────── │
│ [Pill próxima ação]              │
│ [CTA primário]  [CTA secundário] │
└──────────────────────────────────┘
```

- **Badge de tempo**: ícone + cor semântica (verde/amarelo/laranja/vermelho) conforme thresholds, radius 12px, 11px
- **Avatar responsável**: 28px, fundo brand-light, texto brand, tooltip com nome completo, `aria-label`
- **Divisória**: 1px `#F0F0F0`
- **Pill próxima ação**: fundo `--color-bg-subtle`, texto `#555`, radius 20px, 11px
- **Ações**: max 2 visíveis, CTA primário cor brand bold, secundário muted. Área mínima 44px height
- **Card atrasado (critical)**: borda esquerda 3px `#D32F2F`, fundo `#FFFAFA`
- **Hover**: sombra aumenta para hover token
- **Dragging**: sombra dragging token, opacity 90%, rotate 2deg
- Follow-up badges permanecem como estão

#### 7. UrgencyBadge (`UrgencyBadge.tsx`)

Atualizar `LEVEL_CLASSES` para usar os novos tokens de cor com ícone textual (✅/⚠️/🔶/🔴) prefixado ao tempo. Manter a mesma lógica de `getUrgencyLevel`.

#### 8. Acessibilidade (transversal)

- `aria-label` em todos os ícones funcionais (X perdido, ações do card, toggle view, avatar)
- `aria-hidden="true"` em ícones decorativos (Building2, User)
- Foco visível: `outline 2px solid #5B2D8E`, `outline-offset: 2px` (utility class global)
- Transições: `transition: all 0.15s ease` nos hover states

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `index.css` | Tokens CSS (cores, sombras, foco), fundo geral `#F0F2F5` |
| `Proposals.tsx` | Navbar 3 zonas com dropdown conta, header simplificado, filtros padronizados com dropdown Status, pills de ordenação |
| `KanbanBoard.tsx` | Cores STAGES atualizadas, sort pills movidos para cá ou removidos (sort já está aqui), DragOverlay com rotate+sombra |
| `KanbanColumn.tsx` | Header redesenhado, fundo coluna, scrollbar custom, empty state com ícone |
| `LeadCard.tsx` | Anatomia completa redesenhada, sombras, borda esquerda critical, hover/drag states, acessibilidade |
| `UrgencyBadge.tsx` | Cores novas + ícone prefix |
| `tailwind.config.ts` | Adicionar `fontFamily.sans` com Inter como primeira opção |

### O que NÃO muda

- Lógica de negócio, drag-and-drop, integrações, dados
- Dashboard, Perfil, configurações — só Pipeline
- Estágios e suas regras de SLA

