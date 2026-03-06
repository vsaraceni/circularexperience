

# Corrigir slides quebrados, vídeo em branco e redesenhar Proposta (Versão C)

## Resumo

Criar componentes print-specific para os slides problemáticos, usar o logo branco enviado pelo usuário em fundos escuros, adotar Raleway (já importada) como tipografia principal nos slides de proposta (sem ícones Lucide), e implementar o layout Versão C "Structured" no ProposalSlide.

## 1. Copiar logo branco para o projeto

Copiar `user-uploads://Movimento-Circular_logotipo_vertical_1.png` para `src/assets/movimento-circular-logo-white.png`. Este logo branco com fundo transparente será usado diretamente (sem filtros CSS) em slides com fundo escuro, substituindo o hack `brightness-0 invert`.

## 2. Criar `ExpertsPrint.tsx`

Componente compacto para o PDF:
- `grid-cols-3` fixo (sem breakpoints responsivos)
- Imagens com `h-44` em vez de `h-64`
- Remover hover, animações, badges de credibilidade e nota de rodapé
- Sem ícones Lucide nas credenciais — usar bullets simples ou tipografia Raleway
- Garantir que tudo cabe em 1080px de altura

## 3. Criar `MethodologyStepsPrint.tsx`

Componente compacto:
- `grid-cols-3` fixo
- Sem ícones Lucide — usar apenas o número do passo com tipografia Raleway bold
- Reduzir padding/margins para caber em 1080px
- Remover linha decorativa horizontal (absoluta)

## 4. Criar `VideoPrint.tsx`

Substituir iframe YouTube por:
- Thumbnail estática do vídeo principal (`https://img.youtube.com/vi/NgEwR9eBoJI/maxresdefault.jpg`) como imagem de fundo cobrindo o slide
- Overlay escuro com título "Conheça o Circular Experience" em Raleway
- Ícone de play via CSS (triângulo puro CSS, sem Lucide)
- Link clicável para `https://www.youtube.com/watch?v=NgEwR9eBoJI&t=3`
- Manter os stats (4h, 7 R's, 100%) abaixo

## 5. Redesenhar `ProposalSlide.tsx` — Versão C "Structured"

Layout `flex` horizontal em 1920×1080:

**Sidebar esquerda (~420px)**:
- Fundo `gradient-primary`
- Logo branco (novo asset) no topo, proporcional (~h-16)
- Separador `white/20`
- Bloco "Investimento" em card `white/10`, valor em Raleway 700 text-4xl
- Separador
- QR Code em fundo branco arredondado, 120px
- Label "Acesse esta proposta online" em Raleway 400 text-xs
- Label "Proposta Comercial" no rodapé da sidebar em Raleway 300 uppercase tracking-widest

**Área principal (~1500px)**:
- Fundo branco `#FAFAFA`
- Título da proposta em Raleway 700 text-3xl `text-gray-900`, com `border-b-2 border-primary/30`
- Grid 2×2 para dados (Empresa, Contato, Data, Validade):
  - **Sem ícones** — usar label em Raleway 600 text-xs uppercase tracking-wide `text-gray-400` + valor em Raleway 600 text-lg `text-gray-800`
  - Cards `bg-gray-50 rounded-xl p-5 border border-gray-100`
- Seção "Escopo": header em Raleway 700 text-sm uppercase `text-primary`, texto em Raleway 400 text-base `text-gray-700` com `line-clamp-6`
- Seção "Considerações": mesmo estilo, `line-clamp-4`
- Rodapé discreto: "Movimento Circular © 2026" em Raleway 400 text-xs `text-gray-400`

## 6. Atualizar `PrintablePresentation.tsx`

- Importar `ExpertsPrint`, `MethodologyStepsPrint`, `VideoPrint` em vez dos componentes da landing
- Substituir no array `fixedSlides`
- Manter CTA já removido

## 7. Adicionar font Raleway com pesos completos

Atualizar o import do Google Fonts em `index.css` para incluir os pesos necessários:
```
Raleway:wght@300;400;500;600;700;800
```
(atualmente importa apenas o peso default)

## Arquivos impactados

| Arquivo | Ação |
|---------|------|
| `src/assets/movimento-circular-logo-white.png` | Copiar do upload |
| `src/components/presentation/slides/ExpertsPrint.tsx` | Criar |
| `src/components/presentation/slides/MethodologyStepsPrint.tsx` | Criar |
| `src/components/presentation/slides/VideoPrint.tsx` | Criar |
| `src/components/presentation/slides/ProposalSlide.tsx` | Redesign Versão C |
| `src/pages/PrintablePresentation.tsx` | Usar componentes print-specific |
| `src/index.css` | Atualizar import Raleway com pesos |

