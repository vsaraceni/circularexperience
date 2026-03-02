
# Ajustes: Autoplay nos thumbnails + Video fullBleed na apresentacao

## 1. Autoplay ao clicar nas thumbnails

No `Video.tsx`, adicionar `?autoplay=1` na URL do iframe quando o usuario clica em uma thumbnail. Isso faz o YouTube iniciar a reproducao automaticamente.

**Arquivo:** `src/components/landing/Video.tsx`
- Alterar a URL do iframe de `https://www.youtube.com/embed/${activeVideo}` para `https://www.youtube.com/embed/${activeVideo}?autoplay=1`
- Tambem precisa adicionar `autoplay` na lista de `allow` do iframe para que o navegador permita o autoplay

## 2. Video com fundo roxo ocupando toda a tela no modo apresentacao

Atualmente o slide de Video usa o layout padrao do `SlideWrapper`, que renderiza o conteudo dentro de um box com `bg-background rounded-lg shadow-2xl` -- isso cria o "box centralizado" que o usuario ve. A solucao e marcar o slide de Video como `fullBleed: true`, igual ao Hero.

**Arquivo:** `src/components/presentation/PresentationMode.tsx`
- Alterar a linha do slide Video de `{ component: Video, label: "Video" }` para `{ component: Video, label: "Video", fullBleed: true }`

Isso faz o componente Video ocupar 100% do espaco de 1920x1080, e como o Video ja tem a classe `gradient-hero` (fundo roxo), ele preenchera toda a area.

## Resumo das alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `Video.tsx` | Adicionar `?autoplay=1` na URL do embed e `autoplay` no `allow` |
| `PresentationMode.tsx` | Adicionar `fullBleed: true` ao slide de Video |
