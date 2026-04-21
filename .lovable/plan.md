

## Remover visualização online da proposta + QR code do slide

### Mudanças

**1. Rota pública `/proposta/:slug` — remover**

- `src/App.tsx`: remover rota `/proposta/:slug` de `CrmRoutes` e `SiteRoutes`.
- `src/pages/ProposalView.tsx`: arquivo deixa de ser usado (pode ser deletado para limpeza).
- Acessos diretos à URL caem em `NotFound` (site) ou redirecionam para `/admin/pipeline` (CRM).

**2. Slide da proposta comercial — remover QR code**

`src/components/presentation/slides/ProposalSlide.tsx`:
- Remover bloco do QR code na sidebar (import `qrcode.react`, `proposalUrl`, `<QRCodeSVG>` e legenda "Acesse esta proposta online").
- Reorganizar sidebar: Logo no topo, Investimento no centro, divisor decorativo no rodapé (substituindo o espaço do QR).
- Remover import `QRCodeSVG`.

**3. Limpeza de referências**

Buscar e ajustar qualquer link/menção a `/proposta/${slug}`:
- `ProposalList`, `LeadDrawer`, `BulkEmailDialog`, templates de email, etc.
- Onde houver botão "Ver online" → remover.
- Onde houver link em emails → trocar por anexo PDF (já é o fluxo atual) ou remover menção.

**4. Slug da proposta**

A coluna `slug` em `proposals` continua existindo (usada internamente por `/apresentacao-print/:slug` para o Browserless renderizar o slide ao gerar o PDF). **Não remover do schema.**

### Arquivos impactados

| Arquivo | Mudança |
|---|---|
| `src/App.tsx` | Remover rotas `/proposta/:slug` (CRM e Site) |
| `src/pages/ProposalView.tsx` | Deletar arquivo |
| `src/components/presentation/slides/ProposalSlide.tsx` | Remover QR code, reorganizar sidebar |
| `src/components/admin/ProposalList.tsx` | Remover botão/link "Ver online" se houver |
| `src/components/admin/LeadDrawer.tsx` | Idem |
| `src/components/admin/BulkEmailDialog.tsx` / templates | Remover link público de emails se houver |
| `package.json` | `qrcode.react` pode ser removido das deps (opcional) |

### O que NÃO muda

- Geração de PDF (`generate-pdf` + `PrintablePresentation` com slide-only) — intacta.
- Schema de `proposals` (slug permanece, é interno).
- `ProposalSlide` continua sendo o último slide do PDF, só sem QR.

### Princípios

- **Aditivo na remoção**: arquivos legados podem ficar até a próxima limpeza; rotas removidas garantem que nada é exposto.
- **PDF intocado**: única saída de proposta passa a ser o PDF anexo enviado por email.

