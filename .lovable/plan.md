

# Corrigir seções altas no modo apresentação (Metodologia e Agenda)

## Problema
As seções "Nossa Metodologia" e "Agenda" possuem conteúdo mais alto que os 1080px do slide, causando corte no modo apresentação.

## Solução proposta: abordagem mista

### 1. Metodologia -- Dividir em 2 slides
A seção Metodologia tem duas partes distintas (3 etapas + "O que seu time vai aprender"). Faz sentido dividir em dois slides:
- **Slide 5a**: Título + 3 etapas da metodologia (sem o bloco "O que seu time vai aprender")
- **Slide 5b**: Bloco "O que seu time vai aprender" (os 6 benefícios)

Para isso, criar dois componentes auxiliares:
- `MethodologySteps` -- renderiza apenas o título e as 3 etapas
- `MethodologyBenefits` -- renderiza apenas o bloco de benefícios

Esses componentes extraem partes do `Methodology.tsx` existente sem alterar a seção original da landing page.

### 2. Agenda -- Adicionar scroll interno no slide
A Agenda é uma lista contínua (timeline) que não se divide bem. A melhor abordagem é permitir scroll vertical dentro do slide:
- Envolver o conteúdo da Agenda em um `ScrollArea` (Radix) dentro do `SlideWrapper`
- Ou: criar um wrapper condicional no `PresentationMode` que adiciona scroll apenas para slides que precisam

A abordagem mais limpa: no `SlideWrapper`, trocar `overflow-hidden` por `overflow-y-auto` com scrollbar estilizada, para que slides altos possam rolar naturalmente.

### 3. Implementação

**Arquivo: `src/components/presentation/slides/MethodologySteps.tsx`** (novo)
- Componente que renderiza apenas título + 3 etapas da Metodologia
- Reutiliza os dados e estilos de `Methodology.tsx`

**Arquivo: `src/components/presentation/slides/MethodologyBenefits.tsx`** (novo)
- Componente que renderiza apenas o bloco "O que seu time vai aprender"

**Arquivo: `src/components/presentation/SlideWrapper.tsx`**
- Trocar `overflow-hidden` por `overflow-y-auto` no container interno do slide, para permitir scroll quando o conteúdo ultrapassa 1080px
- Adicionar estilos de scrollbar sutis (thin, semi-transparente)

**Arquivo: `src/components/presentation/PresentationMode.tsx`**
- Substituir o slide de `Methodology` por dois slides: `MethodologySteps` e `MethodologyBenefits`
- Total de slides passa de 10 para 11

## Resultado esperado
- Metodologia dividida em 2 slides limpos, sem corte
- Agenda com scroll suave dentro do slide, permitindo ver todo o conteúdo
- Landing page original inalterada
