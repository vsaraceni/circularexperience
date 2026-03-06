

# Corrigir slides problemáticos na versão PDF

## Problema
O slide **About** (image-18) usa o componente da landing page com classes responsivas, botões interativos ("Solicitar Proposta") e o bloco "A quem se destina?" — tudo isso não cabe/faz sentido nos 1920x1080 do PDF. O conteúdo transborda e o layout fica desalinhado.

O slide **Agenda** também pode ter sido afetado pelo aumento recente das fontes e padding.

## Mudanças

### 1. Criar `AboutPrint.tsx` (versão print do About)
Componente com inline styles (como os outros `*Print.tsx`) otimizado para 1920x1080:
- Layout em 2 colunas: texto à esquerda (objetivo + descrição) e 7 R's à direita (círculo com posicionamento absoluto fixo em pixels)
- Remover botões ("Solicitar Proposta", "Fale com Nossa Equipe")
- Remover bloco "A quem se destina?" (não relevante para PDF comercial)
- Fontes e espaçamentos fixos em pixels

### 2. Criar `AgendaPrint.tsx` (versão print da Agenda)
Componente com inline styles para garantir que os cards com fontes maiores caibam no slide:
- Timeline vertical centralizada com 5 items
- Cards com padding e fontes fixas em pixels
- Layout alternado esquerda/direita como na landing

### 3. Atualizar `PrintablePresentation.tsx`
- Substituir `About` por `AboutPrint`
- Substituir `Agenda` por `AgendaPrint`

## Arquivos impactados

| Arquivo | Ação |
|---------|------|
| `src/components/presentation/slides/AboutPrint.tsx` | Criar |
| `src/components/presentation/slides/AgendaPrint.tsx` | Criar |
| `src/pages/PrintablePresentation.tsx` | Trocar 2 imports |

