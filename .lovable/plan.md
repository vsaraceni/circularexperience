
# Estrategia 3: Animacao pulsante + texto temporario na barra de controle

## O que sera feito

Ao entrar no modo apresentacao, a barra de controle tera:
1. **Animacao pulsante** nos botoes de seta (esquerda/direita) durante os primeiros 4 segundos
2. **Texto temporario** "Navegue pelos slides" exibido acima da barra, que desaparece com fade-out apos 4 segundos
3. **Icones de tecla** (`←` `→`) ao lado do texto para reforcar a navegacao por teclado

## Mudancas tecnicas

### `src/components/presentation/PresentationControls.tsx`
- Adicionar estado `showHint` (inicia `true`, vira `false` apos 4s via `useEffect`)
- Quando `showHint` estiver ativo:
  - Botoes de seta recebem classe `animate-pulse` do Tailwind
  - Um elemento acima da barra exibe: "Navegue pelos slides  ← →" com `transition-opacity` para fade-out suave
- Apos 4 segundos, remover a animacao e o texto

### Comportamento
- O hint aparece apenas na primeira exibicao (ao montar o componente)
- Nao reaparece ao mover o mouse ou trocar de slide
- A barra continua funcionando normalmente apos o hint sumir
