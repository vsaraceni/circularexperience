
# Auto-avanco de videos no carrossel

## Problema
Atualmente, quando um video termina, nada acontece. O usuario precisa clicar manualmente na proxima thumbnail.

## Solucao
Usar a YouTube IFrame Player API para detectar o fim de cada video e avancar automaticamente para o proximo.

### Mudancas em `src/components/landing/Video.tsx`

1. **Carregar a YouTube IFrame API** via script tag dinamico no `useEffect`
2. **Substituir o iframe manual por `YT.Player`** - criar o player programaticamente para ter acesso aos eventos
3. **Escutar o evento `onStateChange`** - quando o estado for `YT.PlayerState.ENDED` (0), avancar para o proximo video na lista
4. **Logica de avanco circular** - ao terminar o ultimo video (5o), parar (nao volta ao primeiro)
5. **Manter todas as funcionalidades existentes** - autoplay por visibilidade, start=3 no primeiro video, selecao manual por thumbnails

### Detalhes tecnicos

- Carregar `https://www.youtube.com/iframe_api` como script externo
- Usar `window.YT` e `window.onYouTubeIframeAPIReady` para inicializar
- Criar o player com `new YT.Player(elementId, { events: { onStateChange } })`
- Passar `playerVars: { autoplay, start }` conforme logica atual
- Usar `useRef` para manter referencia ao player e destrui-lo/recria-lo ao trocar de video
- Adicionar tipagem para `window.YT` via declaracao global

### Comportamento esperado
- Video 1 termina -> Video 2 inicia automaticamente
- Video 2 termina -> Video 3 inicia automaticamente
- ...ate o Video 5, que ao terminar simplesmente para
- Selecao manual por thumbnail continua funcionando normalmente
