
# Opcao 1: "Zoom-In + Drop" com cor laranja/accent

## O que sera feito

Ao entrar no modo apresentacao, a barra de controle aparece grande e centralizada na tela, com borda e glow na cor accent (laranja/dourado `hsl(35-45, 100%, 50%)`), pausa brevemente para o usuario ler as instrucoes, e entao anima suavemente para sua posicao final no rodape.

## Sequencia da animacao

1. **Fase 1 (0s - 1.5s)**: Barra aparece no centro da tela com `scale(1.5)`, borda laranja vibrante e glow laranja pulsante. Texto "Navegue pelos slides" + teclas visivel.
2. **Fase 2 (1.5s - 2.3s)**: Barra transiciona suavemente para `scale(1)` e desloca para a posicao final (`bottom: 24px`).
3. **Fase 3 (2.3s - 5s)**: Hint de texto faz fade-out. Barra fica na posicao normal sem efeitos extras.

## Mudancas tecnicas

### `tailwind.config.ts`
- Adicionar keyframe `controls-drop-in` com 3 etapas: comeca centralizado e grande, pausa, desce e encolhe para posicao final
- Adicionar keyframe `glow-accent` para o brilho laranja pulsante durante a fase inicial
- Registrar as animacoes correspondentes

### `src/components/presentation/PresentationControls.tsx`
- Substituir logica atual de `showHint` por estado `animationPhase` com 3 fases (`intro`, `settling`, `idle`)
- Na fase `intro`: container posicionado no centro com scale grande, borda `accent` e sombra glow laranja
- Na fase `settling`: transicao CSS para posicao final
- Na fase `idle`: comportamento normal (auto-hide com mouse)
- Usar `useEffect` com timers encadeados para controlar as fases
- Aplicar cor accent (`hsl(45 100% 50%)` / `hsl(35 100% 50%)`) na borda e box-shadow durante as fases iniciais

### Cores utilizadas
- Borda: `border-accent` (laranja/dourado da pagina)
- Glow: `box-shadow` com `hsl(35 100% 50% / 0.5)` e `hsl(45 100% 50% / 0.3)`
- Essas sao as mesmas cores do `gradient-accent` ja definido no design system

### Comportamento
- A animacao ocorre apenas uma vez ao montar o componente
- Apos a fase idle, a barra funciona normalmente (aparece/desaparece com movimento do mouse)
- Navegacao por teclado e botoes continua funcionando durante toda a animacao
