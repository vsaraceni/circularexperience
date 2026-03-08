

## Redesign do Layout da Proposta

Redesign completo do slide de proposta seguindo o spec do arquivo anexo, aplicado em **3 arquivos**: `ProposalSlide.tsx` (print/PDF 1920x1080), `ProposalView.tsx` (web responsivo) e `PrintablePresentation.tsx` (ajustes de container).

### Design novo

```text
┌─────────────────────────────────────────────────────────┐
│  fundo #e0dbd8                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ container branco, rounded-[22px], shadow            ││
│  │ ┌──────────┐ ════ barra gradiente teal→goiaba→âmbar ││
│  │ │ sidebar  │ badge CIRCULAR EXPERIENCE              ││
│  │ │ #5F2558  │ título roxo + empresa teal             ││
│  │ │ rounded  │ ┌────────┬────────┐                    ││
│  │ │ m-[12px] │ │Empresa │Contato │ cards com borda-L  ││
│  │ │          │ │ teal   │goiaba  │                    ││
│  │ │ logo     │ ├────────┼────────┤                    ││
│  │ │ label    │ │Data    │Valid.  │                    ││
│  │ │ invest.  │ │âmbar   │verde   │                    ││
│  │ │ QR code  │ └────────┴────────┘                    ││
│  │ │          │ Escopo (teal)  │ Considerações (goiaba)││
│  │ │ circles  │ ──────────────────────────────────────-││
│  │ │ decorat. │ footer: agradecimento │ assinatura     ││
│  │ └──────────┘                                        ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Mudanças principais

**`ProposalSlide.tsx`** (reescrita completa):
- Fundo `#e0dbd8` no wrapper externo
- Container central branco `rounded-[22px]` com sombra
- Sidebar `196px` com `#5F2558`, `rounded-[18px]`, `margin: 12px` (flutua dentro do container)
- Dois círculos decorativos absolutos (branco 5% e teal 10%)
- Sidebar: logo → label "PROPOSTA COMERCIAL" (Raleway 900, 7.5px, tracking 3px, branco 38%) → divider → investimento em `#F4A736` (Raleway 900, 20px) → QR code
- Barra de acento no topo: 3px gradiente `#2FB2C0 → #EB626D → #F4A736`
- Badge `#F1F4C5` com ponto teal + "CIRCULAR EXPERIENCE"
- Título Raleway 900, 25px, roxo `#5F2558`, empresa em teal `#2FB2C0`
- MetaCards: fundo `#F0ECEA`, `rounded-[11px]`, `border-left 3px` colorida (Empresa=teal, Contato=goiaba `#EB626D`, Data=âmbar `#F4A736`, Validade=`#a8b830`)
- Escopo e Considerações em **duas colunas** lado a lado, cada com acento colorido (teal / goiaba) e caixa `#F0ECEA`
- Footer: borda `#edebe9`, esquerda=agradecimento itálico, direita=assinatura + copyright

**`ProposalView.tsx`** (mesma evolução visual, versão responsiva):
- Mesmas cores, cards, badge, barra de acento
- Layout empilha em mobile, duas colunas em desktop
- Sidebar responsiva mantendo o padrão flutuante em desktop

**Ambos**: Fonte Raleway em todos os elementos, paleta de cores da marca (teal, goiaba, âmbar, roxo).

