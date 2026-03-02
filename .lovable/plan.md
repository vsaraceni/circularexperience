

# Modo Apresentacao Fullscreen

## Resumo
Adicionar um botao "Apresentar" no Header que abre a pagina em modo de slides fullscreen, usando a Fullscreen API do navegador. Cada secao da landing page se torna um slide individual, navegavel por setas do teclado ou botoes na tela. A landing page continua funcionando normalmente no modo scroll.

## Mapeamento de Slides (10 slides)

```text
Slide 1:  Hero (capa)
Slide 2:  SocialProof (prova social)
Slide 3:  Stats (oportunidade historica)
Slide 4:  About (o que e o Circular Experience + 7 R's)
Slide 5:  Methodology (3 etapas)
Slide 6:  Agenda (timeline da oficina)
Slide 7:  Video (video YouTube)
Slide 8:  Experts (coordenadores tecnicos)
Slide 9:  SDGs (ODS)
Slide 10: CTA (contato)
```

## Arquitetura

### Novo componente: `src/components/presentation/PresentationMode.tsx`
- Componente overlay fullscreen com fundo escuro
- Renderiza cada secao da landing como um "slide" individual
- Usa a Fullscreen API (`document.documentElement.requestFullscreen()`)
- Controla o slide atual via estado interno
- Escala o conteudo para caber na viewport usando `transform: scale()` com base fixa 1920x1080

### Novo componente: `src/components/presentation/SlideWrapper.tsx`
- Container que recebe cada secao existente e a renderiza em formato de slide
- Aplica fundo branco, centraliza conteudo, e garante que o overflow seja oculto
- Escala o conteudo proporcionalmente ao viewport

### Novo componente: `src/components/presentation/PresentationControls.tsx`
- Barra de navegacao que aparece no hover (parte inferior da tela)
- Botoes: anterior, proximo, numero do slide atual, botao de sair
- Esconde automaticamente apos 3 segundos de inatividade do mouse

### Alteracao: `src/components/landing/Header.tsx`
- Adicionar botao "Apresentar" (icone de tela cheia) ao lado do botao "Solicitar Proposta"
- Ao clicar, ativa o componente `PresentationMode`

### Alteracao: `src/pages/Index.tsx`
- Importar `PresentationMode`
- Controlar estado `isPresentationMode` via useState
- Passar callback para Header para ativar/desativar o modo

## Navegacao
- Setas esquerda/direita do teclado
- Teclas Space (proximo) e Backspace (anterior)
- Escape para sair do modo fullscreen
- Clique nos botoes de navegacao na tela
- Evento `fullscreenchange` para limpar estado ao sair

## Estilo
- Fundo preto entre slides
- Cada slide renderizado com `overflow: hidden` e `border-radius` sutil
- Transicao suave entre slides (fade ou slide horizontal)
- Cursor escondido apos 3s de inatividade
- Controles semi-transparentes que aparecem no hover

## Arquivos afetados
- Novo: `src/components/presentation/PresentationMode.tsx`
- Novo: `src/components/presentation/SlideWrapper.tsx`
- Novo: `src/components/presentation/PresentationControls.tsx`
- Editado: `src/components/landing/Header.tsx` (botao "Apresentar")
- Editado: `src/pages/Index.tsx` (estado + overlay)
