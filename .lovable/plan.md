

## Reestruturar Navegação CRM — 4 Módulos com Hamburger no Mobile

### Arquitetura

4 módulos independentes com rotas próprias. Desktop: ícones com tooltips na navbar. Mobile: menu hamburger (Sheet) que maximiza a tela para o Kanban.

```text
Desktop (≥768px):
┌──────────────────────────────────────────────────────────────┐
│ [Logo] [🔲] [📋] [📊] [⚡]          [🔔] [Avatar ▾]       │
└──────────────────────────────────────────────────────────────┘

Mobile (<768px):
┌──────────────────────────────────────┐
│ [☰]  [Logo]            [🔔] [Avatar]│
└──────────────────────────────────────┘
  ↑ abre Sheet com links dos 4 módulos
```

### Módulos e rotas

| Rota | Módulo | Ícone | Conteúdo |
|------|--------|-------|----------|
| `/admin/pipeline` | Pipeline | `LayoutGrid` | Kanban + filtros + missões (extraído de Proposals.tsx) |
| `/admin/propostas` | Propostas | `FileText` | Lista de propostas com tabs |
| `/admin/dashboard` | Dashboard | `BarChart3` | Dashboard analítico |
| `/painel` | Painel | `Activity` | Painel estratégico |

### Mudanças

**1. Criar `src/components/admin/CrmNavbar.tsx`**
- Desktop: Logo + 4 botões ícone (Tooltip) + NotificationBell + Avatar dropdown (com Perfil, Emails, Site, Sair)
- Mobile: Logo + hamburger (Sheet lateral com 4 links + ações) + NotificationBell + Avatar compacto
- Props: `currentModule`, children opcionais para ações contextuais (ex: botão "Nova Proposta")
- Botão ativo: `bg-brand` + `text-white`

**2. Criar `src/pages/admin/Pipeline.tsx`**
- Extrair do Proposals.tsx: todo o state de leads, kanban, filtros, sort, MissionsBanner, KanbanBoard, lost leads
- Usa CrmNavbar com `currentModule="pipeline"`
- Layout full-height (h-screen) sem scroll — prioridade mobile: kanban ocupa tela toda
- Mobile: navbar mínima (hamburger + logo), sem barra de filtros visível por padrão (filtros dentro de popover/sheet)

**3. Simplificar `src/pages/admin/Proposals.tsx`**
- Remove kanban, leads state, viewMode toggle, filtros de lead
- Mantém: lista de propostas (tabs rascunhos/enviadas), form, handleSave/Delete/StatusChange
- Usa CrmNavbar com `currentModule="propostas"`

**4. Atualizar `src/pages/admin/Dashboard.tsx`**
- Substituir header custom por CrmNavbar com `currentModule="dashboard"`

**5. Atualizar `src/pages/admin/StrategicDashboard.tsx`**
- Substituir header custom por CrmNavbar com `currentModule="painel"`

**6. Atualizar `src/App.tsx`**
- Adicionar rota `/admin/pipeline` (ProtectedRoute)
- Manter `/admin/propostas` apontando para Proposals simplificado

### Mobile — Kanban prioritário

- Navbar compacta: h-12, hamburger à esquerda, logo centralizado, notificação + avatar à direita
- Sheet do hamburger: links dos 4 módulos + Perfil + Sair
- Pipeline mobile: barra de filtros/sort colapsa em um único botão (popover)
- Conteúdo do kanban usa `calc(100vh - 48px)` para maximizar espaço

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/components/admin/CrmNavbar.tsx` | Criar |
| `src/pages/admin/Pipeline.tsx` | Criar (extrair de Proposals) |
| `src/pages/admin/Proposals.tsx` | Simplificar |
| `src/pages/admin/Dashboard.tsx` | Trocar header |
| `src/pages/admin/StrategicDashboard.tsx` | Trocar header |
| `src/App.tsx` | Nova rota `/admin/pipeline` |

