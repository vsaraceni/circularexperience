

# Centralizar conteudo das secoes nos slides

## Problema
No modo apresentacao, o conteudo de cada secao e renderizado a partir do topo do slide (1920x1080). Secoes que tem padding superior ou que sao mais altas que o slide ficam cortadas no topo. O conteudo precisa ser centralizado verticalmente dentro de cada slide.

## Solucao

### Arquivo: `src/components/presentation/SlideWrapper.tsx`

Alterar o container interno (linha 46) que envolve o `{children}` para centralizar o conteudo vertical e horizontalmente:

- Trocar `<div className="w-full h-full overflow-hidden">` por `<div className="w-full h-full overflow-hidden flex items-center justify-center">`

Isso faz com que o conteudo de cada secao (que normalmente ocupa menos que 1080px de altura) fique centralizado no meio do slide, em vez de comecar pelo topo e ser cortado.

### Resultado esperado
- Todas as secoes (SocialProof, Stats, About, etc.) ficam centralizadas vertical e horizontalmente no slide
- Nenhum conteudo e cortado no topo
- O layout normal da landing page (modo scroll) nao e afetado, pois a mudanca esta apenas no wrapper do modo apresentacao

