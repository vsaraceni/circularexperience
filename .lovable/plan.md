

# Carrossel de vídeos com thumbnails

## Resumo
Transformar a seção Video para exibir 5 vídeos do YouTube: o vídeo principal atual + os 4 shorts fornecidos. Layout com player principal grande e fila de thumbnails clicáveis abaixo.

## Vídeos

| # | ID do YouTube | Tipo |
|---|---------------|------|
| 1 | NgEwR9eBoJI | Video (atual) |
| 2 | HgdvD6Zf3TI | Short |
| 3 | kvQPcB1Tkt4 | Short |
| 4 | Z2QT5dYmxiU | Short |
| 5 | xx1et3NmK7c | Short |

## Nota sobre Shorts
Os 4 links sao YouTube Shorts (formato vertical 9:16). No player principal, serao embedados via `youtube.com/embed/{id}` que funciona tanto para videos normais quanto shorts. O aspect ratio do player principal sera mantido em 16:9 (o short aparecera com barras laterais pretas, que e o comportamento padrao).

## Alteracoes

### `src/components/landing/Video.tsx`
- Adicionar array de videos com `id` e `title`
- Adicionar estado `useState` para o video ativo (default: primeiro video)
- Player principal: iframe com o ID do video ativo
- Abaixo do player: fila horizontal de thumbnails usando `img.youtube.com/vi/{id}/mqdefault.jpg`
- Thumbnail ativa: borda com cor de destaque (ring-2 ring-white ou similar)
- Thumbnails inativas: opacidade reduzida (opacity-60) com hover (opacity-100)
- No mobile: thumbnails com scroll horizontal (`overflow-x-auto`, `flex-nowrap`)
- Titulo do video abaixo de cada thumbnail
- Stats (4h, 7 R's, 100%) permanecem no final

### Detalhes tecnicos
- Importar `useState` do React
- Array de videos definido como constante fora do componente
- Thumbnails renderizadas com `map()` sobre o array
- Clique na thumbnail atualiza o estado e troca o iframe `src`
- Transicao suave com `transition-all duration-300` nas thumbnails

